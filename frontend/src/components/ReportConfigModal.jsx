import { useState } from 'react'
import { X, Save, Settings } from 'lucide-react'

export default function ReportConfigModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('config')
  const [scanType, setScanType] = useState('Adult Echo')
  const [printTitles, setPrintTitles] = useState('Custom')
  const [settingMode, setSettingMode] = useState('Detailed setting')

  const [headerLines, setHeaderLines] = useState([
    { section: 'Header Line1', text: 'T & M Caring Hearts Clinic', print: 'Only Image', font: 'Arial', size: 12, bold: true, italic: false, underline: false },
    { section: 'Header Line2', text: '', print: 'Both', font: 'Arial', size: 12, bold: false, italic: false, underline: false },
    { section: 'Header Line3', text: '', print: 'Both', font: 'Arial', size: 12, bold: false, italic: false, underline: false },
    { section: 'Header Line4', text: '', print: 'None', font: 'Arial', size: 15, bold: false, italic: false, underline: false },
    { section: 'Header Line5', text: '', print: 'None', font: 'Arial', size: 15, bold: false, italic: false, underline: false },
  ])

  const [fontStyles, setFontStyles] = useState([
    { section: 'Pat. Demography', print: true, font: 'Arial', size: 11, bold: true, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'Scan', print: true, font: 'Arial', size: 15, bold: true, italic: false, underline: false, align: 'Center', color: 'Black' },
    { section: 'Indication', print: true, font: 'Arial', size: 12, bold: true, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'Impression', print: true, font: 'Arial', size: 13, bold: true, italic: true, underline: true, align: 'Left', color: 'Black' },
    { section: 'Organ name', print: true, font: 'Arial', size: 12, bold: true, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'Case history Title', print: true, font: 'Arial', size: 12, bold: true, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'ICD-10', print: true, font: 'Arial', size: 12, bold: false, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'Disclaimer', print: true, font: 'Arial', size: 12, bold: false, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'Abdomen', print: true, font: 'Arial', size: 12, bold: false, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'KUB', print: true, font: 'Arial', size: 12, bold: false, italic: false, underline: false, align: 'Left', color: 'Black' },
  ])

  const [pndtFontStyles, setPndtFontStyles] = useState([
    { section: 'Title', font: 'Arial', size: 8, bold: true, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'Subtitle', font: 'Arial', size: 8, bold: false, italic: false, underline: false, align: 'Left', color: 'Black' },
    { section: 'Label', font: 'Arial', size: 8, bold: false, italic: false, underline: false, align: 'Left', color: 'Black' },
  ])

  const [defaultReportTexts, setDefaultReportTexts] = useState([
    { id: '026001', systemText: '2D Measurements', userText: '' },
    { id: '02600101', systemText: 'Aorta', userText: '' },
    { id: '0260010101', systemText: 'Ao Annulus Diam d', userText: '' },
    { id: '0260010102', systemText: 'Ao Annulus Diam s', userText: '' },
    { id: '02600102', systemText: 'Aortic Valve', userText: '' },
    { id: '0260010201', systemText: 'AoV Area, Cont, VTI', userText: '' },
    { id: '0260010202', systemText: 'LVOT Diam s', userText: '' },
    { id: '0260010203', systemText: 'AoV Area, Cont, Vmax', userText: '' },
    { id: '0260010204', systemText: 'AoV Area Planim', userText: '' },
    { id: '0260010205', systemText: 'AoV Annulus Diam', userText: '' },
    { id: '0260010206', systemText: 'AR Jet Area', userText: '' },
    { id: '0260010207', systemText: 'AR Jet/LVOT Area', userText: '' },
    { id: '02600103', systemText: 'Mitral Valve', userText: '' },
    { id: '0260010301', systemText: 'MV Area Planim', userText: '' },
    { id: '02600104', systemText: 'Tricuspid Valve', userText: '' },
    { id: '0260010401', systemText: 'TV Area Planim', userText: '' },
    { id: '02600105', systemText: 'Pulmonary Valve', userText: '' },
    { id: '0260010501', systemText: 'RVOT Diam s', userText: '' },
    { id: '0260010502', systemText: 'PV Annulus Diam', userText: '' },
    { id: '02600106', systemText: 'Left Ventricle', userText: '' },
  ])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-2xs">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-teal-700" />
            <h2 className="text-sm font-semibold text-slate-900">Report Configuration</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="legacy-small-button">
              <Save className="mr-1 h-3.5 w-3.5 text-teal-700" /> Save
            </button>
            <button type="button" onClick={onClose} className="legacy-small-button">
              <X className="mr-1 h-3.5 w-3.5 text-red-600" /> Close
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex shrink-0 border-b border-slate-200 bg-slate-100 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`rounded-t-md px-4 py-2 border-t border-x transition ${
              activeTab === 'config'
                ? 'border-slate-300 bg-white text-teal-700 font-bold border-b-white -mb-px'
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            Report Config
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customization')}
            className={`rounded-t-md px-4 py-2 border-t border-x transition ${
              activeTab === 'customization'
                ? 'border-slate-300 bg-white text-teal-700 font-bold border-b-white -mb-px'
                : 'border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            Customization for default report text
          </button>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 p-4">
          {activeTab === 'config' && (
            <div className="space-y-4 text-xs">
              {/* Hospital Address Font Style */}
              <fieldset className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <legend className="px-1 font-semibold text-slate-800">Hospital address - Font style</legend>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sections</th>
                        <th>Text</th>
                        <th>Print</th>
                        <th>Font name</th>
                        <th>Size</th>
                        <th>Bold</th>
                        <th>Italic</th>
                        <th>Underline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headerLines.map((row, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{row.section}</td>
                          <td>
                            <input
                              type="text"
                              value={row.text}
                              onChange={(e) => {
                                const copy = [...headerLines]
                                copy[idx].text = e.target.value
                                setHeaderLines(copy)
                              }}
                              className="legacy-input h-7 text-xs"
                            />
                          </td>
                          <td>
                            <select
                              value={row.print}
                              onChange={(e) => {
                                const copy = [...headerLines]
                                copy[idx].print = e.target.value
                                setHeaderLines(copy)
                              }}
                              className="h-7 rounded border border-slate-300 px-1 text-xs"
                            >
                              <option>Only Image</option>
                              <option>Both</option>
                              <option>None</option>
                            </select>
                          </td>
                          <td>
                            <select
                              value={row.font}
                              onChange={(e) => {
                                const copy = [...headerLines]
                                copy[idx].font = e.target.value
                                setHeaderLines(copy)
                              }}
                              className="h-7 rounded border border-slate-300 px-1 text-xs"
                            >
                              <option>Arial</option>
                              <option>Calibri</option>
                              <option>Times New Roman</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              value={row.size}
                              onChange={(e) => {
                                const copy = [...headerLines]
                                copy[idx].size = Number(e.target.value)
                                setHeaderLines(copy)
                              }}
                              className="h-7 w-12 rounded border border-slate-300 text-center text-xs"
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={row.bold}
                              onChange={(e) => {
                                const copy = [...headerLines]
                                copy[idx].bold = e.target.checked
                                setHeaderLines(copy)
                              }}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={row.italic}
                              onChange={(e) => {
                                const copy = [...headerLines]
                                copy[idx].italic = e.target.checked
                                setHeaderLines(copy)
                              }}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={row.underline}
                              onChange={(e) => {
                                const copy = [...headerLines]
                                copy[idx].underline = e.target.checked
                                setHeaderLines(copy)
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>

              {/* Settings Mode & Print Titles */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 font-medium text-slate-700">
                    <input
                      type="radio"
                      name="settingMode"
                      checked={settingMode === 'Default'}
                      onChange={() => setSettingMode('Default')}
                    />
                    Default
                  </label>
                  <label className="flex items-center gap-1.5 font-medium text-slate-700">
                    <input
                      type="radio"
                      name="settingMode"
                      checked={settingMode === 'Detailed setting'}
                      onChange={() => setSettingMode('Detailed setting')}
                    />
                    Detailed setting
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">Print titles:</span>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="printTitles"
                      checked={printTitles === 'Always No'}
                      onChange={() => setPrintTitles('Always No')}
                    />
                    Always No
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="printTitles"
                      checked={printTitles === 'Always Yes'}
                      onChange={() => setPrintTitles('Always Yes')}
                    />
                    Always Yes
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="printTitles"
                      checked={printTitles === 'Custom'}
                      onChange={() => setPrintTitles('Custom')}
                    />
                    Custom
                  </label>
                </div>
              </div>

              {/* Font Styles */}
              <fieldset className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <legend className="px-1 font-semibold text-slate-800">Font styles</legend>
                <div className="max-h-60 overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sections</th>
                        <th>Print</th>
                        <th>Font name</th>
                        <th>Size</th>
                        <th>Bold</th>
                        <th>Italic</th>
                        <th>Underline</th>
                        <th>Align</th>
                        <th>Text color</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fontStyles.map((row, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{row.section}</td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={row.print}
                              onChange={(e) => {
                                const copy = [...fontStyles]
                                copy[idx].print = e.target.checked
                                setFontStyles(copy)
                              }}
                            />
                          </td>
                          <td>
                            <select value={row.font} className="h-7 rounded border border-slate-300 px-1 text-xs">
                              <option>Arial</option>
                            </select>
                          </td>
                          <td>
                            <input type="number" value={row.size} className="h-7 w-12 rounded border border-slate-300 text-center text-xs" />
                          </td>
                          <td className="text-center"><input type="checkbox" checked={row.bold} readOnly /></td>
                          <td className="text-center"><input type="checkbox" checked={row.italic} readOnly /></td>
                          <td className="text-center"><input type="checkbox" checked={row.underline} readOnly /></td>
                          <td>{row.align}</td>
                          <td>{row.color}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>

              {/* PNDT Font Styles */}
              <fieldset className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                <legend className="px-1 font-semibold text-slate-800">PNDT font styles</legend>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sections</th>
                      <th>Font name</th>
                      <th>Size</th>
                      <th>Bold</th>
                      <th>Italic</th>
                      <th>Underline</th>
                      <th>Align</th>
                      <th>Text color</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pndtFontStyles.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{row.section}</td>
                        <td>Arial</td>
                        <td>{row.size}</td>
                        <td className="text-center"><input type="checkbox" checked={row.bold} readOnly /></td>
                        <td className="text-center"><input type="checkbox" checked={row.italic} readOnly /></td>
                        <td className="text-center"><input type="checkbox" checked={row.underline} readOnly /></td>
                        <td>{row.align}</td>
                        <td>{row.color}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </fieldset>
            </div>
          )}

          {activeTab === 'customization' && (
            <div className="space-y-3 text-xs">
              <label className="field-label max-w-xs">
                <span className="font-semibold text-slate-700">Scan type</span>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
                >
                  <option value="Adult Echo">Adult Echo</option>
                  <option value="Fetal Echo">Fetal Echo</option>
                  <option value="Pediatric Echo">Pediatric Echo</option>
                </select>
              </label>

              <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>System text</th>
                      <th>User text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultReportTexts.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-slate-500">{row.id}</td>
                        <td className="font-medium text-slate-900">{row.systemText}</td>
                        <td>
                          <input
                            type="text"
                            value={row.userText}
                            onChange={(e) => {
                              const copy = [...defaultReportTexts]
                              copy[idx].userText = e.target.value
                              setDefaultReportTexts(copy)
                            }}
                            placeholder="Enter custom report text..."
                            className="legacy-input h-7 w-full text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
