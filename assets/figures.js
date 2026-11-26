/* What the 3D figures show: which scenes each figure holds, and the caption, legend and one-line record
   of every scene. */
(() => {
  'use strict';
  const C = { H: '#DAE0E8', Na: '#B1A4C8', K: '#A122F7', U: '#7AA2AA', Mo: '#B486B0', S: '#D9B43A', Ta: '#6F8FB5', Ca: '#5E93B8',
    Mn: '#A0489C', Pd: '#B4B8B2', Sc: '#B58AC6', Cl: '#5DB870', Fe: '#C4762B', I: '#7D3AB8', Cs: '#2FA39A', Ba: '#8B6BB8', O: '#D6402E',
    C: '#3A444F', N: '#3157BB', Li: '#86E074' };
  const el = (...names) => names.map((n) => [n, C[n]]);
  const ELF = (max) => ({ name: 'ELF', max: max || 1, unit: '' });
  const RHO = { name: '', max: 3, unit: '⟨ρ⟩' };
  const PATH = el('C', 'H', 'N').concat([['unreacted', '#BCC2C8']]);
  const SHELL = el('C', 'N', 'H', 'O').concat([['C of the alcohol', '#A2937F'], ['farther molecules', '#BCC2C8']]);
  const SEARCH = 'a fine-tuned UMA-S potential, 0 GPa';

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
      cap: 'A MoS<sub>2</sub> monolayer with one sulfur removed at the center of the flake. Every S carries a lone-pair ELF basin; at the vacancy a smaller basin with no atom inside sits in the hole the sulfur left, a little closer to the Mo layer: the electride-like vacancy state.' },
    h2_c2c_b15: { ref: 'h2', field: RHO, legend: el('H'),
      spec: '<b>H<sub>2</sub></b> · C2/c-12 · band 15 at Γ, a conduction-band state',
      label: 'Interactive 3D view: C2/c solid hydrogen with the band-15 state running in channels between the H2 molecules',
      cap: 'C2/c-12 solid hydrogen, band 15 at Γ (Fig. 3a of the paper). This conduction-band state runs in channels between the H<sub>2</sub> molecules: electrons moving into the interstitial space as the gap closes.' },
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
      spec: '<b>U<sub>10</sub>H<sub>84</sub></b> · I4/m · U 10, H 84',
      label: 'Interactive 3D view: U10H84 superhydride cell with its hydrogen cage network',
      cap: 'U<sub>10</sub>H<sub>84</sub> (I4/m), one of the superhydrides from the template-guided search, with its hydrogen cage network.' },
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
    cs2bao3_cm_250gpa: { ref: 'cs-core', legend: el('Cs', 'Ba', 'O'),
      spec: '<b>Cs<sub>2</sub>BaO<sub>3</sub></b> · Cm · 250 GPa · Cs 4, Ba 2, O 6',
      label: 'Interactive 3D view: Cs2BaO3 at 250 GPa, with each cesium between two oxygens in a nearly straight line',
      cap: 'Cs<sub>2</sub>BaO<sub>3</sub> at 250 GPa. There are no O–O pairs: the closest two oxygens are 2.56 Å apart. Each cesium sits between two oxygens in a nearly straight line, 2.06 to 2.14 Å away.' },
    cs2bao3_elf_250gpa: { ref: 'cs-core', field: ELF(0.9), legend: el('Cs', 'Ba', 'O'),
      spec: '<b>Cs<sub>2</sub>BaO<sub>3</sub></b> · Cm · 250 GPa · ELF from DFT · grid 48×30×36',
      label: 'Interactive 3D view: ELF of Cs2BaO3 at 250 GPa, cut on the plane that holds both kinds of cesium',
      cap: 'The ELF of Cs<sub>2</sub>BaO<sub>3</sub> at 250 GPa. The front face is the plane that holds both kinds of cesium (Fig. 4b of the preprint). Between a cesium and each of its two close oxygens the ELF stays at about 0.35 or above; toward the farther oxygens it drops to 0.2. At 0.40 the yellow surface joins one kind of cesium to its two oxygens, and at 0.36 it joins both.' },

    // reactions (work in progress at Oak Ridge)
    acn_path_m0: { legend: el('C', 'H', 'N'),
      spec: '<b>CH<sub>3</sub>CN</b> · β phase · 35 GPa · C 96, H 144, N 48 · the start of the path',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa before any molecule has reacted',
      cap: 'Crystalline acetonitrile at 35 GPa, 48 molecules in the cell, at the start of the path. No molecule has reacted yet.' },
    acn_path_m1: { legend: PATH,
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48 · dimer',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with two molecules joined',
      cap: 'Two molecules have joined, drawn in full color; the rest are faded. This first bond is the hardest step of the path: 2.66 eV, or 2.67 eV with DFT.' },
    acn_path_m3: { legend: PATH,
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48 · trimer',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with three molecules joined',
      cap: 'A third molecule has joined. This addition costs 1.40 eV.' },
    acn_path_m7: { legend: PATH,
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48 · tetramer',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with four molecules joined',
      cap: 'Four molecules joined. The fourth adds as a branch over 0.73 eV, after a rearrangement that costs 2.23 eV.' },
    acn_path_m9: { legend: PATH,
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48 · pentamer',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with five molecules joined',
      cap: 'Five molecules joined. The last one adds through an N–H group that an earlier hydrogen transfer left in the chain, over only 0.68 eV (0.66 eV with DFT). This cell lies 1.37 eV below the start.' },
    acn_meoh_25: { legend: SHELL,
      spec: '<b>7 CH<sub>3</sub>CN : 3 CH<sub>3</sub>OH</b> · cell of 14 + 6 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 55 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 7 to 3 crystal of acetonitrile and methanol',
      cap: 'Seven acetonitrile to three methanol, about 25% methanol by volume. One acetonitrile is shown with its twelve nearest molecules. Only two of them are methanol, and five of the six methanols in the cell hydrogen-bond to each other, not to a nitrile.' },
    acn_meoh_50: { legend: SHELL,
      spec: '<b>CH<sub>3</sub>CN : CH<sub>3</sub>OH</b>, 1 : 1 · cell of 2 + 2 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 42 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 1 to 1 crystal of acetonitrile and methanol',
      cap: 'Acetonitrile and methanol, one to one. Seven of the twelve nearest molecules are methanol, and every methanol in the cell points its O–H at a nitrile nitrogen (thin lines).' },
    acn_meoh_75: { legend: SHELL,
      spec: '<b>CH<sub>3</sub>CN : 4 CH<sub>3</sub>OH</b> · cell of 1 + 4 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 36 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 1 to 4 crystal of acetonitrile and methanol',
      cap: 'One acetonitrile to four methanol, about 75% methanol by volume. Eight of the twelve nearest molecules are methanol, but their O–H groups bond to each other in chains (thin lines), and none reaches the nitrile.' },
    acn_ipa_25: { legend: SHELL,
      spec: '<b>13 CH<sub>3</sub>CN : 3 (CH<sub>3</sub>)<sub>2</sub>CHOH</b> · cell of 13 + 3 molecules · lowest of 1,224 packings so far · ' + SEARCH + ' · 76 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 13 to 3 crystal of acetonitrile and isopropanol',
      cap: 'Thirteen acetonitrile to three isopropanol, about 25% isopropanol by volume. Nine of the thirteen acetonitriles in the cell have no isopropanol among their twelve nearest molecules, and this is one of them. This search is half finished.' },
    acn_ipa_50: { legend: SHELL,
      spec: '<b>CH<sub>3</sub>CN : (CH<sub>3</sub>)<sub>2</sub>CHOH</b>, 1 : 1 · cell of 2 + 2 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 60 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 1 to 1 crystal of acetonitrile and isopropanol',
      cap: 'Acetonitrile and isopropanol, one to one. Seven of the twelve nearest molecules are isopropanol, and here too every O–H points at a nitrile nitrogen (thin lines).' },
    acn_ipa_75: { legend: SHELL,
      spec: '<b>CH<sub>3</sub>CN : 2 (CH<sub>3</sub>)<sub>2</sub>CHOH</b> · cell of 1 + 2 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 64 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 1 to 2 crystal of acetonitrile and isopropanol',
      cap: 'One acetonitrile to two isopropanol, about 75% isopropanol by volume. Ten of the twelve nearest molecules are isopropanol, and their O–H groups bond to each other (thin lines), not to the nitrile.' },
    li100_aminopyrimidine: { legend: el('C', 'N', 'H', 'Li'),
      spec: '<b>Li(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a lithium (100) surface',
      cap: 'The same ring on lithium. Lithium needs the largest steps of the three metals: 33.7 kcal/mol on its route to this ring, and 26.6 for a carbon chain.' },
    na100_aminopyrimidine: { legend: el('C', 'N', 'H', 'Na'),
      spec: '<b>Na(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a sodium (100) surface',
      cap: '4-Amino-2,6-dimethylpyrimidine on a sodium (100) surface: three acetonitrile molecules joined into one ring. This is the product seen in experiment. Ten steps lead to it from the film of acetonitrile, none above 12.3 kcal/mol until the last hydrogen transfer, at 22.2.' },
    k100_aminopyrimidine: { legend: el('C', 'N', 'H', 'K'),
      spec: '<b>K(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a potassium (100) surface',
      cap: 'The same ring on potassium. Potassium has the easiest first steps: it cleaves the C–CN bond over 7.5 kcal/mol, and grows a chain of eight molecules with no step above 11.6.' },
    na100_triazine: { legend: el('C', 'N', 'H', 'Na'),
      spec: '<b>Na(100)</b> · 2,4,6-trimethyl-1,3,5-triazine · C 6, N 3, H 9',
      label: 'Interactive 3D view: trimethyltriazine on a sodium (100) surface',
      cap: 'The triazine, the other ring that three acetonitrile molecules can close into, on sodium. Its largest step there is 11.3 kcal/mol.' }
  };

  // A figure is a row of panels (a, b, c); a panel can hold several states of the same system. The figures are numbered
  // in this order, and the page puts each one where its id is (in its paper's card in the Figures section of index.html).
  // A figure with `pair` shows two views side by side that turn together; its states name a left and a right scene.
  window.LP_FIGS = [
    // the two models next to DFT: each is a slide at the end of its step figure (see scheme-base.js)
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
    // my work at Oak Ridge: slides at the end of its step figure
    { id: 'fig-reactions', title: 'Acetonitrile in three surroundings.', panels: [
      { name: 'Under pressure', states: [['acn_path_m0', 'Start'], ['acn_path_m1', 'Dimer'], ['acn_path_m3', 'Trimer'], ['acn_path_m7', 'Tetramer'], ['acn_path_m9', 'Pentamer']] },
      { name: 'With methanol', states: [['acn_meoh_25', '7 : 3'], ['acn_meoh_50', '1 : 1'], ['acn_meoh_75', '1 : 4']] },
      { name: 'With isopropanol', states: [['acn_ipa_25', '13 : 3'], ['acn_ipa_50', '1 : 1'], ['acn_ipa_75', '1 : 2']] },
      { name: 'On Li, Na and K', states: [['li100_aminopyrimidine', 'Li'], ['na100_aminopyrimidine', 'Na'], ['k100_aminopyrimidine', 'K'], ['na100_triazine', 'Triazine on Na']] }] },
    // the other projects: a preprint and work in progress
    { id: 'fig-cso', title: 'CsO at 150 and 250 GPa.', panels: [
      { name: 'CsO', states: [['cso_p63mmc_150gpa', 'CsO · 150 GPa'], ['cso_r3m_250gpa', 'CsO · 250 GPa']] }] },
    { id: 'fig-cs2bao3', title: 'Cs<sub>2</sub>BaO<sub>3</sub> at 250 GPa.', panels: [
      { name: 'Cs<sub>2</sub>BaO<sub>3</sub>', states: [['cs2bao3_cm_250gpa', 'Structure'], ['cs2bao3_elf_250gpa', 'ELF']] }] },
    { id: 'fig-tas2', title: 'A sulfur vacancy in a TaS<sub>2</sub> sheet.', panels: [
      { name: 'TaS<sub>2</sub> vacancy', states: [['tas2_vacancy', 'TaS₂ · S vacancy']] }] }
  ];
})();
