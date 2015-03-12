var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible').Mixin;
var NavigationMixin = require('react-router').Navigation;
var SignUpStore = require('../stores/SignUpStore');
var SignUpAction = require('../../client/actions/userSignUp');
var VertifySignUp = require('../../client/actions/vertifySignUp');

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
            signUpInfo: JSON.stringify(this.state.info)
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
        this.state.info[field] = value;
        this.executeAction(VertifySignUp, {
            type: field,
            fieldValue: value
        });
    },

    // handler for handling the change of SignUpStore
    onStoreChange: function(){
        var state = this.getStore(SignUpStore).getState();
        this.setState(state);
    },

    getInitialState: function() {
        var state = this.getStore(SignUpStore).getState();
        var self = this;
        Promise.map(Object.keys(state.status), function(field){
            self.executeAction(VertifySignUp, {
                type: field, 
                fieldValue: state.info[field]
            });
        }).catch(function(err){
            SharedUtils.printError('SignUp.jsx', 'getInitialState', err);
        });
        return state;
    },
    
    render: function(){
        var genderOptions = ['male', 'female'];
        var defaultInfo = this.state.info;
        return (
            <div className="SignUp mainBox">
                <form className="pure-form" onSubmit={this._onSubmit}>
                    <TextInput name={'email'} defaultValue={defaultInfo.email} handleChange={this._onInputChange} type={'email'}/>
                    <TextInput name={'givenName'} defaultValue={defaultInfo.givenName} handleChange={this._onInputChange} type={'text'}/>
                    <TextInput name={'familyName'} defaultValue={defaultInfo.familyName} handleChange={this._onInputChange} type={'text'}/>
                    <SelectInput name={'gender'} options={genderOptions} defaultValue={defaultInfo.gender} handleChange={this._onInputChange} />
                    <button type="submit" className="pure-button pure-button-primary pure-input-1-3">Sign up</button>
                </form>
            </div>
        );
    }
});