import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { scanService } from '../api/scanService'
import { patientService } from '../api/patientService'
import { Save } from 'lucide-react'

const routes = { 'Adult Echo':'adult-echo-report', 'Fetal Echo':'fetal-echo-report', 'Pediatric Echo':'pediatric-echo-report' }
const blank = { indication:'', findings:'', measurements:'', impression:'', additional_comments:'' }
export default function EchoScan() {
  const { scanId } = useParams(); const [params] = useSearchParams(); const navigate = useNavigate()
  const [scan,setScan] = useState(null); const [patientRecord,setPatientRecord] = useState(null); const [report,setReport] = useState(blank); const [error,setError] = useState(''); const [loading,setLoading] = useState(true); const [saving,setSaving] = useState(false); const [message,setMessage] = useState('')
  const patientParam=params.get('patient') || params.get('patientId'), visitParam=params.get('visit') || params.get('visitId')
  useEffect(()=>{
    let active=true
    const request=scanId?scanService.getScan(scanId):patientParam&&visitParam?scanService.getScansByPatient(patientParam).then(r=>({data:(r.data || []).find(s=>String(s.visit_id)===String(visitParam))})):Promise.resolve({data:null})
    request.then(async r=>{
      if(!active)return
      setScan(r.data)
      if(r.data?.findings){try{const parsed=JSON.parse(r.data.findings);setReport({...blank,...(parsed.ultrasound_report||{})})}catch{setReport({...blank,findings:r.data.findings})}}
      const pid=r.data?.patient_id || patientParam
      if(pid){const p=await patientService.getPatient(pid);if(active)setPatientRecord(p.data)}
    }).catch(()=>{if(active)setError('Unable to load ultrasound visit.')}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[scanId,patientParam,visitParam])
  const scanType=scan?.scan_type || params.get('type'); const patient=scan?.patient_id || patientParam; const visit=scan?.visit_id || visitParam
  const title='Ultrasound'
  const set=(key,value)=>setReport(current=>({...current,[key]:value}))
  const save=async()=>{
    if(!scan?.id){setError('The ultrasound visit does not have a saved report record. Return to Visits and use Save & Go to Reporting.');return}
    setSaving(true);setError('');setMessage('')
    try{const result=await scanService.updateScan(scan.id,{patient_id:scan.patient_id,patient_display_id:patientRecord?.patient_id,visit_id:scan.visit_id,scan_type:'Ultrasound',scan_date:scan.scan_date,findings:JSON.stringify({ultrasound_report:report}),conclusion:report.impression,indication:report.indication,status:'In Progress'});setScan(result.data);setMessage('Ultrasound report saved as In Progress.')}
    catch(e){setError(e.response?.data?.detail || 'Unable to save ultrasound report.')}
    finally{setSaving(false)}
  }
  if(error && loading)return <p role="alert">{error}</p>
  if(loading)return <p>Loading ultrasound visit…</p>
  if(scanType && scanType!=='Ultrasound' && routes[scanType])return <Navigate to={'/'+routes[scanType]+(scan?.id?'/'+scan.id:'')+'?patientId='+encodeURIComponent(patient||'')+'&visitId='+encodeURIComponent(visit||'')} replace />
  if(scanType!=='Ultrasound')return <Navigate to={patient ? '/visits?patient='+encodeURIComponent(patient) : '/visits'} replace />
  const name=[patientRecord?.salutation,patientRecord?.first_name,patientRecord?.last_name].filter(Boolean).join(' ')
  return <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4"><div><h1 className="text-xl font-semibold">Ultrasound reporting</h1><p className="text-sm text-slate-500">Patient-linked ultrasound findings and impression.</p></div><button type="button" onClick={save} disabled={saving} className="primary-button"><Save className="h-4 w-4"/>{saving?'Saving…':'Save report'}</button></header>
    <section className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-3"><label className="field-label">Patient<input className="field-control" readOnly value={`${patientRecord?.patient_id || ''} — ${name}`}/></label><label className="field-label">Visit<input className="field-control" readOnly value={scan?.scan_date || visit || ''}/></label><label className="field-label">Report title<input className="field-control" readOnly value={title}/></label></section>
    <label className="field-label">Indication<input className="field-control" value={report.indication} onChange={e=>set('indication',e.target.value)}/></label>
    <label className="field-label">Findings<textarea className="field-control min-h-36" value={report.findings} onChange={e=>set('findings',e.target.value)}/></label>
    <label className="field-label">Measurements<textarea className="field-control min-h-24" value={report.measurements} onChange={e=>set('measurements',e.target.value)}/></label>
    <label className="field-label">Impression<textarea className="field-control min-h-28" value={report.impression} onChange={e=>set('impression',e.target.value)}/></label>
    <label className="field-label">Additional comments<textarea className="field-control min-h-20" value={report.additional_comments} onChange={e=>set('additional_comments',e.target.value)}/></label>
    <p aria-live="polite" className="text-sm text-teal-700">{message}</p>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    <button type="button" className="secondary-button" onClick={()=>navigate(`/visits?patient=${encodeURIComponent(patient||'')}`)}>Back to visits</button>
  </div>
}
