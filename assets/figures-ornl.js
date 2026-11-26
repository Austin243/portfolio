/* The 3D figures of the page on my work at Oak Ridge (ornl.html): which scenes each figure holds, and the caption, legend
   and one-line record of every scene. The page loads this in place of figures.js. */
(() => {
  'use strict';
  const C = { H: '#DAE0E8', Na: '#B1A4C8', K: '#A122F7', Li: '#86E074', O: '#D6402E', C: '#3A444F', N: '#3157BB' };
  const el = (...names) => names.map((n) => [n, C[n]]);
  const PATH = el('C', 'H', 'N').concat([['unreacted', '#BCC2C8']]);
  const SHELL = el('C', 'N', 'H', 'O').concat([['C of the alcohol', '#A2937F'], ['other molecules', '#BCC2C8']]);
  const SEARCH = 'a fine-tuned UMA-S potential, 0 GPa';

  window.LP_SCENES = {
    acn_path_m0: { legend: el('C', 'H', 'N'),
      spec: '<b>CH<sub>3</sub>CN</b> · β phase · 35 GPa · C 96, H 144, N 48 · the start of the path',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa before any molecule has reacted',
      cap: 'Crystalline acetonitrile at 35 GPa with 48 molecules in the cell, at the start of the path. No molecule has reacted.' },
    acn_path_m1: { legend: PATH,
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48 · dimer',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with two molecules joined',
      cap: 'Two molecules have formed a dimer, shown in full color, and the other molecules are faded. This step has the highest barrier of the path, 2.66 eV (2.67 eV with DFT).' },
    acn_path_m3: { legend: PATH,
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48 · trimer',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with three molecules joined',
      cap: 'A third molecule has added to form a trimer. The barrier for this addition is 1.40 eV.' },
    acn_path_m7: { legend: PATH,
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48 · tetramer',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with four molecules joined',
      cap: 'The tetramer. The fourth molecule adds as a branch with a barrier of 0.73 eV, after a rearrangement with a barrier of 2.23 eV.' },
    acn_path_m9: { legend: PATH,
      spec: '<b>CH<sub>3</sub>CN</b> · 35 GPa · C 96, H 144, N 48 · pentamer',
      label: 'Interactive 3D view: crystalline acetonitrile at 35 GPa with five molecules joined',
      cap: 'The pentamer. The fifth molecule adds through an N–H group left in the chain by an earlier hydrogen transfer, with a barrier of 0.68 eV (0.66 eV with DFT). This state is 1.37 eV below the start of the path.' },
    acn_meoh_25: { legend: SHELL,
      spec: '<b>7 CH<sub>3</sub>CN : 3 CH<sub>3</sub>OH</b> · cell of 14 + 6 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 55 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 7 to 3 crystal of acetonitrile and methanol',
      cap: 'Acetonitrile and methanol at 7:3, about 25% methanol by volume. The acetonitrile molecule at the center is shown with its twelve nearest neighbors, two of which are methanol. Five of the six methanol molecules in the cell form hydrogen bonds to other methanol molecules, and one bonds to a nitrile.' },
    acn_meoh_50: { legend: SHELL,
      spec: '<b>CH<sub>3</sub>CN : CH<sub>3</sub>OH</b>, 1 : 1 · cell of 2 + 2 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 42 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 1 to 1 crystal of acetonitrile and methanol',
      cap: 'Acetonitrile and methanol at 1:1. Seven of the twelve nearest neighbors are methanol, and every methanol in the cell forms an O–H···N hydrogen bond to a nitrile (thin lines).' },
    acn_meoh_75: { legend: SHELL,
      spec: '<b>CH<sub>3</sub>CN : 4 CH<sub>3</sub>OH</b> · cell of 1 + 4 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 36 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 1 to 4 crystal of acetonitrile and methanol',
      cap: 'Acetonitrile and methanol at 1:4, about 75% methanol by volume. Eight of the twelve nearest neighbors are methanol. The hydroxyl groups form hydrogen-bonded chains with each other (thin lines), and none of them bonds to the nitrile.' },
    acn_ipa_25: { legend: SHELL,
      spec: '<b>13 CH<sub>3</sub>CN : 3 (CH<sub>3</sub>)<sub>2</sub>CHOH</b> · cell of 13 + 3 molecules · lowest of 1,224 packings so far · ' + SEARCH + ' · 76 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 13 to 3 crystal of acetonitrile and isopropanol',
      cap: 'Acetonitrile and isopropanol at 13:3, about 25% isopropanol by volume. Nine of the thirteen acetonitrile molecules in the cell have no isopropanol among their twelve nearest neighbors, including the one shown. This search is about half complete.' },
    acn_ipa_50: { legend: SHELL,
      spec: '<b>CH<sub>3</sub>CN : (CH<sub>3</sub>)<sub>2</sub>CHOH</b>, 1 : 1 · cell of 2 + 2 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 60 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 1 to 1 crystal of acetonitrile and isopropanol',
      cap: 'Acetonitrile and isopropanol at 1:1. Seven of the twelve nearest neighbors are isopropanol, and every hydroxyl group forms an O–H···N hydrogen bond to a nitrile (thin lines), as with methanol.' },
    acn_ipa_75: { legend: SHELL,
      spec: '<b>CH<sub>3</sub>CN : 2 (CH<sub>3</sub>)<sub>2</sub>CHOH</b> · cell of 1 + 2 molecules · lowest of 2,448 packings · ' + SEARCH + ' · 64 meV per molecule above the pure crystals',
      label: 'Interactive 3D view: one acetonitrile and its twelve nearest molecules in a 1 to 2 crystal of acetonitrile and isopropanol',
      cap: 'Acetonitrile and isopropanol at 1:2, about 75% isopropanol by volume. Ten of the twelve nearest neighbors are isopropanol, and the hydroxyl groups form hydrogen bonds to each other (thin lines).' },
    li100_aminopyrimidine: { legend: el('C', 'N', 'H', 'Li'),
      spec: '<b>Li(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a lithium (100) surface',
      cap: 'The aminopyrimidine on lithium. Lithium has the largest barriers of the three metals, including 33.7 kcal/mol on its route to this ring. In our kinetic model it couples two molecules and does not form the ring at room temperature.' },
    na100_aminopyrimidine: { legend: el('C', 'N', 'H', 'Na'),
      spec: '<b>Na(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a sodium (100) surface',
      cap: '4-Amino-2,6-dimethylpyrimidine on Na(100), formed from three acetonitrile molecules. This is the product observed in experiment. Ten steps lead to it from the acetonitrile film. The largest barrier before the final hydrogen transfer is 12.3 kcal/mol, and the final transfer costs 22.2 kcal/mol.' },
    k100_aminopyrimidine: { legend: el('C', 'N', 'H', 'K'),
      spec: '<b>K(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a potassium (100) surface',
      cap: 'The aminopyrimidine on potassium. In our kinetic model potassium follows the same first steps as sodium but stops at an open-chain dimer at room temperature.' },
    na100_triazine: { legend: el('C', 'N', 'H', 'Na'),
      spec: '<b>Na(100)</b> · 2,4,6-trimethyl-1,3,5-triazine · C 6, N 3, H 9',
      label: 'Interactive 3D view: trimethyltriazine on a sodium (100) surface',
      cap: 'The triazine on sodium, the other ring that three acetonitrile molecules can form. The largest barrier on its route is 11.3 kcal/mol.' }
  };

  // A figure is a row of panels; a panel can hold several states of the same system.
  window.LP_FIGS = [
    { id: 'fig-path', title: 'Polymerization path at 35 GPa.', panels: [
      { name: '35 GPa', states: [['acn_path_m0', 'Start'], ['acn_path_m1', 'Dimer'], ['acn_path_m3', 'Trimer'], ['acn_path_m7', 'Tetramer'], ['acn_path_m9', 'Pentamer']] }] },
    { id: 'fig-alcohols', title: 'Acetonitrile and its twelve nearest neighbors.', panels: [
      { name: 'With methanol', states: [['acn_meoh_25', '7 : 3'], ['acn_meoh_50', '1 : 1'], ['acn_meoh_75', '1 : 4']] },
      { name: 'With isopropanol', states: [['acn_ipa_25', '13 : 3'], ['acn_ipa_50', '1 : 1'], ['acn_ipa_75', '1 : 2']] }] },
    { id: 'fig-metals', title: 'Aminopyrimidine on Li, Na and K.', panels: [
      { name: 'On Li, Na and K', states: [['li100_aminopyrimidine', 'Li'], ['na100_aminopyrimidine', 'Na'], ['k100_aminopyrimidine', 'K'], ['na100_triazine', 'Triazine on Na']] }] }
  ];
})();
