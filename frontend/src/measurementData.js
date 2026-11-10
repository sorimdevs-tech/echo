import { recalculateDerived } from './derivedMeasurements.js'
// Display stored structured values only; missing values stay unavailable.
export function getScanMeasurements(scan) {
  const adult = recalculateDerived(scan.adult_echo_report || {})
  const ped = recalculateDerived(scan.pediatric_echo_report || {})
  const fetal = recalculateDerived(scan.fetal_echo_report || {})
  const lvef = adult.m_mode_measurement?.lv?.lv_ef || ped.biometry?.lvef || '—'
  const laDim = adult.m_mode_measurement?.ao_la?.la_diam_s || ped.biometry?.la || '—'
  const aovVmax = adult.doppler_measurement?.aortic_valve?.aov_vmax || '—'
  const aovMeanGrad = adult.doppler_measurement?.aortic_valve?.aov_mean_grad || '—'
  const aovArea = adult.two_d_measurement?.aortic_valve?.aov_area_cont_vti || '—'
  const pasp = '—' // No approved source mapping/calculation supplied.

  return {
    // 2D Measurements
    twoD: {
      aoAnnulus: adult.two_d_measurement?.aorta?.ao_annulus_diam_d || '—',
      sinus: adult.echo_details?.sinus || '—',
      stj: adult.echo_details?.stj || '—',
      ascAo: adult.echo_details?.ascending_aorta || '—',
      aovArea: aovArea,
      lvotDiam: adult.two_d_measurement?.aortic_valve?.lvot_diam_s || '—',
      lvotArea: adult.two_d_measurement?.aortic_valve?.lvot_area || '—',
      mvArea: adult.two_d_measurement?.mitral_valve?.mv_area_planim || '—',
      tvArea: adult.two_d_measurement?.tricuspid_valve?.tv_area_planim || '—',
      lvAreaD: adult.two_d_measurement?.left_ventricle?.a4c_lv_area_d || '—',
      lvVolD: adult.two_d_measurement?.left_ventricle?.a4c_lv_vol_d || '—',
      lvVolS: adult.two_d_measurement?.left_ventricle?.a4c_lv_vol_s || '—',
      strokeVolume: adult.two_d_measurement?.left_ventricle?.a4c_lv_sv || '—',
    },
    // M-Mode & Functional
    mMode: {
      ivsd: adult.m_mode_measurement?.lv?.ivs_d || ped.biometry?.ivsd || '—',
      ivss: adult.m_mode_measurement?.lv?.ivs_s || ped.biometry?.ivss || '—',
      lvidd: adult.m_mode_measurement?.lv?.lvid_d || ped.biometry?.lvidd || '—',
      lvids: adult.m_mode_measurement?.lv?.lvid_s || ped.biometry?.lvids || '—',
      lvpwd: adult.m_mode_measurement?.lv?.lvpw_d || ped.biometry?.lvpwd || '—',
      lvpws: adult.m_mode_measurement?.lv?.lvpw_s || ped.biometry?.lvpws || '—',
      lvef: lvef,
      lvfs: adult.m_mode_measurement?.lv?.lv_percent_fs || ped.biometry?.lvfs || '—',
      laDim: laDim,
      aoDim: adult.m_mode_measurement?.ao_la?.ao_diam_d || ped.biometry?.ao || '—',
      laAoRatio: ped.biometry?.la_ao || '—',
      tapse: adult.m_mode_measurement?.tricuspid_valve?.tapse || '—',
      mapse: adult.m_mode_measurement?.mitral_valve?.mapse || '—',
      mvEpss: adult.m_mode_measurement?.mitral_valve?.mv_epss || '—',
    },
    // Z-Scores
    zScores: {
      aoAnnulusZ: fetal.aortic?.aortic_valve?.z_score || '—',
      ascAoZ: fetal.aortic?.aortic_valve?.ascending_aorta_z_score || '—',
      mvAnnulusZ: fetal.aortic?.mitral_valve?.z_score || '—',
      transverseArchZ: fetal.aortic?.pulmonary_valve?.transverse_arch_z_score || '—',
      lvWidthZ: fetal.aortic?.lv?.width_z_score || '—',
      lvLengthZ: fetal.aortic?.lv?.length_z_score || '—',
      trAnnulusZ: fetal.aortic?.tricuspid_valve?.z_score || '—',
    },
    // Doppler Analysis
    doppler: {
      aovVmax: aovVmax,
      aovMeanGrad: aovMeanGrad,
      aovPeakGrad: adult.doppler_measurement?.aortic_valve?.aov_peak_grad || '—',
      aovVti: adult.doppler_measurement?.aortic_valve?.aov_vti || '—',
      mvE: ped.doppler?.valve_flow?.mitral_e || fetal.doppler?.valves?.mitral_e_wave || '—',
      mvA: ped.doppler?.valve_flow?.mitral_a || fetal.doppler?.valves?.mitral_a_wave || '—',
      mvEA: adult.doppler_measurement?.mitral_valve?.mv_e_a || ped.doppler?.valve_flow?.mitral_e_a || '—',
      tvEA: ped.doppler?.valve_flow?.tricuspid_e_a || '—',
      trVmax: adult.doppler_measurement?.tricuspid_valve?.tr_vmax || '—',
      trPeakGrad: adult.doppler_measurement?.tricuspid_valve?.tr_peak_grad || '—',
      pasp: pasp,
      lvMpi: ped.doppler?.mpi_method_1?.left_ventricle_mpi || fetal.doppler?.mpi_method_1?.lv_mpi || '—',
      rvMpi: ped.doppler?.mpi_method_1?.right_ventricle_mpi || fetal.doppler?.mpi_method_1?.rv_mpi || '—',
    },
  }
}
