/* ══════════════════════════════════════════════════════════════
   modules/compenseren-optellen-tot10000.js
   Compenseren optellen tot 10.000 — HT+HT

   Regels:
   - Beide getallen zijn HT (veelvoud van 10, niet van 100)
   - Compenseerterm: tientallen 7/8/9 → afronden naar volgend honderdtal
   - Andere term: tientallen NIET 7/8/9 (1-6)
   - Brug: tientallen samen > 10 (strikt, dus ≥ 11)
   - Som < 10.000, som > 0
   - Tussenresultaat (na optellen ronde getal) mag > 1000 zijn

   Voorbeeld: 820 + 390
   - 390 heeft tientallen 9 → +400 −10
   - 820 + 400 = 1220
   - 1220 − 10 = 1210
   ══════════════════════════════════════════════════════════════ */

const CompenserenOptellenTot10000 = (() => {

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function volgendHonderdtal(n) {
    return Math.ceil((n + 1) / 100) * 100;
  }

  function maakPaar() {
    for (let poging = 0; poging < 500; poging++) {
      // Compenseerterm: HT met tientallen 7/8/9
      const tComp = rand(7, 9);
      const hComp = rand(1, 9);
      const comp  = hComp * 100 + tComp * 10;   // bv. 390, 480, 570

      // Andere term: HT met tientallen 1-6
      const tAnder = rand(1, 6);
      const hAnder = rand(1, 9);
      const ander  = hAnder * 100 + tAnder * 10; // bv. 820, 430

      // Brug: tientallen samen strikt > 10
      if (tComp + tAnder <= 10) continue;

      // Volgorde random
      const [a, b] = Math.random() < 0.5 ? [ander, comp] : [comp, ander];
      const som = a + b;
      if (som >= 10000 || som <= 0) continue;

      // Compenseerberekening
      const honderdtal      = volgendHonderdtal(comp);
      const compenseerDelta = honderdtal - comp;   // wat te veel bijgeteld
      if (compenseerDelta <= 0) continue;

      const anderInSom = (b === comp) ? a : b;    // de niet-gecompenseerde term
      const tussenResultaat = anderInSom + honderdtal;
      if (tussenResultaat >= 10000) continue;

      const eindResultaat = tussenResultaat - compenseerDelta;
      if (eindResultaat !== som) continue;
      if (eindResultaat <= 0) continue;

      // compIsLinks: staat comp links in de som?
      const compIsLinks = (a === comp);

      return {
        a, b, som,
        compenseerGetal:  comp,
        andereGetal:      ander,
        tiental:          honderdtal,
        compenseerDelta,
        tussenResultaat,
        schrijflijn1: compIsLinks
          ? `${honderdtal} + ${ander} = ${tussenResultaat}`
          : `${ander} + ${honderdtal} = ${tussenResultaat}`,
        schrijflijn2: `${tussenResultaat} - ${compenseerDelta} = ${eindResultaat}`,
      };
    }
    return null;
  }

  function genereer({ aantalOefeningen = 12 } = {}) {
    const oefeningen = [];
    const gebruikt   = new Set();
    const maxPog     = aantalOefeningen * 300;
    let pogingen     = 0;

    while (oefeningen.length < aantalOefeningen && pogingen < maxPog) {
      pogingen++;
      const paar = maakPaar();
      if (!paar) continue;
      const sleutel = `${paar.a}+${paar.b}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);
      oefeningen.push({
        sleutel,
        type:            'HT+HT',
        vraag:           `${paar.a} + ${paar.b} =`,
        antwoord:        paar.som,
        compenseerGetal: paar.compenseerGetal,
        andereGetal:     paar.andereGetal,
        tiental:         paar.tiental,
        compenseerDelta: paar.compenseerDelta,
        tussenResultaat: paar.tussenResultaat,
        schrijflijn1:    paar.schrijflijn1,
        schrijflijn2:    paar.schrijflijn2,
      });
    }
    return oefeningen;
  }

  function getTypes() { return ['HT+HT']; }

  return { genereer, getTypes };
})();
