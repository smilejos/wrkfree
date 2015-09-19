var React = require('react');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * material ui components
 */
var Mui = require('material-ui');
var Avatar = Mui.Avatar;
var Colors = Mui.Styles.Colors;
var IconButton = Mui.IconButton;
var FontIcon = Mui.FontIcon;
var List = Mui.List;
var ListItem = Mui.ListItem;
var ListDivider = Mui.ListDivider;
var TextField = Mui.TextField;
var FlatButton = Mui.FlatButton;

/**
 * actions
 */
var AddMembers = require('../../client/actions/channel/addMembers');
var ToggleInvitation = require('../../client/actions/channel/toggleInvitation');
var SearchForInvitation = require('../../client/actions/channel/searchForInvitation');
var UpdateInvitationTarget  = require('../../client/actions/channel/updateInvitationTarget');

/**
 * stores
 */
var ChannelInvitationStore = require('../stores/ChannelInvitationStore');

/**
 * child components
 */
var Pill = require('./common/Pill.jsx');

/**
 * @Author: George_Chen
 * @Description: this component is used for channel host to invite members
 * 
 * @param {String}       this.props.channelId, the current channel id
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [ChannelInvitationStore]
        }
    },

    _onStoreChange: function() {
        var state = this._getStoreState();
        if (!state.isActive) {
            this.refs.input.clearValue();
        }
        this.setState(state);
    },

    _getStoreState: function() {
        return this.getStore(ChannelInvitationStore).getState();
    },

    /**
     * @Author: George_Chen
     * @Description: handle text field input change
     */
    _onInputChange: function(e) {
        var value = e.target.value;
        this.executeAction(SearchForInvitation, {
            query: value
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for "cancel" button
     */
    _handleCancel: function() {
        this.executeAction(ToggleInvitation, {
            isActive: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for "confirm" button
     */
    _handleConfirm: function() {
        var targets = this.state.targets;
        var memberUids = SharedUtils.fastArrayMap(targets, function(info) {
            return info.uid;
        });
        if (memberUids.length > 0) {
            this.executeAction(AddMembers, {
                channelId: this.props.channelId,
                members: memberUids
            });
        }
    },

    /**
     * @Author: George_Chen
     * @Description: used for channel host to add user to target list
     */
    _addTarget: function(targetInfo) {
        this.executeAction(UpdateInvitationTarget, {
            isAdded: true,
            target: targetInfo
        });
    },

    /**
     * @Author: George_Chen
     * @Description: used for channel host to remove user from target list
     */
    _removeTarget: function(targetUid) {
        var targets = this.state.targets;
        for (var i=0; i <= targets.length -1; ++i) {
            if (targets[i].uid === targetUid) {
                this.executeAction(UpdateInvitationTarget, {
                    isAdded: false,
                    target: targets[i]
                });
            }
        }
    },

    /**
     * @Author: George_Chen
     * @Description: set the search input tips
     */
    _setInputTips: function() {
        var containerStyle = {
            padding: '0px 10px 0px 20px',
            fontWeight: 300,
            fontSize: 14,
            color: Colors.grey500,
            lineHeight: '20px'
        };
        return (
            <div style={containerStyle}>
                {'Try to search for a person by name or email address.'}
            </div>
        );
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    componentWillReceiveProps: function(nextProps) {
        if (this.props.channelId !== nextProps.channelId) {
            this.executeAction(ToggleInvitation, {
                isActive: false
            });
        }
    },

    render: function() {
        var self = this;
        var isActive = this.state.isActive;
        var iniviteContainer = {
            position: 'absolute',
            bottom: 40,
            right: (isActive ? 10 : -300),
            width: 250,
            border: 'solid 1px',
            borderColor: Colors.grey300,
            overflow: 'hidden',
            transition: '0.5s'
        };
        var nameStyle = {
            overflow: 'hidden', 
            fontSize: 12,
            fontWeight: 300
        };
        var results = SharedUtils.fastArrayMap(this.state.results, function(info) {
            return (
                <div>
                    <ListItem key={info.uid}
                        disabled
                        primaryText={<div style={nameStyle}>{info.nickName}</div>}  
                        leftAvatar={<Avatar src={info.avatar} />}
                        rightIconButton={
                            <IconButton iconStyle={{color: Colors.red500}}
                                onTouchTap={self._addTarget.bind(self, info)}
                                tooltipPosition="top-left"
                                tooltip="add to member"
                                tooltipStyles={{top: 5}}
                                iconClassName="material-icons" >
                                {'group_add'}
                            </IconButton>
                        } />
                    <ListDivider inset />
                </div>
            );
        });
        var targets = SharedUtils.fastArrayMap(this.state.targets, function(targetInfo) {
            return (
                <Pill key={targetInfo.uid}
                    removeHandler={self._removeTarget}
                    pId={targetInfo.uid}
                    label={targetInfo.nickName} />
            );
        });
        return (
            <div className="baseFonts" style={iniviteContainer}>
                <List style={{marginTop: 1, height: 70}}>
                    <ListItem disabled 
                        secondaryText={
                            <div style={{position: 'absolute', top: -15, left: 55, height: 70}}>
                                <TextField 
                                    ref="input"
                                    style={{fontSize: 14}}
                                    onChange={this._onInputChange}
                                    floatingLabelText="Add Members"
                                    hintText="new member's name"  />
                            </div>
                        }
                        leftIcon={<FontIcon color={Colors.green500} className="material-icons">{'group_add'}</FontIcon>}/>
                </List>
                <ListDivider />
                <List style={{height: results.length > 0 ? 130 : 60, overflowY: 'auto'}}>
                    {results.length > 0 ? results : this._setInputTips()}
                </List>
                <List style={{textAlign: 'center'}}>
                    <div> {targets} </div>
                    <FlatButton label="cancel" 
                        onTouchTap={this._handleCancel}/>
                    <FlatButton secondary 
                        label="confirm" 
                        onTouchTap={this._handleConfirm}/>
                </List>
            </div>
        );
    }
});
