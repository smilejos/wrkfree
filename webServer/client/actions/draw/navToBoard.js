'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');

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
            var navigator = data.urlNavigator;
            var boardIndex = bid + 1;
            if (!SharedUtils.isFunction(data.urlNavigator)) {
                throw new Error('');
            }
            navigator('/app/workspace/' + cid + '?board=' + boardIndex);
        }).catch(function(err) {
            SharedUtils.printError('navToBoard.js', 'core', err);
        });
};
