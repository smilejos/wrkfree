'use strict';
var Lokijs = null;

/**
 * plugin Name
 */
exports.name = 'storePlugin';

/**
 * @Public API
 * @Author: George_Chen
 * @Description: setup the environment dependency, lokijs module
 *
 * @param {options}      Object,
 *                       options.lokijs, the lokijs module
 */
exports.envSetup = function(options) {
    if (!options.lokijs) {
        return console.log('[storePlugin] no lokijs instance available');
    }
    Lokijs = options.lokijs;
};

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
