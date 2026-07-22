import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Download, ImagePlus, Play, Redo2, RotateCcw, Save, Trash2, Undo2, Upload } from 'lucide-react'
import { Field, FieldGrid, Section, Tabs, Workspace } from '../components/WorkspaceUI'
import { patientService } from '../api/patientService'
import { workspaceService } from '../api/workspaceService'

const tabs = ['Images', 'Videos', 'Compare', 'Rule of Three', 'Patient data', 'Spooler', 'Configuration', 'Organ editor']

export default function ImagesViewer() {
  const [activeTab, setActiveTab] = useState('Images')
  const [assets, setAssets] = useState([])
  const [selected, setSelected] = useState([])
  const [patients, setPatients] = useState([])
  const [patientId, setPatientId] = useState('')
  const [visits, setVisits] = useState([])
  const [visitId, setVisitId] = useState('')
  const [templates, setTemplates] = useState([])
  const [config, setConfig] = useState({ source: '', aeTitle: '', host: '', port: '', rows: '', columns: '', autoImport: false, aspectRatio:'', imageTitle:'', storageAeTitle:'', storageHost:'', storagePort:'', anonymous:false })

  useEffect(() => {
    Promise.all([patientService.getPatients(), workspaceService.list('media-records'), workspaceService.getSettings(), workspaceService.getTemplates()]).then(([p,m,s,t]) => {
      setPatients(p.data || [])
      setAssets((m.data || []).map((asset) => ({...asset, url:asset.url || asset.data_url || ''})))
      setConfig((current) => ({...current,...(s.data?.imageConfig || {})}))
      setTemplates(t.data || [])
    }).catch(()=>{})
  }, [])

  useEffect(() => { if(patientId) patientService.getVisits(patientId).then((result)=>setVisits(result.data||[])); else {setVisits([]);setVisitId('')} }, [patientId])

  const addFiles = async (event) => {
    const files = [...event.target.files]
    for (const file of files) {
      const upload = new FormData()
      upload.append('file', file); upload.append('patient_id', patientId); upload.append('visit_id', visitId); upload.append('anonymous', String(config.anonymous)); upload.append('ae_title', config.storageAeTitle||config.aeTitle||''); upload.append('ip_address', config.storageHost||config.host||'')
      try { const result=await workspaceService.uploadMedia(upload);setAssets((current)=>[...current,result.data]) }
      catch { setAssets((current)=>[...current,{patient_id:patientId,visit_id:visitId,name:file.name,type:file.type||'application/dicom',size:file.size,status:'Local only',id:`local-${Date.now()}`,url:URL.createObjectURL(file)}]) }
    }
  }
  const images = useMemo(() => assets.filter((asset) => asset.type.startsWith('image/')), [assets])
  const videos = useMemo(() => assets.filter((asset) => asset.type.startsWith('video/')), [assets])
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id].slice(-2))

  const uploader = <label className="primary-button cursor-pointer"><Upload className="h-4 w-4" />Import files<input className="hidden" type="file" accept="image/*,video/*,.dcm" multiple onChange={addFiles} /></label>

  return (
    <Workspace title="Images & DICOM" description="Import, review, compare, annotate, archive and route patient-linked clinical media." actions={uploader}>
      <Section title="Patient and visit" className="mb-4"><div className="grid gap-3 md:grid-cols-2"><label className="field-label"><span>Patient</span><select className="field-control" value={patientId} onChange={(e)=>{setPatientId(e.target.value);setVisitId('')}}><option value="">Select</option>{patients.map((patient)=><option key={patient.id} value={patient.id}>{patient.patient_id} — {patient.first_name} {patient.last_name}</option>)}</select></label><label className="field-label"><span>Visit</span><select className="field-control" value={visitId} onChange={(e)=>setVisitId(e.target.value)}><option value="">Select</option>{visits.map((visit)=><option key={visit.id} value={visit.id}>{visit.visit_date?new Date(visit.visit_date).toLocaleString():visit.id}</option>)}</select></label></div></Section>
      <Tabs items={tabs} value={activeTab} onChange={setActiveTab} />
      {activeTab === 'Images' && <MediaGrid assets={images} selected={selected} toggle={toggle} empty="Import an image or DICOM export to begin." />}
      {activeTab === 'Videos' && <VideoGrid assets={videos} />}
      {activeTab === 'Compare' && <Compare assets={images.filter((asset) => selected.includes(asset.id))} all={images} toggle={toggle} />}
      {activeTab === 'Rule of Three' && <RuleImageTemplate templates={templates} setTemplates={setTemplates} images={images} />}
      {activeTab === 'Patient data' && <PatientData assets={assets} />}
      {activeTab === 'Spooler' && <Spooler assets={assets} setAssets={setAssets} />}
      {activeTab === 'Configuration' && <Section title="DICOM SCU, storage and image/video view configuration"><FieldGrid fields={[{key:'source',label:'Input source',type:'select',options:['DICOM folder','PACS server','Capture device']},{key:'aeTitle',label:'Local AE title'},{key:'host',label:'Local IP address'},{key:'port',label:'Local port',type:'number'},{key:'storageAeTitle',label:'Storage AE title'},{key:'storageHost',label:'Storage IP address'},{key:'storagePort',label:'Storage port',type:'number'},{key:'rows',label:'Viewer rows',type:'select',options:['1','2','3','4']},{key:'columns',label:'Viewer columns',type:'select',options:['1','2','3','4']},{key:'aspectRatio',label:'Image/video aspect ratio',type:'select',options:['Original','4:3','16:9','1:1']},{key:'imageTitle',label:'Image title name'},{key:'autoImport',label:'Auto import',type:'checkbox'},{key:'anonymous',label:'Anonymous images',type:'checkbox'}]} data={config} setData={setConfig} /><button className="primary-button mt-5" onClick={async()=>{const s=await workspaceService.getSettings();await workspaceService.saveSettings({...s.data,imageConfig:config})}}><Save className="h-4 w-4" />Save configuration</button></Section>}
      {activeTab === 'Organ editor' && <OrganEditor image={images.find((asset)=>selected.includes(asset.id))} patientId={patientId} visitId={visitId} onGoToImages={()=>setActiveTab('Images')} onSaved={(asset)=>setAssets((current)=>[...current,asset])} />}
    </Workspace>
  )
}

function MediaGrid({ assets, selected, toggle, empty }) {
  if (!assets.length) return <Empty icon={ImagePlus} text={empty} />
  return <div><div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800"><strong>Step 1:</strong> Click one image to select it, then open <strong>Organ editor</strong>. The highlighted image is the one that will be edited.</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{assets.map((asset) => <button key={asset.id} onClick={() => toggle(asset.id)} aria-pressed={selected.includes(asset.id)} className={`overflow-hidden rounded-xl border bg-slate-950 text-left shadow-sm transition ${selected.includes(asset.id) ? 'ring-2 ring-primary-500 ring-offset-2' : 'border-slate-200 hover:border-primary-300'}`}><div className="relative"><img src={asset.url} alt={asset.name} className="aspect-video w-full object-contain" />{selected.includes(asset.id)&&<span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary-600 px-2 py-1 text-xs font-semibold text-white"><Check className="h-3 w-3"/>Selected</span>}</div><div className="flex items-center justify-between bg-white p-3"><span className="truncate text-sm font-medium text-slate-800">{asset.name}</span><span className="text-xs text-slate-400">{Math.round(asset.size/1024)} KB</span></div></button>)}</div></div>
}

function VideoGrid({ assets }) {
  const [search,setSearch]=useState('')
  const shown=assets.filter((asset)=>asset.name.toLowerCase().includes(search.toLowerCase()))
  if (!assets.length) return <Empty icon={Play} text="Import a study video to use the cine viewer." />
  return <div><label className="field-label mb-4 max-w-lg"><span>Search video title</span><input className="field-control" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Press enter or type a title"/></label><div className="grid gap-4 lg:grid-cols-2">{shown.map((asset) => <div key={asset.id} className="rounded-xl border border-slate-200 bg-slate-950 p-3"><video src={asset.url} controls className="aspect-video w-full" /><p className="mt-2 text-sm text-white">{asset.name}</p></div>)}</div></div>
}

function Compare({ assets, all, toggle }) {
  return <div><p className="mb-4 text-sm text-slate-500">Select any two images below to compare them side by side.</p><div className="grid gap-4 lg:grid-cols-2">{[0,1].map((slot) => <div key={slot} className="flex aspect-video items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-950">{assets[slot] ? <img src={assets[slot].url} className="h-full w-full object-contain" alt="Comparison" /> : <span className="text-sm text-slate-400">Comparison image {slot+1}</span>}</div>)}</div><div className="mt-4 flex gap-2 overflow-x-auto">{all.map((asset) => <button key={asset.id} onClick={() => toggle(asset.id)}><img src={asset.url} alt={asset.name} className="h-20 w-28 rounded-lg border border-slate-200 object-cover" /></button>)}</div></div>
}

function PatientData({ assets }) {
  return <Section title="Patient data archival" description="Double-click an image, video or archived document to open it."><div className="overflow-auto"><table className="data-table"><thead><tr><th>Patient ID</th><th>Visit ID</th><th>File</th><th>Format</th><th>Size</th><th>Anonymous</th><th>Status</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id} onDoubleClick={()=>asset.url&&window.open(asset.url,'_blank')}><td>{asset.patient_id||'—'}</td><td>{asset.visit_id||'—'}</td><td>{asset.name}</td><td>{asset.type || 'DICOM'}</td><td>{Math.round(asset.size/1024)} KB</td><td>{asset.anonymous?'Yes':'No'}</td><td><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{asset.status||'Ready'}</span></td></tr>)}</tbody></table>{!assets.length && <p className="py-10 text-center text-sm text-slate-500">No imported patient media.</p>}</div></Section>
}

function RuleImageTemplate({templates,setTemplates,images}) {
  const [templateId,setTemplateId]=useState(''),[placements,setPlacements]=useState([]),[activeSlot,setActiveSlot]=useState(0)
  const template=templates.find((item)=>item.id===templateId)
  const count=template?Number((template.layout||'3')[0])**2:9
  useEffect(()=>setPlacements(template?.placements||[]),[templateId])
  const place=(asset)=>{const next=[...placements];next[activeSlot]=asset.id;setPlacements(next);setActiveSlot(Math.min(activeSlot+1,count-1))}
  const save=async()=>{if(!template)return;const result=await workspaceService.updateTemplate(template.id,{...template,placements});setTemplates(templates.map((item)=>item.id===template.id?result.data:item))}
  return <div className="grid gap-4 xl:grid-cols-[280px_1fr]"><Section title="Template and image list"><label className="field-label"><span>Template name</span><select className="field-control" value={templateId} onChange={(e)=>setTemplateId(e.target.value)}><option value="">Select</option>{templates.map((item)=><option key={item.id} value={item.id}>{item.title||item.name}</option>)}</select></label><p className="my-3 text-xs text-slate-500">Select a target frame, then double-click an image to place it.</p><div className="grid grid-cols-2 gap-2">{images.map((asset)=><button key={asset.id} onDoubleClick={()=>place(asset)} onClick={()=>place(asset)}><img src={asset.url} alt={asset.name} className="aspect-video w-full rounded border object-cover"/><span className="block truncate text-xs">{asset.name}</span></button>)}</div><button className="primary-button mt-4" onClick={save} disabled={!template}><Save className="h-4 w-4"/>Save placement</button></Section><Section title={template?.title||'Rule of Three'} description="Click a frame to choose where the next selected image will be placed."><div className={`grid gap-3 ${count===4?'grid-cols-2':count===16?'grid-cols-4':'grid-cols-3'}`}>{Array.from({length:count}).map((_,index)=>{const asset=images.find((item)=>item.id===placements[index]);return <button key={index} onClick={()=>setActiveSlot(index)} className={`flex aspect-video items-center justify-center overflow-hidden rounded-lg border-2 ${activeSlot===index?'border-primary-500 bg-primary-50':'border-dashed border-slate-300 bg-slate-50'}`}>{asset?<img src={asset.url} alt={asset.name} className="h-full w-full object-contain"/>:<span className="text-xs text-slate-500">{template?.views?.[index]||`Unassigned ${index+1}`}</span>}</button>})}</div></Section></div>
}

function Spooler({ assets, setAssets }) {
  const remove=async(asset)=>{if(asset.id&&!asset.id.startsWith('local-'))await workspaceService.remove('media-records',asset.id);setAssets(assets.filter((item)=>item.id!==asset.id))}
  return <Section title="Transfer spooler" description="Files queued for the patient record or configured PACS destination."><div className="overflow-auto"><table className="data-table"><thead><tr><th>Patient ID</th><th>Image ID</th><th>AE title</th><th>IP address</th><th>Status</th><th/></tr></thead><tbody>{assets.map((asset)=><tr key={asset.id}><td>{asset.patient_id||'—'}</td><td>{asset.id}</td><td>{asset.ae_title||'—'}</td><td>{asset.ip_address||'—'}</td><td className="text-emerald-700">{asset.status||'Ready'}</td><td><button onClick={()=>remove(asset)} className="rounded p-2 text-red-600"><Trash2 className="h-4 w-4"/></button></td></tr>)}</tbody></table></div>{!assets.length&&<p className="py-10 text-center text-sm text-slate-500">The transfer queue is empty.</p>}</Section>
}

function OrganEditor({image,patientId,visitId,onGoToImages,onSaved}) {
  const canvasRef=useRef(null),drawing=useRef(false),startPoint=useRef(null),preview=useRef(null),anglePoints=useRef([]),history=useRef([]),historyIndex=useRef(-1)
  const [tool,setTool]=useState('Pointer'),[notes,setNotes]=useState(''),[stampName,setStampName]=useState(''),[colour,setColour]=useState('#ef4444'),[size,setSize]=useState(3),[hasDrawing,setHasDrawing]=useState(false),[historyVersion,setHistoryVersion]=useState(0),[message,setMessage]=useState('Choose a tool to begin.'),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false)

  useEffect(()=>{
    const canvas=canvasRef.current
    if(!canvas)return
    canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)
    history.current=[canvas.toDataURL('image/png')];historyIndex.current=0;anglePoints.current=[]
    setHasDrawing(false);setSaved(false);setHistoryVersion((value)=>value+1);setTool('Pointer');setMessage('Choose a tool to begin.')
  },[image?.id])

  if(!image)return <div className="space-y-4"><WorkflowSteps current={1}/><div className="flex min-h-[430px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-200 bg-primary-50 px-6 text-center"><ImagePlus className="mb-4 h-14 w-14 text-primary-300"/><h3 className="text-lg font-semibold text-primary-950">Select an image before editing</h3><p className="mt-2 max-w-lg text-sm text-primary-700">Open Images, click the image you want to annotate so it shows the Selected badge, then return to Organ editor.</p><button onClick={onGoToImages} className="primary-button mt-5"><ImagePlus className="h-4 w-4"/>Go to Images</button></div></div>

  const context=()=>canvasRef.current.getContext('2d')
  const point=(event)=>{const rect=canvasRef.current.getBoundingClientRect();return{x:(event.clientX-rect.left)*canvasRef.current.width/rect.width,y:(event.clientY-rect.top)*canvasRef.current.height/rect.height}}
  const style=(ctx,eraser=false)=>{ctx.globalCompositeOperation=eraser?'destination-out':'source-over';ctx.strokeStyle=colour;ctx.fillStyle=colour;ctx.lineWidth=eraser?size*5:size;ctx.lineCap='round';ctx.lineJoin='round'}
  const commit=()=>{const url=canvasRef.current.toDataURL('image/png');history.current=[...history.current.slice(0,historyIndex.current+1),url];historyIndex.current=history.current.length-1;setHasDrawing(true);setSaved(false);setHistoryVersion((value)=>value+1)}
  const restore=(url)=>{const ctx=context();ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);const layer=new Image();layer.onload=()=>ctx.drawImage(layer,0,0);layer.src=url;setHasDrawing(historyIndex.current>0);setHistoryVersion((value)=>value+1)}
  const undo=()=>{if(historyIndex.current<=0)return;historyIndex.current-=1;restore(history.current[historyIndex.current]);setSaved(false)}
  const redo=()=>{if(historyIndex.current>=history.current.length-1)return;historyIndex.current+=1;restore(history.current[historyIndex.current]);setSaved(false)}
  const reset=()=>{const ctx=context();ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);history.current=[canvasRef.current.toDataURL('image/png')];historyIndex.current=0;anglePoints.current=[];setHasDrawing(false);setSaved(false);setMessage('Annotations cleared. Choose a tool to begin again.');setHistoryVersion((value)=>value+1)}
  const chooseTool=(next)=>{setTool(next);anglePoints.current=[];const instructions={Pointer:'Pointer selected. Choose another tool to annotate.',Freehand:'Drag on the image to draw freely.',Line:'Drag from the start point to the end point.',Angle:'Click the first arm endpoint, the vertex, then the second arm endpoint.',Ellipse:'Drag from one corner to the opposite corner.',Text:'Click the image where the text should appear.',Eraser:'Drag over annotations to erase them.'};setMessage(instructions[next])}
  const start=(event)=>{
    if(tool==='Pointer')return
    const p=point(event),ctx=context();style(ctx,tool==='Eraser')
    if(tool==='Text'){
      const textValue=window.prompt('Enter annotation text')
      if(textValue){ctx.globalCompositeOperation='source-over';ctx.font=`600 ${Math.max(18,size*6)}px sans-serif`;ctx.fillText(textValue,p.x,p.y);commit();setMessage('Text placed. Click again to add more text or choose another tool.')}
      return
    }
    if(tool==='Angle'){
      anglePoints.current=[...anglePoints.current,p]
      ctx.globalCompositeOperation='source-over';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,size),0,Math.PI*2);ctx.fill()
      if(anglePoints.current.length===1)setMessage('First endpoint set. Click the angle vertex.')
      else if(anglePoints.current.length===2)setMessage('Vertex set. Click the second arm endpoint.')
      else {const [first,vertex,last]=anglePoints.current;ctx.beginPath();ctx.moveTo(first.x,first.y);ctx.lineTo(vertex.x,vertex.y);ctx.lineTo(last.x,last.y);ctx.stroke();anglePoints.current=[];commit();setMessage('Angle completed. Click three more points to draw another.')}
      return
    }
    drawing.current=true;startPoint.current=p;preview.current=ctx.getImageData(0,0,canvasRef.current.width,canvasRef.current.height)
    if(['Freehand','Eraser'].includes(tool)){ctx.beginPath();ctx.moveTo(p.x,p.y)}
  }
  const drawShape=(event)=>{
    if(!drawing.current)return
    const p=point(event),ctx=context();style(ctx,tool==='Eraser')
    if(['Freehand','Eraser'].includes(tool)){ctx.lineTo(p.x,p.y);ctx.stroke();return}
    ctx.putImageData(preview.current,0,0);style(ctx,false);const start=startPoint.current
    if(tool==='Line'){ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(p.x,p.y);ctx.stroke()}
    if(tool==='Ellipse'){ctx.beginPath();ctx.ellipse((start.x+p.x)/2,(start.y+p.y)/2,Math.abs(p.x-start.x)/2,Math.abs(p.y-start.y)/2,0,0,Math.PI*2);ctx.stroke()}
  }
  const finish=(event)=>{if(!drawing.current)return;if(event)drawShape(event);drawing.current=false;context().globalCompositeOperation='source-over';commit();setMessage(`${tool} annotation added.`)}
  const loadImage=(url)=>new Promise((resolve,reject)=>{const source=new Image();source.onload=()=>resolve(source);source.onerror=reject;source.src=url})
  const composite=async()=>{const output=document.createElement('canvas');output.width=canvasRef.current.width;output.height=canvasRef.current.height;const ctx=output.getContext('2d');const source=await loadImage(image.url);ctx.drawImage(source,0,0,output.width,output.height);ctx.drawImage(canvasRef.current,0,0);return output}
  const download=async()=>{const output=await composite();const link=document.createElement('a');link.download=`${image.name.replace(/\.[^.]+$/,'')}-annotation.png`;link.href=output.toDataURL('image/png');link.click();setMessage('Annotated image exported.')}
  const saveAnnotation=async()=>{setSaving(true);try{const output=await composite();const blob=await new Promise((resolve)=>output.toBlob(resolve,'image/png'));const upload=new FormData();upload.append('file',blob,`${image.name.replace(/\.[^.]+$/,'')}-annotation.png`);upload.append('patient_id',patientId||image.patient_id||'');upload.append('visit_id',visitId||image.visit_id||'');upload.append('anonymous',String(image.anonymous||false));const result=await workspaceService.uploadMedia(upload);const updated=await workspaceService.update('media-records',result.data.id,{...result.data,source_media_id:image.id,stamp_name:stampName,annotation_notes:notes});onSaved?.(updated.data);setSaved(true);setMessage('Annotation saved to the patient media record.')}finally{setSaving(false)}}
  const canUndo=historyVersion>=0&&historyIndex.current>0,canRedo=historyVersion>=0&&historyIndex.current<history.current.length-1

  return <div className="space-y-4"><WorkflowSteps current={saved?4:hasDrawing?3:tool==='Pointer'?2:3}/><div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-primary-900"><strong>Editing:</strong> {image.name}</p><p className="text-sm font-medium text-primary-700">{message}</p></div></div><div className="grid min-h-[540px] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-950"><div className="flex flex-wrap items-center gap-2 border-b border-slate-700 p-3">{['Pointer','Freehand','Line','Angle','Ellipse','Text','Eraser'].map((item)=><button key={item} onClick={()=>chooseTool(item)} aria-pressed={tool===item} className={`rounded px-3 py-1.5 text-xs font-medium transition ${tool===item?'bg-primary-600 text-white':'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{item}</button>)}<span className="mx-1 h-6 w-px bg-slate-700"/><label className="flex items-center gap-2 text-xs text-slate-300">Colour<input type="color" value={colour} onChange={(e)=>setColour(e.target.value)} title="Annotation colour"/></label><label className="flex items-center gap-2 text-xs text-slate-300">Size<input className="w-24" type="range" min="1" max="18" value={size} onChange={(e)=>setSize(Number(e.target.value))}/></label><button onClick={undo} disabled={!canUndo} className="rounded bg-slate-800 p-2 text-white disabled:opacity-30" title="Undo"><Undo2 className="h-4 w-4"/></button><button onClick={redo} disabled={!canRedo} className="rounded bg-slate-800 p-2 text-white disabled:opacity-30" title="Redo"><Redo2 className="h-4 w-4"/></button><button onClick={reset} className="rounded bg-slate-800 p-2 text-white" title="Clear annotations"><RotateCcw className="h-4 w-4"/></button></div><div className="relative aspect-video w-full overflow-hidden bg-slate-950"><img src={image.url} alt={image.name} className="absolute inset-0 h-full w-full object-fill"/><canvas ref={canvasRef} width="1200" height="720" onMouseDown={start} onMouseMove={drawShape} onMouseUp={finish} onMouseLeave={finish} className={`absolute inset-0 h-full w-full ${tool==='Pointer'?'cursor-default':tool==='Text'?'cursor-text':'cursor-crosshair'}`}/></div></div><Section title="Annotation details"><Field label="Stamp name" value={stampName} onChange={setStampName}/><div className="mt-3"><Field type="textarea" rows={8} label="Notes" value={notes} onChange={setNotes}/></div><div className="mt-4 space-y-2"><button onClick={saveAnnotation} disabled={!hasDrawing||saving} className="primary-button w-full justify-center disabled:opacity-40"><Save className="h-4 w-4"/>{saving?'Saving…':'Save to patient media'}</button><button onClick={download} disabled={!hasDrawing} className="secondary-button w-full justify-center disabled:opacity-40"><Download className="h-4 w-4"/>Export PNG</button><button onClick={onGoToImages} className="secondary-button w-full justify-center"><ImagePlus className="h-4 w-4"/>Choose another image</button></div>{saved&&<p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700"><Check className="h-4 w-4"/>Saved successfully</p>}</Section></div></div>
}

function WorkflowSteps({current}) { const steps=['Select image','Choose tool','Annotate','Save or export'];return <div className="grid gap-2 sm:grid-cols-4">{steps.map((step,index)=>{const number=index+1,complete=number<current,active=number===current;return <div key={step} className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${active?'border-primary-400 bg-primary-50 text-primary-900':complete?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-slate-200 bg-white text-slate-500'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${active?'bg-primary-600 text-white':complete?'bg-emerald-600 text-white':'bg-slate-100 text-slate-500'}`}>{complete?<Check className="h-4 w-4"/>:number}</span><span className="text-sm font-semibold">{step}</span></div>})}</div> }

function Empty({ icon: Icon, text }) { return <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50"><Icon className="mb-3 h-12 w-12 text-slate-300" /><p className="text-sm text-slate-500">{text}</p></div> }
