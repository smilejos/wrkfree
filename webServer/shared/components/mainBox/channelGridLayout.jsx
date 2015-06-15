var React = require('react');
var ReactGridLayout = require('react-grid-layout');

/**
 * global params
 */
var GLOBAL_GRID_MAX_COLS = 3;
var GLOBAL_GRID_ITEM_HEIGHT = 360;

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
 *      item.isRtcOn 
 */
module.exports = React.createClass({
    render: function(){
        var listLayout = [];
        var listContent = this.props.channels.map(function(item, index){
            listLayout.push({
                i:index, 
                x: index%GLOBAL_GRID_MAX_COLS, 
                y: index%GLOBAL_GRID_MAX_COLS, 
                w: 1, // the number of colums used by this item
                h: 1, // the number of row used by this item
            });
            return (
                <div key={index}>
                    <ChannelGridItem channelInfo={item} />
                </div>
            );
        });
        return (
            <ReactGridLayout 
                className="GridLayout"
                layout={listLayout}
                cols={GLOBAL_GRID_MAX_COLS} 
                rowHeight={GLOBAL_GRID_ITEM_HEIGHT}
                isDraggable={false}>
                {listContent}
            </ReactGridLayout>
        );
    }
});
