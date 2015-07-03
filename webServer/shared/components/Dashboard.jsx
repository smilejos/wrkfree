var React = require('react');
var Mui = require('material-ui');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var DashboardStore = require('../stores/DashboardStore');

/**
 * actions
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var SetDashboardLayout = require('../../client/actions/setDashboardLayout');

/**
 * material UI compoents
 */
var Toolbar = Mui.Toolbar;
var ToolbarGroup = Mui.ToolbarGroup;
var FontIcon = Mui.FontIcon;

/**
 * child components
 */
var ChannelGridLayout = require('./mainBox/channelGridLayout.jsx');
var ChannelListLayout = require('./mainBox/channelListLayout.jsx');
var StateIcon = require('./common/stateIcon.jsx');

module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [DashboardStore]
        }
    },

    _onStoreChange: function() {
        var state = this._getStoreState();
        this.setState(state);
    },

    _getStoreState: function() {
        return this.getStore(DashboardStore).getState();
    },

    /**
     * @Author: George_Chen
     * @Description: handler for mouse click event on dashboard container
     */
    _onContentClick: function() {
        this.executeAction(ToggleChannelNav, {
            open: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handle the layout type change while user select
     */
    _onLayoutChang: function(isGrid) {
        this.executeAction(SetDashboardLayout, {
            isDashboardGrid: isGrid
        });
    },

    /**
     * @Author: George_Chen
     * @Description: generate content items by layout type
     */
    _generateItems: function() {
        var channels = this.state.channels;
        if (this.state.isDashboardGrid) {
            return (<ChannelGridLayout channels={channels} />);
        }
        return (<ChannelListLayout channels={channels} />);
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    render: function() {
        var isGrid = this.state.isDashboardGrid;
        return (
            <div className="mainBox" onClick={this._onContentClick}>
                <div className="DashboardContentLayout">
                    <div className="DashboardToolBar" >
                        <StateIcon
                            stateClass={isGrid ? "toolIcon" : "toolIcon active"} 
                            iconClass="fa fa-th-list"
                            handler={this._onLayoutChang.bind(this, false)} />
                        <StateIcon
                            stateClass={isGrid ? "toolIcon active" : "toolIcon"} 
                            iconClass="fa fa-th"
                            handler={this._onLayoutChang.bind(this, true)} />
                    </div>
                    <div className="DashboardItems" >
                        {this._generateItems()}
                    </div>
                </div>
            </div>
        );
    }
});
