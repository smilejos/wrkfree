var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * material-ui components
 */
var Mui = require('material-ui');
var Avatar = Mui.Avatar;
var Card = Mui.Card;
var CardHeader = Mui.CardHeader;
var CardActions = Mui.CardActions;
var FontIcon = Mui.FontIcon;
var FlatButton = Mui.FlatButton;
var ListItem = Mui.ListItem;
var Colors = Mui.Styles.Colors;

/**
 * @Author: George_Chen
 * @Description: a tour guide video content, used to demo functionality of wrkfree
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    getInitialState: function() {
        return {
            isShown: false,
            videoUrl: ''
        };
    },

    /**
     * @Author: George_Chen
     * @Description: to play the tour demo video
     *
     * @param {String}      url, the video url
     */
    _playVideo: function(url) {
        this.setState({
            isShown: true,
            videoUrl: url
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to close the tour demo video
     */
    _closeVideo: function() {
        this.setState({
            isShown: false,
            videoUrl: ''
        });
    },

    render: function() {
        var containerStyle = {
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 10
        };
        var contentStyle = {
            position: 'absolute', 
            top: '15%', 
            left: '50%', 
            marginLeft: -400, 
            width: 800
        };
        return (
            <div className="mainBox" style={containerStyle}>
                <div onClick={this._onContentClick} >
                    <div style={contentStyle}>
                        <Card initiallyExpanded={true}>
                            <CardHeader
                                title={<div style={{marginTop: 12, fontSize: 18}}>{'Hi, Welcome to Wrkfree'}</div>}
                                avatar={<Avatar src="/assets/imgs/logo.svg" />} >
                            </CardHeader>
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://video-tpe1-1.xx.fbcdn.net/hvideo-xft1/v/t42.1790-2/12022655_1609144906003815_589802763_n.mp4?efg=eyJybHIiOjMwMCwicmxhIjo1MTJ9&rl=300&vabr=12&oh=fe9a36bccb8445e2185b673cd286d5b3&oe=55F47A23')}
                                index={1}
                                label={'Create your own channel'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://fbcdn-video-b-a.akamaihd.net/hvideo-ak-xpt1/v/t42.1790-2/12018081_1609144792670493_555658850_n.mp4?efg=eyJybHIiOjMwMCwicmxhIjo1MTJ9&rl=300&vabr=14&oh=c8d34273a24cba8e1968dfb707f7438f&oe=55F4691E&__gda__=1442085584_ae9325cbec903574722ad3fc1f4deade')}
                                index={2}
                                label={'Join a channel or make a friend'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://video-tpe1-1.xx.fbcdn.net/hvideo-xpf1/v/t42.1790-2/11996052_1609143996003906_137450137_n.mp4?efg=eyJybHIiOjMwMCwicmxhIjo1MTJ9&rl=300&vabr=22&oh=955086f08229d9aa0ec5a6afca1ac6a5&oe=55F47026')}
                                index={3}
                                label={'Check the status of your favoriates channels, notifications and friends'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://fbcdn-video-k-a.akamaihd.net/hvideo-ak-xaf1/v/t42.1790-2/11987423_1609141022670870_511776106_n.mp4?efg=eyJybHIiOjMwMCwicmxhIjo1MTJ9&rl=300&vabr=20&oh=94cfcaca1eba14252c9ed4ffe8b4287c&oe=55F45EE6&__gda__=1442082884_2daed122f5bf2c236dbc66fadf5e667d')}
                                index={4}
                                label={'Start a simple work on workspace'} />
                            <TourTopic enable
                                index={5}
                                clickHandler={this._playVideo.bind(this, 'https://video-tpe1-1.xx.fbcdn.net/hvideo-xat1/v/t42.1790-2/12009159_1609134352671537_1078639230_n.mp4?efg=eyJybHIiOjMwMCwicmxhIjo1MTJ9&rl=300&vabr=26&oh=45596b84a5f85e0ca6a364230cfc6fdd&oe=55F47011')}
                                label={'Work on multiple channels'} />                                
                            <TourTopic enable={false}
                                index={6}
                                label={'Enjoy it !'} />
                            <CardActions>
                                <FlatButton secondary label="Close tour guide"/>
                                <FlatButton primary label="Do not show again"/>
                            </CardActions>
                        </Card>
                        <div style={{position: 'absolute', bottom: 0, right: 0}}>
                            <img width="200" src="https://farm1.staticflickr.com/669/21182788330_406756e414_m_d.jpg" />
                        </div>
                        <TourVideo src={this.state.videoUrl}
                            closeHandler={this._closeVideo}
                            isShown={this.state.isShown} />
                    </div>
                </div>
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: the tour topic item component
 *
 * @param {Number}      this.props.index, the index of current topic
 * @param {String}      this.props.label, the topic label content
 * @param {Function}    this.props.clickHandler, handler for topic is clicked
 * @param {Boolean}     this.props.enable, to inform this topic is enabled or not
 */
var TourTopic = React.createClass({
    _onClick: function() {
        var clickHandler = this.props.clickHandler;
        if (clickHandler) {
            clickHandler();
        }
    },

    render: function() {
        return (
            <ListItem 
                disabled={!this.props.enable}
                onClick={this._onClick}
                leftAvatar={<Avatar size={30}>{this.props.index}</Avatar>}
                secondaryText={this.props.label} />
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: the tour topic demo video
 *
 * @param {String}      this.props.src, the tour video url
 * @param {Function}    this.props.closeHandler, handler for video is closed
 * @param {Boolean}     this.props.isShown, to inform this video is shown or not
 */
var TourVideo = React.createClass({
    _onClose: function() {
        var closeHandler = this.props.closeHandler;
        if (this.props.closeHandler && this.props.isShown) {
            closeHandler();
        }
    },

    componentDidUpdate: function() {
        var content = React.findDOMNode(this.refs.content);
        content.play();
    },

    render: function() {
        var isShown = this.props.isShown;
        var containerStyle = {
            position: 'absolute', 
            transition: '0.5s',
            opacity: isShown ? 1 : 0,
            visibility: isShown ? 'visible' : 'hidden',
            top: -50,
            right: -10,
            zIndex: 2,
            border: 'solid 10px #fff',
            boxShadow: '-1px 2px 2px rgba(0,0,0, .1), 2px 6px 12px rgba(0,0,0, .1)'
        };
        var closeContainerStyle = {
            position: 'absolute',
            top: -15,
            right: -15,
            cursor: 'pointer'
        };
        return (
            <div style={containerStyle}>
                <Avatar 
                    color="#000"
                    backgroundColor="#FFF"
                    size={25}
                    onClick={this._onClose}
                    icon={<FontIcon style={{fontSize: 12}} className="fa fa-times" />}
                    style={closeContainerStyle} />
                <video ref="content"
                    width="400" 
                    src={this.props.src} />
            </div>
        );
    }
});
