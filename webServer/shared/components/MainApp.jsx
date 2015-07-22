var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var RouteHandler = require('react-router').RouteHandler;
var RouterState = require('react-router').State;
var MainAppStore = require('../stores/MainAppStore');

/**
 * child components
 */
var Header = require('./Header.jsx');
var Subscription = require('./Subscription.jsx');
var Webcam = require('./Webcam.jsx');
var EventToaster = require('./EventToaster.jsx');
var Notifications = require('./common/Notifications.jsx');
var ChannelCreator = require('./common/ChannelCreator.jsx');
var Hangouts = require('./Hangouts.jsx');
var QuickSearch = require('./QuickSearch.jsx');
var FriendList = require('./rightBox/FriendList.jsx');

/**
 * below is for material-ui 9.0 up
 */
var Mui = require('material-ui');
var ThemeManager = new Mui.Styles.ThemeManager();

module.exports = React.createClass({
    /**
     * after mixin, mainApp can have this.getStore()
     */
    mixins: [FluxibleMixin, RouterState],

    // when MainAppStore call "this.emitChange()",
    // "onStoreChange()" of mainApp will be called
    statics: {
        storeListeners: {
            'onStoreChange': [MainAppStore]
        }
    },

    // handler for handling the change of MainAppStore
    onStoreChange: function(){
        var state = this.getStore(MainAppStore).getState();
        this.setState(state);
    },

    getInitialState: function() {
        return this.getStore(MainAppStore).getState();
    },

    // Important!
    // below is for material-ui 9.0 up
    childContextTypes: {
        muiTheme: React.PropTypes.object
    },

    // Important!
    // below is for material-ui 9.0 up
    getChildContext: function() { 
        return {
            muiTheme: ThemeManager.getCurrentTheme()
        };
    },
    
    render: function(){
        if (this.state.route.path === '/app/signup') {
            return (
                <div>
                    <div className="Header" />
                    <RouteHandler route={this.state.route}/>
                </div>
            );
        }
        // RouteHandler will take care of Routes while url change
        return (
            <div>
                <Header />
                <Webcam />
                <Subscription />
                <RouteHandler route={this.state.route}/>
                <FriendList />
                <Notifications />
                <ChannelCreator />
                <EventToaster />
                <Hangouts />
                <QuickSearch />
            </div>
        );
    }
});
