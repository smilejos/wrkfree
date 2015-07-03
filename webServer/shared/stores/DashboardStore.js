'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');

var OUTDATED_TIME_IN_MSECOND = 30000;

module.exports = CreateStore({
    storeName: 'DashboardStore',

    handlers: {
        'CHANGE_ROUTE': '_onChangeRoute',
        'SET_DASHBOARD_LAYOUT': 'setLayout',
        'ON_CHANNEL_ADDED': '_onChannelAdded'
    },

    initialize: function() {
        this.isDashboardGrid = true;
        this.isOutdated = true;
        this.outdatedTimer = null;
        this.dbName = 'DashboardDB';
        this.db = this.getContext().getLokiDb(this.dbName);
        this.db.addCollection(this.dbName).ensureIndex('channelId');
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: set the dashboard layout
     *
     * @param {Object}       state.channels, an array of channel info
     */
    setLayout: function(data) {
        if (SharedUtils.isBoolean(data.isDashboardGrid)) {
            this.isDashboardGrid = data.isDashboardGrid;
            this.emitChange();
        }
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill dashboard state infomation
     *
     * @param {Object}       state.channels, an array of channel info
     */
    polyfillAsync: function(state) {
        var collection = this.db.getCollection(this.dbName);
        // clean dashboard store before polyfill
        collection.removeDataOnly();
        return Promise.map(state.channels, function(item) {
            return _saveDashboardChannel(collection, {
                channelId: item.channel.channelId,
                channelName: item.channel.name,
                hostInfo: item.hostInfo,
                snapshotUrl: _getSnapshotUrl(item.channel.channelId),
                isStarred: item.isStarred,
                visitTime: item.visitTime,
                lastBaord: item.lastBaord
            });
        }).bind(this).then(function() {
            this._setOutdatedTimer();
            this.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('DashboardStore', 'polyfillAsync', err);
            return null;
        });
    },

    /**
     * @Author: George_Chen
     * @Description: update currently added channel on dashboard
     * 
     * @param {Object}     data.channelInfo, the info of added channel
     */
    _onChannelAdded: function(data) {
        var collection = this.db.getCollection(this.dbName);
        var info = data.channelInfo;
        return _saveDashboardChannel(collection, {
            channelId: info.channelId,
            channelName: info.name,
            hostInfo: info.hostInfo,
            snapshotUrl: _getSnapshotUrl(info.channelId),
            isStarred: info.isStarred,
            visitTime: info.visitTime,
            lastBaord: 0
        }).bind(this).then(function() {
            this.emitChange();
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
        var query = {
            channelId: route.params.channelId
        };
        collection.chain().find(query).update(function(obj) {
            obj.visitTime = Date.now();
        });
    },

    /**
     * @Author: George_Chen
     * @Description: used to manage the outdated status of store
     */
    _setOutdatedTimer: function() {
        var self = this;
        self.isOutdated = false;
        if (typeof window === 'undefined') {
            return;
        }
        if (this.outdatedTimer) {
            clearTimeout(this.outdatedTimer);
        }
        self.outdatedTimer = setTimeout(function() {
            self.isOutdated = true;
        }, OUTDATED_TIME_IN_MSECOND);
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to check current store data is outdated or not
     */
    isStoreOutdated: function() {
        return this.isOutdated;
    },

    getState: function() {
        var collection = this.db.getCollection(this.dbName);
        return {
            isDashboardGrid: this.isDashboardGrid,
            channels: collection.chain().simplesort('visitTime', true).data()
        };
    },

    dehydrate: function() {
        return {
            isDashboardGrid: this.isDashboardGrid,
            db: this.db.toJson(),
            isOutdated: this.isOutdated
        };
    },

    rehydrate: function(state) {
        this.isDashboardGrid = state.isDashboardGrid;
        this.db.loadJSON(state.db);
        this.isOutdated = state.isOutdated;
        if (!state.isOutdated) {
            this._setOutdatedTimer();
        }
    }
});

/**
 * @Author: George_Chen
 * @Description: to save channel item to current store
 *
 * @param {Object}      collection, lokijs collection
 * @param {Object}      doc, the channel summary document
 */
function _saveDashboardChannel(collection, doc) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(doc.channelId, 'md5'),
        channelName: SharedUtils.argsCheckAsync(doc.channelName, 'alphabet'),
        hostInfo: doc.hostInfo,
        snapshotUrl: SharedUtils.argsCheckAsync(doc.snapshotUrl, 'string'),
        isStarred: SharedUtils.argsCheckAsync(doc.isStarred, 'boolean'),
        visitTime: SharedUtils.argsCheckAsync(doc.visitTime, 'number'),
        lastBaord: SharedUtils.argsCheckAsync(doc.lastBaord, 'number'),
    }).then(function(doc) {
        return collection.insert(doc);
    });
}

/**
 * @Author: George_Chen
 * @Description: to generate channel snapshot url
 *
 * @param {String}      cid, the channel id
 */
function _getSnapshotUrl(cid) {
    return '/app/workspace/' + cid + '/preview';
}
