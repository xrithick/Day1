const dateInput = document.getElementById('dateInput');
const searchInput = document.getElementById('searchInput');
const listEl = document.getElementById('studentList');
const emptyEl = document.getElementById('emptyState');
const statsBar = document.getElementById('statsBar');

dateInput.value = todayStr();

function calcPct(student){
  const days = Object.values(student.attendance || {});
  if(!days.length) return {pct:0, present:0, total:0};
  const present = days.filter(v => v==='present').length;
  return {pct: Math.round(present/days.length*100), present, total:days.length};
}

function render(){
  const students = getStudents();
  const date = dateInput.value;
  const q = (searchInput.value || '').toLowerCase().trim();

  if(!students.length){
    listEl.innerHTML='';
    statsBar.innerHTML='';
    emptyEl.style.display='block';
    return;
  }
  emptyEl.style.display='none';

  // Stats
  let pToday=0,aToday=0,marked=0;
  students.forEach(s=>{
    const v = (s.attendance||{})[date];
    if(v==='present'){pToday++;marked++;}
    else if(v==='absent'){aToday++;marked++;}
  });
  statsBar.innerHTML = `
    <div class="pill">👥 Total: <strong>${students.length}</strong></div>
    <div class="pill">✅ Present today: <strong>${pToday}</strong></div>
    <div class="pill">❌ Absent today: <strong>${aToday}</strong></div>
    <div class="pill">⏳ Unmarked: <strong>${students.length-marked}</strong></div>
  `;

  const filtered = students.filter(s =>
    !q || s.fullName.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
  );

  listEl.innerHTML = filtered.map(s => {
    const status = (s.attendance||{})[date];
    const {pct, present, total} = calcPct(s);
    return `
      <div class="student-card" data-id="${s.id}">
        <div class="info">
          <h4>${s.fullName}</h4>
          <small>Roll: ${s.rollNo} · ${s.className}</small>
        </div>
        <div class="pct">${pct}%<small>${present}/${total} days</small></div>
        <div style="display:flex;gap:.5rem;align-items:center">
          <div class="toggle-group">
            <button class="toggle-btn present ${status==='present'?'active':''}" data-act="present">✓ Present</button>
            <button class="toggle-btn absent ${status==='absent'?'active':''}" data-act="absent">✗ Absent</button>
          </div>
          <button class="del-btn" data-act="delete" title="Remove student">🗑</button>
        </div>
      </div>`;
  }).join('');
}

listEl.addEventListener('click', e=>{
  const btn = e.target.closest('[data-act]');
  if(!btn) return;
  const card = btn.closest('.student-card');
  const id = card.dataset.id;
  const act = btn.dataset.act;
  const students = getStudents();
  const idx = students.findIndex(s=>s.id===id);
  if(idx<0) return;

  if(act==='delete'){
    if(confirm('Remove this student and all their attendance?')){
      students.splice(idx,1);
      saveStudents(students);
      render();
    }
    return;
  }
  students[idx].attendance = students[idx].attendance || {};
  const date = dateInput.value;
  // Toggle off if already same
  if(students[idx].attendance[date] === act){
    delete students[idx].attendance[date];
  } else {
    students[idx].attendance[date] = act;
  }
  saveStudents(students);
  render();
});

dateInput.addEventListener('change', render);
searchInput.addEventListener('input', render);

document.getElementById('markAllPresent').addEventListener('click', ()=>{
  const date = dateInput.value;
  const students = getStudents();
  students.forEach(s=>{ s.attendance = s.attendance||{}; s.attendance[date]='present'; });
  saveStudents(students);
  render();
});

document.getElementById('exportCsv').addEventListener('click', ()=>{
  const students = getStudents();
  if(!students.length) return alert('No students to export.');
  // Collect all dates
  const dates = new Set();
  students.forEach(s=>Object.keys(s.attendance||{}).forEach(d=>dates.add(d)));
  const dateCols = [...dates].sort();
  const headers = ['Roll No','Name','Class','Attendance %', ...dateCols];
  const rows = students.map(s=>{
    const {pct} = calcPct(s);
    return [s.rollNo, s.fullName, s.className, pct+'%',
      ...dateCols.map(d => (s.attendance||{})[d] || '-')];
  });
  const csv = [headers, ...rows].map(r => r.map(c=>`"${(c+'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `attendance-${todayStr()}.csv`;
  a.click();
});

render();
