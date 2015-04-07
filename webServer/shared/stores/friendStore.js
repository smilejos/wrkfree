'use strict';
var createStore = require('fluxible/utils/createStore');
var Promise = require('bluebird');
var StoreUtils = require('./utils');

/**
 * the document schema of friend db collection
 */
var FriendSchema = {
    nickName:           {type : 'String', default : ''},
    uid:                {type : 'ObjectId', default : ''},
    avatar:             {type : 'String', default : ''},
    group:              {type : 'String', default : ''},
    isOnline:           {type : 'Boolean', default : ''}
};

var FriendStore = createStore({
    storeName: 'FriendStore',

    initialize: function() {
        this.dbName = 'FriendDB';
        this.db = this.getContext().getLokiDb(this.dbName);
        var collection = this.db.addCollection(this.dbName);
        collection.ensureIndex('nickName');
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
            return StoreUtils.validDocAsync(friendInfo, FriendSchema).then(function(doc) {
                return collection.insert(doc);
            });
        }).bind(this).then(function() {
            return this.emitChange();
        }).catch(function(err) {
            return console.log('[polyfillAsync]', err);
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
    }
});

module.exports = FriendStore;
