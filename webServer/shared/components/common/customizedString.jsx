var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * material-ui components
 */
var Mui = require('material-ui');
var Tooltip = Mui.Tooltip;

var DEFAULT_COLOR = '#27A';
var DEAFULT_TIP_POSITION = 'left';

/**
 * @Author: George_Chen
 * @Description: the component for showing some customized string with tips
 *         NOTE: any string bytes length more than limitLength will be hided, and full string tips
 *               will be shown when mouse enter on that "label"
 * 
 * @param {String}       this.props.color, the string color
 * @param {String}       this.props.label, the displayed label
 * @param {Number}       this.props.limitLength, the limit bytes lenght of showing string
 */
module.exports = React.createClass({
    getInitialState: function() {
        return {
            isShown: false 
        };
    },

    _showInfo: function(shownState) {
        this.setState({
            isShown: shownState
        });
    },

    render: function() {
        var containerStyle = {
            position:'absolute', 
            color: this.props.color || DEFAULT_COLOR, 
            fontWeight: 500, 
            display: 'inline-block'
        };
        var len = this.props.label ? SharedUtils.stringToBytes(this.props.label)  : 0;
        var displayString = len > this.props.limitLength ? this.props.label.substring(0, this.props.limitLength) + '...' : this.props.label;
        return (
            <div style={containerStyle}
                onMouseEnter={this._showInfo.bind(this, true)}
                onMouseLeave={this._showInfo.bind(this, false)}>
                <Tooltip 
                    show={this.state.isShown && len > this.props.limitLength}
                    verticalPosition="top" 
                    horizontalPosition={DEAFULT_TIP_POSITION} 
                    label={this.props.label} />
                {displayString}
            </div>
        );
    }
});
