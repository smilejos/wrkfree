'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var RtcStorage = StorageManager.getService('Rtc');

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

var DbConfigs = Configs.get().db;
if (!DbConfigs) {
    throw new Error('DB configurations broken');
}

/**
 * the work queue object based on redis,
 */
var Kue = require('kue');
var Queue = Kue.createQueue({
    jobEvents: false,
    redis: {
        host: DbConfigs.cacheEnv.global.host,
        port: DbConfigs.cacheEnv.global.port,
        options: DbConfigs.cacheEnv.global.options,
        db: 3,
    }
});
var _GetJobAsync = Promise.promisify(Kue.Job.get);

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
function _notifyConference(cid, session) {
    var clientChannel = 'channel:' + cid;
    var rtcNotification = {
        service: 'rtc',
        clientHandler: 'onConference',
        params: {
            channelId: cid,
            clients: session.clients
        }
    };
    return new Promise(function(resolver, rejector) {
        SocketWorker.global.publish(clientChannel, rtcNotification, function(err) {
            return (err ? rejector(err) : resolver(true));
        });
    });
}

/**
 * @Author: George_Chen
 * @Description: to remove completed or failed job from kue
 *
 * @param {Number}          jobId, the kue's job id
 */
function _removeJob(jobId) {
    return _GetJobAsync(jobId)
        .then(function(job) {
            job.remove(function(err) {
                if (err) throw err;
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
                if (err) {
                    return rejector(err);
                }
                resolver(true);
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
    return RtcStorage.getSessionAsync(cid, true)
        .then(function(session) {
            var shouldNotify = (session && session.clients.length > 0);
            return (shouldNotify ? _notifyConference(cid, session) : false);
        }).then(function(isRepeat) {
            return (isRepeat ? _enqueueAsync(job.data) : false);
        }).nodeify(done);
});

Queue.on('job complete', function(id) {
    return _removeJob(id)
        .catch(function(err) {
            SharedUtils.printError('rtcWorker.js', 'Queue-jobComplete', err);
        });
}).on('job failed', function(id, failReason) {
    SharedUtils.printError('rtcWorker.js', 'Queue-failed', new Error(failReason));
    return _removeJob(id)
        .catch(function(err) {
            SharedUtils.printError('rtcWorker.js', 'Queue-failed', err);
        });
});
