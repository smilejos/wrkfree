'use strict';
var SharedUtils = require('./utils');
var Promise = require('bluebird');
var Configs = require('../configs/config');
var BOARD_WIDTH = Configs.get().params.draw.boardWidth;
var BOARD_HEIGHT = Configs.get().params.draw.boardHeight;
if (!SharedUtils.isNumber(BOARD_WIDTH) || !SharedUtils.isNumber(BOARD_HEIGHT)) {
    throw new Error('error while on getting draw related params');
}

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * @Public API
 * @Author: George_Chen
 * @Description: check the draws chunks is valid or not
 * 
 * @param {Number}       chunks.fromX, the x-axis value of prev draw position
 * @param {Number}       chunks.fromY, the y-axis value of prev draw position
 * @param {Number}       chunks.toX, the x-axis value of next draw position
 * @param {Number}       chunks.toY, the y-axis value of next draw position
 */
exports.checkDrawChunksAsync = function(chunks) {
    return Promise.props({
        fromX: _checkDrawPosition(chunks.fromX),
        fromY: _checkDrawPosition(chunks.fromY),
        toX: _checkDrawPosition(chunks.toX),
        toY: _checkDrawPosition(chunks.toY),
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: check the draws record is valid or not
 *         NOTE: currently we only assume that all elements in the record
 *               is normal drawing chunks
 * 
 * @param {Array}       record, the data of draw record
 */
exports.checkDrawRecordAsync = function(record) {
    return Promise.map(record, function(chunks) {
        return exports.checkDrawChunksAsync(chunks);
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
        record: [{
            fromX: 0,
            fromY: 0,
            toX: BOARD_WIDTH,
            toY: BOARD_HEIGHT
        }],
        isUndo: false,
        isArchived: false,
        drawOptions: {
            mode: 'eraser',
            lineWidth: BOARD_WIDTH
        },
        drawTime: Date.now()
    };
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: clean all pixels on target canvas
 *         NOTE: http://www.w3schools.com/tags/canvas_settransform.asp
 *               due to resizing canvas, so clear method has much works to do
 *
 * @param {Object}          canvas, html5 canvas object
 */
exports.cleanCanvas = function(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Will always clear the right space
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
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
        if (!doc.isUndo) {
            SharedUtils.fastArrayMap(doc.record, function(rawData) {
                exports.draw(ctx, rawData, doc.drawOptions);
            });
        }
    });
}

/**
 * @Author: George_Chen
 * @Description: check draw chunks position is valid or not
 *
 * @param {Number}          position, the draw position value
 */
function _checkDrawPosition(position) {
    if (!SharedUtils.isNumber(position) || position < 0) {
        throw new Error('invalid draw position');
    }
    return position;
}
