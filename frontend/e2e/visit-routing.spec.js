import { test, expect } from '@playwright/test'
import { loadFixture, login } from './fixture.js'

test('saving a new visit opens its selected report and retains visit-specific referral', async ({ page }) => {
  const info = await loadFixture()
  await login(page, 'l1', info.password)
  for (const [type, route] of [
    ['Fetal Echo', 'fetal-echo-report'],
    ['Adult Echo', 'adult-echo-report'],
    ['Pediatric Echo', 'pediatric-echo-report'],
    ['Ultrasound', 'echo-scan'],
  ]) {
    await page.goto(`/visits?patient=${info.patient_id}`)
    const typeInput = page.getByLabel('Scan type *')
    await expect(typeInput).toHaveValue('')
    await page.getByLabel('Visit date and time *').fill('2026-11-12T10:00')
    await typeInput.selectOption(type)
    await expect(page.getByLabel('Report template *')).not.toHaveValue('')
    await page.getByRole('button', { name: /Select doctor or institute|Self/ }).last().click()
    await page.getByRole('button', { name: 'Self', exact: true }).last().click()
    await page.getByRole('button', { name: 'Save & Go to Reporting' }).click()
    await expect(page).toHaveURL(new RegExp(`/${route}\\?`))
    const visitId = new URL(page.url()).searchParams.get('visitId')
    expect(visitId).toBeTruthy()
    const response = await page.request.get(`/api/patients/${info.patient_id}/visits`)
    expect(response.ok()).toBeTruthy()
    const visits = (await response.json()).data
    expect(visits.find(visit => String(visit.id) === visitId)?.referral_doctor).toBe('Self')
    if (type === 'Ultrasound') {
      await expect(page.getByRole('heading', { name: 'Ultrasound reporting' })).toBeVisible()
      await expect(page.getByLabel('Patient')).toHaveValue(new RegExp(info.patient_display_id))
      await expect(page.getByLabel('Visit')).toHaveValue(/2026-11-12/)
    }
    else {
      await page.getByRole('button', { name: 'Save report', exact: true }).last().click()
      await expect(page).toHaveURL(new RegExp(`/${route}/[0-9]+\\?`))
      await expect(page.getByRole('dialog', { name: 'Unsaved report changes' })).toHaveCount(0)
    }
  }
})
