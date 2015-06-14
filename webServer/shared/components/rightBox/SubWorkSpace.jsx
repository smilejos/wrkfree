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
        var style = {};
        if (this.state.conferenceVisible && this.state.discussionVisible) {
            style.top = 50;
            style.height = 400;
            style.opacity = 1;
        } else if (this.state.discussionVisible){
            style.height = 0;
            style.opacity = 0;
        } else if (this.state.conferenceVisible) {
            style.top = 50;
            style.bottom = 0;
            style.opacity = 1;
        } else {
            style.top = 50;
            style.opacity = 0;
            style.height = 400;
        }
        return (
            <ConferenceArea 
                inlineStyle={style}
                channelId={this.props.channelId} />
        );
    },

    /**
     * @Author: George_Chen
     * @Description: to get the discussion view
     */
    _getDiscussionView: function() {
        var style = {};
        if (this.state.conferenceVisible && this.state.discussionVisible) {
            style.top = 450;
            style.bottom = 0;
            style.opacity = 1;
        } else if (this.state.discussionVisible){
            style.top = 50;
            style.bottom = 0;
            style.opacity = 1;
        } else if (this.state.conferenceVisible) {
            style.bottom = -100;
            style.top = 1000;
            style.height = 0;
            style.opacity = 0;
        } else {
            style.top = 50;
            style.bottom = 0;
            style.opacity = 1;
        }
        
        return (
            <DiscussionArea 
                inlineStyle={style}
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
