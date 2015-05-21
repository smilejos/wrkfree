'use strict';
var createStore = require('fluxible/utils/createStore');
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

module.exports = createStore({
    storeName: 'FriendStore',

    initialize: function() {
        this.dbName = 'FriendDB';
        this.db = this.getContext().getLokiDb(this.dbName);
        var collection = this.db.addCollection(this.dbName);
        collection.ensureIndex('nickName');
        this.isPolyFilled = null;
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
            return _impportFriend(collection, friendInfo);
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
     * @Description: update friend state
     */
    updateStatus: function() {
        // TODO: used to update friends online, avatar, nickName ...
    },

    getState: function() {
        var collection = this.db.getCollection(this.dbName);
        return {
            friends: collection.chain().data()
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
 * @Description: save message document to the lokijs collection
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      doc, the message document
 */
function _impportFriend(collection, doc) {
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(doc.uid, 'md5'),
        avatar: SharedUtils.argsCheckAsync(doc.avatar, 'avatar'),
        nickName: SharedUtils.argsCheckAsync(doc.nickName, 'nickName'),
        group: SharedUtils.argsCheckAsync(doc.group, 'string'),
        isOnline: SharedUtils.argsCheckAsync(doc.isOnline, 'boolean'),
    }).then(function(drawDoc) {
        return collection.insert(drawDoc);
    });
}
