'use strict';
var Configs = {};

/**
 * Public API
 * @Author: George_Chen
 * @Description: import configurations data to global configs object
 *
 * @param {String}        field, the fildName of configs
 * @param {Object}        content, the config json data
 */
exports.import = function(field, content) {
    if (typeof field !== 'string') {
        throw new Error('error while importing config file');
    }
    Configs[field] = content;
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the current global configurations
 */
exports.get = function() {
    return Configs;
};
