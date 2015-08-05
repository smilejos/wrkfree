'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var UserDao = require('../daos/UserDao');
var ChannelDao = require('../daos/ChannelDao');
var MemberDao = require('../daos/ChannelMemberDao');
var BoardDao = require('../daos/DrawBoardDao');
var PreviewDao = require('../daos/DrawPreviewDao');
var UserTemp = require('../tempStores/UserTemp');
var FriendDao = require('../daos/FriendDao');
var FriendTemp = require('../tempStores/FriendTemp');
var UserTemp = require('../tempStores/UserTemp');

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
            return Promise.map(friends, function(doc) {
                doc.isOnline = false;
                return doc.uid;
            }).then(function(uids) {
                if (uids.length > 0) {
                    return UserTemp.getOnlineUsersAsync(uids)
                        .map(function(onlineUid) {
                            var index = uids.indexOf(onlineUid);
                            if (index > -1) {
                                friends[index].isOnline = true;
                            }
                        });
                }
            }).then(function() {
                return friends;
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
    return _hasFriendShip(user1, user2)
        .then(function(areFriends) {
            if (areFriends) {
                throw new Error('friendship already exist');
            }
            return UserDao.findByGroupAsync([user1, user2]);
        }).map(function(userInfo) {
            var asker = (userInfo.uid === user1 ? user2 : user1);
            return FriendDao.addNewFriendAsync(asker, userInfo.uid, userInfo.nickName, userInfo.avatar);
        }).then(function(friends) {
            return _create1on1Channel(user1, user2)
                .then(function() {
                    return friends;
                });
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
    return _hasFriendShip(user1, user2)
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
 * Public API
 * @Author: George_Chen
 * @Description: check user1 and user2 have friendship or not
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
exports.hasFriendshipAsync = function(user1, user2) {
    return _hasFriendShip(user1, user2)
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
 * @Description: low-level implementation to check friendship between users
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
function _hasFriendShip(user1, user2) {
    return Promise.join(
        FriendDao.isFriendExistAsync(user1, user2),
        FriendDao.isFriendExistAsync(user2, user1),
        function(result1, result2) {
            if ((!result1 && result2) || (result1 && !result2)) {
                throw new Error('friendship is abnormal');
            }
            return (result1 && result2);
        }).catch(function(err) {
            SharedUtils.printError('FriendService', '_hasFriendShip', err);
            throw err;
        });
};


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
                return Promise.join(
                    PreviewDao.saveAsync(cid, 0),
                    BoardDao.saveAsync(cid, 0),
                    function() {
                        return info;
                    });
            });
        });
}
