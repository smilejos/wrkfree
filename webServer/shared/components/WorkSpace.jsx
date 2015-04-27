var React = require('react');
/**
 * child components
 */
var WorkSpaceBar = require('./WorkSpaceBar.jsx');
var DiscussionArea = require('./rightBox/DiscussionArea.jsx');
var DrawingArea = require('./mainBox/DrawingArea.jsx');
/**
 * the workspace.jsx is the main container of each channel
 */
module.exports = React.createClass({
    render: function(){
        return (
            <div>
                <DrawingArea />
                <DiscussionArea />
                <WorkSpaceBar />
            </div>
        );
    }
});
