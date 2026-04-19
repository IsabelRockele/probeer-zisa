/* ══════════════════════════════════════════════════════════════
   modules/transformeren-optellen-tot10000.js
   Transformeren optellen tot 10.000 — HT+HT

   Regels:
   - Transformeerterm (tg): tientallen 7/8/9, geen eenheden (HT)
   - Andere term (ag): tientallen 1-6, geen eenheden (HT)
   - Brug: tientallen samen strikt > 10
   - Delta: 100 - (tTg × 10) → tg naar volgend honderdtal
   - tgT = tg + d  (groter)
   - agT = ag - d  (kleiner)
   - Som < 10.000

   Voorbeeld: 590 + 270
   - tg=270, tTg=7, d=30 → tgT=300, agT=560
   - 590 + 270 = 560 + 300 = 850
   ══════════════════════════════════════════════════════════════ */

const TransformerenOptellenTot10000 = (() => {

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar() {
    for (let p = 0; p < 400; p++) {
      const hTg = rand(1,9), tTg = rand(7,9);
      const hAg = rand(1,9), tAg = rand(1,6);
      const tg = hTg*100 + tTg*10;
      const ag = hAg*100 + tAg*10;

      if (tTg + tAg <= 10) continue;  // brug strikt > 10

      const d   = 100 - tTg*10;       // delta naar volgend honderdtal
      const tgT = tg + d;
      const agT = ag - d;

      if (agT <= 0) continue;
      if (agT % 10 !== 0) continue;
      const som = tg + ag;
      if (som >= 10000 || som <= 0) continue;
      if (tgT + agT !== som) continue;

      const [a, b] = Math.random() < 0.5 ? [tg, ag] : [ag, tg];
      return {
        a, b, som,
        transformeerGetal: tg,
        andereGetal:       ag,
        transformeerDelta: d,
        antwoord:          som,
      };
    }
    return null;
  }

  function getTypes() { return ['HT+HT']; }

  function genereer({ aantalOefeningen = 12 } = {}) {
    const oefeningen = [];
    const gebruikt   = new Set();
    const maxPog     = aantalOefeningen * 300;
    let pogingen     = 0;
    while (oefeningen.length < aantalOefeningen && pogingen < maxPog) {
      pogingen++;
      const paar = maakPaar();
      if (!paar) continue;
      const sleutel = `${paar.a}+${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type:              'HT+HT',
        vraag:             `${paar.a} + ${paar.b} =`,
        antwoord:          paar.som,
        transformeerGetal: paar.transformeerGetal,
        andereGetal:       paar.andereGetal,
        transformeerDelta: paar.transformeerDelta,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();
