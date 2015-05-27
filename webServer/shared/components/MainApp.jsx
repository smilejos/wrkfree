var React = require('react');
var FluxibleMixin = require('fluxible').Mixin;
var RouteHandler = require('react-router').RouteHandler;
var RouterState = require('react-router').State;
var MainAppStore = require('../stores/MainAppStore');

/**
 * child components
 */
var Header = require('./Header.jsx');
var PrivateMsgBoxes = require('./PrivateMsgBoxes.jsx');
var ChannelNav = require('./ChannelNav.jsx');
var Webcam = require('./Webcam.jsx');
var EventToaster = require('./EventToaster.jsx');
var Notification = require('./common/notification.jsx');

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
    
    render: function(){
        // RouteHandler will take care of Routes while url change
        return (
            <div>
                <Header />
                <Webcam />
                <ChannelNav />
                <RouteHandler route={this.state.route}/>
                <Notification />
                <EventToaster />
                <PrivateMsgBoxes />
            </div>
        );
    }
});
