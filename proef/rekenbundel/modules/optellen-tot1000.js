/* ══════════════════════════════════════════════════════════════
   modules/optellen-tot1000.js

   Brugwaarden: 'zonder' | 'naar-tiental' | 'naar-honderdtal' | 'beide' | 'gemengd'

   Brugdefinities:
   - brugT = (a%10) + (b%10) >= 10           → brug naar tiental
   - brugH = (floor(a/10)%10) + (floor(b/10)%10) >= 10  → brug naar honderdtal

   Matrix welke brug per type mogelijk is:
   Type       | →T | →H | beide
   -----------|----|----|------
   T+T        |  ✗ |  ✓ |  ✗
   H+H        |  ✗ |  ✗ |  ✗   (nooit brug)
   H+T        |  ✗ |  ✗ |  ✗   (nooit brug)
   H+TE       |  ✓ |  ✗ |  ✗
   H+HT       |  ✗ |  ✓ |  ✗
   HT+HT      |  ✗ |  ✓ |  ✗
   HT+T       |  ✗ |  ✓ |  ✗
   HT+TE      |  ✓ |  ✓ |  ✓
   HTE+H      |  ✓ |  ✗ |  ✗
   HTE+HT     |  ✓ |  ✓ |  ✓
   HTE+HTE    |  ✓ |  ✓ |  ✓
   ══════════════════════════════════════════════════════════════ */

const OptellenTot1000 = (() => {

  const ALLE_TYPES = ['T+T','TE+TE','H+H','H+T','H+TE','H+HT','HT+HT','HT+T','HT+TE','HTE+H','HTE+HT','HTE+HTE','Gemengd'];

  // Gecorrigeerde matrix:
  // →T vereist eA≠0 ÉN eB≠0 (anders som eenheden max 9, nooit brug)
  // →H vereist tA≠0 ÉN tB≠0 (anders som tientallen max 9, nooit brug)
  //
  // Type      | eA | tA | eB | tB | →T | →H | beide
  // T+T       |  0 | 1+ |  0 | 1+ |  ✗ |  ✓ |  ✗
  // TE+TE     | 1+ | 1+ | 1+ | 1+ |  ✓ |  ✓ |  ✓
  // H+H       |  0 |  0 |  0 |  0 |  ✗ |  ✗ |  ✗
  // H+T       |  0 |  0 |  0 | 1+ |  ✗ |  ✗ |  ✗  (tA=0 → nooit →H)
  // H+TE      |  0 |  0 | 1+ | 1+ |  ✗ |  ✗ |  ✗  (eA=0 → nooit →T; tA=0 → nooit →H)
  // H+HT      |  0 |  0 |  0 | 1+ |  ✗ |  ✗ |  ✗  (tA=0 → nooit →H; e=0 → nooit →T)
  // HT+T      |  0 | 1+ |  0 | 1+ |  ✗ |  ✓ |  ✗
  // HT+HT     |  0 | 1+ |  0 | 1+ |  ✗ |  ✓ |  ✗
  // HT+TE     |  0 | 1+ | 1+ | 1+ |  ✗ |  ✓ |  ✗  (eA=0 → nooit →T)
  // HTE+H     | 1+ | 1+ |  0 |  0 |  ✗ |  ✗ |  ✗  (eB=0 → nooit →T; tB=0 → nooit →H)
  // HTE+HT    | 1+ | 1+ |  0 | 1+ |  ✗ |  ✓ |  ✗  (eB=0 → nooit →T)
  // HTE+HTE   | 1+ | 1+ | 1+ | 1+ |  ✓ |  ✓ |  ✓
  const TYPES_PER_BRUG = {
    'zonder':         ['T+T','TE+TE','H+H','H+T','H+TE','H+HT','HT+T','HT+HT','HT+TE','HTE+H','HTE+HT','HTE+HTE','Gemengd'],
    'naar-tiental':   ['TE+TE','HTE+HTE','Gemengd'],
    'naar-honderdtal':['T+T','TE+TE','HT+T','HT+HT','HT+TE','HTE+HT','HTE+HTE','Gemengd'],
    'beide':          ['TE+TE','HTE+HTE','Gemengd'],
    'gemengd':        ALLE_TYPES,
  };

  const GEMENGD_TYPES = {
    'zonder':         ['T+T','TE+TE','H+H','H+T','H+TE','H+HT','HT+T','HT+HT','HT+TE','HTE+H','HTE+HT','HTE+HTE'],
    'naar-tiental':   ['TE+TE','HTE+HTE'],
    'naar-honderdtal':['T+T','TE+TE','HT+T','HT+HT','HT+TE','HTE+HT','HTE+HTE'],
    'beide':          ['TE+TE','HTE+HTE'],
    'gemengd':        ['T+T','TE+TE','H+H','H+T','H+TE','H+HT','HT+T','HT+HT','HT+TE','HTE+H','HTE+HT','HTE+HTE'],
  };

  const OMKEERBAAR = new Set(['H+T','H+TE','H+HT','HT+T','HT+TE','HTE+H','HTE+HT']);

  function rand(min, max) {
    if (min > max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randH(min, max) {
    const hMin = Math.ceil(min / 100), hMax = Math.floor(max / 100);
    if (hMin > hMax) return null;
    return rand(hMin, hMax) * 100;
  }
  function randT(min, max) {  // veelvoud van 10, niet van 100
    for (let i = 0; i < 100; i++) {
      const hMin = Math.ceil(min / 10), hMax = Math.floor(max / 10);
      if (hMin > hMax) return null;
      const v = rand(hMin, hMax) * 10;
      if (v % 100 !== 0 && v >= min && v <= max) return v;
    }
    return null;
  }
  function randTE(min, max) {
    for (let i = 0; i < 100; i++) {
      const v = rand(min, max);
      if (v % 10 !== 0) return v;
    }
    return null;
  }
  function randHT(min, max) {
    for (let i = 0; i < 100; i++) {
      const v = randT(min, max);
      if (v !== null && v >= 110) return v;
    }
    return null;
  }
  function randHTE(min, max) {
    for (let i = 0; i < 100; i++) {
      const v = rand(min, max);
      if (v >= 101 && v % 10 !== 0 && v % 100 !== 0) return v;
    }
    return null;
  }

  function brugCheck(a, b) {
    const eA = a % 10, eB = b % 10;
    const tA = Math.floor(a / 10) % 10, tB = Math.floor(b / 10) % 10;
    return {
      T: (eA + eB) > 10,   // brug naar tiental
      H: (tA + tB) > 10,   // brug naar honderdtal
    };
  }

  function voldoetBrug(a, b, brugKeuze) {
    const eA = a % 10, eB = b % 10;
    const tA = Math.floor(a / 10) % 10, tB = Math.floor(b / 10) % 10;
    const brugT = (eA + eB) >= 10;
    const overdracht = brugT ? 1 : 0;
    // brugH: tientallen overlopen NA verwerking eenheden (overdracht meetellen!)
    const brugH = (tA + tB + overdracht) >= 10;
    const hA = Math.floor(a / 100), hB = Math.floor(b / 100);
    const ovT = brugH ? 1 : 0;
    // honderden mogen niet naar duizendtal overlopen
    const brugDuizend = (hA + hB + ovT) >= 10;

    switch (brugKeuze) {
      case 'zonder':         return !brugT && !brugH && !brugDuizend;
      case 'naar-tiental':   return  brugT && !brugH && !brugDuizend;
      case 'naar-honderdtal':return !brugT &&  brugH && !brugDuizend;
      case 'beide':          return  brugT &&  brugH && !brugDuizend;
      case 'gemengd':        return !brugDuizend;
      default:               return true;
    }
  }

  function maakPaar(type, brugKeuze) {
    const omkeer = OMKEERBAAR.has(type) && Math.random() < 0.5;

    for (let poging = 0; poging < 300; poging++) {
      let a, b;

      switch (type) {
        case 'T+T': {
          a = randT(10, 90); if (a === null) continue;
          b = randT(10, Math.min(90, 990 - a)); if (b === null) continue;
          break;
        }
        case 'TE+TE': {
          const te1 = randTE(11, 88); if (te1 === null) continue;
          const te2 = randTE(11, Math.min(99, 999 - te1)); if (te2 === null) continue;
          a = te1; b = te2;
          break;
        }
        case 'H+H': {
          a = randH(100, 800); if (a === null) continue;
          b = randH(100, 900 - a); if (b === null) continue;
          break;
        }
        case 'H+T': {
          const h = randH(100, 900); if (h === null) continue;
          const t = randT(10, Math.min(90, 999 - h)); if (t === null) continue;
          [a, b] = omkeer ? [t, h] : [h, t];
          break;
        }
        case 'H+TE': {
          const h = randH(100, 900); if (h === null) continue;
          const te = randTE(1, Math.min(99, 999 - h)); if (te === null) continue;
          [a, b] = omkeer ? [te, h] : [h, te];
          break;
        }
        case 'H+HT': {
          const h = randH(100, 700); if (h === null) continue;
          const ht = randHT(110, Math.min(890, 999 - h)); if (ht === null) continue;
          [a, b] = omkeer ? [ht, h] : [h, ht];
          break;
        }
        case 'HT+HT': {
          const ht1 = randHT(110, 880); if (ht1 === null) continue;
          const ht2 = randHT(110, 999 - ht1); if (ht2 === null) continue;
          a = ht1; b = ht2;
          break;
        }
        case 'HT+T': {
          const ht = randHT(110, 980); if (ht === null) continue;
          const t = randT(10, Math.min(90, 999 - ht)); if (t === null) continue;
          [a, b] = omkeer ? [t, ht] : [ht, t];
          break;
        }
        case 'HT+TE': {
          const ht = randHT(110, 980); if (ht === null) continue;
          const te = randTE(1, Math.min(89, 999 - ht)); if (te === null) continue;
          [a, b] = omkeer ? [te, ht] : [ht, te];
          break;
        }
        case 'HTE+H': {
          const hte = randHTE(101, 899); if (hte === null) continue;
          const h = randH(100, 999 - hte); if (h === null) continue;
          [a, b] = omkeer ? [h, hte] : [hte, h];
          break;
        }
        case 'HTE+HT': {
          const hte = randHTE(101, 889); if (hte === null) continue;
          const ht = randHT(110, Math.min(889, 999 - hte)); if (ht === null) continue;
          [a, b] = omkeer ? [ht, hte] : [hte, ht];
          break;
        }
        case 'HTE+HTE': {
          const hte1 = randHTE(101, 888); if (hte1 === null) continue;
          const hte2 = randHTE(101, 999 - hte1); if (hte2 === null) continue;
          a = hte1; b = hte2;
          break;
        }
        default: return null;
      }

      if (!a || !b || a <= 0 || b <= 0) continue;
      const som = a + b;
      if (som <= 0 || som >= 1000) continue;  // uitkomst altijd < 1000
      if (!voldoetBrug(a, b, brugKeuze)) continue;

      return { a, b, som, type };
    }
    return null;
  }

  function getTypes(niveau, brug = 'zonder') {
    return TYPES_PER_BRUG[brug] || TYPES_PER_BRUG['zonder'];
  }

  function genereer({ oefeningstypes, brug = 'zonder', aantalOefeningen }) {
    let actieveTypes = oefeningstypes.includes('Gemengd')
      ? (GEMENGD_TYPES[brug] || GEMENGD_TYPES['zonder'])
      : oefeningstypes;

    const oefeningen = [];
    const gebruikteSleutels = new Set();
    const maxPogingen = aantalOefeningen * 150;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = actieveTypes[Math.floor(Math.random() * actieveTypes.length)];
      const paar = maakPaar(type, brug);
      if (!paar) continue;

      const sleutel = `${paar.a}+${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: `${paar.a} + ${paar.b} =`,
        antwoord: paar.som,
      });
    }
    return oefeningen;
  }

  return { getTypes, genereer };
})();
