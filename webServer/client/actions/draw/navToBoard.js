'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var HangoutStore = require('../../../shared/stores/HangoutStore');
var CloseHangout = require('../closeHangout');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: trigger the draw board url navigation
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Number}      data.boardId, target board id
 * @param {Function}    data.urlNavigator, the transitionTo reference of react-router
 */
module.exports = function(actionContext, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var urlNavigator = data.urlNavigator;
            var boardPage = bid + 1;
            if (!SharedUtils.isFunction(urlNavigator)) {
                throw new Error('get url navigator fail');
            }
            urlNavigator('/app/workspace/' + cid + '?board=' + boardPage);
        }).then(function() {
            var hangoutStore = actionContext.getStore(HangoutStore);
            if (hangoutStore.isHangoutExist(data.channelId)) {
                actionContext.executeAction(CloseHangout, {
                    channelId: data.channelId,
                    isStayed: true
                });
            }
        }).catch(function(err) {
            SharedUtils.printError('navToBoard.js', 'core', err);
        });
};
