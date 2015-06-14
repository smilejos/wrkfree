var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var FriendStore = require('../../stores/FriendStore');
var ToggleStore = require('../../stores/ToggleStore');

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
            '_onStoreChange': [FriendStore],
            '_onVisiableChange': [ToggleStore]
        }
    },

    getInitialState: function() {
        return {
            isVisible : this.getStore(ToggleStore).getState().friendVisiable,
            friends : this.getStore(FriendStore).getState().friends
        };
    },

    // handler for handling display or not
    _onVisiableChange: function(){
        var store = this.getStore(ToggleStore).getState();
        if (this.state.isVisible !== store.friendVisiable) {
            this.setState({
                isVisible : store.friendVisiable 
            }); 
        }
    },

    // handler for handling the change of FriendStore
    _onStoreChange: function(){
        var store = this.getStore(FriendStore).getState();
        this.setState({
            friends : store.friends
        });
    },
    
    render: function(){
        var friends = this.state.friends;
        var friendList = friends.map(function(friendInfo){
            return <Friend 
                key={friendInfo.uid}
                info={friendInfo} />
        });
        return (
            <div className={this.state.isVisible ? 'FriendsShow' : 'Friends'}>
                {friendList}
            </div>
        );
    }
});
