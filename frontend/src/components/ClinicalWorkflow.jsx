import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'
import { createPortal } from 'react-dom'
import { CLINICAL_GROUPS } from '../reportValidation'
export { reportErrors } from '../reportValidation'

export function useDerivedDefinitions() {
  const [definitions,setDefinitions] = useState([])
  useEffect(()=>{api.get('/workflow/calculations').then(r=>setDefinitions(r.data.data || [])).catch(()=>setDefinitions([]))},[])
  return definitions
}
export function DerivedStatus({ report }) {
  const states=Object.entries(report._derived_status || {})
  if(!states.length)return null
  return <details className="no-print rounded-lg border bg-slate-50 p-3"><summary>Calculated measurement status — Pending Clinical Validation</summary><p className="my-2 text-sm">Calculated fields are read-only. Results require an approved formula and independently validated source inputs. Manual Z-scores remain editable; their reference and clinical validity require confirmation.</p>{states.map(([path,state])=><p className="text-sm" key={path}>{path.replaceAll('_',' ')}: {state.status}</p>)}</details>
}

export function currentUser() {
  try { return JSON.parse(sessionStorage.getItem('echoai_user') || localStorage.getItem('echoai_user') || '{}') } catch { return {} }
}
export function useCompletionConfirmation() {
  const [pending,setPending]=useState(false)
  const resolver=useRef(null)
  const answer=value=>{resolver.current?.(value);resolver.current=null;setPending(false)}
  useEffect(()=>()=>resolver.current?.(false),[])
  return {
    confirmCompletion:()=>resolver.current ? Promise.resolve(false) : new Promise(resolve=>{resolver.current=resolve;setPending(true)}),
    completionDialog:pending && <div className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-label="Complete clinical report" onKeyDown={event=>{if(event.key==='Escape')answer(false)}}><div className="max-w-lg rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold">Complete and lock this report?</h2><p className="my-4">Confirm that you have reviewed the patient, visit and report preview. Completion locks clinical changes. A correction workflow has not been approved.</p><div className="flex gap-3"><button autoFocus type="button" className="secondary-button" onClick={()=>answer(false)}>Cancel completion</button><button type="button" className="primary-button" onClick={()=>answer(true)}>Complete and lock</button></div></div></div>
  }
}
export function ApprovalControls({ report, updateReport }) {
  const role = currentUser().role
  const imp = report.impression || {}
  return <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 p-3">
    <span>Audit: {imp.audit_done ? `Done — ${imp.audited_by || ''}` : 'Pending'}</span>
    {['L2', 'L3'].includes(role) && <label><input type="checkbox" checked={Boolean(imp.audit_done)} onChange={e => updateReport(['impression', 'audit_done'], e.target.checked)} /> Auditing done</label>}
    {role === 'L3' && <label><input type="checkbox" checked={Boolean(imp.report_completed)} onChange={e => updateReport(['impression', 'report_completed'], e.target.checked)} /> Report completed</label>}
    {imp.report_completed && <span>Completed reports are read-only after saving.</span>}
  </div>
}
export function ClinicalFooter({ onSave, saving, locked, message, patientId, onBack, onNext }) {
  return <div className="no-print sticky bottom-0 z-20 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white p-3 shadow-lg">
    <button type="button" disabled={saving || locked} onClick={onSave} className="primary-button">{locked ? 'Report locked' : saving ? 'Saving…' : 'Save report'}</button>
    {onBack && <button type="button" disabled={saving} onClick={onBack} className="secondary-button">Back</button>}
    {onNext && !locked && <button type="button" disabled={saving} onClick={onNext} className="primary-button">Save & next</button>}
    {patientId && <a className="secondary-button" href={`/visits?patient=${encodeURIComponent(patientId)}`}>Patient visit history</a>}
    <span role="status" aria-live="polite">{message || 'Save your changes before moving to another section.'}</span>
  </div>
}
export function FindingNotes({ report, updateReport }) {
  const fields = []
  const walk = (node, path = ['echo_details']) => {
    for (const [key, value] of Object.entries(node || {})) {
      if (value && typeof value === 'object') walk(value, [...path, key])
      else if (typeof value === 'string' && !key.includes('comment')) fields.push({path:[...path,key],value})
    }
  }
  walk(report.echo_details)
  return <details className="no-print my-3 rounded-lg border bg-white p-3"><summary className="cursor-pointer font-semibold">Comments for individual findings</summary><div className="mt-3 grid gap-3 md:grid-cols-2">{fields.map(({path,value})=>{
    const key=path.at(-1), parent=path.slice(0,-1).reduce((n,k)=>n?.[k],report)
    const abnormal=value.trim().toLowerCase()==='abnormal'
    return <label className="field-label" key={path.join('.')}><span>{path.slice(1).map(label).join(' / ')}{abnormal?' — description required':''}</span><textarea className="field-control" rows={2} value={parent?.[key+'_comments'] || ''} onChange={e=>updateReport([...path.slice(0,-1),key+'_comments'],e.target.value)}/></label>
  })}</div></details>
}
export function useSavedNavigation(report) {
  const [saved, setSaved] = useState(JSON.stringify(report))
  const dirty = saved !== JSON.stringify(report)
  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => {
    if (!dirty) return
    const guardInternalLink = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
      let target
      try { target = new URL(anchor.getAttribute('href'), window.location.href) } catch { return }
      if (!['http:', 'https:'].includes(target.protocol) || target.origin !== window.location.origin) return
      if (target.pathname === window.location.pathname && target.search === window.location.search) return
      if (!window.confirm('Discard unsaved report changes?')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const guardPopState = () => {
      if (dirty && !window.confirm('Discard unsaved report changes?')) {
        window.history.pushState(null, '', window.location.href)
      }
    }
    document.addEventListener('click', guardInternalLink, true)
    window.addEventListener('popstate', guardPopState)
    return () => {
      document.removeEventListener('click', guardInternalLink, true)
      window.removeEventListener('popstate', guardPopState)
    }
  }, [dirty])
  return { dirty, markSaved: value => setSaved(JSON.stringify(value)), navigateSection: (action, showError, errors = []) => {
    if (errors.length) { showError('Cannot advance. ' + errors.join(' ')); return }
    if (dirty) { showError('Not saved. Save this section before opening another section.'); return }
    action()
  } }
}
const omit = new Set(['_derived_status', '_derived_legacy', 'impression', 'images', 'print_options', 'referral_letter', 'report_template', 'report_settings', 'template', 'scan_type', 'indication', 'tag', 'no_of_fetuses', 'ga_weeks', 'ga_days', 'lmp', 'iot'])
const populated = value => value && typeof value === 'object' ? Object.entries(value).some(([key,v])=>!key.endsWith('_enabled') && populated(v)) : value !== '' && value !== null && value !== undefined && value !== false
const label = key => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
function Values({ node }) {
  if (!node || typeof node !== 'object') return null
  return Object.entries(node).filter(([k,v]) => !k.endsWith('_enabled') && populated(v)).map(([k,v]) => typeof v === 'object'
    ? <section key={k} className="mb-3"><h3 className="font-semibold">{label(k)}</h3><Values node={v}/></section>
    : <div key={k} className="flex gap-3 border-b border-slate-100 py-1"><span className="w-1/2">{label(k)}</span><span>{v === true ? 'Yes' : String(v)}</span></div>)
}
export function ClinicalPreview({ report, patient, visitId, title, onClose, status='Draft / In Progress', visit: suppliedVisit }) {
  const [context, setContext] = useState({visit:null,error:'',loading:Boolean(visitId && !suppliedVisit)})
  useEffect(() => {
    let active=true
    if(suppliedVisit) { setContext({visit:suppliedVisit,error:'',loading:false}); return }
    if(!patient?.id || !visitId) {setContext({visit:null,error:'',loading:false});return}
    setContext({visit:null,error:'',loading:true})
    api.get(`/patients/${patient.id}/visits`).then(r=>{
      const visit=(r.data.data || []).find(v=>String(v.id)===String(visitId))
      if(active)setContext({visit:visit || null,error:visit?'':'Visit not found. Close preview and reload the report.',loading:false})
    }).catch(()=>{if(active)setContext({visit:null,error:'Unable to verify visit/referral details. Retry before printing.',loading:false})})
    return ()=>{active=false}
  }, [patient?.id, visitId, suppliedVisit])
  const visit=suppliedVisit || context.visit
  const content = <div className="fixed inset-0 z-50 overflow-auto bg-slate-800/90 p-4 clinical-preview">
    <div className="no-print mx-auto mb-3 flex max-w-4xl flex-wrap gap-3"><button disabled={context.loading || Boolean(context.error) || !patient} className="primary-button" onClick={() => window.print()}>Print / Save PDF</button><button className="secondary-button" onClick={onClose}>Close preview</button>{context.loading && <span className="text-white">Loading visit details…</span>}{context.error && <p role="alert" className="bg-white p-2 text-red-700">{context.error}</p>}</div>
    <article className="clinical-print mx-auto max-w-4xl bg-white p-10 text-slate-900">
      <header className="clinical-print-header mb-5 border-b pb-4"><h2 className="text-xl font-semibold">{[patient?.salutation, patient?.first_name, patient?.last_name].filter(Boolean).join(' ')}</h2><p>Patient ID: {patient?.patient_id || '—'} · {patient?.age ?? '—'} {patient?.age_unit || 'Years'} · {patient?.gender || '—'}</p><p>Visit: {visitId || '—'}{visit?.visit_date ? ` · Date: ${visit.visit_date}` : ''} · Referred by: {(visitId ? visit?.referral_doctor : patient?.family_doctor) || '—'}</p><p>Report status: {status}</p></header>
      <h1 className="mb-3 text-center text-2xl font-bold">{title}</h1><p className="mb-5"><strong>Indication: </strong>{report.indication || '—'}</p>
      {report.impression?.first_line && <p className="mb-3 whitespace-pre-wrap">{report.impression.first_line}</p>}
      {report.impression?.header_comments && <p className="mb-3 whitespace-pre-wrap">{report.impression.header_comments}</p>}
      {report.lmp && <section className="mb-4"><h2 className="font-bold">Fetal profile</h2><p>LMP: {report.lmp.lmp_date || '—'} · EDD: {report.lmp.edd || '—'}{typeof report.lmp.et_date === 'string' && report.lmp.et_date ? ` · Embryo transfer: ${report.lmp.et_date}` : ''}</p><p>Number of fetuses: {report.no_of_fetuses || '—'}{report.ga_weeks ? ` · Gestation: ${report.ga_weeks} weeks ${report.ga_days || '0'} days` : ''}</p></section>}
      {Object.entries(report).filter(([k,v]) => CLINICAL_GROUPS.includes(k) && populated(v)).map(([k,v]) => <section key={k} className="mb-5"><h2 className="border-b text-lg font-bold">{label(k)}</h2><Values node={v}/></section>)}
      {report.impression?.final_impression && <section className="mb-4"><h2 className="font-bold">Final impression</h2><p className="whitespace-pre-wrap">{report.impression.final_impression}</p></section>}
      {report.impression?.footer_comments && <p className="whitespace-pre-wrap">{report.impression.footer_comments}</p>}
      {report.impression?.disclaimer_comments && <section className="mt-5 whitespace-pre-wrap"><h2 className="font-bold">Disclaimer</h2><p>{report.impression.disclaimer_comments}</p></section>}
      <footer className="mt-8 flex flex-wrap justify-between gap-6"><div>{report.impression?.primary_consultant && <><p className="text-sm">Primary consultant</p><p>{report.impression.primary_consultant}</p></>}</div>{report.impression?.second_consultant && <div><p className="text-sm">Secondary consultant</p><p>{report.impression.second_consultant}</p></div>}</footer>
    </article>
  </div>
  // Print content must not inherit an editor's no-print/overflow container.
  return typeof document === 'undefined' ? content : createPortal(content,document.body)
}
export function WorkflowUsers() {
  const [users,setUsers] = useState([]), [message,setMessage] = useState('')
  const [form,setForm] = useState({username:'',name:'',role:'L1',password:''})
  const load = () => api.get('/workflow/users').then(r=>setUsers(r.data.data || [])).catch(()=>setMessage('Unable to load workflow users.'))
  useEffect(()=>{if(currentUser().role==='L3')load()},[])
  if(currentUser().role!=='L3')return null
  return <section className="rounded-xl border bg-white p-4"><h2 className="text-lg font-semibold">Clinical workflow access</h2><p className="text-sm">L1: entry · L2: entry and audit · L3: entry, audit and final completion</p><form onSubmit={async e=>{e.preventDefault();try{await api.post('/workflow/users',form);setForm({username:'',name:'',role:'L1',password:''});setMessage('User created.');load()}catch(err){setMessage(err.response?.data?.detail || 'Unable to create user.')}}} className="my-3 grid gap-2 md:grid-cols-5">{['name','username','password'].map(k=><input key={k} required minLength={k==='password'?12:1} type={k==='password'?'password':'text'} className="field-control" placeholder={k==='password'?'Password (12+ characters)':label(k)} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>)}<select className="field-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{['L1','L2','L3'].map(r=><option key={r}>{r}</option>)}</select><button className="primary-button">Create user</button></form><p role="status">{message}</p>{users.map(u=><p key={u.username}>{u.name} · {u.username} · {u.role}</p>)}</section>
}
