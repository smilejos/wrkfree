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
                <title>Wrkfree</title>
                <link rel="shortcut icon" href="/assets/imgs/favicon.ico" />
                <meta name="viewport" content="width=device-width, user-scalable=no" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/fontawesome/4.4.0/css/font-awesome.min.css"/>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,300,500" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                <link rel="stylesheet" href={this.props.host + 'assets/css/style.css'} />
            </head>
            <body>
                <div id="app" dangerouslySetInnerHTML={{__html: this.props.markup}}></div>
                <script dangerouslySetInnerHTML={{__html: this.props.state}}></script>
                <script src={this.props.host + 'bundle.js'}> </script>
                <script type="text/javascript" src="https://localhost:35729/livereload.js"></script>
            </body>
          </html>
        );
    }
});