'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var Deque = require('double-ended-queue');

var DEFAULT_TEMP_DRAWS_LENGTH = 200;

module.exports = CreateStore({
    storeName: 'DrawTempStore',

    initialize: function() {
        this.tempDraws = new Deque(DEFAULT_TEMP_DRAWS_LENGTH);
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: push remote drawing chunks into temp draws
     *
     * @param {Object}      data.chunks, the draw chunks wait for drawing
     * @param {Object}      data.drawOptions, the draw related options
     */
    saveRemoteDraws: function(data) {
        this.tempDraws.push(data);
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: push an array of remote draw chunks into temp draws
     *
     * @param {Array}       data.record, an array of draw chunks
     * @param {Object}      data.drawOptions, the draw related options
     */
    saveRemoteRecord: function(data) {
        SharedUtils.fastArrayMap(data.record, function(chunks) {
            this.tempDraws.push({
                chunks: chunks,
                drawOptions: data.drawOptions
            });
        }.bind(this));
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for getting the current remote temp draws
     */
    getDraws: function() {
        return this.tempDraws;
    }
});
