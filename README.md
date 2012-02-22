![ql.io](http://ql.io/images/ql.io-large.png) 
# .... Unit Testing 
## ql-unit

A node unit based framework to test ql.io scripts and routes.

![Travis status](https://secure.travis-ci.org/ql-io/ql-unit.png)

## Installation

npm install ql-unit

## Overview
1. Create a **tests** directory which contains scripts to test, mock response (optional) and detailed node unit asserts (optional).
2. Create a js file which you intended to provide to nodeunit to run.
3. Body of this file could look like what is given below:

Let us say filename is runallTests.js


	module.exports = require('ql-unit').init({
		tests:__dirname + '/tests',
		tables:__dirname + '/tables', // <- ql.io-engine param
		routes:__dirname + '/routes', // <- ql.io-engine param
		config:__dirname + '/config/dev.json'}); // <- ql.io-engine param

This one statement provides the machinary to run 100s of tests.
 
## Example for Select with mock response

**Script to test**

File name: select-test.ql

	create table myTable
  		on select get from "http://localhost:3000/test";

	aResponse = select * from myTable;
	return "{aResponse}";

The test case name is the filename (without .ql) i.e test case name for this example will be "select-test" and the related mock files and custom asserts will need to begin with this name plus their own convention.

A point to note, though the example above uses a hardcoded endpoint, it is a good idea to get it from config (ref to ql.io doc). This way mocked endpoints can be abstracted out.

**Mock Response**

File name: select-test.3000.200.application.xml

	<?xml version="1.0"?> 
		<soap:Envelope xmlns:soap="http://www.w3.org/2001/12/soap-envelope"
    		soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">
    		<soap:Body xmlns:m="http://www.example.org/stock">
        		<m:GetStockPriceResponse>
            		<m:Price>34.5</m:Price>
        		</m:GetStockPriceResponse>
    	</soap:Body>
	</soap:Envelope>

Mock filename convention is **testcase-name.port.responseCode.responseType.responseSubType**
  
It is possible to specify more than one mock responses if the script uses multiple servers.

It is also not necessary to have mock files and in that case it is assumed that the script is going to hit services external to ql-unit.

User can also mix and match, i.e mock some services and not others.


**Custom Asserts**

File name: select-test.js

	var util = require('util');

	exports.test = function (test, err, result) {
	    	if (err) {
        		console.log(err.stack || util.inspect(err, false, 10));
        		test.fail('got error');
    		}
    		else {
        		test.equals(result.headers['content-type'], 'application/json', 'json expected');
        		test.ok(result.body['soap:Envelope']['soap:Body'], 'expected soap body in json resp');
    		}
	}

**testcase-name.js** tells ql-unit that user wants to do custom asserts on the response returned by the script being tested. To implement custom asserts the user will need to export function(**test**,**err**,**result**). 

1. **test**: Is the nodeunit object on which assert operations can be done.
2. **err**: Error object if the script returns erro.
3. **result**: Result returned by the script.


## Example for "routes" testing
 
**CSV file with routes to test**

File name: sample.routes.csv

	name,request,type,header1,header2,header3
	find-ipad,/finditems/ipad,get
	find-iphone,/finditems/iphone,get
	ping-pong-post,/ping/pongxml,post,h:1234,h2:abcd,h3:pqr

uris to exercise routes to be tested can be specified in a csv file with naming convention *irrelevantName*.**routes.csv**. 

The first line is for column headers where:

1. **name**: testcase-name
2. **request**: uri corresponding to the route exercised
3. **type**: http verb used to exercise the uri

**header1**, **header2**, etc. column headers are optional and could be provided if custom headers are to be supplied in the HTTP request for the route being tested.

If a given HTTP header contains a comma (**,**) then the user should enclose the value with quotes (**""**) in the csv file (to avoid confusion with comma used to seperated fields in the csv file ). example:

	name,request,type,header1
	ping-pong-post,/ping/pongxml,post,"Date:Tue, 15 Nov 1994 08:12:31 GMT"
	
**Request body for PUT and POST**

For **PUT** and **POST** requests user needs to specify a request file with a name that follows the convention **testcase-name.request.requestType.requestSubType**.

File name: ping-pong-post.request.application.json

	{
    	"itemId": "abcd",
    	"userId": "xyz"
	}
	
Besides the csv file containing routes and request files, user can also create mock responses and custom asserts as shown the previous example.


## Example for "setup" and "tearDown" testing

Some tests requires doing some setup and appropriate teardown. This can be achieved by creating .js file like the one created for customer assert (following that naming convention) in the first example and defining "setup" and "tearDown" functions in it. Following is an example where "setup" and "tearDown" is used to create simple echo server. 

File Name: ping-pong.post.js

	var express = require('express'),
    	util = require('util');

	exports.setup = function (cb) {
    	var server = express.createServer(function (req, res) {
        	var data = '';
        	req.on('data', function(chunk) {
            	data += chunk;
	        });
    	    req.on('end', function() {
        	    res.send(data);
	        });
    	});
	
    	server.listen(80126, function () {
        	cb({server:server});
	    });
	}
	
	exports.tearDown = function(cb, ctx){
    	ctx.server.close();
    	cb();
	}


## Example for passing custom "engine" and/or "console"

In the Overview section user options are passed to ql-unit's .init() which it internally uses to create ql.io-engine and ql.io-console instances. Sometimes users would want to provide their own engine and console instance (e.g. for tests inside ql.io-engine and ql.io-console packages). Here are some example for that.

File Name: passEngine.js

	var Engine = require('../lib/engine'); // Because I am part of ql.io-engine project
	    
	var opts = {
    	tables:__dirname + '/tables',
        routes:__dirname + '/routes',
        config:__dirname + '/config/dev.json'
    };

	module.exports = require('../lib/unit').init({
    	engine:new Engine(opts),
    	tables:__dirname + '/tables',
    	routes:__dirname + '/routes',
    	config:__dirname + '/config/dev.json',
    	tests:__dirname + '/tests/'});

File Name: passConsole.js

	var Console = require('../app.js'); // Because I am part of ql.io-console project
	    
	var opts = {
    	tables:__dirname + '/tables',
        routes:__dirname + '/routes',
        config:__dirname + '/config/dev.json',
        'enable console': false,
        connection: 'close'
    };

	module.exports = require('../lib/unit').init({
    	console:new console(opts),
    	tables:__dirname + '/tables',
    	routes:__dirname + '/routes',
    	config:__dirname + '/config/dev.json',
    	tests:__dirname + '/tests/'});