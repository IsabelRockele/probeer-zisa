const AftrekkenTot10000 = (() => {

  const ALLE_TYPES = [
    'D-D',
    'DH-D','DH-H','DH-DH',
    'DHT-D','DHT-H','DHT-T','DHT-DH','DHT-DHT',
    'DHTE-D','DHTE-H','DHTE-T','DHTE-HT','DHTE-DHT','DHTE-DHTE','DHTE-HTE',
    'Gemengd',
  ];

  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

  function maakD()    { return rand(1,9)*1000; }
  function maakH()    { return rand(1,9)*100; }
  function maakT()    { return rand(1,9)*10; }
  function maakDH()   { return rand(1,8)*1000 + rand(1,9)*100; }
  function maakDHT()  { return rand(1,8)*1000 + rand(1,9)*100 + rand(1,9)*10; }
  function maakDHTE() { return rand(1,8)*1000 + rand(1,9)*100 + rand(1,9)*10 + rand(1,9); }
  function maakHT()   { return rand(1,9)*100 + rand(1,9)*10; }

  function zonderBrug(a, b) {
    const eA=a%10, eB=b%10;
    const tA=Math.floor(a/10)%10, tB=Math.floor(b/10)%10;
    const hA=Math.floor(a/100)%10, hB=Math.floor(b/100)%10;
    const dA=Math.floor(a/1000)%10, dB=Math.floor(b/1000)%10;
    return (eA>=eB) && (tA>=tB) && (hA>=hB) && (dA>=dB);
  }

  function maakPaar(type) {
    for (let p = 0; p < 300; p++) {
      let a, b;
      switch (type) {
        case 'D-D':      { const g1=maakD(); const g2=maakD(); a=Math.max(g1,g2); b=Math.min(g1,g2); break; }
        case 'DH-D':     { a=maakDH(); b=maakD(); break; }
        case 'DH-H':     { a=maakDH(); b=maakH(); break; }
        case 'DH-DH':    { const g1=maakDH(); const g2=maakDH(); a=Math.max(g1,g2); b=Math.min(g1,g2); break; }
        case 'DHT-D':    { a=maakDHT(); b=maakD(); break; }
        case 'DHT-H':    { a=maakDHT(); b=maakH(); break; }
        case 'DHT-T':    { a=maakDHT(); b=maakT(); break; }
        case 'DHT-DH':   { a=maakDHT(); b=maakDH(); break; }
        case 'DHT-DHT':  { const g1=maakDHT(); const g2=maakDHT(); a=Math.max(g1,g2); b=Math.min(g1,g2); break; }
        case 'DHTE-D':   { a=maakDHTE(); b=maakD(); break; }
        case 'DHTE-H':   { a=maakDHTE(); b=maakH(); break; }
        case 'DHTE-T':   { a=maakDHTE(); b=maakT(); break; }
        case 'DHTE-HT':  { a=maakDHTE(); b=maakHT(); break; }
        case 'DHTE-DHT': { a=maakDHTE(); b=maakDHT(); break; }
        case 'DHTE-HTE':  { a=maakDHTE(); b=rand(1,9)*100+rand(1,9)*10+rand(1,9); break; }
        case 'DHTE-DHTE':{ const g1=maakDHTE(); const g2=maakDHTE(); a=Math.max(g1,g2); b=Math.min(g1,g2); break; }
        default: return null;
      }
      if (!a || !b || a<=b) continue;
      const verschil = a - b;
      if (verschil<=0 || verschil>=10000) continue;
      if (!zonderBrug(a, b)) continue;
      return { a, b, verschil, type };
    }
    return null;
  }

  function getTypes() { return ALLE_TYPES; }

  function genereer({ oefeningstypes = ['Gemengd'], aantalOefeningen = 12 } = {}) {
    const actieveTypes = oefeningstypes.includes('Gemengd')
      ? ALLE_TYPES.filter(t => t !== 'Gemengd')
      : oefeningstypes.filter(t => ALLE_TYPES.includes(t));

    const oefeningen = [];
    const gebruikt = new Set();
    const maxPogingen = aantalOefeningen * 200;
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPogingen) {
      pogingen++;
      const type = actieveTypes[Math.floor(Math.random()*actieveTypes.length)];
      const paar = maakPaar(type);
      if (!paar) continue;
      const sleutel = `${paar.a}-${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type: paar.type,
        vraag: `${paar.a} - ${paar.b} =`,
        antwoord: paar.verschil,
      });
    }
    return oefeningen;
  }

  return { genereer, getTypes };
})();