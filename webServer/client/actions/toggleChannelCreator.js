'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var ChannelCreatorStore = require('../../shared/stores/ChannelCreatorStore');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: toggle the Channel Creator to active or not
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isActive, indicate component is active or not
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return !actionContext.getStore(ChannelCreatorStore).isActive;
    }).then(function(toggleToActive) {
        actionContext.dispatch('TOGGLE_CHANNELCREATOR', {
            isActive: toggleToActive
        });
    }).catch(function(err) {
        SharedUtils.printError('toggleChannelCreator.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'toggle channel creator fail');
    });
};
