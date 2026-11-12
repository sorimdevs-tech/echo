import {test} from 'node:test'
import assert from 'node:assert/strict'
import {initializeDerived,recalculateDerived} from './src/derivedMeasurements.js'
test('unapproved outputs are blank, historic data is retained, and source measurements stay intact',()=>{
  const input={doppler:{rv_mpi:'999',source_a:'6'}}
  const value=recalculateDerived(input)
  assert.equal(value.doppler.rv_mpi,'');assert.equal(value.doppler.source_a,'6')
  assert.equal(value._derived_legacy['doppler.rv_mpi'],'999');assert.equal(input.doppler.rv_mpi,'999')
  assert.equal(initializeDerived(input,'Fetal Echo')._derived_legacy,undefined)
})
test('synthetic arithmetic recalculates on source changes and clears invalid results',()=>{
  const rules=[{id:'TEST-ONLY',output:['doppler','rv_mpi'],version:'test',expression:{op:'divide',args:[{input:['doppler','a']},{input:['doppler','b']}]}}]
  let report={doppler:{a:'6',b:'2',rv_mpi:'999'}}
  report=recalculateDerived(report,rules);assert.equal(report.doppler.rv_mpi,'3')
  report.doppler.a='10';report=recalculateDerived(report,rules);assert.equal(report.doppler.rv_mpi,'5')
  for(const invalid of ['', '0','bad','NaN','Infinity']){
    report.doppler.b=invalid;report=recalculateDerived(report,rules);assert.equal(report.doppler.rv_mpi,'')
  }
})
