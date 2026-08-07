var ENGINE_VERSION='6.0.0';
var ASPECTS=[
 {name:'コンジャンクション',angle:0,polarity:.55,meaning:'二つの力が重なり、テーマが強く意識されやすい配置です。'},
 {name:'セクスタイル',angle:60,polarity:.65,meaning:'工夫や働きかけによって、機会を活かしやすい配置です。'},
 {name:'スクエア',angle:90,polarity:-.72,meaning:'摩擦や課題が表れやすく、調整や具体的な行動を促す配置です。'},
 {name:'トライン',angle:120,polarity:.82,meaning:'二つの力が自然に流れやすく、無理なく活かしやすい配置です。'},
 {name:'オポジション',angle:180,polarity:-.58,meaning:'二つの方向が向き合い、バランスや相手側の視点を求める配置です。'}
];
var PLANETS=[
 {key:'Sun',body:Astronomy.Body.Sun,jp:'太陽',w:1.3,verb:'自分らしさ・意志'},
 {key:'Moon',body:Astronomy.Body.Moon,jp:'月',w:1.2,verb:'感情・反応'},
 {key:'Mercury',body:Astronomy.Body.Mercury,jp:'水星',w:1.0,verb:'思考・伝達'},
 {key:'Venus',body:Astronomy.Body.Venus,jp:'金星',w:1.0,verb:'好み・関係・価値'},
 {key:'Mars',body:Astronomy.Body.Mars,jp:'火星',w:1.05,verb:'行動・推進力'},
 {key:'Jupiter',body:Astronomy.Body.Jupiter,jp:'木星',w:.95,verb:'拡大・展望'},
 {key:'Saturn',body:Astronomy.Body.Saturn,jp:'土星',w:.95,verb:'制約・責任・持続'}
];
var SIGNS=['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座'];

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function round1(n){return Math.round(n*10)/10;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function dateOnly(str){if(!str)return null;var m=str.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;return new Date(+m[1],+m[2]-1,+m[3],12,0,0);}
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function addDays(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);x.setDate(x.getDate()+n);return x;}
function isWeekend(d){return d.getDay()===0||d.getDay()===6;}
function eclLon(body,date){var time=new Astronomy.AstroTime(date);var vec=Astronomy.GeoVector(body,time,true);return Astronomy.Ecliptic(vec).elon;}
function angleDiff(a,b){var d=Math.abs(a-b)%360;return d>180?360-d:d;}
function nearestAspect(diff,orbMax){var best=null;ASPECTS.forEach(function(a){var orb=Math.abs(diff-a.angle);if(orb<=orbMax&&(!best||orb<best.orb)){best={name:a.name,angle:a.angle,polarity:a.polarity,meaning:a.meaning,orb:orb};}});return best;}
function signIndexFromLon(lon){return Math.floor(((lon%360)+360)%360/30);}
function getChart(date){var c={};PLANETS.forEach(function(p){c[p.key]=eclLon(p.body,date);});return c;}

function personalAspects(natal,transit){
 var out=[];
 PLANETS.forEach(function(tp){
   PLANETS.forEach(function(np){
     var diff=angleDiff(transit[tp.key],natal[np.key]);
     var orbMax=(tp.key==='Sun'||tp.key==='Moon'||np.key==='Sun'||np.key==='Moon')?8:6;
     var a=nearestAspect(diff,orbMax); if(!a)return;
     var closeness=1-a.orb/orbMax;
     var importance=(tp.w+np.w)/2;
     var strength=closeness*importance;
     out.push({transit:tp,natal:np,aspect:a,strength:strength,impact:a.polarity*strength});
   });
 });
 out.sort(function(a,b){return b.strength-a.strength;});
 return out;
}
function scoreFromAspects(aspects){
 if(!aspects.length)return 50;
 var picked=aspects.slice().sort(function(a,b){return Math.abs(b.impact)-Math.abs(a.impact);}).slice(0,5);
 var rank=[1,.70,.48,.32,.20],sum=0,den=0;
 picked.forEach(function(x,index){
   var unit=clamp(x.impact/.95,-1,1);
   sum+=unit*rank[index];
   den+=rank[index];
 });
 var net=den?sum/den:0;
 var dominant=clamp(picked[0].impact/.95,-1,1);
 var signal=clamp(dominant*.55+net*.45,-1,1);
 var curved=signal===0?0:(signal<0?-1:1)*Math.pow(Math.abs(signal),.55);
 return Math.round(clamp(50+48*curved,2,98));
}
function sunSignLayer(signIdx,transit){
 var center=signIdx*30+15,rows=[];
 PLANETS.forEach(function(p){
   var diff=angleDiff(transit[p.key],center);
   var max=(p.key==='Sun'||p.key==='Moon')?8:6;
   var a=nearestAspect(diff,max);
   if(a){var strength=(1-a.orb/max)*p.w;rows.push({planet:p,aspect:a,strength:strength,impact:a.polarity*strength});}
 });
 rows.sort(function(a,b){return Math.abs(b.impact)-Math.abs(a.impact);});
 if(!rows.length)return{score:50,rows:rows};
 var rank=[1,.62,.36],sum=0,den=0;
 rows.slice(0,3).forEach(function(x,index){
   var unit=clamp(x.impact/.90,-1,1);
   sum+=unit*rank[index]; den+=rank[index];
 });
 var net=den?sum/den:0;
 var dominant=clamp(rows[0].impact/.90,-1,1);
 var signal=clamp(dominant*.55+net*.45,-1,1);
 var curved=signal===0?0:(signal<0?-1:1)*Math.pow(Math.abs(signal),.60);
 return{score:Math.round(clamp(50+44*curved,6,94)),rows:rows};
}

function weatherCodeText(code){
 if(code===0)return'快晴'; if(code<=3)return'晴れ・曇り'; if(code===45||code===48)return'霧';
 if(code>=51&&code<=67)return'雨'; if(code>=71&&code<=77)return'雪';
 if(code>=80&&code<=82)return'にわか雨'; if(code>=95)return'雷雨'; return'変わりやすい天気';
}
function weatherScore(w){
 if(!w)return 60;
 var s=60,dp=w.pressureDelta6h||0;
 if(dp<=-6)s-=15; else if(dp<=-3)s-=8; else if(dp>=4)s+=4;
 if(w.humidity>=85)s-=5; if(w.temp>=32)s-=8; if(w.temp<=3)s-=5; if(w.precip>=2)s-=5;
 if(w.code===0||w.code===1)s+=4;
 return Math.round(clamp(s,30,85));
}
function weatherCharacter(w){
 if(!w)return'環境データなし';
 var bits=[];
 if(w.pressureDelta6h<=-6)bits.push('気圧が大きく下降');
 else if(w.pressureDelta6h<=-3)bits.push('気圧が下降');
 else if(w.pressureDelta6h>=4)bits.push('気圧が上昇');
 else bits.push('気圧は比較的安定');
 bits.push(weatherCodeText(w.code));
 if(w.humidity>=80)bits.push('湿度高め');
 if(w.temp>=30)bits.push('暑さ強め');
 return bits.join('・');
}
function findLegacyWeather(date,lat,lon){
 var suffix='|'+ymd(date)+'|'+lat.toFixed(2)+'|'+lon.toFixed(2);
 for(var i=0;i<localStorage.length;i++){
   var k=localStorage.key(i);
   if(k&&k.indexOf('h6-weather|')===0&&k.endsWith(suffix)){
     try{return JSON.parse(localStorage.getItem(k));}catch(e){}
   }
 }
 return null;
}
async function fetchWeather(lat,lon,target){
 var key='h6-weather-day|'+ymd(target)+'|'+lat.toFixed(2)+'|'+lon.toFixed(2);
 var cached=localStorage.getItem(key); if(cached)return JSON.parse(cached);
 var legacy=findLegacyWeather(target,lat,lon); if(legacy){localStorage.setItem(key,JSON.stringify(legacy));return legacy;}
 var start=ymd(target);
 var url='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lon)+'&hourly=temperature_2m,relative_humidity_2m,pressure_msl,precipitation,weather_code&timezone=auto&start_date='+start+'&end_date='+start;
 var r=await fetch(url); if(!r.ok)throw new Error('weather '+r.status);
 var j=await r.json(),times=j.hourly.time||[]; if(!times.length)throw new Error('weather empty');
 var idx=times.findIndex(function(t){return t.endsWith('12:00');}); if(idx<0)idx=Math.floor(times.length/2);
 var p=j.hourly.pressure_msl||[],before=Math.max(0,idx-6);
 var snap={capturedAt:new Date().toISOString(),date:start,referenceTime:times[idx]||'',lat:lat,lon:lon,temp:+j.hourly.temperature_2m[idx],humidity:+j.hourly.relative_humidity_2m[idx],pressure:+p[idx],pressureDelta6h:round1((+p[idx])-(+p[before])),precip:+j.hourly.precipitation[idx],code:+j.hourly.weather_code[idx],timezone:j.timezone||''};
 localStorage.setItem(key,JSON.stringify(snap));
 return snap;
}
async function holidaysForYear(year){
 var key='h6-holidays|'+year,c=localStorage.getItem(key); if(c)return JSON.parse(c);
 var r=await fetch('https://holidays-jp.github.io/api/v1/'+year+'/date.json'); if(!r.ok)throw new Error('holiday '+r.status);
 var j=await r.json(); localStorage.setItem(key,JSON.stringify(j)); return j;
}
function calendarLayer(target,holidays){
 var k=ymd(target),prev=ymd(addDays(target,-1)),next=ymd(addDays(target,1));
 var isHol=!!holidays[k],prevOff=isWeekend(addDays(target,-1))||!!holidays[prev],nextOff=isWeekend(addDays(target,1))||!!holidays[next],todayOff=isWeekend(target)||isHol;
 var score=60,label='通常日';
 if(todayOff){score=68;label=isHol?holidays[k]:'休日';}
 if(!todayOff&&nextOff){score=72;label='休日前';}
 if(todayOff&&!nextOff){score=54;label='休日最終日';}
 if(todayOff&&prevOff&&nextOff){score=70;label='連休中';}
 return{score:score,label:label,holiday:isHol?holidays[k]:'',todayOff:todayOff,nextOff:nextOff};
}
