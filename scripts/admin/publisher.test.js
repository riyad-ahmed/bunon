import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { hasPending, liveUrlFrom, publish, reasonFor } from './publisher.js'
import { createStore, DATA_FILE, PHOTO_DIR } from './store.js'

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
const jpeg = (seed) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from(`photo ${seed}`)])
const hourAgo = new Date(Date.now() - 60 * 60 * 1000)

/** A project with a GitHub stand-in: a bare repository on disk. */
function project() {
  const base = mkdtempSync(join(tmpdir(), 'bunon-publish-'))
  const remote = join(base, 'remote.git')
  const root = join(base, 'site')
  git(base, 'init', '--quiet', '--bare', '--initial-branch=main', remote)
  mkdirSync(root)
  git(root, 'init', '--quiet', '--initial-branch=main')
  git(root, 'config', 'user.name', 'Test')
  git(root, 'config', 'user.email', 'test@example.invalid')
  git(root, 'config', 'commit.gpgsign', 'false')
  writeFileSync(join(root, 'README.md'), 'site\n')
  git(root, 'add', '.')
  git(root, 'commit', '--quiet', '-m', 'Start')
  git(root, 'remote', 'add', 'origin', remote)
  git(root, 'push', '--quiet', '-u', 'origin', 'main')
  return { base, root, remote }
}

test('publishes product files only, without photos nobody uses', async () => {
  const { base, root, remote } = project()
  try {
    const store = createStore(root)
    const product = store.create()
    const kept = store.savePhoto(jpeg('kept'))
    const dropped = store.savePhoto(jpeg('dropped'))
    const fresh = store.savePhoto(jpeg('fresh')) // just uploaded, not attached yet
    utimesSync(join(root, PHOTO_DIR, dropped), hourAgo, hourAgo)
    store.update(product.id, { name: 'Classic Tee', photos: [{ file: kept }], quantity: 3 })
    writeFileSync(join(root, 'notes.txt'), 'not part of the products\n') // other work, untouched

    assert.equal(await hasPending(root), true)
    assert.deepEqual(await publish(root, store), { committed: true, pushed: true })

    const files = git(remote, 'ls-tree', '-r', '--name-only', 'main').split('\n')
    assert.ok(files.includes(DATA_FILE))
    assert.ok(files.includes(`${PHOTO_DIR}/${kept}`))
    assert.ok(!files.includes(`${PHOTO_DIR}/${fresh}`), 'an unattached new photo is not published')
    assert.ok(!files.some((f) => f.startsWith('private/')), 'stock counts are never published')
    assert.ok(!files.includes('notes.txt'))
    assert.equal(git(remote, 'log', '-1', '--format=%s', 'main'), 'Update products')
    assert.equal(existsSync(join(root, PHOTO_DIR, dropped)), false, 'an old unused photo is deleted')
    assert.equal(existsSync(join(root, PHOTO_DIR, fresh)), true, 'a new photo is kept for now')

    // Nothing new → nothing to do
    assert.deepEqual(await publish(root, store), { committed: false, pushed: false })

    // Removing a photo from the product removes it from the website too
    store.update(product.id, { photos: [] })
    utimesSync(join(root, PHOTO_DIR, kept), hourAgo, hourAgo)
    await publish(root, store)
    assert.ok(!git(remote, 'ls-tree', '-r', '--name-only', 'main').includes(kept))
    assert.equal(await hasPending(root), true, 'the fresh photo is still waiting to be used or tidied')
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})

test('refuses to sweep other staged work into a product update', async () => {
  const { base, root } = project()
  try {
    const store = createStore(root)
    store.create()
    writeFileSync(join(root, 'README.md'), 'changed\n')
    git(root, 'add', 'README.md')
    await assert.rejects(publish(root, store), (error) => reasonFor(error) === 'other-staged')
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})

test('works out the live address and explains failures', () => {
  assert.equal(liveUrlFrom('https://github.com/riyad-ahmed/bunon.git'), 'https://riyad-ahmed.github.io/bunon/')
  assert.equal(liveUrlFrom('git@github.com:Riyad-Ahmed/bunon.git'), 'https://riyad-ahmed.github.io/bunon/')
  assert.equal(liveUrlFrom('C:/somewhere/remote.git'), null)
  assert.equal(reasonFor({ detail: 'fatal: unable to access ... Could not resolve host: github.com' }), 'offline')
  assert.equal(reasonFor({ detail: 'remote: Permission to x denied. fatal: Authentication failed' }), 'login')
  assert.equal(reasonFor({ detail: '! [rejected] main -> main (fetch first)' }), 'rejected')
  assert.equal(reasonFor({ detail: 'something else' }), 'unknown')
})
