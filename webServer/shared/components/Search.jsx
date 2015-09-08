var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * stores
 */
var QuickSearchStore = require('../stores/QuickSearchStore');

var ToggleSearchMode = require('../../client/actions/toggleSearchMode');

/**
 * material-ui components
 */
var Mui = require('material-ui');
var Avatar = Mui.Avatar;
var Colors = Mui.Styles.Colors;
var List = Mui.List;
var ListItem = Mui.ListItem;
var ListDivider = Mui.ListDivider;
var FontIcon = Mui.FontIcon;
var IconButton = Mui.IconButton;

/**
 * child components
 */
var SearchResult = require('./SearchResult.jsx');

var ResizeTimeout = null;

/**
 * the main component of quickSearch
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            '_onStoreChange': [QuickSearchStore]
        }
    },

    /**
     * @Author: George_Chen
     * @Description: get state from QuickStore
     */
    _getStoreState: function(){
        return this.getStore(QuickSearchStore).getState();
    },

    /**
     * @Author: George_Chen
     * @Description: handler for QuickStore change
     */
    _onStoreChange: function() {
        var state = this._getStoreState();
        var users = state.results.users || [];
        var channels = state.results.channels || [];
        this.setState({
            isActive: state.isActive,
            isGridResults: state.isGridResults,
            isSearching: state.isSearching,
            results: channels.concat(users)
        });
    },

    /**
     * @Author: George_Chen
     * @Description: used to handle scroll bar shown or not
     */
    _onScrollShown: function(showState) {
        this.setState({
            isScrollShown: showState
        });
    },

    /**
     * @Author: George_Chen
     * @Description: set search header style to match current search action
     */
    _setSearchHeader: function() {
        var isGridResults = this.state.isGridResults;
        var isSearching = this.state.isSearching;
        var itemStyle = {
            height: 55
        };
        if (isSearching) {
            return (
                <ListItem disabled primaryText="Searching ..."
                    style={itemStyle}
                    leftAvatar={<Avatar size={30} src="/assets/imgs/searching.svg" style={{marginTop: 3, backgroundColor: '#FFF', border: 'none'}} />} />
            );
        }
        return (
            <ListItem disabled primaryText="Search Results"
                style={itemStyle}
                leftIcon={<FontIcon color={Colors.indigo500} className="material-icons">{'search'}</FontIcon>}
                rightIconButton={
                    <IconButton 
                        onTouchTap={this._toggleSearchMode}
                        tooltipPosition="bottom-right"
                        tooltip={isGridResults ? 'compress results' : 'expand reuslts'}
                        iconClassName="material-icons">
                            {isGridResults ? 'tab_unselected' : 'tab'}
                    </IconButton>
                } 
            />
        );
    },

    _toggleSearchMode: function() {
        this.executeAction(ToggleSearchMode);
    },

    getInitialState: function() {
        return {
            isActive: false,
            isSearching: false,
            isGridResults: false,
            gridSearchWidth: 0,
            gridSearchHeight: 0,
            results: []
        };
    },

    componentDidMount: function() {
        var self = this;
        self._resizeContainer();
        window.addEventListener('resize', function(e) {
            if (ResizeTimeout) {
                clearTimeout(ResizeTimeout);
            }
            ResizeTimeout = setTimeout(function() {
                self._resizeContainer();
            }, 300);
        });
    },

    /**
     * @Author: George_Chen
     * @Description: resize the current canvas
     */
    _resizeContainer: function() {
        var ratio = 0.9;
        this.setState({
            gridSearchWidth: (window.innerWidth - 200) * ratio,
            gridSearchHeight: (window.innerHeight - 200) * ratio
        });
    },

    render: function(){
        var results = this.state.results;
        var isActive = this.state.isActive;
        var isGridResults = this.state.isGridResults;
        var gridWidth = 170;
        var containerStyle = {
            position: 'fixed',
            width: isGridResults ? this.state.gridSearchWidth : 320,
            top: (isActive ? 51 : -100 ),
            left: 50,
            visibility: (isActive ? 'visible' : 'hidden'),
            opacity: (isActive ? 1 : 0),
            zIndex: (isActive ? 3 : 1),
            border: 'solid 1px',
            borderRadius: 5,
            borderColor: Colors.grey300,
            backgroundColor: '#FFF',
            transition: '0.5s'
        };
        var list = SharedUtils.fastArrayMap(results, function(item) {
            return (
                <SearchResult key={item} 
                    gridWidth={gridWidth}
                    isList={!isGridResults}
                    searchKey={item} />
            );
        });
        var listContainerStyle = {
            overflowY: this.state.isScrollShown ? 'auto' : 'hidden',
            overflowX: 'hidden',
            height: (list.length > 3 ? 250 : 'auto')
        };
        if (isGridResults) {
            listContainerStyle.paddingLeft = (this.state.gridSearchWidth % gridWidth) / 2;
            listContainerStyle.height = this.state.gridSearchHeight;
        }
        return (
            <div style={containerStyle}>
                <List style={{marginTop: 1}}>
                    {this._setSearchHeader()}
                </List>
                <ListDivider />
                <List ref="notificationList"
                    onMouseEnter={this._onScrollShown.bind(this, true)}
                    onMouseLeave={this._onScrollShown.bind(this, false)} 
                    style={listContainerStyle}>
                    {list}
                </List>
            </div>
        );
    }
});
