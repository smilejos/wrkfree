var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin');
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
 * material ui components
 */
var Mui = require('material-ui');
var Paper = Mui.Paper;
var RaisedButton = Mui.RaisedButton;

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
    _handleChange: function(field, value){
        this.executeAction(VertifySignUp, {
            type: field,
            fieldValue: value
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for the change of SignUpStore
     */
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

    /**
     * @Author: George_Chen
     * @Description: used to check signup form are filled with valid status
     */
    _isSignupComplete: function(){
        var fields = Object.keys(this.state.status);
        for (var i=0; i<=fields.length-1; ++i) {
            if (!this.state.status[fields[i]].isValid) {
                return false;
            }
        }
        return true;
    },

    render: function(){
        var defaultInfo = this.state.info;
        var isCompleted = this._isSignupComplete();
        return (
            <div className="SignupForm">
                <Paper zDepth={1} >
                    <img src="https://farm1.staticflickr.com/354/19342635705_4e51838570_z_d.jpg" className="SignupFormCover" />
                    <div className="SignupSlogan" >{"Let's work here"}</div>
                    <TextInput
                        iconClass="fa fa-envelope-o"
                        status={this.state.status.email}
                        handleChange={this._handleChange}
                        value={defaultInfo.email}
                        field={'email'} />
                    <TextInput
                        iconClass="fa fa-child"
                        status={this.state.status.givenName}
                        handleChange={this._handleChange}
                        value={defaultInfo.givenName}
                        field={'givenName'} />
                    <TextInput
                        iconClass="fa fa-home"
                        status={this.state.status.familyName}
                        handleChange={this._handleChange}
                        value={defaultInfo.familyName}
                        field={'familyName'} />
                    <SelectInput 
                        options={['male', 'female']}
                        handleChange={this._handleChange}
                        value={defaultInfo.gender}
                        field={'gender'} />
                    <div><RaisedButton 
                            label="Sign Up Now" 
                            secondary={isCompleted}  
                            disabled={!isCompleted}
                            onClick={this._onSubmit} 
                            style={{'width':'240px'}} />
                    </div>
                    <br/>
                </Paper>
            </div>
        );
    }
});