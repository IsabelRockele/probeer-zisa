/* ══════════════════════════════════════════════════════════════
   modules/cijferen.js
   Elk oefening-object heeft:
     sleutel, g1, g2, operator ('+','−','×','÷'), result,
     showH, showD,
     D1,H1,T1,E1, D2,H2,T2,E2
   ══════════════════════════════════════════════════════════════ */

const Cijferen = (() => {

  function _rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Splits getal in D, H, T, E kolommen
  function _splitsDHTE(g, showD, showH) {
    const D = showD ? Math.floor(g / 1000)        : null;
    const H = showH ? Math.floor((g % 1000) / 100) : null;
    const T = Math.floor((g % 100) / 10);
    const E = g % 10;
    return {
      D: D !== null ? String(D) : '',
      H: H !== null ? String(H) : '',
      T: String(T),
      E: String(E),
    };
  }

  function _heeftBrug(g1, g2, opType, bereik) {
    const e1 = g1 % 10,                    e2 = g2 % 10;
    const t1 = Math.floor(g1 / 10) % 10,   t2 = Math.floor(g2 / 10) % 10;
    const h1 = Math.floor(g1 / 100) % 10,  h2 = Math.floor(g2 / 100) % 10;
    if (opType === 'optellen') {
      if (e1 + e2 >= 10) return true;
      if (bereik >= 1000  && t1 + t2 + Math.floor((e1+e2)/10) >= 10) return true;
      if (bereik >= 10000 && h1 + h2 + Math.floor((t1+t2+Math.floor((e1+e2)/10))/10) >= 10) return true;
      return false;
    } else {
      if (e1 < e2) return true;
      if (bereik >= 1000  && t1 < t2) return true;
      if (bereik >= 10000 && h1 < h2) return true;
      return false;
    }
  }

  // Tel het aantal bruggen voor "meer dan één brug" filter
  function _aantalBruggen(g1, g2, opType) {
    let count = 0;
    const e1 = g1 % 10,                   e2 = g2 % 10;
    const t1 = Math.floor(g1/10) % 10,    t2 = Math.floor(g2/10) % 10;
    const h1 = Math.floor(g1/100) % 10,   h2 = Math.floor(g2/100) % 10;
    if (opType === 'optellen') {
      const onthoudE = Math.floor((e1+e2)/10);
      const onthoudT = Math.floor((t1+t2+onthoudE)/10);
      if (e1+e2 >= 10) count++;
      if (t1+t2+onthoudE >= 10) count++;
      if (h1+h2+onthoudT >= 10) count++;
    } else {
      if (e1 < e2) count++;
      if (t1 - (e1<e2?1:0) < t2) count++;
      if (h1 - (t1-(e1<e2?1:0)<t2?1:0) < h2) count++;
    }
    return count;
  }

  function _genPlusMin(bewerking, bereik, brug, aantalOefeningen) {
    const oefeningen = [], gebruikt = new Set();
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < 5000) {
      pogingen++;
      const opType = bewerking === 'gemengd'
        ? (Math.random() < 0.5 ? 'optellen' : 'aftrekken')
        : bewerking;

      // Bij brug=beide: willen we ~50% met brug en ~50% zonder brug.
      // We bepalen per oefening of we een brug-oefening "willen" of niet,
      // afhankelijk van hoeveel we er al hebben.
      let _wilBrug = null;
      if (brug === 'beide') {
        const reedsMetBrug    = oefeningen.filter(o => _heeftBrug(o.g1, o.g2,
          o.operator === '+' ? 'optellen' : 'aftrekken', bereik)).length;
        const reedsZonderBrug = oefeningen.length - reedsMetBrug;
        const doel = Math.ceil(aantalOefeningen / 2);
        // Als met-brug ondervertegenwoordigd is, eisen we met brug.
        // Als zonder-brug ondervertegenwoordigd is, eisen we zonder.
        // Anders: vrije keuze.
        if      (reedsMetBrug    < doel && reedsZonderBrug >= doel) _wilBrug = true;
        else if (reedsZonderBrug < doel && reedsMetBrug    >= doel) _wilBrug = false;
        else _wilBrug = null;
      }

      // Genereer getallen op basis van bereik
      let g1, g2;
      if (bereik <= 100) {
        g1 = _rnd(10, 99);  g2 = _rnd(1, 49);
      } else if (bereik <= 1000) {
        g1 = _rnd(100, 999); g2 = _rnd(10, 499);
      } else {
        // Tot 10.000: minstens één getal heeft D-kolom
        g1 = _rnd(1000, 9999); g2 = _rnd(100, 4999);
      }

      if (opType === 'aftrekken') {
        if (g1 < g2) [g1, g2] = [g2, g1];
        if (g1 === g2) { g1++; continue; }
      }

      const result = opType === 'optellen' ? g1 + g2 : g1 - g2;
      if (result < 0) continue;
      if (bereik <= 100  && (g1 > 99  || result > 100))  continue;
      if (bereik <= 1000 && opType === 'optellen' && result > 999)  continue;
      if (bereik <= 10000 && opType === 'optellen' && result > 9999) continue;

      // Brug-over-nul: aftrekken waarbij een kolom 0 is in g1
      // bv. 3004 - 567: je moet 'lenen' door een nul heen
      const isBrugOverNul = opType === 'aftrekken' && (() => {
        const t1 = Math.floor(g1/10)%10, h1 = Math.floor(g1/100)%10;
        // Er is een nul in T of H van g1, én er is een brug nodig
        return _heeftBrug(g1, g2, 'aftrekken', bereik) &&
               (t1 === 0 || h1 === 0);
      })();

      // Brugfilter
      if (brug === 'zonder' && _heeftBrug(g1, g2, opType, bereik)) continue;
      if (brug === 'met_een') {
        if (!_heeftBrug(g1, g2, opType, bereik)) continue;
        if (_aantalBruggen(g1, g2, opType) !== 1) continue;
      }
      if (brug === 'meer_dan_een') {
        if (_aantalBruggen(g1, g2, opType) < 2) continue;
      }
      if (brug === 'met' && !_heeftBrug(g1, g2, opType, bereik)) continue;
      if (brug === 'over_nul' && !isBrugOverNul) continue;

      // Brug=beide met stratificatie-keuze
      if (brug === 'beide' && _wilBrug !== null) {
        const heeftBrug = _heeftBrug(g1, g2, opType, bereik);
        if (_wilBrug && !heeftBrug) continue;  // we wilden brug maar oefening heeft er geen
        if (!_wilBrug && heeftBrug) continue;  // we wilden zonder maar oefening heeft brug
      }

      const sleutel = `${g1}${opType}${g2}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);

      const operator    = opType === 'optellen' ? '+' : '\u2212';
      const showD       = bereik >= 10000 || g1 >= 1000 || g2 >= 1000 || result >= 1000;
      const showH       = showD || bereik >= 1000 || g1 >= 100 || g2 >= 100 || result >= 100;
      const dhte1       = _splitsDHTE(g1, showD, showH);
      const dhte2       = _splitsDHTE(g2, showD, showH);

      oefeningen.push({
        sleutel, g1, g2, operator, result,
        showD, showH,
        D1: dhte1.D, H1: dhte1.H, T1: dhte1.T, E1: dhte1.E,
        D2: dhte2.D, H2: dhte2.H, T2: dhte2.T, E2: dhte2.E,
      });
    }
    return oefeningen;
  }

  /* ── Vermenigvuldigen ────────────────────────────────────── */
  function _vermBrugType(groot, tafel) {
    const eenheden   = groot % 10;
    const tientallen = Math.floor(groot / 10) % 10;
    const prodE      = tafel * eenheden;
    const onthoudE   = Math.floor(prodE / 10);
    const prodT      = tafel * tientallen + onthoudE;
    return { brugE: prodE >= 10, brugT: prodT >= 10 };
  }

  function _genVermenigvuldigen(vermType, vermBrug, aantalOefeningen) {
    const oefeningen = [], gebruikt = new Set();
    let pogingen = 0;
    while (oefeningen.length < aantalOefeningen && pogingen < 5000) {
      pogingen++;
      const tafel = _rnd(2, 9);
      const type  = vermType === 'beide'
        ? (Math.random() < 0.5 ? 'TxE' : 'TExE')
        : vermType;
      const groot = type === 'TxE'
        ? _rnd(1, 9) * 10
        : _rnd(1, 9) * 10 + _rnd(1, 9);
      const result = tafel * groot;
      if (result > 999) continue;
      const { brugE, brugT } = _vermBrugType(groot, tafel);
      if (vermBrug === 'zonder' && (brugE || brugT))  continue;
      if (vermBrug === 'E'      && (!brugE || brugT))  continue;
      if (vermBrug === 'T'      && (brugE  || !brugT)) continue;
      if (vermBrug === 'ET'     && (!brugE || !brugT)) continue;
      if (vermBrug === 'met'    && !brugE && !brugT)   continue;
      const sleutel = `${groot}x${tafel}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      const showD  = false;
      const showH  = result >= 100;
      const dhte1  = _splitsDHTE(groot,  showD, showH);
      const dhte2  = _splitsDHTE(tafel,  showD, showH);
      oefeningen.push({
        sleutel, g1: groot, g2: tafel,
        operator: '\u00d7', result, showD, showH,
        D1: dhte1.D, H1: dhte1.H, T1: dhte1.T, E1: dhte1.E,
        D2: dhte2.D, H2: dhte2.H, T2: dhte2.T, E2: dhte2.E,
      });
    }
    return oefeningen;
  }

  /* ── Staartdeling TE ÷ E of HTE ÷ E ───────────────────────── */
  function _genDelen(delers, metRest, aantalOefeningen, deelType) {
    const isHTE = (deelType === 'HTE:E');
    const oefeningen = [], gebruikt = new Set();
    let pogingen = 0;
    while (oefeningen.length < aantalOefeningen && pogingen < 5000) {
      pogingen++;
      const deler   = delers[Math.floor(Math.random() * delers.length)];

      if (isHTE) {
        // ── HTE ÷ E ──────────────────────────────────────────
        // Twee scenarios:
        //  A) H ≥ deler  → quotient 3-cijferig, schema heeft 3 aftrek-stappen
        //     (maar we tonen visueel maar 2 stappen in het compacte schema:
        //      rij 2 is aftrek1 onder H; rij 3 = restH ín H-kolom + T; etc.)
        //  B) H < deler  → quotient 2-cijferig, eerste stap neemt H+T samen.
        //     Boogje boven H+T. Rij 2 = aftrek van (H*10+T) onder H+T.
        const deeltal = _rnd(100, 999);
        if (deeltal < deler * 10) continue; // moet minstens 2-cijferig quotient geven
        const H = Math.floor(deeltal / 100);
        const T = Math.floor((deeltal % 100) / 10);
        const E = deeltal % 10;

        const toonBoog = (H < deler);

        let quot1, rest1, quot2, rest2, quot3, rest3;
        let aftrek1, aftrek2, aftrek3;
        let quotH, quotT, quotE;
        let aftrekH, aftrekT, aftrekE;
        let restH, restT, restE;
        let nieuwT, nieuwE;

        if (toonBoog) {
          // Scenario B: H+T samen als eerste stap
          const HT = H * 10 + T;
          quot1 = Math.floor(HT / deler);
          if (quot1 === 0) continue;
          rest1 = HT % deler;
          // quot1 staat in T-positie van quotient
          quotH = 0; quotT = quot1; restH = 0;
          aftrekH = 0; // niet gebruikt
          aftrekT = quot1 * deler; // = "aftrek1" (uitgelijnd op T)
          nieuwT = HT; restT = rest1;
          // Stap 2: (restT*10 + E) ÷ deler
          nieuwE = restT * 10 + E;
          quotE = Math.floor(nieuwE / deler);
          restE = nieuwE % deler;
          aftrekE = quotE * deler;
          if (!metRest && restE !== 0) continue;
        } else {
          // Scenario A: standaard H-T-E
          quotH = Math.floor(H / deler);
          if (quotH === 0) continue;
          restH = H % deler;
          aftrekH = quotH * deler;
          nieuwT = restH * 10 + T;
          quotT = Math.floor(nieuwT / deler);
          restT = nieuwT % deler;
          aftrekT = quotT * deler;
          nieuwE = restT * 10 + E;
          quotE = Math.floor(nieuwE / deler);
          restE = nieuwE % deler;
          aftrekE = quotE * deler;
          if (!metRest && restE !== 0) continue;
        }

        const quotiënt = quotH * 100 + quotT * 10 + quotE;
        if (quotiënt < 10) continue;

        const sleutel = `${deeltal}:${deler}`;
        if (gebruikt.has(sleutel)) continue;
        gebruikt.add(sleutel);

        oefeningen.push({
          sleutel, g1: deeltal, g2: deler,
          operator: '\u00f7', result: quotiënt,
          deeltal, deler,
          deelType: 'HTE:E',
          // Cijfers van het deeltal
          H, T, E,
          // Boogje tonen als H < deler (we moeten H+T samen nemen)
          toonBoog,
          // Quotient-cijfers per positie
          quotH, quotT, quotE,
          // Aftrek-getallen en tussenresten
          aftrekH, aftrekT, aftrekE,
          restH, restT, restE,
          nieuwT, nieuwE,
          quotiënt,
          // Dit deeltal heeft een H, dus showH voor het cijferschema
          showD: false, showH: true,
          D1:'', H1: String(H), T1: String(T), E1: String(E),
          D2:'', H2:'',         T2:'',         E2: String(deler),
        });
      } else {
        // ── TE ÷ E (zoals voorheen) ──────────────────────────
        const deeltal = _rnd(10, 99);
        if (deeltal < deler) continue;
        const T = Math.floor(deeltal / 10), E = deeltal % 10;
        if (!metRest && T < deler) continue;
        const quotT  = Math.floor(T / deler);
        if (quotT === 0) continue;
        const restT  = T % deler;
        const nieuwE = restT * 10 + E;
        const quotE  = Math.floor(nieuwE / deler);
        const restE  = nieuwE % deler;
        if (!metRest && restE !== 0) continue;
        if (quotE === 0 && restE === 0) continue;
        const quotiënt = quotT * 10 + quotE;
        if (quotiënt < 10) continue;
        const sleutel = `${deeltal}:${deler}`;
        if (gebruikt.has(sleutel)) continue;
        gebruikt.add(sleutel);
        oefeningen.push({
          sleutel, g1: deeltal, g2: deler,
          operator: '\u00f7', result: quotiënt,
          deeltal, deler,
          deelType: 'TE:E',
          T, E, quotT, restT,
          nieuwE, quotE, restE, quotiënt,
          aftrekT: quotT * deler, aftrekE: quotE * deler,
          showD: false, showH: false,
          D1:'', H1:'', T1: String(T), E1: String(E),
          D2:'', H2:'', T2:'',         E2: String(deler),
        });
      }
    }
    return oefeningen;
  }

  /* ── Kommagetallen E,t ────────────────────────────────────── */
  function _genKomma(kommaType, kommaBrug, aantalOefeningen) {
    const oefeningen = [], gebruikt = new Set();
    let pogingen = 0;
    while (oefeningen.length < aantalOefeningen && pogingen < 5000) {
      pogingen++;
      const a = _rnd(11, 89), b = _rnd(11, 89);
      const isPlus = kommaType === 'Et_plus_Et' ||
                     (kommaType === 'Et_gemengd' && Math.random() < 0.5);
      let g1t, g2t, rest;
      if (isPlus) {
        g1t = a; g2t = b; rest = g1t + g2t;
        if (rest > 199) continue;
      } else {
        g1t = Math.max(a,b); g2t = Math.min(a,b);
        rest = g1t - g2t;
        if (rest < 0) continue;
      }
      const g1E = Math.floor(g1t/10), g1t_ = g1t%10;
      const g2E = Math.floor(g2t/10), g2t_ = g2t%10;
      // Brug in t-kolom (tienden): t1+t2>=10 of t1<t2
      const brugT = isPlus ? (g1t_+g2t_)>=10 : g1t_<g2t_;
      // Brug in E-kolom (eenheden): g1E+g2E+onthoudT >= 10
      const onthoudT = isPlus && brugT ? 1 : 0;
      const brugE = isPlus
        ? (g1E + g2E + onthoudT >= 10)
        : (g1E - (brugT ? 1 : 0) < g2E);
      const heeftBrug = brugT || brugE;
      if (kommaBrug === 'met'    && !heeftBrug) continue;
      if (kommaBrug === 'zonder' &&  heeftBrug) continue;
      const op      = isPlus ? '+' : '\u2212';
      const sleutel = g1t + op + g2t;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      const restE = Math.floor(rest/10), restt = rest%10;
      oefeningen.push({
        sleutel, isKomma: true, operator: op,
        g1t, g2t, rest,
        g1E, g1t_, g2E, g2t_, restE, restt, heeftBrug,
        g1Str: g1E+','+g1t_, g2Str: g2E+','+g2t_, restStr: restE+','+restt,
        g1: g1t, g2: g2t, result: rest,
        showD: false, showH: false,
        D1:'', H1:'', T1: String(g1E), E1: String(g1t_),
        D2:'', H2:'', T2: String(g2E), E2: String(g2t_),
      });
    }
    return oefeningen;
  }

  function genereer({ bewerking, bereik, brug, aantalOefeningen, tafels,
                      vermType, vermBrug, deelType, metRest,
                      kommaType, kommaBrug }) {
    bereik           = bereik           || 100;
    aantalOefeningen = aantalOefeningen || 12;
    const actieveTafels = (tafels && tafels.length) ? tafels : [2,3,4,5];
    if (bewerking === 'vermenigvuldigen')
      return _genVermenigvuldigen(vermType||'TxE', vermBrug||'zonder', aantalOefeningen);
    if (bewerking === 'komma')
      return _genKomma(kommaType||'Et_plus_Et', kommaBrug||'beide', aantalOefeningen);
    if (bewerking === 'delen')
      return _genDelen(actieveTafels, metRest||false, aantalOefeningen, deelType||'TE:E');
    return _genPlusMin(bewerking, bereik, brug||'beide', aantalOefeningen);
  }

  return { genereer };
})();