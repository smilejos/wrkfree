var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var Router = require('react-router');

/**
 * actions
 */
var AddDrawBoard = require('../../../client/actions/draw/addDrawBoard');
var CleanDrawBoard = require('../../../client/actions/draw/cleanDrawBoard');
var UndoDrawRecord = require('../../../client/actions/draw/drawUndo');
var RedoDrawRecord = require('../../../client/actions/draw/drawRedo');
var NavToBoard = require('../../../client/actions/draw/navToBoard');
var ChangeDrawMode = require('../../../client/actions/draw/changeDrawMode');

/**
 * stores
 */
var DrawTempStore = require('../../stores/DrawTempStore');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;

var DRAWING_TIMEOUT_IN_MSECOND = 1000;
var DisableDraw = null;

/**
 * the drawingToolBar component
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin, Router.Navigation],

    statics: {
        storeListeners: {
            '_onDrawing': [DrawTempStore]
        }
    },

    /**
     * @Author: George_Chen
     * @Description: for detecting current board is drawing or not
     */
    _onDrawing: function() {
        var self = this;
        var cid = this.props.channelId;
        var bid = this.props.boardId;
        var lastDraw = this.getStore(DrawTempStore).getLastDraw(cid, bid);
        if (lastDraw) {
            if (!this.state.isDrawing) {
                self.setState({
                    isDrawing: true
                });
            }
            if (DisableDraw) {
                clearTimeout(DisableDraw);
            }
            DisableDraw = setTimeout(function() {
                self.setState({
                    isDrawing: false
                });
            }, DRAWING_TIMEOUT_IN_MSECOND)
        }
    },

    getInitialState: function() {
        return {
            boardIndex: this.props.boardId + 1,
            isDrawing: false
        };
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            boardIndex: nextProps.boardId + 1
        });
    },

    /**
     * @Author: Jos Tung
     * @Description: handler for pick new color on palette
     */
    _openPalette: function(){
        this.executeAction(ChangeDrawMode, {
            palette: true
        });
    },

    /**
     * @Author: Jos Tung
     * @Description: handler for change to pen mode
     */
    _changeToPen: function(){
        this.executeAction(ChangeDrawMode, {
            mode: "pen",
            lineWidth: 10
        });
    },

    /**
     * @Author: Jos Tung
     * @Description: handler for change eraser mode
     */
    _changeToEraser: function(){
        this.executeAction(ChangeDrawMode, {
            mode: "eraser",
            lineWidth: 50
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for add new drawing board
     */
    _addBoard: function(){
        this.executeAction(AddDrawBoard, {
            urlNavigator: this.transitionTo,
            channelId: this.props.channelId,
            newBoardId: this.props.drawInfo.boardNums
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for delete drawing board
     */
    _deleteBoard: function(){
        // TODO:
    },

    /**
     * @Author: George_Chen
     * @Description: handler for clean drawing board
     */
    _cleanBoard: function(){
        if (!this.state.isDrawing) {
            this.executeAction(CleanDrawBoard, {
                channelId: this.props.channelId,
                boardId: this.props.boardId
            });
        }
    },

    /**
     * @Author: George_Chen
     * @Description: handler undo to previous draw on drawing board
     */
    _drawUndo: function(){
        if (!this.state.isDrawing) {
            this.executeAction(UndoDrawRecord, {
                channelId: this.props.channelId,
                boardId: this.props.boardId
            });
        }
    },

    /**
     * @Author: George_Chen
     * @Description: handler to redo to next draw on drawing board 
     */
    _drawRedo: function(){
        if (!this.state.isDrawing) {
            this.executeAction(RedoDrawRecord, {
                channelId: this.props.channelId,
                boardId: this.props.boardId
            });
        }
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user to switch to next drawing board
     */
    _goToNextBoard: function(){
        ++this.state.boardIndex;
        return this._goToBoard();
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user to switch to previous drawing board
     */
    _goToPreviousBoard: function(){
        --this.state.boardIndex;
        return this._goToBoard();
    },

    /**
     * @Author: George_Chen
     * @Description: reflect board index value to this.state, then
     *               the boardIndex value will re-render
     */
    _onBoardIndexChange: function(e){
        this.setState({
            boardIndex: e.target.value
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handle the keyDown event when user try to 
     *               modify it manually
     */
    _onBoardIndexKeyDown: function(e) {
        if (e.keyCode === 27) {
            return this._setDefaultIndex();
        }
        if (e.keyCode === 13) {
            return this._goToBoard();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: switch to specifc drawing baord by target board index
     */
    _goToBoard: function(){
        var newBoardId = this.state.boardIndex -1;
        if (newBoardId >= 0 && newBoardId < this.props.drawInfo.boardNums) {
            this.executeAction(NavToBoard, {
                urlNavigator: this.transitionTo,
                channelId: this.props.channelId,
                boardId: newBoardId
            });
        }
        this._setDefaultIndex();
    },

    /**
     * @Author: George_Chen
     * @Description: if user set the wrong boardIndex, we should call
     *               this to reset it to default
     */
    _setDefaultIndex: function() {
        this.setState({
            boardIndex: this.props.boardId + 1
        });
    },

    render: function() {
        var drawIconStyle = {
            cursor: (this.state.isDrawing ? 'not-allowed' : 'pointer')
        };
        return (
            <div className="DrawingToolBar" >
                <div style={{position: 'absolute', left: 5, bottom: 0}}>
                    <IconButton 
                        iconClassName="fa fa-eyedropper"
                        tooltipPosition="top-right"
                        touch 
                        tooltip={'pick color'} 
                        onClick={this._openPalette} />
                    <IconButton 
                        iconClassName="fa fa-paint-brush"
                        tooltipPosition="top-right"
                        touch 
                        tooltip={'pen mode'} 
                        onClick={this._changeToPen} />
                    <IconButton 
                        iconClassName="fa fa-eraser"
                        tooltipPosition="top-right"
                        touch 
                        tooltip={'eraser mode'} 
                        onClick={this._changeToEraser} />
                </div>
                <div style={{position: 'absolute', left: '50%', marginLeft: -75, bottom: 0}}>
                    <IconButton 
                        iconClassName="fa fa-chevron-left"
                        tooltipPosition="top-center" 
                        touch
                        tooltip={'go to previous board'}
                        onClick={this._goToPreviousBoard} />
                    <input type="text"
                        ref="boardIndex" 
                        className="Center" 
                        value={this.state.boardIndex}
                        onKeyDown={this._onBoardIndexKeyDown}
                        onBlur={this._setDefaultIndex}
                        onChange={this._onBoardIndexChange}
                        style={{width:'20', height:'26'}}/>
                        {" / " + this.props.drawInfo.boardNums}
                    <IconButton 
                        iconClassName="fa fa-chevron-right"
                        tooltipPosition="top-center" 
                        touch
                        tooltip={'go to next board'}
                        onClick={this._goToNextBoard} />
                </div>
                <div style={{position: 'absolute', right: 10, bottom: 0}}>
                    <IconButton 
                        iconClassName="fa fa-plus-square-o"
                        tooltipPosition="top-left"
                        touch
                        tooltip={'add new board'}
                        onClick={this._addBoard} />
                    <IconButton 
                        iconClassName="fa fa fa-square-o"
                        tooltipPosition="top-left"
                        touch
                        iconStyle={drawIconStyle}
                        tooltip={'clean current board'} 
                        onClick={this._cleanBoard} />
                    <IconButton 
                        iconClassName="fa fa-undo"
                        tooltipPosition="top-left"
                        touch
                        iconStyle={drawIconStyle}
                        tooltip={'undo to previous draw'} 
                        onClick={this._drawUndo} />
                    <IconButton 
                        iconClassName="fa fa-repeat"
                        tooltipPosition="top-left"
                        touch
                        iconStyle={drawIconStyle}
                        tooltip={'repeat to next draw'}
                        onClick={this._drawRedo} />
                    <IconButton 
                        iconClassName="fa fa-trash-o" 
                        tooltipPosition="top-left"
                        touch
                        tooltip={'delete current board'} />
                </div>
            </div>
        );
    }
});
