/* ══════════════════════════════════════════════════════════════
   modules/aftrekken-tot10000-brug-ht.js
   Aftrekken tot 10.000 met brug — DH-HT en D-HT
   via splitsen van de aftrekker (HT)

   Regels:
   - Aftrekker: HT (honderdtallen + tientallen, geen duizendtallen)
   - Aftrektal: DH (D-HT variant: alleen duizendtallen, H=0)
   - Brug op tientallen: T_aftrektal < T_aftrekker
   - Splitsen: aftrekker → H-deel + T-deel

   Voorbeeld DH-HT: 8500 - 350
   - splits 350 → 300 + 50
   - 8500 - 300 = 8200
   - 8200 - 50 = 8150

   Voorbeeld D-HT: 8000 - 350
   - splits 350 → 300 + 50
   - 8000 - 300 = 7700
   - 7700 - 50 = 7650
   ══════════════════════════════════════════════════════════════ */

const AftrekkenTot10000BrugHt = (() => {

  const ALLE_TYPES = ['DH-HT', 'D-HT'];

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaar(type) {
    for (let p = 0; p < 400; p++) {
      // Aftrekker: HT, tientallen 1-9, honderdtallen 1-9
      const hB = rand(1, 9);
      const tB = rand(1, 9);
      const aftrekker = hB * 100 + tB * 10;

      // Aftrektal
      let aftrektal;
      if (type === 'DH-HT') {
        // DH: duizendtallen + honderdtallen
        const dA = rand(1, 9);
        const hA = rand(0, 9);
        aftrektal = dA * 1000 + hA * 100;
        if (aftrektal % 1000 === 0) continue; // dan is het D, niet DH
      } else {
        // D: enkel duizendtallen
        aftrektal = rand(1, 9) * 1000;
      }

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;

      // Brug op tientallen: T_aftrektal < T_aftrekker
      const tA = Math.floor((aftrektal % 100) / 10);
      if (tA >= tB) continue; // geen brug → overslaan

      // Splits aftrekker in H-deel en T-deel
      const hDeel = hB * 100;
      const tDeel = tB * 10;
      const tussensom = aftrektal - hDeel;
      if (tussensom <= 0) continue;

      return {
        a: aftrektal,
        b: aftrekker,
        verschil,
        type,
        splitsDeel1: hDeel,
        splitsDeel2: tDeel,
        tussensom,
        schrijflijn1: `${aftrektal} - ${hDeel} = ${tussensom}`,
        schrijflijn2: `${tussensom} - ${tDeel} = ${verschil}`,
      };
    }
    return null;
  }

  function getTypes() { return ALLE_TYPES; }

  function genereer({ oefeningstypes = ['DH-HT', 'D-HT'], aantalOefeningen = 12 } = {}) {
    const actieveTypes = oefeningstypes.includes('Gemengd')
      ? ALLE_TYPES
      : oefeningstypes.filter(t => ALLE_TYPES.includes(t));
    if (actieveTypes.length === 0) return [];

    const oefeningen = [];
    const gebruikt   = new Set();
    const maxPog     = aantalOefeningen * 300;
    let pogingen     = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPog) {
      pogingen++;
      const type = actieveTypes[Math.floor(Math.random() * actieveTypes.length)];
      const paar = maakPaar(type);
      if (!paar) continue;
      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type:        paar.type,
        vraag:       `${paar.a} - ${paar.b} =`,
        antwoord:    paar.verschil,
        splitsDeel1: paar.splitsDeel1,
        splitsDeel2: paar.splitsDeel2,
        tussensom:   paar.tussensom,
        schrijflijn1: paar.schrijflijn1,
        schrijflijn2: paar.schrijflijn2,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();
