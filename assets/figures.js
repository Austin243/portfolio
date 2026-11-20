/* What the 3D figures show: which scenes each figure holds, and the caption, legend and one-line record
   of every scene. */
(() => {
  'use strict';
  const C = { H: '#DAE0E8', Na: '#B1A4C8', K: '#A122F7', U: '#7AA2AA', Mo: '#B486B0', S: '#D9B43A', Ta: '#6F8FB5', Ca: '#5E93B8',
    Mn: '#A0489C', Pd: '#B4B8B2', Sc: '#B58AC6', Cl: '#5DB870', Fe: '#C4762B', I: '#7D3AB8', Cs: '#2FA39A', O: '#D6402E',
    C: '#3A444F', N: '#3157BB' };
  const el = (...names) => names.map((n) => [n, C[n]]);
  const ELF = (max) => ({ name: 'ELF', max: max || 1, unit: '' });
  const RHO = { name: '', max: 3, unit: '⟨ρ⟩' };

  window.LP_SCENES = {
    // machine learning
    cah6_ca_elfnet: { ref: 'elfnet', field: ELF(0.71), legend: el('Ca', 'H'),
      spec: 'Ca lattice of <b>CaH<sub>6</sub></b> · ELF from ELFNet · grid 32×32×32',
      label: 'Interactive 3D view: ELF of the calcium lattice of CaH6 predicted by ELFNet, with the hydrogen sites marked',
      cap: 'The calcium lattice of CaH<sub>6</sub>, with the hydrogen left out of the calculation. ELFNet predicts this ELF from superposed atomic densities, and the yellow surface encloses the sites where the hydrogens sit in CaH<sub>6</sub>, drawn as small spheres.' },
    cah6_ca_dft: { ref: 'elfnet', field: ELF(0.71), legend: el('Ca', 'H'),
      spec: 'Ca lattice of <b>CaH<sub>6</sub></b> · ELF from DFT · grid 28×28×28',
      label: 'Interactive 3D view: ELF of the calcium lattice of CaH6 from DFT, with the hydrogen sites marked',
      cap: 'The DFT ELF of the same lattice, for comparison. It is highest at the hydrogen sites.' },
    cah6_cage: { ref: 'elfnet', legend: el('Ca', 'H'),
      spec: '<b>CaH<sub>6</sub></b> · Im-3m · Ca 2, H 12',
      label: 'Interactive 3D view: the hydrogen cage of CaH6 around its calcium atoms',
      cap: 'The full CaH<sub>6</sub> structure, a superhydride. Its hydrogens form a cage of squares and hexagons around each calcium.' },
    mnpd_wisp_down: { ref: 'wisp', field: ELF(0.45), legend: el('Mn', 'Pd'),
      spec: '<b>MnPd</b> · spin down · WISP · grid 28×28×28',
      label: 'Interactive 3D view: spin-down ELF of MnPd predicted by WISP',
      cap: 'MnPd, spin-down channel, predicted by WISP from the structure and the magnetic moments on the atoms. At ELF 0.30 a large region surrounds the Pd atom.' },
    mnpd_wisp_up: { ref: 'wisp', field: ELF(0.45), legend: el('Mn', 'Pd'),
      spec: '<b>MnPd</b> · spin up · WISP · grid 28×28×28',
      label: 'Interactive 3D view: spin-up ELF of MnPd predicted by WISP',
      cap: 'The spin-up channel from WISP at the same isovalue. The large region around Pd is absent, and that difference between the two channels is what WISP has to get right.' },
    mnpd_dft_down: { ref: 'wisp', field: ELF(0.45), legend: el('Mn', 'Pd'),
      spec: '<b>MnPd</b> · spin down · DFT · grid 28×28×28',
      label: 'Interactive 3D view: spin-down ELF of MnPd from DFT',
      cap: 'The spin-down channel from DFT, for comparison (Fig. 2b of the preprint).' },
    mnpd_dft_up: { ref: 'wisp', field: ELF(0.45), legend: el('Mn', 'Pd'),
      spec: '<b>MnPd</b> · spin up · DFT · grid 28×28×28',
      label: 'Interactive 3D view: spin-up ELF of MnPd from DFT',
      cap: 'The spin-up channel from DFT, for comparison (Fig. 2b of the preprint).' },
    sc5cl8_wisp: { ref: 'wisp', field: ELF(1), legend: el('Sc', 'Cl'),
      spec: '<b>Sc<sub>5</sub>Cl<sub>8</sub></b> · electride · WISP, moments from the geometry · grid 30×84×84',
      label: 'Interactive 3D view: ELF of the electride Sc5Cl8 predicted by WISP, with its interstitial maximum marked',
      cap: 'Sc<sub>5</sub>Cl<sub>8</sub>, a known electride, from WISP with only the geometry as input. Besides the shells around the atoms, the ELF reaches 0.83 at the center of the cut face, 2.2 Å from the nearest atom: the interstitial maximum of the electride.' },
    sc5cl8_dft: { ref: 'wisp', field: ELF(1), legend: el('Sc', 'Cl'),
      spec: '<b>Sc<sub>5</sub>Cl<sub>8</sub></b> · electride · DFT · grid 30×84×84',
      label: 'Interactive 3D view: ELF of the electride Sc5Cl8 from DFT, with its interstitial maximum marked',
      cap: 'The same view from DFT, for comparison (Fig. 5 of the preprint). The interstitial maximum is 0.83 here as well.' },

    // electrides
    mos2_vacancy: { ref: 'tmdc', field: ELF(1), legend: el('Mo', 'S'),
      spec: '<b>MoS<sub>2</sub></b> · 2H monolayer, 4×4 supercell · Mo 16, S 31 · ELF grid 108×108×200',
      label: 'Interactive 3D view: MoS2 monolayer flake with one sulfur vacancy at its center',
      cap: 'A MoS<sub>2</sub> monolayer with one sulfur removed at the center of the flake. Every S carries a lone-pair ELF basin; at the vacancy a smaller basin with no atom inside sits where the sulfur was: the electride-like vacancy state.' },
    h2_c2c_b15: { ref: 'h2', field: RHO, legend: el('H'),
      spec: '<b>H<sub>2</sub></b> · C2/c-12 · band 15 at Γ, the LUMO',
      label: 'Interactive 3D view: C2/c solid hydrogen with the band-15 state running in channels between the H2 molecules',
      cap: 'C2/c-12 solid hydrogen, band 15 at Γ (Fig. 3a of the paper). The lowest conduction state runs in continuous channels between the H<sub>2</sub> molecules: electrons moving into the interstitial space as the gap closes.' },
    h2_ama2_b25: { ref: 'h2', field: RHO, legend: el('H'),
      spec: '<b>H<sub>2</sub></b> · Ama2 · 425 GPa · band 25 at R',
      label: 'Interactive 3D view: Ama2 solid hydrogen with the band-25 state in the interstitial space between molecular layers',
      cap: 'Ama2 hydrogen at 425 GPa, band 25 at R (Fig. 3b of the paper). Compression pushes this state out of the H–H bonds and into the interstitial space between the molecular layers.' },
    h2_p63m_b9: { ref: 'h2', field: RHO, legend: el('H'),
      spec: '<b>H<sub>2</sub></b> · P6<sub>3</sub>/m · 325 GPa · band 9 at A',
      label: 'Interactive 3D view: P6_3/m solid hydrogen with the band-9 state in columns along c',
      cap: 'P6<sub>3</sub>/m hydrogen, band 9 at A (Fig. 3c of the paper): interstitial maxima stacked in columns along <i>c</i>, between the H<sub>2</sub> molecules.' },
    h2_p63m_b11: { ref: 'h2', field: RHO, legend: el('H'),
      spec: '<b>H<sub>2</sub></b> · P6<sub>3</sub>/m · 325 GPa · band 11 at A',
      label: 'Interactive 3D view: P6_3/m solid hydrogen with the band-11 state in interstitial pockets',
      cap: 'P6<sub>3</sub>/m hydrogen, band 11 at A (Fig. 3d of the paper): the next state up also gathers in the interstitial pockets instead of on the H–H bonds.' },
    tas2_vacancy: { ref: 'tmd-vacancies', legend: el('S', 'Ta'),
      spec: '<b>TaS<sub>2</sub></b> · monolayer, 4×4 supercell · Ta 16, S 31',
      label: 'Interactive 3D view: TaS2 monolayer with one sulfur vacancy, seen from below',
      cap: 'A TaS<sub>2</sub> sheet with one sulfur missing from the lower layer, seen from below. The sulfur above the gap has sunk toward the tantalum plane.' },

    // superhydrides
    nakh12_60GPa: { ref: 'nakh12', field: ELF(1), legend: el('Na', 'K', 'H'),
      spec: '<b>NaKH<sub>12</sub></b> · Fm-3m · 60 GPa · Na 4, K 4, H 48 · ELF grid 54×54×54',
      label: 'Interactive 3D view: NaKH12 cell at 60 GPa with ELF isosurfaces around each H2 unit',
      cap: 'NaKH<sub>12</sub> at 60 GPa. Yellow ELF isosurfaces wrap each H<sub>2</sub> unit; six of them sit on the faces of every small Na<sub>4</sub>K<sub>4</sub> cube, bonds pointing at its center.' },
    nak_sublattice: { ref: 'nakh12', field: ELF(1), legend: el('Na', 'K'),
      spec: '<b>(NaK)H<sub>0</sub></b> sublattice · 60 GPa cell · Na 4, K 4 · ELF grid 54×54×54',
      label: 'Interactive 3D view: Na-K sublattice with interstitial ELF basins at the centers of the small Na4K4 cubes',
      cap: 'The same cell with the hydrogen taken out. An interstitial ELF basin sits at the center of each small Na<sub>4</sub>K<sub>4</sub> cube: the site the six H<sub>2</sub> units gather around in NaKH<sub>12</sub>.' },
    u10h84_structure: { ref: 'superhydrides', legend: el('U', 'H'),
      spec: '<b>U<sub>10</sub>H<sub>84</sub></b> · I4/m · 200 GPa · U 10, H 84',
      label: 'Interactive 3D view: U10H84 superhydride cell with its hydrogen cage network',
      cap: 'U<sub>10</sub>H<sub>84</sub> (I4/m, 200 GPa), one of the superhydrides from the template-guided search, with its hydrogen cage network.' },
    u10_template: { ref: 'superhydrides', field: ELF(1), legend: el('U'),
      spec: '<b>U<sub>10</sub></b> metal lattice · I4/m · U 10 · ELF grid 60×60×40',
      label: 'Interactive 3D view: bare U10 metal lattice with its ELF isosurface',
      cap: 'The bare U<sub>10</sub> metal lattice, step one of the two-step search. At ELF 0.50 the isosurface shows the interstitial basins between the U atoms as well as the shell around each atom. Same view and scale as U<sub>10</sub>H<sub>84</sub>.' },

    // high pressure
    fei2_0gpa: { ref: 'fe', legend: el('Fe', 'I'),
      spec: '<b>FeI<sub>2</sub></b> · P-3m1 · 0 GPa · Fe 1, I 2',
      label: 'Interactive 3D view: layered FeI2 at ambient pressure',
      cap: 'FeI<sub>2</sub> at ambient pressure, from the set of iron and p-block structures behind the paper: sheets of iron between layers of iodine.' },
    fe3i_300gpa: { ref: 'fe', legend: el('Fe', 'I'),
      spec: '<b>Fe<sub>3</sub>I</b> · Pm-3m · 300 GPa · Fe 3, I 1',
      label: 'Interactive 3D view: cubic Fe3I at 300 GPa',
      cap: 'Fe<sub>3</sub>I at 300 GPa, from the same set: a cubic structure with iodine at the corners of the cell and iron on its faces.' },
    cso_p63mmc_150gpa: { ref: 'cs-polyoxides', legend: el('Cs', 'O'),
      spec: '<b>CsO</b> · P6<sub>3</sub>/mmc · 150 GPa · Cs 4, O 4',
      label: 'Interactive 3D view: CsO at 150 GPa with its oxygens in pairs',
      cap: 'CsO at 150 GPa. The oxygens sit in pairs, 1.41 Å apart.' },
    cso_r3m_250gpa: { ref: 'cs-polyoxides', legend: el('Cs', 'O'),
      spec: '<b>CsO</b> · R-3m · 250 GPa · Cs 2, O 2',
      label: 'Interactive 3D view: CsO at 250 GPa with the oxygen pairs broken up',
      cap: 'CsO at 250 GPa, past the transition near 221 GPa. The pairs have come apart, and each oxygen now sits 1.93 Å from a cesium.' },

    // reactions
    acn_m4_35gpa: { ref: 'polymerization', legend: el('C', 'H', 'N').concat([['unreacted', '#BCC2C8']]),
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with three molecules linked together',
      cap: 'Crystalline acetonitrile at 35 GPa, 48 molecules in the cell. Three of them have linked into one unit, drawn in full color; the rest are faded.' },
    na100_aminopyrimidine: { ref: 'oligomerization', legend: el('C', 'N', 'H', 'Na'),
      spec: '<b>Na(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a sodium (100) surface',
      cap: '4-Amino-2,6-dimethylpyrimidine on a sodium (100) surface: three acetonitrile molecules joined into one ring. This is the product seen in experiment.' },
    na100_triazine: { ref: 'oligomerization', legend: el('C', 'N', 'H', 'Na'),
      spec: '<b>Na(100)</b> · 2,4,6-trimethyl-1,3,5-triazine · C 6, N 3, H 9',
      label: 'Interactive 3D view: trimethyltriazine on a sodium (100) surface',
      cap: 'The triazine, the other ring that three acetonitrile molecules can close into, on the same surface.' }
  };

  // A figure is a row of panels (a, b, c); a panel can hold several states of the same system. The figures are numbered
  // in this order, and the page puts each one where its id is (see the three parts of the Figures section in index.html).
  // A figure with `pair` shows two views side by side that turn together; its states name a left and a right scene.
  window.LP_FIGS = [
    { id: 'fig-wisp', title: 'WISP next to DFT. Turn either view and the other follows.', pair: ['WISP', 'DFT'], panels: [
      { name: 'MnPd', states: [['mnpd_wisp_down', 'mnpd_dft_down', 'Spin down'], ['mnpd_wisp_up', 'mnpd_dft_up', 'Spin up']] },
      { name: 'Sc<sub>5</sub>Cl<sub>8</sub>', states: [['sc5cl8_wisp', 'sc5cl8_dft', 'Sc₅Cl₈']] }],
      caps: {
        mnpd_wisp_down: 'MnPd, spin-down channel. WISP predicts it from the structure and the magnetic moments on the atoms; the other view is the DFT calculation. At ELF 0.30 a large region surrounds the Pd atom in both.',
        mnpd_wisp_up: 'The spin-up channel at the same isovalue. The large region around Pd is absent in both views, and that difference between the two channels is what WISP has to get right.',
        sc5cl8_wisp: 'Sc<sub>5</sub>Cl<sub>8</sub>, a known electride. WISP had only the geometry as input. Besides the shells around the atoms, the ELF reaches 0.83 at the center of the cut face, 2.2 Å from the nearest atom, in the prediction and in DFT alike: the interstitial maximum of the electride.' },
      specs: {
        mnpd_wisp_down: '<b>MnPd</b> · spin down · WISP and DFT · both on a 28×28×28 grid',
        mnpd_wisp_up: '<b>MnPd</b> · spin up · WISP and DFT · both on a 28×28×28 grid',
        sc5cl8_wisp: '<b>Sc<sub>5</sub>Cl<sub>8</sub></b> · electride · WISP with moments from the geometry, and DFT · both on a 30×84×84 grid' } },
    { id: 'fig-elfnet', title: 'ELFNet next to DFT. Turn either view and the other follows.', pair: ['ELFNet', 'DFT'], panels: [
      { name: 'CaH<sub>6</sub>', states: [['cah6_ca_elfnet', 'cah6_ca_dft', 'Ca lattice']] }],
      caps: {
        cah6_ca_elfnet: 'The calcium lattice of CaH<sub>6</sub>, with the hydrogen left out of the calculation. ELFNet predicts its ELF from superposed atomic densities; the other view is the DFT calculation. In both, the yellow surface encloses the sites where the hydrogens sit in CaH<sub>6</sub>, drawn as small spheres.' },
      specs: { cah6_ca_elfnet: 'Ca lattice of <b>CaH<sub>6</sub></b> · ELFNet on a 32×32×32 grid, DFT on 28×28×28' } },
    { id: 'fig-electrides', title: 'Electrides in 2D and under pressure.', panels: [
      { name: 'MoS<sub>2</sub> vacancy', states: [['mos2_vacancy', 'MoS₂ · S vacancy']] },
      { name: 'Solid H<sub>2</sub>', states: [['h2_c2c_b15', 'C2/c · band 15'], ['h2_ama2_b25', 'Ama2 · band 25'], ['h2_p63m_b9', 'P6₃/m · band 9'], ['h2_p63m_b11', 'P6₃/m · band 11']] },
      { name: 'TaS<sub>2</sub> vacancy', states: [['tas2_vacancy', 'TaS₂ · S vacancy']] }] },
    { id: 'fig-superhydrides', title: 'Chemical templates for superhydrides.', panels: [
      { name: 'NaKH<sub>12</sub>', states: [['nakh12_60GPa', 'NaKH₁₂'], ['nak_sublattice', 'Na–K only']] },
      { name: 'U<sub>10</sub>H<sub>84</sub>', states: [['u10h84_structure', 'U₁₀H₈₄'], ['u10_template', 'U₁₀ lattice · ELF']] }] },
    { id: 'fig-pressure', title: 'Iron and cesium compounds under pressure.', panels: [
      { name: 'Fe–I', states: [['fei2_0gpa', 'FeI₂ · 0 GPa'], ['fe3i_300gpa', 'Fe₃I · 300 GPa']] },
      { name: 'CsO', states: [['cso_p63mmc_150gpa', 'CsO · 150 GPa'], ['cso_r3m_250gpa', 'CsO · 250 GPa']] }] },
    { id: 'fig-reactions', title: 'Acetonitrile under pressure and on sodium.', panels: [
      { name: 'CH<sub>3</sub>CN, 35 GPa', states: [['acn_m4_35gpa', 'CH₃CN · 35 GPa']] },
      { name: 'On Na(100)', states: [['na100_aminopyrimidine', 'Aminopyrimidine'], ['na100_triazine', 'Triazine']] }] }
  ];
})();
