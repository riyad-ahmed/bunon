import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { findBackupFile, LATEST_BACKUP } from './sync.js'

const BACKUP = JSON.stringify({ format: 'business-manager-backup', version: 1, data: {} })

function file(path, content, date) {
  writeFileSync(path, content)
  utimesSync(path, new Date(date), new Date(date))
  return path
}

test('finds the newest backup across several backup folders', () => {
  const root = mkdtempSync(join(tmpdir(), 'bunon-sync-'))
  try {
    const data = join(root, 'data')
    const backups = join(root, 'backup')
    mkdirSync(data)
    mkdirSync(join(backups, 'daily-backups'), { recursive: true })

    const imported = file(join(data, 'BUNON-import.json'), BACKUP, '2026-11-21T20:00:00Z')
    file(join(data, 'notes.json'), '{"not":"a backup"}', '2026-11-28T00:00:00Z')
    file(join(backups, 'daily-backups', 'business-backup_2026-11-26.json'), BACKUP, '2026-11-26T15:31:00Z')
    const latest = file(join(backups, LATEST_BACKUP), BACKUP, '2026-11-26T15:31:45Z')

    assert.equal(findBackupFile([backups, data]), latest)
    assert.equal(findBackupFile([data, backups]), latest, 'order of the folders does not matter')
    assert.equal(findBackupFile([join(root, 'missing'), data]), imported, 'skips missing folders and non-backups')
    assert.equal(findBackupFile(data), imported)
    assert.equal(findBackupFile([join(root, 'missing')]), null)
    assert.equal(findBackupFile([]), null)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
