var React = require('react');
var Link = require('react-router').Link;
var StateMixin = require('react-router').State;
 
module.exports = React.createClass({
    mixins: [StateMixin],
    render: function() {

        // currently assign two button for easy navigating, should be removed later
        return (
            <ul className="menuBox pure-menu-horizontal pure-menu">
                <li className={this.isActive('/app/logout') ? 'pure-menu-selected' : ''} ><a href="/app/logout">{'Logout'}</a></li>
                <li className={this.isActive('/app/dashboard') ? 'pure-menu-selected' : ''}><Link to='/app/dashboard'>Dashboard</Link></li>
                <li className={this.isActive('/app/channel/ch123') ? 'pure-menu-selected' : ''}><Link to='/app/channel/ch123'>Channel</Link></li>
            </ul>
        );
    }
});