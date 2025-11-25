
// FIT • Desafio — app.js (recreated)
// Simple, self-contained single-file app using localStorage. No external backend.

const STATE_KEY = 'fit_recreated_v3';
const DEFAULT = { days:{}, jejum:{running:false,start:null,history:[]}, purchases:[], foods:[], program:null, workoutLog:[] };
let state = loadState();

function loadState(){ try{ const s=localStorage.getItem(STATE_KEY); return s?JSON.parse(s):JSON.parse(JSON.stringify(DEFAULT)); } catch(e){ return JSON.parse(JSON.stringify(DEFAULT)); } }
function saveState(){ localStorage.setItem(STATE_KEY, JSON.stringify(state)); }

// Ensure today exists
function isoToday(){ return new Date().toISOString().slice(0,10); }
function ensureDay(d){ if(!state.days[d]) state.days[d] = { meals:[], water:0, checklist:{jejum:false,agua:false,treino:false,caminhada:false} }; saveState(); }

// Program (7-day) for home workouts
const PROGRAM = [
  { name:'Dia 1 - Full Body HIIT', exercises:[ {name:'Pular Corda',type:'timed',duration:60,rest:20,kcal_min:12}, {name:'Agachamento com Halteres',type:'reps',sets:4,reps:12,rest:45,kcal_set:8}, {name:'Remada Polia',type:'reps',sets:3,reps:10,rest:45,kcal_set:7}, {name:'Burpees',type:'timed',duration:45,rest:30,kcal_min:14} ] },
  { name:'Dia 2 - Core & Mobility', exercises:[ {name:'Prancha',type:'timed',duration:60,rest:30,kcal_min:4}, {name:'Abdominal Bicicleta',type:'timed',duration:60,rest:20,kcal_min:6}, {name:'Russian Twist',type:'reps',sets:3,reps:20,rest:30,kcal_set:4}, {name:'Alongamento Dinâmico',type:'timed',duration:300,rest:0,kcal_min:2} ] },
  { name:'Dia 3 - Upper Body Strength', exercises:[ {name:'Supino Halteres',type:'reps',sets:4,reps:8,rest:60,kcal_set:9}, {name:'Puxada Polia',type:'reps',sets:4,reps:10,rest:60,kcal_set:8}, {name:'Desenv Halteres',type:'reps',sets:3,reps:10,rest:45,kcal_set:7}, {name:'Rosca Direta',type:'reps',sets:3,reps:12,rest:30,kcal_set:5} ] },
  { name:'Dia 4 - Cardio Intervals', exercises:[ {name:'Corda Sprints',type:'timed',duration:30,rest:15,repeats:8,kcal_min:15}, {name:'Corrida no Lugar',type:'timed',duration:300,rest:60,kcal_min:11} ] },
  { name:'Dia 5 - Lower Body & Core', exercises:[ {name:'Agachamento Sumô',type:'reps',sets:4,reps:12,rest:45,kcal_set:8}, {name:'Avanço Halteres',type:'reps',sets:3,reps:12,rest:45,kcal_set:7}, {name:'Stiff Halteres',type:'reps',sets:3,reps:10,rest:45,kcal_set:7}, {name:'Prancha Lateral',type:'timed',duration:45,rest:20,kcal_min:3} ] },
  { name:'Dia 6 - Full Body Circuit', exercises:[ {name:'Circuit x3: Corda/Push/Agach/Remada',type:'circuit',rounds:3,per_round_rest:90,kcal_round:80} ] },
  { name:'Dia 7 - Active Recovery', exercises:[ {name:'Caminhada leve',type:'timed',duration:1800,rest:0,kcal_min:4}, {name:'Alongamento',type:'timed',duration:600,rest:0,kcal_min:2} ] }
];

// Initialize program into state if missing
if(!state.program){ state.program = PROGRAM; saveState(); }

// DOM helpers
const el = q => document.querySelector(q);
const els = q => Array.from(document.querySelectorAll(q));

document.addEventListener('DOMContentLoaded', ()=>{
  // tabs
  els('.tabs .tab').forEach(b=>b.addEventListener('click', (e)=>{
  els('.tabs .tab').forEach(b=>b.addEventListener('touchstart', (e)=>{
    els('.tabs .tab').forEach(x=>x.classList.remove('active'));
    e.target.classList.add('active');
    const tab = e.target.dataset.tab;
    els('.tabview').forEach(s=>s.classList.remove('active'));
    el('#'+tab).classList.add('active');
    if(tab==='relatorios') renderCharts();
  }));

  // date/time + rollover
  renderDate(); setInterval(renderDate,1000);

  // bind day UI
  bindDayUI();

  // render program and workout log
  renderProgram();
  renderWorkoutLog();

  // purchases and foods
  renderPurchases();
  renderFoods();

  // import/export
  el('#exportBtn').addEventListener('click', ()=>download('fit-backup.json', JSON.stringify(state,null,2)));
  el('#exportBtn').addEventListener('touchstart', ()=>download('fit-backup.json', JSON.stringify(state,null,2)));
  el('#importBtn').addEventListener('click', ()=>el('#importFile').click());
  el('#importBtn').addEventListener('touchstart', ()=>el('#importFile').touchstart());
  el('#importFile').addEventListener('change', (ev)=>{ const f=ev.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ state=JSON.parse(r.result); saveState(); location.reload(); }; r.readAsText(f); });

  // charts initial
  renderCharts();
});

// Date/time and ensure today's day object exists
function renderDate(){
  const now = new Date();
  el('#dateNow').textContent = now.toLocaleString();
  const iso = isoToday();
  if(!state.currentDay || state.currentDay !== iso){ state.currentDay = iso; ensureDay(iso); saveState(); renderAllDay(); }
}

function renderAllDay(){ renderChecklist(); renderMeals(); renderWater(); renderSummary(); renderFastStatus(); }

// Day UI binding
function bindDayUI(){
  el('#addMeal').addEventListener('click', addMeal);
  el('#addMeal').addEventListener('touchstart', addMeal);
  el('#mealName').addEventListener('keydown', (e)=>{ if(e.key==='Enter') addMeal(); });
  els('.addWater').forEach(b=>b.addEventListener('click', ()=>{ addWater(Number(b.dataset.amount)); }));
  els('.addWater').forEach(b=>b.addEventListener('touchstart', ()=>{ addWater(Number(b.dataset.amount)); }));
  el('#resetWater').addEventListener('click', ()=>{ state.days[isoToday()].water=0; saveState(); renderWater(); renderSummary(); });
  el('#resetWater').addEventListener('touchstart', ()=>{ state.days[isoToday()].water=0; saveState(); renderWater(); renderSummary(); });
  el('#startFast').addEventListener('click', ()=>startFast(Number(el('#fastPreset').value)));
  el('#startFast').addEventListener('touchstart', ()=>startFast(Number(el('#fastPreset').value)));
  el('#stopFast').addEventListener('click', stopFast);
  el('#stopFast').addEventListener('touchstart', stopFast);
  el('#addFood').addEventListener('click', addFood);
  el('#addFood').addEventListener('touchstart', addFood);
  el('#addPurchase').addEventListener('click', addPurchase);
  el('#addPurchase').addEventListener('touchstart', addPurchase);
}

// Meals functions
function addMeal(){
  const name = el('#mealName').value.trim(); const qty = Number(el('#mealQty').value)||100; const kcal = Number(el('#mealKcal').value)||0;
  if(!name) return alert('Digite o alimento');
  const iso = isoToday(); ensureDay(iso);
  state.days[iso].meals.push({name,qty,kcal});
  saveState(); el('#mealName').value=''; renderMeals(); renderSummary();
}
function renderMeals(){
  const iso = isoToday(); ensureDay(iso);
  const ul = el('#meals'); ul.innerHTML = '';
  let total = 0;
  state.days[iso].meals.forEach((m,i)=>{
    const kcalTotal = Math.round(m.kcal*m.qty/100); total += kcalTotal;
    const li = document.createElement('li');
    li.innerHTML = `${m.name} - ${m.qty}g - ${kcalTotal} kcal <button data-i="${i}" class="delMeal">x</button>`;
    ul.appendChild(li);
  });
  els('.delMeal').forEach(b=>b.addEventListener('click',(e)=>{ const i = e.target.dataset.i; state.days[isoToday()].meals.splice(i,1); saveState(); renderMeals(); renderSummary(); }));
  els('.delMeal').forEach(b=>b.addEventListener('touchstart',(e)=>{ const i = e.target.dataset.i; state.days[isoToday()].meals.splice(i,1); saveState(); renderMeals(); renderSummary(); }));
  el('#totalKcal').textContent = total; el('#resKcal').textContent = total;
}

// Water
function addWater(n){ const iso = isoToday(); ensureDay(iso); state.days[iso].water += n; saveState(); renderWater(); renderSummary(); }
function renderWater(){ const iso = isoToday(); ensureDay(iso); el('#waterNow').textContent = state.days[iso].water; el('#resWater').textContent = state.days[iso].water; }

// Checklist
function renderChecklist(){ const iso = isoToday(); ensureDay(iso); const container = el('#checklist'); container.innerHTML = ''; Object.keys(state.days[iso].checklist).forEach(k=>{ const id = 'cb_'+k; const lbl = document.createElement('label'); lbl.innerHTML = `<input type="checkbox" id="${id}" data-key="${k}" ${state.days[iso].checklist[k]?'checked':''}/> ${k}`; container.appendChild(lbl); }); container.querySelectorAll('input').forEach(cb=>cb.addEventListener('change',(e)=>{ state.days[isoToday()].checklist[e.target.dataset.key] = e.target.checked; if(e.target.checked) state.points = (state.points||0)+5; saveState(); })) }

// Summary
function renderSummary(){ const iso = isoToday(); ensureDay(iso); let kcal=0; state.days[iso].meals.forEach(m=> kcal += Math.round(m.kcal*m.qty/100)); el('#resKcal').textContent = kcal; el('#resWater').textContent = state.days[iso].water; el('#resFast').textContent = Math.round(getFastHours()*100)/100; }

// Jejum (fast)
let fastInterval = null;
function startFast(hours){ if(state.jejum.running) return alert('Já em jejum'); state.jejum.running = true; state.jejum.start = Date.now(); state.jejum.preset = hours; saveState(); updateFastUI(); fastInterval = setInterval(updateFastUI,1000); }
function stopFast(){ if(!state.jejum.running) return; state.jejum.running=false; const duration = Math.floor((Date.now()-state.jejum.start)/1000); state.jejum.history.unshift({start:state.jejum.start,duration}); state.jejum.start=null; saveState(); clearInterval(fastInterval); renderFastHistory(); updateFastUI(); }
function updateFastUI(){ if(!state.jejum.running){ el('#fastStatus').textContent='Não em jejum'; el('#fastTimer').textContent='00:00:00'; return; } el('#fastStatus').textContent='Em jejum'; const s = Math.floor((Date.now()-state.jejum.start)/1000); el('#fastTimer').textContent = new Date(s*1000).toISOString().substr(11,8); el('#resFast').textContent = Math.round(getFastHours()*100)/100; }
function getFastHours(){ if(!state.jejum.running) return 0; return (Date.now()-state.jejum.start)/(1000*3600); }
function renderFastHistory(){ const ul = el('#fastHistory'); ul.innerHTML=''; state.jejum.history.slice(0,50).forEach(h=>{ const li = document.createElement('li'); li.textContent = new Date(h.start).toLocaleString() + ' - ' + Math.round(h.duration/3600) + ' h'; ul.appendChild(li); }); }

// Program rendering and runner
function renderProgram(){
  const container = el('#programList'); container.innerHTML='';
  state.program.forEach((day, idx)=>{
    const div = document.createElement('div'); div.className='program-day';
    div.innerHTML = `<div><strong>${day.name}</strong></div><div><button data-day="${idx}" class="viewDay">Ver</button> <button data-day="${idx}" class="startDay">Iniciar</button></div>`;
    container.appendChild(div);
  });
  els('.viewDay').forEach(b=>b.addEventListener('click',(e)=>viewDay(Number(e.target.dataset.day))));
  els('.viewDay').forEach(b=>b.addEventListener('touchstart',(e)=>viewDay(Number(e.target.dataset.day))));
  els('.startDay').forEach(b=>b.addEventListener('click',(e)=>startDay(Number(e.target.dataset.day))));
  els('.startDay').forEach(b=>b.addEventListener('touchstart',(e)=>startDay(Number(e.target.dataset.day))));
}

function viewDay(idx){
  const day = state.program[idx]; const active = el('#activeWorkout'); active.innerHTML = `<h4>${day.name}</h4>`;
  const ul = document.createElement('ul'); day.exercises.forEach(ex=>{ const li = document.createElement('li'); li.textContent = describe(ex); ul.appendChild(li); }); active.appendChild(ul);
}

function describe(ex){
  if(ex.type==='reps') return `${ex.name} — ${ex.sets}x${ex.reps} (desc ${ex.rest}s)`;
  if(ex.type==='timed') return `${ex.name} — ${ex.duration}s (desc ${ex.rest||0}s)`;
  if(ex.type==='circuit') return `${ex.name} — Rounds: ${ex.rounds}`;
  return ex.name;
}

// runner implementation
function startDay(idx){
  const day = state.program[idx]; const active = el('#activeWorkout'); active.innerHTML = `<h4>${day.name}</h4><div id="runner"></div>`;
  const seq = [];
  day.exercises.forEach(ex=>{
    if(ex.type==='reps'){ for(let s=1;s<=ex.sets;s++){ seq.push({kind:'reps',ex,set:s}); seq.push({kind:'rest',duration:ex.rest}); } }
    else if(ex.type==='timed'){ const repeats = ex.repeats||1; for(let r=0;r<repeats;r++){ seq.push({kind:'timed',ex}); if(ex.rest) seq.push({kind:'rest',duration:ex.rest}); } }
    else if(ex.type==='circuit'){ for(let r=0;r<ex.rounds;r++){ seq.push({kind:'circuit',ex,round:r+1}); seq.push({kind:'rest',duration:ex.per_round_rest}); } }
  });
  let pos = 0; let timer = null; let remaining = 0;
  function show(){ const runner = el('#runner'); runner.innerHTML=''; if(pos>=seq.length){ runner.innerHTML = '<div>Treino concluído ✅</div><button id="saveSess">Salvar sessão</button>'; el('#saveSess').addEventListener('click', saveSession); return; } const cur = seq[pos]; const box = document.createElement('div'); box.className='runner-box';
  function show(){ const runner = el('#runner'); runner.innerHTML=''; if(pos>=seq.length){ runner.innerHTML = '<div>Treino concluído ✅</div><button id="saveSess">Salvar sessão</button>'; el('#saveSess').addEventListener('touchstart', saveSession); return; } const cur = seq[pos]; const box = document.createElement('div'); box.className='runner-box';
    if(cur.kind==='reps'){ box.innerHTML = `<div><strong>${cur.ex.name}</strong> — Série ${cur.set}/${cur.ex.sets} • ${cur.ex.reps} rep</div><div><button id="nextBtn">Próxima</button></div>`; runner.appendChild(box); el('#nextBtn').addEventListener('click', ()=>{ pos++; show(); }); }
    if(cur.kind==='reps'){ box.innerHTML = `<div><strong>${cur.ex.name}</strong> — Série ${cur.set}/${cur.ex.sets} • ${cur.ex.reps} rep</div><div><button id="nextBtn">Próxima</button></div>`; runner.appendChild(box); el('#nextBtn').addEventListener('touchstart', ()=>{ pos++; show(); }); }
    else if(cur.kind==='timed'){ remaining = cur.ex.duration; box.innerHTML = `<div><strong>${cur.ex.name}</strong> — ${cur.ex.duration}s</div><div id="timerD">${remaining}s</div><div><button id="skipBtn">Pular</button></div>`; runner.appendChild(box); el('#skipBtn').addEventListener('click', ()=>{ clearInterval(timer); pos++; show(); }); timer = setInterval(()=>{ remaining--; const d = el('#timerD'); if(d) d.textContent = remaining+'s'; if(remaining<=0){ clearInterval(timer); pos++; show(); } },1000); }
    else if(cur.kind==='timed'){ remaining = cur.ex.duration; box.innerHTML = `<div><strong>${cur.ex.name}</strong> — ${cur.ex.duration}s</div><div id="timerD">${remaining}s</div><div><button id="skipBtn">Pular</button></div>`; runner.appendChild(box); el('#skipBtn').addEventListener('touchstart', ()=>{ clearInterval(timer); pos++; show(); }); timer = setInterval(()=>{ remaining--; const d = el('#timerD'); if(d) d.textContent = remaining+'s'; if(remaining<=0){ clearInterval(timer); pos++; show(); } },1000); }
    else if(cur.kind==='rest'){ remaining = cur.duration; box.innerHTML = `<div>Descanso — ${remaining}s</div><div id="restD">${remaining}s</div><div><button id="skipR">Pular descanso</button></div>`; runner.appendChild(box); el('#skipR').addEventListener('click', ()=>{ clearInterval(timer); pos++; show(); }); timer = setInterval(()=>{ remaining--; const d = el('#restD'); if(d) d.textContent = remaining+'s'; if(remaining<=0){ clearInterval(timer); pos++; show(); } },1000); }
    else if(cur.kind==='rest'){ remaining = cur.duration; box.innerHTML = `<div>Descanso — ${remaining}s</div><div id="restD">${remaining}s</div><div><button id="skipR">Pular descanso</button></div>`; runner.appendChild(box); el('#skipR').addEventListener('touchstart', ()=>{ clearInterval(timer); pos++; show(); }); timer = setInterval(()=>{ remaining--; const d = el('#restD'); if(d) d.textContent = remaining+'s'; if(remaining<=0){ clearInterval(timer); pos++; show(); } },1000); }
    else if(cur.kind==='circuit'){ box.innerHTML = `<div><strong>Round ${cur.round}/${cur.ex.rounds}</strong> — ${cur.ex.name}</div><div><button id="doneR">Finalizar Round</button></div>`; runner.appendChild(box); el('#doneR').addEventListener('click', ()=>{ pos++; show(); }); }
    else if(cur.kind==='circuit'){ box.innerHTML = `<div><strong>Round ${cur.round}/${cur.ex.rounds}</strong> — ${cur.ex.name}</div><div><button id="doneR">Finalizar Round</button></div>`; runner.appendChild(box); el('#doneR').addEventListener('touchstart', ()=>{ pos++; show(); }); }
  }
  function saveSession(){ const session = { day: day.name, date: new Date().toISOString() }; state.workoutLog.unshift(session); saveState(); renderWorkoutLog(); alert('Sessão salva!'); }
  show();
}

function renderWorkoutLog(){ const ul = el('#workoutLog'); ul.innerHTML=''; state.workoutLog.forEach(s=>{ const li = document.createElement('li'); li.textContent = `${new Date(s.date).toLocaleString()} — ${s.day}`; ul.appendChild(li); }); }

// purchases
function addPurchase(){ const item = prompt('Item'); if(!item) return; const price = parseFloat(prompt('Preço R$'))||0; const qty = parseFloat(prompt('Quantidade'))||1; const cat = prompt('Categoria')||'Geral'; const date = new Date().toISOString(); state.purchases.unshift({item,price,qty,cat,date}); saveState(); renderPurchases(); renderCharts(); }
function renderPurchases(){ const tbody = document.querySelector('#pTable tbody'); tbody.innerHTML=''; let total=0; state.purchases.forEach((p,i)=>{ total += p.price; const tr = document.createElement('tr'); tr.innerHTML = `<td>${p.item}</td><td>${p.cat}</td><td>${p.qty}</td><td>R$ ${p.price.toFixed(2)}</td><td>${new Date(p.date).toLocaleDateString()}</td><td><button data-i="${i}" class="delP">x</button></td>`; tbody.appendChild(tr); }); el('#totalSpent').textContent = total.toFixed(2); els('.delP').forEach(b=>b.addEventListener('click',(e)=>{ state.purchases.splice(e.target.dataset.i,1); saveState(); renderPurchases(); renderCharts(); })); }
function renderPurchases(){ const tbody = document.querySelector('#pTable tbody'); tbody.innerHTML=''; let total=0; state.purchases.forEach((p,i)=>{ total += p.price; const tr = document.createElement('tr'); tr.innerHTML = `<td>${p.item}</td><td>${p.cat}</td><td>${p.qty}</td><td>R$ ${p.price.toFixed(2)}</td><td>${new Date(p.date).toLocaleDateString()}</td><td><button data-i="${i}" class="delP">x</button></td>`; tbody.appendChild(tr); }); el('#totalSpent').textContent = total.toFixed(2); els('.delP').forEach(b=>b.addEventListener('touchstart',(e)=>{ state.purchases.splice(e.target.dataset.i,1); saveState(); renderPurchases(); renderCharts(); })); }

// foods
function addFood(){ const name = el('#foodName').value.trim(); const qty = Number(el('#foodQty').value)||100; const kcal = Number(el('#foodKcal').value)||0; if(!name) return alert('Digite alimento'); state.foods.unshift({name,qty,kcal}); saveState(); renderFoods(); }
function renderFoods(){ const ul = el('#foodList'); ul.innerHTML=''; state.foods.forEach(f=>{ const li = document.createElement('li'); li.textContent = `${f.name} - ${f.qty}g - ${f.kcal} kcal/100g`; ul.appendChild(li); }); }

// charts
function renderCharts(){
  try{
    const ctx1 = document.getElementById('chartFast')?.getContext('2d');
    const labels = state.jejum.history.slice(0,14).map(h=>new Date(h.start).toLocaleDateString()).reverse();
    const dataF = state.jejum.history.slice(0,14).map(h=>Math.round(h.duration/3600)).reverse();
    if(ctx1) new Chart(ctx1,{type:'bar',data:{labels,datasets:[{label:'Horas jejum',data:dataF}]}});

    const last = getLastDays(7);
    const ctx2 = document.getElementById('chartCal')?.getContext('2d');
    if(ctx2) new Chart(ctx2,{type:'line',data:{labels:last.map(x=>x.date),datasets:[{label:'Calorias',data:last.map(x=>x.cal)}]}});

    const ctx3 = document.getElementById('chartWater')?.getContext('2d');
    if(ctx3) new Chart(ctx3,{type:'bar',data:{labels:last.map(x=>x.date),datasets:[{label:'Água',data:last.map(x=>x.water)}]}});

    const months = groupPurchases();
    const ctx4 = document.getElementById('chartSpend')?.getContext('2d');
    if(ctx4) new Chart(ctx4,{type:'line',data:{labels:months.labels,datasets:[{label:'Gastos',data:months.data}]}});
  }catch(e){ console.log('chart err',e) }
}

function getLastDays(n){ const out=[]; for(let i=n-1;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const iso = d.toISOString().slice(0,10); ensureDay(iso); let cal=0; state.days[iso].meals.forEach(m=> cal += Math.round(m.kcal*m.qty/100)); out.push({date:d.toLocaleDateString(),cal,water:state.days[iso].water}); } return out; }
function groupPurchases(){ const map={}; state.purchases.forEach(p=>{ const k=new Date(p.date).toISOString().slice(0,7); map[k]=(map[k]||0)+p.price; }); const labels = Object.keys(map).sort(); return { labels, data: labels.map(k=>map[k]) }; }

// utilities
function download(filename,text){ const a=document.createElement('a'); a.href = URL.createObjectURL(new Blob([text],{type:'application/json'})); a.download = filename; a.click(); }

// initial ensure
ensureDay(isoToday());