/* ══════════════════════════════════════════════════════════════
   modules/schatten.js
   Schattend rekenen — 4 types:
   1. afronden       — getal → dichtstbij T, H of D
   2. schatting-tabel — tabel met afgeronde termen + bewerking
   3. schatting-compact — som → afgerond = schatting (één lijn)
   4. mogelijk        — klopt het antwoord? schat + vink aan

   Regels:
   - niveau 1000: getallen 101–999, afronden naar T of H (niet D)
   - niveau 10000: getallen 1001–9999, afronden naar H of D
   - uitkomst (optellen) of startgetal (aftrekken) nooit > niveau
   ══════════════════════════════════════════════════════════════ */

const Schatten = (() => {

  /* ── Afronden hulpfuncties ─────────────────────────────────── */
  function naarT(n)  { return Math.round(n / 10) * 10; }
  function naarH(n)  { return Math.round(n / 100) * 100; }
  function naarD(n)  { return Math.round(n / 1000) * 1000; }

  function vorigT(n)  { return Math.floor(n / 10) * 10; }
  function volgendT(n){ return Math.ceil(n / 10) * 10; }
  function vorigH(n)  { return Math.floor(n / 100) * 100; }
  function volgendH(n){ return Math.ceil(n / 100) * 100; }
  function vorigD(n)  { return Math.floor(n / 1000) * 1000; }
  function volgendD(n){ return Math.ceil(n / 1000) * 1000; }

  /* ── Afronden naar keuze ───────────────────────────────────── */
  function afrondenNaar(n, naar) {
    if (naar === 'T') return naarT(n);
    if (naar === 'H') return naarH(n);
    if (naar === 'D') return naarD(n);
    return naarH(n);
  }

  /* ── Willekeurig getal ─────────────────────────────────────── */
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* ── Genereer een getal geschikt voor het niveau ───────────── */
  // niveau 1000: 3-cijferig, tientallen niet nul (zodat afronden zinvol is)
  // niveau 10000: 4-cijferig, honderdtallen niet nul
  function randGetal(niveau) {
    let g, pogingen = 0;
    if (niveau <= 1000) {
      do {
        g = rand(102, 997);
        pogingen++;
      } while (g % 10 === 0 && pogingen < 100);
    } else {
      do {
        g = rand(1002, 9997);
        pogingen++;
      } while ((g % 100 === 0 || g % 1000 === 0) && pogingen < 100);
    }
    return g;
  }

  /* ── Controleer of afrondenNaar geldig is voor niveau ──────── */
  // Tot 1000: enkel T of H
  // Tot 10000: enkel H of D
  function geldigeAfronding(niveau, naar) {
    if (niveau <= 1000) return naar === 'T' || naar === 'H';
    return naar === 'H' || naar === 'D';
  }

  /* ── Standaard afronding voor niveau ───────────────────────── */
  function defaultAfronding(niveau) {
    return niveau <= 1000 ? 'H' : 'H';
  }

  /* ══════════════════════════════════════════════════════════
     TYPE 1 — AFRONDEN
     Tot 1000: kolommen dichtstbij T én dichtstbij H
     Tot 10000: kolommen dichtstbij H én dichtstbij D
  ══════════════════════════════════════════════════════════ */
  function genereerAfronden({ niveau = 10000, aantalOefeningen = 4 }) {
    const oefeningen = [];
    const gebruikte = new Set();
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < 200) {
      pogingen++;
      const g = randGetal(niveau);
      const sleutel = `afronden-${g}`;
      if (gebruikte.has(sleutel)) continue;
      gebruikte.add(sleutel);

      if (niveau <= 1000) {
        // Zorg dat afronden zinvol is: getal niet al een tiental of honderdtal
        if (g % 10 === 0) continue;
        oefeningen.push({
          type: 'afronden',
          sleutel,
          niveau,
          getal: g,
          // Tot 1000: afronden naar T en H
          dichtstbij1: naarT(g),   // tiental
          dichtstbij2: naarH(g),   // honderdtal
          label1: 'T', label2: 'H',
          vorigT: vorigT(g), volgendT: volgendT(g),
          vorigH: vorigH(g), volgendH: volgendH(g),
        });
      } else {
        // Zorg dat afronden zinvol is
        if (g % 100 === 0) continue;
        oefeningen.push({
          type: 'afronden',
          sleutel,
          niveau,
          getal: g,
          // Tot 10000: afronden naar H en D
          dichtstbij1: naarH(g),   // honderdtal
          dichtstbij2: naarD(g),   // duizendtal
          label1: 'H', label2: 'D',
          vorigH: vorigH(g), volgendH: volgendH(g),
          vorigD: vorigD(g), volgendD: volgendD(g),
        });
      }
    }
    return oefeningen;
  }

  /* ══════════════════════════════════════════════════════════
     TYPE 2 — SCHATTING MET TABEL
  ══════════════════════════════════════════════════════════ */
  function genereerSchattingTabel({ niveau = 10000, bewerking = 'optellen', afrondenNaar: naar = 'H', aantalOefeningen = 4 }) {
    // Valideer afronding voor niveau
    const afNaar = geldigeAfronding(niveau, naar) ? naar : defaultAfronding(niveau);

    const oefeningen = [];
    const gebruikte = new Set();
    let pogingen = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < 300) {
      pogingen++;
      let a = randGetal(niveau);
      let b = randGetal(niveau);

      // Bij optellen: som mag niveau niet overschrijden
      if (bewerking === 'optellen') {
        if (a + b > niveau) continue;
        if (a + b < niveau * 0.3) continue; // niet te kleine som
      }

      // Bij aftrekken: b < a, verschil zinvol
      if (bewerking === 'aftrekken') {
        if (b >= a) [a, b] = [b, a];
        const minVerschil = niveau <= 1000 ? 100 : 500;
        if (a - b < minVerschil) continue;
      }

      const afA = afrondenNaar(a, afNaar);
      const afB = afrondenNaar(b, afNaar);

      // Vermijd triviale gevallen (al afgerond)
      if (afA === a || afB === b) continue;
      // Vermijd dat afgeronde som ook > niveau
      const schatting = bewerking === 'optellen' ? afA + afB : afA - afB;
      if (schatting > niveau) continue;
      if (schatting < 0) continue;

      const sleutel = `tab-${a}-${bewerking}-${b}-${afNaar}`;
      if (gebruikte.has(sleutel)) continue;
      gebruikte.add(sleutel);

      oefeningen.push({
        type: 'schatting-tabel',
        sleutel,
        bewerking,
        a, b,
        afrondenNaar: afNaar,
        afA, afB,
        schatting,
        teken: bewerking === 'optellen' ? '+' : '-',
      });
    }
    return oefeningen;
  }

  /* ══════════════════════════════════════════════════════════
     TYPE 3 — SCHATTING COMPACT
  ══════════════════════════════════════════════════════════ */
  function genereerSchattingCompact({ niveau = 10000, bewerking = 'optellen', afrondenNaar: naar = 'H', aantalOefeningen = 4 }) {
    const oefeningen = genereerSchattingTabel({ niveau, bewerking, afrondenNaar: naar, aantalOefeningen });
    return oefeningen.map(o => ({ ...o, type: 'schatting-compact' }));
  }

  /* ══════════════════════════════════════════════════════════
     TYPE 4 — MOGELIJK / NIET MOGELIJK
  ══════════════════════════════════════════════════════════ */
  function genereerMogelijk({ niveau = 10000, bewerking = 'optellen', afrondenNaar: naar = 'H', aantalOefeningen = 4 }) {
    const afNaar = geldigeAfronding(niveau, naar) ? naar : defaultAfronding(niveau);
    const grens  = afNaar === 'T' ? 10 : afNaar === 'H' ? 100 : 1000;

    const oefeningen = [];
    const gebruikte  = new Set();

    // We willen ~50% mogelijk en ~50% niet mogelijk
    // Bouw twee pools en shuffle samen
    const poolMogelijk    = [];
    const poolNietMogelijk = [];
    let pogingen = 0;

    while ((poolMogelijk.length + poolNietMogelijk.length) < aantalOefeningen * 4 && pogingen < 800) {
      pogingen++;
      let a = randGetal(niveau);
      let b = randGetal(niveau);

      // Zorg dat a < b niet voorkomt bij aftrekken
      if (bewerking === 'aftrekken') {
        if (b >= a) [a, b] = [b, a];
        const minVerschil = niveau <= 1000 ? 100 : 500;
        if (a - b < minVerschil) continue;
      }

      // Optellen: som strikt binnen niveau
      if (bewerking === 'optellen') {
        if (a + b > niveau) continue;
        if (a + b < niveau * 0.25) continue;
      }

      const afA = afrondenNaar(a, afNaar);
      const afB = afrondenNaar(b, afNaar);
      // Beide getallen moeten echt afronden (niet al exact)
      if (afA === a && afB === b) continue;

      const correctAntwoord = bewerking === 'optellen' ? a + b : a - b;
      const schatting       = bewerking === 'optellen' ? afA + afB : afA - afB;

      // Schatting moet ook binnen niveau blijven
      if (schatting > niveau || schatting < 0) continue;
      if (correctAntwoord > niveau || correctAntwoord < 0) continue;

      const basisSleutel = `mog-${a}-${bewerking}-${b}`;
      if (gebruikte.has(basisSleutel)) continue;
      gebruikte.add(basisSleutel);

      // ── MOGELIJK: gebruik het echte antwoord ──────────────
      if (poolMogelijk.length < aantalOefeningen) {
        poolMogelijk.push({
          type: 'mogelijk', sleutel: basisSleutel + '-m',
          bewerking, a, b,
          afrondenNaar: afNaar, afA, afB, schatting,
          beweerdAntwoord: correctAntwoord,
          isMogelijk: true,
          teken: bewerking === 'optellen' ? '+' : '-',
          label: bewerking === 'optellen' ? 'De som' : 'Het verschil',
        });
        continue;
      }

      // ── NIET MOGELIJK: fout antwoord, duidelijk buiten range ─
      if (poolNietMogelijk.length < aantalOefeningen) {
        // Genereer een antwoord dat minstens 2 grensstappen van schatting afwijkt
        // en nooit > niveau
        let beweerdAntwoord = null;
        for (let p = 0; p < 20; p++) {
          const richting = Math.random() < 0.5 ? 1 : -1;
          const stappen  = rand(2, 5);
          const kandidaat = correctAntwoord + richting * stappen * grens;
          if (kandidaat <= 0) continue;
          if (kandidaat > niveau) continue;                          // nooit boven niveau
          if (Math.abs(kandidaat - schatting) < grens * 2) continue; // duidelijk fout
          if (kandidaat === correctAntwoord) continue;
          beweerdAntwoord = kandidaat;
          break;
        }
        if (beweerdAntwoord === null) continue;

        poolNietMogelijk.push({
          type: 'mogelijk', sleutel: basisSleutel + '-n',
          bewerking, a, b,
          afrondenNaar: afNaar, afA, afB, schatting,
          beweerdAntwoord,
          isMogelijk: false,
          teken: bewerking === 'optellen' ? '+' : '-',
          label: bewerking === 'optellen' ? 'De som' : 'Het verschil',
        });
      }
    }

    // Combineer: zo gelijk mogelijk mogelijk/niet-mogelijk, shuffle
    const aantalMog    = Math.ceil(aantalOefeningen / 2);
    const aantalNiet   = aantalOefeningen - aantalMog;
    const geselecteerd = [
      ...poolMogelijk.slice(0, aantalMog),
      ...poolNietMogelijk.slice(0, aantalNiet),
    ];

    // Shuffle
    for (let i = geselecteerd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [geselecteerd[i], geselecteerd[j]] = [geselecteerd[j], geselecteerd[i]];
    }

    return geselecteerd;
  }

  /* ── Publieke API ─────────────────────────────────────────── */
  return {
    genereerAfronden,
    genereerSchattingTabel,
    genereerSchattingCompact,
    genereerMogelijk,
    naarT, naarH, naarD,
    vorigT, volgendT, vorigH, volgendH, vorigD, volgendD,
    geldigeAfronding,
  };

})();