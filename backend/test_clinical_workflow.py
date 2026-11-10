"""Integration checks run against a temporary copy; never writes the clinical database."""
import copy
import base64
import json
import os
from pathlib import Path
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request

class WorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix='echo-workflow-test-')
        cls.folder = Path(cls.tmp.name)
        source = Path(__file__).parent
        sqlite3.connect(cls.folder / 'test.db').close()
        sock = socket.socket(); sock.bind(('127.0.0.1', 0)); cls.port = sock.getsockname()[1]; sock.close()
        env = {**os.environ, 'DB_PATH':str(cls.folder/'test.db'), 'ECHOAI_USERS_PATH':str(cls.folder/'users.json'), 'ECHOAI_PASSWORD':'Workflow-test-only!42', 'PORT':str(cls.port), 'UPLOADS_DIR':str(cls.folder/'uploads'), 'ECHOAI_MAX_UPLOAD_BYTES':'1024'}
        cls.log = open(cls.folder/'server.log', 'w')
        cls.server = subprocess.Popen([sys.executable, 'main.py'], cwd=source, env=env, stdout=cls.log, stderr=cls.log)
        cls.base=f'http://127.0.0.1:{cls.port}'
        for _ in range(100):
            try:
                cls.call('GET','/api/health'); break
            except Exception:
                time.sleep(.1)
        else:
            raise RuntimeError('Test server did not start')
        cls.l3=cls.call('POST','/api/auth/login',{'username':'dr.shanthi','password':'Workflow-test-only!42'})[1]['token']
        cls.roles={'L3':cls.l3}
        for role in ('L1','L2'):
            cls.call('POST','/api/workflow/users',{'name':role+' Test','username':role.lower(),'password':'Workflow-test-only!42','role':role},cls.l3)
            cls.roles[role]=cls.call('POST','/api/auth/login',{'username':role.lower(),'password':'Workflow-test-only!42'})[1]['token']
        cls.source=source
        cls.extra_servers=[]
        cls.trusted_proxy=cls.start_extra_server('trusted-proxy','127.0.0.1,10.0.0.5,10.0.0.6')
        cls.untrusted_proxy=cls.start_extra_server('untrusted-proxy','10.9.9.9')

    @classmethod
    def start_extra_server(cls, name, trusted_proxies):
        """Start a deployment-style uvicorn process with its own rate-limit store."""
        folder=cls.folder/name
        folder.mkdir()
        sqlite3.connect(folder/'test.db').close()
        sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
        env={**os.environ,'DB_PATH':str(folder/'test.db'),'ECHOAI_USERS_PATH':str(cls.folder/'users.json'),'ECHOAI_SESSIONS_PATH':str(folder/'sessions.db'),'ECHOAI_PASSWORD':'Workflow-test-only!42','PORT':str(port),'UPLOADS_DIR':str(folder/'uploads'),'ECHOAI_TRUSTED_PROXIES':trusted_proxies}
        log=open(folder/'server.log','w')
        # Match the Docker entrypoint, but leave forwarded-address resolution to the
        # application so the configured trusted-proxy rules are what is exercised.
        process=subprocess.Popen([sys.executable,'-m','uvicorn','main:app','--host','127.0.0.1','--port',str(port),'--no-proxy-headers'],cwd=cls.source,env=env,stdout=log,stderr=log)
        base=f'http://127.0.0.1:{port}'
        for _ in range(100):
            try:
                with urllib.request.urlopen(base+'/api/health',timeout=1) as response:response.read()
                break
            except Exception:
                time.sleep(.1)
        else:
            process.terminate();process.wait(timeout=10);log.close()
            raise RuntimeError(name+' test server did not start')
        cls.extra_servers.append((process,log,base))
        return base

    @classmethod
    def tearDownClass(cls):
        for process,log,_ in reversed(cls.extra_servers):
            process.terminate();process.wait(timeout=10);log.close()
        cls.server.terminate();cls.server.wait(timeout=10);cls.log.close();cls.tmp.cleanup()

    @classmethod
    def call(cls, method, route, data=None, token=None, headers=None, base=None):
        body=None if data is None else json.dumps(data).encode()
        request_headers={'Content-Type':'application/json'}
        if token:request_headers['Authorization']='Bearer '+token
        if headers:request_headers.update(headers)
        request=urllib.request.Request((base or cls.base)+route,data=body,headers=request_headers,method=method)
        try:
            with urllib.request.urlopen(request,timeout=10) as r:return r.status,json.load(r)
        except urllib.error.HTTPError as e:
            with e:return e.code,json.load(e)

    def test_complete_workflow(self):
        call=self.call;l1=self.roles['L1'];l2=self.roles['L2'];l3=self.roles['L3']
        self.assertEqual(call('GET','/api/patients')[0],401)
        self.assertEqual(call('POST','/api/patients',{},l1)[0],422)
        patient={'patient_id':'TEST-WORKFLOW-001','first_name':'Dummy','last_name':'Test','age':'30','gender':'F','street':'Test address','state':'Tamil Nadu','country':'India','phone1':'1234567890','family_doctor':'Self'}
        code,result=call('POST','/api/patients',patient,l1);self.assertEqual(code,200,result);pid=result['data']['id']
        self.assertEqual(call('POST','/api/patients',patient,l1)[0],400)
        self.assertEqual(call('POST','/api/patients',{**patient,'patient_id':'TEST-FUTURE-DOB','dob':'2999-01-01'},l1)[0],422)
        code,contact=call('POST','/api/referral-doctors',{'doctor_type':'hospital','institution_name':'Dummy Institute','designation':'Test designation','phone2':'2222222222'},l1)
        self.assertEqual(code,200,contact)
        fetched=call('GET',f'/api/referral-doctors/{contact["data"]["id"]}',token=l1)[1]['data']
        self.assertEqual(fetched['doctor_type'],'hospital');self.assertEqual(fetched['designation'],'Test designation');self.assertEqual(fetched['phone2'],'2222222222')
        self.assertEqual(call('POST','/api/referral-doctors',{},l1)[0],422)
        visits=call('GET',f'/api/patients/{pid}/visits',token=l1)[1]['data'];self.assertEqual(visits,[])
        visit={'visit_date':'2026-11-09T10:00','scan_type':'Fetal Echo','referral_doctor':'Test Clinic','request_id':'test-once'}
        code,result=call('POST',f'/api/patients/{pid}/visits',visit,l1);self.assertEqual(code,200,result);vid=result['data']['id']
        self.assertEqual(call('POST',f'/api/patients/{pid}/visits',visit,l1)[1]['data']['id'],vid)
        self.assertEqual(len(call('GET',f'/api/patients/{pid}/visits',token=l1)[1]['data']),1)
        draft={'patient_id':pid,'patient_display_id':patient['patient_id'],'visit_id':vid,'scan_type':'Fetal Echo','status':'draft','scan_date':'2026-11-09T10:30'}
        code,result=call('POST','/api/scans',draft,l1);self.assertEqual(code,200,result);sid=result['data']['id']
        self.assertEqual(call('POST','/api/scans',draft,l1)[1]['data']['id'],sid)
        self.assertEqual(call('POST','/api/scans',{**draft,'scan_type':'Adult Echo'},l1)[0],422)
        report={'indication':'Dummy test only','no_of_fetuses':'1','lmp':{'lmp_date':'2026-06-01'},'echo_details':{'general':{'cardiac_position':'Abnormal'}},'impression':{'header_comments':'Synthetic header','disclaimer_comments':'Synthetic disclaimer','final_impression':'Dummy test report','primary_consultant':'Test Consultant','report_completed':False}}
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l1)[0],422)
        report['echo_details']['general']['cardiac_position_comments']='Dummy description'
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'patient_id':0,'fetal_echo_report':report},l1)[0],409)
        code,result=call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l1);self.assertEqual(code,200,result)
        self.assertEqual(result['data']['patient_display_id'],patient['patient_id']);self.assertEqual(result['data']['scan_date'],draft['scan_date'])
        report['impression']['audit_done']=True
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l1)[0],403)
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l2)[0],200)
        report['impression']['report_completed']=True
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l2)[0],403)
        code,result=call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l3);self.assertEqual(code,200,result)
        self.assertEqual(result['data']['status'],'Completed')
        saved=call('GET',f'/api/scans/{sid}',token=l3)[1]['data']['fetal_echo_report']
        self.assertEqual(saved['echo_details']['general']['cardiac_position_comments'],'Dummy description')
        self.assertEqual(saved['impression']['audited_by'],'L2 Test')
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'conclusion':'changed'},l3)[0],409)
        self.assertEqual(call('DELETE',f'/api/scans/{sid}',token=l3)[0],409)
        self.assertEqual(call('DELETE',f'/api/patients/{pid}',token=l3)[0],409)
        self.assertEqual(call('PUT',f'/api/resources/scans/{sid}',{'status':'draft'},l1)[0],403)
        self.assertEqual(call('GET','/api/resources/unknown',token=l3)[0],404)

    def test_adult_paediatric_and_ultrasound(self):
        l1=self.roles['L1'];l3=self.roles['L3'];call=self.call
        patient={'patient_id':'TEST-OTHER-TYPES','first_name':'Dummy','last_name':'Other','dob':'2000-01-01','gender':'F','street':'Test','state':'Tamil Nadu','country':'India','phone2':'1234567890','family_doctor':'Self'}
        pid=call('POST','/api/patients',patient,l1)[1]['data']['id']
        for scan_type,key in [('Adult Echo','adult_echo_report'),('Pediatric Echo','pediatric_echo_report'),('Ultrasound',None)]:
            vid=call('POST',f'/api/patients/{pid}/visits',{'visit_date':'2026-11-09T12:00','scan_type':scan_type},l1)[1]['data']['id']
            payload={'patient_id':pid,'visit_id':vid,'scan_type':scan_type,'status':'draft'}
            code,result=call('POST','/api/scans',payload,l1);self.assertEqual(code,200,result);sid=result['data']['id']
            if key:
                report={'indication':'Test only','echo_details':{'general':{'situs':'Not visualized'}},'impression':{'primary_consultant':'Dummy consultant','final_impression':'Dummy only','internal_comments':'INTERNAL-NOT-FOR-PATIENT'}}
                code,result=call('PUT',f'/api/scans/{sid}',{key:report},l1);self.assertEqual(code,200,result)
                self.assertEqual(result['data'][key]['impression']['internal_comments'],'INTERNAL-NOT-FOR-PATIENT')
                self.assertEqual(result['data']['status'],'In Progress')

    def test_draft_validation_and_report_type_integrity(self):
        call=self.call;l1=self.roles['L1'];l3=self.roles['L3']
        patient={'patient_id':'TEST-DRAFT','first_name':'Dummy','last_name':'Draft','age':'30','gender':'F','street':'Test','state':'Tamil Nadu','country':'India','phone1':'1234567890','family_doctor':'Self'}
        pid=call('POST','/api/patients',patient,l1)[1]['data']['id']
        vid=call('POST',f'/api/patients/{pid}/visits',{'scan_type':'Fetal Echo','visit_date':'2026-11-10T09:00'},l1)[1]['data']['id']
        report={'indication':'','lmp':{},'no_of_fetuses':'','doppler':{'mpi_method_1':{'rv_mpi':'999','rv_ict':'12'}},'impression':{}}
        code,result=call('POST','/api/scans',{'patient_id':pid,'visit_id':vid,'scan_type':'Fetal Echo','fetal_echo_report':report},l1)
        self.assertEqual(code,200,result);sid=result['data']['id']
        self.assertEqual(result['data']['status'],'Draft');self.assertEqual(result['data']['normal'],0)
        saved=call('GET',f'/api/scans/{sid}',token=l1)[1]['data']['fetal_echo_report']
        self.assertEqual(saved['doppler']['mpi_method_1']['rv_mpi'],'');self.assertEqual(saved['doppler']['mpi_method_1']['rv_ict'],'12')
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':{**report,'lmp':{'lmp_date':'2026-02-30'}}},l1)[0],422)
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'adult_echo_report':report},l1)[0],422)
        for invalid in ({'impression':None},{'impression':{'report_completed':'false'}},{'impression':{'classification':'Unknown'}},{'no_of_fetuses':'0'}):
            self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':{**report,**invalid}},l1)[0],422)
        report['impression']={'header_comments':'Synthetic header','disclaimer_comments':'Synthetic disclaimer','report_completed':True,'primary_consultant':'Dummy','final_impression':'Test only'}
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l1)[0],403)
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l3)[0],422)
        report.update(indication='Test only',lmp={'edd':'2027-01-01'},no_of_fetuses='1')
        report['echo_details']={'situs':'Abnormal','situs_comments':'   '}
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l3)[0],422)
        report['echo_details']['situs_comments']='Dummy description'
        for required in ('header_comments', 'disclaimer_comments'):
            invalid = copy.deepcopy(report)
            invalid['impression'][required] = '   '
            self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':invalid},l3)[0],422)
        code,result=call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l3);self.assertEqual(code,200,result)
        self.assertEqual(result['data']['fetal_echo_report']['impression']['completed_by'],'Dr Shanthi')
        self.assertTrue(result['data']['fetal_echo_report']['impression']['completed_at'])
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'status':'Draft'},l3)[0],409)

    def test_visit_report_integrity(self):
        call=self.call;token=self.l3
        patient={'patient_id':'TEST-VISIT-LOCK','first_name':'Dummy','last_name':'Visit','age':'30','gender':'F','street':'Test','state':'Tamil Nadu','country':'India','phone1':'1234567890','family_doctor':'Self'}
        pid=call('POST','/api/patients',patient,token)[1]['data']['id']
        vid=call('POST',f'/api/patients/{pid}/visits',{'scan_type':'Adult Echo','visit_date':'2026-11-10T10:00'},token)[1]['data']['id']
        sid=call('POST','/api/scans',{'patient_id':pid,'visit_id':vid,'scan_type':'Adult Echo'},token)[1]['data']['id']
        self.assertEqual(call('DELETE',f'/api/patients/{pid}/visits/{vid}',token=token)[0],409)
        self.assertEqual(call('PUT',f'/api/patients/{pid}/visits/{vid}',{'visit_type':'Fetal Echo'},token)[0],409)
        self.assertEqual(call('DELETE',f'/api/scans/{sid}',token=token)[0],200)
        self.assertEqual(call('DELETE',f'/api/patients/{pid}/visits/{vid}',token=token)[0],200)

    def test_media_upload_storage_matching_and_auth(self):
        token=self.roles['L1'];call=self.call
        patient={'patient_id':'TEST-MEDIA','first_name':'Dummy','last_name':'Media','age':'30','gender':'F','street':'Test','state':'Tamil Nadu','country':'India','phone1':'1234567890','family_doctor':'Self'}
        pid=call('POST','/api/patients',patient,token)[1]['data']['id']
        vid=call('POST',f'/api/patients/{pid}/visits',{'scan_type':'Fetal Echo','visit_date':'2026-11-10T10:00'},token)[1]['data']['id']
        image=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
        def upload(name,content,visit=vid):
            boundary='echo-test-boundary'
            body=(f'--{boundary}\r\nContent-Disposition: form-data; name="patient_id"\r\n\r\n{pid}\r\n--{boundary}\r\nContent-Disposition: form-data; name="visit_id"\r\n\r\n{visit}\r\n--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode()+content+f'\r\n--{boundary}--\r\n'.encode()
            req=urllib.request.Request(self.base+'/api/media-upload',data=body,headers={'Authorization':'Bearer '+token,'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
            try:
                with urllib.request.urlopen(req) as r:return r.status,json.load(r)
            except urllib.error.HTTPError as e:
                with e:return e.code,json.load(e)
        code,result=upload('../../dummy.png',image);self.assertEqual(code,200,result);record=result['data']
        self.assertEqual(str(record['patient_id']),str(pid));self.assertEqual(str(record['visit_id']),str(vid))
        self.assertTrue(record['url'].startswith('/uploads/'));self.assertNotIn('..',record['url'])
        self.assertNotEqual(record['url'],upload('../../dummy.png',image)[1]['data']['url'])
        with urllib.request.urlopen(urllib.request.Request(self.base+record['url'],headers={'Authorization':'Bearer '+token})) as r:self.assertEqual(r.read(),image)
        with self.assertRaises(urllib.error.HTTPError) as blocked:urllib.request.urlopen(self.base+record['url'])
        self.assertEqual(blocked.exception.code,401)
        blocked.exception.close()
        self.assertEqual(upload('evil.html',b'<script>bad</script>')[0],415)
        self.assertEqual(upload('bad.png',b'not an image')[0],415)
        self.assertEqual(upload('dummy.png',image,999999)[0],422)
        self.assertEqual(upload('large.png',image+b'x'*2048)[0],413)
        records=call('GET','/api/resources/media-records',token=token)[1]['data']
        self.assertEqual(len(records),2)
        self.assertEqual(call('POST','/api/resources/media-records',{'patient_id':pid,'url':'https://example.com/file.png'},token)[0],403)
        self.assertEqual(call('PUT',f'/api/resources/media-records/{record["id"]}',{'patient_id':'999'},token)[0],409)
        self.assertEqual(call('PUT',f'/api/resources/media-records/{record["id"]}',{'url':'https://example.com/file.png'},token)[0],409)
        self.assertEqual(call('PUT',f'/api/resources/media-records/{record["id"]}',record,token)[0],200)
        layout={'placements':[record['id'],None,record['id'],None],'columns':2,'title':'Synthetic image layout'}
        route=f'/api/media-layouts/{pid}/{vid}/rule-2'
        self.assertEqual(call('PUT',route,layout,token)[0],200)
        self.assertEqual(call('GET',route,token=token)[1]['data'],layout)
        self.assertEqual(call('GET',f'/api/media-layouts/{pid}/99999/rule-2',token=token)[0],404)
        self.assertEqual(call('PUT',route,{**layout,'placements':[99999]},token)[0],422)
        self.assertEqual(call('DELETE',f'/api/resources/media-records/{record["id"]}',token=token)[0],200)
        archived=call('GET','/api/resources/media-records',token=token)[1]['data']
        self.assertEqual(next(item for item in archived if item['id']==record['id'])['status'],'Archived')
        self.assertTrue((self.folder/'uploads'/record['url'].split('/')[-1]).exists())
        self.assertEqual(call('PUT',route,layout,token)[0],422)
        self.assertEqual(call('PUT',f'/api/resources/media-records/{record["id"]}',{'status':'Uploaded'},token)[0],200)
        final={'indication':'Synthetic test','no_of_fetuses':'1','lmp':{'edd':'2027-01-01'},'impression':{'primary_consultant':'Synthetic consultant','final_impression':'Test only','header_comments':'Synthetic header','disclaimer_comments':'Synthetic disclaimer','report_completed':True}}
        code,result=call('POST','/api/scans',{'patient_id':pid,'visit_id':vid,'scan_type':'Fetal Echo','fetal_echo_report':final},self.l3)
        self.assertEqual(code,200,result)
        self.assertEqual(call('DELETE',f'/api/resources/media-records/{record["id"]}',token=token)[0],409)
        self.assertEqual(call('PUT',f'/api/resources/media-records/{record["id"]}',{'status':'Archived'},token)[0],409)
        self.assertEqual(call('PUT',route,layout,token)[0],409)
        # Deletion protections for associated media and visits
        self.assertEqual(call('DELETE',f'/api/patients/{pid}/visits/{vid}',token=self.l3)[0],409)
        self.assertEqual(call('DELETE',f'/api/patients/{pid}',token=self.l3)[0],409)
        # Verify reports cannot be created without a valid visit
        self.assertEqual(call('POST','/api/scans',{'patient_id':pid,'scan_type':'Fetal Echo'},token)[0],422)

    def test_contact_only_updates_and_identity_locks_for_all_roles(self):
        patient={'patient_id':'TEST-CONTACT-ONLY','first_name':'Dummy','last_name':'Contact','dob':'2000-01-01','gender':'F','street':'Test','state':'Tamil Nadu','country':'India','phone2':'1234567890','family_doctor':'Self'}
        pid=self.call('POST','/api/patients',patient,self.l3)[1]['data']['id']
        for role,token in self.roles.items():
            code,result=self.call('PUT',f'/api/patients/{pid}',{'phone1':'9876543210','street':'Updated '+role,'family_doctor':'Test Clinic'},token)
            self.assertEqual(code,200,result)
            self.assertEqual(result['data']['patient_id'],patient['patient_id'])
            for key,value in {'patient_id':'CHANGED','first_name':'Changed','last_name':'Changed','dob':'2001-01-01','gender':'M'}.items():
                self.assertEqual(self.call('PUT',f'/api/patients/{pid}',{key:value},token)[0],409)
            self.assertEqual(self.call('GET',f'/api/patients/{pid}/visits',token=token)[1]['data'],[])
            self.assertEqual(self.call('GET',f'/api/scans/patient/{pid}',token=token)[1]['data'],[])

    def test_media_layout_print_settings_round_trip_and_validation(self):
        call=self.call;token=self.roles['L1']
        patient={'patient_id':'TEST-PRINT-SETTINGS','first_name':'Dummy','last_name':'Print','age':'30','gender':'F','street':'Test','state':'Tamil Nadu','country':'India','phone1':'1234567890','family_doctor':'Self'}
        pid=call('POST','/api/patients',patient,token)[1]['data']['id']
        vid=call('POST',f'/api/patients/{pid}/visits',{'scan_type':'Fetal Echo','visit_date':'2026-11-10T10:00'},token)[1]['data']['id']
        route=f'/api/media-layouts/{pid}/{vid}/rule-3'
        layout={'placements':[None]*9,'columns':2,'title':'Synthetic print layout','print_settings':{'width':600,'height':450,'rows':4}}
        self.assertEqual(call('PUT',route,layout,token)[0],200)
        self.assertEqual(call('GET',route,token=token)[1]['data'],layout)
        for invalid in ({'width':10,'height':450,'rows':4},{'width':600,'height':450,'rows':0},{'width':600,'height':450},{'width':'600','height':450,'rows':4}):
            self.assertEqual(call('PUT',route,{**layout,'print_settings':invalid},token)[0],422)

    def test_proxy_trusted_hop_chain_and_spoofed_headers(self):
        base=self.trusted_proxy
        def attempt(forwarded):
            return self.call('POST','/api/auth/login',{'username':'missing','password':'invalid'},headers={'X-Forwarded-For':forwarded},base=base)[0]
        for _ in range(10):
            self.assertEqual(attempt('198.51.100.10'),401)
        self.assertEqual(attempt('198.51.100.10'),429)
        self.assertEqual(attempt('198.51.100.11'),401)
        # The trusted proxy appends the real client; the left-hand entry is client-supplied.
        for _ in range(10):
            self.assertEqual(attempt('1.2.3.4, 198.51.100.20'),401)
        self.assertEqual(attempt('1.2.3.4, 198.51.100.20'),429)
        self.assertEqual(attempt('1.2.3.4, 198.51.100.21'),401)
        # Multi-proxy chain: trusted hops on the right are skipped.
        for _ in range(10):
            self.assertEqual(attempt('198.51.100.30, 10.0.0.6, 10.0.0.5'),401)
        self.assertEqual(attempt('198.51.100.30, 10.0.0.6, 10.0.0.5'),429)
        self.assertEqual(attempt('198.51.100.31, 10.0.0.6, 10.0.0.5'),401)

    def test_proxy_untrusted_peer_ignores_spoofed_headers(self):
        base=self.untrusted_proxy
        def attempt(forwarded):
            return self.call('POST','/api/auth/login',{'username':'missing','password':'invalid'},headers={'X-Forwarded-For':forwarded},base=base)[0]
        for index in range(10):
            self.assertEqual(attempt(f'198.51.100.{index+1}'),401)
        # Every attempt was attributed to the direct peer, so a new header does not reset the limit.
        self.assertEqual(attempt('203.0.113.99'),429)

    def test_z_logout_and_login_abuse_protection(self):
        code, result = self.call('POST', '/api/auth/login', {'username':'l1','password':'Workflow-test-only!42'})
        self.assertEqual(code, 200)
        token = result['token']
        self.assertEqual(self.call('GET', '/api/auth/me', token=token)[0], 200)
        self.assertEqual(self.call('POST', '/api/auth/logout', {}, token)[0], 200)
        self.assertEqual(self.call('GET', '/api/auth/me', token=token)[0], 401)
        for _ in range(10):
            self.assertEqual(self.call('POST', '/api/auth/login', {'username':'missing','password':'invalid'})[0], 401)
        self.assertEqual(self.call('POST', '/api/auth/login', {'username':'l1','password':'Workflow-test-only!42'})[0], 429)

    def test_proxy_forwarded_for_trust_and_spoofing(self):
        """Verify that:
        1. When ECHOAI_TRUSTED_PROXIES is not set (default), X-Forwarded-For headers are ignored.
        2. When a trusted proxy IP is configured, requests from that peer use the client IP from X-Forwarded-For.
        3. A multi-proxy chain (e.g. client, proxy1, proxy2) correctly isolates rate limits to the originating client.
        """
        from clinical_workflow import forwarded_client
        import session_store
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, 'sessions.db')
            store = session_store.SessionStore(path)
            # Scenario 1: untrusted peer cannot spoof X-Forwarded-For
            # Direct peer is 192.0.2.1, attacker claims to be 10.0.0.1
            trusted = {'10.200.0.1', '10.100.0.1'}
            def resolve_client(peer, forwarded):
                return forwarded_client(peer, forwarded, trusted)

            # An attacker connecting directly from 192.0.2.1 sends varying X-Forwarded-For
            attacker_peer = '192.0.2.1'
            for i in range(10):
                client = resolve_client(attacker_peer, f'10.0.0.{i}')
                # Since attacker is NOT in trusted, client resolves to attacker_peer every time
                self.assertEqual(client, attacker_peer)
                store.failed(client)
            # Attacker peer is now blocked
            self.assertTrue(store.blocked(attacker_peer))

            # Scenario 2: a trusted multi-proxy chain forwards genuine client IPs
            proxy_peer = '10.100.0.1'
            real_client = '203.0.113.42'
            for _ in range(10):
                resolved = resolve_client(proxy_peer, f'{real_client}, 10.200.0.1, 10.100.0.1')
                self.assertEqual(resolved, real_client)
                store.failed(resolved)
            # The real client is blocked, but another client through the same proxy is NOT
            self.assertTrue(store.blocked(real_client))
            other_client = '203.0.113.99'
            other_resolved = resolve_client(proxy_peer, f'{other_client}, 10.200.0.1, 10.100.0.1')
            self.assertFalse(store.blocked(other_resolved))

if __name__=='__main__':unittest.main(verbosity=2)
