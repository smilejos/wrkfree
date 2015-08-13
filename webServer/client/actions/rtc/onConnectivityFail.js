'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');
var HangupConference = require('./hangupConference');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to inform user that his/her rtc connectivity is suferring failure
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id of current connection
 * @param {String}      data.message, the connectivity failure message
 * @param {Boolean}     data.isLocal, to indicate fail from local or remote
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        message: SharedUtils.argsCheckAsync(data.message, 'string'),
        isLocal: SharedUtils.argsCheckAsync(data.isLocal, 'boolean')
    }).then(function(recvData) {
        var sender = (recvData.isLocal ? 'local' : 'remote');
        ActionUtils.showWarningEvent('WARN', '[' + sender + '] ' + recvData.message);
        if (recvData.isLocal) {
            actionContext.executeAction(HangupConference, {
                channelId: recvData.channelId
            });
        }
    }).catch(function(err) {
        SharedUtils.printError('onConnectivityFail.js', 'core', err);
    });
};
