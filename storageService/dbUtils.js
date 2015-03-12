'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../sharedUtils/utils');

/**
 * used for setting the minimum of query time
 */
var TimeMinimum = Date.parse('January 1, 2015  00:00:00');

/**
 * mongoose enum value
 */
var DocumentField = {
    nonSelect: 0,
    select: 1
};
var SortMethod = {
    descending: 1,
    ascending: -1
};

/**
 * @Public API
 *
 * @Author: George_Chen
 * @Description: to specify which field will be sorted.
 *
 * @param {String} field, the field to be sorted
 * @param {String} method, sort method
 */
exports.getSort = function(field, method) {
    var sortObject = {};
    if (!SharedUtils.isString(field)) {
        console.log('[getSort] field is invalid');
        return sortObject;
    }
    if (method !== 'topDown' && method !== 'bottomUp') {
        console.log('[getSort] method is not support');
        return sortObject;
    }
    sortObject[field] = SortMethod[method];
    return sortObject;
};

/**
 * @Public API
 *
 * @Author: George_Chen
 * @Description: simply mark db field to selected or non-selected
 *
 * @param {Boolean} flag, the select flag
 */
exports.select = function(flag) {
    if (flag) {
        return DocumentField.select;
    }
    return DocumentField.nonSelect;
};

/**
 * @Public API
 *
 * @Author: George_Chen
 * @Description: to get an basic field selection object for mongoose query
 *
 */
exports.selectOriginDoc = function() {
    return {
        _id: DocumentField.nonSelect,
        __v: DocumentField.nonSelect
    };
};

/**
 * @Public API
 *
 * @Author: George_Chen
 * @Description: to get an basic field selection object for mongoose query
 */
exports.checkDocumentSaveAsync = function (saveResult) {
    return Promise.try(function(){
        var doc = saveResult[0].toObject();
        var saveStatus = saveResult[1];
        if (!saveStatus) {
            throw new Error('mongoose save fail');
        }
        return doc;
    });
};

/**
 * @Public API
 *
 * @Author: George_Chen
 * @Description: get the channel query condition
 *
 * @param {String} chId, channel's id
 */
exports.getChannelCondAsync = function(chId){
    return Promise.try(function(){
        if (!SharedUtils.isChannelId(chId)) {
            var err = new Error('channel id is invalid');
            SharedUtils.printError('dbUtils', 'getChannelCondAsync', err);
            throw err;
        }
        return {
            channelId: chId
        };
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check and apply the time option to query condition
 *
 * @param {Object}      condition, the mongoose query condition
 * @param {String}      field, the fieldName for apply time
 * @param {Object}      period, optional,  period object will include "start" and "end"
 *                             which specify an time duration
 */
exports.getTimeCondAsync = function(conditon, field, period) {
    return Promise.try(function(){
        if (!conditon) {
            var err = new Error('condition is broken');
            SharedUtils.printError('dbUtils', 'getChannelCondAsync', err);
            throw err;
        }
        if (!SharedUtils.isString(field)) {
            return conditon;
        }
        if (!period || (!period.start && !period.end)) {
            return conditon;
        }
        var startTime = _getValidTime(period.start, 'start');
        var endTime = _getValidTime(period.end, 'end');
        if (startTime > endTime) {
            return conditon;
        }
        // apply time constraint to origin query condition
        conditon[field] = {
            $gt: startTime,
            $lt: endTime
        };
        return conditon;
    });
};

/**
 * @Author: George_Chen
 * @Description: to vertify the timestamp
 *
 * @param {Number}      timestamp, the timestamp in msec format
 */
function _getValidTime(timestamp, mode) {
    var defaultTimeValue = {
        start: TimeMinimum,
        end: Date.now()
    };
    if (!SharedUtils.isValidTime(timestamp)) {
        return defaultTimeValue[mode];
    }
    return timestamp;
}
