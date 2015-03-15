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
 * @param {options}      Object, refer to fluxible document
 */
exports.plugContext = function(options) {
    var storeHelpers = {};
    return {
        /**
         * for getting storeHelper(collection)
         */
        plugStoreContext: function plugStoreContext(storeContext) {
            storeContext.getStoreHelper = function(helperName) {
                if (!storeHelpers[helperName]) {
                    storeHelpers[helperName] = new Lokijs(helperName);
                }
                return storeHelpers[helperName];
            }
        }
    };
};
