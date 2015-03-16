'use strict';
var CreateStore = require('fluxible/utils/createStore');
var ChannelInfoStore = require('./channelInfoStore');
var StoreUtils = require('./utils');
var Promise = require('bluebird');

/**
 * the document schema of message source
 */
var MessageSchema = {
    channelId:          {type : 'String', default : ''},
    sender:             {type : 'String', default : ''},
    avatar:             {type : 'String', default : ''},
    contents:           {type : 'String', default : ''},
    timestamp:          {type : 'Number', default : 0 }
};

var PrivateBoxesStore = CreateStore({
    storeName: 'PrivateBoxesStore',

    handlers: {
        'UPDATE_PRIVATE_MSGBOX': 'onUpdateMsgBox'
    },

    initialize: function() {
        this.dbName = 'PrivateBoxesDB';
        // the private msgBoxes that currently open
        this.Boxes = [];
        this.db = this.getContext().getLokiDb(this.dbName);
        // db collection used to store all private msgs
        var collection = this.db.addCollection(this.dbName);
        collection.ensureIndex('channelId');
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: send chat msg to current channel
     *
     * @param {String}      msgPayload.channelId, channel's id
     * @param {Array}       msgPayload.msgs, an msg array with full-infomation
     */
    onUpdateMsgBox: function(msgPayload) {
        if (this.Boxes.indexOf(msgPayload.channelId) === -1) {
            this.Boxes.push(msgPayload.channelId);
        }
        var collection = this.db.getCollection(this.dbName);
        return Promise.map(msgPayload.msgs, function(msgDoc) {
            return StoreUtils.validDocAsync(msgDoc, MessageSchema).then(function(doc) {
                return collection.insert(doc);
            });
        }).bind(this).then(function() {
            return this.emitChange();
        }).catch(function(err) {
            return console.log('[onUpdateMsgBox]', err);
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: get channel msgs from current message source
     *
     * @param {String}      chId, an valid channel's id
     */
    getLocalMsgsAsync: function(chId) {
        var collection = this.db.getCollection(this.dbName);
        return Promise.try(function() {
            var messageView = collection.getDynamicView(chId);
            if (!messageView) {
                messageView = collection.addDynamicView(chId);
                var condition = {};
                condition.channelId = chId;
                messageView.applyFind(condition);
            }
            return messageView.data();
        }).catch(function(err) {
            console.log('[getLocalMsgsAsync]', err);
            return [];
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to get the state of current privateBoxes store
     */
    getStateAsync: function() {
        var channelStore = this.dispatcher.getStore(ChannelInfoStore);
        var collection = this.db.getCollection(this.dbName);
        var state = {};
        return Promise.map(this.Boxes, function(channelId) {
            return channelStore.getChannelAsync(channelId).then(function(info) {
                if (Object.keys(info).length > 0) {
                    var msgView = collection.getDynamicView(channelId);
                    state[channelId] = {
                        header: info.msgHeader,
                        msgs: msgView.applySimpleSort('timestamp').data()
                    };
                }
            });
        }).then(function() {
            return state;
        });
    }
});

module.exports = PrivateBoxesStore;
