'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');


module.exports = CreateStore({
    storeName: 'SubscriptionStore',

    handlers: {
        'ON_OPEN_HANGOUT': '_onOpenHangout',
        'ON_CHANNEL_ADDED': '_onChannelAdded',
        'CHANGE_ROUTE': '_onChangeRoute',
        'RECV_NOTIFICATION_MESSAGE': '_recvNotificationMessage',
        'RECV_NOTIFICATION_CONFERENCE': '_recvNotificationConference',
        'UPDATE_UNREAD_SUBSCRIBED_MSG_COUNTS': '_updateUnreadSubscribedMsgCounts',
        'UPDATE_CHANNEL_STAR': '_updateChannelStar'
    },

    initialize: function() {
        // test data for channelNav Info
        this.isActive = false;
        // use "-1" to indicate that no channel create action
        this.dbName = 'SubscriptionStore';
        this.db = this.getContext().getLokiDb(this.dbName);
        this.db.addCollection(this.dbName).ensureIndex('channelId');
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
            self.isActive = (SharedUtils.isBoolean(isOpen) ? isOpen : !self.isActive);
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

    /**
     * @Author: George_Chen
     * @Description: update currently added channel on subscription list
     * 
     * @param {Object}     data.channelInfo, the info of added channel
     */
    _onChannelAdded: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var info = data.channelInfo;
        if (!info.isStarred) {
            return;
        }
        return _saveSubscription(collection, info)
            .bind(this).then(function() {
                this.emitChange();
            });
    },

    /**
     * @Author: George_Chen
     * @Description: to update unread message counts on current subscribed channels
     * 
     * @param {Array}        data.channelsInfo, an array of channel unread message counts info
     */
    _updateUnreadSubscribedMsgCounts: function(data) {
        var collection = this.db.getCollection(this.dbName);
        return Promise.map(data.channelsInfo, function(info) {
            var query = {
                channelId: info.channelId
            };
            collection.chain().find(query).update(function(obj) {
                obj.unreadMsgNumbers = info.counts;
            });
        }).bind(this).then(function() {
            this.emitChange();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: update subscription list when user star or unstar channel
     *
     * @param {String}      data.channelId, the channel id
     * @param {String}      data.name, the channel name
     * @param {Object}      data.hostInfo, the channel host info
     * @param {String}      data.toStar, current channel starred staus
     */
    _updateChannelStar: function(data) {
        var collection = this.db.getCollection(this.dbName);
        return Promise.try(function() {
            if (data.toStar) {
                return _saveSubscription(collection, data);
            }
            collection.removeWhere(function(obj) {
                return (obj.channelId === data.channelId);
            });
        }).bind(this).then(function() {
            this.emitChange();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to handle new received notification message
     * 
     * @param {Object}     data.channelId, the channel id
     */
    _recvNotificationMessage: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var self = this;
        var query = {
            channelId: data.channelId
        };
        collection.chain().find(query).update(function(obj) {
            obj.unreadMsgNumbers = obj.unreadMsgNumbers += 1;
            self.emitChange();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to handle new received conference notification
     * 
     * @param {String}     data.channelId, the channel id
     * @param {Boolean}    data.hasCall, indicate conference call event
     */
    _recvNotificationConference: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var self = this;
        var query = {
            channelId: data.channelId
        };
        collection.chain().find(query).update(function(obj) {
            if (obj.hasConferenceCall !== data.hasCall) {
                obj.hasConferenceCall = data.hasCall;
                self.emitChange();
            }
        });
    },

    /**
     * @Author: George_Chen
     * @Description: update the channel visit time when user enter workspace
     * 
     * @param {Object}     route, react route object
     */
    _onChangeRoute: function(route) {
        if (!route.params.channelId) {
            return;
        }
        var collection = this.db.getCollection(this.dbName);
        this._resetUnreadCounts(collection, {
            channelId: route.params.channelId
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to reset unread message counts when user open hangout
     * 
     * @param {Object}     data.channelId, the channel id
     */
    _onOpenHangout: function(data) {
        var collection = this.db.getCollection(this.dbName);
        this._resetUnreadCounts(collection, {
            channelId: data.channelId
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to find the target channel and reset its unread message counts
     * 
     * @param {Object}     collection, the lokijs collection
     * @param {Object}     query, the query condition
     */
    _resetUnreadCounts: function(collection, query) {
        var self = this;
        collection.chain().find(query).update(function(obj) {
            obj.unreadMsgNumbers = 0;
            self.emitChange();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to check current channel is started or not
     * 
     * @param {String}     cid, the channel id
     */
    isChannelStarred: function(cid) {
        var collection = this.db.getCollection(this.dbName);
        var query = {
            channelId: cid
        };
        return (collection.chain().find(query).data().length > 0);
    },

    getState: function() {
        var collection = this.db.getCollection(this.dbName);
        return {
            isActive: this.isActive,
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
        name: SharedUtils.argsCheckAsync(doc.name, 'channelName'),
        hostInfo: doc.hostInfo,
        unreadMsgNumbers: 0,
        hasConferenceCall: false
    }).then(function(doc) {
        return collection.insert(doc);
    });
}
