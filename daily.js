const el=id=>document.getElementById(id);
const zones=Intl.supportedValuesOf?.('timeZone') || ['Europe/London','America/New_York','Asia/Seoul'];
for(const zone of zones.filter(z=>z!=='Asia/Tokyo'))el('zone').add(new Option(zone.replaceAll('_',' '),zone));
const oldKey='horoscope-v6-birthdate', profileKey='horoscope-profile-v7';
function readStore(key){try{return localStorage.getItem(key)}catch{return null}}
function today(){return ymd(new Date())}
function show(){
 try{
   const day=el('day').value||today(),birth=el('birth').value,time=el('time').value,zone=el('zone').value;
   const rows=dailyReading(birthCharts(birth,time,zone),dateOnly(day));
   el('scores').innerHTML=rows.map(r=>'<div><dt>'+r.name+'</dt><dd>'+r.score+'<small>%</small></dd></div>').join('');
   const focus=rows.slice().sort((a,b)=>Math.abs(b.score-50)-Math.abs(a.score-50))[0],x=focus.lead;
   const phrases=focus.score>=50?{Sun:'自分から一歩踏み出して、',Moon:'心が落ち着いたところで、',Mercury:'言葉にして整理しながら、',Mars:'勢いのあるうちに、',Venus:'自分の好みを大切にして、'}:{Sun:'今日は少し立ち止まって、',Moon:'ひと呼吸おいて、',Mercury:'結論を急がず、',Mars:'急いで動く前に、',Venus:'第一印象だけで決めず、'};
   el('message').textContent=x?phrases[x.transit.key]+focus.action+'時間を取ってみましょう。':'今日は普段のペースを大切に。';
   el('reason').textContent=(x?focus.name+'に強く影響した配置は、今日の'+x.transit.jp+'と出生時の'+x.natal.jp+'の'+x.aspect.name+'（'+x.aspect.angle+'°）です。':'目立った配置はありません。')+(time?'':' 出生時刻が空欄なので、出生地の一日を約1時間刻みで調べ、共通する配置を採用しました。');
   el('stamp').textContent=day.replaceAll('-',' / ');el('result').hidden=false;el('profile').hidden=true;el('error').textContent='';
   try{localStorage.setItem(profileKey,JSON.stringify({birth,time,zone}))}catch{}
 }catch(err){el('error').textContent=err.message;el('profile').hidden=false;el('result').hidden=true}
}
el('profile').onsubmit=e=>{e.preventDefault();show()};
el('edit').onclick=()=>{el('profile').hidden=false;el('result').hidden=true};
let saved;try{saved=JSON.parse(readStore(profileKey))}catch{}
el('birth').value=saved?.birth||readStore(oldKey)||'';
el('time').value=saved?.time||'';el('zone').value=saved?.zone||'Asia/Tokyo';
el('day').value=today();
if(saved?.birth)show();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
