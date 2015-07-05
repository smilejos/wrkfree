var React = require('react');
var ReactGridLayout = require('react-grid-layout');
var SharedUtils = require('../../../../sharedUtils/utils');

var ChannelListItem = require('./channelListItem.jsx');

/**
 * @Author: Jos Tung
 * @Description: container of channels list layout on dashboard
 *
 * @param {Array}        this.props.channels, an array of channel informations,
 *  NOTE: each item in channels should include:
 *      item.channelId,
 *      item.channelName,
 *      item.hostName,
 *      item.hostAvatar,
 *      item.snapshotUrl,
 *      item.memberList,
 *      item.time,
 *      item.isRtcOn 
 */
module.exports = React.createClass({
    render: function(){
        var listContent = SharedUtils.fastArrayMap(this.props.channels, function(item, index){
            return (
                <div key={index}>
                    <ChannelListItem channelInfo={item} />
                </div>
            );
        });
        return (
            <div className="DashboardListLayout" > 
                {listContent}
            </div>
        );
    }
});
