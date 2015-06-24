var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * actions
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');

/**
 * child components
 */
var MainBox = require('./mainBox/DashboardMain.jsx');

module.exports = React.createClass({
    mixins: [FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: handler for mouse click event on dashboard container
     */
    _onContentClick: function() {
        this.executeAction(ToggleChannelNav, {
            open: false
        });
    },

    render: function(){
        return (
            <div onClick={this._onContentClick} >
                <MainBox />
            </div>
        );
    }
});