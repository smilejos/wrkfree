'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var DrawUtils = require('../../../sharedUtils/drawUtils');
var LokiUtils = require('../../../sharedUtils/lokiUtils');

var Configs = require('../../../configs/config');
// used to limit the active reocrds number
var ACTIVED_RECORD_LIMIT = Configs.get().params.draw.activeRecordLimit;

if (!SharedUtils.isNumber(ACTIVED_RECORD_LIMIT)) {
    throw new Error('draw parameters missing');
}

module.exports = CreateStore({
    storeName: 'DrawStore',

    handlers: {
        'ON_RECORD_SAVE': '_onRecordSave',
        'ON_BOARD_POLYFILL': '_onPolyfill',
        'ON_BOARD_ADD': '_onBoardAdd',
        'ON_BOARD_CLEAN': '_onBoardClean',
        'ON_DRAW_UNDO': '_onRecordUndo',
        'ON_DRAW_REDO': '_onRecordRedo',
        'ON_UPDATE_DRAWIMG': '_onUpdateBaseImg',
        'CLEAN_FAILURE_DRAW': '_cleanFailureDraw'
    },

    initialize: function() {
        this.baseImgs = {};
        this.dbName = 'DrawsDB';
        this.db = this.getContext().getLokiDb(this.dbName);
        var collection = this.db.addCollection(this.dbName);
        collection.ensureIndex('boardId');
    },

    /**
     * @Author: George_Chen
     * @Description: to force the drawBoard to reload canvas data stored
     *               on current DrawStore
     */
    _cleanFailureDraw: function() {
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for handling new draw board added event
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    _onBoardAdd: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        var collection = this.db.getCollection(this.dbName);
        this.baseImgs[drawViewId] = null;
        // prepare to indicate that this board is polyfilled
        _getDrawView(collection, data.channelId, data.boardId);
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for handling new draw record save event
     *
     * @param {Object}      record, drawRecord document
     */
    _onRecordSave: function(record) {
        var collection = this.db.getCollection(this.dbName);
        var self = this;
        // remove all undo records on current board
        collection.removeWhere(function(obj) {
            var isTargetChannel = (record.channelId === obj.channelId);
            var isTargetBoard = (record.boardId === obj.boardId);
            return (isTargetChannel && isTargetBoard && obj.isUndo);
        });
        return _saveRecord(collection, record)
            .then(function() {
                self._ensureArchived(record.channelId, record.boardId);
                // is record has not updated on canvas, then trigger emitChange
                if (!record.isUpdated) {
                    self.emitChange();
                }
            }).catch(function(err) {
                SharedUtils.printError('DrawStore.js', 'onRecordSave', err);
                return null;
            });
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for handling draw record undo event
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    _onRecordUndo: function(data) {
        var cid = data.channelId;
        var bid = data.boardId;
        var collection = this.db.getCollection(this.dbName);
        var drawView = _getDrawView(collection, cid, bid);
        var condition = {
            isUndo: false
        };
        var sort = {
            field: 'drawTime',
            isDesc: true
        };
        LokiUtils.searchOnView(drawView, condition, sort, 1).update(function(obj) {
            obj.isUndo = true;
        });
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for handling draw record redo event
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    _onRecordRedo: function(data) {
        var cid = data.channelId;
        var bid = data.boardId;
        var collection = this.db.getCollection(this.dbName);
        var drawView = _getDrawView(collection, cid, bid);
        var condition = {
            isUndo: true
        };
        var sort = {
            field: 'drawTime',
            isDesc: false
        };
        LokiUtils.searchOnView(drawView, condition, sort, 1).update(function(obj) {
            obj.isUndo = false;
        });
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill the draw board information
     * 
     * @param {String}      data.channelId, target channel id
     * @param {Number}      data.boardId, target board id
     * @param {Object}      data.boardInfo.baseImg, draw board base image
     * @param {Array}       data.boardInfo.records, draw board records
     */
    _onPolyfill: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        var collection = this.db.getCollection(this.dbName);
        this.baseImgs[drawViewId] = _getImgDataURL(data.boardInfo.baseImg);
        // prepare to indicate that this board is polyfilled
        _getDrawView(collection, data.channelId, data.boardId);
        return Promise.map(data.boardInfo.records, function(doc) {
            return _saveRecord(collection, doc);
        }).bind(this).then(function() {
            this.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('DrawStore.js', 'onPolyfill', err);
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for handling internal update base image event
     * 
     * @param {String}      data.channelId, target channel id
     * @param {Number}      data.boardId, target board id
     * @param {String}      data.imgDataUrl, the image data url
     * @param {Array}       data.outdatedDocs, outdated drawRecord docs
     */
    _onUpdateBaseImg: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        var collection = this.db.getCollection(this.dbName);
        this.baseImgs[drawViewId] = data.imgDataUrl;
        return SharedUtils.fastArrayMap(data.outdatedDocs, function(doc) {
            collection.remove(doc);
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for handling board storage clean event
     * 
     * @param {String}      data.channelId, target channel id
     * @param {Number}      data.boardId, target board id
     */
    _onBoardClean: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        var removeTargets = _getDrawView(collection, data.channelId, data.boardId).data();
        this.baseImgs[drawViewId] = null;
        SharedUtils.fastArrayMap(removeTargets, function(doc) {
            collection.remove(doc);
        });
        collection.removeDynamicView(drawViewId);
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for components to get draw board information stored
     *               on client side
     * 
     * @param {String}      channelId, target channel id
     * @param {Number}      boardId, target board id
     */
    getDrawInfo: function(channelId, boardId) {
        var collection = this.db.getCollection(this.dbName);
        var drawViewId = DrawUtils.getDrawViewId(channelId, boardId);
        return {
            baseImg: this.baseImgs[drawViewId],
            records: _getDrawView(collection, channelId, boardId).data()
        };
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to get the latest draw record on current board
     * 
     * @param {String}      channelId, target channel id
     * @param {Number}      boardId, target board id
     */
    getLastRecord: function(channelId, boardId) {
        var collection = this.db.getCollection(this.dbName);
        var drawRecords = _getDrawView(collection, channelId, boardId).data();
        return drawRecords[drawRecords.length - 1];
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to clean current draw store
     */
    cleanStore: function() {
        var collection = this.db.getCollection(this.dbName);
        this.baseImgs = {};
        // clean DyanmicViews
        collection.removeDataOnly();
        collection.DynamicViews = [];
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to check specific draw board is polyfilled or not
     *         NOTE: use drawView existence to check current board 
     *                 is polyfilled or not
     * @param {String}      channelId, target channel id
     * @param {Number}      boardId, target board id
     */
    isPolyFilled: function(channelId, boardId) {
        var collection = this.db.getCollection(this.dbName);
        var drawViewId = DrawUtils.getDrawViewId(channelId, boardId);
        var drawView = collection.getDynamicView(drawViewId);
        return !!drawView;
    },

    /**
     * @Author: George_Chen
     * @Description: to ensure inactive records will be archived
     *
     * @param {String}          cid, the channel id
     * @param {Number}          bid, the draw board id
     */
    _ensureArchived: function(cid, bid) {
        var collection = this.db.getCollection(this.dbName);
        var drawView = _getDrawView(collection, cid, bid);
        var archiveNum = (drawView.data().length - ACTIVED_RECORD_LIMIT);
        var sort = {
            field: 'drawTime',
            isDesc: false
        };
        if (archiveNum > 0) {
            LokiUtils
                .searchOnView(drawView, {}, sort, archiveNum)
                .update(function(obj) {
                    obj.isArchived = true;
                });
        }
    }
});

/**
 * @Author: George_Chen
 * @Description: to get lokijs dynamicView for specific channel
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      channelId, channel's id
 */
function _getDrawView(collection, cid, bid) {
    var drawViewId = DrawUtils.getDrawViewId(cid, bid);
    var drawView = collection.getDynamicView(drawViewId);
    if (!drawView) {
        drawView = collection.addDynamicView(drawViewId);
        drawView.applyWhere(function(doc) {
            return (doc.channelId === cid && doc.boardId === bid);
        }).applySimpleSort('drawTime');
    }
    return drawView;
}

/**
 * @Author: George_Chen
 * @Description: save message document to the lokijs collection
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      doc, the message document
 */
function _saveRecord(collection, doc) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(doc.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(doc.boardId, 'boardId'),
        record: DrawUtils.checkDrawRecordAsync(doc.record),
        isUndo: doc.isUndo || false,
        isArchived: doc.isArchived || false,
        drawOptions: SharedUtils.argsCheckAsync(doc.drawOptions, 'drawOptions'),
        drawTime: doc.drawTime || Date.now()
    }).then(function(drawDoc) {
        return collection.insert(drawDoc);
    });
}

/**
 * @Author: George_Chen
 * @Description: to generate image data url
 *
 * @param {Object}      baseImg, draw board base image
 */
function _getImgDataURL(baseImg) {
    if (!baseImg) {
        return null;
    }
    var prefix = 'data:' + baseImg.contentType + ';' + baseImg.encode + ',';
    var rawChunks = baseImg.chunks.data;
    return (rawChunks ? prefix + rawChunks : null);
}
