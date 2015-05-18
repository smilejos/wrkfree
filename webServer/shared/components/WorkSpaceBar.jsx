var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible').Mixin;

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;

/**
 * workspace tool bar, now just a template
 */         
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],

    _onLeave: function () {
        this.transitionTo('/app/dashboard');
    },

    render: function (){
        return (
            <div className="footer">
                <div className="pure-u-1-3">
                    <IconButton iconClassName="fa fa-home"
                                onClick={this._onLeave} />
                    <IconButton iconClassName="fa fa-user-plus" />
                    <IconButton iconClassName="fa fa-tag" />
                    <IconButton iconClassName="fa fa-star" />
                </div>
                <div className="pure-u-1-3" >
                </div>
                <div className="pure-u-1-3 Right" >
                    <IconButton iconClassName="fa fa-comments" />
                    <IconButton iconClassName="fa fa-video-camera" />
                    <IconButton iconClassName="fa fa-phone" />
                    <IconButton iconClassName="fa fa-desktop" />
                    <IconButton iconClassName="fa fa-paperclip" />
                </div>
            </div>
        );
    }
});
