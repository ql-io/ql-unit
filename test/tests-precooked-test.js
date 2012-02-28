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

var cooked = {};
/*
var cooked = {
    test1:  {   // for mock servers .. different mocks run on different ports
        ports: [
            {
                port: 3026,
                status: 200,
                type: "application",
                subType: "json",
                payload: '{ "a" : "Value of a", "b": "Value of b"}'
            }
        ],

        // Present only for testing scripts not present for route
        script: "select * from some_table",

        // Present for routes
        request: "/myapi",
        verb: "get",

        // for routes .. where headers are required
        headers: {
            "x-ebay-soa-appname": "avalidappid"
        },

        // user defined functions for setup/teardown/test .. not mandatory
        udf: {
            setup: function (cb) {
                var ctx = {};
                ... do something .. likely set ctx
                someInternalAsyncCall(function(){
                    ... do your things ...
                        cb(ctx);
                });
            },
            test : function (test, err, result, ctx) { // ctx is the one passed by setup
                test.ok(result, "No result found");
                test.ok(!err, "Error found");
            },
            tearDown : function(cb, ctx){
                .. doe some clean up .. hint: use ctx
                cb();
            }
        }
    }
};
*/

module.exports = require('../lib/unit').init({
    tables:__dirname + '/tables',
    routes:__dirname + '/routes',
    config:__dirname + '/config/dev.json'});