var React = require('react');
var FluxibleMixin = require('fluxible').Mixin; 

var SharedUtils = require('../../../../sharedUtils/utils');
var ChangeDrawMode = require('../../../client/actions/draw/changeDrawMode');
/**
 * @Author: Jos Tung
 * @Description: this component is color palette
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    _handleColorPickup: function(color){
        this.executeAction(ChangeDrawMode, {
            palette: false,
            strokeStyle: color
        });
    },

    render: function(){
        return (
            <div>
                <Palette active={this.props.isActive} onColorPickup={this._handleColorPickup}/>
            </div>
        );
    }
});

var Palette = React.createClass({
    getInitialState: function() {
        var colors = [
            '#000000', '#993300', '#333300', '#003300', '#003366', '#000080', '#333399', '#333333', 
            '#800000', '#ff6600', '#808000', '#008000', '#008080', '#0000ff', '#666699', '#808080', 
            '#ff0000', '#ff6600', '#99cc00', '#339966', '#33cccc', '#3366ff', '#800080', '#999999', 
            '#ff00ff', '#ffcc00', '#ffff00', '#00ff00', '#00ffff', '#00ccff', '#993366', '#c0c0c0', 
            '#ff99cc', '#ffcc99', '#ffff99', '#ccffcc', '#ccffff', '#99ccff', '#cc99ff', '#eeeeee'
        ];
        var rowCounts = 8;
        var paletteColors = [];
        while (colors.length > 0) {
            paletteColors.push(colors.splice(0, rowCounts));
        }
        return {
            colorArray: paletteColors
        };
    },

    _handleColorPickup: function(color){
        this.props.onColorPickup(color);
    },

    render: function() {
        var _palette = SharedUtils.fastArrayMap(this.state.colorArray, function(rowContent, index){
            return (
                <ColorRow 
                    list={rowContent} 
                    key={index} 
                    onColorPickup={this._handleColorPickup}/>
            );
        }.bind(this));

        return (
            <div className={this.props.active ? "DrawingPalette PaletteShow" : "DrawingPalette"}>
                {_palette}
            </div>
        );
    }
});

var ColorRow = React.createClass({
    _handleColorPickup: function(color){
        this.props.onColorPickup(color);
    },

    render: function() {
        var _this = this;
        var _blockArray = this.props.list.map( function(color){
            return <ColorBlock color={color} onColorPickup={_this._handleColorPickup} />;
        });
        return (
            <div className="ColorRow">
                {_blockArray}
            </div>
        );
    }
});

var ColorBlock = React.createClass({
    _handleColorPickup: function(){
        this.props.onColorPickup(this.props.color);
    },

    render: function() {
        var divStyle = { backgroundColor: this.props.color };
        return (
            <div className="ColorBlock" style={divStyle} onClick={this._handleColorPickup}></div>
        );
    }   
});
