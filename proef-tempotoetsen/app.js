// ============================================
// Tempotoetsen - Oefeningen generator
// ============================================

// --- Hulpfuncties ---
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// MAALTAFELS
// ============================================
// config: { tafels: [2,3,...,10], richting: 'ax' | 'xa' | 'beide' }
function genereerMaaltafel(config) {
  const tafel = pickFrom(config.tafels);
  const factor = randInt(1, 10);

  let a, b;
  if (config.richting === 'ax') {
    a = tafel; b = factor; // bv. 5 × 2
  } else if (config.richting === 'xa') {
    a = factor; b = tafel; // bv. 2 × 5
  } else {
    // beide: random
    if (Math.random() < 0.5) { a = tafel; b = factor; }
    else { a = factor; b = tafel; }
  }

  return {
    vraag: `${a} × ${b}`,
    antwoord: a * b
  };
}

// ============================================
// DEELTAFELS
// ============================================
// config: { tafels: [2,3,...,10] }
function genereerDeeltafel(config) {
  const tafel = pickFrom(config.tafels);
  const factor = randInt(1, 10);
  const deeltal = tafel * factor;

  return {
    vraag: `${deeltal} : ${tafel}`,
    antwoord: factor
  };
}

// ============================================
// GEMENGD × en :
// ============================================
// config: { tafelsKeer: [...], tafelsDeel: [...], richting: 'ax'|'xa'|'beide' }
function genereerGemengdMaalDeel(config) {
  if (Math.random() < 0.5) {
    return genereerMaaltafel({ tafels: config.tafelsKeer, richting: config.richting });
  } else {
    return genereerDeeltafel({ tafels: config.tafelsDeel });
  }
}

// ============================================
// GETALBEELDEN
// ============================================
// config: { max: 20|100, type: 'mab'|'honderdveld'|'notatie'|'rekenrek'|'mix' }
function genereerGetalbeeld(config) {
  const max = config.max || 100;

  let weergave = config.type || 'mab';
  if (weergave === 'mix') {
    const opties = max <= 20
      ? ['mab', 'honderdveld', 'notatie', 'rekenrek']
      : ['mab', 'honderdveld', 'notatie'];
    weergave = opties[randInt(0, opties.length - 1)];
  }

  // Rekenrek is beperkt tot 20
  if (weergave === 'rekenrek' && max > 20) {
    weergave = 'mab';
  }

  let getal;
  if (weergave === 'notatie') {
    // Voor notatie: vermijd ronde getallen (10, 20, 30...) en getallen <10,
    // want die hebben geen T+E combo en dus geen omdraai-uitdaging.
    // Kies een getal met zowel een tiental als een eenheid.
    if (max <= 20) {
      // 11-19
      getal = randInt(11, 19);
    } else {
      // 11-99, geen veelvouden van 10
      do {
        getal = randInt(11, 99);
      } while (getal % 10 === 0);
    }
  } else {
    getal = randInt(1, max);
  }

  return {
    vraag: { type: 'getalbeeld', weergave, getal },
    antwoord: getal
  };
}

// ============================================
// OPTELLEN / AFTREKKEN TOT 10
// ============================================
// config: { bewerking: 'plus' | 'min' | 'gemengd' }
// patroon: 'plus' of 'min' (voor gemengd, vanuit genereerToets)
// ============================================
// OPTELLEN / AFTREKKEN TOT 5
// ============================================
// config: { bewerking: 'plus'|'min'|'gemengd' }
function genereerOptelAftrek5(config, patroon) {
  const bewerking = patroon
    || (config.bewerking === 'gemengd'
      ? (Math.random() < 0.5 ? 'plus' : 'min')
      : config.bewerking);

  if (bewerking === 'plus') {
    const a = randInt(0, 5);
    const b = randInt(0, 5 - a);
    return { vraag: `${a} + ${b}`, antwoord: a + b };
  } else {
    const a = randInt(0, 5);
    const b = randInt(0, a);
    return { vraag: `${a} - ${b}`, antwoord: a - b };
  }
}

function genereerOptelAftrek10(config, patroon) {
  const bewerking = patroon
    || (config.bewerking === 'gemengd'
      ? (Math.random() < 0.5 ? 'plus' : 'min')
      : config.bewerking);

  if (bewerking === 'plus') {
    const a = randInt(0, 10);
    const b = randInt(0, 10 - a);
    return { vraag: `${a} + ${b}`, antwoord: a + b };
  } else {
    const a = randInt(0, 10);
    const b = randInt(0, a);
    return { vraag: `${a} - ${b}`, antwoord: a - b };
  }
}

// ============================================
// OPTELLEN / AFTREKKEN TOT 20
// ============================================
// config: { bewerking: 'plus'|'min'|'gemengd', brug: 'zonder'|'met'|'gemengd' }
function genereerOptelAftrek20(config, patroon) {
  const bewerking = patroon
    || (config.bewerking === 'gemengd'
      ? (Math.random() < 0.5 ? 'plus' : 'min')
      : config.bewerking);

  const brug = config.brug === 'gemengd'
    ? (Math.random() < 0.5 ? 'zonder' : 'met')
    : config.brug;

  if (bewerking === 'plus') {
    return genereerPlusTot20(brug);
  } else {
    return genereerMinTot20(brug);
  }
}

function genereerPlusTot20(brug) {
  // Brug = je gaat over de tien (eenheden a + eenheden b > 10)
  let a, b;
  let pogingen = 0;
  while (pogingen < 50) {
    a = randInt(1, 19);
    b = randInt(1, 20 - a);
    const eenhA = a % 10;
    const eenhB = b % 10;
    const heeftBrug = (eenhA + eenhB > 10) && (eenhA !== 0) && (eenhB !== 0);
    if (brug === 'met' && heeftBrug) break;
    if (brug === 'zonder' && !heeftBrug) break;
    pogingen++;
  }
  return { vraag: `${a} + ${b}`, antwoord: a + b };
}

function genereerMinTot20(brug) {
  // Brug bij aftrekken: eenheden aftrekker > eenheden aftrektal
  let a, b;
  let pogingen = 0;
  while (pogingen < 50) {
    a = randInt(1, 20);
    b = randInt(1, a);
    const eenhA = a % 10;
    const eenhB = b % 10;
    const heeftBrug = (eenhB > eenhA) && (a > 10) && (b <= 10);
    if (brug === 'met' && heeftBrug) break;
    if (brug === 'zonder' && !heeftBrug) break;
    pogingen++;
  }
  return { vraag: `${a} - ${b}`, antwoord: a - b };
}

// ============================================
// OPTELLEN / AFTREKKEN TOT 100
// ============================================
// config: { bewerking: 'plus'|'min'|'gemengd', brug: 'zonder'|'met'|'gemengd' }
function genereerOptelAftrek100(config, patroon) {
  const bewerking = patroon
    || (config.bewerking === 'gemengd'
      ? (Math.random() < 0.5 ? 'plus' : 'min')
      : config.bewerking);

  const brug = config.brug === 'gemengd'
    ? (Math.random() < 0.5 ? 'zonder' : 'met')
    : config.brug;

  if (bewerking === 'plus') {
    return genereerPlusTot100(brug);
  } else {
    return genereerMinTot100(brug);
  }
}

function genereerPlusTot100(brug) {
  let a, b;
  let pogingen = 0;
  while (pogingen < 50) {
    a = randInt(11, 89);
    b = randInt(2, 100 - a);
    const eenhA = a % 10;
    const eenhB = b % 10;
    const heeftBrug = (eenhA + eenhB > 10) && (eenhA !== 0) && (eenhB !== 0);
    if (brug === 'met' && heeftBrug) break;
    if (brug === 'zonder' && !heeftBrug) break;
    pogingen++;
  }
  return { vraag: `${a} + ${b}`, antwoord: a + b };
}

function genereerMinTot100(brug) {
  let a, b;
  let pogingen = 0;
  while (pogingen < 50) {
    a = randInt(11, 99);
    b = randInt(2, a - 1);
    const eenhA = a % 10;
    const eenhB = b % 10;
    const heeftBrug = (eenhB > eenhA);
    if (brug === 'met' && heeftBrug) break;
    if (brug === 'zonder' && !heeftBrug) break;
    pogingen++;
  }
  return { vraag: `${a} - ${b}`, antwoord: a - b };
}

// ============================================
// SPLITSINGEN
// ============================================
// config: {
//   totaal: 5|6|7|8|9|10,  - alle splitsingen tot EN MET dit getal
//   variant: 'top'|'kind'|'mix' - wat ontbreekt
// }
function genereerSplitsing(config) {
  const maxTotaal = config.totaal || 10;
  // Kies random totaal tussen 2 en maxTotaal
  const totaal = randInt(2, maxTotaal);
  // Kies random linker deel tussen 0 en totaal
  const linker = randInt(0, totaal);
  const rechter = totaal - linker;

  // Bepaal welke variant
  let variant = config.variant;
  if (variant === 'mix') {
    const keuzes = ['top', 'links', 'rechts'];
    variant = keuzes[randInt(0, 2)];
  } else if (variant === 'kind') {
    variant = Math.random() < 0.5 ? 'links' : 'rechts';
  }
  // 'top' blijft zoals het is

  let getoond, gevraagd, antwoord;
  if (variant === 'top') {
    getoond = { top: null, links: linker, rechts: rechter };
    gevraagd = 'top';
    antwoord = totaal;
  } else if (variant === 'links') {
    getoond = { top: totaal, links: null, rechts: rechter };
    gevraagd = 'links';
    antwoord = linker;
  } else { // rechts
    getoond = { top: totaal, links: linker, rechts: null };
    gevraagd = 'rechts';
    antwoord = rechter;
  }

  return {
    vraag: { type: 'splitsing', ...getoond, gevraagd },
    antwoord
  };
}
function genereerToets(type, config, aantal = 10) {
  const oefeningen = [];
  const gezien = new Set();
  let veiligheid = 0;

  // Voor gemengd-modi: maak vooraf een balans-patroon (50/50)
  // Patroon bepaalt per oefening welke subtype die moet zijn
  let patroon = null;

  if (type === 'gemengd-maal-deel') {
    // 5 maal, 5 deel, geshuffeld
    patroon = shuffle([
      ...Array(Math.floor(aantal / 2)).fill('maal'),
      ...Array(Math.ceil(aantal / 2)).fill('deel')
    ]);
  } else if (config && config.bewerking === 'gemengd') {
    // 5 plus, 5 min
    patroon = shuffle([
      ...Array(Math.floor(aantal / 2)).fill('plus'),
      ...Array(Math.ceil(aantal / 2)).fill('min')
    ]);
  }

  while (oefeningen.length < aantal && veiligheid < aantal * 15) {
    let oef;
    const idx = oefeningen.length;

    switch (type) {
      case 'maaltafels':
        oef = genereerMaaltafel(config); break;
      case 'deeltafels':
        oef = genereerDeeltafel(config); break;
      case 'gemengd-maal-deel':
        // Gebruik patroon
        if (patroon[idx] === 'maal') {
          oef = genereerMaaltafel({ tafels: config.tafelsKeer, richting: config.richting });
        } else {
          oef = genereerDeeltafel({ tafels: config.tafelsDeel });
        }
        break;
      case 'getalbeelden':
        oef = genereerGetalbeeld(config); break;
      case 'optel-aftrek-5':
        oef = genereerOptelAftrek5(config, patroon ? patroon[idx] : null); break;
      case 'optel-aftrek-10':
        oef = genereerOptelAftrek10(config, patroon ? patroon[idx] : null); break;
      case 'optel-aftrek-20':
        oef = genereerOptelAftrek20(config, patroon ? patroon[idx] : null); break;
      case 'optel-aftrek-100':
        oef = genereerOptelAftrek100(config, patroon ? patroon[idx] : null); break;
      case 'splitsingen':
        oef = genereerSplitsing(config); break;
      default:
        oef = { vraag: '?', antwoord: 0 };
    }

    const sleutel = typeof oef.vraag === 'string'
      ? oef.vraag
      : JSON.stringify(oef.vraag);

    if (!gezien.has(sleutel)) {
      gezien.add(sleutel);
      oefeningen.push(oef);
    }
    veiligheid++;
  }

  // Veiligheidsnet: als we nog geen 10 hebben (te strenge filters), vul aan met duplicaten
  while (oefeningen.length < aantal && oefeningen.length > 0) {
    oefeningen.push(oefeningen[oefeningen.length % Math.max(1, oefeningen.length)]);
  }

  return oefeningen;
}

// Exporteer voor gebruik in het browser-script (window-scope)
window.TempotoetsenGen = {
  genereerToets,
  randInt,
  shuffle
};
// ============================================
// Tempotoetsen - Main script
// ============================================

const isPRO = window.ISPRO === true;

// State
const state = {
  type: 'maaltafels', // actief tabblad
  config: {
    maaltafels: { tafels: [2, 10], richting: 'beide' },
    deeltafels: { tafels: [2, 10] },
    'gemengd-maal-deel': { tafelsKeer: [2, 10], tafelsDeel: [2, 10], richting: 'beide' },
    getalbeelden: { max: 100, type: 'mix' },
    'optel-aftrek-5': { bewerking: 'gemengd' },
    'optel-aftrek-10': { bewerking: 'gemengd' },
    'optel-aftrek-20': { bewerking: 'gemengd', brug: 'gemengd' },
    'optel-aftrek-100': { bewerking: 'gemengd', brug: 'gemengd' },
    splitsingen: { totaal: 10, variant: 'mix' }
  },
  huidigeOefeningen: []
};

// Alle tabbladen zijn beschikbaar in beide versies
function isTypePro(type) {
  return false;
}

// ============================================
// Tabbladen
// ============================================
const tabConfig = [
  { id: 'maaltafels', label: 'Maaltafels' },
  { id: 'deeltafels', label: 'Deeltafels' },
  { id: 'gemengd-maal-deel', label: 'Gemengd × en :' },
  { id: 'splitsingen', label: 'Splitsingen' },
  { id: 'getalbeelden', label: 'Getalbeelden' },
  { id: 'optel-aftrek-5', label: '+ en − tot 5' },
  { id: 'optel-aftrek-10', label: '+ en − tot 10' },
  { id: 'optel-aftrek-20', label: '+ en − tot 20' },
  { id: 'optel-aftrek-100', label: '+ en − tot 100' }
];

function renderTabs() {
  const c = document.getElementById('tabs');
  c.innerHTML = '';
  tabConfig.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (state.type === t.id ? ' actief' : '');
    btn.textContent = t.label;
    if (!isPRO && isTypePro(t.id)) {
      const slot = document.createElement('span');
      slot.className = 'pro-slot';
      slot.textContent = 'PRO';
      btn.appendChild(slot);
    }
    btn.addEventListener('click', () => {
      if (!isPRO && isTypePro(t.id)) {
        toonProInfo();
        return;
      }
      state.type = t.id;
      renderTabs();
      renderConfig();
      updatePreview();
    });
    c.appendChild(btn);
  });
}

function toonProInfo() {
  alert('Dit onderdeel zit in de PRO-versie.\n\nBezoek jufzisa.be voor meer info.');
}

// ============================================
// Configuratie-paneel per type
// ============================================
function renderConfig() {
  const c = document.getElementById('config-paneel');
  const type = state.type;
  const conf = state.config[type];

  let html = `<h2>Instellingen</h2>`;

  if (type === 'maaltafels') {
    html += tafelsChips('Welke maaltafels?', 'maal-tafels', conf.tafels);
    html += radioGroep('Volgorde van de cijfers', 'maal-richting', conf.richting, [
      { v: 'ax', l: 'Tafel × factor (bv. 5 × 2)' },
      { v: 'xa', l: 'Factor × tafel (bv. 2 × 5)' },
      { v: 'beide', l: 'Beide door elkaar' }
    ]);
  }

  else if (type === 'deeltafels') {
    html += tafelsChips('Welke deeltafels?', 'deel-tafels', conf.tafels);
  }

  else if (type === 'gemengd-maal-deel') {
    html += tafelsChips('Welke maaltafels?', 'mix-maal-tafels', conf.tafelsKeer);
    html += tafelsChips('Welke deeltafels?', 'mix-deel-tafels', conf.tafelsDeel);
    html += radioGroep('Volgorde bij × ', 'mix-richting', conf.richting, [
      { v: 'ax', l: 'Tafel × factor' },
      { v: 'xa', l: 'Factor × tafel' },
      { v: 'beide', l: 'Beide' }
    ]);
  }

  else if (type === 'getalbeelden') {
    html += radioGroep('Soort getalbeeld', 'gb-type', conf.type, [
      { v: 'mab', l: 'MAB-materiaal' },
      { v: 'honderdveld', l: '100-veld' },
      { v: 'notatie', l: 'Notatie (4E 7T)' },
      { v: 'rekenrek', l: 'Rekenrek' },
      { v: 'mix', l: 'Alle door elkaar' }
    ]);
    // Rekenrek enkel tot 20
    if (conf.type === 'rekenrek') {
      html += `<div class="config-groep">
        <label>Getalbereik</label>
        <div class="radio-groep">
          <label class="radio-knop">
            <input type="radio" name="gb-max" value="20" checked>
            <span>tot 20</span>
          </label>
        </div>
        <p style="font-size:0.85em;color:var(--grijs);margin-top:6px;">
          Het rekenrek (2 rijen van 10 kralen) werkt tot 20.
        </p>
      </div>`;
      if (conf.max > 20) conf.max = 20;
    } else {
      html += radioGroep('Getalbereik', 'gb-max', String(conf.max), [
        { v: '20', l: 'tot 20' },
        { v: '100', l: 'tot 100' }
      ]);
    }
    html += `<div class="info-strook">
      <strong>💡 Getalbeelden werken enkel in flits-modus en als invulblad</strong>,
      niet als papier-modus (te grafisch voor op papier).
    </div>`;
  }

  else if (type === 'splitsingen') {
    html += radioGroep('Splitsingen tot en met', 'spl-totaal', String(conf.totaal), [
      { v: '5', l: 'tot 5' },
      { v: '6', l: 'tot 6' },
      { v: '7', l: 'tot 7' },
      { v: '8', l: 'tot 8' },
      { v: '9', l: 'tot 9' },
      { v: '10', l: 'tot 10' }
    ]);
    html += radioGroep('Wat ontbreekt?', 'spl-variant', conf.variant, [
      { v: 'top', l: 'Totaal bovenaan (bv. ? = 3+5)' },
      { v: 'kind', l: 'Één getal onderaan' },
      { v: 'mix', l: 'Door elkaar' }
    ]);
    html += `<div class="info-strook">
      💡 <strong>Tot 7</strong> betekent: splitsingen van 2, 3, 4, 5, 6 en 7.
    </div>`;
  }

  else if (type === 'optel-aftrek-5') {
    html += radioGroep('Bewerking', 'opt5-bew', conf.bewerking, [
      { v: 'plus', l: 'Alleen +' },
      { v: 'min', l: 'Alleen −' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
    html += `<div class="info-strook">
      💡 Voor de eerste oefeningen in het 1e leerjaar — getallen blijven onder of gelijk aan 5.
    </div>`;
  }

  else if (type === 'optel-aftrek-10') {
    html += radioGroep('Bewerking', 'opt10-bew', conf.bewerking, [
      { v: 'plus', l: 'Alleen +' },
      { v: 'min', l: 'Alleen −' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
  }

  else if (type === 'optel-aftrek-20') {
    html += radioGroep('Bewerking', 'opt20-bew', conf.bewerking, [
      { v: 'plus', l: 'Alleen +' },
      { v: 'min', l: 'Alleen −' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
    html += radioGroep('Brug over het tiental', 'opt20-brug', conf.brug, [
      { v: 'zonder', l: 'Zonder brug' },
      { v: 'met', l: 'Met brug' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
  }

  else if (type === 'optel-aftrek-100') {
    html += radioGroep('Bewerking', 'opt100-bew', conf.bewerking, [
      { v: 'plus', l: 'Alleen +' },
      { v: 'min', l: 'Alleen −' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
    html += radioGroep('Brug over het tiental', 'opt100-brug', conf.brug, [
      { v: 'zonder', l: 'Zonder brug' },
      { v: 'met', l: 'Met brug' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
  }

  c.innerHTML = html;

  // Koppel events
  koppelConfigEvents();
}

function tafelsChips(label, naam, actieve) {
  const opties = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  let html = `<div class="config-groep">
    <label>${label}</label>
    <div class="snelkeuze">
      <button type="button" data-snel="alle" data-groep="${naam}">Alle</button>
      <button type="button" data-snel="geen" data-groep="${naam}">Geen</button>
      <button type="button" data-snel="makkelijk" data-groep="${naam}">2-5-10</button>
    </div>
    <div class="chip-groep" data-groep="${naam}">`;
  opties.forEach(n => {
    const gekozen = actieve.includes(n);
    html += `<label class="chip">
      <input type="checkbox" value="${n}" ${gekozen ? 'checked' : ''} data-naam="${naam}">
      <span>${n}</span>
    </label>`;
  });
  html += `</div></div>`;
  return html;
}

function radioGroep(label, naam, actief, opties) {
  let html = `<div class="config-groep">
    <label>${label}</label>
    <div class="radio-groep">`;
  opties.forEach(o => {
    html += `<label class="radio-knop">
      <input type="radio" name="${naam}" value="${o.v}" ${actief === o.v ? 'checked' : ''}>
      <span>${o.l}</span>
    </label>`;
  });
  html += `</div></div>`;
  return html;
}

function koppelConfigEvents() {
  // Checkboxes (tafels)
  document.querySelectorAll('.chip input[type="checkbox"]').forEach(inp => {
    inp.addEventListener('change', () => {
      const naam = inp.dataset.naam;
      const waarde = parseInt(inp.value, 10);
      updateTafelKeuze(naam, waarde, inp.checked);
      updatePreview();
    });
  });

  // Snelkeuze-knoppen
  document.querySelectorAll('[data-snel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const groep = btn.dataset.groep;
      const kind = btn.dataset.snel;
      const alle = [2, 3, 4, 5, 6, 7, 8, 9, 10];
      let nieuwe;
      if (kind === 'alle') nieuwe = alle;
      else if (kind === 'geen') nieuwe = [];
      else if (kind === 'makkelijk') nieuwe = [2, 5, 10];
      zetTafelKeuze(groep, nieuwe);
      renderConfig();
      updatePreview();
    });
  });

  // Radio
  document.querySelectorAll('.radio-knop input[type="radio"]').forEach(inp => {
    inp.addEventListener('change', () => {
      updateRadio(inp.name, inp.value);
      updatePreview();
    });
  });
}

function updateTafelKeuze(naam, waarde, erbij) {
  const type = state.type;
  const mapping = {
    'maal-tafels': ['maaltafels', 'tafels'],
    'deel-tafels': ['deeltafels', 'tafels'],
    'mix-maal-tafels': ['gemengd-maal-deel', 'tafelsKeer'],
    'mix-deel-tafels': ['gemengd-maal-deel', 'tafelsDeel']
  };
  const [k1, k2] = mapping[naam];
  let lijst = state.config[k1][k2];
  if (erbij) {
    if (!lijst.includes(waarde)) lijst.push(waarde);
  } else {
    lijst = lijst.filter(x => x !== waarde);
  }
  state.config[k1][k2] = lijst.sort((a, b) => a - b);
}

function zetTafelKeuze(naam, nieuwe) {
  const mapping = {
    'maal-tafels': ['maaltafels', 'tafels'],
    'deel-tafels': ['deeltafels', 'tafels'],
    'mix-maal-tafels': ['gemengd-maal-deel', 'tafelsKeer'],
    'mix-deel-tafels': ['gemengd-maal-deel', 'tafelsDeel']
  };
  const [k1, k2] = mapping[naam];
  state.config[k1][k2] = nieuwe;
}

function updateRadio(naam, waarde) {
  const mapping = {
    'maal-richting': ['maaltafels', 'richting', waarde],
    'mix-richting': ['gemengd-maal-deel', 'richting', waarde],
    'gb-type': ['getalbeelden', 'type', waarde],
    'gb-max': ['getalbeelden', 'max', parseInt(waarde, 10)],
    'opt5-bew': ['optel-aftrek-5', 'bewerking', waarde],
    'opt10-bew': ['optel-aftrek-10', 'bewerking', waarde],
    'opt20-bew': ['optel-aftrek-20', 'bewerking', waarde],
    'opt20-brug': ['optel-aftrek-20', 'brug', waarde],
    'opt100-bew': ['optel-aftrek-100', 'bewerking', waarde],
    'opt100-brug': ['optel-aftrek-100', 'brug', waarde],
    'spl-totaal': ['splitsingen', 'totaal', parseInt(waarde, 10)],
    'spl-variant': ['splitsingen', 'variant', waarde]
  };
  const m = mapping[naam];
  if (m) state.config[m[0]][m[1]] = m[2];

  // Als rekenrek gekozen is: forceer max op 20 en re-render config
  if (naam === 'gb-type') {
    if (waarde === 'rekenrek') {
      state.config.getalbeelden.max = 20;
    }
    renderConfig();
  }
}

// ============================================
// Huidige config ophalen
// ============================================
function huidigeConfig() {
  return state.config[state.type];
}

function configGeldig() {
  const type = state.type;
  const conf = huidigeConfig();
  if (type === 'maaltafels' || type === 'deeltafels') {
    return conf.tafels.length > 0;
  }
  if (type === 'gemengd-maal-deel') {
    return conf.tafelsKeer.length > 0 && conf.tafelsDeel.length > 0;
  }
  return true;
}

// ============================================
// Preview
// ============================================
function updatePreview() {
  if (!configGeldig()) {
    document.getElementById('preview').innerHTML =
      '<p style="color:var(--roze);font-weight:700;">Kies minstens één tafel om verder te gaan.</p>';
    return;
  }

  const oefeningen = window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10);
  state.huidigeOefeningen = oefeningen;

  let html = `<h3>Voorbeeld van 10 oefeningen</h3><div class="preview-lijst">`;
  oefeningen.forEach((o, i) => {
    let vraag;
    if (typeof o.vraag === 'string') {
      vraag = o.vraag;
    } else if (o.vraag.type === 'splitsing') {
      const t = o.vraag.top === null ? '?' : o.vraag.top;
      const l = o.vraag.links === null ? '?' : o.vraag.links;
      const r = o.vraag.rechts === null ? '?' : o.vraag.rechts;
      vraag = `${t} = ${l}+${r}`;
    } else if (o.vraag.type === 'getalbeeld') {
      vraag = `getalbeeld (${o.antwoord})`;
    } else {
      vraag = '?';
    }
    html += `<div class="preview-item">
      <span><span class="nr">${i + 1}.</span> ${vraag}</span>
      <span class="ant">= ${o.antwoord}</span>
    </div>`;
  });
  html += `</div>
    <div class="knop-rij">
      <button class="knop knop-secundair" onclick="updatePreview()">🔄 Nieuwe voorbeelden</button>
    </div>`;
  document.getElementById('preview').innerHTML = html;
}

// ============================================
// FLITS-MODUS
// ============================================
function startFlitsModus() {
  if (!configGeldig()) { alert('Kies eerst je instellingen.'); return; }

  const oefeningen = window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10);

  const overlay = document.createElement('div');
  overlay.className = 'flits-overlay';
  overlay.innerHTML = `
    <button class="flits-sluit" aria-label="Sluiten">×</button>
    <div class="flits-start">
      <h2>Klaar om te flitsen?</h2>
      <p>Elke oefening blijft <span id="flits-duur-toon">6</span> seconden in beeld.</p>
      <div class="knop-rij" style="justify-content:center;">
        <label style="display:flex;align-items:center;gap:8px;font-weight:700;">
          Tijd per oefening:
          <select id="flits-duur-kies" style="padding:8px;border-radius:8px;border:2px solid var(--grijs-licht);font-family:inherit;font-weight:700;">
            <option value="3">3 sec</option>
            <option value="4">4 sec</option>
            <option value="5">5 sec</option>
            <option value="6" selected>6 sec</option>
            <option value="8">8 sec</option>
            <option value="10">10 sec</option>
          </select>
        </label>
      </div>
      <div class="knop-rij" style="justify-content:center;margin-top:20px;">
        <button class="knop knop-primair" id="flits-go">▶ Start!</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.flits-sluit').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#flits-duur-kies').addEventListener('change', e => {
    overlay.querySelector('#flits-duur-toon').textContent = e.target.value;
  });
  overlay.querySelector('#flits-go').addEventListener('click', () => {
    const duur = parseInt(overlay.querySelector('#flits-duur-kies').value, 10);
    flitsLoop(overlay, oefeningen, duur);
  });
}

function flitsLoop(overlay, oefeningen, duurSec) {
  let idx = 0;
  let gepauzeerd = false;
  let balkInt, volgendeTO;
  let startTijdstip;
  let verstreken = 0; // ms verstreken voor huidige vraag

  overlay.innerHTML = `
    <button class="flits-sluit" aria-label="Sluiten">×</button>
    <div class="flits-topbalk">
      <div class="flits-teller"><span id="teller-huidig">1</span> / ${oefeningen.length}</div>
    </div>
    <div id="flits-inhoud"></div>
    <div class="flits-bediening">
      <button class="flits-bedien-knop" id="flits-vorige" title="Vorige">◀</button>
      <button class="flits-bedien-knop flits-pauze" id="flits-pauze" title="Pauze">⏸</button>
      <button class="flits-bedien-knop" id="flits-volgende" title="Volgende">▶</button>
    </div>
    <div class="flits-voortgang"><div class="flits-voortgang-balk" id="balk"></div></div>
  `;

  const inhoud = overlay.querySelector('#flits-inhoud');
  const teller = overlay.querySelector('#teller-huidig');
  const balk = overlay.querySelector('#balk');
  const pauzeKnop = overlay.querySelector('#flits-pauze');

  function stopTimers() {
    clearInterval(balkInt);
    clearTimeout(volgendeTO);
  }

  overlay.querySelector('.flits-sluit').addEventListener('click', () => {
    stopTimers();
    overlay.remove();
  });

  overlay.querySelector('#flits-vorige').addEventListener('click', () => {
    if (idx > 0) { idx--; toon(idx); }
  });

  overlay.querySelector('#flits-volgende').addEventListener('click', () => {
    if (idx < oefeningen.length) { idx++; toon(idx); }
  });

  pauzeKnop.addEventListener('click', () => {
    if (gepauzeerd) {
      // Hervatten
      gepauzeerd = false;
      pauzeKnop.textContent = '⏸';
      pauzeKnop.title = 'Pauze';
      hervatTimer();
    } else {
      // Pauzeren
      gepauzeerd = true;
      pauzeKnop.textContent = '▶';
      pauzeKnop.title = 'Hervatten';
      verstreken += Date.now() - startTijdstip;
      stopTimers();
    }
  });

  function hervatTimer() {
    startTijdstip = Date.now();
    const resterendMs = duurSec * 1000 - verstreken;
    balkInt = setInterval(() => {
      const totaalVerstreken = verstreken + (Date.now() - startTijdstip);
      const pct = Math.min(100, (totaalVerstreken / (duurSec * 1000)) * 100);
      balk.style.width = pct + '%';
      if (pct >= 100) clearInterval(balkInt);
    }, 50);
    volgendeTO = setTimeout(() => {
      idx++;
      toon(idx);
    }, Math.max(0, resterendMs));
  }

  function toon(i) {
    stopTimers();
    verstreken = 0;

    if (i >= oefeningen.length) {
      inhoud.innerHTML = `
        <div class="flits-klaar">
          <div class="icoon">🎉</div>
          <h2>Klaar!</h2>
          <p style="font-size:1.1rem;color:var(--grijs);margin-bottom:24px;">
            Vergelijk de antwoorden en verbeter samen.
          </p>
          <div class="knop-rij" style="justify-content:center;">
            <button class="knop knop-secundair" id="toon-antw">Antwoorden tonen</button>
            <button class="knop knop-primair" id="opnieuw">Opnieuw</button>
          </div>
        </div>`;
      overlay.querySelector('.flits-voortgang').style.display = 'none';
      overlay.querySelector('.flits-topbalk').style.display = 'none';
      overlay.querySelector('.flits-bediening').style.display = 'none';

      overlay.querySelector('#opnieuw').addEventListener('click', () => {
        overlay.remove();
        startFlitsModus();
      });
      overlay.querySelector('#toon-antw').addEventListener('click', () => {
        toonAntwoordenlijst(overlay, oefeningen);
      });
      return;
    }

    const oef = oefeningen[i];
    teller.textContent = i + 1;

    if (typeof oef.vraag === 'string') {
      inhoud.innerHTML = `<div class="flits-vraag">${oef.vraag}</div>`;
    } else if (oef.vraag.type === 'getalbeeld') {
      inhoud.innerHTML = renderGetalbeeldHTML(oef.vraag);
    } else if (oef.vraag.type === 'splitsing') {
      inhoud.innerHTML = renderSplitsingHTML(oef.vraag);
    }

    balk.style.width = '0%';

    if (!gepauzeerd) {
      hervatTimer();
    }
  }

  toon(0);
}

function toonAntwoordenlijst(overlay, oefeningen) {
  const inhoud = overlay.querySelector('#flits-inhoud');
  let html = `<div style="background:white;padding:28px;border-radius:22px;max-width:500px;max-height:70vh;overflow:auto;box-shadow:var(--shadow-lg);">
    <h2 style="color:var(--paars);margin-bottom:16px;">Antwoorden</h2>
    <ol style="list-style:decimal;padding-left:24px;font-size:1.1rem;line-height:1.8;">`;
  oefeningen.forEach(o => {
    const v = typeof o.vraag === 'string' ? o.vraag : `getalbeeld`;
    html += `<li><strong>${v}</strong> = <span style="color:var(--groen);font-weight:700;">${o.antwoord}</span></li>`;
  });
  html += `</ol>
    <div class="knop-rij" style="justify-content:flex-end;margin-top:16px;">
      <button class="knop knop-primair" onclick="this.closest('.flits-overlay').remove()">Sluiten</button>
    </div>
  </div>`;
  inhoud.innerHTML = html;
}

function renderGetalbeeldHTML(vraag) {
  const getal = vraag.getal;
  if (vraag.weergave === 'rekenrek') {
    return renderRekenrekHTML(getal);
  }
  if (vraag.weergave === 'honderdveld') {
    return renderHonderdveldHTML(getal);
  }
  if (vraag.weergave === 'notatie') {
    return renderNotatieHTML(getal);
  }
  return renderMABHTML(getal);
}

function renderMABHTML(getal) {
  const tientallen = Math.floor(getal / 10);
  const eenheden = getal % 10;
  let html = `<div class="getalbeeld-wrap"><div class="getalbeeld-mab">`;
  for (let i = 0; i < tientallen; i++) {
    html += `<div class="mab-tiental"></div>`;
  }
  if (eenheden > 0) {
    html += `<div class="mab-eenheden">`;
    for (let i = 0; i < eenheden; i++) {
      html += `<div class="mab-eenheid"></div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderHonderdveldHTML(getal) {
  // Als getal ≤ 20: 20-veld (2 rijen × 10) — compacter en duidelijker voor kleine getallen
  // Anders: 100-veld (10×10)
  const isTwintigVeld = getal <= 20;
  const totaalRijen = isTwintigVeld ? 2 : 10;

  const tientallen = Math.floor(getal / 10);
  const eenheden = getal % 10;

  let html = `<div class="getalbeeld-wrap"><div class="honderdveld ${isTwintigVeld ? 'twintigveld' : ''}">`;

  // Rij 0 bovenaan, totaalRijen-1 onderaan
  // Eenheden staan op onderste rij, tientallen op rijen daarboven
  for (let rij = 0; rij < totaalRijen; rij++) {
    const vanafOnder = (totaalRijen - 1) - rij;

    html += `<div class="honderdveld-rij">`;
    for (let k = 0; k < 10; k++) {
      let kleur = 'leeg';
      if (vanafOnder === 0) {
        // Onderste rij
        if (eenheden > 0) {
          // Er zijn eenheden: toon ze geel
          if (k < eenheden) kleur = 'geel';
        } else if (tientallen > totaalRijen - 1) {
          // Geen eenheden maar wel "te veel" tientallen voor de bovenste rijen
          // → onderste rij vormt een extra tiental
          kleur = 'groen';
        }
      } else {
        // Hogere rijen: vol groen als binnen tientallen-bereik
        if (vanafOnder <= tientallen) kleur = 'groen';
      }
      html += `<div class="honderdveld-vak ${kleur}"></div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderNotatieHTML(getal) {
  const tientallen = Math.floor(getal / 10);
  const eenheden = getal % 10;

  // Twee weergaven: "4E 7T" of "7T 4E" - randomize welke eerst komt
  const eenhEerst = Math.random() < 0.5;

  let parts = [];
  if (eenhEerst) {
    if (eenheden > 0) parts.push(`<span class="notatie-eenh">${eenheden}E</span>`);
    if (tientallen > 0) parts.push(`<span class="notatie-tient">${tientallen}T</span>`);
  } else {
    if (tientallen > 0) parts.push(`<span class="notatie-tient">${tientallen}T</span>`);
    if (eenheden > 0) parts.push(`<span class="notatie-eenh">${eenheden}E</span>`);
  }

  // Als getal onder 10: alleen eenheden, anders zelfs 0T verbergen
  if (tientallen === 0) {
    parts = [`<span class="notatie-eenh">${eenheden}E</span>`];
  }
  if (eenheden === 0) {
    parts = [`<span class="notatie-tient">${tientallen}T</span>`];
  }

  return `<div class="getalbeeld-wrap"><div class="notatie">${parts.join(' ')}</div></div>`;
}

function renderSplitsingHTML(vraag) {
  const t = vraag.top === null ? '?' : vraag.top;
  const l = vraag.links === null ? '?' : vraag.links;
  const r = vraag.rechts === null ? '?' : vraag.rechts;

  return `
    <div class="splitsing-wrap">
      <div class="splitsing-top ${vraag.top === null ? 'leeg' : ''}">${t}</div>
      <svg class="splitsing-v" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
        <line x1="100" y1="0" x2="25" y2="80" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="100" y1="0" x2="175" y2="80" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <div class="splitsing-kinderen">
        <div class="splitsing-kind ${vraag.links === null ? 'leeg' : ''}">${l}</div>
        <div class="splitsing-kind ${vraag.rechts === null ? 'leeg' : ''}">${r}</div>
      </div>
    </div>
  `;
}

function renderRekenrekHTML(getal) {
  // Rekenrek tot 20 = 2 rijen van 10 kralen (5 rood + 5 wit per rij)
  const totaalRijen = 2;
  let overGetal = getal;
  let html = `<div class="getalbeeld-wrap"><div class="rekenrek">`;
  for (let r = 0; r < totaalRijen; r++) {
    const opDezeRij = Math.min(10, overGetal);
    overGetal -= opDezeRij;
    html += `<div class="rekenrek-rij">`;
    for (let k = 0; k < 10; k++) {
      const kleur = k < 5 ? 'rood' : 'wit';
      const actief = k < opDezeRij;
      const opacity = actief ? 1 : 0.18;
      html += `<div class="kraal ${kleur}" style="opacity:${opacity};"></div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

// Tekent een splitsing in de PDF op positie (centerX, centerY) met max breedte en hoogte
// Tekent een splitsing in de PDF op positie (centerX, centerY) met max breedte en hoogte
// Gebruikt voor het dagblad (grote boompjes, 2×5)
function tekenSplitsingOpPdf(doc, vraag, centerX, centerY, maxBreedte, maxHoogte, nummer, modus) {
  // Voor dagblad: A4 portrait, 2×5 raster
  // Beschikbare ruimte per splitsing: ~90mm × 45mm
  // We willen grote duidelijke boompjes

  // Cirkel: groot genoeg zodat ze goed leesbaar zijn op papier
  // 3 cirkels moeten passen in de breedte: kindLeft + vSpan + kindRight + marge
  // Met vSpan = 3.5*cirkelR en 3 cirkels van diameter 2*cirkelR past het in 7.5*cirkelR
  // Dus cirkelR ≤ maxBreedte/7.5 als we losstaande cirkels willen
  // Maar we willen ook grote cirkels, dus we gaan voor ~12mm maar tolereren minder afstand
  const cirkelR = Math.min(maxBreedte / 5.5, maxHoogte / 4, 13);
  const vSpan = cirkelR * 3.2;   // afstand tussen kinderen
  const vHeight = cirkelR * 3.6; // verticale afstand top-kind

  const topY = centerY - vHeight / 2 + cirkelR * 0.2;
  const kindY = centerY + vHeight / 2 + cirkelR * 0.2;
  const kindLinksX = centerX - vSpan / 2;
  const kindRechtsX = centerX + vSpan / 2;

  // Nummer linksboven, buiten de splitsing
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(140, 140, 140);
  doc.text(`${nummer}.`, centerX - maxBreedte / 2 + 2, topY - cirkelR - 1);

  tekenSplitsingElementen(doc, { top: topY, kindY, left: kindLinksX, right: kindRechtsX, cx: centerX }, vraag, cirkelR, 'cirkel');
}

// Tekent een mini-boompje in smalle kolom (voor weekblad)
// Het ontbrekende getal wordt getoond als een leeg VIERKANT vakje waar kinderen kunnen invullen
function tekenMiniSplitsing(doc, vraag, centerX, centerY, maxBreedte, maxHoogte) {
  // Zeer compact voor smalle weekblad-kolom
  const cirkelR = Math.min(maxBreedte * 0.14, maxHoogte * 0.17, 5.5);
  const vSpan = cirkelR * 4;
  const vHeight = cirkelR * 3;

  const topY = centerY - vHeight / 2;
  const kindY = centerY + vHeight / 2;
  const kindLinksX = centerX - vSpan / 2;
  const kindRechtsX = centerX + vSpan / 2;

  tekenSplitsingElementen(doc, { top: topY, kindY, left: kindLinksX, right: kindRechtsX, cx: centerX }, vraag, cirkelR, 'vakje');
}

// Gedeelde teken-logica - variant 'cirkel' (dagblad) of 'vakje' (weekblad)
function tekenSplitsingElementen(doc, pos, vraag, cirkelR, vorm) {
  const { top: topY, kindY, left: kindLinksX, right: kindRechtsX, cx: centerX } = pos;

  // V-lijnen
  doc.setDrawColor(107, 76, 155);
  doc.setLineWidth(vorm === 'cirkel' ? 1.1 : 0.7);
  doc.line(centerX, topY + cirkelR, kindLinksX, kindY - cirkelR);
  doc.line(centerX, topY + cirkelR, kindRechtsX, kindY - cirkelR);

  // Teken 3 elementen
  function tekenElement(x, y, waarde, ontbrekend) {
    if (ontbrekend) {
      // Leeg vakje (rechthoekig, waar kind in schrijft) - duidelijker dan gestippelde cirkel
      doc.setDrawColor(107, 76, 155);
      doc.setLineWidth(vorm === 'cirkel' ? 0.8 : 0.5);
      doc.setFillColor(255, 255, 255);
      const vakBreedte = cirkelR * 2;
      const vakHoogte = cirkelR * 2;
      doc.roundedRect(x - vakBreedte/2, y - vakHoogte/2, vakBreedte, vakHoogte, 1, 1, 'FD');
    } else {
      // Gevulde cirkel met waarde
      doc.setDrawColor(107, 76, 155);
      doc.setLineWidth(vorm === 'cirkel' ? 1.1 : 0.7);
      doc.setFillColor(255, 255, 255);
      doc.circle(x, y, cirkelR, 'FD');

      // Groter font, perfect gecentreerd met baseline:'middle'
      const fontSize = cirkelR * (vorm === 'cirkel' ? 2.6 : 2.3);
      doc.setTextColor(107, 76, 155);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      doc.text(String(waarde), x, y, { align: 'center', baseline: 'middle' });
    }
  }

  tekenElement(centerX, topY, vraag.top, vraag.top === null);
  tekenElement(kindLinksX, kindY, vraag.links, vraag.links === null);
  tekenElement(kindRechtsX, kindY, vraag.rechts, vraag.rechts === null);
}

// ============================================
// PDF-EXPORT (papier-modus en antwoordblad-modus)
// ============================================
function maakPdfPapier() {
  if (!configGeldig()) { alert('Kies eerst je instellingen.'); return; }
  const oefeningen = window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10);

  // Voor getalbeelden: alleen als Flits/smartbord werkbaar is — val terug op invulblad
  if (state.type === 'getalbeelden') {
    alert('Getalbeelden kunnen enkel in flits-modus of op het smartbord getoond worden.\nVoor papier krijg je een antwoordblad om samen op te lossen.');
    maakPdfAntwoordblad(true);
    return;
  }

  genereerPdf({
    titel: toetsTitel(),
    oefeningen,
    modus: 'papier'
  });
}

function maakPdfAntwoordblad(forceerGetalbeeld = false) {
  genereerPdf({
    titel: toetsTitel(),
    oefeningen: forceerGetalbeeld
      ? Array(10).fill({ vraag: '', antwoord: '' })
      : (state.huidigeOefeningen.length ? state.huidigeOefeningen : window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10)),
    modus: 'antwoordblad'
  });
}

function toetsTitel() {
  const labels = {
    'maaltafels': 'Tempotoets — Maaltafels',
    'deeltafels': 'Tempotoets — Deeltafels',
    'gemengd-maal-deel': 'Tempotoets — × en :',
    'getalbeelden': 'Tempotoets — Getalbeelden',
    'optel-aftrek-5': 'Tempotoets — + en - tot 5',
    'optel-aftrek-10': 'Tempotoets — + en - tot 10',
    'optel-aftrek-20': 'Tempotoets — + en - tot 20',
    'optel-aftrek-100': 'Tempotoets — + en - tot 100',
    'splitsingen': 'Tempotoets — Splitsingen'
  };
  return labels[state.type] || 'Tempotoets';
}

function genereerPdf({ titel, oefeningen, modus }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const breedte = 210;
  const hoogte = 297;
  const marge = 18;

  // --- Header ---
  doc.setFillColor(245, 159, 59); // oranje
  doc.rect(0, 0, breedte, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(titel, marge, 18);

  // Naam + datum lijn
  doc.setTextColor(45, 42, 38);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Naam:', marge, 42);
  doc.line(marge + 14, 42, 100, 42);
  doc.text('Datum:', 115, 42);
  doc.line(115 + 16, 42, breedte - marge, 42);

  // --- Instructie in een kader ---
  const instructie = modus === 'papier'
    ? 'Je hebt 1 minuut. Klaar? Start!'
    : 'Schrijf hieronder het antwoord van elke oefening op.';

  const instrY = 56;
  const instrHoogte = 12;
  // Zacht oranje/crème achtergrond
  doc.setFillColor(253, 236, 212); // oranje-licht
  doc.setDrawColor(245, 159, 59); // oranje
  doc.setLineWidth(0.5);
  doc.roundedRect(marge, instrY, breedte - marge * 2, instrHoogte, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(197, 122, 28); // oranje-diep
  doc.text(instructie, marge + 6, instrY + 7.8);

  // --- Oefeningen grid ---
  const isSplitsingen = oefeningen.length > 0
    && typeof oefeningen[0].vraag === 'object'
    && oefeningen[0].vraag.type === 'splitsing';

  // Bij invulblad (antwoordblad): splitsingen tonen als lege lijnen, niet als boompjes
  // (Kinderen schrijven gewoon het antwoord op terwijl je flitst)
  const splitsingenAlsTekening = isSplitsingen && modus !== 'antwoordblad';

  if (splitsingenAlsTekening) {
    // Splitsingen: 2 rijen × 5 kolommen
    const startY = 68;
    const kolomBreedte = (breedte - marge * 2) / 5;
    const rijHoogte = (hoogte - startY - 20) / 2;

    oefeningen.forEach((o, i) => {
      const kolom = i % 5;
      const rij = Math.floor(i / 5);
      const centerX = marge + kolom * kolomBreedte + kolomBreedte / 2;
      const centerY = startY + rij * rijHoogte + rijHoogte / 2;
      tekenSplitsingOpPdf(doc, o.vraag, centerX, centerY, kolomBreedte * 0.85, rijHoogte * 0.75, i + 1, modus);
    });
  } else {
    const startY = 82;
    const regelHoogte = 20;
    const kolomBreedte = (breedte - marge * 2) / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(45, 42, 38);

    oefeningen.forEach((o, i) => {
      const kolom = i < 5 ? 0 : 1;
      const rij = i % 5;
      const x = marge + kolom * kolomBreedte;
      const y = startY + rij * regelHoogte;

      // Nummer
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 160, 160);
      doc.text(`${i + 1}.`, x, y);

      // Vraag
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 38);

      const vraagText = typeof o.vraag === 'string' ? o.vraag : '___';

      if (modus === 'papier') {
        doc.text(vraagText + '  =', x + 8, y);
        // Invulvak
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        const vakX = x + 50;
        doc.line(vakX, y + 1, vakX + 22, y + 1);
    } else {
      // antwoordblad: alleen nummer + lijntje
      doc.text('_________________', x + 8, y);
    }
  });
  } // end else (niet-splitsingen)

  // --- Footer ---
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('juf Zisa · jufzisa.be', marge, hoogte - 10);

  // Antwoorden-pagina (optioneel)
  if (modus === 'papier' || modus === 'antwoordblad') {
    doc.addPage();
    doc.setFillColor(107, 76, 155); // paars
    doc.rect(0, 0, breedte, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Antwoordenblad — ' + titel, marge, 16);

    doc.setTextColor(45, 42, 38);
    doc.setFontSize(12);

    const antKolomBreedte = (breedte - marge * 2) / 2;
    const antRegelHoogte = 20;
    let antY = 40;

    oefeningen.forEach((o, i) => {
      const kolom = i < 5 ? 0 : 1;
      const rij = i % 5;
      const x = marge + kolom * antKolomBreedte;
      const y = antY + rij * antRegelHoogte;

      // Bouw vraagstring (ook voor splitsingen / getalbeelden)
      let vraagText;
      if (typeof o.vraag === 'string') {
        vraagText = o.vraag;
      } else if (o.vraag.type === 'splitsing') {
        const t = o.vraag.top === null ? '?' : o.vraag.top;
        const l = o.vraag.links === null ? '?' : o.vraag.links;
        const r = o.vraag.rechts === null ? '?' : o.vraag.rechts;
        vraagText = `${t} = ${l}+${r}`;
      } else if (o.vraag.type === 'getalbeeld') {
        vraagText = `getalbeeld (${o.antwoord})`;
      } else {
        vraagText = '?';
      }

      // Vraag deel
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 42, 38);
      const vraagStr = `${i + 1}.  ${vraagText}  =  `;
      doc.text(vraagStr, x, y);

      // Antwoord direct achter "=" (gebruik text-width)
      const breedteVraag = doc.getTextWidth(vraagStr);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(122, 182, 72);
      doc.text(String(o.antwoord), x + breedteVraag, y);
      doc.setTextColor(45, 42, 38);
    });
  }

  doc.save(`${titel.replace(/—/g, '-')}.pdf`);
}

// ============================================
// WEEKBLAD + HUISTAAKBLAD
// ============================================
// 5 dagen voor weekblad (school), 7 dagen voor huistaakblad (thuis)
const weekdagenSchool = [
  { id: 'ma', label: 'Maandag', kort: 'Ma' },
  { id: 'di', label: 'Dinsdag', kort: 'Di' },
  { id: 'wo', label: 'Woensdag', kort: 'Wo' },
  { id: 'do', label: 'Donderdag', kort: 'Do' },
  { id: 'vr', label: 'Vrijdag', kort: 'Vr' }
];
const weekdagenAlle = [
  ...weekdagenSchool,
  { id: 'za', label: 'Zaterdag', kort: 'Za' },
  { id: 'zo', label: 'Zondag', kort: 'Zo' }
];

// Huidige variant: 'weekblad' (school, max 5) of 'huistaak' (thuis, max 7)
let huidigeWeekVariant = 'weekblad';

function getBeschikbareDagen() {
  return huidigeWeekVariant === 'huistaak' ? weekdagenAlle : weekdagenSchool;
}

// State per dag: { actief, type, config, configUitgeklapt, datum, vorm }
// vorm: 'oefeningen' (op papier) of 'invulblad' (lege lijntjes voor flits-modus)
function maakLegeWeekState(dagen) {
  const s = {};
  dagen.forEach(d => {
    s[d.id] = {
      actief: true,
      type: 'maaltafels',
      config: null,
      configUitgeklapt: false,
      datum: '',
      vorm: 'oefeningen'
    };
  });
  return s;
}

const weekStateSchool = maakLegeWeekState(weekdagenSchool);
const weekStateHuistaak = maakLegeWeekState(weekdagenAlle);
// Standaard huistaak: za/zo niet actief (kan aangevinkt worden)
weekStateHuistaak.za.actief = false;
weekStateHuistaak.zo.actief = false;

// Volgorde-lijst voor PRO vrije-volgorde modus.
// Lege array = standaard volgorde + actief-vinkjes.
// Niet-lege array = lijst van dag-id's (bv. ['ma','di','ma','di','wo']) — overschrijft 'actief'.
let weekVolgordeSchool = [];
let weekVolgordeHuistaak = [];

// "Vrije volgorde" toggle per variant (alleen PRO)
let weekVrijeVolgordeSchool = false;
let weekVrijeVolgordeHuistaak = false;

// Metadata per variant
const weekMetaSchool = { weekVan: '', modus: 'oefeningen' };
const weekMetaHuistaak = { weekVan: '', modus: 'oefeningen' };

function getHuidigeWeekState() {
  return huidigeWeekVariant === 'huistaak' ? weekStateHuistaak : weekStateSchool;
}
function getHuidigeWeekMeta() {
  return huidigeWeekVariant === 'huistaak' ? weekMetaHuistaak : weekMetaSchool;
}
function getHuidigeVolgorde() {
  return huidigeWeekVariant === 'huistaak' ? weekVolgordeHuistaak : weekVolgordeSchool;
}
function setHuidigeVolgorde(arr) {
  if (huidigeWeekVariant === 'huistaak') weekVolgordeHuistaak = arr;
  else weekVolgordeSchool = arr;
}
function getHuidigeVrijeVolgorde() {
  return huidigeWeekVariant === 'huistaak' ? weekVrijeVolgordeHuistaak : weekVrijeVolgordeSchool;
}
function setHuidigeVrijeVolgorde(v) {
  if (huidigeWeekVariant === 'huistaak') weekVrijeVolgordeHuistaak = v;
  else weekVrijeVolgordeSchool = v;
}

// Backwards-compat: `weekState` en `weekdagen` blijven werken via getters
const weekState = new Proxy({}, {
  get(_, prop) {
    const s = getHuidigeWeekState();
    if (prop in s) return s[prop];
    const m = getHuidigeWeekMeta();
    return m[prop];
  },
  set(_, prop, val) {
    const s = getHuidigeWeekState();
    if (prop in s) { s[prop] = val; return true; }
    const m = getHuidigeWeekMeta();
    m[prop] = val;
    return true;
  }
});
const weekdagen = new Proxy([], {
  get(_, prop) {
    const arr = getBeschikbareDagen();
    if (prop === 'length') return arr.length;
    if (prop === Symbol.iterator) return arr[Symbol.iterator].bind(arr);
    if (typeof prop === 'string' && /^\d+$/.test(prop)) return arr[parseInt(prop, 10)];
    if (typeof arr[prop] === 'function') return arr[prop].bind(arr);
    return arr[prop];
  }
});

function isPro() {
  return !!window.ISPRO;
}

function openWeekbladDialoog(variant) {
  // variant: 'weekblad' (school, 5 dagen) of 'huistaak' (thuis, max 7 dagen)
  huidigeWeekVariant = variant === 'huistaak' ? 'huistaak' : 'weekblad';

  // Initialiseer: standaard gebruikt het actieve tab-type
  getBeschikbareDagen().forEach(d => {
    if (!weekState[d.id].type) weekState[d.id].type = state.type;
  });

  const isHuistaak = huidigeWeekVariant === 'huistaak';
  const titel = isHuistaak ? '🏠 Huistaakblad samenstellen' : '📅 Weekblad samenstellen';
  const intro = isHuistaak
    ? 'Kies welke dagen het kind thuis oefent en welk oefeningtype per dag. Ouders noteren hoe lang het kind nodig had (doel: binnen 1 minuut).'
    : 'Kies welke dagen op het blad komen en welk oefeningtype per dag.';
  const knopTekst = isHuistaak ? '🏠 Huistaakblad maken' : '📄 Weekblad maken';

  const overlay = document.createElement('div');
  overlay.className = 'week-overlay';
  overlay.dataset.variant = huidigeWeekVariant;
  overlay.innerHTML = `
    <div class="week-dialoog">
      <button class="week-sluit" aria-label="Sluiten">×</button>
      <h2>${titel}</h2>
      <p class="week-intro">${intro}</p>

      <div class="config-groep">
        <label for="week-van-input" style="font-weight:700;display:block;margin-bottom:6px;">Week van <span style="font-weight:400;color:var(--grijs);font-size:0.9em;">(optioneel — laat leeg voor invullijn)</span></label>
        <input type="text" id="week-van-input" class="week-van-input" placeholder="bv. 5 mei 2026" value="${weekState.weekVan || ''}">
      </div>

      <div class="config-groep week-vorm-uitleg-blok">
        <p class="week-vorm-uitleg">
          <strong>💡 Tip:</strong> Per dag kun je hieronder kiezen: <strong>📄 met oefeningen</strong> (op papier) of <strong>📝 invulblad</strong> (lege lijntjes, voor flitsen op smartbord). Zo kun je afwisselen — bv. ma/di/do met oefeningen, wo/vr als flitstoets.
        </p>
      </div>

      <div class="config-groep week-volgorde-toggle">
        <label class="week-volgorde-knop">
          <input type="checkbox" id="week-vrije-volgorde" ${getHuidigeVrijeVolgorde() ? 'checked' : ''}>
          <span>🔀 Vrije volgorde — dagen herhalen of zelf rangschikken</span>
        </label>
        <p class="week-volgorde-hint">Handig bij korte schoolweken (bv. ma-di-ma-di-wo) of als je dezelfde dag 2x op één blad wil.</p>
      </div>

      <h3 class="week-dagen-titel">Dagen</h3>
      <div class="week-dagen-lijst" id="week-dagen-lijst"></div>

      <div class="week-knop-rij">
        <button class="knop knop-secundair" id="week-annuleer">Annuleren</button>
        <button class="knop knop-primair" id="week-genereer">${knopTekst}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  renderWeekDagen();

  // Input events
  overlay.querySelector('#week-van-input').addEventListener('input', (e) => {
    weekState.weekVan = e.target.value;
  });

  // Vrije-volgorde toggle (alleen PRO)
  const vrijeCb = overlay.querySelector('#week-vrije-volgorde');
  if (vrijeCb) {
    vrijeCb.addEventListener('change', () => {
      setHuidigeVrijeVolgorde(vrijeCb.checked);
      if (vrijeCb.checked && getHuidigeVolgorde().length === 0) {
        // Initialiseer volgorde uit actieve vinkjes
        const init = getBeschikbareDagen()
          .filter(d => weekState[d.id].actief)
          .map(d => d.id);
        setHuidigeVolgorde(init);
      }
      renderWeekDagen();
    });
  }

  overlay.querySelector('.week-sluit').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#week-annuleer').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#week-genereer').addEventListener('click', () => {
    if (maakWeekbladPdf()) overlay.remove();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function renderWeekDagen() {
  const c = document.getElementById('week-dagen-lijst');
  let html = '';

  const typeLabels = {
    'maaltafels': 'Maaltafels',
    'deeltafels': 'Deeltafels',
    'gemengd-maal-deel': 'Gemengd × en :',
    'splitsingen': 'Splitsingen',
    'getalbeelden': 'Getalbeelden',
    'optel-aftrek-5': '+ en − tot 5',
    'optel-aftrek-10': '+ en − tot 10',
    'optel-aftrek-20': '+ en − tot 20',
    'optel-aftrek-100': '+ en − tot 100'
  };

  const vrijeVolgorde = getHuidigeVrijeVolgorde();
  const beschikbareDagen = getBeschikbareDagen();
  const isHuistaak = huidigeWeekVariant === 'huistaak';

  // ============================================
  // MODUS 1: Vrije volgorde (PRO)
  // Toon een rij met dagen op volgorde, met +/− en verplaatsknoppen.
  // ============================================
  if (vrijeVolgorde) {
    const volgorde = getHuidigeVolgorde();

    html += `<p class="week-volgorde-uitleg">Zet de dagen in de volgorde die je wil. Je kunt dezelfde dag meermaals toevoegen (bv. ma-di-ma-di-wo).</p>`;

    if (volgorde.length === 0) {
      html += `<p class="week-leeg-melding">Nog geen dagen toegevoegd. Klik hieronder om een dag toe te voegen.</p>`;
    }

    volgorde.forEach((dagId, idx) => {
      const dag = beschikbareDagen.find(d => d.id === dagId);
      if (!dag) return;
      const st = weekState[dagId];
      const heeftEigenConfig = st.config !== null;
      // Slot-state: configUitgeklapt per slot (idx), zodat 2x ma onafhankelijk uitklapt
      const slotKey = `${dagId}__${idx}`;
      const uitgeklapt = weekState.__slotsUit && weekState.__slotsUit[slotKey];

      html += `<div class="week-dag actief week-slot" data-slot-idx="${idx}">
        <div class="week-slot-hoofd">
          <span class="week-slot-nummer">${idx + 1}</span>
          <span class="week-dag-label">${dag.label}</span>
          ${heeftEigenConfig ? '<span class="week-dag-aangepast">aangepast</span>' : ''}
          <div class="week-slot-knoppen">
            <button type="button" class="week-slot-knop" data-slot-up="${idx}" ${idx === 0 ? 'disabled' : ''} title="Naar boven">▲</button>
            <button type="button" class="week-slot-knop" data-slot-down="${idx}" ${idx === volgorde.length - 1 ? 'disabled' : ''} title="Naar beneden">▼</button>
            <button type="button" class="week-slot-knop week-slot-verwijder" data-slot-verwijder="${idx}" title="Verwijderen">✕</button>
          </div>
        </div>
        <div class="week-dag-instellingen">
          <div class="week-dag-datum-rij">
            <label class="week-dag-datum-label">Datum (optioneel):</label>
            <input type="text" class="week-dag-datum-input" data-dag-datum="${dagId}" placeholder="bv. 12/5" value="${st.datum || ''}">
          </div>
          <div class="week-dag-vorm-rij">
            <label class="week-dag-vorm-label">Vorm:</label>
            <select class="week-dag-vorm" data-dag-vorm="${dagId}">
              <option value="oefeningen" ${(st.vorm || 'oefeningen') === 'oefeningen' ? 'selected' : ''}>📄 Met oefeningen (op papier)</option>
              <option value="invulblad" ${st.vorm === 'invulblad' ? 'selected' : ''}>📝 Invulblad (flits op smartbord)</option>
            </select>
          </div>
          <div class="week-dag-type-rij">
            <label class="week-dag-type-label">Oefeningtype:</label>
            <select class="week-dag-type" data-dag-type="${dagId}">
              ${Object.entries(typeLabels).map(([v, l]) =>
                `<option value="${v}" ${st.type === v ? 'selected' : ''}>${l}</option>`
              ).join('')}
            </select>
            <button type="button" class="week-dag-aanpas-btn" data-slot-uit="${slotKey}">
              ${uitgeklapt ? '▲ Dicht' : '⚙ Aanpassen'}
            </button>
          </div>`;

      if (uitgeklapt) {
        const huidigeConfig = st.config || { ...state.config[st.type] };
        html += `<div class="week-dag-config-blok">
          ${renderDagConfigHTML(dagId, st.type, huidigeConfig)}
          <div class="week-dag-config-acties">
            ${heeftEigenConfig
              ? `<button type="button" class="week-dag-reset-btn" data-dag-reset="${dagId}">↺ Terug naar hoofdinstelling</button>`
              : '<span class="week-dag-hint-text">Pas iets aan om deze dag een eigen configuratie te geven</span>'}
          </div>
        </div>`;
      }
      html += `</div></div>`;
    });

    // "+ Dag toevoegen" knoppen
    html += `<div class="week-toevoeg-rij">
      <span class="week-toevoeg-label">+ Dag toevoegen:</span>
      ${beschikbareDagen.map(d =>
        `<button type="button" class="week-toevoeg-chip" data-toevoeg="${d.id}">${d.kort}</button>`
      ).join('')}
    </div>`;

    html += `<p class="week-hint">
      💡 Zonder aanpassing gebruikt elke dag de instellingen van het <strong>hoofdscherm</strong>.
    </p>`;

  } else {
    // ============================================
    // MODUS 2: Standaard vinkjes
    // ============================================
    if (isHuistaak) {
      html += `<p class="week-volgorde-uitleg">Bij meer dan 5 dagen wordt het huistaakblad automatisch verdeeld over 2 bladen (4+2 of 4+3).</p>`;
    }

    beschikbareDagen.forEach(d => {
      const st = weekState[d.id];
      const heeftEigenConfig = st.config !== null;

      html += `<div class="week-dag ${st.actief ? 'actief' : 'inactief'}" data-dag="${d.id}">
        <label class="week-dag-hoofd">
          <input type="checkbox" ${st.actief ? 'checked' : ''} data-dag-actief="${d.id}">
          <span class="week-dag-label">${d.label}</span>
          ${heeftEigenConfig ? '<span class="week-dag-aangepast">aangepast</span>' : ''}
        </label>`;

      if (st.actief) {
        html += `<div class="week-dag-instellingen">
          <div class="week-dag-datum-rij">
            <label class="week-dag-datum-label">Datum (optioneel):</label>
            <input type="text" class="week-dag-datum-input" data-dag-datum="${d.id}" placeholder="bv. 12/5" value="${st.datum || ''}">
          </div>
          <div class="week-dag-vorm-rij">
            <label class="week-dag-vorm-label">Vorm:</label>
            <select class="week-dag-vorm" data-dag-vorm="${d.id}">
              <option value="oefeningen" ${(st.vorm || 'oefeningen') === 'oefeningen' ? 'selected' : ''}>📄 Met oefeningen (op papier)</option>
              <option value="invulblad" ${st.vorm === 'invulblad' ? 'selected' : ''}>📝 Invulblad (flits op smartbord)</option>
            </select>
          </div>
          <div class="week-dag-type-rij">
            <label class="week-dag-type-label">Oefeningtype:</label>
            <select class="week-dag-type" data-dag-type="${d.id}">
              ${Object.entries(typeLabels).map(([v, l]) =>
                `<option value="${v}" ${st.type === v ? 'selected' : ''}>${l}</option>`
              ).join('')}
            </select>
            <button type="button" class="week-dag-aanpas-btn" data-dag-aanpas="${d.id}">
              ${st.configUitgeklapt ? '▲ Dicht' : '⚙ Aanpassen'}
            </button>
          </div>`;

        if (st.configUitgeklapt) {
          const huidigeConfig = st.config || { ...state.config[st.type] };
          html += `<div class="week-dag-config-blok">
            ${renderDagConfigHTML(d.id, st.type, huidigeConfig)}
            <div class="week-dag-config-acties">
              ${heeftEigenConfig
                ? `<button type="button" class="week-dag-reset-btn" data-dag-reset="${d.id}">↺ Terug naar hoofdinstelling</button>`
                : '<span class="week-dag-hint-text">Pas iets aan om deze dag een eigen configuratie te geven</span>'}
            </div>
          </div>`;
        }

        html += `</div>`;
      }

      html += `</div>`;
    });

    html += `<p class="week-hint">
      💡 Zonder aanpassing gebruikt elke dag de instellingen van het <strong>hoofdscherm</strong>.
      Klik <strong>⚙ Aanpassen</strong> om een dag eigen tafels of opties te geven.
    </p>`;
  }

  c.innerHTML = html;

  // Events
  c.querySelectorAll('[data-dag-actief]').forEach(cb => {
    cb.addEventListener('change', () => {
      const dag = cb.dataset.dagActief;
      weekState[dag].actief = cb.checked;
      renderWeekDagen();
    });
  });
  c.querySelectorAll('[data-dag-type]').forEach(sel => {
    sel.addEventListener('change', () => {
      const dag = sel.dataset.dagType;
      const nieuwType = sel.value;
      const st = weekState[dag];
      // Als type wijzigt: reset de eigen config (die past niet meer)
      if (st.type !== nieuwType) {
        st.config = null;
      }
      st.type = nieuwType;
      renderWeekDagen();
    });
  });
  c.querySelectorAll('[data-dag-vorm]').forEach(sel => {
    sel.addEventListener('change', () => {
      const dag = sel.dataset.dagVorm;
      weekState[dag].vorm = sel.value;
      // Geen re-render nodig: select-waarde is al up-to-date in de DOM,
      // en niets in de UI hangt af van de vorm-keuze (nog).
    });
  });
  c.querySelectorAll('[data-dag-aanpas]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dag = btn.dataset.dagAanpas;
      weekState[dag].configUitgeklapt = !weekState[dag].configUitgeklapt;
      renderWeekDagen();
    });
  });
  c.querySelectorAll('[data-dag-reset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dag = btn.dataset.dagReset;
      weekState[dag].config = null;
      renderWeekDagen();
    });
  });

  // Datum-input per dag
  c.querySelectorAll('[data-dag-datum]').forEach(input => {
    input.addEventListener('input', () => {
      const dag = input.dataset.dagDatum;
      weekState[dag].datum = input.value;
    });
  });

  // === Vrije-volgorde events ===
  // Slot-uitklap (per slot-index zodat 2x ma onafhankelijk werkt)
  c.querySelectorAll('[data-slot-uit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.slotUit;
      if (!weekState.__slotsUit) weekState.__slotsUit = {};
      weekState.__slotsUit[key] = !weekState.__slotsUit[key];
      renderWeekDagen();
    });
  });
  // Slot up
  c.querySelectorAll('[data-slot-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.slotUp, 10);
      const volg = [...getHuidigeVolgorde()];
      if (idx > 0) {
        [volg[idx - 1], volg[idx]] = [volg[idx], volg[idx - 1]];
        setHuidigeVolgorde(volg);
        renderWeekDagen();
      }
    });
  });
  // Slot down
  c.querySelectorAll('[data-slot-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.slotDown, 10);
      const volg = [...getHuidigeVolgorde()];
      if (idx < volg.length - 1) {
        [volg[idx], volg[idx + 1]] = [volg[idx + 1], volg[idx]];
        setHuidigeVolgorde(volg);
        renderWeekDagen();
      }
    });
  });
  // Slot verwijderen
  c.querySelectorAll('[data-slot-verwijder]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.slotVerwijder, 10);
      const volg = [...getHuidigeVolgorde()];
      volg.splice(idx, 1);
      setHuidigeVolgorde(volg);
      renderWeekDagen();
    });
  });
  // Dag toevoegen aan volgorde
  c.querySelectorAll('[data-toevoeg]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dagId = btn.dataset.toevoeg;
      const maxDagen = huidigeWeekVariant === 'huistaak' ? 7 : 5;
      const volg = [...getHuidigeVolgorde()];
      if (volg.length >= maxDagen) {
        alert(`Maximum ${maxDagen} dagen per ${huidigeWeekVariant === 'huistaak' ? 'huistaakblad' : 'weekblad'}.`);
        return;
      }
      volg.push(dagId);
      setHuidigeVolgorde(volg);
      renderWeekDagen();
    });
  });

  // Event handlers voor de config-velden binnen elke dag
  koppelDagConfigEvents(c);
}

// Genereert de config-UI voor een specifieke dag (subset van hoofdconfig)
function renderDagConfigHTML(dagId, type, conf) {
  let html = '';

  if (type === 'maaltafels' || type === 'deeltafels') {
    const label = type === 'maaltafels' ? 'Welke maaltafels?' : 'Welke deeltafels?';
    html += `<div class="dag-config-groep">
      <label>${label}</label>
      <div class="dag-tafels-chips" data-dag-tafels="${dagId}">
        ${[2,3,4,5,6,7,8,9,10].map(t =>
          `<button type="button" class="chip-tafel ${conf.tafels.includes(t) ? 'geselecteerd' : ''}" data-tafel="${t}">${t}</button>`
        ).join('')}
      </div>
    </div>`;
  }

  else if (type === 'gemengd-maal-deel') {
    html += `<div class="dag-config-groep">
      <label>Welke maaltafels?</label>
      <div class="dag-tafels-chips" data-dag-tafels-keer="${dagId}">
        ${[2,3,4,5,6,7,8,9,10].map(t =>
          `<button type="button" class="chip-tafel ${conf.tafelsKeer.includes(t) ? 'geselecteerd' : ''}" data-tafel="${t}">${t}</button>`
        ).join('')}
      </div>
    </div>
    <div class="dag-config-groep">
      <label>Welke deeltafels?</label>
      <div class="dag-tafels-chips" data-dag-tafels-deel="${dagId}">
        ${[2,3,4,5,6,7,8,9,10].map(t =>
          `<button type="button" class="chip-tafel ${conf.tafelsDeel.includes(t) ? 'geselecteerd' : ''}" data-tafel="${t}">${t}</button>`
        ).join('')}
      </div>
    </div>`;
  }

  else if (type === 'splitsingen') {
    html += `<div class="dag-config-groep">
      <label>Splitsingen tot en met</label>
      <div class="dag-radio-rij" data-dag-radio="${dagId}-totaal">
        ${[5,6,7,8,9,10].map(n =>
          `<button type="button" class="chip-radio ${conf.totaal === n ? 'geselecteerd' : ''}" data-waarde="${n}">tot ${n}</button>`
        ).join('')}
      </div>
    </div>
    <div class="dag-config-groep">
      <label>Wat ontbreekt?</label>
      <div class="dag-radio-rij" data-dag-radio="${dagId}-variant">
        ${[
          {v:'top',l:'Totaal boven'},
          {v:'kind',l:'Getal onder'},
          {v:'mix',l:'Door elkaar'}
        ].map(o =>
          `<button type="button" class="chip-radio ${conf.variant === o.v ? 'geselecteerd' : ''}" data-waarde="${o.v}">${o.l}</button>`
        ).join('')}
      </div>
    </div>`;
  }

  else if (type === 'optel-aftrek-5' || type === 'optel-aftrek-10') {
    html += `<div class="dag-config-groep">
      <label>Bewerking</label>
      <div class="dag-radio-rij" data-dag-radio="${dagId}-bewerking">
        ${[{v:'plus',l:'+'},{v:'min',l:'−'},{v:'gemengd',l:'Gemengd'}].map(o =>
          `<button type="button" class="chip-radio ${conf.bewerking === o.v ? 'geselecteerd' : ''}" data-waarde="${o.v}">${o.l}</button>`
        ).join('')}
      </div>
    </div>`;
  }

  else if (type === 'optel-aftrek-20' || type === 'optel-aftrek-100') {
    html += `<div class="dag-config-groep">
      <label>Bewerking</label>
      <div class="dag-radio-rij" data-dag-radio="${dagId}-bewerking">
        ${[{v:'plus',l:'+'},{v:'min',l:'−'},{v:'gemengd',l:'Gemengd'}].map(o =>
          `<button type="button" class="chip-radio ${conf.bewerking === o.v ? 'geselecteerd' : ''}" data-waarde="${o.v}">${o.l}</button>`
        ).join('')}
      </div>
    </div>
    <div class="dag-config-groep">
      <label>Brug over het tiental</label>
      <div class="dag-radio-rij" data-dag-radio="${dagId}-brug">
        ${[{v:'zonder',l:'Zonder'},{v:'met',l:'Met'},{v:'gemengd',l:'Gemengd'}].map(o =>
          `<button type="button" class="chip-radio ${conf.brug === o.v ? 'geselecteerd' : ''}" data-waarde="${o.v}">${o.l}</button>`
        ).join('')}
      </div>
    </div>`;
  }

  else if (type === 'getalbeelden') {
    html += `<div class="dag-config-info">
      💡 Getalbeelden werken niet op papier. Zet de <strong>Vorm</strong> van deze dag op <strong>📝 Invulblad (flits)</strong> — dan flits je de getalbeelden op het smartbord en vullen de kinderen het antwoord in op hun blad. Instellingen voor de getalbeelden zelf staan op het hoofdscherm.
    </div>`;
  }

  return html;
}

// Zorgt voor een eigen config-object voor een dag (kopie van hoofdconfig)
function zorgVoorEigenConfig(dagId) {
  const st = weekState[dagId];
  if (!st.config) {
    // Diepe kopie van hoofdconfig voor dit type
    st.config = JSON.parse(JSON.stringify(state.config[st.type]));
  }
  return st.config;
}

function koppelDagConfigEvents(c) {
  // Tafel-chips (maaltafels/deeltafels)
  c.querySelectorAll('[data-dag-tafels]').forEach(container => {
    const dagId = container.dataset.dagTafels;
    container.querySelectorAll('button[data-tafel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const conf = zorgVoorEigenConfig(dagId);
        const t = parseInt(btn.dataset.tafel, 10);
        const idx = conf.tafels.indexOf(t);
        if (idx >= 0) conf.tafels.splice(idx, 1);
        else conf.tafels.push(t);
        conf.tafels.sort((a, b) => a - b);
        renderWeekDagen();
      });
    });
  });

  // Tafels keer (gemengd)
  c.querySelectorAll('[data-dag-tafels-keer]').forEach(container => {
    const dagId = container.dataset.dagTafelsKeer;
    container.querySelectorAll('button[data-tafel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const conf = zorgVoorEigenConfig(dagId);
        const t = parseInt(btn.dataset.tafel, 10);
        const idx = conf.tafelsKeer.indexOf(t);
        if (idx >= 0) conf.tafelsKeer.splice(idx, 1);
        else conf.tafelsKeer.push(t);
        conf.tafelsKeer.sort((a, b) => a - b);
        renderWeekDagen();
      });
    });
  });
  c.querySelectorAll('[data-dag-tafels-deel]').forEach(container => {
    const dagId = container.dataset.dagTafelsDeel;
    container.querySelectorAll('button[data-tafel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const conf = zorgVoorEigenConfig(dagId);
        const t = parseInt(btn.dataset.tafel, 10);
        const idx = conf.tafelsDeel.indexOf(t);
        if (idx >= 0) conf.tafelsDeel.splice(idx, 1);
        else conf.tafelsDeel.push(t);
        conf.tafelsDeel.sort((a, b) => a - b);
        renderWeekDagen();
      });
    });
  });

  // Radio-groepen (splitsingen totaal/variant, bewerking, brug)
  c.querySelectorAll('[data-dag-radio]').forEach(container => {
    const [dagId, veld] = container.dataset.dagRadio.split('-');
    container.querySelectorAll('button[data-waarde]').forEach(btn => {
      btn.addEventListener('click', () => {
        const conf = zorgVoorEigenConfig(dagId);
        let waarde = btn.dataset.waarde;
        // Convert numeric fields
        if (veld === 'totaal') waarde = parseInt(waarde, 10);
        conf[veld] = waarde;
        renderWeekDagen();
      });
    });
  });
}

function maakWeekbladPdf() {
  const vrijeVolgorde = getHuidigeVrijeVolgorde();
  const beschikbareDagen = getBeschikbareDagen();
  const isHuistaak = huidigeWeekVariant === 'huistaak';

  // Bouw lijst van slots = wat er op het blad komt (per slot: dag-info + state-key)
  // Bij vrije volgorde: kan een dag 2x voorkomen, daarom slot-indexering.
  let slots;
  if (vrijeVolgorde) {
    slots = getHuidigeVolgorde().map(dagId => {
      const dag = beschikbareDagen.find(d => d.id === dagId);
      return dag ? { ...dag, stateKey: dagId } : null;
    }).filter(Boolean);
  } else {
    slots = beschikbareDagen
      .filter(d => weekState[d.id].actief)
      .map(d => ({ ...d, stateKey: d.id }));
  }

  if (slots.length === 0) {
    alert(vrijeVolgorde ? 'Voeg minstens één dag toe.' : 'Kies minstens één dag.');
    return false;
  }

  // Max-controle
  const maxDagen = isHuistaak ? 7 : 5;
  if (slots.length > maxDagen) {
    alert(`Maximum ${maxDagen} dagen per ${isHuistaak ? 'huistaakblad' : 'weekblad'}.`);
    return false;
  }

  const getConfigVoorDag = (dagId) => {
    const st = weekState[dagId];
    return st.config || state.config[st.type];
  };

  const getVormVoorDag = (dagId) => {
    return weekState[dagId].vorm || 'oefeningen';
  };

  // Validatie per slot: enkel slots met vorm 'oefeningen' hebben echte oefeningen nodig.
  // Slots met vorm 'invulblad' (flits) mogen ook getalbeelden zijn — die werken juist
  // perfect bij flits-modus op het smartbord.
  for (const slot of slots) {
    const vorm = getVormVoorDag(slot.stateKey);
    if (vorm !== 'oefeningen') continue;

    const type = weekState[slot.stateKey].type;
    const conf = getConfigVoorDag(slot.stateKey);
    const bron = weekState[slot.stateKey].config
      ? `aangepaste instellingen van ${slot.label}`
      : 'hoofdscherm';

    if ((type === 'maaltafels' || type === 'deeltafels') && conf.tafels.length === 0) {
      alert(`Voor ${slot.label} (${type}): kies eerst minstens één tafel (in ${bron}).`);
      return false;
    }
    if (type === 'gemengd-maal-deel' && (conf.tafelsKeer.length === 0 || conf.tafelsDeel.length === 0)) {
      alert(`Voor ${slot.label} (gemengd × en :): kies eerst minstens één maal- en deeltafel (in ${bron}).`);
      return false;
    }
    if (type === 'getalbeelden') {
      alert(`Getalbeelden werken niet op papier — zet de vorm van ${slot.label} op '📝 Invulblad (flits op smartbord)' of kies een ander oefeningtype.`);
      return false;
    }
  }

  // Genereer oefeningen + voeg datum + vorm toe.
  // Per dag: bij vorm 'invulblad' geen oefeningen genereren (gewoon lege lijntjes op het blad).
  const dagenMetOef = slots.map(slot => {
    const st = weekState[slot.stateKey];
    const type = st.type;
    const vorm = getVormVoorDag(slot.stateKey);
    return {
      id: slot.id,
      label: slot.label,
      kort: slot.kort,
      datum: st.datum || '',
      type,
      vorm,
      oefeningen: vorm === 'invulblad'
        ? null
        : window.TempotoetsenGen.genereerToets(type, getConfigVoorDag(slot.stateKey), 10)
    };
  });

  // === Split-logica ===
  // 1–5 dagen → 1 blad. 6 dagen → 4+2. 7 dagen → 4+3.
  const groepen = splitsInBladen(dagenMetOef);

  genereerWeekbladPdf(groepen, weekState.weekVan || '', isHuistaak);
  return true;
}

function splitsInBladen(dagen) {
  const n = dagen.length;
  if (n <= 5) return [dagen];
  if (n === 6) return [dagen.slice(0, 4), dagen.slice(4)];   // 4+2
  if (n === 7) return [dagen.slice(0, 4), dagen.slice(4)];   // 4+3
  // veiligheid: meer dan 7 (zou niet mogen)
  return [dagen.slice(0, 5), dagen.slice(5)];
}

function genereerWeekbladPdf(groepen, weekVan, isHuistaak) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const breedte = 297;
  const hoogte = 210;
  const marge = 10;

  // Bepaal globaal (over alle dagen heen): zijn alle dagen invulblad, alle oefeningen, of gemengd?
  // Dit beïnvloedt enkel de hoofdtitel en het bestandsnaam-suffix.
  const alleDagen = groepen.flat();
  const aantalInvul = alleDagen.filter(d => d.vorm === 'invulblad').length;
  const allesInvulblad = aantalInvul === alleDagen.length;
  const allesOefeningen = aantalInvul === 0;
  // 'gemengd' = niet alles hetzelfde

  const aantalBladen = groepen.length;
  const totaalKolommen = groepen.reduce((s, g) => s + g.length, 0);

  // === Tekent één pagina met de gegeven dagen ===
  function tekenPagina(dagenOpBlad, bladIdx) {
    // --- Header ---
    doc.setFillColor(245, 159, 59);
    doc.rect(0, 0, breedte, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);

    let hoofdtitel;
    if (isHuistaak) {
      if (allesInvulblad) hoofdtitel = 'Mijn tempo-huistaak (invulblad)';
      else hoofdtitel = 'Mijn tempo-huistaak';
    } else {
      if (allesInvulblad) hoofdtitel = 'Tempotoets — Weekblad (invulblad)';
      else hoofdtitel = 'Tempotoets — Weekblad';
    }
    doc.text(hoofdtitel, marge, 15);

    // Blad-aanduiding rechts in header bij 2 bladen
    if (aantalBladen > 1) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Blad ${bladIdx + 1} van ${aantalBladen}`, breedte - marge, 15, { align: 'right' });
    }

    // Naam + Week van
    doc.setTextColor(45, 42, 38);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Naam:', marge, 32);
    doc.line(marge + 12, 32, marge + 75, 32);

    doc.text('Week van:', marge + 85, 32);
    if (weekVan && weekVan.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.text(weekVan, marge + 103, 32);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.line(marge + 103, 32, marge + 160, 32);
    }

    // Instructie-balk: bij huistaak hoger en meerregelig (uitleg voor ouders)
    const instrY = 37;
    let instrHoogte, kolomStartY;
    if (isHuistaak) {
      instrHoogte = 28;
      doc.setFillColor(253, 236, 212);
      doc.setDrawColor(245, 159, 59);
      doc.setLineWidth(0.4);
      doc.roundedRect(marge, instrY, breedte - marge * 2, instrHoogte, 2.5, 2.5, 'FD');

      // Titel-regel
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(197, 122, 28);
      doc.text('Beste ouder', marge + 4, instrY + 5.5);

      // Uitleg-regels
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 70, 50);
      doc.text('Doel: je kind maakt elke kolom binnen 1 minuut en liefst foutloos. Noteer de gebruikte tijd in het tijd-vakje bovenaan.',
        marge + 4, instrY + 11);

      // BELANGRIJK: één kolom per dag — vet gemarkeerd
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(197, 122, 28);
      doc.text('Belangrijk:', marge + 4, instrY + 17);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 70, 50);
      doc.text(' maak elke dag maar 1 kolom. Dagelijks kort oefenen werkt veel beter dan alles op 1 dag invullen.',
        marge + 22, instrY + 17);

      doc.text('Lukt het nog niet binnen de minuut? Geen probleem — laat je kind extra oefenen met de flitskaartjes en probeer het later opnieuw. Veel succes!',
        marge + 4, instrY + 23);

      kolomStartY = instrY + instrHoogte + 4;
    } else {
      instrHoogte = 9;
      doc.setFillColor(253, 236, 212);
      doc.setDrawColor(245, 159, 59);
      doc.setLineWidth(0.4);
      doc.roundedRect(marge, instrY, breedte - marge * 2, instrHoogte, 2.5, 2.5, 'FD');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(197, 122, 28);
      doc.text('Elke dag krijg je 1 minuut om zoveel mogelijk oefeningen op te lossen. Klaar? Start!',
        marge + 4, instrY + 6);
      kolomStartY = instrY + instrHoogte + 6;
    }

    // --- Kolommen per dag ---
    const startY = kolomStartY;
    const beschikbareHoogte = hoogte - startY - marge;
    const kolomMarge = 3;
    // Cap kolombreedte op 'als-5-dagen'-breedte zodat 1-2 dagen niet te breed worden
    const dagenOpBladN = dagenOpBlad.length;
    const breedteAls5 = (breedte - marge * 2 - kolomMarge * 4) / 5;
    const kolomBreedteVol = (breedte - marge * 2 - kolomMarge * (dagenOpBladN - 1)) / dagenOpBladN;
    const kolomBreedte = Math.min(kolomBreedteVol, breedteAls5);
    // Centreer bij minder dan 5 dagen
    const totaleBreedte = kolomBreedte * dagenOpBladN + kolomMarge * (dagenOpBladN - 1);
    const startX = (breedte - totaleBreedte) / 2;

    // Header-hoogte iets groter als datum is ingevuld
    const heeftDatums = dagenOpBlad.some(d => d.datum && d.datum.trim());
    const dagHeaderHoogte = heeftDatums ? 14 : 10;
    // Bij huistaak: extra ruimte onder header voor het tijd-vakje
    const tijdVakHoogte = isHuistaak ? 11 : 0;
    const oefStartY = startY + dagHeaderHoogte + tijdVakHoogte + 4;
    const oefHoogte = (hoogte - oefStartY - marge - 4) / 10;

    dagenOpBlad.forEach((d, dIdx) => {
      const x = startX + dIdx * (kolomBreedte + kolomMarge);

      // Dag-header (paarse balk)
      doc.setFillColor(107, 76, 155);
      doc.roundedRect(x, startY, kolomBreedte, dagHeaderHoogte, 2, 2, 'F');

      // Dagnaam links
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(d.label, x + 4, startY + 6.7);

      // Datum onder dagnaam (indien ingevuld)
      if (d.datum && d.datum.trim()) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(d.datum, x + 4, startY + 11.8);
      }

      // Score-vakje rechtsboven (in paarse balk)
      const scoreBreedte = 16;
      const scoreHoogte = 6;
      const scoreX = x + kolomBreedte - scoreBreedte - 3;
      const scoreY = startY + (dagHeaderHoogte - scoreHoogte) / 2;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(255, 255, 255);
      doc.roundedRect(scoreX, scoreY, scoreBreedte, scoreHoogte, 1.5, 1.5, 'F');
      doc.setTextColor(107, 76, 155);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('___/10', scoreX + scoreBreedte / 2, scoreY + 4.2, { align: 'center' });

      // Bij huistaak: ruim tijd-vakje ONDER de paarse balk
      if (isHuistaak) {
        const tijdY = startY + dagHeaderHoogte + 1.5;
        const tijdBreedte = kolomBreedte - 6;
        const tijdHoogte = 9;
        const tijdX = x + 3;

        doc.setFillColor(253, 236, 212);
        doc.setDrawColor(245, 159, 59);
        doc.setLineWidth(0.4);
        doc.roundedRect(tijdX, tijdY, tijdBreedte, tijdHoogte, 1.5, 1.5, 'FD');

        // Label "Tijd:" links
        doc.setTextColor(197, 122, 28);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Tijd:', tijdX + 3, tijdY + 5.8);

        // Layout: [Tijd:] [_] min [____] sec
        // min = 1 cijfer (korte lijn), sec = 2 cijfers (langere lijn)
        const labelEind = tijdX + 13;             // na "Tijd:"
        const totaalBreedte = tijdBreedte - 16;   // ruimte na "Tijd:" tot rand
        const lijnY = tijdY + 6.5;

        // min-lijn: kort (één cijfer past), sec-lijn: ongeveer 2x zo lang
        const minLabelX = labelEind + totaalBreedte * 0.22;
        const secLabelX = labelEind + totaalBreedte - 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('min', minLabelX, tijdY + 5.8);
        doc.text('sec', secLabelX, tijdY + 5.8);

        // Invullijn 1 (voor "min") — kort
        doc.setDrawColor(197, 122, 28);
        doc.setLineWidth(0.4);
        doc.line(labelEind + 1, lijnY, minLabelX - 1, lijnY);

        // Invullijn 2 (voor "sec") — lang, voor 2 cijfers
        doc.line(minLabelX + 7, lijnY, secLabelX - 1, lijnY);
      }

      doc.setTextColor(45, 42, 38);

      // Bepaal per dag of dit een invulblad-kolom of oefeningen-kolom is
      const dagIsInvulblad = d.vorm === 'invulblad';

      if (dagIsInvulblad) {
        for (let i = 0; i < 10; i++) {
          const y = oefStartY + i * oefHoogte + 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(140, 140, 140);
          doc.text(`${i + 1}.`, x + 3, y);

          doc.setDrawColor(190, 190, 190);
          doc.setLineWidth(0.3);
          doc.line(x + 10, y + 1, x + kolomBreedte - 3, y + 1);
        }
      } else {
        const isSplitsingenDag = d.oefeningen.length > 0
          && typeof d.oefeningen[0].vraag === 'object'
          && d.oefeningen[0].vraag.type === 'splitsing';

        if (isSplitsingenDag) {
          const subKolomBreedte = kolomBreedte / 2;
          const rijHoogte = (hoogte - oefStartY - marge - 4) / 5;

          d.oefeningen.forEach((o, i) => {
            const subKolom = i % 2;
            const rij = Math.floor(i / 2);
            const centerX = x + subKolom * subKolomBreedte + subKolomBreedte / 2;
            const centerY = oefStartY + rij * rijHoogte + rijHoogte / 2;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(160, 160, 160);
            doc.text(`${i + 1}.`, x + subKolom * subKolomBreedte + 1.5, centerY - rijHoogte / 2 + 3);

            tekenMiniSplitsing(doc, o.vraag, centerX, centerY, subKolomBreedte * 0.9, rijHoogte * 0.85);
          });
        } else {
          d.oefeningen.forEach((o, i) => {
            const y = oefStartY + i * oefHoogte + 6;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(160, 160, 160);
            doc.text(`${i + 1}.`, x + 2, y);

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(45, 42, 38);

            const vraagText = typeof o.vraag === 'string' ? o.vraag : '___';
            doc.text(`${vraagText}  =`, x + 7, y);

            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            const lijnX = x + kolomBreedte - 18;
            doc.line(lijnX, y + 1, lijnX + 15, y + 1);
          });
        }
      }

      // Lichte scheiding tussen kolommen
      if (dIdx < dagenOpBlad.length - 1) {
        doc.setDrawColor(230, 225, 215);
        doc.setLineWidth(0.2);
        const scheidingX = x + kolomBreedte + kolomMarge / 2;
        doc.line(scheidingX, startY + dagHeaderHoogte + tijdVakHoogte + 2, scheidingX, hoogte - marge - 4);
      }
    });

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('juf Zisa · jufzisa.be', marge, hoogte - 4);
  }

  // === Tekent één antwoordbladpagina ===
  function tekenAntwoordPagina(dagenOpBlad, bladIdx) {
    doc.setFillColor(107, 76, 155);
    doc.rect(0, 0, breedte, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const antTitel = isHuistaak ? 'Antwoordenblad — Huistaak' : 'Antwoordenblad — Weekblad';
    doc.text(antTitel, marge, 12);
    if (aantalBladen > 1) {
      doc.setFontSize(10);
      doc.text(`Blad ${bladIdx + 1} van ${aantalBladen}`, breedte - marge, 12, { align: 'right' });
    }

    const kolomMarge = 3;
    const dagenAntN = dagenOpBlad.length;
    const breedteAls5Ant = (breedte - marge * 2 - kolomMarge * 4) / 5;
    const kolomBreedteVolAnt = (breedte - marge * 2 - kolomMarge * (dagenAntN - 1)) / dagenAntN;
    const kolomBreedte = Math.min(kolomBreedteVolAnt, breedteAls5Ant);
    const totaleBreedteAnt = kolomBreedte * dagenAntN + kolomMarge * (dagenAntN - 1);
    const startXAnt = (breedte - totaleBreedteAnt) / 2;
    const antStartY = 26;
    const antOefHoogte = (hoogte - antStartY - marge) / 10;

    dagenOpBlad.forEach((d, dIdx) => {
      const x = startXAnt + dIdx * (kolomBreedte + kolomMarge);

      doc.setFillColor(253, 236, 212);
      doc.roundedRect(x, antStartY, kolomBreedte, 8, 2, 2, 'F');
      doc.setTextColor(197, 122, 28);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const titelTxt = d.datum && d.datum.trim() ? `${d.label} (${d.datum})` : d.label;
      doc.text(titelTxt, x + kolomBreedte / 2, antStartY + 5.5, { align: 'center' });

      // Bij een invulblad-dag is er geen lijst van oefeningen om te corrigeren —
      // de juf flitst dan zelf en weet de antwoorden. Toon een korte melding.
      if (d.vorm === 'invulblad' || !d.oefeningen) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(140, 140, 140);
        doc.text('Flits-dag', x + kolomBreedte / 2, antStartY + 22, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('(geen correctie nodig —', x + kolomBreedte / 2, antStartY + 30, { align: 'center' });
        doc.text('antwoorden via smartbord)', x + kolomBreedte / 2, antStartY + 35, { align: 'center' });
        return;
      }

      d.oefeningen.forEach((o, i) => {
        const y = antStartY + 14 + i * antOefHoogte + 4;
        let vraagText;
        if (typeof o.vraag === 'string') {
          vraagText = o.vraag;
        } else if (o.vraag.type === 'splitsing') {
          const t = o.vraag.top === null ? '?' : o.vraag.top;
          const l = o.vraag.links === null ? '?' : o.vraag.links;
          const r = o.vraag.rechts === null ? '?' : o.vraag.rechts;
          vraagText = `${t}=${l}+${r}`;
        } else {
          vraagText = '';
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        if (o.vraag && o.vraag.type === 'splitsing') {
          doc.text(`${i + 1}. ${vraagText}`, x + 2, y);
        } else {
          doc.text(`${i + 1}. ${vraagText} =`, x + 2, y);
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(122, 182, 72);
        doc.text(String(o.antwoord), x + kolomBreedte - 14, y);
      });
    });
  }

  // === Render alle bladen ===
  groepen.forEach((dagenOpBlad, bladIdx) => {
    if (bladIdx > 0) doc.addPage('a4', 'landscape');
    tekenPagina(dagenOpBlad, bladIdx);
  });

  // === Antwoordenbladen — per blad, alleen als er minstens één oefeningen-dag op staat.
  // (Een blad met enkel invulblad-dagen heeft niets te corrigeren.)
  groepen.forEach((dagenOpBlad, bladIdx) => {
    const heeftOefeningen = dagenOpBlad.some(d => d.vorm !== 'invulblad' && d.oefeningen);
    if (!heeftOefeningen) return;
    doc.addPage('a4', 'landscape');
    tekenAntwoordPagina(dagenOpBlad, bladIdx);
  });

  // Bestandsnaam
  let naam;
  if (isHuistaak) {
    naam = allesInvulblad ? 'Tempotoets-Huistaak-invulblad.pdf' : 'Tempotoets-Huistaak.pdf';
  } else {
    naam = allesInvulblad ? 'Tempotoets-Weekblad-invulblad.pdf' : 'Tempotoets-Weekblad.pdf';
  }
  doc.save(naam);
}

// ============================================
// Modus-kaarten
// ============================================
function renderModi() {
  const c = document.getElementById('modi');
  c.innerHTML = `
    <div class="modus-kaart" id="modus-flits">
      <div class="icoon">⚡</div>
      <h3>Flits-modus</h3>
      <p>Oefeningen één voor één op het scherm of smartbord</p>
    </div>
    <div class="modus-kaart" id="modus-antwblad">
      <div class="icoon">📝</div>
      <h3>Invulblad</h3>
      <p>PDF met alleen nummers om antwoorden op te noteren (bij flits)</p>
    </div>
    <div class="modus-kaart" id="modus-papier">
      <div class="icoon">📄</div>
      <h3>Dagblad</h3>
      <p>PDF met de 10 oefeningen van vandaag, de juf timet 1 minuut</p>
    </div>
    <div class="modus-kaart modus-kaart-uitgelicht" id="modus-week">
      <div class="icoon">📅</div>
      <h3>Weekblad</h3>
      <p>Liggend A4 met tot 5 dagen — kies welke dagen, datum en wat per dag</p>
    </div>
    <div class="modus-kaart modus-kaart-uitgelicht modus-kaart-nieuw" id="modus-huistaak">
      <div class="icoon">🏠</div>
      <h3>Huistaakblad</h3>
      <p>Voor thuis — tot 7 dagen (incl. weekend), met tijd-vakje per dag. Bij meer dan 5 dagen automatisch over 2 bladen.</p>
    </div>
  `;
  document.getElementById('modus-flits').addEventListener('click', startFlitsModus);
  document.getElementById('modus-papier').addEventListener('click', maakPdfPapier);
  document.getElementById('modus-antwblad').addEventListener('click', () => maakPdfAntwoordblad(false));
  document.getElementById('modus-week').addEventListener('click', () => openWeekbladDialoog('weekblad'));
  document.getElementById('modus-huistaak').addEventListener('click', () => openWeekbladDialoog('huistaak'));
}

// ============================================
// UITLEG — stapsgewijze rondleiding
// ============================================
const uitlegStappen = [
  {
    titel: 'Welkom!',
    illustratie: 'welkom',
    tekst: `<p><strong>De Tempotoetsen Generator</strong> maakt elke dag een nieuwe tempotoets voor je klas, in enkele klikken.</p>
      <p>In deze korte rondleiding laat ik je zien:</p>
      <ul>
        <li>Welke oefeningtypes er zijn</li>
        <li>Hoe je instellingen kiest</li>
        <li>De 4 manieren om de toets te gebruiken</li>
        <li>Hoe je een volledig weekblad maakt</li>
      </ul>`
  },
  {
    titel: 'Stap 1 — Kies een oefeningtype',
    illustratie: 'tabs',
    tekst: `<p>Bovenaan staan de <strong>tabbladen</strong> met alle oefeningtypes:</p>
      <ul>
        <li><strong>Maaltafels</strong> — klassieke tafels 2 tot 10</li>
        <li><strong>Deeltafels</strong> — delingen, altijd met teken <code>:</code></li>
        <li><strong>Gemengd × en :</strong> — 5 maal + 5 deel (gegarandeerd 50/50)</li>
        <li><strong>Splitsingen</strong> — tot 5, 6, 7, 8, 9 of 10</li>
        <li><strong>Getalbeelden</strong> — MAB, 100-veld, notatie (4E 7T), rekenrek</li>
        <li><strong>+ en − tot 5 / 10 / 20 / 100</strong> — voor 1e t.e.m. 4e leerjaar, met of zonder brug</li>
      </ul>
      <p class="tip">💡 Je kan altijd op <strong>"Alle"</strong>, <strong>"Geen"</strong> of een snelle keuze zoals <strong>"2-5-10"</strong> klikken om snel tafels te selecteren.</p>`
  },
  {
    titel: 'Stap 2 — Stel je oefeningen in',
    illustratie: 'config',
    tekst: `<p>In het <strong>Instellingen</strong>-paneel kies je wat in de toets komt.</p>
      <p>Afhankelijk van het type zie je verschillende opties:</p>
      <ul>
        <li><strong>Tafels</strong>: klik op de tafels die je wil oefenen (bv. 2 en 5)</li>
        <li><strong>Volgorde</strong>: <em>tafel × factor</em>, <em>factor × tafel</em>, of <em>beide door elkaar</em></li>
        <li><strong>Bewerking</strong>: alleen +, alleen −, of gemengd (dan altijd 5 plus + 5 min)</li>
        <li><strong>Brug</strong>: zonder brug, met brug, of gemengd</li>
      </ul>
      <p>In het <strong>Voorbeeld</strong> zie je meteen 10 oefeningen. Klik <strong>🔄 Nieuwe voorbeelden</strong> voor een andere set.</p>`
  },
  {
    titel: 'Stap 3 — De 4 manieren',
    illustratie: 'modi',
    tekst: `<p>Onderaan kies je hoe je de toets gebruikt:</p>
      <ul>
        <li><strong>⚡ Flits-modus</strong> — oefeningen één voor één op het smartbord, met timer per oefening</li>
        <li><strong>📝 Invulblad</strong> — PDF met enkel genummerde lijnen, voor tijdens het flitsen</li>
        <li><strong>📄 Dagblad</strong> — PDF met alle 10 oefeningen, de kinderen krijgen 1 minuut</li>
        <li><strong>📅 Weekblad</strong> — liggend A4 met een hele week op 1 blad</li>
      </ul>
      <p class="tip">💡 Bij het dagblad krijg je automatisch een <strong>antwoordblad</strong> op pagina 2 om snel te verbeteren.</p>`
  },
  {
    titel: 'Stap 4 — Het weekblad',
    illustratie: 'weekblad',
    tekst: `<p>Met één klik op <strong>📅 Weekblad</strong> opent een dialoogvenster waar je een hele week in elkaar zet.</p>
      <p>Per dag kun je:</p>
      <ul>
        <li>De dag <strong>aan- of uitvinken</strong> (bv. woensdag weglaten bij een brugdag)</li>
        <li>Een <strong>vorm</strong> kiezen: 📄 met oefeningen op papier, of 📝 invulblad voor flitsen op het smartbord</li>
        <li>Een <strong>oefeningtype</strong> kiezen (elke dag kan anders)</li>
        <li>Op <strong>⚙ Aanpassen</strong> klikken om die dag eigen tafels/opties te geven</li>
      </ul>
      <p>Standaard erft elke dag de instellingen van het hoofdscherm. Zodra je iets aanpast, verschijnt een paarse <strong>AANGEPAST</strong> badge naast de dagnaam.</p>`
  },
  {
    titel: 'Stap 5 — Afwisselen binnen één week',
    illustratie: 'weekmodus',
    tekst: `<p>Je kunt binnen <em>hetzelfde</em> weekblad afwisselen tussen vormen — heel handig om variatie te brengen in de week:</p>
      <ul>
        <li><strong>📄 Met oefeningen (op papier)</strong> — die dag staan de 10 oefeningen klaar, kinderen timen zelf</li>
        <li><strong>📝 Invulblad (flits op smartbord)</strong> — die dag enkel genummerde lijnen; je flitst zelf op het smartbord en kinderen vullen het antwoord in</li>
      </ul>
      <p>Voorbeeld: maandag, dinsdag en donderdag op papier — woensdag en vrijdag als flitstoets. Zo krijgt de klas variatie en kun je op flitsdagen ook getalbeelden gebruiken.</p>
      <p>Bij <strong>Week van</strong> kun je de datum alvast invullen (bv. <em>5 mei 2026</em>). Laat je dit leeg, dan staat er een invullijn op de PDF.</p>
      <p>Elke dag krijgt een wit <strong>___/10</strong> score-vakje rechts in de paarse balk om punten te noteren.</p>`
  },
  {
    titel: 'Stap 6 — Didactisch voorbeeld',
    illustratie: 'voorbeeld',
    tekst: `<p><strong>De tafel van 5 inoefenen over een week?</strong></p>
      <p>Dat doe je zo:</p>
      <ol>
        <li>Ga naar <strong>Maaltafels</strong>, kies <strong>tafel 5</strong> op het hoofdscherm</li>
        <li>Klik <strong>📅 Weekblad</strong></li>
        <li>Voor woensdag en vrijdag: klik <strong>⚙ Aanpassen</strong> en voeg <strong>tafel 2</strong> toe (gemengd inoefenen)</li>
        <li>Klik <strong>📄 Weekblad maken</strong></li>
      </ol>
      <p>Resultaat: maandag, dinsdag en donderdag alleen tafel 5 → woensdag en vrijdag tafels 2 + 5 door elkaar. Stevig opbouwen in één blad.</p>`
  },
  {
    titel: 'Klaar!',
    illustratie: 'klaar',
    tekst: `<p>Je weet nu hoe alles werkt. Tijd om je eerste tempotoets te maken!</p>
      <p class="tip">💡 <strong>Tips voor dagelijks gebruik:</strong></p>
      <ul>
        <li>Wissel regelmatig tussen oefeningtypes om kinderen scherp te houden</li>
        <li>Begin met <em>alleen plus</em> of <em>alleen min</em>, pas daarna <em>gemengd</em></li>
        <li>De flits-modus werkt fantastisch op een smartbord — combineer met invulblad voor snelle correctie</li>
        <li>Voor getalbeelden: gebruik altijd flits-modus of het weekblad-invulblad</li>
      </ul>
      <p>Deze uitleg kun je altijd opnieuw openen met de <strong>❓ Hoe werkt dit?</strong> knop bovenaan.</p>
      <p style="text-align:center;font-size:1.2em;margin-top:20px;">🦓 <em>Veel succes! — juf Zisa</em></p>`
  }
];

function illustratieSvg(type) {
  const p = '#6b4c9b', o = '#f59f3b', g = '#7ab648', gl = '#ffd84d', r = '#e879a7', c = '#fdf8ef';

  switch (type) {
    case 'welkom':
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="${c}"/>
        <rect x="40" y="30" width="320" height="36" rx="8" fill="${o}"/>
        <text x="200" y="54" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="18" fill="white">⚡ Tempotoetsen Generator</text>
        <rect x="40" y="80" width="80" height="50" rx="8" fill="white" stroke="${p}" stroke-width="2"/>
        <text x="80" y="110" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="12" fill="${p}">Flits</text>
        <rect x="130" y="80" width="80" height="50" rx="8" fill="white" stroke="${p}" stroke-width="2"/>
        <text x="170" y="110" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="12" fill="${p}">Invulblad</text>
        <rect x="220" y="80" width="80" height="50" rx="8" fill="white" stroke="${p}" stroke-width="2"/>
        <text x="260" y="110" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="12" fill="${p}">Dagblad</text>
        <rect x="310" y="80" width="70" height="50" rx="8" fill="${o}" fill-opacity="0.2" stroke="${o}" stroke-width="2"/>
        <text x="345" y="110" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="12" fill="${o}">Weekblad</text>
        <text x="200" y="160" text-anchor="middle" font-family="Nunito" font-size="13" fill="#666">Één tool, 4 manieren om te gebruiken</text>
      </svg>`;

    case 'tabs':
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="${c}"/>
        <g font-family="Nunito" font-weight="700" font-size="11">
          <rect x="15" y="30" width="60" height="28" rx="14" fill="${o}"/>
          <text x="45" y="48" text-anchor="middle" fill="white">Maaltafels</text>
          <rect x="82" y="30" width="58" height="28" rx="14" fill="white" stroke="#ddd"/>
          <text x="111" y="48" text-anchor="middle" fill="#333">Deeltafels</text>
          <rect x="147" y="30" width="58" height="28" rx="14" fill="white" stroke="#ddd"/>
          <text x="176" y="48" text-anchor="middle" fill="#333">× en :</text>
          <rect x="212" y="30" width="60" height="28" rx="14" fill="white" stroke="#ddd"/>
          <text x="242" y="48" text-anchor="middle" fill="#333">Splitsingen</text>
          <rect x="279" y="30" width="65" height="28" rx="14" fill="white" stroke="#ddd"/>
          <text x="311" y="48" text-anchor="middle" fill="#333">Getalbeelden</text>
          <rect x="351" y="30" width="35" height="28" rx="14" fill="white" stroke="#ddd"/>
          <text x="368" y="48" text-anchor="middle" fill="#333">+/−</text>
        </g>
        <rect x="15" y="78" width="370" height="85" rx="12" fill="white" stroke="#eee"/>
        <text x="30" y="98" font-family="Nunito" font-weight="700" font-size="12" fill="${p}">Welke maaltafels?</text>
        <g font-family="Nunito" font-weight="700" font-size="12">
          <rect x="30" y="110" width="30" height="30" rx="6" fill="${o}"/>
          <text x="45" y="130" text-anchor="middle" fill="white">2</text>
          <rect x="66" y="110" width="30" height="30" rx="6" fill="white" stroke="#ddd"/>
          <text x="81" y="130" text-anchor="middle" fill="#888">3</text>
          <rect x="102" y="110" width="30" height="30" rx="6" fill="white" stroke="#ddd"/>
          <text x="117" y="130" text-anchor="middle" fill="#888">4</text>
          <rect x="138" y="110" width="30" height="30" rx="6" fill="${o}"/>
          <text x="153" y="130" text-anchor="middle" fill="white">5</text>
          <rect x="174" y="110" width="30" height="30" rx="6" fill="white" stroke="#ddd"/>
          <text x="189" y="130" text-anchor="middle" fill="#888">6</text>
          <rect x="210" y="110" width="30" height="30" rx="6" fill="white" stroke="#ddd"/>
          <text x="225" y="130" text-anchor="middle" fill="#888">7</text>
          <rect x="246" y="110" width="30" height="30" rx="6" fill="white" stroke="#ddd"/>
          <text x="261" y="130" text-anchor="middle" fill="#888">8</text>
          <rect x="282" y="110" width="30" height="30" rx="6" fill="white" stroke="#ddd"/>
          <text x="297" y="130" text-anchor="middle" fill="#888">9</text>
          <rect x="318" y="110" width="35" height="30" rx="6" fill="${o}"/>
          <text x="335" y="130" text-anchor="middle" fill="white">10</text>
        </g>
      </svg>`;

    case 'config':
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="${c}"/>
        <rect x="15" y="15" width="370" height="150" rx="12" fill="white" stroke="#eee"/>
        <text x="30" y="38" font-family="Nunito" font-weight="700" font-size="13" fill="${p}">Instellingen</text>
        <text x="30" y="60" font-family="Nunito" font-weight="700" font-size="11">Bewerking</text>
        <g font-family="Nunito" font-weight="700" font-size="11">
          <rect x="30" y="68" width="55" height="26" rx="13" fill="white" stroke="#ddd"/>
          <text x="57" y="85" text-anchor="middle" fill="#333">Alleen +</text>
          <rect x="92" y="68" width="55" height="26" rx="13" fill="white" stroke="#ddd"/>
          <text x="119" y="85" text-anchor="middle" fill="#333">Alleen −</text>
          <rect x="154" y="68" width="70" height="26" rx="13" fill="${p}"/>
          <text x="189" y="85" text-anchor="middle" fill="white">Gemengd</text>
        </g>
        <text x="30" y="114" font-family="Nunito" font-weight="700" font-size="11">Brug over het tiental</text>
        <g font-family="Nunito" font-weight="700" font-size="11">
          <rect x="30" y="122" width="62" height="26" rx="13" fill="${p}"/>
          <text x="61" y="139" text-anchor="middle" fill="white">Zonder</text>
          <rect x="99" y="122" width="48" height="26" rx="13" fill="white" stroke="#ddd"/>
          <text x="123" y="139" text-anchor="middle" fill="#333">Met</text>
          <rect x="154" y="122" width="70" height="26" rx="13" fill="white" stroke="#ddd"/>
          <text x="189" y="139" text-anchor="middle" fill="#333">Gemengd</text>
        </g>
      </svg>`;

    case 'modi':
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="${c}"/>
        <text x="200" y="28" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="14" fill="${p}">Hoe wil je de toets gebruiken?</text>
        <g font-family="Nunito">
          <rect x="15" y="45" width="85" height="120" rx="12" fill="white" stroke="#eee"/>
          <text x="57" y="80" text-anchor="middle" font-size="28">⚡</text>
          <text x="57" y="110" text-anchor="middle" font-weight="700" font-size="12" fill="${p}">Flits</text>
          <text x="57" y="128" text-anchor="middle" font-size="9" fill="#888">op smartbord</text>

          <rect x="110" y="45" width="85" height="120" rx="12" fill="white" stroke="#eee"/>
          <text x="152" y="80" text-anchor="middle" font-size="28">📝</text>
          <text x="152" y="110" text-anchor="middle" font-weight="700" font-size="12" fill="${p}">Invulblad</text>
          <text x="152" y="128" text-anchor="middle" font-size="9" fill="#888">enkel nummers</text>

          <rect x="205" y="45" width="85" height="120" rx="12" fill="white" stroke="#eee"/>
          <text x="247" y="80" text-anchor="middle" font-size="28">📄</text>
          <text x="247" y="110" text-anchor="middle" font-weight="700" font-size="12" fill="${p}">Dagblad</text>
          <text x="247" y="128" text-anchor="middle" font-size="9" fill="#888">1 dag, 1 minuut</text>

          <rect x="300" y="45" width="85" height="120" rx="12" fill="${o}" fill-opacity="0.15" stroke="${o}" stroke-width="2"/>
          <text x="342" y="80" text-anchor="middle" font-size="28">📅</text>
          <text x="342" y="110" text-anchor="middle" font-weight="700" font-size="12" fill="${p}">Weekblad</text>
          <text x="342" y="128" text-anchor="middle" font-size="9" fill="#888">5 dagen op 1 blad</text>
          <rect x="332" y="38" width="38" height="14" rx="7" fill="${r}"/>
          <text x="351" y="48" text-anchor="middle" font-weight="800" font-size="8" fill="white">NIEUW</text>
        </g>
      </svg>`;

    case 'weekblad':
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="${c}"/>
        <g font-family="Nunito">
          <rect x="20" y="20" width="360" height="34" rx="8" fill="${o}" fill-opacity="0.12" stroke="${o}" stroke-width="2"/>
          <text x="30" y="42" font-weight="700" font-size="12" fill="${p}">📅 Weekblad samenstellen</text>

          <g transform="translate(20, 65)">
            <rect width="170" height="28" rx="8" fill="${o}" fill-opacity="0.15" stroke="${o}"/>
            <rect x="8" y="8" width="12" height="12" rx="2" fill="${o}"/>
            <text x="30" y="19" font-weight="700" font-size="11" fill="#333">Maandag</text>
            <rect x="82" y="6" width="55" height="16" rx="4" fill="${p}"/>
            <text x="109" y="17" text-anchor="middle" font-weight="700" font-size="8" fill="white">AANGEPAST</text>
            <rect x="142" y="6" width="20" height="16" rx="4" fill="white" stroke="#ccc"/>
            <text x="152" y="17" text-anchor="middle" font-size="10" fill="${p}">⚙</text>
          </g>

          <g transform="translate(210, 65)">
            <rect width="170" height="28" rx="8" fill="${o}" fill-opacity="0.15" stroke="${o}"/>
            <rect x="8" y="8" width="12" height="12" rx="2" fill="${o}"/>
            <text x="30" y="19" font-weight="700" font-size="11" fill="#333">Dinsdag</text>
          </g>

          <g transform="translate(20, 100)">
            <rect width="170" height="28" rx="8" fill="white" stroke="#ddd"/>
            <rect x="10" y="8" width="12" height="12" rx="2" fill="white" stroke="#aaa"/>
            <text x="30" y="19" font-weight="700" font-size="11" fill="#888">Woensdag</text>
            <text x="100" y="19" font-size="9" fill="#888">(brugdag - uit)</text>
          </g>

          <g transform="translate(210, 100)">
            <rect width="170" height="28" rx="8" fill="${o}" fill-opacity="0.15" stroke="${o}"/>
            <rect x="8" y="8" width="12" height="12" rx="2" fill="${o}"/>
            <text x="30" y="19" font-weight="700" font-size="11" fill="#333">Donderdag</text>
          </g>

          <g transform="translate(115, 140)">
            <rect width="170" height="28" rx="8" fill="${o}" fill-opacity="0.15" stroke="${o}"/>
            <rect x="8" y="8" width="12" height="12" rx="2" fill="${o}"/>
            <text x="30" y="19" font-weight="700" font-size="11" fill="#333">Vrijdag</text>
          </g>
        </g>
      </svg>`;

    case 'weekmodus':
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="${c}"/>
        <g font-family="Nunito">
          <text x="20" y="25" font-weight="700" font-size="11" fill="#333">Week van</text>
          <rect x="20" y="32" width="360" height="24" rx="8" fill="white" stroke="${p}" stroke-width="2"/>
          <text x="30" y="49" font-size="11" fill="#333">5 mei 2026</text>

          <text x="20" y="80" font-weight="700" font-size="11" fill="#333">Soort blad</text>
          <rect x="20" y="87" width="175" height="30" rx="8" fill="${p}"/>
          <text x="107" y="107" text-anchor="middle" font-weight="700" font-size="11" fill="white">📄 Met oefeningen</text>
          <rect x="205" y="87" width="175" height="30" rx="8" fill="white" stroke="#ddd"/>
          <text x="292" y="107" text-anchor="middle" font-weight="700" font-size="11" fill="#333">📝 Invulblad</text>

          <text x="20" y="140" font-weight="700" font-size="10" fill="#888">Elke dag krijgt een score-vakje:</text>
          <g transform="translate(20, 148)">
            <rect width="70" height="20" rx="5" fill="${p}"/>
            <text x="8" y="14" font-weight="700" font-size="9" fill="white">Maandag</text>
            <rect x="45" y="3" width="22" height="14" rx="3" fill="white"/>
            <text x="56" y="13" text-anchor="middle" font-weight="700" font-size="8" fill="${p}">__/10</text>
          </g>
          <g transform="translate(98, 148)">
            <rect width="70" height="20" rx="5" fill="${p}"/>
            <text x="8" y="14" font-weight="700" font-size="9" fill="white">Dinsdag</text>
            <rect x="45" y="3" width="22" height="14" rx="3" fill="white"/>
            <text x="56" y="13" text-anchor="middle" font-weight="700" font-size="8" fill="${p}">__/10</text>
          </g>
          <g transform="translate(176, 148)">
            <rect width="70" height="20" rx="5" fill="${p}"/>
            <text x="8" y="14" font-weight="700" font-size="9" fill="white">Woensdag</text>
            <rect x="45" y="3" width="22" height="14" rx="3" fill="white"/>
            <text x="56" y="13" text-anchor="middle" font-weight="700" font-size="8" fill="${p}">__/10</text>
          </g>
        </g>
      </svg>`;

    case 'voorbeeld':
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="${c}"/>
        <g font-family="Nunito" font-weight="700">
          <text x="200" y="20" text-anchor="middle" font-size="12" fill="${p}">Tafel van 5 — week-opbouw</text>

          <g transform="translate(10, 35)"><rect width="70" height="130" rx="8" fill="${o}" fill-opacity="0.15"/>
            <rect width="70" height="22" rx="6" fill="${p}"/>
            <text x="35" y="16" text-anchor="middle" font-size="11" fill="white">Ma</text>
            <text x="35" y="50" text-anchor="middle" font-size="10" fill="${p}">tafel 5</text>
            <text x="35" y="68" text-anchor="middle" font-size="9" fill="#666">2 × 5</text>
            <text x="35" y="82" text-anchor="middle" font-size="9" fill="#666">5 × 5</text>
            <text x="35" y="96" text-anchor="middle" font-size="9" fill="#666">9 × 5</text>
            <text x="35" y="110" text-anchor="middle" font-size="9" fill="#666">5 × 10</text>
          </g>
          <g transform="translate(88, 35)"><rect width="70" height="130" rx="8" fill="${o}" fill-opacity="0.15"/>
            <rect width="70" height="22" rx="6" fill="${p}"/>
            <text x="35" y="16" text-anchor="middle" font-size="11" fill="white">Di</text>
            <text x="35" y="50" text-anchor="middle" font-size="10" fill="${p}">tafel 5</text>
            <text x="35" y="68" text-anchor="middle" font-size="9" fill="#666">5 × 3</text>
            <text x="35" y="82" text-anchor="middle" font-size="9" fill="#666">7 × 5</text>
            <text x="35" y="96" text-anchor="middle" font-size="9" fill="#666">5 × 4</text>
            <text x="35" y="110" text-anchor="middle" font-size="9" fill="#666">8 × 5</text>
          </g>
          <g transform="translate(166, 35)"><rect width="70" height="130" rx="8" fill="${o}" fill-opacity="0.25" stroke="${o}" stroke-width="1"/>
            <rect width="70" height="22" rx="6" fill="${p}"/>
            <text x="35" y="16" text-anchor="middle" font-size="11" fill="white">Wo</text>
            <text x="35" y="50" text-anchor="middle" font-size="9" fill="${p}">tafels 2+5</text>
            <text x="35" y="68" text-anchor="middle" font-size="9" fill="#666">2 × 4</text>
            <text x="35" y="82" text-anchor="middle" font-size="9" fill="#666">5 × 7</text>
            <text x="35" y="96" text-anchor="middle" font-size="9" fill="#666">9 × 2</text>
            <text x="35" y="110" text-anchor="middle" font-size="9" fill="#666">3 × 5</text>
          </g>
          <g transform="translate(244, 35)"><rect width="70" height="130" rx="8" fill="${o}" fill-opacity="0.15"/>
            <rect width="70" height="22" rx="6" fill="${p}"/>
            <text x="35" y="16" text-anchor="middle" font-size="11" fill="white">Do</text>
            <text x="35" y="50" text-anchor="middle" font-size="10" fill="${p}">tafel 5</text>
            <text x="35" y="68" text-anchor="middle" font-size="9" fill="#666">5 × 6</text>
            <text x="35" y="82" text-anchor="middle" font-size="9" fill="#666">1 × 5</text>
            <text x="35" y="96" text-anchor="middle" font-size="9" fill="#666">5 × 2</text>
            <text x="35" y="110" text-anchor="middle" font-size="9" fill="#666">4 × 5</text>
          </g>
          <g transform="translate(322, 35)"><rect width="70" height="130" rx="8" fill="${o}" fill-opacity="0.25" stroke="${o}" stroke-width="1"/>
            <rect width="70" height="22" rx="6" fill="${p}"/>
            <text x="35" y="16" text-anchor="middle" font-size="11" fill="white">Vr</text>
            <text x="35" y="50" text-anchor="middle" font-size="9" fill="${p}">tafels 2+5</text>
            <text x="35" y="68" text-anchor="middle" font-size="9" fill="#666">7 × 2</text>
            <text x="35" y="82" text-anchor="middle" font-size="9" fill="#666">5 × 8</text>
            <text x="35" y="96" text-anchor="middle" font-size="9" fill="#666">3 × 2</text>
            <text x="35" y="110" text-anchor="middle" font-size="9" fill="#666">5 × 9</text>
          </g>
        </g>
      </svg>`;

    case 'klaar':
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="${c}"/>
        <text x="200" y="80" text-anchor="middle" font-size="64">🎉</text>
        <text x="200" y="120" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="20" fill="${p}">Je bent klaar!</text>
        <text x="200" y="145" text-anchor="middle" font-family="Nunito" font-size="13" fill="#666">Veel plezier met je klas 🦓</text>
      </svg>`;

    default:
      return '';
  }
}

let uitlegIdx = 0;

function openUitleg() {
  uitlegIdx = 0;

  const overlay = document.createElement('div');
  overlay.className = 'uitleg-overlay';
  overlay.id = 'uitleg-overlay';
  overlay.innerHTML = `
    <div class="uitleg-dialoog">
      <button class="uitleg-sluit" aria-label="Sluiten">×</button>
      <div class="uitleg-inhoud" id="uitleg-inhoud"></div>
      <div class="uitleg-voet">
        <div class="uitleg-stip-rij" id="uitleg-stippen"></div>
        <div class="uitleg-knop-rij">
          <button class="knop knop-secundair" id="uitleg-vorige">← Vorige</button>
          <button class="knop knop-primair" id="uitleg-volgende">Volgende →</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  renderUitlegStap();

  overlay.querySelector('.uitleg-sluit').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector('#uitleg-vorige').addEventListener('click', () => {
    if (uitlegIdx > 0) {
      uitlegIdx--;
      renderUitlegStap();
    }
  });
  overlay.querySelector('#uitleg-volgende').addEventListener('click', () => {
    if (uitlegIdx < uitlegStappen.length - 1) {
      uitlegIdx++;
      renderUitlegStap();
    } else {
      overlay.remove();
    }
  });

  const toetsHandler = (e) => {
    if (!document.getElementById('uitleg-overlay')) {
      document.removeEventListener('keydown', toetsHandler);
      return;
    }
    if (e.key === 'Escape') overlay.remove();
    else if (e.key === 'ArrowRight' && uitlegIdx < uitlegStappen.length - 1) {
      uitlegIdx++;
      renderUitlegStap();
    } else if (e.key === 'ArrowLeft' && uitlegIdx > 0) {
      uitlegIdx--;
      renderUitlegStap();
    }
  };
  document.addEventListener('keydown', toetsHandler);
}

function renderUitlegStap() {
  const stap = uitlegStappen[uitlegIdx];
  const inhoud = document.getElementById('uitleg-inhoud');

  inhoud.innerHTML = `
    <div class="uitleg-stap-teller">Stap ${uitlegIdx + 1} van ${uitlegStappen.length}</div>
    <h2>${stap.titel}</h2>
    <div class="uitleg-illustratie">${illustratieSvg(stap.illustratie)}</div>
    <div class="uitleg-tekst">${stap.tekst}</div>
  `;

  const stippen = document.getElementById('uitleg-stippen');
  stippen.innerHTML = uitlegStappen.map((_, i) =>
    `<span class="uitleg-stip ${i === uitlegIdx ? 'actief' : ''}" data-idx="${i}"></span>`
  ).join('');
  stippen.querySelectorAll('.uitleg-stip').forEach(s => {
    s.addEventListener('click', () => {
      uitlegIdx = parseInt(s.dataset.idx, 10);
      renderUitlegStap();
    });
  });

  const vorigeBtn = document.getElementById('uitleg-vorige');
  const volgendeBtn = document.getElementById('uitleg-volgende');
  vorigeBtn.disabled = uitlegIdx === 0;
  vorigeBtn.style.visibility = uitlegIdx === 0 ? 'hidden' : 'visible';
  volgendeBtn.textContent = uitlegIdx === uitlegStappen.length - 1
    ? '✓ Aan de slag!'
    : 'Volgende →';
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  renderConfig();
  renderModi();
  updatePreview();

  const uitlegBtn = document.getElementById('uitleg-knop');
  if (uitlegBtn) {
    uitlegBtn.addEventListener('click', openUitleg);
  }
});