/* The steps of each paper, for its step-by-step figure (assets/scheme3d-paper.js), from the papers themselves. A step's
   shot says what the picture shows at the end of the step: a structure (a scene of the 3D figures, or one made from it
   in `derive`), which atoms are shown or faded, whether its isosurface and colored cuts are on, a turn of the view,
   labels on points of the structure, or a figure of the paper laid over the picture. Newest paper first, then the
   preprints, whose last step is a slide with the 3D figure of their card. */
(() => {
  'use strict';
  if (!window.LP_paperScheme) return;
  const sw = (c, name) => '<span><i style="background:' + c + '"></i>' + name + '</span>';
  const iso = (name) => '<span><i class="iso"></i>' + name + '</span>';
  const C = { H: '#DAE0E8', Na: '#B1A4C8', K: '#A122F7', U: '#7AA2AA', Mo: '#B486B0', S: '#D9B43A', Fe: '#C4762B', I: '#7D3AB8', Cs: '#2FA39A', Ba: '#8B6BB8', O: '#D6402E' };
  const none = ['-'];   // a shot with no atoms drawn: the paper's figure covers the picture

  // ---------- solid hydrogen (J. Phys. Chem. Lett. 2026) ----------
  window.LP_paperScheme({
    id: 'scheme-h2', cite: 'h2', label: 'The hydrogen paper, step by step',
    title: 'How solid hydrogen becomes metallic under pressure, and where its conduction electrons are located.',
    legend: sw(C.H, 'H') + iso('band density'),
    spec: '<b>Solid H<sub>2</sub></b> · C2/c-12 and Ama2 with the band densities behind the paper’s Fig. 3 · the compression in step 2 is drawn schematically · the band and metal-hydride panels are figures from the paper.',
    fallback: { src: 'assets/img/h2-phase-diagram.webp', alt: 'Schematic phase diagram of solid hydrogen under pressure' },
    steps: [
      { name: 'Why', dur: 1500, note: 'phases I, III and IV of solid hydrogen',
        text: 'Hydrogen is predicted to become a metal and a high-temperature superconductor at high pressure, and it must become metallic before it can superconduct. We studied how solid H<sub>2</sub> metallizes and where the electrons go when it does. Because its high-pressure phases are still debated, we used one representative structure for each phase, P6<sub>3</sub>/m for phase I, C2/c-12 for phase III and Ama2 for phase IV.',
        alt: 'The paper’s graphical abstract: a phase diagram of solid hydrogen against pressure.',
        shot: { scene: 'h2_c2c_b15', only: none, cell: false, image: { src: 'assets/img/h2-phase-diagram.webp', alt: 'Schematic phase diagram of solid hydrogen against pressure', caption: 'The paper’s graphical abstract' } } },
      { name: 'Compress', dur: 2600, note: 'C2/c-12 · 12 H<sub>2</sub> per cell · about 200 to 430 GPa',
        text: 'We compressed each structure from about 200 to about 430 GPa in DFT with the PBE and hybrid HSE06 functionals. The structure shown is C2/c-12, which has twelve H<sub>2</sub> molecules in its cell. The molecules remain intact as the lattice contracts.',
        alt: 'The C2/c-12 structure of hydrogen; the lattice draws together while every H2 molecule keeps its length.',
        shot: { scene: 'h2_c2c_b15', squeeze: 0.9 } },
      { name: 'Gap closes', dur: 1500, note: 'C2/c-12: PBE about 300 GPa, HSE06 about 375 GPa',
        text: 'The band gap closes under pressure. For C2/c-12 it closes near 300 GPa with PBE and near 375 GPa with HSE06. For Ama2 it closes near 370 GPa with PBE, and the HSE06 bands are metallic at 425 GPa. Electrons then move from states on the molecules into conduction states, which dopes the solid without breaking any H–H bond.',
        alt: 'Figure 2 of the paper: band structures of C2/c-12 and Ama2, and their low conduction states falling with pressure.',
        shot: { scene: 'h2_c2c_b15', only: none, cell: false, image: { src: 'assets/img/steps/h2-bands.webp', alt: 'Band structures of C2/c-12 and Ama2 hydrogen and the energies of their low conduction states against pressure', caption: 'Fig. 2 of the paper. Band structures and the energies of the low conduction states under pressure.' } } },
      { name: 'Between molecules', dur: 2400, note: 'C2/c-12 · band 15 · a conduction-band state',
        text: 'The conduction states that fill first are not located on the H<sub>2</sub> molecules. Their density is concentrated in pockets and channels between the molecules, similar to the interstitial electrons of an electride. To quantify this, we evaluated each band on the 15% of grid points that are farthest from any hydrogen nucleus.',
        alt: 'C2/c-12 hydrogen with a yellow isosurface of its band-15 state in the spaces between the molecules.',
        shot: { scene: 'h2_c2c_b15', iso: true, sections: true, labels: [{ at: [-1.552, 4.71, 1.192], text: 'between the molecules', side: 'right' }] } },
      { name: 'Ama2', dur: 2400, note: 'Ama2 · 425 GPa · band 25 at R',
        text: 'The other phases behave in the same way. In Ama2 at 425 GPa the band-25 state occupies channels between the molecular layers, and in P6<sub>3</sub>/m the states that fill after metallization are also located between the molecules. Solid hydrogen therefore metallizes in an electride-like way, in which the molecules remain intact and the new conduction electrons occupy the space between them.',
        alt: 'Ama2 hydrogen at 425 GPa with a yellow isosurface of its band-25 state in channels between the molecular layers.',
        shot: { scene: 'h2_ama2_b25', iso: true, sections: true, labels: [{ at: [2.614, 2.851, 0.024], text: 'channels between the layers', side: 'right' }] } },
      { name: 'With metals', dur: 1500, note: 'LiH<sub>2</sub> at 150 GPa · La<sub>4</sub>H<sub>23</sub> at 100 GPa',
        text: 'Metal atoms produce the same behavior at lower pressure. In LiH<sub>2</sub> the gap closes at 150 GPa. In La<sub>4</sub>H<sub>23</sub> at 100 GPa an interstitial state is already occupied, whereas in pure hydrogen at that pressure the corresponding state lies several electronvolts above the Fermi level. Hydrides that keep their H<sub>2</sub> units are among the best candidates for superconductivity at moderate pressure, and these interstitial electrons may affect how they superconduct.',
        alt: 'Figure 4 of the paper: LiH2 at 150 GPa and La4H23 at 100 GPa, their bands, and their interstitial states.',
        shot: { scene: 'h2_ama2_b25', only: none, cell: false, image: { src: 'assets/img/steps/h2-metals.webp', alt: 'Structures, band structures and interstitial states of LiH2 and La4H23', caption: 'Fig. 4 of the paper. LiH₂ (top) and La₄H₂₃ (bottom).' } } }
    ]
  });

  // ---------- iron in deep Earth (PNAS 2025) ----------
  window.LP_paperScheme({
    id: 'scheme-iron', cite: 'fe', label: 'The iron paper, step by step',
    title: 'How iron changes from electron donor to electron acceptor under pressure.',
    legend: sw(C.Fe, 'Fe') + sw(C.I, 'I'),
    spec: '<b>FeI<sub>2</sub></b> (P-3m1, 0 GPa) and <b>Fe<sub>3</sub>I</b> (Pm-3m, 300 GPa) from the set of structures behind the paper · the search in step 1 is drawn schematically · the hull and charge panels are figures from the paper.',
    fallback: { src: 'assets/img/iron-redox.webp', alt: 'Convex hulls of iron with silicon, phosphorus, sulfur, germanium, arsenic and selenium' },
    steps: [
      { name: 'Why', dur: 2800, note: 'a structure search that ends at Fe<sub>3</sub>I at 300 GPa (schematic)',
        text: 'The distribution of elements between Earth’s core and the silicate Earth depends in part on how iron bonds with them at high pressure. We studied this bonding at core pressures by pairing iron with 23 p-block elements, from boron to bismuth. We searched for structures of Fe<sub>m</sub>X<sub>n</sub> (m and n from 1 to 3) with CALYPSO at 150 and 300 GPa and took most of the 0 GPa structures from the Materials Project.',
        alt: 'Iron and iodine atoms scattered through the picture move around and settle into the cubic Fe3I structure.',
        shot: { scene: 'fe3i_300gpa', search: true } },
      { name: 'Hulls', dur: 1500, note: 'iron with 23 p-block elements · 0, 150 and 300 GPa',
        text: 'We built convex hulls from the formation enthalpies at 0, 150 and 300 GPa. Under pressure iron binds most of these elements much more strongly, with formation enthalpies of −1 eV per atom and below. FeTe, for example, becomes more stable by 1 eV per atom and reaches about the stability of FeS. Hulls calculated with the HSE functional and free energies at high temperature give the same picture.',
        alt: 'Figure 1 of the paper: the convex hulls of iron with each p-block element at 0, 150 and 300 GPa.',
        shot: { scene: 'fe3i_300gpa', only: none, cell: false, image: { src: 'assets/img/steps/iron-hulls.webp', alt: 'Convex hulls of iron with 23 p-block elements at 0, 150 and 300 GPa', caption: 'Fig. 1 of the paper. Convex hulls.' } } },
      { name: 'Charges', dur: 1500, note: 'the Bader charge of iron at 0, 150 and 300 GPa',
        text: 'Bader charges show the direction of charge transfer. At ambient pressure iron donates electrons to most of these elements, whereas under compression it accepts them. With iodine the sign of the iron charge reverses near 100 GPa, so that iron iodide becomes an “iodine ferride”. The reversal occurs near 30 GPa with tellurium, near 110 GPa with arsenic and near 150 GPa with phosphorus, and with germanium iron is already the acceptor at 0 GPa. With N, O, F, S, Se, Cl and Br, iron remains positive even at 300 GPa.',
        alt: 'Figure 2D to F of the paper: the Bader charge of iron in its compounds at 0, 150 and 300 GPa.',
        shot: { scene: 'fei2_0gpa', only: none, cell: false, image: { src: 'assets/img/steps/iron-charges.webp', alt: 'Bader charge of iron in its compounds with the p-block elements at 0, 150 and 300 GPa', caption: 'Fig. 2D–F of the paper. Bader charge of iron.' } } },
      { name: 'Layers', dur: 2200, note: 'FeI<sub>2</sub> · P-3m1 · 0 GPa · Fe +0.745',
        text: 'The structures change together with the charge. At ambient pressure FeI<sub>2</sub> is layered, with sheets of iron between layers of iodine and the iodine lone pairs directed into the gap between the sheets. Iron carries a Bader charge of +0.745 in this structure.',
        alt: 'Layered FeI2: sheets of iron between layers of iodine, with gaps between the sheets.',
        shot: { scene: 'fei2_0gpa', labels: [{ atom: 35, text: 'iodine facing the gap', side: 'top' }] } },
      { name: 'Packed', dur: 2400, note: 'Fe<sub>3</sub>I · Pm-3m · 300 GPa',
        text: 'Under pressure the lone pairs disappear and iodine becomes coordinated by more iron atoms. It has six iron neighbors in Fe<sub>2</sub>I and twelve in cubic Fe<sub>3</sub>I, where iron is slightly negative (−0.040 at 150 GPa). Iron has become the electron acceptor.',
        alt: 'Cubic Fe3I, with each iodine surrounded by twelve iron atoms.',
        shot: { scene: 'fe3i_300gpa', labels: [{ atom: 42, text: 'iodine with 12 iron neighbors', side: 'right' }] } },
      { name: 'Earth’s core', dur: 1500, note: 'binding to iron against depletion in the silicate Earth',
        text: 'We compared the strength of each element’s bond to iron with its depletion in the silicate Earth. The bond strength varies in the direction opposite to what uptake into the core would require, and the depletion instead follows volatility. Silicon, however, binds iron more strongly than oxygen above 250 GPa, which makes it a candidate light element of the core. Models of how Earth’s elements were distributed therefore need to account for how bonding changes under pressure.',
        alt: 'Figure 2A to C of the paper: the abundance of each element in the silicate Earth against how strongly it binds iron.',
        shot: { scene: 'fe3i_300gpa', only: none, cell: false, image: { src: 'assets/img/steps/iron-abundance.webp', alt: 'Abundance of elements in the silicate Earth against the formation enthalpy of their most stable iron compound', caption: 'Fig. 2A–C of the paper. Binding to iron against abundance in the silicate Earth.' } } }
    ]
  });

  // ---------- metal superhydrides from chemical templates (JACS 2025) ----------
  window.LP_paperScheme({
    id: 'scheme-templates', cite: 'superhydrides', label: 'The superhydride template paper, step by step',
    title: 'How machine learning on bare metal lattices finds new superhydrides.',
    legend: sw(C.U, 'U') + sw(C.H, 'H') + iso('ELF'),
    spec: '<b>U<sub>10</sub>H<sub>84</sub></b> (I4/m) and its U<sub>10</sub> metal lattice with ELF, one of the new structures · the expansion of the lattice and the hydrogen search are drawn schematically · the workflow, model and count panels are figures from the paper.',
    fallback: { src: 'assets/img/superhydrides.webp', alt: 'Two-step chemical-template workflow for discovering metal superhydrides' },
    steps: [
      { name: 'Why', dur: 1500, note: '57 prototypes · 16 metals · 100 to 300 GPa · 4151 structures',
        text: 'Superhydrides are among the best candidates for high-temperature superconductivity, but much of their chemical space is unexplored. This is especially true for non-integer hydrogen-to-metal ratios, whose large cells make structure searches expensive. Our approach evaluates the bare metal lattice before any hydrogen is added. We started from 57 known prototypes with 16 metals, relaxed at 100 to 300 GPa, which gave 4151 structures labelled with their energy above the hull. We then removed the hydrogen and kept the metal lattices.',
        alt: 'Figure 1A to C of the paper: the training data, the features, and the model.',
        shot: { scene: 'u10_template', only: none, cell: false, image: { src: 'assets/img/steps/templates-training.webp', alt: 'Training data preparation, feature engineering and model training', caption: 'Fig. 1A–C of the paper' } } },
      { name: 'Bare lattice', dur: 2400, note: 'a bare metal lattice, U<sub>10</sub>, and its ELF',
        text: 'A single DFT calculation on each bare metal lattice provides 46 features that describe its atoms, its crystal structure, its composition, and the largest and average ELF in the interstitial space between the metal atoms. The ELF shows where electrons localize in the absence of hydrogen. Packing efficiency is the most important feature and the largest interstitial ELF is the second.',
        alt: 'The U10 metal lattice with a yellow ELF isosurface around each atom and in the spaces between them.',
        shot: { scene: 'u10_template', iso: true, sections: true } },
      { name: 'Model', dur: 1500, note: 'E<sub>hull</sub> from the bare lattice · MAE 11 meV/atom',
        text: 'An AutoGluon stack ensemble predicts the energy above the hull from these features, without any information about the hydrogen positions. Its cross-validated mean absolute error is 11 meV per atom, with R<sup>2</sup> = 0.951.',
        alt: 'Figure 1C of the paper: predicted against calculated energies above the hull.',
        shot: { scene: 'u10_template', only: none, cell: false, image: { src: 'assets/img/steps/templates-model.webp', alt: 'Predicted against DFT energy above the hull for the training and test sets', caption: 'Fig. 1C of the paper' } } },
      { name: 'Screen', dur: 2600, note: '7939 candidates · 1421 below 50 meV/atom',
        text: 'We generated new metal lattices from 52 complex prototypes and the 16 metals, relaxed them without hydrogen at 200 GPa, and expanded each to the volume it would have as MH<sub>x</sub> for x from 6 to 16. This gave 7939 candidates. The model predicted the energy of each one, and 1421 of them lie within 50 meV per atom of the hull.',
        alt: 'The U10 lattice drawn wider, as a candidate lattice is widened to the volume it would have with hydrogen.',
        shot: { scene: 'u10_template', squeeze: 1.12 } },
      { name: 'Hydrogen', dur: 3000, note: 'U<sub>10</sub>H<sub>84</sub> · I4/m · hydrogen around the basins',
        text: 'Hydrogen is added only at this stage. CALYPSO searches place hydrogen in each selected lattice, with about 400 relaxations per search. The best structures are re-optimized, placed on the convex hull with zero-point and thermal corrections, and checked for phonon stability. In U<sub>10</sub>H<sub>84</sub>, shown here, the hydrogen cages form around the electron basins of the bare lattice.',
        alt: 'Hydrogen atoms fly into the U10 lattice and settle into the cages of U10H84.',
        shot: { scene: 'u10h84_structure', search: true } },
      { name: 'Results', dur: 1500, note: '13 prototypes · 31 structures · 19 above 100 K (estimated)',
        text: 'The workflow found 13 new structural prototypes and 31 stable or nearly stable metal superhydrides, 19 of which have non-integer hydrogen-to-metal ratios. A fast estimate places 19 of them above 100 K, and a full calculation for Ca<sub>8</sub>H<sub>46</sub> gives a T<sub>c</sub> of 134 to 147 K at 200 GPa. Evaluating the metal lattice first limits the expensive hydrogen searches to the most promising lattices, and the same approach could be applied to ternary superhydrides.',
        alt: 'Figure 6 of the paper: counts of superhydrides, prototypes and clathrates in the training data and in this work.',
        shot: { scene: 'u10h84_structure', only: none, cell: false, image: { src: 'assets/img/steps/templates-results.webp', alt: 'Counts of stable superhydrides, structure prototypes and clathrate superhydrides in the training data and in this work', caption: 'Fig. 6 of the paper' } } }
    ]
  });

  // ---------- NaKH12 (Adv. Funct. Mater. 2025) ----------
  const CUBE = [1.521, 1.521, 4.563];   // the center of one small Na4K4 cube (an 8c site), facing the viewer
  window.LP_paperScheme({
    id: 'scheme-nakh12', cite: 'nakh12', label: 'The NaKH12 paper, step by step',
    title: 'How interstitial electrons assemble the H<sub>2</sub> units of NaKH<sub>12</sub>.',
    legend: sw(C.Na, 'Na') + sw(C.K, 'K') + sw(C.H, 'H') + iso('ELF'),
    spec: '<b>NaKH<sub>12</sub></b> (Fm-3m, 60 GPa) and its Na–K sublattice in the same cell, with their ELF · the search in step 1 is drawn schematically · the superconductivity and pressure panels are figures from the paper.',
    fallback: { src: 'assets/img/nakh12.webp', alt: 'Crystal structure of NaKH12 and the energy change with H–H distance' },
    steps: [
      { name: 'Why', dur: 2800, note: 'NaKH<sub>12</sub> · Fm-3m · 60 GPa · H–H 0.86 Å',
        text: 'Hydride superconductors reach record critical temperatures, but only at very high pressure. Hydrides that consist of H<sub>2</sub> units are stable at moderate pressure, but it was unclear how they become metallic. An AIRSS structure search of the Na–K–H system found NaKH<sub>12</sub>, in which sodium and potassium occupy two interpenetrating fcc lattices, as in rock salt, and all hydrogen atoms form H<sub>2</sub> units. The H–H distance is 0.86 Å at 60 GPa, compared with 0.74 Å in a free molecule.',
        alt: 'Sodium, potassium and hydrogen atoms move around and settle into the NaKH12 structure.',
        shot: { scene: 'nakh12_60GPa', search: true } },
      { name: 'T<sub>c</sub>', dur: 1500, note: 'λ = 4.03 · T<sub>c</sub> = 245 K at 60 GPa',
        text: 'The electron–phonon coupling is strong, with λ = 4.03, and most of it comes from soft, low-frequency modes. The Eliashberg equations with μ* = 0.1 give T<sub>c</sub> = 245 K at 60 GPa.',
        alt: 'Figure 2 of the paper: band structure, Fermi surface, nesting function and phonons of NaKH12.',
        shot: { scene: 'nakh12_60GPa', only: none, cell: false, image: { src: 'assets/img/steps/nakh12-tc.webp', alt: 'Band structure, Fermi surface, nesting function and phonon spectrum of NaKH12 at 60 GPa', caption: 'Fig. 2 of the paper' } } },
      { name: 'Hydrogen alone', dur: 2200, note: 'the hydrogen of NaKH<sub>12</sub>, with the metals taken out',
        text: 'To understand this coupling, we first removed the metals. The hydrogen lattice alone has a crystal orbital that is centered in the gap enclosed by six H<sub>2</sub> units. This orbital decreases in energy as the H<sub>2</sub> units lengthen and becomes occupied once they are longer than about 0.79 Å. In NaKH<sub>12</sub> the units are 0.86 Å long.',
        alt: 'Only the H2 units of NaKH12 remain; six of them surround an empty gap.',
        shot: { scene: 'nakh12_60GPa', only: ['H'], labels: [{ at: CUBE, text: 'the gap six H<sub>2</sub> enclose', side: 'right' }] } },
      { name: 'Template', dur: 2600, note: 'the Na–K lattice alone, at the same volume · ELF',
        text: 'We then removed the hydrogen instead. The bare Na–K lattice at the same volume has a strongly localized ELF maximum at the center of each small Na<sub>4</sub>K<sub>4</sub> cube, which is the same gap. These interstitial electrons act as the template. Six H<sub>2</sub> units assemble around each of them, with their bonds directed toward it.',
        alt: 'The sodium and potassium lattice with a yellow ELF isosurface at the center of each small cube of four Na and four K.',
        shot: { scene: 'nak_sublattice', iso: true, sections: true, labels: [{ at: CUBE, text: 'electrons localized here', side: 'right' }] } },
      { name: 'Together', dur: 2400, note: 'NaKH<sub>12</sub> · ELF',
        text: 'In the full compound these interstitial electrons occupy the antibonding orbitals of the H<sub>2</sub> units. The H–H bonds weaken and lengthen, and charge connects neighboring units. This explains the strong coupling between the electrons and the hydrogen vibrations.',
        alt: 'NaKH12 with yellow ELF isosurfaces around each H2 unit.',
        shot: { scene: 'nakh12_60GPa', iso: true, fade: ['Na', 'K'] } },
      { name: 'Pressure', dur: 1500, note: 'T<sub>c</sub> = 308 K at 300 GPa',
        text: 'At 0 GPa the Na–K lattice has no such interstitial electrons, which is consistent with NaKH<sub>12</sub> being unstable below 60 GPa. The interstitial basin becomes stronger with pressure, with its ELF increasing from about 0.63 at 60 GPa to about 0.82 at 300 GPa, and T<sub>c</sub> increases to 308 K at 300 GPa. Metal lattices whose interstitial electrons match a hydrogen lattice can therefore guide the search for molecular hydrides that superconduct at moderate pressure.',
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
    title: 'How a sulfur vacancy makes monolayer MoS<sub>2</sub> an electride.',
    legend: sw(C.Mo, 'Mo') + sw(C.S, 'S') + iso('ELF'),
    derive: { mos2_pristine: { from: 'mos2_vacancy', add: [[SITE[0], SITE[1], SITE[2], 'S']], grid: false } },
    spec: '<b>MoS<sub>2</sub></b> · a 4×4 cell of the 2H monolayer from the project’s files, with one S vacancy and its ELF (the paper’s numbers come from 7×7 and 5×5 cells) · in the first three pictures the labels mark the sites described in the paper · the panels are figures from the paper.',
    fallback: { src: 'assets/img/tmdc-vacancy.webp', alt: 'Crystal orbital of a monolayer MX2 with a chalcogen vacancy' },
    steps: [
      { name: 'Why', dur: 2000, note: 'a monolayer of 2H-MoS<sub>2</sub>',
        text: 'Electrides hold some of their electrons in the space between atoms, where they can be transferred easily to a molecule on the surface. This makes them useful for catalysis and electronics. However, most known electrides have unusual compositions, and their exposed electrons react with air and water unless the surface is passivated. Monolayer transition-metal dichalcogenides such as MoS<sub>2</sub> are among the most studied 2D materials, and we asked whether they can be made into electrides.',
        alt: 'A monolayer of MoS2: a sheet of molybdenum atoms between two layers of sulfur.',
        shot: { scene: 'mos2_pristine' } },
      { name: 'Bare layer', dur: 2200, note: 'the Mo layer, with the S sites (X<sub>0</sub>) faded',
        text: 'We first considered the metal layer alone, with the chalcogen atoms removed. Its ELF has maxima above and below the layer, and half of them are located at the positions that the chalcogens occupy, the X<sub>0</sub> sites. In this picture each chalcogen occupies a site where the metal layer already localizes electrons.',
        alt: 'A layer of molybdenum atoms, with the sulfur sites above and below it drawn faint.',
        shot: { scene: 'mos2_pristine', fade: ['S'], labels: [{ at: SITE, text: 'X<sub>0</sub>', side: 'top' }] } },
      { name: 'Screen', dur: 1500, note: '30 metals × 2H, 1T, 1T′ × S, Se, Te',
        text: 'This relation holds across the transition metals. For all 30 of them, in the 2H, 1T and 1T′ structures and with S, Se and Te, the formation enthalpy of MX<sub>2</sub> follows the ELF at the X<sub>0</sub> sites of the bare metal layer. The compound is more stable where more electrons localize at these sites.',
        alt: 'Figure 1 of the paper: the ELF of bare metal layers, and the formation enthalpy against the ELF at X0.',
        shot: { scene: 'mos2_pristine', only: none, cell: false, image: { src: 'assets/img/steps/tmdc-bare-layers.webp', alt: 'ELF of the bare 2H, 1T and 1T′ metal layers, and formation enthalpy against the ELF at the X0 sites', caption: 'Fig. 1 of the paper' } } },
      { name: 'Weak electride', dur: 2200, note: '2H-MoS<sub>2</sub> · E marks one of the hollows',
        text: 'Pristine 2H-MoS<sub>2</sub> retains a small part of this localization. A weak ELF maximum, E, is located in the empty hollow between three Mo and six S atoms, and its states lie just below the Fermi level. MoSe<sub>2</sub>, WS<sub>2</sub> and WSe<sub>2</sub> have the same feature, whereas the 1T and 1T′ structures do not. The paper describes this electride character as rather weak.',
        alt: 'A monolayer of MoS2, with one empty hollow between three molybdenum and six sulfur atoms marked E.',
        shot: { scene: 'mos2_pristine', labels: [{ at: HOLLOW, text: 'E', side: 'right' }] } },
      { name: 'Vacancy', dur: 2200, note: 'one sulfur taken out',
        text: 'We then examined defects in a 7 × 7 MoS<sub>2</sub> supercell, including one or two missing sulfur atoms, a missing molybdenum atom, and antisites. Only the sulfur vacancies leave an isolated electron maximum E. It is located slightly below the original sulfur position, closer to the Mo layer.',
        alt: 'One sulfur atom shrinks away from the top layer of the MoS2 sheet, leaving a vacancy.',
        shot: { scene: 'mos2_vacancy', labels: [{ at: SITE, text: 'V<sub>S</sub>', side: 'top' }] } },
      { name: '0D electride', dur: 2400, note: 'ELF of MoS<sub>2</sub> with one S vacancy',
        text: 'The highest occupied state is localized on E. It contains 0.45 electrons within 1.0 Å of E for one missing sulfur and 0.36 electrons within 0.8 Å for two. A 5 × 5 cell gives nearly the same values, which shows that each vacancy localizes its electrons independently as a zero-dimensional electride. The yellow surface is the ELF around the vacancy.',
        alt: 'The MoS2 sheet with a yellow ELF isosurface: lone pairs on every sulfur and a basin with no atom in the vacancy.',
        shot: { scene: 'mos2_vacancy', iso: true, sections: true, labels: [{ at: BASIN, text: 'E', side: 'right' }] } },
      { name: 'Hydrogen', dur: 1500, note: 'ΔG(H*) at the vacancy, with charge added or removed',
        text: 'Hydrogen also binds at the vacancy. ΔG for hydrogen adsorption at the vacancy lies between −0.2 and 0.25 eV and can be tuned by adding or removing a small amount of charge, as doping or an electric field would. MoS<sub>2</sub> reaches ΔG = 0 with 0.07 electrons removed, WS<sub>2</sub> with 0.21 and WSe<sub>2</sub> with 0.15, whereas NbS<sub>2</sub> changes very little. Because vacancy concentrations can already be controlled in experiments, this is a route to electrides of tunable strength from a common 2D material, and the vacancy electrons could help catalyze hydrogen evolution.',
        alt: 'Figure 4 of the paper: the free energy of hydrogen adsorption at the vacancy as charge is added or removed.',
        shot: { scene: 'mos2_vacancy', only: none, cell: false, image: { src: 'assets/img/steps/tmdc-her.webp', alt: 'Free energy of hydrogen adsorption at the vacancy against added or removed charge, and charge-density differences', caption: 'Fig. 4 of the paper' } } }
    ]
  });

  // ---------- Cs polyoxides (arXiv 2110.07865, v2 of 2026) ----------
  const PAIR = [2.0801, 1.2009, 7.4978];   // the middle of one O-O pair of P6_3/mmc CsO, facing the viewer
  const TURN = { rot: [[1, 0, -18], [0, 1, -30], [1, 0, 18]] };   // P6_3/mmc CsO turned 30° about c, so that its 2 × 2 block of cells looks compact
  const CS2_R3M = [1, 4, 8, 14, 17, 21, 27, 32, 35, 39, 45, 48, 52, 58, 63, 68, 73];   // the Cs2 atoms of R-3m CsO (no O within 2.05 Å)
  const CS2_PMMN = [2, 3, 12, 13, 22, 23, 31, 36, 39, 42, 44, 48, 49, 58, 59, 68, 69, 77, 82, 85, 88, 90];   // the Cs2 atoms of Pmmn Cs2O3
  window.LP_paperScheme({
    id: 'scheme-cso', cite: 'cs-polyoxides', label: 'The Cs polyoxide preprint, step by step',
    title: 'How cesium oxides lose their O–O bonds under pressure as the Cs 5p core electrons begin to bond with oxygen.',
    legend: sw(C.Cs, 'Cs') + sw(C.O, 'O'),
    spec: '<b>CsO</b> (P6<sub>3</sub>/mmc at 150 GPa, R-3m at 250 GPa) and <b>Cs<sub>2</sub>O<sub>3</sub></b> (Pmmn, 400 GPa) from the structures behind the preprint · the search in step 5 is drawn schematically.',
    fallback: { src: 'assets/img/cards/cs-polyoxides.webp', alt: 'Crystal structure of CsO at 150 GPa, with its O–O pairs' },
    steps: [
      { name: 'Why', dur: 2200, note: 'CsO · P6<sub>3</sub>/mmc · 150 GPa',
        text: 'At high pressure the core electrons of an element can take part in bonding. Calculations predicted more than a decade ago that cesium forms CsF<sub>n</sub> compounds with excess fluorine by using its 5p core electrons, but liquid F<sub>2</sub> damages the diamond anvil cell, and no experiment has confirmed them. We therefore asked whether solid cesium oxides could show the same chemistry.',
        alt: 'The P63/mmc structure of CsO at 150 GPa, with O–O pairs between the cesium atoms.',
        shot: { scene: 'cso_p63mmc_150gpa', view: TURN } },
      { name: 'Peroxide', dur: 1800, note: 'CsO · P6<sub>3</sub>/mmc · a peroxide',
        text: 'We searched for the stable cesium oxides from 0 to 500 GPa, and CsO is stable over the whole range. Up to 221 GPa it is a peroxide, with O<sub>2</sub><sup>2−</sup> pairs between the cesium atoms. The Cs 5p states overlap with the O 2p states but do not bond with them, and cesium keeps its usual oxidation state of +1.',
        alt: 'The same structure of CsO, with one O–O pair marked as a peroxide ion.',
        shot: { scene: 'cso_p63mmc_150gpa', view: TURN, labels: [{ at: PAIR, text: 'an O<sub>2</sub><sup>2−</sup> pair', side: 'right' }] } },
      { name: '221 GPa', dur: 2400, note: 'CsO · R-3m · 250 GPa',
        text: 'At 221 GPa CsO transforms into an R-3m structure that has no O–O bonds. Half of its cesium atoms (Cs1) bind two oxygen atoms in linear [CsO<sub>2</sub>]<sup>−</sup> units, whereas the other half (Cs2) have their oxygen neighbors farther away.',
        alt: 'The O–O pairs come apart and the atoms rearrange into R-3m CsO, in which each Cs1 atom sits between two oxygens in a straight line.',
        shot: { scene: 'cso_r3m_250gpa', labels: [{ atom: 41, text: 'a linear [CsO<sub>2</sub>]<sup>−</sup> unit', side: 'right' }] } },
      { name: 'Core electrons', dur: 2000, note: 'R-3m CsO · the Cs2 atoms faded',
        text: 'In this structure electrons move from the Cs 5p states into the O 2p states, and Cs1 reaches an oxidation state above +1. The ELF and the bonding analysis show covalent Cs1–O bonds about four times as strong as the Cs2–O bonds. Pressure causes this by raising the energy of the Cs 5p orbitals above that of the O 2p orbitals, which happens at 318 GPa in a He matrix model.',
        alt: 'R-3m CsO with the Cs2 atoms faded, leaving the linear O–Cs1–O units.',
        shot: { scene: 'cso_r3m_250gpa', fade: CS2_R3M, labels: [{ atom: 41, text: 'Cs1', side: 'right' }] } },
      { name: 'Above 300 GPa', dur: 3000, note: 'Cs<sub>2</sub>O<sub>3</sub> · Pmmn · 400 GPa',
        text: 'Above about 300 GPa the stable compounds change. The superoxide CsO<sub>2</sub> becomes unstable, while CsO<sub>3</sub> and Cs<sub>2</sub>O<sub>3</sub>, shown here at 400 GPa, become stable without any O–O bonds. Pressure usually favors oxides with stronger O–O bonds, such as peroxides and superoxides, whereas in the cesium oxides these bonds disappear.',
        alt: 'Cesium and oxygen atoms move around and settle into the Pmmn structure of Cs2O3 at 400 GPa.',
        shot: { scene: 'cs2o3_pmmn_400gpa', search: true } },
      { name: 'Cs₂O₃', dur: 2000, note: 'Cs<sub>2</sub>O<sub>3</sub> · the Cs2 atoms faded',
        text: 'The two cesium sites of Cs<sub>2</sub>O<sub>3</sub> differ strongly, with Bader charges of 2.17 on Cs1 and 0.87 on Cs2. Cs1 forms strong covalent bonds with oxygen in buckled sheets, and Cs2 sits between the sheets, so the compound can be written as Cs<sup>+</sup>(CsO<sub>3</sub>)<sup>−</sup>. With its 5p electrons in bonds, cesium here behaves as a p-block element.',
        alt: 'Cs2O3 with the Cs2 atoms faded, leaving the buckled sheets of Cs1 and oxygen.',
        shot: { scene: 'cs2o3_pmmn_400gpa', fade: CS2_PMMN, labels: [{ atom: 57, text: 'Cs1, in a Cs–O sheet', side: 'right' }, { atom: 68, text: 'Cs2, between the sheets', side: 'left' }] } },
      // a slide after the steps drawn here: the 3D figure of CsO at 150 and 250 GPa (fig-cso)
      { name: 'In the lab', dur: 1500,
        text: 'CsO is the most promising candidate for an experiment. It can be loaded into a diamond anvil cell as a solid, and because its composition does not change, nothing has to react inside the cell. The transformation near 221 GPa should show in X-ray diffraction, in IR and Raman spectra as the O–O pairs disappear, and in the Cs L<sub>3</sub>-edge XANES. It needs a higher pressure than the fluorides but no F<sub>2</sub>, which makes core reactivity testable in experiment.',
        slide: { fig: 'fig-cso', pick: [0, 0] } }
    ]
  });

  // ---------- Cs-Ba-O (arXiv 2611.06009) ----------
  const O2 = [6.8986, 1.6569, 1.8198];   // the middle of one O2 unit of CsBaO4, facing the viewer
  window.LP_paperScheme({
    id: 'scheme-csbao', cite: 'cs-core', label: 'The Cs–Ba–O preprint, step by step',
    title: 'How Cs<sub>2</sub>O and BaO<sub>2</sub> could serve as solid starting materials for Cs core reactivity under pressure.',
    legend: sw(C.Cs, 'Cs') + sw(C.Ba, 'Ba') + sw(C.O, 'O') + iso('ELF'),
    spec: '<b>CsBaO<sub>4</sub></b> and <b>Cs<sub>2</sub>BaO<sub>3</sub></b> (Cm, with its ELF) from the structures behind the preprint, and <b>CsO</b> (R-3m), all at 250 GPa · the search in step 2 is drawn schematically.',
    fallback: { src: 'assets/img/cards/cs-core.webp', alt: 'Crystal structure of Cs2BaO3 at 250 GPa, with each cesium between two oxygens' },
    steps: [
      { name: 'Why', dur: 2200, note: 'CsO · R-3m · 250 GPa',
        text: 'CsO, a peroxide at ambient pressure, is predicted to transform near 221 GPa into a phase with nearly linear O–Cs–O units, in which the Cs 5p core electrons bond with oxygen. We asked whether a mixture of two solids, Cs<sub>2</sub>O and the commercially available peroxide BaO<sub>2</sub>, could serve as the starting material instead. A 1:1 mixture has the composition of Cs<sub>2</sub>BaO<sub>3</sub>, but it could also form CsO and BaO.',
        alt: 'R-3m CsO at 250 GPa, in which cesium atoms sit between two oxygens in straight O–Cs–O units.',
        shot: { scene: 'cso_r3m_250gpa', labels: [{ atom: 41, text: 'an O–Cs–O unit of CsO', side: 'right' }] } },
      { name: 'Search', dur: 3000, note: 'CsBaO<sub>4</sub> · Cm · 250 GPa',
        text: 'We searched for Cs–Ba–O compounds at 150 and 250 GPa and built their convex hulls. Three ternaries are stable at 150 GPa, and CsBaO<sub>4</sub>, shown here, joins them at 250 GPa. Cs<sub>2</sub>BaO<sub>3</sub> is stable at neither pressure, although it comes closer to the hull as the pressure rises.',
        alt: 'Cesium, barium and oxygen atoms move around and settle into the Cm structure of CsBaO4 at 250 GPa.',
        shot: { scene: 'csbao4_cm_250gpa', search: true } },
      { name: 'O₂ units', dur: 1800, note: 'CsBaO<sub>4</sub> · O<sub>2</sub> units',
        text: 'CsBa<sub>3</sub>O<sub>8</sub> and CsBaO<sub>4</sub>, the stable ternaries richest in oxygen, keep O<sub>2</sub> units. Their Cs 5p electrons take only a small part in bonding, as in the superoxide CsO<sub>2</sub>, and their O<sub>2</sub> units carry more antibonding electrons than those of CsO<sub>2</sub>, which makes them more peroxide-like.',
        alt: 'CsBaO4 at 250 GPa, with one of its O2 units marked.',
        shot: { scene: 'csbao4_cm_250gpa', labels: [{ at: O2, text: 'an O<sub>2</sub> unit', side: 'right' }] } },
      { name: 'Cs₂BaO₃', dur: 2400, note: 'Cs<sub>2</sub>BaO<sub>3</sub> · Cm · 250 GPa',
        text: 'Cs<sub>2</sub>BaO<sub>3</sub> has no O<sub>2</sub> units, and both of its cesium sites sit in nearly linear O–Cs–O units, with shorter Cs–O contacts at Cs(1), as in core-reactive CsO. Its empty states near 1 eV above the Fermi level also have a large Cs 5p and O 2p component, like those of CsO.',
        alt: 'Cs2BaO3 at 250 GPa, with straight O–Cs–O units at both cesium sites, Cs(1) and Cs(2).',
        shot: { scene: 'cs2bao3_cm_250gpa', labels: [{ atom: 48, text: 'Cs(1)', side: 'top' }, { atom: 49, text: 'Cs(2)', side: 'left' }] } },
      { name: 'ELF', dur: 2400, note: 'ELF from DFT · isosurface 0.40',
        text: 'In the ELF of Cs<sub>2</sub>BaO<sub>3</sub> the electrons localize along the O–Cs–O units, more strongly at Cs(1). The bonding analysis gives it the strongest Cs 5p–O 2p bonds among the ternaries, although weaker at Cs(1) than in CsO. Cs<sub>2</sub>BaO<sub>3</sub> is metastable, however, and would decompose into CsO and BaO.',
        alt: 'Cs2BaO3 with a yellow ELF isosurface and colored cuts, with localization along the O–Cs–O units.',
        shot: { scene: 'cs2bao3_elf_250gpa', iso: true, sections: true, labels: [{ atom: 48, text: 'Cs(1)', side: 'top' }, { atom: 49, text: 'Cs(2)', side: 'left' }] } },
      // a slide after the steps drawn here: the 3D figure of Cs2BaO3 with its structure and ELF (fig-cs2bao3)
      { name: 'Precursors', dur: 1500,
        text: 'Cs<sub>2</sub>O and BaO<sub>2</sub> can react to form Cs<sub>2</sub>BaO<sub>3</sub>, and its decomposition into CsO and BaO lowers the enthalpy further. Because CsO at 250 GPa is the R-3m phase whose 5p electrons bond with oxygen, the mixture is a solid starting point for core reactivity even if the ternary does not form. Calculated X-ray diffraction patterns can tell these phases apart in a diamond anvil cell, and Cs L<sub>3</sub>-edge XANES spectra add information on the cesium environment.',
        slide: { fig: 'fig-cs2bao3', pick: [0, 0] } }
    ]
  });
})();
