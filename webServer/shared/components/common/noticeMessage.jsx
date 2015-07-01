var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * @Author: George_Chen
 * @Description: the component for rendering the notice messages
 *         
 * @param {String}      this.props.title, the notice title
 * @param {Object}      this.props.date, the date object
 * @param {String}      this.props.message, the notice description message
 * @param {String}      this.props.emphasis, the notice emphasis word
 */
module.exports = React.createClass({
    getInitialState: function() {
        return {
            isTimeVisible: true
        };
    },

    _markReaded: function() {
        // TODO: 
        // mark notification as readed and not shown on notification window
    },

    render: function() {
        var isTimeVisible = this.props.isTimeVisible;
        var timeClass = (isTimeVisible ? 'show' : 'hide');
        var closeIconClass = (isTimeVisible ? 'hide' : 'show');
        return (
            <div className="NoticeMessage" >
                <div className="title"> {this.props.title} </div>
                <div className="time" >
                    <span className={timeClass} >
                        {this.props.date.toLocaleDateString()}
                        &nbsp;
                        &nbsp;
                        {this.props.date.getHours() + ':' + this.props.date.getMinutes()}
                    </span>
                    <span className={closeIconClass} >
                        <span onClick={this._markReaded}
                            style={{'cursor':'pointer'}}
                            className="fa fa-times fa-lg" />
                    </span>
                </div>
                <div className="description">
                    {this.props.message}
                    <span className="emphasis"> {this.props.emphasis} </span>
                </div>
            </div>
        );
    }
});
