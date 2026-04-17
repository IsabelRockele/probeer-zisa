// ═══════════════════════════════════════════════════════════════════════════
// DEMO-BANNER + VERKOOP-POPUPS voor Opvolging huistaken demo
// Dit script werkt SAMEN met opvolging_huistaken-app-demo.js
// (de Firebase-vervanging en voorbeelddata zitten in dat bestand)
// ═══════════════════════════════════════════════════════════════════════════

(function() {

  // ─── CSS ─────────────────────────────────────────────────────────────────

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
      'background: #2a2a2a;' +
      'color: #ffcf56;' +
      'padding: 12px 28px;' +
      'border-radius: 8px;' +
      'text-decoration: none;' +
      'font-weight: 800;' +
      'font-size: 15px;' +
      'margin-bottom: 10px;' +
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
    '.demo-popup-btn-secondary:hover { color: #2a2a2a; }';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ─── BANNER ──────────────────────────────────────────────────────────────

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maakDemoBanner);
  } else {
    maakDemoBanner();
  }

  // ─── VERKOOP-POPUP FUNCTIE ────────────────────────────────────────────────

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

  // ─── NIEUW SCHOOLJAAR KNOP VERVANGEN ──────────────────────────────────────
  // "Nieuw schooljaar" zou in de demo niks bereiken, dus toon popup

  window.addEventListener('load', function() {
    setTimeout(function() {
      var nieuwSjBtn = document.getElementById('nieuwSchooljaarBtn');
      if (nieuwSjBtn) {
        var nieuwKloon = nieuwSjBtn.cloneNode(true);
        nieuwSjBtn.parentNode.replaceChild(nieuwKloon, nieuwSjBtn);
        nieuwKloon.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          window.toonDemoPopup(
            'Nieuw schooljaar starten',
            'In de Spelgenerator kan je elk nieuw schooljaar een fris startpunt maken terwijl je oude gegevens bewaard blijven. Maximum 2 schooljaren tegelijk — perfect om te vergelijken.',
            '🎒'
          );
        });
      }
    }, 1000);
  });

})();
