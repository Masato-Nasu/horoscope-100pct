function render(data){
 var g=GUIDE[data.mode],html='';
 html+='<div class="hero"><div class="scoreline"><div class="scorelabel">今日の運勢</div><div class="score">'+data.final+'%</div></div><div class="mode">今日のモード：'+esc(data.mode)+'</div><div class="guide">'+esc(g[0])+'</div><div class="action"><strong>今日のガイド：</strong>'+esc(g[1])+'</div></div>';
 html+='<div class="factor-title">今日をつくっている4つの要素</div><div class="factor-grid">';
 html+='<div class="factor"><div class="k">みんなの星空</div><div class="v">'+esc(data.signName)+'全体：'+labelTrend(data.signScore,'star')+'</div><div class="s">同じ太陽星座に共通する今日の基調です。</div></div>';
 html+='<div class="factor"><div class="k">あなたの星</div><div class="v">個人の流れ：'+labelTrend(data.personal,'star')+'</div><div class="s">出生時の星と今日の星の関係です。</div></div>';
 html+='<div class="factor"><div class="k">今日の空</div><div class="v">環境：'+labelTrend(data.envScore,'sky')+'</div><div class="s">'+esc(data.weatherText)+'</div></div>';
 html+='<div class="factor"><div class="k">今日の暦</div><div class="v">タイミング：'+labelTrend(data.cal.score,'calendar')+'</div><div class="s">'+esc(data.cal.label)+'</div></div></div>';
 html+='<details open><summary>星の理由を見る</summary>';
 data.top.forEach(function(x){html+='<div class="reason"><div class="reason-title">'+esc(aspectPlainTitle(x))+'</div><div class="reason-text">'+esc(aspectPlainMeaning(x))+'</div><div class="reason-text"><strong>今日の使い方：</strong>'+esc(aspectPlainGuide(x))+'</div><div class="reason-sub">'+esc(planetPairText(x))+' ／ '+esc(x.aspect.name)+' '+x.aspect.angle+'° ／ オーブ '+round1(x.aspect.orb)+'°'+(x.aspect.orb<=3?' ／ 強い配置':'')+'</div></div>';});
 if(!data.top.length)html+='<div class="reason-text">今日は主要5アスペクトのうち、強く表示する配置が少ない日です。</div>';
 html+='</details>';
 html+='<div class="section"><h3>今日の過ごし方を調整する要素</h3>';
 html+='<div class="advice"><div class="advice-title">空からの調整</div><div class="advice-text">'+esc(skyAdvice(data.w,data.mode))+'</div></div>';
 html+='<div class="advice"><div class="advice-title">暦からの調整</div><div class="advice-text">'+esc(calendarAdvice(data.cal))+'</div></div></div>';
 html+='<div class="section"><h3>恋愛・仕事・金運・健康</h3>';
 [['恋愛','love'],['仕事','work'],['金運','money'],['健康','health']].forEach(function(pair){html+='<div class="category"><div class="category-head"><div class="category-name">'+pair[0]+'</div><div class="category-score">'+data.cats[pair[1]]+'%</div></div><div class="category-text">'+esc(categoryText(pair[0],data.cats[pair[1]],data.topAll,data.w,data.cal))+'</div></div>';});
 html+='</div>';
 html+='<details><summary>計算情報</summary><div class="meta">';
 html+='太陽星座：'+esc(data.signName)+' ／ 場所：'+esc(data.placeName)+'<br>';
 if(data.w){html+='気象基準：12:00 ／ '+round1(data.w.pressure)+' hPa ／ 6時間変化 '+(data.w.pressureDelta6h>=0?'+':'')+round1(data.w.pressureDelta6h)+' hPa ／ '+round1(data.w.temp)+'℃ ／ 湿度 '+Math.round(data.w.humidity)+'%<br>';html+='気象データ取得：'+esc(fmtCaptured(data.w.capturedAt))+'<br>';}else{html+='気象データ：取得なし<br>';}
 html+='計算方式：Horoscope Engine '+ENGINE_VERSION+'<br>';
 html+='同じ日の同じ条件では、最初に取得した環境と同じ計算規則を使用します。';
 html+='</div><div class="note">この結果は、その日の過ごし方を考えるための占星術的なガイドです。</div></details>';
 document.getElementById('result').innerHTML=html;
}

var selected={lat:35.6812,lon:139.7671,name:'東京'};
document.getElementById('place').addEventListener('change',function(){var p=this.value.split(',');selected={lat:+p[0],lon:+p[1],name:p[2]};});
document.getElementById('geoBtn').addEventListener('click',function(){
 var st=document.getElementById('status');
 if(!navigator.geolocation){st.textContent='このブラウザでは位置情報を利用できません。';return;}
 st.textContent='現在地を取得しています…';
 navigator.geolocation.getCurrentPosition(function(pos){selected={lat:pos.coords.latitude,lon:pos.coords.longitude,name:'現在地'};st.textContent='現在地を使用します。';},function(){st.textContent='位置情報を取得できませんでした。選択中の都市を使用します。';},{enableHighAccuracy:false,timeout:10000,maximumAge:600000});
});
document.getElementById('calcBtn').addEventListener('click',async function(){
 var st=document.getElementById('status');
 try{
   var birth=dateOnly(document.getElementById('birth').value);if(!birth)throw new Error('生年月日を入力してください。');
   var target=dateOnly(document.getElementById('targetDate').value);if(!target){var n=new Date();target=new Date(n.getFullYear(),n.getMonth(),n.getDate(),12);}
   st.textContent='星・空・暦を読み合わせています…';
   var natal=getChart(birth),transit=getChart(target);
   var aspects=personalAspects(natal,transit),personal=scoreFromAspects(aspects);
   var signIdx=signIndexFromLon(natal.Sun),sign=sunSignLayer(signIdx,transit);
   var holidays={};try{holidays=await holidaysForYear(target.getFullYear());}catch(e){holidays={};}
   var cal=calendarLayer(target,holidays);
   var w=null;try{w=await fetchWeather(selected.lat,selected.lon,target);}catch(e){console.warn(e);}
   var envScore=weatherScore(w);
   var final=combineScore(personal,sign.score,envScore,cal.score);
   var mode=modeFrom(final,aspects,cal,w);
   var cats=categoryScores(envScore,cal.score,aspects);
   render({final:final,personal:personal,signScore:sign.score,envScore:envScore,cal:cal,w:w,weatherText:weatherCharacter(w),top:aspects.slice(0,3),topAll:aspects,mode:mode,cats:cats,signName:SIGNS[signIdx],placeName:selected.name});
   st.textContent='計算完了。同じ条件では同じ結果を再表示します。';
 }catch(e){console.error(e);st.textContent=e.message||'計算中にエラーが発生しました。';}
});
if ('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').then(function(reg){if(reg&&reg.update)reg.update();}).catch(function(err){console.log('ServiceWorker registration failed:',err);});});}
