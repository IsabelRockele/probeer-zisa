/* ══════════════════════════════════════════════════════════════
   generator.js
   Verantwoordelijkheid: bundel-data array opbouwen
   - Weet welke module gebruikt moet worden per bewerking+niveau
   - Roept de juiste module aan met de juiste config
   - Geeft een volledig blok-object terug voor de bundel-data
   ══════════════════════════════════════════════════════════════ */

const Generator = (() => {

  let _teller = 0;

  /* ── Kies de juiste module op basis van bewerking + niveau ── */
  function _getModule(bewerking, niveau, brug = 'zonder', strategie = 'aftrekker', oefeningstypes = []) {
    if (bewerking === 'aanvullen') return niveau >= 10000 ? AanvullenTot10000 : niveau >= 1000 ? AanvullenTot1000 : AanvullenTot100;
    if (bewerking === 'optellen') {
      if (niveau <= 20)    return OptellenTot20;
      if (niveau <= 100)   return OptellenTot100;
      if (niveau <= 1000)  return OptellenTot1000;
      if (niveau <= 10000) return brug === 'zonder' ? OptellenTot10000 : OptellenTot10000Brug;
    }
    if (bewerking === 'aftrekken') {
      if (niveau <= 20)    return AftrekkenTot20;
      if (niveau <= 100)   return AftrekkenTot100;
      if (niveau <= 1000)  return AftrekkenTot1000;
      if (niveau <= 10000) {
        if (brug === 'zonder') return AftrekkenTot10000;
        // DH-HT en D-HT types hebben eigen module
        if (oefeningstypes.some(t => t === 'DH-HT' || t === 'D-HT')) {
          return AftrekkenTot10000BrugHt;
        }
        if (strategie === 'aftrektal')    return AftrekkenTot10000BrugAftrektal;
        if (strategie === 'rekenfeiten')  return AftrekkenTot10000BrugRekenfeiten;
        return AftrekkenTot10000BrugAftrekker;
      }
    }
    if (bewerking === 'herken-brug') return HerkenBrugTot100;
    if (bewerking === 'splitsingen') return Splitsingen;
    if (bewerking === 'tafels')      return Tafels;
    return null;
  }

  /* ── Vertaal brugwaarde voor modules die enkel met/zonder kennen ── */
  function _brugVoor100(brug) {
    if (brug === 'zonder' || brug === 'gemengd') return brug;
    return 'met'; // naar-tiental, naar-honderdtal, beide → 'met'
  }

  /* ── Maak een nieuw blok ─────────────────────────────────── */
  function maakBlok({ bewerking, niveau, oefeningstypes, brug, aantalOefeningen, opdrachtzin, hulpmiddelen = [], splitspositie = 'aftrekker', aanvullenVariant = 'zonder-schema', compenserenVariant = 'met-tekens', transformerenVariant = 'schema', schrijflijnenAantal = 2, metVoorbeeld = false, splitsVariant = 'afwisselend', splitsGetallen = null, splitsModus = 'tot', tafels = null, tafelPositie = 'vooraan', tafelMax = 10, strategie = 'aftrekker' }) {
    const isHerken        = bewerking === 'herken-brug';
    const isSplitsingen   = bewerking === 'splitsingen';
    const isTafels        = bewerking === 'tafels';
    const isAanvullen     = hulpmiddelen.includes('aanvullen');
    const isCompenseren   = hulpmiddelen.includes('compenseren');
    const isTransformeren = hulpmiddelen.includes('transformeren');

    // Brugwaarde aanpassen voor modules die enkel met/zonder kennen
    const brugVoorModule = niveau <= 100 ? _brugVoor100(brug) : brug;

    // Kies module
    const compModule = isCompenseren
      ? (bewerking === 'aftrekken'
          ? (niveau >= 10000 ? CompenserenAftrekkenTot10000 : niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
          : (niveau >= 10000 ? CompenserenOptellenTot10000 :
             niveau >= 1000  ? CompenserenOptellenTot1000  : CompenserenOptellen))
      : null;
    const compModuleDhHt = isCompenseren && niveau >= 10000
      ? (bewerking === 'optellen' ? CompenserenOptellenTot10000DhHt : CompenserenAftrekkenTot10000DhHt) : null;
    const aanvulModule = niveau >= 10000 ? AanvullenTot10000 : niveau >= 1000 ? AanvullenTot1000 : AanvullenTot100;
    const transModule  = isTransformeren
      ? (bewerking === 'aftrekken' ? (niveau >= 10000 ? TransformerenAftrekkenTot10000 : TransformerenAftrekken)
         : niveau >= 10000 ? TransformerenOptellenTot10000
         : TransformerenOptellen)
      : null;
    const transModuleDhHt = isTransformeren && niveau >= 10000
      ? (bewerking === 'optellen' ? TransformerenOptellenTot10000DhHt : TransformerenAftrekkenTot10000DhHt) : null;
    const isDhHtType = oefeningstypes.includes('DH+HT') || oefeningstypes.includes('DH-HT') || oefeningstypes.includes('D-HT');
    const module = isAanvullen     ? aanvulModule :
                   isCompenseren   ? (isDhHtType && compModuleDhHt ? compModuleDhHt : compModule) :
                   isTransformeren ? (isDhHtType && transModuleDhHt ? transModuleDhHt : transModule) :
                   isTafels        ? Tafels :
                   _getModule(bewerking, niveau, brugVoorModule, strategie, oefeningstypes);
    if (!module) {
      console.warn(`Geen module voor ${bewerking} tot ${niveau}`);
      return null;
    }

    // Genereer oefeningen
    let oefeningen;
    if (isTafels)           oefeningen = Tafels.genereer({ tafels, oefeningstypes, aantalOefeningen, tafelPositie, tafelMax });
    else if (isSplitsingen) oefeningen = Splitsingen.genereer({ oefeningstypes, aantalOefeningen, niveau, splitsVariant, splitsGetallen, splitsModus, brug });
    else if (isHerken)      oefeningen = module.genereer({ oefeningstypes, aantalOefeningen });
    else if (isAanvullen)   oefeningen = module.genereer({ aantalOefeningen, oefeningstypes });
    else if (isCompenseren) oefeningen = module.genereer({ aantalOefeningen, oefeningstypes });
    else if (isTransformeren) oefeningen = module.genereer({ niveau, oefeningstypes, aantalOefeningen });
    else if (bewerking === 'aftrekken' && niveau >= 10000 && brug !== 'zonder'
             && (
                  // Case A: expliciete mix van DH-HT/D-HT met andere types
                  (isDhHtType && oefeningstypes.some(t => t !== 'DH-HT' && t !== 'D-HT'))
                  // Case B: 'Gemengd' chip geselecteerd → alle 4 types uit beide modules
                  || oefeningstypes.includes('Gemengd')
                )) {
      // Bij aftrekken tot 10.000 met brug + gemengde types (expliciet of via
      // "Gemengd" chip): genereer apart uit AftrekkenTot10000BrugHt (voor
      // DH-HT/D-HT) en AftrekkenTot10000BrugAftrekker (voor DH-H/DH-DH),
      // dan mengen.
      const heeftGemengdString = oefeningstypes.includes('Gemengd');
      let dhHtTypes, andereTypes;
      if (heeftGemengdString) {
        // "Gemengd" chip: gebruik de 4 vaste types van dit niveau
        dhHtTypes   = ['DH-HT', 'D-HT'];
        andereTypes = ['DH-H',  'DH-DH'];
      } else {
        dhHtTypes   = oefeningstypes.filter(t => t === 'DH-HT' || t === 'D-HT');
        andereTypes = oefeningstypes.filter(t => t !== 'DH-HT' && t !== 'D-HT');
      }

      // Verdeel aantal evenredig over beide groepen op basis van aantal types
      const totaalTypes = Math.max(1, dhHtTypes.length + andereTypes.length);
      const aantalDhHt   = dhHtTypes.length === 0 ? 0 :
                           Math.max(1, Math.round(aantalOefeningen * dhHtTypes.length / totaalTypes));
      const aantalAndere = Math.max(0, aantalOefeningen - aantalDhHt);

      const bufDhHt = (dhHtTypes.length > 0)
        ? (AftrekkenTot10000BrugHt.genereer({
            niveau, oefeningstypes: dhHtTypes, brug: brugVoorModule,
            aantalOefeningen: aantalDhHt * 2,
          }) || [])
        : [];
      const bufAndere = (andereTypes.length > 0)
        ? (AftrekkenTot10000BrugAftrekker.genereer({
            niveau, oefeningstypes: andereTypes, brug: brugVoorModule,
            aantalOefeningen: aantalAndere * 2,
          }) || [])
        : [];

      const alleOef = [...bufDhHt.slice(0, aantalDhHt), ...bufAndere.slice(0, aantalAndere)];
      // Shuffle
      for (let i = alleOef.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alleOef[i], alleOef[j]] = [alleOef[j], alleOef[i]];
      }
      oefeningen = alleOef;
    }
    else                    oefeningen = module.genereer({ niveau, oefeningstypes, brug: brugVoorModule, aantalOefeningen });
    const wilGroot = oefeningstypes?.some(t => t.includes('Groot'));
    if (oefeningen.length < 2 && !wilGroot) return null;

    const isMaakEerst10 = oefeningstypes?.includes('Maak eerst 10') && oefeningstypes.length === 1;
    const defaultZin = isAanvullen      ? 'Los op door aan te vullen.' :
                       isCompenseren    ? 'Reken uit door te compenseren.' :
                       isTransformeren  ? 'Reken uit door te transformeren.' :
                       isSplitsingen    ? 'Splits het getal.' :
                       isTafels         ? 'Reken de tafels.' :
                       isHerken         ? 'Kleur Zisa groen bij elke brugoefening.' :
                       isMaakEerst10    ? 'Onderstreep eerst wat samen 10 is en reken dan uit.' :
                       bewerking === 'aftrekken' ? 'Trek af.' : 'Reken vlug uit.';

    // Bij aftrekken tot 10000 met brug: splitspositie volgt uit strategie
    // Uitzondering: DH-HT en D-HT types gebruiken de directe splitspositie keuze
    const isDhHtOefening = oefeningstypes.some(t => t === 'DH-HT' || t === 'D-HT');
    const effectiefSplitspositie = (bewerking === 'aftrekken' && niveau >= 10000 && brug !== 'zonder' && !isDhHtOefening)
      ? (strategie === 'aftrekker' ? 'aftrekker' : 'aftrektal')
      : splitspositie;

    _teller++;
    return {
      id:          `blok-${Date.now()}-${_teller}`,
      bewerking,
      subtype:     `${bewerking}-tot${niveau}`,
      niveau,
      brug,
      opdrachtzin: opdrachtzin || defaultZin,
      hulpmiddelen,
      splitspositie: effectiefSplitspositie,
      aanvullenVariant,
      compenserenVariant,
      transformerenVariant,
      schrijflijnenAantal,
      metVoorbeeld,
      splitsVariant,
      tafels,
      tafelPositie,
      tafelMax,
      strategie,
      config: { bewerking, oefeningstypes, brug, aantalOefeningen, hulpmiddelen, splitspositie: effectiefSplitspositie, aanvullenVariant, compenserenVariant, transformerenVariant, schrijflijnenAantal, metVoorbeeld, splitsVariant, splitsGetallen, splitsModus, tafels, tafelPositie, tafelMax, strategie },
      oefeningen,
    };
  }

  /* ── Voeg één extra oefening toe aan een bestaand blok ───── */
  function voegOefeningToe(blok) {
    // Schatten: gebruik Schatten module
    if (blok.bewerking === 'schatten') {
      const cfg = blok.config || {};
      const fnMap = {
        'afronden':          Schatten.genereerAfronden,
        'schatting-tabel':   Schatten.genereerSchattingTabel,
        'schatting-compact': Schatten.genereerSchattingCompact,
        'mogelijk':          Schatten.genereerMogelijk,
      };
      const fn = fnMap[cfg.type] || Schatten.genereerAfronden;
      const nieuweOef = fn({
        niveau:       cfg.niveau || 10000,
        bewerking:    cfg.bewerking || 'optellen',
        afrondenNaar: cfg.afrondenNaar || 'H',
        aantalOefeningen: 5,
      });
      const bestaand = new Set(blok.oefeningen.map(o => o.sleutel));
      for (const oef of nieuweOef) {
        if (!bestaand.has(oef.sleutel)) {
          blok.oefeningen.push(oef);
          return true;
        }
      }
      return false;
    }

    // Rekentaal: gebruik RekentaalGenerator
    if (blok.bewerking === 'rekentaal') {
      if (!window.RekentaalGenerator) return false;
      const cfg = blok.config || {};
      const nieuweOef = RekentaalGenerator.genereer({
        categorieën:      cfg.categorieën || {},
        niveau:           cfg.niveau || 20,
        brug:             cfg.brug || 'zonder',
        tafels:           cfg.tafels || [2],
        dhkMax:           cfg.dhkMax || 20,
        tafelPositie:     cfg.tafelPositie || 'vooraan',
        aantalOefeningen: 1,
      });
      if (nieuweOef && nieuweOef.length > 0) {
        blok.oefeningen.push(nieuweOef[0]);
        return true;
      }
      return false;
    }

    // Cijferen: gebruik de Cijferen module
    if (blok.bewerking === 'cijferen') {
      const nieuweOef = Cijferen.genereer({ ...blok.config, aantalOefeningen: 5 });
      const bestaand  = new Set(blok.oefeningen.map(o => o.sleutel));
      for (const oef of nieuweOef) {
        if (!bestaand.has(oef.sleutel)) { blok.oefeningen.push(oef); return true; }
      }
      return false;
    }

    // Speciale afhandeling voor inzicht en getallenlijn
    if (blok.bewerking === 'tafels-inzicht') {
      const nieuweOef = TafelsInzicht.genereer({ ...blok.config, aantalOefeningen: 5, inzichtType: blok.config?.inzichtType || 'groepjes' });
      const bestaand  = new Set(blok.oefeningen.map(o => o.sleutel));
      for (const oef of nieuweOef) {
        if (!bestaand.has(oef.sleutel)) { blok.oefeningen.push(oef); return true; }
      }
      return false;
    }
    if (blok.bewerking === 'tafels-getallenlijn') {
      const nieuweOef = TafelsGetallenlijn.genereer({
        modus: blok.config?.modus || 'per-tafel',
        tafels: blok.config?.tafels || [2],
        maxUitkomst: blok.config?.maxUitkomst || 30,
        tafelMax: blok.config?.tafelMax || 5,
        aantalOefeningen: 5,
        variant: blok.subtype || 'getekend',
      });
      const bestaand = new Set(blok.oefeningen.map(o => o.sleutel));
      for (const oef of nieuweOef) {
        if (!bestaand.has(oef.sleutel)) { blok.oefeningen.push(oef); return true; }
      }
      return false;
    }

    const isAanvullen     = blok.hulpmiddelen?.includes('aanvullen');
    const isCompenseren   = blok.hulpmiddelen?.includes('compenseren');
    const isTransformeren = blok.hulpmiddelen?.includes('transformeren');
    const compModule = isCompenseren
      ? (blok.bewerking === 'aftrekken'
          ? (blok.niveau >= 10000 ? CompenserenAftrekkenTot10000 : blok.niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
          : (blok.niveau >= 10000 ? CompenserenOptellenTot10000 :
             blok.niveau >= 1000  ? CompenserenOptellenTot1000  : CompenserenOptellen))
      : null;
    const compModuleDhHt2 = isCompenseren && blok.bewerking === 'optellen' && blok.niveau >= 10000
      ? CompenserenOptellenTot10000DhHt : null;
    const aanvulModule2 = blok.niveau >= 10000 ? AanvullenTot10000 : blok.niveau >= 1000 ? AanvullenTot1000 : AanvullenTot100;
    const transModule2  = isTransformeren
      ? (blok.bewerking === 'aftrekken' ? (blok.niveau >= 10000 ? TransformerenAftrekkenTot10000 : TransformerenAftrekken)
         : blok.niveau >= 10000 ? TransformerenOptellenTot10000
         : TransformerenOptellen)
      : null;
    const transModuleDhHt2 = isTransformeren && blok.bewerking === 'optellen' && blok.niveau >= 10000
      ? TransformerenOptellenTot10000DhHt : null;
    const isDhHtType = blok.config.oefeningstypes?.includes('DH+HT');
    const module = isAanvullen     ? aanvulModule2 :
                   isCompenseren   ? (isDhHtType && compModuleDhHt2 ? compModuleDhHt2 : compModule) :
                   isTransformeren ? (isDhHtType && transModuleDhHt2 ? transModuleDhHt2 : transModule2) :
                   _getModule(blok.bewerking, blok.niveau, blok.config.brug || 'zonder', blok.config.strategie || 'aftrekker');
    if (!module) return false;

    const brugVoorModule = blok.niveau <= 100 ? _brugVoor100(blok.config.brug) : blok.config.brug;
    const nieuweOef = module.genereer({ aantalOefeningen: 5, oefeningstypes: blok.config.oefeningstypes, brug: brugVoorModule, niveau: blok.niveau });
    const bestaandeSleutels = new Set(blok.oefeningen.map(o => o.sleutel));

    for (const oef of nieuweOef) {
      if (!bestaandeSleutels.has(oef.sleutel)) {
        blok.oefeningen.push(oef);
        return true;
      }
    }
    return false;
  }

  /* ── Geef beschikbare types terug ────────────────────────── */
  function getTypes(bewerking, niveau, brug = 'zonder', hulpmiddelen = [], splitsModus = 'tot') {
    if (bewerking === 'gemengd') {
      const typesOpt = this.getTypes('optellen',  niveau, brug, hulpmiddelen, splitsModus).filter(t => t !== 'Gemengd' && t !== 'Maak eerst 10');
      const typesAft = this.getTypes('aftrekken', niveau, brug, hulpmiddelen, splitsModus).filter(t => t !== 'Gemengd' && t !== 'Maak eerst 10');
      return [...new Set([...typesOpt, ...typesAft])];
    }
    if (bewerking === 'herken-brug')  return _getModule(bewerking, niveau)?.getTypes() || [];
    if (bewerking === 'splitsingen')  return Splitsingen.getTypes(null, splitsModus, niveau);
    if (bewerking === 'tafels')       return Tafels.getTypes();

    const isCompenseren = hulpmiddelen.includes('compenseren');
    const isAanvullen   = hulpmiddelen.includes('aanvullen');
    const isTransform   = hulpmiddelen.includes('transformeren');

    let module;
    if (isTransform) {
      const transM = bewerking === 'aftrekken' ? (niveau >= 10000 ? TransformerenAftrekkenTot10000 : TransformerenAftrekken)
                   : niveau >= 10000 ? TransformerenOptellenTot10000
                   : TransformerenOptellen;
      const types = transM.getTypes(niveau);
      // Voeg DH+HT toe bij optellen tot 10000
      if (bewerking === 'optellen' && niveau >= 10000) {
        return [...types, ...TransformerenOptellenTot10000DhHt.getTypes()];
      }
      // Voeg DH-HT toe bij aftrekken tot 10000
      if (bewerking === 'aftrekken' && niveau >= 10000) {
        return [...types, ...TransformerenAftrekkenTot10000DhHt.getTypes()];
      }
      return types;
    } else if (isCompenseren) {
      module = bewerking === 'aftrekken'
        ? (niveau >= 10000 ? CompenserenAftrekkenTot10000 : niveau >= 1000 ? CompenserenAftrekkenTot1000 : CompenserenAftrekken)
        : (niveau >= 10000 ? CompenserenOptellenTot10000 :
           niveau >= 1000  ? CompenserenOptellenTot1000  : CompenserenOptellen);
      const types = module.getTypes ? module.getTypes(niveau) : [];
      if (bewerking === 'optellen' && niveau >= 10000) {
        return [...types, ...CompenserenOptellenTot10000DhHt.getTypes()];
      }
      if (bewerking === 'aftrekken' && niveau >= 10000) {
        return [...types, ...CompenserenAftrekkenTot10000DhHt.getTypes()];
      }
      return types;
    } else if (isAanvullen) {
      module = niveau >= 10000 ? AanvullenTot10000 : niveau >= 1000 ? AanvullenTot1000 : AanvullenTot100;
    } else {
      module = _getModule(bewerking, niveau, brug, 'aftrekker');
      if (!module) return [];
      const brugTypes = module.getTypes ? module.getTypes(niveau, brug) : [];
      // Voeg DH-HT en D-HT toe bij aftrekken met brug tot 10000
      if (bewerking === 'aftrekken' && niveau >= 10000 && brug !== 'zonder') {
        return [...brugTypes, ...AftrekkenTot10000BrugHt.getTypes()];
      }
      return brugTypes;
    }
    if (!module) return [];
    const brugVoorModule2 = niveau <= 100 ? _brugVoor100(brug) : brug;
    return module.getTypes(niveau, brugVoorModule2);
  }

  /* ── Maak een gemengd optellen+aftrekken blok ───────────── */
  function maakGemengdBlok({ niveau, brug, typesOpt, typesAft, aantalOefeningen, opdrachtzin, verhouding = '50-50', hulpmiddelen = [], schrijflijnenAantal = 2, splitspositie = 'aftrekker' }) {
    const brugVoorModule = niveau <= 100 ? _brugVoor100(brug) : brug;

    // Gebruik brug-correcte modules
    const _metBrug10000 = niveau >= 10000 && brug !== 'zonder';
    const _heeftDhHtOpt = _metBrug10000 && typesOpt && typesOpt.some(t => t === 'DH+HT' || t === 'DH-HT' || t === 'D-HT');
    const _heeftDhHtAft = _metBrug10000 && typesAft && typesAft.some(t => t === 'DH-HT' || t === 'D-HT');

    const modOpt = niveau <= 20  ? OptellenTot20  :
                   niveau <= 100 ? OptellenTot100 :
                   niveau <= 1000 ? OptellenTot1000 :
                   _metBrug10000 ? OptellenTot10000Brug : OptellenTot10000;
    const modAft = niveau <= 20  ? AftrekkenTot20  :
                   niveau <= 100 ? AftrekkenTot100 :
                   niveau <= 1000 ? AftrekkenTot1000 :
                   _heeftDhHtAft ? AftrekkenTot10000BrugHt :
                   _metBrug10000 ? AftrekkenTot10000BrugAftrekker : AftrekkenTot10000;

    if (!modOpt || !modAft) return null;

    // Bereken aantal opt/aft op basis van verhouding
    let aantalOpt, aantalAft;
    if (verhouding === 'meer-opt') {
      aantalOpt = Math.ceil(aantalOefeningen * 0.67);
      aantalAft = aantalOefeningen - aantalOpt;
    } else if (verhouding === 'meer-aft') {
      aantalAft = Math.ceil(aantalOefeningen * 0.67);
      aantalOpt = aantalOefeningen - aantalAft;
    } else {
      aantalOpt = Math.ceil(aantalOefeningen / 2);
      aantalAft = aantalOefeningen - aantalOpt;
    }

    // Genereer met extra buffer zodat shuffle genoeg unieke oefeningen heeft
    const bufferOpt = modOpt.genereer({ niveau, oefeningstypes: typesOpt, brug: brugVoorModule, aantalOefeningen: aantalOpt * 2 });
    // Voor aftrekken: als DH-HT/D-HT types geselecteerd, voeg ook die toe
    let bufferAft = modAft.genereer({ niveau, oefeningstypes: typesAft, brug: brugVoorModule, aantalOefeningen: aantalAft * 2 });
    if (_heeftDhHtAft && typeof AftrekkenTot10000BrugHt !== 'undefined') {
      const dhHtTypes = typesAft.filter(t => t === 'DH-HT' || t === 'D-HT');
      const andereTypes = typesAft.filter(t => t !== 'DH-HT' && t !== 'D-HT');
      const bufDhHt = AftrekkenTot10000BrugHt.genereer({ niveau, oefeningstypes: dhHtTypes, brug: brugVoorModule, aantalOefeningen: aantalAft });
      const bufAndere = andereTypes.length > 0 ? AftrekkenTot10000BrugAftrekker.genereer({ niveau, oefeningstypes: andereTypes, brug: brugVoorModule, aantalOefeningen: aantalAft }) : [];
      bufferAft = [...(bufDhHt || []), ...(bufAndere || [])];
    }

    if (!bufferOpt?.length || !bufferAft?.length) return null;

    // Pak het gewenste aantal uit elke pool
    const oefOpt = bufferOpt.slice(0, aantalOpt);
    const oefAft = bufferAft.slice(0, aantalAft);

    // Shuffle samen
    const alle = [...oefOpt, ...oefAft];
    for (let i = alle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [alle[i], alle[j]] = [alle[j], alle[i]];
    }

    if (alle.length < 2) return null;

    _teller++;
    return {
      id:          `blok-gemengd-${Date.now()}-${_teller}`,
      bewerking:   'gemengd',
      subtype:     `gemengd-tot${niveau}`,
      niveau,
      brug,
      opdrachtzin: opdrachtzin || 'Kijk goed naar het teken. Reken uit.',
      hulpmiddelen,
      schrijflijnenAantal,
      splitspositie,
      config: { niveau, brug, typesOpt, typesAft, aantalOefeningen, verhouding, hulpmiddelen, schrijflijnenAantal, splitspositie },
      oefeningen:  alle,
    };
  }

  return { maakBlok, maakGemengdBlok, voegOefeningToe, getTypes };
})();