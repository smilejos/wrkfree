var React = require('react');

/**
 * @Author: George_Chen
 * @Description: this component is used to display some icon with special counter state
 *         NOTE: this.props.counts is optional value.
 * 
 * @param {String}        this.props.stateClass, the container class of state icon
 * @param {String}        this.props.iconClass, the state icon class
 * @param {String}        this.props.counts, used to display a small count number on state icon
 * @param {Function}      this.props.handler, the onClick handler for state icon
 */
module.exports = React.createClass({
    _setCounter: function() {
        if (this.props.counts > 0) {
            return <span className="counter"> {this.props.counts} </span>
        }
        return '';
    },

    render: function() {
        var iconStyle = {
            paddingTop: 13,
            cursor: 'pointer'
        };

        iconStyle = this.props.style ? this.props.style : iconStyle;
        
        return (
            <div className={this.props.stateClass} >
                <span className={this.props.iconClass} onClick={this.props.handler} style={iconStyle} />
                {this._setCounter()}
            </div>
        );
    }
});
