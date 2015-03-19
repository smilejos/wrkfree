var React = require('react');
var Link = require('react-router').Link;
var StateMixin = require('react-router').State;
var FluxibleMixin = require('fluxible').Mixin;
var HeaderStore = require('../stores/HeaderStore');

/**
 * child components
 */
var UserAvatar = require('./common/userAvatar.jsx');
var SearchBox = require('./common/searchBox.jsx');

module.exports = React.createClass({
    mixins: [FluxibleMixin, StateMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [HeaderStore]
        }
    },

    getInitialState: function() {
        return this.getStore(HeaderStore).getState();
    },

    onStoreChange: function() {
        var state = this.getStore(HeaderStore).getState();
        this.setState(state);
    },

    render: function() {
        // currently assign two button for easy navigating, should be removed later
        return (
            <div className="Header menuBox">
                <div className="pure-u-1-4">
                    <ul className="pure-menu-horizontal pure-menu">
                        <li className={this.isActive('/app/logout') ? 'pure-menu-selected' : ''} ><a href="/app/logout">{'Logout'}</a></li>
                        <li className={this.isActive('/app/dashboard') ? 'pure-menu-selected' : ''}><Link to='/app/dashboard'>Dashboard</Link></li>
                        <li className={this.isActive('/app/channel/ch123') ? 'pure-menu-selected' : ''}><Link to='/app/channel/ch123'>Channel</Link></li>
                    </ul>
                </div>
                <div className="pure-u-1-2">
                    <SearchBox placeholder={"Find channels ... "}/>
                </div>
                <div className="pure-u-1-4" style={{'textAlign': 'right'}}>
                    <ul className="pure-menu-horizontal pure-menu">
                        <li> {'Hi, '+this.state.userInfo.name} </li>
                        <li> <UserAvatar imgStyle={"circle"} avatar={this.state.userInfo.avatar} /> </li>
                    </ul>
                </div>
            </div>
        );
    }
});

