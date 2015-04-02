'use strict';
var Lokijs = require('lokijs');

/**
 * plugin Name
 */
exports.name = 'storePlugin';

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to get the storeHelper or collection
 *         NOTE: store owner can get the storeHelper for handling data storage issues
 */
exports.plugContext = function() {
    var lokiDbs = {};
    return {
        /**
         * for getting storeHelper(collection)
         */
        plugStoreContext: function plugStoreContext(storeContext) {
            storeContext.getLokiDb = function(dbName) {
                if (!lokiDbs[dbName]) {
                    lokiDbs[dbName] = new Lokijs(dbName);
                }
                return lokiDbs[dbName];
            };
        }
    };
};
