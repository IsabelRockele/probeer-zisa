/* ══════════════════════════════════════════════════════════════
   modules/aftrekken-tot10000-brug-rekenfeiten.js
   Aftrekken tot 10.000 MET BRUG — Via rekenfeiten

   Strategie: splits het aftrektal in 2 D-delen zodat één deel
   het aftrekken via rekenfeiten mogelijk maakt
   Stap 1: splits aftrektal → kleinste deel + rest
           (kleinste deel = hetzelfde niveau als aftrekker)
   Stap 2: kleinste deel − aftrekker = deelverschil (rekenfeit H−H)
   Stap 3: rest + deelverschil = antwoord

   Voorbeeld: 3600 − 800
   - splits 3600 → 2000 + 1600
   - 1600 − 800 = 800  (rekenfeit: 16H − 8H = 8H)
   - 2000 + 800 = 2800

   Regel splits:
   - hDeel moet >= aftrekker zijn én < 2000 (max 1 D)
   - hDeel = kleinste veelvoud van 1000 dat >= aftrekker is
     én waarbij hDeel <= aftrektal
   - dRest = aftrektal − hDeel (altijd veelvoud van 1000)
   ══════════════════════════════════════════════════════════════ */

const AftrekkenTot10000BrugRekenfeiten = (() => {

  const ALLE_TYPES = ['DH-H', 'DH-DH', 'Gemengd'];

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakPaarDHH() {
    for (let p = 0; p < 400; p++) {
      const dA = rand(1, 8);
      const hA = rand(1, 9);
      const aftrektal = dA * 1000 + hA * 100;

      const hB = rand(1, 9);
      const aftrekker = hB * 100;

      // Brug: H van aftrektal < H van aftrekker
      if (hA >= hB) continue;

      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;

      // Splits aftrektal → hDeel + dRest
      // hDeel: het kleinste deel dat >= aftrekker is (zodat rekenfeit werkt)
      // hDeel moet een veelvoud van 100 zijn én >= aftrekker
      // én hDeel < aftrektal (zodat dRest > 0)
      // Eenvoudigste keuze: hDeel = 1 D + hA*100 (het H-deel van het aftrektal aangevuld)
      // Zoals in voorbeeld: 3600 → hDeel=1600, dRest=2000
      // hDeel = (hA)*100 + als dat < aftrekker → vul aan tot volgende 1000
      // Eigenlijk: hDeel = kleinste (n*1000 + hA*100) >= aftrekker
      // maar simpeler: hDeel = hA*100 + 1000 als hA*100 < aftrekker
      //                hDeel = hA*100 als hA*100 >= aftrekker (geen brug dan)
      // Dus: hDeel = hA*100 + 1000 (altijd bij brug want hA < hB)
      const hDeel = hA * 100 + 1000;  // bv. 600+1000=1600
      const dRest = aftrektal - hDeel; // bv. 3600-1600=2000

      if (dRest <= 0) continue;
      if (dRest % 1000 !== 0) continue;

      // Rekenfeit: hDeel − aftrekker (moet positief zijn)
      const deelVerschil = hDeel - aftrekker;
      if (deelVerschil <= 0) continue;

      const eindResultaat = dRest + deelVerschil;
      if (eindResultaat !== verschil) continue;

      return {
        a: aftrektal,
        b: aftrekker,
        verschil,
        splits: { hDeel, dRest, deelVerschil },
        schrijflijn1: `${hDeel} - ${aftrekker} = ${deelVerschil}`,
        schrijflijn2: `${dRest} + ${deelVerschil} = ${eindResultaat}`,
        type: 'DH-H',
      };
    }
    return null;
  }


  function maakPaarDHDH() {
    // DH-DH via rekenfeiten: splits aftrektal zodat hDeel >= aftrekker
    // hDeel moet D+H zijn met hDeel >= aftrekker (DH)
    // bv. 5400 - 2800: hDeel = 3400 (3D+4H)? Nee te ingewikkeld
    // Eenvoudigste: hDeel = kleinste (n*1000+hA*100) >= aftrekker
    // waarbij n = ceil((aftrekker - hA*100) / 1000)
    for (let p = 0; p < 400; p++) {
      const dA = rand(2, 8), hA = rand(1, 9);
      const dB = rand(1, dA - 1), hB = rand(1, 9);
      const aftrektal = dA * 1000 + hA * 100;
      const aftrekker = dB * 1000 + hB * 100;
      if (hA >= hB) continue;
      const verschil = aftrektal - aftrekker;
      if (verschil <= 0) continue;
      // hDeel: kleinste veelvoud dat >= aftrekker is en <= aftrektal
      // hDeel = hA*100 + n*1000 waarbij n = ceil((aftrekker-hA*100)/1000)
      const hBase = hA * 100;
      const nMin = Math.ceil((aftrekker - hBase) / 1000);
      if (nMin <= 0) continue;
      const hDeel = hBase + nMin * 1000;
      if (hDeel >= aftrektal) continue;
      const dRest = aftrektal - hDeel;
      if (dRest <= 0 || dRest % 1000 !== 0) continue;
      const deelVerschil = hDeel - aftrekker;
      if (deelVerschil <= 0) continue;
      const eindResultaat = dRest + deelVerschil;
      if (eindResultaat !== verschil) continue;
      return {
        a: aftrektal, b: aftrekker, verschil,
        splits: { hDeel, dRest, deelVerschil },
        schrijflijn1: `${hDeel} - ${aftrekker} = ${deelVerschil}`,
        schrijflijn2: `${dRest} + ${deelVerschil} = ${eindResultaat}`,
        type: 'DH-DH',
      };
    }
    return null;
  }

  function maakPaar(type) {
    if (type === 'DH-H')  return maakPaarDHH();
    if (type === 'DH-DH') return maakPaarDHDH();
    return null;
  }

  function getTypes() { return ALLE_TYPES; }

  function genereer({ oefeningstypes = ['Gemengd'], aantalOefeningen = 12 } = {}) {
    const actieveTypes = oefeningstypes.includes('Gemengd')
      ? ['DH-H', 'DH-DH']
      : oefeningstypes.filter(t => ALLE_TYPES.includes(t) && t !== 'Gemengd');

    const oefeningen = [];
    const gebruikt   = new Set();
    const maxPog     = aantalOefeningen * 300;
    let pogingen     = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPog) {
      pogingen++;
      const type = actieveTypes[Math.floor(Math.random() * actieveTypes.length)];
      const paar = maakPaar(type);
      if (!paar) continue;
      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type:         paar.type,
        vraag:        `${paar.a} - ${paar.b} =`,
        antwoord:     paar.verschil,
        splits:       paar.splits,
        schrijflijn1: paar.schrijflijn1,
        schrijflijn2: paar.schrijflijn2,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();
