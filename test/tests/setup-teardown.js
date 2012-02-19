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
var http = require('http'),
    fs = require('fs'),
    util = require('util');

exports.setup = function (cb) {
    // Start a file server
    var server = http.createServer(function (req, res) {
        var file = __dirname + '/setup-teardown.response';
        var stat = fs.statSync(file);
        res.writeHead(200, {
            'Content-Type':'application/soap+xml',
            'Content-Length':stat.size
        });
        var readStream = fs.createReadStream(file);
        util.pump(readStream, res, function (e) {
            if (e) {
                console.log(e.stack || e);
            }
            res.end();
        });
    });

    server.listen(3000, function () {
        cb({server:server});
    });
}

exports.test = function (test, err, result, ctx) {
    if (err) {
        console.log(err.stack || util.inspect(err, false, null));
        test.fail('got error');
    }
    else {
        test.equals(result.headers['content-type'], 'application/json', 'HTML expected');
        test.ok(result.body['soap:Envelope']['soap:Body'], 'expected soap body in json resp');
    }

    test.ok(ctx && ctx.server, 'Context not passed by ql-unit in test()');
}

exports.tearDown = function(cb, ctx){
   ctx.server.close();
   cb();
}
