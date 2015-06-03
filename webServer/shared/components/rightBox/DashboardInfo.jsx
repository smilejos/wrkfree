var React = require('react');
var FluxibleMixin = require('fluxible').Mixin; 
var FriendList = require('./FriendList.jsx');
var ToggleStore = require('../../stores/ToggleStore');

var DashboardInfo = React.createClass({
	
	mixins: [FluxibleMixin],
	statics: {
        storeListeners: {
            '_onStoreChange': [ToggleStore]
        }
    },

    // handler for handling display or not
    _onStoreChange: function(){
        var store = this.getStore(ToggleStore).getState();
        if (this.state.isVisible !== store.friendVisiable) {
            this.setState({
                isVisible : store.friendVisiable 
            }); 
        }
    },

    getInitialState: function() {
        var store = this.getStore(ToggleStore).getState();
        return {
            isVisible : store.friendVisiable
       	};
   	},

    render: function() {
        return ( 
            <div className={this.state.isVisible ? "infoBox dashboardInfo" : "infoBox dashboardInfoShow"}>
                <FriendList />
            </div>
        );
    }
});

module.exports = DashboardInfo;
