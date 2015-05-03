'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/utils/createStore');
var SharedUtils = require('../../../sharedUtils/utils');

module.exports = CreateStore({
    storeName: 'MessageStore',

    handlers: {
        'RECV_MESSAGE': 'onRecvMessage',
        'PULL_MESSAGES': 'polyfillAsync'
    },

    initialize: function() {
        this.dbName = 'MessageDB';
        this.db = this.getContext().getLokiDb(this.dbName);
        var collection = this.db.addCollection(this.dbName);
        collection.ensureIndex('channelId');
        this.isPolyFilled = null;
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: save new message sent from server
     *
     * @param {Object}      msgDoc, message document
     */
    onRecvMessage: function(msgDoc) {
        var collection = this.db.getCollection(this.dbName);
        return _saveMessage(collection, msgDoc)
            .bind(this)
            .then(function() {
                this.emitChange();
            }).catch(function(err) {
                SharedUtils.printError('MessageStore.js', 'onRecvMessage', err);
                return null;
            });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to get the channel oldest message
     * 
     * @param {Array}      messages, an array of message documents
     */
    polyfillAsync: function(messages) {
        var collection = this.db.getCollection(this.dbName);
        return Promise.map(messages, function(doc) {
            return _saveMessage(collection, doc);
        }).bind(this).then(function() {
            this.emitChange();
            this.isPolyFilled = true;
            return true;
        }).catch(function(err) {
            SharedUtils.printError('MessageStore.js', 'polyfillAsync', err);
            return null;
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to get the channel oldest message
     * 
     * @param {Object}      channelId, channel's id
     */
    getOldestMessage: function(channelId) {
        var collection = this.db.getCollection(this.dbName);
        var channelMessages = _getMsgView(collection, channelId).data();
        return channelMessages[0];
    },

    getLatestMessage: function(channelId) {
        var collection = this.db.getCollection(this.dbName);
        var channelMessages = _getMsgView(collection, channelId).data();
        return channelMessages[channelMessages.length - 1];
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for getting recent messages of the current channel
     * 
     * @param {Object}      channelId, channel's id
     */
    getMessages: function(channelId) {
        var collection = this.db.getCollection(this.dbName);
        return _getMsgView(collection, channelId).data();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: dehydrate mechanism will be called by fluxible framework
     */
    dehydrate: function() {
        return this.db.toJson();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: rehydrate mechanism will be called by fluxible framework
     *
     * @param {String}      serializedDB, the stringify DB returned by "dehydrate"
     */
    rehydrate: function(serializedDB) {
        this.db.loadJSON(serializedDB);
        this.isPolyFilled = !!serializedDB;
    }
});

/**
 * @Author: George_Chen
 * @Description: to get lokijs dynamicView for specific channel
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      channelId, channel's id
 */
function _getMsgView(collection, channelId) {
    var msgView = collection.getDynamicView(channelId);
    if (!msgView) {
        msgView = collection.addDynamicView(channelId);
        var condition = {};
        condition.channelId = channelId;
        msgView.applyFind(condition).applySimpleSort('sentTime');
    }
    return msgView;
}

/**
 * @Author: George_Chen
 * @Description: save message document to the lokijs collection
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      doc, the message document
 */
function _saveMessage(collection, doc) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(doc.channelId, 'md5'),
        from: SharedUtils.argsCheckAsync(doc.from, 'md5'),
        nickName: SharedUtils.argsCheckAsync(doc.nickName, 'nickName'),
        avatar: SharedUtils.argsCheckAsync(doc.avatar, 'avatar'),
        message: SharedUtils.argsCheckAsync(doc.message, 'string'),
        sentTime: doc.sentTime || Date.now()
    }).then(function(msgDoc) {
        return collection.insert(msgDoc);
    });
}
