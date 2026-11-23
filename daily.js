const el=id=>document.getElementById(id);
const zones=Intl.supportedValuesOf?.('timeZone') || ['Europe/London','America/New_York','Asia/Seoul'];
for(const zone of zones.filter(z=>z!=='Asia/Tokyo'))el('zone').add(new Option(zone.replaceAll('_',' '),zone));
const oldKey='horoscope-v6-birthdate', profileKey='horoscope-profile-v7';
function readStore(key){try{return localStorage.getItem(key)}catch{return null}}
function today(){return ymd(new Date())}
// Each pair gives a constructive or cautious reading for the leading transit.
const dailyNotes = {
 '恋愛運': {
   Venus:['好きなところを一つ、言葉にしてみて。','相手に合わせすぎていないか、自分の気持ちも確かめて。'],
   Moon:['ふと思い出したことを話すと、会話が弾みそう。','返事が気になったら、少し間を置いてみて。'],
   Mars:['会いたい気持ちは、短いお誘いにしてみて。','誘いの返事は急かさず、相手のペースに任せて。']
 },
 '仕事運': {
   Mercury:['考えがまとまったら、要点を一行にして共有してみて。','送信前に、日時と依頼内容をもう一度確認して。'],
   Mars:['手をつけたかった仕事は、最初の一工程から。','作業を増やす前に、今の一件を区切りまで。'],
   Sun:['提案したいことは、自分の言葉で切り出してみて。','優先順位に迷ったら、今日仕上げる一件を決めて。'],
   Moon:['集中できるうちに、考える仕事をひとつ進めて。','気が散るときは、短く区切れる作業から。']
 },
 '金運': {
   Venus:['欲しいものは、長く使いたい一品に絞れそう。','見た目にひかれた買い物は、一晩置いてみて。'],
   Mercury:['候補の値段と使い道を書き出すと、選びやすい日。','注文を確定する前に、送料を含む総額を確認して。'],
   Moon:['普段の支出を振り返ると、満足度の高い使い道が見えそう。','気分で買い足しそうなものは、今日は欲しいものリストへ。']
 },
 '対人運': {
   Moon:['気になっていた友人に、近況をたずねてみて。','相談を受けたら、まずは話を最後まで聞いて。'],
   Mercury:['小さなお礼も、今日のうちに言葉にしてみて。','話がかみ合わないときは、相手の意図を一言確かめて。'],
   Sun:['輪に入りづらそうな人に、こちらから声をかけてみて。','意見が分かれたら、相手に先に話してもらって。']
 }
};
function fieldNote(row) {
 const pair = dailyNotes[row.name][row.lead?.transit.key];
 return pair ? pair[row.score >= 50 ? 0 : 1] : '今日はいつものペースで。';
}
function show(){
 try{
   const day=el('day').value||today(),birth=el('birth').value,time=el('time').value,zone=el('zone').value;
   const rows=dailyReading(birthCharts(birth,time,zone),dateOnly(day));
   el('scores').innerHTML=rows.map(r=>'<div><dt>'+r.name+'</dt><dd>'+r.score+'<small>%</small></dd><dd class="note">'+fieldNote(r)+'</dd></div>').join('');
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
else el('profile').hidden=false;
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
