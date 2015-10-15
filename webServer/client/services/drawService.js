'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var OnDrawing = require('../actions/draw/onDrawing');
var OnSaveDrawRecord = require('../actions/draw/onSaveDrawRecord');
var OnCleanDrawBoard = require('../actions/draw/onCleanDrawBoard');
var OnDrawUndo = require('../actions/draw/onDrawUndo');
var OnDrawRedo = require('../actions/draw/onDrawRedo');
var OnAddDrawBoard = require('../actions/draw/onAddDrawBoard');
var OnPreviewUpdated = require('../actions/draw/onPreviewUpdated');

/**
 * handler for handling event that draw board preview updated
 */
exports.onPreviewUpdated = function(data) {
    return SocketUtils.execAction(OnPreviewUpdated, data, 'onPreviewUpdated');
};

/**
 * handler for handling remote drawer drawing
 */
exports.onDraw = function(data) {
    return SocketUtils.execAction(OnDrawing, data, 'onDraw');
};

/**
 * handler for handling remote drawer finish his current draw
 */
exports.onSaveDrawRecord = function(data) {
    return SocketUtils.execAction(OnSaveDrawRecord, data, 'onSaveDrawRecord');
};

/**
 * handler for handling remote drawer add new draw board
 */
exports.onAddBoard = function(data) {
    return SocketUtils.execAction(OnAddDrawBoard, data, 'onAddBoard');
};

/**
 * handler for handling remote drawer undo the last draw
 */
exports.onDrawUndo = function(data) {
    return SocketUtils.execAction(OnDrawUndo, data, 'onDrawUndo');
};

/**
 * handler for handling remote drawer redo to next draw
 */
exports.onDrawRedo = function(data) {
    return SocketUtils.execAction(OnDrawRedo, data, 'onDrawRedo');
};

/**
 * handler for handling remote drawer clean the specific board
 */
exports.onCleanDrawBoard = function(data) {
    return SocketUtils.execAction(OnCleanDrawBoard, data, 'onCleanDrawBoard');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: publish the realtime drawing to current channel
 *       
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 * @param {Array}           data.chunks, the raw chunks of current drawing
 */
exports.drawAsync = function(data) {
    var channel = SocketUtils.setChannelReq(data.channelId);
    var packet = _setPacket('drawAsync', 'onDraw', data);
    return _publish(channel, packet, 'drawAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: inform all members in channel that drawer has finished his draw
 *         NOTE: user need to inform all clients that how many draw chunks
 *               that he has sent.
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 * @param {Number}          data.chunksNum, how many chunks that drawer sent
 * @param {Object}          data.drawOptions, the draw options for this record
 */
exports.saveRecordAsync = function(data) {
    var channel = SocketUtils.setChannelReq(data.channelId);
    var packet = _setPacket('saveRecordAsync', 'onSaveDrawRecord', data);
    return _publish(channel, packet, 'saveRecordAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: user can use this function to generate a clean board draw record
 *               and publish to channel
 * 
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 */
exports.cleanDrawBoardAsync = function(data) {
    var channel = SocketUtils.setChannelReq(data.channelId);
    var packet = _setPacket('cleanDrawBoardAsync', 'onCleanDrawBoard', data);
    return _publish(channel, packet, 'cleanDrawBoardAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to add new drawing boards
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardIdx, the new board index
 */
exports.addBoardAsync = function(data) {
    var channel = SocketUtils.setChannelReq(data.channelId);
    var packet = _setPacket('addBoardAsync', 'onAddBoard', data);
    return _publish(channel, packet, 'addBoardAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to undo the draw record on current board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 */
exports.drawUndoAsync = function(data) {
    var channel = SocketUtils.setChannelReq(data.channelId);
    var packet = _setPacket('drawUndoAsync', 'onDrawUndo', data);
    return _publish(channel, packet, 'drawUndoAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to redo the draw record on current board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data._bid, the board uuid
 */
exports.drawRedoAsync = function(data) {
    var channel = SocketUtils.setChannelReq(data.channelId);
    var packet = _setPacket('drawRedoAsync', 'onDrawRedo', data);
    return _publish(channel, packet, 'drawRedoAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get all information on draw board
 *         NOTE: infomration include all draw records and base image
 *               on current board
 *       
 * @param {String}          data.channelId, the channel id
 * @param {String}          data.bid, the board uuid
 */
exports.getDrawBoardAsync = function(data) {
    var packet = _setPacket('getDrawBoardAsync', null, data);
    return _request(packet, 'getDrawBoardAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get the board uuid based on channel and board index
 *       
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardIdx, the draw board id
 */
exports.getBoardIdAsync = function(data) {
    var packet = _setPacket('getBoardIdAsync', null, data);
    return _request(packet, 'getBoardIdAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get latest updated draw board id
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 */
exports.getLatestBoardIdAsync = function(data) {
    var packet = _setPacket('getLatestBoardIdAsync', null, data);
    return _request(packet, 'getLatestBoardIdAsync');
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for handling socekt request
 *              events on drawService
 *         NOTE: caller is just for print error log; if error happen,
 *              we can know the root cause from which caller
 *       
 * @param {Object}          packet, the packet for request
 * @param {String}          caller, the caller function name
 */
function _request(packet, caller) {
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('drawService.js', caller, err);
            return null;
        });
}

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for handling socekt publish
 *              events on drawService
 *         NOTE: caller is just for print error log; if error happen,
 *              we can know the root cause from which caller
 *
 * @param {String}          subscription, socketCluster subscription
 * @param {Object}          packet, the packet for request
 * @param {String}          caller, the caller function name
 */
function _publish(subscription, packet, caller) {
    return SocketManager.publishAsync(subscription, packet)
        .catch(function(err) {
            SharedUtils.printError('drawService.js', caller, err);
            return null;
        });
}

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for wrap the socket formated
 *               packet
 *
 * @param {String}          serverApi, the server handler api
 * @param {String}          clientApi, the client receiver api
 * @param {Object}          data, the request parameters
 */
function _setPacket(serverApi, clientApi, data) {
    return SocketUtils.setPacket('draw', serverApi, clientApi, data);
}
