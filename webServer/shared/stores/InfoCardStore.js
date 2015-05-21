'use strict';
var CreateStore = require('fluxible/utils/createStore');
var Cache = require('lru-cache');
var SharedUtils = require('../../../sharedUtils/utils');


/**
 * InfoCard Store keep the state of all infocards
 */
module.exports = CreateStore({
    storeName: 'InfoCardStore',

    handlers: {
        'ON_QUICKSEARCH_UPDATE': '_onSearchUpdate',
        'ON_INFOCARD_UPDATE': '_onCardUpdate'
    },

    initialize: function() {
        this.cardStore = Cache();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: get the card state based on  card id
     *         NOTE: for user card, the cardId is user's uid;
     *               for channel card, the cardId is channel's id
     *               
     * @param {String}          cardId, the info card id
     */
    getCardState: function(cardId) {
        return this.cardStore.get(cardId);
    },

    /**
     * @Author: George_Chen
     * @Description: update the search results
     */
    _onSearchUpdate: function(data) {
        this._usersUpdate(data.users.results);
        this._channelsUpdate(data.channels.results);
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: simply update card state by its cardId
     *
     * @param {String}          cardId, the info card id
     * @param {Object}          state, the new state of card
     */
    _onCardUpdate: function(data) {
        if (!data.state) {
            return null;
        }
        var updateProps = Object.keys(data.state);
        var card = this.cardStore.get(data.cardId);
        SharedUtils.fastArrayMap(updateProps, function(prop) {
            card[prop] = data.state[prop];
        });
        this.cardStore.set(data.cardId, card);
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: cache information of user info cards
     *
     * @param {Array}          users, an array of users information
     */
    _usersUpdate: function(users) {
        var cardStore = this.cardStore;
        var card = null;
        SharedUtils.fastArrayMap(users, function(item) {
            card = cardStore.get(item.uid);
            cardStore.set(item.uid, {
                targetUid: item.uid,
                avatar: item.avatar,
                nickName: item.nickName,
                type: 'user',
                isKnown: item.isKnown,
                isReqSent: (card ? card.isReqSent : null)
            });
        });
    },

    /**
     * @Author: George_Chen
     * @Description: cache information of channel info cards
     *
     * @param {Array}          channels, an array of channels information
     */
    _channelsUpdate: function(channels) {
        var cardStore = this.cardStore;
        var card = null;
        SharedUtils.fastArrayMap(channels, function(item) {
            card = cardStore.get(item.channelId);
            cardStore.set(item.channelId, {
                targetUid: item.uid,
                avatar: item.avatar,
                nickName: item.nickName,
                type: 'channel',
                isKnown: item.isKnown,
                extraInfo: item.extraInfo,
                channelId: item.channelId,
                isReqSent: (card ? card.isReqSent : null)
            });
        });
    }
});
