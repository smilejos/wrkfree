'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var DbUtil = require('../dbUtils');
var Model = Mongoose.model('DrawRecord');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to save new drawing record
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Array}           record, an array of drawing raw data
 */
exports.saveAsync = function(channelId, boardId, record) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        record: _checkRecord(record)
    }).then(function(drawDoc) {
        var newDraw = new Model(drawDoc);
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return newDraw.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao.js', 'saveAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user find drawing records of the current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.findByBoardAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId')
    }).then(function(condition) {
        return _find(false, condition);
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao.js', 'findByBoardAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: archive the oldest unarchived record of current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.setNewArchiveAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        isArchived: false,
        isUndo: false
    }).then(function(condition) {
        var updateDoc = {
            isArchived: true
        };
        var options = {
            sort: DbUtil.getSort('drawTime', 'ascending')
        };
        return Model.findOneAndUpdate(condition, updateDoc, options).select('_id').execAsync();
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao', 'setNewArchiveAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: undo the latest normal record of current channel board.
 *         NOTE: normal record means record without "archived" and "undo"
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.setNewUndoAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        isArchived: false,
        isUndo: false
    }).then(function(condition) {
        var updateDoc = {
            isUndo: true
        };
        var options = {
            sort: DbUtil.getSort('drawTime', 'descending')
        };
        return Model.findOneAndUpdate(condition, updateDoc, options).select('_id').execAsync();
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao', 'setNewUndoAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: restore the undo status of oldest undo record 
 *               on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.restoreUndoAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        isUndo: true
    }).then(function(condition) {
        var updateDoc = {
            isUndo: false
        };
        var options = {
            sort: DbUtil.getSort('drawTime', 'ascending')
        };
        return Model.findOneAndUpdate(condition, updateDoc, options).select('_id').execAsync();
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao', 'restoreUndoAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete all archived records on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.delArchivesAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        isArchived: true
    }).then(function(condition) {
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return Model.removeAsync(condition);
    }).then(function(result) {
        return DbUtil.checkDocumentRemoveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao', 'delArchivesAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete all undo records on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.delUndosAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        isUndo: true
    }).then(function(condition) {
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return Model.removeAsync(condition);
    }).then(function(result) {
        return DbUtil.checkDocumentRemoveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao', 'delUndosAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the counts of actived draw records on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.countActivedRecordsAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        isArchived: false
    }).then(function(condition) {
        return Model.count(condition).execAsync();
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao', 'countActivedRecordsAsync', err);
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
 * @Description: an low-level implementation of find operation
 *
 * @param {Boolean}         isFindOne, use "findOne" or "find" based on this flag
 * @param {String}          condition, the mongoose query condition
 * @param {String}          selectFields, used to inform mongoose which fields should be taken
 */
function _find(isFindOne, condition, selectFields) {
    var fields = (selectFields ? selectFields : DbUtil.selectOriginDoc());
    return (isFindOne ? Model.findOne(condition, fields) : Model.find(condition, fields))
        .lean()
        .execAsync();
}

/**
 * @Author: George_Chen
 * @Description: check draw record is valid or not
 *         NOTE: draw record is a array of draw points 
 *         record[0] = fromX
 *         record[1] = fromY
 *         record[2] = toX
 *         record[3] = toY
 *         record[4] = colorCode
 *
 * @param {Array}           record, an array of drawing raw data
 */
function _checkRecord(record) {
    return Promise.map(record, function(rawData) {
        _checkDrawColor(rawData[rawData.length - 1]);
        for (var i = 0; i < rawData.length - 2; ++i) {
            _checkDrawPosition(rawData[i]);
        }
        return rawData;
    });
}

/**
 * @Author: George_Chen
 * @Description: check the drawing point position is valid or not
 *
 * @param {Number}           value, position value of draw point 
 */
function _checkDrawPosition(value) {
    if (value < 0) {
        throw new Error('draw position is invlid');
    }
}

/**
 * @Author: George_Chen
 * @Description: check the color code is valid or not
 *
 * @param {String}           value, the color code 
 */
function _checkDrawColor(value) {
    if (value.indexOf('#')) {
        throw new Error('draw color is invlid');
    }
}
