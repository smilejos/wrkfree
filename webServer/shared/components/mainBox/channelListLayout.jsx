var React = require('react');
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
        var listWidth = this.props.containerWdith * 0.95;
        var listContent = SharedUtils.fastArrayMap(this.props.channels, function(item){
            return (
                <ChannelListItem 
                    key={item.channelId}
                    channelInfo={item} 
                    width={listWidth} />
            );
        });
        return (
            <div className="DashboardListLayout" > 
                {listContent}
            </div>
        );
    }
});
