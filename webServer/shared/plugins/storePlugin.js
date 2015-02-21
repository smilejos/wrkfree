var Lokijs = null;
var DB = null;
var DBName = 'Stores';

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
    if (!DB) {
        DB = new Lokijs(DBName);
    }
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to get the storeHelper or collection
 *         NOTE: store owner can get the storeHelper for handling data storage issues
 * @param {options}      Object, refer to fluxible document
 */
exports.plugContext = function(options) {
    return {
        /**
         * for getting storeHelper(collection)
         */
        plugStoreContext: function plugStoreContext(storeContext) {
            storeContext.getStoreHelper = function(helperName) {
                return DB.getCollection(helperName) || DB.addCollection(helperName);
            }
        }
    }
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: dehydrate mechanism will be called by fluxible framework
 */
exports.dehydrate = function() {
    return DB.toJson();
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: rehydrate mechanism will be called by fluxible framework
 *
 * @param {String}      serializedDB, the stringify DB returned by "dehydrate"
 */
exports.rehydrate = function(serializedDB) {
    if (!DB) {
        DB = new Lokijs();
    }
    DB.loadJSON(serializedDB);
};
