function combineScore(personal,sign,weather,calendar){
 var delta=(personal-50)*.60+(sign-50)*.20+(weather-60)*.15+(calendar-60)*.05;
 return Math.round(clamp(50+delta*1.65,2,98));
}
function filteredAspectScore(aspects,transitKeys,natalKeys){
 var a=aspects.filter(function(x){var t=transitKeys.indexOf(x.transit.key)>=0;var n=!natalKeys||natalKeys.indexOf(x.natal.key)>=0;return t&&n;});
 return scoreFromAspects(a);
}
function categoryBlend(daily,background,dailyWeight){var bgWeight=1-dailyWeight;return 50+(daily-50)*dailyWeight+(background-50)*bgWeight;}
function categoryScores(env,cal,aspects){
 var loveDaily=filteredAspectScore(aspects,['Moon','Mercury','Venus','Mars'],['Sun','Moon','Mercury','Venus','Mars']);
 var loveBackground=filteredAspectScore(aspects,['Jupiter','Saturn'],['Moon','Venus','Mars']);
 var love=categoryBlend(loveDaily,loveBackground,.82);
 var workDaily=filteredAspectScore(aspects,['Sun','Moon','Mercury','Mars'],['Sun','Mercury','Mars','Saturn','Jupiter']);
 var workBackground=filteredAspectScore(aspects,['Jupiter','Saturn'],['Sun','Mercury','Mars','Saturn','Jupiter']);
 var work=categoryBlend(workDaily,workBackground,.72);
 var moneyDaily=filteredAspectScore(aspects,['Moon','Mercury','Venus','Mars'],['Sun','Mercury','Venus','Jupiter','Saturn']);
 var moneyBackground=filteredAspectScore(aspects,['Jupiter','Saturn'],['Mercury','Venus','Jupiter','Saturn']);
 var money=categoryBlend(moneyDaily,moneyBackground,.80);
 var healthDaily=filteredAspectScore(aspects,['Sun','Moon','Mercury','Mars'],['Sun','Moon','Mars','Saturn']);
 var healthBackground=filteredAspectScore(aspects,['Jupiter','Saturn'],['Sun','Moon','Mars','Saturn']);
 var health=categoryBlend(healthDaily,healthBackground,.76);
 return{
   love:Math.round(clamp(50+(love-50)*1.12+(env-60)*.04+(cal-60)*.05,2,98)),
   work:Math.round(clamp(50+(work-50)*1.04+(env-60)*.12+(cal-60)*.08,2,98)),
   money:Math.round(clamp(50+(money-50)*1.12+(env-60)*.03+(cal-60)*.06,2,98)),
   health:Math.round(clamp(50+(health-50)*.78+(env-60)*.40+(cal-60)*.10,2,98))
 };
}
function modeFrom(finalScore,aspects,cal,w){
 var positive=aspects.filter(function(x){return x.impact>.25;}).length;
 var hard=aspects.filter(function(x){return x.impact<-.25;}).length;
 if(finalScore>=78&&positive>=2)return'進める';
 if(cal&&cal.label==='休日前'&&finalScore>=68)return'つながる';
 if(w&&w.pressureDelta6h<=-5)return finalScore>=62?'整える':'守る';
 if(hard>=2)return finalScore>=60?'深める':'守る';
 if(finalScore>=67)return'深める';
 return'整える';
}
var GUIDE={
 '進める':['外へ働きかける抵抗が比較的小さい日です。','公開する、提案する、連絡するなど、温めていたものを一つ外へ出してみてください。'],
 'つながる':['人とのやり取りから流れが生まれやすい日です。','一人で抱えず、相談・共有・声かけのどれかを一つ行ってみてください。'],
 '深める':['広げるより、一つのテーマに時間を使うと実りやすい日です。','制作、研究、読み直しなど、途中になっているものを一段深く進めてみてください。'],
 '整える':['勢いより、順序や環境を整えることで流れを使いやすい日です。','修正、準備、片づけなど、次の一歩を軽くする作業を優先してください。'],
 '守る':['前進量を減らすこと自体が、その日の流れを活かす選択になります。','予定を一つ減らし、判断を急がず、回復できる余白を残してください。']
};
function labelTrend(score,kind){
 if(kind==='sky'){if(score>=68)return'動きやすい';if(score>=58)return'おおむね安定';if(score>=48)return'やや負荷あり';return'負荷あり';}
 if(kind==='calendar'){if(score>=68)return'動きやすい';if(score>=58)return'通常';return'余白を意識';}
 if(score>=72)return'追い風';if(score>=62)return'やや追い風';if(score>=52)return'中立';if(score>=42)return'やや慎重';return'慎重';
}
function planetPairText(x){return'今日の'+x.transit.jp+' × 出生時の'+x.natal.jp;}
function planetTheme(p){var m={Sun:'自分らしさ',Moon:'気持ち',Mercury:'考え・言葉',Venus:'好み・人間関係',Mars:'行動力',Jupiter:'広がり・可能性',Saturn:'制約・責任'};return m[p.key]||p.verb;}
function aspectPlainTitle(x){
 var a=planetTheme(x.transit),b=planetTheme(x.natal),name=x.aspect.name;
 if(x.transit.key==='Moon'&&x.natal.key==='Moon'&&name==='トライン')return'気持ちのリズムが整いやすい';
 if(((x.transit.key==='Mercury'&&x.natal.key==='Moon')||(x.transit.key==='Moon'&&x.natal.key==='Mercury'))&&name==='オポジション')return'考えと気持ちが食い違いやすい';
 if(((x.transit.key==='Saturn'&&x.natal.key==='Mars')||(x.transit.key==='Mars'&&x.natal.key==='Saturn'))&&name==='スクエア')return'行動したいのにブレーキがかかりやすい';
 if(name==='トライン')return a+'と'+b+'が自然に噛み合いやすい';if(name==='セクスタイル')return a+'と'+b+'を工夫して活かしやすい';if(name==='コンジャンクション')return a+'と'+b+'が強く表れやすい';if(name==='スクエア')return a+'と'+b+'がぶつかりやすい';return a+'と'+b+'が引っ張り合いやすい';
}
function aspectPlainMeaning(x){
 var a=planetTheme(x.transit),b=planetTheme(x.natal),name=x.aspect.name;
 if(name==='トライン')return'今日は「'+a+'」と、もともとの「'+b+'」が自然につながりやすい配置です。無理に流れを変えるより、すっと進むことを活かす方が向いています。';
 if(name==='セクスタイル')return'今日は「'+a+'」と「'+b+'」の間に使えるきっかけがあります。待つより、小さく働きかけることで流れを活かしやすくなります。';
 if(name==='コンジャンクション')return'今日は「'+a+'」と「'+b+'」が同じ場所で重なり、このテーマが普段より強く出やすい配置です。';
 if(name==='スクエア')return'今日は「'+a+'」と「'+b+'」がぶつかりやすい配置です。力で押し切るより、順序や条件を整える方がうまく使えます。';
 return'今日は「'+a+'」と「'+b+'」が反対方向へ引っ張りやすい配置です。どちらか一方に決めつけず、少し間を置いてバランスを取るのが向いています。';
}
function aspectPlainGuide(x){
 var name=x.aspect.name;
 if(x.transit.key==='Moon'&&x.natal.key==='Moon'&&name==='トライン')return'自然に集中できること、気持ちよく続けられることを優先してみてください。';
 if(((x.transit.key==='Mercury'&&x.natal.key==='Moon')||(x.transit.key==='Moon'&&x.natal.key==='Mercury'))&&name==='オポジション')return'すぐに返事や結論を出さず、考えと気持ちの両方を一度確認してから決めるのがおすすめです。';
 if(((x.transit.key==='Saturn'&&x.natal.key==='Mars')||(x.transit.key==='Mars'&&x.natal.key==='Saturn'))&&name==='スクエア')return'無理に突破しようとせず、制約を一つずつ確認して、できる範囲を確実に進めてください。';
 if(name==='トライン')return'自然に進むことを一つ選び、余計な力を加えず進めてみてください。';if(name==='セクスタイル')return'小さな連絡、着手、提案など、自分から一歩だけ動かしてみてください。';if(name==='コンジャンクション')return'このテーマを今日の主役と考え、広げすぎず一つに集中すると使いやすいです。';if(name==='スクエア')return'急いで突破するより、詰まっている条件を一つ整理してから動くのがおすすめです。';return'即断を避け、両方の立場や気持ちを確認してから次の一手を決めてください。';
}
function topAspectFor(aspects,keys){var fast=['Moon','Mercury','Venus','Mars','Sun'];var preferred=aspects.find(function(x){return fast.indexOf(x.transit.key)>=0&&(keys.indexOf(x.transit.key)>=0||keys.indexOf(x.natal.key)>=0);});return preferred||aspects.find(function(x){return keys.indexOf(x.transit.key)>=0||keys.indexOf(x.natal.key)>=0;})||aspects[0]||null;}
function aspectAction(x,positiveText,hardText){if(!x)return'星の強い偏りが少ないため、普段のペースを基準にするとよさそうです。';return x.aspect.polarity>=0?positiveText:hardText;}
function skyAdvice(w,mode){
 if(!w)return'空のデータが取れなかったため、今日は星と暦を中心にガイドしています。';
 var parts=[];
 if(w.pressureDelta6h<=-6)parts.push('気圧の下がり方が大きいので、予定を詰めるより余白を残す方が今日の流れを使いやすそうです。');else if(w.pressureDelta6h<=-3)parts.push('気圧は下降傾向です。長く粘るより、短い区切りを作って進める方が合っています。');else parts.push('気圧は比較的安定しているため、空の状態そのものは大きなブレーキになりにくい日です。');
 if(w.temp>=32)parts.push('ただし暑さが強いので、移動量を増やすより、涼しい場所で集中する対象を絞るのがおすすめです。');else if(w.temp>=30)parts.push('暑さは強めです。外向きの予定を増やしすぎず、休憩を挟める組み方が向いています。');else if(w.precip>=2)parts.push('雨の影響があるので、外へ広げるより室内で完結することを優先すると動きやすいでしょう。');else if(mode==='進める')parts.push('動くなら、今日の追い風をそのまま行動量に変えやすい環境です。');
 return parts.join(' ');
}
function calendarAdvice(cal){if(!cal)return'今日は普段の生活リズムを基準にしてください。';if(cal.label==='休日前')return'休日前です。今日中に全部終わらせるより、一区切りつけて次へつなぐ余白を作る使い方が向いています。';if(cal.label==='休日最終日')return'休日の終わりです。新しいことを増やすより、明日の負担を減らす準備を優先するとよさそうです。';if(cal.label==='連休中')return'連休の途中です。時間の余白があるぶん、一つのテーマを普段より深く進めやすい日です。';if(cal.todayOff)return'休日です。量をこなすより、自分のペースで集中できることを選ぶと流れを使いやすそうです。';return'通常日です。大きく予定を変えるより、普段のリズムの中で今日の星を使うのが自然です。';}
function categoryText(name,score,aspects,w,cal){
 var x;
 if(name==='恋愛'){x=topAspectFor(aspects,['Venus','Moon','Mars']);return aspectAction(x,'相手とのやり取りに自然な流れが出やすい日です。結論を急がず、短い会話や一言の連絡から始めるとよさそうです。','気持ちと反応が少し噛み合いにくい場面がありそうです。相手の言葉をすぐ結論にせず、一度受け取ってから返すのがおすすめです。');}
 if(name==='仕事'){x=topAspectFor(aspects,['Sun','Mercury','Mars','Saturn','Jupiter']);var base=aspectAction(x,'考えたことを形にしやすい流れがあります。広げすぎず、一つの仕事を見えるところまで進めると手応えにつながりそうです。','勢いだけで押すより、順序や制約を確認してから進める方が今日の星を使いやすい日です。');if(w&&w.temp>=30)base+=' 暑さが強めなので、長時間続けるより短い集中を何度か作る方が向いています。';return base;}
 if(name==='金運'){x=topAspectFor(aspects,['Venus','Jupiter','Saturn']);return aspectAction(x,'必要なものと欲しいものを落ち着いて見分けやすい日です。小さな購入や今後の使い方を決めるには悪くありません。','勢いで決めるより、一度保留して比較する方が合う日です。大きな判断は条件をもう一度確認してからにしましょう。');}
 x=topAspectFor(aspects,['Sun','Moon','Mars','Saturn']);var t=aspectAction(x,'無理に調子を上げようとせず、普段のペースを保つことで一日のリズムを作りやすそうです。','頑張る量を増やすより、予定に余白を残す方が一日のリズムを保ちやすそうです。');if(w&&w.temp>=32)t+=' 暑さが強いので、こまめに休める予定の組み方を優先してください。';else if(w&&w.pressureDelta6h<=-3)t+=' 気圧は下降傾向なので、長く粘るより区切りを作る方がよさそうです。';return t;
}
function fmtCaptured(iso){if(!iso)return'取得時刻なし';var d=new Date(iso);if(isNaN(d.getTime()))return iso;return(d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
