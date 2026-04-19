/* ══════════════════════════════════════════════════════════════
   modules/tafels-getallenlijn.js
   Verantwoordelijkheid: oefeningen genereren voor getallenlijn
   Varianten:
     'getekend'             → boogjes boven lijn, herhaalde optelling + vermenigvuldiging
     'zelf'                 → lege lijn, kind tekent zelf + ___ × ___ = ___
     'delen-getekend'       → boogjes onder lijn rechts→links, deelzinnen zonder rest
     'delen-zelf'           → lege lijn + aftrekrij ingevuld, deelsom leeg
     'delen-rest-getekend'  → boogjes onder lijn, stopt niet op 0, rest-zinnen
     'delen-rest-zelf'      → lege lijn + aftrekrij met stap ingevuld, rest-zinnen
   ══════════════════════════════════════════════════════════════ */

const TafelsGetallenlijn = (() => {

  function genereer({ modus = 'per-tafel', tafel = 2, tafels = null, maxUitkomst = 20,
                       tafelMax = 5, aantalOefeningen = 4, variant = 'getekend', positie = 'vooraan' }) {
    const tafelsLijst = tafels ? (Array.isArray(tafels) ? tafels : [tafels]) : [tafel];
    const pool = [];
    const isRest = variant === 'delen-rest-getekend' || variant === 'delen-rest-zelf';

    if (isRest) {
      // Pool: deeltal dat NIET deelbaar is door stap
      for (const stap of tafelsLijst) {
        const maxDeeltal = Math.min(maxUitkomst, stap * tafelMax + stap - 1);
        for (let deeltal = stap + 1; deeltal <= maxDeeltal; deeltal++) {
          if (deeltal % stap !== 0) {
            pool.push({
              groepen:  Math.floor(deeltal / stap), // aantal volledige sprongen
              stap,
              uitkomst: deeltal,                    // deeltal = startpunt getallenlijn
              rest:     deeltal % stap,
            });
          }
        }
      }
    } else if (modus === 'per-tafel') {
      for (const t of tafelsLijst) {
        const maxGroepen = Math.min(tafelMax, 10, Math.floor(maxUitkomst / t));
        for (let m = 1; m <= maxGroepen; m++) {
          pool.push({ groepen: m, stap: t, uitkomst: m * t, rest: 0 });
        }
      }
    } else {
      for (let a = 1; a <= maxUitkomst; a++) {
        for (let b = 2; b <= maxUitkomst; b++) {
          if (a * b <= maxUitkomst && a >= 1 && b >= 2) {
            pool.push({ groepen: a, stap: b, uitkomst: a * b, rest: 0 });
          }
        }
      }
    }

    if (pool.length === 0) return [];

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, aantalOefeningen).map((p, i) => ({
      groepen:  p.groepen,
      stap:     p.stap,
      uitkomst: p.uitkomst,
      rest:     p.rest || 0,
      variant,
      positie,
      sleutel:  `gl-${variant}-${p.uitkomst}-${p.stap}-${i}`,
    }));
  }

  return { genereer };
})();
