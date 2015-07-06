'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var CanvasService = require('./canvasService');
var StorageManager = require('../../../storageService/storageManager');
var DrawStorage = StorageManager.getService('Draw');
var ChannelStorage = StorageManager.getService('Channel');

/**
 * the worker object of socket cluster
 */
var SocketWorker = null;

/**
 * the work queue object based on redis,
 */
var Queue = require('kue').createQueue({
    disableSearch: true
});

var QUEUE_TYPE = 'draw';

/**
 * TODO: we should store this parameter to a global params file
 * used to buffer preview image update request,
 */
var SCHEDULE_BUFFER_TIME_IN_MILISECONDS = 3000;

// used to store the info of scheduled jobs
var Scheduler = {};

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
 * @param {Number}          boardId, the draw board id
 * @param {String}          user, user id
 */
exports.setUpdateSchedule = function(channelId, boardId, user) {
    var scheduleId = _getScheduleId(channelId, boardId);
    if (!Scheduler[scheduleId]) {
        setTimeout(function() {
            _enqueueJob({
                cid: channelId,
                bid: boardId,
                uid: user,
                sentTime: Scheduler[scheduleId]
            });
        }, SCHEDULE_BUFFER_TIME_IN_MILISECONDS);
    }
    Scheduler[scheduleId] = Date.now();
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
        if (newImg) {
            board.baseImg.chunks.buffer = newImg;
        }
        return {
            baseImg: board.baseImg,
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
 * @Description: get the schedule id for update job
 *         NOTE: each board can only create a job during the period of scheduling
 *         
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
function _getScheduleId(channelId, boardId) {
    return channelId + boardId;
}

/**
 * @Author: George_Chen
 * @Description: to enqueue a preview image update job
 *         NOTE: a valid job info here should include, 
 *             [channelId, boardId, uid, sentTime]
 *         
 * @param {Object}          jobInfo, a json data describe job's info
 */
function _enqueueJob(jobInfo) {
    Queue.create(QUEUE_TYPE, jobInfo)
        .save(function(err) {
            _removeSchedule(jobInfo.cid, jobInfo.bid);
            if (err) {
                SharedUtils.printError('drawWorker.js', '_enqueueJob', err);
            }
        });
}

/**
 * @Author: George_Chen
 * @Description: to remove a update job from schedule on current board
 *         
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
function _removeSchedule(channelId, boardId) {
    var sid = _getScheduleId(channelId, boardId);
    Scheduler[sid] = null;
}

/**
 * @Author: George_Chen
 * @Description: to process job dispatched from work queue
 *         NOTE: done() must be called when job is completed
 */
Queue.process(QUEUE_TYPE, function(job, done) {
    var channelId = job.data.cid;
    var boardId = job.data.bid;
    var user = job.data.uid;
    var time = job.data.sentTime;
    return DrawStorage.getPreviewStatusAsync(channelId, boardId, time)
        .then(function(status) {
            if (!status) {
                throw new Error('no preview status found!');
            }
            if (!status.isOutdated) {
                return null;
            }
            return DrawStorage.getBoardInfoAsync(channelId, boardId, user);
        }).then(function(data) {
            return (data ? _drawAndUpdate(data.board, data.reocrds, true) : null);
        }).then(function(result) {
            if (result) {
                _notifyMembers(channelId, boardId);
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
 * @param {String}          bid, the board id
 */
function _notifyMembers(cid, bid) {
    return ChannelStorage.getOnlineMembersAsync(cid)
        .map(function(member) {
            var userChannel = 'user:' + member;
            SocketWorker.global.publish(userChannel, {
                service: 'draw',
                clientHandler: 'onPreviewUpdated',
                params: {
                    channelId: cid,
                    boardId: bid
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
        return _update(board.channelId, board.boardId, newImg, isPreview)
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
        return CanvasService.generateImgAsync(board.baseImg.chunks.buffer, records, false);
    });
}

/**
 * @Author: George_Chen
 * @Description: a low-level function to update the new generated image
 *
 * @param {String}          cid, channel id
 * @param {Number}          bid, the draw board id
 * @param {Buffer}          img, the img chunks
 * @param {Boolean}         isPreview, to inform is preview image or not
 */
function _update(cid, bid, img, isPreview) {
    return Promise.try(function() {
        if (!img) {
            return null;
        }
        if (isPreview) {
            return DrawStorage.updatePreviewImgAsync(cid, bid, img);
        }
        return DrawStorage.updateBaseImgAsync(cid, bid, img);
    });
}
