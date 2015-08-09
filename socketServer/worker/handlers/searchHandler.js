'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var SearchService = StorageManager.getService('Search');
var ChannelStorage = StorageManager.getService('Channel');

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to search on all the things
 *         NOTE: currently search on users and channels
 *       
 * @param {Object}          data.query, the query string
 */
exports.searchAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.query, 'string')
        .then(function(queryText) {
            return SearchService.searchAsync(queryText);
        }).then(function(result) {
            if (result === null) {
                throw new Error('search fail on storage service');
            }
            var uid = socket.getAuthToken();
            return Promise.props({
                users: (result.users ? _filterUsers(uid, result.users) : []),
                channels: (result.channels ? _mapNewChannels(uid, result.channels) : []),
            });
        }).catch(function(err) {
            SharedUtils.printError('searchHandler.js', 'searchAsync', err);
            throw new Error('search fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to search on specific users
 *       
 * @param {Object}          data.query, the query string
 */
exports.searchUserAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.query, 'string')
        .then(function(queryText) {
            var text = queryText.slice(1, queryText.length);
            return SearchService.searchUserAsync(text);
        }).then(function(users) {
            var uid = socket.getAuthToken();
            return _filterUsers(uid, users);
        }).catch(function(err) {
            SharedUtils.printError('searchHandler.js', 'searchUserAsync', err);
            throw new Error('search user fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to search on specific channel
 *       
 * @param {Object}          data.query, the query string
 */
exports.searchChannelAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.query, 'string')
        .then(function(queryText) {
            var text = queryText.slice(1, queryText.length);
            return SearchService.searchChannelAsync(text);
        }).then(function(channels) {
            var uid = socket.getAuthToken();
            return _mapNewChannels(uid, channels);
        }).catch(function(err) {
            SharedUtils.printError('searchHandler.js', 'searchChannelAsync', err);
            throw new Error('search channel fail');
        });
};

/**
 * @Author: George_Chen
 * @Description: used to filter specific user and target users
 *
 * @param {String}          uid, the uid for filtering
 * @param {Array}           targets, an array of target users
 */
function _filterUsers(uid, targets) {
    return targets.filter(function(targetUser) {
        return (uid !== targetUser.uid);
    });
}

/**
 * @Author: George_Chen
 * @Description: used to map target channels to new json format
 *       
 * @param {String}          uid, the self uid
 * @param {Array}           targets, an array of target channels
 */
function _mapNewChannels(uid, targets) {
    return Promise.map(targets, function(channel) {
        return Promise.props({
            host: channel.host,
            name: channel.name,
            channelId: channel.channelId,
            organization: channel.organization,
            isKnown: ChannelStorage.getAuthAsync(uid, channel.channelId)
        });
    });
}
