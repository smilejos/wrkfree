'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var DrawUtils = require('../../sharedUtils/drawUtils');
var LogUtils = require('../../sharedUtils/logUtils');
var LogCategory = 'STORAGE';
var Promise = require('bluebird');
var ChannelStoreage = require('./ChannelService');
var PgDrawRecord = require('../pgDaos/PgDrawRecord');
var PgDrawBoard = require('../pgDaos/PgDrawBoard');

var Configs = require('../../configs/config');

// used to limit the active reocrds number
var ACTIVED_RECORD_LIMIT = Configs.get().params.draw.activeRecordLimit;

if (!SharedUtils.isNumber(ACTIVED_RECORD_LIMIT)) {
    throw new Error('draw parameters missing');
}

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: add draw board on current channel
 *
 * @param {String}          channelId, channel id
 * @param {String}          member, the member uid
 */
exports.addBoardAsync = function(channelId, member) {
    var logMsg = 'channel [' + channelId + '] add new board';
    LogUtils.info(LogCategory, null, logMsg);
    return _ensureAuth(member, channelId).then(function(){
        return PgDrawBoard.saveAsync(channelId);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in DrawService.addBoardAsync()');
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: delete draw board on current channel
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          member, the member uid
 */
exports.delBoardAsync = function(channelId, boardId, member) {
    var logMsg = 'channel [' + channelId + '] delete board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    // TODO: only host can delete board
    // 
    // return _ensureAuth(member, channelId)
    //     .then(function() {
    //         return _delBoard(channelId, boardId);
    //     }).catch(function(err) {
    //         LogUtils.error(LogCategory, {
    //             args: SharedUtils.getArgs(arguments),
    //             error: err.toString()
    //         }, 'error in DrawService.delBoardAsync()');
    //         return null;
    //     });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: clean out all draws on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 */
exports.cleanBoardAsync = function(channelId, _bid) {
    var logMsg = 'channel [' + channelId + '] clean board [' + _bid + ']';
    LogUtils.info(LogCategory, null, logMsg);
    var cleanDoc = DrawUtils.generateCleanRecord(channelId, _bid);
    return _saveRecord(channelId, _bid, cleanDoc.record, cleanDoc.drawOptions)
        .catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.cleanBoardAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: drawer send a completed draw record to save into db
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {Array}           tempRecord, a array of draw chunks
 * @param {Object}          drawOptions, the draw options of current record
 */
exports.saveRecordAsync = function(channelId, _bid, tempRecord, drawOptions) {
    LogUtils.info(LogCategory, null, 'start save new record on channel [' + channelId + '] [' + _bid + ']');
    return _saveRecord(channelId, _bid, tempRecord, drawOptions)
        .catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.saveRecordAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for member to undo the latest draw record on board
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {String}          member, the member uid
 */
exports.undoRecordAsync = function(channelId, _bid, member) {
    var logMsg = 'channel [' + channelId + '] undo on board [' + _bid + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return Promise.join(
        _ensureArchived(channelId, _bid),
        _ensureAuth(member, channelId),
        function(){
            return PgDrawRecord.setNewUndoAsync(channelId, _bid);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.undoRecordAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for member to restore the undo behaviour on current board
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {String}          member, the member uid
 */
exports.restoreUndoAsync = function(channelId, _bid, member) {
    var logMsg = 'channel [' + channelId + '] redo on board [' + _bid + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return _ensureAuth(member, channelId)
        .then(function() {
            return PgDrawRecord.restoreUndoAsync(channelId, _bid);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.restoreUndoAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to get current board preview image
 *
 * @param {String}          member, the member uid
 * @param {String}          channelId, channel id
 * @param {Number}          boardIdx, the draw board index
 */
exports.getPreviewImgAsync = function(member, channelId, boardIdx) {
    return _ensureAuth(member, channelId)
        .then(function() {
            var logMsg = 'channel [' + channelId + '] get preview';
            if (SharedUtils.isNumber(boardIdx)) {
                logMsg += 'on board [' + boardIdx + ']';
                LogUtils.info(LogCategory, null, logMsg);
                return PgDrawBoard.findImgByIndexAsync(channelId, boardIdx, 'preview');
            }
            LogUtils.info(LogCategory, null, logMsg);
            return PgDrawBoard.findImgByLatestUpdatedAsync(channelId, 'preview');
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.getPreviewImgAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get the draw board basic information, including 
 *             board document and record documents
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {String}          member, the member uid
 */
exports.getBoardInfoAsync = function(channelId, _bid, member) {
    return Promise.join(
        _ensureArchived(channelId, _bid),
        _ensureAuth(member, channelId),
        function() {
            return Promise.props({
                board: PgDrawBoard.findImgByIdAsync(channelId, _bid, 'base'),
                reocrds: PgDrawRecord.findByBoardAsync(channelId, _bid)
            });
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.getBoardInfoAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get the board uuid by its index
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardIdx, the board index
 * @param {String}          member, the member uid
 */
exports.getBoardIdAsync = function(channelId, boardIdx, member) {
    return _ensureAuth(member, channelId)
        .then(function(){
            return PgDrawBoard.findIdByIdxAsync(channelId, boardIdx);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.getBoardIdAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find out latest updated board on channel.
 *         NOTE: we currently find this board by latest board updated time
 *
 * @param {String}          channelId, channel id
 */
exports.getLatestBoardIdAsync = function(channelId) {
    var logMsg = 'channel [' + channelId + '] get Last updtaed board';
    LogUtils.info(LogCategory, null, logMsg);
    return PgDrawBoard.findByLatestUpdatedAsync(channelId)
        .then(function(board) {
            if (!board) {
                LogUtils.info(LogCategory, null, 'channel [' + channelId + '] has not been drawed');
                return 0;
            }
            return board.idx;
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.getLatestBoardIdAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to update drawboard image 
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {String}          imgType, the type of querying image
 * @param {Buffer}          img, the image content buffer
 */
exports.updateBoardImgAsync = function(channelId, _bid, imgType, img) {
    var logMsg = 'channel [' + channelId + '] update baseImg on board [' + _bid + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return PgDrawBoard.updateImgAsync(channelId, _bid, imgType, img)
        .then(function(result) {
            if (result && imgType === 'base') {
                _removeArchives(channelId, _bid);
            }
            return result;
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.updateBoardImgAsync()');
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
 * @Description: a low-level save draw record function
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 * @param {Array}           record, a array of record data
 */
function _saveRecord(channelId, _bid, record, drawOptions) {
    return PgDrawRecord.removeUndosAsync(channelId, _bid)
        .then(function() {
            return PgDrawRecord.saveAsync(channelId, _bid, record, drawOptions);
        });
}

/**
 * @Author: George_Chen
 * @Description: used to ensure all outdated records will be archived
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 */
function _ensureArchived(channelId, _bid) {
    return PgDrawRecord.countActivedRecordsAsync(channelId, _bid)
        .then(function(counts) {
            var archiveNum = counts - ACTIVED_RECORD_LIMIT;
            if (archiveNum > 0) {
                return PgDrawRecord.archiveByNumberAsync(channelId, _bid, archiveNum);
            }
            return true;
        }).then(function(result) {
            if (!result) {
                throw new Error('ensure archive fail');
            }
            return result;
        });
}

/**
 * @Author: George_Chen
 * @Description: remove unused archives records
 *
 * @param {String}          channelId, channel id
 * @param {String}          _bid, the board uuid
 */
function _removeArchives(channelId, _bid) {
    return PgDrawRecord.removeArchivesAsync(channelId, _bid)
        .catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService _removeArchives()');
        });
}

/**
 * @Author: George_Chen
 * @Description: used to ensure the channel related request is authed
 *
 * @param {String}          member, the member uid
 * @param {String}          channelId, channel id
 */
function _ensureAuth(member, channelId) {
    return ChannelStoreage.getAuthAsync(member, channelId)
        .then(function(isAuth) {
            if (!isAuth) {
                throw new Error('get auth fail');
            }
            return true;
        });
}
