var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var HeaderStore = require('../stores/HeaderStore');

/**
 * actions
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var ToggleComponent = require('../../client/actions/toggleComponent');
var ToggleQuickSearch = require('../../client/actions/search/toggleQuickSearch');
var ToggleNotifications = require('../../client/actions/toggleNotifications');
var QuickSearchAction = require('../../client/actions/search/quickSearch');

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var TextField = Mui.TextField;

/**
 * child components
 */
var UserAvatar = require('./common/userAvatar.jsx');
var StateIcon = require('./common/stateIcon.jsx');
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
        var state = this.getStore(HeaderStore).getState();
        state.iconButtonStyle = {
            color: '#FFF'
        };
        return state;
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
     * TODO: impl search actions
     * @Author: George_Chen
     * @Description: handle the search channels mechanism
     */
    _onSearchKeyDown: function(e) {
        if (e.keyCode === 27) {
            return this._onSearchCancel();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: focus on search field after click search icon
     */
    _onSearchIconClick: function() {
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

    _onInboxToggle: function(){
        this.executeAction(ToggleComponent, {
            param: 'friendVisiable'
        });
    },

    _onNoticeToggle: function(){
        this.executeAction(ToggleNotifications);
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
                tooltip="Search things " 
                touch={true} 
                iconStyle={this.state.iconButtonStyle}
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
                iconStyle={this.state.iconButtonStyle}
                onClick={this._onSearchCancel} />
        );
    },

    componentDidUpdate: function() {
        if (!this.state.isSearchable) {
            this.refs.search.clearValue();
            this.refs.search.blur();
        }
    },

    render: function() {
        return (
            <div className="Header">
                <div className="headerLeftMenu">
                    <StateIcon
                        stateClass="leftState" 
                        iconClass="fa fa-bars"
                        counts={this.state.unreadDiscussions}
                        handler={this._onMenuIconButtonTouchTap} />
                    <div className="headerSearch" >
                        {this._setSearchIcon()}
                        <TextField 
                            hintText="search channels, users, ...." 
                            ref="search"
                            onClick={this._onSearchIconClick}
                            onChange={this._onSearchChange}
                            onKeyDown={this._onSearchKeyDown} />
                        {this._setCancelIcon()}
                    </div>
                </div>
                <div className="headerRightMenu" >
                    <StateIcon
                        stateClass="rightState" 
                        iconClass="fa fa-bell"
                        counts={this.state.unreadNoticeCounts} 
                        handler={this._onNoticeToggle} />
                    <StateIcon
                        stateClass="rightState" 
                        iconClass="fa fa-comments"
                        counts={this.state.unreadConversations}  
                        handler={this._onInboxToggle} />
                    <UserState avatar={this.state.userInfo.avatar} name={this.state.userInfo.nickName} />
                </div>
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: the state of login user
 * 
 * @param {String}        this.props.avatar, the current login user's avatar
 * @param {String}        this.props.name, the current login user's name
 */
var UserState = React.createClass({
    /**
     * TODO: show out the user settings pop-out
     * @Author: George_Chen
     * @Description: handle the user avatar click mechanism
     */
    _onAvatarClick: function() {
        location.assign('/app/logout');
    },

    render: function() {
        return (
            <div className="userState" onClick={this._onAvatarClick}>
                <span className="UserStateName" > {this.props.name} </span>
                <UserAvatar avatar={this.props.avatar} isCircle />
            </div>
        );
    }
});
