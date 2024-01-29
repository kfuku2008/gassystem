// 調べたい地域の緯度(latitude)・経度(longitude)を指定⇒GoogleMapを開き、地域を入力し、URL内@緯度,経度を取得する

//任意設定可能
//==========================
//緯度(latitude)をここに入力
const latitude = 36.0720605;
//経度(longitude)をここに入力
const longitude = 137.6779845;
//風速の設定（デフォルトで3.0m/s）
const windSpeed = 3.0
//==========================

//スクリプトプロパティ対象変数
//==========================
const openweatherapi = PropertiesService.getScriptProperties().getProperty('OPENWEATHERAPI');
const lineAccessToken = PropertiesService.getScriptProperties().getProperty('LINEACCESSTOKEN');
const hereapi = PropertiesService.getScriptProperties().getProperty('HEREAPI')
//==========================

//ここにトリガー対象関数を記載
function actFunction(){
  const moonPhase = moonAge_();
  Logger.log(moonPhase)

  //仮で確認したい場合は『||moonPhase ==="出力された月齢情報"』を入れる
  if(moonPhase === "new moon"||moonPhase ==="waning crescent"){

    //日没+1時間~翌8時の間で雨がないかつ風速3m以下
    const weatherList = openWeatherSNSconnection_();

    let sendFlag = false;

    for(let i=0; i<weatherList.length;i++){
      if(weatherList[i][1]<=windSpeed && weatherList[i][2] !== 'Rain'){
        sendFlag = true;

      }else{
        sendFlag = false;
        break;
      }

    Logger.log(sendFlag)

    }
    if(sendFlag){
      Logger.log('天候条件OK')
      //快晴の時間を取得
      const clearskyList = []

      for(let j=0;j<weatherList.length;j++){
        if(weatherList[j][2]==='Clear' && weatherList[j][0]>=15 && weatherList[j][0]<=24){
          clearskyList.push(weatherList[j][0])
        }        
      }
      //快晴の時間があるときのみLINEを送信

      if(clearskyList.length !==0){

        let inputMessage = []

        //取得した時間をメッセージ用にフォーマット化
        for(let k=0;k<clearskyList.length;k++){

          inputMessage.push("・"+clearskyList[k]+"時台");

        }
        const clearskyMessage = `\n${inputMessage.join('\n')}`

        //Logger.log(clearskyMessage)

        //LINEメッセージを送信
        lineConnection_(clearskyMessage);        
      }else{

        Logger.log('快晴の時間なし')
      }      
    }else{
      Logger.log('天候条件NG')
    }
  }else{
    Logger.log('LINE送信なし')
  }
}


//(★トリガー設定必要)OPEN_WEATHERから1時間毎の風速を取得し、7.0m/s以上の時間帯があればGmailで通知を行う関数
function openWeatherSNSconnection_(){

  // 現在のUNIX時間を取得
  const currentTime = Math.floor(Date.now() / 1000);  
  // スクリプトプロパティに取得したAPIキーを呼び出す
  const apiKey = openweatherapi;

  const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${currentTime}&appid=${apiKey}`;
  const oneCallResponse = UrlFetchApp.fetch(oneCallUrl);
  const oneCallData = JSON.parse(oneCallResponse.getContentText());

  //1時間間隔の風速を取得
  const sunSetData = oneCallData['data'][0]['sunset'];

  //当日の日没時間
  //const sunsetTime = new Date(sunSetData*1000);
  //Logger.log(sunsetTime)

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  tomorrow.setHours(8,0,0,0);//翌朝8時

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

  //風速データを確認(現在～24時間後(1時間おき)で1タイミングでも7.0m/sを超えていたらメールを送付)
  futureHourlyList.push([timeData,windData,wetherData]);
  }

  Logger.log(futureHourlyList)

  return futureHourlyList;
  
}

//LINEでメッセージを送る関数
function lineConnection_(clearSkytime) {

  const lineEndpoint = 'https://api.line.me/v2/bot/message/broadcast';

  var message = {
    messages: [
      {
        type: 'text',
        text: `星空予報\n本日は、日が沈み夜が訪れてから24時までの間に快晴の時間があります。満天の星が楽しめ、風も穏やかで、素敵なキャンプができるでしょう\n【快晴の時間帯】${clearSkytime}`
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


//月の満ち欠けに関する情報取得
//新月はnewmoon
function moonAge_() {  

  // APIキー
  const apiKey = hereapi;

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
