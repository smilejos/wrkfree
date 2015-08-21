'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ConferenceStore = require('../../../shared/stores/ConferenceStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for server to trigger stop the current conference
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(recvData) {
        actionContext.dispatch('ON_CONFERENCE_END', recvData);
    }).then(function() {
        var conferenceStore = actionContext.getStore(ConferenceStore);
        if (!conferenceStore.hasConference()) {
            actionContext.dispatch('CATCH_LOCAL_STREAM', {
                mediaStream: null,
                isEnabled: false
            });
        } else {
            actionContext.dispatch('CLEAN_STREAM_STATE', {
                channelId: data.channelId
            });
        }
    }).catch(function(err) {
        SharedUtils.printError('onConferenceStop.js', 'core', err);
    });
};
