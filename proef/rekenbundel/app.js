/* ══════════════════════════════════════════════════════════════
   app.js
   Verantwoordelijkheid: centrale app-logica
   - Beheert de bundelData array (de enige bron van waarheid)
   - Verbindt de UI-acties met Generator, Preview en PdfEngine
   - Geen rekenlogica hier — Geen PDF-tekenlogica hier
   ══════════════════════════════════════════════════════════════ */

const App = (() => {

  let bundelData  = [];
  let actieveBewerking = 'optellen'; // 'optellen' of 'aftrekken'

  /* ── Toast ───────────────────────────────────────────────── */
  function toonToast(tekst, kleur = '#1A3A5C') {
    const t = document.getElementById('toast');
    t.textContent      = tekst;
    t.style.background = kleur;
    t.classList.add('zichtbaar');
    setTimeout(() => t.classList.remove('zichtbaar'), 2500);
  }

  /* ── Tab wisselen tussen optellen / aftrekken ────────────── */
  function toonBewerking(bewerking, tabEl) {
    actieveBewerking = bewerking;

    // Reset alle keuzes bij tab wissel
    // 0. Alle radio-chips in brug-sub en brug-hoofd weer zichtbaar maken
    //    (sommige kunnen verborgen zijn geweest door compenseren/transformeren)
    ['brug-hoofd', 'brug-sub'].forEach(naam => {
      document.querySelectorAll(`[name="${naam}"]`).forEach(r => {
        const chip = r.closest('.radio-chip');
        if (chip) chip.style.display = '';
      });
    });
    // Brug-sub-rij ook weer op standaard (wordt later correct gezet door _updateBrugSubUI)
    const rijSub = document.getElementById('rij-brug-sub');
    if (rijSub) rijSub.style.display = '';
    // 1. Hulpmiddelen
    document.querySelectorAll('[name="hulpmiddelen"]').forEach(cb => {
      cb.checked = false;
      cb.closest('.vink-chip')?.classList.remove('geselecteerd');
      const vb = cb.closest('.vink-chip')?.querySelector('.vink-box');
      if (vb) vb.textContent = '';
    });
    // 2. Niveau → reset naar 20 (laagste)
    document.querySelectorAll('[name="niveau"]').forEach(r => {
      const chip = r.closest('.radio-chip');
      if (r.value === '20') { r.checked = true; chip?.classList.add('geselecteerd'); }
      else { r.checked = false; chip?.classList.remove('geselecteerd'); }
    });
    // 3. Brug → reset naar 'zonder'
    document.querySelectorAll('[name="brug-hoofd"]').forEach(r => {
      const chip = r.closest('.radio-chip');
      if (r.value === 'zonder') { r.checked = true; chip?.classList.add('geselecteerd'); }
      else { r.checked = false; chip?.classList.remove('geselecteerd'); }
    });
    // 4. Splitspositie → reset naar 'aftrekker'
    document.querySelectorAll('[name="splitspositie"]').forEach(r => {
      const chip = r.closest('.radio-chip');
      if (r.value === 'aftrekker') { r.checked = true; chip?.classList.add('geselecteerd'); }
      else { r.checked = false; chip?.classList.remove('geselecteerd'); }
    });

    document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');

    // Scroll de tabbar zodat de actieve tab gecentreerd in beeld komt
    if (window.scrollNaarActieveTab) scrollNaarActieveTab(tabEl);

    const isHerken       = bewerking === 'herken-brug';
    const isSplitsingen  = bewerking === 'splitsingen';
    const isTafels       = bewerking === 'tafels';
    const isInzicht      = bewerking === 'tafels-inzicht';
    const isCijferen     = bewerking === 'cijferen';
    const isVraagstukken = bewerking === 'vraagstukken';
    const isRekentaal    = bewerking === 'rekentaal';
    const isGemengd      = bewerking === 'gemengd';
    const isKomma        = bewerking === 'komma';
    const isSchatten     = bewerking === 'schatten';

    // Schakel tussen de sidebar-content blokken
    const tabHoofd        = document.getElementById('tab-hoofdrekenen');
    const tabGemengd      = document.getElementById('tab-gemengd');
    const tabKomma        = document.getElementById('tab-komma');
    const tabTafels       = document.getElementById('tab-tafels');
    const tabInzicht      = document.getElementById('tab-tafels-inzicht');
    const tabCijferen     = document.getElementById('tab-cijferen');
    const tabVraagstukken = document.getElementById('tab-vraagstukken');
    const tabRekentaal    = document.getElementById('tab-rekentaal');
    const tabSchatten     = document.getElementById('tab-schatten');
    if (tabHoofd)        tabHoofd.style.display        = (!isTafels && !isInzicht && !isCijferen && !isVraagstukken && !isRekentaal && !isGemengd && !isKomma && !isSchatten) ? 'block' : 'none';
    if (tabGemengd)      tabGemengd.style.display      = isGemengd       ? 'block' : 'none';
    if (tabKomma)        tabKomma.style.display        = isKomma         ? 'block' : 'none';
    if (tabTafels)       tabTafels.style.display       = isTafels        ? 'block' : 'none';
    if (tabInzicht)      tabInzicht.style.display      = isInzicht       ? 'block' : 'none';
    if (tabCijferen)     tabCijferen.style.display     = isCijferen      ? 'block' : 'none';
    if (tabVraagstukken) tabVraagstukken.style.display = isVraagstukken  ? 'block' : 'none';
    if (tabRekentaal)    tabRekentaal.style.display    = isRekentaal     ? 'block' : 'none';
    if (tabSchatten)     tabSchatten.style.display     = isSchatten      ? 'block' : 'none';

    if (isSchatten) { _updateSchattenUI(); _updateSchattenAfrondenUI(); return; }

    if (isKomma)   { return; }
    if (isGemengd) { _updateGemengdTypesUI(); return; }

    // Rekentaal-tab: HTML staat al in de pagina, niks te initialiseren
    if (isRekentaal) {
      return;
    }

    // Rekentaal-tab: HTML is statisch, enkel tonen/verbergen
    if (isRekentaal) { return; }

    // Vraagstukken-tab: initialiseer module en toon schema-voorbeeld
    if (isVraagstukken) {
      if (window.VraagstukkenModule) {
        VraagstukkenModule.init();
      }
      return;
    }

    // Sectietitel
    const titel = document.getElementById('sectie-titel');
    if (titel) {
      if (isHerken)                titel.textContent = 'Herken de brugoefening';
      else if (isSplitsingen)      titel.textContent = 'Configureer een splitsblok';
      else if (bewerking === 'aftrekken') titel.textContent = 'Configureer een aftrekblok';
      else                         titel.textContent = 'Configureer een optelblok';
    }

    // Standaard opdrachtzin
    const zinInp = document.getElementById('inp-opdrachtzin');
    if (zinInp) {
      if (isHerken)           zinInp.value = 'Kleur Zisa groen bij elke brugoefening.';
      else if (isSplitsingen) zinInp.value = 'Splits het getal.';
      else if (bewerking === 'aftrekken') zinInp.value = 'Trek af.';
      else                    zinInp.value = 'Reken vlug uit.';
      // Pas daarna corrigeren voor Maak eerst 10 indien al geselecteerd
      _updateOpdrachtzin();
    }

    // Niveau- en brugkaart: verbergen bij herken-brug; niveau tonen bij splitsingen (zonder brug)
    const kaartNiveau = document.getElementById('kaart-niveau');
    const kaartBrug   = document.getElementById('kaart-brug');
    if (kaartBrug)   kaartBrug.style.display   = (isHerken || isSplitsingen) ? 'none' : 'block';

    // Hulpmiddelen-kaart verbergen bij splitsingen
    const kaartHulp = document.getElementById('kaart-hulpmiddelen');
    if (kaartHulp) kaartHulp.style.display = isSplitsingen ? 'none' : '';

    // Splits-kaarten standaard verbergen — worden getoond via _updateSplitsKaarten()
    const kaartSplitsVariant = document.getElementById('kaart-splits-variant');
    const kaartSplitsNiveau  = document.getElementById('kaart-splits-niveau');
    const kaartGrootGetallen = document.getElementById('kaart-groot-getallen');
    if (kaartSplitsVariant) kaartSplitsVariant.style.display = 'none';
    if (kaartSplitsNiveau)  kaartSplitsNiveau.style.display  = 'none';
    if (kaartGrootGetallen) kaartGrootGetallen.style.display  = 'none';
    // Gewone niveaukaart verbergen bij splitsingen
    if (kaartNiveau) kaartNiveau.style.display = (isHerken || isSplitsingen) ? 'none' : 'block';

    _updateHulpmiddelenUI(isHerken || isSplitsingen ? 'zonder' : _getBrugWaarde());
    _updateStrategieUI();
    // Zorg dat splitspositie rij correct getoond/verborgen wordt na bewerking wissel
    const rijPosB = document.getElementById('rij-splitspositie');
    if (rijPosB) {
      const brugNu = _getBrugWaarde();
      const toonRijPos = (brugNu !== 'zonder') && (bewerking === 'aftrekken');
      rijPosB.style.display = toonRijPos ? 'block' : 'none';
    }

    // Types laden
    const niveau = isHerken ? 100
      : isSplitsingen ? 10
      : parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const brug   = isHerken ? 'gemengd' : 'zonder';
    _updateTypesUI(niveau, brug, true);  // true = reset selectie bij tab-switch
  }

  /* ── Brug: hoofd- en subkeuze ───────────────────────────── */
  // Berekent de effectieve brugwaarde die de rest van de app gebruikt
  function _getBrugWaarde() {
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const hoofd  = document.querySelector('[name="brug-hoofd"]:checked')?.value || 'zonder';
    if (hoofd === 'zonder') return 'zonder';
    // Tot 10.000: geen sub-keuze, enkel met/zonder
    if (niveau >= 10000) {
      if (hoofd === 'met' || hoofd === 'beide') return 'naar-duizendtal';
      return 'zonder';
    }
    // Tot 1000: subkeuze bepaalt de exacte brugwaarde
    if (niveau >= 1000) {
      const sub = document.querySelector('[name="brug-sub"]:checked')?.value || 'naar-tiental';
      if (hoofd === 'met')   return sub;
      if (hoofd === 'beide') return 'gemengd';
    }
    // Tot 100
    if (hoofd === 'met')   return 'met';
    if (hoofd === 'beide') return 'gemengd';
    return 'zonder';
  }

  // Schrijft de effectieve waarde terug naar het verborgen [name="brug"] input
  function _syncBrugInput() {
    const waarde = _getBrugWaarde();
    const verborgen = document.querySelector('[name="brug"]');
    if (verborgen) verborgen.value = waarde;
    return waarde;
  }

  function selecteerBrugHoofd(waarde, el) {
    document.querySelectorAll('[name="brug-hoofd"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    _updateBrugSubUI();
    _updateStrategieUI();
    const brug = _syncBrugInput();
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    _updateTypesUI(niveau, brug, true);
    _updateHulpmiddelenUI(brug);
  }

  function selecteerBrugSub(waarde, el) {
    document.querySelectorAll('[name="brug-sub"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    const brug = _syncBrugInput();
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    _updateTypesUI(niveau, brug, true);
    _updateHulpmiddelenUI(brug);
  }

  function selecteerStrategie(waarde, el) {
    document.querySelectorAll('[name="strategie"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');

    // Sync splitspositie met strategie
    const splitsRadio = document.querySelector(`[name="splitspositie"][value="${waarde}"]`);
    if (splitsRadio) {
      document.querySelectorAll('[name="splitspositie"]').forEach(r =>
        r.closest('.radio-chip')?.classList.remove('geselecteerd'));
      splitsRadio.checked = true;
      splitsRadio.closest('.radio-chip')?.classList.add('geselecteerd');
    }

    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const brug = _syncBrugInput();
    _updateTypesUI(niveau, brug);
  }

  function _getStrategie() {
    return document.querySelector('[name="strategie"]:checked')?.value || 'aftrekker';
  }

  function _updateStrategieUI() {
    const niveau    = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const hoofd     = document.querySelector('[name="brug-hoofd"]:checked')?.value || 'zonder';
    const bewerking = actieveBewerking;
    const rijStr    = document.getElementById('rij-strategie');
    if (!rijStr) return;
    // Strategie-keuze enkel bij aftrekken + niveau 10000 + met brug
    const toon = bewerking === 'aftrekken' && niveau >= 10000 && hoofd === 'met';
    rijStr.style.display = toon ? 'block' : 'none';
  }

  // Toont/verbergt de subkeuze-rij + past beschikbare sub-opties aan bij compenseren
  function _updateBrugSubUI(compenseren = false) {
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const hoofd  = document.querySelector('[name="brug-hoofd"]:checked')?.value || 'zonder';
    const rijSub = document.getElementById('rij-brug-sub');
    if (!rijSub) return;

    // Subkeuze enkel bij tot 1000 + met brug (niet bij 'beide' = gemengd, niet bij 10000)
    const toonSub = niveau >= 1000 && niveau < 10000 && hoofd === 'met';
    rijSub.style.display = toonSub ? 'block' : 'none';

    if (toonSub && compenseren) {
      // Compenseren aftrekken tot 1000: enkel HT-HT → enkel naar-honderdtal
      // Compenseren optellen tot 1000: alle bruggen mogelijk
      const bewerking = actieveBewerking;
      const chipHond = rijSub.querySelector('[value="naar-honderdtal"]')?.closest('.radio-chip');
      const chipTien = rijSub.querySelector('[value="naar-tiental"]')?.closest('.radio-chip');
      const chipBeide = rijSub.querySelector('[value="beide"]')?.closest('.radio-chip');
      if (bewerking === 'aftrekken') {
        // Enkel naar-honderdtal beschikbaar
        if (chipTien)  chipTien.style.display  = 'none';
        if (chipBeide) chipBeide.style.display = 'none';
        if (chipHond)  { chipHond.style.display = ''; chipHond.click(); }
      } else {
        // Alle opties
        if (chipTien)  chipTien.style.display  = '';
        if (chipBeide) chipBeide.style.display = '';
        if (chipHond)  chipHond.style.display  = '';
      }
    } else if (toonSub) {
      // Alle sub-opties zichtbaar
      rijSub.querySelectorAll('.radio-chip').forEach(c => c.style.display = '');
    }
  }

  /* ── Radio selecteren (niet-brug) ───────────────────────── */
  function selecteerRadio(naam, waarde, el) {
    document.querySelectorAll(`[name="${naam}"]`).forEach(r => {
      r.closest('.radio-chip')?.classList.remove('geselecteerd');
    });
    el.classList.add('geselecteerd');

    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    if (naam === 'niveau') {
      _updateTypesUI(parseInt(waarde), null, true);
      _updateBrugSubUI();
      _updateStrategieUI();
      const brug = _syncBrugInput();
      _updateHulpmiddelenUI(brug);
    }
  }

  /* ── Gemengd info: uitgrijs + tekst ─────────────────────── */
  function _updateGemengdInfo(container, infoEl) {
    const gemengdActief = !![...container.querySelectorAll('.vink-chip')]
      .find(l => l.querySelector('input').value === 'Gemengd' && l.querySelector('input').checked);

    // Uitgrijs 'Maak eerst 10' chip als Gemengd actief
    [...container.querySelectorAll('.vink-chip')].forEach(l => {
      if (l.querySelector('input').value === 'Maak eerst 10') {
        l.style.opacity    = gemengdActief ? '0.4' : '';
        l.style.cursor     = gemengdActief ? 'default' : '';
        l.style.pointerEvents = gemengdActief ? 'none' : '';
      }
    });

    // Informatietekst tonen/verbergen
    if (infoEl) {
      if (gemengdActief) {
        // Welk niveau is actief? (nodig voor juiste tekst)
        const niveauEl = document.querySelector('[name="niveau"]:checked');
        const huidigNiveau = niveauEl ? parseInt(niveauEl.value) : 100;
        const huidigBrug = _getBrugWaarde();

        let gemengdTypes;
        if (actieveBewerking === 'aftrekken' && huidigNiveau >= 10000 && huidigBrug !== 'zonder') {
          gemengdTypes = 'DH-H, DH-DH, DH-HT en D-HT';
        } else if (actieveBewerking === 'aftrekken') {
          gemengdTypes = 'E-E, T-E, T-TE, TE-E, TE-T en TE-TE';
        } else {
          gemengdTypes = 'E+E, T+E en TE+E';
        }
        infoEl.textContent = `ℹ️ Gemengd bevat: ${gemengdTypes} — Maak eerst 10 zit hier niet bij.`;
        infoEl.style.display = 'block';
      } else {
        infoEl.style.display = 'none';
      }
    }
  }

  /* ── Opdrachtzin aanpassen op basis van geselecteerde types ── */
  function _updateOpdrachtzin() {
    const zinInp = document.getElementById('inp-opdrachtzin');
    if (!zinInp) return;
    const geselecteerd = [...document.querySelectorAll('[name="types"]:checked')].map(c => c.value);
    const alleenEerst10 = geselecteerd.length === 1 && geselecteerd[0] === 'Maak eerst 10';
    const hulpmiddelen = [...document.querySelectorAll('[name="hulpmiddelen"]:checked')].map(c => c.value);
    if (hulpmiddelen.includes('aanvullen')) {
      zinInp.value = 'Los op door aan te vullen.';
    } else if (hulpmiddelen.includes('compenseren')) {
      zinInp.value = 'Reken uit door te compenseren.';
    } else if (hulpmiddelen.includes('transformeren')) {
      zinInp.value = 'Reken uit door te transformeren.';
    } else if (alleenEerst10) {
      zinInp.value = 'Onderstreep eerst wat samen 10 is en reken dan uit.';
    } else if (actieveBewerking === 'aftrekken') {
      zinInp.value = 'Trek af.';
    } else {
      zinInp.value = 'Reken vlug uit.';
    }
  }

  /* ── Types UI opbouwen ───────────────────────────────────── */
  function _updateTypesUI(niveau, brug, resetSelectie = false) {
    if (!brug) brug = _getBrugWaarde();

    const hulpmiddelen = [...document.querySelectorAll('[name="hulpmiddelen"]:checked')].map(c => c.value);
    const splitsModus  = actieveBewerking === 'splitsingen' ? (_splitsMode || 'tot') : 'tot';
    const beschikbaar = Generator.getTypes(actieveBewerking, niveau, brug, hulpmiddelen, splitsModus);
    const container   = document.getElementById('cg-types');

    // Bij reset (tab-switch): alles leeg. Anders: onthoud huidige selectie.
    const vorigeSelectie = resetSelectie
      ? []
      : [...container.querySelectorAll('input:checked')].map(c => c.value);

    container.innerHTML = '';

    // Informatietekst (verschijnt bij Gemengd)
    const infoEl = document.createElement('div');
    infoEl.id = 'types-info-tekst';
    infoEl.style.cssText = 'font-size:12px;color:#888;margin-top:6px;display:none;width:100%;';

    const TYPE_LABELS = {
      'aanvullen': 'Aanvullen',
      'DH-H':  'DH − H',
      'DH-DH': 'DH − DH',
      'H+H':   'H + H',
      'HT+HT': 'HT + HT',
    };

    beschikbaar.forEach((type) => {
      const wasGeselecteerd = vorigeSelectie.includes(type);
      const zichtbaarLabel  = TYPE_LABELS[type] || type;

      const label = document.createElement('label');
      label.className = 'vink-chip' + (wasGeselecteerd ? ' geselecteerd' : '');
      label.dataset.type = type;
      label.innerHTML = `
        <span class="vink-box">${wasGeselecteerd ? '✓' : ''}</span>
        <input type="checkbox" name="types" value="${type}" ${wasGeselecteerd ? 'checked' : ''} style="display:none">
        <span>${zichtbaarLabel}</span>`;

      label.onclick = (e) => {
        e.preventDefault();
        const checkbox = label.querySelector('input');

        if (type === 'Gemengd') {
          container.querySelectorAll('.vink-chip').forEach(l => {
            l.classList.remove('geselecteerd');
            l.querySelector('input').checked = false;
            l.querySelector('.vink-box').textContent = '';
          });
          label.classList.add('geselecteerd');
          checkbox.checked = true;
          label.querySelector('.vink-box').textContent = '✓';
        } else {
          const gemengdLabel = [...container.querySelectorAll('.vink-chip')]
            .find(l => l.querySelector('input').value === 'Gemengd');
          if (gemengdLabel) {
            gemengdLabel.classList.remove('geselecteerd');
            gemengdLabel.querySelector('input').checked = false;
            gemengdLabel.querySelector('.vink-box').textContent = '';
          }
          const wasChecked = checkbox.checked;
          checkbox.checked = !wasChecked;
          label.classList.toggle('geselecteerd', !wasChecked);
          label.querySelector('.vink-box').textContent = !wasChecked ? '✓' : '';
        }
        _updateGemengdInfo(container, infoEl);
        _updateSplitsKaarten();
        _updateOpdrachtzin();
      };

      container.appendChild(label);
    });

    container.appendChild(infoEl);
    _updateGemengdInfo(container, infoEl);

    // Auto-aanvinken als er maar 1 type is
    const alleChips = [...container.querySelectorAll('.vink-chip')];
    if (alleChips.length === 1) {
      const enigeChip = alleChips[0];
      enigeChip.classList.add('geselecteerd');
      enigeChip.querySelector('input').checked = true;
      enigeChip.querySelector('.vink-box').textContent = '✓';
    }

    // Brugkaart verbergen voor niveau 5 en 10
    const kaartBrug = document.getElementById('kaart-brug');
    if (kaartBrug) kaartBrug.style.display = (niveau <= 10) ? 'none' : 'block';
    if (niveau <= 10) _updateHulpmiddelenUI('zonder');
    // Tot 10.000: geen brug-subkeuze (naar-tiental/naar-honderdtal), wel zonder/met
    const kaartBrugSub = document.getElementById('kaart-brug-sub');
    if (kaartBrugSub) kaartBrugSub.style.display = (niveau >= 10000) ? 'none' : '';

    // Splits-kaarten updaten op basis van standaard geselecteerd type
    _updateSplitsKaarten();

    // Bij niveau <= 100: enkel 'zonder' en 'naar-tiental' tonen, rest verbergen
    const alleenTiental = niveau <= 100;
    ['naar-honderdtal','beide'].forEach(val => {
      const chip = document.querySelector(`[name="brug"][value="${val}"]`)?.closest('.radio-chip');
      if (chip) chip.style.display = alleenTiental ? 'none' : '';
    });
    // Bij niveau ≤ 100: brug-sub verbergen, hoofd-brug naar 'zonder' resetten indien nodig
    if (alleenTiental) {
      const rijSub = document.getElementById('rij-brug-sub');
      if (rijSub) rijSub.style.display = 'none';
    }

    // Aanvullen: enkel tot 100. Compenseren: tot 100 én tot 1000 (optellen)
    const chipComp = document.getElementById('chip-compenseren');
    const chipAanv = document.getElementById('chip-aanvullen');

    // Aanvullen: verbergen boven 100
    if (chipAanv) {
      const verbergAanv = niveau <= 20 || (niveau > 100 && niveau < 1000);
      chipAanv.style.display = verbergAanv ? 'none' : '';
      if (verbergAanv) {
        const cb = chipAanv.querySelector('input');
        if (cb) cb.checked = false;
        chipAanv.classList.remove('geselecteerd');
        const vb = chipAanv.querySelector('.vink-box');
        if (vb) vb.textContent = '';
        const rijAanv = document.getElementById('rij-aanvullen');
        if (rijAanv) rijAanv.style.display = 'none';
      }
    }

    // Compenseren: beschikbaar tot 100 (optellen+aftrekken) en tot 1000 (enkel optellen)
    if (chipComp) {
      const verbergComp = niveau <= 20 || (niveau > 100 && niveau < 1000);
      chipComp.style.display = verbergComp ? 'none' : '';
      if (verbergComp) {
        const cb = chipComp.querySelector('input');
        if (cb) cb.checked = false;
        chipComp.classList.remove('geselecteerd');
        const vb = chipComp.querySelector('.vink-box');
        if (vb) vb.textContent = '';
        const rijComp = document.getElementById('rij-compenseren');
        if (rijComp) rijComp.style.display = 'none';
      }
    }

    // Transformeren: bij optellen én aftrekken, tot 100 of tot 1000
    const chipTransUI = document.getElementById('chip-transformeren');
    if (chipTransUI) {
      const verbergTrans = niveau <= 20 || (niveau > 100 && niveau < 1000);
      chipTransUI.style.display = verbergTrans ? 'none' : '';
      if (verbergTrans) {
        const cb = chipTransUI.querySelector('input');
        if (cb) cb.checked = false;
        chipTransUI.classList.remove('geselecteerd');
        const vb = chipTransUI.querySelector('.vink-box');
        if (vb) vb.textContent = '';
        const rijTrans = document.getElementById('rij-transformeren');
        if (rijTrans) rijTrans.style.display = 'none';
      }
    }
  }

  /* ── Hulpmiddelen UI ────────────────────────────────────── */
  function _updateHulpmiddelenUI(brug) {
    const kaart = document.getElementById('kaart-hulpmiddelen');
    if (!kaart) return;

    // Hulpmiddelen zijn niet van toepassing bij splitsen
    if (actieveBewerking === 'splitsingen') { kaart.style.display = 'none'; return; }

    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const isBrug = ['naar-tiental','naar-honderdtal','beide','met','naar-duizendtal'].includes(brug);
    const isZonderTot1000 = brug === 'zonder' && niveau >= 1000;
    if (niveau < 20) { kaart.style.display = 'none'; return; }

    // Toon bij brug (alle niveaus) of bij zonder+tot1000
    const toon = (isBrug || isZonderTot1000) && (actieveBewerking !== 'herken-brug');
    kaart.style.display = toon ? 'block' : 'none';

    if (!toon) {
      document.querySelectorAll('[name="hulpmiddelen"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.vink-chip')?.classList.remove('geselecteerd');
        const vb = cb.closest('.vink-chip')?.querySelector('.vink-box');
        if (vb) vb.textContent = '';
      });
      const rijPos = document.getElementById('rij-splitspositie');
      if (rijPos) rijPos.style.display = 'none';
      const rijAanv = document.getElementById('rij-aanvullen');
      if (rijAanv) rijAanv.style.display = 'none';
      const rijComp = document.getElementById('rij-compenseren');
      if (rijComp) rijComp.style.display = 'none';
      const rijTrans = document.getElementById('rij-transformeren');
      if (rijTrans) rijTrans.style.display = 'none';
      const rijLijnen = document.getElementById('rij-schrijflijnen-aantal');
      if (rijLijnen) rijLijnen.style.display = 'none';
    }

    // Bij zonder+tot1000: enkel splitsbeen tonen, rest verbergen
    const chipSplits    = document.getElementById('chip-splitsbeen');
    const chipLijnen    = document.getElementById('chip-schrijflijnen');
    const chipAanvullen = document.getElementById('chip-aanvullen');
    const chipComp      = document.getElementById('chip-compenseren');
    const chipTrans     = document.getElementById('chip-transformeren');

    if (isZonderTot1000) {
      // Zonder brug: splitsbeen enkel tot 1000, niet bij hogere niveaus
      const isZonderBovén1000 = brug === 'zonder' && niveau > 1000;
      if (chipSplits)    { 
        if (isZonderBovén1000) { chipSplits.style.display = 'none'; _resetChip(chipSplits, 'rij-splitspositie'); }
        else chipSplits.style.display = '';
      }
      if (chipLijnen)    chipLijnen.style.display    = '';
      if (chipAanvullen) { chipAanvullen.style.display = 'none'; _resetChip(chipAanvullen, 'rij-aanvullen'); }
      if (chipComp)      { chipComp.style.display      = 'none'; _resetChip(chipComp, 'rij-compenseren'); }
      if (chipTrans)     { chipTrans.style.display      = 'none'; _resetChip(chipTrans, 'rij-transformeren'); }
    } else if (isBrug) {
      // Alle chips zichtbaar (niveau-filter doet de rest)
      if (chipSplits) chipSplits.style.display = '';
      if (chipLijnen) chipLijnen.style.display = '';
    }

    // Splitspositie enkel bij aftrekken
    const rijPos = document.getElementById('rij-splitspositie');
    if (rijPos) rijPos.style.display = (toon && actieveBewerking === 'aftrekken') ? 'block' : 'none';
  }

  function _resetChip(chip, rijId) {
    if (!chip) return;
    const cb = chip.querySelector('input');
    if (cb) cb.checked = false;
    chip.classList.remove('geselecteerd');
    const vb = chip.querySelector('.vink-box');
    if (vb) vb.textContent = '';
    const rij = document.getElementById(rijId);
    if (rij) rij.style.display = 'none';
  }

  /* ── Blok toevoegen ──────────────────────────────────────── */
  function voegBlokToe() {
    const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
    const brug   = _getBrugWaarde();
    const types  = [...document.querySelectorAll('[name="types"]:checked')].map(c => c.value);
    const aantal = parseInt(document.getElementById('inp-aantal').value);
    const alleenEerst10 = types.length === 1 && types[0] === 'Maak eerst 10';

    if (types.length === 0) {
      toonToast('⚠️ Kies minstens één oefentype!', '#E74C3C');
      return;
    }

    const isHerken      = actieveBewerking === 'herken-brug';
    const isSplitsingen = actieveBewerking === 'splitsingen';
    const hulpmiddelen        = [...document.querySelectorAll('[name="hulpmiddelen"]:checked')].map(c => c.value)
                          .filter(h => {
                            // Splitsbeen niet toestaan bij zonder brug + niveau >= 10000
                            if (h === 'splitsbeen' && brug === 'zonder' && niveau >= 10000) return false;
                            return true;
                          });
    const hulpmiddelenZin = hulpmiddelen.includes('aanvullen')     ? 'Los op door aan te vullen.' :
                            hulpmiddelen.includes('compenseren')   ? 'Reken uit door te compenseren.' :
                            hulpmiddelen.includes('transformeren') ? 'Reken uit door te transformeren.' : null;
    const zin    = document.getElementById('inp-opdrachtzin').value.trim() ||
                   hulpmiddelenZin ||
                   (alleenEerst10 ? 'Onderstreep eerst wat samen 10 is en reken dan uit.' :
                   actieveBewerking === 'aftrekken' ? 'Trek af.' : 'Reken vlug uit.');
    const splitspositie       = document.querySelector('[name="splitspositie"]:checked')?.value || 'aftrekker';
    const aanvullenVariant    = document.querySelector('[name="aanvullen-variant"]:checked')?.value || 'zonder-schema';
    const compenserenVariant  = document.querySelector('[name="compenseren-variant"]:checked')?.value || 'met-tekens';
    const transformerenVariant = document.querySelector('[name="transformeren-variant"]:checked')?.value || 'schema';
    const schrijflijnenAantal = parseInt(document.querySelector('[name="schrijflijnen-aantal"]:checked')?.value || '2');
    const isTransformeren     = hulpmiddelen.includes('transformeren');
    const metVoorbeeld        = isTransformeren
      ? (document.getElementById('cb-trans-voorbeeld')?.checked || false)
      : (document.getElementById('cb-metvoorbeeld')?.checked || false);
    const splitsVariant       = document.querySelector('[name="splits-variant"]:checked')?.value || 'afwisselend';
    const splitsConfig  = isSplitsingen ? _getSplitsConfig() : null;
    const wilGroot = types.some(t => t.includes('Groot'));
    // Bij groot splitshuis: gebruik de aparte getallenkeuze
    const grootGetallen = wilGroot ? _getGrootGetallen() : null;
    if (wilGroot && (!grootGetallen || grootGetallen.length === 0)) {
      toonToast('⚠️ Kies minstens één getal voor het groot splitshuis!', '#E74C3C');
      return;
    }
    const effectiefGetallen = wilGroot ? grootGetallen : splitsConfig?.getallen || null;
    const effectiefModus    = wilGroot ? 'specifiek' : splitsConfig?.mode || 'tot';
    const effectiefNiveau   = wilGroot ? Math.max(...grootGetallen) : (splitsConfig?.niveau || 10);
    // Bij groot splitshuis: aantal = aantal gekozen getallen
    const effectiefAantal   = wilGroot ? grootGetallen.length : aantal;

    const wilPunt        = types.some(t => t.includes('Punt'));
    const wilSplitsBrug  = wilPunt || types.some(t => t.includes('Klein') || (t.includes('Splitsbeen') && !t.includes('bewerkingen')) || t.includes('bewerkingen'));
    const effectiefBrug  = (isSplitsingen && wilSplitsBrug && effectiefNiveau > 10)
      ? _puntBrug
      : (isHerken || isSplitsingen) ? 'zonder' : brug;

    const blok = Generator.maakBlok({
      bewerking: actieveBewerking,
      niveau:    (isHerken || isSplitsingen) ? (isSplitsingen ? effectiefNiveau : 100) : niveau,
      splitsGetallen: effectiefGetallen,
      splitsModus:    effectiefModus,
      oefeningstypes: types,
      brug:      effectiefBrug,
      aantalOefeningen: effectiefAantal,
      opdrachtzin: zin,
      hulpmiddelen,
      splitspositie,
      aanvullenVariant,
      compenserenVariant,
      transformerenVariant,
      schrijflijnenAantal,
      metVoorbeeld,
      splitsVariant,
      strategie: _getStrategie(),
    });

    if (!blok) {
      toonToast('⚠️ Te weinig oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
      return;
    }

    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast(`✅ Blok toegevoegd! (${blok.oefeningen.length} oefeningen)`, '#27AE60');
  }

  /* ── Bewerkingen op preview ──────────────────────────────── */
  function verwijderBlok(id) {
    bundelData = bundelData.filter(b => b.id !== id);
    Preview.render(bundelData);
    toonToast('🗑 Blok verwijderd');
  }

  function verwijderOefening(blokId, idx) {
    const blok = bundelData.find(b => b.id === blokId);
    if (!blok) return;
    blok.oefeningen.splice(idx, 1);
    Preview.render(bundelData);
  }

  function voegOefeningToe(blokId) {
    const blok = bundelData.find(b => b.id === blokId);
    if (!blok) return;

    // Rekentaal gaat via Generator.voegOefeningToe (zie generator.js)
    const gelukt = Generator.voegOefeningToe(blok);
    if (gelukt) {
      Preview.render(bundelData);
      toonToast('➕ Oefening toegevoegd', '#27AE60');
    } else {
      toonToast('⚠️ Geen nieuwe unieke oefening beschikbaar', '#E74C3C');
    }
  }

  function bewerkZin(blokId) {
    const blok = bundelData.find(b => b.id === blokId);
    if (!blok) return;
    Preview.toonZinEditor(blokId, blok.opdrachtzin);
  }

  function slaZinOp(blokId) {
    const blok = bundelData.find(b => b.id === blokId);
    if (!blok) return;
    const inp = document.getElementById(`zin-inp-${blokId}`);
    if (inp) blok.opdrachtzin = inp.value.trim() || blok.opdrachtzin;
    Preview.render(bundelData);
  }

  /* ── Hulpmiddel vinkje togglen ──────────────────────────── */
  function toggleHulpmiddel(label, waarde) {
    const cb = label.querySelector('input');
    const was = cb.checked;
    cb.checked = !was;
    label.classList.toggle('geselecteerd', !was);
    label.querySelector('.vink-box').textContent = !was ? '\u2713' : '';

    if (waarde === 'splitsbeen') {
      const rijPos = document.getElementById('rij-splitspositie');
      const heeftAndereHulp = ['compenseren','transformeren','aanvullen'].some(h =>
        document.querySelector(`[name="hulpmiddelen"][value="${h}"]`)?.checked);
      if (rijPos) rijPos.style.display = (!was && actieveBewerking === 'aftrekken' && !heeftAndereHulp) ? 'block' : 'none';
    }
    // Als comp/trans/aanvullen uitgezet wordt: check of splitsbeen nu zichtbaar moet worden
    if (['compenseren','transformeren','aanvullen'].includes(waarde) && was) {
      const splitsbeenActief = document.querySelector('[name="hulpmiddelen"][value="splitsbeen"]')?.checked;
      const rijPos = document.getElementById('rij-splitspositie');
      if (rijPos && splitsbeenActief && actieveBewerking === 'aftrekken') {
        const nogAndereHulp = ['compenseren','transformeren','aanvullen'].filter(h => h !== waarde)
          .some(h => document.querySelector(`[name="hulpmiddelen"][value="${h}"]`)?.checked);
        rijPos.style.display = nogAndereHulp ? 'none' : 'block';
      }
    }
    if (waarde === 'schrijflijnen') {
      const rijAantal = document.getElementById('rij-schrijflijnen-aantal');
      if (rijAantal) rijAantal.style.display = !was ? 'block' : 'none';
    }
    if (waarde === 'aanvullen') {
      const rijAanvullen = document.getElementById('rij-aanvullen');
      if (rijAanvullen) rijAanvullen.style.display = !was ? 'block' : 'none';
      const rijPos = document.getElementById('rij-splitspositie');
      if (rijPos && !was) rijPos.style.display = 'none';
      const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
      _updateTypesUI(niveau, _getBrugWaarde(), true);
    }
    if (waarde === 'compenseren') {
      const rijComp = document.getElementById('rij-compenseren');
      if (rijComp) rijComp.style.display = !was ? 'block' : 'none';
      const rijPos = document.getElementById('rij-splitspositie');
      if (rijPos && !was) rijPos.style.display = 'none';
      _updateBrugSubUI(!was);
      const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 20);
      _updateTypesUI(niveau, _getBrugWaarde(), true);
    }
    if (waarde === 'transformeren') {
      const rijTrans = document.getElementById('rij-transformeren');
      if (rijTrans) rijTrans.style.display = !was ? 'block' : 'none';
      const rijPos = document.getElementById('rij-splitspositie');
      if (rijPos && !was) rijPos.style.display = 'none';
      const niveau = parseInt(document.querySelector('[name="niveau"]:checked')?.value || 100);
      _updateTypesUI(niveau, _getBrugWaarde(), true);
    }
    _updateOpdrachtzin();
  }

  /* ── Splits: niveau en specifieke getallen ───────────────── */
  // Toont de juiste kaarten op basis van gekozen oefeningstypes bij splitsingen
  function _updateSplitsKaarten() {
    if (actieveBewerking !== 'splitsingen') return;
    const gekozen = [...document.querySelectorAll('#cg-types input:checked')].map(c => c.value);
    const wilKleinOfBeen = gekozen.some(t => t.includes('Klein') || (t.includes('Splitsbeen') && !t.includes('bewerkingen')));
    const wilBewerkingen = gekozen.some(t => t.includes('bewerkingen'));
    const wilPunt        = gekozen.some(t => t.includes('Punt'));
    const wilGroot       = gekozen.some(t => t.includes('Groot'));

    const toonNiveau   = wilKleinOfBeen || wilBewerkingen || wilPunt;
    const toonVariant  = wilKleinOfBeen || wilBewerkingen || wilPunt;
    const toonPuntBrug = (wilPunt || wilKleinOfBeen || wilBewerkingen) && _splitsTot > 10;

    document.getElementById('kaart-splits-variant').style.display = toonVariant  ? 'block' : 'none';
    document.getElementById('kaart-splits-niveau').style.display  = toonNiveau   ? 'block' : 'none';
    document.getElementById('kaart-groot-getallen').style.display = wilGroot     ? 'block' : 'none';
    const kb = document.getElementById('kaart-punt-brug');
    if (kb) kb.style.display = toonPuntBrug ? 'block' : 'none';
    const ra = document.getElementById('rij-aantal');
    if (ra) ra.style.display = wilGroot ? 'none' : 'block';
  }

  // Groot splitshuis getallenkeuze
  let _grootGetallen = []; // standaard niets aangevinkt

  function toggleGrootGetal(label, getal) {
    const cb  = label.querySelector('input');
    const was = cb.checked;
    cb.checked = !was;
    label.classList.toggle('geselecteerd', !was);
    label.querySelector('.vink-box').textContent = !was ? '✓' : '';
    if (!was) {
      if (!_grootGetallen.includes(getal)) _grootGetallen.push(getal);
    } else {
      _grootGetallen = _grootGetallen.filter(g => g !== getal);
    }
  }

  function _getGrootGetallen() {
    return [..._grootGetallen].sort((a, b) => a - b);
  }
 let _splitsMode     = 'tot';
 let _splitsTot      = 5;
 let _splitsGetallen = [];  // extra geselecteerde getallen bovenop "tot"

  function selecteerSplitsNiveau(mode, waarde, el) {
  _splitsMode = 'combi';
  _splitsTot  = waarde;

  document.querySelectorAll('[name="splits-niveau"]').forEach(r =>
    r.closest('.radio-chip')?.classList.remove('geselecteerd'));
  el.classList.add('geselecteerd');

  const maxN = _splitsGetallen.length > 0
    ? Math.max(waarde, ..._splitsGetallen)
    : waarde;

  _updateTypesUI(maxN, 'zonder');
  _updateSplitsKaarten();
}

  let _puntBrug = 'zonder';
  function selecteerPuntBrug(waarde, el) {
    _puntBrug = waarde;
    document.querySelectorAll('[name="punt-brug"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function toggleSplitsGetal(label, getal) {
  const cb  = label.querySelector('input');
  const was = cb.checked;
  cb.checked = !was;
  label.classList.toggle('geselecteerd', !was);
  label.querySelector('.vink-box').textContent = !was ? '✓' : '';

  if (!was) {
    if (!_splitsGetallen.includes(getal)) _splitsGetallen.push(getal);
  } else {
    _splitsGetallen = _splitsGetallen.filter(g => g !== getal);
  }

  _splitsMode = 'combi';

  const maxN = _splitsGetallen.length > 0
    ? Math.max(_splitsTot, ..._splitsGetallen)
    : _splitsTot;

  _updateTypesUI(maxN, 'zonder');
  _updateSplitsKaarten();
}

function _getSplitsConfig() {
  const basisGetallen =
    _splitsTot <= 5  ? [3, 4, 5] :
    _splitsTot <= 10 ? [3, 4, 5, 6, 7, 8, 9, 10] :
    _splitsTot <= 20 ? [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] :
    Array.from({ length: 98 }, (_, i) => i + 3);

  const gecombineerd = [...new Set([...basisGetallen, ..._splitsGetallen])].sort((a, b) => a - b);

  return {
    mode: 'specifiek',
    getallen: gecombineerd,
    niveau: gecombineerd.length ? Math.max(...gecombineerd) : _splitsTot
  };
}

  function toggleVoorbeeld(label) {
    const cb = label.querySelector('input');
    const was = cb.checked;
    cb.checked = !was;
    label.classList.toggle('geselecteerd', !was);
    label.querySelector('.vink-box').textContent = !was ? '\u2713' : '';
  }

  /* ── Tafels: tafelkeuze en types ────────────────────────── */
  let _tafelsKeuze = [2]; // standaard tafel van 2
  let _tafelPositie = 'vooraan';
  let _tafelMax = 10;

  function toggleTafel(label, tafel) {
    const cb  = label.querySelector('input');
    const was = cb.checked;
    cb.checked = !was;
    label.classList.toggle('geselecteerd', !was);
    label.querySelector('.vink-box').textContent = !was ? '✓' : '';
    if (!was) {
      if (!_tafelsKeuze.includes(tafel)) _tafelsKeuze.push(tafel);
    } else {
      _tafelsKeuze = _tafelsKeuze.filter(t => t !== tafel);
    }
  }

  function toggleTafelType(label, type) {
    const cb  = label.querySelector('input');
    const was = cb.checked;

    const breedTypes = ['Redeneren', 'Koppel'];
    const normalTypes = ['Vermenigvuldigen', 'Gedeeld door', 'Ontbrekende factor', 'Gemengd'];

    if (type === 'Gemengd') {
      // Gemengd: alle andere uitvinken
      document.querySelectorAll('#cg-tafels-types .vink-chip').forEach(l => {
        l.classList.remove('geselecteerd');
        l.querySelector('input').checked = false;
        l.querySelector('.vink-box').textContent = '';
      });
      cb.checked = true;
      label.classList.add('geselecteerd');
      label.querySelector('.vink-box').textContent = '✓';
    } else if (breedTypes.includes(type)) {
      // Redeneren / Koppel: alle andere types uitvinken (ze staan alleen)
      document.querySelectorAll('#cg-tafels-types .vink-chip').forEach(l => {
        l.classList.remove('geselecteerd');
        l.querySelector('input').checked = false;
        l.querySelector('.vink-box').textContent = '';
      });
      if (!was) {
        cb.checked = true;
        label.classList.add('geselecteerd');
        label.querySelector('.vink-box').textContent = '✓';
      }
    } else {
      // Normaal type: Redeneren/Koppel uitvinken als die aangevinkt waren
      document.querySelectorAll('#cg-tafels-types .vink-chip').forEach(l => {
        const v = l.querySelector('input').value;
        if (breedTypes.includes(v) || v === 'Gemengd') {
          l.classList.remove('geselecteerd');
          l.querySelector('input').checked = false;
          l.querySelector('.vink-box').textContent = '';
        }
      });
      cb.checked = !was;
      label.classList.toggle('geselecteerd', !was);
      label.querySelector('.vink-box').textContent = !was ? '✓' : '';
    }
  }

  function selecteerTafelMax(waarde, el) {
    _tafelMax = waarde;
    document.querySelectorAll('[name="tafel-max"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function selecteerTafelPositie(waarde, el) {
    _tafelPositie = waarde;
    document.querySelectorAll('[name="tafel-positie"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function voegTafelBlokToe() {
    const tafels = [..._tafelsKeuze].sort((a, b) => a - b);
    if (tafels.length === 0) {
      toonToast('⚠️ Kies minstens één tafel!', '#E74C3C');
      return;
    }
    const types = [...document.querySelectorAll('#cg-tafels-types input:checked')].map(c => c.value);
    if (types.length === 0) {
      toonToast('⚠️ Kies minstens één oefentype!', '#E74C3C');
      return;
    }
    const aantal = parseInt(document.getElementById('inp-aantal-tafels').value);
    const zin    = document.getElementById('inp-opdrachtzin-tafels').value.trim() || 'Reken de tafels.';

    const blok = Generator.maakBlok({
      bewerking: 'tafels',
      niveau: Math.max(...tafels) * 10,
      oefeningstypes: types,
      brug: 'zonder',
      aantalOefeningen: aantal,
      opdrachtzin: zin,
      hulpmiddelen: [],
      tafels,
      tafelPositie: _tafelPositie,
      tafelMax: _tafelMax,
    });

    if (!blok) {
      toonToast('⚠️ Te weinig oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
      return;
    }

    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast(`✅ Tafelblok toegevoegd! (${blok.oefeningen.length} oefeningen)`, '#27AE60');
  }

  /* ── Tafels inzicht ─────────────────────────────────────── */
  let _inzichtBewerking  = 'vermenigvuldigen';
  let _inzichtType       = 'afbeeldingen';
  let _inzichtModus      = 'per-tafel';
  let _inzichtTafel      = [2];
  let _inzichtTafelMax   = 5;
  let _inzichtMaxUitkomst = 24;
  let _inzichtEmoji      = 'afwisselend';
  let _glVariantInzicht  = 'getekend';
  let _verdelenType      = 'verdelen-emoji'; // actief weergave-type bij eerlijk verdelen

  function _defaultZinInzicht() {
    if (_inzichtType === 'getallenlijn') {
      if (_glVariantInzicht === 'delen-getekend')      return 'Kijk naar de getallenlijn. Schrijf de herhaalde aftrekking en de deling.';
      if (_glVariantInzicht === 'delen-zelf')          return 'Teken de sprongen op de getallenlijn. Schrijf de herhaalde aftrekking en de deling.';
      if (_glVariantInzicht === 'delen-rest-getekend') return 'Kijk naar de getallenlijn. Schrijf de deling met rest.';
      if (_glVariantInzicht === 'delen-rest-zelf')     return 'Teken de sprongen op de getallenlijn. Schrijf de deling met rest.';
      if (_glVariantInzicht === 'zelf')                return 'Teken de sprongen op de getallenlijn. Schrijf de vermenigvuldiging.';
      return 'Kijk naar de getallenlijn. Schrijf de herhaalde optelling en de vermenigvuldiging.';
    }
    if (_inzichtBewerking === 'delen-aftrekking') return 'Schrijf de herhaalde aftrekking en de deling.';
    if (_inzichtBewerking === 'delen-rest')       return 'Verdeel de afbeeldingen in groepen. Schrijf de deling met rest.';
    if (_inzichtBewerking === 'delen-verdelen')   return 'Verdeel eerlijk. Vul in.';
    return 'Schrijf de herhaalde optelling en de vermenigvuldiging.';
  }

  function selecteerInzichtBewerking(waarde, el) {
    _inzichtBewerking = waarde;
    document.querySelectorAll('[name="inzicht-bewerking"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    // Toon juiste weergave-knoppen
    const isVerdelen = waarde === 'delen-verdelen';
    document.getElementById('inzicht-type-normaal').style.display = isVerdelen ? 'none' : '';
    document.getElementById('inzicht-type-verdelen').style.display = isVerdelen ? '' : 'none';
    // Bij verdelen: emoji-kaart tonen (splitshuis/100veld hebben geen emoji-keuze nodig)
    if (isVerdelen) {
      const emojiKaart = document.getElementById('inzicht-emoji-kaart');
      if (emojiKaart) emojiKaart.style.display = _verdelenType === 'verdelen-emoji' ? 'block' : 'none';
      document.getElementById('inzicht-gl-kaart').style.display = 'none';
    } else {
      document.getElementById('inzicht-emoji-kaart').style.display = _inzichtType === 'afbeeldingen' ? 'block' : 'none';
      document.getElementById('inzicht-gl-kaart').style.display    = _inzichtType === 'getallenlijn'  ? 'block' : 'none';
      _filterGlVarianten(waarde);
    }
    document.getElementById('inp-opdrachtzin-inzicht').value = _defaultZinInzicht();
  }

  function _filterGlVarianten(bewerking) {
    const GROEP_MAP = {
      'vermenigvuldigen': 'verm',
      'delen-aftrekking': 'deel',
      'delen-rest':       'rest',
    };
    const STANDAARD = {
      'verm': 'getekend',
      'deel': 'delen-getekend',
      'rest': 'delen-rest-getekend',
    };
    const groep = GROEP_MAP[bewerking];
    if (!groep) return;
    const chips = document.querySelectorAll('#rg-gl-variant-inzicht label[data-groep]');
    chips.forEach(chip => {
      chip.style.display = chip.dataset.groep === groep ? '' : 'none';
      chip.classList.remove('geselecteerd');
    });
    // Selecteer automatisch de standaardvariant voor deze groep
    const standaard = STANDAARD[groep];
    const eersteChip = document.querySelector(`#rg-gl-variant-inzicht label[data-groep="${groep}"]`);
    if (eersteChip) {
      eersteChip.classList.add('geselecteerd');
      const radio = eersteChip.querySelector('input[type=radio]');
      if (radio) radio.checked = true;
      selecteerGlVariantInzicht(standaard, eersteChip);
    }
  }

  function selecteerVerdelenType(waarde, el) {
    _verdelenType = waarde;
    document.querySelectorAll('[name="inzicht-type-vd"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    // Emoji-kaart alleen tonen bij afbeeldings-variant
    const emojiKaart = document.getElementById('inzicht-emoji-kaart');
    if (emojiKaart) emojiKaart.style.display = waarde === 'verdelen-emoji' ? 'block' : 'none';
  }

  function selecteerInzichtType(waarde, el) {
    _inzichtType = waarde;
    document.querySelectorAll('[name="inzicht-type"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    document.getElementById('inzicht-emoji-kaart').style.display = waarde === 'afbeeldingen' ? 'block' : 'none';
    document.getElementById('inzicht-gl-kaart').style.display    = waarde === 'getallenlijn'  ? 'block' : 'none';
    if (waarde === 'getallenlijn') _filterGlVarianten(_inzichtBewerking);
    document.getElementById('inp-opdrachtzin-inzicht').value = _defaultZinInzicht();
  }

  function selecteerGlVariantInzicht(waarde, el) {
    _glVariantInzicht = waarde;
    document.querySelectorAll('[name="gl-variant-inzicht"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    const positieRij = document.getElementById('gl-positie-rij-inzicht');
    if (positieRij) positieRij.style.display = waarde === 'zelf' ? 'block' : 'none';
    document.getElementById('inp-opdrachtzin-inzicht').value = _defaultZinInzicht();
  }

  function selecteerInzichtModus(waarde, el) {
    _inzichtModus = waarde;
    document.querySelectorAll('[name="inzicht-modus"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    document.getElementById('inzicht-per-tafel').style.display  = waarde === 'per-tafel'   ? 'block' : 'none';
    document.getElementById('inzicht-tot-uitkomst').style.display = waarde === 'tot-uitkomst' ? 'block' : 'none';
  }

  function selecteerInzichtTafel(waarde, el) {
    const idx = _inzichtTafel.indexOf(waarde);
    if (idx === -1) {
      _inzichtTafel.push(waarde);
      el.classList.add('geselecteerd');
    } else {
      if (_inzichtTafel.length === 1) return; // altijd minstens 1
      _inzichtTafel.splice(idx, 1);
      el.classList.remove('geselecteerd');
    }
  }

  function selecteerInzichtTafelMax(waarde, el) {
    _inzichtTafelMax = waarde;
    document.querySelectorAll('[name="inzicht-tafel-max"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function selecteerInzichtMaxUitkomst(waarde, el) {
    _inzichtMaxUitkomst = waarde;
    document.querySelectorAll('[name="inzicht-max-uitkomst"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function selecteerInzichtEmoji(waarde, el) {
    _inzichtEmoji = waarde;
    document.querySelectorAll('[name="inzicht-emoji"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function voegInzichtBlokToe() {
    const aantal = parseInt(document.getElementById('inp-aantal-inzicht').value);
    const zin    = document.getElementById('inp-opdrachtzin-inzicht').value.trim() || _defaultZinInzicht();

    // ── Getallenlijn ─────────────────────────────────────────
    if (_inzichtType === 'getallenlijn' && _inzichtBewerking !== 'delen-verdelen') {
      const oefeningen = TafelsGetallenlijn.genereer({
        modus:            _inzichtModus,
        tafels:           _inzichtTafel,
        maxUitkomst:      _inzichtMaxUitkomst,
        tafelMax:         _inzichtTafelMax,
        aantalOefeningen: aantal,
        variant:          _glVariantInzicht,
        positie:          _glPositie,
      });
      if (!oefeningen || oefeningen.length === 0) {
        toonToast('⚠️ Geen oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
        return;
      }
      bundelData.push({
        id:           `blok-gl-${Date.now()}`,
        bewerking:    'tafels-getallenlijn',
        subtype:      _glVariantInzicht,
        niveau:       Math.max(..._inzichtTafel) * _inzichtTafelMax,
        opdrachtzin:  zin,
        hulpmiddelen: [],
        oefeningen,
        config: { modus: _inzichtModus, tafels: _inzichtTafel, tafelMax: _inzichtTafelMax,
                  maxUitkomst: _inzichtMaxUitkomst, variant: _glVariantInzicht },
      });
      Preview.render(bundelData);
      toonToast(`✅ Getallenlijn toegevoegd! (${oefeningen.length} oefeningen)`, '#27AE60');
      return;
    }

    // ── Eerlijk verdelen ──────────────────────────────────────
    if (_inzichtBewerking === 'delen-verdelen') {
      const inzichtType = _verdelenType; // 'verdelen-emoji' | 'verdelen-splitshuis' | 'verdelen-100veld'
      const oefeningen = TafelsInzicht.genereer({
        modus:            _inzichtModus,
        tafels:           _inzichtTafel,
        maxUitkomst:      _inzichtMaxUitkomst,
        tafelMax:         _inzichtTafelMax,
        aantalOefeningen: aantal,
        emojiSet:         _inzichtEmoji,
        inzichtType,
      });
      if (!oefeningen || oefeningen.length === 0) {
        toonToast('⚠️ Geen oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
        return;
      }
      bundelData.push({
        id:           `blok-inzicht-${Date.now()}-${bundelData.length + 1}`,
        bewerking:    'tafels-inzicht',
        subtype:      inzichtType,
        niveau:       Math.max(..._inzichtTafel) * (_inzichtTafelMax || 5),
        brug:         'zonder',
        opdrachtzin:  zin,
        hulpmiddelen: [],
        oefeningen,
        config: { modus: _inzichtModus, tafels: _inzichtTafel, tafelMax: _inzichtTafelMax,
                  maxUitkomst: _inzichtMaxUitkomst, emojiSet: _inzichtEmoji,
                  aantalOefeningen: aantal, inzichtType },
      });
      Preview.render(bundelData);
      toonToast(`✅ Verdeel-blok toegevoegd! (${oefeningen.length} oefeningen)`, '#27AE60');
      return;
    }

    // ── Afbeeldingen: vermenigvuldigen, delen-aftrekking of delen-rest ─
    const isDeelAftr = _inzichtBewerking === 'delen-aftrekking';
    const isDeelRest = _inzichtBewerking === 'delen-rest';
    const inzichtType = isDeelAftr ? 'delen-aftrekking' : isDeelRest ? 'delen-rest' : 'groepjes';
    const oefeningen = TafelsInzicht.genereer({
      modus:            _inzichtModus,
      tafels:           _inzichtTafel,
      maxUitkomst:      _inzichtMaxUitkomst,
      tafelMax:         _inzichtTafelMax,
      aantalOefeningen: aantal,
      emojiSet:         _inzichtEmoji,
      inzichtType,
    });
    if (!oefeningen || oefeningen.length === 0) {
      toonToast('⚠️ Geen oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
      return;
    }
    bundelData.push({
      id:           `blok-inzicht-${Date.now()}-${bundelData.length + 1}`,
      bewerking:    'tafels-inzicht',
      subtype:      inzichtType,
      niveau:       Math.max(..._inzichtTafel) * (_inzichtTafelMax || 5),
      brug:         'zonder',
      opdrachtzin:  zin,
      hulpmiddelen: [],
      oefeningen,
      config: { modus: _inzichtModus, tafels: _inzichtTafel, tafelMax: _inzichtTafelMax,
                maxUitkomst: _inzichtMaxUitkomst, emojiSet: _inzichtEmoji,
                aantalOefeningen: aantal, inzichtType },
    });
    Preview.render(bundelData);
    toonToast(`✅ ${isDeelRest ? 'Deelblok (rest)' : isDeelAftr ? 'Deelblok' : 'Inzichtblok'} toegevoegd! (${oefeningen.length} oefeningen)`, '#27AE60');
  }

  /* ── Preview en PDF ──────────────────────────────────────── */
  function genereerPreview() {
    Preview.render(bundelData);
    toonToast('✅ Preview bijgewerkt');
  }

  function downloadPDF() {
    if (bundelData.length === 0) return;
    const titel = document.getElementById('bundel-titel').value.trim() || 'Rekenbundel';
    PdfEngine.genereer(bundelData, titel);
    toonToast('📄 PDF gedownload!', '#27AE60');
  }

  function downloadSleutel() {
    if (bundelData.length === 0) return;
    const titel = document.getElementById('bundel-titel').value.trim() || 'Rekenbundel';
    PdfEngine.genereer(bundelData, titel, true);
    toonToast('🔑 Oplossingssleutel gedownload!', '#27AE60');
  }

  /* ── Initialisatie ───────────────────────────────────────── */
  function init() {
    _updateTypesUI(20, 'zonder');
    Preview.render(bundelData);


  }

  /* ── Tafels getallenlijn ─────────────────────────────────── */
  let _glVariant     = 'getekend';
  let _glModus       = 'per-tafel';
  let _glTafel       = 2;
  let _glTafelMax    = 5;
  let _glMaxUitkomst = 30;
  let _glPositie     = 'vooraan';

  function selecteerGlVariant(waarde, el) {
    _glVariant = waarde;
    document.querySelectorAll('[name="gl-variant"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    const positieRij = document.getElementById('gl-positie-rij');
    if (positieRij) positieRij.style.display = waarde === 'zelf' ? 'block' : 'none';
  }

  function selecteerGlPositie(waarde, el) {
    _glPositie = waarde;
    document.querySelectorAll('[name="gl-positie"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function selecteerGlModus(waarde, el) {
    _glModus = waarde;
    document.querySelectorAll('[name="gl-modus"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    document.getElementById('gl-per-tafel').style.display    = waarde === 'per-tafel'    ? 'block' : 'none';
    document.getElementById('gl-tot-uitkomst').style.display = waarde === 'tot-uitkomst' ? 'block' : 'none';
  }

  function selecteerGlTafel(waarde, el) {
    _glTafel = waarde;
    document.querySelectorAll('[name="gl-tafel"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function selecteerGlTafelMax(waarde, el) {
    _glTafelMax = waarde;
    document.querySelectorAll('[name="gl-tafel-max"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function selecteerGlMaxUitkomst(waarde, el) {
    _glMaxUitkomst = waarde;
    document.querySelectorAll('[name="gl-max-uitkomst"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function voegGlBlokToe() {
    const aantal = parseInt(document.getElementById('inp-aantal-gl').value) || 4;
    const zin    = document.getElementById('inp-opdrachtzin-gl').value.trim()
                   || (_glVariant === 'getekend'
                       ? 'Kijk naar de getallenlijn. Schrijf de herhaalde optelling en de vermenigvuldiging.'
                       : 'Teken de sprongen op de getallenlijn. Schrijf de vermenigvuldiging.');

    const oefeningen = TafelsGetallenlijn.genereer({
      modus:            _glModus,
      tafel:            _glTafel,
      maxUitkomst:      _glMaxUitkomst,
      tafelMax:         _glTafelMax,
      aantalOefeningen: aantal,
      variant:          _glVariant,
    });

    if (!oefeningen || oefeningen.length === 0) {
      toonToast('⚠️ Geen oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
      return;
    }

    const blok = {
      id:          `blok-gl-${Date.now()}`,
      bewerking:   'tafels-getallenlijn',
      subtype:     _glVariant,
      niveau:      _glTafel * _glTafelMax,
      opdrachtzin: zin,
      hulpmiddelen: [],
      oefeningen,
      config: { modus: _glModus, tafel: _glTafel, tafelMax: _glTafelMax,
                maxUitkomst: _glMaxUitkomst, variant: _glVariant, aantalOefeningen: aantal },
    };

    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast(`✅ Getallenlijn toegevoegd! (${oefeningen.length} oefeningen)`, '#27AE60');
  }


  /* ══════════════════════════════════════════════════════════════
     CIJFEREN
     ══════════════════════════════════════════════════════════════ */

  let _cijferBewerking      = 'optellen';
  let _cijferBereik         = 100;
  let _cijferBrug           = 'beide';
  let _cijferTafels         = [2, 3, 4, 5];
  let _cijferVermPositie    = 'tafel-links';
  let _cijferVermType       = 'TxE';       // T×E, TE×E, beide
  let _cijferVermBrug       = 'zonder';    // zonder, E, T, ET, met
  let _cijferDeelType       = 'TE:E';      // TE÷E (uitbreidbaar)
  let _cijferDeelRest       = 'nee';       // nee = zonder rest
  let _cijferKommaType      = 'Et_plus_Et'; // Et_plus_Et, Et_min_Et, Et_gemengd
  let _cijferKommaBrug      = 'beide';     // beide, met, zonder
  let _cijferInvulling      = 'ingevuld';
  let _cijferStartpijl      = true;
  let _cijferSchatting      = false;

  function selecteerCijferBewerking(waarde, el) {
    _cijferBewerking = waarde;
    document.querySelectorAll('[name="cijfer-bewerking"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');

    const isKeer    = waarde === 'vermenigvuldigen';
    const isDeel    = waarde === 'delen';
    const isKomma   = waarde === 'komma';
    const isPlusMin = !isKeer && !isDeel && !isKomma;
    const isAftrek  = waarde === 'aftrekken';

    const kaartBereik   = document.getElementById('kaart-cijfer-bereik');
    const kaartBrug     = document.getElementById('kaart-cijfer-brug');
    const kaartVerm     = document.getElementById('kaart-cijfer-verm');
    const kaartDeel     = document.getElementById('kaart-cijfer-deel');
    const kaartKomma    = document.getElementById('kaart-cijfer-komma');
    const chipBrugNul   = document.getElementById('chip-brug-over-nul');

    if (kaartBereik) kaartBereik.style.display = isPlusMin ? 'block' : 'none';
    if (kaartBrug)   kaartBrug.style.display   = isPlusMin ? 'block' : 'none';
    if (kaartVerm)   kaartVerm.style.display   = isKeer    ? 'block' : 'none';
    if (kaartDeel)   kaartDeel.style.display   = isDeel    ? 'block' : 'none';
    if (kaartKomma)  kaartKomma.style.display  = isKomma   ? 'block' : 'none';
    // "Brug over nul" enkel zichtbaar bij aftrekken
    if (chipBrugNul) chipBrugNul.style.display = isAftrek  ? '' : 'none';

    const zinInp = document.getElementById('inp-opdrachtzin-cijferen');
    if (zinInp) {
      if (isKeer)       zinInp.value = 'Vermenigvuldig met cijferen.';
      else if (isDeel)  zinInp.value = 'Deel met cijferen.';
      else if (isKomma) zinInp.value = 'Reken met kommagetallen.';
      else              zinInp.value = 'Reken met cijferen.';
    }
  }

  function selecteerCijferVermType(waarde, el) {
    _cijferVermType = waarde;
    document.querySelectorAll('[name="cijfer-verm-type"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferVermBrug(waarde, el) {
    _cijferVermBrug = waarde;
    document.querySelectorAll('[name="cijfer-verm-brug"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferBereik(waarde, el) {
    _cijferBereik = parseInt(waarde);
    ['cijfer-bereik', 'cijfer-bereik-t'].forEach(naam => {
      document.querySelectorAll(`[name="${naam}"]`).forEach(r =>
        r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    });
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferBrug(waarde, el) {
    _cijferBrug = waarde;
    document.querySelectorAll('[name="cijfer-brug"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function toggleCijferTafel(el, tafel) {
    const cb  = el.querySelector('input[type="checkbox"]');
    const box = el.querySelector('.vink-box');
    const idx = _cijferTafels.indexOf(tafel);
    if (idx === -1) {
      _cijferTafels.push(tafel);
      el.classList.add('geselecteerd');
      if (box) box.textContent = '✓';
      if (cb)  cb.checked = true;
    } else {
      if (_cijferTafels.length <= 1) return;
      _cijferTafels.splice(idx, 1);
      el.classList.remove('geselecteerd');
      if (box) box.textContent = '';
      if (cb)  cb.checked = false;
    }
  }

  function selecteerCijferVermPositie(waarde, el) {
    _cijferVermPositie = waarde;
    document.querySelectorAll('[name="cijfer-verm-positie"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferInvulling(waarde, el) {
    _cijferInvulling = waarde;
    document.querySelectorAll('[name="cijfer-invulling"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferStartpijl(waarde, el) {
    _cijferStartpijl = waarde;
    document.querySelectorAll('[name="cijfer-startpijl"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferSchatting(waarde, el) {
    _cijferSchatting = waarde;
    document.querySelectorAll('[name="cijfer-schatting"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferKommaType(waarde, el) {
    _cijferKommaType = waarde;
    document.querySelectorAll('[name="cijfer-komma-type"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferKommaBrug(waarde, el) {
    _cijferKommaBrug = waarde;
    document.querySelectorAll('[name="cijfer-komma-brug"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferDeelType(waarde, el) {
    _cijferDeelType = waarde;
    document.querySelectorAll('[name="cijfer-deel-type"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerCijferDeelRest(waarde, el) {
    _cijferDeelRest = waarde;
    document.querySelectorAll('[name="cijfer-deel-rest"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function voegCijferenBlokToe() {
    const aantal = parseInt(document.getElementById('inp-aantal-cijferen').value) || 12;
    const zin    = document.getElementById('inp-opdrachtzin-cijferen').value.trim()
                   || 'Reken met cijferen.';

    const oefeningen = Cijferen.genereer({
      bewerking:             _cijferBewerking,
      bereik:                _cijferBereik,
      brug:                  _cijferBrug,
      aantalOefeningen:      aantal,
      tafels:                _cijferTafels,
      vermType:              _cijferVermType,
      vermBrug:              _cijferVermBrug,
      deelType:              _cijferDeelType,
      metRest:               _cijferDeelRest === 'ja',
      kommaType:             _cijferKommaType,
      kommaBrug:             _cijferKommaBrug,
    });

    if (!oefeningen || oefeningen.length === 0) {
      toonToast('⚠️ Geen oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
      return;
    }

    const blok = {
      id:          `blok-cijferen-${Date.now()}`,
      bewerking:   'cijferen',
      subtype:     _cijferBewerking,
      niveau:      _cijferBereik,
      brug:        _cijferBrug,
      opdrachtzin: zin,
      hulpmiddelen: [],
      oefeningen,
      config: {
        bewerking:             _cijferBewerking,
        bereik:                _cijferBereik,
        brug:                  _cijferBrug,
        tafels:                [..._cijferTafels],
        vermType:              _cijferVermType,
        vermBrug:              _cijferVermBrug,
        deelType:              _cijferDeelType,
        metRest:               _cijferDeelRest === 'ja',
        kommaType:             _cijferKommaType,
        kommaBrug:             _cijferKommaBrug,
        invulling:             _cijferInvulling,
        startpijl:             _cijferStartpijl,
        schatting:             _cijferSchatting,
        aantalOefeningen:      aantal,
      },
    };

    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast(`✅ Cijferblok toegevoegd! (${oefeningen.length} oefeningen)`, '#27AE60');
  }

  /* ── Rekentaal: blok toevoegen ─────────────────────────────── */
  /* ── Vraagstukken: blok toevoegen vanuit VraagstukkenModule ── */
  function voegVraagstukBlokToe(blok) {
    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast('✅ Vraagstuk toegevoegd aan bundel!', '#27AE60');
  }

  /* ── Rekentaal: blok toevoegen vanuit RekentaalModule ───────── */
  function voegRekentaalBlokToe(blok) {
    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast(`✅ Rekentaalblok toegevoegd! (${blok.oefeningen.length} oefeningen)`, '#7c3aed');
  }

  /* ══════════════════════════════════════════════════════════════
     SCHATTEND REKENEN
     ══════════════════════════════════════════════════════════════ */

  let _schattenType       = 'afronden';
  let _schattenNiveau     = 10000;
  let _schattenBewerking  = 'optellen';
  let _schattenAfronden   = 'H';

  function selecteerSchattenType(waarde, el) {
    _schattenType = waarde;
    document.querySelectorAll('[name="schatten-type"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
    _updateSchattenUI();
    const zinInp = document.getElementById('inp-opdrachtzin-schatten');
    if (zinInp) zinInp.value = _defaultZinSchatten();
  }

  function selecteerSchattenNiveau(waarde, el) {
    _schattenNiveau = parseInt(waarde);
    document.querySelectorAll('[name="schatten-niveau"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
    _updateSchattenAfrondenUI();
  }

  function _updateSchattenAfrondenUI() {
    const tot1000 = _schattenNiveau <= 1000;
    const chipT = document.getElementById('chip-schatten-T');
    const chipH = document.getElementById('chip-schatten-H');
    const chipD = document.getElementById('chip-schatten-D');
    const hint  = document.getElementById('schatten-afronden-hint');

    // Tot 1000: T en H zichtbaar, D verborgen
    // Tot 10000: H en D zichtbaar, T verborgen
    if (chipT) chipT.style.display = tot1000 ? '' : 'none';
    if (chipD) chipD.style.display = tot1000 ? 'none' : '';

    // Als huidige keuze niet meer geldig is: reset naar H
    if (tot1000 && _schattenAfronden === 'D') {
      _schattenAfronden = 'H';
      document.querySelectorAll('[name="schatten-afronden"]').forEach(r =>
        r.closest('.radio-chip')?.classList.remove('geselecteerd'));
      if (chipH) chipH.classList.add('geselecteerd');
    }
    if (!tot1000 && _schattenAfronden === 'T') {
      _schattenAfronden = 'H';
      document.querySelectorAll('[name="schatten-afronden"]').forEach(r =>
        r.closest('.radio-chip')?.classList.remove('geselecteerd'));
      if (chipH) chipH.classList.add('geselecteerd');
    }

    // Hint tekst aanpassen
    if (hint) {
      hint.textContent = tot1000
        ? 'Tot 1.000: afronden naar tiental (bv. 852 → 850) of honderdtal (bv. 852 → 900).'
        : 'Tot 10.000: afronden naar honderdtal of duizendtal.';
    }
  }

  function selecteerSchattenBewerking(waarde, el) {
    _schattenBewerking = waarde;
    document.querySelectorAll('[name="schatten-bewerking"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function selecteerSchattenAfronden(waarde, el) {
    _schattenAfronden = waarde;
    document.querySelectorAll('[name="schatten-afronden"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    if (el) el.classList.add('geselecteerd');
  }

  function _updateSchattenUI() {
    const isAfronden = _schattenType === 'afronden';
    const kaartBew = document.getElementById('kaart-schatten-bewerking');
    if (kaartBew) kaartBew.style.display = isAfronden ? 'none' : 'block';
    // Afronden-kaart: verborgen bij type 'afronden' (beide kolommen altijd getoond)
    const kaartAf = document.getElementById('kaart-schatten-afronden');
    if (kaartAf) kaartAf.style.display = isAfronden ? 'none' : 'block';
    // Pas opdrachtzin aan
    const zinInp = document.getElementById('inp-opdrachtzin-schatten');
    if (zinInp) zinInp.value = _defaultZinSchatten();
    _updateSchattenAfrondenUI();
  }

  function voegSchattenBlokToe() {
    const aantal = parseInt(document.getElementById('inp-aantal-schatten').value) || 4;
    const zin    = document.getElementById('inp-opdrachtzin-schatten').value.trim()
                   || _defaultZinSchatten();
    let oefeningen = [];

    if (_schattenBewerking === 'gemengd' && _schattenType !== 'afronden') {
      const aantalOpt = Math.ceil(aantal / 2);
      const aantalAft = aantal - aantalOpt;
      const fnMap = {
        'schatting-tabel':   Schatten.genereerSchattingTabel,
        'schatting-compact': Schatten.genereerSchattingCompact,
        'mogelijk':          Schatten.genereerMogelijk,
      };
      const fn = fnMap[_schattenType] || Schatten.genereerSchattingTabel;
      const opt = fn({ niveau: _schattenNiveau, bewerking: 'optellen', afrondenNaar: _schattenAfronden, aantalOefeningen: aantalOpt });
      const aft = fn({ niveau: _schattenNiveau, bewerking: 'aftrekken', afrondenNaar: _schattenAfronden, aantalOefeningen: aantalAft });
      const alle = [...opt, ...aft];
      for (let i = alle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alle[i], alle[j]] = [alle[j], alle[i]];
      }
      oefeningen = alle;
    } else if (_schattenType === 'afronden') {
      oefeningen = Schatten.genereerAfronden({ niveau: _schattenNiveau, aantalOefeningen: aantal });
    } else if (_schattenType === 'schatting-tabel') {
      oefeningen = Schatten.genereerSchattingTabel({ niveau: _schattenNiveau, bewerking: _schattenBewerking, afrondenNaar: _schattenAfronden, aantalOefeningen: aantal });
    } else if (_schattenType === 'schatting-compact') {
      oefeningen = Schatten.genereerSchattingCompact({ niveau: _schattenNiveau, bewerking: _schattenBewerking, afrondenNaar: _schattenAfronden, aantalOefeningen: aantal });
    } else if (_schattenType === 'mogelijk') {
      oefeningen = Schatten.genereerMogelijk({ niveau: _schattenNiveau, bewerking: _schattenBewerking, afrondenNaar: _schattenAfronden, aantalOefeningen: aantal });
    }

    if (!oefeningen || oefeningen.length === 0) {
      toonToast('⚠️ Geen oefeningen gevonden. Pas de instellingen aan.', '#E74C3C');
      return;
    }

    const blok = {
      id:          `blok-schatten-${Date.now()}`,
      bewerking:   'schatten',
      subtype:     _schattenType,
      niveau:      _schattenNiveau,
      opdrachtzin: zin,
      hulpmiddelen: [],
      oefeningen,
      config: {
        type:         _schattenType,
        niveau:       _schattenNiveau,
        bewerking:    _schattenBewerking,
        afrondenNaar: _schattenAfronden,
        aantalOefeningen: aantal,
      },
    };

    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast(`✅ Schattingsblok toegevoegd! (${oefeningen.length} oefeningen)`, '#e8780a');
  }

  function _defaultZinSchatten() {
    if (_schattenType === 'afronden')        return 'Rond het getal af. Schrijf in de tabel.';
    if (_schattenType === 'mogelijk')        return 'Is het antwoord mogelijk? Controleer door schattend te rekenen.';
    if (_schattenType === 'schatting-tabel') return 'Maak bij elke oefening een goede schatting.';
    return 'Reken schattend uit.';
  }

  /* ══════════════════════════════════════════════════════════════
     GEMENGD OPTELLEN & AFTREKKEN
     ══════════════════════════════════════════════════════════════ */

  let _gemengdNiveau     = 100;
  let _gemengdBrug       = 'zonder';
  let _gemengdVerhouding = '50-50';

  function selecteerGemengdNiveau(waarde, el) {
    _gemengdNiveau = waarde;
    document.querySelectorAll('[name="gem-niveau"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    // Brug verbergen bij niveau ≤ 10 (geen brug mogelijk)
    const kaartBrug = document.getElementById('kaart-gem-brug');
    const kaartHulp = document.getElementById('kaart-gem-hulpmiddelen');
    if (kaartBrug) kaartBrug.style.display = waarde <= 10 ? 'none' : 'block';
    if (waarde <= 10) {
      if (kaartHulp) kaartHulp.style.display = 'none';
      _gemengdBrug = 'zonder';
    } else {
      // Subkeuze tonen/verbergen op basis van huidig hoofd-brug + nieuw niveau
      _updateGemengdBrugSubUI();
      _gemengdBrug = _getGemengdBrugWaarde();
    }
    _updateGemengdTypesUI();
  }

  function selecteerGemengdBrugHoofd(waarde, el) {
    document.querySelectorAll('[name="gem-brug-hoofd"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    _updateGemengdBrugSubUI();
    _gemengdBrug = _getGemengdBrugWaarde();
    // Hulpmiddelen tonen bij met/beide brug
    const kaartHulp = document.getElementById('kaart-gem-hulpmiddelen');
    if (kaartHulp) kaartHulp.style.display = (waarde === 'met' || waarde === 'beide') ? 'block' : 'none';
    _updateGemengdTypesUI();
  }

  function selecteerGemengdBrugSub(waarde, el) {
    document.querySelectorAll('[name="gem-brug-sub"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
    _gemengdBrug = _getGemengdBrugWaarde();
    _updateGemengdTypesUI();
  }

  function _getGemengdBrugWaarde() {
    const hoofd = document.querySelector('[name="gem-brug-hoofd"]:checked')?.value || 'zonder';
    if (hoofd === 'zonder') return 'zonder';
    if (_gemengdNiveau >= 1000) {
      if (hoofd === 'beide') return 'gemengd';
      const sub = document.querySelector('[name="gem-brug-sub"]:checked')?.value || 'naar-tiental';
      return sub; // naar-tiental / naar-honderdtal / beide
    }
    // Tot 100: met = 'met', beide = 'gemengd'
    return hoofd === 'beide' ? 'gemengd' : 'met';
  }

  function _updateGemengdBrugSubUI() {
    const hoofd = document.querySelector('[name="gem-brug-hoofd"]:checked')?.value || 'zonder';
    const rijSub = document.getElementById('rij-gem-brug-sub');
    if (rijSub) rijSub.style.display = (_gemengdNiveau >= 1000 && hoofd === 'met') ? 'block' : 'none';
  }

  function selecteerGemengdVerhouding(waarde, el) {
    _gemengdVerhouding = waarde;
    document.querySelectorAll('[name="gem-verhouding"]').forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function selecteerGemengdRadio(naam, waarde, el) {
    document.querySelectorAll(`[name="${naam}"]`).forEach(r =>
      r.closest('.radio-chip')?.classList.remove('geselecteerd'));
    el.classList.add('geselecteerd');
  }

  function toggleGemengdHulpmiddel(label, waarde) {
    const cb  = label.querySelector('input');
    const was = cb.checked;
    cb.checked = !was;
    label.classList.toggle('geselecteerd', !was);
    label.querySelector('.vink-box').textContent = !was ? '✓' : '';
    if (waarde === 'schrijflijnen') {
      const rij = document.getElementById('rij-gem-schrijflijnen-aantal');
      if (rij) rij.style.display = !was ? 'block' : 'none';
    }
    if (waarde === 'splitsbeen') {
      const rij = document.getElementById('rij-gem-splitspositie');
      if (rij) rij.style.display = !was ? 'block' : 'none';
    }
  }

  function _vulTypesContainer(containerId, bewerking, niveau, brug) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const brugVoor = niveau <= 100
      ? (brug === 'zonder' || brug === 'gemengd' ? brug : 'met')
      : brug;
    const types = Generator.getTypes(bewerking, niveau, brugVoor);
    container.innerHTML = '';

    // "Alles gemengd" chip eerst
    const labelGemengd = document.createElement('label');
    labelGemengd.className = 'vink-chip';
    labelGemengd.dataset.type = '__alles__';
    labelGemengd.innerHTML = `
      <span class="vink-box"></span>
      <input type="checkbox" value="__alles__" style="display:none">
      <span>Alles gemengd</span>`;
    labelGemengd.onclick = (e) => {
      e.preventDefault();
      const cb  = labelGemengd.querySelector('input');
      const was = cb.checked;
      // Alles gemengd: alle andere uitvinken
      container.querySelectorAll('.vink-chip').forEach(l => {
        l.classList.remove('geselecteerd');
        l.querySelector('input').checked = false;
        l.querySelector('.vink-box').textContent = '';
      });
      if (!was) {
        cb.checked = true;
        labelGemengd.classList.add('geselecteerd');
        labelGemengd.querySelector('.vink-box').textContent = '✓';
      }
    };
    container.appendChild(labelGemengd);

    // Individuele types (zonder Gemengd en Maak eerst 10)
    types.forEach(type => {
      if (type === 'Gemengd' || type === 'Maak eerst 10') return;
      const label = document.createElement('label');
      label.className = 'vink-chip';
      label.dataset.type = type;
      label.innerHTML = `
        <span class="vink-box"></span>
        <input type="checkbox" value="${type}" style="display:none">
        <span>${type}</span>`;
      label.onclick = (e) => {
        e.preventDefault();
        // Als "Alles gemengd" aan was: uitvinken
        const cbAlles = container.querySelector('[value="__alles__"]');
        if (cbAlles?.checked) {
          cbAlles.checked = false;
          labelGemengd.classList.remove('geselecteerd');
          labelGemengd.querySelector('.vink-box').textContent = '';
        }
        const cb  = label.querySelector('input');
        const was = cb.checked;
        cb.checked = !was;
        label.classList.toggle('geselecteerd', !was);
        label.querySelector('.vink-box').textContent = !was ? '✓' : '';
      };
      container.appendChild(label);
    });

    // Standaard: eerste type selecteren
    const eerste = container.querySelector('.vink-chip');
    if (eerste) eerste.click();
  }

  function _updateGemengdTypesUI() {
    const brug = _gemengdBrug;
    _vulTypesContainer('cg-gem-opt-types', 'optellen',  _gemengdNiveau, brug);
    _vulTypesContainer('cg-gem-aft-types', 'aftrekken', _gemengdNiveau, brug);
  }

  function _getGemengdTypes(containerId, alleTypes) {
    // Als "Alles gemengd" aangevinkt: geef alle types terug (zonder Gemengd/Maak eerst 10)
    const cbAlles = document.querySelector(`#${containerId} [value="__alles__"]`);
    if (cbAlles?.checked) return alleTypes.filter(t => t !== 'Gemengd' && t !== 'Maak eerst 10');
    return [...document.querySelectorAll(`#${containerId} input:checked`)].map(c => c.value);
  }

  function voegGemengdBlokToe() {
    const brugVoor = _gemengdNiveau <= 100
      ? (_gemengdBrug === 'zonder' || _gemengdBrug === 'gemengd' ? _gemengdBrug : 'met')
      : _gemengdBrug;
    const alleOpt = Generator.getTypes('optellen',  _gemengdNiveau, brugVoor).filter(t => t !== 'Gemengd' && t !== 'Maak eerst 10');
    const alleAft = Generator.getTypes('aftrekken', _gemengdNiveau, brugVoor).filter(t => t !== 'Gemengd' && t !== 'Maak eerst 10');

    const typesOpt = _getGemengdTypes('cg-gem-opt-types', alleOpt);
    const typesAft = _getGemengdTypes('cg-gem-aft-types', alleAft);
    if (typesOpt.length === 0) { toonToast('⚠️ Kies minstens één opteltype!', '#E74C3C'); return; }
    if (typesAft.length === 0) { toonToast('⚠️ Kies minstens één aftrekkingstype!', '#E74C3C'); return; }

    const hulpmiddelen       = [...document.querySelectorAll('[name="gem-hulpmiddelen"]:checked')].map(c => c.value);
    const schrijflijnenAantal = parseInt(document.querySelector('[name="gem-schrijflijnen-aantal"]:checked')?.value || '2');
    const splitspositie       = document.querySelector('[name="gem-splitspositie"]:checked')?.value || 'aftrekker';

    const aantal = parseInt(document.getElementById('inp-aantal-gemengd').value) || 16;
    const zin    = document.getElementById('inp-opdrachtzin-gemengd').value.trim()
                   || 'Kijk goed naar het teken. Reken uit.';

    const blok = Generator.maakGemengdBlok({
      niveau:           _gemengdNiveau,
      brug:             _gemengdBrug,
      typesOpt,
      typesAft,
      aantalOefeningen: aantal,
      opdrachtzin:      zin,
      verhouding:       _gemengdVerhouding,
      hulpmiddelen,
      schrijflijnenAantal,
      splitspositie,
    });
    if (!blok) { toonToast('⚠️ Te weinig oefeningen. Pas de instellingen aan.', '#E74C3C'); return; }
    bundelData.push(blok);
    Preview.render(bundelData);
    toonToast(`✅ Gemengd blok toegevoegd! (${blok.oefeningen.length} oefeningen)`, '#FF8C00');
  }

  return {
    init, toonBewerking, selecteerRadio, selecteerBrugHoofd, selecteerBrugSub, selecteerStrategie, _updateHulpmiddelenUI, toggleHulpmiddel, toggleVoorbeeld,
    selecteerSplitsNiveau, toggleSplitsGetal, toggleGrootGetal, selecteerPuntBrug,
    toggleTafel, toggleTafelType, selecteerTafelMax, selecteerTafelPositie, voegTafelBlokToe,
    selecteerInzichtModus, selecteerInzichtTafel, selecteerInzichtTafelMax, selecteerInzichtMaxUitkomst, selecteerInzichtEmoji, selecteerInzichtType, selecteerInzichtBewerking, selecteerGlVariantInzicht, voegInzichtBlokToe, selecteerVerdelenType,
    selecteerGlVariant, selecteerGlModus, selecteerGlTafel, selecteerGlTafelMax, selecteerGlMaxUitkomst, selecteerGlPositie, voegGlBlokToe,
    voegBlokToe, verwijderBlok, verwijderOefening,
    voegOefeningToe, bewerkZin, slaZinOp,
    genereerPreview, downloadPDF, downloadSleutel,
    selecteerCijferBewerking, selecteerCijferBereik, selecteerCijferBrug,
    selecteerCijferVermType, selecteerCijferVermBrug,
    selecteerCijferDeelType, selecteerCijferDeelRest,
    selecteerCijferKommaType, selecteerCijferKommaBrug,
    toggleCijferTafel, selecteerCijferVermPositie,
    selecteerCijferInvulling, selecteerCijferStartpijl, selecteerCijferSchatting,
    voegCijferenBlokToe,
    voegVraagstukBlokToe,
    voegRekentaalBlokToe,
    selecteerSchattenType, selecteerSchattenNiveau, selecteerSchattenBewerking, selecteerSchattenAfronden,
    voegSchattenBlokToe,
    selecteerGemengdNiveau, selecteerGemengdBrugHoofd, selecteerGemengdBrugSub, selecteerGemengdVerhouding, selecteerGemengdRadio, toggleGemengdHulpmiddel, voegGemengdBlokToe,
    toonToast,
  };
})();

document.addEventListener('DOMContentLoaded', App.init);