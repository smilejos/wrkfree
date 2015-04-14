'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var UserDao = require('../daos/UserDao');
var ChannelDao = require('../daos/ChannelDao');
var ChannelMemberDao = require('../daos/ChannelMemberDao');
var ChannelTemp = require('../tempStores/ChannelTemp');

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
 * @param {String}          channelId, channel id
 * @param {String}          name, full channel name
 * @param {String}          type, channel type
 */
exports.createChannelAsync = function(creator, channelId, name, type) {
    return ChannelDao.isExistAsync(channelId)
        .then(function(hasChannel) {
            if (hasChannel) {
                throw new Error('channel already exist');
            }
            // clean all related docs
            return _removeChannel(channelId);
        }).then(function() {
            return _createChannel(creator, channelId, name, type);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService', 'createChannelAsync', err);
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
    return ChannelMemberDao.isHostAsync(creator, channelId)
        .then(function(isHost) {
            return (isHost ? _removeChannel(channelId) : null);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService', 'removeChannelAsync', err);
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
    return ChannelMemberDao.isExistAsync(member, channelId)
        .then(function(isMember) {
            return (isMember ? ChannelMemberDao.updateVisitAsync(member, channelId) : null);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService', 'visitChannelAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to search channels which name matched the partial name
 *
 * @param {String}          name, partial channel name
 */
exports.searchChannelAsync = function(name) {
    return ChannelDao.searchByNameAsync(name);
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
        ChannelMemberDao.findMemberAsync(host, channelId),
        ChannelMemberDao.isExistAsync(member, channelId),
        function(hostInfo, isMember) {
            if (!hostInfo.isHost || isMember) {
                throw new Error('authorize not allowed');
            }
            return ChannelMemberDao.addMemberAsync(
                member,
                channelId,
                hostInfo.channelType,
                hostInfo.channelName,
                false);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService', 'addNewMemberAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get all authorized channels that user can login
 *
 * @param {String}          member, member's uid
 */
exports.getAuthChannelsAsync = function(member) {
    return ChannelMemberDao.findByUidAsync(member, 'public')
        .bind(this)
        .map(function(memberDoc) {
            return Promise.props({
                channelId: memberDoc.channelId,
                channelName: memberDoc.channelName,
                isStarred: memberDoc.isStarred,
                members: this.getMembersAsync(memberDoc.channelId),
                snapshot: null,
                rtcStatus: null,
                visitTime: memberDoc.lastVisitTime
            });
        }).catch(function(err) {
            SharedUtils.printError('ChannelService', 'getAuthChannelsAsync', err);
            return [];
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for asker to get specific channel's infomation
 *
 * @param {String}          asker, asker's uid
 * @param {String}          channelId, channel id
 */
exports.getChannelInfoAsync = function(asker, channelId) {
    return _isMemberAuthAsync(asker, channelId)
        .then(function(auth) {
            return (auth ? ChannelDao.findByChanelAsync(channelId) : null);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService', 'getChannelInfoAsync', err);
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
            SharedUtils.printError('ChannelService', 'getAuthAsync', err);
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
                return ChannelMemberDao.findByChannelAsync(channelId)
                    .map(function(memberInfo) {
                        return memberInfo.member;
                    });
            }
            return members;
        }).then(function(memberList) {
            ChannelTemp.importMemberListAsync(memberList, channelId);
            return Promise.props({
                info: UserDao.findByGroupAsync(memberList),
                onlineList: ChannelTemp.getOnlineMembersAsync(channelId)
            });
        }).catch(function(err) {
            SharedUtils.printError('ChannelService', 'getMembersAsync', err);
            return [];
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get online channel member list
 * NOTE: getMembersAsync will keep an copy of memberlist on temp store, then
 *     we can use this store to figure out online members
 *
 * @param {String}          channelId, channel id
 */
exports.getOnlineMembersAsync = function(channelId) {
    return this.getMembersAsync(channelId)
        .then(function() {
            return ChannelTemp.getOnlineMembersAsync(channelId);
        }).catch(function(err) {
            SharedUtils.printError('ChannelService', 'getOnlineMembersAsync', err);
            return [];
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
                return ChannelMemberDao.isExistAsync(asker, channelId);
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
 * @param {String}          type, channel type
 */
function _createChannel(creator, channelId, name, type) {
    return Promise.all([
        ChannelMemberDao.addMemberAsync(creator, channelId, type, name, true),
        ChannelDao.newChannelAsync(channelId, name, type)
    ]).map(function(result) {
        if (!result) {
            throw new Error('at least one channel document create fail');
        }
        return result;
    }).catch(function(err) {
        SharedUtils.printError('ChannelService', '_createChannel', err);
        // clean previous related docs
        return _removeChannel(channelId).then(function() {
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
 */
function _removeChannel(channelId) {
    return Promise.props({
        remMembers: ChannelMemberDao.delChannelAsync(channelId),
        remChannel: ChannelDao.delChannelAsync(channelId)
    });
}
