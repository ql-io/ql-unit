## ql-unit

A node unit based framework to test ql.io scripts. 

## Overview
1. Create a **tests** directory which contains scripts to test, mock response (optional) and detailed node unit asserts (optional).
2. Create a js file which you intended provide to nodeunit to run.
3. Body of this files could look like the following:

	module.exports = require('../lib/unit').init({
		tests:__dirname + '/tests',
		tables:__dirname + '/tables',            // <-- input for ql.io-engine
		config:__dirname + '/config/dev.json'}); // <-- input for ql.io-engine

 
#### Example Select with mock response

**Script to test**

File name: select-test.ql

	create table myTable
  		on select get from "http://localhost:3000/test";

	aResponse = select * from myTable;
	return "{aResponse}";

The test case name is the filename (without .ql) i.e test case name for this example will be "select-test" and the related mock files and custom asserts will

Though the example above uses a hardcoded endpoint, it is a good idea to get it from config (ref to ql.io doc). This way mocked endpoints can be abstracted out.

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
  
This provides a framework to test ql.io scripts and routes.

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

**testcase-name.js** tells ql-unit that user wants to do custom asserts on the response returned by the scripts. To implement custom asserts the user will need to export a function(**test**,**err**,**result**). 

1. **test**: Is the nodeunit object on which assert operations can be done.
2. **err**: Error object if the script returns erro.
3. **result**: Result returned by the script.





