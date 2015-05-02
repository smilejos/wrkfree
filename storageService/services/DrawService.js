'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var ChannelStoreage = require('./ChannelService');
var RecordDao = require('../daos/DrawRecordDao');
var BoardDao = require('../daos/DrawBoardDao');
var PreviewDao = require('../daos/DrawPreviewDao');
var RecordTemp = require('../tempStores/DrawRecordTemp');

// TODO: we should store this parameter to a global params file
// used to limit the active reocrds number
var RECORD_ACTIVE_LIMIT = 10;

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
    return Promise.join(
        PreviewDao.isExistAsync(channelId, boardId),
        BoardDao.isExistAsync(channelId, boardId),
        _ensureAuth(member, channelId),
        function(previewExist, boardExist) {
            if (!previewExist && !boardExist) {
                return _addBoard(channelId, boardId);
            }
            if (!previewExist) {
                console.log('draw board document exist, but preview docuement missing');
                return PreviewDao.saveAsync(channelId, boardId);
            }
            if (!boardExist) {
                console.log('draw board document missing, but preview docuement exist');
                return BoardDao.saveAsync(channelId, boardId);
            }
            throw new Error('draw board already exist');
        }).catch(function(err) {
            SharedUtils.printError('DrawService.js', 'addBoardAsync', err);
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
    return _ensureAuth(member, channelId)
        .then(function() {
            return _delBoard(channelId, boardId);
        }).catch(function(err) {
            SharedUtils.printError('DrawService.js', 'delBoardAsync', err);
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
 * @param {String}          member, the member uid
 */
exports.cleanBoardAsync = function(channelId, boardId, member) {
    return _ensureAuth(member, channelId)
        .then(function() {
            var buf = new Buffer('');
            return Promise.all([
                RecordDao.removeByBoardAsync(channelId, boardId),
                BoardDao.updateBaseImgAsync(channelId, boardId, buf),
                PreviewDao.updateChunksAsync(channelId, boardId, buf)
            ]);
        }).map(function(result) {
            if (!result) {
                throw new Error('at least on document clean fail');
            }
            return true;
        }).catch(function(err) {
            SharedUtils.printError('DrawService.js', 'delBoardAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: stream raw data to a record temp store for handling later
 *         NOTE: we didn't check member auth on this API 
 *               due to data only store at tempStorage
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          member, the member uid
 * @param {Array}           rawData, the rawData of draw record
 */
exports.streamRecordDataAsync = function(channelId, boardId, member, rawData) {
    return RecordTemp.streamRecordAsync(channelId, boardId, member, rawData)
        .catch(function(err) {
            SharedUtils.printError('DrawService.js', 'streamRecordDataAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: drawer send this as a ack to inform server that he has drawed done.
 *         NOTE: rawDataNumbers is used to notify server that how many raw data
 *               he has sent to server. (used to check data is broken or not)
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          member, the member uid
 * @param {Number}          rawDataNumbers, the number of rawData
 */
exports.saveRecordAsync = function(channelId, boardId, member, rawDataNumbers) {
    return Promise.join(
        RecordTemp.getRecordAsync(channelId, boardId, member),
        _ensureAuth(member, channelId),
        function(tempRecord) {
            if (tempRecord.length !== rawDataNumbers) {
                throw new Error('tempRecord is broken');
            }
            RecordTemp.initDrawStreamAsync(channelId, boardId, member);
            return _saveRecord(channelId, boardId, tempRecord);
        }).catch(function(err) {
            SharedUtils.printError('DrawService.js', 'saveRecordAsync', err);
            RecordTemp.initDrawStreamAsync(channelId, boardId, member);
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
    return Promise.join(
        _ensureArchived(channelId, boardId),
        _ensureAuth(member, channelId),
        function() {
            return RecordDao.setNewUndoAsync(channelId, boardId);
        }).catch(function(err) {
        SharedUtils.printError('DrawService.js', 'undoRecordAsync', err);
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
    return _ensureAuth(member, channelId)
        .then(function() {
            return RecordDao.restoreUndoAsync(channelId, boardId);
        }).catch(function(err) {
            SharedUtils.printError('DrawService.js', 'restoreUndoAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to get current board preview image
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          member, the member uid
 */
exports.getPreviewImgAsync = function(channelId, boardId, member) {
    return Promise.props({
        previewImg: PreviewDao.findByBoardAsync(channelId, boardId),
        isAuth: _ensureAuth(member, channelId)
    }).catch(function(err) {
        SharedUtils.printError('DrawService.js', 'getPreviewAsync', err);
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
    return Promise.props({
        isOutdated: PreviewDao.isExistAsync(channelId, boardId, time)
    }).catch(function(err) {
        SharedUtils.printError('DrawService.js', 'getPreviewStatusAsync', err);
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
    return _ensureArchived(channelId, boardId)
        .then(function(result) {
            if (!result) {
                throw new Error('record archive fail');
            }
            return Promise.props({
                board: BoardDao.findByBoardAsync(channelId, boardId),
                reocrds: RecordDao.findByBoardAsync(channelId, boardId), // reutnr all channel records
                isAuth: _ensureAuth(member, channelId)
            });
        }).catch(function(err) {
            SharedUtils.printError('DrawService.js', 'getBoardResource', err);
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
    return BoardDao.updateBaseImgAsync(channelId, boardId, img)
        .then(function(result) {
            if (result) {
                _removeArchives(channelId, boardId);
            }
            return result;
        }).catch(function(err) {
            SharedUtils.printError('DrawService.js', 'updateBaseImgAsync', err);
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
    return PreviewDao.updateChunksAsync(channelId, boardId, img)
        .catch(function(err) {
            SharedUtils.printError('DrawService.js', 'updatePreviewImgAsync', err);
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
            throw new Error('at least one board document create fail');
        }
        return result;
    }).catch(function(err) {
        SharedUtils.printError('DrawService.js', '_addBoard', err);
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
function _saveRecord(channelId, boardId, record) {
    return RecordDao.removeUndosAsync(channelId, boardId)
        .then(function(result) {
            if (result === null) {
                throw new Error('remove undo document fail');
            }
            return RecordDao.saveAsync(channelId, boardId, record);
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
    return RecordDao.countActivedRecordsAsync(channelId, boardId)
        .then(function(counts) {
            var archiveNum = counts - RECORD_ACTIVE_LIMIT;
            if (archiveNum > 0) {
                return RecordDao.archiveByNumberAsync(channelId, boardId, archiveNum);
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
    return RecordDao.removeArchivesAsync(channelId, boardId)
        .catch(function(err) {
            SharedUtils.printError('DrawService.js', '_removeArchives', err);
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
