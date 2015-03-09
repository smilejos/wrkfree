var React = require('react');

/**
 * @Author: George_Chen
 * @Description: an form text input component
 *
 * @param {Function}    this.props.handleChange, for handling textInput change
 * @param {String}      this.props.defaultValue, the default value of textInput
 * @param {String}      this.props.type, the type of textInput 
 * @param {String}      this.props.name, an identifier for parent component to use
 */
var TextInput = React.createClass({
    /**
     * @Author: George_Chen
     * @Description: to handle the event change from current textInput value
     * 
     * @param {Object}      event, react event object
     */
    _handleChange: function(event){
        this.props.handleChange(this.props.name, event.target.value);
    },

    render: function(){
        var defaultValue = this.props.defaultValue || '';
        var inputType = this.props.type || 'text';
        var hintInfo = 'Your ' + this.props.name;
        return (
            <fieldset>
                <input
                    name={this.props.name} 
                    className="TextInput pure-input-1-3"
                    type={inputType} 
                    defaultValue={defaultValue}
                    onChange={this._handleChange} 
                    placeholder={hintInfo}/>
            </fieldset>  
        );
    }
});

module.exports = TextInput;