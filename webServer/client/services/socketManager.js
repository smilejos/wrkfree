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
var SocketCluster = require('socketcluster-client');
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * actions
 */
var ClientInitAction = require('../actions/clientInit');

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
        return (Socket.getState() === 'open' ? callback() : _handleConnectionFail('connection initialize fail'));
    }

    function _clientInit() {
        window.context.executeAction(ClientInitAction, {
            done: callback
        });
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
    Socket.on('connect', function(state) {
        if (!state.isAuthenticated) {
            if (document.cookie === '') {
                return location.assign('/');
            }
            return Socket.emit('auth', document.cookie, function(err) {
                if (err) {
                    _handleConnectionFail('connection authentication fail');
                }
                _clientInit();
            });
        }
        _clientInit();
    });

    Socket.on('disconnect', function() {
        _handleConnectionFail('server connection lost');
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
 * @Description: to send the emit request to socket server
 * 
 * @param {Object}        packet, the request packet object
 *        NOTE: packet should include properties below
 *              packet.service, the name of service handler for this request
 *              packet.api,     the API name of the target service handler
 *              packet.params,  the parameters that service handler can handling
 */
exports.requestAsync = function(packet) {
    return new Promise(function(resolver, rejecter) {
        if (Socket.getState() !== 'open') {
            return _handleConnectionFail('server connection lost');
        }
        return Socket.emit('req', packet, function(err, data) {
            return (err ? rejecter(err) : resolver(data));
        });
    }).catch(function(err) {
        SharedUtils.printError('socketManager.js', 'requestAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to send the emit request to socket server
 * NOTE: if userA send an publish request to channel, other users in the 
 *       channel will use "packet.clientHandler" for handling this request
 *       
 * @param {String}        subscribedChannel, the socketCluster channel
 * @param {Object}        packet, the request packet object
 * NOTE: packet should include properties below
 *     packet.service, the name of service handler for this request
 *     packet.api,     the API name of the target service handler
 *     packet.clientHandler, the API for handling this publish request on client side
 *     packet.params,  the parameters that service handler can handling
 *     packet.filterList, the define which uids will not receive this packet
 *         e.g.: filterList is a json object like below:
 *         {
 *             'uid1': true,
 *             'uid2': true,
 *             'uid3': false
 *         }
 *         "uid1" and "uid2" will be filtered out in this case
 */
exports.publishAsync = function(subscribedChannel, packet) {
    packet.socketId = Socket.id;
    return new Promise(function(resolver, rejecter) {
        if (Socket.getState() !== 'open') {
            return _handleConnectionFail('server connection lost');
        }
        return Socket.publish(subscribedChannel, packet, function(err) {
            return (err ? rejecter(err) : resolver(true));
        });
    }).catch(function(err) {
        SharedUtils.printError('socketManager.js', 'publishAsync', err);
        return false;
    });
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
            return _handleConnectionFail('server connection lost');
        }
        if (Socket.isSubscribed(subscribeReq)) {
            return resolver(true);
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
            return _handleConnectionFail('server connection lost');
        }
        Socket.destroyChannel(subscribeReq);
        return true;
    }).catch(function(err) {
        SharedUtils.printError('socketManager.js', 'unsubscribeAsync', err);
        return false;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check target subscription request has been completed or not
 *
 * @param {String}        subscribeReq, the sbuscription requsest
 */
exports.hasSubscription = function(subscribeReq) {
    return Socket.isSubscribed(subscribeReq);
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: the evt watcher is used to handle all datas come from 
 *               current subscriptions
 * NOTE: _evtWatcher will use the packet.clientHandler which included in packet
 *      to handle the coming data
 *
 * @param {String}        subscribeReq, the sbuscription requsest
 * @param {Object}        packet, json object come from subscription CHANNEL
 */
function _evtWatcher(subscription, packet) {
    return Promise.try(function() {
        return require('./' + packet.service + 'Service');
    }).then(function(service) {
        return service[packet.clientHandler].call(service, packet.params);
    }).catch(function(err) {
        SharedUtils.printError('socketManager.js', '_evtWatcher', err);
    });
}

/**
 * @Author: George_Chen
 * @Description: used to handle socket connection failure
 *
 * @param {String}        errMsg, connection failure message
 */
function _handleConnectionFail(errMsg) {
    location.assign('/app/error?status=503&explaination=' + errMsg);
}
