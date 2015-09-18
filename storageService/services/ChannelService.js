'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var CryptoUtils = require('../../sharedUtils/cryptoUtils');
var Promise = require('bluebird');
var UserDao = require('../daos/UserDao');
var ChannelDao = require('../daos/ChannelDao');
var BoardDao = require('../daos/DrawBoardDao');
var PreviewDao = require('../daos/DrawPreviewDao');
var MemberDao = require('../daos/ChannelMemberDao');
var NotificationDao = require('../daos/NotificationDao');
var ChannelTemp = require('../tempStores/ChannelTemp');
var UserTemp = require('../tempStores/UserTemp');

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
 * @param {Boolean}         isPublic, indicate channel should public or not
 */
exports.createChannelAsync = function(creator, name, isPublic) {
    var time = Date.now().toString();
    var cid = CryptoUtils.getMd5Hex(creator + time);
    return ChannelDao.isCreatedAsync(creator, name)
        .then(function(hasChannel) {
            if (hasChannel) {
                throw new Error('channel already exist');
            }
            // clean all related docs
            return _removeChannel(cid, creator);
        }).then(function() {
            return _createChannel(creator, cid, name, isPublic);
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
    return MemberDao.isHostAsync(creator, channelId)
        .then(function(isHost) {
            return (isHost ? _removeChannel(channelId, creator) : null);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', 'removeChannelAsync', err);
            return null;
        });
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
    return MemberDao.isExistAsync(member, channelId)
        .then(function(isMember) {
            if (!isMember) {
                return null;
            }
            return Promise.all([
                MemberDao.updateVisitAsync(member, channelId),
                ChannelTemp.visitAsync(member, channelId)
            ]);
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
    return MemberDao.isExistAsync(member, channelId)
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
        MemberDao.isHostAsync(host, channelId),
        MemberDao.isExistAsync(member, channelId),
        function(isHost, hasMember) {
            if (!isHost || hasMember) {
                throw new Error('authorize not allowed');
            }
            return MemberDao.addAsync(member, channelId, false);
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
        MemberDao.isHostAsync(host, channelId),
        ChannelDao.findByChannelAsync(channelId, false),
        function(isHost, channelInfo) {
            if (!isHost) {
                throw new Error('unauthorized operation');
            }
            ChannelTemp.deleteListAsync(channelId);
            return Promise.map(members, function(memberUid) {
                return MemberDao.isExistAsync(memberUid, channelId)
                    .then(function(isMemberExist) {
                        if (isMemberExist) {
                            throw new Error('inivite existed member');
                        }
                        return MemberDao.addAsync(memberUid, channelId, false);
                    }).catch(function(err) {
                        SharedUtils.printError('ChannelService.js', 'addMembersAsync', err);
                        return null;
                    });
            }).map(function(result) {
                var noticeMessage = 'inivite you to work on his channel';
                if (result) {
                    return NotificationDao.createByChannelAsync(host, result.member, noticeMessage, channelId)
                        .then(function(notificationDoc) {
                            notificationDoc.extraInfo = {
                                channelId: channelId,
                                name: channelInfo.name
                            };
                            return notificationDoc;
                        });
                }
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
 *
 * @param {String}          member, member's uid
 * @param {Object}          visitPeriod, the query time period
 *                          visitPeriod.start, the start time of this period
 *                          visitPeriod.end, the end time of this period
 */
exports.getAuthChannelsAsync = function(member, visitPeriod) {
    return MemberDao.findByUidAsync(member, false, visitPeriod)
        .bind(this)
        .map(function(memberDoc) {
            var cid = memberDoc.channelId;
            return Promise.props({
                channel: ChannelDao.findByChannelAsync(cid, false),
                isStarred: memberDoc.isStarred,
                visitTime: memberDoc.lastVisitTime
            });
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
    return MemberDao.findByStarredAsync(member)
        .map(function(memberDoc) {
            return memberDoc.channelId;
        }).then(function(channels) {
            return ChannelDao.findByChanelsAsync(channels);
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
        basicInfo: ChannelDao.findByChannelAsync(channelId),
        drawBoardNums: BoardDao.countBoardsAsync(channelId)
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
                return MemberDao.findByChannelAsync(channelId)
                    .map(function(memberInfo) {
                        return memberInfo.member;
                    });
            }
            return members;
        }).then(function(memberList) {
            ChannelTemp.importMemberListAsync(memberList, channelId);
            return Promise.props({
                info: UserDao.findByGroupAsync(memberList)
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
    return MemberDao.findMemberAsync(asker, channelId)
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
    return MemberDao.isStarredAsync(asker, channelId)
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
    return MemberDao.updateStarredAsync(asker, channelId, toStar)
        .catch(function(err) {
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
                return MemberDao.isExistAsync(asker, channelId);
            }
            return !!result.memberExist;
        });
}

/**
 * @Author: George_Chen
 * @Description: create channel related docs, any failure will cause the
 *               _removeChannel() to clean created docs
 *
 * @param {String}          creator, creator for this channel
 * @param {String}          channelId, channel id
 * @param {String}          name, full channel name
 * @param {Boolean}         isPublic, indicate channel should public or not
 */
function _createChannel(creator, channelId, name, isPublic) {
    return Promise.join(
        ChannelDao.createAsync(channelId, creator, name, isPublic),
        MemberDao.addAsync(creator, channelId, true),
        PreviewDao.saveAsync(channelId, 0),
        BoardDao.saveAsync(channelId, 0),
        function(channelDoc, memberDoc) {
            if (!channelDoc || !memberDoc) {
                throw new Error('at least one channel document create fail');
            }
            return channelDoc;
        }).catch(function(err) {
            SharedUtils.printError('ChannelService.js', '_createChannel', err);
            // clean previous related docs
            return _removeChannel(channelId, creator).then(function() {
                return null;
            });
        });
}

/**
 * TODO: channel temp store and cache should also be cleared
 * @Author: George_Chen
 * @Description: clean channel related documents
 *
 * @param {String}          channelId, channel id
 * @param {String}          host, host's uid
 */
function _removeChannel(channelId, host) {
    return Promise.props({
        remMembers: MemberDao.deleteByChannelAsync(channelId),
        remChannel: ChannelDao.deleteAsync(channelId, host)
    });
}
