var React = require('react');

 /**
  * @Author: George_Chen
  * @Description: An simple drop-down selection input tag
  *
  * @param {Function}    this.props.handleChange, for handling textInput change
  * @param {String}      this.props.defaultValue, the default value of textInput
  * @param {Array}       this.props.options, option valus of this select tag
  * @param {String}      this.props.name, an identifier for parent component to use
  */
var SelectInput = React.createClass({
    /**
     * @Author: George_Chen
     * @Description: to handle the event change from current field
     * 
     * @param {Object}      event, react event object
     */
    _handleChange: function(event) {
        this.props.handleChange(this.props.name, event.target.value);
    },

    render: function(){
        var optionValues = this.props.options || [];
        var defaultValue = this.props.defaultValue || 'male';
        var selectOptions = optionValues.map(function(value){
            return <option key={this.props.name+value}>{value}</option>
        }, this);
        return (
            <div className="SelectInput pure-u-md-1-3">
                <select className="pure-input-1-3" defaultValue={defaultValue} onChange={this._handleChange}>
                    {selectOptions}
                </select>
            </div>
        );
    }
});

module.exports = SelectInput;