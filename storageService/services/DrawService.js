'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var DrawUtils = require('../../sharedUtils/drawUtils');
var LogUtils = require('../../sharedUtils/logUtils');
var LogCategory = 'STORAGE';
var Promise = require('bluebird');
var ChannelStoreage = require('./ChannelService');
var RecordDao = require('../daos/DrawRecordDao');
var BoardDao = require('../daos/DrawBoardDao');
var PreviewDao = require('../daos/DrawPreviewDao');
var PgDrawRecord = require('../pgDaos/PgDrawRecord');

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
 * @param {Number}          boardId, the draw board id
 * @param {String}          member, the member uid
 */
exports.addBoardAsync = function(channelId, boardId, member) {
    var logMsg = 'channel [' + channelId + '] add board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return Promise.join(
        PreviewDao.isExistAsync(channelId, boardId),
        BoardDao.isExistAsync(channelId, boardId),
        _ensureAuth(member, channelId),
        function(previewExist, boardExist) {
            var warnInfo = {
                channelId: channelId,
                boardId: boardId
            };
            if (!previewExist && !boardExist) {
                return _addBoard(channelId, boardId);
            }
            if (!previewExist) {
                LogUtils.warn(LogCategory, warnInfo, 'preview document missing');
                return PreviewDao.saveAsync(channelId, boardId);
            }
            if (!boardExist) {
                LogUtils.warn(LogCategory, warnInfo, 'board document missing');
                return BoardDao.saveAsync(channelId, boardId);
            }
            LogUtils.warn(LogCategory, warnInfo, 'board exist');
            return null;
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
    return _ensureAuth(member, channelId)
        .then(function() {
            return _delBoard(channelId, boardId);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.delBoardAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: clean out all draws on current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.cleanBoardAsync = function(channelId, boardId) {
    var logMsg = 'channel [' + channelId + '] clean board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    var cleanDoc = DrawUtils.generateCleanRecord(channelId, boardId);
    return _saveRecord(channelId, boardId, cleanDoc.record, cleanDoc.drawOptions)
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
 * @param {Number}          boardId, the draw board id
 * @param {Array}           tempRecord, a array of draw chunks
 * @param {Object}          drawOptions, the draw options of current record
 */
exports.saveRecordAsync = function(channelId, boardId, tempRecord, drawOptions) {
    LogUtils.info(LogCategory, null, 'start save new record on channel [' + channelId + '] [' + boardId + ']');
    return _saveRecord(channelId, boardId, tempRecord, drawOptions)
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
 * @Description: for user to save record when drawing on the same point
 *
 * @param {String}          channelId, the channel id
 * @param {Number}          boardId, the draw board id
 * @param {Array}           rawData, the raw chunks of current drawing
 * @param {Object}          drawOptions, the draw options for this record
 */
exports.saveSingleDrawAsync = function(channelId, boardId, rawData, drawOptions) {
    var logMsg = 'channel [' + channelId + '] save single draw on board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return _saveRecord(channelId, boardId, [rawData], drawOptions)
        .catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.saveSingleDrawAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for member to undo the latest draw record on board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          member, the member uid
 */
exports.undoRecordAsync = function(channelId, boardId, member) {
    var logMsg = 'channel [' + channelId + '] undo on board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return Promise.join(
        _ensureArchived(channelId, boardId),
        _ensureAuth(member, channelId),
        function() {
            return PgDrawRecord.setNewUndoAsync(channelId, boardId);
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
 * @param {Number}          boardId, the draw board id
 * @param {String}          member, the member uid
 */
exports.restoreUndoAsync = function(channelId, boardId, member) {
    var logMsg = 'channel [' + channelId + '] redo on board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return _ensureAuth(member, channelId)
        .then(function() {
            return PgDrawRecord.restoreUndoAsync(channelId, boardId);
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
 * @param {Number}          boardId, the draw board id
 */
exports.getPreviewImgAsync = function(member, channelId, boardId) {
    return _ensureAuth(member, channelId)
        .then(function() {
            var logMsg = 'channel [' + channelId + '] get preview';
            if (SharedUtils.isDrawBoardId(boardId)) {
                logMsg += 'on board [' + boardId + ']';
                LogUtils.info(LogCategory, null, logMsg);
                return PreviewDao.findByBoardAsync(channelId, boardId);
            }
            LogUtils.info(LogCategory, null, logMsg);
            return PreviewDao.findByChannelLatestAsync(channelId);
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
 * @Description: used to get the preview image status (outdated or not)
 *         NOTE: time is used to compare preview image updatedTime
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          time, the timestamp
 */
exports.getPreviewStatusAsync = function(channelId, boardId, time) {
    var logMsg = 'channel [' + channelId + '] get preview status on board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return Promise.props({
        isOutdated: PreviewDao.isExistAsync(channelId, boardId, time)
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in DrawService.getPreviewStatusAsync()');
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
 * @param {Number}          boardId, the draw board id
 * @param {String}          member, the member uid
 */
exports.getBoardInfoAsync = function(channelId, boardId, member) {
    var logMsg = 'channel [' + channelId + '] get info on board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return Promise.join(
        _ensureArchived(channelId, boardId),
        _ensureAuth(member, channelId),
        function(isArchived) {
            if (!isArchived) {
                throw new Error('record archive fail');
            }
            return Promise.props({
                board: BoardDao.findByBoardAsync(channelId, boardId),
                reocrds: PgDrawRecord.findByBoardAsync(channelId, boardId)
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
 * @Description: to find out latest updated board on channel.
 *         NOTE: we currently find this board by latest draw record
 *
 * @param {String}          channelId, channel id
 */
exports.getLatestBoardIdAsync = function(channelId) {
    var logMsg = 'channel [' + channelId + '] get Last updtaed board';
    LogUtils.info(LogCategory, null, logMsg);
    return RecordDao.findLatestByChannelAsync(channelId)
        .then(function(record) {
            if (!record) {
                LogUtils.info(LogCategory, null, 'channel [' + channelId + '] has not been drawed');
                return 0;
            }
            return record.boardId;
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
 * @Description: used to update the base Image on current draw board
 *         NOTE: base image is the snapshot of all archived draw records
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Buffer}          img, the image buffer
 */
exports.updateBaseImgAsync = function(channelId, boardId, img) {
    var logMsg = 'channel [' + channelId + '] update baseImg on board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return BoardDao.updateBaseImgAsync(channelId, boardId, img)
        .then(function(result) {
            if (result) {
                _removeArchives(channelId, boardId);
            }
            return result;
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.updateBaseImgAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to update the preview Image on current draw board
 *         NOTE: preview image is the snapshot of current board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Buffer}          img, the image buffer
 */
exports.updatePreviewImgAsync = function(channelId, boardId, img) {
    var logMsg = 'channel [' + channelId + '] update preview on board [' + boardId + ']';
    LogUtils.info(LogCategory, null, logMsg);
    return PreviewDao.updateChunksAsync(channelId, boardId, img)
        .catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in DrawService.updatePreviewImgAsync()');
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
 * @Description: a low-level add board function
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
function _addBoard(channelId, boardId) {
    return Promise.all([
        PreviewDao.saveAsync(channelId, boardId),
        BoardDao.saveAsync(channelId, boardId)
    ]).map(function(result) {
        if (!result) {
            throw new Error('board related document create fail');
        }
        return result;
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in DrawService _addBoard()');
        // clean previous related docs
        return _delBoard(channelId, boardId).then(function() {
            return null;
        });
    });
}

/**
 * @Author: George_Chen
 * @Description: a low-level delete board function
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
function _delBoard(channelId, boardId) {
    return Promise.props({
        delBoard: BoardDao.removeByBoardAsync(channelId, boardId),
        delPreview: PreviewDao.removeByBoardAsync(channelId, boardId),
        delRecords: RecordDao.removeByBoardAsync(channelId, boardId)
    });
}

/**
 * @Author: George_Chen
 * @Description: a low-level save draw record function
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Array}           record, a array of record data
 */
function _saveRecord(channelId, boardId, record, drawOptions) {
    return PgDrawRecord.removeUndosAsync(channelId, boardId)
        .then(function() {
            return PgDrawRecord.saveAsync(channelId, boardId, record, drawOptions);
        });
}

/**
 * @Author: George_Chen
 * @Description: used to ensure all outdated records will be archived
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
function _ensureArchived(channelId, boardId) {
    return PgDrawRecord.countActivedRecordsAsync(channelId, boardId)
        .then(function(counts) {
            var archiveNum = counts - ACTIVED_RECORD_LIMIT;
            if (archiveNum > 0) {
                return PgDrawRecord.archiveByNumberAsync(channelId, boardId, archiveNum);
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
 * @param {Number}          boardId, the draw board id
 */
function _removeArchives(channelId, boardId) {
    return PgDrawRecord.removeArchivesAsync(channelId, boardId)
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
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
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
