/**
 * Puts the dashboard's products on the live website, by itself.
 *
 * A short while after the last change (20 seconds by default) it:
 *   1. removes photos no product uses any more,
 *   2. saves products.json and the photos in git ("Update products"),
 *   3. pushes to GitHub, which rebuilds the website in a minute or two.
 * Only product files are ever included. If the push fails (no internet, …)
 * it tries again every minute while the dashboard is open, and on the next
 * start-up.
 */
import { execFile } from 'node:child_process'
import { existsSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { DATA_FILE, PHOTO_DIR } from './store.js'

/** Photos uploaded in the last few minutes may not be attached to their product yet. */
const KEEP_NEW_PHOTOS_MS = 10 * 60 * 1000

const isProductPath = (path) => path === DATA_FILE || path.startsWith(`${PHOTO_DIR}/`)
const lines = (output) => output.split('\n').map((line) => line.trim()).filter(Boolean)

function git(root, args, timeout = 60_000) {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      { cwd: root, timeout, windowsHide: true, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
      (error, stdout, stderr) => {
        if (error) {
          error.detail = `${stderr || ''}${stdout || ''}`.trim() || error.message
          reject(error)
        } else resolve(stdout.trim())
      },
    )
  })
}

/** Runs one git command per batch of paths (Windows limits command length). */
async function gitPaths(root, args, paths) {
  for (let i = 0; i < paths.length; i += 100) await git(root, [...args, '--', ...paths.slice(i, i + 100)])
}

/** "https://github.com/owner/repo.git" → "https://owner.github.io/repo/" */
export function liveUrlFrom(remote) {
  const match = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?\/?$/i.exec(String(remote ?? '').trim())
  return match ? `https://${match[1].toLowerCase()}.github.io/${match[2]}/` : null
}

/** Why a publish failed, in a few words the dashboard can explain. */
export function reasonFor(error) {
  const detail = String(error?.detail ?? error?.message ?? '')
  if (error?.code === 'OTHER_STAGED') return 'other-staged'
  if (/could not resolve host|unable to access|failed to connect|timed out|network|connection/i.test(detail)) return 'offline'
  if (/authentication|permission denied|403|401|could not read username|logon failed/i.test(detail)) return 'login'
  if (/rejected|non-fast-forward|fetch first/i.test(detail)) return 'rejected'
  if (error?.killed) return 'offline'
  return 'unknown'
}

/** True when there are product changes GitHub doesn't have yet. */
export async function hasPending(root) {
  const changed = await git(root, ['status', '--porcelain', '--', DATA_FILE, PHOTO_DIR])
  const ahead = await git(root, ['rev-list', '--count', '@{upstream}..HEAD']).catch(() => '0')
  return Boolean(changed) || Number(ahead) > 0
}

/** One publish: tidy photos, commit product files, push. */
export async function publish(root, store) {
  const used = store.usedPhotos()

  // 1. Photos nobody uses (and that aren't brand new) are deleted
  for (const file of store.photoFiles()) {
    const path = join(root, PHOTO_DIR, file)
    if (!used.has(file) && Date.now() - statSync(path).mtimeMs > KEEP_NEW_PHOTOS_MS) unlinkSync(path)
  }

  // 2. Never sweep other work into a product update
  const staged = lines(await git(root, ['diff', '--cached', '--name-only']))
  const other = staged.filter((path) => !isProductPath(path))
  if (other.length) {
    const error = new Error(`Other changes are staged in git: ${other.slice(0, 3).join(', ')}`)
    error.code = 'OTHER_STAGED'
    throw error
  }

  await git(root, ['add', '--', DATA_FILE])
  const usedPaths = [...used].map((file) => `${PHOTO_DIR}/${file}`).filter((path) => existsSync(join(root, path)))
  await gitPaths(root, ['add'], usedPaths)
  const tracked = lines(await git(root, ['ls-files', '--', PHOTO_DIR]))
  const unused = tracked.filter((path) => !used.has(path.slice(PHOTO_DIR.length + 1)))
  await gitPaths(root, ['rm', '--cached', '--quiet', '--ignore-unmatch'], unused)

  let committed = false
  if (lines(await git(root, ['diff', '--cached', '--name-only'])).length) {
    await git(root, ['commit', '--quiet', '-m', 'Update products'])
    committed = true
  }

  // 3. Send everything GitHub doesn't have yet
  const ahead = Number(await git(root, ['rev-list', '--count', '@{upstream}..HEAD']))
  if (ahead > 0) await git(root, ['push', '--quiet'], 180_000)
  return { committed, pushed: ahead > 0 }
}

/**
 * Publishes `delayMs` after the last change; one publish at a time.
 * status(): { state: 'idle' | 'scheduled' | 'publishing' | 'published' | 'error',
 *             publishAt, publishedAt, reason, liveUrl }
 */
export function createPublisher({ root, store, delayMs = 20_000, retryMs = 60_000, log = () => {} }) {
  let status = { state: 'idle', publishAt: null, publishedAt: null, reason: null, liveUrl: null }
  let timer = null
  let dueAt = null
  let running = null
  let again = false

  git(root, ['remote', 'get-url', 'origin'])
    .then((remote) => (status.liveUrl = liveUrlFrom(remote)))
    .catch(() => {})

  function setTimer(ms) {
    clearTimeout(timer)
    dueAt = Date.now() + ms
    timer = setTimeout(() => {
      timer = null
      dueAt = null
      void publishNow()
    }, ms)
  }

  function schedule(ms = delayMs) {
    setTimer(ms)
    if (!running) status = { ...status, state: 'scheduled', publishAt: dueAt, reason: null }
  }

  function publishNow() {
    clearTimeout(timer)
    timer = null
    dueAt = null
    if (running) {
      again = true
      return running
    }
    status = { ...status, state: 'publishing', publishAt: null, reason: null }
    running = publish(root, store)
      .then(({ pushed }) => {
        status = pushed ? { ...status, state: 'published', publishedAt: Date.now() } : { ...status, state: 'idle' }
        if (pushed) log('Products published — the website updates in 1–2 minutes.')
      })
      .catch((error) => {
        const reason = reasonFor(error)
        log(`Could not publish products (${reason}): ${String(error.detail ?? error.message).split('\n').slice(-2).join(' ')}`)
        if (!timer) setTimer(retryMs) // try again later (sooner if another change comes in)
        status = { ...status, state: 'error', reason, publishAt: dueAt }
      })
      .finally(() => {
        running = null
        if (again) {
          again = false
          void publishNow()
        } else if (timer && status.state !== 'error') {
          status = { ...status, state: 'scheduled', publishAt: dueAt }
        }
      })
    return running
  }

  return {
    schedule,
    publishNow,
    /** On start-up: publish anything left over from last time. */
    async publishLeftovers() {
      if (await hasPending(root).catch(() => false)) schedule(5_000)
    },
    status: () => ({ ...status, now: Date.now() }),
  }
}
