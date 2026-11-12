import { test, expect } from '@playwright/test'
import { login, loadFixture } from './fixture.js'

const routes = {'Fetal Echo':'fetal-echo-report','Adult Echo':'adult-echo-report','Pediatric Echo':'pediatric-echo-report'}
let info
test.beforeAll(async()=>{info=await loadFixture()})

async function study(request,type) {
  await request.post('/api/auth/login',{data:{username:'dr.shanthi',password:info.password}})
  const patient=(await (await request.post('/api/patients',{data:{patient_id:`SYNTH-${Date.now()}-${Math.random().toString(36).slice(2)}`,first_name:'Dummy',last_name:'Engineering',age:'30',gender:'F',street:'Synthetic address',state:'Tamil Nadu',country:'India',phone1:'1234567890',family_doctor:'Self'}})).json()).data
  const visit=(await (await request.post(`/api/patients/${patient.id}/visits`,{data:{scan_type:type,visit_date:'2026-11-11T09:00',referral_doctor:'SYNTHETIC VISIT REFERRAL'}})).json()).data
  const key={'Fetal Echo':'fetal_echo_report','Adult Echo':'adult_echo_report','Pediatric Echo':'pediatric_echo_report'}[type]
  const report={indication:'DUMMY SOFTWARE TEST',impression:{header_comments:'DUMMY SAMPLE - NOT FOR CLINICAL USE',disclaimer_comments:'Synthetic disclaimer only.',primary_consultant:'Dummy Consultant',second_consultant:'Dummy Second Consultant',final_impression:'Synthetic layout test; no clinical interpretation.',internal_comments:'INTERNAL-SECRET-NOTE',audit_done:false,report_completed:false}}
  if(type==='Fetal Echo')Object.assign(report,{no_of_fetuses:'1',lmp:{lmp_date:'2026-06-01'},aortic:{aortic_valve:{z_score:'1.23'}}})
  const scan=(await (await request.post('/api/scans',{data:{patient_id:patient.id,visit_id:visit.id,scan_type:type,[key]:report}})).json()).data
  return {patient,visit,scan,key,report,url:`/${routes[type]}/${scan.id}?patientId=${patient.id}&visitId=${visit.id}`}
}
// Fetal Echo uses the singular "Indication" label; the Adult and Pediatric
// screens use "Indication(s)". Match the shared field by its stable prefix.
const indication = page => page.getByLabel(/^Indication/)
const saveReportButton = page => page.getByRole('button',{name:'Save report',exact:true}).last()
async function enterIndication(page,value) { await indication(page).fill(value);await expect(indication(page)).toHaveValue(value) }
async function open(page,s){await page.goto(s.url);await expect(indication(page)).toHaveValue('DUMMY SOFTWARE TEST')}
async function saved(page){await expect(page.getByRole('status').filter({hasText:/echo report saved/i})).toBeVisible()}

for(const type of Object.keys(routes)) {
  test(`${type}: Save & Next blocks an invalid indication without saving`,async({page,request})=>{
    const s=await study(request,type);await login(page,'l1',info.password);await open(page,s)
    await enterIndication(page,'')
    let writes=0
    await page.route('**/api/scans/*',route=>{if(route.request().method()==='PUT')writes++;return route.continue()})
    await page.getByRole('button',{name:'Save & next',exact:true}).click()
    await expect(page.getByRole('status')).toContainText('Enter an indication.')
    await expect(indication(page)).toBeVisible()
    expect(writes).toBe(0)
  })
  test(`${type}: Save & Next persists all steps; Back retains data`,async({page,request})=>{
    const s=await study(request,type);await login(page,'l1',info.password);await open(page,s)
    await enterIndication(page,'DUMMY STEP VALUE')
    await page.getByRole('button',{name:'Impression',exact:true}).click()
    await expect(page.getByRole('status')).toContainText('Not saved')
    const steps=type==='Adult Echo'?5:type==='Fetal Echo'?5:3
    for(let i=0;i<steps;i++) {await page.getByRole('button',{name:'Save & next',exact:true}).click();await saved(page)}
    await expect(page.getByLabel('Header comments', {exact:false})).toBeVisible()
    await page.getByRole('button',{name:'Back',exact:true}).click()
    await expect(page.getByRole('button',{name:'Save & next',exact:true})).toBeVisible()
    await page.reload();await expect(indication(page)).toHaveValue('DUMMY STEP VALUE')
    const stored=(await (await request.get(`/api/scans/${s.scan.id}`)).json()).data
    expect(stored.visit_id).toBe(s.visit.id)
  })
  test(`${type}: dirty navigation can stay or discard; network failure preserves entries`,async({page,request})=>{
    const s=await study(request,type);await login(page,'l1',info.password);await open(page,s)
    await enterIndication(page,'UNSAVED MARKER')
    await page.getByRole('link',{name:'Patients',exact:true}).click()
    await expect(page.getByRole('dialog',{name:'Unsaved report changes'})).toBeVisible()
    await page.getByRole('button',{name:'Stay on report'}).click()
    await expect(indication(page)).toHaveValue('UNSAVED MARKER')
    await page.route('**/api/scans/*',route=>route.request().method()==='PUT'?route.abort('failed'):route.continue())
    await saveReportButton(page).click()
    await expect(page.getByRole('status')).toContainText('Save could not be confirmed')
    await expect(indication(page)).toHaveValue('UNSAVED MARKER')
    await page.unroute('**/api/scans/*')
    await saveReportButton(page).click();await saved(page)
    await page.reload();await expect(indication(page)).toHaveValue('UNSAVED MARKER')
    await enterIndication(page,'DISCARD MARKER')
    await page.getByRole('link',{name:'Patients',exact:true}).click()
    await page.getByRole('button',{name:'Discard changes and leave'}).click()
    await expect(page).not.toHaveURL(new RegExp(`/${routes[type]}/`))
    await page.goto(s.url);await expect(indication(page)).toHaveValue('UNSAVED MARKER')
  })
  test(`${type}: L1/L2/L3 audit, cancellation, completion and reload`,async({browser,request})=>{
    const s=await study(request,type)
    for(const [role,user] of [['L1','l1'],['L2','l2'],['L3','dr.shanthi']]) {
      const context=await browser.newContext();const page=await context.newPage();await login(page,user,info.password);await open(page,s)
      await page.getByRole('button',{name:'Impression',exact:true}).click()
      await expect(page.getByLabel('Auditing done')).toHaveCount(role==='L1'?0:1)
      await expect(page.getByLabel('Report completed',{exact:true})).toHaveCount(role==='L3'?1:0)
      if(role==='L2') {await page.getByLabel('Auditing done').check();await saveReportButton(page).click();await saved(page);await page.reload();await expect(indication(page)).toHaveValue('DUMMY SOFTWARE TEST');await page.getByRole('button',{name:'Impression',exact:true}).click();await expect(page.getByLabel('Audited by')).toHaveValue('L2 Dummy')}
      if(role==='L3') {
        const completion=page.getByLabel('Report completed',{exact:true})
        await expect(completion).toBeEnabled();await expect(completion).not.toBeChecked()
        await completion.check();await expect(completion).toBeChecked()
        await saveReportButton(page).click();await page.getByRole('button',{name:'Cancel completion',exact:true}).click()
        await expect(page.getByRole('button',{name:'Report locked'})).toHaveCount(0)
        await saveReportButton(page).click();await page.getByRole('button',{name:'Complete and lock',exact:true}).click()
        await expect(page.getByRole('button',{name:'Report locked'})).toBeDisabled();await page.reload();await expect(page.getByRole('button',{name:'Report locked'})).toBeDisabled()
      }
      await context.close()
    }
    const context=await browser.newContext();const page=await context.newPage();await login(page,'l1',info.password);await page.goto(s.url)
    await expect(page.getByRole('button',{name:'Report locked'})).toBeDisabled();await expect(indication(page)).toBeDisabled()
    await context.close()
  })
}

test('30-second timeout releases Save and retains values',async({page,request})=>{
  const s=await study(request,'Pediatric Echo');await login(page,'l1',info.password);await open(page,s)
  await enterIndication(page,'TIMEOUT MARKER')
  let pending
  await page.route('**/api/scans/*',route=>{if(route.request().method()==='PUT')pending=route;else route.continue()})
  await saveReportButton(page).click()
  await expect(page.getByRole('status')).toContainText('Save could not be confirmed',{timeout:40000})
  await expect(saveReportButton(page)).toBeEnabled()
  await expect(indication(page)).toHaveValue('TIMEOUT MARKER')
  await pending.abort();await page.unroute('**/api/scans/*')
  await saveReportButton(page).click();await saved(page)
})

test('committed response lost in transit can be retried without duplicates',async({page,request})=>{
  const s=await study(request,'Fetal Echo');await login(page,'l1',info.password);await open(page,s)
  await enterIndication(page,'COMMITTED BUT RESPONSE LOST')
  await page.route('**/api/scans/*',async route=>{if(route.request().method()==='PUT'){await route.fetch();await route.abort('failed')}else await route.continue()})
  await saveReportButton(page).click();await expect(page.getByRole('status')).toContainText('Save could not be confirmed')
  await page.unroute('**/api/scans/*');await saveReportButton(page).click();await saved(page)
  const scans=(await (await request.get(`/api/scans/patient/${s.patient.id}`)).json()).data
  expect(scans.filter(x=>x.visit_id===s.visit.id)).toHaveLength(1)
})

test('session is server-verified and sign-out clears the bearer token',async({page,request})=>{
  await login(page,'l1',info.password)
  expect(await page.evaluate(()=>sessionStorage.getItem('echoai_token'))).toBeTruthy()
  expect(await page.evaluate(()=>localStorage.getItem('echoai_token'))).toBeNull()
  const cookie=(await page.context().cookies()).find(x=>x.name==='echo_fixture_session');expect(cookie.httpOnly).toBe(true)
  await page.evaluate(()=>sessionStorage.setItem('echoai_user',JSON.stringify({name:'Forged',role:'L3'})))
  await page.reload();await expect(page.getByRole('heading',{name:/Welcome back, L1 Dummy/})).toBeVisible()
  await page.goto('/?signout=1');await expect(page.getByRole('button',{name:'Login',exact:true})).toBeVisible()
  expect(await page.evaluate(()=>sessionStorage.getItem('echoai_token'))).toBeNull()
})

test('dashboard errors are visible and no fabricated alerts appear',async({page})=>{
  await login(page,'l1',info.password)
  await page.getByRole('button',{name:'Open notifications',exact:true}).click();await expect(page.getByText('No notification service is connected.')).toBeVisible()
  await page.route('**/api/dashboard/stats',route=>route.fulfill({status:503,json:{detail:'Synthetic outage'}}));await page.reload()
  await expect(page.getByRole('alert')).toContainText('Unable to load')
})

test('dirty report blocks history Back and cancelled reload without losing entries',async({page,request})=>{
  const s=await study(request,'Adult Echo');await login(page,'l1',info.password);await open(page,s)
  // Establish an in-document history entry, then reopen using browser Back.
  await page.getByRole('link',{name:'Patients',exact:true}).click();await page.goBack()
  await expect(indication(page)).toHaveValue('DUMMY SOFTWARE TEST')
  await enterIndication(page,'HISTORY MARKER')
  await page.goForward()
  await expect(page.getByRole('dialog',{name:'Unsaved report changes'})).toBeVisible()
  await page.getByRole('button',{name:'Stay on report'}).click()
  await expect(indication(page)).toHaveValue('HISTORY MARKER')
  const dialogPromise=page.waitForEvent('dialog')
  const reload=page.reload({timeout:3000}).catch(error=>{if(!/ERR_ABORTED|interrupted|cancelled|Timeout/i.test(error.message))throw error})
  const dialog=await dialogPromise;expect(dialog.type()).toBe('beforeunload');await dialog.dismiss();await reload
  await expect(indication(page)).toHaveValue('HISTORY MARKER')
})

test('manual fetal Z-score remains editable, persists and prints without automatic thresholds',async({page,request})=>{
  const s=await study(request,'Fetal Echo');await login(page,'l1',info.password);await open(page,s)
  await page.getByRole('button',{name:'Aortic',exact:true}).click()
  await page.getByLabel('Annulus Z score',{exact:true}).first().fill('1.234')
  await saveReportButton(page).click();await saved(page)
  await page.reload();await expect(indication(page)).toHaveValue('DUMMY SOFTWARE TEST')
  await page.getByRole('button',{name:'Aortic',exact:true}).click()
  await expect(page.getByLabel('Annulus Z score',{exact:true}).first()).toHaveValue('1.234')
  await page.getByRole('button',{name:'Preview',exact:true}).click()
  await expect(page.locator('.clinical-print')).toContainText('1.234')
  await expect(page.locator('.clinical-print')).not.toContainText('INTERNAL-SECRET-NOTE')
  await expect(page.locator('.clinical-print')).not.toContainText('Internal report classification')
})

test('scrolling leaves numeric patient inputs unchanged',async({page})=>{
  await login(page,'l1',info.password);await page.goto('/patients/new')
  const age=page.locator('#newpatient-age');await age.fill('30');await age.focus()
  await page.mouse.wheel(0,150);await expect(age).toHaveValue('30');await expect(age).not.toBeFocused()
})

test('visit media uploads, comparison persistence, print preview and archival',async({page,request})=>{
  const s=await study(request,'Adult Echo');await login(page,'l1',info.password)
  await page.goto(`/images?patientId=${s.patient.id}&visitId=${s.visit.id}`)
  await expect(page.getByLabel('Visit',{exact:true})).toHaveValue(String(s.visit.id))
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=40;c.height=40;const ctx=c.getContext('2d');ctx.fillStyle='#126';ctx.fillRect(0,0,40,40);return c.toDataURL('image/png').split(',')[1]})
  await page.locator('input[type="file"]').setInputFiles({name:'dummy.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')})
  await expect(page.getByRole('img',{name:'dummy.png',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Compare',exact:true}).click()
  await expect(page.getByRole('button',{name:'Save comparison',exact:true})).toBeEnabled()
  await page.getByRole('button',{name:'Select comparison image'}).click()
  await page.getByRole('button',{name:'Save comparison',exact:true}).click();await expect(page.getByRole('status')).toContainText('saved',{ignoreCase:true})
  await page.getByRole('button',{name:'Print preview',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'Image print preview'})).toContainText(s.patient.patient_id)
  await expect(page.getByRole('button',{name:'Print / Save PDF',exact:true})).toBeEnabled()
  await page.getByRole('button',{name:'Close print preview'}).click()
  await page.getByRole('button',{name:'Close comparison',exact:true}).click()
  await page.getByRole('button',{name:'Compare',exact:true}).click()
  await expect(page.getByRole('img',{name:'Comparison image'})).toHaveCount(1)
  await page.getByRole('button',{name:'Close comparison',exact:true}).click()
  await page.getByRole('button',{name:'Spooler',exact:true}).click()
  await page.getByRole('button',{name:'Archive media (original preserved)'}).click()
  await expect(page.getByRole('button',{name:'Archive media (original preserved)'})).toHaveCount(0)
  const records=(await (await request.get('/api/resources/media-records')).json()).data.filter(x=>String(x.patient_id)===String(s.patient.id))
  expect(records).toHaveLength(1);expect(records[0].status).toBe('Archived')
  expect((await request.get(records[0].url)).ok()).toBe(true)
})

test('all routed workspaces load without uncaught page errors',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message))
  await login(page,'dr.shanthi',info.password)
  for(const route of ['/patients','/patients/new','/visits','/search','/referral-doctors','/referral-doctors/new','/reports','/measurements','/analytics','/settings','/administration','/profile','/echo-studies','/echo-scan','/images']) {
    await page.goto(route);await page.waitForLoadState('networkidle');await expect(page.locator('main')).not.toBeEmpty()
  }
  expect(errors).toEqual([])
})
