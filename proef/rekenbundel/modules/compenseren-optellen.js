/* ══════════════════════════════════════════════════════════════
   modules/compenseren-optellen.js
   Verantwoordelijkheid: compenseer-oefeningen voor optellen tot 100

   Regels:
   - Altijd brugoefening
   - Het compenseerGetal heeft eenheden 6/7/8/9
   - Het andereGetal heeft eenheden 0/1/2/3/4/5 (max 5) → nooit ook compenseerbaar
   - Compenseer omhoog naar volgend tiental, dan optellen, dan aftrekken
   - Types: E+TE, TE+E, TE+TE (gemengd)
   - Bv. 68 + 4 → kring rond 68 → +70 -2 → 4+70=74 → 74-2=72
   - Bv. 4 + 68 → kring rond 68 → pijl ↙ → zelfde rekenweg
   ══════════════════════════════════════════════════════════════ */

const CompenserenOptellen = (() => {

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function volgendTiental(n) {
    return Math.ceil((n + 1) / 10) * 10;
  }

  function maakPaar(type) {
    for (let poging = 0; poging < 300; poging++) {
      let compenseerGetal, andereGetal, a, b;

      // Compenseerगetal: eenheden 6-9
      const eComp = rand(6, 9);
      const tComp = rand(1, 8);
      compenseerGetal = tComp * 10 + eComp;

      // AndereGetal: eenheden 0-5 (nooit 6-9 → anders ook compenseerbaar)
      if (type === 'TE+E' || type === 'E+TE') {
        // andereGetal is enkelvoudig: 1-5 (eenheden 1-5, geen tiental)
        andereGetal = rand(1, 5);
      } else {
        // TE+TE: andereGetal heeft tientallen + eenheden 0-5
        const eAnder = rand(0, 5);
        const tAnder = rand(1, 8);
        andereGetal = tAnder * 10 + eAnder;
        if (andereGetal < 10) continue; // moet echt TE zijn
      }

      // Bepaal positie: compenseerGetal links of rechts
      if (type === 'TE+E') {
        a = compenseerGetal; b = andereGetal;
      } else if (type === 'E+TE') {
        a = andereGetal; b = compenseerGetal;
      } else {
        // TE+TE: random volgorde
        if (Math.random() < 0.5) { a = compenseerGetal; b = andereGetal; }
        else                      { a = andereGetal;    b = compenseerGetal; }
      }

      const som = a + b;
      if (som >= 100) continue;

      // Brugoefening: som kruist een tiental
      const heeftBrug = Math.floor(som / 10) > Math.floor(compenseerGetal / 10);
      if (!heeftBrug) continue;

      // Compenseer berekening
      const tiental        = volgendTiental(compenseerGetal);
      const compenseerDelta = tiental - compenseerGetal;
      if (compenseerDelta === 0) continue;
      const tussenResultaat = tiental + andereGetal;
      if (tussenResultaat >= 100) continue;
      const eindResultaat = tussenResultaat - compenseerDelta;
      if (eindResultaat !== som) continue;
      if (som % 10 === 0) continue; // resultaat is zelf een tiental → geen mooie oefening

      return {
        a, b, som, type,
        compenseerGetal,
        andereGetal,
        tiental,
        compenseerDelta,
        tussenResultaat,
        // Volgorde schrijflijn volgt de som: compenseerGetal links → tiental eerst
        schrijflijn1: (a === compenseerGetal)
          ? `${tiental} + ${andereGetal} = ${tussenResultaat}`
          : `${andereGetal} + ${tiental} = ${tussenResultaat}`,
        schrijflijn2: `${tussenResultaat} - ${compenseerDelta} = ${eindResultaat}`,
      };
    }
    return null;
  }

  function genereer({ aantalOefeningen = 8 } = {}) {
    const TYPES = ['TE+E', 'E+TE', 'TE+TE'];
    const oefeningen = [];
    const gebruikteSleutels = new Set();
    const maxPogingen = aantalOefeningen * 150;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      const paar = maakPaar(type);
      if (!paar) continue;

      const sleutel = `${paar.a}+${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type:            paar.type,
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

  function getTypes() { return ['Gemengd']; }

  return { genereer, getTypes };
})();
