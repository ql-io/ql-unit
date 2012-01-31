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
var util = require('util');

exports.test = function (test, err, result) {
    if (err) {
        test.equals(err.headers['content-type'], 'application/json', 'json expected');
        test.ok(err.body['soap:Fault']['faultcode'], 'soap fault expected');
    }
    else {
        console.log(result.stack || util.inspect(result, false, 10));
        test.fail('Expected error got success');
    }
}
