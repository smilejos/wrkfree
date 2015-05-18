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
    ascending: 1,
    descending: -1
};

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

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
    if (Object.keys(SortMethod).indexOf(method) === -1) {
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
    return (flag ? DocumentField.select : DocumentField.nonSelect);
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
 * @Author: George_Chen
 * @Description: used to check mongoose save result
 *
 * @param {object}           saveResult, the mongoose save result
 */
exports.checkDocumentSaveStatusAsync = function(saveResult) {
    return Promise.try(function() {
        var doc = saveResult[0].toObject();
        var saveStatus = saveResult[1];
        if (!saveStatus) {
            var err = new Error('mongoose save fail');
            throw err;
        }
        return doc;
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to check mongoose exist query result.
 *
 * @param {object}           countNumber, the mongoose document count numbers
 */
exports.checkDocumentExistStatusAsync = function(countNumber) {
    return Promise.try(function() {
        if (countNumber > 1) {
            throw new Error('mongoose document numbers abnormal');
        }
        return (countNumber > 0);
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to check mongoose field update result
 *
 * @param {object}           updateResult, the mongoose update result
 */
exports.checkDocumentUpdateStatusAsync = function(updateResult) {
    return Promise.try(function() {
        if (updateResult === 0) {
            throw new Error('mongoose update fail');
        }
        return (updateResult > 0);
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to check mongoose doc remove result
 *
 * @param {object}           removeResult, the mongoose doc remove result
 */
exports.checkDocumentRemoveStatusAsync = function(removeResult) {
    return Promise.try(function() {
        if (!removeResult[1].ok) {
            throw new Error('exception on mongodb remove');
        }
        if (removeResult[0] === 0) {
            console.log('mongoose remove nothing');
        }
        return (removeResult[0] > 0);
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: get the channel query condition
 *
 * @param {String} chId, channel's id
 */
exports.getChannelCondAsync = function(chId) {
    return Promise.try(function() {
        if (!SharedUtils.isMd5Hex(chId)) {
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
 * @Public API
 * @Author: George_Chen
 * @Description: transform date field of mongodb docs to timestamp number
 *         NOTE: because date get from mongoose and from cache are different type,
 *               so we need this transform function
 * @param {Array}        mongoDocs, a array of mongodb docs
 * @param {String}       dateField, the date fieldName on each doc
 */
exports.transformTimeAsync = function(mongoDocs, dateField) {
    return Promise.map(mongoDocs, function(doc) {
        if (doc[dateField] instanceof Date) {
            doc[dateField] = Date.parse(doc[dateField].toISOString());
        } else {
            doc[dateField] = Date.parse(doc[dateField].toString());
        }
        return doc;
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: transform _id field of mongodb docs to new field
 * 
 * @param {Object}       doc, a mongodb document
 * @param {String}       newField, the new "_id" field name
 */
exports.transformToNewIdAsync = function(doc, newIdField) {
    doc[newIdField] = doc._id;
    delete doc._id;
    return doc;
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
    return Promise.try(function() {
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
    return (!SharedUtils.isValidTime(timestamp) ? defaultTimeValue[mode] : timestamp);
}
