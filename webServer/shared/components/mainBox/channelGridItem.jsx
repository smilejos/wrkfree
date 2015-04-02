var React = require('react');
var NavigationMixin = require('react-router').Navigation;

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var Paper = Mui.Paper;

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
 * @param {Boolean}     this.props.isSubscribed, to inform channel has been subscribed or not
 * @param {Boolean}     this.props.isRtcOn, an status to inform channel currently has conference
 */
module.exports = React.createClass({
    mixins: [NavigationMixin],

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
        this.transitionTo('/app/channel/'+this.props.channelId);
    },

    render: function(){
        var info = this.props;
        return (
            <div className="ChannelGridItem" onClick={this._onClick}>
                <Paper zDepth={this.state.zDepth} rounded={false}
                    onMouseOver={this._onMouseOver} onMouseOut={this._onMouseOut}>
                    <ChannelSummary 
                        channelName={this.props.channelName}
                        hostName={this.props.hostName}
                        isRtcOn={this.props.isRtcOn} />
                    <ChannelHostInfo hostAvatar={this.props.hostAvatar} />
                    <ChannelSnapshot url={info.snapshotUrl}/>
                    <ChannelMembers members={info.memberList} />
                    <div className="ChannelTimestamp Right">
                        <IconButton 
                            iconClassName="fa fa-sign-in" 
                            tooltip={'Enter this channel'} 
                            onClick={this._onEnterIconClick}/>
                        {info.time}
                    </div>
                </Paper>
            </div>
        );
    }
});