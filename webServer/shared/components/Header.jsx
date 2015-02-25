var React = require('react');
var Link = require('react-router').Link;
var StateMixin = require('react-router').State;
 
module.exports = React.createClass({
    mixins: [StateMixin],
    render: function() {

        // currently assign two button for easy navigating, should be removed later
        return (
            <ul className="menuBox pure-menu-horizontal pure-menu">
                <li className={this.isActive('/dashboard') ? 'pure-menu-selected' : ''}><Link to='/dashboard'>Dashboard</Link></li>
                <li className={this.isActive('/channel/ch123') ? 'pure-menu-selected' : ''}><Link to='/channel/ch123'>Channel</Link></li>
            </ul>
        );
    }
});