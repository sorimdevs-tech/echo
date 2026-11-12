import os
import sqlite3
import tempfile
import time
import unittest
from contextlib import closing
from session_store import SessionStore


class SessionTests(unittest.TestCase):
    def test_restart_expiry_and_revocation(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, 'sessions.db')
            store = SessionStore(path)
            store.create('secret-token', 'test-user', time.time() + 60)
            reopened = SessionStore(path)
            self.assertEqual(reopened.username('secret-token'), 'test-user')
            self.assertIsNone(reopened.username('wrong-token'))
            with closing(sqlite3.connect(path)) as db:
                self.assertNotEqual(db.execute('SELECT digest FROM sessions').fetchone()[0], 'secret-token')
            reopened.revoke('secret-token')
            self.assertIsNone(store.username('secret-token'))
            store.create('expired-token', 'test-user', time.time() - 1)
            self.assertIsNone(store.username('expired-token'))
            self.assertEqual(os.stat(path).st_mode & 0o777, 0o600)

    def test_login_failure_limit_persists_and_expires(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, 'sessions.db')
            store = SessionStore(path)
            for _ in range(10):
                self.assertFalse(store.blocked('client'))
                store.failed('client')
            self.assertTrue(SessionStore(path).blocked('client'))
            self.assertFalse(store.blocked('other-client'))
            with closing(sqlite3.connect(path)) as db:
                db.execute('UPDATE login_failures SET expires = ?', (time.time() - 1,))
                db.commit()
            self.assertFalse(store.blocked('client'))
