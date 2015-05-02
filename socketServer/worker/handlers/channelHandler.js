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
 * @param {String}          data.channelId, channel id
 * @param {String}          data.channelName, the full channel name
 */
exports.createAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    var type = 'public';
    return Promise.props({
        creator: SharedUtils.argsCheckAsync(uid, 'md5'),
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        channelName: SharedUtils.argsCheckAsync(data.channelName, 'channelName', type)
    }).then(function(params) {
        return ChannelStorage.createChannelAsync(
            params.creator,
            params.channelId,
            params.channelName,
            type);
    }).then(function(result) {
        if (!result || result.length === 0) {
            throw new Error('channel storage internal error');
        }
        return null;
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
        if (!result) {
            throw new Error('channel storage internal error');
        }
        return null;
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
        return ChannelStorage.getChannelInfoAsync(data.uid, data.cid);
    }).catch(function(err) {
        SharedUtils.printError('channelHandler.js', 'getInfoAsync', err);
        throw new Error('get channel info fail');
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
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(uid, 'md5'),
        cid: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(data) {
        return ChannelStorage.getMembersAsync(data.cid);
    }).catch(function(err) {
        SharedUtils.printError('channelHandler.js', 'getMemberListAsync', err);
        throw new Error('get member list fail');
    });
};

/**
 * TODO:
 * Public API
 * @Author: George_Chen
 * @Description: to handle channel star control
 *
 * @param {String}          data.channelId, channel id
 * @param {Boolean}         data.isStarred, to indicate star or not 
 */
exports.starCtrl = function(socket, data) {
    console.log(socket, data);
};

/**
 * TODO:
 * Public API
 * @Author: George_Chen
 * @Description: to handle channel passport request
 * NOTE: user should query a passport when he is not part of channel member
 *
 * @param {String}          data.channelId, channel id
 */
exports.reqPassport = function(socket, data) {
    console.log(socket, data);
};

/**
 * TODO:
 * Public API
 * @Author: George_Chen
 * @Description: to handle response of channel passport request
 * NOTE: channel host will response passport requestes from users
 *
 * @param {String}          data.channelId, channel id
 */
exports.respPassport = function(socket, data) {
    console.log(socket, data);
};
