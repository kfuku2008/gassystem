// 調べたい地域の緯度(latitude)・経度(longitude)を指定⇒以下のGoogleMapを開き、地域を入力し、URL内@緯度,経度を取得する
//https://www.google.co.jp/maps
//任意設定可能
//==========================
//緯度(latitude)をここに入力
const latitude = 36.0720605;
//経度(longitude)をここに入力
const longitude = 137.6779845;
//風速の設定（デフォルトで3.0m/s）
const windSpeed = 5.0
//==========================

//天気変換用辞書（英語→日本語)
const weatherType = {'Clear':'晴れ',"Clouds":"曇り","Snow":"雪","Rain":"雨","Drizzle":"霧雨","Thunderstorm":"雷雨"}

//ここにトリガー対象関数を記載
function actFunction(){

  //今日の月齢情報を取得
  const moonPhase = moonAge_();
  Logger.log(moonPhase)

  //日没時間を取得
  const sunsetTime = openWeatherSNSconnection_().formattedSunsetTime;


  //新月条件時に実行
  if(moonPhase === "New moon"||moonPhase ==="Waning crescent"){

    Logger.log('新月付近')

    //日没+1時間~翌8時の間[時間,風速,天候]
    const weatherList = openWeatherSNSconnection_().futureHourlyList;
    //Logger.log(weatherList)

    let sendFlag = false;

    //晴天の時間があればフラグをtrueにする
    for(let i=0; i<weatherList.length;i++){

      //本番は!==　から　===　に変更

      if(weatherList[i][0]<=24 && weatherList[i][2] === 'Clear'){
        sendFlag = true;
        break;
      }else{
        sendFlag = false;
      }

    //Logger.log(sendFlag)

    }
    if(sendFlag){
      Logger.log('天候条件OK')
      //快晴の時間を取得
      const skyList = []

      for(let j=0;j<weatherList.length;j++){
          //天気情報を日本語に変換
          const weatherRep = weatherList[j][2].replace(weatherList[j][2],weatherType[weatherList[j][2]])

          //晴天の時間をリストに格納
          skyList.push([weatherList[j][0],weatherRep])        
      }

        let inputMessage = []

        //取得した時間をメッセージ用にフォーマット化
        for(let k=0;k<skyList.length;k++){

          inputMessage.push("・"+skyList[k][0]+"時台"+' '+skyList[k][1]);
        }
        const clearskyMessage = `\n${inputMessage.join('\n')}`

        //Logger.log(clearskyMessage)

        //LINEメッセージを送信
        lineConnection_(clearskyMessage,sunsetTime);        
    }else{
      Logger.log(`天候条件NG:快晴の時間がありません。${weatherList}`)
    }

  //★満月(付近時の通知)
  }else if(moonPhase === "Waxing gibbous"||moonPhase ==="Full moon"){

    Logger.log('満月付近')

    //日没+1時間~翌8時の間[時間,風速,天候]
    const weatherListMoon = openWeatherSNSconnection_().futureHourlyList;
    Logger.log(weatherListMoon)

    let sendFlagMoon = false;

    for(let x=0; x<weatherListMoon.length;x++){

      //本番は!==　から　===　に変更

      if(weatherListMoon[x][0]<=24 && weatherListMoon[x][2] === 'Clear'){
        sendFlagMoon = true;
        break;
      }else{
        sendFlagMoon = false;
      }

    Logger.log(sendFlagMoon)
    }

    if(sendFlagMoon){
      Logger.log('天候条件OK(満月時)')
      //快晴の時間を取得
      const clearskyListMoon = []

      for(let y=0;y<weatherListMoon.length;y++){
          
          //天気情報を日本語に変換
          const weatherRepMoon = weatherListMoon[y][2].replace(weatherListMoon[y][2],weatherType[weatherListMoon[y][2]])

          //晴天の時間をリストに格納
          clearskyListMoon.push([weatherListMoon[y][0],weatherRepMoon])      
      }
      //快晴の時間があるときのみLINEを送信

        let inputMessageMoon = []

        //取得した時間をメッセージ用にフォーマット化
        for(let z=0;z<clearskyListMoon.length;z++){

          inputMessageMoon.push("・"+clearskyListMoon[z][0]+"時台"+' '+clearskyListMoon[z][1]);

        }
        const clearskyMessageMoon = `\n${inputMessageMoon.join('\n')}`

       //Logger.log(clearskyListMoon)

        //LINEメッセージを送信
       lineConnectionMoon_(clearskyMessageMoon,sunsetTime);        

    }else{
      Logger.log(`天候条件NG(満月):快晴の時間がありません${weatherListMoon}`)
    }

  }
  
  else{
    Logger.log('該当月齢でないため、LINE送信なし')
  }
}

//★④週末の天気条件によるLINE通知
function weekendWeather(){

    //72時間後から22時間分の天気情報[時間,風速,天候]
    const weatherListWeekend = openWeatherSNSconnectionWeekend_().futureHourlyList;
    //Logger.log(weatherListWeekend)

    //実行期間
    const targetPeriod = openWeatherSNSconnectionWeekend_().period

    let sendFlag = false;

    for(let i=0; i<weatherListWeekend.length;i++){

      //除外条件(Thunderstorm/Drizzle/Snow/Cloudsあたりは入れる？))
      //https://cococo-web.com/HIT/owlist/owlist.html

      if(weatherListWeekend[i][1]<= windSpeed && weatherListWeekend[i][2] !== 'Rain'&& weatherListWeekend[i][2] !== 'Snow'&& weatherListWeekend[i][2] !== 'Thunderstorm'&& weatherListWeekend[i][2] !== 'Drizzle'){
        //晴れている時にtrue
        sendFlag = true;
        
      }else{
        //晴れていないときにfalse(falseフラグ付いたら終了→天候条件NG出す)
        sendFlag = false;
        break;
      }

    //Logger.log(sendFlag)

    }
    if(sendFlag){
      Logger.log('天候条件OK')

      //天気情報を取得
      const weekendWeatherList = []

      for(let j=0;j<weatherListWeekend.length;j++){  

          const weatherRep = weatherListWeekend[j][2].replace(weatherListWeekend[j][2],weatherType[weatherListWeekend[j][2]])

          //晴天の時間をリストに格納
          weekendWeatherList.push([weatherListWeekend[j][0],weatherRep]) 
      }

      //Logger.log(weekendWeatherList)
      let weekendInputMessage = []

      //取得した時間をメッセージ用にフォーマット化([時間,天気]→○○時台 天気)
      for(let k=0;k<weekendWeatherList.length;k++){

        weekendInputMessage.push("・"+weekendWeatherList[k][0]+"時台"+' '+weekendWeatherList[k][1]);

      }
      const formattedMessage = `\n${weekendInputMessage.join('\n')}`

      //Logger.log(formattedMessage)

      //LINEメッセージを送信
      weekendLineConnection_(formattedMessage,targetPeriod);      

    }else{
      Logger.log(`天候条件NG:週末は風が強いもしくは悪天候の可能性が高いです${weatherListWeekend}`)
    }

}




//OPEN_WEATHERから1時間毎の風速を取得し、5.0m/s以上の時間帯があればGmailで通知を行う関数
function openWeatherSNSconnection_(){

  // 現在のUNIX時間を取得
  const currentTime = Math.floor(Date.now() / 1000);  
  // スクリプトプロパティに取得したAPIキーを呼び出す
  const apiKey = PropertiesService.getScriptProperties().getProperty("OPENWEATHERAPI");

  const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${currentTime}&appid=${apiKey}`;
  const oneCallResponse = UrlFetchApp.fetch(oneCallUrl);
  const oneCallData = JSON.parse(oneCallResponse.getContentText());

  //1時間間隔の風速を取得
  const sunSetData = oneCallData['data'][0]['sunset'];

  //当日の日没時間
  const sunsetTime = new Date(sunSetData*1000);
  const sunsetHour = sunsetTime.getHours();
  const sunsetMinute = sunsetTime.getMinutes();
  const formattedSunsetTime = sunsetHour+"時"+sunsetMinute+"分"
  //Logger.log(sunsetTime)

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  tomorrow.setHours(0,0,0,0);//当日23時

  const tomorrowMillis = Math.floor(tomorrow.getTime()/1000);

  //Logger.log(tomorrowMillis)

  // 日没~翌朝8時のUNIXリストを作成
  const unixList = [];


  for (let i=sunSetData; i<=tomorrowMillis; i+=3600){
    unixList.push(i)
  }

  //Logger.log(unixList)

  // //日没～翌朝8時までの1時間ごとの時間・天気・風速データ格納用
  const futureHourlyList = [];


  for (let v=0;v < unixList.length;v++){
  // One Call APIの取得
  const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${unixList[v]}&appid=${apiKey}`;
  const oneCallResponse = UrlFetchApp.fetch(oneCallUrl);
  const oneCallData = JSON.parse(oneCallResponse.getContentText());

  //1時間間隔の風速を取得
  const windData = oneCallData['data'][0]['wind_speed'];
  const wetherData = oneCallData['data'][0].weather[0].main;

  //時間を取得
  const timeData = new Date(unixList[v]*1000).getHours();

  futureHourlyList.push([timeData,windData,wetherData]);
  }

  //Logger.log(futureHourlyList)

  return {futureHourlyList,formattedSunsetTime};
  
}

//★週末天気用

function openWeatherSNSconnectionWeekend_(){

  // スクリプトプロパティに取得したAPIキーを呼び出す
  const apiKey = PropertiesService.getScriptProperties().getProperty("OPENWEATHERAPI");

  //週末の情報取得
  const weekend = new Date();
  weekend.setDate(weekend.getDate()+3);
  weekend.setHours(12,0,0,0);//12時

  //3日後の12時のミリ秒
  const weekEndMillis = Math.floor(weekend.getTime()/1000);


  //開始時間を取得(●月●日●時)

  const startTimeMonth = new Date(weekEndMillis*1000).getMonth()+1;
  const startTimeDate = new Date(weekEndMillis*1000).getDate();
  const startTimeHour = new Date(weekEndMillis*1000).getHours();

  //22時間後のミリ秒
  const endTime = weekEndMillis+(3600*22)

  //終了時間を取得(●月●日●時)
  const endTimeMonth = new Date(endTime*1000).getMonth()+1;
  const endTimeDate = new Date(endTime*1000).getDate();
  const endTimeHour = new Date(endTime*1000).getHours();

  //期間の変数(●月●日●時~●月●日●時)

  const period = `${startTimeMonth}月${startTimeDate}日${startTimeHour}時～${endTimeMonth}月${endTimeDate}日${endTimeHour}時`

  //Logger.log(period)

  // 日没~翌朝8時のUNIXリストを作成
  const unixList = [];


  for (let i=weekEndMillis; i<endTime; i+=3600){
    unixList.push(i)
  }

  //Logger.log(unixList)

  // //日没～翌朝8時までの1時間ごとの時間・天気・風速データ格納用
  const futureHourlyList = [];


  for (let v=0;v < unixList.length;v++){
  // One Call APIの取得
  const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${unixList[v]}&appid=${apiKey}`;
  const oneCallResponse = UrlFetchApp.fetch(oneCallUrl);
  const oneCallData = JSON.parse(oneCallResponse.getContentText());

  //1時間間隔の風速を取得
  const windData = oneCallData['data'][0]['wind_speed'];
  const wetherData = oneCallData['data'][0].weather[0].main;

  //時間を取得
  const timeData = new Date(unixList[v]*1000).getHours();

  futureHourlyList.push([timeData,windData,wetherData]);
  }

  //Logger.log(futureHourlyList)

  return {futureHourlyList,period};
  
}


//LINEでメッセージを送る関数(新月)
function lineConnection_(clearSkytime,sunsetTime) {
  const lineAccessToken = PropertiesService.getScriptProperties().getProperty("LINEACCESSTOKEN");
  const lineEndpoint = 'https://api.line.me/v2/bot/message/broadcast';

  const message = {
    messages: [
      {
        type: 'text',
        text: `今日は日没から24時までの間に、晴天の時間があります。美しい星空が眺められるかもしれません。\n\nおうじまキャンプ場で夜空を楽しんでみてはいかがでしょうか。\nご予約はおうじまキャンプ場HPからできます。当日予約も可能ですよ。\nhttps://www.kume-ou-camp.com/booking\n\n【日没時間】\n${sunsetTime}\n【1時間毎の天気】${clearSkytime}`
      }
    ]
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + lineAccessToken,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(message)
  };

  UrlFetchApp.fetch(lineEndpoint, options);
}

//LINEでメッセージを送る関数(満月)
function lineConnectionMoon_(clearSkytimeMoon,sunsetTime) {
  const lineAccessTokenMoon = PropertiesService.getScriptProperties().getProperty("LINEACCESSTOKEN");
  const lineEndpointMoon = 'https://api.line.me/v2/bot/message/broadcast';

  const messageMoon = {
    messages: [
      {
        type: 'text',
        text: `今日は日没から24時までの間に、晴天の時間があります。美しい月が眺められるかもしれません。\n\nおうじまキャンプ場で夜空を楽しんでみてはいかがでしょうか。\nご予約はおうじまキャンプ場HPからできます。当日予約も可能ですよ。\nhttps://www.kume-ou-camp.com/booking\n\n【日没時間】\n${sunsetTime}\n【1時間毎の天気】${clearSkytimeMoon}`
      }
    ]
  };

  const optionsMoon = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + lineAccessTokenMoon,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(messageMoon)
  };

  UrlFetchApp.fetch(lineEndpointMoon, optionsMoon);
}

//LINEでメッセージを送る関数(週末)
function weekendLineConnection_(message,period) {
  const lineAccessTokenWeekend=PropertiesService.getScriptProperties().getProperty("LINEACCESSTOKEN");
  const lineEndpointWeekend = 'https://api.line.me/v2/bot/message/broadcast';

  const messageWeekend = {
    messages: [
      {
        type: 'text',
        text: `今週末はキャンプ日和の予報です。風は比較的穏やかで雨予報もありません。\nおうじまキャンプ場でのキャンプをぜひ楽しんでくださいね。\nご予約はおうじまキャンプ場HPからできます。\nhttps://www.kume-ou-camp.com/booking\n\n【対象期間】\n ${period}\n【天気予報】${message}`
      }
    ]
  };

  const optionsWeekend = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + lineAccessTokenWeekend,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(messageWeekend)
  };

  UrlFetchApp.fetch(lineEndpointWeekend, optionsWeekend);
}



//月の満ち欠けに関する情報取得
//新月はnewmoon
function moonAge_() {  

  // APIキー
  const apiKey = PropertiesService.getScriptProperties().getProperty("HEREAPI");

  // APIリクエストの作成
  const url = `https://weather.hereapi.com/v3/report?products=forecastAstronomy&location=${latitude},${longitude}&apiKey=${apiKey}`
  const response = UrlFetchApp.fetch(url);

  // レスポンスの取得
  const responseData = JSON.parse(response.getContentText());

  //日付情報の取得
  //Logger.log(responseData.places[0].astronomyForecasts[0].forecasts[1].time);//forecasts[i]にする 

  // 月の満ち欠け情報の表示
  const moonphase = responseData.places[0].astronomyForecasts[0].forecasts[1].moonPhaseDescription;
  //Logger.log(responseData.places[0].astronomyForecasts[0].forecasts[1].moonPhaseDescription);//forecasts[i]にする
  // const moonPhase = responseData.astronomy.astronomy[0].moonPhase;
  // Logger.log('Moon Phase: ' + moonPhase);

  return moonphase;
  //Logger.log(moonphase)
}
