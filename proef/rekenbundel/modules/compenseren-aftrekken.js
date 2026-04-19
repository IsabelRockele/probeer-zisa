/* ══════════════════════════════════════════════════════════════
   modules/compenseren-aftrekken.js

   Regels:
   - Altijd brugoefening: eenheden aftrektal (0-5) < eenheden aftrekker (6-9)
   - Aftrekker = 2e getal, eenheden 6-9
   - Aftrektal = 1e getal, eenheden 0-5
   - Compenseer: aftrekker → volgend tiental (−meer, dan +delta)
   - Bv. 74 - 28 → −30 +2 → 74−30=44 → 44+2=46
   ══════════════════════════════════════════════════════════════ */

const CompenserenAftrekken = (() => {

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function volgendTiental(n) {
    return Math.ceil((n + 1) / 10) * 10;
  }

  function maakPaar(type) {
    for (let poging = 0; poging < 300; poging++) {

      // Aftrekker: eenheden 6-9
      const eAftrekker = rand(6, 9);
      let aftrekker;
      if (type === 'TE-E') {
        aftrekker = eAftrekker; // 6, 7, 8 of 9
      } else {
        const tAftrekker = rand(1, 6);
        aftrekker = tAftrekker * 10 + eAftrekker;
      }

      const tiental         = volgendTiental(aftrekker);
      const compenseerDelta = tiental - aftrekker; // 1-4

      // Aftrektal: eenheden 0-5 (brug gegarandeerd: eAftrektal < eAftrekker)
      const eAftrektal = rand(0, 5);
      let tAftrektal;
      if (type === 'TE-E') {
        tAftrektal = rand(1, 9);
      } else {
        tAftrektal = rand(Math.floor(aftrekker / 10) + 1, 9);
      }
      const aftrektal = tAftrektal * 10 + eAftrektal;

      if (aftrektal <= aftrekker) continue;
      if (aftrektal >= 100) continue;

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;
      if (verschil % 10 === 0) continue;

      // Tussenresultaat moet exact een tiental zijn
      const tussenResultaat = aftrektal - tiental;
      if (tussenResultaat < 0) continue;


      const eindResultaat = tussenResultaat + compenseerDelta;
      if (eindResultaat !== verschil) continue;
      if (eindResultaat % 10 === 0) continue;

      return {
        a: aftrektal, b: aftrekker, verschil, type,
        compenseerGetal:  aftrekker,
        andereGetal:      aftrektal,
        tiental, compenseerDelta, tussenResultaat,
        schrijflijn1: `${aftrektal} - ${tiental} = ${tussenResultaat}`,
        schrijflijn2: `${tussenResultaat} + ${compenseerDelta} = ${eindResultaat}`,
      };
    }
    return null;
  }

  function genereer({ aantalOefeningen = 8, oefeningstypes = ['Gemengd'] } = {}) {
    const beschikbareTypes = ['TE-E', 'TE-TE'];
    const gebruikTypes = oefeningstypes.includes('Gemengd')
      ? beschikbareTypes
      : oefeningstypes.filter(t => beschikbareTypes.includes(t)) || beschikbareTypes;

    const oefeningen = [];
    const gebruikteSleutels = new Set();
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < aantalOefeningen * 200) {
      pogingen++;
      const type = gebruikTypes[Math.floor(Math.random() * gebruikTypes.length)];
      const paar = maakPaar(type);
      if (!paar) continue;
      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel, type: paar.type,
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

  function getTypes() { return ['Gemengd', 'TE-E', 'TE-TE']; }

  return { genereer, getTypes };
})();
