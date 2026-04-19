/* ══════════════════════════════════════════════════════════════
   modules/aftrekken-tot1000.js

   Brugwaarden: 'zonder' | 'naar-tiental' | 'naar-honderdtal' | 'beide' | 'gemengd'

   Brugdefinities:
   - brugT = (b%10) > (a%10)                         → brug naar tiental
   - brugH = (floor(b/10)%10) > (floor(a/10)%10)     → brug naar honderdtal

   Matrix welke brug per type mogelijk is:
   Type       | →T | →H | beide
   -----------|----|----|------
   T-T        |  ✗ |  ✓ |  ✗
   H-H        |  ✗ |  ✗ |  ✗   (nooit brug)
   H-T        |  ✗ |  ✗ |  ✗   (nooit brug)
   H-TE       |  ✓ |  ✗ |  ✗
   HT-H       |  ✗ |  ✗ |  ✗   (nooit brug)
   HT-T       |  ✗ |  ✓ |  ✗
   HT-HT      |  ✗ |  ✓ |  ✗
   HT-TE      |  ✓ |  ✓ |  ✓
   HTE-H      |  ✓ |  ✗ |  ✗
   HTE-HT     |  ✓ |  ✓ |  ✓
   HTE-HTE    |  ✓ |  ✓ |  ✓
   ══════════════════════════════════════════════════════════════ */

const AftrekkenTot1000 = (() => {

  const ALLE_TYPES = ['T-T','TE-TE','H-H','H-T','H-TE','H-HT','HT-H','HT-T','HT-HT','HT-TE','HTE-H','HTE-HT','HTE-HTE','Gemengd'];

  // Gecorrigeerde matrix aftrekken: brugT = eB > eA (eenheden aftrekker > aftrektal)
  // T-T:      e=0 beide → nooit brugT; t aftrekker > t aftrektal mogelijk → alleen →H
  // TE-TE:    eB>eA mogelijk → brugT; tB>tA mogelijk → brugH → →T, →H, beide
  //           MAAR: aftrektal >= aftrekker → als tB>tA dan moet honderden compenseren → max 99 beide → tB>tA onmogelijk!
  //           → TE-TE: enkel →T
  // H-H:      e=0, t=0 beide → nooit brug
  // H-T:      e=0 beide → nooit brugT; tA=0 < tB=1-9 → brugH altijd! → enkel →H (altijd brug)
  //           Maar zonder brug: tB > tA altijd (tA=0) → H-T is ALTIJD brugH → niet bij 'zonder'!
  // H-TE:     eA=0, eB=1-9 → eB>eA altijd → ALTIJD brugT → enkel →T
  // HT-H:     e=0 beide → nooit brugT; tB=0 < tA → nooit brugH → NOOIT BRUG
  // HT-T:     e=0 beide → nooit brugT; tB>tA mogelijk → alleen →H
  // HT-HT:    e=0 beide → nooit brugT; tB>tA mogelijk → alleen →H
  // HT-TE:    eA=0, eB≥1 → eB>eA ALTIJD → altijd brugT; tB>tA ook mogelijk → →T altijd, →H mogelijk, beide mogelijk
  //           zonder brug: onmogelijk (altijd brugT)
  // HTE-H:    eB=0 < eA → nooit brugT (eB niet > eA); tB=0 < tA → nooit brugH → NOOIT BRUG
  // HTE-HT:   eB=0 → nooit brugT; tB>tA mogelijk → alleen →H
  // HTE-HTE:  eB>eA mogelijk → brugT; tB>tA mogelijk → brugH → →T, →H, beide
  // Gecorrigeerde matrix aftrekken:
  // brugT = eB > eA; brugH = tB > tA
  // T-T:     e=0 beide → nooit brugT; tB>tA mogelijk → →H
  // TE-TE:   eB>eA mogelijk → →T; tB>tA bij max99 onmogelijk (aftrektal>=aftrekker) → enkel →T
  // H-H:     e=0,t=0 → nooit brug
  // H-T:     tB>tA ALTIJD (tA=0) → enkel →H, nooit zonder
  // H-TE:    eB>eA ALTIJD + tB>tA ALTIJD → enkel beide, nooit zonder/→T/→H
  // H-HT:    eB=0,tB>tA ALTIJD (tA=0) → enkel →H, nooit zonder
  // HT-H:    tB=0<tA, eB=0 → nooit brug
  // HT-T:    eB=0 → nooit →T; tB>tA mogelijk → →H
  // HT-HT:   eB=0 → nooit →T; tB>tA mogelijk → →H
  // HT-TE:   eB>eA ALTIJD → altijd →T; tB>tA ook mogelijk → →T of beide (nooit zonder/→H)
  // HTE-H:   eB=0,tB=0 → nooit brug
  // HTE-HT:  eB=0 → nooit →T; tB>tA mogelijk → →H
  // HTE-HTE: eB>eA mogelijk → →T; tB>tA mogelijk → →H; beide mogelijk
  const TYPES_PER_BRUG = {
    'zonder':         ['T-T','TE-TE','H-H','HT-H','HT-T','HT-HT','HTE-H','HTE-HT','HTE-HTE','Gemengd'],
    'naar-tiental':   ['TE-TE','HT-TE','HTE-HTE','Gemengd'],
    'naar-honderdtal':['H-T','H-HT','HT-T','HT-HT','HTE-HT','HTE-HTE','Gemengd'],
    'beide':          ['H-TE','HT-TE','HTE-HTE','Gemengd'],
    'gemengd':        ALLE_TYPES,
  };

  const GEMENGD_TYPES = {
    'zonder':         ['T-T','TE-TE','H-H','HT-H','HT-T','HT-HT','HTE-H','HTE-HT','HTE-HTE'],
    'naar-tiental':   ['TE-TE','HT-TE','HTE-HTE'],
    'naar-honderdtal':['H-T','H-HT','HT-T','HT-HT','HTE-HT','HTE-HTE'],
    'beide':          ['H-TE','HT-TE','HTE-HTE'],
    'gemengd':        ['T-T','TE-TE','H-H','H-T','H-TE','H-HT','HT-H','HT-T','HT-HT','HT-TE','HTE-H','HTE-HT','HTE-HTE'],
  };

  function rand(min, max) {
    if (min > max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randH(min, max) {
    const hMin = Math.ceil(min / 100), hMax = Math.floor(max / 100);
    if (hMin > hMax) return null;
    return rand(hMin, hMax) * 100;
  }
  function randT(min, max) {
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
      T: eB > eA,    // brug naar tiental
      H: tB > tA,    // brug naar honderdtal
    };
  }

  function voldoetBrug(a, b, brugKeuze) {
    const eA = a % 10, eB = b % 10;
    const tA = Math.floor(a / 10) % 10, tB = Math.floor(b / 10) % 10;
    const brugT = eB > eA;
    const leen = brugT ? 1 : 0;  // eenheden lenen 1 tiental
    // brugH: tientallen moeten lenen NA verwerking eenheden
    const brugH = tB > (tA - leen);
    switch (brugKeuze) {
      case 'zonder':         return !brugT && !brugH;
      case 'naar-tiental':   return  brugT && !brugH;
      case 'naar-honderdtal':return !brugT &&  brugH;
      case 'beide':          return  brugT &&  brugH;
      case 'gemengd':        return true;
      default:               return true;
    }
  }

  function maakPaar(type, brugKeuze) {
    for (let poging = 0; poging < 300; poging++) {
      let a, b;

      switch (type) {
        case 'T-T': {
          a = randT(20, 990); if (a === null) continue;
          b = randT(10, a - 10); if (b === null) continue;
          break;
        }
        case 'TE-TE': {
          a = randTE(12, 99); if (a === null) continue;
          b = randTE(11, a - 1); if (b === null) continue;
          if (b >= a) continue;
          break;
        }
        case 'H-H': {
          a = randH(200, 900); if (a === null) continue;
          b = randH(100, a - 100); if (b === null) continue;
          break;
        }
        case 'H-T': {
          a = randH(100, 900); if (a === null) continue;
          b = randT(10, Math.min(90, a - 10)); if (b === null) continue;
          break;
        }
        case 'H-HT': {
          a = randH(200, 900); if (a === null) continue;
          b = randHT(110, a - 10); if (b === null) continue;
          if (b >= a) continue;
          break;
        }
        case 'H-TE': {
          a = randH(100, 900); if (a === null) continue;
          b = randTE(1, Math.min(99, a - 1)); if (b === null) continue;
          break;
        }
        case 'HT-H': {
          a = randHT(200, 990); if (a === null) continue;
          b = randH(100, Math.floor((a - 1) / 100) * 100); if (b === null) continue;
          if (b <= 0 || b >= a) continue;
          break;
        }
        case 'HT-T': {
          a = randHT(120, 990); if (a === null) continue;
          b = randT(10, Math.min(90, a - 110)); if (b === null) continue;
          break;
        }
        case 'HT-HT': {
          a = randHT(220, 990); if (a === null) continue;
          b = randHT(110, a - 110); if (b === null) continue;
          break;
        }
        case 'HT-TE': {
          a = randHT(110, 990); if (a === null) continue;
          b = randTE(1, Math.min(89, a - 1)); if (b === null) continue;
          break;
        }
        case 'HTE-H': {
          a = randHTE(101, 999); if (a === null) continue;
          b = randH(100, Math.floor(a / 100) * 100); if (b === null) continue;
          if (b <= 0 || b >= a) continue;
          break;
        }
        case 'HTE-HT': {
          a = randHTE(211, 999); if (a === null) continue;
          b = randHT(110, a - 101); if (b === null) continue;
          break;
        }
        case 'HTE-HTE': {
          a = randHTE(202, 999); if (a === null) continue;
          b = randHTE(101, a - 101); if (b === null) continue;
          break;
        }
        default: return null;
      }

      if (!a || !b || a <= 0 || b <= 0) continue;
      const verschil = a - b;
      if (verschil <= 0 || verschil >= 1000) continue;
      if (!voldoetBrug(a, b, brugKeuze)) continue;

      return { a, b, verschil, type };
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

      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikteSleutels.has(sleutel)) continue;
      gebruikteSleutels.add(sleutel);

      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: `${paar.a} - ${paar.b} =`,
        antwoord: paar.verschil,
      });
    }
    return oefeningen;
  }

  return { getTypes, genereer };
})();
