var React = require('react');
var FluxibleMixin = require('fluxible').Mixin;
var SignUpStore = require('../stores/SignUpStore');

/**
 * @Author: George_Chen
 * @Description: An group of input fields
 * 
 * @param {Array}      this.props.fields, an array of fields title
 */
var NormalFields = React.createClass({
    render: function(){
        var fields = this.props.fields || [];
        var defaultValues = this.props.defaultValues;
        var formElements = fields.map(function(fieldInfo){
            var inputType = (fieldInfo === 'Email' ? 'email' : 'text');
            var inputInfo = 'Your ' + fieldInfo;
            return (
                <fieldset key={fieldInfo+'field'}>
                    <input 
                        className="pure-input-1-3"
                        type={inputType} 
                        defaultValue={defaultValues[fieldInfo]}
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
        var defaultValue = this.props.defaultValue || 'male';
        var selectOptions = optionValues.map(function(value){
            return <option key={value+Date.now()}>{value}</option>
        });
        return (
            <div className="pure-u-md-1-3">
                <select className="pure-input-1-3" value={defaultValue}>
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
    /**
     * after mixin, mainApp can have this.getStore()
     */
    mixins: [FluxibleMixin],

    // when SignUpStore call "this.emitChange()",
    statics: {
        storeListeners: {
            'onStoreChange': [SignUpStore]
        }
    },

    // handler for handling the change of SignUpStore
    onStoreChange: function(){
        var state = this.getStore(SignUpStore).getState();
        this.setState(state);
    },

    getInitialState: function() {
        return this.getStore(SignUpStore).getState();
    },
    
    render: function(){
        return (
            <div className="SignUp">
                <form className="pure-form">
                    <NormalFields fields={['email', 'firstName', 'lastName']} defaultValues={this.state}/>
                    <SelectField values={['male', 'female']} defaultValue={this.state.gender}/>
                    <button type="submit" className="pure-button pure-button-primary pure-input-1-3">Sign up</button>
                </form>
            </div>
        );
    }
});