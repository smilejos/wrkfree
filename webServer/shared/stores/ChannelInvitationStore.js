'use strict';
var CreateStore = require('fluxible/addons').createStore;

/**
 * this store is used to save the state of channel invitation data
 * 
 * NOTE: when channel host try to add new members, 
 *       he must open the channelInvitation component
 */
module.exports = CreateStore({
    storeName: 'ChannelInvitationStore',

    handlers: {
        'TOGGLE_CHANNEL_INVITATION': '_toggleChannelInvitation',
        'UPDATE_INVITATION_RESULTS': '_updateInvitationResults',
        'ADD_INVITATION_TARGET': '_addInvitationTarget',
        'REMOVE_INVITATION_TARGET': '_removeInvitationTarget'
    },

    initialize: function() {
        this.isActive = false;
        this.originResults = [];
        this.results = [];
        this.targets = [];
    },

    /**
     * @Author: George_Chen
     * @Description: to toggle the active status of channelInvitation component
     *
     * @param {Boolean}          data.isActive, indicate is active or not
     */
    _toggleChannelInvitation: function(data) {
        this.isActive = data.isActive;
        this.results = [];
        this.targets = [];
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: update the search results on channel invitation component
     *
     * @param {Array}          data.originResults, original search results
     * @param {Array}          data.results, filtered search results 
     */
    _updateInvitationResults: function(data) {
        this.originResults = data.originResults;
        this.results = data.results;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: add new target member to invitation target list
     *
     * @param {Object}          data.target, information of target member
     */
    _addInvitationTarget: function(data) {
        this.targets.push(data.target);
        this.results = this.results.filter(function(info) {
            return (data.target.uid !== info.uid);
        });
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: remove target member from invitation target list
     *
     * @param {Object}          data.target, information of target member
     */
    _removeInvitationTarget: function(data) {
        var originResults = this.originResults;
        this.targets = this.targets.filter(function(info) {
            return (data.target.uid !== info.uid);
        });
        for (var i = 0; i < originResults.length; ++i) {
            if (originResults[i].uid === data.target.uid) {
                this.results.push(data.target);
                break;
            }
        }
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: get the state of channelInvitation component
     */
    getState: function() {
        return {
            isActive: this.isActive,
            results: this.results,
            targets: this.targets
        };
    }
});
