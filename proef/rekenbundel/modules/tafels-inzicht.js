/* ══════════════════════════════════════════════════════════════
   modules/tafels-inzicht.js
   Verantwoordelijkheid: inzicht-oefeningen voor vermenigvuldigen en delen
   Typen:
     'groepjes'        → emoji-groepjes → herhaalde optelling → vermenigvuldiging
     'delen-aftrekking'→ alle emoji's → kind tekent groepen → herhaalde aftrekking → deling
     'delen-rest'      → alle emoji's → deling met rest (uitkomst % deler ≠ 0)
     'redeneren'       → 16 : 2 = ... want ... × 2 = 16
     'koppel'          → 5 × 2 = ___ , dus ___ : 2 = ___
   Modus 'per-tafel': tafel van X, t/m ×tafelMax
   Modus 'tot-uitkomst': alle combinaties met uitkomst ≤ N
   ══════════════════════════════════════════════════════════════ */

const TafelsInzicht = (() => {

  /* ── Emoji-categorieën ───────────────────────────────────── */
  const EMOJI_SETS = {
    'auto':       { emoji: '🚗', label: "auto's" },
    'ster':       { emoji: '⭐', label: 'sterren' },
    'bloem':      { emoji: '🌸', label: 'bloemen' },
    'bal':        { emoji: '🏀', label: 'ballen' },
    'vis':        { emoji: '🐟', label: 'vissen' },
    'hart':       { emoji: '❤️', label: 'hartjes' },
    'appel':      { emoji: '🍎', label: 'appels' },
    'vlinder':    { emoji: '🦋', label: 'vlinders' },
    'ijs':        { emoji: '🍦', label: 'ijsjes' },
    'huis':       { emoji: '🏠', label: 'huizen' },
    'boom':       { emoji: '🌳', label: 'bomen' },
    'maan':       { emoji: '🌙', label: 'maantjes' },
  };

  const EMOJI_KEYS = Object.keys(EMOJI_SETS);

  /* ── Genereer oefeningen ─────────────────────────────────── */
  function genereer({ modus = 'per-tafel', tafel = 2, tafels = null, maxUitkomst = 12, tafelMax = 5, aantalOefeningen = 4, emojiSet = 'afwisselend', inzichtType = 'groepjes' }) {
    const tafelsLijst = tafels ? (Array.isArray(tafels) ? tafels : [tafels]) : [tafel];

    const pool = [];

    // ── Eerlijk verdelen: tafel = deler, m = quotient ────────
    // bijv. tafel van 2 → 2:2, 4:2, 6:2, ... 20:2
    if (inzichtType === 'verdelen-emoji' || inzichtType === 'verdelen-splitshuis' || inzichtType === 'verdelen-100veld') {
      for (const deler of tafelsLijst) {
        for (let quotient = 1; quotient <= tafelMax; quotient++) {
          pool.push({ aantalGroepen: deler, perGroep: quotient, totaal: deler * quotient });
        }
      }
      if (pool.length === 0) return [];
      const gekozen = _shuffle(pool).slice(0, aantalOefeningen);
      const EMOJI_KEYS_LOCAL = Object.keys(EMOJI_SETS);
      return gekozen.map((oef, i) => {
        const key = emojiSet === 'afwisselend'
          ? EMOJI_KEYS_LOCAL[i % EMOJI_KEYS_LOCAL.length]
          : (EMOJI_SETS[emojiSet] ? emojiSet : EMOJI_KEYS_LOCAL[0]);
        const set = EMOJI_SETS[key];
        return {
          type:          inzichtType,
          totaal:        oef.totaal,
          aantalGroepen: oef.aantalGroepen,
          perGroep:      oef.perGroep,
          emoji:         set.emoji,
          emojiLabel:    set.label,
          sleutel:       `vd-${inzichtType}-${oef.totaal}-${oef.aantalGroepen}-${i}`,
        };
      });
    }

    if (inzichtType === 'delen-rest') {
      // Pool: combinaties waarbij uitkomst NIET deelbaar is door deler
      // deler = groepGrootte (tafel), uitkomst = willekeurig getal met rest
      for (const deler of tafelsLijst) {
        const maxDeeltal = Math.min(maxUitkomst, deler * tafelMax + deler - 1);
        for (let deeltal = deler + 1; deeltal <= maxDeeltal; deeltal++) {
          if (deeltal % deler !== 0) {
            const quotient = Math.floor(deeltal / deler);
            const rest     = deeltal % deler;
            pool.push({ deeltal, deler, quotient, rest });
          }
        }
      }
    } else if (modus === 'per-tafel') {
      for (const t of tafelsLijst) {
        for (let m = 1; m <= tafelMax; m++) {
          pool.push({ groepen: m, groepGrootte: t });
        }
      }
    } else {
      for (let a = 2; a <= Math.min(maxUitkomst, 7); a++) {
        for (let b = 2; b <= maxUitkomst; b++) {
          if (a * b <= maxUitkomst) {
            pool.push({ groepen: a, groepGrootte: b });
          }
        }
      }
    }

    if (pool.length === 0) return [];

    const gemengd = _shuffle(pool);
    const gekozen = gemengd.slice(0, aantalOefeningen);

    // redeneren en koppel hebben geen emoji's nodig
    if (inzichtType === 'redeneren') {
      return gekozen.map((oef, i) => ({
        type:     'redeneren',
        // deeltal : deler = quotient  want  quotient × deler = deeltal
        deeltal:  oef.groepen * oef.groepGrootte,
        deler:    oef.groepGrootte,
        quotient: oef.groepen,
        sleutel:  `red-${oef.groepen}-${oef.groepGrootte}-${i}`,
      }));
    }

    if (inzichtType === 'koppel') {
      return gekozen.map((oef, i) => ({
        type:    'koppel',
        // factor1 × factor2 = product , dus product : factor2 = factor1
        factor1: oef.groepen,
        factor2: oef.groepGrootte,
        product: oef.groepen * oef.groepGrootte,
        sleutel: `kop-${oef.groepen}-${oef.groepGrootte}-${i}`,
      }));
    }

    // ── Eerlijk verdelen: 100-veld-variant ───────────────────
    if (inzichtType === 'verdelen-100veld') {
      return gekozen.map((oef, i) => ({
        type:          'verdelen-100veld',
        totaal:        oef.groepen * oef.groepGrootte,
        aantalGroepen: oef.groepen,
        perGroep:      oef.groepGrootte,
        sleutel:       `vh-${oef.groepen}-${oef.groepGrootte}-${i}`,
      }));
    }

    return gekozen.map((oef, i) => {
      const key = emojiSet === 'afwisselend'
        ? EMOJI_KEYS[i % EMOJI_KEYS.length]
        : (EMOJI_SETS[emojiSet] ? emojiSet : EMOJI_KEYS[0]);
      const set = EMOJI_SETS[key];

      if (inzichtType === 'delen-rest') {
        return {
          type:         'delen-rest',
          deeltal:      oef.deeltal,
          deler:        oef.deler,
          quotient:     oef.quotient,
          rest:         oef.rest,
          uitkomst:     oef.deeltal, // totaal aantal emoji's
          groepGrootte: oef.deler,   // voor emoji-rendering
          emoji:        set.emoji,
          emojiLabel:   set.label,
          sleutel:      `gr-${oef.deeltal}-${oef.deler}-${key}`,
        };
      }

      if (inzichtType === 'delen-aftrekking') {
        return {
          type: 'delen-aftrekking',
          groepen: oef.groepen,
          groepGrootte: oef.groepGrootte,
          uitkomst: oef.groepen * oef.groepGrootte,
          emoji: set.emoji,
          emojiLabel: set.label,
          sleutel: `gd-${oef.groepen}-${oef.groepGrootte}-${key}`,
        };
      }

      return {
        type: 'groepjes',
        groepen: oef.groepen,
        groepGrootte: oef.groepGrootte,
        uitkomst: oef.groepen * oef.groepGrootte,
        emoji: set.emoji,
        emojiLabel: set.label,
        sleutel: `gi-${oef.groepen}-${oef.groepGrootte}-${key}`,
      };
    });
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getEmojiSets() {
    return EMOJI_SETS;
  }

  return { genereer, getEmojiSets };
})();