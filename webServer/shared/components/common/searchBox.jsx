var React = require('react');


/**
 * Public API
 * @Author: George_Chen
 * @Description: an input box component for search
 *
 * @param {String}      this.props.placeholder, placeholder info
 */
var SearchBox = React.createClass({
    render: function(){
        return (
            <form className="pure-form SearchBox">
                <input className="pure-input-1 pure-input-rounded" type="text" placeholder={this.props.placeholder}/>
            </form>
        );
    }
});

module.exports = SearchBox;
