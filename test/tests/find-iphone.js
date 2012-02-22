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
    _    = require('underscore');

exports.test = function (test, err, result) {
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

