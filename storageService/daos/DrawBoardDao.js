'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var DbUtil = require('../dbUtils');
var Model = Mongoose.model('DrawBoard');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: create draw board docuemnt of the current channel
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.saveAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId')
    }).then(function(doc) {
        var newBoard = new Model(doc);
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return newBoard.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('DrawBoardDao.js', 'saveAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: use to update the base image of the current channel drawing board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Buffer}          rawData, the raw data of current base image
 */
exports.updateBaseImgAsync = function(channelId, boardId, rawData) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId')
    }).then(function(condition) {
        if (!SharedUtils.isBuffer(rawData)) {
            throw new Error('raw data is invalid');
        }
        var updateDoc = {
            baseImg: {
                contentType: 'image/png',
                encode: 'base64',
                chunks: rawData
            }
        };
        return Model.findOneAndUpdate(condition, updateDoc).select('_id').execAsync();
    }).catch(function(err) {
        SharedUtils.printError('DrawBoardDao.js', 'updateBaseImgAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find the draw board doucment of the current channel
 *         NOTE: use findOneAsync() to replace findOne().execAsync() 
 *               is because bugs on return binary data through mongoose cache
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.findByChannelBoardAsync = function(channelId, boardId) {
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
        SharedUtils.printError('DrawBoardDao.js', 'findByChannelBoardAsync', err);
        return null;
    });
};
