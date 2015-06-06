'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');
var RtcService = require('../../services/rtcService');
var ConferenceStore = require('../../../shared/stores/ConferenceStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to hangup conference on current channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(reqData) {
        return RtcService.hangupConferenceAsync(reqData);
    }).then(function() {
        actionContext.dispatch('ON_CONFERENCE_END', {
            channelId: data.channelId
        });
    }).then(function() {
        var conferenceStore = actionContext.getStore(ConferenceStore);
        if (!conferenceStore.hasConference()) {
            actionContext.dispatch('CATCH_LOCAL_STREAM', {
                mediaStream: null,
                isEnabled: false
            });
        }
    }).catch(function(err) {
        SharedUtils.printError('hangupConference.js', 'core', err);
        // show hangup error
    });
};
