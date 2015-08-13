var React = require('react');
var Router = require('react-router');
var Mui = require('material-ui');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
 
/**
 * material-ui components
 */
var Card = Mui.Card;
var CardText = Mui.CardText;
var CardTitle = Mui.CardTitle;
var FlatButton = Mui.FlatButton;
var Colors = Mui.Styles.Colors;

/**
 * pre-defined error content
 */
var ErrorContent = {
    '404': {
        title: 'PAGE NOT FOUND',
        explaination: 'The Page You are asking is not found here !'
    },
    '403': {
        title: 'PAGE REQUEST IS FORBIDDEN',
        explaination: 'You have no permission to enter this page !'
    },
    '503': {
        title: 'CONNECTION LOST',
        explaination: 'The connection between you and server is currently Lost !'
    }
}

/**
 * @Author: George_Chen
 * @Description: the main error page component
 */
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: navigate to "/app/dashboard"
     */
    _toDashboard: function() {
        this.transitionTo('/app/dashboard');
    },

    /**
     * @Author: George_Chen
     * @Description: to get the human readable error content
     */
    _getErrorContent: function() {
        var query = this.props.query;
        var content = ErrorContent[query.status];
        if (ErrorContent[query.status]) {
            return {
                title: content.title,
                explaination: (query.explaination ? query.explaination : content.explaination)
            };
        }
        return {
            title: 'UNEXPECTED ERROR !',
            explaination: 'You are encounter a unexpected error, please contact us !'
        };
    },

    render: function(){
        var containerWidth = 650;
        var containerStyle = {
            position: 'absolute',
            width: containerWidth,
            left: '50%',
            top: 'calc(50% - 120px)',
            marginLeft: (-1/2 * containerWidth)
        };
        var errorContent = this._getErrorContent();
        return (
            <div style={containerStyle}>
                <Card initiallyExpanded={true}>
                    <CardTitle title="Oops !" subtitle={errorContent.title} subtitleColor={Colors.red500} showExpandableButton={true}/>
                    <CardText expandable={true} style={{fontSize: 15}}>
                        <p>
                            <span style={{fontWeight: 500}}> {'NOTE:'} </span>
                            <span style={{fontWeight: 300, color: Colors.grey600}}> {errorContent.explaination} </span>
                        </p>
                    </CardText>
                    <FlatButton secondary label="Dashboard" onClick={this._toDashboard}/>
                </Card>
            </div>
        );
    }
});
