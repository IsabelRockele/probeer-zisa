/* ══════════════════════════════════════════════════════════════
   modules/transformeren-optellen.js
   Optellingswip / transformeren
   Niveaus:
     'TE+TE'    — tot 100:  één getal eenheden 6-9, ander niet, uitkomst < 100
     'HTE+TE'   — tot 1000: HTE met tiental=9 + eenheden 6-9, ander is TE, uitkomst < 1000
     'HTE+HTE'  — tot 1000: HTE met tiental=9 + eenheden 6-9, ander HTE tiental≠9, uitkomst < 1000
   Oefening-object:
     { sleutel, vraag, antwoord,
       transformeerGetal,   het getal dat naar tiental/honderdtal gaat
       andereGetal,         het andere getal
       transformeerDelta,   hoeveel erbij komt bij transformeerGetal
       schrijflijn1,        de getransformeerde som  bv. "50 + 25"
       schrijflijn2 }       het antwoord              bv. "= 75"
   ══════════════════════════════════════════════════════════════ */

const TransformerenOptellen = (() => {

  function _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function _heeftBrug(a, b) {
    return (a % 10) + (b % 10) > 10;
  }

  /* ── TE + TE (uitkomst < 100) ───────────────────────────── */
  function _poolTE() {
    const pool = [];
    for (let a = 16; a <= 89; a++) {
      const eA = a % 10;
      if (eA < 6) continue;
      const d = 10 - eA;
      for (let b = 11; b <= 83; b++) {
        const eB = b % 10;
        if (eB >= 6 || eB === 0) continue;
        if (!_heeftBrug(a, b)) continue;
        if (a + b >= 100) continue;
        if (b - d <= 0 || (b - d) % 10 === 0) continue;
        pool.push({
          sleutel: `tr-opt-TE-${a}-${b}`,
          vraag: `${a} + ${b} =`,
          antwoord: a + b,
          transformeerGetal: a,
          andereGetal: b,
          transformeerDelta: d,
          schrijflijn1: `${a + d} + ${b - d}`,
          schrijflijn2: `= ${a + b}`,
        });
      }
    }
    return pool;
  }

  /* ── HTE + TE (uitkomst < 1000) ────────────────────────── */
  function _poolHTE_TE() {
    const pool = [];
    for (let a = 196; a <= 989; a++) {
      const tA = Math.floor((a % 100) / 10);
      const eA = a % 10;
      if (tA !== 9) continue;
      if (eA < 6) continue;
      const d = 100 - (a % 100);
      for (let b = 11; b <= 99; b++) {
        const eB = b % 10;
        if (eB >= 6 || eB === 0) continue;
        if (!_heeftBrug(a, b)) continue;
        if (a + b >= 1000) continue;
        const agT = b - d;
        if (agT <= 0 || agT % 10 === 0) continue;
        pool.push({
          sleutel: `tr-opt-HTE-TE-${a}-${b}`,
          vraag: `${a} + ${b} =`,
          antwoord: a + b,
          transformeerGetal: a,
          andereGetal: b,
          transformeerDelta: d,
          schrijflijn1: `${a + d} + ${b - d}`,
          schrijflijn2: `= ${a + b}`,
        });
      }
    }
    return pool;
  }

  /* ── HTE + HTE (uitkomst < 1000) ───────────────────────── */
  function _poolHTE_HTE() {
    const pool = [];
    for (let a = 196; a <= 899; a++) {
      const tA = Math.floor((a % 100) / 10);
      const eA = a % 10;
      if (tA !== 9) continue;
      if (eA < 6) continue;
      const d = 100 - (a % 100);
      for (let b = 111; b <= 799; b++) {
        const tB = Math.floor((b % 100) / 10);
        const eB = b % 10;
        if (tB === 9) continue;
        if (eB === 0) continue;
        if (!_heeftBrug(a, b)) continue;
        if (a + b >= 1000) continue;
        const agT = b - d;
        if (agT <= 0 || agT % 100 === 0 || agT % 10 === 0) continue;
        pool.push({
          sleutel: `tr-opt-HTE-HTE-${a}-${b}`,
          vraag: `${a} + ${b} =`,
          antwoord: a + b,
          transformeerGetal: a,
          andereGetal: b,
          transformeerDelta: d,
          schrijflijn1: `${a + d} + ${b - d}`,
          schrijflijn2: `= ${a + b}`,
        });
      }
    }
    return pool;
  }

  /* ── Publieke API ───────────────────────────────────────── */
  function getTypes(niveau) {
    if (niveau <= 100) return ['TE + TE'];
    return ['HTE + TE', 'HTE + HTE', 'Gemengd'];
  }

  function genereer({ niveau = 100, oefeningstypes = ['TE + TE'], aantalOefeningen = 12 }) {
    let pool = [];

    if (niveau <= 100) {
      pool = _poolTE();
    } else {
      const wilTE   = oefeningstypes.includes('HTE + TE');
      const wilHTE  = oefeningstypes.includes('HTE + HTE');
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
