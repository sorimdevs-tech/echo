"""Transactional report review, completion and correction with attributed history."""
import json
from contextvars import ContextVar
from datetime import datetime, timezone
from fastapi import HTTPException, Request

actor = ContextVar('report_actor', default=None)
TABLES = {'scans':'scans', 'clinical-reports':'clinical_reports'}

def initialize(db):
    db.execute('CREATE TABLE IF NOT EXISTS report_reviews (resource TEXT NOT NULL, report_id INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1, entered_by INTEGER, entered_name TEXT, audited_by INTEGER, audited_name TEXT, audited_at TEXT, completed_by INTEGER, completed_name TEXT, completed_at TEXT, PRIMARY KEY(resource,report_id))')
    db.execute('CREATE TABLE IF NOT EXISTS report_history (id INTEGER PRIMARY KEY, resource TEXT NOT NULL, report_id INTEGER NOT NULL, actor_id INTEGER, actor_name TEXT NOT NULL, action TEXT NOT NULL, changed_at TEXT NOT NULL, changes TEXT NOT NULL, reason TEXT)')
    db.execute('CREATE INDEX IF NOT EXISTS report_history_lookup ON report_history(resource,report_id,id)')

def now(): return datetime.now(timezone.utc).isoformat()

def user():
    return actor.get() or {'id':None,'name':'System migration','role':'admin'}

def is_complete(row): return str(row['status'] or '').lower() in ('completed','final')

def guard_edit(db, resource, report_id):
    db.execute('BEGIN IMMEDIATE')
    row=db.execute(f'SELECT * FROM {TABLES[resource]} WHERE id=?',(report_id,)).fetchone()
    if not row:
        db.close(); raise HTTPException(404,'Report not found')
    if is_complete(row):
        db.close(); raise HTTPException(409,'Completed report is protected. Use the authorized correction workflow.')
    return dict(row)

def flatten(value, prefix=''):
    if isinstance(value,dict):
        result={}
        for key,item in value.items(): result.update(flatten(item, f'{prefix}.{key}' if prefix else key))
        return result
    return {prefix:value}

def document(row):
    result=dict(row)
    for key in ('findings',):
        try: result[key]=json.loads(result.get(key) or '{}')
        except (ValueError,TypeError): pass
    return flatten(result)

def log(db,resource,report_id,action,changes,reason=None):
    who=user()
    db.execute('INSERT INTO report_history(resource,report_id,actor_id,actor_name,action,changed_at,changes,reason) VALUES (?,?,?,?,?,?,?,?)',(resource,report_id,who['id'],who['name'],action,now(),json.dumps(changes),reason))

def record_save(db,resource,report_id,previous=None):
    who=user()
    row=db.execute(f'SELECT * FROM {TABLES[resource]} WHERE id=?',(report_id,)).fetchone()
    if is_complete(row): raise HTTPException(409,'Use Complete report after audit; saving cannot finalize a report')
    before=document(previous) if previous else {}
    after=document(row)
    changes={k:{'before':before.get(k),'after':after.get(k)} for k in before.keys()|after.keys() if before.get(k)!=after.get(k) and k not in ('updated_at','created_at')}
    db.execute('INSERT OR IGNORE INTO report_reviews(resource,report_id,entered_by,entered_name) VALUES (?,?,?,?)',(resource,report_id,who['id'],who['name']))
    if changes:
        db.execute('UPDATE report_reviews SET version=version+?,audited_by=NULL,audited_name=NULL,audited_at=NULL WHERE resource=? AND report_id=?',(1 if previous else 0,resource,report_id))
        log(db,resource,report_id,'updated' if previous else 'created',changes)

def install(app,get_db):
    def startup():
        with get_db() as db: initialize(db); db.commit()
    app.add_event_handler('startup',startup)

    @app.get('/api/report-workflow/{resource}/{report_id}')
    def review(resource:str,report_id:int,request:Request):
        if resource not in TABLES: raise HTTPException(404,'Unknown report category')
        with get_db() as db:
            row=db.execute(f'SELECT * FROM {TABLES[resource]} WHERE id=?',(report_id,)).fetchone()
            if not row: raise HTTPException(404,'Report not found')
            metadata=db.execute('SELECT * FROM report_reviews WHERE resource=? AND report_id=?',(resource,report_id)).fetchone()
            history=[dict(r) for r in db.execute('SELECT * FROM report_history WHERE resource=? AND report_id=? ORDER BY id DESC',(resource,report_id))]
            for entry in history: entry['changes']=json.loads(entry['changes'])
            return {'data':{'status':row['status'],'locked':is_complete(row),'review':dict(metadata) if metadata else {},'history':history,'role':request.state.user['role']}}

    @app.post('/api/report-workflow/{resource}/{report_id}/{action}')
    def transition(resource:str,report_id:int,action:str,data:dict,request:Request):
        if resource not in TABLES: raise HTTPException(404,'Unknown report category')
        who=request.state.user
        allowed={'audit':{'auditor','admin'},'complete':{'senior','admin'},'correct':{'senior','admin'}}
        if action not in allowed or who['role'] not in allowed[action]: raise HTTPException(403,'Your role cannot perform this action')
        with get_db() as db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute(f'SELECT * FROM {TABLES[resource]} WHERE id=?',(report_id,)).fetchone()
            if not row: raise HTTPException(404,'Report not found')
            db.execute('INSERT OR IGNORE INTO report_reviews(resource,report_id) VALUES (?,?)',(resource,report_id))
            metadata=db.execute('SELECT * FROM report_reviews WHERE resource=? AND report_id=?',(resource,report_id)).fetchone()
            if data.get('version') != metadata['version']: raise HTTPException(409,'Report changed. Reload and review the latest version.')
            reason=str(data.get('reason') or '').strip()
            if action=='audit':
                if is_complete(row): raise HTTPException(409,'Report is already completed')
                db.execute('UPDATE report_reviews SET audited_by=?,audited_name=?,audited_at=? WHERE resource=? AND report_id=?',(who['id'],who['name'],now(),resource,report_id))
            elif action=='complete':
                if is_complete(row): raise HTTPException(409,'Report is already completed')
                if not metadata['audited_at']: raise HTTPException(409,'Audit must be completed before final approval')
                db.execute(f"UPDATE {TABLES[resource]} SET status='Completed' WHERE id=?",(report_id,))
                db.execute('UPDATE report_reviews SET completed_by=?,completed_name=?,completed_at=? WHERE resource=? AND report_id=?',(who['id'],who['name'],now(),resource,report_id))
            else:
                if not is_complete(row): raise HTTPException(409,'Only completed reports can be reopened for correction')
                if not reason: raise HTTPException(422,'A correction reason is required')
                db.execute(f"UPDATE {TABLES[resource]} SET status='In Progress' WHERE id=?",(report_id,))
                db.execute('UPDATE report_reviews SET version=version+1,audited_by=NULL,audited_name=NULL,audited_at=NULL,completed_by=NULL,completed_name=NULL,completed_at=NULL WHERE resource=? AND report_id=?',(resource,report_id))
            log(db,resource,report_id,action,{'status':{'before':row['status'],'after':'Completed' if action=='complete' else 'In Progress' if action=='correct' else row['status']}},reason or None)
            db.commit()
        return {'success':True}
