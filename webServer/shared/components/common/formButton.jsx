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
 * @param {String}      this.props.label, the form button label text
 * @param {Boolean}     this.props.hasInput, indicate current formbutton has input or not
 * @param {Boolean}     this.props.isFiexedWidth, make formbtuuon with initial fixed width or not
 * @param {Function}    this.props.defaultIconHandler, the default icon click handler
 * @param {Function}    this.props.submitHandler, the submit icon click handler
 * @param {Function}    this.props.onChangeHandler, the form input change handler
 * @param {Function}    this.props.onBlurHandler, the form onBlur handler
 */
module.exports = React.createClass({
    getInitialState: function() {
        return {
            defaultWidth: 35,
            inputWidth: 0,
            inputDisplay: 'none'
        };
    },

    componentDidUpdate: function() {
        var input = React.findDOMNode(this.refs.input);
        if (this.props.isActived) {
            return input.focus();
        }
        input.value= '';
    },

    dismiss: function() {
        if (this.props.onBlurHandler) {
            this.props.onBlurHandler();
        }
    },

    clearValue: function() {
        var input = React.findDOMNode(this.refs.input);
        input.value = '';
        this.dismiss();
    },

    _onKeyDown: function(e) {
        if (e.keyCode === 13) {
            this._onSubmit();
        }
        if (e.keyCode === 27) {
            this.clearValue();
        }
    },

    _onChange: function(e) {
        var value = e.target.value;
        if (this.props.onChangeHandler) {
            this.props.onChangeHandler(value);
        }
    },

    _onContentClick: function() {
        if (this.props.defaultIconHandler) {
            this.props.defaultIconHandler();
        }
        if (this.props.isActived) {
            return this.dismiss();
        }
        var icon = React.findDOMNode(this.refs.defaultIcon);
        var submitIcon = React.findDOMNode(this.refs.submitIcon);
        var input = React.findDOMNode(this.refs.input);
        var width = (this.props.width ? this.props.width : this.state.defaultWidth);
        this.setState({
            inputDisplay: (this.props.hasInput ? 'inline-block' : 'none'),
            inputWidth: width - icon.offsetWidth - submitIcon.offsetWidth
        });
    },

    _onSubmit: function() {
        var input = React.findDOMNode(this.refs.input);
        if (input.value === '') {
            return this.dismiss();
        }
        if (this.props.submitHandler) {
            this.props.submitHandler(input.value);
        }
    },

    _setCounter: function() {
        if (this.props.counts > 0) {
            var counterStyle = {
                position: 'absolute',
                width: 17,
                height: 17,
                top: -2,
                right: -2,
                backgroundColor: '#FF0000',
                fontSize: 9,
                borderRadius: 10,
                textAlign: 'center',
                lineHeight: 1.8,
                zIndex: 2
            };
            return <div style={counterStyle}>{this.props.counts}</div>
        }
        return '';
    },

    render: function() {
        var containerWidth = (this.props.width ? this.props.width : this.state.defaultWidth);
        var isFiexedWidth = this.props.isFiexedWidth;
        var label = this.props.label;
        var isActived = this.props.isActived;
        var containerClass = (isActived ? 'form-button active ' : 'form-button ');
        var containerStyle = {
            position: 'relative',
            width: isActived || isFiexedWidth ? containerWidth : 'auto',
            transition: '0.3s'
        };
        var inputStyle = {
            display: this.state.inputDisplay,
            width: this.state.inputWidth
        };
        var labelStyle = {
            marginLeft: (label ? 5 : 0),
            visibility: (isActived ? 'hidden' : 'visible'),
            transition: '0.2s'
        };
        containerClass += this.props.colorType;
        return (
            <div style={{position: 'relative'}} >
                {this._setCounter()}
                <div className={containerClass} style={containerStyle} >
                    <label htmlFor="name" className="cta" onClick={this._onContentClick} style={{width: containerStyle.width}}>
                        <i ref="defaultIcon" style={{cursor: 'pointer'}} className={'icon '+ this.props.defaultIconClass}></i>
                        <span style={labelStyle}> {label} </span>
                    </label>
                    <div style={{position: 'absolute', top: 0, left: this.state.defaultWidth, visibility: isActived ? 'visible' : 'hidden'}}>
                        <input ref="input" 
                            style={inputStyle} 
                            className="input" 
                            type="text"
                            placeholder={this.props.hintText} 
                            name="name" 
                            onKeyDown={this._onKeyDown}
                            onChange={this._onChange} />
                        <button ref="submitIcon" 
                            onClick={this._onSubmit}
                            style={{paddingRight: 20}} 
                            className="submit" 
                            type="submit" >
                            <i className={this.props.submitIconClass}></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
});
