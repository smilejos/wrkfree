'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');
var RtcService = require('../../services/rtcService');
var ActionUtils = require('../actionUtils');
var WebcamStore = require('../../../shared/stores/WebcamStore');

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
        return RtcService.startConferenceAsync(reqData);
    }).then(function(result) {
        if (result === null) {
            throw new Error('start conference fail');
        }
        actionContext.dispatch('CREATE_STREAM_STATE', {
            channelId: data.channelId
        });
    }).then(function() {
        var store = actionContext.getStore(WebcamStore);
        if (!store.hasLocalStream()) {
            RtcService.setupVisibleStream();
        }
        actionContext.dispatch('ON_CONFERENCE_START', {
            channelId: data.channelId
        });
    }).catch(function(err) {
        SharedUtils.printError('startConference.js', 'core', err);
        // TODO: some error handling
        ActionUtils.showErrorEvent('Error', 'entering conference fail');
    });
};
