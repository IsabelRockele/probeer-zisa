/* ══════════════════════════════════════════════════════════════
   modules/optellen-tot100.js
   Verantwoordelijkheid: rekenlogica voor optellen tot 100
   Regels:
     - Zonder brug : T+T, T+E (ook E+T), TE+T (ook T+TE),
                     TE+E (ook E+TE), TE+TE, Gemengd
     - Met brug    : E+E, TE+E, TE+TE, Gemengd — GEEN omkering
     - Gemengd brug: alle types
     - Brug        : ENKEL eenheden vormen de brug (eA+eB >= 10)
                     Tientallen vormen NOOIT brug bij tot 100
   ══════════════════════════════════════════════════════════════ */

const OptellenTot100 = (() => {

  // Types per brugkeuze (UI-opties)
  const TYPES_PER_BRUG = {
    zonder:  ['T+T', 'T+E', 'TE+T', 'TE+E', 'TE+TE', 'Gemengd'],
    met:     ['E+E', 'TE+E', 'TE+TE', 'Gemengd'],
    gemengd: ['T+T', 'T+E', 'TE+T', 'TE+E', 'TE+TE', 'Gemengd'],
  };

  // Wat "Gemengd" echt inhoudt per brugkeuze
  const GEMENGD_TYPES = {
    zonder:  ['T+T', 'T+E', 'TE+T', 'TE+E', 'TE+TE'],
    met:     ['E+E', 'TE+E', 'TE+TE'],
    gemengd: ['T+T', 'T+E', 'TE+T', 'TE+E', 'TE+TE'],
  };

  // Types waarbij omgekeerde volgorde toegestaan is (enkel zonder brug)
  const OMKEERBAAR = new Set(['T+E', 'TE+T', 'TE+E']);

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
  function heeftBrug(a, b) {
    const eA = a % 10, eB = b % 10;
    const tA = Math.floor(a / 10), tB = Math.floor(b / 10);
    return (eA + eB) > 10 && (tA + tB) < 10;
  }

  /* ── Genereer één getallenpaar ───────────────────────────── */
  function maakPaar(type, metBrug) {
    for (let poging = 0; poging < 200; poging++) {
      let a, b;

      switch (type) {
        case 'E+E':
          a = rand(1, 9);
          b = rand(1, 9);
          break;
        case 'T+T':
          a = randTiental(10, 90);
          b = randTiental(10, 100 - a);
          break;
        case 'T+E': {
          const t = randTiental(10, 90);
          const e = rand(1, Math.min(9, 100 - t));
          // Omgekeerd toegestaan bij zonder brug
          const omgekeerd = metBrug === 'zonder' && Math.random() < 0.5;
          a = omgekeerd ? e : t;
          b = omgekeerd ? t : e;
          break;
        }
        case 'TE+T': {
          const te = rand(11, 89);
          if (te % 10 === 0) continue;
          const t = randTiental(10, 100 - te);
          // Omgekeerd toegestaan bij zonder brug
          const omgekeerd = metBrug === 'zonder' && Math.random() < 0.5;
          a = omgekeerd ? t  : te;
          b = omgekeerd ? te : t;
          break;
        }
        case 'TE+E': {
          const te = rand(11, 98);
          if (te % 10 === 0) continue;
          const e = rand(1, 9);
          // Omgekeerd toegestaan bij zonder brug
          const omgekeerd = metBrug === 'zonder' && Math.random() < 0.5;
          a = omgekeerd ? e  : te;
          b = omgekeerd ? te : e;
          break;
        }
        case 'TE+TE':
          a = rand(11, 88);
          if (a % 10 === 0) continue;
          b = rand(11, 100 - a);
          if (b % 10 === 0) continue;
          break;
        default:
          return null;
      }

      const som = a + b;
      if (!som || som > 100 || som <= 0) continue;
      if (a <= 0 || b <= 0) continue;

      const brug = heeftBrug(a, b);
      if (metBrug === 'met'    && !brug) continue;
      if (metBrug === 'zonder' &&  brug) continue;

      return { a, b, som, type };
    }
    return null;
  }

  /* ── Publieke API ────────────────────────────────────────── */
  function getTypes(niveau, brug = 'zonder') {
    return TYPES_PER_BRUG[brug] || TYPES_PER_BRUG['zonder'];
  }

  function genereer({ oefeningstypes, brug, aantalOefeningen }) {
    // "Gemengd" uitbreiden naar echte types
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

      const sleutel = `${paar.a}+${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: `${paar.a} + ${paar.b} =`,
        antwoord: paar.som,
      });
    }
    return oefeningen;
  }

  return { getTypes, genereer, heeftBrug };
})();
