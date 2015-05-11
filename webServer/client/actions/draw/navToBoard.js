'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to navigate between different drawBoards
 *               on current channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Number}      data.boardId, target board id
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return SharedUtils.argsCheckAsync(data.boardId, 'boardId')
        .then(function(bid) {
            var workSpaceStore = actionContext.getStore(WorkSpaceStore);
            workSpaceStore.setCurrentBoard(bid);
            return true;
        }).catch(function(err) {
            SharedUtils.printError('navToBoard.js', 'core', err);
            return null;
            // show alert message ?
        }).nodeify(callback);
};
