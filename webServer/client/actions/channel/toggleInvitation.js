'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ChannelInvitationStore = require('../../../shared/stores/ChannelInvitationStore');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: toggle the channel invitation component
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isActive, indicate component is active or not
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return !actionContext.getStore(ChannelInvitationStore).isActive;
    }).then(function(toggleToActive) {
        var wkStore = actionContext.getStore(WorkSpaceStore);
        if (toggleToActive && !wkStore.getState().status.isHost) {
            return ActionUtils.showWarningEvent('WARN', 'only channel host can add members');
        }
        actionContext.dispatch('TOGGLE_CHANNEL_INVITATION', {
            isActive: toggleToActive
        });
    }).catch(function(err) {
        SharedUtils.printError('toggleInvitation.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'toggle channel invitation fail');
    });
};
