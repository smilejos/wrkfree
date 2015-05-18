var React = require('react');
var Router = require('react-router');
var Mui = require('material-ui');
var FluxibleMixin = require('fluxible').Mixin;
var SharedUtils = require('../../../sharedUtils/utils');
var ChannelNavStore = require('../stores/ChannelNavStore');
var HeaderStore = require('../stores/HeaderStore');

/**
 * actions
 */
var CreateChannel = require('../../client/actions/channel/createChannel');

/**
 * child components
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');

/**
 * material UI compoents
 */
var Paper = Mui.Paper;
var LeftNav = Mui.LeftNav;
var TextField = Mui.TextField;
var FlatButton = Mui.FlatButton;

/**
 * @Author: George_Chen
 * @Description: container component of application header
 *
 * @param {Array}         this.state.navInfo, an array of channel navigation info,
 * @param {String}        navInfo[i].channelId, target's channel id,
 * @param {String}        navInfo[i].channelName, target's channel name (without host uid)
 * @param {String}        navInfo[i].hostName, target channel's hostname
 * @param {Boolean}       this.state.isNameValid, to check creating channel name is valid or not
 * @param {Boolean}       this.state.isActived, indicate that channel nav should open or close
 */
module.exports = React.createClass({
    mixins: [Router.Navigation, Router.State, FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [ChannelNavStore]
        }
    },

    /**
     * handler for channelNavStore change
     */
    onStoreChange: function() {
        var state = this.getStore(ChannelNavStore).getState();
        if (state.createdChannel !== -1) {
            return this._checkCreatedChannel(state.createdChannel);
        }
        if (state.isActived !== this.state.isActived) {
            this.refs.channelNav.toggle();
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
        var toggleMode = {
            open: false
        };
        this.refs.channelName.clearValue();
        this.executeAction(ToggleChannelNav, toggleMode);
        this.transitionTo('/app/channel/'+createdChannel.channelId);
    },

    /**
     * initialize state of channelNav.jsx
     */
    getInitialState: function() {
        return this.getStore(ChannelNavStore).getState();
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user select item in channel navigation bar
     *
     * @param {Object}        e, react's mouse event
     * @param {Number}        selectedIndex, the index of navMenu item that is selected
     * @param {Object}        item, the selected item of navMenu
     */
    _onChannelNavSelect: function(e, selectedIndex, item) {
        this.executeAction(ToggleChannelNav, {});
        this.transitionTo(item.route);
    },

    /**
     * @Author: George_Chen
     * @Description: handler for handling which item in menu is selected
     *
     * @param {Array}        navMenu, current contents of navMenu
     */
    _getSelectedIndex: function(navMenu) {
        for (var i=0;i<=navMenu.length-1;++i) {
            if (navMenu[i].route && this.isActive(navMenu[i].route)) {
                return i;
            }
        }
        return 0;
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user create channel
     */
    _onCreateChannel: function() {
        this.executeAction(CreateChannel, {
            name: this.refs.channelName.getValue()
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user to cancel channel create
     */
    _onCancelChannel: function() {
        this.refs.channelName.clearValue();
        this.executeAction(ToggleChannelNav, {
            open: false
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

    /**
     * @Author: George_Chen
     * @Description: to generate header for channel navigation bar
     *     NOTE: currently we return a section for user creating channel
     */
    _getNavHeader: function() {
        var isNameValid = this.state.isNameValid;
        return (
            <div className="ChannelNavHeader">
                {'Create Cannel'}
                <div className="ChannelNavHeaderContent" >
                    <TextField 
                        hintText="channel name" 
                        ref={'channelName'}
                        onKeyDown={this._checkChannelName} />
                </div>
                <div >
                    <FlatButton disabled={!isNameValid} primary={isNameValid} onClick={this._onCreateChannel}>
                        {'create'}
                    </FlatButton>
                    <FlatButton disabled={!isNameValid} secondary={isNameValid} onClick={this._onCancelChannel}>
                        {'cancel'}
                    </FlatButton>
                </div>
            </div>
        );
    },

    render: function() {
        var header = this._getNavHeader();
        var navInfo = this.state.navInfo;
        var navMenu = SharedUtils.fastArrayMap(navInfo, function(item){
            return {
                route: '/app/channel/'+item.channelId,
                text: item.channelName + ' @'+item.hostName
            };
        });
        navMenu.unshift({
            type: Mui.MenuItem.Types.SUBHEADER,
            text: 'CHANNELS'
        });
        return (
            <div className="ChannelNav leftNavBox">
            <LeftNav 
                ref={'channelNav'}
                docked={this.state.isActived}
                menuItems={navMenu}
                header={header}
                selectedIndex={this._getSelectedIndex(navMenu)}
                onChange={this._onChannelNavSelect} />
            </div>
        );
    }
});
