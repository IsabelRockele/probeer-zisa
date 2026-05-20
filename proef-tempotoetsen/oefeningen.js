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
// GETALBEELDEN TOT 100
// ============================================
// Toont een getal-representatie (MAB-achtig via tientallen en eenheden)
// config: { max: 100, type: 'mab' | 'rekenrek' }
function genereerGetalbeeld(config) {
  const max = config.max || 100;
  const getal = randInt(1, max);

  return {
    vraag: { type: 'getalbeeld', weergave: config.type || 'mab', getal: getal },
    antwoord: getal
  };
}

// ============================================
// OPTELLEN / AFTREKKEN TOT 10
// ============================================
// config: { bewerking: 'plus' | 'min' | 'gemengd' }
function genereerOptelAftrek10(config) {
  const bewerking = config.bewerking === 'gemengd'
    ? (Math.random() < 0.5 ? 'plus' : 'min')
    : config.bewerking;

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
function genereerOptelAftrek20(config) {
  const bewerking = config.bewerking === 'gemengd'
    ? (Math.random() < 0.5 ? 'plus' : 'min')
    : config.bewerking;

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
function genereerOptelAftrek100(config) {
  const bewerking = config.bewerking === 'gemengd'
    ? (Math.random() < 0.5 ? 'plus' : 'min')
    : config.bewerking;

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
// HOOFDFUNCTIE: genereer 10 oefeningen
// ============================================
function genereerToets(type, config, aantal = 10) {
  const oefeningen = [];
  const gezien = new Set(); // vermijd dubbele vragen
  let veiligheid = 0;

  while (oefeningen.length < aantal && veiligheid < aantal * 10) {
    let oef;
    switch (type) {
      case 'maaltafels':
        oef = genereerMaaltafel(config); break;
      case 'deeltafels':
        oef = genereerDeeltafel(config); break;
      case 'gemengd-maal-deel':
        oef = genereerGemengdMaalDeel(config); break;
      case 'getalbeelden':
        oef = genereerGetalbeeld(config); break;
      case 'optel-aftrek-10':
        oef = genereerOptelAftrek10(config); break;
      case 'optel-aftrek-20':
        oef = genereerOptelAftrek20(config); break;
      case 'optel-aftrek-100':
        oef = genereerOptelAftrek100(config); break;
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

  // als we te weinig hebben (door te strenge filters), vul aan met duplicaten
  while (oefeningen.length < aantal) {
    oefeningen.push(oefeningen[oefeningen.length % oefeningen.length]);
  }

  return oefeningen;
}

// Exporteer voor gebruik in het browser-script (window-scope)
window.TempotoetsenGen = {
  genereerToets,
  randInt,
  shuffle
};
