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

/*
 * Credits: http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data,
 * https://github.com/wdavidw/node-csv-parser
 */
var fs = require("fs"),
    _ = require('underscore');

function pushRecord(headers, record, arrData) {
    var csvRecord = {}
    for (var i = 0; i < headers.length; i++) {
        if (headers[i]) {
            csvRecord[headers[i]] = (record[i] === undefined || record[i] === null) ? '' : record[i];
        }
    }
    arrData.push(_.clone(csvRecord));
}

exports.csvToRecords = function(strData, strDelimiter) {
    strData = strData.trim();
    strDelimiter = (strDelimiter || ",");

    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
        "gi"
    );

    var arrData = [
    ];

    var arrMatches = null;
    var record = [];
    var headers = null;
    while (arrMatches = objPattern.exec(strData)) {
        var strMatchedDelimiter = arrMatches[ 1 ];
        if (
            strMatchedDelimiter.length &&
                (strMatchedDelimiter != strDelimiter)
            ) {
            if (!headers) {
                headers = _.clone(record);
            }
            else {
                pushRecord(headers, record, arrData);
            }
            record = [];
        }
        if (arrMatches[ 2 ]) {
            var strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp("\"\"", "g"),
                "\""
            );
        } else {
            var strMatchedValue = arrMatches[ 3 ];
        }
        record.push(strMatchedValue);
    }

    if(headers.length > 0 && record.length > 0 ){
        pushRecord(headers, record, arrData);
    }

    return( arrData );
}
