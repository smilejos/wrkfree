var React = require('react');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * load configs
 */
var Configs = require('../../../../configs/config');
var BOARD_WIDTH = Configs.get().params.draw.boardWidth;
var BOARD_HEIGHT = Configs.get().params.draw.boardHeight;

if (!SharedUtils.isNumber(BOARD_WIDTH) || 
    !SharedUtils.isNumber(BOARD_HEIGHT)) {
    throw new Error('error while on getting draw related params');
}

/**
 * child components
 */
var DrawingBoard = require('./drawingBoard.jsx');
var ConferenceArea = require('../rightBox/ConferenceArea.jsx');
var DiscussionArea = require('../rightBox/DiscussionArea.jsx');

var ResizeTimeout = null;

/**
 * the DrawingArea.jsx is the main container of drawing feature
 */
module.exports = React.createClass({
    getInitialState: function() {
        // give the default value of canvas width and height
        return {
            canvasWidth: BOARD_WIDTH,
            canvasHeight: BOARD_HEIGHT
        };
    },

    componentDidMount: function() {
        var self = this;
        self._resizeCanvas();
        window.addEventListener('resize', function(e) {
            if (ResizeTimeout) {
                clearTimeout(ResizeTimeout);
            }
            ResizeTimeout = setTimeout(function() {
                self._resizeCanvas();
            }, 300);
        });
    },

    /**
     * @Author: George_Chen
     * @Description: resize the current canvas
     */
    _resizeCanvas: function() {
        var ratio = (BOARD_WIDTH / BOARD_HEIGHT);
        var width = (window.innerWidth - 200) * 0.8;
        var height = width / ratio;
        if (height > 315) {
            this.setState({
                canvasWidth: width,
                canvasHeight: height
            });   
        }
    },

    render: function(){
        var cid = this.props.channel.channelId;
        return (
            <div className="mainBox">
                <DrawingBoard 
                    width={this.state.canvasWidth}
                    height={this.state.canvasHeight}
                    channelId={cid} 
                    boardId={this.props.drawInfo.currentBoardId}
                    drawInfo={this.props.drawInfo}/>
                <ConferenceArea channelId={cid} />
                <DiscussionArea channelId={cid} />
            </div>
        );
    }
});
