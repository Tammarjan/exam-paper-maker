const $=id=>document.getElementById(id);
const KEY="exam_papers_v1";
let current=null,questions=[];
const types={short:"Short question",long:"Long question",mcq:"MCQ",blank:"Fill in blanks",truefalse:"True / False",match:"Match columns",complete:"Complete sentence",diagram:"Diagram / picture"};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return[]}};
const write=a=>localStorage.setItem(KEY,JSON.stringify(a));
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const marks=()=>questions.reduce((n,q)=>n+(Number(q.marks)||0),0);
function show(id){["home","editor","questions","preview"].forEach(x=>$(x).hidden=x!==id);scrollTo(0,0)}
function notify(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1800)}
function collect(){return{id:current?current.id:uid(),school:$("school").value,exam:$("exam").value,className:$("class").value,subject:$("subject").value,total:Number($("total").value),time:$("time").value,date:$("date").value,lang:$("lang").value,instructions:$("instructions").value,questions:questions}}
function fill(p){$("school").value=p.school||"";$("exam").value=p.exam||"";$("class").value=p.className||"";$("subject").value=p.subject||"";$("total").value=p.total||"";$("time").value=p.time||"";$("date").value=p.date||"";$("lang").value=p.lang||"en";$("instructions").value=p.instructions||""}
function refresh(){const a=read();$("saved").innerHTML=a.length?a.map(p=>'<div class="card"><div><b>'+esc(p.exam)+'</b><small>'+esc(p.className)+' · '+esc(p.subject)+' · '+p.total+' marks</small></div><span><button data-open="'+p.id+'">Open</button><button data-remove="'+p.id+'">×</button></span></div>').join(""):"<p>No saved papers yet.</p>"}
function renderQuestions(){$("calculated").textContent=marks();$("summary").textContent=(current?.exam||"Exam")+" · "+marks()+" / "+(current?.total||0)+" marks";$("list").innerHTML=questions.map((q,i)=>'<div class="question"><small>Q'+(i+1)+' · '+types[q.type]+' · '+q.marks+' marks</small><p>'+esc(q.label)+' '+esc(q.text)+'</p>'+(q.options?'<pre>'+esc(q.options)+'</pre>':"")+'<button data-up="'+q.id+'">↑</button><button data-down="'+q.id+'">↓</button><button data-delete="'+q.id+'">Delete</button></div>').join("")||"<p>No questions added yet.</p>"}
$("new").onclick=()=>{current=null;questions=[];fill({});show("editor")};
$("back").onclick=()=>show("home");$("backDetails").onclick=()=>show("editor");$("backQuestions").onclick=()=>show("questions");$("homeNav").onclick=()=>show("home");
$("details").onsubmit=e=>{e.preventDefault();current=collect();renderQuestions();show("questions")};
$("type").onchange=()=>{$("optionsLabel").hidden=$("type").value!=="mcq"};
$("add").onclick=()=>{const text=$("text").value.trim();if(!text)return notify("Write the question first.");questions.push({id:uid(),type:$("type").value,text:text,marks:Number($("marks").value)||0,label:$("label").value,options:$("type").value==="mcq"?$("options").value:""});$("text").value="";$("options").value="";$("label").value="";renderQuestions();notify("Question added")};
$("list").onclick=e=>{const b=e.target.closest("button");if(!b)return;const i=questions.findIndex(q=>q.id===Object.values(b.dataset)[0]);if(i<0)return;if(b.dataset.delete)questions.splice(i,1);if(b.dataset.up&&i>0)[questions[i-1],questions[i]]=[questions[i],questions[i-1]];if(b.dataset.down&&i<questions.length-1)[questions[i+1],questions[i]]=[questions[i],questions[i+1]];renderQuestions()};
$("preview").onclick=()=>{if(!questions.length)return notify("Add at least one question.");current=collect();const rtl=current.lang!=="en";$("paper").dir=rtl?"rtl":"ltr";$("paper").innerHTML=(current.school?'<h3>'+esc(current.school)+'</h3>':"")+'<h2>'+esc(current.exam)+'</h2><div class="meta"><span>Class: '+esc(current.className)+'</span><span>Subject: '+esc(current.subject)+'</span><span>Time: '+esc(current.time)+'</span><span>Total marks: '+current.total+'</span><span>Date: '+esc(current.date)+'</span></div><p>Name: ____________________ &nbsp; Roll No: __________</p>'+(current.instructions?'<p>Instructions: '+esc(current.instructions)+'</p>':"")+'<h3>Questions</h3>'+questions.map((q,i)=>'<div class="pq"><div class="qtext"><b>'+(i+1)+'.</b> '+esc(q.label)+' '+esc(q.text)+(q.options?'<pre>'+esc(q.options)+'</pre>':"")+'</div><b>('+q.marks+')</b></div>').join("")+'<p style="text-align:center">— End of Paper —</p>';show("preview")};
$("print").onclick=()=>window.print();
$("save").onclick=()=>{const p=collect(),a=read(),i=a.findIndex(x=>x.id===p.id);if(i<0)a.unshift(p);else a[i]=p;write(a);current=p;refresh();notify("Paper saved on this device")};
$("saved").onclick=e=>{const b=e.target.closest("button");if(!b)return;const a=read();if(b.dataset.remove){write(a.filter(p=>p.id!==b.dataset.remove));refresh()}if(b.dataset.open){current=a.find(p=>p.id===b.dataset.open);questions=current.questions||[];fill(current);renderQuestions();show("editor")}};
function download(obj,name){const u=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
$("export").onclick=()=>download({papers:read()},"exam-paper-maker-backup.json");
$("import").onclick=()=>$("backup").click();
$("backup").onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!Array.isArray(d.papers))throw Error();const m=new Map(read().map(p=>[p.id,p]));d.papers.forEach(p=>m.set(p.id,p));write([...m.values()]);refresh();notify("Backup imported")}catch(err){notify("Invalid backup file")}e.target.value=""};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
refresh();