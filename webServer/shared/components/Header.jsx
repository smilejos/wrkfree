var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');

var HeaderStore = require('../stores/HeaderStore');
var SubscriptionStore = require('../stores/SubscriptionStore');
var ChannelCreatorStore = require('../stores/ChannelCreatorStore');
var NotificationStore = require('../stores/NotificationStore');
var FriendStore = require('../stores/FriendStore');
var PersonalStore = require('../stores/PersonalStore');

/**
 * actions
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var ToggleComponent = require('../../client/actions/toggleComponent');
var ToggleFriendList = require('../../client/actions/toggleFriendList');
var ToggleQuickSearch = require('../../client/actions/search/toggleQuickSearch');
var ToggleNotifications = require('../../client/actions/toggleNotifications');
var ToggleChannelCreator = require('../../client/actions/toggleChannelCreator');
var TogglePersonalInfo = require('../../client/actions/togglePersonalInfo');
var QuickSearchAction = require('../../client/actions/search/quickSearch');

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;

/**
 * child components
 */
var ChannelCreator = require('./common/ChannelCreator.jsx');
var UserAvatar = require('./common/userAvatar.jsx');
var StateIcon = require('./common/stateIcon.jsx');
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
            'onIconStateChange': [SubscriptionStore, ChannelCreatorStore, NotificationStore, FriendStore, PersonalStore]
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
            //isPersonalActive : this.getStore(PersonalStore).getState().isActive
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
     * @Author: George_Chen
     * @Description: focus on search field after click search icon
     */
    _onSearchIconClick: function() {
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
        var queryText = e.target.value;
        clearTimeout(CurrentSearch);
        CurrentSearch = setTimeout(function(){
            if (queryText !== '') {
                this.executeAction(QuickSearchAction, {
                    query: queryText
                }); 
            }           
        }.bind(this), SEARCH_DELAY_IN_MSECOND);
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

    _onChannelCreatorToggle: function(){
        this.executeAction(ToggleChannelCreator);
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
                    <div className="headerSearch" style={{marginTop: 10}}>
                        <FormButton 
                            width={300}
                            hasInput
                            isFiexedWidth
                            colorType="blue"
                            defaultIconClass="fa fa-search"
                            submitIconClass="fa fa-times"
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
                        containerClass="creatorState" 
                        containerStyle={{marginTop: 10}} />
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

