import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { loadFixture, login, reportUrl } from './fixture.js'

let info
test.beforeAll(async () => {
  info = await loadFixture()
})
test.describe.configure({ mode: 'serial' })

const reports = [
  ['Fetal Echo', 'Fetal Echocardiography'],
  ['Adult Echo', 'Adult Echocardiography'],
  ['Pediatric Echo', 'Paediatric Echocardiography'],
]

for (const [scanType, title] of reports) {
  test(`${scanType} preview prints as an A4 clinical report`, async ({ page }, testInfo) => {
    await login(page, 'l1', info.password)
    await page.goto(`${reportUrl(info, scanType)}&preview=1`)
    await page.getByText('Dummy Browser').first().waitFor()
    await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible()

    const pdfPath = testInfo.outputPath(`${scanType.replaceAll(' ', '-')}.pdf`)
    await page.emulateMedia({ media: 'print' })
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true })

    const pdfInfo = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' })
    const pageCount = Number(pdfInfo.match(/Pages:\s+(\d+)/)?.[1] || 0)
    expect(pageCount).toBeGreaterThan(0)
    expect(pdfInfo).toContain('(A4)')

    const text = execFileSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8' })
    expect(text).toContain('Dummy Browser')
    expect(text).toContain(info.patient_display_id)
    expect(text).toContain(title)
    expect(text).toContain('Primary consultant')
    expect(text).toContain('Dummy Consultant')
  })
}

for(const [scanType,title] of reports) {
  test(`${scanType} long synthetic report paginates without missing rows or blank pages`,async({page,request},testInfo)=>{
    await request.post('/api/auth/login',{data:{username:'dr.shanthi',password:info.password}})
    const id=info.scans[scanType].id
    const key={'Fetal Echo':'fetal_echo_report','Adult Echo':'adult_echo_report','Pediatric Echo':'pediatric_echo_report'}[scanType]
    const record=(await (await request.get(`/api/scans/${id}`)).json()).data
    const report=record[key]
    report.echo_details={software_layout_sample:Object.fromEntries(Array.from({length:80},(_,i)=>[`sample_${i}`,`ROW-${String(i).padStart(3,'0')} Synthetic non-clinical line for print wrapping and pagination. `.repeat(2)]))}
    report.impression.header_comments='DUMMY SAMPLE - NOT APPROVED FOR CLINICAL USE'
    report.impression.internal_comments='INTERNAL-PDF-SECRET'
    report.impression.second_consultant='Dummy Second Consultant'
    expect((await request.put(`/api/scans/${id}`,{data:{[key]:report}})).ok()).toBe(true)
    await login(page,'l1',info.password);await page.goto(`${reportUrl(info,scanType)}&preview=1`)
    await expect(page.getByRole('button',{name:'Print / Save PDF'})).toBeEnabled()
    await page.emulateMedia({media:'print'})
    const pdfPath=testInfo.outputPath(`${scanType.replaceAll(' ','-')}-long.pdf`)
    await page.pdf({path:pdfPath,format:'A4',printBackground:true})
    const infoText=execFileSync('pdfinfo',[pdfPath],{encoding:'utf8'});expect(Number(infoText.match(/Pages:\s+(\d+)/)[1])).toBeGreaterThan(1)
    const text=execFileSync('pdftotext',['-layout',pdfPath,'-'],{encoding:'utf8'})
    for(let i=0;i<80;i++)expect(text).toContain(`ROW-${String(i).padStart(3,'0')}`)
    expect(text).toContain('DUMMY SAMPLE');expect(text).toContain('Dummy Second Consultant');expect(text).not.toContain('INTERNAL-PDF-SECRET')
    const pages=text.split('\f');if(!pages.at(-1).trim())pages.pop()
    for(const content of pages)expect(content.trim().length).toBeGreaterThan(30)
    execFileSync('pdftoppm',['-f','1','-singlefile','-scale-to','1200','-png',pdfPath,testInfo.outputPath('page-1')])
  })
}
