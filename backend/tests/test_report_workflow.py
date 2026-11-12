import asyncio
import json
import os
import tempfile
import unittest
from unittest.mock import patch
from fastapi import FastAPI, HTTPException
import httpx
import main
import report_workflow as workflow

class WorkflowTests(unittest.TestCase):
 def test_review_completion_correction_and_history(self):
  async def run():
   with tempfile.TemporaryDirectory() as temp, patch.object(main,'DB_PATH',os.path.join(temp,'test.db')):
    main.init_db()
    workflow.actor.set({'id':1,'name':'Operator','role':'entry'})
    report=main.create_scan({'patient_id':1,'scan_type':'Fetal Echo','status':'In Progress','fetal_echo_report':{'impression':{'primary_consultant':'Consultant'},'measurement':'10'}})['data']
    app=FastAPI()
    @app.middleware('http')
    async def identity(request, call_next):
     request.state.user={'id':2,'name':'Reviewer','role':request.headers.get('role','entry')}
     workflow.actor.set(request.state.user)
     return await call_next(request)
    workflow.install(app,main.get_db)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as client:
     url=f"/api/report-workflow/scans/{report['id']}"
     state=(await client.get(url)).json()['data'];v=state['review']['version']
     self.assertEqual(state['review']['entered_name'],'Operator')
     self.assertEqual((await client.post(url+'/complete',headers={'role':'senior'},json={'version':v})).status_code,409)
     self.assertEqual((await client.post(url+'/audit',headers={'role':'entry'},json={'version':v})).status_code,403)
     self.assertEqual((await client.post(url+'/audit',headers={'role':'auditor'},json={'version':v})).status_code,200)
     self.assertEqual((await client.post(url+'/complete',headers={'role':'auditor'},json={'version':v})).status_code,403)
     self.assertEqual((await client.post(url+'/complete',headers={'role':'senior'},json={'version':v})).status_code,200)
     with self.assertRaises(HTTPException): main.update_scan(report['id'],{'status':'In Progress'})
     self.assertEqual((await client.post(url+'/correct',headers={'role':'senior'},json={'version':v})).status_code,422)
     self.assertEqual((await client.post(url+'/correct',headers={'role':'senior'},json={'version':v,'reason':'Correct measurement'})).status_code,200)
     main.update_scan(report['id'],{'fetal_echo_report':{'impression':{'primary_consultant':'Consultant'},'measurement':'12'}})
     state=(await client.get(url)).json()['data']
     self.assertFalse(state['locked']);self.assertIsNone(state['review']['audited_at'])
     history=json.dumps(state['history']);self.assertIn('Correct measurement',history);self.assertIn('measurement',history);self.assertIn('10',history);self.assertIn('12',history)
     self.assertEqual((await client.post(url+'/audit',headers={'role':'auditor'},json={'version':v})).status_code,409)
  asyncio.run(run())
