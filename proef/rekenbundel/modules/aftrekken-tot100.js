/* ══════════════════════════════════════════════════════════════
   modules/aftrekken-tot100.js
   Verantwoordelijkheid: rekenlogica voor aftrekken tot 100
   Regels:
     - Zonder brug : T-T, T-E, T-TE, TE-T, TE-E, TE-TE, Gemengd
     - Met brug    : TE-E, TE-TE, T-E, T-TE, Gemengd
     - T-E en T-TE : geen brugfilter (school kiest zelf)
     - Brugdefinitie:
         TE-E  : eenheden aftrekker > eenheden getal (43-7: 3<7 ✓)
         TE-TE : eenheden aftrekker > eenheden getal (43-27: 3<7 ✓)
         T-T   : nooit brug
         T-E   : geen filter
         T-TE  : geen filter
         TE-T  : nooit brug
     - Tientallen vormen NOOIT brug bij tot 100
     - Resultaat: altijd > 0
   ══════════════════════════════════════════════════════════════ */

const AftrekkenTot100 = (() => {

  const TYPES_PER_BRUG = {
    zonder:  ['T-T', 'T-E', 'T-TE', 'TE-T', 'TE-E', 'TE-TE', 'Gemengd'],
    met:     ['TE-E', 'TE-TE', 'T-E', 'T-TE', 'Gemengd'],
    gemengd: ['T-T', 'T-E', 'T-TE', 'TE-T', 'TE-E', 'TE-TE', 'Gemengd'],
  };

  const GEMENGD_TYPES = {
    zonder:  ['T-T', 'T-E', 'T-TE', 'TE-T', 'TE-E', 'TE-TE'],
    met:     ['TE-E', 'TE-TE', 'T-E', 'T-TE'],
    gemengd: ['T-T', 'T-E', 'T-TE', 'TE-T', 'TE-E', 'TE-TE'],
  };

  // Types zonder brugfilter (school beslist zelf)
  const GEEN_BRUGFILTER = new Set(['T-E', 'T-TE']);

  /* ── Hulpfuncties ────────────────────────────────────────── */
  function rand(min, max) {
    if (min > max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randTiental(min, max) {
    const tMin = Math.ceil(min / 10);
    const tMax = Math.floor(max / 10);
    if (tMin > tMax) return min;
    return rand(tMin, tMax) * 10;
  }

  /* ── Brugcheck ───────────────────────────────────────────── */
  function heeftBrug(a, b, type) {
    switch (type) {
      case 'T-T':   return false;
      case 'T-E':   return false; // geen filter, altijd doorlaten
      case 'T-TE':  return false; // geen filter, altijd doorlaten
      case 'TE-T':  return false;
      case 'TE-E':  return (b % 10) > (a % 10);
      case 'TE-TE': return (b % 10) > (a % 10);
      default:      return false;
    }
  }

  /* ── Genereer één getallenpaar per type ──────────────────── */
  function maakPaar(type, metBrug) {
    for (let poging = 0; poging < 200; poging++) {
      let a, b;

      switch (type) {
        case 'T-T':
          // 100 mag ook als a (bv. 100-30, 100-60)
          a = randTiental(20, 100);
          b = randTiental(10, a - 10);
          break;

        case 'T-E':
          // 100 mag ook als a (bv. 100-7)
          a = randTiental(10, 100);
          b = rand(1, 9);
          if (a - b <= 0) continue;
          break;

        case 'T-TE':
          // 100 mag ook als a (bv. 100-23, 100-47)
          a = randTiental(20, 100);
          b = rand(11, a - 1);
          if (b % 10 === 0) continue;
          break;

        case 'TE-T':
          a = rand(11, 99);
          if (a % 10 === 0) continue;
          b = randTiental(10, Math.floor(a / 10) * 10);
          if (b <= 0 || b >= a) continue;
          break;

        case 'TE-E':
          a = rand(11, 99);
          if (a % 10 === 0) continue;
          b = rand(1, 9);
          if (a - b <= 0) continue;
          break;

        case 'TE-TE':
          a = rand(12, 99);
          if (a % 10 === 0) continue;
          b = rand(11, a - 1);
          if (b % 10 === 0) continue;
          break;

        default:
          return null;
      }

      const verschil = a - b;
      if (verschil <= 0 || verschil >= 100) continue;
      if (a <= 0 || b <= 0 || a > 100) continue;

      // Geen brugfilter voor T-E en T-TE
      if (!GEEN_BRUGFILTER.has(type)) {
        const brug = heeftBrug(a, b, type);
        if (metBrug === 'met'    && !brug) continue;
        if (metBrug === 'zonder' &&  brug) continue;
      }

      return { a, b, verschil, type };
    }
    return null;
  }

  /* ── Publieke API ────────────────────────────────────────── */
  function getTypes(niveau, brug = 'zonder') {
    return TYPES_PER_BRUG[brug] || TYPES_PER_BRUG['zonder'];
  }

  function genereer({ oefeningstypes, brug, aantalOefeningen }) {
    let actieveTypes = oefeningstypes.includes('Gemengd')
      ? (GEMENGD_TYPES[brug] || GEMENGD_TYPES['zonder'])
      : oefeningstypes;

    const oefeningen = [];
    const gebruikteSleutels = new Set();
    const maxPogingen = aantalOefeningen * 60;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = actieveTypes[Math.floor(Math.random() * actieveTypes.length)];
      const paar = maakPaar(type, brug);
      if (!paar) continue;

      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: `${paar.a} - ${paar.b} =`,
        antwoord: paar.verschil,
      });
    }
    return oefeningen;
  }

  return { getTypes, genereer, heeftBrug };
})();
