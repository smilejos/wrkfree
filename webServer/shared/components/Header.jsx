var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible').Mixin;
var HeaderStore = require('../stores/HeaderStore');
var Mui = require('material-ui');

/**
 * actions
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var ToggleQuickSearch = require('../../client/actions/search/toggleQuickSearch');
var QuickSearchAction = require('../../client/actions/search/quickSearch');

/**
 * material UI compoents
 */
var Toolbar = Mui.Toolbar;
var ToolbarGroup = Mui.ToolbarGroup;
var FontIcon = Mui.FontIcon;
var IconButton = Mui.IconButton;
var TextField = Mui.TextField;

/**
 * child components
 */
var UserAvatar = require('./common/userAvatar.jsx');
var QuickSearch = require('./QuickSearch.jsx');

/**
 * @Author: George_Chen
 * @Description: container component of application header
 *
 * @param {String}        this.state.user.email, login user's email
 * @param {String}        this.state.user.avatar, login user's avatar
 * @param {String}        this.state.user.name, login user's name
 * @param {Boolean}       this.state.isMsgRead, login user has unread msg or not
 * @param {Boolean}       this.state.hasNotification, login user has notification or not
 */
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [HeaderStore]
        }
    },

    getInitialState: function() {
        return this.getStore(HeaderStore).getState();
    },

    onStoreChange: function() {
        var state = this.getStore(HeaderStore).getState();
        this.setState(state);
    },

    /**
     * @Author: George_Chen
     * @Description: handle "menu" icon tap mechanism
     */
    _onMenuIconButtonTouchTap: function() {
        this.executeAction(ToggleChannelNav, {});
        this.executeAction(ToggleQuickSearch, {
            isEnabled: false
        });
    },

    /**
     * TODO: show out the user settings pop-out
     * @Author: George_Chen
     * @Description: handle the user avatar click mechanism
     */
    _onAvatarClick: function() {
        location.assign('https://localhost/app/logout');
    },

    /**
     * TODO: impl search actions
     * @Author: George_Chen
     * @Description: handle the search channels mechanism
     */
    _onSearchKeyDown: function(e) {
        if (e.keyCode === 27) {
            this.refs.search.clearValue();
            return this._onSearchCancel();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: focus on search field after click search icon
     */
    _onSearchIconClick: function() {
        this.refs.search.clearValue();
        this.refs.search.focus();
        this.executeAction(ToggleQuickSearch, {
            isEnabled: true
        });
        this.executeAction(ToggleChannelNav, {
            open: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user cancel quickSearch
     */
    _onSearchCancel: function() {
        this.refs.search.clearValue();
        this.refs.search.blur();
        this.executeAction(ToggleQuickSearch, {
            isEnabled: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for search input change
     * 
     * @param {Object}      e, the react onChange event
     */
    _onSearchChange: function(e){
        this.executeAction(QuickSearchAction, {
            query: e.target.value
        });
    },

    /**
     * @Author: George_Chen
     * @Description: generate the search icon component
     */
    _setSearchIcon: function(){
        if (this.state.isSearchable) {
            return '';
        }
        return (
            <IconButton 
                iconClassName="fa fa-search" 
                tooltip="Search Channels, Users, ..." 
                touch={true} 
                onClick={this._onSearchIconClick} />
        );
    },

    /**
     * @Author: George_Chen
     * @Description: generate the cancel search icon component
     */
    _setCancelIcon: function(){
        if (!this.state.isSearchable) {
            return '';
        }
        return (
            <IconButton 
                iconClassName="fa fa-times" 
                tooltip="Cancel Search" 
                touch={true} 
                onClick={this._onSearchCancel} />
        );
    },

    render: function() {
        return (
            <div className="Header menuBox">
                <Toolbar>
                    <IconButton iconClassName="fa fa-bars" tooltip="Your Channels" touch={true} onClick={this._onMenuIconButtonTouchTap} />
                    {this._setSearchIcon()}
                    <TextField 
                        hintText="search channels ...." 
                        ref="search"
                        onClick={this._onSearchIconClick}
                        onChange={this._onSearchChange}
                        onKeyDown={this._onSearchKeyDown} />
                    {this._setCancelIcon()}
                    <ToolbarGroup key={0} float="right">
                        <div className="pure-g" >
                            <UserAvatar avatar={this.state.userInfo.avatar} 
                                isCircle={true} 
                                style={{'marginTop':'5px'}} 
                                onAvatarClick={this._onAvatarClick}
                                />
                            <FontIcon className="fa fa-bell"/>
                            <FontIcon className="fa fa-inbox"/>
                            <span className="mui-toolbar-separator">&nbsp;</span>
                        </div>
                    </ToolbarGroup>
                </Toolbar>
                <QuickSearch />
            </div>
        );
    }
});
