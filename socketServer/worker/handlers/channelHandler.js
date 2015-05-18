'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var CryptoUtils = require('../../../sharedUtils/cryptoUtils');
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
    return SharedUtils.argsCheckAsync(data.name, 'string')
        .then(function(validName) {
            var host = socket.getAuthToken();
            var isPublic = true;
            return ChannelStorage.createChannelAsync(host, validName, isPublic);
        }).then(function(result) {
            if (!result) {
                throw new Error('channel storage internal error');
            }
            return result;
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
        .then(function(){
            return ChannelStorage.getAuthAsync(uid, data.channelId); 
        }).then(function(isAuth){
            if (!isAuth) {
                throw new Error('get Auth fail');
            }
            return ChannelStorage.getMembersAsync(data.channelId);
        }).catch(function(err) {
            SharedUtils.printError('channelHandler.js', 'getMemberListAsync', err);
            throw new Error('get member list fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: handle the request of searching channels
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.queryStr, the string used to search users
 */
exports.searchAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.queryStr, 'string')
        .then(function(validString) {
            return ChannelStorage.searchChannelAsync(validString);
        }).map(function(channel) {
            var uid = socket.getAuthToken();
            return Promise.props({
                host: channel.host,
                name: channel.name,
                channelId: channel.channelId,
                organization: channel.organization,
                isKnown: ChannelStorage.getAuthAsync(uid, channel.channelId)
            });
        }).catch(function(err) {
            SharedUtils.printError('channelHandler.js', 'searchAsync', err);
            throw new Error('search channel fail');
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
