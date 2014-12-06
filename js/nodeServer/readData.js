/* Author: Praveen

*/
var request = require('request');
var http = require("http");
var os = require("os"); 
var fs = require("fs");

//Globals
var weatherCondition  = new Object();
var forecast = new Object();
var weatherInfo = new Object();
var weatherInfoArray = [];  //array to store the weather information
var winWeatherDatabase = ".\\WeatherDatabase\\";
var linuxWeatherDatabase = "./WeatherDatabase/";

//Constructors 
(function(){	
	//Weather conditions
	weatherCondition = new WeatherCondition(0);
	forecast = new Forecast(0);
	weatherInfo.current = weatherCondition;
	weatherInfo.forecast = forecast;
})();

//Create all objects
//Current weather condition
function WeatherCondition(count, version, stationId, distanceM, observationTime, weather, relativeHumidity, feelsLikeF, tempF, visibilityM, precipitationI){
	this.count = count; //how many times this function 	has run
	this.version = version;  //string
	this.stationId = stationId; //string
	this.distanceM = distanceM; //number
	this.observationTime = observationTime;  //string
	this.weather = weather;  //string
	this.relativeHumidity = relativeHumidity;  //string
	this.feelsLikeF = feelsLikeF; //string
	this.tempF = tempF; //number
	this.visibilityM = visibilityM;
	this.precipitationI = precipitationI;
} //WeatherCondition

//Next hour forecast weather condition
function Forecast(count, hourlyCondition, hourlyWx, hourlyUVI, hourlyPrecipitationI){
	this.count = count;
	this.fcCondition = hourlyCondition;
	this.fcWx = hourlyWx;
	this.fcUVI = hourlyUVI;
	this.fcPrecipitationI = hourlyPrecipitationI;
} //WeatherCondition

//Asynchronous semaphore
function asem(fireFunc,initLock){
	if(initLock)
    	this.lock=initLock;
    else
    	this.lock=0;
	this.func = fireFunc;
} //asem

asem.prototype.take = function(){
	this.lock++;
}; //prototype.take

// Normal operation, write when all semaphores are given
asem.prototype.give = function(){
	this.lock--;
	if(this.lock==0 && this.func)
		this.func();
}; //prototype.give

//Error condition when one or more data is not read. Set lock to 0. 
//This will prevent any data to be written as a successful read will make lock a negative number 
asem.prototype.error = function(){
	this.lock = 0;
}; //prototype.err


//Read the data from wunderground site by making multiple http get calls and then save this data to the filename.
//The data is read for the GPS location given by homeLoc
//The right way to read this information was to build the weatherInfoArray in the calling function or as a global array.
//Append a new weatherInfo object every time new inforamtion needs to be read and store it with appropriate index.
//Regactor the code in the future. There is too much coupling between this and the calling function.
function writeWundergroundData(fileName, homeLoc, index){
	var host = "http://api.wunderground.com/api/",
		auth = "ebdd8b3230c7ee82",
		searchString1 = "/geolookup/conditions/q/CA/irvine.json",
		searchString2 = "/geolookup/conditions/q/",
		searchString3 = "/hourly/q/CA/irvine.json";
	var commaStr;
	
	//function to write the collected data to file. This file is created every time new information is received
	//I could not find a way to update the array by appending to the file. So, every time new information is created, read the existing file
	//and append the new information to it by doing some string processing
	writeFile = function(){
		var previousFile = fs.readFileSync(fileName, {encoding:'utf8'});
		//A comma is needed between two weatherInfo objects
		if (index == 0)
			commaStr = '';
		else
			commaStr =',';
		//Remove the ']' char from the previous file, add comma if needed and append the new weatherInfo object
		fs.writeFile(fileName, previousFile.slice(0, previousFile.length -1) + commaStr + JSON.stringify(weatherInfo) + ']', function(err){
		if (err) throw err;
//		console.log('successfully saved file: ' + fileName);
		});
	};	
	
	var lockReads = new asem(writeFile, 2);  //create semaphore expecting 2 read inputs
	//All of the ajax commands are executed asynch, so they may complete in any sequence. Do not assume any sequence for their completion	
	http.get(host + auth + searchString1, function(res){
		  var resData = '';  
		  //collect all the chunks of the response data
		  res.on("data", function(chunk) {
			  resData += chunk;
			  });
		  //When all the response chunks are collected, extract the relevant information
		  res.on('end', function() {
				var location = JSON.parse(resData)['location']['zip'];
	  			var temp_f = JSON.parse(resData)['current_observation']['temp_f'];
	  			var str = 'Current temperature in ' + location + ' is: ' + temp_f;
	  			console.log(str);
			  });
	}).on('error', function(e) {
		console.log("Got error from Irvine consitions", e.message);
	});	

	//Get the weather information from the closest weather station to home
  	http.get(host + auth + searchString2 + homeLoc, function(res){
		var resData = '';
		//collect all the chunks of the response data
		res.on("data", function(chunk) {
			resData += chunk;
			});
		//When all the response chunks are collected, extract the relevant information
		res.on('end', function() {
			var version = JSON.parse(resData)['response']['version'];
			weatherCondition.count++;
	  		weatherCondition.stationId = JSON.parse(resData)['current_observation']['station_id'];
	  		//Find the distance of this weather station from home
	  		for(var i in JSON.parse(resData)['location']['nearby_weather_stations']['pws']['station']){ 
	  			if (JSON.parse(resData)['location']['nearby_weather_stations']['pws']['station'][i]['id'] == weatherCondition.stationId)
	  				weatherCondition.distanceM = JSON.parse(resData)['location']['nearby_weather_stations']['pws']['station'][i]['distance_mi'];
	  		} //for

	  		//Find other interesting information from this weather station
  			weatherCondition.observationTime = JSON.parse(resData)['current_observation']['observation_time_rfc822'];
  			weatherCondition.weather = JSON.parse(resData)['current_observation']['weather'];
  			weatherCondition.relativeHumidity = JSON.parse(resData)['current_observation']['relative_humidity'];
  			weatherCondition.feelsLikeF = JSON.parse(resData)['current_observation']['feelslike_f'];
  			weatherCondition.tempF = JSON.parse(resData)['current_observation']['temp_f'];
  			weatherCondition.visibilityM = JSON.parse(resData)['current_observation']['visibility_mi'];
  			weatherCondition.precipitationI = JSON.parse(resData)['current_observation']['precip_1hr_in'];
  			var str =  'Current Weather count:' + weatherCondition.count + ' version:' + version + ' station: ' + weatherCondition.stationId + ' observation time: ' + weatherCondition.observationTime 
  				+ ' weather: ' + weatherCondition.weather + ' Temp:' + weatherCondition.tempF + ' relative humidity: ' + weatherCondition.relativeHumidity 
  				+ ' feels like: ' + weatherCondition.feelsLikeF + ' distance: ' + weatherCondition.distanceM + ' visibility: ' + weatherCondition.visibilityM 
  				+ ' precipitation: ' + weatherCondition.precipitationI;
 // 			console.log(str);			
  			lockReads.give();
		});
  		}).on('error', function(e) {
  			console.log("Got error from weather at home location: " + e.message);
  			lockReads.error();
  	});//http.get	
  	
  	//Use request module to make the same http request. This is just another way to make this http get call
	request(host + auth + searchString3, function(error, response, body){
		if (error != null){
			console.log('err:' + error);
			lockReads.error();
		}
		//Extract the relevant information if there is no error
		else {
			forecast.count++;
			forecast.fcCondition = JSON.parse(body)['hourly_forecast']['0']['condition'];
			forecast.fcWx = JSON.parse(body)['hourly_forecast']['0']['wx'];
			forecast.fcUVI = JSON.parse(body)['hourly_forecast']['0']['uvi'];
			forecast.fcPrecipitationI = JSON.parse(body)['hourly_forecast']['0']['pop'];
			var str = 'Forecast weather condition: ' + forecast.fcCondition + ' Wx: ' + forecast.fcWx + ' vui: ' + forecast.fcUVI 
					+ ' Precp: ' + forecast.fcPrecipitationI;
//			console.log(str);
			lockReads.give();
		} //else
	});//request
}//readWundergroundData

//Calls the weather APIs to read information of interest. Creates a new file if the current one is more than 'day' CLI old.
//The default value is 100 days. This is needed to minimize storage as the weather information will be collected for ever.
//This can be changed by CLI argument day=<integer> which is number of days.
function findFileName(dateFileCreated, fileName){
	var todayDate = new Date();
	var fileLength = 100; //default length in days to store weather information
	
	//Check if CLI freq and day exists. Need more error checking!!
	process.argv.forEach(function(val, index, array) {
		  if (val.search('day=') == 0)
			  fileLength = val.slice(val.search('=') + 1); 
	});
	
	//If date today is more than fileLenght number of days from dateFileCreated, create new file and store weather data in it.
	//Tried to have a date based filename that is easy to read but finding the most recent file bacame complicated. So, using filename based on
	//UTC time which makes this comparison easier. Now the filename is the same as dateFileCreated. Keeping them both for future.
	if (todayDate - dateFileCreated > (fileLength * 24 * 3600 * 1000)){
		fileName = todayDate.getTime();
		dateFileCreated = todayDate.getTime();
		console.log('file name: ' + fileName);
	} //if
	
	return (fileName);
}//findFileName

//Calls the weather APIs to read information of interest. This function runs every 900 sec by default. 
//This can be changed by CLI argument freq=<integer> which is duration in sec.
//homeLoc is GPS coordinates where the weather data is read. The CLI arguments are homeLoc=<number>,<number>
function writeWeatherDataToFile(){
	var timeout = 900000; //default timeout value in ms
	var homeLoc = "33.6922,-117.8157.json";	//default home location
	var dateFileCreated = new Date("January 1, 1970 00:00:00"); //initial file creation date
	var fileName = ""; //Initial filename, will be updated when run the first time
	var weatherDatabase = ""; //weather database location
	
	//Check if CLI freq and homeLoc exists. Need more error checking!!
	process.argv.forEach(function(val, index, array) {
		  console.log(index + ': ' + val);
		  if (val.search('freq=') == 0)
			  timeout = val.slice(val.search('=') + 1)*1000; 
		  if (val.search('homeLoc=') == 0)
			  homeLoc = val.slice(val.search('=') + 1) + '.json'; 
	});

	//set weather database based on the OS
	if (os.platform() === "win32")
		weatherDatabase = winWeatherDatabase;
	else if (os.platform() === "linux")
		weatherDatabase = linuxWeatherDatabase;
	else
		console.log("Error: unsupported OS");

	fileName = findFileName(dateFileCreated, fileName);
	
	//read the weather information at startup. Store the inforamtion in a file. 
	fs.writeFile(weatherDatabase + fileName, '[ ', function(err){
		if (err) throw err;
		console.log('successfully saved file: ' + fileName);
		});
	var index = 0;
	writeWundergroundData(weatherDatabase + fileName, homeLoc, index++);
	
	//After reading the file for the first time, read it at a frequency given by timeout
	setInterval(function(){
		writeWundergroundData(weatherDatabase + fileName, homeLoc, index++);}, timeout);

}//writeWeatherDataToFile

exports.writeWeatherDataToFile = writeWeatherDataToFile;
	