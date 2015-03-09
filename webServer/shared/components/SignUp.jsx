var React = require('react');
var FluxibleMixin = require('fluxible').Mixin;
var NavigationMixin = require('react-router').Navigation;
var SignUpStore = require('../stores/SignUpStore');
var SignUpAction = require('../../client/actions/userSignUp');

/**
 * child components
 */
var TextInput = require('./common/textInput.jsx');
var SelectInput = require('./common/selectInput.jsx');

/**
 * @Author: George_Chen
 * @Description: An signup form which include basic info
 *               need to be filled
 */
module.exports = React.createClass({
    /**
     * after mixin, mainApp can have this.getStore()
     */
    mixins: [FluxibleMixin, NavigationMixin],

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
        return this.executeAction(SignUpAction, {
            transitionHandler: this.transitionTo,
            signUpInfo: JSON.stringify(this.state)
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
        var genderOptions = ['male', 'female'];
        return (
            <div className="SignUp">
                <form className="pure-form" onSubmit={this._onSubmit}>
                    <TextInput name={'email'} defaultValue={this.state.email} handleChange={this._onInputChange} type={'email'}/>
                    <TextInput name={'givenName'} defaultValue={this.state.givenName} handleChange={this._onInputChange} type={'text'}/>
                    <TextInput name={'familyName'} defaultValue={this.state.familyName} handleChange={this._onInputChange} type={'text'}/>
                    <SelectInput name={'gender'} options={genderOptions} defaultValue={this.state.gender} handleChange={this._onInputChange} />
                    <button type="submit" className="pure-button pure-button-primary pure-input-1-3">Sign up</button>
                </form>
            </div>
        );
    }
});