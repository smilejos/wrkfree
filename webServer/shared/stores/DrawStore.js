'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var DrawUtils = require('../../../sharedUtils/drawUtils');

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
        'ON_BOARD_CLEAN': '_onBoardClean',
        'ON_DRAW_UNDO': '_onRecordUndo',
        'ON_DRAW_REDO': '_onRecordRedo',
        'ON_UPDATE_DRAWIMG': '_onUpdateBaseImg'
    },

    initialize: function() {
        this.baseImgs = {};
        this._bid = null;
        this.dbName = 'DrawsDB';
        this.db = this.getContext().getLokiDb(this.dbName);
        var collection = this.db.addCollection(this.dbName);
        collection.ensureIndex('_bid');
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
            var isTargetBoard = (record._bid === obj._bid);
            return (isTargetBoard && obj.isUndo);
        });
        return _saveRecord(collection, record)
            .then(function() {
                self._ensureArchived(record._bid);
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
     * @param {String}          _bid, the board uuid
     */
    _onRecordUndo: function(_bid) {
        var boardSet = this._getBoardResultSet(_bid);
        boardSet.where(function(obj) {
            return !obj.isUndo;
        }).limit(1).update(function(obj) {
            obj.isUndo = true;
        });
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for handling draw record redo event
     *
     * @param {String}          _bid, the board uuid
     */
    _onRecordRedo: function(_bid) {
        var boardSet = this._getBoardResultSet(_bid);
        boardSet.simplesort('drawTime', -1)
            .where(function(obj) {
                return obj.isUndo;
            }).limit(1).update(function(obj) {
                obj.isUndo = false;
            });
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill the draw board information
     *
     * @param {String}      data.bid, target board uuid
     * @param {Object}      data.boardInfo.baseImg, draw board base image
     * @param {Array}       data.boardInfo.records, draw board records
     */
    _onPolyfill: function(data) {
        var collection = this.db.getCollection(this.dbName);
        this.baseImgs[data.bid] = _getImgDataURL(data.baseImg);
        // prepare to indicate that this board is polyfilled
        collection.addDynamicView(data.bid);
        return Promise.map(data.records, function(doc) {
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
     * @Description: set current worksapce board by the board uuid
     * 
     * @param {String}      _bid, board uuid
     */
    setCurrentBoard: function(_bid) {
        this._bid = _bid;
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for handling internal update base image event
     * 
     * @param {String}      data._bid, target board uuid
     * @param {String}      data.imgDataUrl, the image data url
     * @param {Array}       data.outdatedDocs, outdated drawRecord docs
     */
    _onUpdateBaseImg: function(data) {
        var collection = this.db.getCollection(this.dbName);
        this.baseImgs[data._bid] = data.imgDataUrl;
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
     * @param {String}      data._bid, the board uuid
     */
    _onBoardClean: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var boardSet = this._getBoardResultSet(data._bid);
        var removeTargets = boardSet.data();
        this.baseImgs[data._bid] = null;
        SharedUtils.fastArrayMap(removeTargets, function(doc) {
            collection.remove(doc);
        });
        collection.removeDynamicView(data._bid);
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for components to get draw board information stored
     *               on client side
     */
    getDrawInfo: function() {
        return {
            _bid: this._bid,
            baseImg: this.baseImgs[this._bid],
            records: this._getBoardResultSet(this._bid).data()
        };
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
     * 
     * @param {String}      _bid, board uuid
     */
    isPolyFilled: function(_bid) {
        var collection = this.db.getCollection(this.dbName);
        return !!collection.getDynamicView(_bid);
    },

    /**
     * @Author: George_Chen
     * @Description: to get board query result set
     *
     * @param {String}      _bid, board uuid
     */
    _getBoardResultSet: function(_bid) {
        var collection = this.db.getCollection(this.dbName);
        return collection.chain().find({
            _bid: _bid
        }).simplesort('drawTime');
    },

    /**
     * @Author: George_Chen
     * @Description: to ensure inactive records will be archived
     *
     * @param {String}      _bid, board uuid
     */
    _ensureArchived: function(_bid) {
        var boardSet = this._getBoardResultSet(_bid);
        var archiveNum = (boardSet.data().length - ACTIVED_RECORD_LIMIT);
        if (archiveNum > 0) {
            boardSet.limit(archiveNum)
                .update(function(obj) {
                    if (!obj.isArchived) {
                        obj.isArchived = true;
                    }
                });
        }
    }
});

/**
 * @Author: George_Chen
 * @Description: save message document to the lokijs collection
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      doc, the message document
 */
function _saveRecord(collection, doc) {
    return Promise.props({
        _bid: doc._bid,
        channelId: SharedUtils.argsCheckAsync(doc.channelId, 'md5'),
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
