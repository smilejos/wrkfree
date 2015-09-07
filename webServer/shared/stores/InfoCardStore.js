'use strict';
var CreateStore = require('fluxible/addons').createStore;
var Cache = require('lru-cache');
var SharedUtils = require('../../../sharedUtils/utils');


/**
 * InfoCard Store keep the state of all infocards
 */
module.exports = CreateStore({
    storeName: 'InfoCardStore',

    handlers: {
        'ON_QUICKSEARCH_UPDATE': '_onSearchUpdate',
        'ON_INFOCARD_UPDATE': '_onCardUpdate',
        'ON_NOTIFICATION': '_onNotification'
    },

    initialize: function() {
        this.cardStore = Cache();
    },

    /**
     * @Author: George_Chen
     * @Description: update card state when getting new notification from server
     *
     * @param {String}          data.type, the notification type
     * @param {Boolean}         data.isReq, indicate notification isRequest or not
     * @param {Boolean}         data.respToPermitted, the answer of response notification
     * @param {Object}          data.extraInfo, notification channel info
     * @param {Object}          data.sender, notification sender info
     */
    _onNotification: function(data) {
        if (data.isReq) {
            return;
        }
        var isChannel = (data.type === 'channel');
        var cardId = (isChannel ? data.extraInfo.channelId : data.sender.uid);
        var card = this.cardStore.get(cardId);
        if (card) {
            card.isKnown = data.respToPermitted;
            card.isReqSent = false;
            this.cardStore.set(cardId, card);
            this.emitChange();
        }
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
                isReqSent: (card ? card.isReqSent : true)
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
                isReqSent: (card ? card.isReqSent : true)
            });
        });
    }
});
