const STORAGE_KEY = "dj-gig-planner-v1";
const $ = (id) => document.getElementById(id);
const today = new Date();
const localISO = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const plusDays = (days) => { const d = new Date(); d.setDate(d.getDate()+days); return localISO(d); };
const seedGigs = [
 {id:crypto.randomUUID(),name:"Neon Room",city:"München",date:plusDays(3),time:"22:00",fee:650,status:"Bestätigt",contact:"Max · Veranstalter",contactInfo:"",notes:"Peak-Time Set",paid:false},
 {id:crypto.randomUUID(),name:"Club Frequency",city:"Kempten",date:plusDays(8),time:"23:00",fee:450,status:"Angefragt",contact:"Sarah · Booking",contactInfo:"",notes:"Line-up noch offen",paid:false},
 {id:crypto.randomUUID(),name:"Warehouse Sessions",city:"Stuttgart",date:plusDays(15),time:"21:00",fee:800,status:"Bestätigt",contact:"Luca · Veranstalter",contactInfo:"",notes:"USB-Sticks und Kopfhörer einpacken",paid:true}
];
let gigs = loadData();
let monthCursor = new Date(today.getFullYear(), today.getMonth(), 1);
let activeFilter = "Alle";
let toastTimer;
function loadData(){
 try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(parsed) ? parsed : seedGigs; }
 catch { return seedGigs; }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(gigs)); render(); }
function euro(n){ return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(n)||0); }
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function monthLabel(date){return new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric"}).format(date).replace(/^./,c=>c.toUpperCase());}
function shortMonth(iso){return new Intl.DateTimeFormat("de-DE",{month:"short"}).format(new Date(`${iso}T12:00:00`)).replace(".","").toUpperCase();}
function formatDate(iso){return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(`${iso}T12:00:00`));}
function statusClass(status){return status==="Bestätigt"?"confirmed":status==="Angefragt"?"requested":"done";}
function sortedGigs(){return [...gigs].sort((a,b)=>a.date.localeCompare(b.date)||String(a.time).localeCompare(String(b.time)));}
function gigCard(g, compact=false){
 return `<button class="gig-card" data-open="${g.id}"><div class="gig-top"><div class="date-tile"><strong>${escapeHTML(g.date.slice(8,10))}</strong><span>${shortMonth(g.date)}</span></div><div class="gig-main"><div class="gig-title-row"><span class="gig-title">${escapeHTML(g.name)}</span><span class="chevron">›</span></div><div class="gig-sub">${escapeHTML(g.city)} · ${escapeHTML(g.time||"Zeit offen")}</div>${compact?`<div class="gig-sub">${formatDate(g.date)}</div>`:""}</div></div><div class="gig-bottom"><span class="status ${statusClass(g.status)}">${escapeHTML(g.status)}</span><span class="fee">${euro(g.fee)}</span></div></button>`;
}
function renderCalendar(){
 $("monthTitle").textContent=monthLabel(monthCursor);
 const year=monthCursor.getFullYear(), month=monthCursor.getMonth();
 const firstDay=(new Date(year,month,1).getDay()+6)%7;
 const count=new Date(year,month+1,0).getDate();
 const gigsByDate=new Set(gigs.map(g=>g.date));
 const selectedDate=localISO(today);
 let html="";
 for(let i=0;i<firstDay;i++) html+='<div class="day empty"></div>';
 for(let d=1;d<=count;d++){
  const iso=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const has=gigsByDate.has(iso);
  html+=`<button class="day ${has?"has-gig":""} ${iso===selectedDate?"selected":""}" data-day="${iso}" aria-label="${d}${has?", Gig geplant":""}">${d}${has?'<span class="dot"></span>':""}</button>`;
 }
 $("calendarDays").innerHTML=html;
}
function render(){
 $("bookingCount").textContent=gigs.length;
 const confirmed=gigs.filter(g=>g.status==="Bestätigt").reduce((s,g)=>s+(Number(g.fee)||0),0);
 const paid=gigs.filter(g=>g.paid).reduce((s,g)=>s+(Number(g.fee)||0),0);
 const open=gigs.filter(g=>!g.paid).reduce((s,g)=>s+(Number(g.fee)||0),0);
 $("confirmedTotal").textContent=euro(confirmed);
 $("financeConfirmed").textContent=euro(confirmed);
 $("financePaid").textContent=euro(paid);
 $("financeOpen").textContent=euro(open);
 $("confirmedCount").textContent=`${gigs.filter(g=>g.status==="Bestätigt").length} bestätigte Bookings`;
 renderCalendar();
 const list=sortedGigs();
 $("upcomingList").innerHTML=list.length?list.map(g=>gigCard(g)).join(""):'<div class="empty-state">Noch keine Gigs geplant. Füge deinen ersten Auftritt hinzu.</div>';
 const filtered=list.filter(g=>activeFilter==="Alle"||g.status===activeFilter);
 $("bookingList").innerHTML=filtered.length?filtered.map(g=>gigCard(g,true)).join(""):`<div class="empty-state">Keine Gigs mit diesem Status.</div>`;
 $("financeList").innerHTML=list.length?list.map(g=>`<div class="gig-card"><div class="gig-top"><div class="gig-main"><div class="gig-title-row"><span class="gig-title">${escapeHTML(g.name)}</span><span class="fee">${euro(g.fee)}</span></div><div class="gig-sub">${formatDate(g.date)} · ${escapeHTML(g.city)}</div></div></div><div class="gig-bottom"><span class="status ${g.paid?"confirmed":"requested"}">${g.paid?"Bezahlt":"Offen"}</span><button class="secondary" data-toggle-paid="${g.id}">${g.paid?"Zurücksetzen":"Als bezahlt markieren"}</button></div></div>`).join(""):'<div class="empty-state">Noch keine Gagen erfasst.</div>';
 document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter===activeFilter));
}
function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
function switchTab(tab){
 document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`${tab}View`));
}
function openForm(gig=null){
 $("gigForm").reset();
 $("gigId").value=gig?.id||"";
 $("formTitle").textContent=gig?"Gig bearbeiten":"Neuen Gig anlegen";
 $("gigName").value=gig?.name||"";
 $("gigCity").value=gig?.city||"";
 $("gigDate").value=gig?.date||localISO(today);
 $("gigTime").value=gig?.time||"22:00";
 $("gigFee").value=gig?.fee??500;
 $("gigStatus").value=gig?.status||"Angefragt";
 $("gigContact").value=gig?.contact||"";
 $("gigContactInfo").value=gig?.contactInfo||"";
 $("gigNotes").value=gig?.notes||"";
 $("gigPaid").checked=!!gig?.paid;
 $("deleteGig").hidden=!gig;
 $("gigDialog").showModal();
}
function saveGigFromForm(event){
 event.preventDefault();
 const id=$("gigId").value;
 const gig={id:id||crypto.randomUUID(),name:$("gigName").value.trim(),city:$("gigCity").value.trim(),date:$("gigDate").value,time:$("gigTime").value||"Zeit offen",fee:Math.max(0,Number($("gigFee").value)||0),status:$("gigStatus").value,contact:$("gigContact").value.trim(),contactInfo:$("gigContactInfo").value.trim(),notes:$("gigNotes").value.trim(),paid:$("gigPaid").checked};
 if(!gig.name||!gig.city||!gig.date)return;
 if(id) gigs=gigs.map(g=>g.id===id?gig:g); else gigs.push(gig);
 $("gigDialog").close(); saveData(); showToast(id?"Gig aktualisiert":"Gig gespeichert");
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;render();}));
["addTop","addCalendar","addBookings"].forEach(id=>$(id).addEventListener("click",()=>openForm()));
$("closeDialog").addEventListener("click",()=>$("gigDialog").close());
$("gigForm").addEventListener("submit",saveGigFromForm);
$("deleteGig").addEventListener("click",()=>{
 const id=$("gigId").value;
 if(id&&confirm("Diesen Gig wirklich löschen?")){gigs=gigs.filter(g=>g.id!==id);$("gigDialog").close();saveData();showToast("Gig gelöscht");}
});
$("prevMonth").addEventListener("click",()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()-1,1);renderCalendar();});
$("nextMonth").addEventListener("click",()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()+1,1);renderCalendar();});
document.body.addEventListener("click",e=>{
 const open=e.target.closest("[data-open]");
 if(open){const gig=gigs.find(g=>g.id===open.dataset.open);if(gig)openForm(gig);return;}
 const day=e.target.closest("[data-day]");
 if(day){const date=day.dataset.day;const same=sortedGigs().filter(g=>g.date===date);if(same.length){openForm(same[0]);}else{$("gigDate").value=date;openForm();$("gigDate").value=date;}return;}
 const paid=e.target.closest("[data-toggle-paid]");
 if(paid){gigs=gigs.map(g=>g.id===paid.dataset.togglePaid?{...g,paid:!g.paid}:g);saveData();showToast("Zahlungsstatus aktualisiert");}
});
$("exportData").addEventListener("click",()=>{
 const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),gigs},null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`dj-gig-planner-backup-${localISO(today)}.json`;a.click();URL.revokeObjectURL(url);showToast("Sicherung exportiert");
});
$("importData").addEventListener("change",async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const parsed=JSON.parse(await file.text());const imported=Array.isArray(parsed)?parsed:parsed.gigs;if(!Array.isArray(imported)||!imported.every(g=>g.name&&g.date))throw new Error("invalid");if(confirm(`${imported.length} Gigs importieren? Deine aktuelle Liste wird ersetzt.`)){gigs=imported.map(g=>({...g,id:g.id||crypto.randomUUID()}));saveData();showToast("Daten importiert");}}
 catch{showToast("Import fehlgeschlagen: Datei prüfen");}finally{e.target.value="";}
});
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
render();
