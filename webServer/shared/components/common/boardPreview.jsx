var React = require('react');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin'); 


/**
 * Material-ui circle progress
 */
var CircularProgress = require('material-ui').CircularProgress;

/**
 * stores
 */
var PreviewStore = require('../../stores/PreviewStore');


/**
 * @Author: George_Chen
 * @Description: for rendering drawing board image preview
 *
 * @param {String}      this.props.channelId, channel's id
 * @param {Object}      this.props.previewClass, the className for preview container (optional)
 * @param {Object}      this.props.imgClass, the className for preview image (optional)
 * @param {Object}      this.props.imgStyle, the inline style for preview image (optional)
 * @param {Boolean}     this.props.isGrid, indicate current preview is grid or not
 * @param {Function}    this.props.clickHandler, for handling preview is clicked
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            '_onStoreChange': [PreviewStore]
        }
    },

    /**
     * @Author: George_Chen
     * @Description: get the board preview state from PreviewStore
     */
    _getPreviewState: function() {
        var cid = this.props.channelId;
        var bid = this.props.boardId;
        var store = this.getStore(PreviewStore);
        return (bid ? store.getByBoard(cid, bid) : store.getByChannel(cid));
    },

    _onStoreChange: function() {
        var nextState = this._getPreviewState();
        var currState = this.state;
        // only set state when remoteUpdatedTime has been updated
        if (nextState && nextState.remoteUpdatedTime > currState.remoteUpdatedTime) {
            nextState.isLoading = true;
            this.setState(nextState);
        }
    },

    getInitialState: function() {
        return {
            remoteUpdatedTime: Date.now(),
            isLoading: true
        };
    },

    /**
     * @Author: George_Chen
     * @Description: get the preview url of current channel or channel board
     */
    _getPreviewUrl: function() {
        var time = this.state.remoteUpdatedTime;
        var url = '/app/workspace/'+this.props.channelId+'/preview';
        if (this.props.boardId) {
            url = url + '?board=' + this.props.boardId + '&' + time;
        } else {
            url = url + '?' + time;
        }
        return url;
    },

    componentDidMount: function() {
        var previewImg = React.findDOMNode(this.refs.imgElement);
        var self = this;
        // set image onload handler, if image 
        previewImg.onload = function(){
            // TODO: 
            // this setTimeout is just for show progress bar
            // we should remove it later
            setTimeout(function(){
                self.setState({
                    isLoading: false
                });
            }, 1500);
        };
    },

    /**
     * @Author: George_Chen
     * @Description: for setting loading progress component
     *         NOTE: currently we set the style based on css located at _channel.scss
     *         TODO: need a way to remove this dependency
     */
    _getLoadingProgress: function() {
        var isGrid = this.props.isGrid;
        var progressStyle = {
            position: 'absolute',
            top: (isGrid ? 60 : 10),
            left: (isGrid ? 90 : 30),
            zIndex: 3,
            opacity: (this.state.isLoading ? 1 : 0)
        };
        return (
            <div style={progressStyle}>
                <CircularProgress size={isGrid ? 0.8 : 0.4}/>
            </div>
        );
    },

    render: function() {
        var previewClass = (this.props.previewClass ? this.props.previewClass : '');
        var imgClass = (this.props.imgClass ? this.props.imgClass : '');
        var imgUrl = this._getPreviewUrl();
        var imgStyle = (this.props.imgStyle ? this.props.imgStyle : {});
        // when image is loading, hiding the outdated image
        imgStyle.opacity = (this.state.isLoading ? 0 : 1);
        return (
            <div className={previewClass} onClick={this.props.clickHandler} >
                {this._getLoadingProgress()}
                <img ref="imgElement" className={imgClass} src={imgUrl} style={imgStyle}/>
            </div>
        );
    }
});
