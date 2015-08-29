var React = require('react');
var Router = require('react-router');
var Mui = require('material-ui');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * actions
 */
var CreateChannel = require('../../../client/actions/channel/createChannel');

/**
 * material UI compoents
 */
var Tooltip = Mui.Tooltip;

/**
 * component
 */
var FormButton = require('./formButton.jsx');

/**
 * @Author: Jos Tung
 * @Description: this component is channel creator
 *
 * @param {Boolean}       this.state.channelWillCreate, to check creating channel name is valid or not
 * @param {Boolean}       this.state.isActive, indicate that channel nav should open or close
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin, Router.Navigation],

    getInitialState: function() {
        return {
            isErrorShown: false
        };
    },

    _onInputBlur: function() {
        this.setState({
            isErrorShown: false
        });
    },

    _onInputChange: function(e) {
        var value = e.target.value;
        this.setState({
            isErrorShown: (value !== '' && !SharedUtils.isChannelName(e.target.value))
        });
    },

    _onInputSubmit: function(value) {
        if (value === '' || !SharedUtils.isChannelName(value)) {
            return this.refs.channelCreator.clearValue();
        }
        this.refs.channelCreator.clearValue();
        this.executeAction(CreateChannel, {
            name: value,
            urlNavigator: this.transitionTo
        });
    },

    render: function() {
        var isErrorShown = this.state.isErrorShown;
        return (
            <div className={this.props.containerClass} style={this.props.containerStyle} >
                <Tooltip 
                    show={this.state.isErrorShown}
                    verticalPosition="bottom" 
                    horizontalPosition="right" 
                    touch
                    label={'not support special characters, e.g. !@#$%^&*()'} />
                <FormButton 
                    ref="channelCreator"
                    width={250}
                    colorType="green"
                    defaultIconClass="fa fa-plus"
                    submitIconClass={isErrorShown ? 'fa fa-times' : 'fa fa-arrow-right'}
                    hintText="the channel name ... "
                    label="CREATE CHANNEL" 
                    onChangeHandler={this._onInputChange}
                    submitHandler={this._onInputSubmit}
                    onBlurHandler={this._onInputBlur}/>
            </div>
        )
    }
});
