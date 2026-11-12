import { workspaceService } from './workspaceService'

const patientName = (patient) => [patient?.salutation, patient?.first_name, patient?.middle_name, patient?.last_name]
  .filter(Boolean)
  .join(' ')
  .trim() || 'Patient'

export async function deliverReportIfEnabled({ title, patient, visitId, report }) {
  const settingsResult = await workspaceService.getSettings()
  const settings = settingsResult.data || {}
  if (!settings.autoEmailReports || !settings.defaultReportRecipient) return { sent: false }

  const body = [
    `<h1>${escapeHtml(title)}</h1>`,
    `<p><strong>Patient:</strong> ${escapeHtml(patientName(patient))}</p>`,
    `<p><strong>Visit:</strong> ${escapeHtml(visitId || 'Not recorded')}</p>`,
    `<h2>Final impression</h2>`,
    `<p>${escapeHtml(report?.impression?.final_impression || report?.impression?.impression || 'Not recorded').replace(/\n/g, '<br>')}</p>`,
  ].join('')

  await workspaceService.sendReportEmail({
    recipient: settings.defaultReportRecipient,
    report_title: title,
    report_content: body,
  })
  return { sent: true, recipient: settings.defaultReportRecipient }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]))
}
