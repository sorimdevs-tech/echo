import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from contextlib import closing
from backup_store import create_backup, restore_backup


class BackupTests(unittest.TestCase):
    def test_restore_rejects_path_traversal(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root/'manifest.json').write_text(json.dumps({'version':1,'files':{'echo.db':'unused','../outside':'unused'}}))
            with self.assertRaises(ValueError): restore_backup(root, root/'restored')
            self.assertFalse((root/'restored').exists())

    def test_synthetic_database_media_and_users_restore_without_sessions(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'source.db'
            with closing(sqlite3.connect(source)) as db:
                db.execute('CREATE TABLE samples (id INTEGER PRIMARY KEY, value TEXT)')
                db.execute("INSERT INTO samples VALUES (1, 'SYNTHETIC ONLY')")
                db.commit()
            uploads = root / 'uploads'
            uploads.mkdir()
            (uploads / 'dummy.png').write_bytes(b'synthetic file bytes')
            users = root / 'users.json'
            users.write_text(json.dumps([{'username':'synthetic','password_hash':'dummy-hash'}]))
            backup = create_backup(source, uploads, root / 'backup', users)
            restored = restore_backup(backup, root / 'restored')
            with closing(sqlite3.connect(restored / 'echo.db')) as db:
                self.assertEqual(db.execute('SELECT value FROM samples').fetchone()[0], 'SYNTHETIC ONLY')
                self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
            self.assertEqual((restored / 'uploads/dummy.png').read_bytes(), b'synthetic file bytes')
            self.assertEqual(json.loads((restored / 'users.json').read_text())[0]['username'], 'synthetic')
            self.assertFalse((restored / 'sessions.db').exists())
            self.assertEqual((restored / 'echo.db').stat().st_mode & 0o777, 0o600)
            with self.assertRaises(ValueError): restore_backup(backup, restored)
            (backup / 'uploads/dummy.png').write_bytes(b'tampered')
            with self.assertRaises(ValueError): restore_backup(backup, root / 'tampered')
            self.assertFalse((root / 'tampered').exists())
