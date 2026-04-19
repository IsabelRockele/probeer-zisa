/* ══════════════════════════════════════════════════════════════
   modules/compenseren-aftrekken-tot1000.js
   Verantwoordelijkheid: compenseer-oefeningen voor aftrekken tot 1000

   Regels (HT-HT):
   - Beide getallen zijn veelvouden van 10 (geen eenheden)
   - Aftrekker (b): tientallen 6-9 → afronden naar volgend honderdtal
   - Aftrektal (a): tientallen 0-5 (brug gegarandeerd want tB > tA)
   - Compenseer: b → volgend honderdtal (−meer, dan +delta)
   - Bv. 820 − 490 → −500 +10 → 820−500=320 → 320+10=330
   - Som (verschil) > 0, nooit een veelvoud van 100 (minder interessant)

   Types:
   - HT-HT  : bv. 820-490 → -500+10
   - HT-TE  : bv. 320-38  → -40+2  (aftrekker t=9, e=6-9)
   - HTE-HTE: bv. 545-197 → -200+3 (aftrekker t=9, e=6-9)
   ══════════════════════════════════════════════════════════════ */

const CompenserenAftrekkenTot1000 = (() => {

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function volgendHonderdtal(n) {
    return Math.ceil((n + 1) / 100) * 100;
  }

  function maakPaar(type) {
    for (let poging = 0; poging < 500; poging++) {

      if (type === 'HT-HT') {
        // Aftrekker: tientallen 6-9 (eenheden = 0, honderden 1-8)
        const tAftrekker = rand(6, 9);
        const hAftrekker = rand(1, 8);
        const aftrekker  = hAftrekker * 100 + tAftrekker * 10;  // bv. 490, 680, 170

        const honderdtal      = volgendHonderdtal(aftrekker);   // bv. 500, 700, 200
        const compenseerDelta = honderdtal - aftrekker;          // bv. 10, 20, 30

        // Aftrektal: tientallen 0-5, honderden groter dan aftrekker
        const tAftrektal = rand(0, 5);
        const hAftrektal = rand(hAftrekker + 1, 9);
        const aftrektal  = hAftrektal * 100 + tAftrektal * 10;  // bv. 820, 350

        if (aftrektal >= 1000) continue;
        if (aftrektal <= aftrekker) continue;

        const verschil = aftrektal - aftrekker;
        if (verschil <= 0) continue;
        if (verschil % 100 === 0) continue; // resultaat veelvoud van 100 → minder interessant

        // Tussenresultaat = aftrektal - honderdtal (exact honderdtal)
        const tussenResultaat = aftrektal - honderdtal;
        if (tussenResultaat < 0) continue;
        if (tussenResultaat % 100 !== 0 && tussenResultaat % 10 !== 0) continue;

        const eindResultaat = tussenResultaat + compenseerDelta;
        if (eindResultaat !== verschil) continue;
        if (eindResultaat % 100 === 0 || eindResultaat <= 0) continue;
        if (tussenResultaat <= 0) continue;

        return {
          a: aftrektal, b: aftrekker, verschil, type,
          compenseerGetal:  aftrekker,
          andereGetal:      aftrektal,
          honderdtal,
          compenseerDelta,
          tussenResultaat,
          schrijflijn1: `${aftrektal} - ${honderdtal} = ${tussenResultaat}`,
          schrijflijn2: `${tussenResultaat} + ${compenseerDelta} = ${eindResultaat}`,
        };

      } else if (type === 'HT-TE') {
        // Aftrekker: TE met tientallen=9, eenheden 6-9
        const eAftr = rand(6, 9);
        const hAftr = rand(1, 8);
        const aftrekker = hAftr * 100 + 9 * 10 + eAftr;  // bv. 196, 298, 397

        const honderdtal      = volgendHonderdtal(aftrekker);
        const compenseerDelta = honderdtal - aftrekker;

        // Aftrektal: HT, honderden strikt groter dan aftrekker honderden
        const hAftt = rand(hAftr + 1, 9);
        const tAftt = rand(0, 5);
        const aftrektal = hAftt * 100 + tAftt * 10;
        if (aftrektal >= 1000 || aftrektal <= aftrekker) continue;

        const verschil = aftrektal - aftrekker;
        if (verschil <= 0 || verschil % 100 === 0) continue;

        const tussenResultaat = aftrektal - honderdtal;
        if (tussenResultaat < 0) continue;

        const eindResultaat = tussenResultaat + compenseerDelta;
        if (eindResultaat !== verschil || eindResultaat % 100 === 0 || eindResultaat <= 0) continue;
        if (tussenResultaat <= 0) continue;

        return {
          a: aftrektal, b: aftrekker, verschil, type,
          compenseerGetal:  aftrekker,
          andereGetal:      aftrektal,
          honderdtal, compenseerDelta, tussenResultaat,
          schrijflijn1: `${aftrektal} - ${honderdtal} = ${tussenResultaat}`,
          schrijflijn2: `${tussenResultaat} + ${compenseerDelta} = ${eindResultaat}`,
        };

      } else if (type === 'HTE-HTE') {
        // Aftrekker: HTE met tientallen=9, eenheden 6-9
        const eAftr = rand(6, 9);
        const hAftr = rand(1, 7);
        const aftrekker = hAftr * 100 + 9 * 10 + eAftr;  // bv. 197, 298, 396

        const honderdtal      = volgendHonderdtal(aftrekker);
        const compenseerDelta = honderdtal - aftrekker;

        // Aftrektal: HTE, honderden strikt groter dan aftrekker honderden, eenheden 0-5
        const hAftt = rand(hAftr + 1, 9);
        const tAftt = rand(0, 9);
        const eAftt = rand(0, 5);
        const aftrektal = hAftt * 100 + tAftt * 10 + eAftt;
        if (aftrektal >= 1000 || aftrektal <= aftrekker) continue;

        const verschil = aftrektal - aftrekker;
        if (verschil <= 0 || verschil % 100 === 0) continue;

        const tussenResultaat = aftrektal - honderdtal;
        if (tussenResultaat < 0) continue;

        const eindResultaat = tussenResultaat + compenseerDelta;
        if (eindResultaat !== verschil || eindResultaat % 100 === 0 || eindResultaat <= 0) continue;
        if (tussenResultaat <= 0) continue;

        return {
          a: aftrektal, b: aftrekker, verschil, type,
          compenseerGetal:  aftrekker,
          andereGetal:      aftrektal,
          honderdtal, compenseerDelta, tussenResultaat,
          schrijflijn1: `${aftrektal} - ${honderdtal} = ${tussenResultaat}`,
          schrijflijn2: `${tussenResultaat} + ${compenseerDelta} = ${eindResultaat}`,
        };
      }

      return null;
    }
    return null;
  }

  function genereer({ aantalOefeningen = 8, brug = 'beide', oefeningstypes = ['Gemengd'] } = {}) {
    const beschikbareTypes = ['HT-HT', 'HT-TE', 'HTE-HTE'];
    const gebruikTypes = oefeningstypes.includes('Gemengd')
      ? beschikbareTypes
      : oefeningstypes.filter(t => beschikbareTypes.includes(t));

    const oefeningen = [];
    const gebruikteSleutels = new Set();
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < aantalOefeningen * 200) {
      pogingen++;
      const type = gebruikTypes[pogingen % gebruikTypes.length];
      const paar = maakPaar(type);
      if (!paar) continue;

      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type:            paar.type,
        vraag:           `${paar.a} - ${paar.b} =`,
        antwoord:        paar.verschil,
        compenseerGetal: paar.compenseerGetal,
        andereGetal:     paar.andereGetal,
        tiental:         paar.honderdtal,      // hergebruik 'tiental' veld voor weergave
        compenseerDelta: paar.compenseerDelta,
        tussenResultaat: paar.tussenResultaat,
        schrijflijn1:    paar.schrijflijn1,
        schrijflijn2:    paar.schrijflijn2,
      });
    }
    return oefeningen;
  }

  function getTypes() { return ['Gemengd', 'HT-HT', 'HT-TE', 'HTE-HTE']; }

  return { genereer, getTypes };
})();
