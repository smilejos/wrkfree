'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var DbUtil = require('../dbUtils');
var Model = Mongoose.model('DrawPreview');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: create board preview docuemnt of the current channel
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.saveAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId')
    }).then(function(doc) {
        var newPreview = new Model(doc);
        return newPreview.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('DrawPreviewDao.js', 'saveAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: use to update the board preview image chunks
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Buffer}          rawData, the raw data of current base image
 */
exports.updateChunksAsync = function(channelId, boardId, rawData) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId')
    }).then(function(condition) {
        if (!SharedUtils.isBuffer(rawData)) {
            throw new Error('raw data is invalid');
        }
        var updateDoc = {
            chunks: rawData,
            updatedTime: Date.now()
        };
        return Model.findOneAndUpdate(condition, updateDoc).select('_id').execAsync();
    }).catch(function(err) {
        SharedUtils.printError('DrawPreviewDao.js', 'updateChunksAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find the board preview document
 *         NOTE: use findOneAsync() to replace findOne().execAsync() 
 *               is because bugs on return binary data through mongoose cache
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.findByBoardAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId')
    }).then(function(condition) {
        var fields = DbUtil.selectOriginDoc();
        var options = {
            lean: true
        };
        return Model.findOneAsync(condition, fields, options);
    }).catch(function(err) {
        SharedUtils.printError('DrawPreviewDao.js', 'findByBoardAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check board preview document is exist or not
 *         NOTE: timestamp is optional, if we want to find outdated preview document
 *               is exist or not
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Number}          timestamp, the Date timestamp
 */
exports.isExistAsync = function(channelId, boardId, timestamp) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        updatedTime: {
            $lte: timestamp
        }
    }).then(function(condition) {
        return Model.count(condition).execAsync();
    }).then(function(count) {
        return DbUtil.checkDocumentExistStatusAsync(count);
    }).catch(function(err) {
        SharedUtils.printError('DrawPreviewDao.js', 'isExistAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove specific board preview document
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.removeByBoardAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId')
    }).then(function(condition) {
        return _remove(condition);
    }).catch(function(err) {
        SharedUtils.printError('DrawPreviewDao.js', 'removeByBoardAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove all preview documents under the current channel
 *
 * @param {String}          channelId, channel id
 */
exports.removeByChannelAsync = function(channelId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        return _remove(condition);
    }).catch(function(err) {
        SharedUtils.printError('DrawPreviewDao.js', 'removeByChannelAsync', err);
        return null;
    });
};

/**
 * @Author: George_Chen
 * @Description: a low level implementation of mongodb remove
 *
 * @param {Object}          condition, mongodb query condition
 */
function _remove(condition) {
    return Model.removeAsync(condition)
        .then(function(result) {
            return DbUtil.checkDocumentRemoveStatusAsync(result);
        });
}
