/* ══════════════════════════════════════════════════════════════
   modules/optellen-tot20.js
   Verantwoordelijkheid: rekenlogica voor optellen tot 5, 10, 20
   Regels:
     - Tot 5/10  : enkel E+E, geen brug mogelijk
     - Tot 20    : E+E, T+E, TE+E (incl. omgekeerd E+TE)
     - Gemengd   : alle beschikbare types door elkaar
     - Brug      : eenheden samen > 10 (bv. 8+5)
     - Resultaat mag exact 20 zijn
   ══════════════════════════════════════════════════════════════ */

const OptellenTot20 = (() => {

  // Types per niveau én per brugkeuze
  // 'Gemengd' = alle beschikbare types door elkaar (UI-optie, geen echt type)
  const TYPES_PER_NIVEAU_BRUG = {
    5:  { zonder: ['E+E'],                     met: [],              gemengd: ['E+E'] },
    10: { zonder: ['E+E'],                     met: [],              gemengd: ['E+E'] },
    20: { zonder: ['E+E', 'T+E', 'TE+E', 'Maak eerst 10', 'Gemengd'], met: ['E+E'], gemengd: ['E+E', 'T+E', 'TE+E', 'Gemengd'] },
  };

  // Wat "Gemengd" echt inhoudt per niveau
  const GEMENGD_TYPES = {
    5:  ['E+E'],
    10: ['E+E'],
    20: ['E+E', 'T+E', 'TE+E'],
  };

  /* ── Hulpfuncties ────────────────────────────────────────── */
  function rand(min, max) {
    if (min > max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* ── Brugcheck ───────────────────────────────────────────── */
  function heeftBrug(a, b, niveau) {
    const niv = parseInt(niveau);
    if (niv <= 10) return false;
    return (a % 10 + b % 10) > 10;
  }

  /* ── Genereer één getallenpaar per type ──────────────────── */
  function maakPaar(type, niveau, metBrug) {
    const max = parseInt(niveau);
    let a, b;

    for (let poging = 0; poging < 200; poging++) {
      switch (type) {

    case 'E+E': {
  // Af en toe eens +0 bij tot 5 en tot 10, maar niet te vaak
 const kansNul = max <= 5 ? 0.18 : 0.08;
const metNul = max <= 10 && Math.random() < kansNul;

  if (metNul) {
    const waarde = rand(1, Math.min(9, max));
    if (Math.random() < 0.5) {
      a = waarde;
      b = 0;
    } else {
      a = 0;
      b = waarde;
    }
  } else {
    a = rand(1, Math.min(9, max - 1));
    b = rand(1, Math.min(9, max - a));
  }
  break;
}

        case 'T+E': {
          // 50% kans op omgekeerde volgorde: E+T
          const omgekeerd = Math.random() < 0.5;
          const t = 10;
          const e = rand(1, Math.min(9, max - t));
          a = omgekeerd ? e : t;
          b = omgekeerd ? t : e;
          break;
        }

        case 'TE+E': {
          // 50% kans op omgekeerde volgorde: E+TE
          const omgekeerd = Math.random() < 0.5;
          const te = rand(11, max - 1);
          if (te % 10 === 0) continue;
          const e = rand(1, Math.min(9, max - te));
          a = omgekeerd ? e  : te;
          b = omgekeerd ? te : e;
          break;
        }

        case 'Maak eerst 10': {
          // Drie termen: a + b + c waarbij twee van de drie samen exact 10 vormen
          // e1 ≠ e2: geen 5+5, 1+9 mag maar 5+5 niet — leerling moet echt nadenken
          const e1 = rand(1, 8);         // 1–8 zodat e2 = 10-e1 altijd ≠ e1
          const e2 = 10 - e1;
          if (e1 === e2) continue;       // vangnet voor e1=5
          const extra = rand(1, 9);   // geen 10: er mag geen 10 in de som staan
          if (e1 === 10 || e2 === 10) continue;  // vangnet
          if (extra === e1 || extra === e2) continue;  // geen 7+3+3 of 6+4+4
          if (e1 + e2 + extra > 20) continue;
          // Bepaal volgorde: 50% naast elkaar, 50% niet (extra in het midden)
          const positie = Math.random();
          let t1, t2, t3;
          if (positie < 0.5) {
            // vrienden naast elkaar: e1 + e2 + extra  óf  extra + e1 + e2
            if (Math.random() < 0.5) { t1 = e1; t2 = e2; t3 = extra; }
            else                      { t1 = extra; t2 = e1; t3 = e2; }
          } else {
            // extra in het midden: e1 + extra + e2
            t1 = e1; t2 = extra; t3 = e2;
          }
          return {
            a: t1, b: t2, c: t3,
            som: t1 + t2 + t3,
            type: 'Maak eerst 10',
            vriend1: e1, vriend2: e2,
          };
        }

        default:
          return null;
      }

      if (a === undefined || b === undefined) continue;
      const som = a + b;
      if (som <= 0 || som > max) continue;
      if (a < 0 || b < 0) continue;

      const brug = heeftBrug(a, b, niveau);
      if (metBrug === 'met'    && !brug) continue;
      if (metBrug === 'zonder' &&  brug) continue;

      return { a, b, som, type };
    }
    return null;
  }

  /* ── Publieke API ────────────────────────────────────────── */
  function getTypes(niveau, brug = 'zonder') {
    const niv = parseInt(niveau);
    const config = TYPES_PER_NIVEAU_BRUG[niv];
    if (!config) return [];
    return config[brug] || config['zonder'] || [];
  }

  function genereer({ niveau, oefeningstypes, brug, aantalOefeningen }) {
    const niv = parseInt(niveau);

    // "Gemengd" uitbreiden naar echte types
    let actieveTypes = oefeningstypes.includes('Gemengd')
      ? (GEMENGD_TYPES[niv] || oefeningstypes.filter(t => t !== 'Gemengd'))
      : oefeningstypes;

    const oefeningen = [];
    const gebruikteSleutels = new Set();
    const maxPogingen = aantalOefeningen * 60;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = actieveTypes[Math.floor(Math.random() * actieveTypes.length)];
      const paar = maakPaar(type, niv, brug);
      if (!paar) continue;

      const sleutel = paar.type === 'Maak eerst 10'
        ? `${paar.a}+${paar.b}+${paar.c}`
        : `${paar.a}+${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: paar.type === 'Maak eerst 10'
          ? `${paar.a} + ${paar.b} + ${paar.c} =`
          : `${paar.a} + ${paar.b} =`,
        antwoord: paar.type === 'Maak eerst 10' ? paar.som : paar.som,
        // Extra info voor Maak eerst 10
        ...(paar.type === 'Maak eerst 10' ? { vriend1: paar.vriend1, vriend2: paar.vriend2, drieTermen: true } : {}),
      });
    }
    return oefeningen;
  }

  return { getTypes, genereer, heeftBrug };
})();