var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');
var PersonalStore = require('../../stores/PersonalStore');

var Mui = require('material-ui');
var FontIcon = Mui.FontIcon;
var Menu = require('material-ui/lib/menus/menu');
var MenuItem = require('material-ui/lib/menus/menu-item');
var MenuDivider = require('material-ui/lib/menus/menu-divider');


/**
 * actions
 */
var TogglePersonalInfo = require('../../../client/actions/togglePersonalInfo');
var SetTourState = require('../../../client/actions/setTourState');

/**
 * @Author: Jos Tung
 * @Description: this component is personalInfo component
 *               most of items is unable in this time.
 *
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [PersonalStore]
        }
    },

    getInitialState: function() {
        return this.getStore(PersonalStore).getState();
    },

    onStoreChange: function(){
        var state = this.getStore(PersonalStore).getState();
        this.setState(state);
    },

    _onLogoutClick: function(){
        location.assign('/app/logout');
    },

    _onHelpClick: function() {
        var context = window.context;
        return context.executeAction(TogglePersonalInfo)
            .then(function(){
                context.executeAction(SetTourState, {
                    isShown: true
                });
            });
    },
    
    _getFontIcon: function(iconName) {
        return (
            <FontIcon className="material-icons">{iconName}</FontIcon>
        );
    },

    render: function() {
        var homeIcon = this._getFontIcon('home');
        var logoutIcon = this._getFontIcon('directions_run');
        var profileIcon = this._getFontIcon('account_box');
        var settingsIcon = this._getFontIcon('settings');
        var helpIcon = this._getFontIcon('help');

        return (
            <div className={ this.state.isActive ? "PersonalInfo PersonalInfoShow" : "PersonalInfo"} >
                <Menu desktop={true} width={140}>
                    <MenuItem primaryText="My Profile" leftIcon={profileIcon} disabled={true} />
                    <MenuItem primaryText="Setting" leftIcon={settingsIcon} disabled={true} />
                    <MenuItem primaryText="Help" 
                        onClick={this._onHelpClick}
                        leftIcon={helpIcon} />
                    <MenuDivider />
                    <MenuItem primaryText="Logout" leftIcon={logoutIcon} onClick={this._onLogoutClick}/>
                </Menu>
            </div>
        );
    }
});


