var React = require('react');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var TextField = Mui.TextField;
var IconButton = Mui.IconButton;

/**
 * @Author: George_Chen
 * @Description: an form text input component
 *
 * @param {Function}    this.props.handleChange, for handling textInput change
 * @param {String}      this.props.value, the default value of textInput
 * @param {String}      this.props.field, the identifier of this textInput
 * @param {Boolean}     this.props.status.isValid, the input value valid status
 * @param {String}      this.props.status.err, the error message need to be render if
 *                                             status.isValid is 'false' 
 */
module.exports = React.createClass({
    /**
     * @Author: George_Chen
     * @Description: to handle the event change from current textInput value
     * 
     * @param {Object}      event, react event object
     */
    _handleChange: function(event){
        if (SharedUtils.isFunction(this.props.handleChange)) {
            var field = this.props.field;
            var value = this.refs[field].getValue();
            this.props.handleChange(field, value);
        }
    },

    render: function() {
        return (
            <div><IconButton iconClassName={this.props.iconClass} />          
                <TextField
                    defaultValue={this.props.value}
                    ref={this.props.field}
                    onChange={this._handleChange}
                    hintText={this.props.field}
                    errorText={this.props.status.err}
                    floatingLabelText={'Your '+this.props.field} />
                {this.props.status.isValid ? <span className="green">√</span> : ''}
            </div>
        );
    }
});
