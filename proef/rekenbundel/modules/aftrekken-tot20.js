/* ══════════════════════════════════════════════════════════════
   modules/aftrekken-tot20.js
   Verantwoordelijkheid: rekenlogica voor aftrekken tot 5, 10, 20
   Regels:
     - Tot 5/10       : enkel E-E, geen brug mogelijk
     - Tot 20 zonder  : E-E, T-E, T-TE, TE-E, TE-T, TE-TE, Gemengd
     - Tot 20 met brug: TE-E, T-E, T-TE, Gemengd
                        T-E en T-TE: T is altijd 20
     - Brugdefinitie per type:
         E-E   : geen brug (altijd zonder)
         T-E   : GEEN brugcheck — altijd "zonder brug" BEHALVE als T=20
                 dan is het MET brug (20-7 gaat door tiental 10)
         T-TE  : zelfde als T-E: zonder brug tenzij T=20
         TE-E  : brug = eenheden aftrekker > eenheden getal (13-7: 3<7 ✓)
         TE-T  : geen brug (tiental aftrekken van tweetallig)
         TE-TE : geen brug (beide tweetallig, eenheden aftrekker ≤ eenheden getal)
     - Resultaat: altijd > 0
   ══════════════════════════════════════════════════════════════ */

const AftrekkenTot20 = (() => {

  const TYPES_PER_NIVEAU_BRUG = {
    5:  { zonder: ['E-E'],         met: [],                        gemengd: ['E-E'] },
    10: { zonder: ['E-E'],         met: [],                        gemengd: ['E-E'] },
    20: {
      zonder:  ['E-E', 'T-E', 'T-TE', 'TE-E', 'TE-T', 'TE-TE', 'Maak eerst 10', 'Gemengd'],
      met:     ['TE-E', 'T-E', 'T-TE', 'Gemengd'],
      gemengd: ['E-E', 'T-E', 'T-TE', 'TE-E', 'TE-T', 'TE-TE', 'Gemengd'],
    },
  };

  const GEMENGD_TYPES = {
    5:  ['E-E'],
    10: ['E-E'],
    20: {
      zonder:  ['E-E', 'T-E', 'T-TE', 'TE-E', 'TE-T', 'TE-TE'],
      met:     ['TE-E', 'T-E', 'T-TE'],
      gemengd: ['E-E', 'T-E', 'T-TE', 'TE-E', 'TE-T', 'TE-TE'],
    },
  };

  /* ── Hulpfuncties ────────────────────────────────────────── */
  function rand(min, max) {
    if (min > max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* ── Brugcheck per type ──────────────────────────────────── */
  // Elk type heeft eigen bruglogica!
  function heeftBrug(a, b, type) {
    switch (type) {
      case 'E-E':   return false;  // nooit brug
      case 'T-E':   return a === 20; // 20-x gaat door tiental 10
      case 'T-TE':  return a === 20; // 20-1x gaat door tiental 10
      case 'TE-E':  return (b % 10) > (a % 10); // eenheden aftrekker > eenheden getal
      case 'TE-T':  return false;  // tiental aftrekken = nooit brug
      case 'TE-TE': return false;  // beide tweetallig zonder brug
      default:      return false;
    }
  }

  /* ── Genereer één getallenpaar per type ──────────────────── */
  function maakPaar(type, niveau, metBrug) {
    const max = parseInt(niveau);

    for (let poging = 0; poging < 200; poging++) {
      let a, b;

      switch (type) {
        case 'E-E': {
  a = rand(1, Math.min(9, max));

  // Af en toe eens -0 bij tot 5 en tot 10, maar niet te vaak
  const kansNul = max <= 5 ? 0.18 : 0.08;
const metNul = max <= 10 && Math.random() < kansNul;

  if (metNul) {
    b = 0;
  } else {
    b = rand(1, a - 1);
  }
  break;
}

        case 'T-E':
          if (metBrug === 'met') {
            // Met brug: T is altijd 20
            a = 20;
            b = rand(1, 9);
          } else {
            // Zonder brug: T is 10 (want 20-x heeft brug)
            a = 10;
            b = rand(1, 9);
          }
          if (a - b <= 0) continue;
          break;

        case 'T-TE':
          // T is altijd 20, b is tweetallig (11-19)
          // Geen brugfilter: leerkracht plaatst dit type zelf bij met of zonder brug
          a = 20;
          b = rand(11, 19);
          if (a - b <= 0) continue;
          break;

        case 'TE-E':
          a = rand(11, max);
          if (a % 10 === 0) continue;
          b = rand(1, 9);
          if (a - b <= 0) continue;
          break;

        case 'TE-T':
          a = rand(11, max);
          if (a % 10 === 0) continue;
          b = rand(1, Math.floor((a - 1) / 10)) * 10;
          if (b <= 0) continue;
          break;

        case 'TE-TE':
          a = rand(12, max);
          if (a % 10 === 0) continue;
          b = rand(11, a - 1);
          if (b % 10 === 0) continue;
          break;

        default:
          // Maak eerst 10: a - b - c waarbij a - c = 10 (of 20)
          // Voorbeeld: 17 - 5 - 7 → eerst 17-7 onderstrepen → 10 - 5 = 5
          // Soms a = 20: 20 - 3 - 7 → 20-7=13, maar dat is niet "10 vormen"
          // Correcte logica: a - vriend = 10, dan 10 - b = resultaat
          if (type === 'Maak eerst 10') {
            const gebruik20 = Math.random() < 0.25;
            const a = gebruik20 ? 20 : rand(11, 19);
            const vriend = a - 10;      // bv. 17→7, 13→3
            if (vriend < 1 || vriend > 9) continue;
            // b ≠ vriend: anders is het bv. 13-3-3 en hoeft leerling niet na te denken
            const b = rand(1, 9);
            if (b === vriend) continue;  // <-- de fix
            if (10 - b <= 0) continue;
            // Volgorde: vriend soms naast a, soms niet (b in het midden)
            let t1, t2;
            if (Math.random() < 0.5) {
              // a - b - vriend (vriend staat niet naast a)
              t1 = b; t2 = vriend;
            } else {
              // a - vriend - b (vriend staat naast a)
              t1 = vriend; t2 = b;
            }
            return {
              a, b: t1, c: t2,
              verschil: 10 - b,
              type: 'Maak eerst 10',
              vriend,
              som: b,
              drieTermen: true,
            };
          }
          return null;
      }

      const verschil = a - b;
      if (verschil <= 0 || a > max) continue;

      // T-TE: geen brugfilter, altijd doorlaten
      if (type !== 'T-TE') {
        const brug = heeftBrug(a, b, type);
        if (metBrug === 'met'    && !brug) continue;
        if (metBrug === 'zonder' &&  brug) continue;
      }
      // 'gemengd' = alles door elkaar, geen filter

      return { a, b, verschil, type };
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

    let actieveTypes;
    if (oefeningstypes.includes('Gemengd')) {
      const gem = GEMENGD_TYPES[niv];
      actieveTypes = typeof gem === 'object' && !Array.isArray(gem)
        ? (gem[brug] || gem['zonder'])
        : (gem || oefeningstypes.filter(t => t !== 'Gemengd'));
    } else {
      actieveTypes = oefeningstypes;
    }

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
        ? `${paar.a}-${paar.b}-${paar.c}`
        : `${paar.a}-${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: paar.type === 'Maak eerst 10'
          ? `${paar.a} - ${paar.b} - ${paar.c} =`
          : `${paar.a} - ${paar.b} =`,
        antwoord: paar.type === 'Maak eerst 10' ? paar.verschil : paar.verschil,
        ...(paar.type === 'Maak eerst 10' ? { vriend: paar.vriend, drieTermen: true } : {}),
      });
    }
    return oefeningen;
  }

  return { getTypes, genereer, heeftBrug };
})();