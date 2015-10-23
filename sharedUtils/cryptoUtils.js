'use strict';
var SharedUtils = require('./utils');
var Crypto = (typeof window !== 'undefined' ? require('crypto-browserify') : require('crypto'));


/**
 * Public API
 * @Author: George_Chen
 * @Description: a simple interface for providing md5 hash
 *
 * @param {String}     str, original string for hash
 */
exports.getMd5Hex = function(str) {
    if (!SharedUtils.isString(str)) {
        return null;
    }
    return Crypto.createHash('md5')
        .update(str)
        .digest('hex');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: a simple interface for providing sha1 hash
 *
 * @param {String}     str, original string for hash
 */
exports.getSha1Hex = function(str) {
    if (!SharedUtils.isString(str)) {
        return null;
    }
    return Crypto.createHash('sha1')
        .update(str)
        .digest('hex');
};
