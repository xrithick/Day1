// Shared helpers
function getStudents(){ return JSON.parse(localStorage.getItem('students') || '[]'); }
function saveStudents(list){ localStorage.setItem('students', JSON.stringify(list)); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
