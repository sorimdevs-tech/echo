import json
import os
import tempfile
import unittest
from unittest.mock import patch
from derived_measurements import recalculate

class DerivedTests(unittest.TestCase):
    def test_unapproved_results_unavailable_and_history_retained(self):
        with patch.dict(os.environ, {}, clear=True):
            result=recalculate({'doppler':{'rv_mpi':'9.99','sample_source':'2'}},'Fetal Echo')
        self.assertEqual(result['doppler']['rv_mpi'],'')
        self.assertEqual(result['_derived_legacy']['doppler.rv_mpi'],'9.99')
        self.assertEqual(result['_derived_status']['doppler.rv_mpi']['status'],'Awaiting approved formula')

    def test_synthetic_rule_recalculates_and_handles_missing_zero(self):
        # Synthetic engine fixture only. Not a clinical MPI definition.
        rule={'id':'TEST-ARITHMETIC-ONLY','output':['doppler','rv_mpi'],'approved_by':'Test fixture only','reference':'Synthetic arithmetic test, not clinical use','version':'test-1','expression':{'op':'divide','args':[{'input':['doppler','source_a']},{'input':['doppler','source_b']}]}}
        with tempfile.NamedTemporaryFile(mode='w',suffix='.json') as f:
            json.dump([rule],f);f.flush()
            with patch.dict(os.environ,{'ECHOAI_CALCULATION_RULES':f.name}):
                report={'doppler':{'rv_mpi':'999','source_a':'6','source_b':'2'}}
                self.assertEqual(recalculate(report,'Fetal Echo')['doppler']['rv_mpi'],'3.0')
                report['doppler']['source_a']='10'
                self.assertEqual(recalculate(report,'Fetal Echo')['doppler']['rv_mpi'],'5.0')
                for invalid in ('','0','abc','NaN','Infinity'):
                    report['doppler']['source_b']=invalid
                    self.assertEqual(recalculate(report,'Fetal Echo')['doppler']['rv_mpi'],'')

if __name__=='__main__':unittest.main(verbosity=2)
