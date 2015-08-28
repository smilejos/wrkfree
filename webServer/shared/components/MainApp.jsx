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
var PersonalInfo = require('./common/PersonalInfo.jsx');
var Hangouts = require('./Hangouts.jsx');
var QuickSearch = require('./QuickSearch.jsx');
var FriendList = require('./rightBox/FriendList.jsx');
var SystemSounds = require('./SystemSounds.jsx');

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
        var state = this.getStore(MainAppStore).getState();
        state.isInited = false;
        return state;
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

    componentDidMount: function() {
        var delayTime = 1000;
        if (this.state.route.path === '/app/error') {
            delayTime = 0;
        }
        setTimeout(function(){
            this.setState({
                isInited: true
            });
        }.bind(this), delayTime);
    },
    
    render: function(){
        var isInited = this.state.isInited;
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
                <div style={{opacity: isInited ? 1 : 0}}>
                    <Header />
                    <Webcam />
                    <Subscription />
                    <RouteHandler route={this.state.route}/>
                    <FriendList />
                    <Notifications />
                    <ChannelCreator />
                    <PersonalInfo />
                    <EventToaster />
                    <Hangouts />
                    <QuickSearch />
                    <SystemSounds />
                </div>
                <div style={{width: '100%', height: '100%', display: isInited ? 'none' : 'inline'}} >
                    <div style={{position: 'fixed', top: '50%', marginTop: -100, left: '50%', marginLeft: -50}}>
                        <div><img width="100" src="/assets/imgs/logo.svg" /></div>
                        <div style={{marginLeft: 25}}><img width="50" src="/assets/imgs/hourglass.svg" /></div>
                    </div>
                </div>
            </div>
        );
    }
});
