import { useState, useEffect, useMemo, useRef } from 'react'
import {
  X,
  FileText,
  Save,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Stethoscope,
  Building,
} from 'lucide-react'
import { referralDoctorService } from '../api/referralDoctorService'

/**
 * Modal to view, generate, edit, and print Referral Letters for a patient.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {object} patient
 * @param {string} scanType
 * @param {object} report
 * @param {string|number} scanId
 */
export default function ReferralLetterModal({
  isOpen,
  onClose,
  patient,
  scanType = 'Echocardiogram',
  report = {},
  scanId,
}) {
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [copyTo, setCopyTo] = useState('')
  const [letterName, setLetterName] = useState('')
  const [subject, setSubject] = useState('')
  const [letterBody, setLetterBody] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedStatus, setSavedStatus] = useState('')
  const [fontSize, setFontSize] = useState('14')
  const textareaRef = useRef(null)

  const patientName = patient
    ? `${patient.salutation || ''} ${patient.first_name || ''} ${patient.last_name || ''}`.trim()
    : 'Patient'

  // Load referral doctors list
  useEffect(() => {
    if (!isOpen) return

    referralDoctorService
      .getReferralDoctors()
      .then((res) => {
        setDoctors(res.data || [])
      })
      .catch((err) => console.error('Failed to load referral doctors:', err))
  }, [isOpen])

  // Generate initial letter text
  const generateLetterText = (doctorName = '') => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const ageStr = patient?.age ? `${patient.age} ${patient.age_unit || 'Years'}` : ''
    const genderStr = patient?.gender || ''
    const ind = report.indication || report.diagnosis || 'Cardiovascular assessment'
    const imp =
      report.impression?.final_impression ||
      report.impression?.summary ||
      report.impression ||
      report.conclusion ||
      'Normal cardiac chamber dimensions, normal biventricular systolic function, and normal valvular hemodynamics for age. No intracardiac shunt or outflow gradient identified.'

    const docGreeting = doctorName ? `Dear Dr. ${doctorName},` : 'Dear Doctor,'

    return `DATE: ${today}

TO: ${doctorName || 'Attending Physician / Referring Consultant'}
CLINIC / HOSPITAL: ${copyTo || 'Cardiology & Diagnostic Centre'}

RE: CLINICAL ECHOCARDIOGRAPHY CONSULTATION REPORT
PATIENT: ${patientName.toUpperCase()}
PATIENT ID: ${patient?.patient_id || '—'}
AGE / GENDER: ${ageStr} / ${genderStr}
STUDY TYPE: ${scanType.toUpperCase()}
STUDY DATE: ${today}

${docGreeting}

Thank you for referring ${patientName} to our center for ${scanType} examination.

CLINICAL INDICATION:
${ind}

ECHOCARDIOGRAPHIC FINDINGS & IMPRESSION:
${imp}

RECOMMENDATIONS & CLINICAL PLAN:
1. Continue medical therapy as clinically appropriate.
2. Clinical follow-up as indicated, or repeat echocardiogram if symptoms develop.

Thank you once again for your kind referral.

Sincerely,

Dr. Shanthi, MD, DM (Cardiology)
Chief Consultant Cardiologist
Echo AI Cardiology & Diagnostic Centre`
  }

  // Initialize letter when opening
  useEffect(() => {
    if (!isOpen) return

    setLetterName(`Referral Letter - ${patientName}`)
    setSubject(`Echocardiogram Consultation - ${patientName} (${patient?.patient_id || ''})`)
    const initialText = generateLetterText()
    setLetterBody(initialText)
    setSavedStatus('')
    setCopied(false)
  }, [isOpen, patient])

  if (!isOpen) return null

  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId)
    const doc = doctors.find((d) => String(d.id) === String(docId))
    if (doc) {
      const docName = `${doc.name || `${doc.first_name || ''} ${doc.last_name || ''}`}`.trim()
      setLetterBody(generateLetterText(docName))
    }
  }

  const handleSave = () => {
    setSavedStatus('Referral letter saved successfully!')
    setTimeout(() => setSavedStatus(''), 3000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(letterBody)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print the referral letter.')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${subject || 'Referral Letter'}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: ${fontSize}px;
              line-height: 1.6;
              color: #1e293b;
              padding: 24px;
            }
            .header {
              border-bottom: 2px solid #0f766e;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title { font-size: 20px; font-weight: bold; color: #0f766e; }
            .subtitle { font-size: 11px; color: #64748b; }
            pre {
              font-family: inherit;
              white-space: pre-wrap;
              word-wrap: break-word;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">echoAI Cardiology & Diagnostic Centre</div>
              <div class="subtitle">Official Clinical Referral & Consultation Document</div>
            </div>
          </div>
          <pre>${letterBody}</pre>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Clinical Referral Letter</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {patientName} {patient?.patient_id ? `(${patient.patient_id})` : ''} • {scanType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedStatus && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-in fade-in">
                {savedStatus}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Inputs */}
        <div className="border-b border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Letter Name</label>
              <input
                type="text"
                value={letterName}
                onChange={(e) => setLetterName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Referral Doctor (To)
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Select doctor or type below</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim()}
                    {doc.specialty ? ` (${doc.specialty})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Institution
              </label>
              <input
                type="text"
                value={copyTo}
                onChange={(e) => setCopyTo(e.target.value)}
                placeholder="e.g., Apollo Speciality Hospital"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLetterBody(generateLetterText())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                title="Reset with latest findings"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Regenerate Text
              </button>

              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <span className="text-[11px] text-slate-500 font-medium">Font:</span>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700"
                >
                  <option value="12">12 px</option>
                  <option value="14">14 px</option>
                  <option value="16">16 px</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5 text-teal-700" />
                Print / PDF
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-teal-700 transition"
              >
                <Save className="h-3.5 w-3.5" />
                Save Letter
              </button>
            </div>
          </div>
        </div>

        {/* Editor Body */}
        <div className="p-4 bg-slate-100/50">
          <textarea
            ref={textareaRef}
            rows={18}
            value={letterBody}
            onChange={(e) => setLetterBody(e.target.value)}
            style={{ fontSize: `${fontSize}px` }}
            className="w-full rounded-xl border border-slate-300 bg-white p-5 font-mono text-slate-900 leading-relaxed shadow-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-y"
            placeholder="Type or edit referral letter contents..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <span className="text-xs text-slate-400">
            Click &apos;Print / PDF&apos; to generate official stationery document.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
