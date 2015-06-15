var React = require('react');
/**
 * child components
 */
var DrawingBoard = require('./drawingBoard.jsx');
var DrawingPalette = require('./drawingPalette.jsx');

/**
 * the DrawingArea.jsx is the main container of drawing feature
 */
module.exports = React.createClass({
    render: function(){
        return (
            <div className="mainBox" >
                <DrawingPalette isActive={this.props.drawInfo.drawOptions.palette}/>
                <DrawingBoard 
                    channelId={this.props.channel.channelId} 
                    boardId={this.props.drawInfo.currentBoardId}
                    drawInfo={this.props.drawInfo}/>
            </div>
        );
    }
});
