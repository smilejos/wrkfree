'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var CanvasService = require('./canvasService');
var StorageManager = require('../../../storageService/storageManager');
var DrawStorage = StorageManager.getService('Draw');
var ChannelStorage = StorageManager.getService('Channel');
var KueUtils = require('./kueUtils');

/**
 * the work queue object based on redis,
 */
var Queue = KueUtils.getKue();

var QUEUE_TYPE = 'draw';

var Configs = require('../../../configs/config');
/**
 * used to buffer preview image update request,
 */
var SCHEDULE_DELAYED_TIME_IN_MILISECONDS = Configs.get().params.draw.delayForUpdatePreview;
if (!SharedUtils.isNumber(SCHEDULE_DELAYED_TIME_IN_MILISECONDS)) {
    throw new Error('error on getting draw schedule time');
}

// used to store the info of scheduled jobs
var Scheduler = {};

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
 * @Description: to schedule a preview image update job to queue
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {String}          user, user id
 */
exports.setUpdateSchedule = function(channelId, _bid, user) {
    if (!Scheduler[_bid]) {
        setTimeout(function() {
            _enqueueJob({
                cid: channelId,
                _bid: _bid,
                uid: user,
                sentTime: Scheduler[_bid]
            });
        }, SCHEDULE_DELAYED_TIME_IN_MILISECONDS);
    }
    Scheduler[_bid] = Date.now();
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to draw and update base image of draw board
 *
 * @param {Object}          board, the board document
 * @param {Array}           records, a array of drawRecord documents
 */
exports.drawBaseImgAsync = function(board, records) {
    var activeRecords = [];
    return Promise.try(function() {
        var archives = [];
        SharedUtils.fastArrayMap(records, function(doc) {
            return (doc.isArchived ? archives.push(doc) : activeRecords.push(doc));
        });
        return archives;
    }).then(function(archives) {
        return _drawAndUpdate(board, archives, false);
    }).then(function(newImg) {
        var imgInfo = {
            contentType: 'image/png',
            encode: 'base64',
            chunks: (newImg ? newImg : board.content)
        };
        return {
            bid: board.bid,
            baseImg: imgInfo,
            records: activeRecords,
            isUpdated: !!newImg
        };
    }).catch(function(err) {
        SharedUtils.printError('drawWorker.js', 'drawBaseImgAsync', err);
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
 * @Description: to enqueue a preview image update job
 *         NOTE: a valid job info here should include, 
 *             [channelId, _bid, uid, sentTime]
 *         
 * @param {Object}          jobInfo, a json data describe job's info
 */
function _enqueueJob(jobInfo) {
    Queue.create(QUEUE_TYPE, jobInfo)
        .save(function(err) {
            Scheduler[jobInfo._bid] = null;
            if (err) {
                SharedUtils.printError('drawWorker.js', '_enqueueJob', err);
            }
        });
}

/**
 * @Author: George_Chen
 * @Description: to process job dispatched from work queue
 *         NOTE: done() must be called when job is completed
 */
Queue.process(QUEUE_TYPE, function(job, done) {
    var cid = job.data.cid;
    var _bid = job.data._bid;
    var user = job.data.uid;
    return DrawStorage.getBoardInfoAsync(cid, _bid, user)
        .then(function(data) {
            return (data ? _drawAndUpdate(data.board, data.reocrds, true) : null);
        }).then(function(result) {
            if (result) {
                _notifyMembers(cid, _bid);
            }
            return done();
        }).catch(function(err) {
            SharedUtils.printError('drawWorker.js', 'Queue.process', err);
            return done(err);
        });
});

/**
 * @Author: George_Chen
 * @Description: notify channel online members that draw preview has been updated
 *
 * @param {String}          cid, the channel id
 * @param {String}          _bid, the board uuid
 */
function _notifyMembers(cid, _bid) {
    return ChannelStorage.getOnlineMembersAsync(cid)
        .map(function(member) {
            var userChannel = 'user:' + member;
            SocketWorker.global.publish(userChannel, {
                service: 'draw',
                clientHandler: 'onPreviewUpdated',
                params: {
                    channelId: cid,
                    _bid: _bid
                }
            });
        }).catch(function(err) {
            SharedUtils.printError('drawWorker.js', '_notifyMembers', err);
        });
}

/**
 * @Author: George_Chen
 * @Description: based on data from db to draw and update the image, 
 *         NOTE: use "isPreview" to specify "previewImg" or "baseImg"
 *
 * @param {Object}          board, the board document
 * @param {Array}           records, a array of drawRecord documents
 * @param {Boolean}         isPreview, to inform is preview image or not
 */
function _drawAndUpdate(board, records, isPreview) {
    return _draw(board, records).then(function(newImg) {
        return _update(board.channelId, board.bid, newImg, isPreview)
            .then(function(result) {
                return (result ? newImg : null);
            });
    });
}

/**
 * TODO: for preview image, we should draw a small size 
 * @Author: George_Chen
 * @Description: based on data from db to draw the image, 
 * 
 * @param {Object}          board, the board document
 * @param {Array}           records, a array of drawRecord documents
 */
function _draw(board, records) {
    return Promise.try(function() {
        if (records.length === 0) {
            return null;
        }
        return CanvasService.generateImgAsync(board.content, records, false);
    });
}

/**
 * @Author: George_Chen
 * @Description: a low-level function to update the new generated image
 *
 * @param {String}          cid, channel id
 * @param {String}          _bid, the board uuid
 * @param {Buffer}          img, the img chunks
 * @param {Boolean}         isPreview, to inform is preview image or not
 */
function _update(cid, _bid, img, isPreview) {
    return Promise.try(function() {
        var imgType = (isPreview ? 'preview' : 'base');
        if (!img) {
            return null;
        }
        return DrawStorage.updateBoardImgAsync(cid, _bid, imgType, img);
    });
}
