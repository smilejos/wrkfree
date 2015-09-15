var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var Deque = require('double-ended-queue');

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
var Drawing = require('../../../client/actions/draw/drawing');
var SaveDrawRecord = require('../../../client/actions/draw/saveDrawRecord');
var GetDrawBoard = require('../../../client/actions/draw/getDrawBoard');
var UpdateBaseImage = require('../../../client/actions/draw/updateBaseImage');

/**
 * stores
 */
var DrawTempStore = require('../../stores/DrawTempStore');
var DrawStore = require('../../stores/DrawStore');
var DrawStatusStore = require('../../stores/DrawStatusStore');

/**
 * child components
 */
var DrawingPalette = require('./drawingPalette.jsx');
var DrawingToolBar = require('./drawingToolBar.jsx');

var prev = {};

var DEFAULT_TEMP_DRAWS_LENGTH = 200;
var LocalDraws = new Deque(DEFAULT_TEMP_DRAWS_LENGTH);

/**
 * the drawingBoard.jsx is the drawing board
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            'onTempDrawChange': [DrawTempStore],
            'onDrawBoardChange': [DrawStore],
            '_onDrawStatusChange': [DrawStatusStore]
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
            context.executeAction(GetDrawBoard, {
                channelId: nextProps.channelId,
                boardId: nextProps.boardId
            });
        }
        this._changeCursor();
    },

    componentDidUpdate: function(prevProps) {
        // this means canvas has resized, and we also need to change the scale
        if (prevProps.width !== this.props.width) {
            this._getBoardContext().scale(this.props.width/BOARD_WIDTH, this.props.height/BOARD_HEIGHT);
            this._changeCursor();
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
    },

    _onDrawStatusChange: function() {
        var statusState = this.getStore(DrawStatusStore).getState();
        this.setState({
            isDrawSaved: statusState.isDrawSaved
        });
    },

    /**
     * @Author: George_Chen
     * @Description: for handling drawStore change
     *         NOTE: drawStore save completed draw record documents
     */
    onDrawBoardChange: function(){
        var canvas = React.findDOMNode(this.refs.mainCanvas);
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
        var ctx = this._getBoardContext();
        var tempRecord = this.getStore(DrawTempStore).getDraws();
        var draws = tempRecord.pop();
        while (draws) {
            DrawUtils.draw(ctx, draws.chunks, draws.drawOptions);
            draws = tempRecord.pop();
        }
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
     * @Description: for getting draw board 2d context
     */
    _getBoardContext: function() {
        var board = React.findDOMNode(this.refs.mainCanvas);
        return board.getContext('2d');
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
        // 0: left click, 1: middle click, 2: right click
        if (this.props.drawInfo.boardNums === 0 || e.button !== 0) {
            return;
        }
        prev = this._getCanvasMouse(e);
        board.onmousemove = this._drawing;
    },

    _stopToDraw: function(isMouseLeft) {
        var board = React.findDOMNode(this.refs.mainCanvas);
        var ctx = this._getBoardContext();
        var data = {
            channelId: this.props.channelId,
            boardId: this.props.boardId,
            record: LocalDraws.toArray(),
            drawOptions: this.props.drawInfo.drawOptions
        };
        var endPoint = {
            fromX: prev.x,
            fromY: prev.y,
            toX: prev.x + 0.1,
            toY: prev.y + 0.1
        };
        board.onmousemove = null;
        LocalDraws.clear();

        if (data.record.length > 0) {
            this.executeAction(SaveDrawRecord, data);
        } else if (!isMouseLeft) {
            data.record = [endPoint];
            this.executeAction(SaveDrawRecord, data);
            DrawUtils.draw(ctx, endPoint, this.props.drawInfo.drawOptions);
        }
    },

    /**
     * @Author: Jos Tung
     * @Description: auto change the mouse cursor to fit current pen color
     */
    _changeCursor: function() {
        var board = React.findDOMNode(this.refs.mainCanvas);
        var cursorGenerator = document.createElement('canvas');
        var options = this.props.drawInfo.drawOptions;
        var currentRatio = this.props.width / BOARD_WIDTH;
        var ctx = cursorGenerator.getContext('2d');
        cursorGenerator.width = options.lineWidth * currentRatio;
        cursorGenerator.height = options.lineWidth * currentRatio;
        var centerX = cursorGenerator.width / 2;
        var centerY = cursorGenerator.height / 2;
        var arcRadius = (options.mode == "pen" ? options.lineWidth / 2 : options.lineWidth / 2 - 1.5) * currentRatio;

        ctx.globalAlpha = options.mode == "pen" ? 1 : 0.2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, arcRadius, 0, 2 * Math.PI, false);
        ctx.fillStyle = options.strokeStyle;
        ctx.fill();
        /**
         * this is temp workaround for draw cursor not update its color
         */
        board.style.cursor = '';
        board.style.cursor = 'url(' + cursorGenerator.toDataURL() + ') ' + centerX + ' ' + centerY + ',crosshair';
    },

    _drawing: function(e) {
        if (LocalDraws && LocalDraws.length >= ACTIVED_DRAWS_LIMIT) {
            return this._stopToDraw();
        }
        var cid = this.props.channelId;
        var bid = this.props.boardId;        
        var position = this._getCanvasMouse(e);
        var ctx = this._getBoardContext();
        var data = {
            channelId: cid,
            boardId: bid,
            chunks: {
                fromX: prev.x,
                fromY: prev.y,
                toX: position.x,
                toY: position.y
            },
            drawOptions: this.props.drawInfo.drawOptions
        };
        // draw on canvas
        DrawUtils.draw(ctx, data.chunks, data.drawOptions);

        // save to local draws
        LocalDraws.push(data.chunks);

        // trigger the drawing action
        this.executeAction(Drawing, data);
        prev = position;
    },

    _onBoardContextMenu: function(e) {
        e.preventDefault();
    },

    _onMouseUp: function(e) {
        if (e.button === 0) {
            return this._stopToDraw(false);
        }
    },

    render: function() {
        // 50 is the height of drawing toolbar
        var DrawAreaStyle = {
            width : this.props.width,
            height: this.props.height + 50,
            marginLeft: -1 * (this.props.width / 2),
            position: 'relative'
        };
        var isDrawSaved = this.state.isDrawSaved;
        var tipStyle = {
            position: 'absolute',
            fontSize: 14,
            color: '#bdbdbd',
            bottom: 60,
            left: 10,
            opacity: isDrawSaved ? 1 : 0,
            visibility: isDrawSaved ? 'visible' : 'hidden',
            transition: '0.7s'
        };

        return (
            <div className="DrawingArea" style={DrawAreaStyle} >
                <div className="baseFonts" style={tipStyle}>
                    {'Saving …'}
                </div>
                <canvas ref="mainCanvas" 
                    width={this.props.width} 
                    height={this.props.height} 
                    onContextMenu={this._onBoardContextMenu}
                    onMouseDown={this._startToDraw}
                    onMouseLeave={this._stopToDraw.bind(this, true)}
                    onMouseUp={this._onMouseUp} />
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
