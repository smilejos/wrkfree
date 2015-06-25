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
     * handle event that user click the enter icon
     */
    _onEnterIconClick: function() {
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

    /**
     * @Author: Jos Tung
     * @Description: Move original summary component ot here
     */
    _getChannelSummary: function(info) {
        return (
            <div className="ChannelSummary" >
                <div className="ChannelInfo" >
                    <div className="ChannelName">
                        {info.channelName}
                    </div>
                    <div className="ChannelHost">
                        {info.hostInfo.nickName}
                    </div>
                </div>
                <div className="ChannelToolbar" >
                    <IconButton iconClassName="fa fa-user-plus" />
                    <IconButton iconClassName="fa fa-tag" />
                    <IconButton iconClassName="fa fa-star" />
                </div>
            </div>
        );
    },

    /**
     * @Author: Jos Tung
     * @Description: Move original snapshot component ot here
     */
    _getChannelSnapshot: function(url) {
        return (
            <div className="ChannelSnapshot" onClick={this._onEnterIconClick.bind(this)}>
                <img className="ChannelSnapshotImg" src={url}/>
            </div>
        );
    },

    render: function(){
        var info = this.props.channelInfo;
        var snapshot = this._getChannelSnapshot(info.snapshotUrl);
        var summary = this._getChannelSummary(info);
        return (
            <div className="ChannelGridItem" onClick={this._onClick}>
                {snapshot}
                {summary}
            </div>
        );
    }
});
