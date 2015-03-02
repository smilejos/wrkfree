'use strict';
var React = require('react');


/**
 * NOTE: script
 * 
 * <script src={this.props.clientJs}> </script>
 * is equal to ...
 * <script src="bundle.js"></script>
 *
 * the difference is that if we assign different url as query, 
 * src="bundle.js" will be append with specific "url" as prefix
 * , which will lead to bundle.js not found
 */

/**
 * NOTE: insert raw HTML.
 * <div dangerouslySetInnerHTML={{__html: 'First &middot; Second'}} />
 * http://facebook.github.io/react/docs/jsx-gotchas.html
 */

module.exports = React.createClass({
    render: function() {
        return (
          <html>
            <head>
                <meta charSet="utf-8" />
                <title>{this.props.title}</title>
                <meta name="viewport" content="width=device-width, user-scalable=no" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/pure/0.5.0/pure-min.css" />
                <link rel="stylesheet" href={this.props.host + 'assets/css/style.css'} />
            </head>
            <body>
                <div id="app" dangerouslySetInnerHTML={{__html: this.props.markup}}></div>
                <script dangerouslySetInnerHTML={{__html: this.props.state}}></script>
                <script src={this.props.host + 'libs/lokijs.min.js'}> </script>
                <script src={this.props.host + 'bundle.js'}> </script>
                <script type="text/javascript" src="https://localhost:35729/livereload.js"></script>
            </body>
          </html>
        );
    }
});