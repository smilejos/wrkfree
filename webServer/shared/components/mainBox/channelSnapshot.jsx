var React = require('react');

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var Paper = Mui.Paper;

/**
 * @Author: George_Chen
 * @Description: to display channel's drawing snapshot
 *
 * @param {String}      this.props.url, channel's drawing snapshot url 
 */
module.exports = React.createClass({
    render: function(){
        return (
            <div className="ChannelSnapshot">
                <Paper zDepth={0} rounded={false}>
                    <img className="ChannelSnapshotImg" src={this.props.url}/>
                </Paper>
            </div>
        );
    }
});
