var React = require('react');
var Router = require('react-router');
var Mui = require('material-ui');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');
var ChannelCreatorStore = require('../../stores/ChannelCreatorStore');
var HeaderStore = require('../../stores/HeaderStore');

/**
 * actions
 */
var CreateChannel = require('../../../client/actions/channel/createChannel');
var ToggleChannelCreator = require('../../../client/actions/toggleChannelCreator');
var NavToBoard = require('../../../client/actions/draw/navToBoard');

/**
 * material UI compoents
 */
var Paper = Mui.Paper;
var LeftNav = Mui.LeftNav;
var TextField = Mui.TextField;
var FlatButton = Mui.FlatButton;

/**
 * @Author: Jos Tung
 * @Description: this component is channel creator
 *
 * @param {Boolean}       this.state.isNameValid, to check creating channel name is valid or not
 * @param {Boolean}       this.state.isActive, indicate that channel nav should open or close
 */
module.exports = React.createClass({
    mixins: [Router.Navigation, Router.State, FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [ChannelCreatorStore]
        }
    },

    /**
     * handler for component visiable change
     */
    onStoreChange: function() {
        var state = this.getStore(ChannelCreatorStore).getState();
         if (state.createdChannel !== -1) {
            return this._checkCreatedChannel(state.createdChannel);
        }
        this.setState(state);
    },

    /**
     * @Author: George_Chen
     * @Description: used to check the result of create channel
     *
     * @param {Object}        createdChannel, the created channel
     */
    _checkCreatedChannel: function(createdChannel) {
        if (!createdChannel) {
            return;
            // TODO: create Channel fail
        }        
        this.refs.channelName.clearValue();
        this.executeAction(NavToBoard, {
            urlNavigator: this.transitionTo,
            channelId: createdChannel.channelId,
            boardId: 0
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user create channel
     */
    _onCreateChannel: function() {
        this.executeAction(CreateChannel, {
            name: this.refs.channelName.getValue()
        });
        this.executeAction(ToggleChannelCreator, {
            isActived : false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user to cancel channel create
     */
    _onCancelChannel: function() {
        this.refs.channelName.clearValue();
        this.executeAction(ToggleChannelCreator, {
            isActived : false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for checking channel name
     */
    _checkChannelName: function(e) {
        var self = this;
        setTimeout(function(){
            if (e.keyCode === 13) {
                self._onCreateChannel();
            }
            var name = self.refs.channelName.getValue();
            // TODO: we should trigger another actiion flow 
            self.setState({
                isNameValid: (name.length > 0)
            });
        }, 100);
    },

    getInitialState: function() {
        return this.getStore(ChannelCreatorStore).getState();
    },

    render: function() {
        var isNameValid = this.state.isNameValid;
        var style = this.state.isActive ? "ChannelCreator ChannelCreatorShow" : "ChannelCreator";
        return (
            <div className={style}>
                {'Create Cannel'}
                <div className="ChannelHead" >
                    <TextField 
                        hintText="channel name" 
                        ref={'channelName'}
                        onKeyDown={this._checkChannelName} />
                </div>
                <div className="ChannelButton">
                    <FlatButton disabled={!isNameValid} primary={isNameValid} onClick={this._onCreateChannel}>
                        {'create'}
                    </FlatButton>
                    <FlatButton disabled={!isNameValid} secondary={isNameValid} onClick={this._onCancelChannel}>
                        {'cancel'}
                    </FlatButton>
                </div>
            </div>
        );
    }
});
