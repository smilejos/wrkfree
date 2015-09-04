var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * stores
 */
var NotificationStore = require('../../stores/NotificationStore');

/**
 * child components
 */
var Notice = require('./notice.jsx');

/**
 * material-ui components
 */
var Mui = require('material-ui');
var List = Mui.List;
var ListItem = Mui.ListItem;
var ListDivider = Mui.ListDivider;
var FontIcon = Mui.FontIcon;
var Colors = Mui.Styles.Colors;

/**
 * @Author: Jos Tung
 * @Description: an notification component to display notice message
 * 
 * LAST UPDATED: George_Chen
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [NotificationStore]
        }
    },

    _getStoreState: function() {
        return this.getStore(NotificationStore).getState();
    },

    _onStoreChange: function(){
        var state = this._getStoreState();
        this.setState(state);
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    /**
     * @Author: George_Chen
     * @Description: used to handle scroll bar shown or not
     */
    _onScrollShown: function(showState) {
        this.setState({
            isScrollShown: showState
        });
    },

    render: function(){
        var notifications = this.state.notifications;
        var list = SharedUtils.fastArrayMap(notifications, function(info) {
            return <Notice key={info.reqId} info={info} />
        });
        var listContainerStyle = {
            overflowY: this.state.isScrollShown ? 'auto' : 'hidden',
            overflowX: 'hidden',
            height: 260
        };
        return (
            <div className={this.state.isActive ? "Notification NotificationShow" : "Notification"}
                style={{borderRadius: 5}}>
                <List style={{marginTop: 1}}>
                    <ListItem disabled primaryText="Notifications"
                        leftIcon={<FontIcon color={Colors.green500} className="material-icons">{'notifications_active'}</FontIcon>} />
                </List>
                <ListDivider />
                <List ref="notificationList"
                    onMouseEnter={this._onScrollShown.bind(this, true)}
                    onMouseLeave={this._onScrollShown.bind(this, false)} 
                    style={listContainerStyle}>
                    {list}
                </List>
            </div>
        );
    }
});
