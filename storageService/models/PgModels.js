'use strict';
var Pg = require('pg');
var Promise = require('bluebird');
var conString = 'postgres://wrkfree:wrkfree@localhost/wrkfree';
Promise.promisifyAll(Pg);

/**
 * Public API
 * @Author: George_Chen
 * @Description: for creating drawRecords table
 */
exports.createDrawRecordsAsync = function() {
    return Pg.connectAsync(conString)
        .spread(function(client, done) {
            return client.queryAsync('CREATE TABLE drawRecords( ' +
                    'id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ' +
                    '_bid uuid, ' +
                    '"channelId" VARCHAR(32), ' +
                    '"boardId" integer, ' +
                    '"isUndo" boolean DEFAULT false, ' +
                    '"isArchived" boolean DEFAULT false, ' +
                    '"record" jsonb, ' +
                    '"drawOptions" json, ' +
                    '"drawTime" timestamp DEFAULT CURRENT_TIMESTAMP)')
                .then(function(result) {
                    console.log('[INFO] createDrawRecordsAsync result ', result);
                    done();
                }).catch(function(err) {
                    console.log('[ERROR] on query createDrawRecordsAsync ', err);
                });
        }).catch(function(err) {
            console.log('[ERROR] on createDrawRecordsAsync ', err);
        });
};
