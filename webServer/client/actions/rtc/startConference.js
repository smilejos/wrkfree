'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');
var RtcService = require('../../services/rtcService');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to start his conference state on current channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 */
module.exports = function(actionContext, data) {
    // show alert message if browser not support webrtc
    if (!require('webrtcsupport').getUserMedia) {
        return ActionUtils.showWarningEvent('Conference', 'your browser is not support WEBRTC');
    }
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(reqData) {
        ActionUtils.showInfoEvent('Conference', 'starting rtc conference...');
        return RtcService.startConferenceAsync(reqData);
    }).then(function(localStream) {
        actionContext.dispatch('CATCH_LOCAL_STREAM', {
            mediaStream: localStream,
            isEnabled: true
        });
    }).then(function() {
        actionContext.dispatch('ON_CONFERENCE_START', {
            channelId: data.channelId
        });
    }).catch(function(err) {
        SharedUtils.printError('startConference.js', 'core', err);
        // TODO: some error handling
        ActionUtils.showErrorEvent('Error', 'entering conference fail');
    });
};
