// ═══════════════════════════════════════════════════════════════════════════
// DEMO-CONFIGURATIE — Takenbord per kind demo voor probeer-zisa
// Vervangt Firebase door dummies + laadt voorbeeldklas + banner + popups
// Moet geladen worden VOOR de inline script van takenbord_kind.html
// ═══════════════════════════════════════════════════════════════════════════

(function() {

  // ─── 1. VOORBEELDKLAS DATA ─────────────────────────────────────────────────

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

  // In kindbord krijgt elke leerling PERSOONLIJKE taken — differentiatie!
  // We maken 3 niveaus om de differentiatie-kracht te tonen:
  // - Sterk niveau (6 taken): Zoë, Emma, Nora, Jules, Lien, Eva, Mila
  // - Basis niveau (4 taken): meeste leerlingen
  // - Aangepast niveau (3 taken, minder moeilijk): Sam, Stan, Kobe

  var STERK_TAKEN = ['lezen', 'rekenen', 'schrijven', 'spelling', 'werkblad', 'project'];
  var BASIS_TAKEN = ['lezen', 'rekenen', 'schrijven', 'werkblad'];
  var AANGEPAST_TAKEN = ['lezen', 'tekenen', 'werkblad'];

  var STERK_IDX = [4, 6, 8, 9, 14, 16, 18]; // Zoë, Emma, Nora, Jules, Lien, Eva, Mila
  var AANGEPAST_IDX = [5, 11, 17]; // Stan, Sam, Kobe

  var personalAssignments = {};
  PUPILS.forEach(function(p, idx) {
    if (STERK_IDX.indexOf(idx) !== -1) {
      personalAssignments[p.id] = STERK_TAKEN.slice();
    } else if (AANGEPAST_IDX.indexOf(idx) !== -1) {
      personalAssignments[p.id] = AANGEPAST_TAKEN.slice();
    } else {
      personalAssignments[p.id] = BASIS_TAKEN.slice();
    }
  });

  // Progress: variatie per kind — sommige bijna klaar, sommige halverwege
  var progress = {};
  PUPILS.forEach(function(p, idx) {
    progress[p.id] = {};
    var taken = personalAssignments[p.id];

    taken.forEach(function(tId, tIdx) {
      var status = 0;
      var smiley = 0;

      if (idx === 11) {
        // Sam: achterstand
        if (tIdx === 0) { status = 2; smiley = 3; }
        else { status = 0; }
      } else if (idx % 7 === 0) {
        // Enkele leerlingen: helemaal klaar
        status = 2;
        smiley = (idx % 4) + 1;
      } else if (idx % 5 === 2) {
        // Bezig
        status = tIdx < 2 ? 2 : (tIdx === 2 ? 1 : 0);
        if (status === 2) smiley = (idx % 3) + 1;
      } else {
        // Meesten: 60-80% klaar
        status = tIdx < taken.length - 1 ? 2 : 1;
        if (status === 2) smiley = (idx + tIdx) % 4 + 1;
      }
      progress[p.id][tId] = {status: status, smiley: smiley};
    });
  });

  // Notities voor enkele leerlingen
  var notes = {};
  notes[PUPILS[11].id] = 'Sam heeft extra ondersteuning nodig. Werkt aan aangepast niveau.';
  notes[PUPILS[4].id]  = 'Zoë werkt aan het uitgebreide niveau — extra uitdaging.';

  // Combineer alle actieve taken (uniek)
  var allActiveTasks = [];
  Object.keys(personalAssignments).forEach(function(pid) {
    personalAssignments[pid].forEach(function(tId) {
      if (allActiveTasks.indexOf(tId) === -1) allActiveTasks.push(tId);
    });
  });

  var DEMO_STATE = {
    pupils: PUPILS,
    activeTasks: allActiveTasks,
    personalAssignments: personalAssignments,
    progress: progress,
    customTasks: [],
    notes: notes,
    showNumbers: false,
    showLastname: false,
    showSmileys: true,
    customIcons: {},
    pupilPhotos: {},
    taskLabelOverrides: {}
  };

  // ─── 2. LAAD DEMO-DATA IN LOCALSTORAGE ─────────────────────────────────────

  var STORAGE_KEY = 'takenbord_kind_v1';

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_STATE));
    localStorage.removeItem('borden_v1');
    localStorage.removeItem('kbBorden');
    console.log('[DEMO KIND] Voorbeeldklas geladen:', DEMO_STATE.pupils.length, 'leerlingen, 3 niveaus differentiatie');
  } catch(e) {
    console.warn('[DEMO KIND] localStorage niet beschikbaar:', e);
  }

  // ─── 3. DUMMY FIREBASE-FUNCTIES ────────────────────────────────────────────

  window.fbOnReady = function(cb) {
    setTimeout(function(){ cb(null); }, 10);
  };

  window.fbLoad        = function() { return Promise.resolve(null); };
  window.fbSave        = function() { return Promise.resolve(); };
  window.fbDelete      = function() { return Promise.resolve(); };
  window.fbLoadMeta    = function() { return Promise.resolve(null); };
  window.fbSaveMeta    = function() { return Promise.resolve(); };
  window.fbLoadShared  = function() { return Promise.resolve(null); };
  window.fbSaveShared  = function() { return Promise.resolve(); };
  window.fbListenShared = function() { return function(){}; };

  // ─── 4. DEMO-BANNER BOVENAAN ───────────────────────────────────────────────

  function maakDemoBanner() {
    var banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.innerHTML =
      '<div class="demo-banner-inner">' +
        '<span class="demo-banner-emoji">🦓</span>' +
        '<span class="demo-banner-text">' +
          '<strong>Dit is een demo met een fictieve voorbeeldklas</strong> — wijzigingen worden niet bewaard.' +
        '</span>' +
        '<a href="https://www.jufzisa.be/spelgenerator-app" target="_blank" class="demo-banner-btn">' +
          'Ontdek de Spelgenerator →' +
        '</a>' +
      '</div>';
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // ─── 5. CSS ─────────────────────────────────────────────────────────────────

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
    '.demo-popup-btn-secondary:hover { color: #2a2a2a; }' +
    /* Terug-knop in header */
    '.pro-back-btn[href*="app.html"] { display: none !important; }' +
    /* Timer-popup boven demo-banner */
    '#timer-popup { z-index: 10001 !important; top: 120px !important; }' +
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
    'body.smartboard { padding-top: 70px; }';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ─── 6. VERKOOP-POPUP FUNCTIE ──────────────────────────────────────────────

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

  // ─── 7. BANNER BIJ LADEN ───────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maakDemoBanner);
  } else {
    maakDemoBanner();
  }

  // ─── 8. OVERSCHRIJF KNOPPEN ─────────────────────────────────────────────────

  function installeerVerkoopTriggers() {

    // Twee duidelijk verschillende terug-knoppen
    var backBtns = document.querySelectorAll('.pro-back-btn, .kb-sb-back');
    backBtns.forEach(function(btn) {
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = './';
      };
      if (btn.tagName === 'A') btn.href = './';
      btn.textContent = '📋 Andere bord-demo';
      btn.style.display = 'inline-flex';
    });

    // Voeg extra knop toe aan de pro-header
    var proHeader = document.querySelector('.pro-header-left');
    if (proHeader && !proHeader.querySelector('.demo-alle-knop')) {
      var extraBtn = document.createElement('a');
      extraBtn.className = 'demo-alle-knop';
      extraBtn.href = '../../';
      extraBtn.textContent = '🦓 Alle probeer-tools';
      extraBtn.style.cssText =
        'background:#ffcf56;' +
        'color:#2a2a2a;' +
        'padding:5px 12px;' +
        'border-radius:8px;' +
        'font-size:13px;' +
        'font-weight:800;' +
        'text-decoration:none;' +
        'font-family:inherit;' +
        'margin-left:8px;' +
        'display:inline-flex;' +
        'align-items:center;';
      proHeader.appendChild(extraBtn);
    }

    // Welkomstbord: redirect naar keuze
    if (typeof window.goBackToWelcome === 'function') {
      window.goBackToWelcome = function() {
        window.location.href = './';
      };
    }

    // Backup opslaan / terugzetten → popups
    overschrijfFunctie('exportTakenbord', 'Backup opslaan',
      'Een backup opslaan werkt in de volledige Spelgenerator. ' +
      'Je kan je klasgegevens exporteren als bestand en later terugzetten bij een nieuw schooljaar.',
      '💾');

    overschrijfFunctie('importTakenbord', 'Backup terugzetten',
      'Een backup terugzetten werkt in de volledige Spelgenerator. ' +
      'Ideaal bij een nieuw schooljaar om je oude klas terug te halen.',
      '📂');

    // Nieuw schooljaar
    overschrijfFunctie('openKindNewSchoolYear', 'Nieuw schooljaar starten',
      'In de Spelgenerator kan je met één klik je oude klas archiveren en fris starten. ' +
      'Namen en instellingen blijven bewaard zodat je snel weer aan de slag kan.',
      '🎒');

    // QR-code voor kinderen
    overschrijfFunctie('openQrTakenbord', 'Kinderen laten afvinken via iPad',
      'In de Spelgenerator maak je met één klik een QR-code. Kinderen scannen die en zien hun eigen persoonlijke taken op de iPad. ' +
      'Jij ziet realtime wie klaar is.',
      '📱');

    // Smartboard openen: vervang door in-page smartboard modus met terugknop
    if (typeof window.openSmartboardTakenbord === 'function') {
      window.openSmartboardTakenbord = function() {
        activateerSmartboardDemo();
      };
    }

    // PDF-rapport
    overschrijfFunctie('openPdfModalKind', 'PDF rapport maken',
      'PDF-rapporten maken werkt in de volledige Spelgenerator. Je kan per leerling een overzicht exporteren van afgewerkte taken en smiley\'s — handig voor oudergesprekken.',
      '📄');

    // "Klaar voor vandaag" scherm: voeg terug-knoppen toe
    if (typeof window.showKindClosed === 'function') {
      window.showKindClosed = function() {
        var overlay = document.createElement('div');
        overlay.id = 'kind-klaar-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;background:linear-gradient(160deg,#f8fafc,#eef2ff);display:flex;align-items:center;justify-content:center;padding:20px;';
        overlay.innerHTML =
          '<div style="background:#fff;border-radius:24px;padding:32px 28px;max-width:420px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.1);text-align:center;font-family:\'Nunito\',sans-serif;">' +
            '<div style="font-size:48px;margin-bottom:12px;">✅</div>' +
            '<div style="font-size:22px;font-weight:800;color:#1e1b4b;margin-bottom:8px;">Klaar voor vandaag!</div>' +
            '<div style="font-size:15px;color:#64748b;line-height:1.6;margin-bottom:24px;">Goed gedaan! In de volledige Spelgenerator worden je taken automatisch opgeslagen.</div>' +
            '<button onclick="document.getElementById(\'kind-klaar-overlay\').remove()" style="background:#6366f1;color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:10px;width:100%;">' +
              '← Terug naar takenbord' +
            '</button>' +
            '<a href="./" style="display:block;background:transparent;color:#64748b;text-decoration:underline;padding:8px;font-size:13px;font-family:inherit;">' +
              'Terug naar keuze' +
            '</a>' +
          '</div>';
        document.body.appendChild(overlay);
      };
    }

    // handleExitBtn (als die bestaat) → ook terug naar takenbord
    if (typeof window.handleExitBtn === 'function') {
      window.handleExitBtn = function() {
        deactiveerSmartboardDemo();
      };
    }
  }

  // ─── SMARTBOARD-HELPERS VOOR DEMO ──────────────────────────────────────────

  function activateerSmartboardDemo() {
    // Voeg uitleg-banner toe bovenaan
    var banner = document.getElementById('smartboard-demo-uitleg');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'smartboard-demo-uitleg';
      banner.innerHTML =
        '<div class="sb-uitleg-inner">' +
          '<div class="sb-uitleg-tekst">' +
            '<strong>📺 Smartboardweergave</strong><br>' +
            'Zo ziet het takenbord eruit op het klasbord-scherm. Bedieningsknoppen zijn verborgen zodat kinderen niks per ongeluk kunnen aanklikken.' +
          '</div>' +
          '<button class="sb-terug-btn" onclick="deactiveerSmartboardDemo()">← Terug naar leerkrachtweergave</button>' +
        '</div>';
      document.body.appendChild(banner);
    }

    document.body.classList.add('smartboard');
    window.isSmartboard = true;

    var demoBanner = document.getElementById('demo-banner');
    if (demoBanner) demoBanner.style.display = 'none';
  }

  window.deactiveerSmartboardDemo = function() {
    document.body.classList.remove('smartboard');
    window.isSmartboard = false;

    var banner = document.getElementById('smartboard-demo-uitleg');
    if (banner) banner.remove();

    var demoBanner = document.getElementById('demo-banner');
    if (demoBanner) demoBanner.style.display = '';
  };

  function overschrijfFunctie(naam, titel, tekst, emoji) {
    if (typeof window[naam] === 'function') {
      window[naam] = function() {
        toonDemoPopup(titel, tekst, emoji);
      };
    }
  }

  // Wacht tot originele script geladen is
  window.addEventListener('load', function() {
    setTimeout(installeerVerkoopTriggers, 500);
    setTimeout(installeerVerkoopTriggers, 1500);
  });

})();