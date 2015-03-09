var React = require('react');
var FluxibleMixin = require('fluxible').Mixin;
var SignUpStore = require('../stores/SignUpStore');
var request = require('superagent');
var Navigation = require('react-router').Navigation;
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * @Author: George_Chen
 * @Description: An group of input fields
 * 
 * @param {Array}      this.props.fields, an array of fields title
 */
var NormalFields = React.createClass({
    /**
     * @Author: George_Chen
     * @Description: to handle the event change from current field
     * 
     * @param {Object}      event, react event object
     */
    _handleChange: function(event){
        this.props.handleChange(event.target.name, event.target.value);
    },

    render: function(){
        var fields = this.props.fields || [];
        var defaultValues = this.props.defaultValues;
        var formElements = fields.map(function(fieldInfo){
            var inputType = (fieldInfo === 'email' ? 'email' : 'text');
            var inputInfo = 'Your ' + fieldInfo;
            return (
                <fieldset key={fieldInfo+'field'}>
                    <input
                        name={fieldInfo} 
                        className="pure-input-1-3"
                        type={inputType} 
                        defaultValue={defaultValues[fieldInfo]}
                        onChange={this._handleChange} 
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
        var optionValues = this.props.values || [];
        var defaultValue = this.props.defaultValue || 'male';
        var selectOptions = optionValues.map(function(value){
            return <option key={value+Date.now()}>{value}</option>
        });
        return (
            <div className="pure-u-md-1-3">
                <select className="pure-input-1-3" defaultValue={defaultValue} onChange={this._handleChange}>
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
    mixins: [FluxibleMixin, Navigation],

    // when SignUpStore call "this.emitChange()",
    statics: {
        storeListeners: {
            'onStoreChange': [SignUpStore]
        }
    },
    getInitialState: function() {
        return {};
    },

    /**
     * @Author: George_Chen
     * @Description: used to submit the signup form
     * 
     * NOTE: form data is extract from "this.state"
     */
    _onSubmit: function(e){
        e.preventDefault();
        var self = this;
        return new Promise(function(resolve){
            var submitJson = {
                signUpInfo: JSON.stringify(self.state)
            };
            request.post('/app/signup')
                .send(submitJson)
                .set('Content-Type', 'application/json')
                .end(resolve);
        }).then(function(res){
            if (!res.ok) {
                throw new Error(res.text);
            }
            self.transitionTo(res.body.route);
            // build pomelo socket and trigger an new navigation action ?
        }).catch(function(err){
            SharedUtils.printError('SignUp', '_onSubmit', err);
        });
    },

    /**
     * @Author: George_Chen
     * @Description: used to detect the input field change of child element
     * 
     * @param {String}      field, the input field name
     * @param {String}      value, the input value
     */
    _onInputChange: function(field, value){
        this.state[field] = value;
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
                <form className="pure-form" onSubmit={this._onSubmit}>
                    <NormalFields fields={['email', 'givenName', 'familyName']} defaultValues={this.state} handleChange={this._onInputChange}/>
                    <SelectField values={['male', 'female']} defaultValue={this.state.gender} handleChange={this._onInputChange} name={"gender"}/>
                    <button type="submit" className="pure-button pure-button-primary pure-input-1-3">Sign up</button>
                </form>
            </div>
        );
    }
});