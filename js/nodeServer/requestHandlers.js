/**
 * @author Praveen
 * Server side file. Has all the http and node request and responses. The code files are stored in InvestmentProperty under the install dir. 
 * The property files are stored in PropertyDatabase in the install directory. The server is located at InvestmentProperty/js/nodeServer.
 * The server is launched from InvestmentProperty, so this is the home directory and all path names are relative to this directory.
 */
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;
var url = require("url");
var querystring = require("querystring");
var os = require("os"); 
var fs = require("fs");
var winWeatherDatabase = ".\\WeatherDatabase\\";
var linuxWeatherDatabase = "./WeatherDatabase/";

/*
function file(response){
	var fileArray;

	console.log("Request handler 'file' was called.");
	console.log("OS type:" + os.type());
	console.log("OS platoform:" + os.platform());
	if (os.platform() === "win32"){	
		exec("dir " + winPropertyDatabase + " /a-d /b /on", function (error, stdout, stderr) {
  		    console.log("cmd:" + "dir " + winPropertyDatabase + " /a-d /b /on" );
		    console.log("stdout:" + stdout);
	    	//Create an array of the files in the database
	    	fileArray = stdout.toString().split("\n");
	    	console.log("File Array:");
			for(var i = 0; i < fileArray.length; i++)
				console.log(fileArray[i]);
			var body = '<select id = "optionList">';
			for(var i = 0; i < fileArray.length - 1; i++)
				body = body + '<option value="' + fileArray[i] + '">' + fileArray[i] + '</option> ' ;
			body = body + '</select>' + 
			'<button onclick="readPropertyData(document.getElementById(\'optionList\').value)"> Submit </button> ';
			
			response.writeHead(200, {"Content-Type": "text/text"});
			response.write(body);
			response.end();
		    if (error !== null) {
		        console.log('exec error: ' + error);
		    };		    
		});
	}//win32

	if (os.platform() === "linux"){	
	    var ls = spawn('ls', [linuxPropertyDatabase]);
		    ls.stdout.on('data', function (data) {
		    	console.log('stdout: ' + data);
		    	//Create an array of the files in the database
		    	fileArray = data.toString().split("\n");
		    	console.log("File Array:");
				for(var i = 0; i < fileArray.length; i++)
					console.log(fileArray[i]);
				var body = '<select id = "optionList">';
				for(var i = 0; i < fileArray.length - 1; i++)
					body = body + '<option value="' + fileArray[i] + '">' + fileArray[i] + '</option> ' ;
				body = body + '</select>' + 
				'<button onclick="readPropertyData(document.getElementById(\'optionList\').value)"> Submit </button> ';
				
				response.writeHead(200, {"Content-Type": "text/text"});
				response.write(body);
				response.end();
		    });

		    ls.stderr.on('data', function (data) {
		      console.log('stderr: ' + data);
		    });

		    ls.on('close', function (code) {
		      console.log('child process exited with code ' + code);
		    });
	} //linux
} //function file
*/

//Loads the index file on the browser
function fileCreate(response){
	var code = "";

	//Need to fix these fixed paths....
	if (os.platform() === "win32")
		code = ".\\index.html";
	else if (os.platform() === "linux")
		code = "./index.html";
	else
		console.log("Error: unsupported OS");
	
	console.log("Request handler 'fileCreate' was called.");
	fs.readFile(code, function(err, data){
		if (err) throw err;
		console.log('Sending file:' + code);
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(data);
		response.end();
	});
} //fileCreate

/*
function propertyFileWrite(response, postData){
var query = querystring.parse(postData);
	
	console.log("Request handler 'propertyFileWrite' was called.");	
	for(var x in query){
		console.log("key:" + x + " value:" + query[x]);
		if(x === "data")
			var data = query[x];
	}
	//set property database based on the OS
	if (os.platform() === "win32")
		var propertyDatabase = winPropertyDatabase;
	else if (os.platform() === "linux")
		var propertyDatabase = linuxPropertyDatabase;
	else
		console.log("Error: unsupported OS");

	fs.writeFile(propertyDatabase + query.fileName, data, function(err){
		if (err) throw err;
		console.log('successfully saved file: ' + query.fileName);
		response.writeHead(200, {"Content-Type": "text/plain"});
		response.write('successfully saved file: ' + query.fileName);
		response.end();
	});		

} //propertyFileWrite
*/

//read latest weather file, either the last reading or the full file
function weatherFileRead(response, postData, urlString){
	var weatherDatabase = '';
	
	console.log("Request handler 'weatherFileRead' was called.");
	
	//set weather database based on the OS
	if (os.platform() === "win32")
		weatherDatabase = winWeatherDatabase;
	else if (os.platform() === "linux")
		weatherDatabase = linuxWeatherDatabase;
	else
		console.log("Error: unsupported OS");
	
	//Find the most recent file name, do a numeric sort
	var fileList = fs.readdirSync(weatherDatabase);
//	console.log(fileList.sort(function(a, b){return (b - a);}));

	fs.readFile(weatherDatabase + (fileList.sort(function(a, b){return (b - a);}))[0], function(err, data){
		if (err) throw err;
//		console.log('successfully read file: ' + (fileList.sort())[fileList.length - 1]);
		response.writeHead(200, {"Content-Type": "text/plain"});
		response.write(data);
		response.end();
	});	
	
} //weatherFileRead


//exports.file = file;
exports.fileCreate = fileCreate;
//exports.propertyFileWrite = propertyFileWrite;
exports.weatherFileRead = weatherFileRead;
