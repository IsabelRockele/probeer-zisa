/* ══════════════════════════════════════════════════════════════
   preview.js — preview renderen
   ══════════════════════════════════════════════════════════════ */

const Preview = (() => {

  let _toonOplossingen = false;
  let _laatsteBundelData = [];

  /* ── Bereken splits-waarden vanuit oefening-vraag ─────────
     Werkt voor optellen en aftrekken tot 20/100/1000/10000
     Geeft { d1, d2, sl1, sl2 } terug
  ──────────────────────────────────────────────────────────── */
  function _berekenSplits(oef, bewerking, splitspositie, strategie, aantalLijnen) {
    // Als de data al aanwezig is, gebruik die
    if (oef.splitsDeel1 !== undefined && oef.splitsDeel1 !== null &&
        oef.splitsDeel2 !== undefined && oef.splitsDeel2 !== null) {
      return {
        d1: oef.splitsDeel1,
        d2: oef.splitsDeel2,
        sl1: oef.schrijflijn1 ?? '',
        sl2: oef.schrijflijn2 ?? '',
      };
    }
    // Bereken vanuit de vraag
    try {
      const delen = (oef.vraag || '').replace(' =','').trim().split(' ');
      if (delen.length < 3) return { d1:'', d2:'', sl1:'', sl2:'' };
      const g1 = parseInt(delen[0]) || 0;
      const g2 = parseInt(delen[2]) || 0;
      // Bij gemengd: bepaal bewerking uit de vraag zelf
      const effectieveBewerking = (bewerking === 'gemengd' || bewerking === 'optellen' || bewerking === 'aftrekken')
        ? (oef.vraag && oef.vraag.includes(' - ') ? 'aftrekken' : 'optellen')
        : bewerking;
      const antwoord = oef.antwoord ?? (effectieveBewerking === 'optellen' ? g1 + g2 : g1 - g2);

      let d1, d2, d3 = '', sl1 = '', sl2 = '', sl3 = '';
      if (effectieveBewerking === 'optellen') {
        const nLijnen = aantalLijnen || 2;
        const g2H = Math.floor(g2 / 100) * 100;   // honderden van g2
        const g2T = Math.floor((g2 % 100) / 10) * 10; // tientallen van g2
        const g2E = g2 % 10;                        // eenheden van g2
        const isHTE = g2H > 0;  // HTE+HTE strategie als er honderden zijn
        const isTE  = !isHTE && g2T > 0;  // TE+TE als alleen tientallen

        // HT+HT: g1 heeft tientallen -> splits g2 in H en T
        const isHTplusHT = (g1 % 100 !== 0) && g2H > 0;
        // Brug naar D: g1 is veelvoud van 100 EN som kruist duizendtal
        const g1RestTotD = 1000 - (g1 % 1000);
        const isBrugD = (g1 % 100 === 0) && (g1 % 1000 !== 0) && g2 >= g1RestTotD
                        && Math.floor(g1 / 1000) !== Math.floor((g1 + g2) / 1000);

        if (isHTplusHT) {
          // HT+HT: splits bijteller in H + T (+ E)
          d1 = g2H; d2 = g2T;
          const ts1Ht = g1 + g2H;
          if (g2E > 0) {
            const ts2Ht = ts1Ht + g2T;
            sl1 = `${g1} + ${g2H} = ${ts1Ht}`;
            sl2 = `${ts1Ht} + ${g2T} = ${ts2Ht}`;
            sl3 = `${ts2Ht} + ${g2E} = ${antwoord}`;
          } else {
            sl1 = `${g1} + ${g2H} = ${ts1Ht}`;
            sl2 = `${ts1Ht} + ${g2T} = ${antwoord}`;
          }
        } else if (isBrugD) {
          // Aanvulling tot duizendtal: bijv. 300+800 -> d1=700, d2=100
          d1 = g1RestTotD;
          d2 = g2 - d1;
          const ts1Bd = g1 + d1;
          sl1 = `${g1} + ${d1} = ${ts1Bd}`;
          sl2 = `${ts1Bd} + ${d2} = ${antwoord}`;
        } else if (isHTE) {
          // HTE strategie: splits in H + T + E (altijd 3 lijnen)
          d1 = g2H; d2 = g2T; d3 = g2E;
          const ts1 = g1 + g2H;
          const ts2 = ts1 + g2T;
          sl1 = `${g1} + ${g2H} = ${ts1}`;
          sl2 = `${ts1} + ${g2T} = ${ts2}`;
          sl3 = `${ts2} + ${g2E} = ${antwoord}`;
        } else if (isTE) {
          // TE+TE strategie: splits bijteller in T en E
          d1 = g2T; d2 = g2E;
          const ts1 = g1 + g2T;
          if (nLijnen >= 3 && g2E > 0) {
            // 3 lijnen: splits eenheden verder via tiental
            const e1 = ts1 % 10;
            const d2a = e1 === 0 ? g2E : Math.min(g2E, 10 - e1);
            const d2b = g2E - d2a;
            const ts2 = ts1 + d2a;
            sl1 = `${g1} + ${g2T} = ${ts1}`;
            sl2 = `${ts1} + ${d2a} = ${ts2}`;
            sl3 = `${ts2} + ${d2b} = ${antwoord}`;
          } else {
            sl1 = `${g1} + ${g2T} = ${ts1}`;
            sl2 = `${ts1} + ${g2E} = ${antwoord}`;
          }
        } else {
          // Aanvullingsstrategie: aanvullen tot tiental
          const eenhedenG1 = g1 % 10;
          d1 = eenhedenG1 === 0 ? 10 : (10 - eenhedenG1);
          d2 = g2 - d1;
          const ts1 = g1 + d1;
          sl1 = `${g1} + ${d1} = ${ts1}`;
          sl2 = `${ts1} + ${d2} = ${antwoord}`;
        }
      } else if (splitspositie === 'aftrektal') {
        const g1H_at = Math.floor(g1 / 100) * 100;
        const g1T_at = Math.floor((g1 % 100) / 10) * 10;
        const g1E_at = g1 % 10;

        const g1D_at = Math.floor(g1 / 1000) * 1000;

        if (g1D_at > 0 && g1H_at > 0 && g1T_at === 0 && g1E_at === 0) {
          // DH-H: splits g1 in D en H (3600-900 -> 3000+600 -> 3000-900=2100, 2100+600=2700)
          d1 = g1D_at; d2 = g1H_at;
          const ts1DhH_at = d1 - g2;
          sl1 = `${d1} - ${g2} = ${ts1DhH_at}`;
          sl2 = `${ts1DhH_at} + ${d2} = ${antwoord}`;
        } else if (g1H_at > 0 && g1E_at === 0 && g1T_at > 0) {
          // HT-TE: splits g1 in H en T, gebruik T om af te trekken
          // 420-16: T=20, H=400 -> 20-16=4, 400+4=404
          d1 = g1T_at; d2 = g1H_at;
          const ts1Ht = d1 - g2;
          sl1 = `${d1} - ${g2} = ${ts1Ht}`;
          sl2 = `${d2} + ${ts1Ht} = ${antwoord}`;
        } else if (g1H_at > 0) {
          // HTE: splits g1 in H+T+E
          // 572-413: 500+70+2 -> 500-413=87, 87+70=157, 157+2=159
          d1 = g1H_at; d2 = g1T_at; d3 = g1E_at;
          const ts1At3 = d1 - g2;
          const ts2At3 = ts1At3 + d2;
          sl1 = `${d1} - ${g2} = ${ts1At3}`;
          sl2 = `${ts1At3} + ${d2} = ${ts2At3}`;
          sl3 = `${ts2At3} + ${d3} = ${antwoord}`;
        } else {
          // TE: splits g1 in T+E
          // 85-39: 80+5 -> 80-39=41, 41+5=46
          d1 = g1T_at; d2 = g1E_at;
          const ts1At = d1 - g2;
          sl1 = `${d1} - ${g2} = ${ts1At}`;
          sl2 = `${ts1At} + ${d2} = ${antwoord}`;
        }
      } else {
        // Aftrekker splitsen (T-TE / DH-H / DH-DH)
        const g2D_a = Math.floor(g2 / 1000) * 1000;
        const g2H_a = Math.floor((g2 % 1000) / 100) * 100;
        const g2T_a = Math.floor((g2 % 100) / 10) * 10;
        const g2E_a = g2 % 10;

        if (g2D_a > 0 && g2H_a > 0) {
          // DH-DH: splits in D en H (3200-1500 -> 1000+500)
          d1 = g2D_a; d2 = g2H_a;
          const ts1DhDh = g1 - g2D_a;
          sl1 = `${g1} - ${g2D_a} = ${ts1DhDh}`;
          sl2 = `${ts1DhDh} - ${g2H_a} = ${antwoord}`;
        } else if (g2D_a === 0 && g2H_a > 0 && g2T_a === 0 && g2E_a === 0) {
          // DH-H: splits op aanvulling tot duizendtal (4200-800 -> 200+600)
          const aanvullingD = g1 % 1000;
          const restH = g2 - aanvullingD;
          d1 = aanvullingD; d2 = restH;
          const ts1DhH = g1 - aanvullingD;
          sl1 = `${g1} - ${aanvullingD} = ${ts1DhH}`;
          sl2 = `${ts1DhH} - ${restH} = ${antwoord}`;
        } else if (g2H_a > 0) {
          // HTE aftrekken: splits in H + T + E
          d1 = g2H_a; d2 = g2T_a; d3 = g2E_a;
          const ts1HteA = g1 - g2H_a;
          const ts2HteA = ts1HteA - g2T_a;
          sl1 = `${g1} - ${g2H_a} = ${ts1HteA}`;
          sl2 = `${ts1HteA} - ${g2T_a} = ${ts2HteA}`;
          sl3 = `${ts2HteA} - ${g2E_a} = ${antwoord}`;
        } else {
          // T-TE: splits aftrekker in T en E
          if (g2T_a === 0) {
            // Enkel eenheden: splits op eenheden van g1
            d1 = g1 % 10; d2 = g2 - d1;
            const ts1E = g1 - d1;
            sl1 = `${g1} - ${d1} = ${ts1E}`;
            sl2 = `${ts1E} - ${d2} = ${antwoord}`;
          } else {
            d1 = g2T_a; d2 = g2E_a;
            const ts1TE = g1 - d1;
            sl1 = `${g1} - ${d1} = ${ts1TE}`;
            sl2 = `${ts1TE} - ${d2} = ${antwoord}`;
          }
        }
      }
      return { d1, d2, d3: d3 || '', sl1: sl1 || '', sl2: sl2 || '', sl3: sl3 || '' };
    } catch(e) {
      return { d1:'', d2:'', sl1:'', sl2:'' };
    }
  }

  function toggleOplossingen(btn) {
    _toonOplossingen = !_toonOplossingen;
    // Body-klasse zodat CSS weet of oplossingen zichtbaar moeten zijn
    // (gebruikt voor deel-dalend stippellijn en deel-boog)
    document.body.classList.toggle('toont-oplossingen', _toonOplossingen);
    if (btn) {
      btn.textContent = _toonOplossingen ? '🙈 Verberg oplossingen' : '👁 Toon oplossingen';
      btn.style.background = _toonOplossingen ? '#27AE60' : '';
      btn.style.color = _toonOplossingen ? '#fff' : '';
    }

    // Als er compenseer-blokken met zonder-hulp variant zijn: volledige
    // re-render nodig, want de oplossing zit ingebed in de HTML (geen data-antwoord)
    const heeftCompZonderHulp = _laatsteBundelData.some(blok =>
      blok.hulpmiddelen?.includes('compenseren') &&
      blok.compenserenVariant === 'zonder-hulp'
    );
    const heeftBreukSchrapping = _laatsteBundelData.some(blok =>
      blok.bewerking === 'breuken' &&
      blok.config?.soort === 'vermenigvuldigen'
    );
    if (heeftCompZonderHulp || heeftBreukSchrapping) {
      render(_laatsteBundelData);
      // Toggle knop state behouden na re-render
      if (btn) {
        btn.textContent = _toonOplossingen ? '🙈 Verberg oplossingen' : '👁 Toon oplossingen';
        btn.style.background = _toonOplossingen ? '#27AE60' : '';
        btn.style.color = _toonOplossingen ? '#fff' : '';
      }
      return;
    }
    // Herrender voor compenseren/transformeren, daarna data-antwoord loop
    const _doToggleUpdate = () => {
      // Getallenlijn zelf: boogjes tonen/verbergen
      document.querySelectorAll('.gl-boog-oplossing').forEach(el => {
        el.setAttribute('opacity', _toonOplossingen ? '1' : '0');
      });

      // Herken-brug: lamp-kader inkleuren bij brugoefeningen
      document.querySelectorAll('.lamp-kader[data-heeft-brug]').forEach(kader => {
        if (_toonOplossingen && kader.dataset.heeftBrug === 'true') {
          kader.classList.add('lamp-brug-oplossing');
        } else {
          kader.classList.remove('lamp-brug-oplossing');
        }
      });

      // Alle elementen met data-antwoord — universeel
      document.querySelectorAll('[data-antwoord]').forEach(el => {
        const ant = String(el.dataset.antwoord ?? '').trim();
        // Lege onthoud-cellen toch verwerken voor achtergrondkleur
        if ((ant === '' || ant === 'undefined') && !el.classList.contains('cij-onthoud') && !el.classList.contains('komma-onthoud')) return;

      const isSchrijflijn  = el.classList.contains('schrijflijn') || el.classList.contains('eerst10-schrijflijn');
      const isSplitsVak    = el.classList.contains('splits-vak') || el.classList.contains('splits-vak-groot');
      const isAntwoordVak  = el.classList.contains('antwoord-vak');
      const isInvulhokje   = el.classList.contains('invulhokje');
      const isAanvulVraag  = el.classList.contains('aanvullen-vraag');

      if (_toonOplossingen) {
        // Sla textContent over als cel spans heeft (doorstreep of gestapeld)
        if (!el.querySelector('.cij-doorstreep-orig') && !el.dataset.gestapeld) el.textContent = ant;
        el.style.color      = '#006100';
        el.style.fontWeight = '700';

        if (isSchrijflijn) {
          // Schrijflijn: geef hoogte zodat tekst zichtbaar is
          el.style.height        = 'auto';
          el.style.minHeight     = '18px';
          el.style.borderBottom  = '2px solid #00a650';
          el.style.paddingBottom = '2px';
          el.style.display       = 'block';
          el.style.lineHeight    = '18px';
          el.style.paddingLeft   = '4px';
        } else if (isSplitsVak) {
          // Splitsbeen vakje: groen kader
          el.style.background    = '#c6efce';
          el.style.border        = '1.5px solid #00a650';
          el.style.display       = 'flex';
          el.style.alignItems    = 'center';
          el.style.justifyContent = 'center';
        } else if (isAntwoordVak) {
          // Antwoord vakje na =
          el.style.background    = '#c6efce';
          el.style.border        = '1.5px solid #00a650';
          el.style.display       = 'flex';
          el.style.alignItems    = 'center';
          el.style.justifyContent = 'center';
        } else if (isInvulhokje || el.classList.contains('comp-blokje-hokje')) {
          // Aanvullen/compenseren invulhokje
          el.style.background    = '#c6efce';
          el.style.border        = '1.5px solid #00a650';
          el.style.display       = 'inline-flex';
          el.style.alignItems    = 'center';
          el.style.justifyContent = 'center';
          el.style.minWidth      = '28px';
          el.style.padding       = '0 4px';
        } else if (isAanvulVraag) {
          // Aanvullen schema ?-vakje
          el.style.background    = '#c6efce';
          el.style.color         = '#006100';
          el.style.fontWeight    = '700';
        } else if (el.classList.contains('trans-schrijflijn') || el.classList.contains('comp-schrijf-tekst')) {
          // Transformeren/compenseren schrijflijnen
          el.style.borderBottom  = '2px solid #00a650';
          el.style.minWidth      = '40px';
          el.style.display       = 'inline-block';
          el.style.paddingBottom = '1px';
        } else if (el.classList.contains('sb-hokje') || el.classList.contains('sh-vakje') || el.classList.contains('vs-vakje')) {
          // Splitsbeen / splitshuis / verdelen hokje
          el.style.background = '#c6efce';
          el.style.color      = '#006100';
          el.style.fontWeight = 'bold';
          el.style.display    = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
        } else if (el.classList.contains('tafel-vak') || el.classList.contains('sbw-vak')) {
          // Tafels / splitsbeen bewerkingen
          el.style.background   = '#c6efce';
          el.style.color        = '#006100';
          el.style.fontWeight   = 'bold';
          el.style.borderBottom = '2px solid #00a650';
        } else if (el.classList.contains('inzicht-lijn') || el.classList.contains('gl-lijn')) {
          // Tafels inzicht / getallenlijn
          el.style.background   = 'transparent';
          el.style.color        = '#006100';
          el.style.fontWeight   = 'bold';
          el.style.fontSize     = '13px';
          el.style.borderBottom = '2px solid #00a650';
          el.style.display      = 'inline-block';
          el.style.minWidth     = '16px';
          el.style.width        = 'auto';
          el.style.padding      = '0 2px';
          el.style.textAlign    = 'center';
          el.style.lineHeight   = '14px';
          el.style.verticalAlign = 'bottom';

        } else if (el.classList.contains('cij-getal')) {
          // Cijferen getalrij: bij aftrekken met lenen → doorstreep via klasse
          el.classList.add('cij-heeft-doorstreep');
          return; // niet overschrijven met textContent
        } else if (el.classList.contains('cij-oplossing')) {
          // Cijferen oplossingsrij
          el.style.background    = '#c6efce';
          el.style.color         = '#006100';
          el.style.fontWeight    = 'bold';
          el.style.fontSize      = '14px';
          el.style.textAlign     = 'center';
          el.style.borderTop     = '2px solid #006100';
        } else if (el.classList.contains('cij-onthoud') || el.classList.contains('komma-onthoud')) {
          // Cijferen/komma onthoud-rij (brug)
          el.style.background    = '#c6efce';
          el.style.color         = '#006100';
          el.style.fontWeight    = 'bold';
          el.style.fontSize      = '11px';
          el.style.textAlign     = 'center';
          // Gestapelde getallen (twee bruggen): toon beide spans
          const bovenSpan = el.querySelector('.cij-onth-boven');
          const onderSpan = el.querySelector('.cij-onth-onder');
          if (bovenSpan && onderSpan) {
            bovenSpan.style.display = 'block';
            onderSpan.style.display = 'block';
            return; // spans zorgen voor de weergave, niet overschrijven
          }
          // Enkele waarde: textContent wordt hieronder gezet via normale flow
        } else if (el.classList.contains('punt-lijn')) {
          // Puntoefening vakje
          el.style.background   = '#c6efce';
          el.style.color        = '#006100';
          el.style.fontWeight   = 'bold';
          el.style.borderBottom = '2px solid #00a650';
        } else if (el.classList.contains('rt-oef-lijn')) {
          // Rekentaal schrijflijn
          el.style.borderBottom  = '2px solid #00a650';
          el.style.display       = 'inline-block';
          el.style.minWidth      = '80px';
          el.style.paddingBottom = '1px';
        } else if (el.classList.contains('trans-schrijflijn-pijl')) {
          // Transformeren pijl-waarde (delta tonen)
          el.style.display    = 'inline-block';
          el.style.minWidth   = '20px';
        } else {
          // Andere (tafels etc)
          el.style.background    = '#c6efce';
          el.style.border        = '1.5px solid #00a650';
        }
      } else {
        // Verberg doorgestreepte originelen bij reset
        el.classList.remove('cij-heeft-doorstreep');
        el.querySelectorAll('.cij-onth-boven, .cij-onth-onder').forEach(s => s.style.display = 'none');
        if (!el.classList.contains('cij-getal')) el.textContent = '';
        el.style.background     = '';
        el.style.color          = '';
        el.style.fontWeight     = '';
        el.style.border         = '';
        el.style.borderBottom   = '';
        el.style.paddingBottom  = '';
        el.style.display        = '';
        el.style.alignItems     = '';
        el.style.justifyContent = '';
        el.style.minWidth       = '';
        el.style.height         = '';
        el.style.minHeight      = '';
        el.style.lineHeight     = '';
        el.style.paddingLeft    = '';
        el.style.padding        = '';
        el.style.minWidth       = '';
        el.style.display        = '';
      }
    });

      // Strategievelden: dwing de zichtbare tekst af. Deze elementen hebben
      // afwijkende flex/grid-opmaak en mogen niet alleen groen kleuren.
      document.querySelectorAll('.komma-strategie [data-antwoord]').forEach(el => {
        el.textContent = _toonOplossingen ? String(el.dataset.antwoord ?? '') : '';
        if (_toonOplossingen) {
          el.style.color = '#006100';
          el.style.fontWeight = '700';
        }
      });

      // Mogelijk checkboxen tonen/verbergen
      document.querySelectorAll('.mogelijk-check').forEach(el => {
        const isJuist = el.dataset.antwoord === 'ja';
        if (_toonOplossingen && isJuist) {
          el.textContent = '✕';
          el.style.background = '#c6efce';
          el.style.border = '2px solid #00a650';
          el.style.color = '#006100';
        } else {
          el.textContent = '';
          el.style.background = '';
          el.style.border = '2px solid #333';
          el.style.color = '';
        }
      });

      // Maak eerst 10: onderstreep 2 getallen die samen 10 vormen
      document.querySelectorAll('.eerst10-onderstreep').forEach(el => {
        if (_toonOplossingen) {
          el.style.borderBottom = '2px solid #00a650';
          el.style.paddingBottom = '1px';
          el.style.color = '#006100';
          el.style.fontWeight = 'bold';
        } else {
          el.style.borderBottom = '';
          el.style.paddingBottom = '';
          el.style.color = '';
          el.style.fontWeight = '';
        }
      });
    }; // einde _doToggleUpdate

    // Toon/verberg opmerking over tussenstappen
    let opmDiv = document.getElementById('opm-tussenstappen');
    if (!opmDiv) {
      opmDiv = document.createElement('div');
      opmDiv.id = 'opm-tussenstappen';
      opmDiv.style.cssText = 'margin:8px 0 4px 0;padding:6px 10px;background:#f0faf0;border-left:3px solid #27ae60;font-size:12px;color:#555;font-style:italic;';
      opmDiv.textContent = '* De tussenstappen bij splitsoefeningen kunnen afwijken van de gebruikte methode in de klas.';
      const container = document.getElementById('preview-inhoud');
      if (container) container.insertBefore(opmDiv, container.firstChild);
    }
    opmDiv.style.display = _toonOplossingen ? 'block' : 'none';

    // Directe DOM update via data-antwoord loop
    _doToggleUpdate();
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function render(bundelData) {
    // Bewaar bundelData zodat toggleOplossingen kan re-renderen voor
    // compenseer-blokken met zonder-hulp variant (oplossing zit in HTML,
    // niet als data-antwoord)
    _laatsteBundelData = bundelData;
    const container   = document.getElementById('preview-inhoud');
    const btnGenereer = document.getElementById('btn-genereer');
    const btnPdf      = document.getElementById('btn-pdf');
    const teller      = document.getElementById('blok-teller');
    // Reset toggle enkel bij nieuwe render ALS het al uitstond
    // (niet resetten als de gebruiker oplossingen bekijkt en een oefening toevoegt)
    if (!_toonOplossingen) {
      const btnToggleR = document.getElementById('btn-toggle-oplossingen');
      if (btnToggleR) { btnToggleR.textContent = '👁 Toon oplossingen'; btnToggleR.style.background = ''; btnToggleR.style.color = ''; }
    }

    teller.textContent = `${bundelData.length} blok${bundelData.length !== 1 ? 'ken' : ''}`;

    // Als oplossingen getoond worden: heractiveer toggle na render
    if (_toonOplossingen) {
      const btnT = document.getElementById('btn-toggle-oplossingen');
      if (btnT) {
        btnT.textContent = '🙈 Verberg oplossingen';
        btnT.style.background = '#27AE60';
        btnT.style.color = '#fff';
      }
      setTimeout(() => {
        if (_toonOplossingen) {
          document.querySelectorAll('[data-antwoord]').forEach(el => {
            const ant = String(el.dataset.antwoord ?? '').trim();
            if (ant && ant !== 'undefined') {
              el.textContent = ant;
              el.style.color = '#006100';
              el.style.fontWeight = '700';
            }
          });
          document.querySelectorAll('.gl-boog-oplossing').forEach(el => {
            el.setAttribute('opacity', '1');
          });
        }
      }, 50);
    }

    if (bundelData.length === 0) {
      container.innerHTML = `
        <div class="leeg-state">
          <div class="leeg-icon">📋</div>
          <div class="leeg-titel">Bundel is leeg</div>
          <div class="leeg-tekst">Configureer een blok in de zijbalk en klik op "Voeg blok toe".</div>
        </div>`;
      btnGenereer.disabled = true;
      btnPdf.disabled      = true;
      const btnSleutelD = document.getElementById('btn-sleutel');
      if (btnSleutelD) btnSleutelD.disabled = true;
      const btnToggleD = document.getElementById('btn-toggle-oplossingen');
      if (btnToggleD) btnToggleD.disabled = true;
      return;
    }

    btnGenereer.disabled = false;
    btnPdf.disabled      = false;
    const btnSleutel = document.getElementById('btn-sleutel');
    if (btnSleutel) btnSleutel.disabled = false;
    const btnToggle = document.getElementById('btn-toggle-oplossingen');
    if (btnToggle) btnToggle.disabled = false;
    container.innerHTML  = '';
    bundelData.forEach(blok => container.appendChild(_maakBlokElement(blok)));
    // Splitsbeen ankers positioneren onder hun doelgetal
    requestAnimationFrame(() => { _positioneerSplitsbenen(); _positioneerCompenseren(); });
  }

  function _maakBlokElement(blok) {
    const isHerken        = blok.bewerking === 'herken-brug';
    const isSplitsingen   = blok.bewerking === 'splitsingen';
    const isTafels        = blok.bewerking === 'tafels';
    const isTafelsInzicht = blok.bewerking === 'tafels-inzicht';
    const isGetallenlijn  = blok.bewerking === 'tafels-getallenlijn';
    const isCijferen      = blok.bewerking === 'cijferen';
    const isVraagstuk     = blok.bewerking === 'vraagstukken';
    const isRekentaal     = blok.bewerking === 'rekentaal';

    // ── Vraagstuk: eigen renderer ────────────────────────────
    if (isVraagstuk)  return _maakVraagstukElement(blok);
    // ── Rekentaal: eigen renderer ────────────────────────────
    if (isRekentaal)  return _maakRekentaalElement(blok);
    if (blok.bewerking === 'breuken') return _maakBreukenElement(blok);
    if (blok.bewerking === 'percentages') return _maakPercentageElement(blok);
    if (blok.bewerking === 'kommagetallen') return _maakKommaGetallenElement(blok);
    // ── Schatten: eigen renderer ─────────────────────────────
    if (blok.bewerking === 'schatten') return _schattenBlokElement(blok);
    const heeftAanvullen   = !isHerken && !isSplitsingen && !isTafels && !isTafelsInzicht && !isGetallenlijn && !isCijferen && blok.hulpmiddelen?.includes('aanvullen');
    const heeftCompenseren = !isHerken && !isSplitsingen && !isTafels && !isTafelsInzicht && !isGetallenlijn && !isCijferen && blok.hulpmiddelen?.includes('compenseren');
    const heeftTransformeren = !isHerken && !isSplitsingen && !isTafels && !isTafelsInzicht && !isGetallenlijn && !isCijferen && blok.hulpmiddelen?.includes('transformeren');
    const heeftHulp        = !isHerken && !isSplitsingen && !isTafels && !isTafelsInzicht && !isGetallenlijn && !isCijferen && !heeftAanvullen && !heeftCompenseren && !heeftTransformeren && (blok.hulpmiddelen?.length > 0);
    const brugLabel = { met:'🌉 Met brug', zonder:'✅ Zonder brug', gemengd:'🔀 Gemengd' }[blok.brug] || '';
    const badgeTxt  = isGetallenlijn  ? '〰️ Getallenlijn' :
                      isCijferen      ? `🧮 Cijferen` :
                      isTafelsInzicht ? '🔍 Inzicht' :
                      isTafels      ? '✖️ Tafels' :
                      isSplitsingen ? '✂️ Splits' :
                      isHerken    ? '🔦 Herken brug' :
                      isRekentaal ? '🗣️ Rekentaal' :
                      blok.hulpmiddelen?.includes('transformeren') ? '↔️ Transformeren' :
                      blok.bewerking === 'aftrekken' ? 'Aftrekken' : 'Optellen';
    const isPunt = isSplitsingen && blok.oefeningen[0]?.type === 'puntoefening';
    let gridKlasse;
    if (isPunt)                                                            gridKlasse = 'splits-grid punt-grid';
    else if (isGetallenlijn)                                               gridKlasse = 'gl-grid';
    else if (isTafelsInzicht)                                              gridKlasse = 'inzicht-grid';
    else if (isTafels)  { const eersteType = blok.oefeningen[0]?.type; gridKlasse = (eersteType === 'redeneren' || eersteType === 'koppel') ? 'tafels-grid tafels-grid-2kol' : 'tafels-grid'; }
    else if (isSplitsingen)                                                gridKlasse = 'splits-grid';
    else if (isHerken)                                                     gridKlasse = 'herken-grid';
    else if (heeftAanvullen && blok.aanvullenVariant === 'met-schijfjes') gridKlasse = 'aanvullen-grid-2';
    else if (heeftAanvullen)                                               gridKlasse = 'aanvullen-grid-3';
    else if (heeftCompenseren)                                             gridKlasse = 'comp-grid';
    else if (heeftTransformeren)                                           gridKlasse = 'trans-grid';
    else if (heeftHulp)                                                    gridKlasse = 'hulp-grid';
    else if (isCijferen) {
      // Bij HTE÷E is de deelkaart breder → 2 kolommen ipv 3
      const isHTEDeel = blok.config?.bewerking === 'delen' && blok.config?.deelType === 'HTE:E';
      if (isHTEDeel) gridKlasse = 'cijferen-grid';  // 2 kolommen
      else if (blok.config?.bewerking === 'delen' || blok.config?.bereik >= 1000 || blok.config?.schatting) gridKlasse = 'cijferen-grid-3';
      else gridKlasse = 'cijferen-grid';
    }
    else                                                                   gridKlasse = '';

    const div = document.createElement('div');
    div.className  = 'preview-blok';
    div.dataset.id = blok.id;

    div.innerHTML = `
      <div class="preview-blok-header">
        <span class="blok-type-badge">${badgeTxt}</span>
        <span class="blok-niveau">Tot ${blok.niveau}</span>
        <span style="color:rgba(255,255,255,.6);font-size:12px;margin-left:4px;">${isSplitsingen ? '' : brugLabel}</span>
        <div class="spacer"></div>
        <div class="blok-acties">
          <button class="btn-blok-actie verwijder"
            onclick="App.verwijderBlok('${blok.id}')" title="Verwijder blok">✕</button>
        </div>
      </div>
      <div class="preview-blok-body">
        <div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}">
          ${_zinWeergave(blok)}
        </div>
        <div class="oefeningen-grid ${gridKlasse}" id="grid-${blok.id}">
          ${blok.oefeningen.map((o, i) => _oefeningHTML(blok, o, i)).join('')}
        </div>
      </div>
      <div class="preview-blok-footer">
        <span class="footer-info">
          ${blok.oefeningen.length} oefeningen · ${blok.config?.bewerking ? blok.config.bewerking : ((blok.config?.oefeningstypes) || []).join(', ')}
        </span>
        <button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button>
      </div>`;
    return div;
  }

  function _zinWeergave(blok) {
    return `
      <span class="opdrachtzin-tekst" id="zin-tekst-${blok.id}">${esc(blok.opdrachtzin)}</span>
      <button class="btn-bewerk-zin" onclick="App.bewerkZin('${blok.id}')" title="Bewerk">✏️</button>`;
  }

  function _oefeningHTML(blok, oef, idx) {
    const blokId        = blok.id;
    const isHerken      = blok.bewerking === 'herken-brug';
    const hulp          = blok.hulpmiddelen || [];
    const heeftSplits   = hulp.includes('splitsbeen');
    const heeftLijnen   = hulp.includes('schrijflijnen');
    const heeftAanvullen = hulp.includes('aanvullen');
    const splitspositie = blok.splitspositie || 'aftrekker';
    const bewerking     = blok.bewerking || 'optellen';
    const schrijflijnenAantal = oef.splitsDeel1 !== undefined ? 2 : (blok.schrijflijnenAantal || 2);
    const aanvullenVariant = blok.aanvullenVariant || 'zonder-schema';

    /* ── Tafels inzicht ──────────────────────────────────── */
    if (blok.bewerking === 'tafels-inzicht') {
      return _inzichtOefeningHTML(blok.id, oef, idx);
    }

    /* ── Tafels getallenlijn ─────────────────────────────── */
    if (blok.bewerking === 'tafels-getallenlijn') {
      return _getallenlijnHTML(blok.id, oef, idx);
    }

    /* ── Cijferen ────────────────────────────────────────── */
    if (blok.bewerking === 'cijferen') {
      if (blok.config?.bewerking === 'delen') return _deelOefHTML(blok, oef, idx);
      if (blok.config?.bewerking === 'komma') return _kommaOefHTML(blok, oef, idx);
      return _cijferenOefHTML(blok, oef, idx);
    }

    /* ── Tafels ──────────────────────────────────────────── */
    if (blok.bewerking === 'tafels') {
      return _tafelOefeningHTML(blok.id, oef, idx);
    }

    /* ── Splitsingen ─────────────────────────────────────── */
    if (blok.bewerking === 'splitsingen') {
      return _splitsingHTML(blok.id, oef, idx);
    }

    /* ── Herken-brug ─────────────────────────────────────── */
    if (isHerken) {
      // Detecteer of deze oefening een brug heeft
      const _herkenDelen = oef.vraag.replace(' =','').split(' ');
      const _hg1 = parseInt(_herkenDelen[0]), _hop = _herkenDelen[1], _hg2 = parseInt(_herkenDelen[2]);
      const _heeftBrug = _hop === '+' ? ((_hg1%10+_hg2%10)>=10 && (_hg1+_hg2)%10!==0) : (_hg1%10!==0 && _hg1%10<_hg2%10 && (_hg1-_hg2)%10!==0);
      return `
        <div class="oefening-item oefening-herken">
          <div class="lamp-wrapper">
            <div class="lamp-kader" data-heeft-brug="${_heeftBrug}">
              <img src="../afbeeldingen_hoofdrekenen/zisa_lamp.png" class="zisa-lamp" alt="Zisa"
                   crossOrigin="anonymous" onerror="this.style.display='none'"/>
            </div>
          </div>
          <span class="oef-tekst">${esc(oef.vraag)}</span>
          <span class="antwoord-vak" data-antwoord="${oef.antwoord ?? ''}"></span>
          <button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>
        </div>`;
    }
    /* ── DH-HT / D-HT brug (ingebouwde splits) ─────────────── */
    // Deze "ingebouwde splits" mag enkel getoond worden als de
    // gebruiker splitsbeen ook echt als hulpmiddel aanvinkte.
    if (oef.splitsDeel1 !== undefined && heeftSplits) {
      const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>`;
      const splGroot = (blok.niveau || 0) >= 10000;
      const vakKlasse = splGroot ? 'splits-vak-groot' : 'splits-vak';
      const boomKlasse = splGroot ? 'splitsbeen-boom splitsbeen-boom-groot' : 'splitsbeen-boom';
      const isAftrektalSplits = splitspositie === 'aftrektal';
      const delen = oef.vraag.replace(' =', '').trim().split(' ');
      const doelIdx = isAftrektalSplits ? 0 : 2;
      const somHTML = delen.map((w, i) =>
        i === doelIdx ? `<span class="splits-doel">${esc(w)}</span>` : esc(w)
      ).join(' ') + ' =';
      const isAftrektalGroot2 = isAftrektalSplits && splGroot;

      // Bereken splits-waarden via centrale helper
      const _sp = _berekenSplits(oef, isAftrektalSplits ? 'aftrekken' : (blok.bewerking || 'optellen'), splitspositie, blok.config?.strategie, schrijflijnenAantal, splitspositie);
      const d1 = _sp.d1;
      const d2 = _sp.d2;
      const sl1 = _sp.sl1;
      const sl2 = _sp.sl2;
      const sl3 = _sp.sl3 || '';

      return `
        <div class="oefening-item oefening-hulp${splGroot ? ' niveau-10000' : ''}${isAftrektalSplits ? ' aftrektal-hulp' : ''}${isAftrektalGroot2 ? ' aftrektal-hulp-groot' : ''}">
          <div class="hulp-som-rij">
            <span class="oef-tekst">${somHTML}</span>
            <span class="antwoord-vak" style="margin-left:4px;" data-antwoord="${oef.antwoord ?? ''}"></span>
          </div>
          <div class="hulp-splits-rij" data-splits="2">
            <div class="splitsbeen-anker">
              <div class="${boomKlasse}"></div>
              <div class="splitsbeen-vakjes">
                <div class="${vakKlasse}" data-antwoord="${d1}"></div>
                <div class="${vakKlasse}" data-antwoord="${d2}"></div>
              </div>
            </div>
          </div>
          <div class="hulp-schrijflijnen">
            <div class="schrijflijn" data-antwoord="${sl1}"></div>
            <div class="schrijflijn" data-antwoord="${sl2}"></div>
            ${sl3 ? `<div class="schrijflijn" data-antwoord="${sl3}"></div>` : ''}
          </div>
          ${del}
        </div>`;
    }


    /* ── Aanvullen ───────────────────────────────────────── */
    if (heeftAanvullen) {
      return _aanvullenHTML(blokId, oef, idx, aanvullenVariant);
    }

    /* ── Compenseren ─────────────────────────────────────── */
    const heeftCompenseren = hulp.includes('compenseren');
    if (heeftCompenseren) {
      const compenserenVariant = blok.compenserenVariant || 'met-tekens';
      const metVoorbeeld       = blok.metVoorbeeld || false;
      return _compenserenHTML(blokId, oef, idx, compenserenVariant, metVoorbeeld);
    }

    /* ── Transformeren ───────────────────────────────────── */
    const heeftTransformerenOef = hulp.includes('transformeren');
    if (heeftTransformerenOef) {
      return _transformerenHTML(blokId, oef, idx, blok);
    }

    /* ── Ingebouwde splits (DH-HT / D-HT brug) — VERWIJDERD
       Deze block tekende automatisch een splitsbeen voor DH-HT en D-HT
       oefeningen wanneer splitsbeen NIET aangevinkt was. Dat veroorzaakte
       ongewenste splitsbenen in gemengd tot 10.000 met brug. De
       splitsbeen-rendering gebeurt nu alleen via het heeftSplits-pad. */
    if (oef.drieTermen) {
      const metVoorbeeld = blok.metVoorbeeld || false;
      const isVoorbeeld  = metVoorbeeld && idx === 0;

      // Parse getallen en tekens uit de vraag
      // Vraag is bv "6 + 1 + 4 =" of "13 - 3 - 4 ="
      const rawZonderIs = oef.vraag.replace(' =', '').trim();
      const tokens = rawZonderIs.split(/\s+/);  // ['6', '+', '1', '+', '4']
      const getallen = [];
      const tekens = [];
      tokens.forEach((t, i) => {
        if (i % 2 === 0) getallen.push(parseInt(t, 10));
        else tekens.push(t);
      });

      // Bepaal welke 2 posities samen 10 zijn (voor underline-hint)
      // Bij optellen: zoek 2 getallen die samen 10 zijn
      // Bij aftrekken: meestal de eerste 2 (A - B = 10)
      let onderstreepPos = [];
      const isAftrek = tekens.some(t => t === '-' || t === '−');
      if (!isAftrek) {
        // Optellen: zoek 2 posities met som = 10
        for (let i = 0; i < getallen.length && onderstreepPos.length === 0; i++) {
          for (let j = i + 1; j < getallen.length; j++) {
            if (getallen[i] + getallen[j] === 10) {
              onderstreepPos = [i, j];
              break;
            }
          }
        }
      } else {
        // Aftrekken A - B - C: zoek welke aftrekker (pos 1 of 2) ervoor zorgt
        // dat A minus die aftrekker exact 10 is.
        //   17 - 7 - 9: A=17, A-10=7, pos 1 is 7 → onderstreep [0, 1]
        //   17 - 6 - 7: A=17, A-10=7, pos 2 is 7 → onderstreep [0, 2]
        if (getallen.length >= 3) {
          const doel = getallen[0] - 10;
          if (getallen[1] === doel) {
            onderstreepPos = [0, 1];
          } else if (getallen[2] === doel) {
            onderstreepPos = [0, 2];
          }
        } else if (getallen.length >= 2 && (getallen[0] - getallen[1]) === 10) {
          onderstreepPos = [0, 1];
        }
      }

      // Bouw de som HTML met ruimte voor onderstreping op specifieke getallen
      let somHTML = '';
      tokens.forEach((t, i) => {
        if (i % 2 === 0) {
          // Getal
          const getalIdx = i / 2;
          if (onderstreepPos.includes(getalIdx)) {
            somHTML += `<span class="eerst10-onderstreep" data-onderstreep="true">${esc(t)}</span>`;
          } else {
            somHTML += esc(t);
          }
        } else {
          somHTML += ' ' + esc(t) + ' ';
        }
      });
      somHTML += ' =';

      // Antwoordlijn — kind schrijft "10 + 1 = 11" of iets dergelijks
      // Bij voorbeeld of bij toonOplossingen: tonen we het uitgewerkte antwoord
      let oplStr = '';
      if (onderstreepPos.length === 2) {
        const restIdx = [0,1,2].find(i => !onderstreepPos.includes(i));
        const restGetal = getallen[restIdx];
        if (!isAftrek) {
          // 6 + 1 + 4 met 6+4=10 → "10 + 1 = 11"
          oplStr = `10 ${tekens[0] || '+'} ${restGetal} = ${oef.antwoord}`;
        } else {
          // Aftrekken: het teken VÓÓR de resterende aftrekker
          //   17 - 7 - 9 (rest pos=2) → "10 - 9 = 1" (teken pos 1)
          //   17 - 6 - 7 (rest pos=1) → "10 - 6 = 4" (teken pos 0)
          const tekenIdx = Math.max(0, restIdx - 1);
          oplStr = `10 ${tekens[tekenIdx] || '-'} ${restGetal} = ${oef.antwoord}`;
        }
      } else {
        // Geen onderstreping gevonden: toon gewoon het antwoord
        oplStr = String(oef.antwoord ?? '');
      }

      const antwoordHTML = isVoorbeeld
        ? `<span class="eerst10-schrijflijn eerst10-ingevuld">${esc(oplStr)}</span>`
        : `<span class="eerst10-schrijflijn" data-antwoord="${esc(oplStr)}"></span>`;

      return `
        <div class="oefening-item oefening-eerst10${isVoorbeeld ? ' eerst10-voorbeeld' : ''}">
          <span class="oef-tekst">${somHTML}</span>
          ${antwoordHTML}
          <button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>
        </div>`;
    }

    /* ── Gewone oefening zonder hulpmiddelen ─────────────── */
    if (!heeftSplits && !heeftLijnen) {
      return `
        <div class="oefening-item">
          <span class="oef-tekst">${esc(oef.vraag)}</span>
          <span class="antwoord-vak" data-antwoord="${oef.antwoord ?? ''}"></span>
          <button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>
        </div>`;
    }

    /* ── Oefening met splitsbeen / schrijflijnen ─────────── */
    // Bij gemengd blok: bepaal bewerking per oefening via het teken in oef.vraag
    const oefBewerking = blok.bewerking === 'gemengd'
      ? (oef.vraag.includes('−') || oef.vraag.includes('-') ? 'aftrekken' : 'optellen')
      : bewerking;

    let doelIdx = 0;
    if (heeftSplits) {
      if (oefBewerking === 'optellen') doelIdx = 2;
      else if (splitspositie === 'aftrekker') doelIdx = 2;
      else doelIdx = 0;
    }
    const somZonderIs = oef.vraag.replace(' =', '').trim();
    const woorden = somZonderIs.split(' ');
    const somHTML = woorden.map((w, i) =>
      (i === doelIdx && heeftSplits) ? `<span class="splits-doel">${esc(w)}</span>` : esc(w)
    ).join(' ') + ' =';
    const isAftrektal = heeftSplits && oefBewerking === 'aftrekken' && splitspositie === 'aftrektal';
    const isAftrektalGroot = isAftrektal && (parseInt(oef.vraag) >= 1000);

    // Bereken splitsbeen info voor HTML én positionering
    const splDelen   = oef.vraag.replace(' =','').trim().split(' ');
    const splDoelIdx = (oefBewerking === 'optellen') ? 2 : (splitspositie === 'aftrekker' ? 2 : 0);
    const splGetal   = parseInt(splDelen[splDoelIdx]) || 0;
    const splIsHTE   = splGetal >= 100 && splGetal % 100 !== 0 && splGetal % 10 !== 0;
    const splAantal  = heeftSplits ? (splIsHTE ? 3 : 2) : 0;
    // Gebruik grotere vakjes bij niveau tot 10.000
    const splGroot   = (blok.niveau || 0) >= 10000;
    const boomKlasse = splAantal === 3 ? 'splitsbeen-boom splitsbeen-3' :
                       splGroot ? 'splitsbeen-boom splitsbeen-boom-groot' : 'splitsbeen-boom';
    const vakKlasse  = splGroot ? 'splits-vak-groot' : 'splits-vak';
    let vakjesHTML = '';
    if (splAantal > 0) {
      // Gebruik _berekenSplits voor correcte d1/d2
      const _spVak = _berekenSplits(oef, blok.bewerking || 'optellen', blok.splitspositie || 'aftrekker', blok.config?.strategie, blok.schrijflijnenAantal || 2);
      const splAntw = splAantal === 3
        ? [_spVak.d1 !== '' ? _spVak.d1 : (oef.splitsH ?? ''),
           _spVak.d2 !== '' ? _spVak.d2 : (oef.splitsT ?? ''),
           _spVak.d3 !== undefined && _spVak.d3 !== '' ? _spVak.d3 : (oef.splitsE ?? '')]
        : [_spVak.d1 !== '' ? _spVak.d1 : (oef.splitsDeel1 ?? ''),
           _spVak.d2 !== '' ? _spVak.d2 : (oef.splitsDeel2 ?? '')];
      vakjesHTML = splAntw.map(ant =>
        `<div class="${vakKlasse}" data-antwoord="${ant}"></div>`
      ).join('');
    }

    return `
      <div class="oefening-item oefening-hulp${isAftrektal ? ' aftrektal-hulp' : ''}${isAftrektalGroot ? ' aftrektal-hulp-groot' : ''}${splGroot ? ' niveau-10000' : ''}">
        <div class="hulp-som-rij">
          <span class="oef-tekst">${somHTML}</span>
          <span class="antwoord-vak" style="margin-left:4px;" data-antwoord="${oef.antwoord ?? ''}" ></span>
        </div>
        ${heeftSplits ? `
        <div class="hulp-splits-rij" data-splits="${splAantal}">
          <div class="splitsbeen-anker">
            <div class="${boomKlasse}"></div>
            <div class="splitsbeen-vakjes">${vakjesHTML}</div>
          </div>
        </div>` : ''}
        ${heeftLijnen ? `
        <div class="hulp-schrijflijnen">
          ${(() => {
            const _spH = _berekenSplits(oef, blok.bewerking || 'optellen', blok.splitspositie || 'aftrekker', blok.config?.strategie, schrijflijnenAantal);
            const antw = [_spH.sl1, _spH.sl2, _spH.sl3];
            return Array(schrijflijnenAantal).fill(0).map((_, si) =>
              `<div class="schrijflijn" data-antwoord="${antw[si] ?? ''}"></div>`
            ).join('');
          })()}
        </div>` : ''}
        <button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>
      </div>`;
  }

  /* ── Aanvullen HTML per variant ──────────────────────────── */
  function _aanvullenHTML(blokId, oef, idx, variant) {
    const delen  = oef.vraag.replace(' =', '').split(' ');
    const groot  = parseInt(delen[0]);
    const klein  = parseInt(delen[2]);
    const del    = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>`;
    const antwoord = groot - klein;
    const hokje  = `<span class="invulhokje" data-antwoord="${antwoord}"></span>`;

    if (variant === 'zonder-schema') {
      return `
        <div class="oefening-item oefening-aanvullen aanvullen-zonder">
          <div class="aanvullen-rij">${groot} - ${klein} = ${hokje}</div>
          <div class="aanvullen-rij">${klein} + ${hokje} = ${groot}</div>
          ${del}
        </div>`;
    }

    if (variant === 'met-schema') {
      return `
        <div class="oefening-item oefening-aanvullen aanvullen-schema">
          <div class="aanvullen-sommen">
            <div class="aanvullen-rij">${groot} - ${klein} = ${hokje}</div>
            <div class="aanvullen-rij">${klein} + ${hokje} = ${groot}</div>
          </div>
          <div class="aanvullen-tabel">
            <div class="aanvullen-groot">${groot}</div>
            <div class="aanvullen-rij-onder">
              <div class="aanvullen-klein">${klein}</div>
              <div class="aanvullen-vraag" data-antwoord="${antwoord}">?</div>
            </div>
          </div>
          ${del}
        </div>`;
    }

    if (variant === 'met-schijfjes') {
      const dKlein = Math.floor(klein / 1000);
      const hKlein = Math.floor((klein % 1000) / 100);
      const tKlein = Math.floor((klein % 100) / 10);
      const eKlein = klein % 10;
      const dGroot = Math.floor(groot / 1000);
      const hGroot = Math.floor((groot % 1000) / 100);
      const tGroot = Math.floor((groot % 100) / 10);
      const eGroot = groot % 10;
      const schijfjesHTML = _schijfjesHTML(dKlein, hKlein, tKlein, eKlein, dGroot, hGroot, tGroot, eGroot);
      return `
        <div class="oefening-item oefening-aanvullen aanvullen-schijfjes">
          <div class="aanvullen-sommen">
            <div class="aanvullen-rij">${groot} - ${klein} = ${hokje}</div>
            <div class="aanvullen-rij">${klein} + ${hokje} = ${groot}</div>
          </div>
          <div class="schijfjes-tabel">${schijfjesHTML}</div>
          ${del}
        </div>`;
    }

    return '';
  }

  function _schijfjesHTML(dKlein, hKlein, tKlein, eKlein, dGroot, hGroot, tGroot, eGroot) {
    const TOTAAL = 10;
    const LEGE_RIJ = 5;  // extra lege schijfjes onderaan voor aanvullen
    const metD = dGroot > 0;
    const metH = hGroot > 0 || dGroot > 0;
    const rijGrootte = metD ? 4 : 5;  // 4-4-2 bij D-kolom, 5-5 bij anderen

    // Bepaal welke kolommen een lege aanvulrij nodig hebben
    // tot 100: altijd E (en soms T bij brug over tiental)
    // tot 1000: T en E
    // tot 10000: H, T en E
    const metLegeRijE = true;          // altijd
    const metLegeRijT = tGroot > 0;    // bij tot 1000 en hoger
    const metLegeRijH = hGroot > 0;    // bij tot 10000

    function schijfjesVoorKolom(aantalVoorgetekend, klas, getal, metLegeAanvulRij) {
      const items = [];
      for (let i = 0; i < TOTAAL; i++) {
        items.push(i < aantalVoorgetekend
          ? `<div class="schijfje ${klas}">${getal}</div>`
          : `<div class="schijfje schijfje-leeg"></div>`);
      }
      // Extra lege rij onderaan voor aanvullen inkleuren
      if (metLegeAanvulRij) {
        for (let i = 0; i < LEGE_RIJ; i++) {
          items.push(`<div class="schijfje schijfje-leeg schijfje-aanvul"></div>`);
        }
      }
      const rijen = [];
      for (let r = 0; r < items.length; r += rijGrootte) {
        rijen.push(`<div class="schijfjes-rij">${items.slice(r, r + rijGrootte).join('')}</div>`);
      }
      return rijen.join('');
    }

    const dKolom = metD ? `
      <div class="schijfjes-kolom schijfjes-kolom-d">
        <div class="schijfjes-kop schijfjes-kop-d">D</div>
        ${schijfjesVoorKolom(dKlein, 'schijfje-d', 1000, false)}
      </div>` : '';

    const hKolom = metH ? `
      <div class="schijfjes-kolom schijfjes-kolom-h">
        <div class="schijfjes-kop schijfjes-kop-h">H</div>
        ${schijfjesVoorKolom(hKlein, 'schijfje-h', 100, metLegeRijH)}
      </div>` : '';

    return `
      ${dKolom}
      ${hKolom}
      <div class="schijfjes-kolom schijfjes-kolom-t">
        <div class="schijfjes-kop schijfjes-kop-t">T</div>
        ${schijfjesVoorKolom(tKlein, 'schijfje-t', 10, metLegeRijT)}
      </div>
      <div class="schijfjes-kolom schijfjes-kolom-e">
        <div class="schijfjes-kop schijfjes-kop-e">E</div>
        ${schijfjesVoorKolom(eKlein, 'schijfje-e', 1, metLegeRijE)}
      </div>`;
  }

  /* ── Compenseren HTML ───────────────────────────────────── */
  function _compenserenHTML(blokId, oef, idx, variant, metVoorbeeld) {
    const isVoorbeeldOef = metVoorbeeld && idx === 0;
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">&#x2715;</button>`;

    // ── ZONDER HULP: lange schrijflijn, voorbeeld toont volledige tussenstap ──
    if (variant === 'zonder-hulp') {
      const isAftrekken = oef.vraag.includes(' - ');
      const teken = isAftrekken ? '-' : '+';
      if (isVoorbeeldOef || _toonOplossingen) {
        // Voorbeeld: som = tussenstap − delta = antwoord
        const tussenTeken = isAftrekken ? '+' : '−';
        return `<div class="oefening-item oefening-comp comp-voorbeeld">
          <div style="font-size:14px;font-weight:600;line-height:2;padding:2px 0">
            <span style="color:#1a3a5c">${esc(oef.vraag.replace(' =',''))} = </span>
            <span style="color:#2980b9">${esc(String(oef.andereGetal))} ${teken} ${esc(String(oef.tiental))}</span>
            <span style="color:#e74c3c"> ${tussenTeken} ${esc(String(oef.compenseerDelta))}</span>
            <span style="color:#1a3a5c"> = ${oef.antwoord}</span>
          </div>
          ${del}
        </div>`;
      }
      return `<div class="oefening-item oefening-comp">
        <div style="display:flex;align-items:flex-end;font-size:15px;font-weight:600;gap:0">
          <span style="padding-bottom:3px">${esc(oef.vraag)}</span>
          <span style="display:inline-block;border-bottom:1.5px solid #B0C4D8;flex:1;min-width:180px;margin-left:4px"></span>
        </div>
        ${del}
      </div>`;
    }

    const delen       = oef.vraag.replace(' =', '').split(' ');
    const a           = parseInt(delen[0]);
    const compGetal   = oef.compenseerGetal;
    const compIsLinks = (a === compGetal);

    // Bij zelf-kringen: geen cirkel, geen pijl — kind doet alles zelf
    const zelfKringen = (variant === 'zelf-kringen') && !isVoorbeeldOef;

    // Kring of gewone tekst
    const kringId = `kring-${blokId}-${idx}`;
    const kringSpan = zelfKringen
      ? `<span>${esc(String(compGetal))}</span>`
      : `<span class="comp-kring" id="${kringId}">${esc(String(compGetal))}</span>`;

    // Bewerking
    const isAftrekken = oef.vraag.includes(' - ');

    // Pijl: verborgen bij zelf-kringen
    // Bij aftrekken altijd recht naar beneden (kring staat rechts, blokje links)
    const pijlChar = (compIsLinks || isAftrekken) ? '&darr;' : '&#x2199;';
    const pijlTonen = !zelfKringen;

    // Compenseerblokje — volgorde afhankelijk van bewerking
    let blokjeInhoud;
    if (isVoorbeeldOef || _toonOplossingen) {
      if (isAftrekken) {
        blokjeInhoud = `<span class="comp-blokje-teken">&minus;</span><span class="comp-blokje-getal">${oef.tiental}</span><span class="comp-blokje-teken">+</span><span class="comp-blokje-getal">${oef.compenseerDelta}</span>`;
      } else {
        blokjeInhoud = `<span class="comp-blokje-teken">+</span><span class="comp-blokje-getal">${oef.tiental}</span><span class="comp-blokje-teken">&minus;</span><span class="comp-blokje-getal">${oef.compenseerDelta}</span>`;
      }
    } else if (variant === 'met-tekens') {
      if (isAftrekken) {
        blokjeInhoud = `<span class="comp-blokje-teken">&minus;</span><span class="comp-blokje-hokje" data-antwoord="${oef.tiental}"></span><span class="comp-blokje-teken">+</span><span class="comp-blokje-hokje" data-antwoord="${oef.compenseerDelta}"></span>`;
      } else {
        blokjeInhoud = `<span class="comp-blokje-teken">+</span><span class="comp-blokje-hokje" data-antwoord="${oef.tiental}"></span><span class="comp-blokje-teken">&minus;</span><span class="comp-blokje-hokje" data-antwoord="${oef.compenseerDelta}"></span>`;
      }
    } else {
      // zonder-tekens én zelf-kringen: 2 lege brede hokjes
      blokjeInhoud = `<span class="comp-blokje-hokje comp-blokje-hokje-breed" data-antwoord="${oef.tiental}"></span><span class="comp-blokje-hokje comp-blokje-hokje-breed" data-antwoord="${oef.compenseerDelta}"></span>`;
    }

    const antw  = (isVoorbeeldOef || _toonOplossingen) ? String(oef.antwoord) : '';
    const antwData = oef.antwoord ?? '';
    // Schrijflijnen: tekst staat boven de lijn (als label), lijn is de streep eronder
    const lijn1tekst = (isVoorbeeldOef || _toonOplossingen) ? esc(oef.schrijflijn1) : '';
    const lijn2tekst = (isVoorbeeldOef || _toonOplossingen) ? esc(oef.schrijflijn2) : '';
    const lijn1data  = oef.schrijflijn1 ?? '';
    const lijn2data  = oef.schrijflijn2 ?? '';

    // Layout:
    // - Som en pijl in een 2-kolom grid zodat pijl exact onder kring staat
    // - Bij compIsLinks: kring in kol1, rest in kol2 → pijl in kol1
    // - Bij !compIsLinks: prefix in kol1, kring+rest in kol2 → pijl in kol2
    // - Blokje staat altijd links op vaste plek (onder de pijl maar los ervan)
    // Bewerkingsteken: + bij optellen, − bij aftrekken
    const teken = isAftrekken ? ' - ' : ' + ';
    const somPrefix = compIsLinks ? '' : `${esc(String(oef.andereGetal))}${teken}`;
    const somSuffix = compIsLinks ? `${teken}${esc(String(oef.andereGetal))}` : '';

    return `
      <div class="oefening-item oefening-comp${isVoorbeeldOef ? ' comp-voorbeeld' : ''}">
        <div class="comp-grid">
          <div class="cg-pre">${somPrefix}</div>
          <div class="cg-k">${kringSpan}</div>
          <div class="cg-suf">${somSuffix} =</div>
          <div class="cg-av"><span class="antwoord-vak${isVoorbeeldOef ? ' antwoord-ingevuld' : ''}" data-antwoord="${antwData}">${antw}</span></div>
          <div class="cg-pijl">${pijlTonen ? pijlChar : ''}</div>
          <div class="cg-blok"><div class="comp-blokje">${blokjeInhoud}</div></div>
        </div>
        <div class="comp-schrijf">
          <div class="comp-schrijflijn"><span class="comp-schrijf-tekst" data-antwoord="${lijn1data}">${lijn1tekst}</span></div>
          <div class="comp-schrijflijn"><span class="comp-schrijf-tekst" data-antwoord="${lijn2data}">${lijn2tekst}</span></div>
        </div>
        ${del}
      </div>`;
  }


  /* ══════════════════════════════════════════════════════════
     TRANSFORMEREN (OPTELLINGSWIP) HTML RENDERER
  ══════════════════════════════════════════════════════════ */

  function _transformerenHTML(blokId, oef, idx, blok) {
    const del     = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">&#x2715;</button>`;
    const variant  = blok.transformerenVariant || 'schema';
    const isVbStijl = blok.metVoorbeeld === true && idx === 0;  // alleen voor gele achtergrond
    const isVb     = isVbStijl || _toonOplossingen;  // voor data tonen
    const isAftrek = blok.bewerking === 'aftrekken';
    const tg       = oef.transformeerGetal;
    const ag       = oef.andereGetal;
    const d        = oef.transformeerDelta;
    // Bepaal welke term links staat (volg volgorde van de som)
    // Bij aftrekken: grootste getal altijd links (= aftrektal)
    const grootsteLinks = isAftrek ? Math.max(tg, ag) === tg : oef.vraag.trim().startsWith(String(tg));
    const links    = grootsteLinks ? tg  : ag;
    const rechts   = grootsteLinks ? ag  : tg;
    // Bij optellen: tg+d en ag-d (of omgekeerd afhankelijk van positie)
    // Bij aftrekken: beide +d
    const tgT  = tg + d;
    const agT  = isAftrek ? ag + d : ag - d;
    const linksT   = grootsteLinks ? tgT : agT;
    const rechtsT  = grootsteLinks ? agT : tgT;
    const som      = oef.antwoord;
    const klasse   = 'oefening-item oefening-trans' + (isVbStijl ? ' trans-voorbeeld' : '');
    const bewTeken = isAftrek ? '-' : '+';
    const dTxt     = (d > 0 ? '+' : '') + d;

    const pijl = `<svg class="trans-pijl-svg" width="12" height="32" viewBox="0 0 12 32" fill="none"><line x1="6" y1="0" x2="6" y2="26" stroke="currentColor" stroke-width="1.5"/><polyline points="2,20 6,27 10,20" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg>`;

    if (variant === 'kaal') {
      if (isVb) {
        return `<div class="${klasse} oefening-trans-kaal">
          <div class="trans-kaal-vb">${esc(String(links))} ${bewTeken} ${esc(String(rechts))} = <span class="trans-kaal-stap">${linksT} ${bewTeken} ${rechtsT}</span> = ${som}</div>
          ${del}</div>`;
      }
      return `<div class="${klasse} oefening-trans-kaal">
        <div class="trans-kaal-som">
          <span class="trans-kaal-getal">${esc(String(links))}</span>
          <span class="trans-kaal-teken">${bewTeken}</span>
          <span class="trans-kaal-getal">${esc(String(rechts))}</span>
          <span class="trans-kaal-teken">=</span>
          <span class="trans-kaal-lijn"></span>
        </div>${del}</div>`;
    }

    const antw1 = isVb ? `<span class="antwoord-vak antwoord-ingevuld">${som}</span>` : `<span class="antwoord-vak" data-antwoord="${oef.antwoord ?? ''}" ></span>`;

    // aIsTg: true als het eerste getal in de vraag het "te-geven-getal" (tg) is
    // (bepaalt de tekens van de pijlen in de transformatie)
    const aIsTg = (String(tg) === (oef.vraag || '').split(' ')[0]);

    // Pijltekens: bij optellen: tg +d, ag -d (of omgekeerd)
    // Bij aftrekken: beide +d of beide -d
    const pijlTxtL = isAftrek
      ? (d > 0 ? '+' : '') + d          // aftrekken: beide zelfde richting
      : (aIsTg ? (d > 0 ? '+' : '') + d : (d > 0 ? '-' : '+') + Math.abs(d));
    const pijlTxtR = isAftrek
      ? (d > 0 ? '+' : '') + d
      : (aIsTg ? (d > 0 ? '-' : '+') + Math.abs(d) : (d > 0 ? '+' : '') + d);

    const pijlL = isVbStijl ? `<span class="trans-pijl-waarde blauw">${pijlTxtL}</span>${pijl}` : `<span class="trans-schrijflijn-pijl" data-antwoord="${pijlTxtL}"></span>${pijl}`;
    const pijlR = isVbStijl ? `${pijl}<span class="trans-pijl-waarde blauw">${pijlTxtR}</span>` : `${pijl}<span class="trans-schrijflijn-pijl" data-antwoord="${pijlTxtR}"></span>`;
    const ondL  = isVbStijl ? `<span class="trans-ingevuld">${linksT}</span>` : `<span class="trans-schrijflijn" data-antwoord="${linksT}"></span>`;
    const ondR  = isVbStijl ? `<span class="trans-ingevuld">${rechtsT}</span>` : `<span class="trans-schrijflijn" data-antwoord="${rechtsT}"></span>`;
    const ondAn = isVbStijl ? `<span class="trans-ingevuld">${som}</span>`  : `<span class="trans-schrijflijn" data-antwoord="${som}"></span>`;

    const tabel = `<table class="trans-tabel">
      <colgroup><col style="width:30%"><col style="width:8%"><col style="width:30%"><col style="width:8%"><col></colgroup>
      <tr>
        <td class="trans-td-getal-l">${esc(String(links))}</td>
        <td class="trans-td-teken">${bewTeken}</td>
        <td class="trans-td-getal-r">${esc(String(rechts))}</td>
        <td class="trans-td-is">=</td>
        <td class="trans-td-antw">${antw1}</td>
      </tr>
      <tr>
        <td class="trans-td-pijl-l"><div class="trans-pijl-cel-l">${pijlL}</div></td>
        <td></td>
        <td class="trans-td-pijl-r"><div class="trans-pijl-cel-r">${pijlR}</div></td>
        <td></td><td></td>
      </tr>
      <tr class="trans-tr-onder">
        <td class="trans-td-getal-l">${ondL}</td>
        <td class="trans-td-teken">${bewTeken}</td>
        <td class="trans-td-getal-r">${ondR}</td>
        <td class="trans-td-is">=</td>
        <td class="trans-td-antw">${ondAn}</td>
      </tr>
    </table>`;

    if (variant === 'pijltjes') return `<div class="${klasse}">${tabel}${del}</div>`;

    if (isAftrek) {
      const absD = Math.abs(d);
      const geelInhoud = isVb ? String(absD) : '';
      // links = aftrektal (groot), rechts = aftrekker (klein, transformeerterm)
      const rij2Inhoud = isVb
        ? `<div style="background:#b5d4f4;flex:3;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#1e3a8a;padding:0 4px">${linksT}</div><div style="background:#e5e7eb;flex:2;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#9ca3af">${rechtsT}</div>`
        : `<div style="background:#b5d4f4;flex:3;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#1e3a8a;padding:0 4px">${rechts}</div><div style="background:#e5e7eb;flex:2;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#9ca3af">?</div>`;
      return `<div class="${klasse}">
        <div style="display:flex;width:100%;height:26px;margin-bottom:2px;gap:2px">
          <div style="background:#fde68a;border-radius:3px;width:28px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#78350f">${geelInhoud}</div>
          <div style="background:#b5d4f4;border-radius:3px;flex:1;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#1e3a8a">${links}</div>
        </div>
        <div style="display:flex;width:100%;height:26px;margin-bottom:10px;gap:2px">
          <div style="background:#fde68a;border-radius:3px;width:28px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#78350f">${geelInhoud}</div>
          <div style="border-radius:3px;flex:1;display:flex;overflow:hidden;gap:1px">${rij2Inhoud}</div>
        </div>
        ${tabel}${del}
      </div>`;
    } else {
      const totaalSom = tg + ag;
      // Rij 1: a links, b rechts — zelfde volgorde als de som
      const rA1 = Math.min(80, Math.max(20, (aIsTg ? tg : ag) / totaalSom * 100)).toFixed(1);
      const rB1 = (100 - parseFloat(rA1)).toFixed(1);
      // Rij 2: tg wordt groter (+d), ag wordt kleiner (-d)
      const rA2 = Math.min(85, Math.max(15, (aIsTg ? tgT : ag - d) / totaalSom * 100)).toFixed(1);
      const rB2 = (100 - parseFloat(rA2)).toFixed(1);

      const klA  = aIsTg ? 'trans-balk-b' : 'trans-balk-g';
      const klB  = aIsTg ? 'trans-balk-g' : 'trans-balk-b';
      const numA = aIsTg ? 'trans-balk-num' : 'trans-balk-num-g';
      const numB = aIsTg ? 'trans-balk-num-g' : 'trans-balk-num';
      const scrA = aIsTg ? 'trans-balk-schrijf' : 'trans-balk-schrijf-g';
      const scrB = aIsTg ? 'trans-balk-schrijf-g' : 'trans-balk-schrijf';
      const invA = aIsTg ? 'trans-balk-inv' : 'trans-balk-inv-g';
      const invB = aIsTg ? 'trans-balk-inv-g' : 'trans-balk-inv';
      const lblA2 = aIsTg ? tgT : agT;
      const lblB2 = aIsTg ? agT : tgT;

      const balk2A = isVb ? `<div class="${invA}">${lblA2}</div>` : `<div class="${scrA}"></div>`;
      const balk2B_schema = isVb ? `<div class="${invB}">${lblB2}</div>` : `<div class="${scrB}"></div>`;
      return `<div class="${klasse}">
        <div class="trans-balk-rij">
          <div class="${klA}" style="width:${rA1}%"><div class="${numA}">${esc(String(aIsTg ? tg : ag))}</div><div class="${scrA}"></div></div>
          <div class="${klB}" style="width:${rB1}%"><div class="${numB}">${esc(String(aIsTg ? ag : tg))}</div><div class="${scrB}"></div></div>
        </div>
        <div class="trans-balk-rij">
          <div class="${klA}" style="width:${rA2}%;position:relative">${balk2A}</div>
          <div class="${klB}" style="width:${rB2}%;position:relative">${balk2B_schema}</div>
        </div>
        ${tabel}${del}
      </div>`;
    }
  }


  /* ══════════════════════════════════════════════════════════
     SPLITSINGEN HTML RENDERERS
  ══════════════════════════════════════════════════════════ */

  function _splitsingHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>`;
    if (oef.type === 'klein-splitshuis')       return _kleinsplitshuisHTML(blokId, oef, idx, del);
    if (oef.type === 'splitsbeen')             return _splitsbeenHTML(blokId, oef, idx, del);
    if (oef.type === 'groot-splitshuis')       return _grootsplitshuisHTML(blokId, oef, idx, del);
    if (oef.type === 'splitsbeen-bewerkingen') return _splitsbeenBewerkingHTML(blokId, oef, idx, del);
    if (oef.type === 'puntoefening')           return _puntoefHTML(blokId, oef, idx, del);
    return '';
  }

  /* ── Puntoefening ────────────────────────────────────────────
     1 + ___ = 5   of   ___ + 3 = 5   etc.
     null in tekst = schrijflijn
  ────────────────────────────────────────────────────────── */
  function _puntoefHTML(blokId, oef, idx, del) {
    // Bereken antwoord uit tekst: [a, op, b, '=', c] - een van a/b/c is null
    const _pTekst = oef.tekst || [];
    const _pNums  = _pTekst.filter(x => typeof x === 'number');
    const _pOp    = _pTekst.find(x => typeof x === 'string' && ['+','-','×','÷',':','*','/'].includes(x));
    const _pEqIdx = _pTekst.indexOf('=');
    function _pBerekenAntw(nullPos) {
      if (_pEqIdx === -1 || !_pOp) return '';
      const a = _pTekst[0], b = _pTekst[2], c = _pTekst[_pEqIdx + 1];
      if (nullPos > _pEqIdx) { // c = a OP b
        if (_pOp === '+' || _pOp === '+') return (a||0) + (b||0);
        if (_pOp === '-') return (a||0) - (b||0);
        if (_pOp === '×' || _pOp === '*') return (a||0) * (b||0);
        if (_pOp === '÷' || _pOp === '/' || _pOp === ':') return (a||0) / (b||0);
      } else if (nullPos === 0) { // a = c OP-inv b
        if (_pOp === '+') return (c||0) - (b||0);
        if (_pOp === '-') return (c||0) + (b||0);
        if (_pOp === '×' || _pOp === '*') return (c||0) / (b||0);
        if (_pOp === '÷' || _pOp === '/' || _pOp === ':') return (c||0) * (b||0);
      } else { // b = c OP-inv a
        if (_pOp === '+') return (c||0) - (a||0);
        if (_pOp === '-') return (a||0) - (c||0);
        if (_pOp === '×' || _pOp === '*') return (c||0) / (a||0);
        if (_pOp === '÷' || _pOp === '/' || _pOp === ':') return (a||0) * (c||0);
      }
      return '';
    }
    let _pNulIdx = 0;
    const delen = _pTekst.map((d, _pi) => {
      if (typeof d === 'string') {
        return `<span class="punt-teken">${d}</span>`;
      }
      if (d === null) {
        const _pAntw = _pBerekenAntw(_pi);
        _pNulIdx++;
        return `<span class="punt-lijn" data-antwoord="${_pAntw !== '' && _pAntw !== undefined ? _pAntw : ''}"></span>`;
      }
      return `<span class="punt-getal">${d}</span>`;
    }).join('');

    return `
      <div class="oefening-item oefening-splits oefening-punt">
        <div class="punt-rij">${delen}</div>
        ${del}
      </div>`;
  }

  /* ── Klein splitshuis ───────────────────────────────────────
     Visueel:
                  ╱╲
                 / N \      ← dak: totaal (of leeg vakje)
                /____\
               |  a |+| b | ← kamers: één gegeven, één leeg
               |____|_|____|
  ────────────────────────────────────────────────────────── */
  function _kleinsplitshuisHTML(blokId, oef, idx, del) {
    const dakGegeven   = oef.totaal !== null;
    const linksGegeven = oef.links  !== null;
    const rechtsGegeven= oef.rechts !== null;

    const _ksTotAntw  = oef.links  !== null && oef.rechts !== null ? oef.links + oef.rechts : '';
    const _ksLinkAntw = oef.totaal !== null && oef.rechts !== null ? oef.totaal - oef.rechts : '';
    const _ksRechAntw = oef.totaal !== null && oef.links  !== null ? oef.totaal - oef.links  : '';

    const dakHTML = dakGegeven
      ? `<span class="sh-dak-getal">${oef.totaal}</span>`
      : `<span class="sh-vakje sh-vakje-dak" data-antwoord="${_ksTotAntw}"></span>`;

    const linksHTML = linksGegeven
      ? `<span class="sh-kamer-getal">${oef.links}</span>`
      : `<span class="sh-vakje sh-vakje-kamer" data-antwoord="${_ksLinkAntw}"></span>`;

    const rechtsHTML = rechtsGegeven
      ? `<span class="sh-kamer-getal">${oef.rechts}</span>`
      : `<span class="sh-vakje sh-vakje-kamer" data-antwoord="${_ksRechAntw}"></span>`;

    return `
      <div class="oefening-item oefening-splits oefening-kleinsplitshuis">
        <div class="splitshuis-wrap">
          <div class="sh-dak">
            <div class="sh-dak-driehoek"></div>
            <div class="sh-dak-inhoud">${dakHTML}</div>
          </div>
          <div class="sh-muur">
            <div class="sh-kamer sh-kamer-l">${linksHTML}</div>
            <div class="sh-scheidingswand"></div>
            <div class="sh-kamer sh-kamer-r">${rechtsHTML}</div>
          </div>
        </div>
        ${del}
      </div>`;
  }

  /* ── Splitsbeen ─────────────────────────────────────────────
     Omgekeerde V:
          [ totaal ]        ← invulvakje of getal bovenaan
           /      \
       [links]  [rechts]   ← invulvakje of getal onderaan
  ────────────────────────────────────────────────────────── */
  function _splitsbeenHTML(blokId, oef, idx, del) {
    const _sbTotAntw  = oef.totaal  !== null ? oef.totaal  : (oef.links  !== null && oef.rechts !== null ? oef.links + oef.rechts : '');
    const _sbLinkAntw = oef.links   !== null ? oef.links   : (oef.totaal !== null && oef.rechts !== null ? oef.totaal - oef.rechts : '');
    const _sbRechAntw = oef.rechts  !== null ? oef.rechts  : (oef.totaal !== null && oef.links  !== null ? oef.totaal - oef.links  : '');
    const top    = oef.totaal  !== null ? `<span class="sb-hokje">${oef.totaal}</span>`  : `<span class="sb-hokje" data-antwoord="${_sbTotAntw}"></span>`;
    const links  = oef.links   !== null ? `<span class="sb-hokje">${oef.links}</span>`   : `<span class="sb-hokje" data-antwoord="${_sbLinkAntw}"></span>`;
    const rechts = oef.rechts  !== null ? `<span class="sb-hokje">${oef.rechts}</span>`  : `<span class="sb-hokje" data-antwoord="${_sbRechAntw}"></span>`;

    return `
      <div class="oefening-item oefening-splits oefening-splitsbeen">
        <div class="splitsbeen-wrap">
          <div class="sb-top">${top}</div>
          <svg class="sb-v-svg" viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <line x1="30" y1="0" x2="4" y2="24" stroke="#4A90D9" stroke-width="1.5"/>
            <line x1="30" y1="0" x2="56" y2="24" stroke="#4A90D9" stroke-width="1.5"/>
          </svg>
          <div class="sb-onder">
            <div class="sb-cel">${links}</div>
            <div class="sb-cel">${rechts}</div>
          </div>
        </div>
        ${del}
      </div>`;
  }

  /* ── Groot splitshuis ───────────────────────────────────────
     Één huis met alle splitsingen gestapeld als verdiepen.
     Afwisselend links/rechts leeg. Dak altijd ingevuld.
  ────────────────────────────────────────────────────────── */
  function _grootsplitshuisHTML(blokId, oef, idx, del) {
    const rijenHTML = (oef.rijen || []).map(rij => {
      const _gsLinkAntw  = rij.links  !== null ? rij.links  : (oef.totaal !== null && rij.rechts !== null ? oef.totaal - rij.rechts : '');
      const _gsRechAntw  = rij.rechts !== null ? rij.rechts : (oef.totaal !== null && rij.links  !== null ? oef.totaal - rij.links  : '');
      const linksHTML  = rij.links  !== null ? `<span class="sh-kamer-getal">${rij.links}</span>`  : `<span class="sh-vakje sh-vakje-kamer" data-antwoord="${_gsLinkAntw}"></span>`;
      const rechtsHTML = rij.rechts !== null ? `<span class="sh-kamer-getal">${rij.rechts}</span>` : `<span class="sh-vakje sh-vakje-kamer" data-antwoord="${_gsRechAntw}"></span>`;
      return `
        <div class="sh-muur-rij">
          <div class="sh-kamer sh-kamer-l">${linksHTML}</div>
          <div class="sh-scheidingswand"></div>
          <div class="sh-kamer sh-kamer-r">${rechtsHTML}</div>
        </div>`;
    }).join('');

    return `
      <div class="oefening-item oefening-splits oefening-grootsplitshuis">
        <div class="splitshuis-wrap">
          <div class="sh-dak">
            <div class="sh-dak-driehoek"></div>
            <div class="sh-dak-inhoud"><span class="sh-dak-getal">${oef.totaal}</span></div>
          </div>
          <div class="sh-muur sh-muur-groot">
            ${rijenHTML}
          </div>
        </div>
        ${del}
      </div>`;
  }

  /* ── Splitsbeen + 4 bewerkingen ─────────────────────────────
     Splitsbeen bovenaan, daarna 4 lege bewerkingen in kader.
     Kind vult alles zelf in.
  ────────────────────────────────────────────────────────── */
  function _splitsbeenBewerkingHTML(blokId, oef, idx, del) {
    // Bereken alle waarden (ook ontbrekende)
    const _sbL = oef.links  !== null ? oef.links  : (oef.totaal !== null && oef.rechts !== null ? oef.totaal - oef.rechts : null);
    const _sbR = oef.rechts !== null ? oef.rechts : (oef.totaal !== null && oef.links  !== null ? oef.totaal - oef.links  : null);
    const _sbT = oef.totaal !== null ? oef.totaal : (_sbL !== null && _sbR !== null ? _sbL + _sbR : null);
    const top    = `<span class="sb-hokje">${_sbT ?? ''}</span>`;
    const links  = oef.links  !== null
      ? `<span class="sb-hokje">${oef.links}</span>`
      : `<span class="sb-hokje" data-antwoord="${_sbL ?? ''}"></span>`;
    const rechts = oef.rechts !== null
      ? `<span class="sb-hokje">${oef.rechts}</span>`
      : `<span class="sb-hokje" data-antwoord="${_sbR ?? ''}"></span>`;
    // Antwoorden: [vak1, vak2, uitkomst]
    const _sbwAntw = [
      [_sbL, _sbR, _sbT],
      [_sbR, _sbL, _sbT],
      [_sbT, _sbL, _sbR],
      [_sbT, _sbR, _sbL],
    ];
    const ops  = ['+', '+', '−', '−'];
    const rijenHTML = ops.map((op, _bi) => {
      const [_a1, _a2, _a3] = _sbwAntw[_bi];
      return `
      <div class="sbw-bewerking">
        <span class="sbw-vak" data-antwoord="${_a1 !== null && _a1 !== undefined ? _a1 : ''}"></span>
        <span class="sbw-op">${op}</span>
        <span class="sbw-vak" data-antwoord="${_a2 !== null && _a2 !== undefined ? _a2 : ''}"></span>
        <span class="sbw-is">=</span>
        <span class="sbw-vak" data-antwoord="${_a3 !== null && _a3 !== undefined ? _a3 : ''}"></span>
      </div>`;
    }).join('');

    return `
      <div class="oefening-item oefening-splits oefening-sbw">
        <div class="sbw-kader">
          <div class="splitsbeen-wrap sbw-been">
            <div class="sb-top">${top}</div>
            <svg class="sb-v-svg" viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <line x1="30" y1="0" x2="4" y2="24" stroke="#4A90D9" stroke-width="1.5"/>
              <line x1="30" y1="0" x2="56" y2="24" stroke="#4A90D9" stroke-width="1.5"/>
            </svg>
            <div class="sb-onder">
              <div class="sb-cel">${links}</div>
              <div class="sb-cel">${rechts}</div>
            </div>
          </div>
          <div class="sbw-bewerkingen">
            ${rijenHTML}
          </div>
        </div>
        ${del}
      </div>`;
  }

  function _positioneerSplitsbenen() {
    document.querySelectorAll('.splitsbeen-anker').forEach(anker => {
      const oefening  = anker.closest('.oefening-hulp');
      const doelEl    = oefening?.querySelector('.splits-doel');
      if (!doelEl) return;

      // Meet midden van splits-doel t.o.v. oefening-hulp (inclusief padding)
      const doelRect = doelEl.getBoundingClientRect();
      const oefRect  = oefening.getBoundingClientRect();
      const doelMidden = doelRect.left - oefRect.left + doelRect.width / 2;

      const boom   = anker.querySelector('.splitsbeen-boom');
      const isDrie = boom?.classList.contains('splitsbeen-3');
      const isGroot = boom?.classList.contains('splitsbeen-boom-groot');
      const boomB  = isDrie ? 80 : isGroot ? 72 : 48;

      // Zet anker absoluut t.o.v. hulp-splits-rij (die is position:relative)
      // splits-rij heeft dezelfde left als oefening (minus padding)
      // → gebruik dezelfde doelMidden maar corrigeer voor padding van oefening
      const splitsRij = anker.closest('.hulp-splits-rij');
      if (!splitsRij) return;
      const splitsRect = splitsRij.getBoundingClientRect();
      const links = doelRect.left - splitsRect.left + doelRect.width / 2 - boomB / 2;

      anker.style.position = 'relative';
      anker.style.marginLeft = Math.round(links) + 'px';
    });
  }

  function _positioneerCompenseren() {
    document.querySelectorAll('.comp-pijl-blokje').forEach(blokje => {
      const kringId = blokje.dataset.kringId;
      const kringEl = document.getElementById(kringId);
      const somWrapper = blokje.closest('.oefening-comp')?.querySelector('.comp-som-wrapper');
      if (!kringEl || !somWrapper) return;
      // Midden van de kring t.o.v. de som-wrapper
      const kringRect    = kringEl.getBoundingClientRect();
      const wrapperRect  = somWrapper.getBoundingClientRect();
      const kringMidden  = kringRect.left - wrapperRect.left + kringRect.width / 2;
      // Pijl-blokje: pijl is ~10px breed, zet linkerkant zodat midden van pijl = midden kring
      blokje.style.left = Math.round(kringMidden - 8) + 'px';
    });
  }

  function toonZinEditor(blokId, huidigeZin) {
    const wrapper = document.getElementById(`zin-wrapper-${blokId}`);
    wrapper.innerHTML = `
      <input class="opdrachtzin-input" id="zin-inp-${blokId}" value="${esc(huidigeZin)}" />
      <button class="btn-bewerk-zin" onclick="App.slaZinOp('${blokId}')">✅</button>`;
    document.getElementById(`zin-inp-${blokId}`).focus();
  }

  /* ── Inzicht oefening HTML ──────────────────────────────── */
  function _inzichtOefeningHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;

    // ── Eerlijk verdelen: dispatch naar eigen renderers ───
    if (oef.type === 'verdelen-emoji')      return _verdelenEmojiHTML(blokId, oef, idx);
    if (oef.type === 'verdelen-splitshuis') return _verdelenSplitshuisHTML(blokId, oef, idx);
    if (oef.type === 'verdelen-100veld')    return _verdelen100VeldHTML(blokId, oef, idx);

    function emoKols(n) { return Math.min(5, Math.ceil(Math.sqrt(n))); }

    /* ── Delen met rest ──────────────────────────────────── */
    if (oef.type === 'delen-rest') {
      const cols = emoKols(oef.uitkomst);
      const colBreedte = 26;
      let alleEmojis = '';
      for (let i = 0; i < oef.uitkomst; i++) {
        alleEmojis += `<span class="inzicht-emoji">${oef.emoji}</span>`;
      }
      const emojiBlok = `<div class="inzicht-vakje inzicht-vakje-deel" style="grid-template-columns:repeat(${cols},${colBreedte}px);row-gap:8px;">${alleEmojis}</div>`;

      const aantalMin = oef.quotient; // aantal keer aftrekken
      const minStrepen = Array(aantalMin)
        .fill(`<span class="inzicht-lijn" data-antwoord="${oef.deler}" style="width:20px"></span>`)
        .join('<span class="inzicht-min">−</span>');

      const zin1 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Er zijn</span><span class="inzicht-lijn" data-antwoord="${oef.uitkomst}" style="width:20px"></span><span class="inzicht-tekst">${oef.emojiLabel}.</span></div>`;
      const zin2 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Ik verdeel in groepen van</span><span class="inzicht-ingevuld">${oef.deler}</span><span class="inzicht-tekst">.</span></div>`;
      const aftrekRij = `<div class="inzicht-optel-rij">${oef.deeltal}<span class="inzicht-min" style="margin:0 3px">−</span>${minStrepen}<span class="inzicht-is">=</span><span class="inzicht-lijn" data-antwoord="${oef.rest}" style="width:20px"></span></div>`;
      const zin3 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Ik kan</span><span class="inzicht-lijn" data-antwoord="${oef.quotient}" style="width:20px"></span><span class="inzicht-tekst">groepen maken.</span></div>`;
      const zin4 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Dan heb ik nog</span><span class="inzicht-lijn" data-antwoord="${oef.rest}" style="width:20px"></span><span class="inzicht-tekst">${oef.emojiLabel} over.</span></div>`;
      const zin5 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Dat is de rest (R).</span></div>`;
      const deelRij = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" data-antwoord="${oef.deeltal}" style="width:20px"></span><span class="inzicht-op">:</span><span class="inzicht-lijn" data-antwoord="${oef.deler}" style="width:20px"></span><span class="inzicht-is">=</span><span class="inzicht-lijn" data-antwoord="${oef.quotient}" style="width:20px"></span><span class="inzicht-tekst" style="font-style:normal;font-weight:700">R</span><span class="inzicht-lijn" data-antwoord="${oef.rest}" style="width:20px"></span></div>`;

      return `<div class="inzicht-oef inzicht-oef-deel" data-blok="${blokId}" data-idx="${idx}">
        ${del}
        <div class="inzicht-inner">
          <div class="inzicht-links">${emojiBlok}</div>
          <div class="inzicht-rechts">
            ${zin1}${zin2}${aftrekRij}${zin3}${zin4}${zin5}${deelRij}
          </div>
        </div>
      </div>`;
    }

    /* ── Delen als herhaalde aftrekking ──────────────────── */
    if (oef.type === 'delen-aftrekking') {
      const cols = emoKols(oef.uitkomst);
      const colBreedte = 26;
      let alleEmojis = '';
      for (let i = 0; i < oef.uitkomst; i++) {
        alleEmojis += `<span class="inzicht-emoji">${oef.emoji}</span>`;
      }
      const emojiBlok = `<div class="inzicht-vakje inzicht-vakje-deel" style="grid-template-columns:repeat(${cols},${colBreedte}px);row-gap:8px;">${alleEmojis}</div>`;

      const minStrepen = Array(oef.groepen)
        .fill(`<span class="inzicht-lijn" data-antwoord="${oef.groepGrootte}" style="width:20px"></span>`)
        .join('<span class="inzicht-min">−</span>');
      const aftrekRij = `<div class="inzicht-optel-rij">${oef.uitkomst}<span class="inzicht-min" style="margin:0 3px">−</span>${minStrepen}<span class="inzicht-is">=</span><span class="inzicht-nul">0</span></div>`;

      const zin1 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Er zijn</span><span class="inzicht-lijn" data-antwoord="${oef.uitkomst}" style="width:20px"></span><span class="inzicht-tekst">${oef.emojiLabel}.</span></div>`;
      const zin2 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Ik maak groepen van</span><span class="inzicht-ingevuld">${oef.groepGrootte}</span><span class="inzicht-tekst">.</span></div>`;
      const zin3 = `<div class="inzicht-tekst-rij"><span class="inzicht-tekst">Ik kan</span><span class="inzicht-lijn" data-antwoord="${oef.groepen}" style="width:20px"></span><span class="inzicht-tekst">groepen maken.</span></div>`;
      const deelRij = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" data-antwoord="${oef.uitkomst}" style="width:20px"></span><span class="inzicht-op">:</span><span class="inzicht-ingevuld">${oef.groepGrootte}</span><span class="inzicht-is">=</span><span class="inzicht-lijn" data-antwoord="${oef.groepen}" style="width:20px"></span></div>`;

      return `<div class="inzicht-oef inzicht-oef-deel" data-blok="${blokId}" data-idx="${idx}">
        ${del}
        <div class="inzicht-inner">
          <div class="inzicht-links">${emojiBlok}</div>
          <div class="inzicht-rechts">
            ${zin1}${zin2}${aftrekRij}${zin3}${deelRij}
          </div>
        </div>
      </div>`;
    }

    // LINKS: groepjes, max 3 per rij
    const MAX_PER_RIJ = 3;
    let rijHTML = '';
    for (let start = 0; start < oef.groepen; start += MAX_PER_RIJ) {
      const n = Math.min(MAX_PER_RIJ, oef.groepen - start);
      let vakjes = '';
      for (let g = 0; g < n; g++) {
        const cols = emoKols(oef.groepGrootte);
        let emojis = '';
        for (let b = 0; b < oef.groepGrootte; b++) {
          emojis += `<span class="inzicht-emoji">${oef.emoji}</span>`;
        }
        vakjes += `<div class="inzicht-vakje" style="grid-template-columns:repeat(${cols},1fr)">${emojis}</div>`;
      }
      rijHTML += `<div class="inzicht-groepjes-rij">${vakjes}</div>`;
    }

    // Vaste korte lijnbreedte — altijd gelijk, ongeacht aantal groepen
    const lijnW = 20;
    const lijnStyle = `style="width:${lijnW}px"`;
    const lijnStyleSmal = `style="width:${lijnW}px"`;

    // Rij 1: lijn + lijn + ... = lijn(breed)
    const delen = Array(oef.groepen)
      .fill(`<span class="inzicht-lijn" data-antwoord="${oef.groepGrootte}" ${lijnStyle}></span>`)
      .join('<span class="inzicht-plus">+</span>');
    const optelRij = `<div class="inzicht-optel-rij">${delen}<span class="inzicht-is">=</span><span class="inzicht-lijn breed" data-antwoord="${oef.uitkomst}"></span></div>`;

    // Rij 2: lijn groepen van lijn = lijn
    const groepVanRij = `<div class="inzicht-tekst-rij">
      <span class="inzicht-lijn" data-antwoord="${oef.groepen}" ${lijnStyle}></span>
      <span class="inzicht-tekst">groepen van</span>
      <span class="inzicht-lijn" data-antwoord="${oef.groepGrootte}" ${lijnStyle}></span>
      <span class="inzicht-is">=</span>
      <span class="inzicht-lijn" data-antwoord="${oef.uitkomst}" ${lijnStyle}></span>
    </div>`;

    // Rij 3: lijn × lijn = lijn
    const vermRij = `<div class="inzicht-tekst-rij">
      <span class="inzicht-lijn" data-antwoord="${oef.groepen}" ${lijnStyle}></span>
      <span class="inzicht-op">×</span>
      <span class="inzicht-lijn" data-antwoord="${oef.groepGrootte}" ${lijnStyle}></span>
      <span class="inzicht-is">=</span>
      <span class="inzicht-lijn" data-antwoord="${oef.uitkomst}" ${lijnStyle}></span>
    </div>`;

    return `<div class="inzicht-oef" data-blok="${blokId}" data-idx="${idx}">
      ${del}
      <div class="inzicht-inner">
        <div class="inzicht-links">
          <div class="inzicht-groepjes-wrap">${rijHTML}</div>
        </div>
        <div class="inzicht-rechts">
          ${optelRij}
          ${groepVanRij}
          ${vermRij}
        </div>
      </div>
    </div>`;
  }

  /* ── Eerlijk verdelen: emoji-variant ────────────────────── */
  function _verdelenEmojiHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;
    function emoKols(n) { return Math.min(5, Math.ceil(Math.sqrt(n))); }

    // Alle emoji's in één blok (zoals delen-aftrekking)
    const cols = emoKols(oef.totaal);
    let alleEmojis = '';
    for (let i = 0; i < oef.totaal; i++) alleEmojis += `<span class="inzicht-emoji">${oef.emoji}</span>`;
    const emojiBlok = `<div class="inzicht-vakje inzicht-vakje-deel" style="grid-template-columns:repeat(${cols},26px);row-gap:8px;">${alleEmojis}</div>`;

    // 4 zinnen
    const zin1 = `<div class="inzicht-tekst-rij"><span class="inzicht-ingevuld">${oef.totaal}</span><span class="inzicht-tekst">eerlijk verdelen in</span><span class="inzicht-ingevuld">${oef.aantalGroepen}</span><span class="inzicht-tekst">is</span><span class="inzicht-lijn" data-antwoord="${oef.perGroep}" style="width:20px"></span><span class="inzicht-tekst">.</span></div>`;
    const zin2 = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" data-antwoord="${oef.totaal}" style="width:20px"></span><span class="inzicht-tekst">verdeeld in</span><span class="inzicht-lijn" data-antwoord="${oef.aantalGroepen}" style="width:20px"></span><span class="inzicht-tekst">gelijke groepen is</span><span class="inzicht-lijn" data-antwoord="${oef.perGroep}" style="width:20px"></span><span class="inzicht-tekst">.</span></div>`;
    const zin3 = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" data-antwoord="${oef.totaal}" style="width:20px"></span><span class="inzicht-tekst">gedeeld door</span><span class="inzicht-lijn" data-antwoord="${oef.aantalGroepen}" style="width:20px"></span><span class="inzicht-tekst">is</span><span class="inzicht-lijn" data-antwoord="${oef.perGroep}" style="width:20px"></span><span class="inzicht-tekst">.</span></div>`;
    const zin4 = `<div class="inzicht-tekst-rij"><span class="inzicht-lijn" data-antwoord="${oef.totaal}" style="width:20px"></span><span class="inzicht-op">:</span><span class="inzicht-lijn" data-antwoord="${oef.aantalGroepen}" style="width:20px"></span><span class="inzicht-is">=</span><span class="inzicht-lijn" data-antwoord="${oef.perGroep}" style="width:20px"></span></div>`;

    return `<div class="inzicht-oef inzicht-oef-deel" data-blok="${blokId}" data-idx="${idx}">
      ${del}
      <div class="inzicht-inner">
        <div class="inzicht-links">${emojiBlok}</div>
        <div class="inzicht-rechts">${zin1}${zin2}${zin3}${zin4}</div>
      </div>
    </div>`;
  }

  /* ── Eerlijk verdelen: splitshuis-variant ───────────────── */
  function _verdelenSplitshuisHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;
    const n = oef.aantalGroepen;

    // Vaste vakje-breedte en gap in SVG-eenheden
    const VAK_B   = 36;   // breedte per vakje
    const GAP     = 4;    // gap tussen vakjes
    const PAD     = 10;   // padding links/rechts
    const SVG_B   = n * VAK_B + (n - 1) * GAP + PAD * 2;
    const SVG_H   = 24;
    const midX    = SVG_B / 2;

    const lijnen = Array.from({length: n}, (_, i) => {
      const vakMidX = PAD + i * (VAK_B + GAP) + VAK_B / 2;
      return `<line x1="${midX}" y1="0" x2="${vakMidX}" y2="${SVG_H}" stroke="#aaa" stroke-width="1.2"/>`;
    }).join('');

    const beenSVG = `<svg viewBox="0 0 ${SVG_B} ${SVG_H}" style="width:100%;height:${SVG_H}px;display:block;overflow:visible;">${lijnen}</svg>`;

    const vakjesHTML = Array(n).fill(`<div class="vs-vakje" data-antwoord="${oef.perGroep}"></div>`).join('');
    const zin1 = `<div class="inzicht-tekst-rij" style="margin-top:8px"><span class="inzicht-ingevuld">${oef.totaal}</span><span class="inzicht-tekst">verdeeld in</span><span class="inzicht-ingevuld">${n}</span><span class="inzicht-tekst">gelijke delen is</span><span class="inzicht-lijn" data-antwoord="${oef.perGroep}" style="width:22px"></span><span class="inzicht-tekst">.</span></div>`;
    const zin2 = `<div class="inzicht-tekst-rij"><span class="inzicht-ingevuld">${oef.totaal}</span><span class="inzicht-op">:</span><span class="inzicht-ingevuld">${n}</span><span class="inzicht-is">=</span><span class="inzicht-lijn" data-antwoord="${oef.perGroep}" style="width:22px"></span></div>`;

    return `<div class="inzicht-oef inzicht-oef-splitshuis" data-blok="${blokId}" data-idx="${idx}">
      ${del}
      <div class="vs-huis-wrap">
        <div class="vs-top-vakje">${oef.totaal}</div>
        ${beenSVG}
        <div class="vs-vakjes-rij">${vakjesHTML}</div>
      </div>
      ${zin1}${zin2}
    </div>`;
  }

  /* ── Eerlijk verdelen: 100-veld-variant ─────────────────── */
  function _verdelen100VeldHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;
    const KLEUREN = ['#E74C3C','#5DADE2','#2ECC71','#F39C12','#9B59B6','#1ABC9C','#E67E22','#EC407A','#00BCD4','#8BC34A'];
    const n = oef.aantalGroepen;   // aantal stroken (deler)
    const p = oef.perGroep;        // cellen per strook (quotient)
    // Bouw 10×10 grid
    let cellen = '';
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const celNr = r * 10 + c; // 0-based
        let kleur = '';
        // Kleur de eerste n×p cellen, elke strook van n cellen een andere kleur
        if (celNr < n * p) {
          const strook = Math.floor(celNr / n);
          kleur = `background:${KLEUREN[strook % KLEUREN.length]};opacity:0.75;`;
        }
        cellen += `<div class="veld100-cel" style="${kleur}"></div>`;
      }
    }
    const zin1 = `<div class="inzicht-tekst-rij" style="flex-wrap:wrap;gap:3px 4px;"><span class="inzicht-tekst">Hoeveel gekleurde hokjes zijn er?</span><span class="inzicht-lijn" data-antwoord="${oef.totaal}" style="width:28px"></span></div>`;
    const zin2 = `<div class="inzicht-tekst-rij" style="flex-wrap:wrap;gap:3px 4px;"><span class="inzicht-tekst">Met hoeveel stroken van</span><span class="inzicht-ingevuld">${n}</span><span class="inzicht-tekst">kun je die bedekken?</span><span class="inzicht-lijn" data-antwoord="${oef.perGroep}" style="width:28px"></span></div>`;
    const zin3 = `<div class="inzicht-tekst-rij" style="flex-wrap:wrap;gap:3px 4px;"><span class="inzicht-tekst">Hoe dikwijls gaat</span><span class="inzicht-ingevuld">${n}</span><span class="inzicht-tekst">in</span><span class="inzicht-ingevuld">${oef.totaal}</span><span class="inzicht-tekst">?</span><span class="inzicht-lijn" data-antwoord="${oef.perGroep}" style="width:28px"></span><span class="inzicht-tekst">keer.</span></div>`;

    return `<div class="inzicht-oef inzicht-oef-100veld" data-blok="${blokId}" data-idx="${idx}">
      ${del}
      <div class="veld100-wrap">
        <div class="veld100-grid">${cellen}</div>
        <div class="veld100-zinnen">${zin1}${zin2}${zin3}</div>
      </div>
    </div>`;
  }

  /* ── Tafels oefening HTML ───────────────────────────────── */
  function _tafelOefeningHTML(blokId, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">×</button>`;
    let somHTML = '';
    // Bereken antwoord voor data-antwoord attribuut
    let tafelAntwoord = '';
    if (oef.type === 'vermenigvuldigen') tafelAntwoord = oef.a * oef.b;
    else if (oef.type === 'gedeeld') tafelAntwoord = oef.a / oef.b;
    else if (oef.type === 'ontbrekende-factor') tafelAntwoord = oef.positie === 'links' ? oef.product / oef.b : oef.product / oef.a;

    if (oef.type === 'vermenigvuldigen') {
      somHTML = `<span class="tafel-term">${oef.a}</span>
                 <span class="tafel-op">×</span>
                 <span class="tafel-term">${oef.b}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak" data-antwoord="${oef.a * oef.b}"></span>`;
    } else if (oef.type === 'gedeeld') {
      somHTML = `<span class="tafel-term">${oef.a}</span>
                 <span class="tafel-op">:</span>
                 <span class="tafel-term">${oef.b}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak" data-antwoord="${oef.a / oef.b}"></span>`;
    } else if (oef.type === 'ontbrekende-factor') {
      if (oef.positie === 'links') {
        somHTML = `<span class="tafel-vak" data-antwoord="${oef.product / oef.b}"></span>
                   <span class="tafel-op">×</span>
                   <span class="tafel-term">${oef.b}</span>
                   <span class="tafel-is">=</span>
                   <span class="tafel-term">${oef.product}</span>`;
      } else {
        somHTML = `<span class="tafel-term">${oef.a}</span>
                   <span class="tafel-op">×</span>
                   <span class="tafel-vak" data-antwoord="${oef.product / oef.a}"></span>
                   <span class="tafel-is">=</span>
                   <span class="tafel-term">${oef.product}</span>`;
      }
    } else if (oef.type === 'redeneren') {
      // deeltal : deler = quotient , want quotient × deler = deeltal
      const _rdQuotient = oef.deeltal / oef.deler;
      somHTML = `<span class="tafel-term">${oef.deeltal}</span>
                 <span class="tafel-op">:</span>
                 <span class="tafel-term">${oef.deler}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak tafel-vak-smal" data-antwoord="${_rdQuotient}"></span>
                 <span class="tafel-want">, want</span>
                 <span class="tafel-vak tafel-vak-smal" data-antwoord="${_rdQuotient}"></span>
                 <span class="tafel-op">×</span>
                 <span class="tafel-term">${oef.deler}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak tafel-vak-smal" data-antwoord="${oef.deeltal}"></span>`;
    } else if (oef.type === 'koppel') {
      // factor1 × factor2 = product , dus product : factor2 = factor1
      const _kpProduct = oef.factor1 * oef.factor2;
      somHTML = `<span class="tafel-term">${oef.factor1}</span>
                 <span class="tafel-op">×</span>
                 <span class="tafel-term">${oef.factor2}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak tafel-vak-smal" data-antwoord="${_kpProduct}"></span>
                 <span class="tafel-want">, dus</span>
                 <span class="tafel-vak tafel-vak-smal" data-antwoord="${_kpProduct}"></span>
                 <span class="tafel-op">:</span>
                 <span class="tafel-term">${oef.factor2}</span>
                 <span class="tafel-is">=</span>
                 <span class="tafel-vak tafel-vak-smal" data-antwoord="${oef.factor1}"></span>`;
    }

    return `<div class=tafel-oef data-blok=${blokId} data-idx=${idx}>
      ${del}
      <div class=tafel-som>${somHTML}</div>
    </div>`;
  }

  /* ── Getallenlijn preview HTML ───────────────────────────── */
 function _getallenlijnHTML(blokId, oef, idx) {
  const { groepen, stap, uitkomst, variant, positie, rest = 0 } = oef;
  const max = Math.max(uitkomst, 20);

  const vakjeW  = Math.max(18, Math.min(24, Math.floor(540 / (max + 2))));
  const lijnW   = (max + 1) * vakjeW;
  const isBogenBoven = variant === 'getekend' || variant === 'zelf';
  const isBogenOnder = variant === 'delen-getekend' || variant === 'delen-rest-getekend' || variant === 'delen-zelf' || variant === 'delen-rest-zelf';
  const isBogen = isBogenBoven || isBogenOnder;
  const boogH   = isBogenBoven ? 34 : 0;
  const boogHOnder = isBogenOnder ? 30 : 0; // extra ruimte onder de lijn voor bogen
  const svgH    = boogH + 44 + boogHOnder;
  const totaalW = lijnW + 34;

  const vakjeY = boogH + 8;
  const vakjeH = 22;
  const asY    = vakjeY + vakjeH + 7;

  function middenVanGetal(n) {
    return n * vakjeW + vakjeW / 2;
  }

  let svgInhoud = '';

  // vakjes
  for (let n = 0; n <= max; n++) {
    const x = n * vakjeW;
    svgInhoud += `<rect x="${x}" y="${vakjeY}" width="${vakjeW - 1}" height="${vakjeH}" rx="1.5" ry="1.5" fill="#ffffff" stroke="#85B0C6" stroke-width="1"/>`;
    svgInhoud += `<text x="${x + (vakjeW - 1) / 2}" y="${vakjeY + 14}" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" fill="#333333">${n}</text>`;
  }

  // onderlijn + pijl
  svgInhoud += `<line x1="${vakjeW / 2}" y1="${asY}" x2="${lijnW + 18}" y2="${asY}" stroke="#85B0C6" stroke-width="1.4"/>`;
  svgInhoud += `<polygon points="${lijnW + 24},${asY} ${lijnW + 17},${asY - 4} ${lijnW + 17},${asY + 4}" fill="#85B0C6"/>`;

  // boogjes vermenigvuldigen: links → rechts, boven de lijn
  if (variant === 'getekend') {
    const boogBasisY = vakjeY - 2;
    const ctrlLift   = 18;
    for (let g = 0; g < groepen; g++) {
      const x1 = middenVanGetal(g * stap);
      const x2 = middenVanGetal((g + 1) * stap);
      const midX = (x1 + x2) / 2;
      const ctrlY = boogBasisY - ctrlLift;
      svgInhoud += `<path d="M ${x1} ${boogBasisY} C ${x1 + (x2 - x1) * 0.22} ${ctrlY}, ${x1 + (x2 - x1) * 0.78} ${ctrlY}, ${x2} ${boogBasisY}" stroke="#444444" stroke-width="1.6" fill="none"/>`;
      svgInhoud += `<text x="${midX}" y="${ctrlY - 4}" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" font-weight="700" fill="#333333">${stap}</text>`;
    }
  }

  // boogjes delen: rechts → links, ONDER de lijn
  if (variant === 'delen-getekend' || variant === 'delen-rest-getekend') {
    const boogBasisY = asY + 2;
    const ctrlLift   = 18;
    for (let g = 0; g < groepen; g++) {
      const vanGetal  = uitkomst - g * stap;
      const naarGetal = uitkomst - (g + 1) * stap;
      const x1 = middenVanGetal(vanGetal);
      const x2 = middenVanGetal(naarGetal);
      const midX = (x1 + x2) / 2;
      const ctrlY = boogBasisY + ctrlLift;
      svgInhoud += `<path d="M ${x1} ${boogBasisY} C ${x1 + (x2 - x1) * 0.22} ${ctrlY}, ${x1 + (x2 - x1) * 0.78} ${ctrlY}, ${x2} ${boogBasisY}" stroke="#1565C0" stroke-width="1.6" fill="none"/>`;
      svgInhoud += `<text x="${midX}" y="${ctrlY + 12}" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" font-weight="700" fill="#1565C0">${stap}</text>`;
    }
  }

  let inhoudOnderaan = '';

  if (variant === 'getekend') {
    const delen = Array(groepen).fill(`<span class="gl-lijn" data-antwoord="${stap}"></span>`).join(`<span class="gl-plus">+</span>`);
    inhoudOnderaan = `
      <div class="gl-zin">
        <span>Ik zie</span>
        <span class="gl-lijn kort" data-antwoord="${groepen}"></span>
        <span>sprongen van</span>
        <span class="gl-lijn kort" data-antwoord="${stap}"></span>
        <span>.</span>
      </div>
      <div class="gl-formule-rij">${delen}<span class="gl-eq">=</span><span class="gl-lijn breed" data-antwoord="${uitkomst}"></span></div>
      <div class="gl-formule-rij">
        <span class="gl-lijn" data-antwoord="${groepen}"></span><span class="gl-maal">×</span><span class="gl-lijn" data-antwoord="${stap}"></span>
        <span class="gl-eq">=</span><span class="gl-lijn breed" data-antwoord="${uitkomst}"></span>
      </div>`;

  } else if (variant === 'delen-getekend') {
    // Zinnen onder de getallenlijn (bogen staan al in SVG)
    const minStrepen = Array(groepen).fill(`<span class="gl-lijn" data-antwoord="${stap}"></span>`).join(`<span class="gl-min">−</span>`);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${uitkomst}</span>
        <span class="gl-min">−</span>${minStrepen}
        <span class="gl-eq">=</span><span class="gl-nul">0</span>
      </div>
      <div class="gl-zin">
        <span>Ik kan</span><span class="gl-lijn kort" data-antwoord="${groepen}"></span>
        <span>sprongen maken.</span>
      </div>
      <div class="gl-zin">
        <span class="gl-getal-vast">${stap}</span>
        <span>gaat</span><span class="gl-lijn kort" data-antwoord="${groepen}"></span>
        <span>keer in</span>
        <span class="gl-getal-vast">${uitkomst}</span><span>.</span>
      </div>
      <div class="gl-formule-rij">
        <span class="gl-lijn" data-antwoord="${uitkomst}"></span><span class="gl-maal">:</span>
        <span class="gl-lijn" data-antwoord="${stap}"></span><span class="gl-eq">=</span>
        <span class="gl-lijn" data-antwoord="${groepen}"></span>
      </div>`;

  } else if (variant === 'delen-zelf') {
    // Boogjes onder de lijn toevoegen (verborgen, tonen bij oplossing)
    for (let g = 0; g < groepen; g++) {
      const x1 = middenVanGetal(uitkomst - g * stap);
      const x2 = middenVanGetal(uitkomst - (g + 1) * stap);
      const midX = (x1 + x2) / 2;
      const boogBasisY = asY + 2;
      const ctrlLift = 18;
      const ctrlY = boogBasisY + ctrlLift;
      svgInhoud += `<path class="gl-boog-oplossing" d="M ${x1} ${boogBasisY} C ${x1 + (x2-x1)*0.22} ${ctrlY}, ${x1 + (x2-x1)*0.78} ${ctrlY}, ${x2} ${boogBasisY}" stroke="#1565C0" stroke-width="1.6" fill="none" opacity="0"/>`;
      svgInhoud += `<text class="gl-boog-oplossing" x="${midX}" y="${ctrlY + 12}" text-anchor="middle" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="#1565C0" opacity="0">${stap}</text>`;
    }
    // Aftrekrij met stap ingevuld — kind tekent sprongen en vult deelsom zelf in
    const minStrepen = Array(groepen)
      .fill(`<span class="gl-getal-vast" style="color:#1565C0">${stap}</span>`)
      .join(`<span class="gl-min">−</span>`);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${uitkomst}</span>
        <span class="gl-min">−</span>${minStrepen}
        <span class="gl-eq">=</span><span class="gl-lijn" data-antwoord="0"></span>
      </div>
      <div class="gl-formule-rij">
        <span class="gl-lijn" data-antwoord="${uitkomst}"></span><span class="gl-maal">:</span>
        <span class="gl-lijn" data-antwoord="${stap}"></span><span class="gl-eq">=</span>
        <span class="gl-lijn" data-antwoord="${groepen}"></span>
      </div>`;

  } else if (variant === 'delen-rest-getekend') {
    const minStrepen = Array(groepen).fill(`<span class="gl-lijn" data-antwoord="${stap}"></span>`).join(`<span class="gl-min">−</span>`);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${uitkomst}</span>
        <span class="gl-min">−</span>${minStrepen}
        <span class="gl-eq">=</span><span class="gl-lijn" data-antwoord="${rest}"></span>
      </div>
      <div class="gl-zin">
        <span>Ik kan</span><span class="gl-lijn kort" data-antwoord="${groepen}"></span>
        <span>sprongen van</span>
        <span class="gl-getal-vast" style="color:#1565C0">${stap}</span>
        <span>maken. Dan heb ik nog</span><span class="gl-lijn kort" data-antwoord="${rest}"></span><span>over.</span>
      </div>
      <div class="gl-formule-rij">
        <span class="gl-lijn" data-antwoord="${uitkomst}"></span><span class="gl-maal">:</span>
        <span class="gl-lijn" data-antwoord="${stap}"></span><span class="gl-eq">=</span>
        <span class="gl-lijn" data-antwoord="${groepen}"></span>
        <span class="gl-getal-vast">R</span>
        <span class="gl-lijn" data-antwoord="${rest}"></span>
      </div>`;

  } else if (variant === 'delen-rest-zelf') {
    // Boogjes onder de lijn toevoegen (verborgen, tonen bij oplossing)
    for (let g = 0; g < groepen; g++) {
      const x1 = middenVanGetal(uitkomst - g * stap);
      const x2 = middenVanGetal(uitkomst - (g + 1) * stap);
      const midX = (x1 + x2) / 2;
      const boogBasisY = asY + 2;
      const ctrlLift = 18;
      const ctrlY = boogBasisY + ctrlLift;
      svgInhoud += `<path class="gl-boog-oplossing" d="M ${x1} ${boogBasisY} C ${x1 + (x2-x1)*0.22} ${ctrlY}, ${x1 + (x2-x1)*0.78} ${ctrlY}, ${x2} ${boogBasisY}" stroke="#1565C0" stroke-width="1.6" fill="none" opacity="0"/>`;
      svgInhoud += `<text class="gl-boog-oplossing" x="${midX}" y="${ctrlY + 12}" text-anchor="middle" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="#1565C0" opacity="0">${stap}</text>`;
    }
    const minStrepen = Array(groepen)
      .fill(`<span class="gl-getal-vast" style="color:#1565C0">${stap}</span>`)
      .join(`<span class="gl-min">−</span>`);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${uitkomst}</span>
        <span class="gl-min">−</span>${minStrepen}
        <span class="gl-eq">=</span><span class="gl-lijn" data-antwoord="${rest}"></span>
      </div>
      <div class="gl-zin">
        <span>Ik kan</span><span class="gl-lijn kort" data-antwoord="${groepen}"></span>
        <span>sprongen van</span>
        <span class="gl-getal-vast" style="color:#1565C0">${stap}</span>
        <span>maken. Dan heb ik nog</span><span class="gl-lijn kort" data-antwoord="${rest}"></span><span>over.</span>
      </div>
      <div class="gl-formule-rij">
        <span class="gl-lijn" data-antwoord="${uitkomst}"></span><span class="gl-maal">:</span>
        <span class="gl-lijn" data-antwoord="${stap}"></span><span class="gl-eq">=</span>
        <span class="gl-lijn" data-antwoord="${groepen}"></span>
        <span class="gl-getal-vast">R</span>
        <span class="gl-lijn" data-antwoord="${rest}"></span>
      </div>`;

  } else {
    // vermenigvuldigen zelf tekenen - voeg boogjes toe aan SVG (verborgen, tonen bij oplossing)
    for (let g = 0; g < groepen; g++) {
      const x1 = middenVanGetal(g * stap);
      const x2 = middenVanGetal((g + 1) * stap);
      const midX = (x1 + x2) / 2;
      const boogY = vakjeY - 2;
      const ctrlLift = 18;
      const ctrlY = boogY - ctrlLift;
      svgInhoud += `<path class="gl-boog-oplossing" d="M ${x1} ${boogY} C ${x1 + (x2-x1)*0.22} ${ctrlY}, ${x1 + (x2-x1)*0.78} ${ctrlY}, ${x2} ${boogY}" stroke="#444444" stroke-width="1.6" fill="none" opacity="0"/>`;
      svgInhoud += `<text class="gl-boog-oplossing" x="${midX}" y="${ctrlY - 4}" text-anchor="middle" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="#333333" opacity="0">${stap}</text>`;
    }
    const factor1 = positie === 'achteraan' ? groepen : stap;
    const factor2 = positie === 'achteraan' ? stap : groepen;
    const plusSlots = Math.max(groepen, 5);
    const langeLijnPx = Math.min(220, 110 + plusSlots * 18);
    // Maalsom: factor1 x factor2 = lange lijn (kind schrijft herhaalde optelling) = uitkomst
    const langeLijnPxGroter = Math.min(300, 60 + groepen * 30);
    inhoudOnderaan = `
      <div class="gl-formule-rij">
        <span class="gl-getal-vast">${factor1}</span>
        <span class="gl-maal">×</span>
        <span class="gl-getal-vast">${factor2}</span>
        <span class="gl-eq">=</span>
        <span class="gl-lijn breed" data-antwoord="${Array(groepen).fill(stap).join(' + ')} = ${uitkomst}" style="width:${langeLijnPxGroter}px"></span>
        <span class="gl-eq">=</span>
        <span class="gl-lijn breed" data-antwoord="${uitkomst}" style="width:34px"></span>
      </div>`;
  }

  // SVG hoogte aanpassen: bogen onder de lijn hebben extra ruimte nodig
  const svgHAangepast = isBogenOnder ? svgH : svgH;

  return `
    <div class="gl-oefening">
      <button class="btn-del-oef" onclick="App.verwijderOefening('${blokId}',${idx})" title="Verwijder">✕</button>
      <div class="gl-svg-wrapper">
        <svg width="${totaalW}" height="${svgHAangepast}" viewBox="0 0 ${totaalW} ${svgHAangepast}">${svgInhoud}</svg>
      </div>
      <div class="gl-formules">${inhoudOnderaan}</div>
    </div>`;
}

  /* ── Kommaschema HTML (E,t cijferen) ───────────────────────── */
  function _kommaOefHTML(blok, oef, idx) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';

    const g1E = ingevuld ? esc(String(oef.g1E))  : '';
    const g1t = ingevuld ? esc(String(oef.g1t_)) : '';
    const g2E = ingevuld ? esc(String(oef.g2E))  : '';
    const g2t = ingevuld ? esc(String(oef.g2t_)) : '';

    const op     = esc(oef.operator);
    const g1Str  = esc(oef.g1Str);
    const g2Str  = esc(oef.g2Str);

    // Bereken antwoord per kolom
    const _isMin = oef.operator === '−' || oef.operator === '-';
    const _g1v = parseFloat((oef.g1Str||'0').replace(',','.')) || 0;
    const _g2v = parseFloat((oef.g2Str||'0').replace(',','.')) || 0;
    const _antv = _isMin ? _g1v - _g2v : _g1v + _g2v;
    const _antStr = Math.abs(_antv).toFixed(1).replace('.',',');
    const _antParts = _antStr.split(',');
    const _antGeh = parseInt(_antParts[0]) || 0;
    const _antTiend = parseInt(_antParts[1]) || 0;
    const _antE2 = _antGeh % 10;
    const _antT2 = Math.floor(_antGeh / 10) % 10;

    // Onthoud berekenen voor kommagetallen
    const _kt1 = Number(oef.g1t_) || 0;  // tienden van g1
    const _kt2 = Number(oef.g2t_) || 0;  // tienden van g2
    const _ke1 = typeof oef.g1E === 'number' ? oef.g1E % 10 : (Number(oef.g1E) || 0);
    const _ke2 = typeof oef.g2E === 'number' ? oef.g2E % 10 : (Number(oef.g2E) || 0);
    // Optellen: tienden optellen >= 10 → onthoud 1 naar E-kolom
    const _kOnthoudE = !_isMin && (_kt1 + _kt2 >= 10) ? '1' : '';
    const _kNieuwE   = !_isMin && (_kt1 + _kt2 >= 10) ? '' : '';
    // Aftrekken: tienden t1 < t2 → leen van E: toon 10 in t-kolom, E1-1 in E-onthoud
    const _kLeenT    = _isMin && (_kt1 < _kt2) ? 1 : 0;
    const _kOnthoudT = _kLeenT ? '10' : '';
    const _kOnthoudEAf = _kLeenT ? String(_ke1 - 1) : '';
    const startpijl = cfg.startpijl !== false;

    // Schema kolommen: T(groen) | E(geel) | komma(grijs smal) | t(lichtgeel)
    const hdrT    = '<td class="cij-hdr cij-tien">T</td>';
    const hdrE    = '<td class="cij-hdr cij-een">E</td>';
    const hdrKomma= '<td class="komma-kolom komma-hdr">,</td>';
    const hdrT2   = '<td class="cij-hdr komma-tien">t</td>';
    const leeg    = '<td class="cij-getal"></td>';
    const leegK   = '<td class="komma-kolom"></td>';

    function rij(tVal, eVal, tachtVal) {
      return '<tr>' +
        '<td class="cij-getal">' + tVal + '</td>' +
        '<td class="cij-getal">' + eVal + '</td>' +
        '<td class="komma-kolom komma-dot">,</td>' +
        '<td class="cij-getal">' + tachtVal + '</td>' +
      '</tr>';
    }

    const pijlHTML = startpijl
      ? '<div class="cij-startpijl"></div>'
      : '';

    return (
      '<div class="cij-oefening">' +
        '<button class="btn-del-oef" onclick="App.verwijderOefening(\'' + blok.id + '\',' + idx + ')" title="Verwijder">&#x2715;</button>' +
        '<div class="cij-vraag">' + g1Str + ' ' + op + ' ' + g2Str + ' =</div>' +
        '<div class="cij-schema-wrap">' +
          (oef.operator === '+' || oef.operator === '−'
            ? '<span class="cij-operator">' + op + '</span>' : '') +
          pijlHTML +
          '<table class="cij-schema komma-schema">' +
            '<thead><tr>' + hdrT + hdrE + hdrKomma + hdrT2 + '</tr></thead>' +
            '<tbody>' +
              '<tr>' +
                '<td class="komma-onthoud" data-antwoord=""></td>' +
                '<td class="komma-onthoud" data-antwoord="' + (_isMin ? _kOnthoudEAf : _kOnthoudE) + '"></td>' +
                '<td class="komma-onthoud komma-kolom" data-antwoord=""></td>' +
                '<td class="komma-onthoud" data-antwoord="' + _kOnthoudT + '"></td>' +
              '</tr>' +
              rij('', g1E, g1t) +
              rij('', g2E, g2t) +
              '<tr>' +
                '<td class="cij-oplossing" data-antwoord="' + (_antT2 || '') + '"></td>' +
                '<td class="cij-oplossing" data-antwoord="' + _antE2 + '"></td>' +
                '<td class="komma-kolom komma-dot">,</td>' +
                '<td class="cij-oplossing" data-antwoord="' + _antTiend + '"></td>' +
              '</tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>'
    );
  }

  /* ── Deelschema HTML (staartdeling TE÷E of HTE÷E) ─────────── */
  function _deelOefHTML(blok, oef, idx) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';
    const isHTE    = (oef.deelType === 'HTE:E') || (cfg.deelType === 'HTE:E');
    const delerTxt = esc(String(oef.deler));
    const metRest  = oef.restE > 0;
    const deeltal  = esc(String(oef.deeltal));

    // Vraag bovenaan: bij met rest ook "R = ___" tonen (met data-antwoord voor toggle)
    const vraagHTML = metRest
      ? '<div class="deel-vraag">' + deeltal + ' : ' + delerTxt +
        ' = <span class="deel-lijn-antw" data-antwoord="' + esc(String(oef.quotiënt)) + '"></span>' +
        ' R <span class="deel-lijn-antw" data-antwoord="' + esc(String(oef.restE)) + '"></span></div>'
      : '<div class="deel-vraag">' + deeltal + ' : ' + delerTxt +
        ' = <span class="deel-lijn-antw" data-antwoord="' + esc(String(oef.quotiënt)) + '"></span></div>';

    // Headers
    const hdrH = '<td class="deel-hdr deel-H">H</td>';
    const hdrT = '<td class="deel-hdr deel-T">T</td>';
    const hdrE = '<td class="deel-hdr deel-E">E</td>';
    const leeg = '<td class="deel-cel"></td>';
    const min  = '<td class="deel-cel deel-min"></td>';

    // Helper: cel met data-antwoord (voor toggle oplossing) of met vaste waarde (bij ingevuld)
    function antCel(waarde, extraKlasse = '') {
      const w = (waarde === '' || waarde === undefined || waarde === null) ? '' : String(waarde);
      return '<td class="deel-cel ' + extraKlasse + '" data-antwoord="' + esc(w) + '"></td>';
    }
    // Ingevulde cel (zonder toggle) — gebruikt bij rij 1 (deeltal) als invulling = 'ingevuld'
    function vasteCel(waarde) {
      return '<td class="deel-cel">' + esc(String(waarde ?? '')) + '</td>';
    }

    let schemaLinks;
    if (isHTE) {
      // ── HTE ÷ E ──
      // We hebben 2 scenario's afhankelijk van oef.toonBoog:
      //  A) toonBoog = false (H ≥ deler): quotient 3-cijferig, 3 aftrek-stappen → 7 datarijen
      //     Rij 1: deeltal           H T E
      //     Rij 2: aftrekH           (onder H) + min, dikke lijn eronder
      //     Rij 3: restH + T         (restH in H, T in T-kolom — dalend)
      //     Rij 4: aftrekT           + min, dikke lijn eronder
      //     Rij 5: restT + E         (restT in T, E dalend)
      //     Rij 6: aftrekE           + min, dikke lijn eronder
      //     Rij 7: eindrest          (in E)
      //  B) toonBoog = true (H < deler): quotient 2-cijferig, 2 aftrek-stappen → 5 datarijen
      //     We gebruiken dezelfde 7-rij layout voor consistente hoogte, maar
      //     laten rij 2 en 3 leeg; het eigenlijke schema zit in rij 4-7 en de
      //     boog staat boven rij 1 (H+T).

      const rij1H = ingevuld ? vasteCel(oef.H) : leeg;
      const rij1T = ingevuld ? vasteCel(oef.T) : leeg;
      const rij1E = ingevuld ? vasteCel(oef.E) : leeg;

      // Rechtse uitlijning per aftrek
      const aH_H = oef.aftrekH >= 10 ? Math.floor(oef.aftrekH/10) : oef.aftrekH;
      const aH_T = oef.aftrekH >= 10 ? (oef.aftrekH % 10) : '';
      const aT_H = oef.aftrekT >= 10 ? Math.floor(oef.aftrekT/10) : '';
      const aT_T = oef.aftrekT % 10;
      const aE_T = oef.aftrekE >= 10 ? Math.floor(oef.aftrekE/10) : '';
      const aE_E = oef.aftrekE % 10;

      // Voorbereid HTML-fragmenten per rij
      let rij2, rij3, rij4, rij5, rij6, rij7;

      if (oef.toonBoog) {
        // Scenario B: aftrek direct onder H+T (rij 2), dan restT+E op rij 3, etc.
        // Rij 6 en 7 blijven leeg.
        // Rij 2: aftrek1 onder H+T — dikke lijn eronder + min
        rij2 = '<tr class="deel-aftrek-onder">' +
                 '<td class="deel-cel deel-min" data-antwoord="' + esc(String(aT_H)) + '"></td>' +
                 '<td class="deel-cel" data-antwoord="' + esc(String(aT_T)) + '"></td>' +
                 '<td class="deel-cel"></td>' +
               '</tr>';
        // Rij 3: restT (in T) + E naar beneden
        rij3 = '<tr>' +
                 '<td class="deel-cel"></td>' +
                 '<td class="deel-cel" data-antwoord="' + (oef.restT === 0 ? '' : esc(String(oef.restT))) + '"></td>' +
                 '<td class="deel-cel deel-dalend" data-antwoord="' + esc(String(oef.E)) + '"></td>' +
               '</tr>';
        // Rij 4: aftrek2 (aftrekE op E)
        rij4 = '<tr class="deel-aftrek-onder">' +
                 '<td class="deel-cel"></td>' +
                 '<td class="deel-cel deel-min" data-antwoord="' + esc(String(aE_T)) + '"></td>' +
                 '<td class="deel-cel" data-antwoord="' + esc(String(aE_E)) + '"></td>' +
               '</tr>';
        // Rij 5: eindrest in E-kolom
        rij5 = '<tr><td class="deel-cel"></td><td class="deel-cel"></td>' +
                 '<td class="deel-cel" data-antwoord="' + esc(String(oef.restE)) + '"></td>' +
               '</tr>';
        // Rij 6, 7: leeg
        rij6 = '<tr><td class="deel-cel"></td><td class="deel-cel"></td><td class="deel-cel"></td></tr>';
        rij7 = '<tr><td class="deel-cel"></td><td class="deel-cel"></td><td class="deel-cel"></td></tr>';
      } else {
        // Scenario A: volledige 3 aftrek-stappen
        // Rij 2: aftrekH onder H
        rij2 = '<tr class="deel-aftrek-onder">' +
                 '<td class="deel-cel deel-min" data-antwoord="' + esc(String(aH_H)) + '"></td>' +
                 '<td class="deel-cel" data-antwoord="' + esc(String(aH_T)) + '"></td>' +
                 '<td class="deel-cel"></td>' +
               '</tr>';
        // Rij 3: restH (in H) + T dalend
        rij3 = '<tr>' +
                 '<td class="deel-cel" data-antwoord="' + (oef.restH === 0 ? '' : esc(String(oef.restH))) + '"></td>' +
                 '<td class="deel-cel deel-dalend" data-antwoord="' + esc(String(oef.T)) + '"></td>' +
                 '<td class="deel-cel"></td>' +
               '</tr>';
        // Rij 4: aftrekT uitgelijnd op T
        rij4 = '<tr class="deel-aftrek-onder">' +
                 '<td class="deel-cel" data-antwoord="' + esc(String(aT_H)) + '"></td>' +
                 '<td class="deel-cel deel-min" data-antwoord="' + esc(String(aT_T)) + '"></td>' +
                 '<td class="deel-cel"></td>' +
               '</tr>';
        // Rij 5: restT (in T) + E dalend
        rij5 = '<tr>' +
                 '<td class="deel-cel"></td>' +
                 '<td class="deel-cel" data-antwoord="' + (oef.restT === 0 ? '' : esc(String(oef.restT))) + '"></td>' +
                 '<td class="deel-cel deel-dalend" data-antwoord="' + esc(String(oef.E)) + '"></td>' +
               '</tr>';
        // Rij 6: aftrekE op E
        rij6 = '<tr class="deel-aftrek-onder">' +
                 '<td class="deel-cel"></td>' +
                 '<td class="deel-cel deel-min" data-antwoord="' + esc(String(aE_T)) + '"></td>' +
                 '<td class="deel-cel" data-antwoord="' + esc(String(aE_E)) + '"></td>' +
               '</tr>';
        // Rij 7: eindrest
        rij7 = '<tr><td class="deel-cel"></td><td class="deel-cel"></td>' +
                 '<td class="deel-cel" data-antwoord="' + esc(String(oef.restE)) + '"></td>' +
               '</tr>';
      }

      // Boogje boven deeltal (alleen bij scenario B)
      const boogHTML = oef.toonBoog
        ? '<div class="deel-boog deel-boog-HT"></div>'
        : '';

      schemaLinks = (
        '<div class="deel-links">' +
          boogHTML +
          '<table class="deel-tabel">' +
            '<thead><tr>' + hdrH + hdrT + hdrE + '</tr></thead>' +
            '<tbody>' +
              '<tr>' + rij1H + rij1T + rij1E + '</tr>' +
              rij2 + rij3 + rij4 + rij5 + rij6 + rij7 +
            '</tbody>' +
          '</table>' +
        '</div>'
      );

    } else {
      // ── TE ÷ E: 2 kolommen, 5 datarijen ──
      //   rij 1: deeltal
      //   rij 2: aftrek1 onder T, dikke lijn ERONDER + min
      //   rij 3: restT + E naar beneden (stippel)
      //   rij 4: aftrek2, dikke lijn ERONDER + min
      //   rij 5: eindrest
      const rij1T = ingevuld ? vasteCel(oef.T) : leeg;
      const rij1E = ingevuld ? vasteCel(oef.E) : leeg;

      const aT_T = oef.aftrekT % 10;
      const aE_T = oef.aftrekE >= 10 ? Math.floor(oef.aftrekE/10) : '';
      const aE_E = oef.aftrekE % 10;

      schemaLinks = (
        '<div class="deel-links">' +
          '<table class="deel-tabel">' +
            '<thead><tr>' + hdrT + hdrE + '</tr></thead>' +
            '<tbody>' +
              '<tr>' + rij1T + rij1E + '</tr>' +
              // Rij 2: aftrekT met dikke onderlijn + min
              '<tr class="deel-aftrek-onder">' +
                '<td class="deel-cel deel-min" data-antwoord="' + esc(String(aT_T)) + '"></td>' +
                '<td class="deel-cel"></td>' +
              '</tr>' +
              // Rij 3: restT in T + E naar beneden (dalend)
              '<tr>' +
                '<td class="deel-cel" data-antwoord="' + (oef.restT === 0 ? '' : esc(String(oef.restT))) + '"></td>' +
                '<td class="deel-cel deel-dalend" data-antwoord="' + esc(String(oef.E)) + '"></td>' +
              '</tr>' +
              // Rij 4: aftrekE met dikke onderlijn + min
              '<tr class="deel-aftrek-onder">' +
                '<td class="deel-cel deel-min" data-antwoord="' + esc(String(aE_T)) + '"></td>' +
                '<td class="deel-cel" data-antwoord="' + esc(String(aE_E)) + '"></td>' +
              '</tr>' +
              // Rij 5: eindrest in E
              '<tr>' +
                '<td class="deel-cel"></td>' +
                '<td class="deel-cel" data-antwoord="' + esc(String(oef.restE)) + '"></td>' +
              '</tr>' +
            '</tbody>' +
          '</table>' +
        '</div>'
      );
    }

    // Rechts: quotient-schema.
    // TE÷E → 2 kolommen (T E), HTE÷E → 3 kolommen (H T E).
    // Bij ingevuld staat de deler op de schrijflijn bovenaan. In de T/E-cellen
    // (of H/T/E bij HTE) staan de cijfers van het quotient — maar alleen bij
    // "toon oplossingen"-toggle, dus via data-antwoord.
    const schrijfInhoud = ingevuld ? delerTxt : '';
    let quotSchemaInhoud;
    if (isHTE) {
      const qH = Math.floor(oef.quotiënt / 100);
      const qT = Math.floor((oef.quotiënt % 100) / 10);
      const qE = oef.quotiënt % 10;
      quotSchemaInhoud =
        '<thead><tr>' + hdrH + hdrT + hdrE + '</tr></thead>' +
        '<tbody><tr>' +
          antCel(qH === 0 ? '' : qH) +
          antCel(qT === 0 && qH === 0 ? '' : qT) +
          antCel(qE) +
        '</tr></tbody>';
    } else {
      const qT = Math.floor(oef.quotiënt / 10);
      const qE = oef.quotiënt % 10;
      quotSchemaInhoud =
        '<thead><tr>' + hdrT + hdrE + '</tr></thead>' +
        '<tbody><tr>' +
          antCel(qT === 0 ? '' : qT) +
          antCel(qE) +
        '</tr></tbody>';
    }
    const quotSchema = (
      '<div class="deel-rechts">' +
        '<div class="deel-schrijflijn"><span class="deel-deler-val">' + schrijfInhoud + '</span></div>' +
        '<table class="deel-tabel">' + quotSchemaInhoud + '</table>' +
      '</div>'
    );

    return (
      '<div class="deel-oefening' + (isHTE ? ' deel-hte' : '') + '">' +
        '<button class="btn-del-oef" onclick="App.verwijderOefening(\'' + blok.id + '\',' + idx + ')" title="Verwijder">&#x2715;</button>' +
        vraagHTML +
        '<div class="deel-schema-wrap">' +
          schemaLinks +
          quotSchema +
        '</div>' +
      '</div>'
    );
  }

  /* ── Cijferschema HTML ────────────────────────────────────── */
  function _cijferenOefHTML(blok, oef, idx) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';
    const metPijl  = cfg.startpijl !== false;
    const metSchat = cfg.schatting === true;
    const showD    = oef.showD;
    const showH    = oef.showH || showD;
    const op       = oef.operator;

    const vraag = `${oef.g1} ${op} ${oef.g2} = ?`;

    const schattingHTML = metSchat ? `
      <div class="cij-schatting-vak">
        <span class="cij-schat-label">Ik schat:</span>
        <span class="cij-schat-lijn"></span>
      </div>` : '';

    const pijlHTML = metPijl ? `<div class="cij-startpijl"></div>` : '';

    const hCelD = showD ? `<td class="cij-header cij-duizend">D</td>` : '';
    const hCelH = showH ? `<td class="cij-header cij-honderd">H</td>` : '';
    const hCelT = `<td class="cij-header cij-tien">T</td>`;
    const hCelE = `<td class="cij-header cij-een">E${pijlHTML}</td>`;

    // Bereken onthoudgetallen voor brug (optellen én aftrekken)
    const _e1 = Number(oef.E1) || 0, _e2 = Number(oef.E2) || 0;
    const _t1 = Number(oef.T1) || 0, _t2 = Number(oef.T2) || 0;
    const _h1 = Number(oef.H1) || 0, _h2 = Number(oef.H2) || 0;
    const _d1 = Number(oef.D1) || 0, _d2 = Number(oef.D2) || 0;
    const _opStr = String(oef.operator||'');
    const _isAftrekken = _opStr.includes('-') || _opStr === '−';
    const _isOptellen = _opStr === '+';
    const _isVermenig = _opStr === '×' || _opStr === '*' || _opStr === 'x';

    /* ── Voorloopnul-helpers ─────────────────────────────────
       Als g1 bv. 53 is en het schema H-T-E toont, dan mogen de
       voorloopnullen (H1="0") NIET getoond worden. We bepalen per
       getal de hoogste kolom waarin er echt een cijfer staat. */
    const _g1Num = Number(oef.g1) || 0;
    const _g2Num = Number(oef.g2) || 0;
    function _hoogsteKolom(n) {
      // Geeft 'E', 'T', 'H' of 'D' terug op basis van grootte van n
      if (n >= 1000) return 'D';
      if (n >= 100)  return 'H';
      if (n >= 10)   return 'T';
      return 'E';
    }
    const _g1Hoog = _hoogsteKolom(_g1Num);
    const _g2Hoog = _hoogsteKolom(_g2Num);
    const _rang = { E:0, T:1, H:2, D:3 };
    // toon(kol, hoog) = true als kolom binnen het werkelijke getal valt
    function _toonCijfer(kol, hoog) {
      return _rang[kol] <= _rang[hoog];
    }
    // Geeft de cijferwaarde terug óf een lege string als voorloopnul
    function _cijferWaarde(oefWaarde, kol, hoog) {
      if (!_toonCijfer(kol, hoog)) return '';
      return oefWaarde == null ? '' : String(oefWaarde);
    }
    // Bij aftrekken kan een cel "geleend" hebben -> tonen ook als hoog het niet "doet"
    function _cijferDataAntwoord(oefWaarde, kol, hoog, forceTonen = false) {
      if (!forceTonen && !_toonCijfer(kol, hoog)) return '';
      return oefWaarde == null ? '' : String(oefWaarde);
    }

    // OPTELLEN: onthoud 1 naar hogere kolom als som >= 10
    const _onthoudT_opt = _isOptellen && (_e1 + _e2 >= 10) ? 1 : 0;
    const _onthoudH_opt = _isOptellen && (_t1 + _t2 + _onthoudT_opt >= 10) ? 1 : 0;
    const _onthoudD_opt = _isOptellen && (_h1 + _h2 + _onthoudH_opt >= 10) ? 1 : 0;

    // VERMENIGVULDIGEN (éénvoudige variant: 2- of 3-cijferig × 1-cijferig).
    // Bij g2 met meerdere cijfers blijven de onthoudkaders leeg (té complex
    // voor dit schema, zou twee tussenproducten vergen).
    let _onthoudT_mul = 0, _onthoudH_mul = 0, _onthoudD_mul = 0;
    if (_isVermenig && _g2Num >= 1 && _g2Num <= 9 && _g1Num >= 10) {
      // g2 is 1-cijferig → vermenigvuldiging kolom per kolom
      const _vE = _g1Num % 10;
      const _vT = Math.floor(_g1Num / 10) % 10;
      const _vH = Math.floor(_g1Num / 100) % 10;
      // E × g2
      const _prodE = _vE * _g2Num;
      _onthoudT_mul = Math.floor(_prodE / 10);       // carry naar T
      // T × g2 + carry
      const _prodT = _vT * _g2Num + _onthoudT_mul;
      _onthoudH_mul = Math.floor(_prodT / 10);       // carry naar H
      // H × g2 + carry
      const _prodH = _vH * _g2Num + _onthoudH_mul;
      _onthoudD_mul = Math.floor(_prodH / 10);       // carry naar D
    }

    // AFTREKKEN: lenen van hogere kolom als bovengetal < ondergetal
    // E-kolom: als E1 < E2 → leen van T: toon 10 in onthoud-E, T1-1 in onthoud-T
    // T-kolom: als (T1 - _leenT) < T2 → leen van H: toon 10 in onthoud-T (als T ook leende)
    const _leenE = _isAftrekken && (_e1 < _e2) ? 1 : 0;          // leent E van T
    const _t1eff = _t1 - _leenE;                                   // effectieve T1 na lenen
    const _leenT = _isAftrekken && (_t1eff < _t2) ? 1 : 0;        // leent T van H
    const _h1eff = _h1 - _leenT;
    const _leenH = _isAftrekken && (_h1eff < _h2) ? 1 : 0;        // leent H van D


    // Onthoud-cellen: gebruik data-antwoord voor toggle
    // Cel met 1 getal: data-antwoord="X"
    // Cel met 2 gestapelde getallen: data-antwoord="10" + data-antwoord2="X" via twee spans

    function _oCel(klasse, boven, onder) {
      // boven = bovenste getal (of leeg), onder = onderste getal (of leeg)
      if (!boven && !onder) return `<td class="${klasse}" data-antwoord=""></td>`;
      if (boven && onder) {
        // Gestapeld: data-gestapeld attribuut zodat toggle weet wat te doen
        return `<td class="${klasse}" data-antwoord="${boven}" data-gestapeld="${onder}"><span class="cij-onth-boven">${boven}</span><span class="cij-onth-onder">${onder}</span></td>`;
      }
      return `<td class="${klasse}" data-antwoord="${boven || onder}"></td>`;
    }

    // E-kolom: 10 als E leende van T
    const oCelE_af = _oCel("cij-onthoud cij-een", _leenE ? "10" : "", "");

    // T-kolom:
    const _tBoven = _leenT ? "10" : "";
    const _tOnder = (_leenE && (_t1 - 1) !== 0) ? String(_t1 - 1) : "";
    const oCelT_af = _oCel("cij-onthoud cij-tien", _tBoven || _tOnder, _tBoven ? _tOnder : "");

    // H-kolom:
    const _hBoven = _leenH ? "10" : "";
    const _hOnder = (_leenT && (_h1 - 1) !== 0) ? String(_h1 - 1) : "";
    const oCelH_af = _oCel("cij-onthoud cij-honderd", _hBoven || _hOnder, _hBoven ? _hOnder : "");

    // D-kolom: enkel verminderd als H leende
    const oCelD_af = _oCel("cij-onthoud cij-duizend", _leenH ? String(_d1 - 1) : "", "");


    const oCelD = showD ? (
      _isAftrekken ? oCelD_af
      : _isVermenig ? (_onthoudD_mul ? `<td class="cij-onthoud cij-duizend" data-antwoord="${_onthoudD_mul}"></td>` : `<td class="cij-onthoud cij-duizend"></td>`)
      : (_onthoudD_opt ? `<td class="cij-onthoud cij-duizend" data-antwoord="1"></td>` : `<td class="cij-onthoud cij-duizend"></td>`)
    ) : '';
    const oCelH = showH ? (
      _isAftrekken ? oCelH_af
      : _isVermenig ? (_onthoudH_mul ? `<td class="cij-onthoud cij-honderd" data-antwoord="${_onthoudH_mul}"></td>` : `<td class="cij-onthoud cij-honderd"></td>`)
      : (_onthoudH_opt ? `<td class="cij-onthoud cij-honderd" data-antwoord="1"></td>` : `<td class="cij-onthoud cij-honderd"></td>`)
    ) : '';
    const oCelT = (
      _isAftrekken ? oCelT_af
      : _isVermenig ? (_onthoudT_mul ? `<td class="cij-onthoud cij-tien" data-antwoord="${_onthoudT_mul}"></td>` : `<td class="cij-onthoud cij-tien"></td>`)
      : (_onthoudT_opt ? `<td class="cij-onthoud cij-tien" data-antwoord="1"></td>` : `<td class="cij-onthoud cij-tien"></td>`)
    );
    const oCelE = _isAftrekken ? oCelE_af : `<td class="cij-onthoud cij-een"></td>`;

    // ── g1 cellen ── (met voorloopnul-filter) ──────────────────
    // Bij aftrekken: forceer "data-antwoord" voor de oorspronkelijke waarde
    // als er geleend wordt, zodat de toggle het echte getal toont.
    const g1D = showD
      ? (_isAftrekken && _leenH
          ? `<td class="cij-getal" data-antwoord="${_cijferDataAntwoord(_d1, 'D', _g1Hoog, true)}">${ingevuld ? esc(_cijferWaarde(oef.D1, 'D', _g1Hoog)) : ''}</td>`
          : `<td class="cij-getal">${ingevuld ? esc(_cijferWaarde(oef.D1, 'D', _g1Hoog)) : ''}</td>`)
      : '';
    const g1H = showH
      ? (_isAftrekken && _leenT
          ? `<td class="cij-getal" data-antwoord="${_cijferDataAntwoord(_h1, 'H', _g1Hoog, true)}">${ingevuld ? esc(_cijferWaarde(oef.H1, 'H', _g1Hoog)) : ''}</td>`
          : `<td class="cij-getal">${ingevuld ? esc(_cijferWaarde(oef.H1, 'H', _g1Hoog)) : ''}</td>`)
      : '';
    const g1T = (_isAftrekken && _leenE
      ? `<td class="cij-getal" data-antwoord="${_cijferDataAntwoord(_t1, 'T', _g1Hoog, true)}">${ingevuld ? esc(_cijferWaarde(oef.T1, 'T', _g1Hoog)) : ''}</td>`
      : `<td class="cij-getal">${ingevuld ? esc(_cijferWaarde(oef.T1, 'T', _g1Hoog)) : ''}</td>`);
    const g1E = `<td class="cij-getal">${ingevuld ? esc(_cijferWaarde(oef.E1, 'E', _g1Hoog)) : ''}</td>`;

    // ── g2 cellen ── (met voorloopnul-filter) ──────────────────
    const g2D = showD ? `<td class="cij-getal">${ingevuld ? esc(_cijferWaarde(oef.D2, 'D', _g2Hoog)) : ''}</td>` : '';
    const g2H = showH ? `<td class="cij-getal">${ingevuld ? esc(_cijferWaarde(oef.H2, 'H', _g2Hoog)) : ''}</td>` : '';
    const g2T = `<td class="cij-getal">${ingevuld ? esc(_cijferWaarde(oef.T2, 'T', _g2Hoog)) : ''}</td>`;
    const g2E = `<td class="cij-getal">${ingevuld ? esc(_cijferWaarde(oef.E2, 'E', _g2Hoog)) : ''}</td>`;


    // Antwoord per kolom
    const _g1 = Number(oef.g1) || 0;
    const _g2 = Number(oef.g2) || 0;
    let _antE, _antT, _antH, _antD;
    if (_isVermenig) {
      // Vermenigvuldigen: bereken zélf het echte product (module-velden zijn
      // vaak gebaseerd op optellogica en dus onbetrouwbaar voor ×).
      const _prod = _g1 * _g2;
      _antE = String(_prod % 10);
      _antT = String(Math.floor((_prod / 10) % 10));
      _antH = String(Math.floor((_prod / 100) % 10));
      _antD = Math.floor(_prod / 1000) ? String(Math.floor(_prod / 1000)) : '';
    } else if (oef.antE !== undefined && oef.antE !== '') {
      // Gebruik velden van Cijferen module (opt/aft)
      _antE = String(oef.antE); _antT = String(oef.antT||'');
      _antH = String(oef.antH||''); _antD = String(oef.antD||'');
    } else if (_isAftrekken) {
      // Aftrekken met eventueel lenen
      _antE = String((_e1 + _leenE * 10) - _e2);
      _antT = String((_t1 - _leenE + _leenT * 10) - _t2);
      _antH = String((_h1 - _leenT + _leenH * 10) - _h2);
      _antD = String((_d1 - _leenH) - _d2) !== '0' || showD ? String((_d1 - _leenH) - _d2) : '';
    } else {
      // Optellen
      const _antw = _g1 + _g2;
      _antE = String(_antw % 10);
      _antT = String(Math.floor((_antw / 10) % 10));
      _antH = String(Math.floor((_antw / 100) % 10));
      _antD = Math.floor(_antw / 1000) ? String(Math.floor(_antw / 1000)) : '';
    }
    // Voorloopnullen weghalen uit het antwoord: bepaal het volledige
    // antwoord-getal en welke kolom de hoogste echte positie is.
    const _antwNum = Number(String(_antD||'') + String(_antH||'0') + String(_antT||'0') + String(_antE||'0')) || 0;
    const _antHoog = _hoogsteKolom(_antwNum);
    const _antEShow = _cijferWaarde(_antE, 'E', _antHoog);
    const _antTShow = _cijferWaarde(_antT, 'T', _antHoog);
    const _antHShow = _cijferWaarde(_antH, 'H', _antHoog);
    const _antDShow = _cijferWaarde(_antD, 'D', _antHoog);
    const opD = showD ? `<td class="cij-oplossing" data-antwoord="${_antDShow}"></td>` : '';
    const opH = showH ? `<td class="cij-oplossing" data-antwoord="${_antHShow}"></td>` : '';
    const opT = `<td class="cij-oplossing" data-antwoord="${_antTShow}"></td>`;
    const opE = `<td class="cij-oplossing" data-antwoord="${_antEShow}"></td>`;

    return `
      <div class="cij-oefening">
        <button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${idx})" title="Verwijder">&#x2715;</button>
        <div class="cij-vraag">${esc(vraag)}</div>
        ${schattingHTML}
        <div class="cij-schema-wrap">
          <div class="cij-operator">${esc(op)}</div>
          <table class="cij-schema">
            <thead><tr>${hCelD}${hCelH}${hCelT}${hCelE}</tr></thead>
            <tbody>
              <tr>${oCelD}${oCelH}${oCelT}${oCelE}</tr>
              <tr>${g1D}${g1H}${g1T}${g1E}</tr>
              <tr>${g2D}${g2H}${g2T}${g2E}</tr>
              <tr>${opD}${opH}${opT}${opE}</tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }

  /* ── Vraagstuk blok renderer ─────────────────────────────── */
  function _maakVraagstukElement(blok) {
    const inst = blok.inst || blok.config || {};
    const metRooster = inst.schema?.includes('rooster');
    const metCijfer  = inst.schema?.includes('cijfer');
    const drieGetallen = inst.aantalGetallen === '3' || inst.aantalGetallen === 'gemengd';

    // Rooster HTML
    let roosterRijen = '';
    for (let r = 0; r < 8; r++) {
      let cellen = '';
      for (let k = 0; k < 12; k++) cellen += '<div class="vs-rooster-cel"></div>';
      roosterRijen += `<div class="vs-rooster-rij">${cellen}</div>`;
    }

    // Bewerking HTML
    let bewerkingHTML = '';
    if (metRooster || metCijfer) {
      if (drieGetallen) {
        bewerkingHTML = `<div class="vs-bewerking-blok">
          <div class="vs-bew-label">Bewerking:</div>
          <div class="vs-bew-stap">STAP 1</div><div class="vs-bew-lijn"></div>
          <div class="vs-bew-stap">STAP 2</div><div class="vs-bew-lijn"></div>
        </div>`;
      } else {
        bewerkingHTML = `<div class="vs-bewerking-blok">
          <div class="vs-bew-label">Bewerking:</div>
          <div class="vs-bew-lijn"></div><div class="vs-bew-lijn"></div><div class="vs-bew-lijn"></div>
        </div>`;
      }
    }

    // Cijferschema HTML — kolommen afleiden van niveau
    function bouwCijferSchemaPreview(headers, stap, aantalRijen) {
      if (!aantalRijen) aantalRijen = 4;
      const kleuren = {
        'TD':'#c8e6c9','D':'#ffcdd2','H':'#bbdefb','T':'#81c784','E':'#FFC107',
        ',':'#bbb','t':'#fff9c4','h':'#fff9c4','d':'#fff9c4'
      };
      const tekstKleuren = {
        'TD':'#1b5e20','D':'#b71c1c','H':'#0d47a1','T':'#1b5e20','E':'#e65100',
        ',':'#fff','t':'#f57f17','h':'#f57f17','d':'#f57f17'
      };
      const celB = headers.length > 5 ? '26px' : '32px';
      const gridCols = headers.map(h => h === ',' ? '14px' : celB).join(' ');
      const hdr = headers.map(h =>
        h === ',' ? `<div class="vs-cs-komma-header">,</div>`
        : `<div class="vs-cs-header" style="background:${kleuren[h]||'#eee'};color:${tekstKleuren[h]||'#333'};width:${celB}">${h}</div>`
      ).join('');
      const maakRij = (cls) => headers.map(h =>
        h === ',' ? `<div class="vs-cs-komma-cel ${cls||''}"></div>`
        : `<div class="vs-cs-cel ${cls||''}" style="width:${celB}"></div>`
      ).join('');
      const stapLabel = stap ? `<div class="vs-cs-staplabel">${stap}</div>` : '';
      // 6 datarijen: grijs + 5 wit met vette lijn na wit-2 en wit-4
      const dataRijen = aantalRijen === 6
        ? `${maakRij('vs-cs-grijs')}${maakRij('')}${maakRij('vs-cs-dik-onder')}${maakRij('')}${maakRij('vs-cs-dik-onder')}${maakRij('')}`
        : `${maakRij('vs-cs-grijs')}${maakRij('')}${maakRij('vs-cs-dik-onder')}${maakRij('')}`;
      return `<div class="vs-cijfer-schema-blok">${stapLabel}
        <div class="vs-cs-grid" style="grid-template-columns:${gridCols}">
          ${hdr}${dataRijen}
        </div></div>`;
    }

    function kolomsVoorNiveau(inst) {
      console.log('[preview] kolomsVoorNiveau inst.bewerking=', inst.bewerking, 'inst.vermBereik=', inst.vermBereik, 'inst.niveau=', inst.niveau);
      const n = inst.niveau;
      // Bij vermenigvuldigen: kolommen bepalen op basis van bereik
      if (inst.bewerking === 'vermenigvuldigen') {
        const vb = inst.vermBereik || 'exe';
        if (vb === 'htexte' || vb === 'htexe')  return ['D','H','T','E'];
        if (vb === 'texte'  || vb === 'txte')   return ['D','H','T','E'];
        if (vb === 'texe'   || vb === 'txe')    return ['H','T','E'];
        return ['T','E']; // exe
      }
      if (n === 'kommagetallen') {
        const prefix = inst.kommaPrefix || 'E';
        const dec    = inst.kommaDecimalen || 't';
        const pk = { 'E':[], 'TE':['T'], 'HTE':['H','T'] };
        const dk = { 't':['t'], 'th':['t','h'], 'thd':['t','h','d'] };
        return [...(pk[prefix]||[]), 'E', ',', ...(dk[dec]||['t'])];
      }
      if (n === 'tot100000') return ['TD','D','H','T','E'];
      if (n === 'tot10000')  return ['D','H','T','E'];
      if (n === 'tot1000')   return ['H','T','E'];
      if (n === 'tot100')    return ['T','E'];
      return ['E'];
    }

    function deelBereikInfo(bereik) {
      switch(bereik) {
        case 'tee':   return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'E'  };
        case 'htee':  return { links:['H','T','E'],     rechts:['T','E'],     rijenLinks:5, deler:'E'  };
        case 'dhtee': return { links:['D','H','T','E'], rechts:['H','T','E'], rijenLinks:6, deler:'E'  };
        case 'tete':  return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'TE' };
        case 'htete': return { links:['H','T','E'],     rechts:['T','E'],     rijenLinks:5, deler:'TE' };
        default:      return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'E'  };
      }
    }

    function bouwDeelSchema(deelBereik, metRest) {
      const dk = deelBereikInfo(deelBereik || 'tee');
      const kleuren = { 'D':'#ffcdd2','H':'#bbdefb','T':'#81c784','E':'#FFC107' };
      const tekstK  = { 'D':'#b71c1c','H':'#0d47a1','T':'#1b5e20','E':'#e65100' };
      const celB = '32px';
      const maakHeader = (cols) => cols.map(k =>
        `<div class="vs-cs-header" style="background:${kleuren[k]||'#eee'};color:${tekstK[k]||'#333'};width:${celB}">${k}</div>`
      ).join('');
      const maakRij = (cols) => cols.map(() =>
        `<div class="vs-cs-cel" style="width:${celB}"></div>`
      ).join('');
      const gridL = dk.links.map(() => celB).join(' ');
      const gridR = dk.rechts.map(() => celB).join(' ');
      let linksRijen = '';
      for (let r = 0; r < dk.rijenLinks; r++) {
        linksRijen += `<div class="vs-cs-grid" style="grid-template-columns:${gridL}">${maakRij(dk.links)}</div>`;
      }
      const linksHTML = `<div class="vs-cs-grid" style="grid-template-columns:${gridL}">${maakHeader(dk.links)}</div>${linksRijen}`;
      const restRij = metRest
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:5px;padding-left:2px"><span style="font-size:11px;font-weight:700;color:#444">R =</span><div style="flex:1;border-bottom:1.5px solid #666;min-width:36px;height:14px"></div></div>`
        : '';
      const rechtsHTML = `<div style="padding-top:${celB}"></div><div class="vs-cs-grid" style="grid-template-columns:${gridR}">${maakHeader(dk.rechts)}</div><div class="vs-cs-grid" style="grid-template-columns:${gridR}">${maakRij(dk.rechts)}</div>${restRij}`;
      return `<div class="vs-deel-schema-wrap"><div class="vs-deel-links">${linksHTML}</div><div class="vs-deel-lijn"></div><div class="vs-deel-rechts">${rechtsHTML}</div></div>`;
    }

    // Aantal datarijen bepalen op basis van bermBereik
    const nRijen = ['txte','texte','htexte'].includes(inst.vermBereik || '') ? 6 : 4;

    let cijferHTML = '';
    if (metCijfer) {
      if (inst.bewerking === 'delen') {
        cijferHTML = `<div class="vs-cijfer-label">Ik cijfer.</div>${bouwDeelSchema(inst.deelBereik, inst.deelRest === 'ja')}`;
      } else {
        const headers = kolomsVoorNiveau(inst);
        if (drieGetallen) {
          cijferHTML = `<div class="vs-cijfer-label">Ik cijfer.</div><div class="vs-cijfer-stappen">${bouwCijferSchemaPreview(headers,'STAP 1',nRijen)}${bouwCijferSchemaPreview(headers,'STAP 2',nRijen)}</div>`;
        } else {
          cijferHTML = `<div class="vs-cijfer-label">Ik cijfer.</div>${bouwCijferSchemaPreview(headers,'',nRijen)}`;
        }
      }
    }

    // Antwoordzin
    const antwoordHTML = blok.antwoordzin
      ? `<div class="vs-antwoordzin-rij"><span class="vs-antw-label">Antwoordzin:</span><span class="vs-antw-tekst">${esc(blok.antwoordzin)}</span></div>`
      : `<div class="vs-antwoordzin-rij"><span class="vs-antw-label">Antwoordzin:</span><div class="vs-antw-lijn"></div></div>`;

    // Schema zone
    const heeftSchema = metRooster || metCijfer;
    const schemaZone = heeftSchema ? `
      <div class="vs-schema-zone">
        ${metRooster ? `<div class="vs-schema-links">
          <div class="vs-schema-label">Schema:</div>
          <div class="vs-rooster">${roosterRijen}</div>
          ${!metCijfer ? bewerkingHTML : ''}
        </div>` : ''}
        <div class="vs-schema-rechts">
          ${!metRooster && metCijfer ? bewerkingHTML : ''}
          ${metRooster && metCijfer ? bewerkingHTML : ''}
          ${cijferHTML}
        </div>
      </div>` : '';

    const div = document.createElement('div');
    div.className  = 'preview-blok';
    div.dataset.id = blok.id;
    div.innerHTML = `
      <div class="preview-blok-header">
        <span class="blok-type-badge">📖 Vraagstuk</span>
        <span class="blok-niveau">${inst.niveau || ''}</span>
        <div class="spacer"></div>
        <div class="blok-acties">
          <button class="btn-blok-actie verwijder"
            onclick="App.verwijderBlok('${blok.id}')" title="Verwijder blok">✕</button>
        </div>
      </div>
      <div class="preview-blok-body">
        <div class="vs-kaart" style="max-width:100%">
          <div class="vs-kaart-tekst">${(blok.vraagstuk||'').replace(/\n/g,'<br>')}</div>
          ${schemaZone}
          ${antwoordHTML}
        </div>
      </div>`;
    return div;
  }

  /* ── Rekentaal blok renderer ─────────────────────────────── */
  function _maakRekentaalElement(blok) {
    const div = document.createElement('div');
    div.className  = 'preview-blok';
    div.dataset.id = blok.id;

    const brugLabel = { met:'🌉 Met brug', zonder:'✅ Zonder brug', gemengd:'🔀 Gemengd' }[blok.brug] || '';

    function _renderZin(oef) {
      let t = (oef.template || '');
      // Vervang {P} en {Q} voor vermenigvuldigen
      t = t.replace('{P}', '<strong>' + (oef.P !== undefined ? oef.P : oef.a) + '</strong>');
      t = t.replace('{Q}', '<strong>' + (oef.Q !== undefined ? oef.Q : oef.b) + '</strong>');
      t = t.replace('{a}', '<strong>' + oef.a + '</strong>');
      t = t.replace('{b}', oef.b !== undefined ? '<strong>' + oef.b + '</strong>' : '');
      t = t.replace('{?}', '<span class="rt-invulhokje"></span>');
      return t;
    }

    let oefHtml = '';
    (blok.oefeningen || []).forEach((oef, idx) => {
      const zinHtml = _renderZin(oef);
      // Bepaal bewerking voor oplossing
      const _rtBew = oef.bewerking || blok.bewerking || '';
      const _rtA = oef.a !== undefined ? oef.a : (oef.P !== undefined ? oef.P : '');
      let _rtB = oef.b !== undefined ? oef.b : (oef.Q !== undefined ? oef.Q : '');
      const _rtAnt = oef.antwoord !== undefined ? oef.antwoord : '';
      let _rtTeken = '';
      if (_rtBew === 'optellen' || _rtBew === '+') _rtTeken = '+';
      else if (_rtBew === 'aftrekken' || _rtBew === '-') _rtTeken = '-';
      else if (_rtBew === 'vermenigvuldigen') _rtTeken = '×';
      else if (_rtBew === 'delen') _rtTeken = ':';  // Vlaamse notatie
      // Dubbel/helft/kwart: hardcoded bewerking op basis van templateId
      const _rtTmplId = oef.templateId || oef.id || '';
      if (!_rtTeken && _rtTmplId) {
        if (_rtTmplId === 'dhk1' || _rtTmplId === 'dhk2') {
          _rtTeken = '×'; _rtB = '2';
        } else if (_rtTmplId === 'dhk3' || _rtTmplId === 'dhk4') {
          _rtTeken = ':'; _rtB = '2';
        } else if (_rtTmplId === 'dhk5') {
          _rtTeken = ':'; _rtB = '4';
        }
      }
      // Fallback: afleiden uit getallen
      if (!_rtTeken && _rtA !== '' && _rtB !== '' && _rtAnt !== '') {
        if (Number(_rtA) + Number(_rtB) === Number(_rtAnt)) _rtTeken = '+';
        else if (Number(_rtA) - Number(_rtB) === Number(_rtAnt)) _rtTeken = '−';
        else if (Number(_rtA) * Number(_rtB) === Number(_rtAnt)) _rtTeken = '×';
        else if (Math.round(Number(_rtA) / Number(_rtB)) === Number(_rtAnt)) _rtTeken = ':';
      }
      const _rtOplStr = (_rtA !== '' && _rtB !== '' && _rtTeken && _rtAnt !== '')
        ? _rtA + ' ' + _rtTeken + ' ' + _rtB + ' = ' + _rtAnt
        : (_rtAnt !== '' ? String(_rtAnt) : '');

      oefHtml += '<div class="rt-oef-rij">' +
        '<span class="rt-oef-zin">' + zinHtml + '</span>' +
        '<span class="rt-pijl">&#x2192;</span>' +
        '<span class="rt-oef-lijn" data-antwoord="' + _rtOplStr + '"></span>' +
        '<button class="btn-del-oef" onclick="App.verwijderOefening(\'' + blok.id + '\',' + idx + ')" title="Verwijder">&#x2715;</button>' +
        '</div>';
    });

    div.innerHTML = `
      <div class="preview-blok-header">
        <span class="blok-type-badge">&#x1F5E3;&#xFE0F; Rekentaal</span>
        <span class="blok-niveau">Tot ${blok.niveau}</span>
        <span style="color:rgba(255,255,255,.6);font-size:12px;margin-left:4px">${brugLabel}</span>
        <div class="spacer"></div>
        <div class="blok-acties">
          <button class="btn-blok-actie verwijder"
            onclick="App.verwijderBlok('${blok.id}')" title="Verwijder blok">&#x2715;</button>
        </div>
      </div>
      <div class="preview-blok-body">
        <div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}">
          <span class="opdrachtzin-tekst" id="zin-tekst-${blok.id}">${esc(blok.opdrachtzin)}</span>
          <button class="btn-bewerk-zin" onclick="App.bewerkZin('${blok.id}')" title="Bewerk">&#x270F;&#xFE0F;</button>
        </div>
        <div class="rt-oefeningen-lijst">
          ${oefHtml}
        </div>
      </div>
      <div class="preview-blok-footer">
        <span class="footer-info">${(blok.oefeningen || []).length} oefeningen &middot; rekentaal</span>
        <button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button>
      </div>`;

    return div;
  }

  /* ══════════════════════════════════════════════════════════════
     SCHATTEN — preview renderers
     ══════════════════════════════════════════════════════════════ */

  function _schattenBlokElement(blok) {
    const div = document.createElement('div');
    div.className = 'preview-blok';
    div.dataset.id = blok.id;

    const subtypeLabel = {
      'afronden':          '🎯 Afronden',
      'schatting-tabel':   '📊 Schatting (tabel)',
      'schatting-compact': '➡️ Schatting (compact)',
      'mogelijk':          '✅ Mogelijk?',
    }[blok.subtype] || '🔮 Schatten';

    const gridKlasse = {
      'afronden':          'schatten-afronden-grid',
      'schatting-tabel':   'schatten-tabel-grid',
      'schatting-compact': 'schatten-compact-grid',
      'mogelijk':          'schatten-mogelijk-grid',
    }[blok.subtype] || '';

    // Tabel/compact: voeg een header-rij toe boven de oefeningen
    let headerRij = '';
    if (blok.subtype === 'schatting-tabel') {
      const afKleur = blok.config?.afrondenNaar === 'H' ? '#2980b9' : '#e74c3c';
      const afLabel = blok.config?.afrondenNaar || 'H';
      const somLabel = blok.config?.bewerking === 'aftrekken' ? 'Het verschil tussen ...' : 'De som van ...';
      const bewLabel = blok.config?.bewerking === 'aftrekken' ? 'Trek de ronde getallen af.' : 'Tel de ronde getallen op.';
      headerRij = `<div class="scht-tabel-header">
        <div class="scht-t-som scht-hdr-cel">${somLabel}</div>
        <div class="scht-t-col2 scht-hdr-cel">Rond af naar <strong style="color:${afKleur}">${afLabel}</strong></div>
        <div class="scht-t-col3 scht-hdr-cel">${bewLabel}</div>
        <div class="scht-t-col4 scht-hdr-cel">Schatting:</div>
      </div>`;
    } else if (blok.subtype === 'schatting-compact') {
      const somLabel = blok.config?.bewerking === 'aftrekken' ? 'Het verschil tussen ...' : 'De som van ...';
      headerRij = `<div class="scht-compact-header">${somLabel} &#x2192; is ongeveer ...</div>`;
    }
    const oefHtml = blok.oefeningen.map((o, i) => _schattenOefeningHTML(blok, o, i)).join('');

    div.innerHTML = `
      <div class="preview-blok-header" style="background:linear-gradient(135deg,#e8780a,#f59e42)">
        <span class="blok-type-badge">${subtypeLabel}</span>
        <span class="blok-niveau">Tot ${blok.niveau.toLocaleString('nl-BE')}</span>
        <div class="spacer"></div>
        <div class="blok-acties">
          <button class="btn-blok-actie verwijder"
            onclick="App.verwijderBlok('${blok.id}')" title="Verwijder blok">✕</button>
        </div>
      </div>
      <div class="preview-blok-body">
        <div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}">
          <span class="opdrachtzin-tekst" id="zin-tekst-${blok.id}">${esc(blok.opdrachtzin)}</span>
          <button class="btn-bewerk-zin" onclick="App.bewerkZin('${blok.id}')" title="Bewerk">✏️</button>
        </div>
        <div class="oefeningen-grid ${gridKlasse}" id="grid-${blok.id}">
          ${headerRij}${oefHtml}
        </div>
      </div>
      <div class="preview-blok-footer">
        <span class="footer-info">${blok.oefeningen.length} oefeningen · schatten</span>
        <button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button>
      </div>`;
    return div;
  }

  function _schattenOefeningHTML(blok, oef, idx) {
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${idx})" title="Verwijder">✕</button>`;
    if (oef.type === 'afronden')          return _afrondenPreviewHTML(blok, oef, idx, del);
    if (oef.type === 'schatting-tabel')   return _schattingTabelPreviewHTML(blok, oef, idx, del);
    if (oef.type === 'schatting-compact') return _schattingCompactPreviewHTML(blok, oef, idx, del);
    if (oef.type === 'mogelijk')          return _mogelijkPreviewHTML(blok, oef, idx, del);
    return '';
  }

  function _afrondenPreviewHTML(blok, oef, idx, del) {
    const kleur1 = oef.label1 === 'T' ? '#27ae60' : oef.label1 === 'H' ? '#2980b9' : '#e74c3c';
    const kleur2 = oef.label2 === 'H' ? '#2980b9' : '#e74c3c';
    const naam1  = oef.label1 === 'T' ? 'T<span style="font-weight:400">iental</span>'
                 : oef.label1 === 'H' ? 'H<span style="font-weight:400">onderdtal</span>'
                 : 'D<span style="font-weight:400">uizendtal</span>';
    const naam2  = oef.label2 === 'H' ? 'H<span style="font-weight:400">onderdtal</span>'
                 : 'D<span style="font-weight:400">uizendtal</span>';
    return `
      <div class="oefening-item scht-afronden">
        <div class="scht-af-getal">${oef.getal.toLocaleString('nl-BE')}</div>
        <div class="scht-af-rijen">
          <div class="scht-af-rij">
            <span class="scht-af-label">dichtstbij <strong style="color:${kleur1}">${naam1}</strong>:</span>
            <span class="scht-lijn" data-antwoord="${oef.dichtstbij1}"></span>
          </div>
          <div class="scht-af-rij">
            <span class="scht-af-label">dichtstbij <strong style="color:${kleur2}">${naam2}</strong>:</span>
            <span class="scht-lijn" data-antwoord="${oef.dichtstbij2}"></span>
          </div>
        </div>
        ${del}
      </div>`;
  }

  function _schattingTabelPreviewHTML(blok, oef, idx, del) {
    const isVb = idx === 0;
    const tekenTxt = oef.bewerking === 'optellen' ? '+' : '-';

    const col2 = isVb
      ? `<span class="scht-vb-blauw">${oef.afA.toLocaleString('nl-BE')} ${tekenTxt} ${oef.afB.toLocaleString('nl-BE')}</span>`
      : `<span class="scht-lijn smal" data-antwoord="${oef.afA.toLocaleString('nl-BE')}"></span><span class="scht-teken">${tekenTxt}</span><span class="scht-lijn smal" data-antwoord="${oef.afB.toLocaleString('nl-BE')}"></span>`;
    const col3 = isVb
      ? `<span class="scht-vb-blauw">${oef.afA.toLocaleString('nl-BE')} ${tekenTxt} ${oef.afB.toLocaleString('nl-BE')} = ${oef.schatting.toLocaleString('nl-BE')}</span>`
      : `<span class="scht-lijn breed" data-antwoord="${oef.afA.toLocaleString('nl-BE')} ${tekenTxt} ${oef.afB.toLocaleString('nl-BE')} = ${oef.schatting.toLocaleString('nl-BE')}"></span>`;
    const col4 = isVb
      ? `<span class="scht-vb-oranje">${oef.schatting.toLocaleString('nl-BE')}</span>`
      : `<span class="scht-lijn smal" data-antwoord="${oef.schatting.toLocaleString('nl-BE')}"></span>`;

    return `
      <div class="oefening-item scht-tabel-rij${isVb ? ' scht-vb' : ''}">
        <div class="scht-t-som">${oef.a.toLocaleString('nl-BE')} ${tekenTxt} ${oef.b.toLocaleString('nl-BE')}</div>
        <div class="scht-t-col2">${col2}</div>
        <div class="scht-t-col3">${col3}</div>
        <div class="scht-t-col4">${col4}</div>
        ${del}
      </div>`;
  }

  function _schattingCompactPreviewHTML(blok, oef, idx, del) {
    const isVb = idx === 0;
    const tekenTxt = oef.bewerking === 'optellen' ? '+' : '-';
    const inhoud = isVb
      ? `<span class="scht-vb-blauw">${oef.afA.toLocaleString('nl-BE')} ${tekenTxt} ${oef.afB.toLocaleString('nl-BE')} = ${oef.schatting.toLocaleString('nl-BE')}</span>`
      : `<span class="scht-lijn smal" data-antwoord="${oef.afA.toLocaleString('nl-BE')}"></span><span style="color:#e8780a;font-weight:700"> ${tekenTxt} </span><span class="scht-lijn smal" data-antwoord="${oef.afB.toLocaleString('nl-BE')}"></span><span> = </span><span class="scht-lijn smal" data-antwoord="${oef.schatting.toLocaleString('nl-BE')}"></span>`;
    return `
      <div class="oefening-item scht-compact${isVb ? ' scht-vb' : ''}">
        <span class="scht-comp-som">${oef.a.toLocaleString('nl-BE')} ${tekenTxt} ${oef.b.toLocaleString('nl-BE')}</span>
        <span class="scht-pijl">&#x2192;</span>
        <span class="scht-comp-inhoud">${inhoud}</span>
        ${del}
      </div>`;
  }

  function _mogelijkPreviewHTML(blok, oef, idx, del) {
    const tekenTxt = oef.bewerking === 'optellen' ? '+' : '-';
    return `
      <div class="oefening-item scht-mogelijk"
           style="flex-direction:column;align-items:flex-start;justify-content:flex-start;padding:14px 32px 18px 14px;gap:0;min-height:210px;font-size:16px;border:2px solid #e8a040;border-radius:8px">
        <div style="background:#fff8e8;border:1.5px solid #f0c050;border-radius:6px;padding:12px 14px;font-size:16px;font-weight:500;line-height:1.7;width:100%;box-sizing:border-box;white-space:normal;word-wrap:break-word;color:#333">
          Is ${oef.label.toLowerCase()} van
          <strong>${oef.a.toLocaleString('nl-BE')}</strong>
          ${tekenTxt}
          <strong>${oef.b.toLocaleString('nl-BE')}</strong>
          gelijk aan
          <strong>${oef.beweerdAntwoord.toLocaleString('nl-BE')}</strong>?
        </div>
        <div style="display:flex;align-items:flex-end;gap:6px;font-size:14px;font-weight:600;width:100%;margin-top:20px;margin-bottom:14px">
          <span style="font-size:13px;font-style:italic;color:#666;padding-bottom:2px">Ik schat:</span>
          <span class="scht-lijn smal" data-antwoord="${oef.afA ? oef.afA.toLocaleString('nl-BE') : ''}"></span>
          ${tekenTxt}
          <span class="scht-lijn smal" data-antwoord="${oef.afB ? oef.afB.toLocaleString('nl-BE') : ''}"></span>
          =
          <span class="scht-lijn smal" data-antwoord="${oef.schatting ? oef.schatting.toLocaleString('nl-BE') : ''}"></span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <label style="display:flex;align-items:center;gap:10px;font-size:16px;font-weight:500;color:#222;cursor:pointer">
            <span class="mogelijk-check" data-antwoord="${oef.isMogelijk ? 'ja' : ''}" style="width:17px;height:17px;flex-shrink:0;border:2px solid #333;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold"></span>
            ${oef.label} is mogelijk.
          </label>
          <label style="display:flex;align-items:center;gap:10px;font-size:16px;font-weight:500;color:#222;cursor:pointer">
            <span class="mogelijk-check" data-antwoord="${!oef.isMogelijk ? 'ja' : ''}" style="width:17px;height:17px;flex-shrink:0;border:2px solid #333;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold"></span>
            ${oef.label} is niet mogelijk.
          </label>
        </div>
        ${del}
      </div>`;
  }

  function _breukHTML(n, d, antwoord) {
    if (!antwoord) return `<span class="breuk"><span class="breuk-teller">${n}</span><span class="breuk-noemer">${d}</span></span>`;
    return `<span class="breuk breuk-invul"><span class="breuk-teller breuk-antwoord" data-antwoord="${n}"></span><span class="breuk-noemer breuk-antwoord" data-antwoord="${d}"></span></span>`;
  }

  function _mgGetalHTML(w,n,d,invul=false) {
    if(n===0 && w){
      if(!invul)return `<span class="mg-getal"><b>${w}</b></span>`;
      return `<span class="mg-getal mg-invul"><span class="mg-heel" data-antwoord="${w}"></span></span>`;
    }
    if (!invul) return `<span class="mg-getal">${w?`<b>${w}</b>`:''}${_breukHTML(n,d)}</span>`;
    return `<span class="mg-getal mg-invul">${w?`<span class="mg-heel" data-antwoord="${w}"></span>`:''}${_breukHTML(n,d,true)}</span>`;
  }

  function _mgPuntBreukHTML(n,d,noemerBekend=true){
    return `<span class="breuk mg-puntbreuk"><span class="breuk-teller breuk-antwoord" data-antwoord="${n}">·</span><span class="breuk-noemer${noemerBekend?'':' breuk-antwoord'}"${noemerBekend?'':` data-antwoord="${d}"`}>${noemerBekend?d:'·'}</span></span>`;
  }
  function _mgPuntGetalHTML(w,n,d){return `<span class="mg-getal mg-puntgetal">${w?`<span class="mg-geheel-lijn breuk-antwoord" data-antwoord="${w}"></span>`:''}${n? _mgPuntBreukHTML(n,d,true):''}</span>`;}

  function _mgStroken(w,n,d,ingekleurd,vorm='strook') {
    if(vorm==='taart'){
      const cirkels=[];
      const maak=(gevuld)=>{const cx=31,cy=31,r=29,p=[];for(let i=0;i<d;i++){const a1=-Math.PI/2+i*2*Math.PI/d,a2=-Math.PI/2+(i+1)*2*Math.PI/d,x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1),x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2),vol=i<gevuld,fill=(ingekleurd&&vol)?'#79a9cf':'#fff';p.push(`<path data-deel-gevuld="${vol}" d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${fill}" stroke="#444" stroke-width="1.4"/>`);}return `<svg class="mg-taart${ingekleurd?' mg-voorgekleurd':''}" viewBox="0 0 62 62" data-gevuld="${gevuld}">${p.join('')}<circle cx="31" cy="31" r="29" fill="none" stroke="#333" stroke-width="2"/></svg>`;};
      for(let heel=0;heel<w;heel++)cirkels.push(maak(d));
      if(n>0||w===0)cirkels.push(maak(n));
      return `<span class="mg-stroken mg-taarten${ingekleurd?' mg-voorgekleurd':''}">${cirkels.join('')}</span>`;
    }
    const stroken=[];
    for(let heel=0;heel<w;heel++) stroken.push(`<span class="mg-strook mg-strook-heel" data-gevuld="true"></span>`);
    if(n>0 || w===0) stroken.push(`<span class="mg-strook mg-strook-breuk">${Array.from({length:d},(_,i)=>`<i data-gevuld="${i<n}"></i>`).join('')}</span>`);
    return `<span class="mg-stroken${ingekleurd?' mg-voorgekleurd':''}">${stroken.join('')}</span>`;
  }

  function _mgAftrekBeeld(oef){
    const vorm=oef.vorm||'strook',moetWisselen=oef.n1<oef.n2;
    const vormHTML=(w,n,kruis=false,aantal=0)=>{
      let rood='';
      if(kruis&&w>0)rood=`<svg class="mg-rood-overlay" viewBox="0 0 100 40" preserveAspectRatio="none"><line x1="4" y1="3" x2="96" y2="37"/></svg>`;
      else if(kruis&&n>0){
        const eerste=Math.max(0,n-aantal),indices=Array.from({length:Math.min(aantal,n)},(_,i)=>eerste+i);
        if(vorm==='taart'){
          const lijnen=indices.map(i=>{const a=-Math.PI/2+(i+.5)*2*Math.PI/oef.doel,cx=31+18*Math.cos(a),cy=31+18*Math.sin(a),dx=9*Math.cos(a+Math.PI/2),dy=9*Math.sin(a+Math.PI/2);return `<line x1="${(cx-dx).toFixed(1)}" y1="${(cy-dy).toFixed(1)}" x2="${(cx+dx).toFixed(1)}" y2="${(cy+dy).toFixed(1)}"/>`;}).join('');
          rood=`<svg class="mg-rood-overlay" viewBox="0 0 62 62">${lijnen}</svg>`;
        }else{
          const lijnen=indices.map(i=>`<line x1="${i*20+2}" y1="2" x2="${(i+1)*20-2}" y2="32"/>`).join('');
          rood=`<svg class="mg-rood-overlay" viewBox="0 0 ${oef.doel*20} 34" preserveAspectRatio="none">${lijnen}</svg>`;
        }
      }
      return `<span class="mg-aftrek-vorm${kruis?' mg-rood-kruis':''}">${_mgStroken(w,n,oef.doel,true,vorm)}${rood}</span>`;
    };
    const delen=[];
    for(let i=0;i<oef.w1;i++)delen.push(vormHTML(1,0,i>=oef.w1-oef.w2));
    if(oef.n1>0)delen.push(vormHTML(0,oef.n1,true,oef.n2));
    const begin=`<div class="mg-aftrek-plaat">${delen.join('')}</div>`;
    if(!moetWisselen)return begin;
    const overW=oef.w1-oef.w2-1,na=[];
    for(let i=0;i<overW;i++)na.push(vormHTML(1,0));
    na.push(vormHTML(0,oef.doel,true,oef.n2));
    return `${begin}<div class="mg-aftrek-zwarte-pijl">↓</div><div class="mg-aftrek-plaat">${na.join('')}</div>`;
  }

  function _mgOmzetHTML(oef) {
    if(!oef.ongelijknamig)return '';
    const v=oef.factor1>1?{n:oef.n1,d:oef.d1,cn:oef.cn1}:{n:oef.n2,d:oef.d2,cn:oef.cn2};
    return `<div class="mg-omzet"><span class="mg-blauwe-pijl"></span><span class="mg-omzet-doel">${_mgPuntBreukHTML(v.cn,oef.doel,true)}</span></div>`;
  }

  function _mgSchrijfOmzetHTML(oef) {
    if(!oef.ongelijknamig)return '';
    const v=oef.factor1>1?{n:oef.n1,d:oef.d1,cn:oef.cn1,f:oef.factor1}:{n:oef.n2,d:oef.d2,cn:oef.cn2,f:oef.factor2};
    const kant=oef.factor2>1?' mg-conv-links':' mg-conv-rechts';
    return `<div class="mg-schrijf-conversie${kant}"><div class="mg-conv-mini"><span>${_breukHTML(v.n,v.d)}</span><b>=</b><span>${_breukHTML(v.cn,oef.doel,true)}</span><svg viewBox="0 0 102 98" aria-hidden="true"><path d="M24 29 C39 7 58 7 70 29"/><polygon points="74,29 65,26 70,20"/><path d="M24 68 C39 90 58 90 70 68"/><polygon points="74,68 70,77 65,71"/></svg><span class="mg-factor mg-factor-boven">× <i data-antwoord="${v.f}"></i></span><span class="mg-factor mg-factor-onder">× <i data-antwoord="${v.f}"></i></span></div></div>`;
  }

  function _mgTermMetPijl(html,omzetten,richting='rechts') {
    const naarLinks=richting==='links';
    const pijl=omzetten?`<span class="mg-term-pijl ${naarLinks?'mg-term-pijl-links':'mg-term-pijl-rechts'}" aria-hidden="true"></span>`:'';
    return `<span class="mg-schrijf-term${omzetten?' mg-term-omzetten':''}">${html}${pijl}</span>`;
  }

  function _mgSchrijfHTML(oef) {
    const eerste = `${_mgTermMetPijl(_mgGetalHTML(oef.w1,oef.n1,oef.d1),oef.ongelijknamig&&oef.factor1>1,'rechts')} <b>${oef.op}</b> ${_mgTermMetPijl(_mgGetalHTML(oef.w2,oef.n2,oef.d2),oef.ongelijknamig&&oef.factor2>1,'links')}`;
    const omzet = _mgSchrijfOmzetHTML(oef);
    const tussen=oef.op==='-'?oef.g1-oef.g2:oef.g1+oef.g2;
    const heleTussen=oef.op==='-'?oef.w1-oef.w2:oef.w1+oef.w2;
    const tussenRegel=oef.ongelijknamig
      ? `<div class="mg-schrijf-som">${eerste}<b>=</b>${_mgPuntBreukHTML(tussen,oef.doel,true)}</div>`
      : `<div class="mg-schrijf-som">${eerste}<b>=</b><span class="mg-geheel-lijn breuk-antwoord" data-antwoord="${heleTussen}"></span>${_mgPuntBreukHTML(oef.cn1,oef.doel,true)}<b>${oef.op}</b>${_mgPuntBreukHTML(oef.cn2,oef.doel,true)}</div>`;
    return `<div class="mg-schrijf"><em>Ik schrijf:</em>${tussenRegel}${omzet}<div class="mg-schrijf-som mg-schrijf-uitkomst"><b>=</b>${_mgPuntGetalHTML(oef.heel,oef.rest,oef.doel)}</div></div>`;
  }

  function _gemengdeOefeningHTML(blok,oef,idx) {
    const del=`<button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${idx})" title="Verwijder">✕</button>`;
    const variant=blok.config?.variant||'inkleuren';
    const uitkomst=_mgPuntGetalHTML(oef.heel,oef.rest,oef.doel);
    if(oef.op==='-'&&oef.aftrekVorm==='eerste'&&variant==='afbeelding'){
      const wissel=oef.n1<oef.n2,middenW=oef.w1-oef.w2-(wissel?1:0),middenN=wissel?oef.doel:oef.n1;
      const regels=`<div class="mg-aftrek-kijk-regels"><div>${_mgPuntGetalHTML(oef.w1,oef.n1,oef.d1)}<b>-</b>${_mgPuntGetalHTML(oef.w2,oef.n2,oef.d2)}<b>=</b></div><div>${_mgPuntGetalHTML(middenW,middenN,oef.doel)}<b>-</b>${_mgPuntBreukHTML(oef.n2,oef.doel,true)}<b>=</b>${uitkomst}</div></div>`;
      return `<div class="oefening-item mg-oef mg-aftrek-kijk">${_mgAftrekBeeld(oef)}${regels}${del}</div>`;
    }
    if(oef.op==='-'&&oef.aftrekVorm==='eerste'&&variant!=='zonder'){
      const moetWisselen=oef.n1<oef.n2, middenW=oef.w1-oef.w2-(moetWisselen?1:0), middenN=moetWisselen?oef.doel:oef.n1;
      const gevuld=false;
      const rij=(getal,stroken,extra='')=>`<div class="mg-aftrek-rij">${stroken}<span class="mg-aftrek-notatie">${getal}${extra}</span></div>`;
      const werk=`<div class="mg-werk mg-aftrek-werk"><div class="mg-vraag">${_mgGetalHTML(oef.w1,oef.n1,oef.d1)} <b>-</b> ${_mgGetalHTML(oef.w2,oef.n2,oef.d2)} <b>= ?</b></div>${rij(_mgGetalHTML(oef.w1,oef.n1,oef.d1),_mgStroken(oef.w1,oef.n1,oef.d1,gevuld,oef.vorm),`<b>-</b>${_mgPuntGetalHTML(oef.w2,oef.n2,oef.d2)}`)}<div class="mg-schema-pijl">↓</div>${rij(_mgPuntGetalHTML(middenW,middenN,oef.doel),_mgStroken(middenW,middenN,oef.doel,gevuld,oef.vorm),`<b>-</b>${_mgPuntBreukHTML(oef.n2,oef.doel,true)}`)}<div class="mg-schema-pijl">↓</div>${rij(_mgPuntGetalHTML(oef.heel,oef.rest,oef.doel),_mgStroken(oef.heel,oef.rest,oef.doel,gevuld,oef.vorm))}</div>`;
      const schrijf=`<div class="mg-schrijf"><em>Ik schrijf:</em><div class="mg-schrijf-som">${_mgGetalHTML(oef.w1,oef.n1,oef.d1)}<b>-</b>${_mgGetalHTML(oef.w2,oef.n2,oef.d2)}<b>=</b>${_mgPuntGetalHTML(middenW,middenN,oef.doel)}<b>-</b>${_mgPuntBreukHTML(oef.n2,oef.doel,true)}</div><div class="mg-schrijf-som mg-schrijf-uitkomst"><b>=</b>${uitkomst}</div></div>`;
      return `<div class="oefening-item mg-oef mg-uitgewerkt mg-aftrek-eerste">${werk}${schrijf}${del}</div>`;
    }
    if(variant==='zonder') return `<div class="oefening-item mg-oef mg-zonder"><div class="mg-som">${_mgGetalHTML(oef.w1,oef.n1,oef.d1)} <b>${oef.op}</b> ${_mgGetalHTML(oef.w2,oef.n2,oef.d2)} <b>=</b><span class="mg-lange-lijn" data-antwoord="${oef.antwoord}"></span></div>${del}</div>`;
    if(variant==='afbeelding'){
      const kant=oef.factor1>1?'mg-kijk-links':'mg-kijk-rechts';
      const omzet=oef.ongelijknamig?`<div class="mg-kijk-omzet ${kant}"><span class="mg-kijk-l-pijl"></span><div class="mg-kijk-omzetregel">${_breukHTML(oef.factor1>1?oef.n1:oef.n2,oef.factor1>1?oef.d1:oef.d2,true)}<b>=</b>${_breukHTML(oef.factor1>1?oef.cn1:oef.cn2,oef.doel,true)}</div></div>`:'';
      return `<div class="oefening-item mg-oef mg-kijk"><div class="mg-kijk-beelden"><span>${_mgStroken(oef.w1,oef.n1,oef.d1,true,oef.vorm)}</span><b>${oef.op}</b><span>${_mgStroken(oef.w2,oef.n2,oef.d2,true,oef.vorm)}</span></div><div class="mg-kijk-som">${_mgPuntGetalHTML(oef.w1,oef.n1,oef.d1)}<b>${oef.op}</b>${_mgPuntGetalHTML(oef.w2,oef.n2,oef.d2)}<b>=</b>${_mgPuntBreukHTML(oef.totaal,oef.doel,true)}<b>=</b>${_mgPuntGetalHTML(oef.heel,oef.rest,oef.doel)}</div>${omzet}${del}</div>`;
    }
    const gevuld=false;
    const omzetKant=oef.factor1>1?'mg-omzet-links':'mg-omzet-rechts';
    const omzet=oef.ongelijknamig?`<div class="mg-schema-omzet ${omzetKant}">${_mgOmzetHTML(oef)}</div>`:'';
    const vraag=`<div class="mg-vraag">${_mgGetalHTML(oef.w1,oef.n1,oef.d1)} <b>${oef.op}</b> ${_mgGetalHTML(oef.w2,oef.n2,oef.d2)} <b>= ?</b></div>`;
    const start=`<div class="mg-schema-start"><span>${_mgGetalHTML(oef.w1,oef.n1,oef.d1)}</span>${_mgStroken(oef.w1,oef.n1,oef.d1,gevuld,oef.vorm)}<b>${oef.op}</b>${_mgStroken(oef.w2,oef.n2,oef.d2,gevuld,oef.vorm)}<span>${_mgGetalHTML(oef.w2,oef.n2,oef.d2)}</span></div>`;
    const links=oef.ongelijknamig
      ? `<div class="mg-werk">${vraag}${start}${omzet}<div class="mg-schema-rij">${_mgPuntGetalHTML(oef.w1,oef.cn1,oef.doel)}${_mgStroken(oef.w1,oef.cn1,oef.doel,gevuld,oef.vorm)}<b>${oef.op}</b>${_mgStroken(oef.w2,oef.cn2,oef.doel,gevuld,oef.vorm)}${_mgPuntGetalHTML(oef.w2,oef.cn2,oef.doel)}</div><div class="mg-schema-pijl">↓</div><div class="mg-schema-rij mg-schema-totaal">${_mgPuntBreukHTML(oef.totaal,oef.doel,true)}${_mgStroken(oef.heel,oef.rest,oef.doel,gevuld,oef.vorm)}</div><div class="mg-schema-pijl">↓</div><div class="mg-schema-rij mg-schema-eind">${uitkomst}${_mgStroken(oef.heel,oef.rest,oef.doel,gevuld,oef.vorm)}</div></div>`
      : `<div class="mg-werk">${vraag}${start}<div class="mg-schema-pijl">↓</div><div class="mg-schema-rij mg-schema-totaal">${_mgPuntBreukHTML(oef.totaal,oef.doel,true)}${_mgStroken(oef.heel,oef.rest,oef.doel,gevuld,oef.vorm)}</div><div class="mg-schema-pijl">↓</div><div class="mg-schema-rij mg-schema-eind">${uitkomst}${_mgStroken(oef.heel,oef.rest,oef.doel,gevuld,oef.vorm)}</div></div>`;
    return `<div class="oefening-item mg-oef mg-uitgewerkt ${oef.ongelijknamig?'mg-ongelijknamig':'mg-gelijknamig'}">${links}${_mgSchrijfHTML(oef)}${del}</div>`;
  }

  function _breukOefeningHTML(blok, oef, idx) {
    if (blok.config?.soort === 'vermenigvuldigen') return _breukVermenigvuldigHTML(blok,oef,idx);
    if (blok.config?.soort === 'gemengde-getallen') return _gemengdeOefeningHTML(blok,oef,idx);
    const del = `<button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${idx})" title="Verwijder">✕</button>`;
    const ongelijk = blok.config?.soort === 'ongelijknamig';
    const boven = `${_breukHTML(oef.n1,oef.d1)}<b>${oef.op}</b>${_breukHTML(oef.n2,oef.d2)}<b>=</b>${_breukHTML(oef.teller,oef.doel,true)}`;
    if (!ongelijk) return `<div class="oefening-item breuk-oef-kort"><div class="breuk-som">${boven}</div>${del}</div>`;
    const omzet = oef.factor1 > 1
      ? { n:oef.n1, d:oef.d1, g:oef.g1, f:oef.factor1 }
      : { n:oef.n2, d:oef.d2, g:oef.g2, f:oef.factor2 };
    const uitgebreid = `${_breukHTML(oef.n1,oef.d1)}<b>${oef.op}</b>${_breukHTML(oef.n2,oef.d2)}<b>=</b>${_breukHTML(oef.g1,oef.doel,true)}<b>${oef.op}</b>${_breukHTML(oef.g2,oef.doel,true)}<b>=</b>${_breukHTML(oef.teller,oef.doel,true)}`;
    if (blok.config?.variant === 'kort') return `<div class="oefening-item breuk-oef-kort breuk-oef-keten"><div class="breuk-som breuk-som-lang">${uitgebreid}</div>${del}</div>`;
    const schema = `<div class="breuk-conversie"><div class="breuk-conv-bron">${_breukHTML(omzet.n,omzet.d)}</div><b class="breuk-conv-gelijk">=</b><div class="breuk-conv-doel">${_breukHTML(omzet.g,oef.doel,true)}</div><svg viewBox="0 0 170 108" aria-hidden="true"><path d="M28 37 C58 5 112 5 142 37"/><polygon points="144,37 135,33 141,28"/><path d="M28 71 C58 103 112 103 142 71"/><polygon points="144,71 141,80 135,75"/></svg><span class="breuk-factor boven">× <i data-antwoord="${omzet.f}"></i></span><span class="breuk-factor onder">× <i data-antwoord="${omzet.f}"></i></span></div>`;
    return `<div class="oefening-item breuk-oef-schema"><div class="breuk-som breuk-som-lang">${uitgebreid}</div><div class="breuk-schema">${schema}</div>${del}</div>`;
  }

  function _breukVermenigvuldigHTML(blok,oef,idx){
    const del=`<button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${idx})" title="Verwijder">✕</button>`;
    const antwoord=v=>`<span class="breuk-vermenigvuldig-antwoord breuk-antwoord" data-antwoord="${v}"></span>`;
    if(oef.vorm==='vraagstuk'){
      const breukTekst=`${oef.n}/${oef.d}`;
      const regel=s=>s.split(breukTekst).join(_breukHTML(oef.n,oef.d));
      const bewerking=oef.zoekGeheel
        ? [`${oef.n} breukdelen → ${oef.gegeven}`,`1 breukdeel → ${oef.gegeven} : ${oef.n} = ${oef.deelPerBreuk}`,`${oef.d} breukdelen → ${oef.d} × ${oef.deelPerBreuk} = ${oef.antwoord}`]
        : [`geheel → ${oef.gegeven}`,`1 breukdeel → ${oef.gegeven} : ${oef.d} = ${oef.deelPerBreuk}`,`${oef.n} breukdelen → ${oef.n} × ${oef.deelPerBreuk} = ${oef.antwoord}`];
      return `<div class="oefening-item breuk-vraagstuk">
        <div class="breuk-vraagstuk-tekst">${oef.regels.map(r=>`<p>${regel(r)}</p>`).join('')}<p class="vraag">${oef.vraag}</p></div>
        <div class="breuk-vraagstuk-werk">
          <div><h4>Schema:</h4><div class="breuk-vraagstuk-raster">${_toonOplossingen?`<span>${oef.zoekGeheel?'?':oef.gegeven}</span><b>${_breukHTML(oef.n,oef.d)}</b><em>${oef.gegeven}</em>`:''}</div></div>
          <div><h4>Bewerking:</h4><div class="breuk-vraagstuk-raster breuk-vraagstuk-bewerking">${bewerking.map(v=>`<span data-antwoord="${v}"></span>`).join('')}</div></div>
        </div>
        <div class="breuk-vraagstuk-antwoordzin"><b>Antwoordzin:</b><span data-antwoord="${oef.antwoordzin}"></span></div>${del}</div>`;
    }
    if(oef.vorm==='verbinden'){
      const kant=k=>oef.items.filter(i=>i.kant===k).map(i=>`<div class="breuk-verbind-item">${_breukHTML(i.n,i.d)}<b>× ${i.getal} =</b>${antwoord(i.antwoord)}<i></i></div>`).join('');
      return `<div class="oefening-item breuk-verbind-puzzel"><div class="breuk-verbind-kolom">${kant('links')}</div><div class="breuk-verbind-doelen">${oef.doelen.map(d=>`<span>${d}</span>`).join('')}</div><div class="breuk-verbind-kolom">${kant('rechts')}</div>${del}</div>`;
    }
    const links=oef.vorm==='getal-maal-breuk'?`${oef.getal} × ${_breukHTML(oef.n,oef.d)}`:`${_breukHTML(oef.n,oef.d)} ${oef.vorm==='van-getal'?'van':'×'} ${oef.getal}`;
    if(oef.vorm==='van-getal'&&blok.config?.variant==='van-getal'){
      const schrappen=_toonOplossingen
        ? `<span class="breuk-schrap-product"><span class="breuk-schrap-boven"><b>${oef.n}</b><i>×</i><b class="doorgestreept">${oef.getal}</b><sup>${oef.deel}</sup></span><span class="breuk-schrap-onder"><b class="doorgestreept">${oef.d}</b><sup>1</sup></span></span>`
        : `<span class="breuk-schrap-product breuk-product-leeg"><span class="breuk-schrap-boven"><b>${oef.n}</b><i>×</i><b>${oef.getal}</b></span><span class="breuk-schrap-onder"><b>${oef.d}</b></span></span>`;
      return `<div class="oefening-item breuk-van-getal"><div class="breuk-van-uitleg">${_breukHTML(oef.n,oef.d)} <em>van</em> ${oef.getal} = ${_breukHTML(oef.n,oef.d)} × ${oef.getal}</div><div class="breuk-van-formule">${_breukHTML(oef.n,oef.d)} × ${oef.getal} = ${schrappen} = ${antwoord(oef.antwoord)}</div><div class="breuk-werklijnen"><span data-antwoord="${oef.getal} : ${oef.d} = ${oef.deel}"></span><span data-antwoord="${oef.n} × ${oef.deel} = ${oef.antwoord}"></span></div><div class="breuk-van-slot">${_breukHTML(oef.n,oef.d)} van ${oef.getal} = ${antwoord(oef.antwoord)}</div>${del}</div>`;
    }
    let uitwerking=antwoord(oef.antwoord);
    if(_toonOplossingen&&oef.vorm==='getal-maal-breuk'){
      const heelRuw=Math.floor(oef.product/oef.d),restRuw=oef.product%oef.d;
      const ruwGemengd=restRuw?_mgGetalHTML(heelRuw,restRuw,oef.d):`<b>${heelRuw}</b>`;
      const vereenvoudigd=oef.antwoordD===1?`<b>${oef.antwoordN}</b>`:oef.heel?_mgGetalHTML(oef.heel,oef.rest,oef.antwoordD):_breukHTML(oef.antwoordN,oef.antwoordD);
      uitwerking=`<span class="breuk-vermenigvuldig-uitwerking">${_breukHTML(oef.product,oef.d)}${heelRuw?`<b>=</b>${ruwGemengd}`:''}${oef.antwoordD!==oef.d?`<b>=</b>${vereenvoudigd}`:''}</span>`;
    }
    return `<div class="oefening-item breuk-vermenigvuldig-kort"><div class="breuk-vermenigvuldig-som">${links} <b>=</b> ${uitwerking}</div>${del}</div>`;
  }

  function _maakBreukenElement(blok) {
    const div = document.createElement('div');
    div.className = 'preview-blok'; div.dataset.id = blok.id;
    const niveauLabel = blok.config.soort === 'vermenigvuldigen' ? 'Vermenigvuldigen' : blok.config.soort === 'gemengde-getallen' ? 'Gemengde getallen' : blok.config.soort === 'ongelijknamig' ? 'Ongelijknamig' : 'Gelijknamig';
    const gridExtra = blok.config.soort === 'vermenigvuldigen' ? (blok.config?.variant==='van-getal'||blok.config?.variant==='verbinden'||blok.config?.variant==='vraagstukken'?' breuk-vermenigvuldig-uitgewerkt':blok.config?.variant==='gemengd-vermenigvuldigen'?' breuk-vermenigvuldig-grid breuk-vermenigvuldig-gemengd':' breuk-vermenigvuldig-grid') : blok.config.soort === 'gemengde-getallen' ? (blok.config?.variant==='afbeelding'?' mg-grid-kijk':blok.config?.variant==='zonder'?' mg-grid-zonder':' mg-grid') : '';
    div.innerHTML = `<div class="preview-blok-header"><span class="blok-type-badge">🍰 Breuken</span><span class="blok-niveau">${niveauLabel}</span><div class="spacer"></div><div class="blok-acties"><button class="btn-blok-actie verwijder" onclick="App.verwijderBlok('${blok.id}')">✕</button></div></div><div class="preview-blok-body"><div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}">${_zinWeergave(blok)}</div><div class="oefeningen-grid breuken-grid${gridExtra}">${blok.oefeningen.map((o,i)=>_breukOefeningHTML(blok,o,i)).join('')}</div></div><div class="preview-blok-footer"><span class="footer-info">${blok.oefeningen.length} oefeningen</span><button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button></div>`;
    return div;
  }

  function _percentageOefeningHTML(blok,o,idx){
    const del=`<button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${idx})" title="Verwijder">✕</button>`;
    const invul=v=>`<span class="percentage-invul breuk-antwoord" data-antwoord="${v}"></span>`;
    const punt=(v,extra='')=>`<i class="percentage-punt breuk-antwoord ${extra}" data-antwoord="${v}">·</i>`;
    if(o.variant==='lange-breukstreep'){
      const g=(a,b)=>b?g(b,a%b):a;
      const deel=g(o.geheel,o.stapNoemer);
      const eerste=`<span class="percentage-puntbreuk"><span>${punt(o.stapTeller)}</span><span>${punt(o.stapNoemer)}</span></span>`;
      const product=`<span class="percentage-lange-breukstreep percentage-product-leeg"><span>${punt(o.stapTeller*o.geheel)}</span><span>${punt(o.stapNoemer)}</span></span><span class="percentage-lange-breukstreep percentage-product-oplossing"><span><i>${o.stapTeller}</i><b>×</b><span class="percentage-schrap-waarde"><i>${o.geheel}</i><sup>${o.geheel/deel}</sup></span></span><span><span class="percentage-schrap-waarde"><i>${o.stapNoemer}</i><sup>${o.stapNoemer/deel}</sup></span></span></span>`;
      return `<div class="oefening-item percentage-oef percentage-lang" style="grid-column:1/-1;width:100%;max-width:100%;margin:0;box-sizing:border-box;display:flex;justify-content:flex-start;overflow:visible;padding-left:20px"><span class="percentage-lang-zin">${o.procent}% van ${o.geheel} =</span>${eerste}<span class="percentage-lang-maal">× ${o.geheel} =</span>${product}<span class="percentage-lang-gelijk">=</span><span class="percentage-antwoordlijn breuk-antwoord" data-antwoord="${o.antwoord}"></span>${del}</div>`;
    }
    const viaHonderd=o.stapNoemer===100;
    const stappen=viaHonderd
      ? [
          {label:'100% →',antwoord:String(o.geheel)},
          {label:'1% →',antwoord:`${o.geheel} : 100 = ${o.eenProcent}`},
          {label:`${o.procent}% →`,antwoord:`${o.procent} × ${o.eenProcent} = ${o.antwoord}`}
        ]
      : [
          {label:'geheel →',antwoord:String(o.geheel)},
          {label:'1 breukdeel →',antwoord:`${o.geheel} : ${o.stapNoemer} = ${o.eenBreukdeel}`},
          {label:`${o.stapTeller} breukdelen →`,antwoord:`${o.stapTeller} × ${o.eenBreukdeel} = ${o.antwoord}`}
        ];
    return `<div class="oefening-item percentage-oef percentage-stappen"><h3>Hoeveel is <span>${o.procent}%</span> van ${o.geheel}?</h3><div class="percentage-pijl"></div><div class="percentage-omzet">${o.procent}% = ${_breukHTML(o.stapTeller,o.stapNoemer,true)}</div><div class="percentage-stapregels">${stappen.map(v=>`<div><b>${v.label}</b><span class="breuk-antwoord" data-antwoord="${v.antwoord}"></span></div>`).join('')}</div><div class="percentage-slot"><b>${o.procent}% van ${o.geheel} =</b>${invul(o.antwoord)}</div>${del}</div>`;
  }

  function _maakPercentageElement(blok){
    const div=document.createElement('div');div.className='preview-blok';div.dataset.id=blok.id;
    div.innerHTML=`<div class="preview-blok-header percentage-header"><span class="blok-type-badge">📊 Percentages</span><span class="blok-niveau">${blok.config.variant==='stappen'?'Met verhoudingstappen':'Lange breukstreep'}</span><div class="spacer"></div><button class="btn-blok-actie verwijder" onclick="App.verwijderBlok('${blok.id}')">✕</button></div><div class="preview-blok-body"><div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}">${_zinWeergave(blok)}</div><div class="oefeningen-grid percentage-grid percentage-grid-${blok.config.variant}" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;max-width:100%;overflow:visible;box-sizing:border-box">${blok.oefeningen.map((o,i)=>_percentageOefeningHTML(blok,o,i)).join('')}</div></div><div class="preview-blok-footer"><span class="footer-info">${blok.oefeningen.length} oefeningen</span><button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button></div>`;
    return div;
  }

  function _kommaGetalOefHTML(blok,o,idx){
    const del=`<button class="btn-del-oef" onclick="App.verwijderOefening('${blok.id}',${idx})" title="Verwijder">✕</button>`;
    const ant=`<span class="komma-antwoord breuk-antwoord" data-antwoord="${o.antwoord}"></span>`;
    const mooi=n=>o.decimalen===2?Kommagetallen.fmt100(n):(n%10===0?String(n/10):Kommagetallen.fmt(n));
    const leeg=(waarde,cls='')=>`<span class="komma-strategie-lijn breuk-antwoord ${cls}" data-antwoord="${waarde}"></span>`;
    const schijven=(aantal,label,weg=0)=>Array.from({length:aantal},(_,i)=>`<i class="komma-schijf ${i>=aantal-weg?'weg':''}">${label}</i>`).join('');
    const strategieWaarde=(waarde,cls='')=>o.voorbeeld?`<span class="${cls} komma-voorbeeld-antwoord">${waarde}</span>`:`<span class="${cls} breuk-antwoord" data-antwoord="${waarde}"></span>`;
    if(o.variant==='vermenigvuldigen-nulregel')return `<div class="oefening-item komma-oef komma-nulregel"><span>${o.aTekst} × ${o.bTekst} =</span><span class="komma-antwoord breuk-antwoord" data-antwoord="${o.antwoord}"></span>${del}</div>`;
    if(o.variant==='vermenigvuldigen-factoren')return `<div class="oefening-item komma-oef komma-factoren"><div><span>${o.kommaTekst} × ${o.geheelTekst}</span><b>=</b><span class="breuk-antwoord" data-antwoord="${o.ontbinding}"></span></div><div><b>=</b><span class="breuk-antwoord" data-antwoord="${o.schakeling}"></span></div><div><b>=</b><span class="breuk-antwoord" data-antwoord="${o.tussenstap}"></span></div><div class="komma-factoren-product"><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    if(o.variant==='delen-nulregel')return `<div class="oefening-item komma-oef komma-nulregel"><span>${o.deeltalTekst} : ${o.delerTekst} =</span><span class="komma-antwoord breuk-antwoord" data-antwoord="${o.antwoord}"></span>${del}</div>`;
    if(o.variant==='delen-factoren')return `<div class="oefening-item komma-oef komma-factoren komma-deel-factoren"><div><span>${o.deeltalTekst} : ${o.delerTekst}</span><b>=</b><span class="breuk-antwoord" data-antwoord="${o.ontbinding}"></span></div><div><b>=</b><span class="breuk-antwoord" data-antwoord="${o.tussenstap}"></span></div><div class="komma-factoren-product"><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    if(o.variant==='delen-haakjes'||o.variant==='delen-zelf'){
      const eerste=o.variant==='delen-haakjes'
        ? `<span>${o.deeltalTekst} : ${o.deler} = (</span><span class="komma-deel-vak breuk-antwoord" data-antwoord="${o.eersteDeel} : ${o.deler}"></span><span>) + (</span><span class="komma-deel-vak breuk-antwoord" data-antwoord="${o.tweedeDeelTekst} : ${o.deler}"></span><span>)</span>`
        : `<span>${o.deeltalTekst} : ${o.deler} =</span><span class="komma-maal-regel breuk-antwoord" data-antwoord="${o.splitsing}"></span>`;
      return `<div class="oefening-item komma-oef komma-vermenigvuldigen komma-delen"><div class="komma-maal-eerste">${eerste}</div><div class="komma-maal-stap"><b>=</b><span class="breuk-antwoord" data-antwoord="${o.tussenstap}"></span></div><div class="komma-maal-stap komma-maal-product"><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    }
    if(o.variant==='vermenigvuldigen-compenseren-haakjes'||o.variant==='vermenigvuldigen-compenseren-zelf'){
      const eerste=o.variant==='vermenigvuldigen-compenseren-haakjes'
        ? `<span>${o.factor} × ${o.kommaTekst} = (</span><span class="komma-maal-comp-vak breuk-antwoord" data-antwoord="${o.factor} × ${o.afgerond}"></span><span>) − (</span><span class="komma-maal-comp-vak breuk-antwoord" data-antwoord="${o.factor} × ${o.correctieTekst}"></span><span>)</span>`
        : `<span>${o.factor} × ${o.kommaTekst} =</span><span class="komma-maal-regel breuk-antwoord" data-antwoord="${o.compensatie}"></span>`;
      return `<div class="oefening-item komma-oef komma-vermenigvuldigen komma-vermenigvuldigen-compenseren"><div class="komma-maal-eerste">${eerste}</div><div class="komma-maal-stap"><b>=</b><span class="breuk-antwoord" data-antwoord="${o.tussenstap}"></span></div><div class="komma-maal-stap komma-maal-product"><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    }
    if(o.variant==='vermenigvuldigen-haakjes'||o.variant==='vermenigvuldigen-zelf'){
      const eerste=o.variant==='vermenigvuldigen-haakjes'
        ? `<span>${o.factor} × ${o.kommaTekst} = (</span><span class="komma-maal-klein breuk-antwoord" data-antwoord="${o.factor}"></span><span>×</span><span class="komma-maal-klein breuk-antwoord" data-antwoord="${o.geheel}"></span><span>) + (</span><span class="komma-maal-klein breuk-antwoord" data-antwoord="${o.factor}"></span><span>×</span><span class="komma-maal-klein breuk-antwoord" data-antwoord="0,${o.tienden}"></span><span>)</span>`
        : `<span>${o.factor} × ${o.kommaTekst} =</span><span class="komma-maal-regel breuk-antwoord" data-antwoord="${o.splitsing}"></span>`;
      return `<div class="oefening-item komma-oef komma-vermenigvuldigen"><div class="komma-maal-eerste">${eerste}</div><div class="komma-maal-stap"><b>=</b><span class="breuk-antwoord" data-antwoord="${o.tussenstap}"></span></div><div class="komma-maal-stap komma-maal-product"><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    }
    if(o.puzzel)return `<div class="oefening-item komma-oef komma-getalpuzzel"><div class="komma-puzzel-ring"><span class="puzzel-getal boven">${o.decimalen===2?Kommagetallen.fmt100(o.waarden[0]):Kommagetallen.fmt(o.waarden[0])}</span><span class="puzzel-getal rechts breuk-antwoord" data-antwoord="${o.antwoorden[0]}"></span><span class="puzzel-getal onder">${o.decimalen===2?Kommagetallen.fmt100(o.waarden[2]):Kommagetallen.fmt(o.waarden[2])}</span><span class="puzzel-getal links breuk-antwoord" data-antwoord="${o.antwoorden[1]}"></span>${o.bewerkingen.map((b,i)=>`<span class="puzzel-bewerking b${i}">${b}</span>`).join('')}</div>${del}</div>`;
    if(o.variant==='aftrek-kort-honderdsten-brug'||o.variant==='aftrek-kort-honderdsten-gemengd')return `<div class="oefening-item komma-oef komma-kort-honderdsten"><span>${o.aTekst} − ${o.bTekst} =</span><span class="komma-brug-lange-lijn breuk-antwoord" data-antwoord="${o.antwoord}"></span>${del}</div>`;
    if(o.variant==='kort-honderdsten-gemengd')return `<div class="oefening-item komma-oef komma-kort-honderdsten"><span>${o.aTekst} + ${o.bTekst} =</span><span class="komma-brug-lange-lijn breuk-antwoord" data-antwoord="${o.antwoord}"></span>${del}</div>`;
    if(o.variant==='aftrek-honderdsten-brug')return `<div class="oefening-item komma-oef komma-honderdsten"><div>${o.aTekst} − ${o.bTekst} = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.aHonderdsten}"></span> h − <span class="komma-lijn breuk-antwoord" data-antwoord="${o.bHonderdsten}"></span> h = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.verschilHonderdsten}"></span> h = ${ant}</div>${del}</div>`;
    if(o.variant==='aftrek-splitsen-honderdsten-brug')return `<div class="oefening-item komma-oef komma-splits-honderdsten"><div class="komma-h-hoofdsom"><span>${o.aTekst} −</span><span class="komma-h-term"><span>${o.bTekst}</span><span class="komma-h-splitsbeen"><svg viewBox="0 0 180 38" preserveAspectRatio="none"><line x1="90" y1="0" x2="30" y2="38"/><line x1="90" y1="0" x2="90" y2="38"/><line x1="90" y1="0" x2="150" y2="38"/></svg>${[0,1,2].map(i=>`<span class="komma-vak breuk-antwoord" data-antwoord="${o.deelTeksten[i]||''}"></span>`).join('')}</span></span><span>= ${ant}</span></div><div class="komma-h-stappen">${[0,1,2].map(i=>`<span class="breuk-antwoord" data-antwoord="${o.stappen[i]||''}"></span>`).join('')}</div>${del}</div>`;
    if(o.variant==='aftrek-compenseren-honderdsten')return `<div class="oefening-item komma-oef komma-strategie komma-compenseren komma-aftrek-compenseren komma-h-comp"><div class="komma-strategie-som"><span>${o.aTekst}</span><b>−</b><span class="komma-rond-term">${o.bTekst}</span><b>=</b>${ant}</div><div class="komma-comp-werk"><div class="komma-comp-correctie"><span class="breuk-antwoord" data-antwoord="− ${Kommagetallen.fmt100(o.afgerond)} + ${Kommagetallen.fmt100(o.correctie)}"></span></div><div class="komma-schrijfregels"><i class="breuk-antwoord" data-antwoord="${o.aTekst} − ${Kommagetallen.fmt100(o.afgerond)} = ${Kommagetallen.fmt100(o.tussenverschil)}"></i><i class="breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.tussenverschil)} + ${Kommagetallen.fmt100(o.correctie)} = ${o.antwoord}"></i></div></div>${del}</div>`;
    if(o.variant==='aftrek-transformeren-honderdsten'){
      const corr=`+ ${Kommagetallen.fmt100(o.transformCorr)}`;
      const schema=blok.config.toonAftrekTransformSchemaH?`<div class="komma-aftrek-trans-schema komma-h-aftrek-trans-schema"><span class="correctie breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.transformCorr)}"></span><span class="term-a">${o.aTekst}</span><span class="correctie breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.transformCorr)}"></span><span class="term-b">${o.bTekst}</span><span class="vraag">?</span></div>`:'';
      return `<div class="oefening-item komma-oef komma-aftrek-transform komma-h-aftrek-transform ${schema?'met-schema':''}">${schema}<div class="komma-aftrek-trans-som"><span>${o.aTekst}</span><b>−</b><span>${o.bTekst}</span><b>=</b>${ant}</div><div class="komma-aftrek-trans-pijlen"><span><i class="breuk-antwoord" data-antwoord="${corr}"></i><b>↓</b></span><span><i class="breuk-antwoord" data-antwoord="${corr}"></i><b>↓</b></span></div><div class="komma-aftrek-trans-nieuw"><span class="breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.nieuwA)}"></span><b>−</b><span class="breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.nieuwB)}"></span><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    }
    if(o.variant==='aftrek-schijfjes-honderdsten')return `<div class="oefening-item komma-oef komma-h-schijfjes"><div class="komma-h-plaats"><div class="komma-h-plaats-kop"><b>E</b><b>,</b><b>t</b><b>h</b></div><div class="komma-h-plaats-rij"><span>${schijven(o.aE,'1',o.bE)}</span><span></span><span>${schijven(o.aT,'0,1',o.bT)}</span><span>${schijven(o.aH,'0,01',o.bH)}</span></div></div><div class="komma-h-schijf-som">${o.aTekst} − ${o.bTekst} = <span class="komma-antwoord breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    if(o.variant==='aftrek-honderdsten')return `<div class="oefening-item komma-oef komma-honderdsten"><div>${o.aTekst} − ${o.bTekst} = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.aHonderdsten}"></span> h − <span class="komma-lijn breuk-antwoord" data-antwoord="${o.bHonderdsten}"></span> h = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.verschilHonderdsten}"></span> h = ${ant}</div>${del}</div>`;
    if(o.variant==='aftrek-splitsen-honderdsten')return `<div class="oefening-item komma-oef komma-splits-honderdsten"><div class="komma-h-hoofdsom"><span>${o.aTekst} −</span><span class="komma-h-term"><span>${o.bTekst}</span><span class="komma-h-splitsbeen"><svg viewBox="0 0 180 38" preserveAspectRatio="none"><line x1="90" y1="0" x2="30" y2="38"/><line x1="90" y1="0" x2="90" y2="38"/><line x1="90" y1="0" x2="150" y2="38"/></svg>${[0,1,2].map(i=>`<span class="komma-vak breuk-antwoord" data-antwoord="${o.deelTeksten[i]||''}"></span>`).join('')}</span></span><span>= ${ant}</span></div><div class="komma-h-stappen">${[0,1,2].map(i=>`<span class="breuk-antwoord" data-antwoord="${o.stappen[i]||''}"></span>`).join('')}</div>${del}</div>`;
    if(o.variant==='aftrek-kort-honderdsten')return `<div class="oefening-item komma-oef komma-kort-honderdsten"><span>${o.aTekst} − ${o.bTekst} =</span><span class="komma-brug-lange-lijn breuk-antwoord" data-antwoord="${o.antwoord}"></span>${del}</div>`;
    if(o.variant==='honderdsten'||o.variant==='honderdsten-brug')return `<div class="oefening-item komma-oef komma-honderdsten"><div>${o.aTekst} + ${o.bTekst} = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.aHonderdsten}"></span> h + <span class="komma-lijn breuk-antwoord" data-antwoord="${o.bHonderdsten}"></span> h = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.somHonderdsten}"></span> h = ${ant}</div>${del}</div>`;
    if(o.variant==='tussenstappen-honderdsten-brug')return `<div class="oefening-item komma-oef komma-h-werk"><div class="komma-h-werk-som"><span>${o.aTekst} + ${o.bTekst} =</span>${ant}</div><div class="komma-h-werk-regels">${Array.from({length:3},(_,i)=>`<span class="breuk-antwoord" data-antwoord="${o.stappen[i]||''}"></span>`).join('')}</div>${del}</div>`;
    if(o.variant==='splitsen-honderdsten'||o.variant==='splitsen-honderdsten-brug')return `<div class="oefening-item komma-oef komma-splits-honderdsten"><div class="komma-h-hoofdsom"><span>${o.aTekst} +</span><span class="komma-h-term"><span>${o.bTekst}</span><span class="komma-h-splitsbeen"><svg viewBox="0 0 180 38" preserveAspectRatio="none"><line x1="90" y1="0" x2="30" y2="38"/><line x1="90" y1="0" x2="90" y2="38"/><line x1="90" y1="0" x2="150" y2="38"/></svg>${o.deelTeksten.map(d=>`<span class="komma-vak breuk-antwoord" data-antwoord="${d}"></span>`).join('')}</span></span><span>= ${ant}</span></div><div class="komma-h-stappen">${o.stappen.map(s=>`<span class="breuk-antwoord" data-antwoord="${s}"></span>`).join('')}</div>${del}</div>`;
    if(o.variant==='kort-honderdsten'||o.variant==='kort-honderdsten-brug')return `<div class="oefening-item komma-oef komma-kort-honderdsten"><span>${o.aTekst} + ${o.bTekst} =</span><span class="komma-brug-lange-lijn breuk-antwoord" data-antwoord="${o.antwoord}"></span>${del}</div>`;
    if(o.variant==='compenseren-honderdsten')return `<div class="oefening-item komma-oef komma-strategie komma-compenseren komma-h-comp"><div class="komma-strategie-som"><span>${o.aTekst}</span><b>+</b><span class="komma-rond-term">${o.bTekst}</span><b>=</b>${ant}</div><div class="komma-comp-werk"><div class="komma-comp-correctie"><span class="breuk-antwoord" data-antwoord="+ ${Kommagetallen.fmt100(o.afgerond)} − ${Kommagetallen.fmt100(o.correctie)}"></span></div><div class="komma-schrijfregels"><i class="breuk-antwoord" data-antwoord="${o.aTekst} + ${Kommagetallen.fmt100(o.afgerond)} = ${Kommagetallen.fmt100(o.tussensom)}"></i><i class="breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.tussensom)} − ${Kommagetallen.fmt100(o.correctie)} = ${o.antwoord}"></i></div></div>${del}</div>`;
    if(o.variant==='transformeren-honderdsten'){
      const corrA=`${o.corrA>0?'+':'−'} ${Kommagetallen.fmt100(Math.abs(o.corrA))}`,corrB=`${o.corrB>0?'+':'−'} ${Kommagetallen.fmt100(Math.abs(o.corrB))}`;
      const schema=blok.config.toonTransformSchemaH?`<div class="komma-h-trans-schema"><span class="blauw">${o.aTekst}</span><span class="geel">${o.bTekst}</span><span class="blauw breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.nieuwA)}"></span><span class="geel breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.nieuwB)}"></span></div>`:'';
      return `<div class="oefening-item komma-oef komma-h-transform ${blok.config.toonTransformSchemaH?'met-schema':''}">${schema}<div class="komma-h-trans-som"><span>${o.aTekst}</span><b>+</b><span>${o.bTekst}</span><b>=</b>${ant}</div><div class="komma-h-trans-pijlen"><span><i class="breuk-antwoord" data-antwoord="${corrA}"></i><b>↓</b></span><span><i class="breuk-antwoord" data-antwoord="${corrB}"></i><b>↓</b></span></div><div class="komma-h-trans-nieuw"><span class="breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.nieuwA)}"></span><b>+</b><span class="breuk-antwoord" data-antwoord="${Kommagetallen.fmt100(o.nieuwB)}"></span><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    }
    if(o.rooster){
      const teken=o.bewerking==='aftrekken'?'−':'+';
      return `<div class="oefening-item komma-oef komma-rooster-oef"><table class="komma-rekenrooster"><thead><tr><th class="rooster-hoek"><span>${teken}</span></th>${o.kolommen.map(k=>`<th>${mooi(k)}</th>`).join('')}</tr></thead><tbody>${o.rijen.map((r,ri)=>`<tr><th>${mooi(r)}</th>${o.kolommen.map((_,ki)=>`<td><span class="breuk-antwoord" data-antwoord="${o.antwoorden[ri][ki]}"></span></td>`).join('')}</tr>`).join('')}</tbody></table>${del}</div>`;
    }
    if(o.variant==='aftrek-brug-splitsen'){const eerste=o.aT===0&&o.bE===0;return `<div class="oefening-item komma-oef komma-aftrek-brug-splits ${o.voorbeeld?'komma-voorbeeld':''}">${o.voorbeeld?'<span class="komma-voorbeeld-label">Voorbeeld</span>':''}<div class="komma-brug-hoofd komma-brug-somdelen"><span>${o.aTekst}</span><b>−</b><span>${o.bTekst}</span><b>=</b>${strategieWaarde(o.antwoord,'komma-brug-antwoord')}</div><div class="komma-split-boom ${eerste?'split-eerste':'split-tweede'}"><i></i>${strategieWaarde(o.split1Tekst,'komma-split-vak')}${strategieWaarde(o.split2Tekst,'komma-split-vak')}</div><div class="komma-brug-stappen">${strategieWaarde(o.stap1,'komma-brug-lijn')}${strategieWaarde(o.stap2,'komma-brug-lijn')}</div>${del}</div>`;}
    if(o.variant==='aftrek-brug-schijfjes'){
      const heleBoven=Math.max(0,o.aE-1),wegHele=Math.min(o.bE,heleBoven);
      return `<div class="oefening-item komma-oef komma-aftrek-brug-schema ${o.voorbeeld?'komma-voorbeeld':''}"><div class="komma-wissel-schema"><div class="komma-wissel-kop"><b>E</b><b>,</b><b>t</b></div><div class="komma-wissel-boven"><span>${schijven(heleBoven,'1',wegHele)}</span><span>${schijven(o.aT,'0,1')}</span></div><div class="komma-wissel-onder"><span>${schijven(1,'1',1)}</span><span>${schijven(10,'0,1',o.bT)}</span></div></div><div class="komma-brug-hoofd"><span>${o.aTekst} − ${o.bTekst} =</span>${strategieWaarde(o.antwoord,'komma-brug-antwoord')}</div><div class="komma-brug-stappen">${strategieWaarde(o.stap1,'komma-brug-lijn')}${strategieWaarde(o.stap2,'komma-brug-lijn')}</div>${del}</div>`;
    }
    if(o.variant==='aftrek-brug-tienden')return `<div class="oefening-item komma-oef komma-tienden komma-brug-tienden"><div>${o.aTekst} − ${o.bTekst} = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.a}"></span> t − <span class="komma-lijn breuk-antwoord" data-antwoord="${o.b}"></span> t = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.verschil}"></span> t = ${ant}</div>${del}</div>`;
    if(o.variant==='aftrek-brug-aanvullen')return `<div class="oefening-item komma-oef komma-aanvullen komma-brug-aanvullen"><div class="komma-aanvul-balk"><div>${o.aTekst}</div><div>${o.bTekst}</div><div class="komma-aanvul-vraag">?</div></div><div class="komma-aanvul-regels"><span>${o.aTekst} − ${o.bTekst} = ${ant}</span><b>want</b><span>${o.bTekst} + <span class="komma-lijn breuk-antwoord" data-antwoord="${o.antwoord}"></span> = ${o.aTekst}</span></div>${del}</div>`;
    if(o.variant==='aftrek-brug-kort')return `<div class="oefening-item komma-oef komma-brug-kort"><span>${o.aTekst} − ${o.bTekst} =</span><span class="komma-brug-lange-lijn breuk-antwoord" data-antwoord="${o.antwoord}"></span>${del}</div>`;
    if(o.variant==='aftrek-schijfjes')return `<div class="oefening-item komma-oef komma-aftrek-schijfjes"><div class="komma-plaats-schema"><div class="komma-plaats-kop"><b>E</b><b>t</b></div><div class="komma-plaats-rij"><span>${schijven(o.aE,'1',o.bE)}</span><span>${schijven(o.aT,'0,1',o.bT)}</span></div></div><div class="komma-aftrek-som">${o.aTekst} − ${o.bTekst} = ${ant}</div>${del}</div>`;
    if(o.variant==='aftrek-tienden')return `<div class="oefening-item komma-oef komma-tienden"><div>${o.aTekst} − ${o.bTekst} = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.a}"></span> t − <span class="komma-lijn breuk-antwoord" data-antwoord="${o.b}"></span> t = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.verschil}"></span> t = ${ant}</div>${del}</div>`;
    if(o.variant==='aftrek-aanvullen')return `<div class="oefening-item komma-oef komma-aanvullen"><div class="komma-aanvul-balk"><div>${o.aTekst}</div><div>${o.bTekst}</div><div class="komma-aanvul-vraag">?</div></div><div class="komma-aanvul-regels"><span>${o.aTekst} − ${o.bTekst} = ${ant}</span><span>${o.bTekst} + <span class="komma-lijn breuk-antwoord" data-antwoord="${o.antwoord}"></span> = ${o.aTekst}</span></div>${del}</div>`;
    if(o.variant==='aftrek-kort')return `<div class="oefening-item komma-oef komma-kort"><span>${o.aTekst} − ${o.bTekst} =</span>${ant}${del}</div>`;
    if(o.variant==='aftrek-brug-compenseren'){
      return `<div class="oefening-item komma-oef komma-strategie komma-compenseren komma-aftrek-compenseren"><div class="komma-strategie-som"><span>${o.aTekst}</span><b>−</b><span class="komma-rond-term">${o.bTekst}</span><b>=</b>${ant}</div><div class="komma-comp-werk"><div class="komma-comp-correctie"><span class="breuk-antwoord" data-antwoord="− ${mooi(o.afgerond)} + ${mooi(o.correctie)}"></span></div><div class="komma-schrijfregels"><i class="breuk-antwoord" data-antwoord="${o.aTekst} − ${mooi(o.afgerond)} = ${mooi(o.tussenverschil)}"></i><i class="breuk-antwoord" data-antwoord="${mooi(o.tussenverschil)} + ${mooi(o.correctie)} = ${o.antwoord}"></i></div></div>${del}</div>`;
    }
    if(o.variant==='aftrek-brug-transformeren'){
      const corr=`${o.transformCorr>0?'+':'−'} ${mooi(Math.abs(o.transformCorr))}`;
      return `<div class="oefening-item komma-oef komma-aftrek-transform ${o.transformCorr>0?'transform-plus':'transform-min'}"><div class="komma-aftrek-trans-schema"><span class="correctie breuk-antwoord" data-antwoord="${corr}"></span><span class="term-a">${o.aTekst}</span><span class="correctie breuk-antwoord" data-antwoord="${corr}"></span><span class="term-b">${o.bTekst}</span><span class="vraag">?</span></div><div class="komma-aftrek-trans-som"><span>${o.aTekst}</span><b>−</b><span>${o.bTekst}</span><b>=</b>${ant}</div><div class="komma-aftrek-trans-pijlen"><span><i class="breuk-antwoord" data-antwoord="${corr}"></i><b>↓</b></span><span><i class="breuk-antwoord" data-antwoord="${corr}"></i><b>↓</b></span></div><div class="komma-aftrek-trans-nieuw"><span class="breuk-antwoord" data-antwoord="${mooi(o.nieuwA)}"></span><b>−</b><span class="breuk-antwoord" data-antwoord="${mooi(o.nieuwB)}"></span><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    }
    if(o.variant==='compenseren'){
      return `<div class="oefening-item komma-oef komma-strategie komma-compenseren"><div class="komma-strategie-som"><span>${o.aTekst}</span><b>+</b><span class="komma-rond-term">${o.bTekst}</span><b>=</b>${ant}</div><div class="komma-comp-werk"><div class="komma-comp-correctie"><span class="breuk-antwoord" data-antwoord="+ ${mooi(o.afgerond)} − ${mooi(o.correctie)}"></span></div><div class="komma-schrijfregels"><i class="breuk-antwoord" data-antwoord="${o.aTekst} + ${mooi(o.afgerond)} = ${mooi(o.tussensom)}"></i><i class="breuk-antwoord" data-antwoord="${mooi(o.tussensom)} − ${mooi(o.correctie)} = ${o.antwoord}"></i></div></div>${del}</div>`;
    }
    if(o.variant==='transformeren'){
      const corr=mooi(o.verschuif);
      return `<div class="oefening-item komma-oef komma-strategie komma-transform"><div class="komma-trans-balk"><span class="blauw">${o.aTekst}</span><span class="geel">${o.bTekst}</span><span class="blauw onder breuk-antwoord" data-antwoord="${mooi(o.nieuwA)}"></span><span class="geel onder breuk-antwoord" data-antwoord="${mooi(o.nieuwB)}"></span></div><div class="komma-strategie-som">${o.aTekst}<b>+</b>${o.bTekst}<b>=</b>${ant}</div><div class="komma-trans-onder"><span class="komma-trans-term"><b>↓</b><i class="breuk-antwoord" data-antwoord="− ${corr}"></i></span><span class="komma-trans-term"><b>↓</b><i class="breuk-antwoord" data-antwoord="+ ${corr}"></i></span></div><div class="komma-trans-nieuw"><span class="breuk-antwoord" data-antwoord="${mooi(o.nieuwA)}"></span><b>+</b><span class="breuk-antwoord" data-antwoord="${mooi(o.nieuwB)}"></span><b>=</b><span class="breuk-antwoord" data-antwoord="${o.antwoord}"></span></div>${del}</div>`;
    }
    if(o.variant==='tienden')return `<div class="oefening-item komma-oef komma-tienden"><div>${o.aTekst} + ${o.bTekst} = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.a}"></span> t + <span class="komma-lijn breuk-antwoord" data-antwoord="${o.b}"></span> t = <span class="komma-lijn breuk-antwoord" data-antwoord="${o.som}"></span> t = ${ant}</div>${del}</div>`;
    if(o.variant==='splitsen'){
      const deel1=o.deel1??o.naar,deel2=o.deel2??o.rest,tussen=o.a+deel1;
      return `<div class="oefening-item komma-oef komma-splits"><div class="komma-hoofdsom"><span>${o.aTekst} +</span><span class="komma-term-splits"><span>${o.bTekst}</span><span class="komma-splitsbeen"><span class="komma-vak breuk-antwoord" data-antwoord="${mooi(deel1)}"></span><span class="komma-vak breuk-antwoord" data-antwoord="${mooi(deel2)}"></span></span></span><span>= ${ant}</span></div><div class="komma-tussenlijnen"><span class="breuk-antwoord" data-antwoord="${o.aTekst} + ${mooi(deel1)} = ${mooi(tussen)}"></span><span class="breuk-antwoord" data-antwoord="${mooi(tussen)} + ${mooi(deel2)} = ${o.antwoord}"></span></div>${del}</div>`;
    }
    return `<div class="oefening-item komma-oef komma-kort"><span>${o.aTekst} + ${o.bTekst} =</span>${ant}${del}</div>`;
  }
  function _maakKommaGetallenElement(blok){
    const div=document.createElement('div');div.className=`preview-blok${['vermenigvuldigen','delen'].includes(blok.config.bewerking)?' komma-vermenigvuldig-blok':''}`;div.dataset.id=blok.id;
    const brugLabel=blok.config.brug==='gemengd'?'gemengd':blok.config.brug==='met'?'met brug':'zonder brug';
    const niveauLabel=blok.config.decimalen===2?'Tot op een honderdste':'Tot op een tiende';
    const bewerkingLabel=blok.config.bewerking==='delen'?'delen':blok.config.bewerking==='vermenigvuldigen'?'vermenigvuldigen':blok.config.bewerking==='gemengd'?'optellen en aftrekken':blok.config.bewerking==='aftrekken'?'aftrekken':'optellen';
    const strategieLabel=blok.config.bewerking==='delen'?(blok.config.variant==='delen-nulregel'?'nulregel':blok.config.variant==='delen-factoren'?'ontbinden in factoren':blok.config.restsoort==='gemengd'?'gemengd met en zonder rest':blok.config.restsoort==='met'?'met rest':'zonder rest'):blok.config.bewerking==='vermenigvuldigen'?(blok.config.variant==='vermenigvuldigen-nulregel'?'nulregel':blok.config.variant==='vermenigvuldigen-factoren'?'ontbinden in factoren':blok.config.variant.includes('compenseren')?'compenseren':'splitsen en verdelen'):brugLabel;
    const zinWeergave=['vermenigvuldigen','delen'].includes(blok.config.bewerking)?_zinWeergave(blok).replace(/\. /g,'.<br>'):_zinWeergave(blok);
    div.innerHTML=`<div class="preview-blok-header komma-header"><span class="blok-type-badge">🔢 Kommagetallen</span><span class="blok-niveau">${niveauLabel} · ${bewerkingLabel} · ${strategieLabel}</span><div class="spacer"></div><button class="btn-blok-actie verwijder" onclick="App.verwijderBlok('${blok.id}')">✕</button></div><div class="preview-blok-body"><div class="opdrachtzin-wrapper" id="zin-wrapper-${blok.id}">${zinWeergave}</div><div class="oefeningen-grid komma-getallen-grid komma-${blok.config.variant}">${blok.oefeningen.map((o,i)=>_kommaGetalOefHTML(blok,o,i)).join('')}</div></div><div class="preview-blok-footer"><span class="footer-info">${blok.oefeningen.length} oefeningen</span><button class="btn-add-oef" onclick="App.voegOefeningToe('${blok.id}')">+ Oefening</button></div>`;return div;
  }

  return { render, toonZinEditor, toggleOplossingen };
})();
