var React = require('react');
var Mui = require('material-ui');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var DashboardStore = require('../../stores/DashboardStore');

/**
 * material UI compoents
 */
var Toolbar = Mui.Toolbar;
var ToolbarGroup = Mui.ToolbarGroup;
var FontIcon = Mui.FontIcon;

/**
 * child components
 */
var ChannelGridLayout = require('./channelGridLayout.jsx');
var ChannelListLayout = require('./channelListLayout.jsx');

/**
 * Public API
 * @Author: George_Chen
 * @Description: this is the main layout for "/app/dashboard"
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [DashboardStore]
        }
    },

    onStoreChange: function() {
        var state = this.getStore(DashboardStore).getState();
        this.setState(state);
    },

    getInitialState: function() {
        return this.getStore(DashboardStore).getState();
    },

    /**
     * @Author: George_Chen
     * @Description: handle the layout type change while user select
     */
    _onLayoutChang: function(isGrid) {
        this.setState({
            isDashboardGrid: isGrid,
            channels: this.state.channels
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

    // TODO: need to display which layout is selected, grid or list
    render: function() {
        return (
            <div className="mainBox DashboardMain ">
                <div className="DashboardContentLayout">
                    <div className="DashboardToolBar" >
                        <Toolbar>
                            <ToolbarGroup key={0} float="right">
                                <FontIcon className="fa fa-th-list" 
                                    onClick={this._onLayoutChang.bind(this, false)}/>
                                <FontIcon className="fa fa-th"
                                    onClick={this._onLayoutChang.bind(this, true)}/>
                            </ToolbarGroup>
                        </Toolbar>
                    </div>
                    <div>{this._generateItems()}</div>
                </div>
            </div>
        );
    }
});
