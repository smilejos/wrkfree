var React = require('react');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var RadioButtonGroup = Mui.RadioButtonGroup;
var RadioButton = Mui.RadioButton;

 /**
  * @Author: George_Chen
  * @Description: An simple selective checkbox
  *
  * @param {Function}    this.props.handleChange, for handling selectInput change
  * @param {String}      this.props.value, the default value of selectInput
  * @param {String}      this.props.field, the identifier of this selectInput
  * @param {String}      this.props.options, the select options of this selectInput
  * @param {Boolean}     this.props.status.isValid, the input value valid status
  * @param {String}      this.props.status.err, the error message need to be render if
  *                                             status.isValid is 'false' 
  */
module.exports = React.createClass({
    /**
     * @Author: George_Chen
     * @Description: to handle the event change from current field
     * 
     * @param {Object}      event, react event object
     */
    _handleChange: function(event) {
        if (SharedUtils.isFunction(this.props.handleChange)) {
            this.props.handleChange(this.props.field, value);
        }
    },

    render: function(){
        var optionValues = this.props.options || [];
        var defaultValue = this.props.value || optionValues[0];
        var selectOptions = optionValues.map(function(optionValue){
            return (
                <RadioButton
                    key={this.props.field+optionValue}
                    value={optionValue}
                    label={optionValue} />                    
            );
        }, this);
        return (
            <div className="pure-u">
                <RadioButtonGroup 
                    name={this.props.field}
                    defaultSelected={defaultValue}
                    onChange = {this._handleChange}>
                    {selectOptions}
                </RadioButtonGroup> 
            </div>
        );
    }
});
