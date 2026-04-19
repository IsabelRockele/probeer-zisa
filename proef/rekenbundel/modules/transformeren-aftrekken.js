/* ══════════════════════════════════════════════════════════════
   modules/transformeren-aftrekken.js
   Aftrekkingswip / transformeren aftrekken
   Niveaus:
     TE-TE    — tot 100:  brugoefening, aftrekker naar tiental, uitkomst < 100
     HTE-TE   — tot 1000: HTE - TE, brugoefening, uitkomst < 1000
     HTE-HTE  — tot 1000: HTE - HTE, brugoefening, uitkomst < 1000
   Delta: aftrekker wordt afgerond naar dichtstbijzijnd tiental
     eenheden 1-4: delta = -e  (bv. 73 - delta 3 → 70)
     eenheden 6-9: delta = 10-e (bv. 29 + delta 1 → 30)
   Beide termen krijgen hetzelfde delta bijgeteld/afgetrokken.
   Oefening-object:
     { sleutel, vraag, antwoord,
       transformeerGetal,   het aftrektal (at)
       andereGetal,         de aftrekker (af)
       transformeerDelta,   de delta (+ of -)
       schrijflijn1,        de getransformeerde som  bv. "375 - 100"
       schrijflijn2 }       het antwoord              bv. "= 275"
   ══════════════════════════════════════════════════════════════ */

const TransformerenAftrekken = (() => {

  function _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function _deltaVoor(af) {
    const e = af % 10;
    if (e >= 1 && e <= 4) return -e;
    if (e >= 6 && e <= 9) return 10 - e;
    return null;
  }

  function _geldig(at, af, d) {
    if (at % 10 === 0 || af % 10 === 0 || af % 10 === 5) return false;
    const uitkomst = at - af;
    if (uitkomst <= 0) return false;
    if (uitkomst % 10 === 0) return false;
    const afNa = af + d, atNa = at + d;
    if (afNa <= 0 || atNa <= 0) return false;
    if (afNa % 10 !== 0) return false;
    // Echte brugoefening: eenheden aftrektal < eenheden aftrekker
    if ((at % 10) >= (af % 10)) return false;
    return true;
  }

  /* ── TE - TE ─────────────────────────────────────────────── */
  function _poolTE() {
    const pool = [];
    for (let af = 11; af <= 49; af++) {
      const d = _deltaVoor(af); if (d === null) continue;
      for (let b = af + 1; b <= 99; b++) {
        if (!_geldig(b, af, d)) continue;
        if (b - af >= 100) continue;
        pool.push({
          sleutel: `tr-aft-TE-${b}-${af}`,
          vraag: `${b} - ${af} =`,
          antwoord: b - af,
          transformeerGetal: b,
          andereGetal: af,
          transformeerDelta: d,
          schrijflijn1: `${b + d} - ${af + d}`,
          schrijflijn2: `= ${b - af}`,
        });
      }
    }
    return pool;
  }

  /* ── HTE - TE ────────────────────────────────────────────── */
  function _poolHTE_TE() {
    const pool = [];
    for (let af = 11; af <= 99; af++) {
      const d = _deltaVoor(af); if (d === null) continue;
      for (let b = 101; b <= 999; b++) {
        if (!_geldig(b, af, d)) continue;
        if (b - af >= 1000) continue;
        pool.push({
          sleutel: `tr-aft-HTE-TE-${b}-${af}`,
          vraag: `${b} - ${af} =`,
          antwoord: b - af,
          transformeerGetal: b,
          andereGetal: af,
          transformeerDelta: d,
          schrijflijn1: `${b + d} - ${af + d}`,
          schrijflijn2: `= ${b - af}`,
        });
      }
    }
    return pool;
  }

  /* ── HTE - HTE ───────────────────────────────────────────── */
  function _poolHTE_HTE() {
    const pool = [];
    for (let af = 111; af <= 499; af++) {
      const d = _deltaVoor(af); if (d === null) continue;
      for (let b = af + 1; b <= 999; b++) {
        if (!_geldig(b, af, d)) continue;
        if (b - af >= 1000) continue;
        pool.push({
          sleutel: `tr-aft-HTE-HTE-${b}-${af}`,
          vraag: `${b} - ${af} =`,
          antwoord: b - af,
          transformeerGetal: b,
          andereGetal: af,
          transformeerDelta: d,
          schrijflijn1: `${b + d} - ${af + d}`,
          schrijflijn2: `= ${b - af}`,
        });
      }
    }
    return pool;
  }

  /* ── Publieke API ───────────────────────────────────────── */
  function getTypes(niveau) {
    if (niveau <= 100) return ['TE - TE'];
    return ['HTE - TE', 'HTE - HTE', 'Gemengd'];
  }

  function genereer({ niveau = 100, oefeningstypes = ['TE - TE'], aantalOefeningen = 12 }) {
    let pool = [];

    if (niveau <= 100) {
      pool = _poolTE();
    } else {
      const wilTE   = oefeningstypes.includes('HTE - TE');
      const wilHTE  = oefeningstypes.includes('HTE - HTE');
      const gemengd = oefeningstypes.includes('Gemengd');
      if (gemengd || (wilTE && wilHTE)) {
        pool = [..._poolHTE_TE(), ..._poolHTE_HTE()];
      } else if (wilTE) {
        pool = _poolHTE_TE();
      } else if (wilHTE) {
        pool = _poolHTE_HTE();
      } else {
        pool = [..._poolHTE_TE(), ..._poolHTE_HTE()];
      }
    }

    _shuffle(pool);
    const gekozen = [];
    const gebruikt = new Set();
    for (const oef of pool) {
      if (gebruikt.has(oef.sleutel)) continue;
      gebruikt.add(oef.sleutel);
      gekozen.push(oef);
      if (gekozen.length >= aantalOefeningen) break;
    }
    return gekozen;
  }

  return { genereer, getTypes };
})();
