'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for reset current channel visitors
 *         NOTE: called when user leave channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, channel id
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            return actionContext.dispatch('UPDATE_CHANNEL_VISITORS', {
                channelId: cid,
            });
        }).catch(function(err) {
            SharedUtils.printError('getVisitorys.js', 'core', err);
            return ActionUtils.showWarningEvent('WARN', 'fail to get channel visitors');
        });
};
