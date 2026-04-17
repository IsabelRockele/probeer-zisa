// ═══════════════════════════════════════════════════════════════════════════
// DEMO-CONFIGURATIE — Klasbord-demo voor probeer-zisa
// Dit bestand vervangt Firebase door dummy-functies + laadt een voorbeeldklas
// + toont demo-banner en verkoop-popups bij belangrijke acties.
// Moet geladen worden VOOR klasbord.js (niet daarna!)
// ═══════════════════════════════════════════════════════════════════════════

(function() {

  // ─── 1. VOORBEELDKLAS DATA ─────────────────────────────────────────────────
  // 20 leerlingen, 4 taken, realistische vinkpatronen
  // Één leerling ("Sam") is duidelijk achter (verkoop-verhaal: patronen zien)

  function uidDemo() {
    return 'demo_' + Math.random().toString(36).slice(2, 9);
  }

  var PUPILS = [
    {voornaam:'Noa',   achternaam:'Peeters'},
    {voornaam:'Finn',  achternaam:'Janssens'},
    {voornaam:'Lore',  achternaam:'De Smet'},
    {voornaam:'Milan', achternaam:'Van Damme'},
    {voornaam:'Zoë',   achternaam:'Maes'},
    {voornaam:'Stan',  achternaam:'Claes'},
    {voornaam:'Emma',  achternaam:'Willems'},
    {voornaam:'Lukas', achternaam:'Jacobs'},
    {voornaam:'Nora',  achternaam:'Goossens'},
    {voornaam:'Jules', achternaam:'Vermeulen'},
    {voornaam:'Amber', achternaam:'Wouters'},
    {voornaam:'Sam',   achternaam:'Hermans'},
    {voornaam:'Tess',  achternaam:'Mertens'},
    {voornaam:'Wout',  achternaam:'Dierickx'},
    {voornaam:'Lien',  achternaam:'Thys'},
    {voornaam:'Vic',   achternaam:'Smets'},
    {voornaam:'Eva',   achternaam:'De Wilde'},
    {voornaam:'Kobe',  achternaam:'Aerts'},
    {voornaam:'Mila',  achternaam:'Beeckman'},
    {voornaam:'Arne',  achternaam:'Lemmens'}
  ].map(function(p) { return {id: uidDemo(), voornaam: p.voornaam, achternaam: p.achternaam}; });

  var ACTIVE_TASK_IDS = ['lezen', 'rekenen', 'schrijven', 'werkblad'];

  // Progress: realistisch patroon
  // - 60% helemaal klaar
  // - 25% gedeeltelijk klaar (1-2 taken)
  // - 15% bezig (status 1)
  // Sam (index 11) heeft structureel achterstand → overtuigt koper
  var progress = {};
  PUPILS.forEach(function(p, idx) {
    progress[p.id] = {};
    ACTIVE_TASK_IDS.forEach(function(tId, tidx) {
      var status = 0;
      var smiley = 0;

      if (idx === 11) {
        // Sam: achterstand, alleen lezen klaar
        if (tId === 'lezen') { status = 2; smiley = 2; }
        else if (tId === 'rekenen') { status = 1; }
        else { status = 0; }
      } else if (idx % 7 === 0) {
        // Een paar leerlingen: bezig
        status = tidx < 2 ? 2 : (tidx === 2 ? 1 : 0);
        if (status === 2) smiley = (idx % 4) + 1;
      } else if (idx % 5 === 2) {
        // Enkele leerlingen: gedeeltelijk
        status = tidx < 3 ? 2 : 1;
        if (status === 2) smiley = (idx % 3) + 1;
      } else {
        // Meeste leerlingen: alles klaar
        status = 2;
        smiley = (idx + tidx) % 4 + 1;
      }
      progress[p.id][tId] = {status: status, smiley: smiley};
    });
  });

  // Teacher notities voor enkele leerlingen
  var notes = {};
  notes[PUPILS[11].id] = 'Sam heeft extra uitleg nodig bij schrijven. Volgende week opvolgen.';
  notes[PUPILS[4].id]  = 'Zoë presteert sterk, kan aan moeilijkere opdrachten beginnen.';

  var DEMO_STATE = {
    pupils: PUPILS,
    activeTasks: ACTIVE_TASK_IDS,
    progress: progress,
    customTasks: [],
    pupilTaskOverrides: {},
    notes: notes,
    showNumbers: false,
    showLastname: false,
    showSmileys: true,
    customIcons: {},
    pupilPhotos: {},
    taskLabelOverrides: {},
    boardSize: 'normal'
  };

  // ─── 2. VERVANG LOCALSTORAGE ───────────────────────────────────────────────
  // We laden de voorbeeldklas in localStorage zodat klasbord.js hem vindt.
  // Elke "opslag" wordt wel uitgevoerd in het geheugen, maar bij refresh
  // reset alles naar de voorbeeldklas.

  var STORAGE_KEY = 'taakbord_test_v4';

  // Schrijf de voorbeeldklas ALTIJD bij pagina-start (forceer!)
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_STATE));
    // Wis eventuele borden_v1 data zodat we zeker de default gebruiken
    localStorage.removeItem('borden_v1');
    console.log('[DEMO] Voorbeeldklas geladen:', DEMO_STATE.pupils.length, 'leerlingen,', DEMO_STATE.activeTasks.length, 'actieve taken');
  } catch(e) {
    console.warn('[DEMO] localStorage niet beschikbaar:', e);
  }

  // ─── 3. DUMMY FIREBASE-FUNCTIES ────────────────────────────────────────────
  // Deze vervangen de echte Firebase-oproepen zodat klasbord.js normaal werkt
  // maar er geen data naar een server gaat.

  window.fbOnReady = function(cb) {
    // Direct triggeren, geen auth nodig
    setTimeout(function(){ cb(null); }, 10);
  };

  window.fbLoad        = function() { return Promise.resolve(null); };
  window.fbSave        = function() { return Promise.resolve(); };
  window.fbDelete      = function() { return Promise.resolve(); };
  window.fbLoadMeta    = function() { return Promise.resolve(null); };
  window.fbSaveMeta    = function() { return Promise.resolve(); };
  window.fbLoadShared  = function() { return Promise.resolve(null); };
  window.fbSaveShared  = function() { return Promise.resolve(); };
  window.fbListenShared = function() { return function(){}; }; // unsubscribe-functie

  // ─── 4. DEMO-BANNER BOVENAAN ───────────────────────────────────────────────

  function maakDemoBanner() {
    var banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.innerHTML =
      '<div class="demo-banner-inner">' +
        '<span class="demo-banner-emoji">🦓</span>' +
        '<span class="demo-banner-text">' +
          '<strong>Dit is een demo met voorbeeldklas</strong> — wijzigingen worden niet bewaard.' +
        '</span>' +
        '<a href="https://www.jufzisa.be/spelgenerator-app" target="_blank" class="demo-banner-btn">' +
          'Ontdek de Spelgenerator →' +
        '</a>' +
      '</div>';
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // ─── 5. CSS voor banner en popups ───────────────────────────────────────────

  var css =
    '#demo-banner {' +
      'background: linear-gradient(135deg, #ffcf56 0%, #e8b800 100%);' +
      'padding: 10px 20px;' +
      'color: #2a2a2a;' +
      'font-family: "Nunito", "Segoe UI", sans-serif;' +
      'font-size: 14px;' +
      'box-shadow: 0 2px 8px rgba(0,0,0,0.1);' +
      'position: sticky;' +
      'top: 0;' +
      'z-index: 9999;' +
    '}' +
    '.demo-banner-inner {' +
      'max-width: 1400px;' +
      'margin: 0 auto;' +
      'display: flex;' +
      'align-items: center;' +
      'gap: 14px;' +
      'flex-wrap: wrap;' +
    '}' +
    '.demo-banner-emoji { font-size: 22px; }' +
    '.demo-banner-text { flex-grow: 1; }' +
    '.demo-banner-btn {' +
      'background: #2a2a2a;' +
      'color: #ffcf56;' +
      'padding: 6px 14px;' +
      'border-radius: 6px;' +
      'text-decoration: none;' +
      'font-weight: 800;' +
      'font-size: 13px;' +
      'white-space: nowrap;' +
    '}' +
    '.demo-banner-btn:hover { background: #1a1a1a; }' +
    '@media (max-width: 600px) {' +
      '.demo-banner-inner { flex-direction: column; text-align: center; }' +
      '.demo-banner-text { font-size: 12px; }' +
    '}' +
    /* Verkoop-popup */
    '.demo-popup-overlay {' +
      'position: fixed;' +
      'inset: 0;' +
      'background: rgba(0,0,0,0.5);' +
      'z-index: 10000;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;' +
      'padding: 20px;' +
      'font-family: "Nunito", "Segoe UI", sans-serif;' +
    '}' +
    '.demo-popup-box {' +
      'background: #fff;' +
      'border-radius: 16px;' +
      'max-width: 440px;' +
      'width: 100%;' +
      'padding: 32px 28px;' +
      'text-align: center;' +
      'box-shadow: 0 20px 60px rgba(0,0,0,0.3);' +
    '}' +
    '.demo-popup-icon {' +
      'font-size: 48px;' +
      'margin-bottom: 12px;' +
    '}' +
    '.demo-popup-title {' +
      'font-size: 22px;' +
      'font-weight: 800;' +
      'color: #2a2a2a;' +
      'margin-bottom: 12px;' +
    '}' +
    '.demo-popup-text {' +
      'font-size: 15px;' +
      'color: #555;' +
      'line-height: 1.6;' +
      'margin-bottom: 20px;' +
    '}' +
    '.demo-popup-btn-primary {' +
      'display: inline-block;' +
      'background: #2a2a2a;' +
      'color: #ffcf56;' +
      'padding: 12px 28px;' +
      'border-radius: 8px;' +
      'text-decoration: none;' +
      'font-weight: 800;' +
      'font-size: 15px;' +
      'margin-bottom: 10px;' +
      'border: none;' +
      'cursor: pointer;' +
      'font-family: inherit;' +
    '}' +
    '.demo-popup-btn-primary:hover { background: #1a1a1a; }' +
    '.demo-popup-btn-secondary {' +
      'display: block;' +
      'background: transparent;' +
      'color: #888;' +
      'padding: 8px;' +
      'text-decoration: underline;' +
      'font-size: 13px;' +
      'margin: 0 auto;' +
      'border: none;' +
      'cursor: pointer;' +
      'font-family: inherit;' +
    '}' +
    /* Terug-knop in header vervangen */
    '.pro-back-btn[href*="app.html"] { display: none !important; }' +
    /* Smartboard uitleg banner */
    '#smartboard-demo-uitleg {' +
      'position: fixed;' +
      'top: 0;' +
      'left: 0;' +
      'right: 0;' +
      'background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);' +
      'color: #fff;' +
      'padding: 12px 20px;' +
      'z-index: 9998;' +
      'box-shadow: 0 4px 12px rgba(0,0,0,0.2);' +
      'font-family: "Nunito", "Segoe UI", sans-serif;' +
    '}' +
    '.sb-uitleg-inner {' +
      'max-width: 1400px;' +
      'margin: 0 auto;' +
      'display: flex;' +
      'align-items: center;' +
      'gap: 20px;' +
      'justify-content: space-between;' +
      'flex-wrap: wrap;' +
    '}' +
    '.sb-uitleg-tekst {' +
      'font-size: 14px;' +
      'line-height: 1.5;' +
      'flex-grow: 1;' +
    '}' +
    '.sb-terug-btn {' +
      'background: #fff;' +
      'color: #2563eb;' +
      'border: none;' +
      'padding: 10px 18px;' +
      'border-radius: 8px;' +
      'font-weight: 800;' +
      'font-size: 14px;' +
      'cursor: pointer;' +
      'font-family: inherit;' +
      'white-space: nowrap;' +
    '}' +
    '.sb-terug-btn:hover { background: #eff6ff; }' +
    'body.smartboard { padding-top: 70px; }' +
    /* Timer-popup boven demo-banner plaatsen */
    '#timer-popup { z-index: 10001 !important; top: 120px !important; }';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ─── 6. TOON POPUP BIJ VERKOOP-TRIGGER ──────────────────────────────────────

  window.toonDemoPopup = function(titel, tekst, emoji) {
    emoji = emoji || '✨';
    var html =
      '<div class="demo-popup-overlay" id="demo-popup-current">' +
        '<div class="demo-popup-box">' +
          '<div class="demo-popup-icon">' + emoji + '</div>' +
          '<div class="demo-popup-title">' + titel + '</div>' +
          '<div class="demo-popup-text">' + tekst + '</div>' +
          '<a href="https://www.jufzisa.be/spelgenerator-app" target="_blank" class="demo-popup-btn-primary">' +
            'Ontdek de Spelgenerator →' +
          '</a>' +
          '<button class="demo-popup-btn-secondary" onclick="sluitDemoPopup()">' +
            'Terug naar de demo' +
          '</button>' +
        '</div>' +
      '</div>';
    var container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstChild);
  };

  window.sluitDemoPopup = function() {
    var pop = document.getElementById('demo-popup-current');
    if (pop) pop.remove();
  };

  // ─── 7. TOON BANNER BIJ LADEN ──────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maakDemoBanner);
  } else {
    maakDemoBanner();
  }

  // ─── 8. OVERSCHRIJF KNOPPEN DIE VERKOOP MOETEN TRIGGEREN ────────────────────
  // Na een korte delay (na klasbord.js), vervangen we een paar knoppen

  function installeerVerkoopTriggers() {

    // Terug-knop: naar onze probeer-pagina (NIET naar app.html PRO!)
    var backBtns = document.querySelectorAll('.pro-back-btn, .sb-back-btn');
    backBtns.forEach(function(btn) {
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '../../';
      };
      // Als het een <a> is:
      if (btn.tagName === 'A') {
        btn.href = '../../';
      }
      btn.textContent = '← Terug naar overzicht';
      btn.style.display = 'inline-flex';
    });

    // Backup & herstel knop → verkoop-popup
    overschrijfFunctie('openBackupModal', 'Backup & herstel',
      'In de Spelgenerator kan je je klasgegevens veilig opslaan en terugzetten. ' +
      'Zo gaat er nooit werk verloren bij het wisselen van toestel of bij een nieuwe klas.',
      '💾');

    // Export/backup opslaan → popup
    overschrijfFunctie('exportData', 'Backup opslaan',
      'Een backup opslaan werkt in de volledige Spelgenerator. ' +
      'Je kan je klasgegevens exporteren als bestand en later terugzetten bij een nieuwe start van het schooljaar.',
      '💾');

    // Import/backup terugzetten → popup
    overschrijfFunctie('importData', 'Backup terugzetten',
      'Een backup terugzetten werkt in de volledige Spelgenerator. ' +
      'Ideaal om bij een nieuw schooljaar je klas uit vorig jaar terug te halen.',
      '📂');

    // Nieuw schooljaar starten
    overschrijfFunctie('openNewSchoolYear', 'Nieuw schooljaar starten',
      'In de Spelgenerator kan je met één klik je oude klas archiveren en fris starten met een nieuwe klas. ' +
      'Namen en instellingen blijven bewaard zodat je snel weer aan de slag kan.',
      '🎒');

    // QR code / iPad-modus → verkoop-popup
    overschrijfFunctie('openQrModal', 'Kinderen laten afvinken via iPad',
      'In de Spelgenerator maak je met één klik een QR-code. Kinderen scannen die en kunnen hun eigen taken afvinken — zonder inlog. ' +
      'Jij ziet realtime wie klaar is, welke smiley ze hebben gezet en welke taken nog openstaan.',
      '📱');

    // Smartboard openen: in echte versie opent dit een nieuw venster — in demo switchen we modus ter plekke
    if (typeof window.openSmartboardVenster === 'function') {
      window.openSmartboardVenster = function() {
        activateerSmartboardDemo();
      };
    }

    // Nieuw bord → verkoop-popup
    overschrijfFunctie('openNieuwBordModal', 'Nieuwe klas aanmaken',
      'In de demo kan je niet zelf een nieuwe klas starten. ' +
      'In de Spelgenerator kan je tot 4 borden per type aanmaken — perfect voor meerdere klassen of niveaugroepen.',
      '🎯');

    // Welkomstbord: in demo hebben we geen welkomstbord, dus redirect naar overzicht
    if (typeof window.goBackToWelcome === 'function') {
      window.goBackToWelcome = function() {
        window.location.href = '../../';
      };
    }

    // Overschrijf clearAll (wissen) - laat werken maar toon melding
    if (typeof window.clearAll === 'function') {
      window.clearAll = function() {
        toonDemoPopup(
          'Wissen uitgeschakeld in demo',
          'In de demo kan je de voorbeeldklas niet wissen. Ververs de pagina (F5) om naar de startsituatie terug te gaan.',
          '🔄'
        );
      };
    }

    // Smartboard-exit: in demo een directe terugknop naar leerkrachtweergave
    if (typeof window.handleExitBtn === 'function') {
      window.handleExitBtn = function() {
        deactiveerSmartboardDemo();
      };
    }

    if (typeof window.exitSmartboard === 'function') {
      window.exitSmartboard = function(dest) {
        deactiveerSmartboardDemo();
      };
    }
  }

  // ─── SMARTBOARD-HELPERS VOOR DEMO ──────────────────────────────────────────

  function activateerSmartboardDemo() {
    // Voeg een uitleg-banner toe bovenaan
    var banner = document.getElementById('smartboard-demo-uitleg');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'smartboard-demo-uitleg';
      banner.innerHTML =
        '<div class="sb-uitleg-inner">' +
          '<div class="sb-uitleg-tekst">' +
            '<strong>📺 Smartboardweergave</strong><br>' +
            'Zo ziet het bord eruit op het klasbord-scherm. Alle bedieningsknoppen zijn verborgen, zodat kinderen niks per ongeluk kunnen aanklikken.' +
          '</div>' +
          '<button class="sb-terug-btn" onclick="deactiveerSmartboardDemo()">← Terug naar leerkrachtweergave</button>' +
        '</div>';
      document.body.appendChild(banner);
    }

    // Activeer smartboard modus zonder nieuw venster
    document.body.classList.add('smartboard');
    if (typeof window.applySmartboard === 'function') {
      // isSmartboard variabele zetten zodat de modus actief is
      window.isSmartboard = true;
      document.body.classList.add('smartboard');
    }

    // Verberg de demo-banner tijdelijk zodat het smartboard-scherm puur is
    var demoBanner = document.getElementById('demo-banner');
    if (demoBanner) demoBanner.style.display = 'none';
  }

  window.deactiveerSmartboardDemo = function() {
    document.body.classList.remove('smartboard');
    window.isSmartboard = false;

    var banner = document.getElementById('smartboard-demo-uitleg');
    if (banner) banner.remove();

    // Toon demo-banner weer
    var demoBanner = document.getElementById('demo-banner');
    if (demoBanner) demoBanner.style.display = '';

    // Verberg exit-knoppen
    var exitBtn = document.getElementById('smartboard-exit-btn');
    if (exitBtn) exitBtn.style.display = 'none';

    var exitOverlay = document.getElementById('smartboard-exit-overlay');
    if (exitOverlay) exitOverlay.classList.add('hidden');
  };

  function overschrijfFunctie(naam, titel, tekst, emoji) {
    if (typeof window[naam] === 'function') {
      window[naam] = function() {
        toonDemoPopup(titel, tekst, emoji);
      };
    }
  }

  // Wacht tot klasbord.js geladen en geïnitialiseerd is
  window.addEventListener('load', function() {
    setTimeout(installeerVerkoopTriggers, 500);
    setTimeout(installeerVerkoopTriggers, 1500); // nog eens voor de zekerheid
  });

})();
