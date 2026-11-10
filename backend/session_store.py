"""Local durable sessions. Only token digests are stored on disk."""
import hashlib
import os
import sqlite3
import time
from contextlib import contextmanager


class SessionStore:
    def __init__(self, path):
        self.path = path
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o600)
        os.close(fd)
        os.chmod(path, 0o600)
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS sessions (digest TEXT PRIMARY KEY, username TEXT NOT NULL, expires REAL NOT NULL)')
            db.execute('CREATE TABLE IF NOT EXISTS login_failures (client TEXT PRIMARY KEY, failures INTEGER NOT NULL, expires REAL NOT NULL)')

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        try:
            with db:
                yield db
        finally:
            db.close()

    @staticmethod
    def digest(token):
        return hashlib.sha256(token.encode()).hexdigest()

    def create(self, token, username, expires):
        with self.connect() as db:
            db.execute('DELETE FROM sessions WHERE expires <= ?', (time.time(),))
            db.execute('INSERT INTO sessions VALUES (?, ?, ?)', (self.digest(token), username, expires))

    def username(self, token):
        if not token:
            return None
        with self.connect() as db:
            row = db.execute('SELECT username FROM sessions WHERE digest = ? AND expires > ?', (self.digest(token), time.time())).fetchone()
        return row[0] if row else None

    def revoke(self, token):
        if token:
            with self.connect() as db:
                db.execute('DELETE FROM sessions WHERE digest = ?', (self.digest(token),))

    def blocked(self, client):
        with self.connect() as db:
            row = db.execute('SELECT failures FROM login_failures WHERE client = ? AND expires > ?', (self.digest(client), time.time())).fetchone()
        return bool(row and row[0] >= 10)

    def failed(self, client):
        now = time.time()
        with self.connect() as db:
            db.execute('DELETE FROM login_failures WHERE expires <= ?', (now,))
            db.execute('INSERT INTO login_failures VALUES (?, 1, ?) ON CONFLICT(client) DO UPDATE SET failures = failures + 1', (self.digest(client), now + 900))

