import fs from 'node:fs'
import path from 'node:path'

const fixturePath = path.resolve(process.cwd(), '..', 'browser-fixture-info.json')
const reportRoutes = {
  'Fetal Echo': 'fetal-echo-report',
  'Adult Echo': 'adult-echo-report',
  'Pediatric Echo': 'pediatric-echo-report',
}

export async function loadFixture() {
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    try {
      const info = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
      if (info.status === 'ready') return info
    } catch {
      // The fixture writes this file only after it has seeded the scans.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Timed out waiting for browser-fixture-info.json')
}

export async function login(page, username, password) {
  await page.goto('/')
  await page.getByPlaceholder('Email address or username').fill(username)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL('**/dashboard')
}

export function reportUrl(info, scanType) {
  const scan = info.scans[scanType]
  return `/${reportRoutes[scanType]}/${scan.id}?patientId=${info.patient_id}&visitId=${scan.visit_id}`
}

export async function openReport(page, info, scanType) {
  await page.goto(reportUrl(info, scanType))
  await page.getByText(`${scanType} Report`).first().waitFor()
}
