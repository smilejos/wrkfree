var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin');

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
 * store
 */
var TourGuideStore = require('../stores/TourGuideStore');

/**
 * actions
 */
var GetDefaultTourState = require('../../client/actions/getDefaultTourState');
var SetTourState = require('../../client/actions/setTourState');
var HideDefaultTour = require('../../client/actions/hideDefaultTour');


var MAX_GUIDE_WIDTH = 800;
var MINI_GUID_WIDTH = 550;
var ResizeTimeout = null;

/**
 * @Author: George_Chen
 * @Description: a tour guide video content, used to demo functionality of wrkfree
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            '_onStoreChange': [TourGuideStore]
        }
    },

    _getStoreState: function() {
        return this.getStore(TourGuideStore).getState();
    },

    _onStoreChange: function() {
        var storeState = this._getStoreState();
        if (!storeState.isShown) {
            storeState.isVideoShown = false;
            storeState.videoUrl = '';
        }
        this.setState(storeState);
    },

    /**
     * @Author: George_Chen
     * @Description: to play the tour demo video
     *
     * @param {String}      url, the video url
     */
    _playVideo: function(url) {
        this.setState({
            isVideoShown: true,
            videoUrl: url
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to close the tour demo video
     */
    _closeVideo: function() {
        this.setState({
            isVideoShown: false,
            videoUrl: ''
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for hidding tourguide 
     */
    _hideTour: function(toUpdateDefaultState) {
        if (!toUpdateDefaultState) {
            return this.executeAction(SetTourState, {
                isShown: false
            });
        }
        this.executeAction(HideDefaultTour);
    },

    getInitialState: function() {
        var storeState = this._getStoreState();
        return {
            isShown: storeState.isShown,
            isDefaultHidden: storeState.isDefaultHidden,
            isVideoShown: false,
            videoUrl: '',
            contentWidth: 0,
            videoWidth: 0
        };
    },

    componentDidMount: function() {
        var self = this;
        if (this.props.inDashboard || this.props.inWorkspace) {
            this.executeAction(GetDefaultTourState);
        }
        self._resize();
        window.addEventListener('resize', function(e) {
            if (ResizeTimeout) {
                clearTimeout(ResizeTimeout);
            }
            ResizeTimeout = setTimeout(function() {
                self._resize();
            }, 300);
        });
    },

    /**
     * @Author: George_Chen
     * @Description: resize the current tourguide container
     */
    _resize: function() {
        var width = window.innerWidth;
        var vWidth;
        if (window.innerWidth > MAX_GUIDE_WIDTH) {
            width = MAX_GUIDE_WIDTH;
            vWidth = MAX_GUIDE_WIDTH;
        } else if (window.innerWidth <= MINI_GUID_WIDTH) {
            width = MINI_GUID_WIDTH;
            vWidth = window.innerWidth;
        }
        this.setState({
            contentWidth: width * 0.97,
            videoWidth: vWidth
        });
    },

    render: function() {
        var contentWidth = this.state.contentWidth;
        var isShown = this.state.isShown;
        var isDefaultHidden = this.state.isDefaultHidden;
        var containerStyle = {
            position: 'fixed',
            width: '100%',
            height: '100%',
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: isShown ? 10 : -1,
            transition: '0.3s',
            overflow: 'auto'
        };
        var contentStyle = {
            position: 'absolute', 
            top: isShown ? '15%' : '-15%', 
            left: isShown ? '50%' : '125%', 
            opacity: isShown ? 1 : 0,
            marginLeft: -(contentWidth / 2 ), 
            width: isShown ? contentWidth : 50,
            transition: '0.5s'
        };
        return (
            <div style={containerStyle}>
                <div onClick={this._onContentClick} >
                    <div style={contentStyle}>
                        <Card initiallyExpanded={true}>
                            <CardHeader
                                title={<div style={{marginTop: 12, fontSize: 18}}>{'Hi, Welcome to Wrkfree ! Need some tips ?'}</div>}
                                avatar={<Avatar src="/assets/imgs/logo.svg" />} >
                            </CardHeader>
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://s3-ap-southeast-1.amazonaws.com/wrkfree/video/new_channel720p.mp4')}
                                index={1}
                                label={'Create your own channel'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://s3-ap-southeast-1.amazonaws.com/wrkfree/video/searching_720p.mp4')}
                                index={2}
                                label={'Join a channel or make a friend'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://s3-ap-southeast-1.amazonaws.com/wrkfree/video/status_720p.mp4')}
                                index={3}
                                label={'Check the status of your favoriate channels, notifications and friends'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://s3-ap-southeast-1.amazonaws.com/wrkfree/video/start_work_720p.mp4')}
                                index={4}
                                label={'Start a simple work on workspace'} />
                            <TourTopic enable
                                index={5}
                                clickHandler={this._playVideo.bind(this, 'https://s3-ap-southeast-1.amazonaws.com/wrkfree/video/multi_channels_720p.mp4')}
                                label={'Work on multiple channels'} />                                
                            <TourTopic enable={false}
                                index={6}
                                label={'Enjoy it !'} />
                            <CardActions>
                                <FlatButton secondary 
                                    onTouchTap={this._hideTour.bind(this, false)}
                                    label="Hide tour guide"/>
                                {isDefaultHidden ? <div/> : <FlatButton primary onTouchTap={this._hideTour.bind(this, true)} label="Do not show on login"/>}
                            </CardActions>
                        </Card>
                        <div style={{position: 'absolute', bottom: 0, right: 0}}>
                            <img width="200" src="https://farm1.staticflickr.com/669/21182788330_e8d6d50b37_o_d.png" />
                        </div>
                        <TourVideo src={this.state.videoUrl}
                            width={this.state.videoWidth}
                            closeHandler={this._closeVideo}
                            isShown={this.state.isVideoShown} />
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

    _onVideoContextMenu: function(e) {
        e.preventDefault();
    },

    render: function() {
        var isShown = this.props.isShown;
        var containerStyle = {
            position: 'absolute', 
            transition: '0.5s',
            opacity: isShown ? 1 : 0,
            visibility: isShown ? 'visible' : 'hidden',
            top: 0,
            left: 0,
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
                    onContextMenu={this._onVideoContextMenu}
                    width={this.props.width} 
                    src={this.props.src} />
            </div>
        );
    }
});
