/* ══════════════════════════════════════════════════════════════
   modules/transformeren-optellen-tot10000-dh-ht.js
   Transformeren optellen tot 10.000 — DH + HT

   Regels:
   - DH-term: geen tientallen (bv. 3600, 7800)
   - HT-term: tientallen 6/7/8/9, geen duizendtallen (bv. 980, 970, 960)
   - Delta = 1000 - HT (HT naar volgend duizendtal)
   - DH - delta, HT + delta → DH' + 1000

   Voorbeeld: 3600 + 980
   - delta = 20
   - 3600 - 20 = 3580, 980 + 20 = 1000
   - 3580 + 1000 = 4580
   ══════════════════════════════════════════════════════════════ */

const TransformerenOptellenTot10000DhHt = (() => {

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar() {
    for (let p = 0; p < 400; p++) {
      // HT-term: tientallen 6/7/8/9, geen duizendtallen, minimum 600
      const tB = rand(6, 9);
      const hB = rand(1, 9);
      const ht = hB * 100 + tB * 10;
      if (ht >= 1000) continue;

      const delta = 1000 - ht;
      if (delta <= 0) continue;

      // DH-term: geen tientallen, delta moet aftrekbaar zijn
      const dA = rand(1, 8);
      const hA = rand(1, 9);
      const dh = dA * 1000 + hA * 100;

      const dhT = dh - delta;
      if (dhT <= 0) continue;
      // dhT moet een mooi getal zijn (geen negatief honderdtaal)
      const htT = ht + delta;  // = 1000
      if (htT % 1000 !== 0) continue;

      const som = dh + ht;
      if (som >= 10000) continue;
      if (dhT + htT !== som) continue;

      // Brug: honderdtallen samen ≥ 10
      const hDH = Math.floor((dh % 1000) / 100);
      const hHT = Math.floor(ht / 100);
      if (hDH + hHT < 10) continue;

      // Random volgorde: DH+HT of HT+DH
      const wissel = Math.random() < 0.5;
      const [a, b] = wissel ? [ht, dh] : [dh, ht];
      const [aT, bT] = wissel ? [htT, dhT] : [dhT, htT];

      return {
        a, b, som,
        transformeerGetal: ht,
        andereGetal:       dh,
        transformeerDelta: delta,
        schrijflijn1: `${aT} + ${bT} = ${som}`,
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
        type:              'DH+HT',
        vraag:             `${paar.a} + ${paar.b} =`,
        antwoord:          paar.som,
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
