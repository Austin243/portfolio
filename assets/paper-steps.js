/* The steps of each paper, for its step-by-step figure (assets/scheme3d-paper.js), from the papers themselves. A step's
   shot says what the picture shows at the end of the step: a structure (a scene of the 3D figures, or one made from it
   in `derive`), which atoms are shown or faded, whether its isosurface and colored cuts are on, a turn of the view,
   labels on points of the structure, or a figure of the paper laid over the picture. Newest paper first. */
(() => {
  'use strict';
  if (!window.LP_paperScheme) return;
  const sw = (c, name) => '<span><i style="background:' + c + '"></i>' + name + '</span>';
  const iso = (name) => '<span><i class="iso"></i>' + name + '</span>';
  const C = { H: '#DAE0E8', Na: '#B1A4C8', K: '#A122F7', U: '#7AA2AA', Mo: '#B486B0', S: '#D9B43A', Fe: '#C4762B', I: '#7D3AB8' };
  const none = ['-'];   // a shot with no atoms drawn: the paper's figure covers the picture

  // ---------- solid hydrogen (J. Phys. Chem. Lett. 2026) ----------
  window.LP_paperScheme({
    id: 'scheme-h2', cite: 'h2', label: 'The hydrogen paper, step by step',
    title: 'How solid hydrogen turns metallic, and where its new electrons go, one step at a time.',
    legend: sw(C.H, 'H') + iso('band density'),
    spec: '<b>Solid H<sub>2</sub></b> · C2/c-12 and Ama2 with the band densities behind the paper’s Fig. 3 · the squeeze in step 2 is drawn schematically; the band and metal-hydride panels are the paper’s own figures.',
    fallback: { src: 'assets/img/h2-phase-diagram.webp', alt: 'Schematic phase diagram of solid hydrogen under pressure' },
    steps: [
      { name: 'Why', dur: 1500, note: 'phases I, III and IV of solid hydrogen',
        text: 'Squeezed hard enough, hydrogen is predicted to become a metal and a high-temperature superconductor, and it has to turn metallic before it can superconduct. So we looked at how solid H<sub>2</sub> makes that change, and where its electrons go. Its high-pressure phases are still argued over, so we took one representative structure for each: P6<sub>3</sub>/m for phase I, C2/c-12 for phase III and Ama2 for phase IV.',
        alt: 'The paper’s graphical abstract: a phase diagram of solid hydrogen against pressure.',
        shot: { scene: 'h2_c2c_b15', only: none, cell: false, image: { src: 'assets/img/h2-phase-diagram.webp', alt: 'Schematic phase diagram of solid hydrogen against pressure', caption: 'The paper’s graphical abstract' } } },
      { name: 'Compress', dur: 2600, note: 'C2/c-12 · 12 H<sub>2</sub> per cell · about 200 to 430 GPa',
        text: 'Each structure is compressed in DFT, with the PBE and the hybrid HSE06 functionals, from about 200 to about 430 GPa. This is C2/c-12, with twelve H<sub>2</sub> molecules in its cell. As the lattice shrinks, the molecules stay whole.',
        alt: 'The C2/c-12 structure of hydrogen; the lattice draws together while every H2 molecule keeps its length.',
        shot: { scene: 'h2_c2c_b15', squeeze: 0.9 } },
      { name: 'Gap closes', dur: 1500, note: 'C2/c-12: PBE about 300 GPa, HSE06 about 375 GPa',
        text: 'Under pressure the band gap closes: for C2/c-12 near 300 GPa with PBE and near 375 GPa with HSE06; for Ama2 near 370 GPa with PBE, and its HSE06 bands at 425 GPa are metallic. Electrons move from states on the molecules into conduction states, so the solid dopes itself, and no bond has to break.',
        alt: 'Figure 2 of the paper: band structures of C2/c-12 and Ama2, and their low conduction states falling with pressure.',
        shot: { scene: 'h2_c2c_b15', only: none, cell: false, image: { src: 'assets/img/steps/h2-bands.webp', alt: 'Band structures of C2/c-12 and Ama2 hydrogen and the energies of their low conduction states against pressure', caption: 'Fig. 2 of the paper: the bands, and low conduction states falling with pressure' } } },
      { name: 'Between molecules', dur: 2400, note: 'C2/c-12 · band 15 · a conduction-band state',
        text: 'Where do those electrons go? The conduction states that fill first do not sit on the H<sub>2</sub> molecules. Their density gathers in pockets and channels between them, like the interstitial electrons of an electride. To measure it, each band is weighed on the 15% of grid points farthest from any hydrogen nucleus.',
        alt: 'C2/c-12 hydrogen with a yellow isosurface of its band-15 state in the spaces between the molecules.',
        shot: { scene: 'h2_c2c_b15', iso: true, sections: true, labels: [{ at: [-1.552, 4.71, 1.192], text: 'between the molecules', side: 'right' }] } },
      { name: 'Ama2', dur: 2400, note: 'Ama2 · 425 GPa · band 25 at R',
        text: 'The other phases show the same. In Ama2 at 425 GPa the band-25 state runs in channels between the molecular layers, and in P6<sub>3</sub>/m the states that fill after metallization also gather between the molecules. Hydrogen takes an electride-like route to becoming a metal: its molecules stay whole, and the new electrons sit between them.',
        alt: 'Ama2 hydrogen at 425 GPa with a yellow isosurface of its band-25 state in channels between the molecular layers.',
        shot: { scene: 'h2_ama2_b25', iso: true, sections: true, labels: [{ at: [2.614, 2.851, 0.024], text: 'channels between the layers', side: 'right' }] } },
      { name: 'With metals', dur: 1500, note: 'LiH<sub>2</sub> at 150 GPa · La<sub>4</sub>H<sub>23</sub> at 100 GPa',
        text: 'Metal atoms push hydrogen along the same route at lower pressure. In LiH<sub>2</sub> the gap closes at 150 GPa, and in La<sub>4</sub>H<sub>23</sub> at 100 GPa an interstitial state is already occupied, where in pure hydrogen at that pressure it lies several electronvolts above the Fermi level. Hydrides that keep their H<sub>2</sub> units are among the best candidates for superconducting at moderate pressure, and these interstitial electrons may shape how they superconduct.',
        alt: 'Figure 4 of the paper: LiH2 at 150 GPa and La4H23 at 100 GPa, their bands, and their interstitial states.',
        shot: { scene: 'h2_ama2_b25', only: none, cell: false, image: { src: 'assets/img/steps/h2-metals.webp', alt: 'Structures, band structures and interstitial states of LiH2 and La4H23', caption: 'Fig. 4 of the paper: LiH₂ (top) and La₄H₂₃ (bottom)' } } }
    ]
  });

  // ---------- iron in deep Earth (PNAS 2025) ----------
  window.LP_paperScheme({
    id: 'scheme-iron', cite: 'fe', label: 'The iron paper, step by step',
    title: 'How iron turns from electron donor to electron acceptor under pressure, one step at a time.',
    legend: sw(C.Fe, 'Fe') + sw(C.I, 'I'),
    spec: '<b>FeI<sub>2</sub></b> (P-3m1, 0 GPa) and <b>Fe<sub>3</sub>I</b> (Pm-3m, 300 GPa) from the set of structures behind the paper · the search in step 1 is drawn schematically; the hull and charge panels are the paper’s own figures.',
    fallback: { src: 'assets/img/iron-redox.webp', alt: 'Convex hulls of iron with silicon, phosphorus, sulfur, germanium, arsenic and selenium' },
    steps: [
      { name: 'Why', dur: 2800, note: 'a search settling on Fe<sub>3</sub>I at 300 GPa (drawn schematically)',
        text: 'Which elements went into Earth’s core with the iron, and which stayed in the rocks above it, depends in part on how iron bonds with them deep inside the planet. So we asked how iron bonds at core pressures. We paired it with 23 p-block elements, from boron to bismuth, and searched for structures of Fe<sub>m</sub>X<sub>n</sub> (m and n from 1 to 3) with CALYPSO at 150 and 300 GPa; most structures at 0 GPa came from the Materials Project.',
        alt: 'Iron and iodine atoms scattered through the picture move around and settle into the cubic Fe3I structure.',
        shot: { scene: 'fe3i_300gpa', search: true } },
      { name: 'Hulls', dur: 1500, note: 'iron with 23 p-block elements · 0, 150 and 300 GPa',
        text: 'Formation enthalpies give convex hulls at 0, 150 and 300 GPa. Under pressure iron binds most of these elements far more strongly, to −1 eV per atom and below; FeTe drops by 1 eV per atom, to about as stable as FeS. Hulls from the HSE functional, and free energies at high temperature, do not change the picture.',
        alt: 'Figure 1 of the paper: the convex hulls of iron with each p-block element at 0, 150 and 300 GPa.',
        shot: { scene: 'fe3i_300gpa', only: none, cell: false, image: { src: 'assets/img/steps/iron-hulls.webp', alt: 'Convex hulls of iron with 23 p-block elements at 0, 150 and 300 GPa', caption: 'Fig. 1 of the paper: the convex hulls' } } },
      { name: 'Charges', dur: 1500, note: 'the Bader charge of iron at 0, 150 and 300 GPa',
        text: 'Bader charges show which way the electrons go. At ambient pressure iron gives electrons to most of these elements; under compression it takes them back. With iodine the sign flips near 100 GPa, so iron iodide becomes “iodine ferride”; with tellurium near 30 GPa, arsenic near 110 GPa, phosphorus near 150 GPa, and germanium already at 0 GPa. With N, O, F, S, Se, Cl and Br, iron stays positive even at 300 GPa.',
        alt: 'Figure 2D to F of the paper: the Bader charge of iron in its compounds at 0, 150 and 300 GPa.',
        shot: { scene: 'fei2_0gpa', only: none, cell: false, image: { src: 'assets/img/steps/iron-charges.webp', alt: 'Bader charge of iron in its compounds with the p-block elements at 0, 150 and 300 GPa', caption: 'Fig. 2D–F of the paper: the charge on iron' } } },
      { name: 'Layers', dur: 2200, note: 'FeI<sub>2</sub> · P-3m1 · 0 GPa · Fe +0.745',
        text: 'The structures follow the charge. At ambient pressure FeI<sub>2</sub> is layered: sheets of iron between layers of iodine, with the iodine lone pairs facing the gap between the sheets. Iron here carries a Bader charge of +0.745.',
        alt: 'Layered FeI2: sheets of iron between layers of iodine, with gaps between the sheets.',
        shot: { scene: 'fei2_0gpa', labels: [{ atom: 35, text: 'iodine facing the gap', side: 'top' }] } },
      { name: 'Packed', dur: 2400, note: 'Fe<sub>3</sub>I · Pm-3m · 300 GPa',
        text: 'Under pressure the lone pairs disappear and iodine gathers more iron around it: six iron neighbors in Fe<sub>2</sub>I and twelve in cubic Fe<sub>3</sub>I, where iron is slightly negative (−0.040 at 150 GPa). Iron has become the electron acceptor.',
        alt: 'Cubic Fe3I, with each iodine surrounded by twelve iron atoms.',
        shot: { scene: 'fe3i_300gpa', labels: [{ atom: 42, text: 'iodine with 12 iron neighbors', side: 'right' }] } },
      { name: 'Earth’s core', dur: 1500, note: 'binding to iron against depletion in the silicate Earth',
        text: 'What it means for the core: set against how depleted each element is in the silicate Earth, the strength of its bond to iron runs opposite to what uptake into the core would need, and volatility follows the depletion instead. Silicon, though, binds iron more strongly than oxygen above 250 GPa, which makes it a candidate light element of the core. Models of how Earth sorted its elements have to account for how bonding changes under pressure.',
        alt: 'Figure 2A to C of the paper: the abundance of each element in the silicate Earth against how strongly it binds iron.',
        shot: { scene: 'fe3i_300gpa', only: none, cell: false, image: { src: 'assets/img/steps/iron-abundance.webp', alt: 'Abundance of elements in the silicate Earth against the formation enthalpy of their most stable iron compound', caption: 'Fig. 2A–C of the paper: binding to iron against abundance in the silicate Earth' } } }
    ]
  });

  // ---------- metal superhydrides from chemical templates (JACS 2025) ----------
  window.LP_paperScheme({
    id: 'scheme-templates', cite: 'superhydrides', label: 'The superhydride template paper, step by step',
    title: 'How machine learning on bare metal lattices finds new superhydrides, one step at a time.',
    legend: sw(C.U, 'U') + sw(C.H, 'H') + iso('ELF'),
    spec: '<b>U<sub>10</sub>H<sub>84</sub></b> (I4/m) and its U<sub>10</sub> metal lattice with ELF, one of the new structures · the widening of the lattice and the hydrogen search are drawn schematically; the workflow, model and count panels are the paper’s own figures.',
    fallback: { src: 'assets/img/superhydrides.webp', alt: 'Two-step chemical-template workflow for discovering metal superhydrides' },
    steps: [
      { name: 'Why', dur: 1500, note: '57 prototypes · 16 metals · 100 to 300 GPa · 4151 structures',
        text: 'Superhydrides are among the best candidates for high-temperature superconductivity, but much of their chemistry is unexplored, above all hydrogen-to-metal ratios that are not whole numbers, whose large cells make every structure search costly. The idea here is to judge the bare metal lattice first. Start from 57 known prototypes filled with 16 metals and relaxed at 100 to 300 GPa: 4151 structures, each labelled with its energy above the hull. Then take the hydrogen out and keep the metal lattice.',
        alt: 'Figure 1A to C of the paper: the training data, the features, and the model.',
        shot: { scene: 'u10_template', only: none, cell: false, image: { src: 'assets/img/steps/templates-training.webp', alt: 'Training data preparation, feature engineering and model training', caption: 'Fig. 1A–C of the paper' } } },
      { name: 'Bare lattice', dur: 2400, note: 'a bare metal lattice, U<sub>10</sub>, and its ELF',
        text: 'One DFT run on each bare metal lattice gives 46 features: of its atoms, its crystal, its composition, and the largest and average ELF in the space between the metal atoms. The ELF marks where electrons would sit without the hydrogen. Packing efficiency ranks first among the features, and the largest interstitial ELF second.',
        alt: 'The U10 metal lattice with a yellow ELF isosurface around each atom and in the spaces between them.',
        shot: { scene: 'u10_template', iso: true, sections: true } },
      { name: 'Model', dur: 1500, note: 'E<sub>hull</sub> from the bare lattice · MAE 11 meV/atom',
        text: 'An AutoGluon stack ensemble learns the energy above the hull from those features alone, without a hydrogen atom in sight: a cross-validated mean error of 11 meV per atom, and R<sup>2</sup> = 0.951.',
        alt: 'Figure 1C of the paper: predicted against calculated energies above the hull.',
        shot: { scene: 'u10_template', only: none, cell: false, image: { src: 'assets/img/steps/templates-model.webp', alt: 'Predicted against DFT energy above the hull for the training and test sets', caption: 'Fig. 1C of the paper' } } },
      { name: 'Screen', dur: 2600, note: '7939 candidates · 1421 below 50 meV/atom',
        text: 'New metal lattices are made from 52 complex prototypes and the 16 metals, relaxed without hydrogen at 200 GPa, and widened to the volume each would have as MH<sub>x</sub>, for x from 6 to 16: 7939 candidates. The model predicts the energy of each, and 1421 stay within 50 meV per atom of the hull.',
        alt: 'The U10 lattice drawn wider, as a candidate lattice is widened to the volume it would have with hydrogen.',
        shot: { scene: 'u10_template', squeeze: 1.12 } },
      { name: 'Hydrogen', dur: 3000, note: 'U<sub>10</sub>H<sub>84</sub> · I4/m · hydrogen around the basins',
        text: 'Only now does hydrogen come in. CALYPSO searches place it in each kept lattice, with about 400 relaxations a search; the best structures are re-optimized, set on the hull with zero-point and thermal corrections, and checked for phonon stability. Here, U<sub>10</sub>H<sub>84</sub>: the hydrogen builds its cages around the electron basins of the bare lattice.',
        alt: 'Hydrogen atoms fly into the U10 lattice and settle into the cages of U10H84.',
        shot: { scene: 'u10h84_structure', search: true } },
      { name: 'Results', dur: 1500, note: '13 prototypes · 31 structures · 19 above 100 K (estimated)',
        text: 'The result: 13 new structural prototypes and 31 stable or nearly stable metal superhydrides, 19 of them with hydrogen-to-metal ratios that are not whole numbers. A quick estimate puts 19 above 100 K; for Ca<sub>8</sub>H<sub>46</sub> a full calculation gives T<sub>c</sub> of 134 to 147 K at 200 GPa. Judging the metal lattice first saves the costly hydrogen searches for the lattices worth trying, and the same approach could search ternary superhydrides at scale.',
        alt: 'Figure 6 of the paper: counts of superhydrides, prototypes and clathrates in the training data and in this work.',
        shot: { scene: 'u10h84_structure', only: none, cell: false, image: { src: 'assets/img/steps/templates-results.webp', alt: 'Counts of stable superhydrides, structure prototypes and clathrate superhydrides in the training data and in this work', caption: 'Fig. 6 of the paper' } } }
    ]
  });

  // ---------- NaKH12 (Adv. Funct. Mater. 2025) ----------
  const CUBE = [1.521, 1.521, 4.563];   // the center of one small Na4K4 cube (an 8c site), facing the viewer
  window.LP_paperScheme({
    id: 'scheme-nakh12', cite: 'nakh12', label: 'The NaKH12 paper, step by step',
    title: 'How electrons between the metal atoms hold the H<sub>2</sub> units of NaKH<sub>12</sub> together, one step at a time.',
    legend: sw(C.Na, 'Na') + sw(C.K, 'K') + sw(C.H, 'H') + iso('ELF'),
    spec: '<b>NaKH<sub>12</sub></b> (Fm-3m, 60 GPa) and its Na–K sublattice in the same cell, with their ELF · the search in step 1 is drawn schematically; the superconductivity and pressure panels are the paper’s own figures.',
    fallback: { src: 'assets/img/nakh12.webp', alt: 'Crystal structure of NaKH12 and the energy change with H–H distance' },
    steps: [
      { name: 'Why', dur: 2800, note: 'NaKH<sub>12</sub> · Fm-3m · 60 GPa · H–H 0.86 Å',
        text: 'Hydride superconductors reach record temperatures, but only at very high pressure. Hydrides built of H<sub>2</sub> units are stable at moderate pressure, but how they become metals was unclear. A structure search (AIRSS) of Na–K–H found NaKH<sub>12</sub>: sodium and potassium on two interpenetrating fcc lattices, as in rock salt, and every hydrogen in an H<sub>2</sub> unit, 0.86 Å long at 60 GPa against 0.74 Å in a free molecule.',
        alt: 'Sodium, potassium and hydrogen atoms move around and settle into the NaKH12 structure.',
        shot: { scene: 'nakh12_60GPa', search: true } },
      { name: 'T<sub>c</sub>', dur: 1500, note: 'λ = 4.03 · T<sub>c</sub> = 245 K at 60 GPa',
        text: 'Its electrons and phonons couple strongly: λ = 4.03, with most of the coupling from soft, low-frequency modes. Solving the Eliashberg equations with μ* = 0.1 gives T<sub>c</sub> = 245 K at 60 GPa.',
        alt: 'Figure 2 of the paper: band structure, Fermi surface, nesting function and phonons of NaKH12.',
        shot: { scene: 'nakh12_60GPa', only: none, cell: false, image: { src: 'assets/img/steps/nakh12-tc.webp', alt: 'Band structure, Fermi surface, nesting function and phonon spectrum of NaKH12 at 60 GPa', caption: 'Fig. 2 of the paper' } } },
      { name: 'Hydrogen alone', dur: 2200, note: 'the hydrogen of NaKH<sub>12</sub>, with the metals taken out',
        text: 'To see why, take the metals out. The hydrogen lattice alone has a crystal orbital centered in the gap that six H<sub>2</sub> units enclose. It falls in energy as the units stretch and becomes occupied once they are longer than about 0.79 Å; in NaKH<sub>12</sub> they are 0.86 Å.',
        alt: 'Only the H2 units of NaKH12 remain; six of them surround an empty gap.',
        shot: { scene: 'nakh12_60GPa', only: ['H'], labels: [{ at: CUBE, text: 'the gap six H<sub>2</sub> enclose', side: 'right' }] } },
      { name: 'Template', dur: 2600, note: 'the Na–K lattice alone, at the same volume · ELF',
        text: 'Now take the hydrogen out instead. The bare Na–K lattice at the same volume has its ELF strongly localized at the center of each small Na<sub>4</sub>K<sub>4</sub> cube: the same gap. These interstitial electrons are the template, and six H<sub>2</sub> units gather around each of them, their bonds pointing at it.',
        alt: 'The sodium and potassium lattice with a yellow ELF isosurface at the center of each small cube of four Na and four K.',
        shot: { scene: 'nak_sublattice', iso: true, sections: true, labels: [{ at: CUBE, text: 'electrons localized here', side: 'right' }] } },
      { name: 'Together', dur: 2400, note: 'NaKH<sub>12</sub> · ELF',
        text: 'Put together, those interstitial electrons go into the antibonding orbitals of the H<sub>2</sub> units. The H–H bonds weaken and stretch, charge connects neighboring units, and that is what couples the electrons so strongly to the vibrations of the hydrogen.',
        alt: 'NaKH12 with yellow ELF isosurfaces around each H2 unit.',
        shot: { scene: 'nakh12_60GPa', iso: true, fade: ['Na', 'K'] } },
      { name: 'Pressure', dur: 1500, note: 'T<sub>c</sub> = 308 K at 300 GPa',
        text: 'At 0 GPa the Na–K lattice has no such interstitial electrons, which fits NaKH<sub>12</sub> being unstable below 60 GPa. With pressure the basin grows stronger, its ELF rising from about 0.63 at 60 GPa to about 0.82 at 300 GPa, and T<sub>c</sub> climbs to 308 K at 300 GPa. Metal lattices whose interstitial electrons fit a hydrogen lattice are a guide to molecular hydrides that superconduct at moderate pressure.',
        alt: 'Figure 5 of the paper: the ELF of the template and the critical temperature against pressure.',
        shot: { scene: 'nakh12_60GPa', only: none, cell: false, image: { src: 'assets/img/steps/nakh12-pressure.webp', alt: 'ELF of the Na–K template, bonding and critical temperature of NaKH12 against pressure', caption: 'Fig. 5 of the paper' } } }
    ]
  });

  // ---------- TMDC electrides (J. Phys. Chem. Lett. 2024) ----------
  const SITE = [1.574, 6.36, 14.05];       // the sulfur site that is left empty in the vacancy structure
  const HOLLOW = [3.121, 5.466, 12.427];   // a hollow between three Mo and six S, beside it
  const BASIN = [1.5743, 6.3594, 13.4687]; // the ELF maximum in the vacancy
  window.LP_paperScheme({
    id: 'scheme-tmdc', cite: 'tmdc', label: 'The TMDC paper, step by step',
    title: 'How a sulfur vacancy makes monolayer MoS<sub>2</sub> an electride, one step at a time.',
    legend: sw(C.Mo, 'Mo') + sw(C.S, 'S') + iso('ELF'),
    derive: { mos2_pristine: { from: 'mos2_vacancy', add: [[SITE[0], SITE[1], SITE[2], 'S']], grid: false } },
    spec: '<b>MoS<sub>2</sub></b> · a 4×4 cell of the 2H monolayer from the project’s files, with one S vacancy and its ELF (the paper’s numbers come from 7×7 and 5×5 cells) · in the first three pictures the labels mark the sites the paper describes; the panels are the paper’s own figures.',
    fallback: { src: 'assets/img/tmdc-vacancy.webp', alt: 'Crystal orbital of a monolayer MX2 with a chalcogen vacancy' },
    steps: [
      { name: 'Why', dur: 2000, note: 'a monolayer of 2H-MoS<sub>2</sub>',
        text: 'Electrides hold some of their electrons in the empty space between atoms, where they are easily handed to a molecule on the surface, which makes them useful for catalysis and electronics. But most known electrides have unusual compositions, and their exposed electrons react with air and water unless the surface is passivated. Monolayer transition-metal dichalcogenides such as MoS<sub>2</sub> are among the most studied 2D materials. We asked whether they can be made into electrides.',
        alt: 'A monolayer of MoS2: a sheet of molybdenum atoms between two layers of sulfur.',
        shot: { scene: 'mos2_pristine' } },
      { name: 'Bare layer', dur: 2200, note: 'the Mo layer, with the S sites (X<sub>0</sub>) faded',
        text: 'To see where electrons want to sit, start from the metal layer alone, with the chalcogen atoms taken away. Its ELF has maxima above and below the layer, and half of them sit exactly where the chalcogens go: the X<sub>0</sub> sites. Seen this way, each chalcogen takes up a pocket of localized electrons that the metal layer already has.',
        alt: 'A layer of molybdenum atoms, with the sulfur sites above and below it drawn faint.',
        shot: { scene: 'mos2_pristine', fade: ['S'], labels: [{ at: SITE, text: 'X<sub>0</sub>', side: 'top' }] } },
      { name: 'Screen', dur: 1500, note: '30 metals × 2H, 1T, 1T′ × S, Se, Te',
        text: 'The same holds across the transition metals. For all 30 of them, in the 2H, 1T and 1T′ structures and with S, Se and Te, the formation enthalpy of MX<sub>2</sub> follows the ELF at the X<sub>0</sub> sites of the bare metal layer: where more electrons localize there, the compound is more stable.',
        alt: 'Figure 1 of the paper: the ELF of bare metal layers, and the formation enthalpy against the ELF at X0.',
        shot: { scene: 'mos2_pristine', only: none, cell: false, image: { src: 'assets/img/steps/tmdc-bare-layers.webp', alt: 'ELF of the bare 2H, 1T and 1T′ metal layers, and formation enthalpy against the ELF at the X0 sites', caption: 'Fig. 1 of the paper' } } },
      { name: 'Weak electride', dur: 2200, note: '2H-MoS<sub>2</sub> · E marks one of the hollows',
        text: 'Pristine 2H-MoS<sub>2</sub> keeps a little of that. A weak ELF maximum, E, sits in the empty hollow between three Mo and six S atoms, and its states lie just below the Fermi level. MoSe<sub>2</sub>, WS<sub>2</sub> and WSe<sub>2</sub> have it too, the 1T and 1T′ structures do not, and the paper calls this electride character rather weak.',
        alt: 'A monolayer of MoS2, with one empty hollow between three molybdenum and six sulfur atoms marked E.',
        shot: { scene: 'mos2_pristine', labels: [{ at: HOLLOW, text: 'E', side: 'right' }] } },
      { name: 'Vacancy', dur: 2200, note: 'one sulfur taken out',
        text: 'Then defects: in a 7 × 7 MoS<sub>2</sub> supercell, one or two missing sulfur atoms, a missing molybdenum, and antisites. Only the sulfur vacancies leave an isolated electron maximum E, and it sits a little below where the sulfur was, closer to the Mo layer.',
        alt: 'One sulfur atom shrinks away from the top layer of the MoS2 sheet, leaving a vacancy.',
        shot: { scene: 'mos2_vacancy', labels: [{ at: SITE, text: 'V<sub>S</sub>', side: 'top' }] } },
      { name: '0D electride', dur: 2400, note: 'ELF of MoS<sub>2</sub> with one S vacancy',
        text: 'The highest occupied state is localized on E: 0.45 electrons within 1.0 Å of it for one missing sulfur, 0.36 within 0.8 Å for two. A 5 × 5 cell gives nearly the same, so each vacancy holds its electrons on its own, a zero-dimensional electride. The yellow surface is the ELF around the vacancy.',
        alt: 'The MoS2 sheet with a yellow ELF isosurface: lone pairs on every sulfur and a basin with no atom in the vacancy.',
        shot: { scene: 'mos2_vacancy', iso: true, sections: true, labels: [{ at: BASIN, text: 'E', side: 'right' }] } },
      { name: 'Hydrogen', dur: 1500, note: 'ΔG(H*) at the vacancy, with charge added or removed',
        text: 'The vacancy is also where hydrogen binds. ΔG for hydrogen at the vacancy lies between −0.2 and 0.25 eV, and adding or removing a little charge, as doping or a field would, tunes it: MoS<sub>2</sub> reaches ΔG = 0 with 0.07 electrons removed, WS<sub>2</sub> with 0.21 and WSe<sub>2</sub> with 0.15, while NbS<sub>2</sub> barely moves. Vacancy concentrations can already be controlled in experiments, so this is a route to electrides of a chosen strength from a common 2D material, whose vacancy electrons could help catalyze hydrogen evolution.',
        alt: 'Figure 4 of the paper: the free energy of hydrogen adsorption at the vacancy as charge is added or removed.',
        shot: { scene: 'mos2_vacancy', only: none, cell: false, image: { src: 'assets/img/steps/tmdc-her.webp', alt: 'Free energy of hydrogen adsorption at the vacancy against added or removed charge, and charge-density differences', caption: 'Fig. 4 of the paper' } } }
    ]
  });

  // ---------- reactions of acetonitrile (Oak Ridge; work in progress, with the benchmark preprint) ----------
  const R = { C: '#3A444F', N: '#3157BB', O: '#D6402E', alc: '#A2937F' };
  const BENCH = window.LP_CITE ? window.LP_CITE('mlip') : '';
  window.LP_paperScheme({
    id: 'scheme-reactions', label: 'The acetonitrile work, step by step',
    title: 'How pressure, a solvent or a metal surface changes the reactions of acetonitrile, one step at a time.',
    legend: sw(R.C, 'C') + sw(R.N, 'N') + sw(C.H, 'H') + sw(R.O, 'O') + sw(R.alc, 'C of the alcohol') + sw(C.Na, 'Na'),
    spec: '<b>CH<sub>3</sub>CN</b> · the 35 GPa path, the packing with methanol and the ring on Na(100) are from our own calculations, in progress · the first picture is from my SESAPS 2026 talk; the ReactionFlow overview and the energy profile are from my research page at Oak Ridge.',
    fallback: { src: 'assets/img/steps/rx-path-35gpa.webp', alt: 'Energy profile of the connected polymerization path of acetonitrile at 35 GPa, from the crystal to a chain of five molecules' },
    steps: [
      { name: 'Why', dur: 1500, note: 'one reaction, several ways to drive it',
        text: 'Heat pushes a reaction over its barrier. Pressure, a solvent, a catalyst or a plasma can do more: they reshape the energy landscape, and may open paths that heating alone does not reach. At Oak Ridge I work in a project, led by Ilia Ivanov, that asks how. Acetonitrile is the first test system: it forms chains, rings and polymers under very different conditions, and it is small enough to simulate in detail.',
        alt: 'A drawing of an energy landscape: heat, microwaves, pressure, a catalyst and a plasma each take the reactants to products along a different path.',
        shot: { scene: 'acn_path_m0', only: none, cell: false, image: { src: 'assets/img/steps/rx-landscape.webp', alt: 'An energy landscape with reactants and three products: heat, microwaves, pressure, a catalyst and a plasma each follow a different path across it', caption: 'From my SESAPS 2026 talk' } } },
      { name: 'Find the steps', dur: 1500, note: 'ReactionFlow · dynamics with machine-learned potentials',
        text: 'These reactions are too slow for DFT dynamics, so we run them with machine-learned potentials. ReactionFlow, a package I wrote, watches the bonds while the simulation runs. When a bond change persists, it saves that moment, refines the path between the two states, checks that the saddle connects them, and resumes the run. DFT then checks each barrier. To know which potentials to trust, we first compared fifteen of them with DFT along 9,017 reaction pathways' + (BENCH ? ' (' + BENCH + ')' : '') + '.',
        alt: 'Overview of ReactionFlow: molecular dynamics, a detected bond change, and the refined path over its saddle; and rare events followed with kinetic Monte Carlo.',
        shot: { scene: 'acn_path_m0', only: none, cell: false, image: { src: 'assets/img/steps/rx-reactionflow.webp', alt: 'ReactionFlow: a trajectory wanders from a reactant to a product, a bond change is detected, and the path over the saddle is refined', caption: 'ReactionFlow: from a bond change in the dynamics to a checked path' } } },
      { name: 'Under pressure', dur: 2200, note: 'β-acetonitrile · 48 molecules in the cell · 35 GPa',
        text: 'First, pressure. Crystalline acetonitrile polymerizes when it is compressed and heated. This is the crystal at 35 GPa, with 48 molecules in the cell. In DFT dynamics nothing reacts within 10.7 picoseconds, even near 1,100 K: the reactions need nanoseconds. A potential fine-tuned on DFT data lets us run that long, and at 2,000 K the molecules link into a network.',
        alt: 'Crystalline acetonitrile at 35 GPa: 48 rod-shaped molecules in rows, none of them reacted.',
        shot: { scene: 'acn_path_m0' } },
      { name: 'First bond', dur: 2400, note: 'two molecules joined · 2.66 eV (2.67 eV with DFT)',
        text: 'To see the single steps, we put together a connected path from the crystal to a chain of five molecules, nine steps in all, and checked every state on it with DFT. The first step joins two molecules through a new C–C bond while a hydrogen moves to a nitrogen. It is the hardest of the nine: 2.66 eV, or 2.67 eV with DFT.',
        alt: 'The same crystal, faded, with two molecules joined into one and drawn in full color.',
        shot: { scene: 'acn_path_m1', view: { zoom: 1.9, center: [3.94, 5.9, 6.3] }, labels: [{ at: [3.935, 5.765, 6.373], text: 'the first C–C bond', side: 'right' }] } },
      { name: 'The chain grows', dur: 2400, note: 'five molecules joined · last addition 0.68 eV (0.66 eV with DFT)',
        text: 'Later additions are easier. The early hydrogen transfers leave N–H groups in the growing chain, and the fifth molecule adds through one of them over only 0.68 eV (0.66 eV with DFT). With five molecules joined, the cell lies 1.37 eV below where it started.',
        alt: 'The faded crystal with five molecules joined into one branched chain, drawn in full color.',
        shot: { scene: 'acn_path_m9', view: { zoom: 1.8, center: [4.62, 6.6, 6.4] }, labels: [{ at: [3.724, 7.897, 6.296], text: 'the last C–C bond', side: 'top' }] } },
      { name: 'In a solvent', dur: 2400, note: 'CH<sub>3</sub>CN with CH<sub>3</sub>OH, one to one · a candidate packing',
        text: 'In an alcohol, acetonitrile takes another route: three molecules close into a triazine ring, which can go on to an aminopyrimidine. In the route we found, it starts when an alcohol adds across the C≡N bond, so it should matter how the alcohol sits around acetonitrile. The idea we are testing is that the structure of a solution decides which reactions happen in it. In this one-to-one packing with methanol, every O–H points at a nitrile nitrogen; with more methanol they bond to each other instead.',
        alt: 'One acetonitrile molecule with its twelve nearest molecules, seven of them methanol; thin lines join methanol O–H groups to nitrile nitrogens.',
        shot: { scene: 'acn_meoh_50', view: { zoom: 1.25 }, labels: [{ at: [0.464, 2.859, 0.877], text: 'O–H···N', side: 'right' }] } },
      { name: 'On a metal', dur: 2400, note: 'Na(100) · 4-amino-2,6-dimethylpyrimidine',
        text: 'A metal surface changes the route again. Experiments on sodium point to pyrimidine rings, so we followed a film of acetonitrile on lithium, sodium and potassium step by step, each state reached from the one before it and each barrier checked with DFT. On sodium, ten steps lead to this ring, none above 12.3 kcal/mol until the last hydrogen transfer, at 22.2. Potassium cleaves the molecule and grows chains most easily, and lithium needs the largest steps.',
        alt: 'A ring of three joined acetonitrile molecules, 4-amino-2,6-dimethylpyrimidine, lying on a sodium surface.',
        shot: { scene: 'na100_aminopyrimidine', view: { zoom: 1.2 } } },
      { name: 'What it is for', dur: 1500, note: 'the connected path at 35 GPa · nine steps, each checked with DFT',
        text: 'Each study ends in a map like this one: every step from the starting molecules to a product, with its barrier. The goal is to resolve the transition states that pressure reaches, then reach them under milder conditions, and so to choose a reaction’s path by choosing its surroundings. The project pairs these simulations with high-pressure, neutron and Raman experiments. Most of this is work in progress.',
        alt: 'Energy profile of the path at 35 GPa: nine barriers between the crystal and a chain of five molecules, with DFT points on each state.',
        shot: { scene: 'na100_aminopyrimidine', only: none, cell: false, image: { src: 'assets/img/steps/rx-path-35gpa.webp', alt: 'Enthalpy along the connected polymerization path at 35 GPa, from the crystal M0 through the dimer, trimer and tetramer to the pentamer M9, with DFT single points', caption: 'The path at 35 GPa, from the crystal to five joined molecules' } } },
      // four slides after the steps drawn here: the structures themselves, to turn and compare (fig-reactions)
      { name: 'Path in 3D', dur: 1500,
        text: 'The states of the path at 35 GPa, to turn and compare: the start, then two, three, four and five molecules joined. Pick one with the buttons in the picture.',
        slide: { fig: 'fig-reactions', pick: [0, 1] } },
      { name: 'With methanol', dur: 1500,
        text: 'One acetonitrile and its twelve nearest molecules, in the lowest-energy packing we found at three ratios of acetonitrile to methanol. Thin lines are hydrogen bonds. Only at one to one does every O–H reach a nitrile. These come from searches with a machine-learned potential and all lie above the separate pure crystals, so they are candidates, not known phases.',
        slide: { fig: 'fig-reactions', pick: [1, 1] } },
      { name: 'With isopropanol', dur: 1500,
        text: 'The same for isopropanol, the bulkier alcohol. The pattern repeats: at one to one every O–H points at a nitrile nitrogen, and with more alcohol the O–H groups bond to each other. The search at 13 to 3 is half finished.',
        slide: { fig: 'fig-reactions', pick: [2, 1] } },
      { name: 'On Li, Na and K', dur: 1500,
        text: 'The aminopyrimidine ring on each of the three metals, and the triazine on sodium. Sodium is the only one of the three studied in experiment so far.',
        slide: { fig: 'fig-reactions', pick: [3, 1] } }
    ]
  });
})();
