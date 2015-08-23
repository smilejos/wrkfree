'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
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
    return Promise.try(function() {
        actionContext.dispatch('CATCH_LOCAL_STREAM', {
            mediaStream: data.stream,
            isEnabled: true
        });
    }).catch(function(err) {
        SharedUtils.printError('catchVisibleStream.js', 'core', err);
        ActionUtils.showErrorEvent('ERROR', 'setup local media fail, please reload !');
    });
};
