/* ══════════════════════════════════════════════════════════════════════════
   proef-config.js — Tempotoetsen-proef voor probeer-zisa
   ──────────────────────────────────────────────────────────────────────────
   Wat doet dit bestand?

   1. Verbindt met Firebase project 'probeer-zisa' (Spark plan)
   2. Logt bezoeker anoniem in → krijgt unieke UID
   3. Haalt kill-switch-instellingen op uit Firestore:
        instellingen/gratis_tempotoetsen
          → { actief, start_datum, eind_datum, max_weekblad, max_huistaakblad }
   4. Haalt tellers op voor deze UID:
        proef-tempotoetsen/{uid}
          → { teller_weekblad: 0..2, teller_huistaakblad: 0..2 }
   5. Beslist: blokkade tonen OF app doorlaten
   6. Toont banner bovenaan met "Nog X weekbladen en Y huistaakbladen"
   7. Hook op window.maakWeekbladPdf → telt op na succesvolle download
   8. Flits, dagblad en invulblad blijven onbeperkt

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
  const WEBSHOP_URL = '../#zg-prijzen';

  // ── State die we onderweg invullen ─────────────────────────────────────
  let _app, _auth, _db, _uid;
  let _instellingen = null;
  let _tellerWeek = 0;
  let _tellerHuistaak = 0;
  let _mag_laden = false;

  // ══════════════════════════════════════════════════════════════════════
  // LAADSCHERM
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
          font-family: 'Nunito', Arial, sans-serif;
        }
        #proef-laadscherm .box {
          background: #fff; border-radius: 16px; padding: 40px 50px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.15); text-align: center;
          max-width: 400px;
        }
        #proef-laadscherm h2 {
          color: #2a2a2a; font-size: 1.4rem; margin-bottom: 12px;
          font-weight: 800;
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
        <p>Even geduld, we checken je gratis bladen.</p>
      </div>`;
    document.documentElement.appendChild(div);
  }

  function _verbergLaadscherm() {
    const div = document.getElementById('proef-laadscherm');
    if (div) div.remove();
  }

  _toonLaadscherm();

  // ══════════════════════════════════════════════════════════════════════
  // BLOKKADE-SCHERMEN
  // ══════════════════════════════════════════════════════════════════════
  function _toonBlokkade(titel, tekst, knopTekst, knopUrl) {
    _verbergLaadscherm();
    document.documentElement.style.overflow = 'hidden';
    const blok = document.createElement('div');
    blok.id = 'proef-blokkade';
    blok.innerHTML = `
      <style>
        #proef-blokkade {
          position: fixed; inset: 0; z-index: 99998;
          background: linear-gradient(135deg, #ffcf56 0%, #e8b800 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; font-family: 'Nunito', Arial, sans-serif;
          overflow-y: auto;
        }
        #proef-blokkade .box {
          background: #fff; border-radius: 20px; padding: 40px;
          max-width: 520px; width: 100%;
          box-shadow: 0 12px 48px rgba(0,0,0,0.15); text-align: center;
        }
        #proef-blokkade .icon { font-size: 4rem; margin-bottom: 16px; }
        #proef-blokkade h1 {
          font-weight: 900; font-size: 1.8rem; color: #2a2a2a;
          margin-bottom: 14px; line-height: 1.2;
        }
        #proef-blokkade p {
          color: #555; font-size: 1.05rem; line-height: 1.55;
          margin-bottom: 24px;
        }
        #proef-blokkade .knop-primair {
          display: inline-block; background: #2a2a2a; color: #ffcf56;
          padding: 14px 32px; border-radius: 10px; text-decoration: none;
          font-weight: 800; font-size: 1.05rem; margin: 4px;
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
        <a href="${knopUrl || WEBSHOP_URL}" class="knop-primair">${knopTekst} →</a>
        <div><a href="../#zg-probeer" class="knop-secundair">← Andere tools proberen</a></div>
      </div>`;
    document.documentElement.appendChild(blok);
  }

  function _toonProefNogNietGestart() {
    _toonBlokkade(
      'De proefperiode loopt nog niet',
      `De gratis proefperiode van de Tempotoetsen Generator start op
       <strong>${_instellingen.start_datum}</strong>. Kom dan zeker eens terug!`,
      'Andere tools proberen',
      '../#zg-probeer'
    );
  }

  function _toonProefVoorbij() {
    _toonBlokkade(
      'De proefperiode is voorbij',
      'De gratis proefperiode van de Tempotoetsen Generator is afgelopen. ' +
      'Bedankt om hem uit te proberen! Wil je hem blijven gebruiken? Neem dan een ' +
      'abonnement op de Spelgenerator — dan hoort dit erbij.',
      'Bekijk het aanbod'
    );
  }

  function _toonAllesOp() {
    _toonBlokkade(
      'Je gratis bladen zijn op',
      `Je hebt je <strong>2 weekbladen</strong> en <strong>2 huistaakbladen</strong>
       gebruikt. Leuk dat je de Tempotoetsen Generator hebt uitgeprobeerd!<br><br>
       Wil je er onbeperkt mee aan de slag? Neem een abonnement op de Spelgenerator —
       dan zit deze tool er gratis bij.`,
      'Bekijk het aanbod'
    );
  }

  function _toonFout(boodschap) {
    _toonBlokkade(
      'Er liep iets mis',
      `${boodschap}<br><br>Probeer de pagina te herladen. Als het probleem blijft:
       mail naar <a href="mailto:zebrapost@jufzisa.be" style="color:#2a2a2a;font-weight:700;">zebrapost@jufzisa.be</a>.`,
      'Andere tools proberen',
      '../#zg-probeer'
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // BANNER — bovenaan in app, toont resterende bladen
  // ══════════════════════════════════════════════════════════════════════
  function _toonBanner() {
    const maxW = _instellingen.max_weekblad || 2;
    const maxH = _instellingen.max_huistaakblad || 2;
    const overW = Math.max(0, maxW - _tellerWeek);
    const overH = Math.max(0, maxH - _tellerHuistaak);

    let tekst;
    if (overW === 0 && overH === 0) {
      tekst = '<span class="laag">Al je gratis bladen zijn gebruikt — flitsen blijft wel onbeperkt</span>';
    } else if (overW === 0) {
      tekst = `Geen weekbladen meer, nog <strong>${overH}</strong> ${overH === 1 ? 'huistaakblad' : 'huistaakbladen'} over`;
    } else if (overH === 0) {
      tekst = `Nog <strong>${overW}</strong> ${overW === 1 ? 'weekblad' : 'weekbladen'} over, geen huistaakbladen meer`;
    } else {
      tekst = `Nog <strong>${overW}</strong> van ${maxW} weekbladen en <strong>${overH}</strong> van ${maxH} huistaakbladen over`;
    }

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
      <span class="tekst">${tekst}</span>
      <a href="${WEBSHOP_URL}">Bekijk het aanbod →</a>`;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function _updateBanner() {
    const oud = document.getElementById('proef-banner');
    if (oud) oud.remove();
    _toonBanner();
  }

  // ══════════════════════════════════════════════════════════════════════
  // POPUPS na download
  // ══════════════════════════════════════════════════════════════════════
  function _toonPopup(titel, tekst, primaireKnop) {
    const oude = document.getElementById('proef-popup-overlay');
    if (oude) oude.remove();
    const overlay = document.createElement('div');
    overlay.id = 'proef-popup-overlay';
    overlay.innerHTML = `
      <style>
        #proef-popup-overlay {
          position: fixed; inset: 0; z-index: 99997;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: proef-fade 0.2s ease-out;
          font-family: 'Nunito', Arial, sans-serif;
        }
        @keyframes proef-fade { from { opacity: 0; } to { opacity: 1; } }
        #proef-popup-overlay .popup {
          background: #fff; border-radius: 16px; padding: 32px;
          max-width: 440px; width: 100%; text-align: center;
          box-shadow: 0 12px 48px rgba(0,0,0,0.25);
          animation: proef-slide 0.25s ease-out;
        }
        @keyframes proef-slide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        #proef-popup-overlay h2 {
          font-weight: 800; font-size: 1.3rem;
          color: #2a2a2a; margin-bottom: 12px;
        }
        #proef-popup-overlay p {
          color: #555; font-size: 0.98rem; line-height: 1.5;
          margin-bottom: 20px;
        }
        #proef-popup-overlay .knop {
          display: inline-block; background: #2a2a2a; color: #ffcf56;
          padding: 12px 24px; border-radius: 10px; text-decoration: none;
          font-weight: 800; font-size: 0.98rem;
          border: none; cursor: pointer; margin: 4px;
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
          ? `<a href="${WEBSHOP_URL}" class="knop">${primaireKnop} →</a>`
          : ''}
        <button class="knop-sluit" onclick="document.getElementById('proef-popup-overlay').remove()">Sluiten</button>
      </div>`;
    document.body.appendChild(overlay);
  }

  function _toonPopupNaDownload(variant) {
    const maxW = _instellingen.max_weekblad || 2;
    const maxH = _instellingen.max_huistaakblad || 2;
    const overW = Math.max(0, maxW - _tellerWeek);
    const overH = Math.max(0, maxH - _tellerHuistaak);
    const allesOp = (overW === 0 && overH === 0);

    if (allesOp) {
      _toonPopup(
        '🎉 Je laatste gratis blad',
        `Je hebt al je gratis weekbladen en huistaakbladen gedownload. Bedankt om de
         Tempotoetsen Generator uit te proberen!<br><br>
         Wil je er onbeperkt mee aan de slag? Neem dan een abonnement op de Spelgenerator —
         dan zit deze tool er gratis bij.`,
        'Bekijk het aanbod'
      );
      // Na 60 seconden de blokkadepagina — geeft tijd om het laatste bestand te bewaren
      setTimeout(() => {
        const overlay = document.getElementById('proef-popup-overlay');
        if (overlay) overlay.remove();
        _toonAllesOp();
      }, 60000);
      return;
    }

    if (variant === 'weekblad') {
      if (_tellerWeek === 1) {
        _toonPopup(
          '📅 Eerste weekblad gedownload!',
          `Mooi! Je hebt nog <strong>1 weekblad</strong> over, plus <strong>${overH}</strong> ${overH === 1 ? 'huistaakblad' : 'huistaakbladen'}.<br><br>
           Tip: probeer ook eens flitsen op het bord — dat blijft <strong>onbeperkt gratis</strong>.`,
          null
        );
      } else if (_tellerWeek >= maxW) {
        _toonPopup(
          '📅 Tweede weekblad gedownload',
          `Geen gratis weekbladen meer. Nog <strong>${overH}</strong> ${overH === 1 ? 'huistaakblad' : 'huistaakbladen'} over.<br><br>
           Wil je onbeperkt weekbladen kunnen maken? Bekijk dan het abonnement op de Spelgenerator.`,
          'Bekijk het aanbod'
        );
      }
    } else if (variant === 'huistaak') {
      if (_tellerHuistaak === 1) {
        _toonPopup(
          '🏠 Eerste huistaakblad gedownload!',
          `Mooi! Je hebt nog <strong>1 huistaakblad</strong> over, plus <strong>${overW}</strong> ${overW === 1 ? 'weekblad' : 'weekbladen'}.<br><br>
           Tip: flitsen op het bord blijft <strong>onbeperkt gratis</strong>.`,
          null
        );
      } else if (_tellerHuistaak >= maxH) {
        _toonPopup(
          '🏠 Tweede huistaakblad gedownload',
          `Geen gratis huistaakbladen meer. Nog <strong>${overW}</strong> ${overW === 1 ? 'weekblad' : 'weekbladen'} over.<br><br>
           Wil je er onbeperkt mee aan de slag? Bekijk dan het abonnement op de Spelgenerator.`,
          'Bekijk het aanbod'
        );
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // DATUM-CHECKS
  // ══════════════════════════════════════════════════════════════════════
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
  // BEZOEK TELLEN — analoog aan teller.js
  // Telt per dag, per maand, en totaal in collectie 'statistieken'.
  // Dedupe per sessie via sessionStorage.
  // ══════════════════════════════════════════════════════════════════════
  async function _telBezoek(paginaNaam) {
    const sessionKey = 'zisa-teller-' + paginaNaam;
    if (sessionStorage.getItem(sessionKey)) {
      console.log('[Proef] Bezoek al geteld in deze sessie:', paginaNaam);
      return;
    }

    try {
      const nu = new Date();
      const dag   = nu.toISOString().slice(0, 10);
      const maand = nu.toISOString().slice(0, 7);

      const batch = _db.batch();
      const dagRef = _db.collection('statistieken').doc('dag_' + paginaNaam + '_' + dag);
      batch.set(dagRef, {
        pagina: paginaNaam, datum: dag, type: 'dag',
        teller: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      const maandRef = _db.collection('statistieken').doc('maand_' + paginaNaam + '_' + maand);
      batch.set(maandRef, {
        pagina: paginaNaam, maand: maand, type: 'maand',
        teller: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      const totRef = _db.collection('statistieken').doc('totaal_' + paginaNaam);
      batch.set(totRef, {
        pagina: paginaNaam, type: 'totaal',
        teller: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      await batch.commit();
      sessionStorage.setItem(sessionKey, '1');
      console.log('[Proef] Bezoek geteld:', paginaNaam);
    } catch (err) {
      console.warn('[Proef] Bezoek niet geteld:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // HOOK — omwikkel window.maakWeekbladPdf
  //
  // Deze functie wordt aangeroepen voor zowel weekblad als huistaakblad.
  // We onderscheiden ze via window.huidigeWeekVariant ('weekblad' of 'huistaak').
  // Pas NA succesvolle download (return true) tellen we op.
  // ══════════════════════════════════════════════════════════════════════
  function _hookApp() {
    function _doHook() {
      // Wacht tot app.js geladen is en de functie bestaat
      if (typeof window.maakWeekbladPdf !== 'function') {
        setTimeout(_doHook, 80);
        return;
      }

      const origineel = window.maakWeekbladPdf;

      window.maakWeekbladPdf = function() {
        // Welke variant gaat dit worden? Lees vóór de aanroep.
        const variant = window.huidigeWeekVariant === 'huistaak' ? 'huistaak' : 'weekblad';

        // Check vooraf of de teller voor deze variant al vol is
        const maxW = _instellingen.max_weekblad || 2;
        const maxH = _instellingen.max_huistaakblad || 2;

        if (variant === 'weekblad' && _tellerWeek >= maxW) {
          _toonPopup(
            '📅 Geen gratis weekbladen meer',
            `Je hebt al je <strong>${maxW} gratis weekbladen</strong> gedownload.<br><br>
             Wil je er meer? Neem dan een abonnement op de Spelgenerator. Flitsen blijft wel onbeperkt gratis!`,
            'Bekijk het aanbod'
          );
          return false;
        }
        if (variant === 'huistaak' && _tellerHuistaak >= maxH) {
          _toonPopup(
            '🏠 Geen gratis huistaakbladen meer',
            `Je hebt al je <strong>${maxH} gratis huistaakbladen</strong> gedownload.<br><br>
             Wil je er meer? Neem dan een abonnement op de Spelgenerator. Flitsen blijft wel onbeperkt gratis!`,
            'Bekijk het aanbod'
          );
          return false;
        }

        // Roep de echte functie aan. Returns true bij succes, false bij fout.
        let resultaat;
        try {
          resultaat = origineel.apply(this, arguments);
        } catch (err) {
          console.error('[Proef] Fout bij maakWeekbladPdf:', err);
          return false;
        }

        if (resultaat !== true) {
          // Generator zelf gaf false terug (bv. geen dagen gekozen) → niets tellen
          return resultaat;
        }

        // ✅ PDF is gegenereerd. Teller +1 in Firestore, async.
        (async () => {
          try {
            const ref = _db.collection('proef-tempotoetsen').doc(_uid);
            if (variant === 'weekblad') {
              const nieuw = _tellerWeek + 1;
              await ref.set({ teller_weekblad: nieuw }, { merge: true });
              _tellerWeek = nieuw;
            } else {
              const nieuw = _tellerHuistaak + 1;
              await ref.set({ teller_huistaakblad: nieuw }, { merge: true });
              _tellerHuistaak = nieuw;
            }
            _updateBanner();
            _toonPopupNaDownload(variant);
          } catch (err) {
            console.error('[Proef] Teller bijwerken mislukt:', err);
          }
        })();

        return true;
      };

      console.log('[Proef] Hook geïnstalleerd. Tellers: week =', _tellerWeek, ', huistaak =', _tellerHuistaak);
    }

    _doHook();
  }

  // ══════════════════════════════════════════════════════════════════════
  // FIREBASE INIT
  // ══════════════════════════════════════════════════════════════════════
  function _laadFirebaseSDK() {
    return new Promise((resolve, reject) => {
      const scripts = [
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
      ];
      let geladen = 0;
      scripts.forEach(src => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => { geladen++; if (geladen === scripts.length) resolve(); };
        s.onerror = () => reject(new Error(`Kon Firebase SDK niet laden: ${src}`));
        document.head.appendChild(s);
      });
    });
  }

  async function _startProef() {
    try {
      await _laadFirebaseSDK();

      _app  = firebase.initializeApp(firebaseConfig);
      _auth = firebase.auth();
      _db   = firebase.firestore();

      const cred = await _auth.signInAnonymously();
      _uid = cred.user.uid;
      console.log('[Proef] Anoniem ingelogd:', _uid);

      // Instellingen
      const instDoc = await _db.collection('instellingen').doc('gratis_tempotoetsen').get();
      if (!instDoc.exists) {
        _toonFout('De proef-instellingen zijn niet gevonden in de database.');
        return;
      }
      _instellingen = instDoc.data();
      console.log('[Proef] Instellingen:', _instellingen);

      // Kill switch
      if (_instellingen.actief !== true) {
        if (_isProefNogNietGestart()) _toonProefNogNietGestart();
        else _toonProefVoorbij();
        return;
      }

      // Datum
      if (_isProefNogNietGestart()) { _toonProefNogNietGestart(); return; }
      if (_isProefVoorbij())        { _toonProefVoorbij();        return; }

      // Tellers
      const tellerDoc = await _db.collection('proef-tempotoetsen').doc(_uid).get();
      if (tellerDoc.exists) {
        const d = tellerDoc.data();
        _tellerWeek = d.teller_weekblad || 0;
        _tellerHuistaak = d.teller_huistaakblad || 0;
      }
      console.log('[Proef] Tellers — week:', _tellerWeek, '/ huistaak:', _tellerHuistaak);

      // Als beide tellers op max staan: blokkeren
      const maxW = _instellingen.max_weekblad || 2;
      const maxH = _instellingen.max_huistaakblad || 2;
      if (_tellerWeek >= maxW && _tellerHuistaak >= maxH) {
        _toonAllesOp();
        return;
      }

      // App mag opstarten
      _mag_laden = true;
      _verbergLaadscherm();

      // Bezoek tellen voor statistieken (eenmalig per sessie)
      _telBezoek('proef-tempotoetsen-app');

      if (document.body) _toonBanner();
      else document.addEventListener('DOMContentLoaded', _toonBanner);

      _hookApp();

    } catch (err) {
      console.error('[Proef] Fout bij opstart:', err);
      _toonFout('We konden geen verbinding maken. Controleer je internetverbinding.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _startProef);
  } else {
    _startProef();
  }

})();