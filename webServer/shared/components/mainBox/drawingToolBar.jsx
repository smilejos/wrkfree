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
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;

/**
 * the drawingToolBar component
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin, Router.Navigation],

    getInitialState: function() {
        return {
            boardIndex: this.props.boardId + 1
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
        this.executeAction(CleanDrawBoard, {
            channelId: this.props.channelId,
            boardId: this.props.boardId
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler undo to previous draw on drawing board
     */
    _drawUndo: function(){
        this.executeAction(UndoDrawRecord, {
            channelId: this.props.channelId,
            boardId: this.props.boardId
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler to redo to next draw on drawing board 
     */
    _drawRedo: function(){
        this.executeAction(RedoDrawRecord, {
            channelId: this.props.channelId,
            boardId: this.props.boardId
        });
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

    render: function(){
        return (
            <div className="DrawingToolBar" >
                <div className="pure-u-1-3 Left">
                    <IconButton 
                        iconClassName="fa fa-eyedropper"
                        tooltip={'pick color'}
                        touch 
                        onClick={this._openPalette} />
                    <IconButton 
                        iconClassName="fa fa-paint-brush"
                        tooltip={'pen mode'}
                        touch 
                        onClick={this._changeToPen} />
                    <IconButton 
                        iconClassName="fa fa-eraser"
                        tooltip={'eraser mode'}
                        touch 
                        onClick={this._changeToEraser} />
                </div>
                <div className="pure-u-1-3 Center" >
                    <IconButton 
                        iconClassName="fa fa-chevron-left" 
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
                        tooltip={'go to next board'}
                        onClick={this._goToNextBoard} />
                </div>
                <div className="pure-u-1-3 Right" >
                    <IconButton 
                        iconClassName="fa fa-plus-square-o"
                        tooltip={'add new board'}
                        touch 
                        onClick={this._addBoard} />
                    <IconButton 
                        iconClassName="fa fa fa-square-o"
                        tooltip={'clean current board'} 
                        touch
                        onClick={this._cleanBoard} />
                    <IconButton 
                        iconClassName="fa fa-undo"
                        tooltip={'undo to previous draw'} 
                        touch
                        onClick={this._drawUndo} />
                    <IconButton 
                        iconClassName="fa fa-repeat"
                        tooltip={'repeat to next draw'}
                        touch
                        onClick={this._drawRedo} />
                    <IconButton 
                        iconClassName="fa fa-trash-o" 
                        touch
                        tooltip={'delete current board'} />
                </div>
            </div>
        );
    }
});
