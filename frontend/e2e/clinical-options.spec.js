import { test, expect } from '@playwright/test'
import { loadFixture, login, reportUrl } from './fixture.js'

let info
test.beforeAll(async () => { info = await loadFixture() })
const waitForReport = page => expect(page.getByLabel(/^Indication/)).toHaveValue('Dummy browser test only')

for (const [route, label] of [
  ['/fetal-echo-report', 'Cardiac views'],
  ['/adult-echo-report', 'Right ventricle'],
  ['/pediatric-echo-report', 'Cardiac position'],
]) {
  test(`${route} saves and reuses a custom choice`, async ({ page }) => {
    await login(page, 'l1', info.password)
    const scanType = route === '/fetal-echo-report' ? 'Fetal Echo' : route === '/adult-echo-report' ? 'Adult Echo' : 'Pediatric Echo'
    await page.goto(reportUrl(info, scanType))
    await waitForReport(page)
    if (route === '/fetal-echo-report') await page.getByRole('button', { name: 'Echo details', exact: true }).click()
    const input = page.getByLabel(label, { exact: true }).first()
    const value = `Synthetic choice ${Date.now()}`
    await page.getByRole('button', { name: `Add ${label} choice`, exact: true }).first().click()
    await page.getByLabel(`New ${label} choice`, { exact: true }).first().fill(value)
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(input).toHaveValue(value)
    await page.getByRole('button', { name: 'Save report', exact: true }).last().click()
    await expect(page.getByRole('status')).toContainText('report saved', { ignoreCase: true })
    await page.reload()
    await waitForReport(page)
    if (route === '/fetal-echo-report') await page.getByRole('button', { name: 'Echo details', exact: true }).click()
    const selector = page.getByLabel(`Choose ${label}`, { exact: true }).first()
    await expect(selector.locator('option', { hasText: value })).toHaveCount(1)
    await selector.selectOption(value)
    await expect(page.getByLabel(label, { exact: true }).first()).toHaveValue(value)
  })
}

test('fetal abnormal findings require and retain their inline description', async ({ page }) => {
  await login(page, 'l1', info.password)
  await page.goto(reportUrl(info, 'Fetal Echo'))
  await waitForReport(page)
  await page.getByRole('button', { name: 'Echo details', exact: true }).click()
  await page.getByLabel('Other lesions', { exact: true }).fill('Abnormal')
  await expect(page.getByLabel('Other lesions comment')).toBeVisible()
  await page.getByRole('button', { name: 'Save report', exact: true }).last().click()
  await expect(page.getByRole('status')).toContainText('Describe abnormal finding')
  await page.getByLabel('Other lesions comment').fill('Synthetic description')
  await page.getByRole('button', { name: 'Save report', exact: true }).last().click()
  await expect(page.getByRole('status')).toContainText('Fetal echo report saved.')
  await page.reload()
  await waitForReport(page)
  await page.getByRole('button', { name: 'Echo details', exact: true }).click()
  await expect(page.getByLabel('Other lesions comment')).toHaveValue('Synthetic description')
})
