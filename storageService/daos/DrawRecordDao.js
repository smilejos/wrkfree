'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var DrawUtils = require('../../sharedUtils/drawUtils');
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
exports.saveAsync = function(channelId, boardId, record, drawOptions) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        record: DrawUtils.checkDrawChunksAsync(record),
        drawOptions: SharedUtils.argsCheckAsync(drawOptions, 'drawOptions'),
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
    }).map(function(doc) {
        return DbUtil.transformTimeAsync(doc, 'drawTime');
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao.js', 'findByBoardAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find the latest draw record on the current channel
 *
 * @param {String}          channelId, channel id
 */
exports.findLatestByChannelAsync = function(channelId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        return _findLatest(condition);
    }).catch(function(err) {
        SharedUtils.printError('DrawBoardDao.js', 'findLatestByChannelAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find the latest draw record on the current board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.findLatestByBoardAsync = function(channelId, boardId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId')
    }).then(function(condition) {
        return _findLatest(condition);
    }).catch(function(err) {
        SharedUtils.printError('DrawBoardDao.js', 'findLatestByBoardAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: archive number of documents on the current board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Number}          number, set how many docs to be archived
 */
exports.archiveByNumberAsync = function(channelId, boardId, number) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(boardId, 'boardId'),
        isArchived: false
    }).then(function(condition) {
        var updateDoc = {
            isArchived: true
        };
        if (number > 1) {
            return _archiveMany(condition, updateDoc, number);
        }
        return _archiveOne(condition, updateDoc);
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao', 'ArchiveByNumberAsync', err);
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
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
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
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return Model.findOneAndUpdate(condition, updateDoc, options).select('_id').execAsync();
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao', 'restoreUndoAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove all archived records on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.removeArchivesAsync = function(channelId, boardId) {
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
        SharedUtils.printError('DrawRecordDao', 'removeArchivesAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove all undo records on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.removeUndosAsync = function(channelId, boardId) {
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
        SharedUtils.printError('DrawRecordDao', 'removeUndosAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove records of the current channel board
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
        SharedUtils.printError('DrawRecordDao.js', 'removeByBoardAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove all documents under the current channel
 *
 * @param {String}          channelId, channel id
 */
exports.removeByChannelAsync = function(channelId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        return _remove(condition);
    }).catch(function(err) {
        SharedUtils.printError('DrawRecordDao.js', 'removeByChannelAsync', err);
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
 * @Description: based on query condition, find the latest one
 *
 * @param {Object}          condition, mongodb query condition
 */
function _findLatest(condition) {
    var sortOrder = DbUtil.getSort('drawTime', 'descending');
    return Model.findOne(condition)
        .sort(sortOrder)
        .lean()
        .execAsync();
}

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

/**
 * @Author: George_Chen
 * @Description: based on query condition, archive the oldest document
 *
 * @param {Object}          condition, mongodb query condition
 * @param {Object}          updateDoc, update json document
 */
function _archiveOne(condition, updateDoc) {
    var options = {
        sort: DbUtil.getSort('drawTime', 'ascending')
    };
    // make mongoose cache outdated
    Model.find()._touchCollectionCheck(true);
    return Model.findOneAndUpdate(condition, updateDoc, options)
        .select('_id')
        .execAsync()
        .then(function(result) {
            return (result ? 1 : null);
        });
}

/**
 * @Author: George_Chen
 * @Description: based on query condition, archive number of outdated docuements
 *
 * @param {Object}          condition, mongodb query condition
 * @param {Object}          updateDoc, update json document
 */
function _archiveMany(condition, updateDoc, number) {
    var fields = {
        drawTime: DbUtil.select(true)
    };
    var sortOrder = DbUtil.getSort('_id', 'ascending');
    return Model.find(condition, fields).sort(sortOrder).limit(number).execAsync()
        .then(function(docs) {
            if (docs.length === 0) {
                return null;
            }
            var options = {
                multi: (number > 1)
            };
            condition._id = {
                $lte: docs[docs.length - 1]._id
            };
            return Model.update(condition, updateDoc, options).execAsync();
        });
}
