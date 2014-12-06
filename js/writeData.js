/* Author: Praveen

*/
var weatherCondition = [2];
var forecast = new Object();
var weatherInfo = new Object();

//Constructors 
(function(){	
	//Weather conditions
	weatherCondition[0] = new WeatherCondition(0);
	weatherCondition[1] = new WeatherCondition(0);
	forecast = new Forecast(0);
})();

//Create all objects
//Current weather condition
function WeatherCondition(count, version, stationId, distanceM, observationTime, weather, relativeHumidity, feelsLikeF, tempF, visibilityM, precipitationI){
	this.count = count; //how many times this function has run
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

function readWundergroundData(){
	var host = "http://api.wunderground.com/api/",
		auth = "ebdd8b3230c7ee82",
		homeLoc = "33.6922,-117.8157.json",
		searchString1 = "/geolookup/conditions/q/CA/irvine.json",
		searchString2 = "/geolookup/conditions/q/",
		searchString3 = "/hourly/q/CA/irvine.json",
		str = "";
	
	//Copy the current weather data in to previous weather data
	weatherCondition[0] = JSON.parse(JSON.stringify(weatherCondition[1]));
	
	//All of the ajax commands are executed asynchrously, so they may complete in any sequence. 
	jQuery(document).ready(function() {
	  	$.ajax({
	  		url : host + auth + searchString1,
  			dataType : "jsonp",
  			async: false,
  			success : function(parsed_json) {
	  			var location = parsed_json['location']['zip'];
	  			var temp_f = parsed_json['current_observation']['temp_f'];
	  			str = str + 'Current temperature in ' + location + ' is: ' + temp_f;
//	  			alert("Output: " + str);	
  			},//success
	  		error: function(xhr){
	  	      alert('An error occured: ' + xhr.status + ' ' + xhr.statusText);
	  			str = str + 'An error occured: ' + xhr.status + ' ' + xhr.statusText;	  			
	  		}//error
	  	}); //ajax
	  	
	  	//Get the current information
	  	$.ajax({
 			url : host + auth + searchString2 + homeLoc,
  			dataType : "jsonp",
  			success : function(parsed_json) {
	  			var version = parsed_json['response']['version'];
	  			weatherCondition[1].count++;
	  			weatherCondition[1].stationId = parsed_json['current_observation']['station_id'];
	  			//Find the distance of this weather station from home
	  			for(var i in parsed_json['location']['nearby_weather_stations']['pws']['station']){ 
	  				if (parsed_json['location']['nearby_weather_stations']['pws']['station'][i]['id'] == weatherCondition[1].stationId)
	  					weatherCondition[1].distanceM = parsed_json['location']['nearby_weather_stations']['pws']['station'][i]['distance_mi'];
	  			} //for

	  			//Find other interesting information from this weather station
	  			weatherCondition[1].observationTime = parsed_json['current_observation']['observation_time_rfc822'];
	  			weatherCondition[1].weather = parsed_json['current_observation']['weather'];
	  			weatherCondition[1].relativeHumidity = parsed_json['current_observation']['relative_humidity'];
	  			weatherCondition[1].feelsLikeF = parsed_json['current_observation']['feelslike_f'];
	  			weatherCondition[1].tempF = parsed_json['current_observation']['temp_f'];
	  			weatherCondition[1].visibilityM = parsed_json['current_observation']['visibility_mi'];
	  			weatherCondition[1].precipitationI = parsed_json['current_observation']['precip_1hr_in'];
	  			str = str + '<br> version:' + version + ' station: ' + weatherCondition[1].stationId + '<br> observation time: ' + weatherCondition[1].observationTime 
	  				+ ' weather: ' + weatherCondition[1].weather + ' Temp:' + weatherCondition[1].tempF + ' relative humidity: ' + weatherCondition[1].relativeHumidity 
	  				+ ' feels like: ' + weatherCondition[1].feelsLike + ' distance: ' + weatherCondition[1].distanceM + ' visibility: ' + weatherCondition[1].visibilityM 
	  				+ ' precipitation: ' + weatherCondition[1].precipitationI + ' count:' + weatherCondition[1].count;
	  			writeWeatherCondition();

			}, //success
	  		error: function(xhr){
	  	      alert('An error occured: ' + xhr.status + ' ' + xhr.statusText);
	  			str = str + 'An error occured: ' + xhr.status + ' ' + xhr.statusText;	  			
	  		}//error

  		}); //ajax

	  	//Get the next hour forecasted information
	  	$.ajax({
 			url : host + auth + searchString3,
  			dataType : "jsonp",
  			success : function(parsed_json) {
	  			forecast.fcCondition = parsed_json['hourly_forecast']['0']['condition'];
	  			forecast.fcWx = parsed_json['hourly_forecast']['0']['wx'];
	  			forecast.fcUVI = parsed_json['hourly_forecast']['0']['uvi'];
	  			forecast.fcPrecipitationI = parsed_json['hourly_forecast']['0']['pop'];
	  			str = str + '<br>condition: ' + forecast.fcCondition + ' Wx: ' + forecast.fcWx + ' vui: ' + forecast.fcUVI 
	  				+ ' Precp: ' + forecast.fcPrecipitationI;
	  			document.getElementById("demo").innerHTML = str; 	
	  			writeForecast();
  			}, //success
	  		error: function(xhr){
	  			alert('An error occured: ' + xhr.status + ' ' + xhr.statusText);
		  		str = str + 'An error occured: ' + xhr.status + ' ' + xhr.statusText;	  			
		  	}//error
  		});//ajax
	  	
	}); //jQuery
}//readWundergroundData

function currentWeather() {
	readWundergroundData();
}

//Read stored weather data from the latest file on the server and restore it on the webpage. 
//Use GET http request to read file
function readWeatherDataFromFile(){
	var xmlhttp;

	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();}
	else{// code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");}

	//Read latest weather file from the server. The URL is /weatherFileRead. 
	//restore the read data to the html page
 	xmlhttp.onreadystatechange = function(){
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
			var weatherInfoArray = JSON.parse(xmlhttp.responseText);
			writeAllData(weatherInfoArray);
		}};
	xmlhttp.open("GET", "/weatherFileRead", true);
	xmlhttp.send();
 	
}//readWratherData

//Writes historical data to the web page
function writeAllData(weatherInfoArray){

	var str = "<table><tr><th>Count </th><th> Station</th><th> Distance</th><th> Observation time</th><th> Weather</th><th> Humidity</th><th> Feels Like</th>";
	str = str + "<th>Temp</th><th> Visivility</th><th> Precp</th><th> FCCond</th><th> FcWx</th><th> FcUVI</th><th> FcPrecp</th></tr><br>";
	for(var i = 0; i < weatherInfoArray.length; i++){
		var current = weatherInfoArray[i].current;
		var forecast = weatherInfoArray[i].forecast;
		str = str + "<tr><td>" + current.count + "</td><td>" + current.stationId + "</td><td>" + current.distanceM + "</td><td>" ;
		str = str + current.observationTime + "</td><td>" + current.weather + "</td><td>" + current.relativeHumidity + "</td><td>";
		str = str + current.feelsLikeF + "</td><td>" + current.tempF + "</td><td>" + current.visibilityM + "</td><td>" + current.precipitationI;
		str = str + "</td><td>" + forecast.fcCondition + "</td><td>" + forecast.fcWx + "</td><td>" + forecast.fcUVI + "</td><td>" + forecast.fcPrecipitationI + "</td></tr>";
	}		
	str = str + "</table>";
	document.getElementById("idAllWeather").innerHTML = str  ;
} //WriteAllData

function allWeather(){
	readWeatherDataFromFile();
}

//Write current weather data to web page
function writeWeatherCondition(){
	document.getElementById('idStationId0').value = weatherCondition[0].stationId;
	document.getElementById('idStationId1').value = weatherCondition[1].stationId;
	document.getElementById('idDistanceM0').value = weatherCondition[0].distanceM;
	document.getElementById('idDistanceM1').value = weatherCondition[1].distanceM;
	document.getElementById('idObservationTime0').value = weatherCondition[0].observationTime;
	document.getElementById('idObservationTime1').value = weatherCondition[1].observationTime;
	document.getElementById('idWeather0').value = weatherCondition[0].weather;
	document.getElementById('idWeather1').value = weatherCondition[1].weather;
	document.getElementById('idRelativeHumidity0').value = weatherCondition[0].relativeHumidity;
	document.getElementById('idRelativeHumidity1').value = weatherCondition[1].relativeHumidity;
	document.getElementById('idFeelsLikeF0').value = weatherCondition[0].feelsLikeF;
	document.getElementById('idFeelsLikeF1').value = weatherCondition[1].feelsLikeF;
	document.getElementById('idTempF0').value = weatherCondition[0].tempF;
	document.getElementById('idTempF1').value = weatherCondition[1].tempF;
	document.getElementById('idVisibilityM0').value = weatherCondition[0].visibilityM;
	document.getElementById('idVisibilityM1').value = weatherCondition[1].visibilityM;
	document.getElementById('idPrecipitationI0').value = weatherCondition[0].precipitationI;
	document.getElementById('idPrecipitationI1').value = weatherCondition[1].precipitationI;

	document.getElementById('idStationId').innerHTML = 'station is: ' + weatherCondition[1].stationId;

} //writeWeatherCondition

//Write forecast to web page
function writeForecast(){
	document.getElementById('idFcCondition').value = forecast.fcCondition;       		
	document.getElementById('idFcWx').value = forecast.fcWx;       		
	document.getElementById('idFcUVI').value = forecast.fcUVI;       		
	document.getElementById('idFcPrecipitationI').value =	forecast.fcPrecipitationI;       		
} //writeForecast