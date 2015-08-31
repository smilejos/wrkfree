var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * actions
 */
var ClientReportAction = require('../../client/actions/clientReport');

/**
 * components
 */
var FormButton = require('./common/formButton.jsx');

/**
 * @Author: George_Chen
 * @Description: lightweight input button for sending the client's opinion to us
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    getInitialState: function() {
        return {
            isActived: false,
            isHover: false
        };
    },

    _toggleInut: function(state) {
        this.setState({
            isActived: state
        });
    },

    _submitReport: function(value) {
        if (value !== '') {
            this.executeAction(ClientReportAction, {
                message: value
            });
        }
        this._onBlur();
    },

    _onBlur: function() {
        this.setState({
            isActived: false
        });
    },

    render: function() {
        var isActived = this.state.isActived;
        var inWorkspace = this.props.inWorkspace;
        var containerStyle = {
            bottom: (inWorkspace ? 45 : 10),
            left: 10,
            position: 'fixed',
            zIndex: 2,
            opacity: 0.8
        };
        var inputHint = (isActived ? 'type message ...' : '');
        return (
            <div style={containerStyle} >
                <FormButton 
                    ref="headerSearch"
                    width={200}
                    isActived={isActived}
                    hasInput
                    colorType="red"
                    submitHandler={this._submitReport}
                    onBlurHandler={this._onBlur}
                    defaultIconHandler={this._toggleInut.bind(this, !isActived)}
                    defaultIconClass={isActived ? "fa fa-times" : "fa fa-commenting"}
                    submitIconClass="fa fa-paper-plane-o" 
                    label="share your opinion"
                    hintText={inputHint} />
            </div>
        );
    }
});
