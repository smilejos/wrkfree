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
 * store
 */
var TourGuideStore = require('../stores/TourGuideStore');

/**
 * actions
 */
var GetDefaultTourState = require('../../client/actions/getDefaultTourState');
var SetTourState = require('../../client/actions/setTourState');
var HideDefaultTour = require('../../client/actions/hideDefaultTour');

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
            videoUrl: ''
        };
    },

    componentDidMount: function() {
        if (this.props.inDashboard || this.props.inWorkspace) {
            this.executeAction(GetDefaultTourState);
        }
    },

    render: function() {
        var isShown = this.state.isShown;
        var isDefaultHidden = this.state.isDefaultHidden;
        var containerStyle = {
            position: 'fixed',
            width: '100%',
            height: '100%',
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: isShown ? 10 : -1,
            transition: '0.3s'
        };
        var contentStyle = {
            position: 'absolute', 
            top: isShown ? '15%' : '-15%', 
            left: isShown ? '50%' : '125%', 
            opacity: isShown ? 1 : 0,
            marginLeft: -400, 
            width: isShown ? 800 : 50,
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
                                clickHandler={this._playVideo.bind(this, 'https://ci-20758412784-df8a4d03.http.atlas.cdn.yimg.com/flickr4/132356020@N07/20758412784/20758412784_451d221ede.mp4?dt=flickr&x=1442750905&fn=20758412784.mp4&bt=0&a=flickr&d=cp_d%3Dwww.flickr.com%26cp_t%3Ds%26cp%3D792600246%26mid%3D20758412784%26ufn%3D20758412784.mp4&s=957120c3d789879150610887513e51d1')}
                                index={1}
                                label={'Create your own channel'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://ci-21193244948-df8a4d03.http.atlas.cdn.yimg.com/flickr4/132356020@N07/21193244948/21193244948_4fe0603709.mp4?dt=flickr&x=1442751332&fn=21193244948.mp4&bt=0&a=flickr&d=cp_d%3Dwww.flickr.com%26cp_t%3Ds%26cp%3D792600246%26mid%3D21193244948%26ufn%3D21193244948.mp4&s=a96395aaf57ae25c4c90351add32cdf3')}
                                index={2}
                                label={'Join a channel or make a friend'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://ci-21354863456-df8a4d03.http.atlas.cdn.yimg.com/flickr4/132356020@N07/21354863456/21354863456_5dafa702fe.mp4?dt=flickr&x=1442751407&fn=21354863456.mp4&bt=0&a=flickr&d=cp_d%3Dwww.flickr.com%26cp_t%3Ds%26cp%3D792600246%26mid%3D21354863456%26ufn%3D21354863456.mp4&s=d95ef70255251d3127daa0258335a4a7')}
                                index={3}
                                label={'Check the status of your favoriates channels, notifications and friends'} />
                            <TourTopic enable
                                clickHandler={this._playVideo.bind(this, 'https://ci-21192997740-df8a4d03.http.atlas.cdn.yimg.com/flickr5/132356020@N07/21192997740/21192997740_289485dbe4.mp4?dt=flickr&x=1442751374&fn=21192997740.mp4&bt=0&a=flickr&d=cp_d%3Dwww.flickr.com%26cp_t%3Ds%26cp%3D792600246%26mid%3D21192997740%26ufn%3D21192997740.mp4&s=4578adf4041cc3adf740828f9f63e47a')}
                                index={4}
                                label={'Start a simple work on workspace'} />
                            <TourTopic enable
                                index={5}
                                clickHandler={this._playVideo.bind(this, 'https://ci-21381110085-df8a4d03.http.atlas.cdn.yimg.com/flickr4/132356020@N07/21381110085/21381110085_7f5ed177df.mp4?dt=flickr&x=1442751251&fn=21381110085.mp4&bt=0&a=flickr&d=cp_d%3Dwww.flickr.com%26cp_t%3Ds%26cp%3D792600246%26mid%3D21381110085%26ufn%3D21381110085.mp4&s=0d6983ad1215fccaec842adf392f5b3c')}
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
