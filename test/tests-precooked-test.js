/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var util = require('util'),
    http = require('http'),
    _    = require('underscore'),
    express = require('express');

var cooked = {
    singlemock:  {
        ports: [
            {
                port: 3000,
                status: 200,
                type: "application",
                subType: "soap+xml",
                payload:
                    '<?xml version="1.0"?>' +
                    '<soap:Envelope xmlns:soap="http://www.w3.org/2001/12/soap-envelope" soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">'+
                        '<soap:Body xmlns:m="http://www.example.org/stock">'+
                        '<m:GetStockPriceResponse>' +
                        '<m:Price>34.5</m:Price>' +
                        '</m:GetStockPriceResponse>' +
                        '</soap:Body>' +
                    '</soap:Envelope>'
            }
        ],
        script: 'create table plusxml on select get from "http://localhost:3000/test"' +
                'aResponse = select * from plusxml;' +
                'return "{aResponse}";',

        udf: {
            test : function (test, err, result) {
                if (err) {
                    console.log(err.stack || util.inspect(err, false, 10));
                    test.fail('got error');
                }
                else {
//                    console.log(util.inspect(result,false,null));
                    test.equals(result.headers['content-type'], 'application/json', 'HTML expected');
                    test.ok(result.body['soap:Envelope']['soap:Body'], 'expected soap body in json resp');
                }
            }
    }
},
    realserver: {
        ports: [
           ],
        script: 'select * from ebay.finding.items where keywords = "ipad"',
        udf: {
        }
    },
    noserver:{
        ports: [
        ],
        script: 'show tables',
        udf: {
            test : function (test, err, result) {
            }
        }
    },
    multimock:{
        ports: [
            {
                port: 3000,
                status: 200,
                type: "application",
                subType: "soap+xml",
                payload:
                    '<?xml version="1.0"?>' +
                    '<soap:Envelope xmlns:soap="http://www.w3.org/2001/12/soap-envelope" soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">' +
                    '<soap:Body xmlns:m="http://www.example.org/stock">' +
                    '<m:GetStockPriceResponse>'+
                    '<m:Price>34.5</m:Price>' +
                    '</m:GetStockPriceResponse>'+
                    '</soap:Body>' +
                    '</soap:Envelope>'
            },
            {
                port: 3026,
                status: 200,
                type: "application",
                subType: "json",
                payload: '{ "itemId": "abcd", "userId": "xyz" } '
            }
        ],
        script: 'create table plusxml on select get from "http://localhost:3000/test"'+
            'create table itemjson on select get from "http://localhost:3026/test"'+
            'resp1 = select * from plusxml;'+
            'resp2 = select * from itemjson;'+
            'return {"resp1": "{resp1}", "resp2": "{resp2}"}',
        udf: {
            test : function (test, err, result) {
                if (err) {
                    console.log(err.stack || util.inspect(err, false, 10));
                    test.fail('got error');
                }
                else {
//                    console.log(util.inspect(result,false,null));
                    test.equals(result.headers['content-type'], 'application/json', 'json expected');
                    test.ok(result.body.resp1['soap:Envelope']['soap:Body'], 'expected soap body in json resp');
                    test.ok(result.body.resp2.itemId, 'expected json resp');
                }
            }
        }
    },
    errormock: {
        ports: [
            {
                port: 3000,
                status: 500,
                type: "application",
                subType: "soap+xml",
                payload:
                    '<?xml version="1.0"?>'+
                    '<soap:Fault xmlns:soap="http://www.w3.org/2001/12/soap-envelope" soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">'+
                    '<faultcode>soap:Server</faultcode>'+
                    '<faultstring>Server was unable to process request.Something bad happened</faultstring>'+
                    '<detail /> </soap:Fault>'
            }
        ],
        script: 'create table plusxml on select get from "http://localhost:3000/test";'+
                'aResponse = select * from plusxml;'+
                'return "{aResponse}";',
        udf: {
            test : function (test, err, result) {
                if (err) {
                    test.equals(err.headers['content-type'], 'application/json', 'json expected');
                    test.ok(err.body['soap:Fault']['faultcode'], 'soap fault expected');
                }
                else {
                    console.log(result.stack || util.inspect(result, false, 10));
                    test.fail('Expected error got success');
                }
            }
        }
    },
    setupteardown: {
        ports: [
        ],
        script: 'create table plusxml on select get from "http://localhost:3000/test"' +
            'aResponse = select * from plusxml;' +
            'return "{aResponse}";',
        udf: {

             setup: function (cb) {
                 var payload = '<?xml version="1.0"?>' +
                     '<soap:Envelope xmlns:soap="http://www.w3.org/2001/12/soap-envelope" soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">' +
                     '<soap:Body xmlns:m="http://www.example.org/stock">' +
                     '<m:GetStockPriceResponse>' +
                     '<m:Price>34.5</m:Price>' +
                     '</m:GetStockPriceResponse>' +
                     '</soap:Body>' +
                     '</soap:Envelope>'
                 // Start a file server
                 var server = http.createServer(function (req, res) {
                     res.writeHead(200, {
                         'Content-Type':'application/soap+xml',
                         'Content-Length':payload.length
                     });
                     res.write(payload);
                     res.end()
                 });
                 server.listen(3000, function () {
                     cb({server:server});
                 });
             },
            test : function (test, err, result, ctx) { // ctx is the one passed by setup
                if (err) {
                    console.log(err.stack || util.inspect(err, false, null));
                    test.fail('got error');
                }
                else {
                    test.equals(result.headers['content-type'], 'application/json', 'HTML expected');
                    test.ok(result.body['soap:Envelope']['soap:Body'], 'expected soap body in json resp');
                }

                test.ok(ctx && ctx.server, 'Context not passed by ql-unit in test()');
            },

             tearDown : function(cb, ctx){
             ctx.server.close();
             cb();
             }
        }
    },
    findiphone:{
        ports: [
        ],
        // Present for routes
        request: "/finditems/iphone",
        verb: "get",
        // for routes .. where headers are required
        headers: {
        },
        udf: {
            test : function (test, err, result){
                if (err) {
                    console.log(err.stack || util.inspect(err, false, 10));
                    test.fail('Expected success');
                }
                else {
                    test.ok(result.headers, 'Expected Headers');
                    test.equals(result.statusCode, 200);
                    test.ok(result.body, 'Expected Body');
                    test.ok(_.isArray(result.body), 'Expected Body to be array');
                    test.ok(result.body.length > 0, 'Expected Body to be array.length > 0');
                }
            }
        }
    },
    pingpongpost: {
        ports: [
        ],
        // Present for routes
        request: "/ping/pongxml",
        verb: "post",
        // for routes .. where headers are required
        headers: {
            "h":"12,34i",
            "h2":"abcd",
            "h3":"pqr"
        },
        type: "application",
        subType:"json",
        payload: '{ "itemId": "abcd", "userId": "xyz" } ',
        udf: {
            setup: function (cb) {

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
            },
            test : function (test, err, result){
                if (err) {
                    console.log(err.stack || util.inspect(err, false, null));
                    test.fail('got error');
                }
                else {
                    test.deepEqual(result.body, { val:{ postPayload:{ ItemID:'abcd', UserID:'xyz' } } });
                }
            },
            tearDown : function(cb, ctx){
                ctx.server.close();
                cb();
            }
        }
    }
};



module.exports = require('../lib/unit').init({
    cooked: cooked,
    tables:__dirname + '/tables',
    routes:__dirname + '/routes',
    config:__dirname + '/config/dev.json'});