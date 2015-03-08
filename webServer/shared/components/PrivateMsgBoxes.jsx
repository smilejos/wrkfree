var PrivateBoxesStore = require('../stores/privateBoxesStore');
var FluxibleMixin = require('fluxible').Mixin;
var React = require('react');
var MsgBox = require('./common/msgBox.jsx');

var PrivateBox = React.createClass({
    render: function() {
        var msgsInfo = this.props.info;
        return (
            <div className="PrivNode pure-u-6-24">
                < MsgBox 
                    key={this.props.channelId+'MsgBox'}
                    msgs={this.props.msgs} 
                    header={this.props.header} 
                    channelId = {this.props.channelId} />
            </div>
        );
    }
});

module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            'onStoreChange': [PrivateBoxesStore]
        }
    },
    getInitialState: function() {
        return {};
    },

    onStoreChange: function(){
        return this.getStore(PrivateBoxesStore)
            .getStateAsync()
            .bind(this)
            .then(function(state){
                return this.setState(state);
            });
    },

    render: function(){
        var msgBoxes = Object.keys(this.state);
        var msgBoxInfo = msgBoxes.map(function(channelId){
            return <PrivateBox
                    key={channelId+'PrivateBox'} 
                    header={this.state[channelId].header}
                    msgs={this.state[channelId].msgs}
                    channelId={channelId}
                />
        },this);
        return (
            <div className="privBox">
                {msgBoxInfo}
            </div>
        );
    }
});