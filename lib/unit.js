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
var fs = require("fs"),
    _ = require("underscore"),
    Engine = require("ql.io-engine"),
    util = require('util'),
    http = require('http');


exports.init = function (opt) {

    // int the engine
    var engine = new Engine(opt);

    // get the tests directory
    var testDir = (opt || {}).tests || __dirname;
    testDir = testDir.charAt(testDir.length - 1) == '/' ? testDir : testDir + '/';

    var files = {}
    try {
        files = fs.readdirSync(testDir);
    }
    catch (e) {
        return {initFailed:function (test) {
            test.ok(false, 'Got exception '
                + util.inspect(e, false, null) + ' while reading test directory: ' + testDir);
            test.done();
        }}
    }

    var meta = {};
    // go through all files in the directory (only one level deep)
    _.each(files, function (file) {
        var fileName = testDir + file;
        var stats = fs.statSync(fileName);
        if (stats.isFile()) {
            if (/\.ql$/.test(file)) { // if ends with .ql
                var script = fs.readFileSync(fileName, 'utf8');
                var justName = file.substr(0, file.lastIndexOf('.'));
                meta[justName] = meta[justName] || {ports:[]};
                meta[justName].script = script;
            }
            else if (/[^.]+\.[0-9]+\.[0-9]+\.[^.]+\.[^.]+/.test(file)) {
                var fragments = file.split('.');
                var payload = fs.readFileSync(fileName, 'utf8');
                var justName = fragments[0];
                meta[justName] = meta[justName] || {ports:[]};
                meta[justName]['ports'].push({
                    port:parseInt(fragments[1]),
                    status:parseInt(fragments[2]),
                    type:fragments[3],
                    subType:fragments[4],
                    payload:payload});
            }
            if (/\.js$/.test(file)) { // if ends with .js
                var justName = file.substr(0, file.lastIndexOf('.'));
                meta[justName] = meta[justName] || {ports:[]};
                meta[justName].test = fileName;
            }
        }
    });

    var tests = {};
    _.each(meta, function (aMeta, name) {
        if (!aMeta.script) {
            return;
        }

        tests[name] = function (test) {
            createCBForServer(test, 0, function () {
            });
        }

        function createCBForServer(test, num, cb) {
            if (num >= aMeta.ports.length) {
                engine.exec(aMeta.script, function (err, result) {
                    if (aMeta.test) {
                        try {
                            var tester = require(aMeta.test);
                            tester.test(test, err, result);
                        }
                        catch (e) {
                            test.ok(false, 'Got Exception in tester: ' + util.inspect(e, false, null));
                        }
                    }
                    else if (err) {
                        test.ok(false, 'Got Script Run Exception: ' + util.inspect(err, false, null));
                    }
                    test.done();
                    cb();
                });
            }
            else if (num > -1) {
                var server = http.createServer(function (req, res) {
                    req.on('end', function () {
                        res.writeHead(aMeta.ports[num].status, {
                            'Content-Type':aMeta.ports[num].type + '/' + aMeta.ports[num].subType,
                            'Content-Length':aMeta.ports[num].payload.length
                        });
                        res.write(aMeta.ports[num].payload);
                        res.end();
                    });
                });

                server.listen(aMeta.ports[num].port, function () {
                    createCBForServer(test, num + 1, function () {
                        server.close();
                        cb();
                    });
                })
            }
        }
    });

    return tests;
};