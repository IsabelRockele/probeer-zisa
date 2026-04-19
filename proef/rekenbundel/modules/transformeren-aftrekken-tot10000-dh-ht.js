/* ══════════════════════════════════════════════════════════════
   modules/transformeren-aftrekken-tot10000-dh-ht.js
   Transformeren aftrekken tot 10.000 — DH - HT

   Regels:
   - Aftrektal: DH (duizendtallen + honderdtallen)
   - Aftrekker: HT met tientallen 6/7/8/9 (wordt getransformeerd)
   - Delta = 1000 - aftrekker
   - Beide termen + delta: aftrektal + delta, aftrekker + delta (= 1000)
   - Verschil blijft bewaard

   Voorbeeld: 5400 - 980
   - delta = 20
   - 5400 + 20 = 5420, 980 + 20 = 1000
   - 5420 - 1000 = 4420
   ══════════════════════════════════════════════════════════════ */

const TransformerenAftrekkenTot10000DhHt = (() => {

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar() {
    for (let p = 0; p < 400; p++) {
      // Aftrekker: HT met tientallen 6/7/8/9
      const hB = rand(1, 9);
      const tB = rand(6, 9);
      const aftrekker = hB * 100 + tB * 10;
      if (aftrekker >= 1000) continue;

      const delta = 100 - tB * 10;  // naar volgend honderdtal
      if (delta <= 0) continue;

      // Aftrektal: DH
      const dA = rand(1, 8);
      const hA = rand(1, 9);
      const aftrektal = dA * 1000 + hA * 100;

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;

      const aftrektalT = aftrektal + delta;
      const aftrekkerT = aftrekker + delta;  // rond honderdtal
      if (aftrekkerT % 100 !== 0) continue;
      if (aftrektalT >= 10000) continue;
      if (aftrektalT - aftrekkerT !== verschil) continue;

      return {
        a: aftrektal, b: aftrekker, verschil,
        transformeerGetal: aftrekker,
        andereGetal:       aftrektal,
        transformeerDelta: delta,
        schrijflijn1: `${aftrektalT} - ${aftrekkerT} = ${verschil}`,
      };
    }
    return null;
  }

  function getTypes() { return ['DH-HT']; }

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
        type:              'DH-HT',
        vraag:             `${paar.a} - ${paar.b} =`,
        antwoord:          paar.verschil,
        transformeerGetal: paar.transformeerGetal,
        andereGetal:       paar.andereGetal,
        transformeerDelta: paar.transformeerDelta,
        schrijflijn1:      paar.schrijflijn1,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();
