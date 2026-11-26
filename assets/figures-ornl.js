/* The 3D figures of the page on my work at Oak Ridge (ornl.html): which scenes each figure holds, and the caption, legend
   and one-line record of every scene. The page loads this in place of figures.js. */
(() => {
  'use strict';
  const C = { H: '#DAE0E8', Na: '#B1A4C8', K: '#A122F7', Li: '#86E074', O: '#D6402E', C: '#3A444F', N: '#3157BB' };
  const el = (...names) => names.map((n) => [n, C[n]]);
  const PATH = el('C', 'H', 'N').concat([['unreacted', '#BCC2C8']]);
  const SHELL = el('C', 'N', 'H', 'O').concat([['C of the alcohol', '#A2937F'], ['farther molecules', '#BCC2C8']]);
  const SEARCH = 'a fine-tuned UMA-S potential, 0 GPa';

  window.LP_SCENES = {
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
      cap: 'The same ring on lithium. Lithium needs the largest steps of the three metals, 33.7 kcal/mol on its route to this ring. In our kinetic model it couples two molecules instead and makes no ring at room temperature.' },
    na100_aminopyrimidine: { legend: el('C', 'N', 'H', 'Na'),
      spec: '<b>Na(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a sodium (100) surface',
      cap: '4-Amino-2,6-dimethylpyrimidine on a sodium (100) surface: three acetonitrile molecules joined into one ring. This is the product seen in experiment. Ten steps lead to it from the film of acetonitrile, none above 12.3 kcal/mol until the last hydrogen transfer, at 22.2.' },
    k100_aminopyrimidine: { legend: el('C', 'N', 'H', 'K'),
      spec: '<b>K(100)</b> · 4-amino-2,6-dimethylpyrimidine · C 6, N 3, H 9',
      label: 'Interactive 3D view: 4-amino-2,6-dimethylpyrimidine on a potassium (100) surface',
      cap: 'The same ring on potassium. In our kinetic model potassium does not get this far at room temperature: it takes the same first steps as sodium and stops at an open-chain dimer.' },
    na100_triazine: { legend: el('C', 'N', 'H', 'Na'),
      spec: '<b>Na(100)</b> · 2,4,6-trimethyl-1,3,5-triazine · C 6, N 3, H 9',
      label: 'Interactive 3D view: trimethyltriazine on a sodium (100) surface',
      cap: 'The triazine, the other ring that three acetonitrile molecules can close into, on sodium. Its largest step there is 11.3 kcal/mol.' }
  };

  // A figure is a row of panels; a panel can hold several states of the same system.
  window.LP_FIGS = [
    { id: 'fig-path', title: 'The path at 35 GPa.', panels: [
      { name: '35 GPa', states: [['acn_path_m0', 'Start'], ['acn_path_m1', 'Dimer'], ['acn_path_m3', 'Trimer'], ['acn_path_m7', 'Tetramer'], ['acn_path_m9', 'Pentamer']] }] },
    { id: 'fig-alcohols', title: 'One acetonitrile and its twelve nearest molecules.', panels: [
      { name: 'With methanol', states: [['acn_meoh_25', '7 : 3'], ['acn_meoh_50', '1 : 1'], ['acn_meoh_75', '1 : 4']] },
      { name: 'With isopropanol', states: [['acn_ipa_25', '13 : 3'], ['acn_ipa_50', '1 : 1'], ['acn_ipa_75', '1 : 2']] }] },
    { id: 'fig-metals', title: 'The ring on Li, Na and K.', panels: [
      { name: 'On Li, Na and K', states: [['li100_aminopyrimidine', 'Li'], ['na100_aminopyrimidine', 'Na'], ['k100_aminopyrimidine', 'K'], ['na100_triazine', 'Triazine on Na']] }] }
  ];
})();
