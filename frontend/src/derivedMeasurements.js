export const isDerivedPath = path => {
  const key = String(path.at(-1) || '').toLowerCase()
  return ['mpi','pi','mv_e_a','mitral_e_a','tricuspid_e_a'].includes(key) || /_(mpi|pi|tdimpi|e_e)$/.test(key)
}
export function initializeDerived(report, scanType) {
  const value=recalculateDerived(report,[],scanType)
  delete value._derived_legacy
  return value
}
const lookup = (report,path) => path.reduce((node,key)=>node?.[key], report)
function evaluate(node, report, depth=0) {
  if (depth>20) throw Error('Rule nesting limit')
  let value
  if (node.input) {
    const input=lookup(report,node.input)
    if (input===null || input===undefined || (typeof input==='string' && input.trim()==='') || typeof input==='boolean') throw Error('Missing input')
    value=Number(input)
  } else if ('constant' in node) value=Number(node.constant)
  else {
    const args=(node.args || []).map(n=>evaluate(n,report,depth+1))
    if(args.length!==2)throw Error('Invalid rule')
    const [a,b]=args
    if(node.op==='add')value=a+b
    else if(node.op==='subtract')value=a-b
    else if(node.op==='multiply')value=a*b
    else if(node.op==='divide' && b!==0)value=a/b
    else throw Error('Invalid arithmetic')
  }
  if(!Number.isFinite(value))throw Error('Invalid result')
  return value
}
export function recalculateDerived(input, definitions=[], scanType='') {
  const report=structuredClone(input)
  const approved=new Map(definitions.filter(r=>!r.scan_type || r.scan_type===scanType).map(r=>[r.output.join('.'),r]))
  const states={}
  const walk=(node,path=[])=>{
    for(const [key,value] of Object.entries(node)){
      if(key.startsWith('_derived'))continue
      const current=[...path,key]
      if(value && typeof value==='object' && !Array.isArray(value))walk(value,current)
      else if(isDerivedPath(current)){
        const name=current.join('.'),rule=approved.get(name)
        if(!rule){
          if(value!=='' && value!==null && value!==undefined){report._derived_legacy ||= {};if(!(name in report._derived_legacy))report._derived_legacy[name]=value}
          node[key]='';states[name]={status:'Awaiting approved formula'}
        } else {
          try {node[key]=String(Number(evaluate(rule.expression,report).toFixed(rule.precision ?? 4)));states[name]={status:'Calculated',rule:rule.id,version:rule.version}}
          catch {node[key]='';states[name]={status:'Unavailable — check source inputs',rule:rule.id,version:rule.version}}
        }
      }
    }
  }
  walk(report);report._derived_status=states;return report
}
