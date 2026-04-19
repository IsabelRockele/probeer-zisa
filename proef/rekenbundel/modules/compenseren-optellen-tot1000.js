/* ══════════════════════════════════════════════════════════════
   modules/compenseren-optellen-tot1000.js
   Verantwoordelijkheid: compenseer-oefeningen voor optellen tot 1000

   Regels:
   - Altijd brugoefening (naar tiental OF naar honderdtal)
   - Het compenseerGetal heeft eenheden 6/7/8/9
   - Het andereGetal heeft eenheden 0-5 (nooit ook compenseerbaar)
   - Compenseer omhoog naar volgend tiental, dan optellen, dan aftrekken
   - Som strikt < 1000

   Types:
   - TE+TE  : bv. 66+49 → +50−1, of 84+78 → +80−2
   - HT+TE  : bv. 320+49 → +50−1 (HT links, TE rechts wordt gecompenseerd)
   - HTE+HTE: bv. 423+149 → +150−1 (rechter HTE wordt gecompenseerd)

   Brug:
   - naar-tiental : som kruist een tiental maar geen honderdtal
   - naar-honderdtal : som kruist een honderdtal
   - beide : gemengd
   ══════════════════════════════════════════════════════════════ */

const CompenserenOptellenTot1000 = (() => {

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function volgendTiental(n) {
    return Math.ceil((n + 1) / 10) * 10;
  }

  function kruistHonderdtal(a, som) {
    return Math.floor(som / 100) > Math.floor(a / 100);
  }

  function kruistTiental(a, som) {
    return Math.floor(som / 10) > Math.floor(a / 10);
  }

  function maakPaar(type, brug) {
    for (let poging = 0; poging < 500; poging++) {
      let compenseerGetal, andereGetal, a, b;

      // CompenseerGetal: TE — tientallen 1-8, eenheden 6-9
      const eComp = rand(6, 9);
      const tComp = rand(1, 8);
      compenseerGetal = tComp * 10 + eComp;  // 16–89

      // AndereGetal en volgorde afhankelijk van type
      if (type === 'TE+TE') {
        // TE: tientallen 1-9, eenheden 0-5
        const eAnder = rand(0, 5);
        const tAnder = rand(1, 9);
        andereGetal = tAnder * 10 + eAnder;  // 10–95
        if (andereGetal < 10) continue;
        // Volgorde random
        if (Math.random() < 0.5) { a = andereGetal; b = compenseerGetal; }
        else                      { a = compenseerGetal; b = andereGetal; }

      } else if (type === 'HT+TE') {
        // HT links: honderden 1-8, tientallen 0-5, geen eenheden
        const hAnder = rand(1, 8);
        const tAnder = rand(0, 5);
        andereGetal = hAnder * 100 + tAnder * 10;  // 100–850
        // Volgorde random: TE links of rechts
        if (Math.random() < 0.5) { a = andereGetal; b = compenseerGetal; }
        else                      { a = compenseerGetal; b = andereGetal; }

      } else if (type === 'HTE+HTE') {
        // CompenseerGetal: HTE met tientallen altijd 9, eenheden 6-9
        // bv. 198, 297, 396 → afronden naar volgend honderdtal
        const hComp2 = rand(1, 7);
        compenseerGetal = hComp2 * 100 + 9 * 10 + eComp;  // bv. 196, 297, 398
        if (compenseerGetal < 100) continue;
        // AndereGetal: HTE met eenheden 0-5, tientallen 0-8
        const eAnder = rand(0, 5);
        const tAnder = rand(0, 8);
        const hAnder = rand(1, 8);
        andereGetal = hAnder * 100 + tAnder * 10 + eAnder;  // 100–885
        if (andereGetal < 100) continue;
        // Volgorde random: compenseerGetal links of rechts
        if (Math.random() < 0.5) { a = andereGetal; b = compenseerGetal; }
        else                      { a = compenseerGetal; b = andereGetal; }

      } else {
        continue;
      }

      const som = a + b;
      if (som >= 1000) continue;
      if (som < 10)   continue;

      // Brugcheck altijd t.o.v. andereGetal (niet a, want a kan compenseerGetal zijn)
      const heeftTiental    = kruistTiental(andereGetal, som);
      const heeftHonderdtal = kruistHonderdtal(andereGetal, som);
      if (!heeftTiental && !heeftHonderdtal) continue; // geen brug

      // Brugfilter
      if (brug === 'naar-tiental'    && heeftHonderdtal) continue;
      if (brug === 'naar-honderdtal' && !heeftHonderdtal) continue;

      // Compenseerberekening
      const tiental         = volgendTiental(compenseerGetal);
      const compenseerDelta = tiental - compenseerGetal;
      if (compenseerDelta === 0) continue;

      const tussenResultaat = andereGetal + tiental;
      if (tussenResultaat >= 1000) continue;

      const eindResultaat = tussenResultaat - compenseerDelta;
      if (eindResultaat !== som) continue;
      if (som % 10 === 0) continue; // resultaat is een tiental → minder interessant

      // Schrijflijn: andereGetal links of rechts volgt de positie in de som
      const compLinksInSom = (a === compenseerGetal);
      return {
        a, b, som, type,
        compenseerGetal,
        andereGetal,
        tiental,
        compenseerDelta,
        tussenResultaat,
        schrijflijn1: compLinksInSom
          ? `${tiental} + ${andereGetal} = ${tussenResultaat}`
          : `${andereGetal} + ${tiental} = ${tussenResultaat}`,
        schrijflijn2: `${tussenResultaat} - ${compenseerDelta} = ${eindResultaat}`,
      };
    }
    return null;
  }

  function genereer({ aantalOefeningen = 8, brug = 'beide', oefeningstypes = ['Gemengd'] } = {}) {
    const ALLE_TYPES = ['TE+TE', 'HT+TE', 'HTE+HTE'];
    const TYPES = oefeningstypes.includes('Gemengd')
      ? ALLE_TYPES
      : oefeningstypes.filter(t => ALLE_TYPES.includes(t));
    const oefeningen = [];
    const gebruikteSleutels = new Set();
    const maxPogingen = aantalOefeningen * 200;
    let pogingen = 0;

    // Bij 'beide': wissel af tussen naar-tiental en naar-honderdtal
    const brugOpties = (brug === 'beide')
      ? ['naar-tiental', 'naar-honderdtal']
      : [brug];

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      // HTE+HTE kruist altijd een honderdtal → altijd naar-honderdtal
      const brugKeus = (type === 'HTE+HTE')
        ? 'naar-honderdtal'
        : brugOpties[oefeningen.length % brugOpties.length];
      const paar     = maakPaar(type, brugKeus);
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

  function getTypes() { return ['Gemengd', 'TE+TE', 'HT+TE', 'HTE+HTE']; }

  return { genereer, getTypes };
})();
