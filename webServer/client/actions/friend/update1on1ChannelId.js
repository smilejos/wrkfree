'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var HeaderStore = require('../../../shared/stores/HeaderStore');
var ActionUtils = require('../actionUtils');


/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to update the 1on1 channelId on current friend
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.friendUid, the uid of target friend
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.friendUid, 'md5')
        .then(function(friendUid) {
            var selfInfo = actionContext.getStore(HeaderStore).getSelfInfo();
            actionContext.dispatch('UPDATE_1ON1_CHANNELID', {
                uid: friendUid,
                channelId: SharedUtils.get1on1ChannelId(friendUid, selfInfo.uid)
            });
        }).catch(function(err) {
            SharedUtils.printError('update1on1Channel.js', 'core', err);
            ActionUtils.showErrorEvent('Friend', 'update 1on1 channel id fail');
        });
};
