'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');

var EVENT_TIMEOUT_IN_MSECOND = 3000;

/**
 * used to keep all alive toast events
 */
module.exports = CreateStore({
    storeName: 'EventToasterStore',

    handlers: {
        'ON_TOAST_EVENT': '_onToastEvent',
        'ON_CUSTOM_EVENT': '_onCustomEvent',
        'CLOSE_TOAST_EVENT': '_closeToastEvent'
    },

    initialize: function() {
        this.eventList = {};
        this.timers = {};
    },

    /**
     * @Author: George_Chen
     * @Description: save the new toast event
     *         NOTE: we set the close timer for each new event
     *         
     * @param {String}      data.type, the type of event
     * @param {String}      data.title, the event message title
     * @param {String}      data.message, the event message
     * @param {String}      data.actionLabel, the label of extra-action
     * @param {Function}    data.actionHandler, the handler of extra-action
     */
    _onToastEvent: function(data) {
        var id = Date.now().toString();
        this.eventList[id] = {
            type: data.type,
            title: data.title,
            message: data.message,
            actionLabel: data.actionLabel,
            actionHandler: data.actionHandler
        };
        this._setCloseTimer(id);
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: save the new customized event
     *         NOTE: for flexibility, we can also customized the toast event
     *
     * @param {String}      data.id, the id of event
     * @param {String}      data.title, the event message title
     * @param {String}      data.message, the event message
     * @param {String}      data.actionLabel, the label of extra-action
     * @param {Number}      data.ttl, the time to live of current event
     * @param {Function}    data.actionHandler, the handler of extra-action
     */
    _onCustomEvent: function(data) {
        var id = data.eventId;
        this.eventList[id] = {
            type: 'info',
            title: data.title,
            message: data.message,
            actionLabel: data.actionLabel,
            actionHandler: data.actionHandler
        };
        this._setCloseTimer(id, data.ttl);
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: manually close specific event
     *         
     * @param {String}      data.eventId, the event id
     */
    _closeToastEvent: function(data) {
        var id = data.eventId;
        clearTimeout(this.timers[id]);
        delete this.timers[id];
        delete this.eventList[id];
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: handler for setting event close timer
     *         
     * @param {String}      data.eventId, the event id
     */
    _setCloseTimer: function(eventId, ttl) {
        var self = this;
        var dismissTime = (SharedUtils.isNumber(ttl) ? ttl : EVENT_TIMEOUT_IN_MSECOND);
        self.timers[eventId] = setTimeout(function() {
            delete self.eventList[eventId];
            delete self.timers[eventId];
            self.emitChange();
        }, dismissTime);
    },

    getState: function() {
        return {
            eventList: this.eventList
        };
    }
});
