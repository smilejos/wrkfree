var React = require('react');

/**
 * material ui components
 */
var Mui = require('material-ui');
var Colors = Mui.Styles.Colors;
var FontIcon = Mui.FontIcon;

/**
 * @Author: George_Chen
 * @Description: this component is used for showing "tag" style text
 *         NOTE: looks like 'evernote' tag
 * 
 * @param {String}       this.props.pId, the id of current pills
 * @param {String}       this.props.label, the text label
 * @param {Function}     this.props.removeHandler, the remvoe function of current pill componet
 */
module.exports = React.createClass({
    _onRemove: function() {
        var removeHandler = this.props.removeHandler;
        if (removeHandler) {
            removeHandler(this.props.pId);
        }
    },

    render: function() {
        var mainColor = Colors.blue500;
        var containerStyle = {
            display: 'inline-block',
            padding: '5px 5px 5px 5px',
            position: 'relative'
        };
        var contentStyle = {
            borderRadius: 15,
            fontSize: 12,
            fontWeight: 300,
            backgroundColor: Colors.blue50,
            color: mainColor,
            padding: '5px 15px 5px 10px'
        };
        var removeIconStyle = {
            position: 'absolute', 
            cursor: 'pointer',
            bottom: 10, 
            right: 7
        };
        return (
            <div style={containerStyle}>
                <div style={contentStyle}>
                    {this.props.label}
                    <div style={removeIconStyle} onClick={this._onRemove}>
                        <FontIcon color={mainColor} style={{fontSize: 12}} className="material-icons">{'close'}</FontIcon>
                    </div>
                </div>
            </div>
        );
    }
});
