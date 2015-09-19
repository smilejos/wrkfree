'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for update the target list of channel invitation
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isAdded, indicate current operation is "added" or "removed"
 * @param {String}      data.target, the information of target user
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(data.target.uid, 'md5'),
        nickName: SharedUtils.argsCheckAsync(data.target.nickName, 'nickName'),
        avatar: SharedUtils.argsCheckAsync(data.target.avatar, 'avatar')
    }).then(function(targetInfo) {
        var storeData = {
            target: targetInfo
        };
        var storeEvt = (data.isAdded ? 'ADD_INVITATION_TARGET' : 'REMOVE_INVITATION_TARGET');
        actionContext.dispatch(storeEvt, storeData);
    }).catch(function(err) {
        var warnMsg = (data.isAdded ? 'add target user fail' : 'remove target user fail');
        SharedUtils.printError('updateInvitationTarget.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', warnMsg);
    });
};
