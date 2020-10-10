require('dotenv').config();
// const Twit = require('twit');
const axios = require('axios');
const get = require('lodash/get');

// -------------------------------------------------------------------------- //

const {
  WAQI_TOKEN,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
} = process.env;

// var twitter = new Twit({
//   consumer_key: TWITTER_CONSUMER_KEY,
//   consumer_secret: TWITTER_CONSUMER_SECRET,
//   access_token: TWITTER_ACCESS_TOKEN,
//   access_token_secret: TWITTER_ACCESS_TOKEN_SECRET
// });

const CITY_LIST = {
  // LACY: '46.991758,-122.914258,47.060129,-122.773180',
  SEATTLE: '47.521442,-122.429265,47.658356,-122.254204',
  SPOKANE: '47.605725,-117.495884,47.725771,-117.144242',
  TACOMA: '47.3174508,-122.5433275,47.1709149,-122.3700139',
  VANCOUVER: '45.618239,-122.689200,45.711620,-122.554300',
  YAKIMA: '46.351579,-120.899061,46.742791,-120.238636',
};

const QUERIES = { // only one query for now. expandable
  REGION:`https://api.waqi.info/map/bounds/?token=${WAQI_TOKEN}&latlng=`,
};

// 

// -------------------------------------------------------------------------- //

function sentenceCase(str) {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function explanationLookup(aqi) {
  if (aqi <= 50) return '(🟢 Good)';
  else if (aqi <=100) return '(🟡 Moderate)';
  else if (aqi <= 150) return '(🟠 Sensitive Unhealthy)';
  else if (aqi <= 200) return '(🔴 Unhealthy)';
  else if (aqi <= 300) return '(🟣 Very Unhealthy)';
  else return '(⛔️ Hazardous)';
}

async function ajaxGet(url) {
  let response = null;
  let data = null;

  try {
    response = await axios.get(url);
    data = get(response, 'data', null);
  } catch (e) {
    data = null;
  }

  return data;
}

async function getAvgAqiOfRegion(coordinateRange) {
  const apiResult = await ajaxGet(`${QUERIES.REGION}${coordinateRange}`);
  if (!apiResult) return null;

  // take list of stations and average them together
  const stations = get(apiResult, 'data', []);
  const aqiSum = stations.reduce((accumulator, currentValue) => (
    accumulator + parseInt(get(currentValue, 'aqi', '0'))
  ), 0);
  const aqiAvg = (aqiSum / stations.length).toFixed();

  return aqiAvg;
}

async function main() {
  let tweetTextBody = 'AQI PM2.5 Morning Report\n\n';
  const footer = '\nBell Icon to get notifications\n#Washington #AirQuality #aqi #wawx';

  for (let cityName in CITY_LIST) {
    const cityCoordinateRange = CITY_LIST[cityName];
    const aqi = await getAvgAqiOfRegion(cityCoordinateRange);
    const textLine = `${sentenceCase(cityName)}: ${aqi} ${explanationLookup(aqi)}\n`;
    
    // only add city if there is enough space in the tweet.
    if (aqi && tweetTextBody.length + textLine.length <= 280) {
      tweetTextBody += textLine;
    }
  }

  if (tweetTextBody.length + footer.length <=280) tweetTextBody += footer;

  console.log(tweetTextBody);
}

// -------------------------------------------------------------------------- //

(async () => {
  main();
  // const res = await getAvgAqiOfRegion(CITY_LIST.TACOMA);
  // console.log(res);
})();