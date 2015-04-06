var React = require('react');

/**
 * material ui components
 */
var Mui = require('material-ui');
var Paper = Mui.Paper;
var TextField = Mui.TextField;

/**
 * child components
 */
var WorkSpaceBar = require('./WorkSpaceBar.jsx');

/**
 * the workspace.jsx is the main container of each channel
 */
module.exports = React.createClass({
    render: function(){
        return (
            <div>
                <div className="mainBox" >
                    <div className="DrawingArea" >
                        <Paper zDepth={0} />
                    </div>
                </div>
                <div className="infoBox" >
                    <div className="DiscussionArea" >
                        <TextField hintText="say something ..." />
                    </div>
                </div>
                <WorkSpaceBar />
            </div>
        );
    }
});
