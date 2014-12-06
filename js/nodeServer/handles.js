/**
 * @author Praveen
 */
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");
var writeWeatherData = require("./readData");
var handle = {};

//handle["/file"] = requestHandlers.file;
handle["/fileCreate"] = requestHandlers.fileCreate;
//handle["/propertyFileWrite"] = requestHandlers.propertyFileWrite;
handle["/weatherFileRead"] = requestHandlers.weatherFileRead;

//Start collecting weather information and wait for a connection to be made to retreive information 
server.startServer(router.route, handle);
writeWeatherData.writeWeatherDataToFile();

