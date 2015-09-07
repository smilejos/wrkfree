var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * stores
 */
var QuickSearchStore = require('../stores/QuickSearchStore');

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

/**
 * child components
 */
var SearchResult = require('./SearchResult.jsx');

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
                leftIcon={<FontIcon color={Colors.indigo500} className="material-icons">{'search'}</FontIcon>} />
        );
    },

    getInitialState: function() {
        return {
            isActive: false,
            isSearching: false,
            results: []
        };
    },

    render: function(){
        var reuslts = this.state.results;
        var isActive = this.state.isActive;
        var containerStyle = {
            position: 'fixed',
            width: 320,
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
        var list = SharedUtils.fastArrayMap(reuslts, function(item) {
            return (
                <SearchResult key={item} 
                    searchKey={item} />
            );
        });
        var listContainerStyle = {
            overflowY: this.state.isScrollShown ? 'auto' : 'hidden',
            overflowX: 'hidden',
            height: (list.length > 3 ? 250 : 'auto')
        };
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
