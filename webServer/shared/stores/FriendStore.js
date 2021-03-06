'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

module.exports = CreateStore({
    storeName: 'FriendStore',

    handlers: {
        'UPDATE_FRIEND_STATUS': '_updateFriendStatus',
        'UPDATE_FRIENDS_MESSAGE': '_updateFriendsMessage',
        'UPDATE_1ON1_CHANNELID': '_update1on1ChannelId',
        'ON_OPEN_HANGOUT': '_updateMessageToReaded',
        'ON_FRIEND_ADDED': '_onFriendAdded',
        'RECV_NOTIFICATION_MESSAGE': '_recvNotificationMessage',
        'RECV_NOTIFICATION_CONFERENCE': '_recvNotificationConference',
        'RECV_MESSAGE': '_recvMessage',
        'TOGGLE_FRIENDLIST': '_toggleFriendList',
        'TOGGLE_SUBSCRIPTIONLIST': '_deactiveFriendList',
        'TOGGLE_CHANNELCREATOR': '_deactiveFriendList',
        'TOGGLE_QUICKSEARCH': '_deactiveFriendList',
        'TOGGLE_PERSONALINFO': '_deactiveFriendList',
        'TOGGLE_NOTIFICATION': '_deactiveFriendList',
        'TOGGLE_MAIN_VIEWPOINT': '_deactiveFriendList'
    },

    /**
     * @Author: George_Chen
     * @Description: for handle new frirend added event
     *
     * @param {String}      data.uid, friend uid
     * @param {String}      data.channelId, 1on1 channel id to friend
     * @param {String}      data.avatar, friend avatar
     * @param {String}      data.nickName, friend nickName
     * @param {String}      data.group, the group of friend
     * @param {Boolean}     data.isOnline, friend online status
     */
    _onFriendAdded: function(freindInfo) {
        var collection = this.db.getCollection(this.dbName);
        return _importFriend(collection, freindInfo)
            .bind(this).then(function() {
                return this.emitChange();
            });
    },

    /**
     * @Author: George_Chen
     * @Description: if received message belong 1on1 channel, update it on friend list
     *
     * @param {String}      data.from, message sender uid
     * @param {String}      data.channelId, message channel id
     * @param {String}      data.message, message content
     */
    _recvMessage: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var self = this;
        var query = {
            channelId: data.channelId
        };
        collection.chain().find(query).update(function(obj) {
            obj.lastMessage = {
                channelId: data.channelId,
                message: data.message,
                from: data.from,
                sentTime: Date.now()
            };
            self.emitChange();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: used to update the last talk message on specific friend
     *         NOTE: based on the channel id of each message, 
     *               we can know who own this message.
     *
     * @param {Array}      data.msgsData, an array of last talk messages
     */
    _updateFriendsMessage: function(data) {
        if (data.msgsData.length === 0) {
            return;
        }
        var collection = this.db.getCollection(this.dbName);
        return Promise.map(data.msgsData, function(friendMsgData) {
            var query = {
                channelId: friendMsgData.lastMessage.channelId
            };
            collection.chain().find(query).update(function(obj) {
                obj.lastMessage = friendMsgData.lastMessage;
                obj.isMessageReaded = friendMsgData.isReaded;
            });
        }).bind(this).then(function() {
            this.emitChange();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to handle new received notification message
     * 
     * @param {String}     data.channelId, the channel id
     */
    _recvNotificationMessage: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var self = this;
        var query = {
            channelId: data.channelId
        };
        collection.chain().find(query).update(function(obj) {
            obj.lastMessage = data;
            obj.isMessageReaded = false;
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
            if (obj.hasIncomingCall !== data.hasCall) {
                obj.hasIncomingCall = data.hasCall;
                self.emitChange();
            }
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to update the 1on1 channel id for each friend item
     *
     * @param {String}      data.uid, friend uid
     * @param {String}      data.channelId, the 1on1 channelId
     */
    _update1on1ChannelId: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var query = {
            uid: data.uid
        };
        collection.chain().find(query).update(function(obj) {
            obj.channelId = data.channelId;
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to update the online status of current friend
     *
     * @param {String}      data.uid, friend uid
     * @param {String}      data.isOnline, friend online status
     */
    _updateFriendStatus: function(data) {
        var self = this;
        var collection = this.db.getCollection(this.dbName);
        var query = {
            uid: data.uid
        };
        collection.chain().find(query).update(function(obj) {
            obj.isOnline = data.isOnline;
            self.emitChange();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to update the last talk message is readed or not on 
     *               specific friend item
     *
     * @param {String}      data.channelId, the 1on1 channelId
     */
    _updateMessageToReaded: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var self = this;
        var query = {
            channelId: data.channelId
        };
        collection.chain().find(query).update(function(obj) {
            obj.isMessageReaded = true;
            self.emitChange();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to toggle the active status of friend list
     *
     * @param {Boolean}          data.isActive, indicate is active or not
     */
    _toggleFriendList: function(data) {
        this.isActive = data.isActive;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: to deactive friend list status
     *         NOTE: when other component is active, then deactive current component
     *
     * @param {Boolean}          data.isActive, indicate other component is active or not
     */
    _deactiveFriendList: function(data) {
        if (data.isActive && this.isActive) {
            this.isActive = false;
            this.emitChange();
        }
    },


    initialize: function() {
        this.isActive = false;
        this.isPolyFilled = false;
        this.dbName = 'FriendDB';
        this.db = this.getContext().getLokiDb(this.dbName);
        var collection = this.db.addCollection(this.dbName);
        collection.ensureIndex('uid');
        collection.ensureIndex('channelId');
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill friendList object to friend store
     *
     * @param {String}      friendList, an array of friends got from mongodb
     */
    polyfillAsync: function(friendList) {
        var collection = this.db.getCollection(this.dbName);
        return Promise.map(friendList, function(friendInfo) {
            return _importFriend(collection, friendInfo);
        }).bind(this).then(function() {
            this.isPolyFilled = true;
            return this.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('FriendStore.js', 'polyfillAsync', err);
            return null;
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to get friend list
     *         NOTE: here we sort by different criteria
     */
    getState: function() {
        var collection = this.db.getCollection(this.dbName);
        var sortMethod = function(obj1, obj2) {
            // sort by message is readed status
            if (!obj1.isMessageReaded && obj2.isMessageReaded) return -1;
            if (obj1.isMessageReaded && !obj2.isMessageReaded) return 1;
            // sort by online status
            if (obj1.isOnline && !obj2.isOnline) return -1;
            if (!obj1.isOnline && obj2.isOnline) return 1;
            // sort by lastMessage sentTime
            if (obj1.lastMessage && obj1.lastMessage.sentTime > obj2.lastMessage.sentTime) return -1;
            if (obj1.lastMessage && obj1.lastMessage.sentTime < obj2.lastMessage.sentTime) return 1;
            // sort by nickName
            if (obj1.nickName < obj2.nickName) return -1;
            if (obj1.nickName > obj2.nickName) return 1;
        };
        return {
            isActive: this.isActive,
            friends: collection.chain().sort(sortMethod).data()
        };
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: check target user is friend or not
     *
     * @param {String}      user, the uid of target user
     */
    hasFriendShip: function(user) {
        var collection = this.db.getCollection(this.dbName);
        var condition = {
            uid: user
        };
        return !!collection.findOne(condition);
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: search friends by query string on store
     *
     * @param {String}      query, the query string
     */
    searchFriends: function(query) {
        var collection = this.db.getCollection(this.dbName);
        var condition = {
            nickName: {
                $regex: new RegExp(query + '.*', 'i')
            }
        };
        return collection.chain().find(condition).data();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: used to check friend store has been polyfilled or not
     *         NOTE: return true, only if friendView has been inited
     */
    hasPolyfilled: function() {
        return this.isPolyFilled;
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: dehydrate mechanism will be called by fluxible framework
     */
    dehydrate: function() {
        return {
            db: this.db.toJson(),
            isPolyFilled: this.isPolyFilled
        };
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: rehydrate mechanism will be called by fluxible framework
     *
     * @param {String}      serializedDB, the stringify DB returned by "dehydrate"
     */
    rehydrate: function(state) {
        this.isPolyFilled = state.isPolyFilled;
        this.db.loadJSON(state.db);
    }
});

/**
 * @Author: George_Chen
 * @Description: save friendInfo document to the lokijs collection
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      doc, the message document
 */
function _importFriend(collection, doc) {
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(doc.uid, 'md5'),
        channelId: '',
        avatar: SharedUtils.argsCheckAsync(doc.avatar, 'avatar'),
        nickName: SharedUtils.argsCheckAsync(doc.nickName, 'nickName'),
        isOnline: SharedUtils.argsCheckAsync(doc.isOnline, 'boolean'),
        lastMessage: doc.lastMessage || '',
        isMessageReaded: true,
        hasIncomingCall: false,
    }).then(function(doc) {
        return collection.insert(doc);
    });
}
