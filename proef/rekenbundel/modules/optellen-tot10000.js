/* ══════════════════════════════════════════════════════════════
   modules/optellen-tot10000.js
   Optellen tot 10.000 — enkel ZONDER BRUG

   Types (conform lessen 9-10):
   Les 9:  D+D, DH+D, DH+H
   Les 10: DH+DH
   Extra:  DHT+D, DHT+H, DHT+T, DHT+DH, DHT+DHT
           DHTE+D, DHTE+H, DHTE+T, DHTE+HT, DHTE+DHT, DHTE+DHTE
           Gemengd

   Zonder brug = geen overdracht in geen enkele kolom:
     e1+e2 < 10  EN  t1+t2 < 10  EN  h1+h2 < 10  EN  d1+d2 < 10
     EN som < 10000
   ══════════════════════════════════════════════════════════════ */

const OptellenTot10000 = (() => {

  const ALLE_TYPES = [
    'D+D',
    'DH+D','DH+H','DH+DH',
    'DHT+D','DHT+H','DHT+T','DHT+DH','DHT+DHT',
    'DHTE+D','DHTE+H','DHTE+T','DHTE+HT','DHTE+DHT','DHTE+DHTE','DHTE+HTE',
    'Gemengd',
  ];

  // Les 9: D+D, DH+D, DH+H
  // Les 10: DH+DH
  // Gemengd les 9+10: bovenstaande 4
  // Volledig gemengd: alle types
  const TYPES_PER_SET = {
    'les9':    ['D+D','DH+D','DH+H'],
    'les10':   ['DH+DH'],
    'les9-10': ['D+D','DH+D','DH+H','DH+DH'],
    'Gemengd': ALLE_TYPES.filter(t => t !== 'Gemengd'),
  };

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Helpers: genereer getal van een bepaald type
  function maakD()    { return rand(1,8) * 1000; }
  function maakH()    { return rand(1,9) * 100; }
  function maakT()    { return rand(1,9) * 10; }
  function maakE()    { return rand(1,9); }
  function maakDH()   { return rand(1,8)*1000 + rand(1,9)*100; }
  function maakDHT()  { return rand(1,8)*1000 + rand(1,9)*100 + rand(1,9)*10; }
  function maakDHTE() { return rand(1,8)*1000 + rand(1,9)*100 + rand(1,9)*10 + rand(1,9); }
  function maakHT()   { return rand(1,9)*100 + rand(1,9)*10; }
  function maakHTE()  { return rand(1,9)*100 + rand(1,9)*10 + rand(1,9); }

  function zonderBrug(a, b) {
    const e1 = a%10,              e2 = b%10;
    const t1 = Math.floor(a/10)%10,   t2 = Math.floor(b/10)%10;
    const h1 = Math.floor(a/100)%10,  h2 = Math.floor(b/100)%10;
    const d1 = Math.floor(a/1000)%10, d2 = Math.floor(b/1000)%10;
    return (e1+e2 < 10) && (t1+t2 < 10) && (h1+h2 < 10) && (d1+d2 < 10);
  }

  function maakPaar(type) {
    for (let p = 0; p < 300; p++) {
      let a, b;
      const omkeer = Math.random() < 0.5;

      switch (type) {
        case 'D+D':      a = maakD();    b = maakD();    break;
        case 'DH+D':     { const g1=maakDH(); const g2=maakD();  [a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DH+H':     { const g1=maakDH(); const g2=maakH();  [a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DH+DH':    a = maakDH();   b = maakDH();   break;
        case 'DHT+D':    { const g1=maakDHT(); const g2=maakD(); [a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHT+H':    { const g1=maakDHT(); const g2=maakH(); [a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHT+T':    { const g1=maakDHT(); const g2=maakT(); [a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHT+DH':   { const g1=maakDHT(); const g2=maakDH();[a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHT+DHT':  a = maakDHT();  b = maakDHT();  break;
        case 'DHTE+D':   { const g1=maakDHTE();const g2=maakD(); [a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHTE+H':   { const g1=maakDHTE();const g2=maakH(); [a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHTE+T':   { const g1=maakDHTE();const g2=maakT(); [a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHTE+HT':  { const g1=maakDHTE();const g2=maakHT();[a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHTE+DHT': { const g1=maakDHTE();const g2=maakDHT();[a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHTE+HTE':  { const g1=maakDHTE();const g2=maakHTE();[a,b]=omkeer?[g2,g1]:[g1,g2]; break; }
        case 'DHTE+DHTE': a = maakDHTE(); b = maakDHTE(); break;
        default: return null;
      }

      if (!a || !b) continue;
      const som = a + b;
      if (som >= 10000 || som <= 0) continue;
      if (!zonderBrug(a, b)) continue;

      return { a, b, som, type };
    }
    return null;
  }

  function getTypes(niveau, brug = 'zonder') {
    return ALLE_TYPES;
  }

  function genereer({ oefeningstypes = ['Gemengd'], brug = 'zonder', aantalOefeningen = 12 } = {}) {
    let actieveTypes;
    if (oefeningstypes.includes('Gemengd')) {
      actieveTypes = TYPES_PER_SET['Gemengd'];
    } else if (oefeningstypes.includes('les9-10')) {
      actieveTypes = TYPES_PER_SET['les9-10'];
    } else {
      // Filter op geldige types, val terug op Gemengd
      actieveTypes = oefeningstypes.filter(t => ALLE_TYPES.includes(t));
      if (actieveTypes.length === 0) actieveTypes = TYPES_PER_SET['Gemengd'];
    }

    const oefeningen = [];
    const gebruikt = new Set();
    const maxPogingen = aantalOefeningen * 200;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = actieveTypes[Math.floor(Math.random() * actieveTypes.length)];
      const paar = maakPaar(type);
      if (!paar) continue;
      const sleutel = `${paar.a}+${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: `${paar.a} + ${paar.b} =`,
        antwoord: paar.som,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();