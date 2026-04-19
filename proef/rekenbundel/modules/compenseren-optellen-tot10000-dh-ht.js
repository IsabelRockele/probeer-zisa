/* ══════════════════════════════════════════════════════════════
   modules/compenseren-optellen-tot10000-dh-ht.js
   Compenseren optellen tot 10.000 — DH + HT

   Regels:
   - DH-term: duizendtallen 1-8, honderdtallen 1-9, geen tientallen
   - HT-term: honderdtallen 1-9, tientallen 7/8/9 (wordt gecompenseerd)
   - Delta = 100 - T_HT * 10 (HT naar volgend honderdtal)
   - Stap 1: DH + (HT + delta) = tussensom
   - Stap 2: tussensom - delta = antwoord

   Voorbeeld: 3700 + 690
   - T_HT = 9 → delta = 10
   - 3700 + 700 = 4400
   - 4400 - 10 = 4390
   ══════════════════════════════════════════════════════════════ */

const CompenserenOptellenTot10000DhHt = (() => {

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar() {
    for (let p = 0; p < 400; p++) {
      // DH-term: geen tientallen
      const dA = rand(1, 8);
      const hA = rand(1, 9);
      const dh = dA * 1000 + hA * 100;

      // HT-term: tientallen 7/8/9
      const tB = rand(7, 9);
      const hB = rand(1, 9);
      const ht = hB * 100 + tB * 10;
      if (ht >= 1000) continue;

      const som = dh + ht;
      if (som >= 10000) continue;

      // Brug: honderdtallen samen ≥ 10 (brug naar duizendtal)
      const hDH = Math.floor((dh % 1000) / 100);
      const hHT = Math.floor(ht / 100);
      if (hDH + hHT < 10) continue;

      const delta = 100 - tB * 10;
      const afgerond = ht + delta;  // rond honderdtal
      const tussensom = dh + afgerond;
      if (tussensom !== som + delta) continue;
      const antwoord = tussensom - delta;
      if (antwoord !== som) continue;

      // Random volgorde: DH+HT of HT+DH
      const wissel = Math.random() < 0.5;
      const [a, b] = wissel ? [ht, dh] : [dh, ht];
      // Schrijflijn toont altijd DH eerst (makkelijker te compenseren)
      return {
        a, b, som,
        compenseerGetal:  ht,
        andereGetal:      dh,
        tiental:          afgerond,
        compenseerDelta:  delta,
        tussenResultaat:  tussensom,
        schrijflijn1: `${dh} + ${afgerond} = ${tussensom}`,
        schrijflijn2: `${tussensom} - ${delta} = ${antwoord}`,
      };
    }
    return null;
  }

  function getTypes() { return ['DH+HT']; }

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
        type:            'DH+HT',
        vraag:           `${paar.a} + ${paar.b} =`,
        antwoord:        paar.som,
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
