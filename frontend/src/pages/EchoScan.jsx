import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { scanService } from '../api/scanService'
const routes = {'Adult Echo':'adult-echo-report','Fetal Echo':'fetal-echo-report','Pediatric Echo':'pediatric-echo-report'}
export default function EchoScan() {
 const {scanId} = useParams(); const [params] = useSearchParams(); const [scan,setScan] = useState(null); const [error,setError] = useState(''); const [loading,setLoading]=useState(true)
 const patientParam=params.get('patient') || params.get('patientId'), visitParam=params.get('visit') || params.get('visitId')
 useEffect(()=>{
   setLoading(true)
   const request=scanId?scanService.getScan(scanId):patientParam&&visitParam?scanService.getScansByPatient(patientParam).then(r=>({data:(r.data || []).find(s=>String(s.visit_id)===String(visitParam))})):Promise.resolve({data:null})
   request.then(r=>setScan(r.data)).catch(()=>setError('Unable to load study.')).finally(()=>setLoading(false))
 },[scanId,patientParam,visitParam])
 if(error)return <p role="alert">{error}</p>
 if(loading)return <p>Loading study…</p>
 const type=scan?.scan_type || params.get('type');const patient=scan?.patient_id || params.get('patient') || params.get('patientId');const visit=scan?.visit_id || params.get('visit') || params.get('visitId')
 if(type === 'Ultrasound')return <div><h2>Ultrasound</h2><p>Visit recorded. The detailed clinical report template awaits confirmation.</p><a href={'/visits?patient='+encodeURIComponent(patient || '')}>Return to patient visits</a></div>
 if(!type||!routes[type])return <Navigate to={patient ? '/visits?patient='+patient : '/visits'} replace />
 return <Navigate to={'/'+routes[type]+(scan?.id?'/'+scan.id:'')+'?patientId='+encodeURIComponent(patient||'')+'&visitId='+encodeURIComponent(visit||'')} replace />
}
