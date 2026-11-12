// Structural checks only. No clinical equations, reference ranges or thresholds.
export const REPORT_TITLES = { 'Adult Echo':'Adult Echocardiography', 'Pediatric Echo':'Paediatric Echocardiography', 'Fetal Echo':'Fetal Echocardiography', 'Ultrasound':'Ultrasound' }
export const CLINICAL_GROUPS = ['echo_details','biometry','doppler','aortic','two_d_measurement','m_mode_measurement','doppler_measurement','pisa_measurement']
export function reportSaveError(error) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (!error?.response || error.response.status >= 500) return 'Save could not be confirmed. Your entries are still on this page. Retry saving before leaving; the server may already have received the report.'
  return 'The report could not be saved. Review the entered details and retry.'
}
export function blankReport(template) {
  const report=structuredClone(template)
  const blank=node=>{for(const [key,value] of Object.entries(node)) {
    if(value && typeof value==='object')blank(value)
    else if(!key.endsWith('_enabled'))node[key]=typeof value==='boolean'?false:''
  }}
  for(const key of CLINICAL_GROUPS)if(report[key])blank(report[key])
  if(report.impression) {
    for(const key of ['final_impression','disclaimer_comments','system_impression','recommendation'])report.impression[key]=''
  }
  return report
}
export function mergeReport(template, saved) {
  const result=structuredClone(template)
  for(const [key,value] of Object.entries(saved || {})) {
    if(value && typeof value==='object' && !Array.isArray(value))result[key]=mergeReport(result[key] && typeof result[key]==='object'?result[key]:{},value)
    else if(value!==null && value!==undefined)result[key]=value
  }
  return result
}
export function reportErrors(report, fetal=false, completing=false, progressing=false) {
  const errors=[]
  if((completing || progressing) && !String(report.indication || '').trim())errors.push('Enter an indication.')
  if(fetal) {
    const dating=report.lmp || {}
    if((completing || progressing) && ![dating.lmp_date,dating.edd,dating.et_date].some(v=>typeof v==='string' && v.trim()))errors.push('Enter LMP, EDD or embryo transfer date.')
    for(const value of [dating.lmp_date,dating.edd,dating.et_date])if(value && (typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value))errors.push('Enter valid LMP, EDD or transfer dates.')
    const today = new Date().toISOString().slice(0,10)
    if(dating.lmp_date && dating.lmp_date > today)errors.push('LMP cannot be in the future.')
    if(dating.et_date && dating.et_date > today)errors.push('Embryo transfer date cannot be in the future.')
    const count=String(report.no_of_fetuses || '')
    if(((completing || progressing) || count) && (!/^\d+$/.test(count) || Number(count)<1))errors.push('Enter the number of fetuses as a positive whole number.')
  }
  const walk=node=>{for(const [key,value] of Object.entries(node || {})) {
    if(value && typeof value==='object')walk(value)
    else if(typeof value==='string' && value.trim().toLowerCase()==='abnormal' && !String(node[key+'_comments'] || '').trim())errors.push('Describe abnormal finding: '+key.replaceAll('_',' ')+'.')
  }}
  walk(report.echo_details)
  if(completing && !String(report.impression?.primary_consultant || '').trim())errors.push('Primary consultant is required for completion.')
  if(completing && !String(report.impression?.final_impression || '').trim())errors.push('Final impression is required for completion.')
  if(completing && !String(report.impression?.header_comments || '').trim())errors.push('Header comments are required for completion.')
  if(completing && !String(report.impression?.disclaimer_comments || '').trim())errors.push('Disclaimer comments are required for completion.')
  return [...new Set(errors)]
}
