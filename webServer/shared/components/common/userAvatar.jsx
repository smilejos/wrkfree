var React = require('react');

/**
 * @Author: George_Chen
 * @Description: UserAvatar of React Component
 * NOTE: by assign the imgStyle can assign different shape of avatar
 */
var UserAvatar = React.createClass({
    render: function(){
        var imgStyle = '';
        if (this.props.imgStyle) {
            imgStyle = this.props.imgStyle;
        }
        return (
            <div className='UserAvatar'>
                <img className={imgStyle} src={this.props.avatar}/>
            </div>
        );
    }
});

module.exports = UserAvatar;