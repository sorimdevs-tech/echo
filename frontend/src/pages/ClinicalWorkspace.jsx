import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileDown, FileText, Film, Mail, Plus, Printer, Save, Trash2, Upload } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Field, FieldGrid, Section, Tabs, Workspace } from '../components/WorkspaceUI'
import { patientService } from '../api/patientService'
import { referralDoctorService } from '../api/referralDoctorService'
import { workspaceService } from '../api/workspaceService'
import {
  adult2D, adultDoppler, aortic, echoSections, fetalBiometry, fetalDoppler, impressionFields,
  lmpFields, mMode, pediatricBiometry, pediatricDoppler, pisa,
} from '../data/clinicalFields'

const tabsByType = {
  'Adult Echo': ['Echo details', '2D measurements', 'M-Mode', 'Doppler', 'PISA', 'Aortic Stenosis', 'Impression', 'Multiframes', 'Referral letter', 'Preview'],
  'Pediatric Echo': ['Echo details', 'Biometry', 'Doppler', 'Custom measurements', 'Impression', 'Multiframes', 'Preview'],
  'Fetal Echo': ['LMP details', 'Echo details', 'Aortic', 'Biometry', 'Doppler', 'Impression', 'Multiframes', 'Preview'],
}

const formatFields = [
  {key:'imageColumns',label:'Images per row',type:'select',options:['1','2','3','4']},
  {key:'imageWidth',label:'Image width',type:'number'}, {key:'imageHeight',label:'Image height',type:'number'},
  {key:'imageRows',label:'Image rows',type:'select',options:['1','2','3','4']},
  {key:'investigationStatus',label:'Investigation status',type:'select',options:['Draft','In progress','Completed']},
]

const emptyData = () => ({ imageColumns:'1', imageWidth:'600', imageHeight:'450', imageRows:'2', investigationStatus:'Draft', customMeasurements:[{name:'',value:'',unit:'mm'}], clips:[] })

export default function ClinicalWorkspace({ initialType = 'Adult Echo' }) {
  const [params, setParams] = useSearchParams()
  const [scanType, setScanType] = useState(params.get('type') || initialType)
  const [activeTab, setActiveTab] = useState(tabsByType[params.get('type') || initialType][0])
  const [data, setData] = useState(emptyData)
  const [reportId, setReportId] = useState('')
  const [patients, setPatients] = useState([])
  const [visits, setVisits] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patientId, setPatientId] = useState(params.get('patient') || '')
  const [visitId, setVisitId] = useState(params.get('visit') || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [clips, setClips] = useState([])

  useEffect(() => {
    Promise.all([patientService.getPatients(), referralDoctorService.getReferralDoctors()])
      .then(([p, d]) => { setPatients(p.data || []); setDoctors(d.data || []) })
      .catch(() => { setPatients([]); setDoctors([]) })
  }, [])

  useEffect(() => {
    if (!patientId) { setVisits([]); setVisitId(''); return }
    patientService.getVisits(patientId).then((result) => setVisits(result.data || [])).catch(() => setVisits([]))
  }, [patientId])

  useEffect(() => {
    setSaved(false)
    workspaceService.getReports({ patient_id: patientId || undefined, visit_id: visitId || undefined })
      .then((result) => {
        const match = (result.data || []).find((report) => report.scan_type === scanType)
        if (match) { setReportId(match.id); setData({...emptyData(), ...(match.data || {}), investigationStatus:match.status || match.data?.investigationStatus || 'Draft'}) }
        else { setReportId(''); setData(emptyData()) }
      }).catch(() => { setReportId(''); setData(emptyData()) })
  }, [patientId, visitId, scanType])

  const patient = patients.find((item) => item.id === patientId)
  const changeType = (type) => { setScanType(type); setActiveTab(tabsByType[type][0]); setParams((current) => { current.set('type', type); return current }) }

  const calculated = useMemo(() => {
    const next = {}
    const weight = Number(data.weight), height = Number(data.height)
    if (weight && height) next.bsa = Math.sqrt((weight * height) / 3600).toFixed(2)
    const lvedd = Number(data.lvedd), lvesd = Number(data.lvesd)
    if (lvedd && lvesd) next.fractionalShortening = (((lvedd - lvesd) / lvedd) * 100).toFixed(1)
    const av = Number(data.avVmax || data.aorticValveVmax)
    if (av) next.avPeakGrad = (4 * av * av).toFixed(1)
    const tr = Number(data.trVmax)
    if (tr) next.rvsp = (4 * tr * tr + Number(data.rap || 3)).toFixed(1)
    return next
  }, [data.weight, data.height, data.lvedd, data.lvesd, data.avVmax, data.aorticValveVmax, data.trVmax, data.rap])

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      const fullData = {...data, ...calculated}
      const payload = { patient_id:patientId, patient_display_id:patient?.patient_id || '', patient_name:patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : '', visit_id:visitId, scan_type:scanType, status:fullData.investigationStatus || 'Draft', data:fullData }
      const result = reportId ? await workspaceService.updateReport(reportId, payload) : await workspaceService.createReport(payload)
      setReportId(result.data.id); setData(fullData); setSaved(true)
    } finally { setSaving(false) }
  }

  const addFiles = (event) => setClips((current) => [...current, ...[...event.target.files].map((file) => ({name:file.name,url:URL.createObjectURL(file),size:file.size}))])
  const fields = activeTab === '2D measurements' ? adult2D : activeTab === 'M-Mode' ? mMode : activeTab === 'PISA' ? pisa : activeTab === 'Aortic' || activeTab === 'Aortic Stenosis' ? aortic : activeTab === 'Biometry' ? (scanType === 'Fetal Echo' ? fetalBiometry : pediatricBiometry) : activeTab === 'Doppler' ? (scanType === 'Adult Echo' ? adultDoppler : scanType === 'Fetal Echo' ? fetalDoppler : pediatricDoppler) : []

  return <Workspace title={`${scanType} reporting`} description="Patient-linked measurements, images, impression, referral letter and report output." actions={<><select className="field-control w-44" value={scanType} onChange={(e)=>changeType(e.target.value)}>{Object.keys(tabsByType).map((type)=><option key={type}>{type}</option>)}</select><button className="primary-button" onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving?'Saving…':'Save report'}</button>{saved&&<span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4"/>Saved to database</span>}</>}>
    <Section title="Patient and visit" className="mb-4"><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><label className="field-label"><span>Patient</span><select className="field-control" value={patientId} onChange={(e)=>{setPatientId(e.target.value);setVisitId('')}}><option value="">Select</option>{patients.map((item)=><option key={item.id} value={item.id}>{item.patient_id} — {item.first_name} {item.last_name}</option>)}</select></label><label className="field-label"><span>Visit</span><select className="field-control" value={visitId} onChange={(e)=>setVisitId(e.target.value)}><option value="">Select</option>{visits.map((visit)=><option key={visit.id} value={visit.id}>{visit.visit_date ? new Date(visit.visit_date).toLocaleString() : visit.id}</option>)}</select></label><Field label="Report title" value={data.reportTitle} onChange={(value)=>setData({...data,reportTitle:value})}/><Field label="Indication" value={data.indication} onChange={(value)=>setData({...data,indication:value})}/></div></Section>
    <FieldGrid columns="lg:grid-cols-5" fields={formatFields} data={data} setData={setData}/>
    <div className="mt-4"><Tabs items={tabsByType[scanType]} value={activeTab} onChange={setActiveTab}/></div>

    {activeTab==='LMP details'&&<Section title="Pregnancy dating"><FieldGrid fields={lmpFields.map((field)=>({...field,type:['lmp','edd','etDate','btDate'].includes(field.key)?'date':field.type}))} data={data} setData={setData}/></Section>}
    {activeTab==='Echo details'&&<div className="space-y-4">{echoSections.map((section)=><Section key={section.title} title={section.title}><FindingGrid fields={section.fields} data={data} setData={setData}/></Section>)}<Section title="Additional details"><div className="grid gap-3 lg:grid-cols-2"><Field type="textarea" rows={8} label="Additional comments" value={data.comments} onChange={(value)=>setData({...data,comments:value})}/><Field type="textarea" rows={8} label="Default normal comments" value={data.normalComments} onChange={(value)=>setData({...data,normalComments:value})}/></div></Section></div>}
    {fields.length>0&&<Section title={activeTab} description="All blank measurements are omitted from the final report. Calculated fields update when their source measurements are entered.">{scanType!=='Adult Echo'&&['Biometry','Aortic'].includes(activeTab)?<ZScoreGrid fields={fields} data={{...data,...calculated}} setData={setData}/>:<FieldGrid fields={fields} data={{...data,...calculated}} setData={setData}/>} {Object.keys(calculated).length>0&&<div className="mt-4 rounded-lg bg-primary-50 p-3 text-sm text-primary-800">Calculated: {Object.entries(calculated).map(([key,value])=><span className="mr-4" key={key}><strong>{key.replace(/([A-Z])/g,' $1')}:</strong> {value}</span>)}</div>}</Section>}
    {activeTab==='Custom measurements'&&<CustomMeasurements data={data} setData={setData}/>} 
    {activeTab==='Impression'&&<Impression data={data} setData={setData} doctors={doctors}/>} 
    {activeTab==='Referral letter'&&<ReferralLetter data={data} setData={setData} doctors={doctors} patient={patient}/>} 
    {activeTab==='Multiframes'&&<Multiframes clips={clips} setClips={setClips} addFiles={addFiles}/>} 
    {activeTab==='Preview'&&<ReportPreview scanType={scanType} data={{...data,...calculated}} setData={setData} patient={patient}/>} 
  </Workspace>
}

function FindingGrid({fields,data,setData}) { return <div className="grid gap-3 lg:grid-cols-2">{fields.map((field)=><div key={field.key} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-2"><Field label={field.label} type={field.type} options={field.options} addable={field.addable} optionField={field.key} value={data[field.key]} onChange={(value)=>setData({...data,[field.key]:value})}/><Field label={`${field.label} comments`} value={data[`${field.key}Comment`]} onChange={(value)=>setData({...data,[`${field.key}Comment`]:value})}/></div>)}</div> }

function ZScoreGrid({fields,data,setData}) { return <div className="grid gap-3 lg:grid-cols-2">{fields.map((field)=><div key={field.key} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_140px]"><Field label={field.label} type={field.type} options={field.options} addable={field.addable} value={data[field.key]} onChange={(value)=>setData({...data,[field.key]:value})}/><Field label="Z-score" type="number" value={data[`${field.key}ZScore`]} onChange={(value)=>setData({...data,[`${field.key}ZScore`]:value})}/></div>)}</div> }

function CustomMeasurements({data,setData}) {
  const rows=data.customMeasurements||[]
  const update=(index,key,value)=>setData({...data,customMeasurements:rows.map((row,i)=>i===index?{...row,[key]:value}:row)})
  return <Section title="Custom measurements"><div className="space-y-2">{rows.map((row,index)=><div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_140px_1fr_auto]"><input className="field-control" placeholder="Measurement name" value={row.name} onChange={(e)=>update(index,'name',e.target.value)}/><input className="field-control" placeholder="Value" value={row.value} onChange={(e)=>update(index,'value',e.target.value)}/><select className="field-control" value={row.unit} onChange={(e)=>update(index,'unit',e.target.value)}>{['mm','cm','m/s','cm/s','mmHg','%','ms'].map((unit)=><option key={unit}>{unit}</option>)}</select><input className="field-control" placeholder="Z-score / comment" value={row.comment||''} onChange={(e)=>update(index,'comment',e.target.value)}/><button className="secondary-button" onClick={()=>setData({...data,customMeasurements:rows.filter((_,i)=>i!==index)})}><Trash2 className="h-4 w-4"/></button></div>)}</div><button className="secondary-button mt-3" onClick={()=>setData({...data,customMeasurements:[...rows,{name:'',value:'',unit:'mm',comment:''}]})}><Plus className="h-4 w-4"/>Add measurement</button></Section>
}

function Impression({data,setData,doctors}) {
  const names=doctors.map((doctor)=>doctor.doctor_type==='hospital'?doctor.institution_name:`${doctor.first_name||''} ${doctor.last_name||''}`.trim()).filter(Boolean)
  return <div className="space-y-4"><Section title="Report details"><FieldGrid fields={impressionFields.map((field)=>['signedByLeft','signedByRight','primaryConsultant','secondConsultant','auditedBy','typedBy'].includes(field.key)?{...field,type:'select',options:names,addable:true}:field)} data={data} setData={setData}/><div className="mt-3 grid gap-3 sm:grid-cols-3"><Field label="Abnormal" type="checkbox" value={data.abnormal} onChange={(value)=>setData({...data,abnormal:value})}/><Field label="Ambiguity" type="checkbox" value={data.ambiguity} onChange={(value)=>setData({...data,ambiguity:value})}/><Field label="Growth abnormality" type="checkbox" value={data.growthAbnormality} onChange={(value)=>setData({...data,growthAbnormality:value})}/></div></Section><div className="grid gap-4 lg:grid-cols-2"><Section title="Comments"><Field type="textarea" rows={5} label="Header comments" value={data.headerComments} onChange={(value)=>setData({...data,headerComments:value})}/><div className="mt-3"><Field type="textarea" rows={5} label="Footer comments" value={data.footerComments} onChange={(value)=>setData({...data,footerComments:value})}/></div><div className="mt-3"><Field type="textarea" rows={5} label="System impression" value={data.systemImpression} onChange={(value)=>setData({...data,systemImpression:value})}/></div></Section><Section title="Finalisation"><Field type="textarea" rows={8} label="Final impression" value={data.impression} onChange={(value)=>setData({...data,impression:value})}/><div className="mt-3"><Field type="textarea" rows={4} label="Recommendations" value={data.recommendations} onChange={(value)=>setData({...data,recommendations:value})}/></div><div className="mt-3"><Field type="textarea" rows={4} label="Disclaimer comments" value={data.disclaimer} onChange={(value)=>setData({...data,disclaimer:value})}/></div><div className="mt-3"><Field type="textarea" rows={4} label="Internal comments (not printed)" value={data.internalComments} onChange={(value)=>setData({...data,internalComments:value})}/></div><div className="mt-3"><Field label="Report completed" type="checkbox" value={data.reportCompleted} onChange={(value)=>setData({...data,reportCompleted:value,investigationStatus:value?'Completed':data.investigationStatus})}/></div></Section></div></div>
}

function ReferralLetter({data,setData,doctors,patient}) {
  const names=doctors.map((doctor)=>doctor.doctor_type==='hospital'?doctor.institution_name:`${doctor.first_name||''} ${doctor.last_name||''}`.trim()).filter(Boolean)
  const createLetter=()=>setData({...data,letter:`Dear Doctor,\n\nThank you for referring ${patient?`${patient.salutation||''} ${patient.first_name||''} ${patient.last_name||''}`.trim():'the patient'}.\n\n${data.impression||''}\n\nThank you,\n${data.signedByRight||data.signedByLeft||''}`})
  return <Section title="Referral letter"><div className="grid gap-4 lg:grid-cols-[280px_1fr]"><div className="space-y-3"><Field label="Letter name" value={data.letterName} onChange={(value)=>setData({...data,letterName:value})}/><Field label="To" type="select" options={names} addable value={data.recipient} onChange={(value)=>setData({...data,recipient:value})}/><Field label="Letter copy to" type="select" options={names} addable value={data.copyTo} onChange={(value)=>setData({...data,copyTo:value})}/><Field label="Subject" value={data.subject} onChange={(value)=>setData({...data,subject:value})}/><button className="secondary-button" onClick={createLetter}><FileText className="h-4 w-4"/>Generate letter text</button></div><Field type="textarea" rows={18} label="Letter body" value={data.letter} onChange={(value)=>setData({...data,letter:value})}/></div></Section>
}

function Multiframes({clips,setClips,addFiles}) { return <Section title="Multiframe cine viewer" description="Import, play, review and remove study clips."><label className="primary-button mb-4 cursor-pointer"><Upload className="h-4 w-4"/>Import cine clips<input type="file" accept="video/*" multiple className="hidden" onChange={addFiles}/></label>{clips.length?<div className="grid gap-4 lg:grid-cols-2">{clips.map((clip,index)=><div key={`${clip.name}-${index}`} className="rounded-xl bg-slate-950 p-3"><video src={clip.url} controls className="aspect-video w-full"/><div className="mt-2 flex items-center justify-between text-sm text-white"><span className="flex items-center gap-2"><Film className="h-4 w-4"/>{clip.name}</span><button onClick={()=>setClips(clips.filter((_,i)=>i!==index))} className="rounded p-1 text-red-300"><Trash2 className="h-4 w-4"/></button></div></div>)}</div>:<div className="flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500"><Film className="mb-3 h-12 w-12 text-slate-300"/>No multiframe clips imported.</div>}</Section> }

function ReportPreview({scanType,data,setData,patient}) {
  const options=[{key:'reportType',label:'Report type',type:'select',options:['Report only','Report with images','With biometry graphs']},{key:'preprinted',label:'Preprinted stationery',type:'checkbox'},{key:'showLogo',label:'Logo',type:'checkbox'},{key:'showAlias',label:'Alias ID',type:'checkbox'},{key:'hideSectionTitles',label:'Hide section titles',type:'checkbox'},{key:'reportBorder',label:'Report border',type:'checkbox'},{key:'imageBorder',label:'Image border',type:'checkbox'},{key:'leftMargin',label:'Left margin',type:'number'},{key:'topMargin',label:'Top margin',type:'number'},{key:'lineSpacing',label:'Report line spacing',type:'number'},{key:'sectionSpacing',label:'Section spacing',type:'number'},{key:'landscape',label:'Landscape',type:'checkbox'},{key:'blackBackground',label:'Black image background',type:'checkbox'},{key:'footerLine',label:'Footer line',type:'checkbox'},{key:'pageNumberDate',label:'Page number and date',type:'checkbox'},{key:'printFooterText',label:'Print footer text',type:'checkbox'}]
  const entries=Object.entries(data).filter(([key,value])=>value!==''&&value!==false&&!['customMeasurements'].includes(key)&&typeof value!=='object').slice(0,90)
  return <div className="grid gap-4 xl:grid-cols-[340px_1fr]"><Section title="Report layout and print options"><FieldGrid columns="lg:grid-cols-2" fields={options} data={data} setData={setData}/><p className="mt-3 text-xs text-slate-500">Layout choices are saved with the report when Save report is selected.</p></Section><div className="rounded border border-slate-300 bg-white p-8 shadow-lg"><div className="mb-6 flex justify-between border-b-2 border-primary-600 pb-4"><div><p className="text-sm font-semibold text-primary-700">{data.companyName||'CardioEcho AI'}</p><h2 className="text-2xl font-bold">{data.reportTitle||`${scanType} Report`}</h2></div><div className="flex gap-2 print:hidden"><button onClick={()=>window.print()} className="secondary-button"><Printer className="h-4 w-4"/>Print</button><button onClick={()=>window.print()} className="secondary-button"><FileDown className="h-4 w-4"/>PDF</button><button onClick={()=>window.location.href=`mailto:?subject=${encodeURIComponent(data.reportTitle||scanType)}`} className="secondary-button"><Mail className="h-4 w-4"/>Mail</button></div></div><div className="grid gap-2 sm:grid-cols-2"><p><strong>Patient:</strong> {patient?`${patient.first_name||''} ${patient.last_name||''}`:'—'}</p><p><strong>Patient ID:</strong> {patient?.patient_id||'—'}</p></div><div className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">{entries.map(([key,value])=><div className="flex justify-between gap-3 border-b border-slate-100 py-1 text-sm" key={key}><span className="capitalize text-slate-500">{key.replace(/([A-Z])/g,' $1')}</span><span className="text-right font-medium">{String(value)}</span></div>)}</div>{data.impression&&<div className="mt-7"><h3 className="font-semibold">Final impression</h3><p className="mt-2 whitespace-pre-wrap text-sm">{data.impression}</p></div>}{data.disclaimer&&<p className="mt-8 border-t pt-3 text-xs text-slate-500">{data.disclaimer}</p>}</div></div>
}
