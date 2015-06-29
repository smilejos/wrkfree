'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var UserService = require('../services/userService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: receive and handle new notification from server
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data, the notification
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        return (data.isNotification ? _normalCheck(data) : _reqRespCheck(data));
    }).then(function(notification) {
        return UserService.getInfoAsync(notification.sender)
            .then(function(senderInfo) {
                notification.sender = senderInfo;
                return notification;
            });
    }).then(function(data) {
        actionContext.dispatch('ON_NOTIFICATION', data);
    }).catch(function(err) {
        SharedUtils.printError('onNotification.js', 'core', err);
    });
};

/**
 * @Author: George_Chen
 * @Description: ensure reqResp notification data has correct format
 * 
 * @param {Object}          actionContext, the fluxible's action context
 * @param {String}          data.reqId, the request id
 * @param {String}          data.target, the uid of response target
 * @param {String}          data.sender, the uid of sender target
 * @param {String}          data.type, the type of this reqResp
 * @param {Boolean}         data.isReq, indicate is request or not
 * @param {Boolean}         data.isReaded, indicate is readed or not
 * @param {Boolean}         data.respToPermitted, the answer from host
 * @param {Object}          data.extraInfo, the extra information
 * @param {Number}          data.updatedTime, the updated timestamp
 * @param {Boolean}         data.isNotification, indicate this is normal notification or not
 */
function _reqRespCheck(data) {
    return Promise.props({
        reqId: SharedUtils.argsCheckAsync(data.reqId, '_id'),
        target: SharedUtils.argsCheckAsync(data.target, 'md5'),
        sender: SharedUtils.argsCheckAsync(data.sender, 'md5'),
        type: SharedUtils.argsCheckAsync(data.type, 'string'),
        isReq: SharedUtils.argsCheckAsync(data.isReq, 'boolean'),
        isReaded: SharedUtils.argsCheckAsync(data.isReaded, 'boolean'),
        respToPermitted: SharedUtils.argsCheckAsync(data.respToPermitted, 'boolean'),
        extraInfo: data.extraInfo,
        updatedTime: data.updatedTime,
        isNotification: data.isNotification
    });
}

/**
 * @Author: George_Chen
 * @Description: ensure normal notification data has correct format
 * 
 * @param {Object}          data, the normal notification data
 */
function _normalCheck(data) {
    return data;
}
