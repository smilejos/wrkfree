'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

/**
 * @Author: George_Chen
 * @Description: used to validate the schema of
 *
 */
var Validator = {
    String: SharedUtils.isString,
    Number: SharedUtils.isNumber,
    Array: SharedUtils.isArray,
    Email: SharedUtils.isEmail,
    ChannelId: SharedUtils.isMd5Hex,
    ChannelName: SharedUtils.isChannelName,
    Boolean: SharedUtils.isBoolean
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: validate the saving document by defined schema
 *
 * @param {Object}      doc, the document for saving on client db
 * @param {Object}      schema, valid schema
 */
exports.validDocAsync = function(doc, schema) {
    var props = Object.keys(schema);
    var result = {};
    return Promise.map(props, function(prop) {
        var propType = schema[prop].type;
        if (!Validator[propType]) {
            throw new Error('[validDocAsync] not support prop type');
        }
        if (!Validator[propType].call(SharedUtils, doc[prop])) {
            throw new Error('[validDocAsync] doc props is invalid');
        }
        return (result[prop] = doc[prop]);
    }).then(function() {
        return result;
    });
};
