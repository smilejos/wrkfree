'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: to dispatch socket request to matched handler
 *
 * @param {Object}        socket, the request socket instance
 * @param {Object}        data, the request json object
 */
module.exports = function(socket, data) {
    return Promise.try(function() {
        var handler = _getHandler(data.service);
        if (!handler) {
            throw new Error('req service is not supported');
        }
        if (!handler[data.api]) {
            throw new Error('req api is not supported');
        }
        return handler[data.api].call(handler, socket, data.params);
    }).then(function(result) {
        return _getDispatchResult(null, result);
    }).catch(function(err) {
        SharedUtils.printError('dispatcher.js', 'core', err);
        return _getDispatchResult(err);
    });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: get the instance of req handler
 *
 * @param {String}        service, the service of handler
 */
function _getHandler(service) {
    return require('./handlers/' + service + 'Handler');
}

/**
 * @Author: George_Chen
 * @Description: to get the executive result of dispatcher
 *
 * @param {Error}         err, the error object
 * @param {Object}        data, the response json object
 */
function _getDispatchResult(err, data) {
    var result = {};
    if (err) {
        result.error = err.toString();
        return result;
    }
    result.data = data;
    return result;
}
