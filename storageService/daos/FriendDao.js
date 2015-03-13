'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var DbUtil = require('../dbUtils');
var FriendModel = Mongoose.model('Friend');

/************************************************
 *
 *          public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: get friend list of user
 *               filter out privacy info if "privateInfo" is false
 * @param {String}      candidate, the candidate's uid
 * @param {String}      asker, the asker's uid
 */
exports.getFriendsAsync = function(candidate, asker) {
    return Promise.join(
        SharedUtils.argsCheckAsync(candidate, 'uid'),
        SharedUtils.argsCheckAsync(asker, 'uid'),
        function(candidateUid, askerUid) {
            var condition = {
                friendOwner: candidateUid
            };
            var fields = DbUtil.selectOriginDoc();
            fields.friendOwner = DbUtil.select(false);
            if (candidateUid !== askerUid) {
                fields.group = DbUtil.select(false);
            }
            return FriendModel.find(condition, fields).lean().execAsync();
        }).catch(function(err) {
            SharedUtils.printError('FriendDao', 'getFriendsAsync', err);
            return [];
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to add an new friend, this is an one way document created
 *               if two user become friend, we should call function this twice for different user
 * @param {String}      sender, the sender's uid
 * @param {Object}      info, channel's identifier
 *                      info must have property: {friendUid, friendName, friendAvatar, friendGroup}
 */
exports.addNewFriendAsync = function(asker, friendEmail, friendName, friendAvatar, friendGroup) {
    friendGroup = friendGroup || 'none';
    return Promise.props({
        friendOwner: SharedUtils.argsCheckAsync(asker, 'uid'),
        uid: SharedUtils.argsCheckAsync(friendEmail, 'uid'),
        nickName: SharedUtils.argsCheckAsync(friendName, 'nickName'),
        avatar: SharedUtils.argsCheckAsync(friendAvatar, 'avatar'),
        group: SharedUtils.argsCheckAsync(friendGroup, 'alphabet')
    }).then(function(doc) {
        var friendSchema = new FriendModel(doc);
        FriendModel.find()._touchCollectionCheck(true);
        return friendSchema.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('FriendDao', 'addNewFriendAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to check target is his friend or not
 *
 * @param {String}      candidate, the candidate's uid
 * @param {String}      asker, the asker's uid
 */
exports.isFriendExistAsync = function(candidate, asker) {
    return Promise.join(
        SharedUtils.argsCheckAsync(candidate, 'uid'),
        SharedUtils.argsCheckAsync(asker, 'uid'),
        function(candidateUid, askerUid) {
            var condition = _getFriendConition(askerUid, candidateUid);
            return FriendModel.countAsync(condition);
        }).then(function(count) {
        return (count > 0);
    }).catch(function(err) {
        SharedUtils.printError('FriendDao', 'isFriendExistAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete candidate friend form asker's friend list
 *
 * @param {String}      candidate, the candidate's uid
 * @param {String}      asker, the asker's uid
 */
exports.delFriendAsync = function(candidate, asker) {
    return Promise.join(
        SharedUtils.argsCheckAsync(candidate, 'uid'),
        SharedUtils.argsCheckAsync(asker, 'uid'),
        function(candidateUid, askerUid) {
            var condition = _getFriendConition(askerUid, candidateUid);
            return FriendModel.remove(condition).execAsync();
        }).then(function(result) {
            return (result > 0);
        }).catch(function(err) {
            SharedUtils.printError('FriendDao', 'delFriendAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update the candidate friends's avatar
 *
 * @param {String}      candidate, the candidate's uid
 * @param {String}      asker, the asker's uid
 * @param {String}      avatarUrl, candidate's avatar url
 */
exports.updateAvatarAsync = function(candidate, asker, avatarUrl) {
    return Promise.join(
        SharedUtils.argsCheckAsync(candidate, 'uid'),
        SharedUtils.argsCheckAsync(asker, 'uid'),
        SharedUtils.argsCheckAsync(avatarUrl, 'avatar'),
        function(candidateUid, askerUid, validAvatar) {
            return _update(candidateUid, askerUid, {
                avatar: validAvatar
            });
        }).catch(function(err) {
            SharedUtils.printError('FriendDao', 'updateAvatarAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to manage his friend's display name
 *
 * @param {String}      candidate, the candidate's uid
 * @param {String}      asker, the asker's uid
 * @param {String}      name, candidate's nickName
 */
exports.updateNameAsync = function(candidate, asker, name) {
    return Promise.join(
        SharedUtils.argsCheckAsync(candidate, 'uid'),
        SharedUtils.argsCheckAsync(asker, 'uid'),
        SharedUtils.argsCheckAsync(name, 'nickName'),
        function(candidateUid, askerUid, validName) {
            return _update(candidateUid, askerUid, {
                nickName: validName
            });
        }).catch(function(err) {
            SharedUtils.printError('FriendDao', 'updateNameAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to manage his friend's group
 *
 * @param {String}      candidate, the candidate's uid
 * @param {String}      asker, the asker's uid
 * @param {String}      groupName, group's name
 */
exports.updateGroupAsync = function(candidate, asker, groupName) {
    return Promise.join(
        SharedUtils.argsCheckAsync(candidate, 'uid'),
        SharedUtils.argsCheckAsync(asker, 'uid'),
        SharedUtils.argsCheckAsync(groupName, 'alphabet'),
        function(candidateUid, askerUid, validGroup) {
            return _update(candidateUid, askerUid, {
                group: validGroup
            });
        }).catch(function(err) {
            SharedUtils.printError('FriendDao', 'updateGroupAsync', err);
            return null;
        });
};

/************************************************
 *
 *          internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: an update implementation for each update public api
 *
 * @param {String}      candidate, the candidate's uid
 * @param {String}      asker, the asker's uid
 * @param {Object}      validDoc, the update info document
 */
function _update(candidateUid, askerUid, validDoc) {
    var condition = _getFriendConition(askerUid, candidateUid);
    return FriendModel
        .update(condition, validDoc)
        .execAsync()
        .then(function(result) {
            return (result > 0);
        });
}

/**
 * @Author: George_Chen
 * @Description: simply get the query condition for searching specific friend
 *
 * @param {String}      ownerUid, the owner's uid
 * @param {String}      fndUid, the friend's uid
 */
function _getFriendConition(ownerUid, friendUid) {
    return {
        friendOwner: ownerUid,
        uid: friendUid
    };
}
