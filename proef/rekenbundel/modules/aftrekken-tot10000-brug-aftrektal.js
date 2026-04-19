/* ══════════════════════════════════════════════════════════════
   modules/aftrekken-tot10000-brug-aftrektal.js
   Aftrekken tot 10.000 MET BRUG — Via aftrektal splitsen

   Strategie: splits het aftrektal in D + H
   Stap 1: haal D weg → aftrekker - D (rest van aftrekker)
   Stap 2: tel de H van het aftrektal terug op

   Voorbeeld: 3600 − 800
   - splits 3600 → 3000 + 600
   - 3000 − 800 = 2200
   - 2200 + 600 = 2800

   Brug: H van aftrektal < H van aftrekker
   ══════════════════════════════════════════════════════════════ */

const AftrekkenTot10000BrugAftrektal = (() => {

  const ALLE_TYPES = ['DH-H', 'DH-DH', 'Gemengd'];

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaarDHH() {
    for (let p = 0; p < 400; p++) {
      const dA = rand(1, 8);
      const hA = rand(1, 9);
      const aftrektal = dA * 1000 + hA * 100;

      const hB = rand(1, 9);
      const aftrekker = hB * 100;

      // Brug: H van aftrektal < H van aftrekker
      if (hA >= hB) continue;

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;

      // Splits aftrektal → D-deel + H-deel
      const dDeel = dA * 1000;   // bv. 3000
      const hDeel = hA * 100;   // bv. 600

      const tussensom = dDeel - aftrekker;  // bv. 3000 - 800 = 2200
      if (tussensom <= 0) continue;

      const eindResultaat = tussensom + hDeel;  // bv. 2200 + 600 = 2800
      if (eindResultaat !== verschil) continue;

      return {
        a: aftrektal,
        b: aftrekker,
        verschil,
        splits: { dDeel, hDeel, tussensom },
        schrijflijn1: `${dDeel} - ${aftrekker} = ${tussensom}`,
        schrijflijn2: `${tussensom} + ${hDeel} = ${eindResultaat}`,
        type: 'DH-H',
      };
    }
    return null;
  }


  function maakPaarDHDH() {
    for (let p = 0; p < 400; p++) {
      const dA = rand(2, 8), hA = rand(1, 9);
      const dB = rand(1, dA - 1), hB = rand(1, 9);
      const aftrektal = dA * 1000 + hA * 100;
      const aftrekker = dB * 1000 + hB * 100;
      if (hA >= hB) continue;
      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;
      const dDeel = dA * 1000;
      const hDeel = hA * 100;
      const tussensom = dDeel - aftrekker;
      if (tussensom <= 0) continue;
      const eindResultaat = tussensom + hDeel;
      if (eindResultaat !== verschil) continue;
      return {
        a: aftrektal, b: aftrekker, verschil,
        splits: { dDeel, hDeel, tussensom },
        schrijflijn1: `${dDeel} - ${aftrekker} = ${tussensom}`,
        schrijflijn2: `${tussensom} + ${hDeel} = ${eindResultaat}`,
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
