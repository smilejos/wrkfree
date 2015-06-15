var React = require('react');
var FluxibleMixin = require('fluxible').Mixin; 

/**
 * stores
 */
var ToggleStore = require('../../stores/ToggleStore');

/**
 * child components
 */
var ConferenceArea = require('./ConferenceArea.jsx');
var DiscussionArea = require('./DiscussionArea.jsx');

/**
 * @Author: George_Chen
 * @Description: used to render sub-workspace component view
 *         NOTE: currently located on the right part of workspace.jsx
 *
 * @param {String}      this.props.channelId, channel's id
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [ToggleStore]
        }
    },

    _getStoreState: function() {
        var toggleState = this.getStore(ToggleStore).getState();
        return {
            conferenceVisible: toggleState.conferenceVisible,
            discussionVisible: toggleState.discussionVisible            
        };
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    _onStoreChange: function() {
        var state = this._getStoreState();
        this.setState(state);
    },

    /**
     * @Author: George_Chen
     * @Description: to get the conference view
     */
    _getConferenceView: function() {
        var conferenceAreaHeight = 0;
        if (this.state.conferenceVisible) {
            conferenceAreaHeight = 300;
        }
        return (
            <ConferenceArea 
                inlineStyle={{'height':conferenceAreaHeight}}
                channelId={this.props.channelId} />
        );
    },

    /**
     * @Author: George_Chen
     * @Description: to get the discussion view
     */
    _getDiscussionView: function() {
        var DiscussionAreaTop = 0;
        if (!this.state.discussionVisible) {
            DiscussionAreaTop = 1000;
        }
        if (this.state.conferenceVisible) {
            DiscussionAreaTop = 400;
        }
        return (
            <DiscussionArea 
                inlineStyle={{'top':DiscussionAreaTop}}
                channelId={this.props.channelId} />
        );
    },
    
    render: function(){
        return (
            <div>
                {this._getConferenceView()}
                {this._getDiscussionView()}
            </div>
        );
    }
});
