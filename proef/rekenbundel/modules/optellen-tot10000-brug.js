/* ══════════════════════════════════════════════════════════════
   modules/optellen-tot10000-brug.js
   Optellen tot 10.000 MET BRUG via splitsen

   Les 11 — brug via H+H (H-kolommen samen ≥ 10):
     H+H   : bv. 900 + 200 = 1100  (splits 200 → 100+100)
     DH+H  : bv. 1800 + 400 = 2200 (splits 400 → 200+200)
     DH+DH : bv. 2600 + 900 = 3500 (splits 900 → 400+500)

   Les 12 — brug via HT+HT (T-kolommen samen ≥ 10, H-kolommen samen ≥ 10):
     HT+HT : bv. 930 + 740 = 1670  (splits 740 → 700+40)

   Brugdefinitie:
   - brugD = h1+h2 >= 10  (honderden samen kruisen duizendtal)
   - brugH = t1+t2 >= 10  (tientallen samen kruisen honderdtal) — enkel les 12
   - som < 10000

   Splitsing altijd van het tweede getal (b):
   - Les 11 H+H  : b → (aanvulH) + (rest)  zodat a+aanvulH = rond duizendtal
   - Les 11 DH+H : zelfde
   - Les 12 HT+HT: b → (bH) + (bT)  zodat a+bH kruist duizendtal
   ══════════════════════════════════════════════════════════════ */

const OptellenTot10000Brug = (() => {

  const ALLE_TYPES = ['H+H', 'DH+H', 'DH+DH', 'HT+HT → honderdtal (bv. 750+180)', 'HT+HT → duizendtal (bv. 730+520)', 'HT+HT → gemengd', 'Gemengd'];

  const TYPES_PER_BRUG = {
    'naar-duizendtal': ['H+H', 'DH+H', 'DH+DH', 'HT+HT', 'Gemengd'],
    'beide':           ['H+H', 'DH+H', 'DH+DH', 'HT+HT', 'Gemengd'],
    'met':             ['H+H', 'DH+H', 'DH+DH', 'HT+HT', 'Gemengd'],
  };

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Brug via H: h1+h2 >= 10 (kruist duizendtal)
  function brugViaH(a, b) {
    const h1 = Math.floor(a / 100) % 10;
    const h2 = Math.floor(b / 100) % 10;
    return (h1 + h2) >= 10;
  }

  // Brug via T: t1+t2 >= 10 (kruist honderdtal)
  function brugViaT(a, b) {
    const t1 = Math.floor(a / 10) % 10;
    const t2 = Math.floor(b / 10) % 10;
    return (t1 + t2) >= 10;
  }

  // Geen brug in E-kolom
  function geenBrugE(a, b) {
    return (a % 10) + (b % 10) < 10;
  }

  // Bereken splitsing van b zodat a + eerste deel = rond duizendtal
  function berekenSplitsing(a, b) {
    const volgendD = Math.ceil((a + 1) / 1000) * 1000;
    const aanvul   = volgendD - a;
    if (aanvul <= 0 || aanvul >= b) return null;
    const rest = b - aanvul;
    if (rest <= 0) return null;
    return { aanvul, rest, tussensom: volgendD };
  }

  function maakPaarHH(typeVariant) {
    // typeVariant: 'H+H', 'DH+H', 'DH+DH'
    for (let p = 0; p < 400; p++) {
      let a, b;

      if (typeVariant === 'H+H') {
        // a = veelvoud van 100 (H), geen duizendtallen
        const hA = rand(1, 9);
        a = hA * 100;
        // b = veelvoud van 100, h1+h2 >= 10
        const hB = rand(Math.max(1, 10 - hA), 9);
        b = hB * 100;
        if (a + b >= 10000) continue;
        if (!brugViaH(a, b)) continue;

      } else if (typeVariant === 'DH+H') {
        // a = DH (duizendtallen + honderden, geen tientallen/eenheden)
        const dA = rand(1, 8);
        const hA = rand(1, 9);
        a = dA * 1000 + hA * 100;
        // b = H alleen
        const hB = rand(Math.max(1, 10 - hA), 9);
        b = hB * 100;
        if (a + b >= 10000) continue;
        if (!brugViaH(a, b)) continue;

      } else if (typeVariant === 'DH+DH') {
        // a = DH, b = DH, h1+h2 >= 10
        const dA = rand(1, 7);
        const hA = rand(1, 9);
        a = dA * 1000 + hA * 100;
        const hB = rand(Math.max(1, 10 - hA), 9);
        const dB = rand(1, 8 - dA);
        if (dB <= 0) continue;
        b = dB * 1000 + hB * 100;
        if (a + b >= 10000) continue;
        if (!brugViaH(a, b)) continue;
      }

      const som = a + b;
      if (!som || som >= 10000 || som <= 0) continue;

      // Bereken splitsing
      const splits = berekenSplitsing(a, b);
      if (!splits) continue;

      return {
        a, b, som,
        type: typeVariant,
        splits,
        schrijflijn1: `${a} + ${splits.aanvul} = ${splits.tussensom}`,
        schrijflijn2: `${splits.tussensom} + ${splits.rest} = ${som}`,
      };
    }
    return null;
  }

  function maakPaarHTHT(brugType = 'beide') {
    for (let p = 0; p < 400; p++) {
      // a = HT (geen eenheden), b = HT (geen eenheden)
      const hA = rand(1, 9);
      const tA = rand(1, 9);
      const hB = rand(1, 9);
      const tB = rand(1, 9);
      const a = hA * 100 + tA * 10;
      const b = hB * 100 + tB * 10;

      if (a + b >= 10000) continue;

      const heeftBrugT = brugViaT(a, b);          // T-kolommen samen ≥ 10 → kruist honderdtal
      const kruistDuizendtal = (a + b) >= 1000;   // som kruist duizendtal

      // Altijd minstens één brug nodig
      if (!heeftBrugT && !kruistDuizendtal) continue;

      // Filter op gewenst brugtype
      if (brugType === '→honderdtal' && (!heeftBrugT || kruistDuizendtal)) continue;  // T-brug maar som < 1000
      if (brugType === '→duizendtal' && (!kruistDuizendtal || heeftBrugT)) continue;  // som ≥ 1000, geen T-brug
      if (brugType === 'beide' && !kruistDuizendtal) continue;                        // standaard les 12: kruist duizendtal

      const som = a + b;

      // Splits b in bH (veelvoud van 100) en bT (tientallen)
      const bH = hB * 100;
      const bT = tB * 10;
      const tussensom = a + bH;
      if (tussensom >= 10000) continue;

      return {
        a, b, som,
        type: 'HT+HT',
        splits: { aanvul: bH, rest: bT, tussensom },
        schrijflijn1: `${a} + ${bH} = ${tussensom}`,
        schrijflijn2: `${tussensom} + ${bT} = ${som}`,
      };
    }
    return null;
  }

  function maakPaar(type) {
    if (type === 'H+H')           return maakPaarHH('H+H');
    if (type === 'DH+H')          return maakPaarHH('DH+H');
    if (type === 'DH+DH')         return maakPaarHH('DH+DH');
    if (type === 'HT+HT → honderdtal (bv. 750+180)')    return maakPaarHTHT('→honderdtal');
    if (type === 'HT+HT → duizendtal (bv. 730+520)')    return maakPaarHTHT('→duizendtal');
    if (type === 'HT+HT → gemengd') return maakPaarHTHT('beide');
    return null;
  }

  function getTypes(niveau, brug = 'naar-duizendtal') {
    return ['H+H', 'DH+H', 'DH+DH', 'HT+HT → honderdtal (bv. 750+180)', 'HT+HT → duizendtal (bv. 730+520)', 'HT+HT → gemengd', 'Gemengd'];
  }

  function genereer({ oefeningstypes = ['Gemengd'], brug = 'naar-duizendtal', aantalOefeningen = 12 } = {}) {
    let actieveTypes = oefeningstypes.includes('Gemengd')
      ? ['H+H', 'DH+H', 'DH+DH', 'HT+HT → gemengd']
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
      const sleutel = `${paar.a}+${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type:         paar.type,
        vraag:        `${paar.a} + ${paar.b} =`,
        antwoord:     paar.som,
        splits:       paar.splits,
        schrijflijn1: paar.schrijflijn1,
        schrijflijn2: paar.schrijflijn2,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();