var React = require('react');
var Router = require('react-router');
var Mui = require('material-ui');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * actions
 */
var ToggleChannelCreator = require('../../../client/actions/toggleChannelCreator');
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
        this.executeAction(ToggleChannelCreator);
        this.setState({
            isErrorShown: false
        });
    },

    _onInputChange: function(value) {
        this.setState({
            isErrorShown: (value !== '' && !SharedUtils.isChannelName(value))
        });
    },

    _onInputSubmit: function(value) {
        this.executeAction(ToggleChannelCreator);
        if (value === '' || !SharedUtils.isChannelName(value)) {
            return this.refs.channelCreator.clearValue();
        }
        this.refs.channelCreator.clearValue();
        this.executeAction(CreateChannel, {
            name: value,
            urlNavigator: this.transitionTo
        });
    },

    _onIconClick: function() {
        this.executeAction(ToggleChannelCreator);
    },

    render: function() {
        var isErrorShown = this.state.isErrorShown;
        return (
            <div className={this.props.containerClass} style={this.props.containerStyle} >
                <FormButton 
                    ref="channelCreator"
                    isActived={this.props.isActived}
                    hasInput
                    width={250}
                    colorType="green"
                    defaultIconClass="fa fa-plus"
                    submitIconClass={isErrorShown ? 'fa fa-exclamation-triangle' : 'fa fa-arrow-right'}
                    hintText="the channel name ... "
                    label="CREATE CHANNEL" 
                    defaultIconHandler={this._onIconClick}
                    onChangeHandler={this._onInputChange}
                    submitHandler={this._onInputSubmit}
                    onBlurHandler={this._onInputBlur}/>
                <Tooltip 
                    show={this.state.isErrorShown}
                    verticalPosition="bottom" 
                    horizontalPosition="right" 
                    touch
                    label={'not support special characters, e.g. !@#$%^&*()'} />
            </div>
        )
    }
});
