'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var ChannelStorage = StorageManager.getService('Channel');

/**
 * Public API
 * @Author: George_Chen
 * @Description: to handle channel create request
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.name, the channel name
 */
exports.createAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.name, 'channelName')
        .then(function(validName) {
            var host = socket.getAuthToken();
            var isPublic = true;
            return ChannelStorage.createChannelAsync(host, validName, isPublic);
        }).then(function(result) {
            var errMsg = 'channel storage internal error';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('channelHandler.js', 'createAsync', err);
            throw new Error('create channel fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to handle channel request of adding member
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, channel id
 * @param {String}          data.member, the candidate member uid
 */
exports.addMemberAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.props({
        host: SharedUtils.argsCheckAsync(uid, 'md5'),
        member: SharedUtils.argsCheckAsync(data.member, 'md5'),
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(params) {
        return ChannelStorage.addNewMemberAsync(
            params.host,
            params.member,
            params.channelId);
    }).then(function(result) {
        var errMsg = 'fail to add medmber on storage service';
        return SharedUtils.checkExecuteResult(result, errMsg);
    }).catch(function(err) {
        SharedUtils.printError('channelHandler.js', 'addMemberAsync', err);
        throw new Error('add member fail');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting all authorized channels of the current user
 *
 * @param {Object}          socket, the client socket instance
 */
exports.getAuthChannelsAsync = function(socket) {
    var uid = socket.getAuthToken();
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(validUid) {
            return ChannelStorage.getAuthChannelsAsync(validUid);
        }).then(function(channels) {
            var errMsg = 'get authorized channels fail on storage service';
            return SharedUtils.checkExecuteResult(channels, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('channelHandler.js', 'getAuthChannelsAsync', err);
            throw new Error('get authorized channels fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for client to get the channel information
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, channel id
 */
exports.getInfoAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(uid, 'md5'),
        cid: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(data) {
        return ChannelStorage.getAuthAsync(data.uid, data.cid);
    }).then(function(isAuth) {
        if (!isAuth) {
            throw new Error('not auth to get channel info');
        }
        return ChannelStorage.getChannelInfoAsync(data.channelId);
    }).then(function(info) {
        var errMsg = 'fail to get channel information on storage service';
        return SharedUtils.checkExecuteResult(info, errMsg);
    }).catch(function(err) {
        SharedUtils.printError('channelHandler.js', 'getInfoAsync', err);
        throw new Error('get channel info fail');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for login user to get his member status on current channel
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, channel id
 */
exports.getMemberStatusAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(uid, 'md5'),
        cid: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(data) {
        return ChannelStorage.getMemberStatusAsync(data.uid, data.cid);
    }).then(function(status) {
        var errMsg = 'fail to get member status on storage service';
        return SharedUtils.checkExecuteResult(status, errMsg);
    }).catch(function(err) {
        SharedUtils.printError('channelHandler.js', 'getMemberStatusAsync', err);
        throw new Error('get channel member status fail');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for client to get the channel memberList
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, channel id
 */
exports.getMemberListAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function() {
            return ChannelStorage.getAuthAsync(uid, data.channelId);
        }).then(function(isAuth) {
            if (!isAuth) {
                throw new Error('get Auth fail');
            }
            return ChannelStorage.getMembersAsync(data.channelId);
        }).then(function(members) {
            var errMsg = 'fail to get members on storage service';
            return SharedUtils.checkExecuteResult(members, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('channelHandler.js', 'getMemberListAsync', err);
            throw new Error('get member list fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to keep channel visitor state
 *
 * @param {String}          data.channelId, channel id
 */
exports.keepVisitorAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function() {
            return ChannelStorage.getAuthAsync(uid, data.channelId);
        }).then(function(isAuth) {
            if (!isAuth) {
                throw new Error('keepVisitorAsync Auth fail');
            }
            return ChannelStorage.keepVisistedAsync(uid, data.channelId);
        }).then(function(result) {
            var errMsg = 'fail to keep visitor state on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('channelHandler.js', 'keepVisitorAsync', err);
            throw new Error('keep visitor state fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get current channel online visitors
 *
 * @param {String}          data.channelId, channel id
 */
exports.getVisitorysAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function() {
            return ChannelStorage.getAuthAsync(uid, data.channelId);
        }).then(function(isAuth) {
            if (!isAuth) {
                throw new Error('getVisitorysAsync Auth fail');
            }
            return ChannelStorage.getVisitorsAsync(data.channelId);
        }).then(function(visitors) {
            var errMsg = 'fail to get visitors on storage service';
            return SharedUtils.checkExecuteResult(visitors, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('channelHandler.js', 'getVisitorysAsync', err);
            throw new Error('get visitors list fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to handle channel star control
 *
 * @param {String}          data.channelId, channel id
 * @param {Boolean}         data.toStar, to indicate star or not 
 */
exports.starContrlAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.toStar, 'boolean'),
        function(cid, toStar) {
            return ChannelStorage.getAuthAsync(uid, cid)
                .then(function(isAuth) {
                    if (!isAuth) {
                        throw new Error('get Auth fail');
                    }
                    return ChannelStorage.starControlAsync(uid, cid, toStar);
                });
        }).then(function(result) {
            var errMsg = 'fail to star channel on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('channelHandler.js', 'starContrlAsync', err);
            throw new Error('star channel fail');
        });
};
