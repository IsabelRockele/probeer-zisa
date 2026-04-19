// ===== KLASBORD GRAADSKLAS-WEERGAVE =====
// Toont 2 bestaande klasborden naast elkaar met elk een klaslabel (3A/4A/...).
// Elk bord heeft eigen state, eigen Firebase-listener voor live kind-updates.
// Beheer (namen/taken/foto's/bevindingen) gebeurt via het gewone klasbord.html
// dat in een nieuw tabblad opent — hier wordt enkel weergegeven en status-
// tiks doorgezet naar Firestore.

// ── URL-parameters ────────────────────────────────────────────────────────
const params  = new URLSearchParams(window.location.search);
const graadId = params.get('graadid');
const isSmartboard = params.get('modus') === 'smartboard';

// ── SMARTBOARDMODUS: knoppen verbergen, elementen vergroten ──────────────
// Activeert als ?modus=smartboard in de URL staat. Discreet slotje rechts-
// onder om terug te keren. Volledig conform de smartboard-modus van het
// gewone klasbord.
if(isSmartboard){
  // body-class wordt zo vroeg mogelijk gezet zodat CSS al bij eerste render
  // de juiste weergave toont (geen flash-of-unhidden-buttons)
  document.addEventListener('DOMContentLoaded', function(){
    document.body.classList.add('smartboard');
  });
  // Als DOMContentLoaded al voorbij is:
  if(document.readyState !== 'loading') document.body.classList.add('smartboard');
}

window.startSmartboard = function(){
  // Huidige URL + modus=smartboard → herlaadt in smartboard-modus
  const u = new URL(window.location.href);
  u.searchParams.set('modus', 'smartboard');
  window.location.href = u.toString();
};

window.handleSmartboardExit = function(){
  document.getElementById('smartboard-exit-overlay').classList.remove('hidden');
};
window.sluitSmartboardExit = function(){
  document.getElementById('smartboard-exit-overlay').classList.add('hidden');
};
window.exitSmartboard = function(dest){
  if(dest === 'welkom'){
    window.location.href = 'welkomstbord.html';
  } else {
    // Terug naar normale weergave: verwijder modus-param uit URL
    const u = new URL(window.location.href);
    u.searchParams.delete('modus');
    window.location.href = u.toString();
  }
};

// ── DEFAULT_TASKS (identiek aan klasbord.js) ──────────────────────────────
const DEFAULT_TASKS = [
  {id:'lezen',label:'Lezen',icon:'📖'},
  {id:'rekenen',label:'Rekenen',icon:'🔢'},
  {id:'schrijven',label:'Schrijven',icon:'✏️'},
  {id:'spelling',label:'Spelling',icon:'🔤'},
  {id:'tekenen',label:'Tekenen',icon:'🎨'},
  {id:'computer',label:'Computer',icon:'💻'},
  {id:'knippen',label:'Knippen',icon:'✂️'},
  {id:'muziek',label:'Muziek',icon:'🎵'},
  {id:'werkblad',label:'Werkblad',icon:'📄'},
  {id:'project',label:'Project',icon:'🗂️'},
  {id:'werkboek',label:'Werkboek',icon:'📒'},
  {id:'meetkunde',label:'Meetkunde',icon:'📐'},
  {id:'winkeltje',label:'Winkeltje',icon:'🛒'},
  {id:'getallen',label:'Getallen',icon:'🔣'},
  {id:'metendrekenen',label:'Metend rekenen',icon:'📏'}
];
const SMILEYS = ['','😊','🙂','😐','😟'];

// ── Twee bord-slots ───────────────────────────────────────────────────────
const slots = [
  { idx:1, bordid:null, storageKey:null, klaslabel:'', bordnaam:'', state:null, unsubscribe:null },
  { idx:2, bordid:null, storageKey:null, klaslabel:'', bordnaam:'', state:null, unsubscribe:null }
];

// ── Helpers ───────────────────────────────────────────────────────────────
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function displayName(p, state){
  // Als state meegegeven is en showLastname uitstaat → enkel voornaam.
  // Zo volgen we de instelling die de leerkracht in het klasbord zelf zette.
  if(state && !state.showLastname) return p.voornaam;
  return p.voornaam + (p.achternaam ? ' '+p.achternaam : '');
}

function emptyState(){
  return {
    pupils:[], activeTasks:[], progress:{}, customTasks:[],
    pupilTaskOverrides:{}, notes:{}, customIcons:{}, pupilPhotos:{},
    taskLabelOverrides:{}
  };
}

function applyData(slot, data){
  if(!data) return;
  const s = Object.assign(emptyState(), data);
  if(!s.progress || typeof s.progress !== 'object') s.progress = {};
  if(!Array.isArray(s.pupils)) s.pupils = [];
  if(!Array.isArray(s.activeTasks)) s.activeTasks = [];
  if(!Array.isArray(s.customTasks)) s.customTasks = [];
  if(!s.pupilTaskOverrides || typeof s.pupilTaskOverrides !== 'object') s.pupilTaskOverrides = {};
  if(!s.taskLabelOverrides || typeof s.taskLabelOverrides !== 'object') s.taskLabelOverrides = {};
  if(!s.customIcons || typeof s.customIcons !== 'object') s.customIcons = {};
  if(!s.pupilPhotos || typeof s.pupilPhotos !== 'object') s.pupilPhotos = {};
  if(!s.notes || typeof s.notes !== 'object') s.notes = {};
  slot.state = s;
}

function allBaseTasks(state){
  const ov = state.taskLabelOverrides || {};
  return [
    ...DEFAULT_TASKS.map(t => ov[t.id] ? {...t, label:ov[t.id]} : t),
    ...(state.customTasks || [])
  ];
}
function classActiveTasks(state){
  return allBaseTasks(state).filter(t => (state.activeTasks||[]).includes(t.id));
}
function pupilTasks(state, pid){
  const ov = state.pupilTaskOverrides[pid] || {};
  return [
    ...classActiveTasks(state).filter(t => !(ov.removed||[]).includes(t.id)),
    ...(ov.extra||[])
  ];
}
function buildAllTasksForBoard(state){
  const seen = new Set(), tasks = [];
  (state.pupils||[]).forEach(p => {
    pupilTasks(state, p.id).forEach(t => {
      if (!seen.has(t.id)){ seen.add(t.id); tasks.push(t); }
    });
  });
  return tasks;
}
function getStatus(state, pid, tid){
  return (state.progress[pid] && state.progress[pid][tid] && state.progress[pid][tid].status) || 0;
}
function getSmiley(state, pid, tid){
  return (state.progress[pid] && state.progress[pid][tid] && state.progress[pid][tid].smiley) || 0;
}

// ── Render één bord ───────────────────────────────────────────────────────
function renderSlot(slot){
  if(!slot.state) return;
  const state = slot.state;
  const table = document.getElementById('table-'+slot.idx);
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  const stats = document.getElementById('stats-'+slot.idx);

  const tasks = buildAllTasksForBoard(state);
  const pupils = state.pupils || [];

  // Header
  let thHtml = '<tr><th class="gb-corner">Leerling</th>';
  tasks.forEach(t => {
    const iconHtml = state.customIcons[t.id]
      ? '<div class="gb-t-icon-custom" style="background-image:url('+state.customIcons[t.id]+')"></div>'
      : '<span class="gb-t-icon">'+esc(t.icon||'📝')+'</span>';
    thHtml += '<th class="gb-task-th">'+iconHtml+'<div class="gb-t-label">'+esc(t.label||'')+'</div></th>';
  });
  thHtml += '</tr>';
  thead.innerHTML = thHtml;

  // Body
  let bodyHtml = '';
  let klaarTotal = 0, takenTotal = 0;

  pupils.forEach((p, pupilIdx) => {
    const mineTasks = pupilTasks(state, p.id);
    const mineIds = new Set(mineTasks.map(t => t.id));
    let klaarCount = 0;
    mineTasks.forEach(t => { if(getStatus(state, p.id, t.id) === 2) klaarCount++; });
    takenTotal += mineTasks.length;
    klaarTotal += klaarCount;

    const isComplete = mineTasks.length > 0 && klaarCount === mineTasks.length;
    const busyCount  = mineTasks.filter(t => getStatus(state,p.id,t.id)===1).length;

    let dotCls = 'gb-name-dot';
    if(isComplete) dotCls += ' done';
    else if(busyCount>0 || klaarCount>0) dotCls += ' busy';

    const photoHtml = state.pupilPhotos[p.id]
      ? '<img class="gb-name-photo" src="'+state.pupilPhotos[p.id]+'" alt=""/>'
      : '';

    // Notes-knop: gele stijl als er al bevindingen zijn, anders gewoon
    const hasNotes = !!(state.notes && state.notes[p.id]);
    const notesBtnHtml = '<button class="gb-notes-btn'+(hasNotes?' has-notes':'')+'" '
      + 'onclick="event.stopPropagation();openNotesModal('+slot.idx+',\''+p.id+'\')" '
      + 'title="'+(hasNotes?'Opmerking bekijken/bewerken':'Opmerking toevoegen')+'">🔒</button>';

    // Nummer tonen als state.showNumbers aanstaat (respecteer leerkracht-instelling)
    const nummerPrefix = state.showNumbers ? (pupilIdx+1)+'. ' : '';

    let row = '<tr class="gb-row'+(isComplete?' complete':'')+'">';
    row += '<td class="gb-name-td"><div class="gb-name-inner">';
    row += '<span class="'+dotCls+'"></span>';
    row += photoHtml;
    row += '<div class="gb-name-text"><div class="gb-name-voor">'+esc(nummerPrefix+displayName(p, state))+'</div></div>';
    row += notesBtnHtml;
    row += '</div></td>';

    tasks.forEach(t => {
      if(!mineIds.has(t.id)){
        row += '<td class="gb-task-td"><button class="gb-btn hidden-cell" disabled></button></td>';
      } else {
        const st = getStatus(state, p.id, t.id);
        const sm = getSmiley(state, p.id, t.id);
        let content = '';
        if(st === 1) content = '🔄';
        else if(st === 2) content = '✓';
        let cell = '<button class="gb-btn status-'+st+'" onclick="cycleStatus('+slot.idx+',\''+p.id+'\',\''+t.id+'\')">'+content+'</button>';
        if(sm > 0) cell += '<span class="gb-smiley">'+SMILEYS[sm]+'</span>';
        row += '<td class="gb-task-td">'+cell+'</td>';
      }
    });
    row += '</tr>';
    bodyHtml += row;
  });

  if(pupils.length === 0){
    const cols = tasks.length + 1;
    bodyHtml = '<tr><td colspan="'+cols+'" style="padding:40px 20px;text-align:center;color:#9ca3af;font-size:13px;">Geen leerlingen in dit bord. Klik op <strong>⚙️ Beheer</strong> om er toe te voegen.</td></tr>';
  }

  tbody.innerHTML = bodyHtml;
  stats.textContent = klaarTotal + '/' + takenTotal + ' klaar';

  // Pijltjes-status kan veranderd zijn (nieuwe taken → nieuwe scroll-breedte)
  requestAnimationFrame(function(){ updateArrows(slot.idx); });
}

// ── Status cyclen bij leerkracht-tik ──────────────────────────────────────
window.cycleStatus = function(slotIdx, pid, tid){
  const slot = slots[slotIdx-1];
  if(!slot || !slot.state) return;
  const state = slot.state;

  if(!state.progress[pid]) state.progress[pid] = {};
  if(!state.progress[pid][tid]) state.progress[pid][tid] = { status: 0, smiley: 0 };

  const cur = state.progress[pid][tid].status || 0;
  const next = (cur + 1) % 3;
  state.progress[pid][tid].status = next;
  if(next !== 2) state.progress[pid][tid].smiley = 0;

  saveSlot(slot);
  renderSlot(slot);
};

// ── 🔒 NOTES-MODAL (bevindingen per leerling) ────────────────────────────
// Notes worden opgeslagen in state.notes[pid] — identiek aan klasbord.js.
// Zo komen ze ook automatisch mee in het PDF-rapport van dat klasbord.
let _notesEditingSlot = null;
let _notesEditingPid = null;

window.openNotesModal = function(slotIdx, pid){
  const slot = slots[slotIdx-1];
  if(!slot || !slot.state) return;
  const pupil = slot.state.pupils.find(function(p){ return p.id === pid; });
  if(!pupil) return;

  _notesEditingSlot = slot;
  _notesEditingPid  = pid;

  // Klas-badge kleuren op basis van welk bord (1=oranje, 2=blauw)
  const badge = document.getElementById('notes-klas-badge');
  badge.textContent = slot.klaslabel || ('Bord ' + slotIdx);
  badge.classList.remove('kleur-1','kleur-2');
  badge.classList.add('kleur-'+slotIdx);

  document.getElementById('notes-pupil-name').textContent = displayName(pupil, slot.state);
  document.getElementById('notes-input').value = (slot.state.notes && slot.state.notes[pid]) || '';
  document.getElementById('notes-overlay').classList.remove('hidden');
  setTimeout(function(){ document.getElementById('notes-input').focus(); }, 50);
};

window.saveNotes = function(){
  if(!_notesEditingSlot || !_notesEditingPid) return;
  const slot = _notesEditingSlot;
  if(!slot.state.notes) slot.state.notes = {};

  const val = document.getElementById('notes-input').value.trim();
  if(val){
    slot.state.notes[_notesEditingPid] = val;
  } else {
    delete slot.state.notes[_notesEditingPid];
  }

  saveSlot(slot);
  renderSlot(slot);
  closeNotesModal();
};

window.closeNotesModal = function(){
  document.getElementById('notes-overlay').classList.add('hidden');
  _notesEditingSlot = null;
  _notesEditingPid  = null;
};

// ── Opslaan naar Firestore ────────────────────────────────────────────────
function saveSlot(slot){
  if(!slot.storageKey || !slot.state) return;
  try { localStorage.setItem(slot.storageKey, JSON.stringify(slot.state)); } catch(e){}
  if(window.fbSave)       window.fbSave(slot.storageKey, slot.state).catch(function(){});
  if(window.fbSaveShared) window.fbSaveShared(slot.storageKey, slot.state).catch(function(){});

  // Timestamp bijwerken in borden-index zodat de leerkracht ziet dat er iets gebeurd is
  try{
    const all = JSON.parse(localStorage.getItem('borden_v1')||'{}');
    const lijst = all.klasbord || [];
    const bord  = lijst.find(function(b){ return b.id === slot.bordid; });
    if(bord){
      bord.bijgewerkt = Date.now();
      localStorage.setItem('borden_v1', JSON.stringify(all));
      if(window.fbSaveMeta) window.fbSaveMeta(all).catch(function(){});
    }
  }catch(e){}
}

// ── Laden + live listener ─────────────────────────────────────────────────
function loadSlot(slot){
  return new Promise(function(resolve){
    if(!slot.storageKey){ resolve(); return; }

    // 1. localStorage voor snelle eerste render
    try {
      const r = localStorage.getItem(slot.storageKey);
      if(r) applyData(slot, JSON.parse(r));
    } catch(e){}

    // 2. Firestore privé + gedeeld parallel laden
    const prive   = window.fbLoad        ? window.fbLoad(slot.storageKey).catch(function(){return null;}) : Promise.resolve(null);
    const gedeeld = window.fbLoadShared  ? window.fbLoadShared(slot.storageKey).catch(function(){return null;}) : Promise.resolve(null);

    Promise.all([prive, gedeeld]).then(function(results){
      const priveData  = results[0];
      const sharedData = results[1];

      if(priveData) applyData(slot, priveData);

      // Kind-wijzigingen in shared progress winnen van privé progress
      if(sharedData && sharedData.progress && slot.state){
        const merged = Object.assign({}, slot.state.progress);
        Object.keys(sharedData.progress).forEach(function(pid){
          merged[pid] = Object.assign({}, merged[pid]||{}, sharedData.progress[pid]);
        });
        slot.state.progress = merged;
      }

      if(!slot.state) slot.state = emptyState();

      try{ localStorage.setItem(slot.storageKey, JSON.stringify(slot.state)); }catch(e){}
      if(window.fbSaveShared) window.fbSaveShared(slot.storageKey, slot.state).catch(function(){});

      // 3. Realtime listener voor live kind-updates
      if(window.fbListenShared){
        slot.unsubscribe = window.fbListenShared(slot.storageKey, function(liveData){
          if(!liveData || !slot.state) return;
          // State volledig vernieuwen als structuur veranderd is (leerkracht paste
          // taken of namen aan in ander tabblad → dan moet dat hier ook zichtbaar zijn)
          if(liveData.pupils && liveData.activeTasks){
            applyData(slot, liveData);
          } else if(liveData.progress){
            // Enkel progress-update (kind tikte op een taak)
            const merged = Object.assign({}, slot.state.progress);
            Object.keys(liveData.progress).forEach(function(pid){
              merged[pid] = Object.assign({}, merged[pid]||{}, liveData.progress[pid]);
            });
            slot.state.progress = merged;
          }
          try{ localStorage.setItem(slot.storageKey, JSON.stringify(slot.state)); }catch(e){}
          renderSlot(slot);
        });
      }

      renderSlot(slot);
      resolve();
    });
  });
}

// ── Graadsklas-set laden (Firestore: klasbord_shared/graadsklas_{id}) ─────
function loadGraadsklasSet(){
  return new Promise(function(resolve, reject){
    if(!graadId){ reject('Geen graadid in URL.'); return; }

    // localStorage fallback (leerkracht heeft hem net aangemaakt)
    let localData = null;
    try {
      const raw = localStorage.getItem('graadsklas_'+graadId);
      if(raw) localData = JSON.parse(raw);
    } catch(e){}

    const remoteLoad = window.fbLoadShared
      ? window.fbLoadShared('graadsklas_'+graadId).catch(function(){ return null; })
      : Promise.resolve(null);

    remoteLoad.then(function(remoteData){
      const data = remoteData || localData;
      if(!data || !data.bord1 || !data.bord2){
        reject('Graadsklas-set niet gevonden. Maak hem eerst aan via het welkomstbord.');
        return;
      }
      try { localStorage.setItem('graadsklas_'+graadId, JSON.stringify(data)); } catch(e){}
      resolve(data);
    });
  });
}

// ── Scroll-pijltjes per bord ──────────────────────────────────────────────
function getTaskColWidth(){
  const v = getComputedStyle(document.documentElement).getPropertyValue('--col-task');
  return parseInt(v, 10) || 100;
}
window.scrollBord = function(slotIdx, direction){
  const scrollEl = document.getElementById('scroll-'+slotIdx);
  if(!scrollEl) return;
  const step = getTaskColWidth() * 2;
  scrollEl.scrollBy({ left: direction * step, behavior: 'smooth' });
};
function updateArrows(slotIdx){
  const scrollEl = document.getElementById('scroll-'+slotIdx);
  const leftBtn  = document.getElementById('arrow-left-'+slotIdx);
  const rightBtn = document.getElementById('arrow-right-'+slotIdx);
  if(!scrollEl || !leftBtn || !rightBtn) return;

  const atStart  = scrollEl.scrollLeft <= 1;
  const atEnd    = scrollEl.scrollLeft >= (scrollEl.scrollWidth - scrollEl.clientWidth - 1);
  const noScroll = scrollEl.scrollWidth <= scrollEl.clientWidth + 1;

  leftBtn.classList.toggle('disabled',  atStart || noScroll);
  rightBtn.classList.toggle('disabled', atEnd   || noScroll);
}
[1,2].forEach(function(idx){
  const scrollEl = document.getElementById('scroll-'+idx);
  if(scrollEl){
    scrollEl.addEventListener('scroll', function(){ updateArrows(idx); });
  }
});
window.addEventListener('resize', function(){ updateArrows(1); updateArrows(2); });

function isTouchDevice(){
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}
if(isTouchDevice()){
  document.querySelectorAll('.scroll-arrow').forEach(function(btn){ btn.classList.add('touch-hidden'); });
}

// ── Foutscherm ────────────────────────────────────────────────────────────
function toonFout(msg){
  document.getElementById('loading').style.display = 'none';
  document.getElementById('wrap').style.display = 'none';
  document.getElementById('error-msg').textContent = msg || 'De graadsklas-set kon niet geladen worden.';
  document.getElementById('error-screen').classList.add('show');
}

// ── Beheer-knop per bord: opent gewoon klasbord.html in nieuw tabblad ────
function setupBeheerLink(slotIdx){
  const slot = slots[slotIdx-1];
  const link = document.getElementById('beheer-'+slotIdx);
  if(!slot || !link || !slot.bordid) return;
  // Geen view=board → opent direct in instellingen-modus (precies voor beheer)
  link.href = 'klasbord.html?bordid=' + encodeURIComponent(slot.bordid) + '&type=klasbord';
}

// ── PDF-knop per bord: opent klasbord met autopdf=1 ──────────────────────
window.openPDF = function(slotIdx){
  const slot = slots[slotIdx-1];
  if(!slot || !slot.bordid){
    alert('Dit bord is nog niet geladen.');
    return;
  }
  const url = 'klasbord.html?bordid=' + encodeURIComponent(slot.bordid)
            + '&type=klasbord&view=board&autopdf=1';
  window.open(url, '_blank', 'noopener');
};

// ── QR-code voor kindbord-keuzescherm ────────────────────────────────────
function qrKindUrl(){
  const base = window.location.href.replace(/klasbord_graad\.html.*$/,'');
  return base + 'klasbord_kind_graad.html?graadid=' + encodeURIComponent(graadId);
}
window.openQR = function(){
  const modal = document.getElementById('qr-modal');
  const url = qrKindUrl();
  document.getElementById('qr-url-tekst').textContent = url;
  const cv = document.getElementById('qr-canvas');
  cv.innerHTML = '';
  if(typeof QRCode !== 'undefined'){
    new QRCode(cv, { text:url, width:150, height:150, colorDark:'#1e1b4b', colorLight:'#fff', correctLevel:QRCode.CorrectLevel.M });
  } else {
    cv.innerHTML = '<div style="padding:12px;font-size:12px;color:#dc2626;">QR-bibliotheek niet geladen.</div>';
  }
  modal.classList.remove('hidden');
};
window.sluitQR = function(){ document.getElementById('qr-modal').classList.add('hidden'); };
window.kopieerQR = function(){
  const url = qrKindUrl();
  if(navigator.clipboard) navigator.clipboard.writeText(url).then(function(){ alert('Link gekopieerd!'); });
  else prompt('Kopieer:', url);
};
window.printQR = function(){
  const url = qrKindUrl();
  document.getElementById('qr-print-titel').textContent = 'Scan om je klas te kiezen';
  document.getElementById('qr-print-url').textContent = url;
  const pc = document.getElementById('qr-print-canvas');
  pc.innerHTML = '';
  if(typeof QRCode !== 'undefined'){
    new QRCode(pc, { text:url, width:220, height:220, colorDark:'#000', colorLight:'#fff', correctLevel:QRCode.CorrectLevel.M });
  }
  setTimeout(function(){ window.print(); }, 300);
};

// ── TIMER (eenvoudige digitale versie) ───────────────────────────────────
let timerMin = 15, timerRemaining = 0, timerInterval = null, timerPaused = false;

window.toggleTimer = function(){
  const p = document.getElementById('timer-popup');
  p.style.display = p.style.display === 'block' ? 'none' : 'block';
};
window.adjustTime = function(d){
  timerMin = Math.max(1, Math.min(120, timerMin + d));
  document.getElementById('timer-set-display').textContent = timerMin + ':00';
};
window.setTimerPreset = function(m){ timerMin = m; document.getElementById('timer-set-display').textContent = m+':00'; };
window.startTimer = function(){
  timerRemaining = timerMin * 60;
  timerPaused = false;
  document.getElementById('timer-setup').style.display = 'none';
  document.getElementById('timer-running').style.display = '';
  document.getElementById('timer-done').style.display = 'none';
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = setInterval(function(){
    if(timerPaused) return;
    timerRemaining--;
    updateTimerDisplay();
    if(timerRemaining <= 0){
      clearInterval(timerInterval);
      document.getElementById('timer-running').style.display = 'none';
      document.getElementById('timer-done').style.display = '';
    }
  }, 1000);
};
function updateTimerDisplay(){
  const m = Math.floor(timerRemaining / 60);
  const s = timerRemaining % 60;
  document.getElementById('timer-digital').textContent = m + ':' + (s<10?'0':'') + s;
  const pct = (timerRemaining / (timerMin*60)) * 100;
  document.getElementById('timer-progress').style.width = pct + '%';
}
window.pauseResumeTimer = function(){
  timerPaused = !timerPaused;
  document.getElementById('timer-pause-btn').textContent = timerPaused ? '▶ Verder' : '⏸ Pauze';
};
window.resetTimer = function(){
  clearInterval(timerInterval);
  timerRemaining = 0;
  document.getElementById('timer-setup').style.display = '';
  document.getElementById('timer-running').style.display = 'none';
  document.getElementById('timer-done').style.display = 'none';
};

// ── TIMER: verslepen (muis + touch) ──────────────────────────────────────
(function setupTimerDrag(){
  const popup  = document.getElementById('timer-popup');
  const handle = document.getElementById('timer-drag-handle');
  if(!popup || !handle) return;

  let dragging = false, startX = 0, startY = 0, origX = 0, origY = 0;

  function pointerFrom(e){
    if(e.touches && e.touches.length) return { x:e.touches[0].clientX, y:e.touches[0].clientY };
    return { x:e.clientX, y:e.clientY };
  }

  function onDown(e){
    // Niet verslepen als je op de ✕-sluitknop klikt
    if(e.target.tagName === 'BUTTON') return;
    dragging = true;
    const p = pointerFrom(e);
    startX = p.x; startY = p.y;
    const r = popup.getBoundingClientRect();
    origX = r.left; origY = r.top;
    // Van right-based naar left-based zodat we vrij kunnen verslepen
    popup.style.right = 'auto';
    popup.style.left = origX + 'px';
    popup.style.top  = origY + 'px';
    e.preventDefault();
  }

  function onMove(e){
    if(!dragging) return;
    const p = pointerFrom(e);
    const newX = origX + (p.x - startX);
    const newY = origY + (p.y - startY);
    // Binnen viewport houden
    const maxX = window.innerWidth  - popup.offsetWidth  - 5;
    const maxY = window.innerHeight - popup.offsetHeight - 5;
    popup.style.left = Math.max(5, Math.min(maxX, newX)) + 'px';
    popup.style.top  = Math.max(5, Math.min(maxY, newY)) + 'px';
  }

  function onUp(){ dragging = false; }

  handle.addEventListener('mousedown',  onDown);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onUp);
  handle.addEventListener('touchstart',  onDown, {passive:false});
  document.addEventListener('touchmove', onMove, {passive:false});
  document.addEventListener('touchend',  onUp);
})();

// ── INIT ──────────────────────────────────────────────────────────────────
function init(){
  if(!graadId){
    toonFout('Geen graadid in de URL. Open deze pagina via het welkomstbord.');
    return;
  }

  if(typeof window.fbOnReady !== 'function'){ setTimeout(init, 100); return; }

  window.fbOnReady(function(uid){
    if(!uid){
      toonFout('Je bent niet ingelogd. Log eerst in via Spelgenerator PRO.');
      return;
    }

    loadGraadsklasSet().then(function(setData){
      // Slots instellen
      slots[0].bordid     = setData.bord1.bordid;
      slots[0].storageKey = setData.bord1.storageKey || ('klas_'+setData.bord1.bordid);
      slots[0].klaslabel  = setData.bord1.klaslabel || 'Klas 1';
      slots[0].bordnaam   = setData.bord1.bordnaam  || '';

      slots[1].bordid     = setData.bord2.bordid;
      slots[1].storageKey = setData.bord2.storageKey || ('klas_'+setData.bord2.bordid);
      slots[1].klaslabel  = setData.bord2.klaslabel || 'Klas 2';
      slots[1].bordnaam   = setData.bord2.bordnaam  || '';

      // Titel bovenaan
      const titelStukken = [setData.bord1.klaslabel, setData.bord2.klaslabel].filter(Boolean);
      document.getElementById('topbar-title').textContent = titelStukken.length
        ? titelStukken.join(' + ')
        : 'Graadsklas';
      document.getElementById('topbar-sub').textContent = setData.naam || 'Graadsklas-weergave';

      // Labels in bord-headers
      document.getElementById('klaslabel-1').textContent = slots[0].klaslabel;
      document.getElementById('klaslabel-2').textContent = slots[1].klaslabel;
      document.getElementById('bordnaam-1').textContent  = slots[0].bordnaam;
      document.getElementById('bordnaam-2').textContent  = slots[1].bordnaam;

      // PDF-knop labels
      document.getElementById('pdf-lbl-1').textContent = 'PDF ' + slots[0].klaslabel;
      document.getElementById('pdf-lbl-2').textContent = 'PDF ' + slots[1].klaslabel;

      // QR-modal klas-stukken
      document.getElementById('qr-klas-1').textContent = slots[0].klaslabel;
      document.getElementById('qr-klas-2').textContent = slots[1].klaslabel;

      // Beheer-links activeren
      setupBeheerLink(1);
      setupBeheerLink(2);

      // Toon app
      document.getElementById('loading').style.display = 'none';
      document.getElementById('wrap').style.display = '';

      // Laad beide borden parallel
      Promise.all([loadSlot(slots[0]), loadSlot(slots[1])]).then(function(){
        requestAnimationFrame(function(){
          updateArrows(1);
          updateArrows(2);
        });
      });
    }).catch(function(err){
      toonFout(typeof err === 'string' ? err : 'Er ging iets mis bij het laden.');
    });
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
