var React = require('react');


/**
 * @Author: George_Chen
 * @Description: form button componet works like "trello" search icon
 *
 * @param {Number}      this.props.width, the form button width
 * @param {String}      this.props.colorType, the color type of form button (defined in css)
 * @param {String}      this.props.defaultIconClass, the default button icon class
 * @param {String}      this.props.submitIconClass, the submit button icon class
 * @param {String}      this.props.hintText, the form input hint text
 * @param {Function}    this.props.defaultIconHandler, the default icon click handler
 * @param {Function}    this.props.submitHandler, the submit icon click handler
 * @param {Function}    this.props.onChangeHandler, the form input change handler
 * @param {Function}    this.props.onBlurHandler, the form onBlur handler
 */
module.exports = React.createClass({
    getInitialState: function() {
        return {
            isActived: false,
            inputWidth: 0,
            inputDisplay: 'none'
        };
    },

    componentDidUpdate: function() {
        var input = React.findDOMNode(this.refs.input);
        if (this.state.isActived) {
            input.focus();
        }
    },

    _onKeyDown: function(e) {
        var input = React.findDOMNode(this.refs.input);
        if (e.keyCode === 13) {
            this.props.submitHandler(e.target.value);
        }
        if (e.keyCode === 27) {
            input.value = '';
            this._onBlur();
        }
    },

    _labelClick: function() {
        if (this.state.isActived) {
            return;
        }
        var icon = React.findDOMNode(this.refs.defaultIcon);
        var submitIcon = React.findDOMNode(this.refs.submitIcon);
        var input = React.findDOMNode(this.refs.input);
        this.setState({
            isActived: true,
            inputDisplay: 'inline-block',
            inputWidth: this.props.width - icon.offsetWidth - submitIcon.offsetWidth
        });
        if (this.props.defaultIconHandler) {
            this.props.defaultIconHandler();
        }
    },

    _onBlur: function() {
        this.setState({
            isActived: false
        });
        if (this.props.onBlurHandler) {
            this.props.onBlurHandler();
        }
    },

    render: function() {
        var containerWidth = this.props.width;
        var isActived = this.state.isActived;
        var containerClass = (isActived ? 'form-button active ' : 'form-button ');
        var inputStyle = {
            display: this.state.inputDisplay,
            width: this.state.inputWidth
        };
        containerClass += this.props.colorType;
        return (
            <div className={containerClass} style={{width: isActived ? containerWidth : 'auto', position: 'relative'}}>
                <label for="name" className="cta" onClick={this._labelClick}>
                  <i ref="defaultIcon" className={'icon '+ this.props.defaultIconClass}></i>
                </label>
                <div style={{position: 'absolute', top: 0, left: 35}}>
                    <input ref="input" 
                        style={inputStyle} 
                        className="input" 
                        type="text"
                        placeholder={this.props.hintText} 
                        name="name" 
                        onKeyDown={this._onKeyDown}
                        onChange={this.props.onChangeHandler}
                        onBlur={this._onBlur}/>
                    <button ref="submitIcon" 
                        style={{paddingRight: 20}} 
                        className="submit" 
                        type="submit" >
                        <i className={this.props.submitIconClass}></i>
                    </button>
                </div>
            </div>
        );
    }
});
