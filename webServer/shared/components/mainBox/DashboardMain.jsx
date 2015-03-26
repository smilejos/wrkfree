var React = require('react');
var Mui = require('material-ui');

/**
 * material UI compoents
 */
var Toolbar = Mui.Toolbar;
var ToolbarGroup = Mui.ToolbarGroup;
var FontIcon = Mui.FontIcon;

/**
 * child components
 */
var ChannelGridLayout = require('./channelGridLayout.jsx');
var ChannelListLayout = require('./channelListLayout.jsx');

/**
 * Public API
 * @Author: George_Chen
 * @Description: this is the main layout for "/app/dashboard"
 */
module.exports = React.createClass({
    getInitialState: function() {
        return {
            layout: 'grid',
            channels: TestList
        };
    },

    /**
     * @Author: George_Chen
     * @Description: handle the layout type change while user select
     */
    _onLayoutChang: function(layoutType) {
        this.setState({
            layout: layoutType,
            channels: this.state.channels
        });
    },

    /**
     * @Author: George_Chen
     * @Description: generate content items by layout type
     */
    _generateItems: function() {
        var channels = this.state.channels;
        if (this.state.layout === 'grid') {
            return (<ChannelGridLayout channels={channels} />);
        }
        return (<ChannelListLayout channels={channels} />);
    },

    // TODO: need to display which layout is selected, grid or list
    render: function() {
        return (
            <div className="mainBox DashboardMain ">
                <div className="">
                    <Toolbar>
                        <ToolbarGroup key={0} float="right">
                            <FontIcon className="fa fa-th-list" 
                                onClick={this._onLayoutChang.bind(this, 'list')}/>
                            <FontIcon className="fa fa-th"
                                onClick={this._onLayoutChang.bind(this, 'grid')}/>
                            <FontIcon className="fa fa-tags"/>
                        </ToolbarGroup>
                    </Toolbar>
                    <div className="DashboardContentLayout" >
                        {this._generateItems()}
                    </div>
                </div>
            </div>
        );
    }
});

/**
 * Test data
 */

var MembersInfo = [
    {
        uid: 'bamoo456@gmail.com',
        avatar: 'https://graph.facebook.com/B.GeorgeChen/picture'
    },
    {
        uid: 'bamoo789@gmail.com',
        avatar: 'https://graph.facebook.com/564830220310497/picture'
    },
    {
        uid: 'normanywei@gmail.com',
        avatar: 'https://graph.facebook.com/Normanywei/picture'
    },
    {
        uid: 'clearwindjos@gmail.com',
        avatar: 'https://graph.facebook.com/333479400166173/picture'
    },
    {
        uid: 'biaomin@gmail.com',
        avatar: 'https://graph.facebook.com/biaomin/picture'
    },
    {
        uid: 'Malachi1005@gmail.com',
        avatar: 'https://graph.facebook.com/Malachi1005/picture'
    },
    {
        uid: 'yajun.yang@gmail.com',
        avatar: 'https://graph.facebook.com/yajun.yang/picture'
    },
    {
        uid: 'eric.hung.779@gmail.com',
        avatar: 'https://graph.facebook.com/eric.hung.779/picture'
    },
    {
        uid: 'chuangaching@gmail.com',
        avatar: 'https://graph.facebook.com/chuangaching/picture'
    },
];

var TestList = [
    {
        channelId: '55091a570d91e1fb64e70f4b',
        channelName: 'Wrkfree2.0',
        hostName: 'GeorgeChen',
        hostAvatar: 'https://graph.facebook.com/B.GeorgeChen/picture',
        snapshotUrl: 'https://goo.gl/gNVk1j',
        memberList: [MembersInfo[8], MembersInfo[1], MembersInfo[2], MembersInfo[3], MembersInfo[7], MembersInfo[5]],
        LastVisitTime: '03/20/2015 PM 10:00',
        isRtcOn: true
    },
    {
        channelId: '55091a570d91e1fb64e70f4b',
        channelName: 'Development',
        hostName: 'Normanywei',
        hostAvatar: 'https://graph.facebook.com/Normanywei/picture',
        snapshotUrl: 'https://i-msdn.sec.s-msft.com/dynimg/IC121896.gif',
        memberList: [MembersInfo[4], MembersInfo[5], MembersInfo[2], MembersInfo[0]],
        LastVisitTime: '03/21/2015 PM 5:00'
    },
    {
        channelId: '55091a570d91e1fb64e70f4b',
        channelName: 'UI',
        hostName: 'Jos',
        hostAvatar: 'https://graph.facebook.com/JosTung/picture',
        snapshotUrl: 'https://www.polymer-project.org/images/sampler-paper.png',
        memberList: MembersInfo,
        // memberList: [MembersInfo[3], MembersInfo[5]],
        LastVisitTime: '01/19/2015 PM 10:00'
    },
    {
        channelId: '55091a570d91e1fb64e70f4b',
        channelName: 'Github_repo',
        hostName: 'Seasonny',
        hostAvatar: 'https://graph.facebook.com/seasonny/picture',
        snapshotUrl: 'https://raw.githubusercontent.com/quickhack/translations/master/git-workflows-and-tutorials/images/git-workflows-gitflow.png',
        memberList: [MembersInfo[0], MembersInfo[3]],
        LastVisitTime: '03/21/2015 PM 11:00',
        isRtcOn: true
    },
    {
        channelId: '55091a570d91e1fb64e70f4b',
        channelName: 'Marketing',
        hostName: 'Eric',
        hostAvatar: 'https://graph.facebook.com/eric.hung.779/picture',
        snapshotUrl: 'https://fbcdn-sphotos-h-a.akamaihd.net/hphotos-ak-xpa1/v/t1.0-9/p280x280/10923294_777894818947127_2066564985366127109_n.jpg?oh=20a5a2c3ebe2a1372b796dc85e935ce8&oe=55BE2C66&__gda__=1434332544_25cc55eae5d08c94970cfd83d7cfe309',
        memberList: [MembersInfo[0], MembersInfo[3], MembersInfo[1], MembersInfo[5]],
        LastVisitTime: '02/28/2015 PM 03:00'
    },
    {
        channelId: '55091a570d91e1fb64e70f4b',
        channelName: 'House',
        hostName: 'chuangaching',
        hostAvatar: 'https://graph.facebook.com/chuangaching/picture',
        snapshotUrl: 'https://i2.wp.com/4.bp.blogspot.com/_597Km39HXAk/TEgfYW-QXqI/AAAAAAAAHlU/RjjOq0aubaE/s1600/single-floor-plan.gif',
        memberList: [MembersInfo[8], MembersInfo[3], MembersInfo[1], MembersInfo[7]],
        LastVisitTime: '03/19/2015 AM 10:00',
        isRtcOn: true
    },
];