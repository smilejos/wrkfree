var React = require('react');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin'); 
var NavigationMixin = require('react-router').Navigation;

/**
 * actions
 */
var EnterWorkspace = require('../../../client/actions/enterWorkspace');

/**
 * child components
 */
var UserAvatar = require('../common/userAvatar.jsx');
var StateIcon = require('../common/stateIcon.jsx');
var BoardPreview = require('../common/boardPreview.jsx');
var Colors = require('material-ui').Styles.Colors

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
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin, NavigationMixin],

    /**
     * handle event that user click workspace snapshot
     */
    _onEnter: function() {
        var info = this.props.channelInfo;
        this.executeAction(EnterWorkspace, {
            urlNavigator: this.transitionTo,
            channelId: info.channelId
        });
    },

    /**
     * @Author: Jos Tung
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
        var starIconStyle = {};
        if (info.isStarred) {
            starIconStyle.color = Colors.yellow600;
        }
        return (
            <div className="ChannelSummary" >
                <div className="ChannelInfo" >
                    <div className="ChannelName">
                        {info.channelName}
                    </div>
                    <div className="visitedInfo">
                        {this._getFormattedTime()}
                    </div>
                </div>
                <div className="ChannelToolbar" >
                    <StateIcon
                        stateClass="toolIcon" 
                        iconClass="fa fa-tag"
                        style={{}} />
                    <StateIcon
                        stateClass="toolIcon" 
                        iconClass="fa fa-star"
                        style={starIconStyle} />
                    <StateIcon
                        stateClass="toolIcon" 
                        iconClass="fa fa-share"
                        style={{}} />
                </div>
                <UserAvatar isCircle avatar={info.hostInfo.avatar}/>
            </div>
        );
    },

    render: function(){
        var info = this.props.channelInfo;
        var summary = this._getChannelSummary(info);
        var listStyle = {
            position: 'relative',
            width: this.props.width,
            left: '50%',
            marginLeft: (this.props.width / 2 * -1),
            height: 70,
            minWidth: 500,
            marginBottom: 2,
            borderColor: Colors.grey300,
            borderStyle: 'solid',
            borderWidth: 1,
            backgroundColor: '#fff',
            transition: '0.3s'
        };
        return (
            <div className="ChannelListItem" style={listStyle}>
                <BoardPreview isGrid={false}
                    channelId={info.channelId}
                    clickHandler={this._onEnter}
                    previewClass="ChannelSnapshot"
                    imgClass="ChannelSnapshotImg" />
                {summary}
            </div>
        );
    }
});
