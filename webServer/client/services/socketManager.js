/**
 * NOTE: 
 * based on socketCluster, all message, activities, notifications traveling
 * through client and server are part of "CHANNEL SYSTEM".
 * we must define our subscription rule to fit this.
 * TYPE1: prefix with "user"
 * e.g. subscribeReq = user:UID, means the specific mailbox of user, only user himself can
 *     subscribe this channel.
 *
 * TYPE2: prefix with "channel"
 * e.g. subscribeReq = channel:CHANNELID, means specific channel frequency, users that subscribe this
 *     channel can get messages realtime.
 *     
 * TYPE3: prefix with "activity"
 * e.g. subscribeReq = activity:UID, the users's activity channel, only target user's friend
 *      can subscribe it. all target user's activities will broadcast there
 *      
 * TYPE4: prefix with "notification"
 * e.g. subscribeReq = notification:CHANNELID, the channel's notifications broadcast channel, 
 *     user can get specific channel's notification when he star a channel.
 */
'use strict';
var SocketCluster = require('sc2-client');
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');

// the websocket instance
var Socket = null;

/**
 * Public API
 * @Author: George_Chen
 * @Description: initialize the websocket client
 *
 * @param {Function}        callback, the node style callback function
 */
exports.init = function(callback) {
    if (Socket !== null) {
        return callback();
    }
    /**
     * initialize socket client
     * NOTE: socketCluster client will always try to recover 
     *       connection when socket is down.
     */
    Socket = SocketCluster.connect({
        secure: true,
        hostname: location.host + '/ws',
        port: 443
    });

    /**
     * secure socket after it initialized
     */
    Socket.on('ready', function(state) {
        if (!state.isAuthenticated) {
            Socket.emit('auth', document.cookie, function(err) {
                // TODO:
                // error handling on "auth"
                if (err) {
                    return console.log(err);
                }
                return callback();
            });
        }
        callback();
    });

    Socket.on('error', function() {
        callback(new Error('server socket error'));
    });

    Socket.on('disconnect', function() {
        callback(new Error('server connection lost'));
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get the socket instance from socketManager
 */
exports.getSocket = function() {
    if (!Socket) {
        this.init();
    }
    return Socket;
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to subscribe interested channel or user
 *
 * @param {String}        subscribeReq, the sbuscription requsest
 */
exports.subscribeAsync = function(subscribeReq) {
    return new Promise(function(resolver, rejecter) {
        if (Socket.getState() !== 'open') {
            throw new Error('server connection lost');
        }
        var channel = Socket.subscribe(subscribeReq);
        channel.on('subscribeFail', function() {
            rejecter(new Error('subscribe fail'));
        });
        channel.on('subscribe', function() {
            channel.watch(_evtWatcher.bind(this, subscribeReq));
            resolver(true);
        });
    }).catch(function(err) {
        SharedUtils.printError('socketManager.js', 'subscribeAsync', err);
        Socket.destroyChannel(subscribeReq);
        return false;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to release the subscription on specific user or channel
 *
 * @param {String}        subscribeReq, the sbuscription requsest
 */
exports.unSubscribeAsync = function(subscribeReq) {
    return Promise.try(function() {
        if (Socket.getState() !== 'open') {
            throw new Error('server connection lost');
        }
        Socket.destroyChannel(subscribeReq);
        return true;
    }).catch(function(err) {
        SharedUtils.printError('socketManager.js', 'unsubscribeAsync', err);
        return false;
    });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * TODO:
 * @Author: George_Chen
 * @Description: the evt watcher is used to handle all datas which come from 
 *               current subscriptions
 *
 * @param {String}        subscribeReq, the sbuscription requsest
 * @param {Object}        data, json object come from subscription CHANNEL
 */
function _evtWatcher(subscribeReq, data) {
    console.log('get channel data from', subscribeReq, data);
}
