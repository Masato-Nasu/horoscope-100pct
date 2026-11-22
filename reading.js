// Resolve a civil date against historical IANA offsets, including repeated hours.
function birthCharts(day,time,zone){
 const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const center=Date.parse(day+'T12:00:00Z'), minute=60000;
 const dates=[];
 for(let utc=center-27*3600000;utc<=center+27*3600000;utc+=minute){
   const local=fmt.format(new Date(utc));
   if(time ? local===day+' '+time : local.startsWith(day+' ')) dates.push(utc);
 }
 if(!dates.length)throw Error('この出生地で有効な日付・時刻を選んでください。');
 return dates.filter((_,i)=>time || i%60===0 || i===dates.length-1).map(t=>getChart(new Date(t)));
}
const fields=[
 ['恋愛運',['Venus','Moon','Mars'],['Venus','Moon'],'気持ちを伝える','気持ちを確かめる'],
 ['仕事運',['Mercury','Mars','Sun'],['Mercury','Saturn','Sun'],'仕事を進める','段取りを見直す'],
 ['金運',['Venus','Mercury','Moon'],['Jupiter','Saturn','Venus'],'予算を決める','買い物の条件を見直す'],
 ['対人運',['Moon','Mercury','Sun'],['Mercury','Moon','Jupiter'],'人と話す','相手の話を聞く']
];
function dailyReading(charts,date){
 const transit=getChart(date);
 const key=x=>[x.transit.key,x.natal.key,x.aspect.angle].join('/');
 const sets=charts.map(c=>new Map(personalAspects(c,transit).map(x=>[key(x),x])));
 const stable=[];
 for(const [id,x] of sets[0]){
   if(sets.every(s=>s.has(id))) stable.push({...x,impact:sets.reduce((n,s)=>n+s.get(id).impact,0)/sets.length});
 }
 return fields.map(([name,moving,natal,up,down])=>{
   const hits=stable.filter(x=>moving.includes(x.transit.key)&&natal.includes(x.natal.key)).sort((a,b)=>Math.abs(b.impact)-Math.abs(a.impact));
   const score=scoreFromAspects(hits);
   const lead=hits.find(x=>score>=50?x.impact>0:x.impact<0);
   return {name,score,lead,action:score>=50?up:down};
 });
}
