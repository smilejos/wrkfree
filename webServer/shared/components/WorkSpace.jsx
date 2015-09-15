var React = require('react');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin'); 
var WorkSpaceStore = require('../stores/WorkSpaceStore');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * actions
 */
var GetVisitors = require('../../client/actions/channel/getVisitors');
var ToggleMainViewpoint = require('../../client/actions/toggleMainViewpoint');

/**
 * stores
 */
var ChannelVisitorStore = require('../stores/ChannelVisitorStore');

/**
 * material ui components
 */
var Mui = require('material-ui');
var Avatar = Mui.Avatar;

/**
 * child components
 */
var MainWorkSpace = require('./mainBox/MainWorkSpace.jsx');
var WorkSpaceBar = require('./WorkSpaceBar.jsx');

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

    _onContentClick: function() {
        this.executeAction(ToggleMainViewpoint, {
            isActive: true
        });
    },

    render: function(){
        var channelInfo= this.state.channel;
        var membersInfo= this.state.members;
        var drawInfo= this.state.draw;
        return (
            <div onClick={this._onContentClick}>
                <MainWorkSpace 
                    channel={channelInfo} 
                    drawInfo={drawInfo}/>
                <VisitorList channelId={channelInfo.channelId} />
                <WorkSpaceBar 
                    onConferenceCall={this.state.rtc.onConferenceCall}
                    members={membersInfo} 
                    status={this.state.status}
                    channel={channelInfo} />
            </div>
        );
    }
});

/**
 * to display current channel visitor list
 *
 * @param {String}      this.props.channelId, the channel id
 */
var VisitorList = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [ChannelVisitorStore],
        }
    },

    _onStoreChange: function() {
        var store = this.getStore(ChannelVisitorStore);
        this.setState({
            visitors: store.getVisitors(this.props.channelId)
        });
    },

    getInitialState: function() {
        return {
            visitors: []
        };
    },

    componentDidMount: function() {
        this.executeAction(GetVisitors, {
            channelId: this.props.channelId
        });
    },

    componentDidUpdate: function(prevProps) {
        var store, visitors;
        if (prevProps.channelId !== this.props.channelId) {
            store = this.getStore(ChannelVisitorStore)
            visitors = store.getVisitors(this.props.channelId);
            if (visitors.length > 0) {
                return this.setState({
                    visitors: visitors
                });
            }
            this.executeAction(GetVisitors, {
                channelId: this.props.channelId
            });
        }
    },

    render: function() {
        var visitors = this.state.visitors;
        var visitorStyle = {
            float: 'left',
            boxShadow: '-1px 2px 2px rgba(0,0,0,0.2), 2px 6px 12px rgba(0,0,0,0.2)',
            marginLeft: 5
        };
        var visitorList = SharedUtils.fastArrayMap(visitors, function(info, index) {
            return (
                <Avatar
                    key={info.uid}
                    style={visitorStyle}
                    src={info.avatar} />
            );
        });
        return (
            <div style={{position: 'absolute', left: '15%', bottom: 2, zIndex: 3}}>
                {visitorList}
            </div>
        );
    }
});
