'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var NotificationDao = require('../daos/NotificationDao');
var ChannelTemp = require('../tempStores/ChannelTemp');
var UserTemp = require('../tempStores/UserTemp');
var PgUser = require('../pgDaos/PgUser');
var PgChannel = require('../pgDaos/PgChannel');
var PgMember = require('../pgDaos/PgMember');
var PgDrawBoard = require('../pgDaos/PgDrawBoard');
var SearchService = require('./SearchService');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to create channel related data
 *
 * @param {String}          creator, creator for this channel
 * @param {String}          name, full channel name
 */
exports.createChannelAsync = function(creator, name) {
    return PgChannel.isExistAsync(creator, name)
        .then(function(isExist) {
            if (isExist) {
                throw new Error('channel is exist !');
            }
            return PgChannel.createAsync(creator, name);
        }).then(function(result) {
            if (!result) {
                return result;
            }
            return SearchService.indexChannelAsync(result)
                .then(function(){
                    return result;
                });
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'createChannelAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to remove channel related docs
 *
 * @param {String}          creator, creator for this channel
 * @param {String}          channelId, channel id
 */
exports.removeChannelAsync = function(creator, channelId) {
    // TODO: 
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for member to update his channel visit infomation
 *
 * @param {String}          member, member's uid
 * @param {String}          channelId, channel id
 */
exports.visitChannelAsync = function(member, channelId) {
    return PgMember.updateVisitAsync(member, channelId)
        .then(function() {
            return ChannelTemp.visitAsync(member, channelId);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'visitChannelAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to keep member still on the channel visitor list
 *
 * @param {String}          member, member's uid
 * @param {String}          channelId, channel id
 */
exports.keepVisistedAsync = function(member, channelId) {
    return PgMember.isExistAsync(member, channelId)
        .then(function(isMember) {
            return (isMember ? ChannelTemp.visitAsync(member, channelId) : null);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'keepVisistedAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get visitor list on current channel
 *
 * @param {String}          channelId, channel id
 */
exports.getVisitorsAsync = function(channelId) {
    return ChannelTemp.getVisitorsAsync(channelId)
        .catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'getVisitedMembersAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove member from current visitor list
 *
 * @param {String}          member, member's uid
 * @param {String}          channelId, channel id
 */
exports.removeVisitorAsync = function(member, channelId) {
    return ChannelTemp.removeVisitorAsync(member, channelId)
        .catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'removeVisitorAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for channel host to add new channel member
 *
 * @param {String}          host, host's uid
 * @param {String}          member, member's uid
 * @param {String}          channelId, channel id
 */
exports.addNewMemberAsync = function(host, member, channelId) {
    return Promise.join(
        PgMember.isHostAsync(host, channelId),
        PgMember.isExistAsync(member, channelId),
        function(isHost, hasMember) {
            if (!isHost || hasMember) {
                throw new Error('authorize not allowed');
            }
            return PgMember.addAsync(member, channelId, false);
        }).then(function(result) {
            // make channel list cache outdated
            if (result) {
                ChannelTemp.deleteListAsync(channelId);
            }
            return result;
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'addNewMemberAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for channel host to add channel members
 *
 * @param {String}          host, host's uid
 * @param {String}          member, member's uid
 * @param {String}          channelId, channel id
 */
exports.addMembersAsync = function(host, members, channelId) {
    return Promise.join(
        PgMember.isHostAsync(host, channelId),
        PgChannel.findByIdAsync(channelId),
        function(isHost, channelInfo) {
            if (!isHost) {
                throw new Error('unauthorized operation');
            }
            ChannelTemp.deleteListAsync(channelId);
            return Promise.map(members, function(memberUid) {
                return PgMember.isExistAsync(memberUid, channelId)
                    .then(function(isExist) {
                        return (isExist ? null : PgMember.addAsync(memberUid, channelId));
                    });
            }).map(function(result) {
                var msg = 'inivite you to work on his channel';
                return (result ? _setChannelNotification(host, result.member, msg, channelId, channelInfo.name) : null);
            });
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'addMembersAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get all authorized channels that user can login
 *         NOTE: "visitTime" is used to specify that the "lastVisitTime" on queried channels
 *               must prior to "visitTime" args
 *
 * @param {String}          member, member's uid
 * @param {Object}          visitTime, the visit timestamp (optional)
 */
exports.getAuthChannelsAsync = function(member, visitTime) {
    return PgMember.findByUidAsync(member, visitTime)
        .map(function(memberDoc) {
            memberDoc.visitTime = memberDoc.lastVisitTime;
            delete memberDoc.lastVisitTime;
            delete memberDoc.msgSeenTime;
            return memberDoc;
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'getAuthChannelsAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get user's starred channels
 *
 * @param {String}          member, member's uid
 */
exports.getStarredChannelsAsync = function(member) {
    return PgMember.findStarsAsync(member)
        .map(function(memberDoc) {
            return memberDoc.channelId;
        }).then(function(channels) {
            return PgChannel.findInIdsAsync(channels);
        }).map(function(channelDoc) {
            return {
                channelId: channelDoc.channelId,
                host: channelDoc.host,
                name: channelDoc.name
            };
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'getStarredChannelsAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for asker to get specific channel's infomation
 *
 * @param {String}          channelId, channel id
 */
exports.getChannelInfoAsync = function(channelId) {
    return Promise.props({
        basicInfo: PgChannel.findByIdAsync(channelId),
        drawBoardNums: PgDrawBoard.countBoardsAsync(channelId)
    }).catch(function(err) {
        SharedUtils.printError('ChannelService.js', 'getChannelInfoAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to check the authorization on specific channel
 *
 * @param {String}          asker, asker's uid
 * @param {String}          channelId, channel id
 */
exports.getAuthAsync = function(asker, channelId) {
    return _isMemberAuthAsync(asker, channelId)
        .catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'getAuthAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get channel member list
 *
 * @param {String}          channelId, channel id
 */
exports.getMembersAsync = function(channelId) {
    return ChannelTemp.getMemberListAsync(channelId)
        .then(function(members) {
            if (SharedUtils.isEmptyArray(members)) {
                return PgMember.findInChannelAsync(channelId)
                    .map(function(memberInfo) {
                        return memberInfo.member;
                    });
            }
            return members;
        }).then(function(memberList) {
            ChannelTemp.importMemberListAsync(memberList, channelId);
            return Promise.props({
                info: PgUser.findInIdsAsync(memberList)
            });
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'getMembersAsync', err);
            return null;
        });
};

/**
 * TODO: ChanneTemp.getOnlineMembersAsync and UserTemp.getOnlineUsersAsync
 *       should be refactor as a common used API
 * Public API
 * @Author: George_Chen
 * @Description: to get online channel member list
 * NOTE: getMembersAsync will keep an copy of memberlist on temp store, then
 *     we can use this store to figure out online members
 *
 * @param {String}          channelId, channel id
 */
exports.getOnlineMembersAsync = function(channelId) {
    return exports.getMembersAsync(channelId)
        .then(function() {
            return ChannelTemp.getMemberListAsync(channelId);
        }).then(function(members) {
            return UserTemp.getOnlineUsersAsync(members);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'getOnlineMembersAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for asker to get the member status on current channel
 *
 * @param {String}          asker, asker's uid
 * @param {String}          channelId, channel id
 */
exports.getMemberStatusAsync = function(asker, channelId) {
    return PgMember.findMemberAsync(asker, channelId)
        .catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'getMemberStatusAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for asker to check starred status on current channel
 *
 * @param {String}          asker, asker's uid
 * @param {String}          channelId, channel id
 */
exports.hasStarredAsync = function(asker, channelId) {
    return PgMember.isStarredAsync(asker, channelId)
        .catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'hasStarredAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for asker to star current channel or not
 *
 * @param {String}          asker, asker's uid
 * @param {String}          channelId, channel id
 * @param {Boolean}         toStar, indicate to star or not
 */
exports.starControlAsync = function(asker, channelId, toStar) {
    return PgMember.updateStarredAsync(asker, channelId, toStar)
        .then(function() {
            return true;
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'starControlAsync', err);
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
 * @Description: to check asker is currently a member or not
 *
 * @param {String}          asker, asker's uid
 * @param {String}          channelId, channel id
 */
function _isMemberAuthAsync(asker, channelId) {
    return ChannelTemp.isMemberAsync(asker, channelId)
        .then(function(result) {
            if (!result || !result.listExist) {
                exports.getMembersAsync(channelId); // re-cache memberList to tempStore
                return PgMember.isExistAsync(asker, channelId);
            }
            return !!result.memberExist;
        });
}

/**
 * @Author: George_Chen
 * @Description: for setting the channel notification of target user
 *
 * @param {String}          sender, sender's uid
 * @param {String}          target, target's uid
 * @param {String}          noticeMessage, the notification message
 * @param {String}          cid, channel id
 * @param {String}          channelName, channel name
 */
function _setChannelNotification(sender, target, noticeMessage, cid, channelName) {
    return NotificationDao.createByChannelAsync(sender, target, noticeMessage, cid)
        .then(function(notificationDoc) {
            return PgUser.setUnreadNoticeCountAsync(target, false)
                .then(function(incrResult) {
                    var err = new Error('increment notification counts fail');
                    if (!incrResult) {
                        SharedUtils.printError('ChannelService.js', '_setChannelNotification', err);
                    }
                    notificationDoc.extraInfo = {
                        channelId: cid,
                        name: channelName
                    };
                    return notificationDoc;
                });
        });
}

// TODO: deleteChannel (should also remove es saerch index)
