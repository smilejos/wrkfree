var React = require('react');

/**
 * child components
 */
var UserAvatar = require('../common/userAvatar.jsx');

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var Paper = Mui.Paper;
var IconButton = Mui.IconButton;

/**
 * @Author: George_Chen
 * @Description: ChannelSummary display summary info of an channel item
 *
 * @param {String}      this.props.channelName, channel's partial name
 * @param {String}      this.props.hostName, the channel host's name
 * @param {Boolean}     this.props.isRtcOn, an status to inform channel currently has conference
 */
module.exports = React.createClass({
    render: function(){
        var isRtcOn = !!this.props.isRtcOn;
        var rtcIconStyle = 'fa fa-youtube-play redTag';
        return (
            <div className="ChannelSummary" >
                <Paper zDepth={0}>
                    <div className="pure-u-1-2" >
                        <div className="ChannelTitle" >{this.props.channelName}</div>
                        <div>{'@'+this.props.hostName}</div>
                    </div>
                    <div className="pure-u-1-2 Right" >
                        {isRtcOn ? (<IconButton iconClassName={rtcIconStyle} tooltip={'Live'}/>) : ''}
                    </div>
                </Paper>
            </div>
        );
    }
});
