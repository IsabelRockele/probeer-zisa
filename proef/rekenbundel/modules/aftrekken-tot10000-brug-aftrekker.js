/* ══════════════════════════════════════════════════════════════
   modules/aftrekken-tot10000-brug-aftrekker.js
   Aftrekken tot 10.000 MET BRUG — Via aftrekker splitsen

   Strategie: splits de aftrekker in 2 delen
   Stap 1: trek af tot het dichtstbijzijnde duizendtal
   Stap 2: trek de rest af

   Voorbeeld: 3600 − 800
   - splits 800 → 600 + 200
   - 3600 − 600 = 3000
   - 3000 − 200 = 2800

   Types: DH−H, DH−DH (later uitbreiden)
   Brug: H van aftrektal < H van aftrekker (brug via honderden)
   ══════════════════════════════════════════════════════════════ */

const AftrekkenTot10000BrugAftrekker = (() => {

  const ALLE_TYPES = ['DH-H', 'DH-DH', 'Gemengd'];

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaarDHH() {
    for (let p = 0; p < 400; p++) {
      // Aftrektal: DH (duizendtallen + honderden, geen T/E)
      const dA = rand(1, 8);
      const hA = rand(1, 9);
      const aftrektal = dA * 1000 + hA * 100;

      // Aftrekker: H (veelvoud van 100, geen duizendtallen)
      const hB = rand(1, 9);
      const aftrekker = hB * 100;

      // Brug: H van aftrektal < H van aftrekker
      if (hA >= hB) continue;

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;

      // Splits aftrekker: delta1 = hA*100 (aftrekken tot duizendtal)
      //                   delta2 = aftrekker - delta1 (rest)
      const delta1 = hA * 100;
      const delta2 = aftrekker - delta1;
      if (delta2 <= 0) continue;

      const tussensom = aftrektal - delta1;  // = duizendtal
      if (tussensom % 1000 !== 0) continue;  // moet exact duizendtal zijn

      return {
        a: aftrektal,
        b: aftrekker,
        verschil,
        splits: { delta1, delta2, tussensom },
        schrijflijn1: `${aftrektal} - ${delta1} = ${tussensom}`,
        schrijflijn2: `${tussensom} - ${delta2} = ${verschil}`,
        type: 'DH-H',
      };
    }
    return null;
  }


  function maakPaarDHDH() {
    // DH-DH: bv. 5400 - 2800
    // Aftrektal: DH, Aftrekker: DH
    // Brug: H van aftrektal < H van aftrekker
    for (let p = 0; p < 400; p++) {
      const dA = rand(2, 8), hA = rand(1, 9);
      const dB = rand(1, dA - 1), hB = rand(1, 9);
      const aftrektal = dA * 1000 + hA * 100;
      const aftrekker = dB * 1000 + hB * 100;
      if (hA >= hB) continue;  // brug nodig
      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;
      const delta1 = hA * 100;
      const delta2 = aftrekker - delta1;
      if (delta2 <= 0) continue;
      const tussensom = aftrektal - delta1;
      if (tussensom % 1000 !== 0) continue;
      return {
        a: aftrektal, b: aftrekker, verschil,
        splits: { delta1, delta2, tussensom },
        schrijflijn1: `${aftrektal} - ${delta1} = ${tussensom}`,
        schrijflijn2: `${tussensom} - ${delta2} = ${verschil}`,
        type: 'DH-DH',
      };
    }
    return null;
  }

  function maakPaar(type) {
    if (type === 'DH-H')  return maakPaarDHH();
    if (type === 'DH-DH') return maakPaarDHDH();
    return null;
  }

  function getTypes() { return ALLE_TYPES; }

  function genereer({ oefeningstypes = ['Gemengd'], aantalOefeningen = 12 } = {}) {
    const actieveTypes = oefeningstypes.includes('Gemengd')
      ? ['DH-H', 'DH-DH']
      : oefeningstypes.filter(t => ALLE_TYPES.includes(t) && t !== 'Gemengd');

    const oefeningen = [];
    const gebruikt   = new Set();
    const maxPog     = aantalOefeningen * 300;
    let pogingen     = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPog) {
      pogingen++;
      const type = actieveTypes[Math.floor(Math.random() * actieveTypes.length)];
      const paar = maakPaar(type);
      if (!paar) continue;
      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type:         paar.type,
        vraag:        `${paar.a} - ${paar.b} =`,
        antwoord:     paar.verschil,
        splits:       paar.splits,
        schrijflijn1: paar.schrijflijn1,
        schrijflijn2: paar.schrijflijn2,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();
