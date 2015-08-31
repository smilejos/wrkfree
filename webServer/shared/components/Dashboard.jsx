var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var DashboardStore = require('../stores/DashboardStore');

/**
 * actions
 */
var ToggleMainViewpoint = require('../../client/actions/toggleMainViewpoint');
var SetDashboardLayout = require('../../client/actions/setDashboardLayout');
var GetDashboardStream = require('../../client/actions/getDashboardStream');

/**
 * child components
 */
var ChannelGridLayout = require('./mainBox/channelGridLayout.jsx');
var ChannelListLayout = require('./mainBox/channelListLayout.jsx');
var StateIcon = require('./common/stateIcon.jsx');

var ResizeTimeout = null;
var DEFAULT_CONTENT_WIDTH = 900;
var DEFAULT_GRID_WIDTH = 300;
var MAXIMUM_LIST_CONTENT_WIDTH = 600;

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
     * @Description: generate content items by layout type
     */
    _generateItems: function() {
        var channels = this.state.channels;
        if (this.state.isDashboardGrid) {
            return (<ChannelGridLayout channels={channels} />);
        }
        return (<ChannelListLayout channels={channels} containerWdith={this.state.width} />);
    },

    /**
     * @Author: George_Chen
     * @Description: handler for mouse click event on dashboard container
     */
    _onContentClick: function() {
        this.executeAction(ToggleMainViewpoint, {
            isActive: true
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handle the layout type change while user select
     */
    _onLayoutChang: function(isGrid) {
        var contentWidth = this._getContentWidth();
        if (!isGrid && contentWidth < MAXIMUM_LIST_CONTENT_WIDTH) {
            return;
        }
        this.executeAction(SetDashboardLayout, {
            isDashboardGrid: isGrid
        });
    },

    /**
     * @Author: George_Chen
     * @Description: used to calculate the dashboard content width
     */
    _getContentWidth: function() {
        var width = window.innerWidth * 0.75;
        var columns = Math.round(width / DEFAULT_GRID_WIDTH);
        return (DEFAULT_GRID_WIDTH * columns);
    },

    /**
     * @Author: George_Chen
     * @Description: resize the current canvas
     */
    _resizeContent: function() {
        var contentWidth = this._getContentWidth();
        this.setState({
            width: contentWidth
        });
        if (!this.state.isDashboardGrid && contentWidth < MAXIMUM_LIST_CONTENT_WIDTH) {
            return this._onLayoutChang(true);
        }
    },

    /**
     * @Author: George_Chen
     * @Description: to control when to load the older channel stream
     */
    _handleScroll: function(e) {
        var container = React.findDOMNode(this);
        var visibleHeight = container.offsetHeight + container.scrollTop;
        var channels = this.state.channels;
        if (container.scrollHeight - visibleHeight > 0 || this.state.isLoading) {
            return;
        }
        // to check current scroll direction is top or bottom
        if (container.scrollTop - this.state.scrollTop >= 0) {
            this.setState({
                scrollTop: container.scrollTop,
                isLoading: true
            });
            this.executeAction(GetDashboardStream, {
                period: {
                    end: channels[channels.length-1].visitTime
                }
            });
        }
    },

    getInitialState: function() {
        var state = this._getStoreState();
        state.width = DEFAULT_CONTENT_WIDTH;
        return state;
    },

    componentDidUpdate: function(prevProps, prevState) {
        var isLoading = this.state.isLoading;
        if (this.state.isLoading) {
            return Promise
                .delay(1000)
                .bind(this)
                .then(function() {
                    this.setState({
                        isLoading: false
                    });
                });
        }
    },

    componentDidMount: function() {
        this.setState({
            scrollTop: 0,
            isLoading: false
        });
    },

    componentDidMount: function() {
        var self = this;
        self._resizeContent();
        window.addEventListener('resize', function(e) {
            clearTimeout(ResizeTimeout);
            ResizeTimeout = setTimeout(function() {
                self._resizeContent();
            }, 100);
        });
    },

    render: function() {
        var isGrid = this.state.isDashboardGrid;
        var contentStyle = {
            position: 'relative',
            width: this.state.width,
            marginLeft: (this.state.width / 2 * -1),
            paddingTop: '3%',
            left: '50%'
        };
        var toolbarStyle = {
            float: 'right',
            marginRight: 30,
            height: 30
        };
        return (
            <div className="mainBox" onClick={this._onContentClick} onScroll={this._handleScroll}>
                <div className="DashboardContentLayout" style={contentStyle}>
                    <div className="DashboardToolBar" style={toolbarStyle}>
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
                <div style={{position: 'fixed', left: '50%', bottom: 10, opacity: this.state.isLoading ? 0.9: 0}}>
                    <img width="30" src="/assets/imgs/loading.svg" />
                </div>
            </div>
        );
    }
});
