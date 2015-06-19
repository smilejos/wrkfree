var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');
var ReactGridLayout = require('react-grid-layout');

/**
 * the row and col settings on react-grid layout
 */
var GRID_MAX_COLS = 5;
// based on the height of infoCard
var GRID_ITEM_HEIGHT = 235;

/**
 * stores
 */
var QuickSearchStore = require('../stores/QuickSearchStore');


/**
 * child components
 */
var InfoCard = require('./common/infoCard.jsx');


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
        this.setState(state);
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    render: function(){
        var classSet = React.addons.classSet;
        var styleSet = {
            QuickSearch: this.state.isEnabled,
            hide: !this.state.isEnabled,
            Center: true
        };
        var users = this.state.results.users;
        var channels = this.state.results.channels;
        return (
            <div className={classSet(styleSet)} >
                <SearchResults itemList={channels} type="Channels" />
                <SearchResults itemList={users} type="Users" />
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: the searchResult component
 *         NOTE: the type should only be "users" or "channels"
 *         
 * @param {Array}       props.itemList, the search result items
 * @param {String}      props.type, the type of search results
 */
var SearchResults = React.createClass({
    /**
     * @Author: George_Chen
     * @Description: set the results layout
     *
     * @param {Array}      listLayout, the react grid item position
     * @param {Array}      listContent, the view of each grid item
     */
    _setResults: function(listLayout, listContent) {
        var hasResults = (this.props.itemList.length > 0);
        if (!hasResults) {
            return (<div className="noResult"> {'No Results'} </div>);
        }
        return (
            <ReactGridLayout 
                className="searchResults"
                layout={listLayout}
                cols={GRID_MAX_COLS} 
                rowHeight={GRID_ITEM_HEIGHT}
                isDraggable={false}>
                {listContent}
            </ReactGridLayout>
        );
    },

    render: function(){
        var listLayout = new Array(this.props.itemList.length);
        var listContent = SharedUtils.fastArrayMap(this.props.itemList, function(item, index){
            listLayout[index] = {
                i:index, 
                x: index%GRID_MAX_COLS, 
                y: index%GRID_MAX_COLS, 
                w: 1, // the number of colums used by this item
                h: 1, // the number of row used by this item
            };
            return (
                <div key={index}>
                    <InfoCard cardId={item} />
                </div>
            );
        });
        return (
            <div >
                <div className="searchTitle">{this.props.type}</div>
                {this._setResults(listLayout, listContent)}
            </div>
        );
    }
});
