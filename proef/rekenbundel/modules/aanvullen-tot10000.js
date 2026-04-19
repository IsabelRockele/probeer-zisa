/* ══════════════════════════════════════════════════════════════
   modules/aanvullen-tot10000.js
   Aanvullen tot 10.000 — DH-DH (altijd brug)

   Regels:
   - Aftrekker: DH met honderdtallen 7/8/9
   - Aftrektal: DH, duizendtallen = aftrekker D + 1
   - Brug: H aftrektal < H aftrekker
   - Verschil altijd ≤ 600 (max 1 duizendtal verschil)

   Voorbeeld: 9200 - 8800 = 400
              5300 - 4700 = 600
   ══════════════════════════════════════════════════════════════ */

const AanvullenTot10000 = (() => {

  const ALLE_TYPES = ['DH-DH'];

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar() {
    for (let p = 0; p < 400; p++) {
      // Aftrekker: honderdtallen 7/8/9
      const hB = rand(7, 9);
      const dB = rand(1, 8);
      const aftrekker = dB * 1000 + hB * 100;

      // Aftrektal: duizendtallen = dB + 1 (zodat verschil klein blijft)
      const dA = dB + 1;
      if (dA > 9) continue;

      // honderdtallen zodat verschil ≤ 600
      // verschil = 1000 + (hA - hB) * 100 ≤ 600 → hA ≤ hB - 4
      const hAMax = hB - 4;
      if (hAMax < 1) continue;
      const hA = rand(1, hAMax);

      const aftrektal = dA * 1000 + hA * 100;
      const verschil = aftrektal - aftrekker;
      if (verschil <= 0 || verschil > 600) continue;

      return { a: aftrektal, b: aftrekker, verschil, type: 'DH-DH' };
    }
    return null;
  }

  function getTypes() { return ALLE_TYPES; }

  function genereer({ aantalOefeningen = 12 } = {}) {
    const oefeningen = [];
    const gebruikt   = new Set();
    const maxPog     = aantalOefeningen * 300;
    let pogingen     = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPog) {
      pogingen++;
      const paar = maakPaar();
      if (!paar) continue;
      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type:     paar.type,
        vraag:    `${paar.a} - ${paar.b} =`,
        antwoord: paar.verschil,
        groot:    paar.a,
        klein:    paar.b,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();