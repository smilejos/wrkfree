'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var ChannelService = require('../services/channelService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to open hangout window
 *         NOTE: 
 *         for 1on1 channel, hangout title is the friend nickName
 *         for normal channel, hangout title is the channel name
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {String}      data.hangoutTitle, the title for current hangout
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        hangoutTitle: SharedUtils.argsCheckAsync(data.hangoutTitle, 'string')
    }).then(function(reqData) {
        return ChannelService.enterAsync(reqData.channelId)
            .then(function(isAuth) {
                if (!isAuth) {
                    throw new Error('not auth to open hangout');
                }
                actionContext.dispatch('ON_OPEN_HANGOUT', reqData);
            });
    }).catch(function(err) {
        SharedUtils.printError('openHangout.js', 'core', err);
    });
};
