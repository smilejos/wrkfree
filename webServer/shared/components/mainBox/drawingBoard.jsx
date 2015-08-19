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
var DrawingToolBar = require('./drawingToolBar.jsx');

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
        if (isChannelChange) {
            this._cleanBoard();
        }
        if (nextProps.drawInfo.boardNums === 0) {
            return;
        }
        if (isChannelChange || isBoardChange) {
            this.executeAction(GetDrawBoard, {
                channelId: nextProps.channelId,
                boardId: nextProps.boardId
            });
        }
        /**
         * auto change cursor when props change
         */
        _changeBoardWheel(this.props.drawInfo.drawOptions);
    },

    componentWillUnmount: function() {
        this._cleanBoard();
    },

    /**
     * @Author: George_Chen
     * @Description: initialize the draw board 
     */
    componentDidMount: function(){
        var board = document.getElementById("DrawBoard");
        var canvas = document.createElement('canvas');
        var self = this;
        // for detecting current mouse click event
        var isClicked = false;
        // used to store previous mouse position
        var prev = {};

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

        /**
         * @Author: George_Chen
         * @Description: used to complete and save current draw
         */
        function _completeDraw() {
            var drawTempStore = self.getStore(DrawTempStore);
            var localDraws = drawTempStore.getLocalDraws(self.props.channelId, self.props.boardId);
            isClicked = false;
            self.executeAction(InitToDraw, {
                channelId: self.props.channelId,
                boardId: self.props.boardId,
                isInited: false
            });
            if (localDraws.length > 0) {
                return self.executeAction(SaveDrawRecord, {
                    channelId: self.props.channelId,
                    boardId: self.props.boardId,
                    localDraws: localDraws,
                    drawOptions: self.props.drawInfo.drawOptions
                });
            }
            // means user draw at the same position, so trigger different action
            self.executeAction(SaveSingleDraw, {
                channelId: self.props.channelId,
                boardId: self.props.boardId,
                chunks: {
                    fromX: prev.x,
                    fromY: prev.y,
                    toX: prev.x + 0.1,
                    toY: prev.y + 0.1
                },
                drawOptions: self.props.drawInfo.drawOptions
            });
        }
        
        board.addEventListener('mousemove',function(e){
            if (!self.props.drawInfo.isInited || !isClicked) {
                return;
            }
            var cid = self.props.channelId;
            var bid = self.props.boardId;
            var localDraws = self.getStore(DrawTempStore).getLocalDraws(cid, bid);
            if (localDraws && localDraws.length >= ACTIVED_DRAWS_LIMIT) {
                return _completeDraw();
            }
            var position = _getCanvasMouse(e);
            // trigger the drawing action
            self.executeAction(Drawing, {
                channelId: self.props.channelId,
                boardId: self.props.boardId,
                chunks: {
                    fromX: prev.x,
                    fromY: prev.y,
                    toX: position.x,
                    toY: position.y
                },
                drawOptions: self.props.drawInfo.drawOptions
            });
            prev = position;
        });


        /**
         * mouse click event
         * reference: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
         */
        board.addEventListener('mousedown', function(e) {
            // 0: left click, 1: middle click, 2: right click
            if (self.props.drawInfo.boardNums === 0 || e.button !== 0) {
                return;
            }
            isClicked = true;
            prev = _getCanvasMouse(e);
            // to ensure the mouse pointer will not change to default behaviour
            e.preventDefault();
            return self.executeAction(InitToDraw, {
                channelId: self.props.channelId,
                boardId: self.props.boardId,
                isInited: true
            });
        });

        board.addEventListener('mouseup',function(){
            if (self.props.drawInfo.boardNums === 0) {
                return;
            }
            if (self.props.drawInfo.isInited || isClicked) {
                _completeDraw();
            }
        });

        board.addEventListener('mouseleave',function(){
            if (self.props.drawInfo.isInited || isClicked) {
                _completeDraw();
            }
        });

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

    render: function(){
        return (
            <div className="DrawingArea" >
                <canvas width={BOARD_WIDTH} height={BOARD_HEIGHT} ref="mainCanvas" id="DrawBoard"></canvas>
                <DrawingToolBar 
                    channelId={this.props.channelId} 
                    boardId={this.props.boardId}
                    drawInfo={this.props.drawInfo} />
            </div>
        );
    }
});

/**
 * @Author: Jos Tung
 * @Description: auto change the mouse cursor to fit current pen color
 */
function _changeBoardWheel(drawOptions) {
    var cursorGenerator = document.createElement('canvas');
    cursorGenerator.width = drawOptions.lineWidth;
    cursorGenerator.height = drawOptions.lineWidth;

    var ctx = cursorGenerator.getContext('2d');
    var centerX = cursorGenerator.width/2;
    var centerY = cursorGenerator.height/2;
    var arcRadius = (drawOptions.mode == "pen" ? drawOptions.lineWidth/2 : drawOptions.lineWidth/2 - 1.5);
    ctx.globalAlpha = drawOptions.mode == "pen" ? 1 : 0.2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = drawOptions.strokeStyle;
    ctx.fill();

    var drawingBoard = document.getElementById('DrawBoard');

    /**
     * this is temp workaround for draw cursor not update its color
     */
    drawingBoard.style.cursor = '';
    drawingBoard.style.cursor = 'url(' + cursorGenerator.toDataURL() + ') ' + drawOptions.lineWidth/2 + ' ' + drawOptions.lineWidth/2 + ',crosshair';
}

/**
 * @Author: George_Chen
 * @Description: for getting draw board 2d context
 */
function _getDrawBoardCtx(){
    return document.getElementById("DrawBoard").getContext('2d');
}

/**
 * @Author: George_Chen
 * @Description: for getting mouse position on canvas
 * 
 * @param {Object}       canvasEvent, canvas event object
 */
function _getCanvasMouse(canvasEvent){
    var board = document.getElementById("DrawBoard");
    // app-header-height = 50px defined in css
    var headerHeight = 50;
    return {
        x: canvasEvent.pageX - board.parentElement.offsetLeft,
        y: canvasEvent.pageY - headerHeight - board.parentElement.offsetTop
    };
}
