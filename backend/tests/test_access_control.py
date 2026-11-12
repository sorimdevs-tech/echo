import asyncio
import sqlite3
import tempfile
import unittest
from pathlib import Path
from fastapi import FastAPI
import httpx
from access_control import install, password_hash

class AccessTests(unittest.TestCase):
    def test_login_session_roles_and_logout(self):
        async def scenario():
            with tempfile.TemporaryDirectory() as temp:
                class DB:
                    def __enter__(self):
                        self.db=sqlite3.connect(str(Path(temp)/'test.db')); self.db.row_factory=sqlite3.Row; return self.db
                    def __exit__(self,*args): self.db.close()
                app=FastAPI(); install(app, DB, temp)
                @app.get('/api/patients')
                def patients(): return {'ok':True}
                @app.post('/api/patients')
                def create(): return {'ok':True}
                await app.router.startup()
                with DB() as db:
                    db.execute('INSERT INTO access_accounts(username,name,role,password_hash) VALUES (?,?,?,?)',('auditor','Auditor','auditor',password_hash('test-password-long')));db.commit()
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as client:
                    self.assertEqual((await client.get('/api/patients')).status_code,401)
                    self.assertEqual((await client.post('/api/auth/login',json={'username':'auditor','password':'wrong'})).status_code,401)
                    self.assertEqual((await client.post('/api/auth/login',json={'username':'auditor','password':'test-password-long'})).status_code,200)
                    self.assertEqual((await client.get('/api/patients')).status_code,200)
                    self.assertEqual((await client.post('/api/patients',headers={'X-Echo-Request':'1'},json={})).status_code,403)
                    self.assertEqual((await client.get('/api/auth/accounts')).status_code,403)
                    self.assertEqual((await client.post('/api/auth/logout',headers={'X-Echo-Request':'1'})).status_code,200)
                    self.assertEqual((await client.get('/api/patients')).status_code,401)
        asyncio.run(scenario())
