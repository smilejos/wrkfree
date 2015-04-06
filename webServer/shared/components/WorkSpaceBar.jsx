var React = require('react');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;

/**
 * workspace tool bar, now just a template
 */         
module.exports = React.createClass({
    render: function(){
        return (
            <div className="footer">
                <div className="pure-u-1-3">
                    <IconButton iconClassName="fa fa-sign-out" />
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
