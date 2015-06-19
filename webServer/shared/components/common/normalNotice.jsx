var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * child components
 */
var NoticeMessage = require('./noticeMessage.jsx');

/**
 * @Author: George_Chen
 * @Description: the normal notice component
 *         
 * @param {Object}      this.props.info, the notice info
 */
module.exports = React.createClass({
    render: function() {
        return (
            <div>
                <NoticeMessage message={''}
                    title={'normal notice'} />
            </div>
        );
    }
});
