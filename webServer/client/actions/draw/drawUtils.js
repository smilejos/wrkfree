'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: check the draws chunks is valid or not
 *         NOTE:
 *         chunks[0] => fromX
 *         chunks[1] => fromY
 *         chunks[2] => toX
 *         chunks[3] => toY
 *         chunks[4] => mode
 * @param {Array}       chunks, the rawData of draw record
 */
exports.checkDrawChunksAsync = function(chunks) {
    return Promise.all([
        SharedUtils.argsCheckAsync(chunks[0], 'number'),
        SharedUtils.argsCheckAsync(chunks[1], 'number'),
        SharedUtils.argsCheckAsync(chunks[2], 'number'),
        SharedUtils.argsCheckAsync(chunks[3], 'number'),
        SharedUtils.argsCheckAsync(chunks[4], 'string')
    ]);
};
