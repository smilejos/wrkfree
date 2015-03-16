'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var UserDao = require('../daos/UserDao');
var UserTemp = require('../tempStores/UserTemp');
var FriendDao = require('../daos/FriendDao');
var FriendTemp = require('../tempStores/FriendTemp');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting candidate user's friendlist
 *
 * @param {String}      candidate, the candidate's uid
 * @param {String}      asker, the asker's uid
 */
exports.getFriendListAsync = function(candidate, asker) {
    return FriendDao.getFriendsAsync(candidate, asker)
        .then(function(friends) {
            return FriendTemp.getOnlineFriendsAsync(friends)
                .then(function(onlineFriends) {
                    return Promise.map(friends, function(doc) {
                        doc.isOnline = (onlineFriends.indexOf(doc.uid) > -1);
                        return doc;
                    });
                });
        }).catch(function(err) {
            SharedUtils.printError('FriendService', 'getFriendListAsync', err);
            return [];
        });
};

/**
 * TODO: how to handle save fail ?
 * Public API
 * @Author: George_Chen
 * @Description: establish friendship between user1 and user2
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
exports.addFriendshipAsync = function(user1, user2) {
    return _hasFriendshipAsync(user1, user2)
        .then(function(areFriends) {
            if (areFriends) {
                throw new Error('friendship already exist');
            }
            return UserDao.findByGroupAsync([user1, user2]);
        }).map(function(userInfo) {
            var asker = (userInfo.email === user1 ? user2 : user1);
            return FriendDao.addNewFriendAsync(asker, userInfo.email, userInfo.nickName, userInfo.avatar);
        }).map(function(friendInfo) {
            return UserTemp.isUserOnlineAsync(friendInfo.uid)
                .then(function(status) {
                    friendInfo.isOnline = (status == 1);
                    return friendInfo;
                });
        }).catch(function(err) {
            SharedUtils.printError('FriendService', 'addFriendShipAsync', err);
            return null;
        });
};

/**
 * TODO: how to handle deletion fail ?
 * Public API
 * @Author: George_Chen
 * @Description: remove friendship between user1 and user2
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
exports.delFriendshipAsync = function(user1, user2) {
    return _hasFriendshipAsync(user1, user2)
        .then(function(areFriends) {
            if (!areFriends) {
                throw new Error('friendship not exist');
            }
            return [
                FriendDao.delFriendAsync(user1, user2),
                FriendDao.delFriendAsync(user2, user1)
            ];
        }).catch(function(err) {
            SharedUtils.printError('FriendService', 'delFriendshipAsync', err);
            return null;
        });
};

/**
 * TODO:
 * exports.isFriendReqSent
 */

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: check user1 and user2 have friendship or not
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
function _hasFriendshipAsync(user1, user2) {
    return Promise.join(
        FriendDao.isFriendExistAsync(user1, user2),
        FriendDao.isFriendExistAsync(user2, user1),
        function(result1, result2) {
            if ((!result1 && result2) || (result1 && !result2)) {
                throw new Error('friendship is abnormal');
            }
            return (result1 && result2);
        }).catch(function(err) {
            SharedUtils.printError('FriendService', 'checkFriendshipAsync', err);
            throw err;
        });
}
