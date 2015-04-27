var React = require('react');
/**
 * the drawingBoard.jsx is the drawing board
 */
module.exports = React.createClass({
    render: function(){
        return (
            <div className="DrawingArea" >
                <canvas></canvas>
            </div>
        );
    }
});
