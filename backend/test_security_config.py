import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from fastapi import FastAPI
from clinical_workflow import install


class SecurityConfigTests(unittest.TestCase):
    def test_production_fails_closed_without_storage_secrets_or_secure_cookie(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            base = {'ECHOAI_ENV':'production'}
            with patch.dict(os.environ, base, clear=True), self.assertRaisesRegex(RuntimeError, 'storage paths'):
                install(FastAPI(), folder)
            configured = {**base,'ECHOAI_USERS_PATH':str(root/'users.json'),'ECHOAI_SESSIONS_PATH':str(root/'sessions.db')}
            with patch.dict(os.environ, configured, clear=True), self.assertRaisesRegex(RuntimeError, 'bootstrap'):
                install(FastAPI(), folder)
            with patch.dict(os.environ, {**configured,'ECHOAI_PASSWORD':'Synthetic-only!42','ECHOAI_SECURE_COOKIE':'false'}, clear=True), self.assertRaisesRegex(RuntimeError, 'secure session'):
                install(FastAPI(), folder)
            with patch.dict(os.environ, {**configured,'ECHOAI_ALLOWED_ORIGINS':'*'}, clear=True), self.assertRaisesRegex(RuntimeError, 'Wildcard'):
                install(FastAPI(), folder)
            with patch.dict(os.environ, {**configured,'ECHOAI_PASSWORD':'Synthetic-only!42'}, clear=True):
                install(FastAPI(), folder)
            self.assertEqual((root/'users.json').stat().st_mode & 0o777, 0o600)
            self.assertFalse((root/'.local-credentials.json').exists())
