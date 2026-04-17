const STORAGE_KEY = (function(){
  const params = new URLSearchParams(window.location.search);
  const bordId = params.get('bordid');
  const type = params.get('type') || 'klasbord';
  if(bordId){
    try {
      const all = JSON.parse(localStorage.getItem('borden_v1')||'{}');
      const lijst = all[type] || [];
      const bord = lijst.find(function(b){ return b.id === bordId; });
      if(bord && bord.storageKey) return bord.storageKey;
    } catch{}
    return 'klas_'+bordId;
  }
  return 'taakbord_test_v4';
})();
// Formaat savedClassList: { pupils:[...], savedAt: timestamp, schoolYear: string }
const SMILEYS = ['','😊','🙂','😐','😟'];
const SMILEY_LABELS = ['','Super!','Ging goed','Beetje moeilijk','Te moeilijk'];

const DEFAULT_TASKS = [
  {id:'lezen',label:'Lezen',icon:'📖'},{id:'rekenen',label:'Rekenen',icon:'🔢'},
  {id:'schrijven',label:'Schrijven',icon:'✏️'},{id:'spelling',label:'Spelling',icon:'🔤'},
  {id:'tekenen',label:'Tekenen',icon:'🎨'},{id:'computer',label:'Computer',icon:'💻'},
  {id:'knippen',label:'Knippen',icon:'✂️'},{id:'muziek',label:'Muziek',icon:'🎵'},
  {id:'werkblad',label:'Werkblad',icon:'📄'},{id:'project',label:'Project',icon:'🗂️'},
  {id:'werkboek',label:'Werkboek',icon:'📒'},{id:'meetkunde',label:'Meetkunde',icon:'📐'},
  {id:'winkeltje',label:'Winkeltje',icon:'🛒'},{id:'getallen',label:'Getallen',icon:'🔣'},
  {id:'metendrekenen',label:'Metend rekenen',icon:'📏'},
];
const EMOJIS = [
  '📖','🔢','✏️','🔤','🎨','💻','✂️','🎵','📄','🗂️','📒','📐','🛒','🔣','📏',
  '⭐','🏆','🎯','🔬','📚','🌍','🎭','🏃','🍎','🧩','🎲','🖍️','🌱','💡','🧪','🎸','⚽','🏊','🌈','🖊️','📝','🗒️','🔍','💬','🎓',
];

// STATE
// progress: { pupilId: { taskId: { status:0-2, smiley:0-4 } } }
// notes: { pupilId: string }
// customIcons: { taskId: dataURL } – eigen afbeelding per taak
// pupilPhotos: { pupilId: dataURL } – foto/afbeelding per leerling
let state = { pupils:[], activeTasks:[], progress:{}, customTasks:[], pupilTaskOverrides:{}, notes:{}, showNumbers:false, showLastname:false, showSmileys:false, customIcons:{}, pupilPhotos:{}, taskLabelOverrides:{}, boardSize:"normal" };
let currentMode='board', currentTab='leerlingen';
let selectedEmoji='⭐', ptSelectedEmoji='⭐';
let editingId=null, editingPupilTasksId=null, editingNotesId=null;
let dragSrc=null, bulkOrder='voornaam';

// Smiley popup state
let pendingSmileyPid=null, pendingSmileyTid=null;

function applyStateData(s){
  if(!s) return;
  if(s.pupils&&s.pupils.length&&typeof s.pupils[0]==='string') s.pupils=s.pupils.map(n=>{const p=n.trim().split(' ');return{id:uid(),voornaam:p[0],achternaam:p.slice(1).join(' ')};});
  if(s.progress){
    Object.keys(s.progress).forEach(pid=>{
      const pr=s.progress[pid];
      Object.keys(pr).forEach(tid=>{
        if(typeof pr[tid]==='number') pr[tid]={status:pr[tid],smiley:0};
      });
    });
  }
  state={...state,...s};
  if(!state.customIcons||typeof state.customIcons!=='object') state.customIcons={};
  if(!state.pupilPhotos||typeof state.pupilPhotos!=='object') state.pupilPhotos={};
  if(!state.taskLabelOverrides||typeof state.taskLabelOverrides!=='object') state.taskLabelOverrides={};
  if(!state.boardSize) state.boardSize='normal';
}

var _sharedUnsubscribe = null;

function loadState(){
  if(_sharedUnsubscribe){ try{ _sharedUnsubscribe(); }catch(e){} _sharedUnsubscribe=null; }

  // 1. localStorage eerst (snel, synchron)
  try{
    const r=localStorage.getItem(STORAGE_KEY);
    if(r) applyStateData(JSON.parse(r));
  }catch(e){}

  // 2. Laad privé data (structuur: namen, taken, instellingen) EN gedeelde data (progress)
  //    en merge ze zodat kind-wijzigingen nooit verloren gaan
  const privéLaad = window.fbLoad
    ? window.fbLoad(STORAGE_KEY).catch(function(){ return null; })
    : Promise.resolve(null);

  const gedeeldLaad = window.fbLoadShared
    ? window.fbLoadShared(STORAGE_KEY).catch(function(){ return null; })
    : Promise.resolve(null);

  Promise.all([privéLaad, gedeeldLaad]).then(function(results){
    const privéData   = results[0];
    const gedeeldData = results[1];

    if(privéData){
      applyStateData(privéData);
    }

    // Gedeelde progress (kind-wijzigingen) wint altijd van privé progress
    if(gedeeldData && gedeeldData.progress){
      const merged = Object.assign({}, state.progress);
      Object.keys(gedeeldData.progress).forEach(function(pid){
        merged[pid] = Object.assign({}, merged[pid]||{}, gedeeldData.progress[pid]);
      });
      state.progress = merged;
    }

    try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }catch(e){}

    // Zorg dat gedeeld bord ook up-to-date is met de volledige state
    if(window.fbSaveShared) window.fbSaveShared(STORAGE_KEY, state).catch(console.warn);

    renderShell();
  });

  // 3. Realtime listener: vangt live kind-wijzigingen op
  if(window.fbListenShared){
    _sharedUnsubscribe = window.fbListenShared(STORAGE_KEY, function(sharedData){
      if(!sharedData || !sharedData.progress) return;
      const merged = Object.assign({}, state.progress);
      Object.keys(sharedData.progress).forEach(function(pid){
        merged[pid] = Object.assign({}, merged[pid]||{}, sharedData.progress[pid]);
      });
      state.progress = merged;
      try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }catch(e){}
      renderBoard();
    });
  }
}
function saveState(){
  // Lokaal opslaan als fallback
  try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }catch(e){}
  // Firestore opslaan
  if(window.fbSave) window.fbSave(STORAGE_KEY, state).catch(console.warn);
  if(window.fbSaveShared) window.fbSaveShared(STORAGE_KEY, state).catch(console.warn);
  // Timestamp bijwerken in borden-index
  try{
    const params = new URLSearchParams(window.location.search);
    const bordId = params.get('bordid');
    const type = params.get('type')||'klasbord';
    if(bordId){
      const all = JSON.parse(localStorage.getItem('borden_v1')||'{}');
      const lijst = all[type]||[];
      const bord = lijst.find(function(b){ return b.id===bordId; });
      if(bord){
        bord.bijgewerkt=Date.now();
        localStorage.setItem('borden_v1',JSON.stringify(all));
        // Update ook in Firestore meta
        if(window.fbSaveMeta) window.fbSaveMeta(all).catch(console.warn);
      }
    }
  }catch(e){}
}

function uid(){ return '_'+Math.random().toString(36).slice(2)+Date.now(); }

// TASK HELPERS
function allBaseTasks(){
  const overrides=state.taskLabelOverrides||{};
  const defaults=DEFAULT_TASKS.map(t=>overrides[t.id]?{...t,label:overrides[t.id]}:t);
  return [...defaults,...state.customTasks];
}
function classActiveTasks(){ return allBaseTasks().filter(t=>state.activeTasks.includes(t.id)); }
function pupilTasks(pid){
  const ov=state.pupilTaskOverrides[pid]||{};
  const removed=ov.removed||[], extra=ov.extra||[];
  return [...classActiveTasks().filter(t=>!removed.includes(t.id)),...extra];
}
function getEntry(pid,tid){ return(state.progress[pid]||{})[tid]||{status:0,smiley:0}; }
function getStatus(pid,tid){ return getEntry(pid,tid).status; }
function getSmiley(pid,tid){ return getEntry(pid,tid).smiley; }
function isPupilComplete(pid){ const t=pupilTasks(pid); if(!t.length) return false; return t.every(x=>getStatus(pid,x.id)===2); }
function pupilStats(pid){
  const t=pupilTasks(pid),pr=state.progress[pid]||{};
  return{done:t.filter(x=>(pr[x.id]?.status||0)===2).length,busy:t.filter(x=>(pr[x.id]?.status||0)===1).length,total:t.length};
}
function hasOverrides(pid){ const ov=state.pupilTaskOverrides[pid]||{}; return(ov.removed?.length||0)+(ov.extra?.length||0)>0; }

// Undo state
let lastAction = null;

function cycleStatus(pid,tid){
  if(!state.progress[pid]) state.progress[pid]={};
  if(!state.progress[pid][tid]) state.progress[pid][tid]={status:0,smiley:0};
  const cur=state.progress[pid][tid].status;
  const next=(cur+1)%3;
  // Bewaar voor undo
  lastAction = { type:'status', pid, tid, prevStatus: cur, prevSmiley: state.progress[pid][tid].smiley||0 };
  state.progress[pid][tid].status=next;
  // Smiley wissen als taak niet meer klaar is
  if(next !== 2) state.progress[pid][tid].smiley = 0;
  const tasks=pupilTasks(pid);
  const wasDone=tasks.every(t=>t.id===tid?cur===2:getStatus(pid,t.id)===2);
  if(isPupilComplete(pid)&&!wasDone){ const p=state.pupils.find(x=>x.id===pid); if(p) setTimeout(()=>showCelebration(displayName(p)),80); }
  saveState(); renderBoard();
  showUndoBtn();
  if(next===2){ openSmileyPopup(pid,tid); }
}

function undoLastAction(){
  if(!lastAction) return;
  if(lastAction.type==='status'){
    const {pid,tid,prevStatus,prevSmiley}=lastAction;
    if(!state.progress[pid]) state.progress[pid]={};
    state.progress[pid][tid]={status:prevStatus,smiley:prevSmiley};
    saveState(); renderBoard();
  }
  lastAction=null;
  hideUndoBtn();
}

function showUndoBtn(){
  const btn=document.getElementById('btn-undo');
  if(btn) btn.classList.remove('hidden');
  // Auto-verberg na 8 seconden
  clearTimeout(window._undoTimer);
  window._undoTimer=setTimeout(()=>{ hideUndoBtn(); lastAction=null; },8000);
}
function hideUndoBtn(){
  const btn=document.getElementById('btn-undo');
  if(btn) btn.classList.add('hidden');
}

function setSmiley(val){
  if(pendingSmileyPid&&pendingSmileyTid){
    if(!state.progress[pendingSmileyPid]) state.progress[pendingSmileyPid]={};
    if(!state.progress[pendingSmileyPid][pendingSmileyTid]) state.progress[pendingSmileyPid][pendingSmileyTid]={status:2,smiley:0};
    state.progress[pendingSmileyPid][pendingSmileyTid].smiley=val;
    saveState(); renderBoard();
  }
  closeSmileyPopup();
}

function openSmileyPopup(pid,tid){
  pendingSmileyPid=pid; pendingSmileyTid=tid;
  const p=state.pupils.find(x=>x.id===pid);
  const t=pupilTasks(pid).find(x=>x.id===tid);
  if(p&&t) document.getElementById('sp-title').textContent=`${displayName(p)}: ${t.icon} ${t.label}`;
  const pop=document.getElementById('smiley-popup');
  pop.classList.remove('hidden');
  // Center popup
  pop.style.top='50%'; pop.style.left='50%';
  pop.style.transform='translate(-50%,-50%)';
}
function closeSmileyPopup(){ document.getElementById('smiley-popup').classList.add('hidden'); pendingSmileyPid=null; pendingSmileyTid=null; }

function resetAll(){ state.progress={}; saveState(); renderBoard(); }

// NAME HELPERS
function displayName(p){ if(state.showLastname&&p.achternaam) return p.voornaam+' '+p.achternaam; return p.voornaam; }
function sortKey(p){ const a=p.achternaam?p.achternaam.toLowerCase():''; return a?a+' '+p.voornaam.toLowerCase():p.voornaam.toLowerCase(); }

// PUPILS
function parseName(str){
  const parts=str.trim().split(/\s+/); if(!parts[0]) return null;
  if(parts.length===1) return{voornaam:parts[0],achternaam:''};
  if(bulkOrder==='achternaam') return{voornaam:parts[parts.length-1],achternaam:parts.slice(0,parts.length-1).join(' ')};
  return{voornaam:parts[0],achternaam:parts.slice(1).join(' ')};
}
function setOrder(o){bulkOrder=o;var bv=document.getElementById('order-btn-voor');var ba=document.getElementById('order-btn-ach');if(bv)bv.classList.toggle('active',o==='voornaam');if(ba)ba.classList.toggle('active',o==='achternaam');}

function addPupil(){
  const v=document.getElementById('input-voornaam').value.trim(),a=document.getElementById('input-achternaam').value.trim();
  if(!v){document.getElementById('input-voornaam').focus();return;}
  if(state.pupils.some(p=>p.voornaam.toLowerCase()===v.toLowerCase()&&(p.achternaam||'').toLowerCase()===a.toLowerCase())){alert(`"${v}${a?' '+a:''}" staat al in de lijst.`);return;}
  state.pupils.push({id:uid(),voornaam:v,achternaam:a});
  document.getElementById('input-voornaam').value=''; document.getElementById('input-achternaam').value='';
  document.getElementById('input-voornaam').focus();
  saveState(); renderPupilList(); renderBoard();
}
function bulkAdd(){
  const lines=document.getElementById('bulk-input').value.split('\n').map(s=>s.trim()).filter(Boolean);
  let added=0;
  lines.forEach(line=>{const parsed=parseName(line);if(!parsed)return;if(!state.pupils.some(p=>p.voornaam.toLowerCase()===parsed.voornaam.toLowerCase()&&(p.achternaam||'').toLowerCase()===parsed.achternaam.toLowerCase())){state.pupils.push({id:uid(),...parsed});added++;}});
  document.getElementById('bulk-input').value='';
  if(!added){alert('Geen nieuwe namen gevonden.');return;}
  saveState(); renderPupilList(); renderBoard();
}
function bulkReplace(){
  const lines=document.getElementById('bulk-input').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const parsed=lines.map(parseName).filter(Boolean); if(!parsed.length) return;
  confirmAction('custom',`${state.pupils.length} leerlingen vervangen door ${parsed.length} nieuwe namen?`,()=>{
    const newPupils=parsed.map(p=>({id:uid(),...p})),newProg={},newOv={},newNotes={};
    newPupils.forEach(np=>{const old=state.pupils.find(op=>op.voornaam.toLowerCase()===np.voornaam.toLowerCase()&&(op.achternaam||'').toLowerCase()===np.achternaam.toLowerCase());if(old){if(state.progress[old.id])newProg[np.id]=state.progress[old.id];if(state.pupilTaskOverrides[old.id])newOv[np.id]=state.pupilTaskOverrides[old.id];if(state.notes[old.id])newNotes[np.id]=state.notes[old.id];}});
    state.pupils=newPupils;state.progress=newProg;state.pupilTaskOverrides=newOv;state.notes=newNotes;
    document.getElementById('bulk-input').value='';
    saveState(); renderPupilList(); renderBoard();
  });
}
function removePupil(id){ state.pupils=state.pupils.filter(p=>p.id!==id);delete state.progress[id];delete state.pupilTaskOverrides[id];delete state.notes[id];saveState();renderPupilList();renderBoard(); }
function sortAlpha(){ state.pupils.sort((a,b)=>sortKey(a).localeCompare(sortKey(b),'nl'));saveState();renderPupilList();renderBoard(); }
function toggleNumbers(){ state.showNumbers=document.getElementById('toggle-numbers').checked;saveState();renderPupilList();renderBoard(); }
function toggleLastname(){ state.showLastname=document.getElementById('toggle-lastname').checked;saveState();renderPupilList();renderBoard(); }
function toggleSmileys(){ state.showSmileys=document.getElementById('toggle-smileys').checked;saveState();renderBoard(); }
function insertAfter(idx){ const v=(prompt('Voornaam:')||'').trim();if(!v)return;const a=(prompt('Achternaam (leeg = geen):')||'').trim();if(state.pupils.some(p=>p.voornaam.toLowerCase()===v.toLowerCase()&&(p.achternaam||'').toLowerCase()===a.toLowerCase())){alert('Naam bestaat al.');return;}state.pupils.splice(idx+1,0,{id:uid(),voornaam:v,achternaam:a});saveState();renderPupilList();renderBoard(); }
function startEdit(id){ editingId=id;const p=state.pupils.find(x=>x.id===id);if(!p)return;document.getElementById('edit-voornaam').value=p.voornaam;document.getElementById('edit-achternaam').value=p.achternaam||'';document.getElementById('edit-overlay').classList.remove('hidden');setTimeout(()=>document.getElementById('edit-voornaam').select(),50); }
function saveEdit(){ const v=document.getElementById('edit-voornaam').value.trim(),a=document.getElementById('edit-achternaam').value.trim();if(!v){document.getElementById('edit-voornaam').focus();return;}const idx=state.pupils.findIndex(p=>p.id===editingId);if(idx>=0){state.pupils[idx].voornaam=v;state.pupils[idx].achternaam=a;}closeEdit();saveState();renderPupilList();renderBoard(); }
function closeEdit(){ document.getElementById('edit-overlay').classList.add('hidden');editingId=null; }

// NOTES
function openNotesModal(pid){ editingNotesId=pid;const p=state.pupils.find(x=>x.id===pid);if(!p)return;document.getElementById('notes-title').textContent=`🔒 Bevindingen: ${displayName(p)}`;document.getElementById('notes-input').value=state.notes[pid]||'';document.getElementById('notes-overlay').classList.remove('hidden');setTimeout(()=>document.getElementById('notes-input').focus(),50); }
function saveNotes(){ if(!editingNotesId)return;const val=document.getElementById('notes-input').value.trim();if(val) state.notes[editingNotesId]=val; else delete state.notes[editingNotesId];closeNotesModal();saveState();renderPupilList();renderBoard(); }
function closeNotesModal(){ document.getElementById('notes-overlay').classList.add('hidden');editingNotesId=null; }

// PER-PUPIL TASKS
function openPupilTasksModal(pid){ editingPupilTasksId=pid;const p=state.pupils.find(x=>x.id===pid);if(!p)return;document.getElementById('pt-title').textContent=`Taken voor ${displayName(p)}`;document.getElementById('pupil-tasks-overlay').classList.remove('hidden');renderPupilTasksModal(); }
function closePupilTasksModal(){ document.getElementById('pupil-tasks-overlay').classList.add('hidden');editingPupilTasksId=null;renderPupilList();renderBoard(); }
function renderPupilTasksModal(){
  const pid=editingPupilTasksId,ov=state.pupilTaskOverrides[pid]||{},removed=ov.removed||[],extra=ov.extra||[];
  document.getElementById('pt-class-chips').innerHTML=classActiveTasks().map(t=>{const r=removed.includes(t.id);return`<div class="task-chip ${r?'removed':'active'}" onclick="togglePupilClassTask('${pid}','${t.id}')">${t.icon} ${esc(t.label)}</div>`;}).join('');
  document.getElementById('pt-extra-chips').innerHTML=extra.length?extra.map(t=>`<div class="task-chip extra">${t.icon} ${esc(t.label)} <button class="remove-chip" onclick="removePupilExtraTask('${pid}','${t.id}')">✕</button></div>`).join(''):'<span style="font-size:12px;color:#a0aec0">Nog geen extra taken</span>';
  document.getElementById('pt-emoji-picker').innerHTML=EMOJIS.slice(0,20).map(e=>`<button class="emoji-btn ${e===ptSelectedEmoji?'selected':''}" onclick="setPtEmoji('${e}')">${e}</button>`).join('');
}
function setPtEmoji(e){ ptSelectedEmoji=e;renderPupilTasksModal(); }
function togglePupilClassTask(pid,tid){ if(!state.pupilTaskOverrides[pid])state.pupilTaskOverrides[pid]={};const ov=state.pupilTaskOverrides[pid];if(!ov.removed)ov.removed=[];if(ov.removed.includes(tid))ov.removed=ov.removed.filter(x=>x!==tid);else{ov.removed.push(tid);if(state.progress[pid])delete state.progress[pid][tid];}saveState();renderPupilTasksModal(); }
function addPupilTask(){ const label=document.getElementById('pt-task-input').value.trim();if(!label)return;if(!state.pupilTaskOverrides[editingPupilTasksId])state.pupilTaskOverrides[editingPupilTasksId]={};const ov=state.pupilTaskOverrides[editingPupilTasksId];if(!ov.extra)ov.extra=[];ov.extra.push({id:'pe_'+Date.now(),label,icon:ptSelectedEmoji});document.getElementById('pt-task-input').value='';saveState();renderPupilTasksModal(); }
function removePupilExtraTask(pid,tid){ const ov=state.pupilTaskOverrides[pid];if(!ov?.extra)return;ov.extra=ov.extra.filter(t=>t.id!==tid);if(state.progress[pid])delete state.progress[pid][tid];saveState();renderPupilTasksModal(); }

// TASKS
function toggleTask(id){ state.activeTasks=state.activeTasks.includes(id)?state.activeTasks.filter(t=>t!==id):[...state.activeTasks,id];saveState();renderTaskSettings();renderBoard(); }
function addCustomTask(){ const inp=document.getElementById('input-task'),label=inp.value.trim();if(!label)return;const id='c_'+Date.now();state.customTasks.push({id,label,icon:selectedEmoji});state.activeTasks.push(id);inp.value='';saveState();renderTaskSettings();renderBoard(); }
function removeCustomTask(id){ state.customTasks=state.customTasks.filter(t=>t.id!==id);state.activeTasks=state.activeTasks.filter(t=>t!==id);saveState();renderTaskSettings();renderBoard(); }

// Taaknaam hernoemen (werkt voor zowel standaard als eigen taken)
let renamingTaskId=null;
function openTaskRenameModal(taskId, currentLabel){
  renamingTaskId=taskId;
  document.getElementById('rename-task-input').value=currentLabel;
  document.getElementById('rename-task-overlay').classList.remove('hidden');
  setTimeout(()=>{ const inp=document.getElementById('rename-task-input'); inp.focus(); inp.select(); },50);
}
function saveTaskRename(){
  const newLabel=document.getElementById('rename-task-input').value.trim();
  if(!newLabel||!renamingTaskId) return;
  // Zoek in customTasks
  const ct=state.customTasks.find(t=>t.id===renamingTaskId);
  if(ct){ ct.label=newLabel; }
  else {
    // Standaard taak: sla de naam-override op
    if(!state.taskLabelOverrides) state.taskLabelOverrides={};
    state.taskLabelOverrides[renamingTaskId]=newLabel;
  }
  saveState();
  closeTaskRename();
  renderTaskSettings();
  renderBoard();
}
function closeTaskRename(){
  document.getElementById('rename-task-overlay').classList.add('hidden');
  renamingTaskId=null;
}

// EXPORT / IMPORT / KLASLIJST
function exportData(){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  a.download='klasbord-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  // Sla tijdstip laatste backup op
  localStorage.setItem('last_export_'+STORAGE_KEY, Date.now());
  hideBackupReminder();
}
function importData(e){ const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(!d.pupils){alert('Ongeldig bestand.');return;}confirmAction('custom',`Bord vervangen door backup van ${f.name}?`,()=>{state={...state,...d};saveState();renderShell();});}catch{alert('Kon bestand niet lezen.');}};r.readAsText(f);e.target.value=''; }
function saveClassList(){ const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({pupils:state.pupils},null,2)],{type:'application/json'}));a.download='klaslijst-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href); }
let _loadNames=null;
function loadClassList(e){ const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result),names=d.pupils||d;if(!Array.isArray(names)){alert('Ongeldig bestand.');return;}_loadNames=names.map(n=>typeof n==='string'?{id:uid(),...parseName(n)}:n.id?n:{id:uid(),...n});confirmAction('classload',`${_loadNames.length} namen gevonden in ${f.name}.`);}catch{alert('Kon bestand niet lezen.');}};r.readAsText(f);e.target.value=''; }
function loadClassListAction(replace){ if(!_loadNames)return;if(replace){const np={},no={},nn={};_loadNames.forEach(n=>{const old=state.pupils.find(op=>op.voornaam.toLowerCase()===n.voornaam.toLowerCase()&&(op.achternaam||'').toLowerCase()===(n.achternaam||'').toLowerCase());if(old){if(state.progress[old.id])np[n.id]=state.progress[old.id];if(state.pupilTaskOverrides[old.id])no[n.id]=state.pupilTaskOverrides[old.id];if(state.notes[old.id])nn[n.id]=state.notes[old.id];}});state.pupils=_loadNames;state.progress=np;state.pupilTaskOverrides=no;state.notes=nn;}else{_loadNames.forEach(n=>{if(!state.pupils.some(p=>p.voornaam.toLowerCase()===n.voornaam.toLowerCase()&&(p.achternaam||'').toLowerCase()===(n.achternaam||'').toLowerCase()))state.pupils.push(n);});}saveState();renderPupilList();renderBoard();closeConfirm(); }



function openBackupModal(){ document.getElementById('backup-modal').classList.remove('hidden'); }
function closeBM(){ document.getElementById('backup-modal').classList.add('hidden'); }

function openNewSchoolYear(){
  document.getElementById('new-school-year-modal').classList.remove('hidden');
}
function closeNewSchoolYear(){
  document.getElementById('new-school-year-modal').classList.add('hidden');
}
function doNewSchoolYear(){
  const keepTasks    = document.getElementById('nsy-keep-tasks').checked;
  const keepIcons    = document.getElementById('nsy-keep-icons').checked;
  const wipePupils   = document.getElementById('nsy-wipe-pupils').checked;
  const wipeProgress = document.getElementById('nsy-wipe-progress').checked;
  if(!wipePupils && !wipeProgress){
    alert('Selecteer minstens één item om te wissen.');
    return;
  }
  if(wipePupils){ state.pupils=[];state.notes={};state.pupilTaskOverrides={};state.pupilPhotos={}; }
  if(wipeProgress){ state.progress={}; }
  if(!keepTasks){ state.customTasks=[];state.activeTasks=[];state.taskLabelOverrides={}; }
  if(!keepIcons){ state.customIcons={}; }
  saveState();
  closeNewSchoolYear();
  renderPupilList();
  renderBoard();
  const wiped=[];
  if(wipePupils) wiped.push('leerlingen');
  if(wipeProgress) wiped.push('voortgang');
  if(!keepTasks) wiped.push('taken');
  if(!keepIcons) wiped.push('afbeeldingen');
  showToast('🎒 Klaar voor nieuwe klas! Gewist: '+wiped.join(', '));
}


function renderShell(){
  const isB = currentMode === 'board';
  const isS = currentMode === 'settings';

  // Bordnaam
  const bordNaam = getBordNaam();
  const boardTitle = document.getElementById('board-naam-label');
  if(boardTitle) boardTitle.textContent = bordNaam || '';

  // Topbar verborgen — zijbalk doet de navigatie
  const topbar = document.getElementById('topbar');
  if(topbar) topbar.style.display = 'none';

  // Settings-wrap tonen/verbergen
  const settingsWrap = document.getElementById('settings-wrap');
  if(settingsWrap){
    if(isS){
      settingsWrap.classList.add('visible');
      settingsWrap.classList.remove('hidden');
    } else {
      settingsWrap.classList.remove('visible');
      settingsWrap.classList.add('hidden');
    }
  }

  // Board-wrap tonen/verbergen
  const boardWrap = document.getElementById('board-wrap');
  if(boardWrap){
    if(isB){
      boardWrap.classList.add('visible');
      boardWrap.classList.remove('hidden');
    } else {
      boardWrap.classList.remove('visible');
      boardWrap.classList.add('hidden');
    }
  }

  const btnReset = document.getElementById('btn-reset');
  if(btnReset) btnReset.classList.toggle('hidden', !isB);

  // body class voor scroll-pijlen zichtbaarheid
  document.body.classList.toggle('board-mode', isB);

  if(isS) renderSettings();
  else renderBoard();
}


// ── BIBLIOTHEEK (overnemen uit ander bord) ───────────────────────────────
function openLaadUitBibliotheek(){
  const select = document.getElementById('bib-bronbord');
  if(!select) return;
  select.innerHTML = '<option value="">Kies een bord...</option>';
  try {
    const all = JSON.parse(localStorage.getItem('borden_v1')||'{}');
    const huidigBordId = new URLSearchParams(window.location.search).get('bordid');
    let n = 0;
    Object.keys(all).forEach(function(type){
      (all[type]||[]).forEach(function(bord){
        if(bord.id === huidigBordId) return;
        const opt = document.createElement('option');
        opt.value = 'klas_' + bord.id;
        opt.textContent = (bord.naam||'Naamloos') + ' (' + type + ')';
        select.appendChild(opt);
        n++;
      });
    });
    if(n === 0) select.innerHTML = '<option value="">Geen andere borden gevonden</option>';
  } catch(e){
    select.innerHTML = '<option value="">Fout bij laden</option>';
  }
  document.getElementById('bibliotheek-laden-modal').classList.remove('hidden');
}

function laadUitBibliotheek(){
  const select = document.getElementById('bib-bronbord');
  const bronKey = select ? select.value : '';
  if(!bronKey){ showToast('Kies eerst een bronbord.'); return; }

  // Probeer eerst localStorage, dan Firebase
  let bronData = null;
  try { bronData = JSON.parse(localStorage.getItem(bronKey)||'null'); } catch(e){}

  if(bronData){
    _verwerkBibliotheekData(bronData);
  } else if(window.fbLoad){
    showToast('Bezig met laden...');
    window.fbLoad(bronKey).then(function(data){
      if(!data){ showToast('Bord niet gevonden.'); return; }
      _verwerkBibliotheekData(data);
    }).catch(function(){ showToast('Kon bord niet laden.'); });
  } else {
    showToast('Bord niet gevonden.');
  }
}

function _verwerkBibliotheekData(bronData){
  if(document.getElementById('bib-load-namen').checked && bronData.pupils && bronData.pupils.length){
    state.pupils = bronData.pupils;
    if(bronData.pupilPhotos) state.pupilPhotos = Object.assign({}, state.pupilPhotos||{}, bronData.pupilPhotos);
  }
  if(document.getElementById('bib-load-taken').checked){
    if(bronData.customTasks && bronData.customTasks.length) state.customTasks = bronData.customTasks;
    if(bronData.taskLabelOverrides) state.taskLabelOverrides = Object.assign({}, state.taskLabelOverrides||{}, bronData.taskLabelOverrides);
  }
  if(document.getElementById('bib-load-iconen').checked && bronData.customIcons){
    state.customIcons = Object.assign({}, state.customIcons||{}, bronData.customIcons);
  }
  saveState();
  document.getElementById('bibliotheek-laden-modal').classList.add('hidden');
  currentMode = 'settings';
  renderShell();
  showToast('✅ Gegevens overgenomen! Stel nu je bord samen via Beheer aanpassen.');
}

function openQrModal(){
  const modal = document.getElementById('qr-modal');
  if(!modal) return;
  // Bouw de QR URL: huidige URL maar met rol=kind
  const params = new URLSearchParams(window.location.search);
  params.set('rol', 'kind');
  params.delete('modus');
  const url = window.location.origin + window.location.pathname.replace('klasbord.html','klasbord_kind.html') + '?' + params.toString();
  
  // Toon URL
  const urlEl = document.getElementById('qr-url-text');
  if(urlEl) urlEl.textContent = url;
  
  // Genereer QR via qrcodejs
  const container = document.getElementById('qr-code-container');
  if(container){
    container.innerHTML = '';
    new QRCode(container, {
      text: url,
      width: 240,
      height: 240,
      colorDark: '#1e3a8a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }
  
  modal.classList.remove('hidden');
}

function toggleMeerOpties(){
  var menu = document.getElementById('meer-opties-menu');
  if(!menu) return;
  var open = menu.style.display !== 'none';
  menu.style.display = open ? 'none' : 'block';
}
function closeMeerOpties(){
  var menu = document.getElementById('meer-opties-menu');
  if(menu) menu.style.display = 'none';
}
// Sluit dropdown bij klik buiten
document.addEventListener('click', function(e){
  var wrap = document.querySelector('.meer-opties-wrap');
  if(wrap && !wrap.contains(e.target)) closeMeerOpties();
});

function scrollBoardRight(){
  var s=document.getElementById('board-scroll');
  if(s){ s.scrollBy({left:240,behavior:'smooth'}); setTimeout(updateScrollArrow,300); }
}
function scrollBoardLeft(){
  var s=document.getElementById('board-scroll');
  if(s){ s.scrollBy({left:-240,behavior:'smooth'}); setTimeout(updateScrollArrow,300); }
}
function updateScrollArrow(){
  var s=document.getElementById('board-scroll');
  var ar=document.getElementById('scroll-right-arrow');
  var al=document.getElementById('scroll-left-arrow');
  if(!s) return;
  var canRight=s.scrollWidth>s.clientWidth+4 && s.scrollLeft+s.clientWidth<s.scrollWidth-4;
  var canLeft=s.scrollLeft>4;
  if(ar) ar.classList.toggle('hidden', !canRight);
  if(al) al.classList.toggle('hidden', !canLeft);
}
function getBordNaam(){
  try {
    const params = new URLSearchParams(window.location.search);
    const bordId = params.get('bordid');
    const type = params.get('type') || 'klasbord';
    if(!bordId) return '';
    const all = JSON.parse(localStorage.getItem('borden_v1')||'{}');
    const bord = (all[type]||[]).find(function(b){ return b.id === bordId; });
    return bord ? bord.naam : '';
  } catch { return ''; }
}

function openSmartboardVenster(){
  // Bouw de smartboard-URL op basis van de huidige URL
  const p = new URLSearchParams(window.location.search);
  p.set('modus','smartboard');
  p.delete('rol'); // zeker geen kind-rol meegeven
  const url = window.location.pathname + '?' + p.toString();
  window.open(url, '_blank');
}

function switchTab(tab){ currentTab=tab; renderSettings(); }
function toggleMode(){ currentMode=currentMode==='board'?'settings':'board';renderShell(); }
function closeSettings(){ currentMode='board'; renderShell(); }

// CONFIRM
let confirmCallback=null;
function confirmAction(type,msg,cb){ confirmCallback=cb||null;document.getElementById('confirm-title').textContent=type==='reset'?'Voortgang wissen':type==='classload'?'Klaslijst laden':'Bevestigen';document.getElementById('confirm-text').textContent=msg||'';const btns=document.getElementById('confirm-btns');if(type==='reset')btns.innerHTML='<button class="btn btn-secondary" onclick="closeConfirm()">Annuleren</button><button class="btn btn-danger" onclick="resetAll();closeConfirm()">Wissen</button>';else if(type==='classload')btns.innerHTML='<button class="btn btn-secondary" onclick="closeConfirm()">Annuleren</button><button class="btn btn-secondary" onclick="loadClassListAction(false)">➕ Samenvoegen</button><button class="btn btn-primary" onclick="loadClassListAction(true)">🔄 Vervangen</button>';else btns.innerHTML='<button class="btn btn-secondary" onclick="closeConfirm()">Annuleren</button><button class="btn btn-primary" onclick="confirmCallback&&confirmCallback();closeConfirm()">Doorgaan</button>';document.getElementById('confirm-overlay').classList.remove('hidden'); }
function closeConfirm(){ document.getElementById('confirm-overlay').classList.add('hidden'); }
function showCelebration(n){ document.getElementById('celeb-name').textContent=n;document.getElementById('celebration').classList.add('show'); }
function closeCelebration(){ document.getElementById('celebration').classList.remove('show'); }

// PDF
function openPdfModal(){ const today=new Date().toISOString().slice(0,10);if(!document.getElementById('pdf-date-from').value)document.getElementById('pdf-date-from').value=today;if(!document.getElementById('pdf-date-to').value)document.getElementById('pdf-date-to').value=today;document.getElementById('pdf-overlay').classList.remove('hidden'); }
function fmtDate(str){ if(!str)return'';try{return new Date(str).toLocaleDateString('nl-BE',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return str;} }

// Strip emoji en niet-latin tekens voor PDF (jsPDF ondersteunt geen emoji)
function stripEmoji(str){
  if(!str) return '';
  // Verwijder alles buiten het standaard latin bereik
  return str.replace(/[^\u0000-\u00FF\u0100-\u017F\u0180-\u024F\u2013\u2014\u2019\u201C\u201D\u2026\u00B7]/g, '').replace(/\s+/g,' ').trim();
}


function generateAndPrint(mode){
  var jspdfLib = window.jspdf;
  if(!jspdfLib || !jspdfLib.jsPDF){ alert('PDF-bibliotheek niet geladen. Ververs de pagina.'); return; }
  var jsPDF = jspdfLib.jsPDF;

  var periodName = document.getElementById('pdf-period-name').value.trim();
  var dateFrom = document.getElementById('pdf-date-from').value;
  var dateTo = document.getElementById('pdf-date-to').value;
  var pl = [periodName];
  if(dateFrom||dateTo) pl.push(fmtDate(dateFrom)+(dateTo&&dateTo!==dateFrom?' - '+fmtDate(dateTo):''));
  var periodLabel = pl.filter(Boolean).join('  .  ');
  var today = fmtDate(new Date().toISOString().slice(0,10));
  var allTasks = buildAllTasksForBoard();

  var doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
  var pw = doc.internal.pageSize.getWidth();   // 297
  var ph = doc.internal.pageSize.getHeight();  // 210
  var BLUE  = [30, 58, 138];
  var GREEN = [21, 128, 61];
  var RED   = [220, 38, 38];
  var pageNum = 1;

  function se(s){ return stripEmoji(s||''); }

  function hdr(title, sub){
    doc.setFillColor(BLUE[0],BLUE[1],BLUE[2]);
    doc.rect(0,0,pw,14,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(12); doc.setFont('helvetica','bold');
    doc.text(title, 10, 9);
    if(sub){ doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.text(sub, pw-8, 9, {align:'right'}); }
    doc.setTextColor(0,0,0);
  }
  function ftr(){
    doc.setFontSize(7); doc.setTextColor(150,150,150);
    doc.text('Klasbord - Juf Zisa - '+today, 10, ph-3);
    doc.text(''+pageNum, pw-8, ph-3, {align:'right'});
    doc.setTextColor(0,0,0);
  }

  // ── PAGINA 1: OVERZICHT ───────────────────────────────────────────────────
  var sub = (periodLabel?'Periode: '+periodLabel+'  .  ':'')+' Gegenereerd op '+today;
  hdr('Klasbord - Overzicht', sub);

  var complete  = state.pupils.filter(function(p){ return isPupilComplete(p.id); });
  var incomplete = state.pupils.filter(function(p){ return !isPupilComplete(p.id); });
  doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.setTextColor(GREEN[0],GREEN[1],GREEN[2]); doc.text('Volledig klaar: '+complete.length, 10, 20);
  doc.setTextColor(RED[0],RED[1],RED[2]);       doc.text('Niet volledig: '+incomplete.length, 70, 20);
  doc.setTextColor(0,0,0); doc.setFont('helvetica','normal');

  // Taaknamen afkappen op 12 tekens voor kolombreedte
  var taskCols = allTasks.map(function(t){ 
    var lbl = se(t.label);
    return lbl.length > 14 ? lbl.slice(0,13)+'.' : lbl;
  });

  var ovHead = [['Leerling'].concat(taskCols)];
  var ovBody = state.pupils.map(function(p,i){
    var pid = p.id;
    var myIds = new Set(pupilTasks(pid).map(function(t){ return t.id; }));
    var num = state.showNumbers ? (i+1)+'. ' : '';
    var row = [num+displayName(p)];
    allTasks.forEach(function(t){
      if(!myIds.has(t.id)){ row.push('-'); return; }
      var st = getStatus(pid,t.id);
      if(st===2)      row.push('Klaar');
      else if(st===1) row.push('Bezig');
      else            row.push('');
    });
    return row;
  });

  // Bereken kolombreedtes: naam=40, rest gelijk verdeeld
  var restWidth = pw - 20 - 40; // marges + naamkolom
  var taskColW = allTasks.length > 0 ? Math.min(28, restWidth / allTasks.length) : 28;
  var colStyles = { 0: { cellWidth:40, halign:'left', fontStyle:'bold' } };
  allTasks.forEach(function(_,i){ colStyles[i+1] = { cellWidth: taskColW, halign:'center' }; });

  doc.autoTable({
    head: ovHead,
    body: ovBody,
    startY: 24,
    styles: { fontSize: allTasks.length > 8 ? 7 : 8, cellPadding: 2, overflow:'ellipsize' },
    headStyles: { fillColor: BLUE, textColor: 255, fontStyle:'bold', halign:'center', fontSize: allTasks.length > 8 ? 6 : 7 },
    columnStyles: colStyles,
    alternateRowStyles: { fillColor:[248,250,252] },
    didParseCell: function(data){
      if(data.section==='body' && data.column.index > 0){
        var v = data.cell.raw;
        if(v==='Klaar')      { data.cell.styles.textColor=GREEN; data.cell.styles.fontStyle='bold'; }
        else if(v==='Bezig') { data.cell.styles.textColor=[180,100,0]; }
        else if(v==='-')     { data.cell.styles.textColor=[180,180,180]; }
      }
    },
    margin: { left:10, right:10 }
  });
  ftr();

  // ── PER LEERLING ──────────────────────────────────────────────────────────
  state.pupils.forEach(function(p){
    doc.addPage(); pageNum++;
    var pid = p.id;
    var tasks = pupilTasks(pid);
    var stats = pupilStats(pid);
    var isComplete = isPupilComplete(pid);
    var fullName = se(p.voornaam+(p.achternaam?' '+p.achternaam:''));

    hdr(se(displayName(p))+' - Detailrapport', (periodLabel?periodLabel+' . ':'')+today);

    // Badge
    var badgeColor = isComplete ? GREEN : (stats.done>0||stats.busy>0) ? [180,100,0] : RED;
    var badgeTxt   = isComplete ? 'Alle '+stats.total+' taken klaar' : stats.done+' van de '+stats.total+' taken klaar'+(stats.busy>0?' ('+stats.busy+' bezig)':'');
    doc.setFillColor(badgeColor[0],badgeColor[1],badgeColor[2]);
    doc.roundedRect(pw-70, 15, 62, 8, 2, 2, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text(badgeTxt, pw-39, 20.5, {align:'center'});
    doc.setTextColor(0,0,0); doc.setFont('helvetica','normal');

    doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text(fullName, 10, 22);
    doc.setFont('helvetica','normal');

    var startY = 26;
    if(periodLabel){
      doc.setFontSize(8); doc.setTextColor(30,64,175);
      doc.text('Periode: '+se(periodLabel), 10, startY);
      doc.setTextColor(0,0,0);
      startY = 31;
    }

    var taskRows = tasks.map(function(t){
      var st = getStatus(pid,t.id);
      var sm = getSmiley(pid,t.id);
      var statusTxt = st===2 ? 'Klaar' : st===1 ? 'Bezig' : 'Niet gestart';
      var smileyTxt = sm ? se(SMILEYS[sm])+' '+se(SMILEY_LABELS[sm]) : '-';
      var isExtra = !!(state.pupilTaskOverrides[pid] && state.pupilTaskOverrides[pid].extra &&
        state.pupilTaskOverrides[pid].extra.find(function(x){ return x.id===t.id; }));
      return [se(t.label)+(isExtra?' (extra)':''), statusTxt, smileyTxt];
    });

    doc.autoTable({
      head: [['Taak', 'Status', 'Zelfbeoordeling']],
      body: taskRows,
      startY: startY,
      styles: { fontSize:9, cellPadding:3, overflow:'linebreak' },
      headStyles: { fillColor:[241,245,249], textColor:[71,85,105], fontStyle:'bold', fontSize:8 },
      columnStyles: {
        0: { cellWidth: pw - 20 - 55 - 75, halign:'left' },
        1: { cellWidth: 55, halign:'left', fontStyle:'bold' },
        2: { cellWidth: 75, halign:'left' }
      },
      didParseCell: function(data){
        if(data.section==='body' && data.column.index===1){
          var v = data.cell.raw;
          if(v==='Klaar')           { data.cell.styles.textColor=GREEN; data.cell.styles.fillColor=[240,253,244]; }
          else if(v==='Bezig')      { data.cell.styles.textColor=[180,100,0]; data.cell.styles.fillColor=[255,251,235]; }
          else if(v==='Niet gestart'){ data.cell.styles.textColor=[30,58,138]; data.cell.styles.fillColor=[239,246,255]; }
        }
      },
      alternateRowStyles: { fillColor:[250,250,252] },
      margin: { left:10, right:10 }
    });

    // Bevindingen
    var note = state.notes[pid];
    if(note){
      var y = doc.lastAutoTable.finalY + 6;
      var noteLines = doc.splitTextToSize(se(note), pw - 40);
      var boxH = 8 + noteLines.length * 5 + 4; // padding boven+onder
      if(y + boxH > ph - 10){ doc.addPage(); pageNum++; hdr(se(displayName(p))+' - Bevindingen',''); ftr(); y = 20; }
      doc.setFillColor(255,251,235);
      doc.setDrawColor(253,230,138);
      doc.roundedRect(10, y, pw-20, boxH, 2, 2, 'FD');
      doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(146,64,14);
      doc.text('BEVINDINGEN LEERKRACHT', 16, y+5);
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(26,32,44);
      doc.text(noteLines, 16, y+11);
    }

    ftr();
  });

  document.getElementById('pdf-overlay').classList.add('hidden');
  if(mode === 'print'){
    // Open in nieuw venster en print
    var blob = doc.output('blob');
    var url = URL.createObjectURL(blob);
    var win = window.open(url, '_blank');
    if(win){
      win.addEventListener('load', function(){ win.print(); }, false);
    } else {
      // Fallback: gewoon downloaden
      var filename = 'klasbord-rapport-'+new Date().toISOString().slice(0,10)+'.pdf';
      doc.save(filename);
      showToast('Afdrukvenster geblokkeerd — PDF gedownload.');
    }
  } else {
    var filename = 'klasbord-rapport-'+new Date().toISOString().slice(0,10)+'.pdf';
    doc.save(filename);
    showToast('PDF gedownload: '+filename);
  }
}

// NIEUWE PERIODE
var selectedPeriodOption=0;
function openNewPeriod(){
  selectedPeriodOption=0;
  [1,2,3].forEach(function(n){document.getElementById('po'+n).classList.remove('selected');});
  document.getElementById('new-period-confirm').disabled=true;
  document.getElementById('new-period-overlay').classList.remove('hidden');
}
function selectPeriod(n){
  selectedPeriodOption=n;
  [1,2,3].forEach(function(i){document.getElementById('po'+i).classList.toggle('selected',i===n);});
  document.getElementById('new-period-confirm').disabled=false;
}
function doNewPeriod(){
  if(!selectedPeriodOption) return;
  if(selectedPeriodOption===1){ state.progress={}; }
  else if(selectedPeriodOption===2){ state.progress={}; state.notes={}; }
  else { state.pupils=[];state.progress={};state.notes={};state.activeTasks=[];state.customTasks=[];state.pupilTaskOverrides={}; }
  saveState();
  document.getElementById('new-period-overlay').classList.add('hidden');
  renderShell();
}
// ── ACCORDION ────────────────────────────────────────────────────────────
function acToggle(sectie){
  ['namen','taken','inst'].forEach(function(s){
    var body    = document.getElementById('ac-body-' + s);
    var hdr     = document.querySelector('#ac-' + s + ' .ac-hdr');
    var chevron = document.getElementById('ac-chevron-' + s);
    if(!body) return;
    var open = s === sectie;
    body.classList.toggle('ac-body-hidden', !open);
    if(hdr)     hdr.classList.toggle('ac-open', open);
    if(chevron) chevron.textContent = open ? '▲' : '▼';
  });
  if(sectie === 'namen') renderPupilList();
  if(sectie === 'taken') renderTaskSettings();
  if(sectie === 'inst'){
    document.getElementById('toggle-numbers').checked = !!state.showNumbers;
    document.getElementById('toggle-lastname').checked = !!state.showLastname;
    document.getElementById('toggle-smileys').checked  = !!state.showSmileys;
  }
  updateAcWizard();
}

function updateAcWizard(){
  var heeftNamen = state.pupils && state.pupils.length > 0;
  var heeftTaken = state.activeTasks && state.activeTasks.length > 0;
  var b1 = document.getElementById('ac-badge-namen');
  var b2 = document.getElementById('ac-badge-taken');
  var b3 = document.getElementById('ac-badge-inst');
  if(b1){ b1.textContent = heeftNamen ? '✓' : '1'; b1.classList.toggle('ac-badge-done', heeftNamen); }
  if(b2){ b2.textContent = heeftTaken ? '✓' : '2'; b2.classList.toggle('ac-badge-done', heeftTaken); }
  if(b3){ b3.textContent = (heeftNamen&&heeftTaken) ? '✓' : '3'; b3.classList.toggle('ac-badge-done', heeftNamen&&heeftTaken); }
  var sub1 = document.getElementById('ac-sub-namen');
  if(sub1) sub1.textContent = heeftNamen ? state.pupils.length + ' leerlingen toegevoegd' : 'Voeg de leerlingen van je klas toe';
  var sub2 = document.getElementById('ac-sub-taken');
  if(sub2) sub2.textContent = heeftTaken ? state.activeTasks.length + ' taken actief' : 'Klik op een taak om aan of uit te zetten';
}

var _sbActief='namen';
function sbToon(sectie){
  _sbActief=sectie;
  ['namen','taken','inst'].forEach(function(s){
    var p=document.getElementById('sb-paneel-'+s);if(p)p.classList.toggle('sb-paneel-hidden',s!==sectie);
    var b=document.getElementById('sb-stap-'+s);if(b)b.classList.toggle('sb-actief',s===sectie);
  });
  if(sectie==='namen')renderPupilList();
  if(sectie==='taken')renderTaskSettings();
  if(sectie==='inst'){
    var tn=document.getElementById('toggle-numbers');if(tn)tn.checked=!!state.showNumbers;
    var tl=document.getElementById('toggle-lastname');if(tl)tl.checked=!!state.showLastname;
    var ts=document.getElementById('toggle-smileys');if(ts)ts.checked=!!state.showSmileys;
  }
  updateSbWizard();
}
function acToggle(s){sbToon(s);}
function updateSbWizard(){
  var hN=state.pupils&&state.pupils.length>0,hT=state.activeTasks&&state.activeTasks.length>0;
  var b1=document.getElementById('sb-badge-namen');if(b1){b1.textContent=hN?'✓':'1';b1.classList.toggle('sb-badge-klaar',hN);}
  var b2=document.getElementById('sb-badge-taken');if(b2){b2.textContent=hT?'✓':'2';b2.classList.toggle('sb-badge-klaar',hT);}
  var b3=document.getElementById('sb-badge-inst');if(b3){b3.textContent=(hN&&hT)?'✓':'3';b3.classList.toggle('sb-badge-klaar',hN&&hT);}
  var s1=document.getElementById('sb-sub-namen');if(s1)s1.textContent=hN?state.pupils.length+' leerlingen':'Leerlingen toevoegen';
  var s2=document.getElementById('sb-sub-taken');if(s2)s2.textContent=hT?state.activeTasks.length+' actief':'Taken kiezen';
  var bn=document.getElementById('sb-bord-naam');if(bn){var n=getBordNaam();bn.textContent=n||'';bn.style.display=n?'block':'none';}
}
function updateAcWizard(){updateSbWizard();}
function toggleEmojiPicker(){
  var popup=document.getElementById('emoji-picker-popup');if(!popup)return;
  popup.classList.toggle('open');
  if(popup.classList.contains('open')){
    setTimeout(function(){
      document.addEventListener('click',function closeEP(e){
        if(!popup.contains(e.target)&&e.target.id!=='eigen-taak-emoji-btn'){popup.classList.remove('open');document.removeEventListener('click',closeEP);}
      });
    },10);
  }
}
function updateEmojiBtn(){var b=document.getElementById('eigen-taak-emoji-btn');if(b)b.textContent=selectedEmoji;}
function renderSettings(){sbToon(_sbActief);updateSbWizard();}
function switchTab(tab){currentTab=tab;}

function renderPupilList(){
  document.getElementById('toggle-numbers').checked=!!state.showNumbers;
  document.getElementById('toggle-lastname').checked=!!state.showLastname;
  document.getElementById('toggle-smileys').checked=!!state.showSmileys;
  document.getElementById('pupil-count-title').textContent=`Leerlingen (${state.pupils.length})`;
  // Autosave melding tonen als er leerlingen zijn
  const an = document.getElementById('autosave-notice');
  if(an) an.style.display = state.pupils.length > 0 ? 'flex' : 'none';

  // Eerste-keer-hint foto's (punt 3) — toon als er leerlingen zijn maar nog geen foto
  const hasAnyPhoto = state.pupils.some(p => state.pupilPhotos[p.id]);
  const hintDismissed = localStorage.getItem('hint_photos_dismissed');
  const hintEl = document.getElementById('hint-photos');
  if(hintEl){
    hintEl.style.display = (!hasAnyPhoto && !hintDismissed && state.pupils.length > 0) ? 'flex' : 'none';
  }

  // Leerlingenlijst — foto-knop direct zichtbaar naast elke naam
  const el=document.getElementById('pupil-list');
  if(!state.pupils.length){el.innerHTML='<div style="opacity:.3;text-align:center;padding:28px 0;font-size:13px">Nog geen leerlingen</div>';return;}
  let html='';
  state.pupils.forEach((p,i)=>{
    const ov=hasOverrides(p.id), hasNotes=!!state.notes[p.id];
    const numHtml   = state.showNumbers ? '<span class="pupil-num">'+(i+1)+'.</span>' : '';
    const achHtml   = p.achternaam ? '<span class="pupil-achternaam">'+esc(p.achternaam)+'</span>' : '';
    const extraHtml = ov ? '<span class="pupil-extra-badge">\u2605 taken</span>' : '';
    const noteCls   = hasNotes ? 'has-notes' : '';
    const fullN     = esc(p.voornaam+(p.achternaam?' '+p.achternaam:''));
    const photo     = state.pupilPhotos&&state.pupilPhotos[p.id];
    // Foto-knop: groot en duidelijk zichtbaar in de rij
    const photoCell = photo
      ? `<button class="pupil-photo-btn has-photo" onclick="uploadPupilPhoto('${p.id}')" title="Klik om foto te wijzigen"><img src="${photo}" class="pupil-row-photo" alt="" /></button>`
      : `<button class="pupil-photo-btn no-photo" onclick="uploadPupilPhoto('${p.id}')" title="Foto toevoegen">📷 foto</button>`;
    html += '<div class="insert-zone" onclick="insertAfter('+(i-1)+')"></div>';
    html += '<div class="pupil-row" draggable="true"'
      +' ondragstart="onDragStart(event,'+i+')" ondragover="onDragOver(event,'+i+')"'
      +' ondragleave="onDragLeave('+i+')" ondrop="onDrop(event,'+i+')" ondragend="onDragEnd()">'
      +'<span class="drag-handle">\u2833</span>'
      + numHtml
      + photoCell
      +'<div class="pupil-display">'
        +'<span class="pupil-voornaam">'+esc(p.voornaam)+'</span>'
        + achHtml + extraHtml
      +'</div>'
      +'<div class="row-btns">'
        +(photo?`<button class="row-btn del" onclick="removePupilPhoto('${p.id}')" title="Foto verwijderen" style="font-size:10px;">🗑</button>`:'')
        +'<button class="row-btn" onclick="openPupilTasksModal(\''+p.id+'\')" title="Taken aanpassen">\uD83D\uDCCB</button>'
        +'<button class="row-btn notes-btn '+noteCls+'" onclick="openNotesModal(\''+p.id+'\')" title="Bevindingen">\uD83D\uDD12</button>'
        +'<button class="row-btn" onclick="startEdit(\''+p.id+'\')" title="Naam aanpassen">\u270E</button>'
        +'<button class="row-btn del" onclick="confirmAction(\'custom\',\''+fullN+' verwijderen?\',()=>removePupil(\''+p.id+'\'))" title="Verwijderen">\u2715</button>'
      +'</div>'
      +'</div>';
  });
  html += '<div class="insert-zone" onclick="insertAfter('+(state.pupils.length-1)+')"></div>';
  el.innerHTML=html;
  updateAcWizard();
}
function renderTaskSettings(){
  const ci=state.customIcons||{};
  const ib=document.getElementById('icons-banner');
  if(ib)ib.style.display=Object.keys(ci).length>0?'flex':'none';
  const iconHintEl=document.getElementById('hint-icons');
  if(iconHintEl)iconHintEl.style.display='none';
  const chipsEl=document.getElementById('task-chips');
  if(!chipsEl)return;
  chipsEl.innerHTML='';
  if(!chipsEl._dropdownBound){
    chipsEl._dropdownBound=true;
    document.addEventListener('click',function(){document.querySelectorAll('.taak-dropdown.open').forEach(function(d){d.classList.remove('open');});});
  }
  allBaseTasks().forEach(function(t){
    const a=state.activeTasks.includes(t.id),c=t.id.startsWith('c_'),hasImg=!!ci[t.id];
    const wrap=document.createElement('div');wrap.className='taak-wrap';
    const tegel=document.createElement('div');
    tegel.className='taak-tegel'+(a?' actief':'');
    tegel.onclick=function(){toggleTask(t.id);};
    const iconEl=document.createElement('div');iconEl.className='taak-icon';
    if(hasImg){iconEl.innerHTML=`<img src="${ci[t.id]}" style="width:34px;height:34px;object-fit:contain;border-radius:6px;" alt="" />`;}
    else{iconEl.textContent=t.icon;}
    tegel.appendChild(iconEl);
    const naamEl=document.createElement('div');naamEl.className='taak-naam';naamEl.textContent=t.label;tegel.appendChild(naamEl);
    const dropdown=document.createElement('div');dropdown.className='taak-dropdown';
    const gear=document.createElement('button');gear.className='taak-gear';gear.textContent='⚙';gear.title='Opties';
    gear.onclick=function(e){e.stopPropagation();document.querySelectorAll('.taak-dropdown.open').forEach(function(d){if(d!==dropdown)d.classList.remove('open');});dropdown.classList.toggle('open');};
    tegel.appendChild(gear);wrap.appendChild(tegel);
    const r1=document.createElement('button');r1.className='taak-menu-item';r1.innerHTML='✎ &nbsp;Naam wijzigen';
    r1.onclick=function(e){e.stopPropagation();dropdown.classList.remove('open');openTaskRenameModal(t.id,t.label);};dropdown.appendChild(r1);
    const r2=document.createElement('button');r2.className='taak-menu-item';r2.innerHTML=hasImg?'📷 &nbsp;Afbeelding wijzigen':'📷 &nbsp;Eigen afbeelding';
    r2.onclick=function(e){e.stopPropagation();dropdown.classList.remove('open');uploadTaskIcon(t.id);};dropdown.appendChild(r2);
    if(hasImg){const r3=document.createElement('button');r3.className='taak-menu-item';r3.innerHTML='🗑 &nbsp;Afbeelding verwijderen';r3.onclick=function(e){e.stopPropagation();dropdown.classList.remove('open');removeTaskIcon(t.id);};dropdown.appendChild(r3);}
    if(c){const sep=document.createElement('div');sep.className='taak-menu-sep';dropdown.appendChild(sep);const r4=document.createElement('button');r4.className='taak-menu-item taak-menu-danger';r4.innerHTML='🗑 &nbsp;Taak verwijderen';r4.onclick=function(e){e.stopPropagation();dropdown.classList.remove('open');removeCustomTask(t.id);};dropdown.appendChild(r4);}
    wrap.appendChild(dropdown);chipsEl.appendChild(wrap);
  });
  const epEl=document.getElementById('emoji-picker');
  if(epEl)epEl.innerHTML=EMOJIS.map(function(e){return `<button class="emoji-btn ${e===selectedEmoji?'selected':''}" onclick="selectEmoji('${e}')">${e}</button>`;}).join('');
  const itEl=document.getElementById('input-task');if(itEl)itEl.placeholder='Naam van de taak…';
  updateEmojiBtn();updateSbWizard();
}

function renderPupilList(){
  document.getElementById('toggle-numbers').checked=!!state.showNumbers;
  document.getElementById('toggle-lastname').checked=!!state.showLastname;
  document.getElementById('toggle-smileys').checked=!!state.showSmileys;
  document.getElementById('pupil-count-title').textContent=`Leerlingen (${state.pupils.length})`;
  // Autosave melding tonen als er leerlingen zijn
  const an = document.getElementById('autosave-notice');
  if(an) an.style.display = state.pupils.length > 0 ? 'flex' : 'none';

  // Eerste-keer-hint foto's (punt 3) — toon als er leerlingen zijn maar nog geen foto
  const hasAnyPhoto = state.pupils.some(p => state.pupilPhotos[p.id]);
  const hintDismissed = localStorage.getItem('hint_photos_dismissed');
  const hintEl = document.getElementById('hint-photos');
  if(hintEl){
    hintEl.style.display = (!hasAnyPhoto && !hintDismissed && state.pupils.length > 0) ? 'flex' : 'none';
  }

  // Leerlingenlijst — foto-knop direct zichtbaar naast elke naam
  const el=document.getElementById('pupil-list');
  if(!state.pupils.length){el.innerHTML='<div style="opacity:.3;text-align:center;padding:28px 0;font-size:13px">Nog geen leerlingen</div>';return;}
  let html='';
  state.pupils.forEach((p,i)=>{
    const ov=hasOverrides(p.id), hasNotes=!!state.notes[p.id];
    const numHtml   = state.showNumbers ? '<span class="pupil-num">'+(i+1)+'.</span>' : '';
    const achHtml   = p.achternaam ? '<span class="pupil-achternaam">'+esc(p.achternaam)+'</span>' : '';
    const extraHtml = ov ? '<span class="pupil-extra-badge">\u2605 taken</span>' : '';
    const noteCls   = hasNotes ? 'has-notes' : '';
    const fullN     = esc(p.voornaam+(p.achternaam?' '+p.achternaam:''));
    const photo     = state.pupilPhotos&&state.pupilPhotos[p.id];
    // Foto-knop: groot en duidelijk zichtbaar in de rij
    const photoCell = photo
      ? `<button class="pupil-photo-btn has-photo" onclick="uploadPupilPhoto('${p.id}')" title="Klik om foto te wijzigen"><img src="${photo}" class="pupil-row-photo" alt="" /></button>`
      : `<button class="pupil-photo-btn no-photo" onclick="uploadPupilPhoto('${p.id}')" title="Foto toevoegen">📷 foto</button>`;
    html += '<div class="insert-zone" onclick="insertAfter('+(i-1)+')"></div>';
    html += '<div class="pupil-row" draggable="true"'
      +' ondragstart="onDragStart(event,'+i+')" ondragover="onDragOver(event,'+i+')"'
      +' ondragleave="onDragLeave('+i+')" ondrop="onDrop(event,'+i+')" ondragend="onDragEnd()">'
      +'<span class="drag-handle">\u2833</span>'
      + numHtml
      + photoCell
      +'<div class="pupil-display">'
        +'<span class="pupil-voornaam">'+esc(p.voornaam)+'</span>'
        + achHtml + extraHtml
      +'</div>'
      +'<div class="row-btns">'
        +(photo?`<button class="row-btn del" onclick="removePupilPhoto('${p.id}')" title="Foto verwijderen" style="font-size:10px;">🗑</button>`:'')
        +'<button class="row-btn" onclick="openPupilTasksModal(\''+p.id+'\')" title="Taken aanpassen">\uD83D\uDCCB</button>'
        +'<button class="row-btn notes-btn '+noteCls+'" onclick="openNotesModal(\''+p.id+'\')" title="Bevindingen">\uD83D\uDD12</button>'
        +'<button class="row-btn" onclick="startEdit(\''+p.id+'\')" title="Naam aanpassen">\u270E</button>'
        +'<button class="row-btn del" onclick="confirmAction(\'custom\',\''+fullN+' verwijderen?\',()=>removePupil(\''+p.id+'\'))" title="Verwijderen">\u2715</button>'
      +'</div>'
      +'</div>';
  });
  html += '<div class="insert-zone" onclick="insertAfter('+(state.pupils.length-1)+')"></div>';
  el.innerHTML=html;
  updateAcWizard();
}
function renderTaskSettings(){
  const ci = state.customIcons || {};

  // Banner eigen afbeeldingen
  const ib = document.getElementById('icons-banner');
  if(ib) ib.style.display = Object.keys(ci).length > 0 ? 'flex' : 'none';

  // Hint verbergen (niet meer nodig met nieuwe UI)
  const iconHintEl = document.getElementById('hint-icons');
  if(iconHintEl) iconHintEl.style.display = 'none';

  const chipsEl = document.getElementById('task-chips');
  if(!chipsEl) return;
  chipsEl.innerHTML = '';

  // Sluit alle open dropdowns bij klik buiten — eenmalig binden
  if(!chipsEl._dropdownBound){
    chipsEl._dropdownBound = true;
    document.addEventListener('click', function(){
      document.querySelectorAll('.taak-dropdown.open').forEach(function(d){ d.classList.remove('open'); });
    });
  }

  allBaseTasks().forEach(function(t){
    const a = state.activeTasks.includes(t.id);
    const c = t.id.startsWith('c_');
    const hasImg = !!ci[t.id];

    // Wrapper
    const wrap = document.createElement('div');
    wrap.className = 'taak-wrap';

    // Tegel (klik = aan/uit)
    const tegel = document.createElement('div');
    tegel.className = 'taak-tegel' + (a ? ' actief' : '');
    tegel.onclick = function(){ toggleTask(t.id); };

    // Icoon
    const iconEl = document.createElement('div');
    iconEl.className = 'taak-icon';
    if(hasImg){
      iconEl.innerHTML = `<img src="${ci[t.id]}" style="width:34px;height:34px;object-fit:contain;border-radius:6px;" alt="" />`;
    } else {
      iconEl.textContent = t.icon;
    }
    tegel.appendChild(iconEl);

    // Naam
    const naamEl = document.createElement('div');
    naamEl.className = 'taak-naam';
    naamEl.textContent = t.label;
    tegel.appendChild(naamEl);

    // Tandwiel-knop
    const gear = document.createElement('button');
    gear.className = 'taak-gear';
    gear.textContent = '⚙';
    gear.title = 'Naam, afbeelding of verwijderen';
    gear.onclick = function(e){
      e.stopPropagation();
      // Sluit andere open dropdowns
      document.querySelectorAll('.taak-dropdown.open').forEach(function(d){
        if(d !== dropdown) d.classList.remove('open');
      });
      dropdown.classList.toggle('open');
    };
    tegel.appendChild(gear);

    wrap.appendChild(tegel);

    // Dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'taak-dropdown';

    const renameItem = document.createElement('button');
    renameItem.className = 'taak-menu-item';
    renameItem.innerHTML = '✎ &nbsp;Naam wijzigen';
    renameItem.onclick = function(e){ e.stopPropagation(); dropdown.classList.remove('open'); openTaskRenameModal(t.id, t.label); };
    dropdown.appendChild(renameItem);

    const uploadItem = document.createElement('button');
    uploadItem.className = 'taak-menu-item';
    uploadItem.innerHTML = hasImg ? '📷 &nbsp;Afbeelding wijzigen' : '📷 &nbsp;Eigen afbeelding';
    uploadItem.onclick = function(e){ e.stopPropagation(); dropdown.classList.remove('open'); uploadTaskIcon(t.id); };
    dropdown.appendChild(uploadItem);

    if(hasImg){
      const delImgItem = document.createElement('button');
      delImgItem.className = 'taak-menu-item';
      delImgItem.innerHTML = '🗑 &nbsp;Afbeelding verwijderen';
      delImgItem.onclick = function(e){ e.stopPropagation(); dropdown.classList.remove('open'); removeTaskIcon(t.id); };
      dropdown.appendChild(delImgItem);
    }

    if(c){
      const sep = document.createElement('div');
      sep.className = 'taak-menu-sep';
      dropdown.appendChild(sep);
      const delItem = document.createElement('button');
      delItem.className = 'taak-menu-item taak-menu-danger';
      delItem.innerHTML = '🗑 &nbsp;Taak verwijderen';
      delItem.onclick = function(e){ e.stopPropagation(); dropdown.classList.remove('open'); removeCustomTask(t.id); };
      dropdown.appendChild(delItem);
    }

    wrap.appendChild(dropdown);
    chipsEl.appendChild(wrap);
  });

  // Emoji-picker vullen
  const epEl = document.getElementById('emoji-picker');
  if(epEl) epEl.innerHTML = EMOJIS.map(function(e){
    return `<button class="emoji-btn ${e===selectedEmoji?'selected':''}" onclick="selectEmoji('${e}')">${e}</button>`;
  }).join('');
  const itEl = document.getElementById('input-task');
  if(itEl) itEl.placeholder = 'Naam van de taak…';
  updateEmojiBtn();
  updateAcWizard();
}

// ── EMOJI PICKER TOGGLE ───────────────────────────────────────────────────
function toggleEmojiPicker(){
  var popup = document.getElementById('emoji-picker-popup');
  if(!popup) return;
  popup.classList.toggle('open');
  // Sluit bij klik buiten
  if(popup.classList.contains('open')){
    setTimeout(function(){
      document.addEventListener('click', function closeEP(e){
        if(!popup.contains(e.target) && e.target.id !== 'eigen-taak-emoji-btn'){
          popup.classList.remove('open');
          document.removeEventListener('click', closeEP);
        }
      });
    }, 10);
  }
}

function updateEmojiBtn(){
  var btn = document.getElementById('eigen-taak-emoji-btn');
  if(btn) btn.textContent = selectedEmoji;
}

function selectEmoji(e){selectedEmoji=e;renderTaskSettings();updateEmojiBtn();document.getElementById('emoji-picker-popup')?.classList.remove('open');}

// Bouw lijst van alle taken voor het bord (klassikale + evt. extra per leerling)
function buildAllTasksForBoard(){
  const base = classActiveTasks();
  const extra = [];
  state.pupils.forEach(p => {
    const ov = state.pupilTaskOverrides[p.id]||{};
    (ov.extra||[]).forEach(t => { if(!extra.find(x=>x.id===t.id)) extra.push(t); });
  });
  return [...base, ...extra];
}

// Afbeelding resizen naar vierkant canvas
function resizeImageToDataURL(file, size, cb){
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const ratio = Math.min(size/img.width, size/img.height);
      const w = img.width*ratio, h = img.height*ratio;
      const x = (size-w)/2, y = (size-h)/2;
      ctx.clearRect(0,0,size,size);
      ctx.drawImage(img,x,y,w,h);
      cb(canvas.toDataURL('image/png'));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// Upload eigen afbeelding bij taak
function uploadTaskIcon(taskId){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
  inp.onchange = e => {
    const f = e.target.files[0]; if(!f) return;
    resizeImageToDataURL(f, 80, dataURL => {
      if(!state.customIcons) state.customIcons = {};
      state.customIcons[taskId] = dataURL;
      saveState(); renderTaskSettings(); renderBoard();
    });
  };
  inp.click();
}

// Verwijder eigen afbeelding bij taak
function removeTaskIcon(taskId){
  if(state.customIcons) delete state.customIcons[taskId];
  saveState(); renderTaskSettings(); renderBoard();
}

// Upload foto bij leerling
function uploadPupilPhoto(pupilId){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/gif,image/webp';
  inp.onchange = e => {
    const f = e.target.files[0]; if(!f) return;
    resizeImageToDataURL(f, 64, dataURL => {
      if(!state.pupilPhotos) state.pupilPhotos = {};
      state.pupilPhotos[pupilId] = dataURL;
      saveState(); renderPupilList(); renderBoard();
    });
  };
  inp.click();
}

// Verwijder foto bij leerling
function removePupilPhoto(pupilId){
  if(state.pupilPhotos) delete state.pupilPhotos[pupilId];
  saveState(); renderPupilList(); renderBoard();
}

function renderBoard(){
  applyBoardSize();
  checkBackupReminder();
  ['compact','normal','large'].forEach(s=>{
    const btn=document.getElementById('size-'+s);
    if(btn) btn.classList.toggle('size-btn-active', s===(state.boardSize||'normal'));
  });
  const hp=state.pupils.length>0;
  const ht=classActiveTasks().length>0||state.pupils.some(p=>(state.pupilTaskOverrides[p.id]?.extra||[]).length>0);
  const show=hp&&ht;
  document.getElementById('empty-state').classList.toggle('hidden',show);
  document.getElementById('board-inner').classList.toggle('hidden',!show);
  const th=document.getElementById('task-header'); if(th) th.classList.toggle('hidden',!show);
  const lg=document.getElementById('legend'); if(lg) lg.classList.toggle('hidden',!show);
  if(!show){
    document.getElementById('empty-text').textContent=!hp?'Voeg leerlingen toe via ⚙️ Beheer':'Activeer taken via ⚙️ Beheer → Taken';
    updateMeta();return;
  }
  const allTasks=buildAllTasksForBoard();
  renderBoardTable(allTasks);
  updateProgressBar();
  updateMeta();
  requestAnimationFrame(updateScrollArrow);
  setTimeout(updateScrollArrow,150);
  setTimeout(updateScrollArrow,500);
  setTimeout(updateScrollArrow,1500);
}

function renderBoardTable(allTasks){
  const inner=document.getElementById('board-inner');
  inner.innerHTML='';

  // Gebruik zelfde berekening als rijen: COL_NAME + n*COL_TASK (geen gap)
  const _CN=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--col-name')||'220');
  const _CT=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--col-task')||'120');
  const minW = _CN + allTasks.length * _CT;

  // ── TAAKNAMEN HEADER ─────────────────────────────────────────────────
  const taskHeader=document.getElementById('task-header')||document.createElement('div');
  taskHeader.id='task-header';
  taskHeader.querySelectorAll('.task-header-cell').forEach(e=>e.remove());
  taskHeader.style.minWidth=(minW + 28) + 'px';

  // Zorg dat header-corner bestaat
  if(!taskHeader.querySelector('.header-corner')){
    const corner=document.createElement('div');
    corner.className='header-corner';
    corner.innerHTML='<span class="board-corner-label">Leerling</span>';
    taskHeader.insertBefore(corner,taskHeader.firstChild);
  }

  allTasks.forEach(t=>{
    const ci=state.customIcons&&state.customIcons[t.id];
    const cell=document.createElement('div');
    cell.className='task-header-cell';
    if(ci){
      cell.innerHTML=`<div class="t-icon-custom" style="background-image:url(${ci})"></div><span class="t-label">${esc(t.label)}</span>`;
    } else {
      cell.innerHTML=`<span class="t-icon">${t.icon}</span><span class="t-label">${esc(t.label)}</span>`;
    }
    taskHeader.appendChild(cell);
  });

  // Legenda en header zitten in top-fixed (HTML) — alleen minWidth en sync instellen
  const boardScroll=document.getElementById('board-scroll');
  const topFixed=document.getElementById('top-fixed');
  const legend=document.getElementById('legend');
  const PAD_PX=14;
  const minWFixed=(_CN+allTasks.length*_CT)+'px';
  const minWRows=minWFixed;

  if(taskHeader) taskHeader.style.minWidth=minWFixed;
  if(legend){ legend.style.minWidth=(_CN+allTasks.length*_CT+PAD_PX*2)+'px'; legend.classList.remove('hidden'); }

  // Scroll sync: top-fixed horizontaal mee met board-scroll
  if(boardScroll&&topFixed&&!boardScroll._syncBound){
    boardScroll._syncBound=true;
    boardScroll.addEventListener('scroll',()=>{topFixed.scrollLeft=boardScroll.scrollLeft;},{passive:true});
  }

  // ── LEERLINGENRIJEN ───────────────────────────────────────────────────
  inner.style.minWidth=minWRows;

  // Zorg voor pupil-rows container
  let pupilRows=document.getElementById('pupil-rows');
  if(!pupilRows){
    pupilRows=document.createElement('div');
    pupilRows.id='pupil-rows';
    inner.appendChild(pupilRows);
  }
  pupilRows.style.minWidth=minWRows;
  pupilRows.innerHTML='';

  // ── LEERLINGENRIJEN ───────────────────────────────────────────────────
  state.pupils.forEach((pupil,idx)=>{
    const pid=pupil.id;
    const myTasks=pupilTasks(pid);
    const myIds=new Set(myTasks.map(t=>t.id));
    const complete=isPupilComplete(pid);
    const {done,busy,total}=pupilStats(pid);
    const prog=state.progress[pid]||{};
    const hasNotes=!!state.notes[pid];
    const photo=state.pupilPhotos&&state.pupilPhotos[pid];

    const row=document.createElement('div');
    row.className='pupil-board-row'+(complete?' complete':'');

    // Naam-cel
    const nameCell=document.createElement('div');
    nameCell.className='pupil-name-cell';
    const dc=complete?'done':busy>0?'busy':'';
    const bh=busy>0?` · <span class="busy-label">${busy} bezig</span>`:'';
    const nh=state.showNumbers?`<span class="pupil-num">${idx+1}.</span>`:'';
    // Notities-knop — altijd zichtbaar in leerkrachtweergave
    const notesBtn=`<button class="board-notes-btn${hasNotes?' has-notes':''}" onclick="openNotesModal('${pid}')" title="${hasNotes?'Opmerking bekijken/bewerken':'Opmerking toevoegen'}">🔒</button>`;
    const medalSpan=complete?'<span class="pupil-medal">🏅</span>':'';
    const photoHtml=photo?`<img class="pupil-board-photo" src="${photo}" alt="${esc(displayName(pupil))}" />`:'';
    nameCell.innerHTML=`<div class="pupil-dot ${dc}"></div>${nh}${photoHtml}<div class="pupil-info"><div class="pupil-name">${esc(displayName(pupil))}</div><div class="pupil-sub">${done}/${total}${bh}</div></div>${notesBtn}${medalSpan}`;
    row.appendChild(nameCell);

    // Taakvakken wrapper
    const taskWrap=document.createElement('div');
    taskWrap.className='task-cells-wrap';

    // Taak-cellen
    allTasks.forEach(t=>{
      const td=document.createElement('div');
      td.className='task-cell';
      if(!myIds.has(t.id)){
        td.innerHTML='<div class="task-ph">—</div>';
      } else {
        const isExtra=!!(state.pupilTaskOverrides[pid]?.extra?.find(x=>x.id===t.id));
        const entry=prog[t.id]||{status:0,smiley:0};
        const s=entry.status||0, sm=entry.smiley||0;
        const wrap=td;
        const btn=document.createElement('button');
        btn.className='task-btn status-'+s+(isExtra?' extra-task':'');
        btn.textContent=s===0?'':s===1?'🔄':'✓';
        btn.title=(isExtra?'★ Extra · ':'')+['Leeg → Bezig','Bezig → Klaar','Klaar → wissen'][s];
        btn.onclick=()=>cycleStatus(pid,t.id);
        wrap.appendChild(btn);
        if(sm>0){
          const sr=document.createElement('div');sr.className='smiley-row smiley-row-single';
          const sb=document.createElement('button');
          sb.className='smiley-btn selected smiley-chosen';
          sb.textContent=SMILEYS[sm];
          sb.title=SMILEY_LABELS[sm]+' · Klik om te wijzigen';
          sb.onclick=()=>openSmileyPopup(pid,t.id);
          sr.appendChild(sb);
          wrap.appendChild(sr);
        } else if(s===2&&state.showSmileys){
          const sr=document.createElement('div');sr.className='smiley-row';
          [1,2,3,4].forEach(v=>{
            const sb=document.createElement('button');
            sb.className='smiley-btn';
            sb.textContent=SMILEYS[v];
            sb.title=SMILEY_LABELS[v];
            sb.onclick=()=>{
              if(!state.progress[pid])state.progress[pid]={};
              if(!state.progress[pid][t.id])state.progress[pid][t.id]={status:s,smiley:0};
              state.progress[pid][t.id].smiley=v;
              saveState();renderBoard();
            };
            sr.appendChild(sb);
          });
          wrap.appendChild(sr);
        }
      }
      taskWrap.appendChild(td);
    });
    row.appendChild(taskWrap);
    pupilRows.appendChild(row);
  });

  // Progress bar
  let pbWrap=document.getElementById('progress-bar-wrap');
  if(!pbWrap){
    pbWrap=document.createElement('div');
    pbWrap.id='progress-bar-wrap';
    inner.appendChild(pbWrap);
  } else {
    inner.appendChild(pbWrap);
  }
}

function renderTaskHeader(tasks){ /* niet meer gebruikt — zie renderBoardTable */ }
function renderPupilRows(allTasks){ /* niet meer gebruikt — zie renderBoardTable */ }

function updateProgressBar(){const t=state.pupils.length,d=state.pupils.filter(p=>isPupilComplete(p.id)).length;const pf=document.getElementById('progress-fill');const pl=document.getElementById('progress-label');if(pf)pf.style.width=t?(d/t*100)+'%':'0%';if(pl)pl.textContent=`${d}/${t} klaar`;}
function updateMeta(){var t=state.pupils.length,d=state.pupils.filter(function(p){return isPupilComplete(p.id);}).length;var el=document.getElementById('board-progress-text');if(el)el.textContent=(t>0)?(d+'/'+t+' klaar'):'';var pl=document.getElementById('progress-label');if(pl)pl.textContent=(d+'/'+t+' klaar');}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// INIT
// Punt 5: Bord-grootte instellen
function setBoardSize(size){
  state.boardSize = size;
  saveState();
  applyBoardSize();
  renderBoard();
  // Update actieve knop
  ['compact','normal','large'].forEach(s=>{
    const btn=document.getElementById('size-'+s);
    if(btn){
      btn.style.borderColor = s===size ? '#6366f1' : '#e0e7ff';
      btn.style.background  = s===size ? '#eef2ff' : '#f8fafc';
      btn.style.color       = s===size ? '#6366f1' : '#374151';
    }
  });
}
function applyBoardSize(){
  const sizes = {
    compact: {
      name:'140px', task:'80px',  gap:'5px',
      btnW:'48px',  btnH:'48px',  btnFont:'22px', nameFont:'13px',
      photoSize:'34px', iconSize:'26px', iconCustom:'36px',
      labelSize:'12px', rowPad:'6px', smileySz:'14px', numFont:'12px'
    },
    normal: {
      name:'220px', task:'120px', gap:'8px',
      btnW:'66px',  btnH:'66px',  btnFont:'26px', nameFont:'16px',
      photoSize:'52px', iconSize:'38px', iconCustom:'56px',
      labelSize:'16px', rowPad:'10px', smileySz:'18px', numFont:'15px'
    },
    large: {
      name:'280px', task:'160px', gap:'10px',
      btnW:'90px',  btnH:'90px',  btnFont:'36px', nameFont:'20px',
      photoSize:'72px', iconSize:'54px', iconCustom:'76px',
      labelSize:'20px', rowPad:'14px', smileySz:'24px', numFont:'19px'
    },
  };
  const s = sizes[state.boardSize] || sizes.normal;
  const root = document.documentElement;
  root.style.setProperty('--col-name',   s.name);
  root.style.setProperty('--col-task',   s.task);
  root.style.setProperty('--gap',        s.gap);
  root.style.setProperty('--btn-w',      s.btnW);
  root.style.setProperty('--btn-h',      s.btnH);
  root.style.setProperty('--btn-font',   s.btnFont);
  root.style.setProperty('--name-font',  s.nameFont);
  root.style.setProperty('--photo-size', s.photoSize);
  root.style.setProperty('--icon-size',  s.iconSize);
  root.style.setProperty('--icon-custom',s.iconCustom);
  root.style.setProperty('--label-size', s.labelSize);
  root.style.setProperty('--row-pad',    s.rowPad);
  root.style.setProperty('--smiley-sz',  s.smileySz);
  root.style.setProperty('--num-font',   s.numFont);
}
const isSmartboard = new URLSearchParams(window.location.search).get('modus') === 'smartboard';
const isIpad = new URLSearchParams(window.location.search).get('modus') === 'ipad';
const isKindModus = new URLSearchParams(window.location.search).get('rol') === 'kind';

function applySmartboard(){
  if(!isSmartboard && !isIpad && !isKindModus) return;
  document.body.classList.add('smartboard');
  currentMode = 'board';
  setTimeout(updateScrollArrow, 500);
  setTimeout(updateScrollArrow, 1500);
  if(isIpad){
    document.body.classList.add('ipad-modus');
    // iPad: toon duidelijke sluit-knop met tekst
    var btn = document.getElementById('smartboard-exit-btn');
    if(btn){
      btn.textContent = '✕ Sluiten';
      btn.style.display = 'block';
    }
  } else {
    // Smartboard: discreet slotje
    var btn = document.getElementById('smartboard-exit-btn');
    if(btn) btn.style.display = 'block';
  }
}

function handleExitBtn(){
  if(isIpad){
    if(confirm('Wil je dit scherm sluiten?')){
      window.location.href = 'welkomstbord.html';
    }
  } else {
    document.getElementById('smartboard-exit-overlay').classList.remove('hidden');
  }
}

function hideBackupReminder(){
  const el = document.getElementById('backup-reminder');
  if(el) el.style.display = 'none';
}

function checkBackupReminder(){
  if(!state.pupils.length) return;
  const last = parseInt(localStorage.getItem('last_export_'+STORAGE_KEY)||'0');
  const days = (Date.now() - last) / (1000*60*60*24);
  const el = document.getElementById('backup-reminder');
  if(!el) return;
  el.style.display = (last === 0 || days > 7) ? 'flex' : 'none';
}

function exitSmartboard(dest){
  document.getElementById('smartboard-exit-overlay').classList.add('hidden');
  if(dest === 'welkom'){
    window.location.href = 'welkomstbord.html';
  } else {
    document.body.classList.remove('smartboard');
    var btn = document.getElementById('smartboard-exit-btn');
    if(btn) btn.style.display = 'none';
    currentMode = 'settings';
    renderShell();
  }
}
function goBackToWelcome(){
  window.location.href = 'welkomstbord.html';
}
function goBackFromBoard(){
  if(isSmartboard || isIpad || isKindModus) return;
  currentMode = 'settings';
  renderShell();
}

// INIT
function initKlasbordAfterLoad(){
  document.getElementById('toggle-numbers').checked = !!state.showNumbers;
  document.getElementById('toggle-lastname').checked = !!state.showLastname;
  document.getElementById('toggle-smileys').checked = !!state.showSmileys;

  const urlParams = new URLSearchParams(window.location.search);
  const isKindModus = urlParams.get('rol') === 'kind';
  const startTab = urlParams.get('tab');

  var hA=state.pupils&&state.pupils.length>0&&state.activeTasks&&state.activeTasks.length>0;
  currentMode=(isKindModus||urlParams.get('view')==='board'||hA)?'board':'settings';
  currentTab = startTab === 'taken' ? 'taken' : 'leerlingen';

  applySmartboard();
  applyBoardSize();
  renderShell();

  // Scroll-pijl listener
  var bs = document.getElementById('board-scroll');
  if(bs) bs.addEventListener('scroll', updateScrollArrow, {passive:true});
  window.addEventListener('resize', updateScrollArrow);
  setTimeout(updateScrollArrow, 300);
  setTimeout(updateScrollArrow, 800);
  setTimeout(updateScrollArrow, 2000);
}

if (window.fbOnReady) {
  window.fbOnReady(function(){
    loadState();
    setTimeout(initKlasbordAfterLoad, 300);
  });
} else {
  loadState();
  setTimeout(initKlasbordAfterLoad, 300);
}

// ── TIMER ────────────────────────────────────────────────────────────────────
var timerTotalSeconds = 15 * 60;
var timerRemaining    = 15 * 60;
var timerInterval     = null;
var timerPaused       = false;
var timerView         = 'both'; // 'both' | 'analog' | 'digital'
var timerFlashInterval = null;

function toggleTimer(){
  var p = document.getElementById('timer-popup');
  if(!p) return;
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

// Weergave: analoog + digitaal / enkel analoog / enkel digitaal
function setTimerView(mode){
  timerView = mode;
  var clock = document.getElementById('timer-clock');
  var digWrap = document.getElementById('timer-digital-wrap');
  var displayWrap = document.getElementById('timer-display-wrap');
  if(!clock || !digWrap) return;

  if(mode === 'both'){
    clock.style.display   = 'block';
    digWrap.style.display = 'flex';
    displayWrap.style.flexDirection = 'row';
  } else if(mode === 'analog'){
    clock.style.display   = 'block';
    digWrap.style.display = 'none';
    displayWrap.style.flexDirection = 'column';
  } else { // digital only
    clock.style.display   = 'none';
    digWrap.style.display = 'flex';
    displayWrap.style.flexDirection = 'column';
  }

  // Highlight actieve knop
  ['both','analog','digital'].forEach(function(v){
    var btn = document.getElementById('tv-' + v);
    if(!btn) return;
    var active = v === mode;
    btn.style.borderColor = active ? '#6366f1' : '#e0e7ff';
    btn.style.background  = active ? '#eef2ff' : '#f8fafc';
    btn.style.color       = active ? '#6366f1' : '#6b7280';
  });

  drawClock();
}

function adjustTime(delta){
  timerTotalSeconds = Math.max(60, timerTotalSeconds + delta * 60);
  timerRemaining    = timerTotalSeconds;
  updateSetDisplay();
}
function setTimerPreset(minutes){
  timerTotalSeconds = minutes * 60;
  timerRemaining    = timerTotalSeconds;
  updateSetDisplay();
}
function updateSetDisplay(){
  var el = document.getElementById('timer-set-display');
  if(!el) return;
  var m = Math.floor(timerTotalSeconds / 60), s = timerTotalSeconds % 60;
  el.textContent = timerPad(m) + ':' + timerPad(s);
}
function timerPad(n){ return n < 10 ? '0' + n : '' + n; }

function startTimer(){
  timerRemaining = timerTotalSeconds;
  timerPaused    = false;
  document.getElementById('timer-setup').style.display   = 'none';
  document.getElementById('timer-running').style.display = 'block';
  document.getElementById('timer-done').style.display    = 'none';
  setTimerView(timerView);
  clearInterval(timerInterval);
  timerInterval = setInterval(timerTick, 1000);
  timerTick();
}
function timerTick(){
  if(timerPaused) return;
  updateTimerDigital();
  drawClock();
  updateTimerProgress();
  if(timerRemaining <= 0){
    clearInterval(timerInterval);
    timerDone();
    return;
  }
  timerRemaining--;
}
function updateTimerDigital(){
  var el = document.getElementById('timer-digital');
  if(!el) return;
  var m = Math.floor(timerRemaining / 60), s = timerRemaining % 60;
  el.textContent = timerPad(m) + ':' + timerPad(s);
  el.style.color = timerRemaining < 60 ? '#dc2626' : '#1e1b4b';
}
function updateTimerProgress(){
  var bar = document.getElementById('timer-progress');
  if(!bar) return;
  var pct = timerTotalSeconds > 0 ? (timerRemaining / timerTotalSeconds) * 100 : 0;
  bar.style.width = pct + '%';
  if(pct > 50)      bar.style.background = 'linear-gradient(90deg,#6366f1,#22c55e)';
  else if(pct > 20) bar.style.background = 'linear-gradient(90deg,#f59e0b,#fbbf24)';
  else              bar.style.background = 'linear-gradient(90deg,#dc2626,#f87171)';
}
function drawClock(){
  var canvas = document.getElementById('timer-clock');
  if(!canvas || canvas.style.display === 'none') return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, r = W/2 - 6;
  ctx.clearRect(0, 0, W, H);

  var pct = timerTotalSeconds > 0 ? timerRemaining / timerTotalSeconds : 0;
  var fillColor = pct > 0.5 ? '#6366f1' : pct > 0.2 ? '#f59e0b' : '#dc2626';

  // Lege achtergrondcirkel (het al verstreken deel)
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI);
  ctx.fillStyle = '#f0f4f8'; ctx.fill();
  ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 2; ctx.stroke();

  // Gekleurde taartpunt = resterende tijd
  // Start bovenaan (12 uur = -90°), eindigt op de huidige "wijzerstand"
  // De schijf loopt van de huidige positie TOT bovenaan, met de klok mee
  // = van -90° + (2π * (1-pct))  tot  -90° + 2π
  // Wat gelijk is aan: de schijf vult van "huidige positie" naar "12 uur" met klok mee
  // Simpelste correcte aanpak:
  // - De LEGE sector loopt van 12 uur (boven) MET de klok mee, grootte = verstreken fractie
  // - De VOLLE sector is de rest
  if(pct > 0){
    var top = -Math.PI / 2;
    // Huidige "wijzerstand": hoeveel is verstreken = (1 - pct) van de cirkel
    var elapsed_angle = top + 2 * Math.PI * (1 - pct);
    // Volle schijf = van elapsed_angle tot top + 2π (= terug naar boven), met klok mee
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 2, elapsed_angle, top + 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  // Rand bovenop
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI);
  ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 2; ctx.stroke();

  // Uurmarkeringen (wit, bovenop schijf)
  for(var i = 0; i < 12; i++){
    var a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 2),  cy + Math.sin(a) * (r - 2));
    ctx.lineTo(cx + Math.cos(a) * (r - (i % 3 === 0 ? 11 : 7)), cy + Math.sin(a) * (r - (i % 3 === 0 ? 11 : 7)));
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.5;
    ctx.stroke();
  }

  // Middelpunt
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2*Math.PI);
  ctx.fillStyle = '#fff'; ctx.fill();

  // Tijd in het midden
  ctx.fillStyle = pct > 0.15 ? '#fff' : '#dc2626';
  ctx.font = 'bold ' + Math.round(r * 0.28) + 'px Nunito,Arial,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if(timerRemaining < 60){
    ctx.fillText('0:' + timerPad(timerRemaining % 60), cx, cy);
  } else {
    ctx.fillText(Math.ceil(timerRemaining / 60) + "'", cx, cy);
  }
}

function pauseResumeTimer(){
  timerPaused = !timerPaused;
  var btn = document.getElementById('timer-pause-btn');
  if(btn) btn.textContent = timerPaused ? '▶ Verder' : '⏸ Pauze';
}
function resetTimer(){
  clearInterval(timerInterval);
  timerInterval = null;
  // Stop knipperen en herstel stijl
  if(typeof timerFlashInterval !== 'undefined'){ clearInterval(timerFlashInterval); timerFlashInterval = null; }
  var pop = document.getElementById('timer-popup');
  if(pop){ pop.style.background = '#fff'; pop.style.border = '3px solid #e0e7ff'; pop.style.boxShadow = '0 8px 40px rgba(0,0,0,.22)'; }
  timerPaused   = false;
  timerRemaining = timerTotalSeconds;
  document.getElementById('timer-setup').style.display   = 'block';
  document.getElementById('timer-running').style.display = 'none';
  document.getElementById('timer-done').style.display    = 'none';
  updateSetDisplay();
}
function timerDone(){
  document.getElementById('timer-running').style.display = 'none';
  document.getElementById('timer-done').style.display    = 'block';

  // Geluid: herhalend alarm gedurende ~10 seconden
  // 3 tonen per cyclus, 5 cycli met korte pauze ertussen
  try {
    var ac = new (window.AudioContext || window.webkitAudioContext)();
    // Melodie: hoog-laag-hoog patroon, 5 keer herhalen
    var pattern = [
      {freq:880, t:0},    {freq:660, t:0.18}, {freq:880, t:0.36},
      {freq:880, t:0.9},  {freq:660, t:1.08}, {freq:880, t:1.26},
      {freq:880, t:1.8},  {freq:660, t:1.98}, {freq:880, t:2.16},
      {freq:880, t:2.7},  {freq:660, t:2.88}, {freq:880, t:3.06},
      {freq:880, t:3.6},  {freq:660, t:3.78}, {freq:880, t:3.96},
      {freq:1046,t:4.8},  {freq:1046,t:5.0},  {freq:1046,t:5.2}  // 3 hoge slottonen
    ];
    pattern.forEach(function(note){
      var osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = note.freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.45, ac.currentTime + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + note.t + 0.16);
      osc.start(ac.currentTime + note.t);
      osc.stop(ac.currentTime + note.t + 0.2);
    });
  } catch(e){}

  // Visuele puls: blijft knipperen tot leerkracht op "Nieuwe timer" klikt
  var pop = document.getElementById('timer-popup');
  pop.style.border = '3px solid #dc2626';
  pop.style.boxShadow = '0 0 0 0 rgba(220,38,38,0.7)';
  var fc = 0;
  timerFlashInterval = setInterval(function(){
    fc++;
    pop.style.background = fc % 2 === 0 ? '#fff5f5' : '#fff';
    pop.style.border     = fc % 2 === 0 ? '3px solid #dc2626' : '3px solid #fca5a5';
  }, 600);
}

// Draggable + resizable
(function(){
  var el, ox, oy, ol, ot, dragging = false;
  var resizing = false, rx, rw;
  document.addEventListener('mousedown', function(e){
    el = document.getElementById('timer-popup');
    if(!el) return;
    var handle = document.getElementById('timer-drag-handle');
    var resizeH = document.getElementById('timer-resize');
    if(resizeH && e.target === resizeH){
      rx = e.clientX; rw = el.offsetWidth; resizing = true; e.preventDefault();
    } else if(handle && handle.contains(e.target) && e.target.tagName !== 'BUTTON'){
      var rect = el.getBoundingClientRect();
      ox=e.clientX; oy=e.clientY; ol=rect.left; ot=rect.top;
      dragging=true; e.preventDefault();
    }
  });
  document.addEventListener('mousemove', function(e){
    if(!el) return;
    if(dragging){ el.style.left=(ol+e.clientX-ox)+'px'; el.style.top=(ot+e.clientY-oy)+'px'; el.style.right='auto'; }
    if(resizing){
      var newW = Math.max(170, rw+(e.clientX-rx));
      el.style.width = newW + 'px';
      // Canvas mee schalen
      var canvas = document.getElementById('timer-clock');
      if(canvas && timerView !== 'digital'){
        var cSize = Math.min(newW * 0.42, 180);
        canvas.width = cSize; canvas.height = cSize;
        drawClock();
      }
    }
  });
  document.addEventListener('mouseup', function(){ dragging=false; resizing=false; });
})();