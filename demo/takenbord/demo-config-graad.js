// ═══════════════════════════════════════════════════════════════════════════
// DEMO-CONFIGURATIE — Graadsklas-weergave voor probeer-zisa
// Dit bestand vervangt Firebase door dummy-functies + laadt 2 voorbeeldklassen
// (3A + 4A) + toont demo-banner en PRO-labels op beheer-knoppen.
// Moet geladen worden VOOR klasbord_graad.js (niet daarna!)
// ═══════════════════════════════════════════════════════════════════════════

(function() {

  // ─── 1. VOORBEELDKLASSEN (3A + 4A) ─────────────────────────────────────────

  function uidDemo() {
    return 'demo_' + Math.random().toString(36).slice(2, 9);
  }

  // Klas 3A — 15 derdeklassers
  var PUPILS_3A = [
    {voornaam:'Jana',  achternaam:'Peeters'},
    {voornaam:'Bram',  achternaam:'Janssens'},
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
    {voornaam:'Lien',  achternaam:'Thys'}
  ].map(function(p){ return {id:uidDemo(), voornaam:p.voornaam, achternaam:p.achternaam}; });

  // Klas 4A — 12 vierdeklassers
  var PUPILS_4A = [
    {voornaam:'Finn',   achternaam:'de Graaf'},
    {voornaam:'Amira',  achternaam:'El Amrani'},
    {voornaam:'Liam',   achternaam:'Bekkers'},
    {voornaam:'Noor',   achternaam:'Willems'},
    {voornaam:'Thijs',  achternaam:'Verhoeven'},
    {voornaam:'Zoë',    achternaam:'Meijer'},
    {voornaam:'Kobe',   achternaam:'Aerts'},
    {voornaam:'Mila',   achternaam:'Beeckman'},
    {voornaam:'Arne',   achternaam:'Lemmens'},
    {voornaam:'Eva',    achternaam:'De Wilde'},
    {voornaam:'Vic',    achternaam:'Smets'},
    {voornaam:'Elif',   achternaam:'Demir'}
  ].map(function(p){ return {id:uidDemo(), voornaam:p.voornaam, achternaam:p.achternaam}; });

  // Taken per klas — verschillende klassen, verschillende werkbladen
  var TAKEN_3A = ['lezen', 'rekenen', 'schrijven', 'werkblad'];
  var TAKEN_4A = ['lezen', 'rekenen', 'schrijven', 'werkblad'];

  // Realistische vink-patronen bouwen
  function bouwProgress(pupils, taken, zaadIdx) {
    var progress = {};
    pupils.forEach(function(p, idx){
      progress[p.id] = {};
      taken.forEach(function(tId, tidx){
        var status = 0;
        var smiley = 0;
        // Bewust patroon: sommige leerlingen helemaal klaar, anderen bezig
        var seed = (idx + zaadIdx*3 + tidx) % 10;
        if (seed < 5) {
          // Klaar (met smiley)
          status = 2;
          smiley = ((idx + tidx) % 4) + 1;
        } else if (seed < 7) {
          // Bezig
          status = 1;
        } else {
          // Nog niet begonnen
          status = 0;
        }
        // Zorg dat laatste leerling nog 1-2 taken open heeft (realistisch)
        if (idx === pupils.length - 1 && tidx >= 2) status = 0;
        progress[p.id][tId] = { status: status, smiley: smiley };
      });
    });
    return progress;
  }

  // Voorbeeld-notities (enkel bij 1 leerling per klas)
  var notes_3A = {};
  notes_3A[PUPILS_3A[5].id] = 'Werkt heel zelfstandig, mag uitdagender werk.';
  var notes_4A = {};
  notes_4A[PUPILS_4A[4].id] = 'Had vandaag extra uitleg nodig bij schrijven.';

  var STATE_3A = {
    pupils: PUPILS_3A,
    activeTasks: TAKEN_3A,
    progress: bouwProgress(PUPILS_3A, TAKEN_3A, 0),
    customTasks: [],
    pupilTaskOverrides: {},
    notes: notes_3A,
    showNumbers: false,
    showLastname: false,
    showSmileys: true,
    customIcons: {},
    pupilPhotos: {},
    taskLabelOverrides: {},
    boardSize: 'normal'
  };

  var STATE_4A = {
    pupils: PUPILS_4A,
    activeTasks: TAKEN_4A,
    progress: bouwProgress(PUPILS_4A, TAKEN_4A, 1),
    customTasks: [],
    pupilTaskOverrides: {},
    notes: notes_4A,
    showNumbers: false,
    showLastname: false,
    showSmileys: true,
    customIcons: {},
    pupilPhotos: {},
    taskLabelOverrides: {},
    boardSize: 'normal'
  };

  // ─── 2. GRAADSKLAS-DEFINITIE ────────────────────────────────────────────────
  // De graadsklas-pagina verwacht deze data op basis van ?graadid=

  var DEMO_GRAADID = 'demo_graad_3a_4a';

  var DEMO_GRAADSKLAS = {
    id: DEMO_GRAADID,
    naam: 'Mijn graadsklas 3A + 4A',
    bord1: {
      bordid: 'demo_bord_3a',
      storageKey: 'demo_storage_3a',
      klaslabel: '3A',
      bordnaam: 'Klasbord 3A — week 14'
    },
    bord2: {
      bordid: 'demo_bord_4a',
      storageKey: 'demo_storage_4a',
      klaslabel: '4A',
      bordnaam: 'Klasbord 4A — week 14'
    },
    aangemaakt: Date.now(),
    bijgewerkt: Date.now()
  };

  // ─── 3. ZORG DAT URL CORRECT IS ────────────────────────────────────────────
  // Als er geen graadid in de URL staat, voeg hem toe zodat de pagina werkt
  var urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.get('graadid')) {
    urlParams.set('graadid', DEMO_GRAADID);
    var newUrl = window.location.pathname + '?' + urlParams.toString();
    history.replaceState({}, '', newUrl);
  }

  // ─── 3b. LOCALSTORAGE RESETTEN ─────────────────────────────────────────────
  // Anders kan een vorige sessie (of een andere demo) vervuilde data hebben.
  // We willen altijd vers starten vanaf de voorbeeld-klassen.
  try {
    localStorage.removeItem('demo_storage_3a');
    localStorage.removeItem('demo_storage_4a');
    localStorage.removeItem('graadsklas_' + DEMO_GRAADID);
  } catch(e) {}

  // ─── 4. DUMMY FIREBASE-FUNCTIES ────────────────────────────────────────────
  // De graadsklas-pagina verwacht fbLoadShared voor graadsklas_{id} EN voor
  // de bord-storagekeys (voor de twee afzonderlijke klasborden).

  var SHARED_STORE = {};
  SHARED_STORE['graadsklas_' + DEMO_GRAADID] = DEMO_GRAADSKLAS;
  SHARED_STORE['demo_storage_3a'] = STATE_3A;
  SHARED_STORE['demo_storage_4a'] = STATE_4A;

  var LISTENERS = {}; // storageKey → callback

  window.fbOnReady = function(cb) {
    // Geef een uid-string terug (zoals echte Firebase), niet een object
    setTimeout(function(){ cb('demo-user'); }, 10);
  };

  // Simuleer privé-opslag: klasbord_graad.js verwacht volledige bord-state
  // (pupils, activeTasks, progress) uit fbLoad. In productie zit die in de
  // privé-collectie van de leerkracht. In demo simuleren we dat met dezelfde
  // store als fbLoadShared.
  window.fbLoad = function(storageKey) {
    return Promise.resolve(SHARED_STORE[storageKey] || null);
  };

  window.fbSave = function(storageKey, data) {
    SHARED_STORE[storageKey] = data;
    if (LISTENERS[storageKey]) {
      try { LISTENERS[storageKey](data); } catch(e) {}
    }
    return Promise.resolve();
  };
  window.fbDelete = function() { return Promise.resolve(); };
  window.fbLoadMeta = function() { return Promise.resolve(null); };
  window.fbSaveMeta = function() { return Promise.resolve(); };

  window.fbLoadShared = function(storageKey) {
    return Promise.resolve(SHARED_STORE[storageKey] || null);
  };

  window.fbSaveShared = function(storageKey, data) {
    SHARED_STORE[storageKey] = data;
    if (LISTENERS[storageKey]) {
      try { LISTENERS[storageKey](data); } catch(e) {}
    }
    return Promise.resolve();
  };

  window.fbListenShared = function(storageKey, callback) {
    LISTENERS[storageKey] = callback;
    // Stuur huidige data direct
    setTimeout(function(){
      if (SHARED_STORE[storageKey]) {
        try { callback(SHARED_STORE[storageKey]); } catch(e) {}
      }
    }, 20);
    // Unsubscribe-functie
    return function(){ delete LISTENERS[storageKey]; };
  };

  // ─── 5. DEMO-BANNER BOVENAAN ───────────────────────────────────────────────

  function maakDemoBanner() {
    var banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.innerHTML =
      '<div class="demo-banner-inner">' +
        '<span class="demo-banner-emoji">🦓</span>' +
        '<span class="demo-banner-text">' +
          '<strong>Graadsklas-demo</strong> — wijzigingen worden niet bewaard. ' +
          'In de volledige Spelgenerator werkt alles realtime en bewaart alles automatisch.' +
        '</span>' +
        '<a href="https://www.jufzisa.be/spelgenerator-app" target="_blank" class="demo-banner-btn">' +
          '👉 Bekijk Spelgenerator' +
        '</a>' +
        '<a href="./" class="demo-banner-btn" style="background:#e0e7ff;color:#4338ca;margin-left:8px;">' +
          '← Andere demo\'s' +
        '</a>' +
      '</div>';
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // ─── 6. STYLING ─────────────────────────────────────────────────────────────

  var STYLE =
    '#demo-banner {' +
      'background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);' +
      'color: #fff;' +
      'padding: 12px 20px;' +
      'font-family: "Nunito", "Segoe UI", sans-serif;' +
      'box-shadow: 0 2px 8px rgba(99,102,241,0.2);' +
      'position: sticky; top: 0; z-index: 9999;' +
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
    '.demo-banner-text { flex-grow: 1; font-size: 14px; line-height: 1.5; }' +
    '.demo-banner-text strong { color: #fff; font-weight: 800; }' +
    '.demo-banner-btn {' +
      'background: #2a2a2a;' +
      'color: #ffcf56;' +
      'padding: 7px 14px;' +
      'border-radius: 8px;' +
      'text-decoration: none;' +
      'font-weight: 800;' +
      'font-size: 13px;' +
      'white-space: nowrap;' +
    '}' +
    '.demo-banner-btn:hover { background: #1a1a1a; }' +
    '@media (max-width: 640px) {' +
      '.demo-banner-inner { flex-direction: column; text-align: center; }' +
      '.demo-banner-text { font-size: 12px; }' +
    '}' +

    /* PRO-LABEL STIJL voor beheer-knoppen */
    '.demo-pro-badge {' +
      'display: inline-flex;' +
      'align-items: center;' +
      'gap: 4px;' +
      'background: linear-gradient(135deg, #fbbf24, #f59e0b);' +
      'color: #78350f;' +
      'font-size: 9px;' +
      'font-weight: 800;' +
      'padding: 1px 5px;' +
      'border-radius: 4px;' +
      'margin-left: 4px;' +
      'vertical-align: middle;' +
      'letter-spacing: 0.03em;' +
    '}' +
    '.demo-pro-btn {' +
      'opacity: 0.7;' +
      'cursor: not-allowed !important;' +
      'position: relative;' +
    '}' +
    '.demo-pro-btn:hover {' +
      'opacity: 0.85;' +
      'transform: none !important;' +
    '}' +

    /* Verberg PRO-header terug-knop (we hebben eigen nav in banner) */
    '.pro-back-btn { display: none !important; }' +
    /* Verberg sluiten-knop in graadsklas-topbar (geen welkomstbord om naar terug te keren) */
    '.graad-btn-sluiten { display: none !important; }' +

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
    '.demo-popup-icon { font-size: 48px; margin-bottom: 12px; }' +
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
      'background: linear-gradient(135deg, #6366f1, #8b5cf6);' +
      'color: #fff;' +
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
    '.demo-popup-btn-primary:hover { filter: brightness(1.1); }' +
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
    '}';

  function voegStylingToe() {
    var style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  // ─── 7. VERKOOP-POPUP ───────────────────────────────────────────────────────

  function toonDemoPopup(titel, tekst, icon) {
    // Als er al een popup openstaat, sluit hem eerst
    var bestaande = document.getElementById('demo-popup');
    if (bestaande) bestaande.remove();

    var overlay = document.createElement('div');
    overlay.id = 'demo-popup';
    overlay.className = 'demo-popup-overlay';
    overlay.innerHTML =
      '<div class="demo-popup-box">' +
        '<div class="demo-popup-icon">' + (icon || '✨') + '</div>' +
        '<div class="demo-popup-title">' + titel + '</div>' +
        '<div class="demo-popup-text">' + tekst + '</div>' +
        '<a href="https://www.jufzisa.be/spelgenerator-app" target="_blank" class="demo-popup-btn-primary">' +
          '🎯 Ontdek Spelgenerator' +
        '</a>' +
        '<button class="demo-popup-btn-secondary" onclick="document.getElementById(\'demo-popup\').remove()">' +
          'Terug naar demo' +
        '</button>' +
      '</div>';
    overlay.addEventListener('click', function(e){
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  window.toonDemoPopup = toonDemoPopup;

  // ─── 8. PRO-LABELS EN KNOP-INTERCEPTIE ─────────────────────────────────────
  // We wachten tot de graadsklas-pagina klaar is, dan:
  // - Plaatsen we PRO-labels op alle beheer/PDF/QR/Smartboard-knoppen
  // - Vervangen we hun klik door een verkoop-popup

  function configureerKnoppen() {
    // Knoppen in topbar
    var topbarActies = [
      {
        selector: '.graad-btn.pdf-1, .graad-btn.pdf-2',
        titel: 'PDF-rapport per klas',
        tekst: 'In de Spelgenerator exporteer je met één klik een volledig PDF-rapport per klas — met overzicht, smileys, bevindingen en detailpagina\'s per leerling. Ideaal voor een oudercontact of rapport.',
        icon: '📄'
      },
      {
        selector: '.graad-btn-qr',
        titel: 'Kinderen afvinken via iPad',
        tekst: 'In de Spelgenerator maak je met één klik een QR-code. De kinderen kiezen hun klas (3A of 4A) en vinken zelf hun taken af op een iPad. Jij ziet realtime wie klaar is.',
        icon: '📱'
      },
      {
        selector: '.graad-btn-smartboard',
        titel: 'Smartboard-modus',
        tekst: 'In de Spelgenerator open je met één klik een volledig scherm-smartboardweergave — zonder beheer-knoppen, grote taakhokjes, ideaal vanaf de achterkant van de klas.',
        icon: '📺'
      }
    ];

    topbarActies.forEach(function(act){
      document.querySelectorAll(act.selector).forEach(function(btn){
        // PRO-badge toevoegen
        if (!btn.querySelector('.demo-pro-badge')) {
          var badge = document.createElement('span');
          badge.className = 'demo-pro-badge';
          badge.textContent = '⭐ PRO';
          btn.appendChild(badge);
        }
        btn.classList.add('demo-pro-btn');
        // Originele click vervangen door popup
        var nieuweBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(nieuweBtn, btn);
        nieuweBtn.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();
          toonDemoPopup(act.titel, act.tekst, act.icon);
          return false;
        };
        // Als het een <a> is, href neutraliseren
        if (nieuweBtn.tagName === 'A') nieuweBtn.removeAttribute('href');
      });
    });

    // ⚙️ Beheer-knoppen per bord (in de bord-header)
    document.querySelectorAll('.graad-bord-hdr-acties a, .graad-bord-hdr-acties button').forEach(function(btn){
      if (!btn.querySelector('.demo-pro-badge')) {
        var badge = document.createElement('span');
        badge.className = 'demo-pro-badge';
        badge.textContent = '⭐ PRO';
        btn.appendChild(badge);
      }
      btn.classList.add('demo-pro-btn');
      var nieuweBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(nieuweBtn, btn);
      nieuweBtn.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        toonDemoPopup(
          'Beheer per klasbord',
          'In de Spelgenerator kan je leerlingen toevoegen, taken aanpassen, foto\'s toevoegen en veel meer per klasbord. De graadsklas-weergave werkt automatisch mee.',
          '⚙️'
        );
        return false;
      };
      if (nieuweBtn.tagName === 'A') nieuweBtn.removeAttribute('href');
    });

    // Notes-knoppen 🔒 op de leerlingen → eveneens PRO-popup
    // Want opslaan werkt niet in demo
    document.querySelectorAll('.gb-notes-btn').forEach(function(btn){
      btn.classList.add('demo-pro-btn');
      var originalOnclick = btn.onclick;
      btn.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        toonDemoPopup(
          'Bevindingen per leerling',
          'In de Spelgenerator typ je hier persoonlijke opmerkingen per leerling — "werkte zelfstandig", "had extra uitleg nodig" enz. Die komen mee in het PDF-rapport en blijven mooi bewaard.',
          '🔒'
        );
        return false;
      };
    });
  }

  // ─── 9. INIT ─────────────────────────────────────────────────────────────────
  // DOMContentLoaded triggert zodra de HTML geladen is, maar voordat klasbord_graad.js
  // klaar is. We wachten dus een kleine tijd totdat de graadsklas gerenderd is.

  document.addEventListener('DOMContentLoaded', function(){
    voegStylingToe();
    maakDemoBanner();

    // Wacht tot de graadsklas-pagina haar borden heeft opgebouwd.
    // renderSlot wordt aangeroepen zodra de data binnen is — dus we wachten tot
    // de typische topbar-knoppen (.graad-btn) in de DOM staan.
    var probeerAantal = 0;
    var interval = setInterval(function(){
      probeerAantal++;
      if (document.querySelector('.graad-btn.pdf-1')) {
        clearInterval(interval);
        // Nog even wachten tot render helemaal klaar is
        setTimeout(configureerKnoppen, 200);
        // Notes-knoppen komen later (na render) — periodiek herconfigureren
        setTimeout(configureerKnoppen, 1000);
        setTimeout(configureerKnoppen, 2500);
      }
      if (probeerAantal > 50) clearInterval(interval); // geef op na 5 seconden
    }, 100);
  });

  console.log('[DEMO-GRAAD] Config geladen — graadsklas-demo actief met 3A + 4A');

})();