import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { build } from 'esbuild'
import assert from 'node:assert/strict'
import { recalculateDerived } from './src/derivedMeasurements.js'

const root=process.cwd()
const source=await fs.readFile(path.join(root,'src/pages/FetalEchoReport.jsx'),'utf8')
const adultSource=await fs.readFile(path.join(root,'src/pages/AdultEchoReport.jsx'),'utf8')
const pediatricSource=await fs.readFile(path.join(root,'src/pages/PediatricEchoReport.jsx'),'utf8')
const start=source.indexOf('const initialReport = '),open=source.indexOf('{',start),end=source.indexOf('\n}',open)+2
let report=vm.runInNewContext('('+source.slice(open,end)+')')
function fill(node,trail=''){
 for(const [k,v] of Object.entries(node)){
  if(v&&typeof v==='object')fill(v,trail+'.'+k)
  else if(typeof v==='string')node[k]=/biometry|doppler|aortic/.test(trail)?'1.0':'Dummy entry'
 }
}
fill(report)
report.no_of_fetuses='1';report.ga_weeks='20';report.ga_days='0'
report.lmp={lmp_date:'2026-06-01',edd:'',et_date:''}
report.indication='DUMMY DATA — software review only'
report.impression={first_line:'DUMMY SAMPLE — NOT A CLINICAL REPORT',final_impression:'Sample text for layout review. No diagnosis or clinical interpretation.',primary_consultant:'Dummy consultant',second_consultant:'',internal_comments:'SECRET_INTERNAL_NOTE',system_impression:'UNUSED_SYSTEM_IMPRESSION',header_comments:'Dummy imaging-quality comment',footer_comments:'Dummy footer',disclaimer_comments:'DUMMY DISCLAIMER TEXT'}
report.preview_settings={report_type:'SECRET_PREVIEW_SETTING'}
report._legacy_findings='SECRET_LEGACY_FINDINGS'
// Formula-dependent Z-scores are deliberately absent from this requested first sample.
function omitZ(node){for(const [k,v] of Object.entries(node)){if(k.includes('z_score'))node[k]='';else if(v&&typeof v==='object')omitZ(v)}}omitZ(report)
report=recalculateDerived(report)
const entry=`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {ClinicalPreview} from './src/components/ClinicalWorkflow.jsx';export default renderToStaticMarkup(React.createElement(ClinicalPreview,{report:${JSON.stringify(report)},patient:{id:'dummy',patient_id:'DUMMY-ONLY',first_name:'Dummy',last_name:'Patient',age:'30',gender:'F',family_doctor:'WRONG_PATIENT_REFERRAL'},visit:{id:'DUMMY-VISIT',referral_doctor:'DUMMY REFERRAL INSTITUTE',visit_date:'2026-11-10'},status:'Dummy sample — not approved for clinical use',visitId:'DUMMY-VISIT',title:'Fetal Echocardiography',onClose:()=>{}}));`
const result=await build({stdin:{contents:entry,resolveDir:root,loader:'jsx'},bundle:true,platform:'node',format:'esm',jsx:'automatic',write:false,banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"},define:{'import.meta.env.VITE_API_URL':'"/api"'}})
const output=path.join(root,'test-output');await fs.mkdir(output,{recursive:true})
const modulePath=path.join(output,'preview-bundle.mjs');await fs.writeFile(modulePath,result.outputFiles[0].text)
const markup=(await import(modulePath+'?t='+Date.now())).default
assert(!markup.includes('SECRET_INTERNAL_NOTE'));assert(!markup.includes('UNUSED_SYSTEM_IMPRESSION'))
assert(!markup.includes('SECRET_PREVIEW_SETTING'));assert(!markup.includes('SECRET_LEGACY_FINDINGS'))
assert(markup.includes('DUMMY REFERRAL INSTITUTE'));assert(!markup.includes('WRONG_PATIENT_REFERRAL'))
assert(!markup.includes('SURYA'));assert(!markup.includes('1.05'))
assert(markup.indexOf('DUMMY-ONLY')<markup.indexOf('Fetal Echocardiography'))
assert(markup.indexOf('Fetal Echocardiography')<markup.indexOf('DUMMY DATA'))
assert(markup.includes('DUMMY DISCLAIMER TEXT'));assert(markup.includes('Primary consultant'));assert(!markup.includes('Secondary consultant'));assert(markup.includes('Dummy imaging-quality comment'));assert(markup.includes('Final impression'))
for (const [name, pageSource] of [['Adult', adultSource], ['Paediatric', pediatricSource], ['Fetal', source]]) {
  const seedMatch = pageSource.match(/const initialReport = (\{[\s\S]*?^\})/m)
  assert(seedMatch, `${name} report seed exists`)
  const seed = vm.runInNewContext(`(${seedMatch[1].replaceAll('defaultFinalImpression', "''").replaceAll('defaultReferralLetter', "''")})`)
  assert.equal(seed.impression?.final_impression || '', '', `${name} report starts without a generated impression`)
  const clinicalSeedText = JSON.stringify({ echo_details: seed.echo_details, biometry: seed.biometry, doppler: seed.doppler, m_mode_measurement: seed.m_mode_measurement, doppler_measurement: seed.doppler_measurement })
  assert(!/Dextrocardia|Concordant|Normal|Intact|Good|None|\"(?:[0-9]+(?:\\.[0-9]+)?)(?: mm| m\/sec| bpm|%)?\"/.test(clinicalSeedText), `${name} report starts without sample findings or measurements`)
}
for (const pageSource of [adultSource, pediatricSource, source]) {
  assert(!/Mr\. Ramesh Pandey|Master Reyansh Hegde|Mrs\. SURYA B|PAT000102|TM000060|TM000099|137 bpm|10\.2|10\.7|0\.9 m\/sec|NORMAL LV AND RV CONTRACTILITY|NO VALVAR REGURGITATION/.test(pageSource), 'report source has no fabricated patient or clinical fallback')
}
const assets=(await fs.readdir(path.join(root,'dist/assets'))).filter(f=>f.endsWith('.css'))
const styles=(await Promise.all(assets.map(f=>fs.readFile(path.join(root,'dist/assets',f),'utf8')))).join('\n')
const staticMarkup=markup.replace('<button class="primary-button">Print / Save PDF</button>','<button class="primary-button" onclick="window.print()">Print / Save PDF</button>').replace('<button class="secondary-button">Close preview</button>','<a class="secondary-button" href="/dashboard">Open application</a>')
const html='<!doctype html><html><head><meta charset="utf-8"><title>Dummy fetal sample — layout review only</title><style>'+styles+'</style></head><body>'+staticMarkup+'</body></html>'
await fs.writeFile(path.join(output,'fetal-sample.html'),html)
console.log('PASS: full dummy fetal sample renders; patient/title/indication order; entered quality comments; internal/system notes excluded; no invented fallback patient or ratio; no Z-score formulas.')
