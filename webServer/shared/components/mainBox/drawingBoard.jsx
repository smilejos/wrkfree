var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');

/**
 * load configs
 */
var Configs = require('../../../../configs/config');
var BOARD_WIDTH = Configs.get().params.draw.boardWidth;
var BOARD_HEIGHT = Configs.get().params.draw.boardHeight;
var ACTIVED_DRAWS_LIMIT = Configs.get().params.draw.activeDrawsLimit;

if (!SharedUtils.isNumber(BOARD_WIDTH) || 
    !SharedUtils.isNumber(BOARD_HEIGHT) || 
    !SharedUtils.isNumber(ACTIVED_DRAWS_LIMIT)) {
    throw new Error('error while on getting draw related params');
}

/**
 * actions
 */
var InitToDraw = require('../../../client/actions/draw/initToDraw');
var Drawing = require('../../../client/actions/draw/drawing');
var SaveDrawRecord = require('../../../client/actions/draw/saveDrawRecord');
var GetDrawBoard = require('../../../client/actions/draw/getDrawBoard');
var UpdateBaseImage = require('../../../client/actions/draw/updateBaseImage');
var SaveSingleDraw = require('../../../client/actions/draw/saveSingleDraw');

/**
 * stores
 */
var DrawTempStore = require('../../stores/DrawTempStore');
var DrawStore = require('../../stores/DrawStore');

/**
 * child components
 */
var DrawingPalette = require('./drawingPalette.jsx');
var DrawingToolBar = require('./drawingToolBar.jsx');

var prev = {};

var IsDrawClicked = false;
var DelayTimer = null;

/**
 * the drawingBoard.jsx is the drawing board
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            'onTempDrawChange': [DrawTempStore],
            'onDrawBoardChange': [DrawStore]
        }
    },

    getInitialState: function() {
        return {
            canvas: null,
            image: null
        };
    },

    /**
     * @Author: George_Chen
     * @Description: based on nextProps, check and update drawing board or not
     */
    componentWillReceiveProps: function(nextProps) {
        var prevCid = this.props.channelId;
        var prevBid = this.props.boardId;
        var isChannelChange = (prevCid !== nextProps.channelId);
        var isBoardChange = (prevBid !== nextProps.boardId);
        var context = window.context;
        if (isChannelChange) {
            this._cleanBoard();
        }
        if (nextProps.drawInfo.boardNums === 0) {
            return;
        }
        if (isChannelChange || isBoardChange) {
            context.executeAction(InitToDraw, {
                channelId: prevCid,
                boardId: prevBid,
                isInited: false            
            }).then(function(){
                context.executeAction(GetDrawBoard, {
                    channelId: nextProps.channelId,
                    boardId: nextProps.boardId
                });
            });
        }
        /**
         * auto change cursor when props change
         */
        _changeBoardWheel(this.props.drawInfo.drawOptions);
    },

    componentDidUpdate: function(prevProps) {
        // this means canvas has resized, and we also need to change the scale
        if (prevProps.width !== this.props.width) {
            _getDrawBoardCtx().scale(this.props.width/BOARD_WIDTH, this.props.height/BOARD_HEIGHT);
            _changeBoardWheel(this.props.drawInfo.drawOptions);
            this.executeAction(GetDrawBoard, {
                channelId: this.props.channelId,
                boardId: this.props.boardId
            });
        }
    },

    componentWillUnmount: function() {
        this._cleanBoard();
    },

    /**
     * @Author: George_Chen
     * @Description: initialize the draw board 
     */
    componentDidMount: function(){
        var canvas = document.createElement('canvas');
        /**
         * this canvas and image element is for internal used
         * not for client drawing
         */
        canvas.width = BOARD_WIDTH;
        canvas.height = BOARD_HEIGHT;
        this.state.canvas = canvas;
        this.state.image = document.createElement('img');

        /**
         * first time init for mouse cursor
         */
        _changeBoardWheel(this.props.drawInfo.drawOptions);

        // get drawInfo
        if (this.props.drawInfo.boardNums > 0) {
            this.executeAction(GetDrawBoard, {
                channelId: this.props.channelId,
                boardId: this.props.boardId
            });
        }
    },

    /**
     * @Author: George_Chen
     * @Description: for handling drawStore change
     *         NOTE: drawStore save completed draw record documents
     */
    onDrawBoardChange: function(){
        var canvas = document.getElementById('DrawBoard');
        var cid = this.props.channelId;
        var bid = this.props.boardId;
        var self = this;
        var drawInfo = this.getStore(DrawStore).getDrawInfo(cid, bid);
        var archives = drawInfo.records.filter(function(doc){
            return doc.isArchived;
        });
        if (archives.length > 0 ) {
            setTimeout(function(){
                self._updateBaseImage(drawInfo.baseImg, archives);
            });
        }
        DrawUtils.loadCanvasAsync(canvas, this.state.image, drawInfo.baseImg, drawInfo.records);
    },    

    /**
     * @Author: George_Chen
     * @Description: for handling drawTempStore change
     *         NOTE: draw temp store save realtime draw chunks
     */
    onTempDrawChange: function(){
        var cid = this.props.channelId;
        var bid = this.props.boardId;
        var ctx = _getDrawBoardCtx();
        var rawData = this.getStore(DrawTempStore).getLastDraw(cid, bid);
        DrawUtils.draw(ctx, rawData.chunks, rawData.drawOptions);
    },

    /**
     * @Author: George_Chen
     * @Description: do a full clean on current draw board
     */
    _cleanBoard: function() {
        var boardCanvas = React.findDOMNode(this.refs.mainCanvas);
        this.getStore(DrawStore).cleanStore();
        DrawUtils.cleanCanvas(boardCanvas);
    },

    /**
     * @Author: George_Chen
     * @Description: for update board base image internally on client side
     *         NOTE: use internal canvas to generate new base image
     *
     * @param {String}      img, image date url
     * @param {Array}       archiveRecords, an array archived draw records
     */
    _updateBaseImage: function(img, archiveRecords) {
        var cid = this.props.channelId;
        var bid = this.props.boardId;
        var canvas = this.state.canvas;
        DrawUtils.loadCanvasAsync(canvas, this.state.image, img, archiveRecords)
            .bind(this)
            .then(function(loadedCanvas){
                if (!loadedCanvas) {
                    console.error('update base image fail');
                }
                this.executeAction(UpdateBaseImage, {
                    channelId: cid,
                    boardId: bid,
                    imgDataUrl: loadedCanvas.toDataURL(),
                    outdatedDocs: archiveRecords
                });
            });
    },

    /**
     * @Author: George_Chen
     * @Description: for getting mouse position on canvas
     * 
     * @param {Object}       canvasEvent, canvas event object
     */
    _getCanvasMouse: function(canvasEvent) {
        // app-header-height = 50px defined in css
        var headerHeight = 50;
        var container = React.findDOMNode(this);
        var board = React.findDOMNode(this.refs.mainCanvas);
        var workspaceScrollTop = this.props.scrollTopHandler();
        return {
            x: (canvasEvent.pageX - container.offsetLeft) * (BOARD_WIDTH/board.width),
            y: (canvasEvent.pageY - headerHeight - container.offsetTop + workspaceScrollTop) * (BOARD_HEIGHT/board.height)
        };
    },

    _startToDraw: function(e) {
        var board = React.findDOMNode(this.refs.mainCanvas);
        if (this.props.drawInfo.boardNums === 0 || e.button !== 0 || IsDrawClicked) {
            return;
        }
        // 0: left click, 1: middle click, 2: right click
        IsDrawClicked = true;
        prev = this._getCanvasMouse(e);
        this.executeAction(InitToDraw, {
            channelId: this.props.channelId,
            boardId: this.props.boardId,
        });
        this.getStore(DrawTempStore).cleanLocalTemp({
            channelId: this.props.channelId,
            boardId: this.props.boardId,
        });
        board.onmousemove = this._drawing;
    },

    _stopToDraw: function() {
        var board = React.findDOMNode(this.refs.mainCanvas);
        board.onmousemove = null;
        if (IsDrawClicked) {
            var drawTempStore = this.getStore(DrawTempStore);
            var localDraws = drawTempStore.getLocalDraws(this.props.channelId, this.props.boardId);
            drawTempStore.cleanLocalTemp({
                channelId: this.props.channelId,
                boardId: this.props.boardId,                
            });
            if (localDraws.length > 0) {
                this.executeAction(SaveDrawRecord, {
                    channelId: this.props.channelId,
                    boardId: this.props.boardId,
                    localDraws: localDraws,
                    drawOptions: this.props.drawInfo.drawOptions
                });
            } else {
                // means user draw at the same position, so trigger different action
                this.executeAction(SaveSingleDraw, {
                    channelId: this.props.channelId,
                    boardId: this.props.boardId,
                    chunks: {
                        fromX: prev.x,
                        fromY: prev.y,
                        toX: prev.x + 0.1,
                        toY: prev.y + 0.1
                    },
                    drawOptions: this.props.drawInfo.drawOptions
                });
            }
            clearTimeout(DelayTimer);
            DelayTimer = setTimeout(function(){
                IsDrawClicked = false;
                DelayTimer = null;
            }, 100);
        }
    },

    _drawing: function(e) {
        if (!IsDrawClicked || DelayTimer) {
            return;
        }
        var tempStore = this.getStore(DrawTempStore);
        var cid = this.props.channelId;
        var bid = this.props.boardId;
        var localDraws = tempStore.getLocalDraws(cid, bid);
        if (localDraws && localDraws.length >= ACTIVED_DRAWS_LIMIT) {
            return this._stopToDraw();
        }
        var position = this._getCanvasMouse(e);
        var data = {
            channelId: this.props.channelId,
            boardId: this.props.boardId,
            chunks: {
                fromX: prev.x,
                fromY: prev.y,
                toX: position.x,
                toY: position.y
            },
            drawOptions: this.props.drawInfo.drawOptions,
            clientId: 'local'
        };
        tempStore.saveDrawChange(data);
        // trigger the drawing action
        this.executeAction(Drawing, data);
        prev = position;
    },

    render: function() {
        // 50 is the height of drawing toolbar
        var DrawAreaStyle = {
            width : this.props.width,
            height: this.props.height + 50,
            marginLeft: -1 * (this.props.width / 2)
        };
        return (
            <div className="DrawingArea" style={DrawAreaStyle} >
                <canvas ref="mainCanvas" 
                    id="DrawBoard"
                    width={this.props.width} 
                    height={this.props.height} 
                    onMouseDown={this._startToDraw}
                    onMouseLeave={this._stopToDraw}
                    onMouseUp={this._stopToDraw}></canvas>
                <DrawingToolBar 
                    channelId={this.props.channelId} 
                    boardId={this.props.boardId}
                    drawInfo={this.props.drawInfo} />
                <div style={{position: 'relative', height: 70}} >
                    <DrawingPalette isActive={this.props.drawInfo.drawOptions.palette}/>
                </div>
            </div>
        );
    }
});

/**
 * @Author: Jos Tung
 * @Description: auto change the mouse cursor to fit current pen color
 */
function _changeBoardWheel(drawOptions) {
    var drawingBoard = document.getElementById('DrawBoard');
    var cursorGenerator = document.createElement('canvas');
    var currentRatio = drawingBoard.width / BOARD_WIDTH;
    cursorGenerator.width = drawOptions.lineWidth * currentRatio;
    cursorGenerator.height = drawOptions.lineWidth * currentRatio;

    var ctx = cursorGenerator.getContext('2d');
    var centerX = cursorGenerator.width/2;
    var centerY = cursorGenerator.height/2;
    var arcRadius = (drawOptions.mode == "pen" ? drawOptions.lineWidth/2 : drawOptions.lineWidth/2 - 1.5) * currentRatio;
    ctx.globalAlpha = drawOptions.mode == "pen" ? 1 : 0.2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = drawOptions.strokeStyle;
    ctx.fill();

    /**
     * this is temp workaround for draw cursor not update its color
     */
    drawingBoard.style.cursor = '';
    drawingBoard.style.cursor = 'url(' + cursorGenerator.toDataURL() + ') ' + centerX + ' ' + centerY + ',crosshair';
}

/**
 * @Author: George_Chen
 * @Description: for getting draw board 2d context
 */
function _getDrawBoardCtx(){
    return document.getElementById("DrawBoard").getContext('2d');
}
