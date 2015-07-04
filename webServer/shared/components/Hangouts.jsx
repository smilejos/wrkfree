var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');

var HangoutStore = require('../stores/HangoutStore');
var HeaderStore = require('../stores/HeaderStore');

/**
 * child components
 */
var HangoutSpace = require('./hangout/HangoutSpace.jsx');

/**
 * the hangouts.jsx is the main container for all hangout windows
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [HangoutStore]
        }
    },

    _getStoreState: function() {
        return this.getStore(HangoutStore).getState();
    },

    _onStoreChange: function() {
        var state = this._getStoreState();
        this.setState(state);
    },

    getInitialState: function() {
        var state = this._getStoreState();
        state.selfUid = this.getStore(HeaderStore).getSelfInfo().uid;
        return state;
    },

    render: function(){
        var self = this;
        var info = this.state.hangoutsInfo;
        var list = SharedUtils.fastArrayMap(this.state.hangouts, function(cid, index){
            return (
                <HangoutSpace 
                    key={'hangout:'+cid} 
                    channelId={cid} 
                    self={self.state.selfUid}
                    title={info[cid].hangoutTitle}
                    isCompressed={info[cid].isCompressed}
                    hasConference={info[cid].hasConference}
                    isTwinkled={info[cid].isTwinkled}
                    onFocused={info[cid].onFocused}
                    onCall={info[cid].onCall}
                    hangoutIndex={index}
                    bottomOffset={self.state.bottomOffset} />
            );
        });
        return (
            <div className="Hangouts" >
                {list}
            </div>
        );
    }
});
