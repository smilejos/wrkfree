var React = require('react');
/**
 * child components
 */
var WorkSpaceBar = require('./WorkSpaceBar.jsx');
var DiscussionArea = require('./rightBox/DiscussionArea.jsx');
var Mui = require('material-ui');
var Paper = Mui.Paper;
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
                <DiscussionArea />
                <WorkSpaceBar />
            </div>
        );
    }
});
