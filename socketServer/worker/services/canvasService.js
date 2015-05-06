'use strict';
var Promise = require('bluebird');
var PoolModule = require('generic-pool');
var Canvas = require('canvas');
var Image = Canvas.Image;
var SharedUtils = require('../../../sharedUtils/utils');

var BOARD_WIDTH = 900;
var BOARD_HEIGHT = 500;
// pool will be released after idle for 30 seconds
var POOL_IDLE_TIMEOUT_IN_MILLISECOND = 30000;
// priority will set to 2 level, "0" and "1", which "0" is high priority
var POOL_PRIORITY_LEVELS = 2;
// the maximum pool size
var POOL_SIZE = 3;

/**
 * the canvas pool
 */
var CanvasPool = PoolModule.Pool({
    name: 'canvas',
    create: function(callback) {
        var canvasObj = {
            canvas: new Canvas(BOARD_WIDTH, BOARD_HEIGHT),
            img: new Image()
        };
        canvasObj.ctx = canvasObj.canvas.getContext('2d');
        callback(null, canvasObj);
    },
    destroy: function(canvasObj) {
        canvasObj.canvas = null;
        canvasObj.img = null;
        canvasObj.ctx = null;
    },
    max: POOL_SIZE,
    priorityRange: POOL_PRIORITY_LEVELS,
    idleTimeoutMillis: POOL_IDLE_TIMEOUT_IN_MILLISECOND,
    /**
     * if true, logs via console.log - can also be a function
     * TODO: use debug() module to replace it ?
     */
    log: false
});

/**
 * @Author: George_Chen
 * @Description: get the canvas object from canvas pool based on priority
 *
 * @param {Boolean}         isHighPriority, specify high priority job or not
 */
function _getCanvas(isHighPriority) {
    var priority = (isHighPriority ? 0 : 1);
    return new Promise(function(resolver, rejector) {
        CanvasPool.acquire(function(err, canvasObj) {
            return (err ? rejector(err) : resolver(canvasObj));
        }, priority);
    });
}

/**
 * @Author: George_Chen
 * @Description: to generate new image based on image and records
 *
 * @param {Object}          canvasObj, the canvas object stored at canvasPool
 * @param {Buffer}          baseImg, the base image chunks
 * @param {Array}           records, draw records
 */
function _generateImg(canvasObj, baseImg, records) {
    return Promise.try(function() {
        return _drawImg(canvasObj, baseImg);
    }).then(function() {
        return _drawRecords(canvasObj, records).then(function() {
            var newImg = canvasObj.canvas.toBuffer();
            _release(canvasObj);
            return newImg;
        });
    }).catch(function(err) {
        SharedUtils.printError('canvasService.js', '_generateImg', err);
        _release(canvasObj);
        throw err;
    });
}

/**
 * @Author: George_Chen
 * @Description: relase the canvasObj back to canvasObj
 *
 * @param {Object}          canvasObj, the canvas object stored at canvasPool
 */
function _release(canvasObj) {
    canvasObj.img.src = null;
    canvasObj.ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    CanvasPool.release(canvasObj);
}

/**
 * @Author: George_Chen
 * @Description: to draw the base image on new canvas object
 *
 * @param {Object}          canvasObj, the canvas object stored at canvasPool
 * @param {Buffer}          baseImg, the base image chunks
 */
function _drawImg(canvasObj, baseImg) {
    if (baseImg.length > 0) {
        canvasObj.img.src = baseImg;
        canvasObj.ctx.drawImage(canvasObj.img, 0, 0);
    }
}

/**
 * @Author: George_Chen
 * @Description: draw records on canvas object
 *
 * @param {Object}          canvasObj, the canvas object stored at canvasPool
 * @param {Array}           records, draw records
 */
function _drawRecords(canvasObj, records) {
    var ctx = canvasObj.ctx;
    return Promise.each(records, function(doc) {
        return SharedUtils.fastArrayMap(doc.record, function(rawData) {
            _draw(ctx, _deSerializeRecordData(rawData), doc.drawOptions);
        });
    });
}

/**
 * @Author: George_Chen
 * @Description: the low-level implementation of drawing
 *
 * @param {Object}          ctx, the canvas 2d context
 * @param {Object}          raw, rawData of draw record
 * @param {Object}          options, draw options
 */
function _draw(ctx, raw, options) {
    ctx.beginPath();
    if (options.mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
    }
    if (options.mode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = options.strokeStyle;
    }
    ctx.lineCap = options.lineCap;
    ctx.lineWidth = options.lineWidth;
    ctx.moveTo(Number(raw.fromX), Number(raw.fromY));
    ctx.lineTo(Number(raw.toX), Number(raw.toY));
    ctx.stroke();
    ctx.closePath();
}

/**
 * @Author: George_Chen
 * @Description: deserialize raw record data
 *
 * @param {Object}          rawData, rawData of draw record
 */
function _deSerializeRecordData(rawData) {
    return {
        fromX: rawData[0],
        fromY: rawData[1],
        toX: rawData[2],
        toY: rawData[3]
    };
}

/**
 * Public API
 * @Author: George_Chen
 * @Description: use base image and draw records to generate new image file
 *
 * @param {Buffer}          baseImg, the base image chunks
 * @param {Array}           records, draw records
 * @param {Boolean}         isHighPriority, specify high priority job or not
 */
exports.generateImgAsync = function(baseImg, records, isHighPriority) {
    return Promise.join(
        SharedUtils.argsCheckAsync(baseImg, 'buffer'),
        SharedUtils.argsCheckAsync(records, 'array'),
        SharedUtils.argsCheckAsync(isHighPriority, 'boolean'),
        function() {
            return _getCanvas(isHighPriority);
        }).then(function(canvasObj) {
            return _generateImg(canvasObj, baseImg, records);
        }).catch(function(err) {
            SharedUtils.printError('canvasService.js', 'generateImgAsync', err);
            return null;
        });
};
