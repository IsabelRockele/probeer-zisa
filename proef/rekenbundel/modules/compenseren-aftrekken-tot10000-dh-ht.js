/* ══════════════════════════════════════════════════════════════
   modules/compenseren-aftrekken-tot10000-dh-ht.js
   Compenseren aftrekken tot 10.000 — DH - HT

   Regels:
   - Aftrektal: DH (duizendtallen + honderdtallen)
   - Aftrekker: HT met tientallen 7/8/9 (wordt afgerond naar duizendtal)
   - Delta = 1000 - aftrekker (naar duizendtal)
   - Stap 1: aftrektal - (aftrekker + delta) = tussensom
   - Stap 2: tussensom + delta = antwoord

   Voorbeeld: 5600 - 970
   - delta = 30, afgerond = 1000
   - 5600 - 1000 = 4600
   - 4600 + 30 = 4630
   ══════════════════════════════════════════════════════════════ */

const CompenserenAftrekkenTot10000DhHt = (() => {

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar() {
    for (let p = 0; p < 400; p++) {
      // Aftrekker: HT met tientallen 7/8/9
      const hB = rand(1, 9);
      const tB = rand(7, 9);
      const aftrekker = hB * 100 + tB * 10;
      if (aftrekker >= 1000) continue;

      const delta = 100 - tB * 10;  // naar volgend honderdtal
      const afgerond = aftrekker + delta;  // rond honderdtal

      // Aftrektal: DH
      const dA = rand(1, 8);
      const hA = rand(1, 9);
      const aftrektal = dA * 1000 + hA * 100;

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;

      const tussensom = aftrektal - afgerond;
      if (tussensom <= 0) continue;
      const antwoord = tussensom + delta;
      if (antwoord !== verschil) continue;

      return {
        a: aftrektal, b: aftrekker, verschil,
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
        type:            'DH-HT',
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
