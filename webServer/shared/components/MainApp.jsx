var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var RouteHandler = require('react-router').RouteHandler;
var RouterState = require('react-router').State;
var MainAppStore = require('../stores/MainAppStore');

/**
 * child components
 */
var Header = require('./Header.jsx');
var ChannelNav = require('./ChannelNav.jsx');
var Webcam = require('./Webcam.jsx');
var EventToaster = require('./EventToaster.jsx');
var Notifications = require('./common/Notifications.jsx');
var Hangouts = require('./Hangouts.jsx');

/**
 * TODO: below is for material-ui 9.0 up
 * material-ui 
 */
// var Mui = require('material-ui');
// var ThemeManager = new Mui.Styles.ThemeManager();
// var Colors = Mui.Styles.Colors;

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
    // TODO: below is for material-ui 9.0 up
    // childContextTypes: {
    //     muiTheme: React.PropTypes.object
    // },

    // Important!
    // TODO: below is for material-ui 9.0 up
    // getChildContext: function() { 
    //     return {
    //         muiTheme: ThemeManager.getCurrentTheme()
    //     };
    // },
    
    render: function(){
        // RouteHandler will take care of Routes while url change
        return (
            <div>
                <Header />
                <Webcam />
                <ChannelNav />
                <RouteHandler route={this.state.route}/>
                <Notifications />
                <EventToaster />
                <Hangouts />
            </div>
        );
    }
});
