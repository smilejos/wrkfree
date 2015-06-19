var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;

/**
 * actions
 */
var CloseToastEvent = require('../../client/actions/closeToastEvent');

/**
 * stores
 */
var EventToasterStore = require('../stores/EventToasterStore');

/**
 * icons style of toast events
 */
var EventIcons = {
    success: 'fa fa-2x fa-check-circle',
    info: 'fa fa-2x fa-info-circle',
    warning: 'fa fa-2x fa-exclamation-circle',
    error: 'fa fa-2x fa-bug',
    close: 'fa fa-2x fa-times'
};

var BOTTOM_HEIGHT = 50;
var EVENT_HEIGHT = 90;

/**
 * the container component of toast events
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [EventToasterStore]
        }
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    _getStoreState: function() {
        return this.getStore(EventToasterStore).getState();
    },

    _onStoreChange: function() {
        var state = this._getStoreState();
        this.setState(state);
    },

    render: function(){
        var events = this.state.eventList;
        var eventIds = Object.keys(this.state.eventList).sort();
        var eventMessages = SharedUtils.fastArrayMap(eventIds, function(id, index){
            return (
                <EventMessage 
                    key={'event'+id}
                    eventId={id}
                    type={events[id].type}
                    title={events[id].title}
                    message={events[id].message}
                    actionLabel={events[id].actionLabel}
                    actionHandler={events[id].actionHandler}
                    bottomHeight={BOTTOM_HEIGHT + index * EVENT_HEIGHT } />
            );
        });
        return (
            <div className="EventToaster">
                {eventMessages}
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: a event message component
 *         NOTE: actionLabel and actionHandler is optional
 *         
 * @param {String}      this.props.eventId, the event id
 * @param {String}      this.props.type, the type of event
 * @param {String}      this.props.title, the event message title
 * @param {String}      this.props.message, the event message
 * @param {String}      this.props.actionLabel, the label of extra-action
 * @param {Function}    this.props.actionHandler, the handler of extra-action
 */
var EventMessage = React.createClass({
    mixins: [FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: to get the view of event action
     */
    _getEventAction: function() {
        var fn = this.props.actionHandler;
        var label = this.props.actionLabel;
        if (!SharedUtils.isString(label) || !SharedUtils.isFunction(fn)) {
            return '';
        }
        return (
            <IconButton 
                iconClassName="fa fa-angle-double-right"
                onClick={fn}
                tooltip={label} />
        );
    },

    /**
     * @Author: George_Chen
     * @Description: set the close icon style when mouse over
     */
    _onMouseIconOver: function() {
        this.setState({
            iconStyle: EventIcons.close
        });
    },

    /**
     * @Author: George_Chen
     * @Description: restore the original icon style when mouse out
     */
    _onMouseIconOut: function() {
        this.setState({
            iconStyle: EventIcons[this.props.type]
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler when user close event
     */
    _onClose: function() {
        this.executeAction(CloseToastEvent, {
            eventId: this.props.eventId
        });
    },

    getInitialState: function() {
        return {
            iconStyle: EventIcons[this.props.type]
        };
    },

    render:function() {
        var eventClass = 'event event-' + this.props.type;
        var eventStyle = {
            'bottom': this.props.bottomHeight
        };
        var eventIcon = this.state[this.props.type]
        return (
            <div className={eventClass} style={eventStyle}>
                <div className="event-icon"
                    onMouseOver={this._onMouseIconOver}
                    onMouseOut={this._onMouseIconOut} >
                    <i className={this.state.iconStyle} 
                        onClick={this._onClose} />
                </div>
                <div className="event-content">
                    <div className="event-content-title"> {this.props.title} </div>
                    <div className="event-content-message"> {this.props.message} </div>
                </div>
                <div className="event-action">
                    {this._getEventAction()}
                </div>
            </div>
        );
    }
});
