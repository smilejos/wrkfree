var FluxibleMixin = require('fluxible').Mixin;
var RouteHandler = require('react-router').RouteHandler;
var RouterState = require('react-router').State;
var MainAppStore = require('../stores/MainAppStore');
var React = require('react');
var Header = require('./Header.jsx');
var PrivateMsgBoxes = require('./PrivateMsgBoxes.jsx');

var MainApp = React.createClass({

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
                <RouteHandler appInfo={this.state}/>
                <PrivateMsgBoxes />
            </div>
        );
    }
});

module.exports = MainApp;
