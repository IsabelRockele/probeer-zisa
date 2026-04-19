/* ══════════════════════════════════════════════════════════════
   modules/aanvullen-tot1000.js
   Verantwoordelijkheid: aanvuloefeningen tot 1000

   Types:
   - HT-HT  : bv. 450 - 420 = 30 (verschil max 40, veelvoud van 10)
               brug: tientallen klein > tientallen groot
   - HTE-HTE: bv. 543 - 538 = 5  (verschil max 5)
               brug: eenheden klein > eenheden groot

   Regels:
   - Altijd brugoefening
   - HT-HT:  beide veelvoud van 10, verschil 10-40
   - HTE-HTE: beide hebben honderden, tientallen én eenheden, verschil 1-5
   ══════════════════════════════════════════════════════════════ */

const AanvullenTot1000 = (() => {

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function maakPaar(type) {
    for (let poging = 0; poging < 300; poging++) {

      if (type === 'HT-HT') {
        // Verschil = veelvoud van 10, tussen 10 en 40
        const verschil = rand(1, 4) * 10;
        // Groot getal: HT, niet veelvoud van 100, tientallen 1-9
        const hGroot = rand(1, 9);
        const tGroot = rand(1, 9);
        const groot  = hGroot * 100 + tGroot * 10;
        if (groot >= 1000) continue;
        const klein = groot - verschil;
        if (klein <= 0) continue;
        if (klein % 10 !== 0) continue;           // klein moet ook HT zijn
        const hKlein = Math.floor(klein / 100);
        const tKlein = (klein % 100) / 10;
        // Brug: tientallen klein > tientallen groot (na afrek kruist een tiental)
        if (tKlein <= tGroot) continue;           // geen brug
        return { groot, klein, verschil, type };

      } else if (type === 'HTE-HTE') {
        // Verschil tussen 1 en 5
        const verschil = rand(1, 5);
        // Groot getal: HTE, niet veelvoud van 10
        const hGroot = rand(1, 9);
        const tGroot = rand(0, 9);
        const eGroot = rand(1, 9);
        const groot  = hGroot * 100 + tGroot * 10 + eGroot;
        if (groot >= 1000) continue;
        const klein = groot - verschil;
        if (klein <= 0) continue;
        const eKlein = klein % 10;
        const eGrootVal = groot % 10;
        // Brug: eenheden klein > eenheden groot
        if (eKlein <= eGrootVal) continue;
        // Klein mag geen veelvoud van 10 zijn
        if (klein % 10 === 0) continue;
        // Beide moeten drijecijferig zijn
        if (klein < 100) continue;
        return { groot, klein, verschil, type };
      }
    }
    return null;
  }

  function genereer({ aantalOefeningen = 8, oefeningstypes = ['Gemengd'] } = {}) {
    const ALLE_TYPES = ['HT-HT', 'HTE-HTE'];
    const TYPES = oefeningstypes.includes('Gemengd')
      ? ALLE_TYPES
      : oefeningstypes.filter(t => ALLE_TYPES.includes(t));

    const oefeningen = [];
    const gebruikteSleutels = new Set();
    const maxPogingen = aantalOefeningen * 150;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      const paar = maakPaar(type);
      if (!paar) continue;
      const sleutel = `${paar.groot}-${paar.klein}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);
      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag:    `${paar.groot} - ${paar.klein} =`,
        antwoord: paar.verschil,
      });
    }
    return oefeningen;
  }

  function getTypes() { return ['Gemengd', 'HT-HT', 'HTE-HTE']; }

  return { genereer, getTypes };
})();
