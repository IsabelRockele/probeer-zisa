/* ══════════════════════════════════════════════════════════════
   modules/compenseren-aftrekken-tot10000.js
   Compenseren aftrekken tot 10.000 — DH-DH

   Regels:
   - Aftrekker: honderdtallen 7/8/9 (wordt afgerond naar duizendtal)
   - Aftrektal: honderdtallen 1-6
   - Brug: H aftrektal < H aftrekker
   - Delta = 1000 - H_aftrekker * 100
   - Stap 1: aftrektal - (aftrekker + delta)
   - Stap 2: tussensom + delta = antwoord

   Voorbeeld: 8100 - 4900
   - H aftrekker = 9 → delta = 100 → afgerond = 5000
   - 8100 - 5000 = 3100
   - 3100 + 100 = 3200
   ══════════════════════════════════════════════════════════════ */

const CompenserenAftrekkenTot10000 = (() => {

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar() {
    for (let p = 0; p < 400; p++) {
      // Aftrekker: DH met honderdtallen 7/8/9
      const dB = rand(1, 8);
      const hB = rand(7, 9);
      const aftrekker = dB * 1000 + hB * 100;

      // Aftrektal: DH met honderdtallen 1-6
      const hA = rand(1, 6);
      // Brug: hA < hB
      if (hA >= hB) continue;
      // Duizendtallen van aftrektal > duizendtallen van aftrekker
      const dA = rand(dB + 1, 9);
      const aftrektal = dA * 1000 + hA * 100;

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;

      // Delta: aftrekker naar volgend duizendtal
      const delta = 1000 - hB * 100;
      const afgerond = aftrekker + delta;  // rond duizendtal

      const tussensom = aftrektal - afgerond;
      if (tussensom <= 0) continue;

      const antwoord = tussensom + delta;
      if (antwoord !== verschil) continue;

      return {
        a: aftrektal,
        b: aftrekker,
        verschil,
        compenseerGetal:  aftrekker,
        andereGetal:      aftrektal,
        tiental:          afgerond,
        compenseerDelta:  delta,
        tussenResultaat:  tussensom,
        schrijflijn1: `${aftrektal} - ${afgerond} = ${tussensom}`,
        schrijflijn2: `${tussensom} + ${delta} = ${antwoord}`,
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
        type:            'DH-DH',
        vraag:           `${paar.a} - ${paar.b} =`,
        antwoord:        paar.verschil,
        compenseerGetal: paar.compenseerGetal,
        andereGetal:     paar.andereGetal,
        tiental:         paar.tiental,
        compenseerDelta: paar.compenseerDelta,
        tussenResultaat: paar.tussenResultaat,
        schrijflijn1:    paar.schrijflijn1,
        schrijflijn2:    paar.schrijflijn2,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();
