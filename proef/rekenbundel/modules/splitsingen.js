/* ══════════════════════════════════════════════════════════════
   modules/splitsingen.js
   Oefenvormen:
     klein-splitshuis       : 1 huisje, 1 kamer leeg of dak leeg
     splitsbeen             : omgekeerde V, hokjes voor alle 3 waarden
     groot-splitshuis       : 1 huis met alle splitsingen gestapeld
     splitsbeen-bewerkingen : splitsbeen + 4 lege bewerkingen
     puntoefening           : 1 + ___ = 5  of  ___ + 3 = 5  (schrijflijn)
   ══════════════════════════════════════════════════════════════ */

const Splitsingen = (() => {

  function getTypes(splitsGetallen, splitsModus, niveau) {
    return ['Klein splitshuis', 'Splitsbeen', 'Groot splitshuis', 'Splitsbeen + bewerkingen', 'Puntoefening'];
  }

  // Alle paren a+b=n, a>=1, b>=1, inclusief omgekeerd, afwisselend l/r leeg
  function _grootSplitsParen(n) {
    const paren = [];
    for (let a = 1; a < n; a++) {
      // Afwisselend: even index → links leeg, oneven → rechts leeg
      if (paren.length % 2 === 0) {
        paren.push({ links: null, rechts: n - a }); // links invullen
      } else {
        paren.push({ links: a, rechts: null });      // rechts invullen
      }
    }
    return paren;
  }

  function _splits(n, metNul = true) {
  const paren = [];
  for (let a = 1; a < n; a++) {
    paren.push([a, n - a]);
  }

  // Voeg soms één nulsplit toe, maar niet overmatig
  if (metNul) {
    if (Math.random() < 0.4) {
      if (Math.random() < 0.5) paren.push([0, n]);
      else paren.push([n, 0]);
    }
  }

  return paren;
}

  function _getallen(niveau) {
    if (niveau <= 5)  return [3, 4, 5];
    if (niveau <= 10) return [3, 4, 5, 6, 7, 8, 9, 10];
    if (niveau <= 20) return [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    // Tot 100: alle getallen van 11 t/m 100
    return Array.from({ length: 90 }, (_, i) => i + 11);
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function genereer({ oefeningstypes, aantalOefeningen, niveau, splitsVariant = 'afwisselend', splitsGetallen = null, splitsModus = 'tot', brug = 'zonder' }) {
    const pool = (splitsModus === 'specifiek' && splitsGetallen?.length > 0)
      ? splitsGetallen
      : _getallen(niveau);

    const wilKlein       = (oefeningstypes || []).some(t => t.toLowerCase().includes('klein'));
    const wilBeen        = (oefeningstypes || []).some(t => t.toLowerCase().includes('been') && !t.toLowerCase().includes('bewerkingen'));
    const wilGroot       = (oefeningstypes || []).some(t => t.toLowerCase().includes('groot'));
    const wilBewerkingen = (oefeningstypes || []).some(t => t.toLowerCase().includes('bewerkingen'));
    const wilPunt        = (oefeningstypes || []).some(t => t.toLowerCase().includes('punt'));

    const oef = [];

    // ── Groot splitshuis: 1 huis per gekozen getal ──────────────
    if (wilGroot) {
      // Gebruik de meegegeven splitsGetallen (= de gekozen getallen via toggleGrootGetal)
      const grootPool = (splitsModus === 'specifiek' && splitsGetallen?.length > 0)
        ? [...splitsGetallen].filter(n => n >= 3 && n <= 10).sort((a, b) => a - b)
        : [3, 4, 5, 6, 7, 8, 9, 10];
      for (const n of grootPool) {
        const rijen = _grootSplitsParen(n);
        oef.push({
          type:   'groot-splitshuis',
          totaal: n,
          rijen,
          sleutel: `groot-${n}`,
          vraag:  `groot splitshuis ${n}`,
        });
      }
      return oef;
    }

    // ── Splitsbeen + bewerkingen ──────────────────────────────────
    // Totaal staat bovenaan, één been gegeven, kind vult ander been in.
    // Daarna 4 lege bewerkingen: a+b=, b+a=, n-a=, n-b=
    if (wilBewerkingen) {
      const gebruikt2 = new Set();
      const kandidaten2 = [];
      for (const n of _shuffle(pool)) {
        for (const [a, b] of _shuffle(_splits(n))) {
          kandidaten2.push({ totaal: n, links: a,    rechts: null, leeg: 'rechts' });
          kandidaten2.push({ totaal: n, links: null, rechts: b,    leeg: 'links'  });
        }
      }
      for (const k of _shuffle(kandidaten2)) {
        if (oef.length >= aantalOefeningen) break;
        const sleutel = `bew-${k.totaal}-${k.links}-${k.rechts}`;
        if (gebruikt2.has(sleutel)) continue;
        gebruikt2.add(sleutel);
        // Bepaal de bekende en onbekende waarden
        const bekend  = k.links !== null ? k.links  : k.rechts;
        const onbekend = k.totaal - bekend;
        oef.push({
          type:    'splitsbeen-bewerkingen',
          totaal:  k.totaal,
          links:   k.links,
          rechts:  k.rechts,
          leeg:    k.leeg,
          bekend,
          onbekend,
          sleutel,
          vraag:   'splitsbeen-bewerkingen',
        });
      }
      return oef;
    }
    // ── Puntoefeningen ────────────────────────────────────────
    if (wilPunt) {
      const gebruikt2  = new Set();
      const kandidaten2 = [];
      for (const n of _shuffle(pool)) {
        for (const [a, b] of _shuffle(_splits(n))) {
          const heeftBrug = (a % 10) + (b % 10) >= 10;
          if (brug === 'met-brug'     && !heeftBrug) continue;
          if (brug === 'naar-tiental' && !heeftBrug) continue;
          if (brug === 'zonder'       &&  heeftBrug) continue;

          if (splitsVariant === 'afwisselend' || splitsVariant === 'gemengd') {
            kandidaten2.push({ n, a, b, vorm: 'plus-r', tekst: [a, '+', null, '=', n] });
            kandidaten2.push({ n, a, b, vorm: 'plus-l', tekst: [null, '+', b, '=', n] });
          }
          if (splitsVariant === 'dak-leeg' || splitsVariant === 'gemengd') {
            kandidaten2.push({ n, a, b, vorm: 'min-res', tekst: [n, '-', a, '=', null] });
            kandidaten2.push({ n, a, b, vorm: 'min-afw', tekst: [n, '-', null, '=', b] });
          }
        }
      }
      for (const k of _shuffle(kandidaten2)) {
        if (oef.length >= aantalOefeningen) break;
        const sleutel = `punt-${k.vorm}-${k.n}-${k.a}-${k.b}`;
        if (gebruikt2.has(sleutel)) continue;
        gebruikt2.add(sleutel);
        oef.push({ type: 'puntoefening', tekst: k.tekst, sleutel, vraag: 'punt' });
      }
      return oef;
    }

    // ── Klein splitshuis en/of splitsbeen ────────────────────
    const gebruikt  = new Set();
    const kandidaten = [];

    for (const n of _shuffle(pool)) {
      const paren = _splits(n);
      for (const [a, b] of _shuffle(paren)) {
        if (wilKlein) {
          if (splitsVariant === 'afwisselend' || splitsVariant === 'gemengd') {
            kandidaten.push({ vorm: 'huis', totaal: n,    links: null, rechts: b,   leeg: 'links'  });
            kandidaten.push({ vorm: 'huis', totaal: n,    links: a,    rechts: null, leeg: 'rechts' });
          }
          if (splitsVariant === 'dak-leeg' || splitsVariant === 'gemengd') {
            kandidaten.push({ vorm: 'huis', totaal: null, links: a,    rechts: b,   leeg: 'dak'    });
          }
        }
        if (wilBeen) {
          if (splitsVariant === 'afwisselend' || splitsVariant === 'gemengd') {
            kandidaten.push({ vorm: 'been', totaal: n,    links: null, rechts: b,   leeg: 'links'  });
            kandidaten.push({ vorm: 'been', totaal: n,    links: a,    rechts: null, leeg: 'rechts' });
          }
          if (splitsVariant === 'dak-leeg' || splitsVariant === 'gemengd') {
            kandidaten.push({ vorm: 'been', totaal: null, links: a,    rechts: b,   leeg: 'top'    });
          }
        }
      }
    }

    const vormen = [];
    if (wilKlein) vormen.push('huis');
    if (wilBeen)  vormen.push('been');

    const perVorm    = {};
    const gebrPerVorm = {};
    vormen.forEach(v => { perVorm[v] = _shuffle(kandidaten.filter(k => k.vorm === v)); gebrPerVorm[v] = new Set(); });

    let idx = 0, pogingen = 0;
    while (oef.length < aantalOefeningen && pogingen < aantalOefeningen * 8) {
      pogingen++;
      const vorm  = vormen[idx % vormen.length];
      const pool2 = perVorm[vorm];
      const gebr  = gebrPerVorm[vorm];
      const k = pool2.find(k => !gebr.has(`${k.totaal}-${k.links}-${k.rechts}-${k.leeg}`));
      if (k) {
        const sleutel = `${k.vorm}-${k.totaal}-${k.links}-${k.rechts}-${k.leeg}`;
        if (!gebruikt.has(sleutel)) {
          gebruikt.add(sleutel);
          gebr.add(`${k.totaal}-${k.links}-${k.rechts}-${k.leeg}`);
          oef.push({
            type:   k.vorm === 'huis' ? 'klein-splitshuis' : 'splitsbeen',
            totaal: k.totaal, links: k.links, rechts: k.rechts, leeg: k.leeg,
            sleutel, vraag: k.vorm,
          });
        }
      }
      idx++;
    }

    return oef;
  }

  return { genereer, getTypes };
})();
