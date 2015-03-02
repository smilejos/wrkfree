var React = require('react');

/**
 * @Author: George_Chen
 * @Description: An group of input fields
 * 
 * @param {Array}      this.props.fields, an array of fields title
 */
var NormalFields = React.createClass({
    render: function(){
        var fields = this.props.fields || [];
        var formElements = fields.map(function(fieldInfo){
            var inputType = (fieldInfo === 'Email' ? 'email' : 'text');
            var inputInfo = 'Your ' + fieldInfo;
            return (
                <fieldset key={fieldInfo+'field'}>
                    <input 
                        className="pure-input-1-3"
                        type={inputType} 
                        placeholder={inputInfo}/>
                </fieldset>  
            );
        }, this);
        return <div>{formElements}</div>
    }
});

/**
 * @Author: George_Chen
 * @Description: An simple drop-down selection field
 * 
 * @param {Array}      this.props.values, selection option values
 */
var SelectField = React.createClass({
    render: function(){
        var optionValues = this.props.values || [];
        var selectOptions = optionValues.map(function(value){
            return <option key={value+Date.now()}>{value}</option>
        });
        return (
            <div className="pure-u-md-1-3">
                <select className="pure-input-1-3">
                    {selectOptions}
                </select>
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: An signup form which include basic info
 *               need to be filled
 */
module.exports = React.createClass({
    render: function(){
        return (
            <div className="SignUp">
                <form className="pure-form">
                    <NormalFields fields={['Email', 'First Name', 'Last Name']}/>
                    <SelectField values={['Male', 'Female']} />
                    <button type="submit" className="pure-button pure-button-primary pure-input-1-3">Sign up</button>
                </form>
            </div>
        );
    }
});