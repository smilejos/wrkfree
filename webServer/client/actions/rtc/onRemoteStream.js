'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');
var ConferenceStore = require('../../../shared/stores/ConferenceStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for catching remote rtc stream
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Object}      data.stream, the rtc media stream
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        clientId: SharedUtils.argsCheckAsync(data.clientId, 'string')
    }).then(function(recvData) {
        var conferenceStore = actionContext.getStore(ConferenceStore);
        if (conferenceStore.isExist(data.channelId) || data.stream) {
            recvData.stream = data.stream;
            actionContext.dispatch('CATCH_REMOTE_STREAM', recvData);
        }
    }).catch(function(err) {
        SharedUtils.printError('onRemoteStream.js', 'core', err);
    });
};
