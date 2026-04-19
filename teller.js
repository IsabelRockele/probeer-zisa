/* ══════════════════════════════════════════════════════════════════════════
   teller.js — Simpele bezoek-teller voor probeer-zisa
   ──────────────────────────────────────────────────────────────────────────
   Telt per dag en per maand hoeveel bezoekers elke pagina heeft gehad.
   Slaat op in Firestore collection 'statistieken'.

   Gebruik:
     <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
     <script src="../teller.js" data-pagina="demo-huistaken"></script>

   Pagina-namen (gebruik consistent):
     - demo-huistaken
     - demo-takenbord
     - proef-rekenbundel-info      (de infopagina)
     - proef-rekenbundel-app       (de echte app)

   Dedupe: tellen maar 1 keer per bezoek per sessie (via sessionStorage).
   Zo worden refreshes niet dubbel geteld.
   ══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyCq6Yy-rGVmKjZgqETvz_ZgupgjnDduzYo",
    authDomain: "probeer-zisa.firebaseapp.com",
    projectId: "probeer-zisa",
    storageBucket: "probeer-zisa.firebasestorage.app",
    messagingSenderId: "670942957144",
    appId: "1:670942957144:web:68bace33ae4a5e8e2b442d"
  };

  // Pagina-naam uit script-tag ophalen
  const huidigScript = document.currentScript;
  const paginaNaam = huidigScript?.dataset?.pagina;
  if (!paginaNaam) {
    console.warn('[Teller] Geen data-pagina attribuut, teller werkt niet');
    return;
  }

  // Dedupe: in deze sessie al geteld?
  const sessionKey = 'zisa-teller-' + paginaNaam;
  if (sessionStorage.getItem(sessionKey)) {
    console.log('[Teller] Al geteld in deze sessie:', paginaNaam);
    return;
  }

  // Firebase initialiseren (als dat nog niet is gebeurd door ander script)
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (err) {
    console.warn('[Teller] Firebase kon niet initialiseren:', err);
    return;
  }

  const db = firebase.firestore();

  // Huidige datum in YYYY-MM-DD en YYYY-MM
  const nu = new Date();
  const dag   = nu.toISOString().slice(0, 10);   // "2026-04-19"
  const maand = nu.toISOString().slice(0, 7);    // "2026-04"

  // Schrijven met increment: atomair, thread-safe
  async function telBezoek() {
    try {
      const batch = db.batch();

      // Per-dag teller
      const dagRef = db.collection('statistieken').doc(`dag_${paginaNaam}_${dag}`);
      batch.set(dagRef, {
        pagina: paginaNaam,
        datum: dag,
        type: 'dag',
        teller: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      // Per-maand teller
      const maandRef = db.collection('statistieken').doc(`maand_${paginaNaam}_${maand}`);
      batch.set(maandRef, {
        pagina: paginaNaam,
        maand: maand,
        type: 'maand',
        teller: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      // Totaal-teller (sinds altijd)
      const totRef = db.collection('statistieken').doc(`totaal_${paginaNaam}`);
      batch.set(totRef, {
        pagina: paginaNaam,
        type: 'totaal',
        teller: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      await batch.commit();
      sessionStorage.setItem(sessionKey, '1');
      console.log('[Teller] Geteld:', paginaNaam);
    } catch (err) {
      console.warn('[Teller] Kon niet tellen:', err);
    }
  }

  telBezoek();

})();
