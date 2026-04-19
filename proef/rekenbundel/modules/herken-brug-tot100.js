/* ══════════════════════════════════════════════════════════════
   modules/herken-brug-tot100.js
   Verantwoordelijkheid: "Herken de brugoefening" tot 100
   - Oefeningen zijn GEMENGD: willekeurig met én zonder brug
   - Leerkracht kiest welke types (TE+E, TE+TE, TE-E, TE-TE)
   - Elke oefening krijgt markering: heeftBrug: true/false
   - PDF tekent lampje boven elke oefening
   ══════════════════════════════════════════════════════════════ */

const HerkenBrugTot100 = (() => {

  // Beschikbare types (optellen én aftrekken)
  const TYPES = ['TE+E', 'TE+TE', 'TE-E', 'TE-TE'];

  /* ── Hulpfuncties ────────────────────────────────────────── */
  function rand(min, max) {
    if (min > max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* ── Brugcheck ───────────────────────────────────────────── */
  function checkBrug(a, b) {
    const eA = a % 10, eB = b % 10;
    const tA = Math.floor(a / 10), tB = Math.floor(b / 10);
    return (eA + eB) >= 10 && (tA + tB) < 10;
  }
  function checkBrugAftrek(a, b) {
    return (b % 10) > (a % 10);
  }

  /* ── Genereer één paar, willekeurig met of zonder brug ───── */
  function maakPaar(type) {
    for (let poging = 0; poging < 300; poging++) {
      let a, b, som, brug;

      switch (type) {
        case 'TE+E':
          a = rand(11, 98);
          if (a % 10 === 0) continue;
          b = rand(1, 9);
          som = a + b;
          if (som > 100) continue;
          brug = checkBrug(a, b);
          return { a, b, som, type, brug, vraag: `${a} + ${b} =` };

        case 'TE+TE':
          a = rand(11, 88);
          if (a % 10 === 0) continue;
          b = rand(11, 100 - a);
          if (b % 10 === 0) continue;
          som = a + b;
          if (som > 100) continue;
          brug = checkBrug(a, b);
          return { a, b, som, type, brug, vraag: `${a} + ${b} =` };

        case 'TE-E':
          a = rand(11, 99);
          if (a % 10 === 0) continue;
          b = rand(1, 9);
          if (a - b <= 0) continue;
          brug = checkBrugAftrek(a, b);
          return { a, b, som: a - b, type, brug, vraag: `${a} - ${b} =` };

        case 'TE-TE':
          a = rand(12, 99);
          if (a % 10 === 0) continue;
          b = rand(11, a - 1);
          if (b % 10 === 0) continue;
          brug = checkBrugAftrek(a, b);
          return { a, b, som: a - b, type, brug, vraag: `${a} - ${b} =` };

        default:
          return null;
      }
    }
    return null;
  }

  /* ── Publieke API ────────────────────────────────────────── */
  function getTypes() {
    return TYPES;
  }

  function genereer({ oefeningstypes, aantalOefeningen }) {
    const oefeningen = [];
    const gebruikteSleutels = new Set();
    const maxPogingen = aantalOefeningen * 60;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = oefeningstypes[Math.floor(Math.random() * oefeningstypes.length)];
      const paar = maakPaar(type);
      if (!paar) continue;

      const sleutel = paar.vraag;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: paar.vraag,
        antwoord: paar.som,
        heeftBrug: paar.brug,  // voor de antwoordsleutel (niet zichtbaar voor kind)
      });
    }
    return oefeningen;
  }

  return { getTypes, genereer };
})();
