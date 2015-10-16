var React = require('react');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin'); 
var Router = require('react-router');

/**
 * actions
 */
var AddDrawBoard = require('../../../client/actions/draw/addDrawBoard');
var DelDrawBoard = require('../../../client/actions/draw/delDrawBoard');
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
        if (!this.state.isDrawing) {
            self.setState({
                isDrawing: true
            });
        }
        clearTimeout(DisableDraw);
        DisableDraw = setTimeout(function() {
            self.setState({
                isDrawing: false
            });
        }, DRAWING_TIMEOUT_IN_MSECOND);
    },

    getInitialState: function() {
        return {
            boardPage: this.props.boardIdx + 1,
            isDrawing: false,
            enableToAddBoard: true,
            enableToClearBoard: true,
            enableToRedoBoard: true,
            enableToUndoBoard: true,
            enableToDelBoard: true
        };
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            boardPage: nextProps.boardIdx + 1
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
        this.setState({
            enableToAddBoard: false
        });
        return window.context.executeAction(AddDrawBoard, {
            urlNavigator: this.transitionTo,
            channelId: this.props.channelId,
            newBoardIdx: this.props.drawInfo.boardNums
        }).bind(this).delay(100).then(function(){
            this.setState({
                enableToAddBoard: true
            });
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for delete drawing board
     */
    _deleteBoard: function(){
        this.setState({
            enableToDelBoard: false
        });
        return window.context.executeAction(DelDrawBoard, {
            urlNavigator: this.transitionTo,
            channelId: this.props.channelId,
        }).bind(this).delay(1000).then(function(){
            this.setState({
                enableToDelBoard: true
            });
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for clean drawing board
     */
    _cleanBoard: function(){
        this.setState({
            enableToClearBoard: false
        });
        return window.context.executeAction(CleanDrawBoard, {
            channelId: this.props.channelId,
        }).bind(this).delay(100).then(function(){
            this.setState({
                enableToClearBoard: true
            });
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler undo to previous draw on drawing board
     */
    _drawUndo: function() {
        this.setState({
            enableToUndoBoard: false
        });
        return window.context.executeAction(UndoDrawRecord, {
            channelId: this.props.channelId,
        }).bind(this).delay(100).then(function(){
            this.setState({
                enableToUndoBoard: true
            });
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler to redo to next draw on drawing board 
     */
    _drawRedo: function(){
        this.setState({
            enableToRedoBoard: false
        });
        return window.context.executeAction(RedoDrawRecord, {
            channelId: this.props.channelId,
        }).bind(this).delay(100).then(function(){
            this.setState({
                enableToRedoBoard: true
            });
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user to switch to next drawing board
     */
    _goToNextBoard: function(){
        ++this.state.boardPage;
        return this._goToBoard();
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user to switch to previous drawing board
     */
    _goToPreviousBoard: function(){
        --this.state.boardPage;
        return this._goToBoard();
    },

    /**
     * @Author: George_Chen
     * @Description: reflect board index value to this.state, then
     *               the boardPage value will re-render
     */
    _onBoardIndexChange: function(e){
        this.setState({
            boardPage: e.target.value
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
        var index = this.state.boardPage -1;
        if (index >= 0 && index < this.props.drawInfo.boardNums) {
            this.executeAction(NavToBoard, {
                urlNavigator: this.transitionTo,
                channelId: this.props.channelId,
                boardIdx: index
            });
        }
        this._setDefaultIndex();
    },

    /**
     * @Author: George_Chen
     * @Description: if user set the wrong boardPage, we should call
     *               this to reset it to default
     */
    _setDefaultIndex: function() {
        this.setState({
            boardPage: this.props.boardIdx + 1
        });
    },

    render: function() {
        return (
            <div className="DrawingToolBar" >
                <div style={{position: 'absolute', left: 5, bottom: 0, height: 50}}>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-right"
                        touch 
                        tooltip={'pick color'} 
                        onClick={this._openPalette} >
                        {'palette'}
                    </IconButton>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-right"
                        touch 
                        tooltip={'pen mode'} 
                        onClick={this._changeToPen} >
                        {'brush'}
                    </IconButton>
                    <IconButton 
                        iconClassName="fa fa-eraser"
                        style={{top: -5}}
                        iconStyle={{fontSize: 21}}
                        tooltipPosition="top-right"
                        touch 
                        tooltip={'eraser mode'} 
                        onClick={this._changeToEraser} />
                </div>
                <div style={{position: 'absolute', left: '50%', marginLeft: -75, bottom: 0}}>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-center" 
                        touch
                        tooltip={'go to previous board'}
                        onClick={this._goToPreviousBoard} >
                        {'keyboard_arrow_left'}
                    </IconButton>
                    <div style={{display: 'inline-block', height: '100%', verticalAlign: 'middle'}}>
                        <input type="text"
                            ref="boardPage" 
                            className="Center" 
                            value={this.state.boardPage}
                            onKeyDown={this._onBoardIndexKeyDown}
                            onBlur={this._setDefaultIndex}
                            onChange={this._onBoardIndexChange}
                            style={{width: 20, height:26, marginBottom: 10}}/>
                            {" / " + this.props.drawInfo.boardNums}
                    </div>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-center" 
                        touch
                        tooltip={'go to next board'}
                        onClick={this._goToNextBoard} >
                        {'keyboard_arrow_right'}
                    </IconButton>
                </div>
                <div style={{position: 'absolute', right: 10, bottom: 0}}>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-left"
                        touch
                        disabled={!this.state.enableToAddBoard}
                        tooltip={'add new board'}
                        onClick={this._addBoard} >
                        {'add_box'}
                    </IconButton>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-left"
                        touch
                        disabled={!this.state.enableToClearBoard || this.state.isDrawing}
                        tooltip={'clear current board'} 
                        onClick={this._cleanBoard} >
                        {'crop_din'}
                    </IconButton>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-left"
                        touch
                        disabled={!this.state.enableToUndoBoard || this.state.isDrawing}
                        tooltip={'undo to previous draw'} 
                        onClick={this._drawUndo} >
                        {'undo'}
                    </IconButton>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-left"
                        touch
                        disabled={!this.state.enableToRedoBoard || this.state.isDrawing}
                        tooltip={'repeat to next draw'}
                        onClick={this._drawRedo} >
                        {'redo'}
                    </IconButton>
                    <IconButton 
                        iconClassName="material-icons"
                        tooltipPosition="top-left"
                        touch
                        disabled={!this.state.enableToDelBoard || this.state.isDrawing}
                        tooltip={'delete current board'} 
                        onClick={this._deleteBoard}>
                        {'delete'}
                    </IconButton>
                </div>
            </div>
        );
    }
});
