'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var DrawStorage = StorageManager.getService('Draw');
var DrawWorker = require('../services/drawWorker');
var DrawUtils = require('../../../sharedUtils/drawUtils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling realtime drawing chunks that user published
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 * @param {Array}           data.chunks, the raw chunks of current drawing
 */
exports.drawAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        DrawUtils.checkDrawChunksAsync(data.chunks),
        function(cid, bid, chunks) {
            var uid = socket.getAuthToken();
            return DrawStorage.streamRecordDataAsync(cid, bid, uid, chunks);
        }).then(function(result) {
            var errMsg = 'drawing fail';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('drawHandler.js', 'drawAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: drawer should send this event to inform server that
 *               he already findish his current draw.
 *         NOTE: user need to inform all clients that how many draw chunks
 *               that he has sent.
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 * @param {Number}          data.chunksNum, how many chunks that drawer sent
 * @param {Object}          data.drawOptions, the draw options for this record
 */
exports.saveRecordAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        SharedUtils.argsCheckAsync(data.chunksNum, 'number'),
        SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        function(cid, bid, chunksLength, drawOptions) {
            return DrawStorage.saveRecordAsync(cid, bid, uid, chunksLength, drawOptions);
        }).then(function(result) {
            if (!result) {
                throw new Error('save draw record fail');
            }
            // enqueue a preview image update job
            DrawWorker.setUpdateSchedule(data.channelId, data.boardId, uid);
            return result;
        }).catch(function(err) {
            SharedUtils.printError('drawHandler.js', 'saveRecordAsync', err);
            // inform other members the latest draw saving failure
            socket.global.publish('channel:' + data.channelId, {
                service: 'draw',
                clientHandler: 'onSaveDrawRecord',
                socketId: socket.id,
                params: {
                    channelId: data.channelId,
                    boardId: data.boardId
                }
            });
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: user can use this function to generate a clean board draw record
 *               on current board, then board will be cleaned at same time
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 */
exports.cleanDrawBoardAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
            return DrawStorage.cleanBoardAsync(cid, bid, uid);
        }).then(function(result) {
            var errMsg = 'clean board fail';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('drawHandler.js', 'cleanDrawBoardAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to add new drawing boards
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 */
exports.addBoardAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.newBoardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
            return DrawStorage.addBoardAsync(cid, bid, uid);
        }).then(function(result) {
            var errMsg = 'add new draw board fail';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('drawHandler.js', 'addBoardAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to undo the draw record on current board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 */
exports.drawUndoAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
            return DrawStorage.undoRecordAsync(cid, bid, uid);
        }).then(function(result) {
            var errMsg = 'draw undo fail';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('drawHandler.js', 'drawUndoAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to redo the draw record on current board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 */
exports.drawRedoAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
            return DrawStorage.restoreUndoAsync(cid, bid, uid);
        }).then(function(result) {
            var errMsg = 'draw redo fail';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('drawHandler.js', 'drawRedoAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get all information on the current board
 *         NOTE: infomration include all draw records and base image
 *               on current board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 */
exports.getDrawBoardAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        function(cid, bid) {
            var uid = socket.getAuthToken();
            return DrawStorage.getBoardInfoAsync(cid, bid, uid);
        }).then(function(resource) {
            return DrawWorker.drawBaseImgAsync(resource.board, resource.reocrds);
        }).then(function(result) {
            var errMsg = 'get draw board information fail';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('drawHandler.js', 'getDrawBoardAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get latest updated draw board id
 *         NOTE: it's useful for user to navigate to this board
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 */
exports.getLatestBoardIdAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            return DrawStorage.getLatestBoardIdAsync(cid);
        }).then(function(result) {
            if (result === null) {
                throw new Error('get latest draw board id fail');
            }
            return result;
        }).catch(function(err) {
            SharedUtils.printError('drawHandler.js', 'getLatestBoardIdAsync', err);
            throw err;
        });
};
