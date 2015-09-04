var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * material-ui components
 */
var Mui = require('material-ui');
var Colors = Mui.Styles.Colors;
var FontIcon = Mui.FontIcon;
var Tooltip = Mui.Tooltip;


/**
 * @Author: George_Chen
 * @Description: the component for showing notice time
 *
 * @param {Number}       this.props.timestamp, the timestamp
 * @param {Boolean}      this.props.isVisible, time visible or not
 * @param {Function}     this.props.iconHandler, the timeIcon handler
 */
module.exports = React.createClass({
    getInitialState: function() {
        return {
            isShown: false 
        };
    },

    _showTips: function(showState) {
        this.setState({
            isShown: showState
        });
    },

    render: function() {
        var containerStyle = {
            position:'absolute', 
            color: Colors.grey500,
            top: 10,
            right: 10,
            fontSize: 10,
            cursor: 'pointer'
        };
        var content = SharedUtils.formatDateTime(new Date(this.props.timestamp), 'M dd')
        if (!this.props.isVisible) {
            content = (
                <FontIcon className="material-icons" 
                    onTouchTap={this.props.iconHandler}
                    style={{fontWeight: 500, fontSize: 16, color: Colors.grey500, marginLeft: -15}}>
                    {'clear_all'}
                </FontIcon>
            );
        }
        return (
            <div style={containerStyle} 
                onMouseEnter={this._showTips.bind(this, true)}
                onMouseLeave={this._showTips.bind(this, false)}>
                <Tooltip 
                    style={{zIndex: 4}}
                    show={this.state.isShown}
                    verticalPosition="top" 
                    horizontalPosition="left" 
                    label="Mark as Read" />
                {content}
            </div>
        );
    }
});
