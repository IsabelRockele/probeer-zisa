/* ══════════════════════════════════════════════════════════════
   modules/transformeren-aftrekken-tot10000.js
   Transformeren aftrekken tot 10.000 — DH-DH

   Regels:
   - Beide termen: DH (geen tientallen/eenheden)
   - Brug: H aftrektal < H aftrekker
   - Transformeerterm = term met hoogste honderdtallen
     (= de aftrekker, want H aftrekker > H aftrektal)
   - Delta = 1000 - H_aftrekker * 100
   - Aftrektal - delta (kleiner), Aftrekker + delta (naar duizendtal)
   - Beide resultaten zijn ronde duizendtallen of DH-getallen

   Voorbeeld: 8100 - 5800
   - H aftrekker = 8 → delta = 200
   - 8100 - 200 = 7900, 5800 + 200 = 6000
   - 7900 - 6000 = 1900
   ══════════════════════════════════════════════════════════════ */

const TransformerenAftrekkenTot10000 = (() => {

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar() {
    for (let p = 0; p < 400; p++) {
      // Aftrekker: DH, honderdtallen 2-9 (zodat hA = hB-1 minstens 1 kan zijn)
      const dB = rand(1, 7);
      const hB = rand(2, 9);
      const aftrekker = dB * 1000 + hB * 100;

      // Aftrektal: DH, H aftrektal < H aftrekker (brug)
      const hA = rand(1, hB - 1);
      const dA = rand(dB + 1, 8);
      const aftrektal = dA * 1000 + hA * 100;

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;

      // Delta: aftrekker naar volgend duizendtal
      const delta = 1000 - hB * 100;
      if (delta <= 0 || delta >= 1000) continue;

      // Bij aftrekken: BEIDE termen + delta → verschil blijft bewaard
      // (at + d) - (ab + d) = at - ab = verschil ✓
      const aftrektalT  = aftrektal + delta;
      const aftrekkerT  = aftrekker + delta;

      if (aftrekkerT % 1000 !== 0) continue;
      if (aftrektalT >= 10000) continue;
      if (aftrektalT - aftrekkerT !== verschil) continue;
      if (aftrektalT <= aftrekkerT) continue;

      const resultaat = aftrektalT - aftrekkerT;
      return {
        a: aftrektal, b: aftrekker, verschil,
        transformeerGetal: aftrekker,
        andereGetal:       aftrektal,
        transformeerDelta: delta,
        antwoord:          verschil,
        schrijflijn1: `${aftrektalT} - ${aftrekkerT} = ${resultaat}`,
      };
    }
    return null;
  }

  function getTypes() { return ['DH-DH']; }

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
        type:              'DH-DH',
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
