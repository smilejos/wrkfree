'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var RtcStorage = StorageManager.getService('Rtc');
var KueUtils = require('./kueUtils');

/**
 * setup rtc params
 */
var Configs = require('../../../configs/config');
var Params = Configs.get().params.rtc;
if (!Params) {
    throw new Error('can not get rtc params');
}
var QUEUE_TYPE = Params.workQueueType;
var NOTIFICATION_DELAY = Params.notificationDelayInMSecond;
var NOTIFICATION_TIMEOUT = Params.notificationTimeoutInMSecond;

/**
 * the work queue object based on redis,
 */
var Queue = KueUtils.getKue();

/**
 * the worker object of socket cluster
 */
var SocketWorker = null;
/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: set the worker instance to current rtcWorker 
 *
 * @param {Object}          worker, worker of socketCluster
 */
exports.setSocketWorker = function(worker) {
    if (!worker) {
        return console.log('worker is not correctly set');
    }
    SocketWorker = worker;
};


/**
 * Public API
 * @Author: George_Chen
 * @Description: to push rtc conference notification to queue
 *
 * @param {String}          channelId, channel id
 */
exports.pushNotification = function(channelId) {
    var jobInfo = {
        cid: channelId
    };
    return _enqueueAsync(jobInfo, 0)
        .catch(function(err) {
            SharedUtils.printError('rtcWorker.js', 'pushNotification', err);
            return RtcStorage.releaseSessionAsync(channelId);
        });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: handler for pushing conference notification
 *
 * @param {String}          cid, channel id
 * @param {Object}          session, the rtc session sdps
 */
function _notifyConference(cid, members) {
    var channelPrefixes = ['channel', 'notification'];
    return Promise.map(channelPrefixes, function(prefix) {
        var channel = prefix + ':' + cid;
        var data = {
            service: 'rtc',
            clientHandler: (prefix === 'channel' ? 'onConference' : 'notifyConferenceCall'),
            params: {
                channelId: cid,
                clients: members
            }
        };
        return new Promise(function(resolver, rejector) {
            SocketWorker.global.publish(channel, data, function(err) {
                return (err ? rejector(err) : resolver(true));
            });
        });
    });
}

/**
 * @Author: George_Chen
 * @Description: to enqueue new rtc job to kue
 *
 * @param {Object}          jobInfo, the infomation of kue job
 * @param {Number}          delay,(optional) the delay time of enqueue job
 */
function _enqueueAsync(jobInfo, delay) {
    var delayTime = NOTIFICATION_DELAY;
    if (SharedUtils.isNumber(delay) && delay >= 0) {
        delay = delay;
    }
    return new Promise(function(resolver, rejector) {
        Queue.create(QUEUE_TYPE, jobInfo)
            .ttl(NOTIFICATION_TIMEOUT)
            .delay(delayTime)
            .save(function(err) {
                return (err ? rejector(err) : resolver(true));
            });
    });
}

/**
 * @Author: George_Chen
 * @Description: push conference notification to clients
 *         NOTE: session description must exist before push notification
 */
Queue.process(QUEUE_TYPE, function(job, done) {
    var cid = job.data.cid;
    return RtcStorage.getSessionMembersAsync(cid)
        .then(function(members){
            return _notifyConference(cid, members)
                .then(function(){
                    var isRepeat = (members && members.length > 0);
                    return (isRepeat ? _enqueueAsync(job.data) : false);
                });
        }).nodeify(done);
});
