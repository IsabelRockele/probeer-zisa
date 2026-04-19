/* ══════════════════════════════════════════════════════════════
   modules/tafels.js
   Verantwoordelijkheid: tafeloefeningen genereren
   Types:
     'Vermenigvuldigen'   → a × b = ___
     'Gedeeld door'       → a ÷ b = ___
     'Ontbrekende factor' → ___ × b = c  of  a × ___ = c
     'Gemengd'            → mix van alle drie
   ══════════════════════════════════════════════════════════════ */

const Tafels = (() => {

  /* ── Types ───────────────────────────────────────────────── */
  function getTypes() {
    return ['Vermenigvuldigen', 'Gedeeld door', 'Ontbrekende factor', 'Gemengd', 'Redeneren', 'Koppel'];
  }

  /* ── Genereer oefeningen ─────────────────────────────────── */
  function genereer({ tafels = [2], oefeningstypes = ['Vermenigvuldigen'], aantalOefeningen = 12, tafelPositie = 'vooraan', tafelMax = 10 }) {
    if (!tafels || tafels.length === 0) return [];

    // Bouw pool van kandidaten
    const isGemengd = oefeningstypes.includes('Gemengd');
    const wilVerm     = isGemengd || oefeningstypes.includes('Vermenigvuldigen');
    const wilDeel     = isGemengd || oefeningstypes.includes('Gedeeld door');
    const wilFactor   = isGemengd || oefeningstypes.includes('Ontbrekende factor');
    const wilRedeneren = oefeningstypes.includes('Redeneren');
    const wilKoppel    = oefeningstypes.includes('Koppel');

    const pool = [];

    for (const tafel of tafels) {
  for (let multiplier = 0; multiplier <= tafelMax; multiplier++) {
        const product = tafel * multiplier;

        // Bepaal welke volgorden we genereren
        // tafelPositie: 'vooraan' → tafel × multiplier
        //               'achteraan' → multiplier × tafel
        //               'beide' → beide richtingen
        const voegVooraan  = tafelPositie === 'vooraan'  || tafelPositie === 'beide';
        const voegAchteraan = tafelPositie === 'achteraan' || tafelPositie === 'beide';

        if (wilVerm) {
          if (voegVooraan) {
            pool.push({ type: 'vermenigvuldigen', a: tafel, b: multiplier, antwoord: product,
              sleutel: `v-${tafel}-${multiplier}` });
          }
          if (voegAchteraan && tafel !== multiplier) {
            pool.push({ type: 'vermenigvuldigen', a: multiplier, b: tafel, antwoord: product,
              sleutel: `v-${multiplier}-${tafel}` });
          }
        }
        
        if (wilDeel && product > 0) {
  // Altijd enkel de gekozen tafel als deler
  pool.push({
    type: 'gedeeld',
    a: product,
    b: tafel,
    antwoord: multiplier,
    sleutel: `d-${product}-${tafel}`
  });
}
        if (wilFactor) {
          // Ontbrekende factor: altijd beide posities (links én rechts) aanbieden,
          // ongeacht tafelPositie — zodat het invulvakje afwisselend 1e of 2e factor is.
          // ___ × multiplier = product  (tafel is de ontbrekende 1e factor)
          pool.push({ type: 'ontbrekende-factor', positie: 'links', a: null, b: multiplier, antwoord: tafel,
            product, sleutel: `f-l-${tafel}-${multiplier}` });
          // tafel × ___ = product  (multiplier is de ontbrekende 2e factor)
          pool.push({ type: 'ontbrekende-factor', positie: 'rechts', a: tafel, b: null, antwoord: multiplier,
            product, sleutel: `f-r-${tafel}-${multiplier}` });
        }

        if (wilRedeneren && product > 0) {
          // deeltal : deler = ___ , want ___ × deler = deeltal
          // Alleen de geselecteerde tafel als deler — niet multiplier
          pool.push({ type: 'redeneren', deeltal: product, deler: tafel, quotient: multiplier,
            sleutel: `red-${product}-${tafel}` });
        }

        if (wilKoppel) {
          // factor1 × factor2 = ___ , dus ___ : factor2 = ___
          if (voegVooraan) {
            pool.push({ type: 'koppel', factor1: tafel, factor2: multiplier, product,
              sleutel: `kop-${tafel}-${multiplier}` });
          }
          if (voegAchteraan && tafel !== multiplier) {
            pool.push({ type: 'koppel', factor1: multiplier, factor2: tafel, product,
              sleutel: `kop-${multiplier}-${tafel}` });
          }
        }
      }
    }

    if (pool.length === 0) return [];

    // Meng en kies zonder herhaling
    const gemengd = _shuffle(pool);
    const gekozen = [];
    const gebruikt = new Set();
    for (const oef of gemengd) {
      if (gebruikt.has(oef.sleutel)) continue;
      gebruikt.add(oef.sleutel);
      gekozen.push(oef);
      if (gekozen.length >= aantalOefeningen) break;
    }

    return gekozen;
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return { genereer, getTypes };
})();
