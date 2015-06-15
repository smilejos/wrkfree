'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var Model = Mongoose.model('ChannelMember');
var DbUtil = require('../dbUtils');
var SharedUtils = require('../../sharedUtils/utils');
var ObjectAssign = require('object-assign');

var BOARD_NUM_MAXIMU = 100;

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: create a document of normal channel member
 *
 * @param {String}          member, the member uid
 * @param {String}          channelId, channel id
 * @param {Boolean}         isChannelHost, the host flag
 */
exports.addAsync = function(member, channelId, isChannelHost) {
    return Promise.props({
        member: SharedUtils.argsCheckAsync(member, 'md5'),
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        isHost: SharedUtils.argsCheckAsync(isChannelHost, 'boolean'),
        isStarred: isChannelHost,
        visitCounts: (isChannelHost ? 1 : 0),
        lastVisitTime: (isChannelHost ? Date.now() : new Date(0))
    }).then(function(doc) {
        return _save(doc, 'addMemberAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: create a document for 1on1 channel member
 *
 * @param {String}          member, the member uid
 * @param {String}          channelId, channel id
 */
exports.add1on1Async = function(member, channelId) {
    return Promise.props({
        member: SharedUtils.argsCheckAsync(member, 'md5'),
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        is1on1: true,
        isHost: true,
        isStarred: true
    }).then(function(doc) {
        return _save(doc, 'add1on1MemberAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete specific member
 *
 * @param {String}  member, the member's id
 * @param {String}  channelId, the channel identifier
 */
exports.deleteAsync = function(member, channelId) {
    return Promise.props({
        member: SharedUtils.argsCheckAsync(member, 'md5'),
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        return _remove(condition);
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'delMemberAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete specific channel related members
 * NOTE: usually used when channel was destroyed
 *
 * @param {String}          channelId, channel id
 */
exports.deleteByChannelAsync = function(channelId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        return _remove(condition);
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'delChannelAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for member to get his status on all channels that he has ever entered
 *
 * NOTE: if type is not "public" or "private", then type restriction will not added
 *
 * @param {String}      member, member's id
 */
exports.findByUidAsync = function(member, is1on1) {
    return Promise.props({
        member: SharedUtils.argsCheckAsync(member, 'md5')
    }).then(function(condition) {
        if (SharedUtils.isBoolean(is1on1)) {
            condition.is1on1 = is1on1;
        }
        return _find(false, condition);
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'findByUidAsync', err);
        return [];
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to find all channels that he has ever created
 *
 * @param {String}      host, host's id
 */
exports.findByHostUidAsync = function(host) {
    return Promise.props({
        member: SharedUtils.argsCheckAsync(host, 'md5'),
        isHost: true,
        is1on1: false
    }).then(function(condition) {
        return _find(false, condition);
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'findByHostUidAsync', err);
        return [];
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find members of specific channel
 *
 * @param {String}          channelId, channel id
 */
exports.findByChannelAsync = function(channelId, is1on1) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
    }).then(function(condition) {
        if (SharedUtils.isBoolean(is1on1)) {
            condition.is1on1 = is1on1;
        }
        return _find(false, condition);
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'findByChannelAsync', err);
        return [];
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find the specific member status
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.findMemberAsync = function(member, channelId, is1on1) {
    return Promise.props({
        member: SharedUtils.argsCheckAsync(member, 'md5'),
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        if (SharedUtils.isBoolean(is1on1)) {
            condition.is1on1 = is1on1;
        }
        return _find(true, condition);
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'findMemberAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check channel member is exist or not
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.isExistAsync = function(member, channelId) {
    return _isExist(member, channelId, {})
        .catch(function(err) {
            SharedUtils.printError('ChannelMemberDao.js', 'isExistAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check member has subscribed this channel or not
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.isStarredAsync = function(member, channelId) {
    return _isExist(member, channelId, {
        isStarred: true
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'isStarredAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check member has turn on his rtc status on this channel or not
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.isRtcAsync = function(member, channelId) {
    return _isExist(member, channelId, {
        isRtc: true
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'isRtcAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check member is the channel host or not
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.isHostAsync = function(member, channelId) {
    return _isExist(member, channelId, {
        isHost: true
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'isHostAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update member's msg seen status
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.updateMsgAsync = function(member, channelId) {
    return _update(member, channelId, {
        msgSeenTime: Date.now()
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'updateMsgAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update the last board that member located on specific channel
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 * @param {Number}      boardId, the draw board id
 */
exports.updateDrawAsync = function(member, channelId, boardId) {
    return Promise.try(function() {
        if (boardId >= 0 && boardId < BOARD_NUM_MAXIMU) {
            return _update(member, channelId, {
                lastUsedBoard: boardId
            });
        }
        throw new Error('boardId is invalid');
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'updateDrawAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for member to update the rtc status on specific channel
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 * @param {Boolean}     status, rtc status
 */
exports.updateRtcAsync = function(member, channelId, status) {
    return SharedUtils.argsCheckAsync(status, 'boolean')
        .then(function(validStatus) {
            return _update(member, channelId, {
                isRtc: validStatus
            });
        }).catch(function(err) {
            SharedUtils.printError('ChannelMemberDao.js', 'updateRtcAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for member to update the channel visit information
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.updateVisitAsync = function(member, channelId) {
    return _update(member, channelId, {
        // increment te visitCounts field by "1"
        $inc: {
            visitCounts: 1
        },
        lastVisitTime: Date.now()
    }).catch(function(err) {
        SharedUtils.printError('ChannelMemberDao.js', 'updateVisitAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update the subscription status of channel member
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 * @param {Boolean}     status, subscribed status
 */
exports.updateSubscribedAsync = function(member, channelId, status) {
    return SharedUtils.argsCheckAsync(status, 'boolean')
        .then(function(validStatus) {
            return _update(member, channelId, {
                isStarred: validStatus
            });
        }).catch(function(err) {
            SharedUtils.printError('ChannelMemberDao.js', 'updateSubscribedAsync', err);
            throw err;
        });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of save operation
 *
 * @param {Object}          memberDoc, new member document
 * @param {String}          caller, caller of this API
 */
function _save(memberDoc, caller) {
    // make mongoose cache outdated
    Model.find()._touchCollectionCheck(true);
    var newMember = new Model(memberDoc);
    return newMember.saveAsync()
        .then(function(result) {
            return DbUtil.checkDocumentSaveStatusAsync(result);
        }).catch(function(err) {
            SharedUtils.printError('ChannelMemberDao.js', caller, err);
            return null;
        });
}

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of checking document exist or not
 *
 * @param {String}          member, member's id
 * @param {String}          channelId, channel's id
 * @param {Object}          extraFields, extra searching fields
 */
function _isExist(member, channelId, extraFields) {
    return Promise.props({
        member: SharedUtils.argsCheckAsync(member, 'md5'),
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        var queryCondition = ObjectAssign(condition, extraFields);
        return Model.countAsync(queryCondition);
    }).then(function(count) {
        return DbUtil.checkDocumentExistStatusAsync(count);
    });
}

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of mongoose update
 *
 * @param {String}          member, the member's id
 * @param {String}          channelId, the channel identifier
 * @param {Object}          info, update info object
 */
function _update(member, channelId, info) {
    return Promise.props({
        member: SharedUtils.argsCheckAsync(member, 'md5'),
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        return Model.update(condition, info).execAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentUpdateStatusAsync(result);
    });
}

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of find operation
 *
 * @param {Boolean}         isFindOne, use "findOne" or "find" based on this flag
 * @param {Object}          condition, the mongoose query condition
 * @param {String}          selectFields, used to inform mongoose which fields should be taken
 */
function _find(isFindOne, condition, selectFields) {
    var fields = (selectFields ? selectFields : DbUtil.selectOriginDoc());
    return (isFindOne ? Model.findOne(condition, fields) : Model.find(condition, fields))
        .lean()
        .execAsync();
}

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of remove operation
 *
 * @param {Object}          condition, the mongoose query condition
 */
function _remove(condition) {
    // make mongoose cache outdated
    Model.find()._touchCollectionCheck(true);
    return Model.removeAsync(condition)
        .then(function(result) {
            return DbUtil.checkDocumentRemoveStatusAsync(result);
        });
}
