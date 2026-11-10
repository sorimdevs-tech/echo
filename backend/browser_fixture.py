"""Temporary empty-database browser fixture. Contains only synthetic records."""
import json
import os
from pathlib import Path
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.request

folder=Path(tempfile.mkdtemp(prefix='echo-browser-fixture-'))
sqlite3.connect(folder/'empty.db').close()
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
env={**os.environ,'DB_PATH':str(folder/'empty.db'),'UPLOADS_DIR':str(folder/'uploads'),'ECHOAI_USERS_PATH':str(folder/'users.json'),'ECHOAI_PASSWORD':'Browser-fixture-only!42','ECHOAI_SESSION_COOKIE':'echo_fixture_session','PORT':str(port),'HOST':'127.0.0.1'}
source=Path(__file__).parent
log=open(folder/'server.log','w')
server=subprocess.Popen([sys.executable,'main.py'],cwd=source,env=env,stdout=log,stderr=log)
base=f'http://127.0.0.1:{port}'
def call(method,path,data=None,token=None):
    headers={'Content-Type':'application/json'}
    if token:headers['Authorization']='Bearer '+token
    request=urllib.request.Request(base+path,data=None if data is None else json.dumps(data).encode(),headers=headers,method=method)
    with urllib.request.urlopen(request) as result:return json.load(result)
try:
    for _ in range(100):
        try:call('GET','/api/health');break
        except Exception:time.sleep(.1)
    token=call('POST','/api/auth/login',{'username':'dr.shanthi','password':'Browser-fixture-only!42'})['token']
    for role in ('L1','L2'):
        call('POST','/api/workflow/users',{'username':role.lower(),'name':role+' Dummy','password':'Browser-fixture-only!42','role':role},token)
    patient=call('POST','/api/patients',{'patient_id':'BROWSER-DUMMY','first_name':'Dummy','last_name':'Browser','dob':'2000-01-01','age':'26','gender':'F','street':'Synthetic address','state':'Tamil Nadu','country':'India','phone1':'1234567890','family_doctor':'Self'},token)['data']
    visit=call('POST',f'/api/patients/{patient["id"]}/visits',{'visit_date':'2026-11-09T10:00','scan_type':'Pediatric Echo'},token)['data']
    # Obtain the complete page shape; fake text is never copied to the real database.
    node="const fs=require('fs'),vm=require('vm');let s=fs.readFileSync('frontend/src/pages/PediatricEchoReport.jsx','utf8');let a=s.indexOf('const initialReport = '),b=s.indexOf('{',a),e=s.indexOf('\\n}',b)+2;console.log(JSON.stringify(vm.runInNewContext('('+s.slice(b,e)+')')));"
    report=json.loads(subprocess.check_output(['node','-e',node],cwd=source.parent,text=True))
    report['indication']='Dummy browser test only'
    report['impression'].update(final_impression='Dummy software test; no clinical interpretation.',primary_consultant='Dummy consultant',report_completed=False)
    scan=call('POST','/api/scans',{'patient_id':patient['id'],'visit_id':visit['id'],'scan_type':'Pediatric Echo','pediatric_echo_report':report},token)['data']
    info={'url':base,'patient_id':patient['id'],'visit_id':visit['id'],'scan_id':scan['id'],'usernames':['l1','l2','dr.shanthi'],'password':'Browser-fixture-only!42','database':str(folder/'empty.db'),'pid':server.pid}
    (source.parent/'browser-fixture-info.json').write_text(json.dumps(info))
    print(json.dumps(info),flush=True)
    while server.poll() is None:time.sleep(1)
except KeyboardInterrupt:pass
finally:
    server.terminate();server.wait(timeout=10);log.close()
