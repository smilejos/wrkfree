'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var FriendStore = require('../../../shared/stores/FriendStore');
var ChannelInvitationStore = require('../../../shared/stores/ChannelInvitationStore');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to search invitation targets
 *         NOTE: currently we only search on friend list
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.query, the query string
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.query, 'string')
        .then(function(query) {
            var targets = actionContext.getStore(ChannelInvitationStore).getState().targets;
            var members = actionContext.getStore(WorkSpaceStore).getState().members.info;
            var searchResults = (query === '' ? [] : actionContext.getStore(FriendStore).searchFriends(query));
            return Promise.map(searchResults, function(mapItem) {
                return {
                    uid: mapItem.uid,
                    nickName: mapItem.nickName,
                    avatar: mapItem.avatar
                };
            }).filter(function(filterItem) {
                return (!_isUidInList(targets, filterItem.uid) && !_isUidInList(members, filterItem.uid));
            }).then(function(newResults) {
                actionContext.dispatch('UPDATE_INVITATION_RESULTS', {
                    originResults: searchResults,
                    results: newResults
                });
            });
        }).catch(function(err) {
            SharedUtils.printError('searchForInvitation.js', 'core', err);
        });
};

/**
 * @Author: George_Chen
 * @Description: to check candidate uid is in the list or not
 * 
 * @param {Array}       list, an array of user info
 * @param {String}      uid, the candidate uid
 */
function _isUidInList(list, uid) {
    for (var i = 0; i < list.length; ++i) {
        if (list[i].uid === uid) {
            return true;
        }
    }
    return false;
}
