var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible').Mixin;
var FriendStore = require('../../stores/FriendStore');

/**
 * child components
 */
var Friend = require('../common/friend.jsx');

/**
 * @Author: George_Chen
 * @Description: An sub-container component to handle friend list
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            '_onStoreChange': [FriendStore]
        }
    },

    // handler for handling the change of FriendStore
    _onStoreChange: function(){
        var state = this.getStore(FriendStore).getState();
        this.setState(state);
    },

    getInitialState: function() {
        return this.getStore(FriendStore).getState();
    },
    
    render: function(){
        var friends = this.state.friends;
        var friendList = friends.map(function(friendInfo){
            return <Friend 
                key={friendInfo.uid}
                info={friendInfo} />
        });
        return (
            <div className="Friends">
                {friendList}
            </div>
        );
    }
});
