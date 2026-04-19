/* ══════════════════════════════════════════════════════════════
   rekentaal.js  —  v4
   ══════════════════════════════════════════════════════════════ */

var REKENTAAL_ZINNEN = {
  optellen: [
    { id:'opt1', label:'De som van … en …',            template:'De som van {a} en {b} is {?}.' },
    { id:'opt2', label:'… meer dan …',                 template:'{b} meer dan {a} is {?}.' },
    { id:'opt3', label:'Tel … bij … op',               template:'Tel {b} bij {a} op. {?}' },
    { id:'opt4', label:'Doe … bij … om … te krijgen',  template:'Doe {b} bij {a} om {?} te krijgen.' },
    { id:'opt5', label:'Vermeerder … met …',           template:'Vermeerder {a} met {b}. {?}' },
    { id:'opt6', label:'… vermeerderd met … is …',     template:'{a} vermeerderd met {b} is {?}.' },
  ],
  aftrekken: [
    { id:'aft1', label:'Het verschil van … en …',      template:'Het verschil van {a} en {b} is {?}.' },
    { id:'aft2', label:'… minder dan …',               template:'{b} minder dan {a} is {?}.' },
    { id:'aft3', label:'Trek … van … af',              template:'Trek {b} van {a} af. {?}' },
    { id:'aft4', label:'Verminder … met …',            template:'Verminder {a} met {b}. {?}' },
    { id:'aft5', label:'… verminderd met … is …',      template:'{a} verminderd met {b} is {?}.' },
  ],
  vermenigvuldigen: [
    { id:'verm1', label:'Het product van … en …',      template:'Het product van {P} en {Q} is {?}.' },
    { id:'verm2', label:'Vermenigvuldig … met …',      template:'Vermenigvuldig {P} met {Q}. {?}' },
  ],
  delen: [
    { id:'deel1', label:'Het quotiënt van … en …',     template:'Het quotiënt van {a} en {b} is {?}.' },
    { id:'deel2', label:'… gedeeld door … is …',       template:'{a} gedeeld door {b} is {?}.' },
  ],
  dubbel_helft_kwart: [
    { id:'dhk1', label:'Het dubbel van … is …',        template:'Het dubbel van {a} is {?}.' },
    { id:'dhk2', label:'… is het dubbel van …',        template:'{?} is het dubbel van {a}.' },
    { id:'dhk3', label:'De helft van … is …',          template:'De helft van {a} is {?}.' },
    { id:'dhk4', label:'… is de helft van …',          template:'{?} is de helft van {a}.' },
    { id:'dhk5', label:'Een kwart van … is …',         template:'Een kwart van {a} is {?}.' },
  ],
};

/* ── Getalgenerator ───────────────────────────────────────── */
function _rtRand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _rtGenereerGetallen(cat, templateId, niveau, brug, tafels, dhkMax, tafelPositie) {
  var a, b, poging = 0;

  if (cat === 'optellen') {
    do {
      poging++;
      if (niveau <= 20)       { b = _rtRand(1,9);   a = _rtRand(b, Math.min(19-b,18)); }
      else if (niveau <= 100) { b = _rtRand(1,49);  a = _rtRand(b, 99-b); }
      else                    { b = _rtRand(1,499); a = _rtRand(b, 999-b); }
      if (a < b) { var t=a; a=b; b=t; }
      // Brug-check: eenheden EN tientallen (voor tot 1000)
      var eenBrug = (a%10) + (b%10) >= 10;
      var tienBrug = niveau > 100 ? (Math.floor(a/10)%10) + (Math.floor(b/10)%10) >= 10 : false;
      var heeftBrug = eenBrug || tienBrug;
      if (brug==='met'    &&  heeftBrug) break;
      if (brug==='zonder' && !heeftBrug) break;
      if (brug==='gemengd')              break;
    } while (poging < 80);
    return { a:a, b:b };
  }

  if (cat === 'aftrekken') {
    do {
      poging++;
      if (niveau <= 20)       { a = _rtRand(2,20);   b = _rtRand(1,a-1); }
      else if (niveau <= 100) { a = _rtRand(11,100);  b = _rtRand(1,a-1); }
      else                    { a = _rtRand(11,1000); b = _rtRand(1,a-1); }
      // Brug-check: eenheden EN tientallen (voor tot 1000)
      var eenBrug2  = (a%10) < (b%10);
      var tienBrug2 = niveau > 100 ? (Math.floor(a/10)%10) < (Math.floor(b/10)%10) : false;
      var heeftBrug2 = eenBrug2 || tienBrug2;
      if (brug==='met'    &&  heeftBrug2) break;
      if (brug==='zonder' && !heeftBrug2) break;
      if (brug==='gemengd')               break;
    } while (poging < 80);
    return { a:a, b:b };
  }

  if (cat === 'vermenigvuldigen') {
    var tafelsArr = (tafels && tafels.length) ? tafels : [2];
    var tafel = tafelsArr[_rtRand(0, tafelsArr.length-1)];
    var factor = _rtRand(1, 10);
    // Bepaal positie: P = eerste getal in zin, Q = tweede
    var pos = tafelPositie || 'vooraan';
    if (pos === 'beide') pos = _rtRand(0,1) === 0 ? 'vooraan' : 'achteraan';
    // vooraan: tafel × factor (2 × 5), achteraan: factor × tafel (5 × 2)
    var P = pos === 'vooraan' ? tafel : factor;
    var Q = pos === 'vooraan' ? factor : tafel;
    return { a:tafel, b:factor, P:P, Q:Q };
  }

  if (cat === 'delen') {
    var tafelsArr2 = (tafels && tafels.length) ? tafels : [2];
    var tafel2 = tafelsArr2[_rtRand(0, tafelsArr2.length-1)];
    var f = _rtRand(1, 10);
    return { a:tafel2*f, b:tafel2 };
  }

  if (cat === 'dubbel_helft_kwart') {
    var max = dhkMax || 20;
    if (templateId === 'dhk1' || templateId === 'dhk2') {
      var aMax = Math.floor(max/2);
      return { a: _rtRand(1, aMax) };
    }
    if (templateId === 'dhk3' || templateId === 'dhk4') {
      var aMax2 = max % 2 === 0 ? max : max-1;
      return { a: _rtRand(1, Math.floor(aMax2/2)) * 2 };
    }
    if (templateId === 'dhk5') {
      return { a: _rtRand(1, Math.floor(max/4)) * 4 };
    }
  }

  return { a:1, b:1 };
}

/* ── RekentaalGenerator ───────────────────────────────────── */
var RekentaalGenerator = (() => {
  function genereer(cfg) {
    var categorieën = cfg.categorieën || {};
    var niveau = cfg.niveau || 20;
    var brug = cfg.brug || 'zonder';
    var tafels = cfg.tafels || [2];
    var dhkMax = cfg.dhkMax || 20;
    var aantalOefeningen = cfg.aantalOefeningen || 12;
    var tafelPositie = cfg.tafelPositie || 'vooraan';

    var pool = [];
    var cats = Object.keys(categorieën);
    for (var ci = 0; ci < cats.length; ci++) {
      var cat = cats[ci];
      var ids = categorieën[cat] || [];
      for (var ii = 0; ii < ids.length; ii++) {
        var id = ids[ii];
        var zinnen = REKENTAAL_ZINNEN[cat] || [];
        var tmpl = null;
        for (var zi = 0; zi < zinnen.length; zi++) {
          if (zinnen[zi].id === id) { tmpl = zinnen[zi]; break; }
        }
        if (tmpl) pool.push({ cat:cat, tmpl:tmpl });
      }
    }
    if (!pool.length) return [];

    var oefeningen = [];
    var gebruikt = {};
    var poging = 0;

    while (oefeningen.length < aantalOefeningen && poging < aantalOefeningen*15) {
      poging++;
      var keuze = pool[_rtRand(0, pool.length-1)];
      var cat2 = keuze.cat;
      var tmpl2 = keuze.tmpl;
      var g = _rtGenereerGetallen(cat2, tmpl2.id, niveau, brug, tafels, dhkMax, tafelPositie);
      var a = g.a, b = g.b;
      var P = g.P !== undefined ? g.P : a;
      var Q = g.Q !== undefined ? g.Q : b;

      var antwoord;
      if      (cat2==='optellen')         antwoord = a + b;
      else if (cat2==='aftrekken')        antwoord = a - b;
      else if (cat2==='vermenigvuldigen') antwoord = a * b;
      else if (cat2==='delen')            antwoord = a / b;
      else if (cat2==='dubbel_helft_kwart') {
        if      (tmpl2.id==='dhk1') antwoord = a*2;
        else if (tmpl2.id==='dhk2') antwoord = a*2;
        else if (tmpl2.id==='dhk3') antwoord = a/2;
        else if (tmpl2.id==='dhk4') antwoord = a/2;
        else if (tmpl2.id==='dhk5') antwoord = a/4;
      }

      if (!Number.isInteger(antwoord) || antwoord <= 0) continue;
      // Sleutel = cat + getallen (zelfde getallen mogen wel met andere zin)
      var sleutel = tmpl2.id+'-'+a+'-'+(b||'');
      if (gebruikt[sleutel]) continue;
      gebruikt[sleutel] = true;

      oefeningen.push({
        sleutel:sleutel, cat:cat2, templateId:tmpl2.id,
        template:tmpl2.template, a:a, b:b, P:P, Q:Q, antwoord:antwoord
      });
    }
    return oefeningen;
  }
  return { genereer:genereer };
})();

/* ── RekentaalModule ──────────────────────────────────────── */
var RekentaalModule = (() => {

  function _toast(msg, kleur) {
    if (window.App && typeof App.toonToast === 'function') App.toonToast(msg, kleur || '#1A3A5C');
    else console.log('[Rekentaal]', msg);
  }

  function selecteerNiveau(n, el) {
    document.querySelectorAll('[name="rt-niveau"]').forEach(function(r) {
      r.closest('.radio-chip').classList.remove('geselecteerd');
    });
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerBrug(b, el) {
    document.querySelectorAll('[name="rt-brug"]').forEach(function(r) {
      r.closest('.radio-chip').classList.remove('geselecteerd');
    });
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerTafelPositie(v, el) {
    document.querySelectorAll('[name="rt-tafel-positie"]').forEach(function(r) {
      r.closest('.radio-chip').classList.remove('geselecteerd');
    });
    if (el) el.classList.add('geselecteerd');
  }

  function toggleTafel(el, tafel) {
    el.classList.toggle('geselecteerd');
    var box = el.querySelector('.vink-box');
    if (box) box.textContent = el.classList.contains('geselecteerd') ? '✓' : '';
  }

  function selecteerDhkMax(n, el) {
    document.querySelectorAll('[name="rt-dhk-max"]').forEach(function(r) {
      r.closest('.radio-chip').classList.remove('geselecteerd');
    });
    if (el) el.classList.add('geselecteerd');
  }

  function toggleCategorie(cat) {
    var zinnen = REKENTAAL_ZINNEN[cat] || [];
    var alleGeselecteerd = zinnen.every(function(z) {
      var chip = document.querySelector('[data-rt-zin="'+cat+'-'+z.id+'"]');
      return chip && chip.classList.contains('geselecteerd');
    });
    zinnen.forEach(function(z) {
      var chip = document.querySelector('[data-rt-zin="'+cat+'-'+z.id+'"]');
      if (!chip) return;
      if (alleGeselecteerd) chip.classList.remove('geselecteerd');
      else chip.classList.add('geselecteerd');
    });
    _updateCatBtn(cat);
    _updateConditioneel();
  }

  function toggleZin(cat, id) {
    var chip = document.querySelector('[data-rt-zin="'+cat+'-'+id+'"]');
    if (chip) chip.classList.toggle('geselecteerd');
    _updateCatBtn(cat);
    _updateConditioneel();
  }

  function _updateCatBtn(cat) {
    var zinnen = REKENTAAL_ZINNEN[cat] || [];
    var aantalSel = zinnen.filter(function(z) {
      var chip = document.querySelector('[data-rt-zin="'+cat+'-'+z.id+'"]');
      return chip && chip.classList.contains('geselecteerd');
    }).length;
    var btn = document.querySelector('[data-rt-cat="'+cat+'"]');
    if (!btn) return;
    btn.classList.toggle('geselecteerd', aantalSel > 0);
    var vink = btn.querySelector('.rt-cat-vink');
    if (vink) vink.textContent = aantalSel===zinnen.length ? '✓' : (aantalSel>0 ? '~' : '');
  }

  function _updateConditioneel() {
    var heeftVD = ['vermenigvuldigen','delen'].some(function(cat) {
      return (REKENTAAL_ZINNEN[cat]||[]).some(function(z) {
        var chip = document.querySelector('[data-rt-zin="'+cat+'-'+z.id+'"]');
        return chip && chip.classList.contains('geselecteerd');
      });
    });
    var heeftDHK = (REKENTAAL_ZINNEN['dubbel_helft_kwart']||[]).some(function(z) {
      var chip = document.querySelector('[data-rt-zin="dubbel_helft_kwart-'+z.id+'"]');
      return chip && chip.classList.contains('geselecteerd');
    });
    var kt = document.getElementById('rt-kaart-tafels');
    var kp = document.getElementById('rt-kaart-tafel-positie');
    var kd = document.getElementById('rt-kaart-dhk-max');
    if (kt) kt.style.display = heeftVD ? 'block' : 'none';
    if (kp) kp.style.display = heeftVD ? 'block' : 'none';
    if (kd) kd.style.display = heeftDHK ? 'block' : 'none';
  }

  function voegBlokToe() {
    var geselecteerd = {};
    document.querySelectorAll('[data-rt-zin].geselecteerd').forEach(function(chip) {
      var parts = chip.dataset.rtZin.split('-');
      var id = parts.pop();
      var cat = parts.join('-');
      if (!geselecteerd[cat]) geselecteerd[cat] = [];
      if (geselecteerd[cat].indexOf(id) === -1) geselecteerd[cat].push(id);
    });

    if (!Object.keys(geselecteerd).length) {
      _toast('Selecteer minstens één zin.', '#E74C3C');
      return;
    }

    var niveauEl = document.querySelector('[name="rt-niveau"]:checked');
    var brugEl   = document.querySelector('[name="rt-brug"]:checked');
    var aantalEl = document.getElementById('rt-aantal');
    var zinEl    = document.getElementById('rt-opdrachtzin');
    var dhkMaxEl = document.querySelector('[name="rt-dhk-max"]:checked');
    var posEl    = document.querySelector('[name="rt-tafel-positie"]:checked');

    var niveau       = parseInt(niveauEl ? niveauEl.value : 20);
    var brug         = brugEl ? brugEl.value : 'zonder';
    var aantal       = parseInt(aantalEl ? aantalEl.value : 12);
    var zin          = zinEl ? (zinEl.value.trim() || 'Zet om in een bewerking en reken uit.') : 'Zet om in een bewerking en reken uit.';
    var dhkMax       = parseInt(dhkMaxEl ? dhkMaxEl.value : 20);
    var tafelPositie = posEl ? posEl.value : 'vooraan';

    var tafels = [];
    document.querySelectorAll('#rt-kaart-tafels .vink-chip.geselecteerd').forEach(function(l) {
      var t = parseInt(l.dataset.tafel);
      if (t && !isNaN(t)) tafels.push(t);
    });
    if (!tafels.length) tafels.push(2);

    var oefeningen = RekentaalGenerator.genereer({
      categorieën:geselecteerd, niveau:niveau, brug:brug,
      tafels:tafels, dhkMax:dhkMax, aantalOefeningen:aantal,
      tafelPositie:tafelPositie
    });

    if (!oefeningen.length) {
      _toast('Geen oefeningen gegenereerd.', '#E74C3C');
      return;
    }

    var blok = {
      id:           'blok-rekentaal-'+Date.now(),
      bewerking:    'rekentaal',
      subtype:      'rekentaal',
      niveau:       niveau,
      brug:         brug,
      opdrachtzin:  zin,
      hulpmiddelen: [],
      oefeningen:   oefeningen,
      config: {
        categorieën:geselecteerd, niveau:niveau, brug:brug,
        tafels:tafels, dhkMax:dhkMax, aantalOefeningen:aantal,
        tafelPositie:tafelPositie
      }
    };

    if (typeof App !== 'undefined' && typeof App.voegRekentaalBlokToe === 'function') {
      App.voegRekentaalBlokToe(blok);
    } else {
      console.error('[Rekentaal] App.voegRekentaalBlokToe niet beschikbaar');
    }
  }

  return {
    selecteerNiveau:selecteerNiveau,
    selecteerBrug:selecteerBrug,
    selecteerTafelPositie:selecteerTafelPositie,
    toggleTafel:toggleTafel,
    selecteerDhkMax:selecteerDhkMax,
    toggleCategorie:toggleCategorie,
    toggleZin:toggleZin,
    voegBlokToe:voegBlokToe
  };
})();

/* ── RekentaalPdfRenderer ─────────────────────────────────── */
var RekentaalPdfRenderer = (() => {
  function tekenBlok(doc, blok, startY, layout) {
    var ML=layout.ML, CW=layout.CW, PH=layout.PH, MB=layout.MB;
    var VOOR_ZIN=layout.VOOR_ZIN, ZINRUIMTE=layout.ZINRUIMTE, NABLOK=layout.NABLOK;
    var y = startY;
    var FS = 13;
    var RIJ_H = 15;

    // Vaste kolommen — altijd op dezelfde x, ongeacht zinlengte
    var ZIN_MAX  = ML + CW * 0.42;  // zin mag max tot hier (dan breekt hij af)
    var PIJL_VAN = ML + CW * 0.44;  // pijl begint altijd hier
    var PIJL_TOT = ML + CW * 0.60;  // pijl eindigt altijd hier
    var BEW_X    = ML + CW * 0.62;  // bewerkingslijn begint hier
    var BEW_EIND = ML + CW - 4;     // bewerkingslijn eindigt hier

    function checkPagina() {
      if (y + RIJ_H * 2 > PH - MB) {
        doc.addPage(); y = 15;
        if (layout.tekenVoettekst) layout.tekenVoettekst();
      }
    }

    // Opdrachtzin
    checkPagina();
    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FS);
    doc.setTextColor(0, 0, 0);
    doc.text(blok.opdrachtzin, ML, y);
    y += RIJ_H;

    (blok.oefeningen || []).forEach(function(oef) {
      checkPagina();
      var cy = y;
      var cx = ML;

      // Vervang placeholders
      var tmpl = oef.template || '';
      var pVal = String(oef.P !== undefined ? oef.P : (oef.a || ''));
      var qVal = String(oef.Q !== undefined ? oef.Q : (oef.b || ''));
      tmpl = tmpl.split('{P}').join('' + pVal + '');
      tmpl = tmpl.split('{Q}').join('' + qVal + '');
      tmpl = tmpl.split('{a}').join('' + String(oef.a || '') + '');
      tmpl = tmpl.split('{b}').join('' + String(oef.b || '') + '');
      tmpl = tmpl.split('{?}').join('');

      // Bouw stukken
      var stukken = [];
      var i = 0;
      while (i < tmpl.length) {
        if (tmpl[i] === '') {
          var j = tmpl.indexOf('', i+1);
          if (j === -1) j = tmpl.length - 1;
          stukken.push({ type:'getal', val: tmpl.slice(i+1, j) });
          i = j + 1;
        } else if (tmpl[i] === '') {
          stukken.push({ type:'lijn' });
          i++;
        } else {
          var s = i;
          while (i < tmpl.length && tmpl[i] !== '' && tmpl[i] !== '') i++;
          if (i > s) stukken.push({ type:'tekst', val: tmpl.slice(s, i) });
        }
      }

      // Teken zin — kort invullijntje: 12mm, lichtgrijs, dun
      var LIJN_INL = 12;
      for (var di = 0; di < stukken.length; di++) {
        var d = stukken[di];
        if (d.type === 'tekst') {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(FS);
          doc.setTextColor(0, 0, 0);
          doc.text(d.val, cx, cy);
          cx += doc.getTextWidth(d.val);
        } else if (d.type === 'getal') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(FS);
          doc.setTextColor(0, 0, 0);
          doc.text(d.val, cx, cy);
          cx += doc.getTextWidth(d.val);
        } else if (d.type === 'lijn') {
          // Kort, dun, lichtgrijs invullijntje
          doc.setDrawColor(140, 140, 140);
          doc.setLineWidth(0.4);
          doc.line(cx + 1, cy + 1, cx + LIJN_INL, cy + 1);
          cx += LIJN_INL + 1;
        }
      }

      // Pijl: altijd van PIJL_VAN tot PIJL_TOT, ongeacht zinlengte
      var pijlY = cy - 1;
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.5);
      doc.line(PIJL_VAN, pijlY, PIJL_TOT - 3, pijlY);
      // Pijlpunt
      doc.setFillColor(80, 80, 80);
      doc.triangle(
        PIJL_TOT - 3, pijlY - 1.5,
        PIJL_TOT - 3, pijlY + 1.5,
        PIJL_TOT,     pijlY,
        'F'
      );

      // Bewerkingslijn: altijd van BEW_X tot BEW_EIND
      doc.setDrawColor(layout.metAntwoorden ? 0 : 0, layout.metAntwoorden ? 130 : 0, layout.metAntwoorden ? 0 : 0);
      doc.setLineWidth(0.5);
      doc.line(BEW_X, cy + 1, BEW_EIND, cy + 1);

      // Bij oplossingssleutel: toon de bewerking op de lijn
      if (layout.metAntwoorden) {
        var rtA = String(oef.a !== undefined ? oef.a : (oef.P !== undefined ? oef.P : ''));
        var rtB = String(oef.b !== undefined ? oef.b : (oef.Q !== undefined ? oef.Q : ''));
        var rtAnt = String(oef.antwoord !== undefined ? oef.antwoord : '');
        var rtBew = oef.bewerking || blok.bewerking || '';
        var rtTeken = '';
        if (rtBew === 'optellen' || rtBew === '+') rtTeken = '+';
        else if (rtBew === 'aftrekken' || rtBew === '-') rtTeken = '−';
        else if (rtBew === 'vermenigvuldigen') rtTeken = '×';
        else if (rtBew === 'delen') rtTeken = '÷';
        // Dubbel/helft/kwart: hardcoded
        var rtTmplId = oef.templateId || oef.id || '';
        if (!rtTeken && rtTmplId) {
          if (rtTmplId === 'dhk1' || rtTmplId === 'dhk2') { rtTeken = '×'; rtB = '2'; }
          else if (rtTmplId === 'dhk3' || rtTmplId === 'dhk4') { rtTeken = '÷'; rtB = '2'; }
          else if (rtTmplId === 'dhk5') { rtTeken = '÷'; rtB = '4'; }
        }
        // Fallback: afleiden
        if (!rtTeken && rtA && rtB && rtAnt) {
          if (Number(rtA) + Number(rtB) === Number(rtAnt)) rtTeken = '+';
          else if (Number(rtA) - Number(rtB) === Number(rtAnt)) rtTeken = '−';
          else if (Number(rtA) * Number(rtB) === Number(rtAnt)) rtTeken = '×';
          else if (Math.round(Number(rtA) / Number(rtB)) === Number(rtAnt)) rtTeken = '÷';
        }
        if (rtTeken && rtA && rtB && rtAnt) {
          var bewStr = rtA + ' ' + rtTeken + ' ' + rtB + ' = ' + rtAnt;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(0, 130, 0);
          doc.text(bewStr, BEW_X + 2, cy - 1);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
        }
      }

      y += RIJ_H;
    });

    y += NABLOK;
    return y;
  }
  return { tekenBlok:tekenBlok };
})();