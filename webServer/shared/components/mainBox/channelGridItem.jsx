var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var NavigationMixin = require('react-router').Navigation;

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var Paper = Mui.Paper;

/**
 * actions
 */
var NavToBoard = require('../../../client/actions/draw/navToBoard');

/**
 * child components
 */
var ChannelSummary = require('./channelSummary.jsx');
var ChannelHostInfo = require('./channelHostInfo.jsx');
var ChannelMembers = require('./channelMembers.jsx');
var ChannelSnapshot = require('./channelSnapshot.jsx');

/**
 * @Author: George_Chen
 * @Description: an Channel component to display each user's Channel
 *
 * @param {String}      this.props.channelId, channel's id
 * @param {String}      this.props.channelName, channel's partial name
 * @param {String}      this.props.hostName, the channel host's name
 * @param {String}      this.props.hostAvatar, the channel host's avatar
 * @param {String}      this.props.snapshotUrl, channel's drawing snapshot url 
 * @param {String}      this.props.memberList, channel's member list
 * @param {String}      this.props.time, the timestamp that user last visited
 * @param {Boolean}     this.props.isStarred, to inform channel has been subscribed or not
 * @param {Boolean}     this.props.isRtcOn, an status to inform channel currently has conference
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin, NavigationMixin],

    getInitialState: function() {
        return {
           zDepth: 0
        };
    },

    /**
     * handle mouse over event
     */
    _onMouseOver: function() {
        this.setState({
            zDepth: 2,
            isMouseOver: true
        });
    },

    /**
     * handle mouse out event
     */
    _onMouseOut: function() {
        this.setState({
            zDepth: 0,
            isMouseOver: false
        });
    },

    /**
     * handle event that user click the enter icon
     */
    _onEnterIconClick: function(channelId) {
        var info = this.props.channelInfo;
        this.executeAction(NavToBoard, {
            urlNavigator: this.transitionTo,
            channelId: info.channelId,
            boardId: info.lastBaord
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to get fromatted time string by visit timestamp
     */
    _getFormattedTime: function() {
        var date = new Date(this.props.channelInfo.visitTime);
        return (date.toLocaleDateString() + '  ' + date.getHours() + ':' + date.getMinutes());
    },

    render: function(){
        var info = this.props.channelInfo;
        return (
            <div className="ChannelGridItem" onClick={this._onClick}>
                <Paper zDepth={this.state.zDepth} rounded={false}
                    onMouseOver={this._onMouseOver} onMouseOut={this._onMouseOut}>
                    <ChannelSummary 
                        channelName={info.channelName}
                        hostName={info.hostInfo.nickName}
                        isRtcOn={info.isRtcOn} />
                    <ChannelHostInfo hostAvatar={info.hostInfo.avatar} />
                    <ChannelSnapshot url={info.snapshotUrl}/>
                    <div className="ChannelTimestamp Right">
                        <IconButton 
                            iconClassName="fa fa-sign-in" 
                            tooltip={'Enter this channel'} 
                            onClick={this._onEnterIconClick}/>
                        {this._getFormattedTime()}
                    </div>
                </Paper>
            </div>
        );
    }
});
