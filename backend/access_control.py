"""Local password accounts and expiring server-side sessions."""
import hashlib
import hmac
import secrets
import time
from pathlib import Path
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

ROLES = {'entry', 'auditor', 'senior', 'admin'}

def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 310000).hex()
    return salt + ':' + digest

def verify(password, encoded):
    return hmac.compare_digest(password_hash(password, encoded.split(':')[0]), encoded)

def install(app, get_db, base_dir):
    def initialize():
        with get_db() as db:
            db.execute('CREATE TABLE IF NOT EXISTS access_accounts (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, password_hash TEXT NOT NULL, inactive INTEGER DEFAULT 0)')
            db.execute('CREATE TABLE IF NOT EXISTS access_sessions (token_hash TEXT PRIMARY KEY, account_id INTEGER NOT NULL, expires REAL NOT NULL)')
            if not db.execute('SELECT 1 FROM access_accounts LIMIT 1').fetchone():
                password = secrets.token_urlsafe(20)
                path = Path(base_dir) / '.initial-login.txt'
                fd = __import__('os').open(path, __import__('os').O_WRONLY | __import__('os').O_CREAT | __import__('os').O_EXCL, 0o600)
                with __import__('os').fdopen(fd, 'w') as f:
                    f.write('Username: admin\nPassword: ' + password + '\n')
                db.execute('INSERT INTO access_accounts (username,name,role,password_hash) VALUES (?,?,?,?)', ('admin','Administrator','admin',password_hash(password)))
            db.commit()
    app.add_event_handler('startup', initialize)

    @app.middleware('http')
    async def authenticate(request, call_next):
        if request.method == 'OPTIONS':
            return await call_next(request)
        path = request.url.path
        if path in ('/api/auth/login', '/api/health') or not (path.startswith('/api/') or path.startswith('/uploads')):
            return await call_next(request)
        token = request.cookies.get('echo_session', '')
        with get_db() as db:
            user = db.execute('SELECT a.id,a.username,a.name,a.role FROM access_sessions s JOIN access_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires>? AND a.inactive=0', (hashlib.sha256(token.encode()).hexdigest(),time.time())).fetchone()
        if not user:
            return JSONResponse({'detail':'Sign in to continue'}, status_code=401)
        request.state.user = dict(user)
        from report_workflow import actor
        actor.set(dict(user))
        if request.method not in ('GET','HEAD','OPTIONS'):
            if request.headers.get('x-echo-request') != '1':
                return JSONResponse({'detail':'Request verification failed'}, status_code=403)
            if user['role'] == 'auditor' and not path.endswith('/audit') and path != '/api/auth/logout':
                return JSONResponse({'detail':'Auditors cannot change clinical data'},status_code=403)
            if (path.startswith('/api/settings') or path.startswith('/api/resources/users') or path.startswith('/api/auth/accounts')) and user['role'] != 'admin':
                return JSONResponse({'detail':'Administrator permission required'},status_code=403)
        if path.startswith('/api/resources/users') and user['role'] != 'admin':
            return JSONResponse({'detail':'Administrator permission required'},status_code=403)
        return await call_next(request)

    @app.post('/api/auth/login')
    def login(data: dict):
        with get_db() as db:
            user = db.execute('SELECT * FROM access_accounts WHERE username=? AND inactive=0',(str(data.get('username','')).strip(),)).fetchone()
            if not user or not verify(str(data.get('password','')), user['password_hash']):
                raise HTTPException(401, 'Incorrect username or password')
            token = secrets.token_urlsafe(32)
            db.execute('DELETE FROM access_sessions WHERE expires<?',(time.time(),))
            db.execute('INSERT INTO access_sessions VALUES (?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),user['id'],time.time()+28800))
            db.commit()
            response = JSONResponse({'data':{k:user[k] for k in ('id','username','name','role')}})
            response.set_cookie('echo_session',token,httponly=True,samesite='strict',max_age=28800)
            return response

    @app.get('/api/auth/me')
    def me(request: Request):
        return {'data':request.state.user}

    @app.post('/api/auth/logout')
    def logout(request: Request):
        with get_db() as db:
            db.execute('DELETE FROM access_sessions WHERE token_hash=?',(hashlib.sha256(request.cookies.get('echo_session','').encode()).hexdigest(),))
            db.commit()
        response=JSONResponse({'success':True}); response.delete_cookie('echo_session'); return response

    @app.get('/api/auth/accounts')
    def accounts(request: Request):
        if request.state.user['role'] != 'admin': raise HTTPException(403,'Administrator permission required')
        with get_db() as db:
            return {'data':[dict(row) for row in db.execute('SELECT id,username,name,role,inactive FROM access_accounts')]}

    @app.post('/api/auth/accounts')
    def account(data: dict, request: Request):
        if request.state.user['role'] != 'admin': raise HTTPException(403,'Administrator permission required')
        if data.get('role') not in ROLES or len(str(data.get('password',''))) < 12 or not str(data.get('username','')).strip() or not str(data.get('name','')).strip():
            raise HTTPException(422,'Name, username, valid role and password of at least 12 characters are required')
        with get_db() as db:
            try:
                db.execute('INSERT INTO access_accounts(username,name,role,password_hash) VALUES (?,?,?,?)',(data['username'].strip(),data['name'].strip(),data['role'],password_hash(data['password'])))
                db.commit()
            except __import__('sqlite3').IntegrityError:
                raise HTTPException(409,'Username already exists')
        return {'success':True}
