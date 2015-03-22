var React = require('react');

 /**
  * @Author: George_Chen
  * @Description: User Avatar of React Component
  *
  * @param {String}      this.props.avatar, the user's avatar url
  * @param {String}      this.props.isCircle, assgin the circle or square avatar 
  * @param {Boolean}     this.props.style, inline style of UserAvatar div
  */
var UserAvatar = React.createClass({
    render: function(){
        var classSet = React.addons.classSet;
        var imgSet = {
            circle: this.props.isCircle
        };
        return (
            <div className="UserAvatar" style={this.props.style} >
                <img className={classSet(imgSet)} src={this.props.avatar}/>
            </div>
        );
    }
});

module.exports = UserAvatar;