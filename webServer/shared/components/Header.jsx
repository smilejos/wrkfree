var React = require('react');
var FluxibleMixin = require('fluxible').Mixin;
var HeaderStore = require('../stores/HeaderStore');
var Mui = require('material-ui');

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

/**
 * @Author: George_Chen
 * @Description: container component of application header
 *
 * state.user.email, login user's email
 * state.user.avatar, login user's avatar
 * state.user.name, login user's name
 * state.isMsgRead, login user has unread msg or not
 * state.hasNotification, login user has notification or not
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
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
        // this.refs.leftNav.toggle();
        // <AppLeftNav ref="leftNav" />
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
        var value = this.refs.search.getValue();
        if (e.keyCode === 13) {
            // search new channels on server
        }
        // filter current channels on mainbox
    },

    /**
     * @Author: George_Chen
     * @Description: focus on search field after click search icon
     */
    _onSearchIconClick: function() {
        this.refs.search.clearValue();
        this.refs.search.focus();
    },

    render: function() {
        return (
            <div className="Header menuBox">
                <Toolbar>
                    <IconButton iconClassName="fa fa-bars" tooltip="Menu" touch={true} onClick={this._onMenuIconButtonTouchTap} />
                    <IconButton iconClassName="fa fa-plus" tooltip="Create Channel" touch={true} />
                    <IconButton iconClassName="fa fa-search" tooltip="Search Channel" touch={true} onClick={this._onSearchIconClick} />
                    <TextField 
                        hintText="search channels ...." 
                        ref="search"
                        onKeyDown={this._onSearchKeyDown} />
                    <ToolbarGroup key={0} float="right">
                        <div className="pure-g" >
                            <UserAvatar avatar={this.state.userInfo.avatar} 
                                isCircle={true} 
                                style={{'marginTop':'5px'}} 
                                onAvatarClick={this._onAvatarClick}
                                />
                            <FontIcon className="fa fa-bell"/>
                            <FontIcon className="fa fa-inbox"/>
                            <span className="Mui-toolbar-separator">&nbsp;</span>
                        </div>
                    </ToolbarGroup>
                </Toolbar>
            </div>
        );
    }
});
