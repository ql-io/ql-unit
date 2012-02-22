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
"use strict";

var fs = require("fs"),
    _ = require("underscore"),
    Console = require('ql.io-console'),
    util = require('util'),
    http = require('http'),
    csv = require(__dirname + '/csv');


exports.init = function (opt) {

    // init the engine
    var engine = (opt || {}).engine || new (require("ql.io-engine"))(opt);

    // init the console
    var c = (opt || {}).console || new Console(_.extend(opt, {'enable console':false, connection:'close'}));

    var port = (opt || {}).port || 8080;

    // get the tests directory
    var testDir = (opt || {}).tests || __dirname;
    testDir = testDir.charAt(testDir.length - 1) == '/' ? testDir : testDir + '/';

    var files = {};
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
                meta[justName] = meta[justName] || {ports:[], headers:{}};
                meta[justName].script = script;
            }
            else if (/[^.]+\.[0-9]+\.[0-9]+\.[^.]+\.[^.]+/.test(file)) {
                var fragments = file.split('.');
                var payload = fs.readFileSync(fileName, 'utf8');
                var justName = fragments[0];
                meta[justName] = meta[justName] || {ports:[], headers:{}};
                meta[justName]['ports'].push({
                    port:parseInt(fragments[1]),
                    status:parseInt(fragments[2]),
                    type:fragments[3],
                    subType:fragments[4],
                    payload:payload});
            }
            else if (/\.js$/.test(file)) { // if ends with .js
                var justName = file.substr(0, file.lastIndexOf('.'));
                meta[justName] = meta[justName] || {ports:[], headers:{}};
                meta[justName].test = fileName;
            }
            else if (/\.routes\.csv$/.test(file)) { // ends with .routes.csv
                var csvData = fs.readFileSync(fileName, 'utf8');
                _.each(csv.csvToRecords(csvData), function (line) {
                    var name = line.name;
                    var request = line.request;
                    var type = (line.type || '').trim().toUpperCase();
                    if (name && request && /GET|POST|PUT|DELETE/.test(type)) {
                        meta[name] = meta[name] || {ports:[], headers:{}};
                        meta[name].request = request;
                        meta[name].verb = type;
                        _(line).chain()
                            .keys()
                            .filter(function (key) {
                                return !/name|request|type/.test(key);
                            })
                            .each(function (header) {
                                var composite = decodeURIComponent(line[header] || '');
                                var pos = composite.indexOf(":");
                                if (pos > 0) {
                                    meta[name].headers[composite.substring(0, pos)]
                                        = pos + 1 < composite.length ? composite.substring(pos + 1) : '';
                                }
                            });
                    }
                    return line;
                });
            }
            else if (/[^.]+\.request\.[^.]+\.[^.]+/.test(file)) {
                var fragments = file.split('.');
                var payload = fs.readFileSync(fileName, 'utf8');
                var justName = fragments[0];
                meta[justName] = meta[justName] || {ports:[], headers:{}};
                meta[justName].type = fragments[2];
                meta[justName].subType = fragments[3];
                meta[justName].payload = payload;
            }
        }
    });

    var tests = {};
    _.each(meta, function (aMeta, name) {
        if (!aMeta.script && !aMeta.request) {
            return;
        }

        tests[name] = function (test) {
            createCBForServer(test, 0, function () {
            });
        }

        function createCBForServer(test, num, cb) {
            if (num >= aMeta.ports.length) {
                var tester = aMeta.test ? (require(aMeta.test) || {}) : {};
                tester.setup = tester.setup ||
                    function (cb) {
                        cb();
                    };
                tester.test = tester.test ||
                    function (test, err, result) {
                        if (err) {
                            test.ok(false, 'Got Script Run Exception: ' + util.inspect(err, false, null));
                        }
                    };
                tester.tearDown = tester.tearDown || function (cb) {
                    cb();
                };

                tester.setup(function (ctx) {
                    if (aMeta.script) {
                        engine.exec(aMeta.script, function (err, result) {
                            try {
                                tester.test(test, err, result, ctx);
                            }
                            catch (e) {
                                test.ok(false, 'Got Exception in tester: ' + util.inspect(e, false, null));
                            }
                            tester.tearDown(function () {
                                test.done();
                                cb();
                            }, ctx);
                        });
                    }
                    else if (aMeta.request) {
                        c.app.listen(port, function () {
                            var options = {
                                host:'localhost',
                                port:port,
                                path:aMeta.request,
                                method:aMeta.verb,
                                headers:aMeta.payload ? {
                                    'content-type':aMeta.type + '/' + aMeta.subType
                                } : {}
                            };

                            _.extend(options.headers, aMeta.headers);

                            var req = http.request(options);
                            req.addListener('response', function (resp) {
                                var data = '';
                                resp.addListener('data', function (chunk) {
                                    data += chunk;
                                });
                                resp.addListener('end', function () {
                                    var result = {
                                        headers:resp.headers,
                                        statusCode:resp.statusCode,
                                        body:resp.headers['content-type'] == 'application/json' ?
                                            JSON.parse(data) : data
                                    };

                                    var err = resp.statusCode != 200 ? result : null;
                                    var result = resp.statusCode == 200 ? result : null;

                                    try {
                                        tester.test(test, err, result, ctx);
                                    }
                                    catch (e) {
                                        test.ok(false, 'Got Exception in tester: ' + util.inspect(e, false, null));
                                    }
                                    tester.tearDown(function () {
                                        c.app.close();
                                        test.done();
                                        cb();
                                    }, ctx);
                                });
                            });
                            if (aMeta.payload) {
                                req.write(aMeta.payload);
                            }
                            req.end();
                        });
                    }
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
}