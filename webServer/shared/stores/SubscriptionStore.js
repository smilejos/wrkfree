'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');


module.exports = CreateStore({
    storeName: 'SubscriptionStore',

    handlers: {
        'ON_CHANNEL_CREATE': 'onChannelCreate'
    },

    initialize: function() {
        // test data for channelNav Info
        this.isActived = true;
        this.isNameValid = false;
        // use "-1" to indicate that no channel create action
        this.createdChannel = -1;
        this.dbName = 'SubscriptionStore';
        this.db = this.getContext().getLokiDb(this.dbName);
        this.db.addCollection(this.dbName).ensureIndex('channelId');
    },

    onChannelCreate: function(data) {
        this.createdChannel = data.channelInfo;
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: used to show or hide channelNav bar
     * NOTE: if is "isOpen" is invalid, we will change "actived" state different from current
     * 
     * @param {Boolean}        isOpen, to indicate channelNav bar should open or not
     */
    toggleAsync: function(isOpen) {
        var self = this;
        return Promise.try(function() {
            self.createdChannel = -1;
            self.isActived = (SharedUtils.isBoolean(isOpen) ? isOpen : !self.isActived);
            self.emitChange();
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill header infomation
     * NOTE: TODO later
     */
    polyfillAsync: function(data) {
        var collection = this.db.getCollection(this.dbName);
        return Promise.map(data.channels, function(info) {
            return _saveSubscription(collection, info);
        }).bind(this).then(function() {
            this.emitChange();
        });
    },

    getState: function() {
        var collection = this.db.getCollection(this.dbName);
        return {
            createdChannel: this.createdChannel,
            isNameValid: this.isNameValid,
            isActived: this.isActived,
            subscriptions: collection.chain().data()
        };
    },

    dehydrate: function() {
        return {
            db: this.db.toJson()
        };
    },

    rehydrate: function(state) {
        this.db.loadJSON(state.db);
    }
});

/**
 * @Author: George_Chen
 * @Description: to save channel item to current store
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      doc, the channel summary document
 */
function _saveSubscription(collection, doc) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(doc.channelId, 'md5'),
        name: SharedUtils.argsCheckAsync(doc.name, 'alphabet'),
        hostInfo: doc.hostInfo,
        unreadMsgNumbers: 0,
        isConferenceExist: false
    }).then(function(doc) {
        return collection.insert(doc);
    });
}
