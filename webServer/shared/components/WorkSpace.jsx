var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var WorkSpaceStore = require('../stores/WorkSpaceStore');

/**
 * child components
 */
var WorkSpaceBar = require('./WorkSpaceBar.jsx');
var DrawingArea = require('./mainBox/DrawingArea.jsx');
var SubWorkSpace = require('./rightBox/SubWorkSpace.jsx');
var FriendList = require('./rightBox/FriendList.jsx');

/**
 * the workspace.jsx is the main container of each channel
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [WorkSpaceStore]
        }
    },

    getInitialState: function() {
        return this._getState();
    },

    onStoreChange: function(){
        var state = this._getState();
        this.setState(state);
    },

    _getState: function() {
        return this.getStore(WorkSpaceStore).getState();
    },

    render: function(){
        var channelInfo= this.state.channel;
        var membersInfo= this.state.members;
        var drawInfo= this.state.draw;
        var boardIndex = this.props.route.query.board;
        drawInfo.currentBoardId = (boardIndex ? boardIndex -1 : 0);
        return (
            <div>
                <DrawingArea channel={channelInfo} drawInfo={drawInfo}/>
                <FriendList />
                <SubWorkSpace 
                    channelId={channelInfo.channelId} />
                <WorkSpaceBar 
                    onConferenceCall={this.state.rtc.onConferenceCall}
                    members={membersInfo} 
                    channel={channelInfo} />
            </div>
        );
    }
});