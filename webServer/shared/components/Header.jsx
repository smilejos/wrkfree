var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

var HeaderStore = require('../stores/HeaderStore');
var SubscriptionStore = require('../stores/SubscriptionStore');
var ChannelCreatorStore = require('../stores/ChannelCreatorStore');
var NotificationStore = require('../stores/NotificationStore');
var FriendStore = require('../stores/FriendStore');
/**
 * actions
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var ToggleComponent = require('../../client/actions/toggleComponent');
var ToggleFriendList = require('../../client/actions/toggleFriendList');
var ToggleQuickSearch = require('../../client/actions/search/toggleQuickSearch');
var ToggleNotifications = require('../../client/actions/toggleNotifications');
var ToggleChannelCreator = require('../../client/actions/toggleChannelCreator');
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
            'onStoreChange': [HeaderStore],
            'onIconStateChange': [SubscriptionStore, ChannelCreatorStore, NotificationStore, FriendStore]
        }
    },

    getInitialState: function() {
        var state = this.getStore(HeaderStore).getState();
        state.isChannelListActive = false;
        state.isChannelCreatorActive = false;
        state.isNotificationActive = false;
        state.isFriendListActive = false;
        state.isPersonalActive = false;
        return state;
    },

    onStoreChange: function() {
        var state = this.getStore(HeaderStore).getState();
        this.setState(state);
    },

    onIconStateChange: function() {
        var state = {
            isChannelListActive : this.getStore(SubscriptionStore).getState().isActive,
            isChannelCreatorActive : this.getStore(ChannelCreatorStore).getState().isActive,
            isNotificationActive : this.getStore(NotificationStore).getState().isActive,
            isFriendListActive : this.getStore(FriendStore).getState().isActive
            //isPersonalActive : this.getStore(SubscriptionStore).getState().isActive,
        }
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
        this.executeAction(ToggleFriendList);
    },

    _onNoticeToggle: function(){
        this.executeAction(ToggleNotifications);
    },

    _onChannelCreatorToggle: function(){
        this.executeAction(ToggleChannelCreator);
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
            <StateIcon 
                stateClass="leftState" 
                iconClass="fa fa-search"
                handler={this._onSearchIconClick} />
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
            <StateIcon 
                stateClass="leftState" 
                iconClass="fa fa-times"
                handler={this._onSearchCancel} />
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
                        iconClass={this.state.isChannelListActive ? "fa fa-bars active" : "fa fa-bars"}
                        counts={this.state.unreadDiscussions}
                        handler={this._onMenuIconButtonTouchTap} />
                    {this._setSearchIcon()}
                    <TextField 
                        hintText="search channels, users, ...." 
                        ref="search"
                        onClick={this._onSearchIconClick}
                        onChange={this._onSearchChange}
                        onKeyDown={this._onSearchKeyDown} />
                    {this._setCancelIcon()}
                </div>
                <div className="headerRightMenu" >
                    <StateIcon
                        stateClass="rightState" 
                        iconClass={this.state.isChannelCreatorActive ? "fa fa-plus active" : "fa fa-plus"} 
                        handler={this._onChannelCreatorToggle} />
                    <StateIcon
                        stateClass="rightState" 
                        iconClass={this.state.isNotificationActive ? "fa fa-bell active" : "fa fa-bell"}
                        counts={this.state.unreadNoticeCounts} 
                        handler={this._onNoticeToggle} />
                    <StateIcon
                        stateClass="rightState" 
                        iconClass={this.state.isFriendListActive ? "fa fa-comments active" : "fa fa-comments"}
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
