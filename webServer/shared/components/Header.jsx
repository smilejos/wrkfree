var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');

var HeaderStore = require('../stores/HeaderStore');
var SubscriptionStore = require('../stores/SubscriptionStore');
var ChannelCreatorStore = require('../stores/ChannelCreatorStore');
var NotificationStore = require('../stores/NotificationStore');
var FriendStore = require('../stores/FriendStore');
var QuickSearchStore = require('../stores/QuickSearchStore');

/**
 * actions
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var ToggleComponent = require('../../client/actions/toggleComponent');
var ToggleFriendList = require('../../client/actions/toggleFriendList');
var ToggleQuickSearch = require('../../client/actions/search/toggleQuickSearch');
var ToggleNotifications = require('../../client/actions/toggleNotifications');
var TogglePersonalInfo = require('../../client/actions/togglePersonalInfo');
var QuickSearchAction = require('../../client/actions/search/quickSearch');

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var Tooltip = Mui.Tooltip;

/**
 * child components
 */
var ChannelCreator = require('./common/ChannelCreator.jsx');
var UserAvatar = require('./common/userAvatar.jsx');
var FormButton = require('./common/formButton.jsx');
var QuickSearch = require('./QuickSearch.jsx');

var SEARCH_DELAY_IN_MSECOND = 500;
var CurrentSearch = null;

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
            'onIconStateChange': [SubscriptionStore, ChannelCreatorStore, NotificationStore, FriendStore, QuickSearchStore]
        }
    },

    getInitialState: function() {
        var state = this.getStore(HeaderStore).getState();
        state.isSearchActive = false;
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
            isFriendListActive : this.getStore(FriendStore).getState().isActive,
            isSearchActive: this.getStore(QuickSearchStore).getState().isActive
        }
        this.setState(state);
    },

    /**
     * @Author: George_Chen
     * @Description: handle "menu" icon tap mechanism
     */
    _onMenuIconButtonTouchTap: function() {
        this.executeAction(ToggleChannelNav);
    },

    /**
     * @Author: George_Chen
     * @Description: focus on search field after click search icon
     */
    _onSearchIconClick: function() {
        if (this.state.isSearchActive) {
            return this.refs.headerSearch.clearValue();
        }
        this.executeAction(ToggleQuickSearch, {
            isActive: true
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user cancel quickSearch
     */
    _onSearchCancel: function() {
        this.executeAction(ToggleQuickSearch, {
            isActive: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for search input change
     * 
     * @param {Object}      e, the react onChange event
     */
    _onSearchChange: function(queryText){
        var time = (queryText === '' ? 0 : SEARCH_DELAY_IN_MSECOND);
        clearTimeout(CurrentSearch);
        CurrentSearch = setTimeout(function(){
            this.executeAction(QuickSearchAction, {
                query: queryText
            });
        }.bind(this), time);
    },

    _onSearch: function(queryText) {
        clearTimeout(CurrentSearch);
        this.executeAction(QuickSearchAction, {
            query: queryText
        });
    },

    _onInboxToggle: function(){
        this.executeAction(ToggleFriendList);
    },

    _onNoticeToggle: function(){
        this.executeAction(ToggleNotifications);
    },

    render: function() {
        var subscriptionTips = (this.state.isChannelListActive ? 'hide' : 'show') + ' starred channels';
        var notificationTips = (this.state.isNotificationActive ? 'hide' : 'show') + ' notifications';
        var frinedListTiips = (this.state.isFriendListActive ? 'hide' : 'show') + ' friends';
        return (
            <div className="Header">
                <div className="headerLeftMenu">
                    <StateButton
                        isActived={this.state.isChannelListActive}
                        counts={this.state.unreadDiscussions}
                        containerClass="leftState" 
                        containerStyle={{marginTop: 10, paddingRight: 10}} 
                        iconClass="fa fa-bars"
                        tips={subscriptionTips}
                        iconHandler={this._onMenuIconButtonTouchTap}/>
                    <div className="leftState" style={{marginTop: 10}}>
                        <FormButton 
                            ref="headerSearch"
                            width={300}
                            isActived={this.state.isSearchActive}
                            hasInput
                            isFiexedWidth
                            colorType="blue"
                            defaultIconClass={this.state.isSearchActive ? "fa fa-times" : "fa fa-search"}
                            submitIconClass="fa fa-arrow-right"
                            hintText="search channels, users, ...."
                            label="search channels, users, ...."
                            defaultIconHandler={this._onSearchIconClick}
                            submitHandler={this._onSearch}
                            onChangeHandler={this._onSearchChange} 
                            onBlurHandler={this._onSearchCancel} />
                    </div>
                </div>
                <div className="headerRightMenu" >
                    <ChannelCreator 
                        isActived={this.state.isChannelCreatorActive}
                        containerClass="rightState" 
                        containerStyle={{marginTop: 10}} />
                    <StateButton
                        isActived={this.state.isNotificationActive}
                        counts={this.state.unreadNoticeCounts}
                        containerClass="rightState" 
                        containerStyle={{marginTop: 10}} 
                        iconClass="fa fa-bell"
                        tips={notificationTips}
                        iconHandler={this._onNoticeToggle}/>
                    <StateButton
                        isActived={this.state.isFriendListActive}
                        counts={this.state.unreadConversations}
                        containerClass="rightState" 
                        containerStyle={{marginTop: 10}} 
                        iconClass="fa fa-comments"
                        tips={frinedListTiips}
                        iconHandler={this._onInboxToggle}/>
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
    mixins: [Router.Navigation, FluxibleMixin],
    /**
     * @Author: George_Chen
     * @Description: handle the user avatar click mechanism
     */
    _onAvatarClick: function() {
        this.executeAction(TogglePersonalInfo);
    },

    render: function() {
        var nameBytes = SharedUtils.stringToBytes(this.props.name);
        var nameStyle = {};
        // if username bytes exceed 16, we fix the width of username
        // and overflow exceeded strings
        if (nameBytes > 16) {
            nameStyle.width = 120;
            nameStyle.overflow = 'hidden';
        }
        return (
            <div className="userState" onClick={this._onAvatarClick}>
                <UserAvatar avatar={this.props.avatar} isCircle />
                <div className="UserStateName" style={nameStyle}> {this.props.name} </div>
            </div>
        );
    }
});

var StateButton = React.createClass({
    getInitialState: function() {
        return {
            isShown: false
        };
    },

    _onTipsShown: function(shownState) {
        if (this.props.tips) {
            this.setState({
                isShown: shownState
            });
        }
    },

    render: function() {
        var containerClass = this.props.containerClass || '';
        var containerStyle = this.props.containerStyle || {};
        return (
            <div className={containerClass} 
                style={containerStyle}
                onMouseEnter={this._onTipsShown.bind(this, true)}
                onMouseLeave={this._onTipsShown.bind(this, false)}>
                <FormButton 
                    isActived={this.props.isActived}
                    ref="button"
                    counts={this.props.counts}
                    colorType="blue"
                    defaultIconClass={this.props.iconClass} 
                    defaultIconHandler={this.props.iconHandler}/>
                <Tooltip 
                    show={this.state.isShown}
                    verticalPosition="bottom" 
                    horizontalPosition="right" 
                    touch
                    label={this.props.tips} />
            </div>
        );
    }
});
