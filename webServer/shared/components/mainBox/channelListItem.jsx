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
var ChannelSnapshot = require('./channelSnapshot.jsx');
var UserAvatar = require('../common/userAvatar.jsx');
var StateIcon = require('../common/stateIcon.jsx');

/**
 * @Author: Jos Tung
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

    /**
     * handle event that user click workspace snapshot
     */
    _onEnter: function() {
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
        return date.toLocaleDateString();
    },

    /**
     * @Author: Jos Tung
     * @Description: Move original summary component ot here
     */
    _getChannelSummary: function(info) {
        var toolIconStyle = {
            paddingTop: 5,
            cursor: 'pointer'
        }

        return (
            <div className="ChannelSummary" >
                <div className="ChannelInfo" >
                    <div className="ChannelName">
                        {info.channelName}
                    </div>
                    <div className="ChannelHost">
                        {this._getFormattedTime()}
                    </div>
                </div>
                <div className="ChannelToolbar" >
                    <StateIcon
                        stateClass="toolIcon" 
                        iconClass="fa fa-tag"
                        style={toolIconStyle} />
                    <StateIcon
                        stateClass="toolIcon" 
                        iconClass="fa fa-star"
                        style={toolIconStyle} />
                    <StateIcon
                        stateClass="toolIcon" 
                        iconClass="fa fa-share"
                        style={toolIconStyle} />
                </div>
                <UserAvatar isCircle avatar={info.hostInfo.avatar}/>
            </div>
        );
    },

    /**
     * @Author: Jos Tung
     * @Description: Move original snapshot component ot here
     */
    _getChannelSnapshot: function(url) {
        return (
            <div className="ChannelSnapshot" onClick={this._onEnter}>
                <img className="ChannelSnapshotImg" src={url}/>
            </div>
        );
    },

    render: function(){
        var info = this.props.channelInfo;
        var snapshot = this._getChannelSnapshot(info.snapshotUrl);
        var summary = this._getChannelSummary(info);
        return (
            <div className="ChannelListItem">
                {snapshot}
                {summary}
            </div>
        );
    }
});
