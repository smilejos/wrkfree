'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: check the draws chunks is valid or not
 *         NOTE:
 *         chunks[0] => fromX
 *         chunks[1] => fromY
 *         chunks[2] => toX
 *         chunks[3] => toY
 * @param {Array}       chunks, the rawData of draw record
 */
exports.checkDrawChunksAsync = function(chunks) {
    return Promise.map(chunks, function(position){
        if (position < 0) {
            throw new Error('draw position is invlid');
        }
        return position;
    });
};
