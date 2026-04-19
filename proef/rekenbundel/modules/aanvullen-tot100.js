/* ══════════════════════════════════════════════════════════════
   modules/aanvullen-tot100.js
   Verantwoordelijkheid: oefeningen voor "aanvullen tot 100"
   Regels:
     - Altijd TE - TE (groot getal en klein getal hebben tientallen én eenheden)
     - Altijd brugoefening: eenheden van aftrekker > eenheden van aftrektal
       (bv. 36 - 32: 2 < 6 → géén brug. Fout voorbeeld)
       (bv. 36 - 29: 9 > 6 → brug ✓)
       MAAR: aanvullen = verschil klein → de eenheden liggen dicht bij elkaar
       → brug = eenheden klein getal > eenheden groot getal
       (bv. 43 - 38: 8 > 3 → brug ✓, verschil = 5 ✓)
     - Verschil is altijd 1 t/m 5
     - Beide getallen tussen 11 en 99, niet veelvoud van 10
   ══════════════════════════════════════════════════════════════ */

const AanvullenTot100 = (() => {

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* ── Maak één aanvuloefening ─────────────────────────────── */
  function maakPaar() {
    for (let poging = 0; poging < 200; poging++) {
      // Verschil tussen 1 en 5
      const verschil = rand(1, 5);
      // Groot getal: TE, niet veelvoud van 10, tussen 12 en 99
      const groot = rand(12, 99);
      if (groot % 10 === 0) continue;
      const klein = groot - verschil;
      if (klein < 11) continue;
      if (klein % 10 === 0) continue;
      // Moet brugoefening zijn: eenheden klein > eenheden groot
      const eGroot = groot % 10;
      const eKlein = klein % 10;
      if (eKlein <= eGroot) continue; // geen brug → overslaan
      return { groot, klein, verschil };
    }
    return null;
  }

  /* ── Genereer een set oefeningen ─────────────────────────── */
  function genereer({ aantalOefeningen = 8 } = {}) {
    const oefeningen = [];
    const gebruikteSleutels = new Set();
    const maxPogingen = aantalOefeningen * 80;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const paar = maakPaar();
      if (!paar) continue;
      const sleutel = `${paar.groot}-${paar.klein}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);
      oefeningen.push({
        sleutel,
        type: 'TE-TE',
        vraag: `${paar.groot} - ${paar.klein} =`,
        antwoord: paar.verschil,
      });
    }
    return oefeningen;
  }

  function getTypes() {
    return ['TE-TE'];
  }

  return { genereer, getTypes };
})();
