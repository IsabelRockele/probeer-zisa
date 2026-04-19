/* ══════════════════════════════════════════════════════════════
   modules/hulpmiddelen.js
   Verantwoordelijkheid: configuratie en tekendata voor hulpmiddelen
   - Splitsbeen (2 vakjes)
   - Schrijflijnen (2 lijnen onder antwoordvak)
   ══════════════════════════════════════════════════════════════ */

const Hulpmiddelen = (() => {

  // Geeft terug welke hulpmiddelen beschikbaar zijn per bewerking
  function getOpties(bewerking) {
    const basis = ['splitsbeen', 'schrijflijnen'];
    return basis;
  }

  // Geeft de positiekeuzes terug voor splitsbeen per bewerking
  function getSplitsPosities(bewerking) {
    if (bewerking === 'aftrekken') {
      return [
        { waarde: 'aftrekker',  label: 'Onder aftrekker (bv. 12-6: been onder 6)' },
        { waarde: 'aftrektal',  label: 'Onder aftrektal (bv. 12-6: been onder 12)' },
      ];
    }
    return []; // optellen heeft geen keuze: altijd onder 2de term
  }

  return { getOpties, getSplitsPosities };
})();
