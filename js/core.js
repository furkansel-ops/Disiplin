'use strict';
/* ===== Sabitler, veri modeli, profiller, hesaplamalar ===== */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const MONTHS=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYN=['PAZ','PZT','SAL','ÇAR','PER','CUM','CTS'];
const DAYLONG=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const WEEK=[1,2,3,4,5,6,0]; // Pazartesi başlangıçlı sıra
const QUOTES=[
  'Biz tekrar tekrar yaptığımız şeyleriz. Mükemmellik bir eylem değil, bir alışkanlıktır. — Aristoteles',
  'Bin millik bir yolculuk, tek bir adımla başlar. — Lao Tzu',
  'Ya bir yol bulacağız, ya da bir yol yapacağız! — Hannibal',
  'Bana bir dayanak noktası verin, dünyayı yerinden oynatayım. — Arşimet',
  "Ya ben İstanbul'u alırım, ya da İstanbul beni! — Fatih Sultan Mehmet",
  'Limanı belli olmayan gemiye hiçbir rüzgar yardım etmez. — Seneca',
  'Zorlukların göbeğinde fırsatlar yatar. — Albert Einstein',
  'Veni, Vidi, Vici. (Geldim, Gördüm, Yendim.) — Jül Sezar',
  'Bugün onlarındır; ama uğrunda çok çalıştığım gelecek benimdir. — Nikola Tesla',
  "Zafer, 'Zafer benimdir' diyebilenindir. — Mustafa Kemal Atatürk",
  'Beni öldürmeyen şey, beni güçlendirir. — Friedrich Nietzsche',
  'Kendi kendinin efendisi olmayan hiç kimse özgür değildir. — Epictetus'];
const QUOTES_TOUGH=[
  'Yavaş gitmekten korkma, yalnızca durmaktan kork. — Çin Atasözü',
  'Damlaya damlaya göl olur. — Atasözü',
  'Düşmek değil, düştüğü yerde kalmak ayıptır. — Atasözü',
  'Başarı, her gün tekrarlanan küçük çabaların toplamıdır. — Robert Collier'];
const QUOTES_CHEER=[
  'Disiplin, hedeflerle başarı arasındaki köprüdür. — Jim Rohn',
  'Kendini yenmek, zaferlerin en büyüğüdür. — Platon',
  'Hiçbir şey imkânsız değildir; kelimenin kendisi bile "ben mümkünüm" der. — Audrey Hepburn'];
const HUES=[258,172,145,38,200,330,12,95,280,55];
const RANKS=[{min:0,name:'Başlangıç',icon:'🌱'},{min:100,name:'İstikrarlı',icon:'🔥'},{min:500,name:'Seri Avcısı',icon:'⚡'},{min:1000,name:'Usta',icon:'💎'},{min:2000,name:'Efsane',icon:'👑'}];
const CATS=[['saglik','💚 Sağlık'],['zihin','🧠 Zihin'],['sosyal','🫂 Sosyal'],['kariyer','💼 Kariyer'],['kisisel','✨ Kişisel']];
const DIFFS=['','Kolay','Orta','Zor'];
const MOODS=['😞','😕','😐','🙂','😄'], MOODN=['Kötü','Durgun','Normal','İyi','Harika'];
const PETS=[['cat','🐱','Kedi'],['dog','🐶','Köpek'],['fox','🦊','Tilki'],['dragon','🐲','Ejder'],['panda','🐼','Panda'],['bunny','🐰','Tavşan']];
const SLOTS=[['sabah','🌅 Sabah'],['ogle','☀️ Öğle'],['aksam','🌙 Akşam']];
const REASONS=[['yorgun','😴 Yorgundum'],['zaman','⏳ Zaman yoktu'],['unuttum','🤷 Unuttum'],['hasta','🤒 Hastaydım'],['motiv','🫠 Motivasyon yok'],['diger','💬 Diğer']];
const EMOJIS=['💧','📕','🏃','💪','🧘','🥗','😴','🧠','✍️','🎯','🚭','🌅','🎸','💊','🧹','📵','🙏','💰','⏰','🥪','👋','🗣️','🎨','🌿'];
const ICONS={
  drop:'M12 3c3.5 4.5 6 7.6 6 10.5a6 6 0 0 1-12 0C6 10.6 8.5 7.5 12 3z',
  book:'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13',
  dumbbell:'M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12',
  moon:'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  heart:'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  leaf:'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l7-7',
  coffee:'M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9zM16 10h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3',
  music:'M9 18V5l11-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  pen:'M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3',
  target:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  code:'M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14',
  money:'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  phone:'M7 3h10v18H7zM11 18h2'};
const TEMPLATES={
  'Sabah Rutini 🌅':[["06.30'da Uyan",'⏰',{cat:'saglik',diff:2,slot:'sabah'}],['Su İç','💧',{cat:'saglik',target:2,unit:'lt',slot:'sabah'}],['Esneme','🧘',{cat:'saglik',slot:'sabah'},],['Günü Planla','✍️',{cat:'kariyer',slot:'sabah'}]],
  'Öğrenci 🎓':[['Ders Çalış','🧠',{cat:'kariyer',diff:3,timer:25,target:120,unit:'dk'}],['Tekrar Yap','📕',{cat:'zihin',diff:2}],['Soru Çöz','✍️',{cat:'kariyer',target:50,unit:'soru'}],['Erken Yat','😴',{cat:'saglik'}]],
  'Fitness 💪':[['Antrenman','💪',{cat:'saglik',diff:3,days:[1,3,5]}],['10.000 Adım','🏃',{cat:'saglik',target:10,unit:'bin adım'}],['Protein','🥗',{cat:'saglik'}],['Uyku 8 Saat','😴',{cat:'saglik'}]],
  'Zihin 🧠':[['Meditasyon','🧘',{cat:'zihin',timer:10}],['Günlük Yaz','✍️',{cat:'zihin'}],['Ekran Molası','📵',{cat:'zihin',diff:2}],['Şükret','🙏',{cat:'zihin'}]]};
const THEMES=[['dark','🌙 Gece','#11141d'],['light','☀️ Gündüz','#e9ebf5'],['neon','💜 Neon','#2a0b3d'],['pastel','🌸 Pastel','#f3e5fb'],['matrix','💚 Matrix','#06110a'],['sunset','🌅 Gün Batımı','#3a1526']];
const BOSSES=[['🐌','Erteleme Canavarı'],['🐉','Tembellik Ejderi'],['🗿','Bahane Golemi'],['👻','Dağınıklık Hayaleti'],['🧟','Ekran Zombisi'],['🧌','Uyku Trolü'],['👺','Şeker Goblini'],['🐙','Kaos Krakeni'],['🧛','Mazeret Vampiri'],['🧙','Sis Cadısı'],['👹','Yorgunluk Devi'],['🐻','Kış Uykusu Ayısı']];
const CHECK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const C=2*Math.PI*26;
const DK=/^\d{4}-\d\d-\d\d$/;

const pad=n=>String(n).padStart(2,'0');
const dkey=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
const pk=k=>{ const [y,m,d]=k.split('-').map(Number); return [y,m-1,d]; };
const dim=(y,m)=>new Date(y,m+1,0).getDate();
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,dec=0)=>v.toLocaleString('tr-TR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const dur=ms=>RM.matches?0:ms;
const later=fn=>requestAnimationFrame(()=>requestAnimationFrame(fn));
const isObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
const clampInt=(v,a,b,def=a)=>Number.isFinite(+v)?Math.max(a,Math.min(b,Math.round(+v))):def;
const todayKey=()=>{ const n=new Date(); return dkey(n.getFullYear(),n.getMonth(),n.getDate()); };
const hhmm=(d=new Date())=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addDays=(k,n)=>{ const [y,m,d]=pk(k); const t=new Date(y,m,d+n); return dkey(t.getFullYear(),t.getMonth(),t.getDate()); };
const wdK=k=>{ const [y,m,d]=pk(k); return new Date(y,m,d).getDay(); };
const mondayOf=k=>addDays(k,-((wdK(k)+6)%7));
function hash(s){ let h=2166136261; for(const c of s){ h^=c.codePointAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function rng(seed){ let s=seed%2147483647||1; return ()=>(s=s*16807%2147483647)/2147483647; }
function iconHTML(ic){ return ic&&ic.startsWith('i:')&&ICONS[ic.slice(2)]?`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[ic.slice(2)]}"/></svg>`:esc(ic||'✨'); }
const iconText=ic=>ic&&ic.startsWith('i:')?'◆':(ic||'✨');

/* ---------- veri modeli ---------- */
function normHabit(h,i){
  const days=Array.isArray(h.days)?[...new Set(h.days.filter(d=>Number.isInteger(d)&&d>=0&&d<=6))]:[0,1,2,3,4,5,6];
  return {id:String(h.id).slice(0,40),name:String(h.name).slice(0,60),icon:String(h.icon||'✨').slice(0,12),
    hue:Number.isFinite(h.hue)?((h.hue%360)+360)%360:HUES[i%HUES.length],days:days.length?days:[0,1,2,3,4,5,6],
    cat:CATS.some(c=>c[0]===h.cat)?h.cat:'',diff:clampInt(h.diff,1,3,1),target:clampInt(h.target,0,10000,0),
    unit:String(h.unit||'').slice(0,12),timer:clampInt(h.timer,0,240,0),archived:!!h.archived,
    weekly:clampInt(h.weekly,0,7,0),slot:SLOTS.some(s=>s[0]===h.slot)?h.slot:'',after:typeof h.after==='string'?h.after.slice(0,40):'',
    subs:Array.isArray(h.subs)?h.subs.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim().slice(0,40)).slice(0,8):[],
    step:clampInt(h.step,0,1000,0),stepMax:clampInt(h.stepMax,0,10000,0),pstart:DK.test(h.pstart||'')?h.pstart:'',
    trial:clampInt(h.trial,0,365,0),tstart:DK.test(h.tstart||'')?h.tstart:'',created:DK.test(h.created||'')?h.created:''};
}
function defaultSettings(){ return {sound:true,ambient:true,reminder:'',view:'table',cat:'',backupRemind:true}; }
function mkHabits(list){ return list.map(([name,icon,o={}],i)=>normHabit({id:uid(),name,icon,hue:HUES[i%HUES.length],...o},i)); }
// Excel şablonundaki alışkanlıklar: örnek veride ve kurulum önerilerinde kullanılır
const DEFAULT_HABITS=[["05.00'da Uyan",'⏰',{cat:'saglik',diff:3,slot:'sabah'}],['Yürüyüşe Çık','🏃',{cat:'saglik',slot:'sabah'}],['Kahvaltı Yap','🥪',{cat:'saglik',slot:'sabah'}],['Kitap Oku','📕',{cat:'zihin',diff:2,timer:20,slot:'aksam'}],
  ['3 LT Su İç','💧',{cat:'saglik',target:3,unit:'lt',slot:'ogle'}],['Spora Git','💪',{cat:'saglik',diff:3,days:[1,3,5],slot:'aksam',subs:['Isınma','Antrenman','Esneme']}],['Ders Çalış','🧠',{cat:'kariyer',diff:3,timer:25,slot:'ogle'}],['Yeni Biriyle Tanış','👋',{cat:'sosyal',diff:2,weekly:2}]];
function blankState(){
  return {v:2,theme:'dark',accent:'',year:new Date().getFullYear(),
    habits:mkHabits(DEFAULT_HABITS),
    checks:{},vals:{},times:{},notes:{},photos:{},jokers:{},freezes:{},quotes:{},goals:[],quits:[],ach:{},bosses:{},
    subd:{},reasons:{},vacations:[],challenges:[],letters:[],vision:[],voice:{},pet:{name:'Pofuduk',type:'cat'},avatar:{base:'🙂',hat:'',eyes:'',aura:''},
    settings:defaultSettings(),levelSeen:null,lastReport:'',lastBackup:'',onboarded:true,tour:{done:true,rw:false}};
}
// Yeni kullanıcı: alışkanlık yok, kurulum sihirbazı ve "ilk adımlar" rehberi açılır
function freshState(){ const s=blankState(); s.habits=[]; s.onboarded=false; s.tour={done:false,rw:false}; s.settings.view='today'; return s; }
function sampleState(){
  const s=blankState(), now=new Date(), y=s.year, tk=todayKey();
  s.goals=['Yurt Dışı Tatili','İspanyolca Öğren','100k Takipçi','İngilizce Öğren','3 Başarılı Marka Kur','Finansal Özgürlük','Saygınlık','Network']
    .map((text,i)=>({id:uid(),text,done:i===0||i===3,habitId:'',target:0}));
  s.goals.push({id:uid(),text:'Yılda 250 gün kitap oku',done:false,habitId:s.habits[3].id,target:250});
  const r=rng(20260101), probs=[.5,.8,.9,.7,.85,.75,.55,.18], hours=[5,7,8,22,12,18,15,19];
  for(let m=0;m<=now.getMonth();m++){
    const last=m===now.getMonth()?now.getDate()-1:dim(y,m), trend=.7+.3*m/11;
    for(let d=1;d<=last;d++){
      const k=dkey(y,m,d), a=[];
      s.habits.forEach((h,i)=>{
        if(h.target){ const v=Math.min(h.target,Math.floor(r()*(h.target+1.6))); if(v){ (s.vals[k]=s.vals[k]||{})[h.id]=v; if(v>=h.target) a.push(h.id); } }
        else if(r()<probs[i]*trend) a.push(h.id);
      });
      if(a.length){ s.checks[k]=a; s.times[k]={}; a.forEach(id=>{ const i=s.habits.findIndex(h=>h.id===id); s.times[k][id]=`${pad(Math.min(23,hours[i]+Math.floor(r()*2)))}:${pad(Math.floor(r()*60))}`; }); }
      if(r()<.35){ const e=1+Math.min(4,Math.floor(a.length/2+r()*1.5)); s.notes[k]={mood:e,text:'',energy:Math.max(1,Math.min(5,e+Math.round(r()*2-1))),stress:Math.max(1,Math.min(5,6-e+Math.round(r()*2-1))),sleep:5+Math.round(r()*4),grat:[]}; }
      const miss=s.habits.filter(h=>h.days.includes(new Date(y,m,d).getDay())&&!a.includes(h.id));
      if(miss.length&&r()<.3) s.reasons[k]={[miss[0].id]:REASONS[Math.floor(r()*REASONS.length)][0]};
    }
  }
  s.habits[2].after=s.habits[0].id; // kahvaltı → uyandıktan sonra
  s.challenges=[{id:uid(),name:'21 Gün Kitap',icon:'📕',habitId:s.habits[3].id,days:21,start:addDays(tk,-9)}];
  s.notes[addDays(tk,-1)]={mood:4,text:'Kitabın yarısını bitirdim, sabah yürüyüşü çok iyi geldi.',energy:4,stress:2,sleep:7,grat:['Güneşli hava','Ailemle akşam yemeği','Sağlığım']};
  // bugün çoğu işaretli: kalanları tamamlayınca kutlama görünür
  s.checks[tk]=s.habits.slice(0,4).map(h=>h.id); s.times[tk]={}; s.checks[tk].forEach((id,i)=>s.times[tk][id]=`0${6+i}:1${i}`);
  s.vals[tk]={[s.habits[4].id]:2};
  const q=new Date(now.getFullYear(),now.getMonth(),now.getDate()-23);
  s.quits=[{id:uid(),name:'Sigara',icon:'🚭',start:dkey(q.getFullYear(),q.getMonth(),q.getDate()),best:23},{id:uid(),name:'Gece Atıştırması',icon:'🍫',start:addDays(tk,-4),best:12}];
  return s;
}
// Dışarıdan gelen veriyi (localStorage, JSON yedeği) doğrula ve temizle — v1 dosyaları da kabul edilir
function validate(o){
  if(!isObj(o)||!Array.isArray(o.habits)||!isObj(o.checks)) return null;
  const habits=o.habits.filter(h=>h&&typeof h.id==='string'&&typeof h.name==='string').map(normHabit);
  const ids=new Set(habits.map(h=>h.id));
  const dmap=(src,fn)=>{ const out={}; if(isObj(src)) for(const [k,v] of Object.entries(src)) if(DK.test(k)){ const r=fn(v); if(r!==undefined) out[k]=r; } return out; };
  const idmap=(v,ok)=>{ if(!isObj(v)) return; const r={}; for(const [id,x] of Object.entries(v)) if(ids.has(id)&&ok(x)) r[id]=x; return Object.keys(r).length?r:undefined; };
  const checks=dmap(o.checks,v=>{ if(!Array.isArray(v)) return; const a=[...new Set(v.filter(x=>ids.has(x)))]; return a.length?a:undefined; });
  const vals=dmap(o.vals,v=>idmap(v,n=>Number.isFinite(n)&&n>0&&n<=10000));
  const times=dmap(o.times,v=>idmap(v,t=>typeof t==='string'&&/^\d\d:\d\d$/.test(t)));
  const notes=dmap(o.notes,v=>isObj(v)?{mood:clampInt(v.mood,0,5,0),text:String(v.text||'').slice(0,500),energy:clampInt(v.energy,0,5,0),stress:clampInt(v.stress,0,5,0),
    sleep:Number.isFinite(+v.sleep)?Math.max(0,Math.min(16,Math.round(+v.sleep*2)/2)):0,grat:Array.isArray(v.grat)?v.grat.slice(0,3).map(x=>String(x).slice(0,120)):[]}:undefined);
  const subd=dmap(o.subd,v=>idmap(v,a=>Array.isArray(a)&&a.every(i=>Number.isInteger(i)&&i>=0&&i<8)));
  const reasons=dmap(o.reasons,v=>idmap(v,r=>REASONS.some(x=>x[0]===r)));
  const str=(v,n)=>String(v||'').slice(0,n), arr=(a,fn)=>Array.isArray(a)?a.map(fn).filter(Boolean):[];
  const vacations=arr(o.vacations,v=>isObj(v)&&DK.test(v.from)&&DK.test(v.to)&&v.from<=v.to?{id:str(v.id||uid(),40),from:v.from,to:v.to,name:str(v.name,30)}:null).slice(0,50);
  const challenges=arr(o.challenges,c=>isObj(c)&&ids.has(c.habitId)&&DK.test(c.start)?{id:str(c.id||uid(),40),name:str(c.name,60),icon:str(c.icon||'🏁',12),habitId:c.habitId,days:clampInt(c.days,3,365,21),start:c.start}:null).slice(0,30);
  const letters=arr(o.letters,l=>isObj(l)&&DK.test(l.open)&&DK.test(l.created)?{id:str(l.id||uid(),40),text:str(l.text,2000),open:l.open,created:l.created,seen:!!l.seen}:null).slice(0,50);
  const vision=arr(o.vision,v=>isObj(v)&&typeof v.img==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v.img)&&v.img.length<300000?{id:str(v.id||uid(),40),img:v.img,text:str(v.text,80)}:null).slice(0,12);
  const pt=isObj(o.pet)?o.pet:{}, av=isObj(o.avatar)?o.avatar:{};
  const pet={name:str(pt.name||'Pofuduk',20),type:PETS.some(p=>p[0]===pt.type)?pt.type:'cat'};
  const avatar={base:str(av.base||'🙂',12),hat:str(av.hat,12),eyes:str(av.eyes,12),aura:str(av.aura,12)};
  const photos=dmap(o.photos,v=>typeof v==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<600000?v:undefined);
  const flag=v=>v?1:undefined, jokers=dmap(o.jokers,flag), freezes=dmap(o.freezes,flag), voice=dmap(o.voice,flag);
  const quotes={}; if(isObj(o.quotes)) for(const [k,v] of Object.entries(o.quotes)) if(typeof v==='string'&&/^\d{4}-\d{1,2}$/.test(k)) quotes[k]=v.slice(0,300);
  const goals=Array.isArray(o.goals)?o.goals.filter(g=>g&&typeof g.text==='string').map(g=>({id:String(g.id||uid()).slice(0,40),text:g.text.slice(0,120),done:!!g.done,habitId:ids.has(g.habitId)?g.habitId:'',target:clampInt(g.target,0,10000,0)})):[];
  const quits=Array.isArray(o.quits)?o.quits.filter(q=>q&&typeof q.name==='string'&&DK.test(q.start)).map(q=>({id:String(q.id||uid()).slice(0,40),name:q.name.slice(0,60),icon:String(q.icon||'🚫').slice(0,12),start:q.start,best:clampInt(q.best,0,100000,0)})):[];
  const ach={}; if(isObj(o.ach)) for(const [k,v] of Object.entries(o.ach)) if(/^[a-z0-9_]{1,20}$/.test(k)&&DK.test(v)) ach[k]=v;
  const bosses={}; if(isObj(o.bosses)) for(const k of Object.keys(o.bosses)) if(/^\d{4}-\d{1,2}$/.test(k)) bosses[k]=1;
  const st=isObj(o.settings)?o.settings:{}, def=defaultSettings();
  const settings={sound:st.sound!==undefined?!!st.sound:def.sound,ambient:st.ambient!==undefined?!!st.ambient:def.ambient,
    reminder:typeof st.reminder==='string'&&/^\d\d:\d\d$/.test(st.reminder)?st.reminder:'',
    view:['table','cal','today'].includes(st.view)?st.view:'table',cat:CATS.some(c=>c[0]===st.cat)?st.cat:'',backupRemind:st.backupRemind!==undefined?!!st.backupRemind:true};
  habits.forEach(h=>{ if(!ids.has(h.after)||h.after===h.id) h.after=''; });
  return {v:2,theme:THEMES.some(t=>t[0]===o.theme)?o.theme:'dark',accent:typeof o.accent==='string'&&/^#[0-9a-f]{6}$/i.test(o.accent)?o.accent:'',
    year:Number.isInteger(o.year)&&o.year>1970&&o.year<3000?o.year:new Date().getFullYear(),
    habits,checks,vals,times,notes,photos,jokers,freezes,quotes,goals,quits,ach,bosses,settings,
    subd,reasons,vacations,challenges,letters,vision,voice,pet,avatar,
    onboarded:o.onboarded!==false,tour:isObj(o.tour)?{done:!!o.tour.done,rw:!!o.tour.rw}:{done:true,rw:true}, // eski kayıtlar: kurulum tamam sayılır
    levelSeen:Number.isInteger(o.levelSeen)?o.levelSeen:null,lastReport:typeof o.lastReport==='string'?o.lastReport.slice(0,10):'',lastBackup:DK.test(o.lastBackup||'')?o.lastBackup:''};
}

/* ---------- profiller ve kalıcılık ---------- */
const KEY='aliskanlik-takvimi-v1', PKEY='aliskanlik-profiller';
const lsGet=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
const dataKey=id=>id==='main'?KEY:KEY+':'+id;
let P=(()=>{ try{ const p=JSON.parse(lsGet(PKEY)); if(isObj(p)&&Array.isArray(p.list)&&p.list.length&&p.list.every(x=>x&&typeof x.id==='string'&&typeof x.name==='string')) return {active:p.list.some(x=>x.id===p.active)?p.active:p.list[0].id,list:p.list}; }catch(e){} return {active:'main',list:[{id:'main',name:'Ben'}]}; })();
function loadProfile(id){
  try{ const raw=lsGet(dataKey(id)); if(raw){ const s=validate(JSON.parse(raw)); if(s) return s; } }catch(e){}
  return freshState();
}
let S=loadProfile(P.active), rev=0, saveT, saveWarned=false;
function savePK(){ try{ localStorage.setItem(PKEY,JSON.stringify(P)); }catch(e){} }
function flush(){
  clearTimeout(saveT);
  try{ localStorage.setItem(dataKey(P.active),JSON.stringify(S)); }
  catch(e){ if(!saveWarned){ saveWarned=true; toast(e&&e.name==='QuotaExceededError'?'⚠️ Depolama dolu: bazı fotoğrafları sil veya JSON yedeği al!':'⚠️ Kaydedilemedi: tarayıcı depolaması kapalı. JSON yedeği al!'); } }
}
function save(){ clearTimeout(saveT); saveT=setTimeout(flush,200); }
addEventListener('pagehide',flush);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) flush(); });

/* ---------- hesaplamalar (rev değişince önbellek sıfırlanır) ---------- */
let memoRev=-1, memoMap=new Map();
function memo(key,fn){ if(memoRev!==rev){ memoRev=rev; memoMap=new Map(); } if(!memoMap.has(key)) memoMap.set(key,fn()); return memoMap.get(key); }
const active=()=>S.habits.filter(h=>!h.archived);
const hab=id=>S.habits.find(h=>h.id===id);
const isOn=(k,id)=>(S.checks[k]||[]).includes(id);
const valOf=(k,id)=>S.vals[k]?.[id]||0;
const daysBetween=(a,b)=>{ const [y1,m1,d1]=pk(a), [y2,m2,d2]=pk(b); return Math.round((new Date(y2,m2,d2)-new Date(y1,m1,d1))/864e5); };
const vacSet=()=>memo('vac',()=>{ const s=new Set(); for(const v of S.vacations) for(let k=v.from,g=0;k<=v.to&&g<400;k=addDays(k,1),g++) s.add(k); return s; });
const restK=k=>!!S.jokers[k]||vacSet().has(k); // joker veya tatil/hasta günü: oran ve seri etkilenmez
// "Haftada X kez": yapılan günler + kalan kotayı karşılayacak ilk boş günler (bugün/gelecek, yetmezse geçmişin son günleri) planlı sayılır
function weekSched(h,mon){
  return memo(`w${h.id}${mon}`,()=>{
    const tk=todayKey(), ks=[...Array(7)].map((_,i)=>addDays(mon,i)).filter(k=>!restK(k)&&h.days.includes(wdK(k))&&!(h.created&&k<h.created));
    const set=new Set(ks.filter(k=>isOn(k,h.id))); let need=Math.max(0,h.weekly-set.size);
    for(const k of ks) if(need&&k>=tk&&!set.has(k)){ set.add(k); need--; }
    for(let i=ks.length-1;i>=0&&need;i--) if(ks[i]<tk&&!set.has(ks[i])){ set.add(ks[i]); need--; }
    return set;
  });
}
// eklenmeden önceki günler planlı sayılmaz (yeni başlayan biri geçmiş günler için cezalandırılmaz)
const schedK=(h,k)=>!restK(k)&&h.days.includes(wdK(k))&&!(h.created&&k<h.created)&&(!h.weekly||weekSched(h,mondayOf(k)).has(k));
// Kademeli hedef: başlangıçtan itibaren her 7 günde bir "step" kadar artar
const tgtK=(h,k)=>h.target&&h.step&&h.pstart&&k>=h.pstart?Math.min(h.stepMax||10000,h.target+h.step*Math.floor(daysBetween(h.pstart,k)/7)):h.target;
function dayStat(k){
  return memo('d'+k,()=>{ let s=0,c=0,all=0; for(const h of active()){ const on=isOn(k,h.id); if(on) all++; if(schedK(h,k)){ s++; if(on) c++; } }
    return {s,c,all,p:s?c/s:(all?1:0),perfect:s>0&&c===s,joker:restK(k),vac:vacSet().has(k)}; });
}
const subsOf=(k,id)=>S.subd[k]?.[id]||[];
function chalStat(c){
  const tk=todayKey(), h=hab(c.habitId), end=addDays(c.start,c.days-1); let ok=0, failed=false;
  for(let i=0;i<c.days&&h;i++){ const k=addDays(c.start,i); if(k>tk) break; if(isOn(k,h.id)||!schedK(h,k)) ok++; else if(k<tk) failed=true; }
  return {h,ok,end,failed,complete:!failed&&ok>=c.days,left:Math.max(0,daysBetween(tk,end)+1)};
}
function elapsedDays(y,m){
  const n=new Date();
  if(y<n.getFullYear()||(y===n.getFullYear()&&m<n.getMonth())) return dim(y,m);
  return y===n.getFullYear()&&m===n.getMonth()?n.getDate():0;
}
function monthStats(y,m){
  return memo(`m${y}-${m}`,()=>{
    const hs=active(), days=dim(y,m), el=elapsedDays(y,m), per={}, poss={}, ds={};
    let ticks=0,done=0,possible=0,soDone=0,soPoss=0;
    hs.forEach(h=>{ per[h.id]=0; poss[h.id]=0; ds[h.id]=0; });
    for(let d=1;d<=days;d++){ const k=dkey(y,m,d);
      for(const h of hs){ const on=isOn(k,h.id), sc=schedK(h,k);
        if(on){ per[h.id]++; ticks++; }
        if(sc){ poss[h.id]++; possible++; if(d<=el) soPoss++; if(on){ ds[h.id]++; done++; if(d<=el) soDone++; } } } }
    return {n:hs.length,days,ticks,per,poss,ds,possible,done,soDone,soPoss,el,
      rate:possible?done/possible:0,soRate:soPoss?soDone/soPoss:0,hRate:id=>poss[id]?ds[id]/poss[id]:0};
  });
}
function weeks(y,m){ // Pazartesi başlangıçlı takvim haftaları
  const off=(new Date(y,m,1).getDay()+6)%7, out=[];
  for(let d=1;d<=dim(y,m);d++){ const w=Math.floor((d-1+off)/7); (out[w]||(out[w]={w,start:d,len:0})).len++; }
  return out;
}
const rankOf=total=>{ let i=RANKS.length-1; while(total<RANKS[i].min) i--; return i; };
function firstDataKey(){ return memo('first',()=>{ let f=todayKey(); for(const k of Object.keys(S.checks)) if(k<f) f=k; for(const k of Object.keys(S.vals)) if(k<f) f=k; return f; }); }
// Seri: planlanmayan günler ve joker günler atlanır; dondurulmuş gün seriyi bozmaz; bugün henüz yapılmadıysa seri bozulmaz
function streaks(h){
  return memo('s'+h.id,()=>{
    const end=todayKey(); let k=firstDataKey(), run=0, best=0;
    for(let guard=0;k<=end&&guard<4000;guard++,k=addDays(k,1)){
      if(!schedK(h,k)) continue;
      if(isOn(k,h.id)){ run++; if(run>best) best=run; }
      else if(k!==end&&!S.freezes[k]) run=0;
    }
    return {cur:run,best};
  });
}
function totalTicks(){ return memo('tt',()=>Object.values(S.checks).reduce((s,a)=>s+a.length,0)); }
function monthsWithData(){ return memo('mwd',()=>[...new Set(Object.keys(S.checks).map(k=>k.slice(0,7)))].map(s=>{ const [y,m]=s.split('-').map(Number); return [y,m-1]; })); }
function bossOf(y,m){
  const st=monthStats(y,m), hp=Math.max(1,Math.round(st.possible*.55)); // planlı tiklerin %55'i
  return {e:BOSSES[m][0],name:BOSSES[m][1],hp,dmg:st.ticks,left:Math.max(0,hp-st.ticks),dead:st.ticks>=hp&&st.n>0};
}
// Haftalık joker hakkı: 1, aylık seri dondurma hakkı: 2
function jokersInWeek(k){ const mo=mondayOf(k); let n=0; for(let i=0;i<7;i++) if(S.jokers[addDays(mo,i)]) n++; return n; }
function freezesInMonth(k){ const p=k.slice(0,7); return Object.keys(S.freezes).filter(x=>x.startsWith(p)).length; }

/* ---------- veri değişiklikleri ---------- */
function setDone(k,id,on,keepSubs){
  const a=S.checks[k]||[], h=hab(id);
  if(on&&h&&h.created&&k<h.created) h.created=k; // geçmişe işaret atılırsa başlangıç geri çekilir
  if(!keepSubs&&h&&h.subs.length){ if(on) (S.subd[k]=S.subd[k]||{})[id]=h.subs.map((_,i)=>i); else if(S.subd[k]){ delete S.subd[k][id]; if(!Object.keys(S.subd[k]).length) delete S.subd[k]; } }
  if(on&&!a.includes(id)){ S.checks[k]=[...a,id]; if(k===todayKey()) (S.times[k]=S.times[k]||{})[id]=hhmm(); }
  else if(!on&&a.includes(id)){ S.checks[k]=a.filter(x=>x!==id); if(!S.checks[k].length) delete S.checks[k]; if(S.times[k]){ delete S.times[k][id]; if(!Object.keys(S.times[k]).length) delete S.times[k]; } }
}
function setVal(k,h,v){
  v=Math.max(0,Math.min(10000,Math.round(v*100)/100));
  if(v>0) (S.vals[k]=S.vals[k]||{})[h.id]=v; else if(S.vals[k]){ delete S.vals[k][h.id]; if(!Object.keys(S.vals[k]).length) delete S.vals[k]; }
  setDone(k,h.id,v>=tgtK(h,k));
}
function setSub(k,h,i,on){
  const a=new Set(subsOf(k,h.id)); if(on) a.add(i); else a.delete(i);
  const r=[...a].filter(x=>x<h.subs.length).sort((x,y)=>x-y);
  if(r.length) (S.subd[k]=S.subd[k]||{})[h.id]=r; else if(S.subd[k]){ delete S.subd[k][h.id]; if(!Object.keys(S.subd[k]).length) delete S.subd[k]; }
  setDone(k,h.id,r.length===h.subs.length,true);
}
function findOrCreateHabit(name,icon){
  name=name.trim().slice(0,60);
  let h=S.habits.find(x=>x.name.toLocaleLowerCase('tr')===name.toLocaleLowerCase('tr'));
  if(!h){ h=normHabit({id:uid(),name,icon:icon||'✨',hue:HUES[S.habits.length%HUES.length]},S.habits.length); S.habits.push(h); }
  return h;
}
