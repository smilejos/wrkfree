'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var UserDao = require('../daos/UserDao');
var ChannelDao = require('../daos/ChannelDao');
var MemberDao = require('../daos/ChannelMemberDao');
var UserTemp = require('../tempStores/UserTemp');
var UserTemp = require('../tempStores/UserTemp');
var PgDrawBoard = require('../pgDaos/PgDrawBoard');
var PgFriend = require('../pgDaos/PgFriend');

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
 */
exports.getFriendListAsync = function(candidate) {
    return PgFriend.getFriendsAsync(candidate)
        .then(function(friends) {
            if (friends.length === 0) {
                return friends;
            }
            return Promise.map(friends, function(doc) {
                return doc.uid;
            }).then(function(uids) {
                return Promise.join(
                    UserDao.findByGroupAsync(uids),
                    UserTemp.getOnlineUsersAsync(uids),
                    function(usersInfo, onlineUids) {
                        return Promise.map(usersInfo, function(info) {
                            info.isOnline = (onlineUids.indexOf(info.uid) > -1);
                            return info;
                        });
                    });
            });
        }).catch(function(err) {
            SharedUtils.printError('FriendService', 'getFriendListAsync', err);
            return null;
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
    return PgFriend.hasFriendAsync(user1, user2)
        .then(function(result) {
            if (result) {
                throw new Error('friend is exist');
            }
            return UserDao.findByGroupAsync([user1, user2])
                .then(function(users) {
                    if (users.length !== 2) {
                        throw new Error('abnormal users info');
                    }
                    return PgFriend.addFriendshipAsync(user1, user2)
                        .then(function() {
                            return _create1on1Channel(user1, user2);
                        }).then(function() {
                            return users;
                        }).map(function(info) {
                            return Promise.props({
                                owner: (info.uid === user1 ? user2 : user1),
                                uid: info.uid,
                                nickName: info.nickName,
                                avatar: info.avatar,
                                isOnline: UserTemp.isUserOnlineAsync(info.uid)
                            });
                        });
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
    return PgFriend.hasFriendAsync(user1, user2)
        .then(function(result) {
            if (result) {
                throw new Error('friend is exist');
            }
            return PgFriend.deleteFriendshipAsync(user1, user2)
                .then(function(result) {
                    return result.rows;
                });
        }).catch(function(err) {
            SharedUtils.printError('FriendService', 'delFriendshipAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check user1 and user2 have friendship or not
 *         NOTE: when addFriendship is implemented by "transaction", then
 *               we can only check user2 is one of user1's friend or not
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
exports.hasFriendshipAsync = function(user1, user2) {
    return PgFriend.hasFriendAsync(user1, user2)
        .catch(function(err) {
            SharedUtils.printError('FriendService', 'hasFriendshipAsync', err);
            return null;
        });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: create 1on1 channel between two users
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
function _create1on1Channel(user1, user2) {
    return ChannelDao.create1on1Async(user1, user2)
        .then(function(doc) {
            if (!doc) {
                throw new Error('create 1on1 channel fail');
            }
            return Promise.map([user1, user2], function(member) {
                return MemberDao.add1on1Async(member, doc.channelId);
            }).map(function(result) {
                if (!result) {
                    throw new Error('1on1 member doc create fail');
                }
                return result;
            }).then(function(info) {
                var cid = info[0].channelId;
                return PgDrawBoard.saveAsync(cid, 0).then(function() {
                    return info;
                });
            });
        });
}
