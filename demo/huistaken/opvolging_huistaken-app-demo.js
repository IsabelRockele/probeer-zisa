// ═══════════════════════════════════════════════════════════════════════════
// DEMO-VERSIE — Opvolging huistaken voor probeer-zisa
// Alle Firebase-oproepen zijn vervangen door dummies.
// Bij laden wordt automatisch een voorbeeldklas met 4 weken data ingeladen.
// Bij refresh → reset naar startsituatie.
// ═══════════════════════════════════════════════════════════════════════════

// ─── DUMMY FIREBASE (geen echte verbinding) ────────────────────────────────
const initializeApp = () => ({});
const getApps = () => [];
const getApp = () => ({});
const getAuth = () => ({});
const onAuthStateChanged = (auth, cb) => {
  // Simuleer direct een ingelogde "demo"-gebruiker
  setTimeout(() => cb({ uid: 'demo-user' }), 10);
};
const getFirestore = () => ({});
const doc = () => ({});
const getDoc = () => Promise.resolve({ exists: () => false, data: () => null });
const setDoc = () => Promise.resolve();
const deleteDoc = () => Promise.resolve();
const serverTimestamp = () => new Date();

const helpTexts = {
  algemeen: `
    <p>Welkom in de testversie van de module voor huistaken.</p>
    <p>We bouwen nu eerst de klaslijst correct op met startdatum en einddatum per leerling.</p>
  `,
  instellingen: `
    <p>Hier vul je schoolnaam, klasnaam, titel en schoollogo in.</p>
    <p>Het schoollogo komt onderaan in de PDF, gecentreerd in de voettekst.</p>
  `,
  klaslijst: `
    <p>Nieuwe leerlingen krijgen een startdatum.</p>
    <p>Leerlingen die weggaan, schrijf je uit met een einddatum.</p>
    <p>Zo blijven vroegere registraties en PDF’s correct.</p>
  `,
  rapportperiodes: `
    <p>Hier maak je je rapportperiodes aan met naam, startdatum en einddatum.</p>
  `,
  registratie: `
    <p>Hier werken we met registratiedata.</p>
    <p>In een volgende stap zorgen we dat per datum alleen actieve leerlingen zichtbaar zijn.</p>
  `
};

const STATUSSEN = [
  "op tijd",
  "te laat",
  "niet in orde",
  "onvolledig",
  "afwezig"
];

const STATUS_COLORS = {
  "op tijd": [88, 186, 120],
  "te laat": [245, 166, 35],
  "niet in orde": [220, 82, 82],
  "onvolledig": [230, 195, 55],
  "afwezig": [91, 155, 213]
};

const state = {
  currentSchoolYear: bepaalSchooljaarTekst(),
  schoolYears: [bepaalSchooljaarTekst()],
  schoolYearData: {},
    firebaseReady: false,
  firebaseHydrating: false,
  currentUserUid: "",
  saveTimer: null,

  currentView: "dashboard",
  previousView: "dashboard",

  schoolName: "",
  className: "",
  pdfTitle: "Opvolging huistaken",
  schoolLogoDataUrl: "",
  extraOpvolgingDrempel: 4,

 reportPeriods: [],
  activePeriodId: null,

leerlingen: [],

  columns: [],

  entries: {},
  editingPeriodId: null,
  editingLeerlingId: null,
  uitschrijfLeerlingId: null
};

state.activePeriodId = state.reportPeriods[0]?.id || null;
state.schoolYearData[state.currentSchoolYear] = createEmptySchoolYearData();
loadSchoolYearData(state.currentSchoolYear);

// ----------------------
// Helpers
// ----------------------

function createId() {
  return "id-" + Math.random().toString(36).slice(2, 10);
}

function slugStatus(status) {
  return status.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  const [y, m, d] = dateValue.split("-");
  return `${d}/${m}/${y}`;
}

function getActivePeriod() {
  return (
    state.reportPeriods.find((periode) => periode.id === state.activePeriodId) ||
    state.reportPeriods[0] ||
    null
  );
}

function getColumnsForActivePeriod() {
  const periode = getActivePeriod();
  if (!periode) return [];
  if (!Array.isArray(periode.columns)) periode.columns = [];
  return periode.columns;
}

function setColumnsForActivePeriod(columns) {
  const periode = getActivePeriod();
  if (!periode) return;
  periode.columns = columns;
}

function getVandaagIso() {
  const vandaag = new Date();
  const jaar = vandaag.getFullYear();
  const maand = String(vandaag.getMonth() + 1).padStart(2, "0");
  const dag = String(vandaag.getDate()).padStart(2, "0");
  return `${jaar}-${maand}-${dag}`;
}

function bepaalSchooljaarTekst() {
  const vandaag = new Date();
  const jaar = vandaag.getMonth() >= 8 ? vandaag.getFullYear() : vandaag.getFullYear() - 1;
  return `${jaar}-${jaar + 1}`;
}

function countActieveLeerlingenOpDatum(datum) {
  return state.leerlingen.filter((leerling) => leerlingIsActiefOpDatum(leerling, datum)).length;
}

function createEmptySchoolYearData() {
  return {
    schoolName: "",
    className: "",
    pdfTitle: "Opvolging huistaken",
    schoolLogoDataUrl: "",
    extraOpvolgingDrempel: 4,
    reportPeriods: [],
    activePeriodId: null,
    leerlingen: [],
    columns: [],
    entries: {}
  };
}

function cloneSchoolYearData(data) {
  return {
    schoolName: data.schoolName || "",
    className: data.className || "",
    pdfTitle: data.pdfTitle || "Opvolging huistaken",
    schoolLogoDataUrl: data.schoolLogoDataUrl || "",
    extraOpvolgingDrempel: data.extraOpvolgingDrempel || 4,
    reportPeriods: JSON.parse(JSON.stringify(data.reportPeriods || [])),
    activePeriodId: data.activePeriodId || null,
    leerlingen: JSON.parse(JSON.stringify(data.leerlingen || [])),
    columns: [...(data.columns || [])],
    entries: JSON.parse(JSON.stringify(data.entries || {}))
  };
}

const auth = getAuth();
const db = getFirestore();

function getUserDocRef() {
  return doc(db, "pro_huistaken", state.currentUserUid);
}

function getSchoolYearDocRef(schoolYearId) {
  return doc(db, "pro_huistaken", state.currentUserUid, "schoolYears", schoolYearId);
}

function buildCurrentSchoolYearPayload() {
  return {
    schoolName: state.schoolName,
    className: state.className,
    pdfTitle: state.pdfTitle,
    schoolLogoDataUrl: state.schoolLogoDataUrl,
    extraOpvolgingDrempel: state.extraOpvolgingDrempel,
    reportPeriods: JSON.parse(JSON.stringify(state.reportPeriods)),
    activePeriodId: state.activePeriodId || null,
    leerlingen: JSON.parse(JSON.stringify(state.leerlingen)),
    columns: [],
    entries: JSON.parse(JSON.stringify(state.entries))
  };
}

async function saveMetaToFirestore() {
  if (!state.currentUserUid) return;

  await setDoc(
    getUserDocRef(),
    {
      currentSchoolYear: state.currentSchoolYear,
      schoolYears: state.schoolYears,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function saveCurrentSchoolYearToFirestore() {
  if (!state.firebaseReady || state.firebaseHydrating || !state.currentUserUid) return;

  const payload = buildCurrentSchoolYearPayload();
  state.schoolYearData[state.currentSchoolYear] = JSON.parse(JSON.stringify(payload));

  await setDoc(
    getSchoolYearDocRef(state.currentSchoolYear),
    {
      ...payload,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await saveMetaToFirestore();
}

function scheduleFirestoreSave() {
  if (!state.firebaseReady || state.firebaseHydrating || !state.currentUserUid) return;

  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    saveCurrentSchoolYearToFirestore().catch((error) => {
      console.error("Fout bij opslaan in Firestore:", error);
    });
  }, 500);
}

function markChanged() {
  if (state.firebaseHydrating) return;
  saveCurrentSchoolYearData();
  scheduleFirestoreSave();
}

async function deleteSchoolYearFromFirestore(schoolYearId) {
  if (!state.currentUserUid) return;
  await deleteDoc(getSchoolYearDocRef(schoolYearId));
}

async function loadFirestoreIntoState() {
  if (!state.currentUserUid) return;

  state.firebaseHydrating = true;

  // ═══ DEMO: LAAD VOORBEELDKLAS MET 4 WEKEN DATA ═══
  const demoData = bouwVoorbeeldData();

  state.schoolYears = [demoData.schoolYear];
  state.currentSchoolYear = demoData.schoolYear;

  state.schoolYearData = {};
  state.schoolYearData[demoData.schoolYear] = demoData.data;

  loadSchoolYearData(state.currentSchoolYear);

  state.firebaseHydrating = false;
  state.firebaseReady = true;
}

// ─── DEMO VOORBEELDDATA BUILDER ──────────────────────────────────────────────

function bouwVoorbeeldData() {
  const schoolYear = bepaalSchooljaarTekst();

  // 20 leerlingen, allemaal actief sinds begin schooljaar
  const startDatum = schoolYear.split(" – ")[0] + "-09-01";
  // Probeer ook "–" zonder spaties
  let startStr;
  try {
    const [startJaar] = schoolYear.split(/\s*[–-]\s*/);
    startStr = `${startJaar}-09-01`;
  } catch (e) {
    startStr = "2025-09-01";
  }

  const voornamen = [
    ["Noa","Peeters"],["Finn","Janssens"],["Lore","De Smet"],["Milan","Van Damme"],
    ["Zoë","Maes"],["Stan","Claes"],["Emma","Willems"],["Lukas","Jacobs"],
    ["Nora","Goossens"],["Jules","Vermeulen"],["Amber","Wouters"],["Sam","Hermans"],
    ["Tess","Mertens"],["Wout","Dierickx"],["Lien","Thys"],["Vic","Smets"],
    ["Eva","De Wilde"],["Kobe","Aerts"],["Mila","Beeckman"],["Arne","Lemmens"]
  ];

  const leerlingen = voornamen.map(([voornaam, achternaam]) => ({
    id: createId(),
    name: `${voornaam} ${achternaam}`,
    startDate: startStr,
    endDate: ""
  }));

  // Rapportperiode: september - oktober
  const periodeId = createId();
  const reportPeriods = [{
    id: periodeId,
    name: "Rapportperiode 1",
    startDate: startStr,
    endDate: `${startStr.slice(0,4)}-11-07`,
    columns: []
  }];

  // 4 weken aan huistaak-datums (maandagen en donderdagen)
  // Gebruik datums in september/oktober van het huidige schooljaar
  const schooljaar_start = new Date(startStr);
  const kolomDatums = [];

  // Week 1: ma + do
  // Week 2: ma + do
  // Week 3: ma + do
  // Week 4: ma + do
  let huidigeDag = new Date(schooljaar_start);
  // Ga naar eerste maandag
  while (huidigeDag.getDay() !== 1) {
    huidigeDag.setDate(huidigeDag.getDate() + 1);
  }

  for (let week = 0; week < 4; week++) {
    // Maandag
    const ma = new Date(huidigeDag);
    kolomDatums.push(formatDateIso(ma));
    // Donderdag (3 dagen later)
    const don = new Date(huidigeDag);
    don.setDate(don.getDate() + 3);
    kolomDatums.push(formatDateIso(don));
    // Volgende week
    huidigeDag.setDate(huidigeDag.getDate() + 7);
  }

  reportPeriods[0].columns = kolomDatums;

  // Entries: realistische patronen bouwen
  const entries = {};

  leerlingen.forEach((leerling, lidx) => {
    kolomDatums.forEach((datum, didx) => {
      const key = `${periodeId}__${leerling.id}__${datum}`;
      let status = "op tijd";
      let comment = "";

      // Sam (lidx === 11): structureel patroon — elke donderdag niet in orde
      if (lidx === 11) {
        // didx 1, 3, 5, 7 zijn donderdagen
        if (didx % 2 === 1) {
          // Donderdagen: afwisselend niet in orde / onvolledig
          status = didx === 1 ? "niet in orde" : (didx === 3 ? "onvolledig" : (didx === 5 ? "niet in orde" : "te laat"));
          if (didx === 5) comment = "Ouders gecontacteerd";
        } else {
          // Maandagen: op tijd
          status = "op tijd";
        }
      }
      // Wout (lidx === 13): incidenteel te laat, niet structureel
      else if (lidx === 13) {
        if (didx === 2) status = "te laat";
        else if (didx === 6) status = "te laat";
      }
      // Tess (lidx === 12): één keer ziek geweest
      else if (lidx === 12 && didx === 4) {
        status = "afwezig";
        comment = "Ziek";
      }
      // Milan (lidx === 3): één keer niet in orde
      else if (lidx === 3 && didx === 3) {
        status = "onvolledig";
      }
      // Een paar andere leerlingen: sporadisch iets kleins
      else if (lidx === 7 && didx === 6) {
        status = "te laat";
      }
      else if (lidx === 17 && didx === 1) {
        status = "onvolledig";
      }
      // Rest: allemaal op tijd

      entries[key] = { status: status, comment: comment };
    });
  });

  const data = {
    schoolName: "GO! Basisschool De Regenboog",
    className: "Klas 2B",
    pdfTitle: "Opvolging huistaken — Klas 2B",
    schoolLogoDataUrl: "",
    extraOpvolgingDrempel: 4,
    reportPeriods: reportPeriods,
    activePeriodId: periodeId,
    leerlingen: leerlingen,
    columns: [],
    entries: entries
  };

  return { schoolYear: schoolYear, data: data };
}

function formatDateIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dag = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dag}`;
}

function saveCurrentSchoolYearData() {
  state.schoolYearData[state.currentSchoolYear] = {
    schoolName: state.schoolName,
    className: state.className,
    pdfTitle: state.pdfTitle,
    schoolLogoDataUrl: state.schoolLogoDataUrl,
    extraOpvolgingDrempel: state.extraOpvolgingDrempel,
    reportPeriods: JSON.parse(JSON.stringify(state.reportPeriods)),
    activePeriodId: state.activePeriodId,
    leerlingen: JSON.parse(JSON.stringify(state.leerlingen)),
    columns: [],
    entries: JSON.parse(JSON.stringify(state.entries))
  };
}

function loadSchoolYearData(schoolYear) {
  const data = state.schoolYearData[schoolYear] || createEmptySchoolYearData();

  state.currentSchoolYear = schoolYear;
  state.schoolName = data.schoolName;
  state.className = data.className;
  state.pdfTitle = data.pdfTitle;
  state.schoolLogoDataUrl = data.schoolLogoDataUrl;
  state.extraOpvolgingDrempel = data.extraOpvolgingDrempel;
  state.reportPeriods = JSON.parse(JSON.stringify(data.reportPeriods));
  state.activePeriodId = data.activePeriodId || state.reportPeriods[0]?.id || null;
  state.leerlingen = JSON.parse(JSON.stringify(data.leerlingen));
  state.columns = [];
  state.entries = JSON.parse(JSON.stringify(data.entries));

  renderSchooljaar();
  setupInstellingen();
  renderKlaslijst();
  renderRapportperiodes();
  renderRegistratie();
  renderDashboard();
}

function renderSchooljaar() {
  const select = document.getElementById("schooljaarSelect");
  const dashboardSchooljaar = document.getElementById("dashboardSchooljaar");

  if (select) {
    select.innerHTML = state.schoolYears
      .map((jaar) => `<option value="${jaar}" ${jaar === state.currentSchoolYear ? "selected" : ""}>${jaar.replace("-", "–")}</option>`)
      .join("");
  }

  if (dashboardSchooljaar) {
    dashboardSchooljaar.textContent = state.currentSchoolYear.replace("-", "–");
  }
}

function getVolgendSchooljaar(huidig) {
  const [startJaar] = huidig.split("-").map(Number);
  return `${startJaar + 1}-${startJaar + 2}`;
}

function renderDashboard() {
  const schooljaarEl = document.getElementById("dashboardSchooljaar");
  const actieveEl = document.getElementById("dashboardActieveLeerlingen");
  const totaalEl = document.getElementById("dashboardTotaalLeerlingen");
  const periodesEl = document.getElementById("dashboardRapportperiodes");
  const dagenEl = document.getElementById("dashboardRegistratiedagen");

  const vandaag = getVandaagIso();

  if (schooljaarEl) schooljaarEl.textContent = state.currentSchoolYear.replace("-", "–");
  if (actieveEl) actieveEl.textContent = String(countActieveLeerlingenOpDatum(vandaag));
  if (totaalEl) totaalEl.textContent = String(state.leerlingen.length);
  if (periodesEl) periodesEl.textContent = String(state.reportPeriods.length);
  if (dagenEl) dagenEl.textContent = String(getColumnsForActivePeriod().length);
}

function getCellKey(studentId, columnValue) {
  return `${state.activePeriodId}__${studentId}__${columnValue}`;
}

function getCellData(studentId, columnValue) {
  const key = getCellKey(studentId, columnValue);
  return state.entries[key] || { status: "op tijd", comment: "" };
}

function leerlingHeeftExtraOpvolging(leerlingId) {
  const periode = getActivePeriod();
  if (!periode) return false;

  const columns = getColumnsForActivePeriod();
  let count = 0;

  columns.forEach((datum) => {
    const cell = getCellData(leerlingId, datum);
    if (!cell) return;

    if (
      cell.status === "te laat" ||
      cell.status === "niet in orde" ||
      cell.status === "onvolledig"
    ) {
      count++;
    }
  });

  return count >= (state.extraOpvolgingDrempel || 4);
}

function setCellData(studentId, columnValue, data) {
  const key = getCellKey(studentId, columnValue);
  state.entries[key] = data;
}

function sorteerLeerlingen() {
  state.leerlingen.sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureJsPdf() {
  if (!window.jspdf?.jsPDF) {
    alert("jsPDF is niet geladen.");
    return false;
  }
  return true;
}

function statusDisplayOrder() {
  return ["op tijd", "te laat", "niet in orde", "onvolledig", "afwezig"];
}

function leerlingWasActiefInPeriode(leerling, columns) {
  if (!columns || !columns.length) return true;

  return columns.some((kolom) => {
    return leerlingIsActiefOpDatum(leerling, kolom);
  });
}

// ----------------------
// Navigatie
// ----------------------

function renderHeader() {
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");

  const titles = {
    dashboard: "Dashboard",
    instellingen: "Instellingen",
    klaslijst: "Klaslijst",
    rapportperiodes: "Rapportperiodes",
    registratie: "Registratie"
  };

  const subtitles = {
  dashboard: "Start hier en werk stap voor stap.",
  instellingen: "Vul hier de gegevens van je school en klas in. Deze instellingen worden gebruikt in je opvolging en in de PDF’s.",
  klaslijst: "Beheer hier je leerlingen met startdatum en einddatum.",
  rapportperiodes: "Stel hier zelf je rapportperiodes in.",
  registratie: "Registreer hier per leerling de huistaken. Je kan alleen datums kiezen binnen de gekozen rapportperiode. Zie je geen leerlingen? Controleer dan of je in de juiste rapportperiode werkt en of de start- of einddatum van je leerlingen klopt."
};

 if (pageTitle) pageTitle.textContent = titles[state.currentView] || "Dashboard";
if (pageSubtitle) pageSubtitle.textContent = subtitles[state.currentView] || "";

}

function switchView(targetView) {
  if (targetView !== state.currentView) {
    state.previousView = state.currentView;
    state.currentView = targetView;
  }

  document.querySelectorAll(".menu-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === targetView);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${targetView}`);
  });

  renderHeader();

  if (targetView === "dashboard") renderDashboard();
  if (targetView === "klaslijst") renderKlaslijst();
  if (targetView === "rapportperiodes") renderRapportperiodes();
  if (targetView === "registratie") renderRegistratie();
}

function setupMenu() {
  document.querySelectorAll(".menu-btn").forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.view);
    });
  });

    document.getElementById("dashboardStartInstellingenBtn")?.addEventListener("click", () => {
    switchView("instellingen");
  });
}

function setupSchooljaar() {
  const schooljaarSelect = document.getElementById("schooljaarSelect");
  const nieuwSchooljaarBtn = document.getElementById("nieuwSchooljaarBtn");
  const modal = document.getElementById("schooljaarModal");
  const nieuwSchooljaarInput = document.getElementById("nieuwSchooljaarInput");
  const bevestigBtn = document.getElementById("bevestigNieuwSchooljaarBtn");
  const kopieerKlaslijstSelect = document.getElementById("kopieerKlaslijstSelect");
  const kopieerPeriodesSelect = document.getElementById("kopieerPeriodesSelect");

  if (schooljaarSelect && !schooljaarSelect.dataset.bound) {
  schooljaarSelect.addEventListener("change", () => {
    saveCurrentSchoolYearData();
    loadSchoolYearData(schooljaarSelect.value);
    markChanged();
  });
  schooljaarSelect.dataset.bound = "1";
}

  if (nieuwSchooljaarBtn && !nieuwSchooljaarBtn.dataset.bound) {
  nieuwSchooljaarBtn.addEventListener("click", () => {
    const voorstel = getVolgendSchooljaar(state.currentSchoolYear);
    if (nieuwSchooljaarInput) nieuwSchooljaarInput.value = voorstel;
    if (kopieerKlaslijstSelect) kopieerKlaslijstSelect.value = "nee";
    if (kopieerPeriodesSelect) kopieerPeriodesSelect.value = "ja";
    if (modal) modal.hidden = false;
  });
  nieuwSchooljaarBtn.dataset.bound = "1";
}

 document.querySelectorAll("[data-close-schooljaar-modal]").forEach((button) => {
  if (button.dataset.bound) return;
  button.addEventListener("click", () => {
    if (modal) modal.hidden = true;
  });
  button.dataset.bound = "1";
});

  if (bevestigBtn && !bevestigBtn.dataset.bound) {
  bevestigBtn.addEventListener("click", async () => {
    const nieuwJaar = (nieuwSchooljaarInput?.value || "").trim();

    if (!/^\d{4}-\d{4}$/.test(nieuwJaar)) {
      alert("Geef een schooljaar in in deze vorm: 2026-2027");
      return;
    }

    if (state.schoolYears.includes(nieuwJaar)) {
      alert("Dit schooljaar bestaat al.");
      return;
    }

    saveCurrentSchoolYearData();

    const huidigeData = state.schoolYearData[state.currentSchoolYear] || createEmptySchoolYearData();
    const nieuweData = createEmptySchoolYearData();

    nieuweData.entries = {};
nieuweData.columns = [];
nieuweData.activePeriodId = null;
    nieuweData.schoolName = huidigeData.schoolName;
    nieuweData.className = huidigeData.className;
    nieuweData.pdfTitle = huidigeData.pdfTitle;
    nieuweData.schoolLogoDataUrl = huidigeData.schoolLogoDataUrl;
    nieuweData.extraOpvolgingDrempel = huidigeData.extraOpvolgingDrempel;

    if (kopieerKlaslijstSelect?.value === "ja") {
      nieuweData.leerlingen = JSON.parse(JSON.stringify(huidigeData.leerlingen || []));
      nieuweData.leerlingen.forEach((leerling) => {
        leerling.id = createId();
        leerling.endDate = "";
      });
    }

    if (kopieerPeriodesSelect?.value === "ja") {
  nieuweData.reportPeriods = (huidigeData.reportPeriods || []).map((periode) => ({
    id: createId(),
    name: periode.name || "",
    start: periode.start || "",
    end: periode.end || "",
    columns: []
  }));
  nieuweData.activePeriodId = nieuweData.reportPeriods[0]?.id || null;
}

    state.schoolYears.push(nieuwJaar);
    state.schoolYears.sort();

     if (state.schoolYears.length > 2) {
      const oudste = state.schoolYears[0];
      await deleteSchoolYearFromFirestore(oudste);
      delete state.schoolYearData[oudste];
      state.schoolYears = state.schoolYears.slice(-2);
    }

    state.schoolYearData[nieuwJaar] = nieuweData;
    loadSchoolYearData(nieuwJaar);
    markChanged();

    if (modal) modal.hidden = true;
  });
  bevestigBtn.dataset.bound = "1";
}

  renderSchooljaar();
}

// ----------------------
// Help modal
// ----------------------

function setupHelpModal() {
  const modal = document.getElementById("helpModal");
  const title = document.getElementById("helpTitle");
  const body = document.getElementById("helpBody");

  document.querySelectorAll("[data-help]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.help;
      if (title) title.textContent = "Uitleg";
      if (body) body.innerHTML = helpTexts[key] || "<p>Er is nog geen uitleg voorzien voor dit onderdeel.</p>";
      if (modal) modal.hidden = false;
    });
  });

  document.querySelectorAll("[data-close-help]").forEach((button) => {
    button.addEventListener("click", () => {
      if (modal) modal.hidden = true;
    });
  });

  document.getElementById("openPrivacyBtn")?.addEventListener("click", () => {
  document.getElementById("privacyModal").hidden = false;
});

document.querySelectorAll("[data-close-privacy]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("privacyModal").hidden = true;
  });
});
}

// ----------------------
// Instellingen
// ----------------------

function renderLogoPreview() {
  const img = document.getElementById("logoPreview");
  const placeholder = document.getElementById("logoPreviewPlaceholder");

  if (!img || !placeholder) return;

  if (state.schoolLogoDataUrl) {
    img.src = state.schoolLogoDataUrl;
    img.classList.add("has-logo");
    placeholder.style.display = "none";
  } else {
    img.removeAttribute("src");
    img.classList.remove("has-logo");
    placeholder.style.display = "block";
  }
}

function setupUitlegPanelen() {
  document.querySelectorAll("[data-toggle-uitleg]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.toggleUitleg;
      const panel = document.getElementById(id);
      const openBtn = document.querySelector(`[data-open-uitleg="${id}"]`);

      if (panel) panel.classList.add("hidden");
      if (openBtn) openBtn.classList.remove("hidden");
    });
  });

  document.querySelectorAll("[data-open-uitleg]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.openUitleg;
      const panel = document.getElementById(id);

      if (panel) panel.classList.remove("hidden");
      button.classList.add("hidden");
    });
  });
}

function setupInstellingen() {
  const schoolNameInput = document.getElementById("schoolNameInput");
  const classNameInput = document.getElementById("classNameInput");
  const pdfTitleInput = document.getElementById("pdfTitleInput");
  const registratieTitelInput = document.getElementById("registratieTitelInput");
  const schoolLogoInput = document.getElementById("schoolLogoInput");
  const extraOpvolgingDrempelInput = document.getElementById("extraOpvolgingDrempelInput");

  if (schoolNameInput) {
    schoolNameInput.value = state.schoolName;
    if (!schoolNameInput.dataset.bound) {
      schoolNameInput.addEventListener("input", () => {
        state.schoolName = schoolNameInput.value.trim();
        markChanged();
      });
      schoolNameInput.dataset.bound = "1";
    }
  }

  if (classNameInput) {
    classNameInput.value = state.className;
    if (!classNameInput.dataset.bound) {
      classNameInput.addEventListener("input", () => {
        state.className = classNameInput.value.trim();
        if (state.currentView === "registratie") renderRegistratie();
        markChanged();
      });
      classNameInput.dataset.bound = "1";
    }
  }

  if (pdfTitleInput) {
    pdfTitleInput.value = state.pdfTitle;
    if (!pdfTitleInput.dataset.bound) {
      pdfTitleInput.addEventListener("input", () => {
        state.pdfTitle = pdfTitleInput.value.trim() || "Opvolging huistaken";
        if (registratieTitelInput) registratieTitelInput.value = state.pdfTitle;
        markChanged();
      });
      pdfTitleInput.dataset.bound = "1";
    }
  }

  if (registratieTitelInput) {
    registratieTitelInput.value = state.pdfTitle;
    if (!registratieTitelInput.dataset.bound) {
      registratieTitelInput.addEventListener("input", () => {
        state.pdfTitle = registratieTitelInput.value.trim() || "Opvolging huistaken";
        if (pdfTitleInput) pdfTitleInput.value = state.pdfTitle;
        markChanged();
      });
      registratieTitelInput.dataset.bound = "1";
    }
  }

  if (extraOpvolgingDrempelInput) {
    extraOpvolgingDrempelInput.value = state.extraOpvolgingDrempel;
    if (!extraOpvolgingDrempelInput.dataset.bound) {
      extraOpvolgingDrempelInput.addEventListener("input", () => {
        const waarde = parseInt(extraOpvolgingDrempelInput.value, 10);
        state.extraOpvolgingDrempel = !isNaN(waarde) && waarde > 0 ? waarde : 4;
        markChanged();
      });
      extraOpvolgingDrempelInput.dataset.bound = "1";
    }
  }

  if (schoolLogoInput && !schoolLogoInput.dataset.bound) {
    schoolLogoInput.addEventListener("change", () => {
      const file = schoolLogoInput.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        state.schoolLogoDataUrl = reader.result;
        renderLogoPreview();
        markChanged();
      };
      reader.readAsDataURL(file);
    });
    schoolLogoInput.dataset.bound = "1";
  }

  renderLogoPreview();
}

// ----------------------
// Klaslijst
// ----------------------

function leerlingStatusTekst(leerling) {
  if (leerling.endDate) {
    return `Actief vanaf ${formatDate(leerling.startDate)} · Uitgeschreven vanaf ${formatDate(leerling.endDate)}`;
  }
  return `Actief vanaf ${formatDate(leerling.startDate)}`;
}

function renderKlaslijst() {
  const lijst = document.getElementById("klaslijst");
  if (!lijst) return;

  sorteerLeerlingen();

  if (state.leerlingen.length === 0) {
    lijst.innerHTML = `<li class="leerling-empty">Nog geen leerlingen toegevoegd.</li>`;
    return;
  }

  lijst.innerHTML = state.leerlingen
    .map((leerling) => {
      const naam = (leerling.name || "").trim();
      const zichtbareNaam = naam !== "" ? naam : "(geen naam ingevuld)";

      return `
        <li class="leerling-item">
          <div>
            <div class="leerling-naam">${escapeHtml(zichtbareNaam)}</div>
            <div class="pdf-note">${escapeHtml(leerlingStatusTekst(leerling))}</div>
          </div>
          <div class="leerling-acties">
            <button type="button" class="actie-btn actie-bewerk" data-student-id="${leerling.id}" title="Aanpassen">✏️</button>
            <button type="button" class="actie-btn actie-bewerk" data-uitschrijf-id="${leerling.id}" title="Uitschrijven">↩</button>
          </div>
        </li>
      `;
    })
    .join("");

  lijst.querySelectorAll("[data-student-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openLeerlingModal(button.dataset.studentId);
    });
  });

  lijst.querySelectorAll("[data-uitschrijf-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openUitschrijfModal(button.dataset.uitschrijfId);
    });
  });
}

function setupKlaslijst() {
  document.getElementById("openAddLeerlingBtn")?.addEventListener("click", () => {
    openLeerlingModal(null);
  });

  document.getElementById("plakLijstBtn")?.addEventListener("click", () => {
    const tekst = prompt(
`Plak hier je klaslijst.
Zet elke leerling op een nieuwe regel.

Voorbeeld:
Peeters Jan
Janssens Emma
De Smet Noor`
    );

    if (!tekst) return;

    const namen = tekst
      .split("\n")
      .map((naam) => naam.trim())
      .filter((naam) => naam !== "");

    namen.forEach((naam) => {
      const bestaatAl = state.leerlingen.some((leerling) => leerling.name.toLowerCase() === naam.toLowerCase());
      if (!bestaatAl) {
        state.leerlingen.push({
          id: createId(),
          name: naam,
          startDate: getVandaagIso(),
          endDate: ""
        });
      }
    });

    renderKlaslijst();
    renderRegistratie();
    renderDashboard();
    markChanged();
  });

  document.getElementById("clearKlaslijstBtn")?.addEventListener("click", () => {
  const bevestiging = confirm("Ben je zeker dat je de volledige klaslijst wil leegmaken?");
  if (!bevestiging) return;

  state.leerlingen = [];

  renderKlaslijst();
  renderRegistratie();
  renderDashboard();
  markChanged();
});

  renderKlaslijst();
}

// ----------------------
// Leerling modals
// ----------------------

function setupLeerlingModal() {
  const modal = document.getElementById("leerlingModal");
  const closeButtons = document.querySelectorAll("[data-close-leerling-modal]");
  const saveBtn = document.getElementById("saveLeerlingBtn");

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (modal) modal.hidden = true;
      state.editingLeerlingId = null;
    });
  });

  saveBtn?.addEventListener("click", () => {
    const naamInput = document.getElementById("leerlingNaamInput");
    const startInput = document.getElementById("leerlingStartdatumInput");
    const eindInput = document.getElementById("leerlingEinddatumInput");

    const naam = (naamInput?.value || "").trim();
    const startDate = startInput?.value || "";
    const endDate = eindInput?.value || "";

    if (naam === "") {
      alert("Geef eerst een naam in.");
      naamInput?.focus();
      return;
    }

    if (!startDate) {
      alert("Geef een startdatum in.");
      startInput?.focus();
      return;
    }

    if (state.editingLeerlingId) {
      const leerling = state.leerlingen.find((item) => item.id === state.editingLeerlingId);
      if (!leerling) return;

      leerling.name = naam;
      leerling.startDate = startDate;
      leerling.endDate = endDate;
    } else {
      state.leerlingen.push({
        id: createId(),
        name: naam,
        startDate: startDate,
        endDate: endDate
      });
    }

    if (naamInput) naamInput.value = "";
    if (startInput) startInput.value = "";
    if (eindInput) eindInput.value = "";

    if (modal) modal.hidden = true;
    state.editingLeerlingId = null;

    renderKlaslijst();
    renderRegistratie();
    renderDashboard();
    markChanged();
  });
}

function openLeerlingModal(studentId) {
  const modal = document.getElementById("leerlingModal");
  const title = document.getElementById("leerlingModalTitle");
  const naamInput = document.getElementById("leerlingNaamInput");
  const startInput = document.getElementById("leerlingStartdatumInput");
  const eindInput = document.getElementById("leerlingEinddatumInput");

  if (!modal) return;

  if (studentId) {
    const leerling = state.leerlingen.find((item) => item.id === studentId);
    if (!leerling) return;

    state.editingLeerlingId = studentId;
    if (title) title.textContent = "Leerling aanpassen";
    if (naamInput) naamInput.value = (leerling.name || "").trim();
    if (startInput) startInput.value = leerling.startDate || "";
    if (eindInput) eindInput.value = leerling.endDate || "";
  } else {
    state.editingLeerlingId = null;
    if (title) title.textContent = "Leerling toevoegen";
    if (naamInput) naamInput.value = "";
    if (startInput) startInput.value = "";
    if (eindInput) eindInput.value = "";
  }

  modal.hidden = false;
}

function setupUitschrijfModal() {
  const modal = document.getElementById("uitschrijfModal");
  const closeButtons = document.querySelectorAll("[data-close-uitschrijf-modal]");
  const confirmBtn = document.getElementById("confirmUitschrijvenBtn");

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (modal) modal.hidden = true;
      state.uitschrijfLeerlingId = null;
    });
  });

  confirmBtn?.addEventListener("click", () => {
    const einddatumInput = document.getElementById("uitschrijfEinddatumInput");
    const leerling = state.leerlingen.find((item) => item.id === state.uitschrijfLeerlingId);
    if (!leerling) return;

    if (!einddatumInput?.value) {
      alert("Geef een einddatum in.");
      return;
    }

    leerling.endDate = einddatumInput.value;

    if (modal) modal.hidden = true;
    state.uitschrijfLeerlingId = null;

     renderKlaslijst();
    renderRegistratie();
    renderDashboard();
    markChanged();
  });
}

function openUitschrijfModal(studentId) {
  const modal = document.getElementById("uitschrijfModal");
  const naamEl = document.getElementById("uitschrijfLeerlingNaam");
  const einddatumInput = document.getElementById("uitschrijfEinddatumInput");

  const leerling = state.leerlingen.find((item) => item.id === studentId);
  if (!leerling || !modal) return;

  state.uitschrijfLeerlingId = studentId;

  if (naamEl) naamEl.textContent = leerling.name;
  if (einddatumInput) einddatumInput.value = leerling.endDate || "";

  modal.hidden = false;
}

// ----------------------
// Rapportperiodes
// ----------------------

function renderRapportperiodes() {
  const container = document.getElementById("periodesLijst");
  const registratiePeriodeSelect = document.getElementById("registratiePeriodeSelect");

  if (!container) return;

  if (state.reportPeriods.length === 0) {
    container.innerHTML = `<div class="leerling-empty">Nog geen rapportperiodes toegevoegd.</div>`;
    if (registratiePeriodeSelect) registratiePeriodeSelect.innerHTML = "";
    return;
  }

  container.innerHTML = state.reportPeriods
    .map(
      (periode) => `
      <div class="period-item">
        <div>
          <strong>${escapeHtml(periode.name)}</strong>
          <div class="period-meta">${periode.start ? formatDate(periode.start) : "Geen startdatum"} — ${periode.end ? formatDate(periode.end) : "Geen einddatum"}</div>
        </div>
        <div>${periode.start ? formatDate(periode.start) : "-"}</div>
        <div>${periode.end ? formatDate(periode.end) : "-"}</div>
        <div class="leerling-acties">
          <button type="button" class="actie-btn actie-bewerk" data-period-id="${periode.id}" title="Bewerken">✏️</button>
          <button type="button" class="actie-btn actie-verwijder" data-period-id="${periode.id}" title="Verwijderen">❌</button>
        </div>
      </div>
    `
    )
    .join("");

  if (registratiePeriodeSelect) {
    registratiePeriodeSelect.innerHTML = state.reportPeriods
      .map(
        (periode) => `
        <option value="${periode.id}" ${periode.id === state.activePeriodId ? "selected" : ""}>
          ${escapeHtml(periode.name)}
        </option>
      `
      )
      .join("");
  }

  container.querySelectorAll("[data-period-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.title === "Bewerken") {
        openPeriodeEditModal(button.dataset.periodId);
      } else {
        const id = button.dataset.periodId;

        if (state.reportPeriods.length === 1) {
          alert("Je moet minstens één rapportperiode behouden.");
          return;
        }

        state.reportPeriods = state.reportPeriods.filter((item) => item.id !== id);

        if (state.activePeriodId === id) {
          state.activePeriodId = state.reportPeriods[0]?.id || "";
        }

        renderRapportperiodes();
        renderRegistratie();
      }
    });
  });

  if (registratiePeriodeSelect) {
   registratiePeriodeSelect.onchange = () => {
  state.activePeriodId = registratiePeriodeSelect.value;
  renderRegistratie();
  markChanged();
};
  }
}

function setupRapportperiodes() {
  const naamInput = document.getElementById("periodeNaamInput");
  const startInput = document.getElementById("periodeStartInput");
  const eindeInput = document.getElementById("periodeEindeInput");
  const addBtn = document.getElementById("addPeriodeBtn");

    addBtn?.addEventListener("click", () => {
    const naam = naamInput?.value.trim();
    const start = startInput?.value || "";
    const end = eindeInput?.value || "";

    if (!naam) {
      alert("Geef eerst een naam voor de rapportperiode.");
      return;
    }

    state.reportPeriods.push({
      id: createId(),
      name: naam,
      start,
      end
    });

    state.activePeriodId = state.reportPeriods[state.reportPeriods.length - 1].id;

    if (naamInput) naamInput.value = "";
    if (startInput) startInput.value = "";
    if (eindeInput) eindeInput.value = "";

    renderRapportperiodes();
    renderRegistratie();
    renderDashboard();
    markChanged();
  });

  renderRapportperiodes();
}

function setupPeriodeEditModal() {
  const modal = document.getElementById("periodeEditModal");
  const closeButtons = document.querySelectorAll("[data-close-periode-edit]");
  const saveBtn = document.getElementById("savePeriodeEditBtn");

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (modal) modal.hidden = true;
      state.editingPeriodId = null;
    });
  });

  saveBtn?.addEventListener("click", () => {
    const naamInput = document.getElementById("editPeriodeNaamInput");
    const startInput = document.getElementById("editPeriodeStartInput");
    const eindeInput = document.getElementById("editPeriodeEindeInput");

    const periode = state.reportPeriods.find((item) => item.id === state.editingPeriodId);
    if (!periode) return;

    periode.name = naamInput?.value.trim() || periode.name;
    periode.start = startInput?.value || "";
    periode.end = eindeInput?.value || "";

    if (modal) modal.hidden = true;
    state.editingPeriodId = null;

     renderRapportperiodes();
    renderRegistratie();
    renderDashboard();
    markChanged();
  });
}

function openPeriodeEditModal(periodId) {
  const modal = document.getElementById("periodeEditModal");
  const naamInput = document.getElementById("editPeriodeNaamInput");
  const startInput = document.getElementById("editPeriodeStartInput");
  const eindeInput = document.getElementById("editPeriodeEindeInput");

  const periode = state.reportPeriods.find((item) => item.id === periodId);
  if (!periode || !modal) return;

  state.editingPeriodId = periodId;

  if (naamInput) naamInput.value = periode.name || "";
  if (startInput) startInput.value = periode.start || "";
  if (eindeInput) eindeInput.value = periode.end || "";

  modal.hidden = false;
}

// ----------------------
// Kolommen
// ----------------------

function addKolom(value) {
  if (!state.activePeriodId) {
    alert("Kies eerst een rapportperiode.");
    return;
  }

  if (!value) {
    alert("Kies eerst een datum.");
    return;
  }

  const periode = getActivePeriod();

  if (periode?.start && value < periode.start) {
    alert("Deze datum valt vóór het begin van de gekozen rapportperiode.");
    return;
  }

  if (periode?.end && value > periode.end) {
    alert("Deze datum valt na het einde van de gekozen rapportperiode.");
    return;
  }

  const columns = getColumnsForActivePeriod();

  if (!columns.includes(value)) {
    columns.push(value);
    columns.sort();
    setColumnsForActivePeriod(columns);
    renderRegistratie();
    renderDashboard();
    markChanged();
    scrollNaarLaatsteDagKolom();
    return;
  }

  renderRegistratie();
  renderDashboard();
  scrollNaarLaatsteDagKolom();
}

function removeKolom(value) {
  const columns = getColumnsForActivePeriod().filter((item) => item !== value);
  setColumnsForActivePeriod(columns);
  renderRegistratie();
  renderDashboard();
  markChanged();
}

function scrollNaarLaatsteDagKolom() {
  requestAnimationFrame(() => {
    const wrap = document.getElementById("tableScrollWrap");
    const tabel = document.getElementById("registratieTabel");
    const laatsteDagKolom = tabel?.querySelector("thead th:last-child");

    if (!wrap || !laatsteDagKolom) return;

    const wrapRect = wrap.getBoundingClientRect();
    const kolomRect = laatsteDagKolom.getBoundingClientRect();

    const extraMarge = 16;
    const verschuiving = (kolomRect.right - wrapRect.right) + extraMarge;

    if (verschuiving > 0) {
      wrap.scrollLeft += verschuiving;
    } else {
      wrap.scrollLeft = wrap.scrollWidth;
    }
  });
}

function setupKolomKnoppen() {
  const dagBtn = document.getElementById("addDagKolomBtn");
  const dagInput = document.getElementById("dagKolomDatumInput");

  dagBtn?.addEventListener("click", () => {
    addKolom(dagInput?.value || "");
  });
}

// ----------------------
// Registratie
// ----------------------

function leerlingIsActiefOpDatum(leerling, datum) {
  if (!leerling.startDate) return true;
  if (datum < leerling.startDate) return false;
  if (leerling.endDate && datum >= leerling.endDate) return false;
  return true;
}

function renderRegistratieLeeg(thead, tbody, boodschap) {
  thead.innerHTML = "";
  tbody.innerHTML = `
    <tr>
      <td class="registratie-empty-cell">
        <div class="registratie-empty">${boodschap}</div>
      </td>
    </tr>
  `;
}

function renderRegistratie() {
  const activeColumns = getColumnsForActivePeriod();


  const thead = document.getElementById("registratieThead");
const tbody = document.getElementById("registratieTbody");
const periodeSelect = document.getElementById("registratiePeriodeSelect");
const registratieTitelInput = document.getElementById("registratieTitelInput");
const dagInput = document.getElementById("dagKolomDatumInput");

  if (!thead || !tbody) return;

  if (!state.reportPeriods.length) {
    if (periodeSelect) periodeSelect.innerHTML = "";
    renderRegistratieLeeg(thead, tbody, "Maak eerst minstens één rapportperiode aan.");
    return;
  }

  if (!state.leerlingen.length) {
    renderRegistratieLeeg(thead, tbody, "Voeg eerst minstens één leerling toe in de klaslijst.");
    return;
  }


  if (registratieTitelInput) {
    registratieTitelInput.value = state.pdfTitle;
    registratieTitelInput.oninput = () => {
      state.pdfTitle = registratieTitelInput.value.trim() || "Opvolging huistaken";
      const pdfTitleInput = document.getElementById("pdfTitleInput");
      if (pdfTitleInput) pdfTitleInput.value = state.pdfTitle;
      markChanged();
    };
  }

if (periodeSelect) {
  periodeSelect.innerHTML = state.reportPeriods
    .map(
      (periode) => `
        <option value="${periode.id}" ${periode.id === state.activePeriodId ? "selected" : ""}>
          ${escapeHtml(periode.name)}
        </option>
      `
    )
    .join("");

  const actievePeriode = getActivePeriod();
  if (dagInput) {
    dagInput.min = actievePeriode?.start || "";
    dagInput.max = actievePeriode?.end || "";
  }

  periodeSelect.onchange = () => {
    state.activePeriodId = periodeSelect.value;

    const nieuweActievePeriode = getActivePeriod();
    if (dagInput) {
      dagInput.value = "";
      dagInput.min = nieuweActievePeriode?.start || "";
      dagInput.max = nieuweActievePeriode?.end || "";
    }

    renderRegistratie();
    markChanged();
  };
}

  thead.innerHTML = `
    <tr>
      <th>Leerling</th>
      ${
        activeColumns.length
          ? activeColumns.map((kolom) => `
              <th class="registratie-dagkolom">
                <div class="column-top">${formatDate(kolom)}</div>
                <div class="column-sub">Registratiedag</div>
                <div class="name-actions" style="margin-top:8px;">
                  <button type="button" class="ghost-btn kolom-verwijder-btn" data-kolom="${kolom}">Verwijderen</button>
                </div>
              </th>
            `).join("")
          : `<th class="registratie-dagkolom registratie-hint-kolom">Nog geen dag toegevoegd</th>`
      }
    </tr>
  `;

sorteerLeerlingen();

const zichtbareLeerlingen = state.leerlingen.filter((leerling) =>
  leerlingWasActiefInPeriode(leerling, activeColumns)
);

if (zichtbareLeerlingen.length === 0) {
  renderRegistratieLeeg(
    thead,
    tbody,
    "Er zijn geen actieve leerlingen op deze datum. Controleer de start- en einddatum van je leerlingen."
  );
  return;
}

tbody.innerHTML = zichtbareLeerlingen
  .map((leerling) => `
      <tr class="${leerlingHeeftExtraOpvolging(leerling.id) ? 'extra-opvolging' : ''}">
        <td>
          <div class="name-cell">
            <div class="name-cell-main">
              <div><strong>${escapeHtml(leerling.name)}</strong></div>
              <div class="pdf-note">${escapeHtml(leerlingStatusTekst(leerling))}</div>
            </div>
            <div class="name-actions">
              <button type="button" class="ghost-btn leerling-pdf-btn" data-student-id="${leerling.id}">PDF leerling</button>
            </div>
          </div>
        </td>
        ${
          activeColumns.length
            ? activeColumns.map((kolom) => {
                const actief = leerlingIsActiefOpDatum(leerling, kolom);

                if (!actief) {
                  return `
                    <td class="registratie-dagcel">
                      <div class="cell-stack">
                        <div class="notice-box" style="margin-top:0; padding:10px 12px;">Niet actief op deze datum</div>
                      </div>
                    </td>
                  `;
                }

                const cell = getCellData(leerling.id, kolom);
                const statusClass = `status-${slugStatus(cell.status)}`;

                return `
                  <td class="registratie-dagcel">
                    <div class="cell-stack">
                      <select
                        class="status-select ${statusClass}"
                        data-student-id="${leerling.id}"
                        data-kolom="${kolom}"
                      >
                        ${STATUSSEN.map(
                          (status) => `<option value="${status}" ${cell.status === status ? "selected" : ""}>${status}</option>`
                        ).join("")}
                      </select>

                      <textarea
                        data-student-id="${leerling.id}"
                        data-kolom="${kolom}"
                        placeholder="Opmerking..."
                      >${escapeHtml(cell.comment || "")}</textarea>
                    </div>
                  </td>
                `;
              }).join("")
            : `<td class="registratie-start-cell">Voeg eerst een dag toe om status en opmerkingen in te vullen.</td>`
        }
      </tr>
    `).join("");

  tbody.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", () => {
      const studentId = select.dataset.studentId;
      const kolom = select.dataset.kolom;
      const bestaand = getCellData(studentId, kolom);

      setCellData(studentId, kolom, {
        ...bestaand,
        status: select.value
      });

      select.className = `status-select status-${slugStatus(select.value)}`;
      markChanged();
    });
  });

  tbody.querySelectorAll("textarea").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const studentId = textarea.dataset.studentId;
      const kolom = textarea.dataset.kolom;
      const bestaand = getCellData(studentId, kolom);

      setCellData(studentId, kolom, {
        ...bestaand,
        comment: textarea.value
      });

      markChanged();
    });
  });

  tbody.querySelectorAll(".leerling-pdf-btn").forEach((button) => {
    button.addEventListener("click", () => {
      genereerLeerlingPdf(button.dataset.studentId);
    });
  });

  thead.querySelectorAll(".kolom-verwijder-btn").forEach((button) => {
    button.addEventListener("click", () => {
      removeKolom(button.dataset.kolom);
    });
  });
}

// ----------------------
// PDF helpers
// ----------------------

function addPdfTitleBar(doc, title, subtitleLines = []) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setDrawColor(219, 230, 243);
  doc.roundedRect(18, 14, pageWidth - 36, 22, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 46, 88);
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 28, { align: "center" });

  let y = 40;
  if (subtitleLines.length) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 106, 133);
    doc.setFontSize(11);

    subtitleLines.forEach((line) => {
      if (!line) return;
      doc.text(line, pageWidth / 2, y, { align: "center" });
      y += 6;
    });
  }

  return y;
}

function tekenLegendaRegel(doc, status, x, y, zwartWit = false) {
  let kleur = STATUS_COLORS[status] || [180, 180, 180];

  if (zwartWit) {
    const grijsMap = {
      "op tijd": [70, 70, 70],
      "te laat": [110, 110, 110],
      "niet in orde": [150, 150, 150],
      "onvolledig": [190, 190, 190],
      "afwezig": [225, 225, 225]
    };
    kleur = grijsMap[status] || [180, 180, 180];
  }

  doc.setFillColor(...kleur);
  doc.rect(x, y - 4, 4, 4, "F");
  doc.setDrawColor(120, 120, 120);
  doc.rect(x, y - 4, 4, 4, "S");

  doc.setTextColor(32, 49, 77);
  doc.text(`${status}:`, x + 8, y);
}

function addLeerlingKop(doc, leerlingNaam, klasNaam, schoolNaam) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 50;

  const naamTekst = (leerlingNaam || "-").replace(/\s+/g, " ").trim() || "-";
  const klasTekst = `Klas: ${(klasNaam || "-").replace(/\s+/g, " ").trim() || "-"}`;
  const tussenruimte = 28;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(32, 49, 77);
  doc.setFontSize(16);

  const naamBreedte = doc.getTextWidth(naamTekst);
  const klasBreedte = doc.getTextWidth(klasTekst);
  const totaalBreedte = naamBreedte + tussenruimte + klasBreedte;
  const startX = Math.max(18, (pageWidth - totaalBreedte) / 2);

  doc.text(naamTekst, startX, y);
  doc.text(klasTekst, startX + naamBreedte + tussenruimte, y);

  y += 10;

  if (schoolNaam) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 106, 133);
    doc.setFontSize(11);
    doc.text(schoolNaam, pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  return y;
}


function addInfoCard(doc, x, y, w, h, title) {
  doc.setDrawColor(219, 230, 243);
  doc.roundedRect(x, y, w, h, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(32, 49, 77);
  doc.setFontSize(12);
  doc.text(title, x + 6, y + 8);
}

function addFooter(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 14;

  doc.setDrawColor(220, 228, 239);
  doc.line(20, footerY - 6, pageWidth - 20, footerY - 6);

  if (state.schoolLogoDataUrl) {
    try {
      const imgProps = doc.getImageProperties(state.schoolLogoDataUrl);
      const ratio = imgProps.width / imgProps.height;

      let drawW = 22;
      let drawH = drawW / ratio;

      if (drawH > 18) {
        drawH = 18;
        drawW = drawH * ratio;
      }

      const x = (pageWidth - drawW) / 2;
      const y = footerY - 12;

      doc.addImage(state.schoolLogoDataUrl, "PNG", x, y, drawW, drawH);
    } catch (e) {}
  }
}

function toonPdfLoading(tekst = "Even geduld, PDF wordt samengesteld...") {
  const overlay = document.getElementById("pdfLoadingOverlay");
  const tekstEl = document.getElementById("pdfLoadingText");
  const fillEl = document.getElementById("pdfLoadingBarFill");
  const percentEl = document.getElementById("pdfLoadingPercent");

  overlay?.classList.remove("hidden");

  if (tekstEl) tekstEl.textContent = tekst;
  if (fillEl) {
    fillEl.style.width = "42%";
    fillEl.classList.add("is-indeterminate");
  }
  if (percentEl) percentEl.textContent = "";
}

function updatePdfLoading(tekst = "Even geduld, PDF wordt samengesteld...", percentage = null) {
  const tekstEl = document.getElementById("pdfLoadingText");
  const fillEl = document.getElementById("pdfLoadingBarFill");
  const percentEl = document.getElementById("pdfLoadingPercent");

  if (tekstEl) tekstEl.textContent = tekst;

  if (fillEl) {
    if (typeof percentage === "number" && Number.isFinite(percentage)) {
      const veilig = Math.max(0, Math.min(100, Math.round(percentage)));
      fillEl.style.width = `${veilig}%`;
      fillEl.classList.remove("is-indeterminate");
      if (percentEl) percentEl.textContent = `${veilig}%`;
    } else {
      fillEl.style.width = "42%";
      fillEl.classList.add("is-indeterminate");
      if (percentEl) percentEl.textContent = "";
    }
  }
}

function verbergPdfLoading() {
  document.getElementById("pdfLoadingOverlay")?.classList.add("hidden");
}

function wachtOpPdfOverlay() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

function wacht(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function voerPdfActieUit(tekst, actie) {
  const start = performance.now();

  toonPdfLoading(tekst);
  await wachtOpPdfOverlay();

  try {
    await Promise.resolve(actie());
  } finally {
    const verstreken = performance.now() - start;
    const resterend = Math.max(0, 500 - verstreken);

    if (resterend > 0) {
      await wacht(resterend);
    }

    verbergPdfLoading();
  }
}

function maakPieCanvas(counts) {
  const labels = statusDisplayOrder();
  const values = labels.map((label) => counts[label] || 0);
  const totaal = values.reduce((sum, value) => sum + value, 0) || 1;

  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");

  let startAngle = -Math.PI / 2;

  labels.forEach((label) => {
    const value = counts[label] || 0;
    if (value <= 0) return;

    const slice = (value / totaal) * Math.PI * 2;
    const [r, g, b] = STATUS_COLORS[label];

    ctx.beginPath();
    ctx.moveTo(120, 120);
    ctx.arc(120, 120, 82, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();

    startAngle += slice;
  });

  ctx.beginPath();
  ctx.arc(120, 120, 34, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  return canvas;
}

function maakPieCanvasZwartWit(counts) {
  const labels = statusDisplayOrder();
  const values = labels.map((label) => counts[label] || 0);
  const totaal = values.reduce((sum, value) => sum + value, 0) || 1;

  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");

  const grijsMap = {
    "op tijd": "rgb(70,70,70)",
    "te laat": "rgb(110,110,110)",
    "niet in orde": "rgb(150,150,150)",
    "onvolledig": "rgb(190,190,190)",
    "afwezig": "rgb(225,225,225)"
  };

  let startAngle = -Math.PI / 2;

  labels.forEach((label) => {
    const value = counts[label] || 0;
    if (value <= 0) return;

    const slice = (value / totaal) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(120, 120);
    ctx.arc(120, 120, 82, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = grijsMap[label];
    ctx.fill();

    startAngle += slice;
  });

  ctx.beginPath();
  ctx.arc(120, 120, 34, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  return canvas;
}

function berekenStatusTellingenVoorLeerling(studentId) {
  const counts = {
    "op tijd": 0,
    "te laat": 0,
    "niet in orde": 0,
    "onvolledig": 0,
    "afwezig": 0
  };

  const opmerkingenLijst = [];
  const activeColumns = getColumnsForActivePeriod();

  activeColumns.forEach((kolom) => {
    const leerling = state.leerlingen.find((l) => l.id === studentId);
    if (!leerling || !leerlingIsActiefOpDatum(leerling, kolom)) return;

    const cell = getCellData(studentId, kolom);
    counts[cell.status] = (counts[cell.status] || 0) + 1;

    if (cell.comment && cell.comment.trim()) {
      opmerkingenLijst.push({
        datum: formatDate(kolom),
        status: cell.status,
        comment: cell.comment.trim()
      });
    }
  });

  return { counts, opmerkingenLijst };
}

function berekenStatusTellingenVoorKlas() {
  const counts = {
    "op tijd": 0,
    "te laat": 0,
    "niet in orde": 0,
    "onvolledig": 0,
    "afwezig": 0
  };

  const probleemPerLeerling = [];
  const activeColumns = getColumnsForActivePeriod();

  state.leerlingen.forEach((leerling) => {
    const detail = {
      "te laat": 0,
      "niet in orde": 0,
      "onvolledig": 0
    };

    activeColumns.forEach((kolom) => {
      if (!leerlingIsActiefOpDatum(leerling, kolom)) return;

      const cell = getCellData(leerling.id, kolom);
      counts[cell.status] = (counts[cell.status] || 0) + 1;

      if (detail[cell.status] !== undefined) {
        detail[cell.status] += 1;
      }
    });

    const totaalProblemen =
      detail["te laat"] + detail["niet in orde"] + detail["onvolledig"];

    probleemPerLeerling.push({
      naam: leerling.name,
      totaal: totaalProblemen,
      detail
    });
  });

  probleemPerLeerling.sort((a, b) => b.totaal - a.totaal);

  return {
    counts,
    probleemPerLeerling: probleemPerLeerling.filter(
      (item) => item.totaal >= state.extraOpvolgingDrempel
    )
  };
}

// ----------------------
// PDF's
// ----------------------

function genereerLeerlingPdf(studentId) {
  if (!ensureJsPdf()) return;

  const leerling = state.leerlingen.find((item) => item.id === studentId);
  if (!leerling) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const periode = getActivePeriod();
  const titel = state.pdfTitle || "Opvolging huistaken";
  const { counts, opmerkingenLijst } = berekenStatusTellingenVoorLeerling(studentId);
  const pieCanvas = maakPieCanvas(counts);

 addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`);
const topY = addLeerlingKop(doc, leerling.name, state.className, state.schoolName);

  
  addInfoCard(doc, 18, topY + 4, 64, 66, "Overzicht");
  doc.addImage(pieCanvas.toDataURL("image/png"), "PNG", 29, topY + 16, 34, 34);

  addInfoCard(doc, 88, topY + 4, 104, 66, "Samenvatting");
  let y = topY + 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(32, 49, 77);

  statusDisplayOrder().forEach((status) => {
  tekenLegendaRegel(doc, status, 96, y, false);
  doc.text(`${counts[status] || 0} keer`, 126, y);
  y += 10;
});

  addInfoCard(doc, 18, topY + 78, 174, 142, "Opmerkingen");
  y = topY + 92;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  if (opmerkingenLijst.length === 0) {
    doc.text("Geen opmerkingen genoteerd.", 26, y);
  } else {
    opmerkingenLijst.forEach((item) => {
      const statusTekst = `${item.datum} — ${item.status}`;
      const commentTekst = item.comment;

      if (y > 240) {
        addFooter(doc);
        doc.addPage();
        addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`);
const vervolgY = addLeerlingKop(doc, leerling.name, state.className, state.schoolName);
        addInfoCard(doc, 18, vervolgY + 4, 174, 220, "Opmerkingen");
        y = vervolgY + 18;
      }

      doc.setFont("helvetica", "bold");
      doc.text(statusTekst, 26, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      const regels = doc.splitTextToSize(commentTekst, 154);
      doc.text(regels, 26, y);
      y += regels.length * 5 + 6;
    });
  }

  addFooter(doc);
  doc.save(`${leerling.name.replace(/\s+/g, "_")}_${(periode?.name || "periode").replace(/\s+/g, "_")}.pdf`);
}

function genereerAlleLeerlingenPdf() {
  if (!ensureJsPdf()) return;

  const { jsPDF } = window.jspdf;
  const periode = getActivePeriod();
  const titel = state.pdfTitle || "Opvolging huistaken";
  const vandaag = getVandaagIso();

  const actieveLeerlingen = state.leerlingen.filter((leerling) =>
    leerlingIsActiefOpDatum(leerling, vandaag)
  );

  if (!actieveLeerlingen.length) {
    alert("Er zijn geen actieve leerlingen om af te drukken.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");

  actieveLeerlingen.forEach((leerling, index) => {
    if (index !== 0) doc.addPage();

    const { counts, opmerkingenLijst } = berekenStatusTellingenVoorLeerling(leerling.id);
    const pieCanvas = maakPieCanvas(counts);

    addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`);
const topY = addLeerlingKop(doc, leerling.name, state.className, state.schoolName);

    addInfoCard(doc, 18, topY + 4, 64, 66, "Overzicht");
    doc.addImage(pieCanvas.toDataURL("image/png"), "PNG", 29, topY + 16, 34, 34);

    addInfoCard(doc, 88, topY + 4, 104, 66, "Samenvatting");
    let y = topY + 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(32, 49, 77);

   statusDisplayOrder().forEach((status) => {
  tekenLegendaRegel(doc, status, 96, y, false);
  doc.text(`${counts[status] || 0} keer`, 126, y);
  y += 10;
});

    addInfoCard(doc, 18, topY + 78, 174, 142, "Opmerkingen");
    y = topY + 92;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    if (opmerkingenLijst.length === 0) {
      doc.text("Geen opmerkingen genoteerd.", 26, y);
    } else {
      opmerkingenLijst.forEach((item) => {
        const statusTekst = `${item.datum} — ${item.status}`;
        const commentTekst = item.comment;

        if (y > 240) {
          addFooter(doc);
          doc.addPage();
          addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`);
const vervolgY = addLeerlingKop(doc, leerling.name, state.className, state.schoolName);
          addInfoCard(doc, 18, vervolgY + 4, 174, 220, "Opmerkingen");
          y = vervolgY + 18;
        }

        doc.setFont("helvetica", "bold");
        doc.text(statusTekst, 26, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        const regels = doc.splitTextToSize(commentTekst, 154);
        doc.text(regels, 26, y);
        y += regels.length * 5 + 6;
      });
    }

    addFooter(doc);
  });

  doc.save(`Alle_leerlingen_${(periode?.name || "periode").replace(/\s+/g, "_")}.pdf`);
}

async function genereerKlasoverzichtPdf() {
  if (!ensureJsPdf()) return;

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "mm", "a4");
        const periode = getActivePeriod();
        const titel = state.pdfTitle || "Opvolging huistaken";
        const { counts, probleemPerLeerling } = berekenStatusTellingenVoorKlas();
        const pieCanvas = maakPieCanvas(counts);

        const topY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
          `${state.className || "-"}`,
          state.schoolName || ""
        ]);

        addInfoCard(doc, 18, topY + 4, 64, 66, "Klasoverzicht");
        doc.addImage(pieCanvas.toDataURL("image/png"), "PNG", 29, topY + 16, 34, 34);

        addInfoCard(doc, 88, topY + 4, 104, 66, "Samenvatting");
        let y = topY + 18;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(32, 49, 77);

        statusDisplayOrder().forEach((status) => {
          tekenLegendaRegel(doc, status, 96, y, false);
          doc.text(`${counts[status] || 0} keer`, 126, y);
          y += 10;
        });

        addInfoCard(doc, 18, topY + 78, 174, 142, "Leerlingen die extra opvolging vragen");
        y = topY + 92;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        if (probleemPerLeerling.length === 0) {
          doc.text("Geen leerlingen boven de ingestelde drempel.", 26, y);
        } else {
          probleemPerLeerling.slice(0, 8).forEach((item, index) => {
            if (y > 240) {
              addFooter(doc);
              doc.addPage();
              const vervolgY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
                "Vervolg klasoverzicht",
                state.schoolName || ""
              ]);
              addInfoCard(doc, 18, vervolgY + 4, 174, 220, "Leerlingen die extra opvolging vragen");
              y = vervolgY + 18;
            }

            doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}. ${item.naam}`, 26, y);
            y += 6;

            doc.setFont("helvetica", "normal");
            doc.text(`te laat: ${item.detail["te laat"]}`, 34, y);
            y += 5;
            doc.text(`onvolledig: ${item.detail["onvolledig"]}`, 34, y);
            y += 5;
            doc.text(`niet in orde: ${item.detail["niet in orde"]}`, 34, y);
            y += 9;
          });
        }

        addFooter(doc);
        doc.save(`Klasoverzicht_${(periode?.name || "periode").replace(/\s+/g, "_")}.pdf`);
        resolve();
      }, 80);
    });
  });
}

function genereerKlasoverzichtPdfZwartWit() {
  if (!ensureJsPdf()) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const periode = getActivePeriod();
  const titel = state.pdfTitle || "Opvolging huistaken";
  const { counts, probleemPerLeerling } = berekenStatusTellingenVoorKlas();
  const pieCanvas = maakPieCanvasZwartWit(counts);

  const topY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
    `${state.className || "-"}`,
    state.schoolName || ""
  ]);

  addInfoCard(doc, 18, topY + 4, 64, 66, "Klasoverzicht");
  doc.addImage(pieCanvas.toDataURL("image/png"), "PNG", 29, topY + 16, 34, 34);

  addInfoCard(doc, 88, topY + 4, 104, 66, "Samenvatting");
  let y = topY + 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(32, 49, 77);

  statusDisplayOrder().forEach((status) => {
    tekenLegendaRegel(doc, status, 96, y, true);
    doc.text(`${counts[status] || 0} keer`, 126, y);
    y += 10;
  });

  addInfoCard(doc, 18, topY + 78, 174, 142, "Leerlingen die extra opvolging vragen");
  y = topY + 92;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  if (probleemPerLeerling.length === 0) {
    doc.text("Geen leerlingen boven de ingestelde drempel.", 26, y);
  } else {
    probleemPerLeerling.forEach((item, index) => {
      if (y > 240) {
        addFooter(doc);
        doc.addPage();
        const vervolgY = addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`, [
          "Vervolg klasoverzicht",
          state.schoolName || ""
        ]);
        addInfoCard(doc, 18, vervolgY + 4, 174, 220, "Leerlingen die extra opvolging vragen");
        y = vervolgY + 18;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${item.naam}`, 26, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.text(`te laat: ${item.detail["te laat"]}`, 34, y);
      y += 5;
      doc.text(`onvolledig: ${item.detail["onvolledig"]}`, 34, y);
      y += 5;
      doc.text(`niet in orde: ${item.detail["niet in orde"]}`, 34, y);
      y += 9;
    });
  }

  addFooter(doc);
  doc.save(`Klasoverzicht_${(periode?.name || "periode").replace(/\s+/g, "_")}.pdf`);
}

function genereerAlleLeerlingenPdfZwartWit() {
  if (!ensureJsPdf()) return;

  const { jsPDF } = window.jspdf;
  const periode = getActivePeriod();
  const titel = state.pdfTitle || "Opvolging huistaken";
  const vandaag = getVandaagIso();

  const actieveLeerlingen = state.leerlingen.filter((leerling) =>
    leerlingIsActiefOpDatum(leerling, vandaag)
  );

  if (!actieveLeerlingen.length) {
    alert("Er zijn geen actieve leerlingen om af te drukken.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");

  actieveLeerlingen.forEach((leerling, index) => {
    if (index !== 0) doc.addPage();

    const { counts, opmerkingenLijst } = berekenStatusTellingenVoorLeerling(leerling.id);
    const pieCanvas = maakPieCanvasZwartWit(counts);

    addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`);
    const topY = addLeerlingKop(doc, leerling.name, state.className, state.schoolName);

    addInfoCard(doc, 18, topY + 4, 64, 66, "Overzicht");
    doc.addImage(pieCanvas.toDataURL("image/png"), "PNG", 29, topY + 16, 34, 34);

    addInfoCard(doc, 88, topY + 4, 104, 66, "Samenvatting");
    let y = topY + 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(32, 49, 77);

    statusDisplayOrder().forEach((status) => {
      tekenLegendaRegel(doc, status, 96, y, true);
      doc.text(`${counts[status] || 0} keer`, 126, y);
      y += 10;
    });

    addInfoCard(doc, 18, topY + 78, 174, 142, "Opmerkingen");
    y = topY + 92;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    if (opmerkingenLijst.length === 0) {
      doc.text("Geen opmerkingen genoteerd.", 26, y);
    } else {
      opmerkingenLijst.forEach((item) => {
        const statusTekst = `${item.datum} — ${item.status}`;
        const commentTekst = item.comment;

        if (y > 240) {
          addFooter(doc);
          doc.addPage();
          addPdfTitleBar(doc, `${titel} - ${periode?.name || ""}`);
          const vervolgY = addLeerlingKop(doc, leerling.name, state.className, state.schoolName);
          addInfoCard(doc, 18, vervolgY + 4, 174, 220, "Opmerkingen");
          y = vervolgY + 18;
        }

        doc.setFont("helvetica", "bold");
        doc.text(statusTekst, 26, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        const regels = doc.splitTextToSize(commentTekst, 154);
        doc.text(regels, 26, y);
        y += regels.length * 5 + 6;
      });
    }

    addFooter(doc);
  });

  doc.save(`Alle_leerlingen_${(periode?.name || "periode").replace(/\s+/g, "_")}.pdf`);
}

function setupPdfKnoppen() {
  document.getElementById("pdfKlasBtn")?.addEventListener("click", async () => {
    await voerPdfActieUit("Klasoverzicht wordt voorbereid...", () => genereerKlasoverzichtPdf());
  });

  document.getElementById("pdfKlasZwartWitBtn")?.addEventListener("click", async () => {
    await voerPdfActieUit("Klasoverzicht wordt voorbereid...", () => genereerKlasoverzichtPdfZwartWit());
  });

  document.getElementById("pdfAlleLeerlingenBtn")?.addEventListener("click", async () => {
    await voerPdfActieUit("Alle leerlingen worden voorbereid...", () => genereerAlleLeerlingenPdf());
  });

  document.getElementById("pdfAlleLeerlingenZwartWitBtn")?.addEventListener("click", async () => {
    await voerPdfActieUit("Alle leerlingen worden voorbereid...", () => genereerAlleLeerlingenPdfZwartWit());
  });
}

// ----------------------
// Init
// ----------------------

document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  setupSchooljaar();
  setupHelpModal();
  setupUitlegPanelen();
  setupInstellingen();
  setupKlaslijst();
  setupLeerlingModal();
  setupUitschrijfModal();
  setupRapportperiodes();
  setupPeriodeEditModal();
  setupKolomKnoppen();
  setupPdfKnoppen();

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    state.currentUserUid = user.uid;

    try {
      await loadFirestoreIntoState();
    } catch (error) {
      console.error("Fout bij laden uit Firestore:", error);
      state.firebaseHydrating = false;
      state.firebaseReady = true;
    }

   const dagInput = document.getElementById("dagKolomDatumInput");
if (dagInput) dagInput.value = "";

renderSchooljaar();
renderHeader();
renderDashboard();
renderKlaslijst();
renderRapportperiodes();
renderRegistratie();
switchView(state.currentView || "dashboard");
  });
});