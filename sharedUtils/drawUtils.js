'use strict';
var SharedUtils = require('./utils');
var Promise = require('bluebird');
var Configs = require('../configs/config');
var DrawParams = Configs.get().params.draw;

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * @Public API
 * @Author: George_Chen
 * @Description: check the draws chunks is valid or not
 *         NOTE:
 *         chunks[0] => fromX
 *         chunks[1] => fromY
 *         chunks[2] => toX
 *         chunks[3] => toY
 * @param {Array}       chunks, the rawData of draw record
 */
exports.checkDrawChunksAsync = function(chunks) {
    return Promise.map(chunks, function(position) {
        if (position < 0) {
            throw new Error('draw position is invlid');
        }
        return position;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: load the base image and draw records to target canvas
 *
 * @param {Object}          canvas, html5 canvas instance
 * @param {Object}          imageElement, html5 image element
 * @param {String}          imgSrc, the base image data url
 * @param {Array}           records, an array of drawRecord documents
 */
exports.loadCanvasAsync = function(canvas, imageElement, imgSrc, records) {
    var self = this;
    return Promise.try(function() {
        return self.cleanCanvas(canvas);
    }).then(function() {
        return _drawFromImage(canvas.getContext('2d'), imageElement, imgSrc);
    }).then(function() {
        _drawFromRecords(canvas.getContext('2d'), records);
        return canvas;
    }).catch(function(err) {
        SharedUtils.printError('drawUtils.js', 'loadCanvasAsync', err);
        return null;
    });
};

/**
 * TODO: use 'cleanCanvas' on future
 * Public API
 * @Author: George_Chen
 * @Description: generate a clean canvas drawRecord document
 *
 * @param {Object}          canvas, html5 canvas object
 */
exports.generateCleanRecord = function(cid, bid) {
    return {
        channelId: cid,
        boardId: bid,
        record: [
            [0, 0, DrawParams.boardWidth, DrawParams.boardHeight]
        ],
        isUndo: false,
        isArchived: false,
        drawOptions: {
            mode: 'eraser',
            lineWidth: DrawParams.boardWidth
        },
        drawTime: Date.now()
    };
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: clean all pixels on target canvas
 *
 * @param {Object}          canvas, html5 canvas object
 */
exports.cleanCanvas = function(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

/**
 * @Author: George_Chen
 * @Description: the low-level implementation of drawing
 *         NOTE: only for 'pen' and 'eraser' mode
 *
 * @param {Object}          ctx, the canvas 2d context
 * @param {Object}          raw, rawData of draw record
 * @param {Object}          options, draw options
 */
exports.draw = function(ctx, raw, options) {
    ctx.beginPath();
    if (options.mode === 'eraser') {
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
    // restore the composite mode back to default
    ctx.globalCompositeOperation = 'source-over';
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: serialize record data to an array
 *
 * @param {Object}          recordData, recordData object
 */
exports.serializeRecordData = function(recordData) {
    return [
        recordData.fromX,
        recordData.fromY,
        recordData.toX,
        recordData.toY
    ];
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: deserialize raw record data
 *
 * @param {Object}          rawData, rawData of draw record
 */
exports.deSerializeRecordData = function(rawData) {
    return {
        fromX: rawData[0],
        fromY: rawData[1],
        toX: rawData[2],
        toY: rawData[3]
    };
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to generate a unique draw view id
 *
 * @param {String}          channelId, the channel id
 * @param {Number}          boardId, the draw board id
 */
exports.getDrawViewId = function(channelId, boardId) {
    return channelId + boardId;
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: draw the canvas context from a image element
 *
 * @param {Object}          ctx, the canvas 2d context
 * @param {Object}          imageElement, the html5 image element
 * @param {String}          imageSrc, the image source data url
 */
function _drawFromImage(ctx, imageElement, imageSrc) {
    if (imageSrc && imageSrc.length > 0) {
        imageElement.src = imageSrc;
        ctx.drawImage(imageElement, 0, 0);
    }
}

/**
 * @Author: George_Chen
 * @Description: draw the canvas context from drawRecord documents
 *
 * @param {Object}          ctx, the canvas 2d context
 * @param {Array}           drawDocs, an array of drawRecord documents
 */
function _drawFromRecords(ctx, drawDocs) {
    return Promise.each(drawDocs, function(doc) {
        SharedUtils.fastArrayMap(doc.record, function(rawData) {
            var data = exports.deSerializeRecordData(rawData);
            exports.draw(ctx, data, doc.drawOptions);
        });
    });
}
