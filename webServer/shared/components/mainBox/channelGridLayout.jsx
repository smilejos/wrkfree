var React = require('react');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * child components
 */
var ChannelGridItem = require('./channelGridItem.jsx');

/**
 * @Author: George_Chen
 * @Description: container of channels grid layout on dashboard
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
 */
module.exports = React.createClass({
    render: function(){
        var listContent = SharedUtils.fastArrayMap(this.props.channels, function(item){
            return (
                <ChannelGridItem 
                    key={item.channelId}
                    channelInfo={item} />
            );
        });
        return (
            <div className="DashboardGridLayout" > 
                {listContent}
            </div>
        );
    }
});
