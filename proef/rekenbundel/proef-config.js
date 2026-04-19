/* ══════════════════════════════════════════════════════════════════════════
   proef-config.js — Rekenbundel-proef voor probeer-zisa
   ──────────────────────────────────────────────────────────────────────────
   Wat doet dit bestand?

   1. Verbindt met Firebase project 'probeer-zisa' (Spark plan)
   2. Logt bezoeker anoniem in → krijgt unieke UID
   3. Haalt kill-switch-instellingen op uit Firestore:
        instellingen/gratis_rekenbundel → { actief, start_datum, eind_datum, max_per_bezoeker }
   4. Haalt teller op voor deze UID:
        proef-rekenbundel/{uid} → { teller: 0..3 }
   5. Beslist: blokkade tonen OF app doorlaten
   6. Toont banner bovenaan met "Nog X van 3 gratis bundels"
   7. Hook op App.downloadPDF → verhoogt teller na succesvolle download
   8. Hook op App.downloadSleutel → blokkeert met PRO-promo popup

   BELANGRIJK: dit bestand wordt geladen IN de <head> van index.html,
   vóór alle andere scripts. Het toont een laad-scherm tot de check klaar is.
   ══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── Firebase-config voor probeer-zisa project ──────────────────────────
  const firebaseConfig = {
    apiKey: "AIzaSyCq6Yy-rGVmKjZgqETvz_ZgupgjnDduzYo",
    authDomain: "probeer-zisa.firebaseapp.com",
    projectId: "probeer-zisa",
    storageBucket: "probeer-zisa.firebasestorage.app",
    messagingSenderId: "670942957144",
    appId: "1:670942957144:web:68bace33ae4a5e8e2b442d"
  };

  // ── Webshop-link (voor "Bekijk aanbod" knoppen) ────────────────────────
  const WEBSHOP_URL = 'https://www.jufzisa.be/spelgenerator-app';

  // ── State die we onderweg invullen ─────────────────────────────────────
  let _app, _auth, _db, _uid;
  let _instellingen = null;
  let _teller = 0;
  let _mag_laden = false;   // zodra true: de rekenbundel-app mag opstarten

  // ══════════════════════════════════════════════════════════════════════
  // STUB voor VraagstukkenModule
  // In de proef is vraagstukken.js NIET geladen. Maar sommige onclick
  // handlers in index.html verwijzen ernaar (bv. VraagstukkenModule._filterNiveaus).
  // We maken een veilige stub zodat er niets crasht.
  // Gebruikers zien nooit dit tabblad werken dankzij de toonBewerking hook.
  // ══════════════════════════════════════════════════════════════════════
  window.VraagstukkenModule = {
    init: function() {},
    _filterNiveaus: function() {},
    _kiesBewerking: function() {},
    _toonSchemaVoorbeeld: function() {},
  };

  // ══════════════════════════════════════════════════════════════════════
  // LAADSCHERM — tonen zodra dit script start, verwijderen als app geladen
  // ══════════════════════════════════════════════════════════════════════

  function _toonLaadscherm() {
    const div = document.createElement('div');
    div.id = 'proef-laadscherm';
    div.innerHTML = `
      <style>
        #proef-laadscherm {
          position: fixed; inset: 0; z-index: 99999;
          background: linear-gradient(135deg, #ffcf56 0%, #e8b800 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Nunito Sans', Arial, sans-serif;
        }
        #proef-laadscherm .box {
          background: #fff; border-radius: 16px; padding: 40px 50px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.15); text-align: center;
          max-width: 400px;
        }
        #proef-laadscherm h2 {
          color: #2a2a2a; font-size: 1.4rem; margin-bottom: 12px;
          font-family: 'Nunito', Arial, sans-serif; font-weight: 800;
        }
        #proef-laadscherm p {
          color: #666; font-size: 0.95rem; line-height: 1.5;
        }
        #proef-laadscherm .spinner {
          width: 40px; height: 40px; margin: 0 auto 20px;
          border: 4px solid #f0ede8; border-top-color: #ffcf56;
          border-radius: 50%; animation: proef-spin 0.8s linear infinite;
        }
        @keyframes proef-spin { to { transform: rotate(360deg); } }
      </style>
      <div class="box">
        <div class="spinner"></div>
        <h2>Proef wordt geladen…</h2>
        <p>Even geduld, we checken je gratis bundels.</p>
      </div>`;
    document.documentElement.appendChild(div);
  }

  function _verbergLaadscherm() {
    const div = document.getElementById('proef-laadscherm');
    if (div) div.remove();
  }

  _toonLaadscherm();

  // ══════════════════════════════════════════════════════════════════════
  // BLOKKADE-SCHERMEN — vervangen de hele app als iets niet mag
  // ══════════════════════════════════════════════════════════════════════

  function _toonBlokkade(titel, tekst, knopTekst) {
    _verbergLaadscherm();
    // Verberg de echte app — we willen niet dat er per ongeluk iets zichtbaar wordt
    document.documentElement.style.overflow = 'hidden';
    const blok = document.createElement('div');
    blok.id = 'proef-blokkade';
    blok.innerHTML = `
      <style>
        #proef-blokkade {
          position: fixed; inset: 0; z-index: 99998;
          background: linear-gradient(135deg, #ffcf56 0%, #e8b800 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; font-family: 'Nunito Sans', Arial, sans-serif;
          overflow-y: auto;
        }
        #proef-blokkade .box {
          background: #fff; border-radius: 20px; padding: 40px;
          max-width: 520px; width: 100%;
          box-shadow: 0 12px 48px rgba(0,0,0,0.15); text-align: center;
        }
        #proef-blokkade .icon {
          font-size: 4rem; margin-bottom: 16px;
        }
        #proef-blokkade h1 {
          font-family: 'Nunito', Arial, sans-serif; font-weight: 900;
          font-size: 1.8rem; color: #2a2a2a; margin-bottom: 14px;
          line-height: 1.2;
        }
        #proef-blokkade p {
          color: #555; font-size: 1.05rem; line-height: 1.55;
          margin-bottom: 24px;
        }
        #proef-blokkade .knop-primair {
          display: inline-block; background: #2a2a2a; color: #ffcf56;
          padding: 14px 32px; border-radius: 10px; text-decoration: none;
          font-weight: 800; font-family: 'Nunito', Arial, sans-serif;
          font-size: 1.05rem; margin: 4px;
          transition: background 0.2s;
        }
        #proef-blokkade .knop-primair:hover { background: #1a1a1a; }
        #proef-blokkade .knop-secundair {
          display: inline-block; color: #888; text-decoration: none;
          font-weight: 600; font-size: 0.9rem; margin-top: 16px;
        }
        #proef-blokkade .knop-secundair:hover { color: #2a2a2a; }
      </style>
      <div class="box">
        <div class="icon">🎁</div>
        <h1>${titel}</h1>
        <p>${tekst}</p>
        <a href="${WEBSHOP_URL}" target="_blank" class="knop-primair">${knopTekst} →</a>
        <div><a href="../../" class="knop-secundair">← Terug naar overzicht</a></div>
      </div>`;
    document.documentElement.appendChild(blok);
  }

  function _toonProefNogNietGestart() {
    // Infopagina in dezelfde map toont zelf de juiste boodschap (aftelklok)
    location.href = 'index.html';
  }

  function _toonProefVoorbij() {
    // Infopagina toont zelf "Proefmaand is afgelopen"
    location.href = 'index.html';
  }

  function _toonTellerOp() {
    // Dit is een persoonlijke boodschap (jij bent op teller 3, niet algemeen "proef voorbij")
    // Daarom behouden we hier wel een eigen blokkade-scherm
    _toonBlokkade(
      'Je 3 gratis bundels zijn op',
      'Je hebt je <strong>3 gratis proefbundels</strong> gebruikt. Leuk dat je de generator hebt uitgeprobeerd!<br><br>Wil je onbeperkt bundels maken met volledige oplossingssleutels erbij? Neem dan een abonnement op de Spelgenerator.',
      'Bekijk het aanbod'
    );
  }

  function _toonFout(boodschap) {
    _toonBlokkade(
      'Er liep iets mis',
      `${boodschap}<br><br>Probeer de pagina te herladen. Als het probleem blijft: mail naar <a href="mailto:info@jufzisa.be" style="color:#2a2a2a;font-weight:700;">info@jufzisa.be</a>.`,
      'Terug naar overzicht'
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // BANNER — bovenaan in app, toont resterende bundels
  // ══════════════════════════════════════════════════════════════════════

  function _toonBanner() {
    const overMaking = Math.max(0, (_instellingen.max_per_bezoeker || 3) - _teller);
    const banner = document.createElement('div');
    banner.id = 'proef-banner';
    banner.innerHTML = `
      <style>
        #proef-banner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 20px;
          background: linear-gradient(90deg, #ffcf56 0%, #e8b800 100%);
          color: #2a2a2a; font-size: 0.9rem; font-weight: 700;
          font-family: 'Nunito', Arial, sans-serif;
          gap: 12px; position: sticky; top: 0; z-index: 200;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        #proef-banner .badge {
          background: #2a2a2a; color: #ffcf56;
          border-radius: 6px; padding: 3px 10px;
          font-size: 0.78rem;
        }
        #proef-banner .tekst { flex: 1; }
        #proef-banner .tekst .laag { color: #b30000; }
        #proef-banner a {
          color: #2a2a2a; text-decoration: none; font-weight: 700;
          font-size: 0.82rem; border-bottom: 1.5px solid #2a2a2a;
        }
        #proef-banner a:hover { border-bottom-color: transparent; }
      </style>
      <span class="badge">🎁 PROEF</span>
      <span class="tekst">
        ${overMaking === 0
          ? '<span class="laag">Laatste bundel gebruikt — dit is je preview-modus</span>'
          : overMaking === 1
            ? '<span class="laag">Let op: nog <strong>1</strong> van 3 gratis bundels over</span>'
            : `Je hebt nog <strong>${overMaking}</strong> van 3 gratis bundels over`
        }
      </span>
      <a href="${WEBSHOP_URL}" target="_blank">Bekijk aanbod →</a>`;
    // Plaats de banner helemaal bovenaan <body>, dus VOOR de bestaande header
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function _updateBanner() {
    const oud = document.getElementById('proef-banner');
    if (oud) oud.remove();
    _toonBanner();
  }

  // ══════════════════════════════════════════════════════════════════════
  // POPUPS — na download / bij blokkade sleutel
  // ══════════════════════════════════════════════════════════════════════

  function _toonPopup(titel, tekst, primaireKnop) {
    const overlay = document.createElement('div');
    overlay.id = 'proef-popup-overlay';
    overlay.innerHTML = `
      <style>
        #proef-popup-overlay {
          position: fixed; inset: 0; z-index: 99997;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: proef-fade 0.2s ease-out;
        }
        @keyframes proef-fade { from { opacity: 0; } to { opacity: 1; } }
        #proef-popup-overlay .popup {
          background: #fff; border-radius: 16px; padding: 32px;
          max-width: 440px; width: 100%; text-align: center;
          box-shadow: 0 12px 48px rgba(0,0,0,0.25);
          font-family: 'Nunito Sans', Arial, sans-serif;
          animation: proef-slide 0.25s ease-out;
        }
        @keyframes proef-slide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        #proef-popup-overlay h2 {
          font-family: 'Nunito', Arial, sans-serif; font-weight: 800;
          font-size: 1.3rem; color: #2a2a2a; margin-bottom: 12px;
        }
        #proef-popup-overlay p {
          color: #555; font-size: 0.98rem; line-height: 1.5;
          margin-bottom: 20px;
        }
        #proef-popup-overlay .knop {
          display: inline-block; background: #2a2a2a; color: #ffcf56;
          padding: 12px 24px; border-radius: 10px; text-decoration: none;
          font-weight: 800; font-family: 'Nunito', Arial, sans-serif;
          font-size: 0.98rem; border: none; cursor: pointer; margin: 4px;
        }
        #proef-popup-overlay .knop:hover { background: #1a1a1a; }
        #proef-popup-overlay .knop-sluit {
          background: transparent; color: #888; border: none; cursor: pointer;
          font-size: 0.88rem; font-weight: 600; margin-top: 12px; display: block;
          width: 100%;
        }
        #proef-popup-overlay .knop-sluit:hover { color: #2a2a2a; }
      </style>
      <div class="popup">
        <h2>${titel}</h2>
        <p>${tekst}</p>
        ${primaireKnop
          ? `<a href="${WEBSHOP_URL}" target="_blank" class="knop">${primaireKnop} →</a>`
          : ''}
        <button class="knop-sluit" onclick="document.getElementById('proef-popup-overlay').remove()">Sluiten</button>
      </div>`;
    document.body.appendChild(overlay);
  }

  function _toonPopupNaDownload() {
    const over = Math.max(0, (_instellingen.max_per_bezoeker || 3) - _teller);
    if (_teller === 1) {
      _toonPopup(
        '📄 Eerste bundel gedownload!',
        'Mooi zo! Je hebt nog 2 gratis bundels over. Probeer gerust andere types oefeningen uit.',
        null
      );
    } else if (_teller === 2) {
      _toonPopup(
        '📄 Tweede bundel gedownload',
        'Nog <strong>1 gratis bundel</strong> over. Wil je onbeperkt bundels maken? Dan is het abonnement op de Spelgenerator iets voor jou.',
        'Bekijk het aanbod'
      );
    } else if (_teller >= 3) {
      _toonPopup(
        '🎉 Je laatste gratis bundel',
        'Je hebt <strong>alle 3 je gratis bundels</strong> gedownload. Bedankt om de Rekenbundel Generator uit te proberen!<br><br>Wil je meer? Neem dan een abonnement op de Spelgenerator — met onbeperkte bundels en oplossingssleutels.',
        'Bekijk het aanbod'
      );
      // Na 2 seconden de blokkadepagina tonen zodat ze echt niks meer kunnen
      setTimeout(() => {
        const overlay = document.getElementById('proef-popup-overlay');
        if (overlay) overlay.remove();
        _toonTellerOp();
      }, 60000); // 1 minuut zodat ze rustig het laatste bestand kunnen opslaan
    }
  }

  function _toonPopupSleutelGeblokkeerd() {
    _toonPopup(
      '🔑 Oplossingssleutel is een PRO-feature',
      'In de gratis proef kan je wel bundels maken, maar de <strong>automatische oplossingssleutel</strong> zit alleen in het abonnement op de Spelgenerator.<br><br>Zo scheelt het je uren nakijkwerk!',
      'Bekijk het aanbod'
    );
  }

  function _toonPopupVraagstukkenGeblokkeerd() {
    _toonPopup(
      '📖 Vraagstukken zijn een PRO-feature',
      'Met <strong>AI-vraagstukken</strong> laat je Claude op maat vraagstukken maken voor je leerjaar, thema en bewerking. Een echte tijdwinner voor de leerkracht!<br><br>Deze feature zit alleen in het abonnement op de Spelgenerator.',
      'Bekijk het aanbod'
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // DATUM-CHECKS — vergelijk vandaag met start/eind_datum uit Firestore
  // ══════════════════════════════════════════════════════════════════════

  function _isProefActief() {
    if (!_instellingen) return false;
    if (_instellingen.actief !== true) return false;

    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);

    const start = new Date(_instellingen.start_datum + 'T00:00:00');
    const eind  = new Date(_instellingen.eind_datum  + 'T23:59:59');

    return vandaag >= start && vandaag <= eind;
  }

  function _isProefNogNietGestart() {
    if (!_instellingen) return false;
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);
    const start = new Date(_instellingen.start_datum + 'T00:00:00');
    return vandaag < start;
  }

  function _isProefVoorbij() {
    if (!_instellingen) return false;
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);
    const eind = new Date(_instellingen.eind_datum + 'T23:59:59');
    return vandaag > eind;
  }

  // ══════════════════════════════════════════════════════════════════════
  // HOOK — omwikkelt App.downloadPDF en App.downloadSleutel
  // ══════════════════════════════════════════════════════════════════════

  function _hookApp() {
    // Strategie: we hooken niet de App.xxx functies direct (want 'const App' is
    // niet op window toegankelijk in strict module mode). In plaats daarvan
    // vervangen we de onclick handlers van de specifieke knoppen.
    function _doHook() {
      const btnPdf     = document.getElementById('btn-pdf');
      const btnSleutel = document.getElementById('btn-sleutel');

      // Wacht tot de knoppen bestaan (kan zijn dat DOM nog niet klaar is)
      if (!btnPdf || !btnSleutel) {
        setTimeout(_doHook, 100);
        return;
      }

      // 1. PDF-download knop: vervang onclick met onze wrapper
      btnPdf.removeAttribute('onclick');
      btnPdf.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        // Check of teller al op max staat
        const max = _instellingen.max_per_bezoeker || 3;
        if (_teller >= max) {
          _toonTellerOp();
          return;
        }

        // Roep de originele App.downloadPDF aan via eval op global scope.
        // Werkt omdat 'App' wel als global identifier bestaat (via onclick
        // handlers toegankelijk), maar niet als window.App.
        try {
          // eslint-disable-next-line no-eval
          (0, eval)('App.downloadPDF()');
        } catch (err) {
          console.error('Download mislukt:', err);
          return;
        }

        // Teller +1 in Firestore
        try {
          const nieuw = _teller + 1;
          const ref = _db.collection('proef-rekenbundel').doc(_uid);
          if (_teller === 0) {
            await ref.set({ teller: 0 });
          }
          await ref.update({ teller: nieuw });
          _teller = nieuw;
          _updateBanner();
          _toonPopupNaDownload();
        } catch (err) {
          console.error('Teller bijwerken mislukt:', err);
        }
      }, true); // useCapture = true → vangt klik af vóór andere handlers

      // 2. Oplossingssleutel knop: volledig blokkeren met PRO-popup
      btnSleutel.removeAttribute('onclick');
      btnSleutel.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        _toonPopupSleutelGeblokkeerd();
      }, true);

      // 2b. "Toon oplossingen" knop: ook blokkeren — anders kunnen ze
      //     de oplossingen zien en screenshotten.
      const btnToonOpl = document.getElementById('btn-toggle-oplossingen');
      if (btnToonOpl) {
        btnToonOpl.removeAttribute('onclick');
        btnToonOpl.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          _toonPopupSleutelGeblokkeerd();
        }, true);
      }

      // 3. Vraagstukken-tab blokkeren: hook op het tabblad-element
      const tabVraagstukken = document.querySelector('.tab-vraagstukken');
      if (tabVraagstukken) {
        tabVraagstukken.removeAttribute('onclick');
        tabVraagstukken.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          _toonPopupVraagstukkenGeblokkeerd();
        }, true);
      }

      // 4. Visuele markering op vraagstukken-tab toevoegen
      _markeerVraagstukkenTab();

      console.log('[Proef] Hooks geïnstalleerd, teller =', _teller);
    }

    _doHook();
  }

  // ══════════════════════════════════════════════════════════════════════
  // VRAAGSTUKKEN-TAB visueel markeren als PRO-feature
  // ══════════════════════════════════════════════════════════════════════

  function _markeerVraagstukkenTab() {
    // Zoek het tabblad voor vraagstukken
    const tab = document.querySelector('.tab-vraagstukken');
    if (!tab) return;

    // Voeg een ⭐ PRO badgje toe aan het einde van de tekst
    // (maar alleen als het er nog niet staat)
    if (!tab.querySelector('.proef-pro-badge')) {
      const badge = document.createElement('span');
      badge.className = 'proef-pro-badge';
      badge.textContent = '⭐ PRO';
      badge.style.cssText = `
        display: inline-block;
        background: #ffcf56;
        color: #2a2a2a;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 6px;
        vertical-align: middle;
        font-family: 'Nunito', Arial, sans-serif;
        letter-spacing: 0.02em;
      `;
      tab.appendChild(badge);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // FIREBASE INIT — laadt SDK scripts, authent, haalt data op
  // ══════════════════════════════════════════════════════════════════════

  function _laadFirebaseSDK() {
    return new Promise((resolve, reject) => {
      // Firebase v9 compat scripts (simpeler voor deze use-case dan ESM imports)
      const scripts = [
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
      ];

      let geladen = 0;
      scripts.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => {
          geladen++;
          if (geladen === scripts.length) resolve();
        };
        s.onerror = () => reject(new Error(`Kon Firebase SDK niet laden: ${src}`));
        document.head.appendChild(s);
      });
    });
  }

  async function _startProef() {
    try {
      // 1. Firebase SDK laden
      await _laadFirebaseSDK();

      // 2. Firebase initialiseren
      _app  = firebase.initializeApp(firebaseConfig);
      _auth = firebase.auth();
      _db   = firebase.firestore();

      // 3. Anoniem inloggen
      const cred = await _auth.signInAnonymously();
      _uid = cred.user.uid;
      console.log('[Proef] Anoniem ingelogd:', _uid);

      // 4. Instellingen ophalen (kill switch)
      const instDoc = await _db.collection('instellingen').doc('gratis_rekenbundel').get();
      if (!instDoc.exists) {
        _toonFout('De proef-instellingen zijn niet gevonden in de database.');
        return;
      }
      _instellingen = instDoc.data();
      console.log('[Proef] Instellingen:', _instellingen);

      // 5. Kill switch check
      if (_instellingen.actief !== true) {
        // Proef staat uit — check waarom
        if (_isProefNogNietGestart()) {
          _toonProefNogNietGestart();
        } else if (_isProefVoorbij()) {
          _toonProefVoorbij();
        } else {
          // actief=false maar datum is OK → handmatig uitgezet
          _toonProefVoorbij();
        }
        return;
      }

      // 6. Datum check (dubbele veiligheid naast actief-vlag)
      if (_isProefNogNietGestart()) {
        _toonProefNogNietGestart();
        return;
      }
      if (_isProefVoorbij()) {
        _toonProefVoorbij();
        return;
      }

      // 7. Teller ophalen
      const tellerDoc = await _db.collection('proef-rekenbundel').doc(_uid).get();
      _teller = tellerDoc.exists ? (tellerDoc.data().teller || 0) : 0;
      console.log('[Proef] Teller voor deze bezoeker:', _teller);

      // 8. Als teller al op max staat → blokkeren
      const max = _instellingen.max_per_bezoeker || 3;
      if (_teller >= max) {
        _toonTellerOp();
        return;
      }

      // 9. Proef mag lopen! App laden toestaan
      _mag_laden = true;
      _verbergLaadscherm();

      // Wacht tot body bestaat, dan banner tonen
      if (document.body) {
        _toonBanner();
      } else {
        document.addEventListener('DOMContentLoaded', _toonBanner);
      }

      // Hook App.downloadPDF en App.downloadSleutel
      _hookApp();

    } catch (err) {
      console.error('[Proef] Fout bij opstart:', err);
      _toonFout('We konden geen verbinding maken. Controleer je internetverbinding.');
    }
  }

  // ── Start! ────────────────────────────────────────────────────────────
  // Wacht tot document klaar is (head-scripts kunnen voor </head> laden)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _startProef);
  } else {
    _startProef();
  }

})();