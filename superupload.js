/*
 *  SoundCloud Backend Developer Challenge
 *  by Peter Sobot, @psobot(.com)
 *  July 8 & 9, 2011
 */

/*
 *  A few dependencies and variable initializations.
 */
var formidable = require( 'formidable' ),
    http = require( 'http' ),
    url = require( 'url' ),
    path = require( 'path' ),
    fs = require( 'fs' ),
    crypto = require( 'crypto' ),
    querystring = require( 'querystring' ),
    uploads = {};

/*
 *  Custom logging method for, well, server logs.
 */
function log( string, ip ){
    console.log( (new Date).toString() + "\t" + ip + "\t" + string );
}
/*
 *  Creating our own HTTP server in JS? Madness!
 *  anonymous callback:
 *      req is the HTTP request object, received by Node.
 *      res is the HTTP response object, that will be returned by Node.
 */
http.createServer( function( req, res ) {
    /*
     *  A proper router would be better, but we only need a very small number of URLs right now.
     */
    try {
        var r = url.parse(req.url, true);
        if ( typeof r.query.guid != "undefined" ){
            if ( r.pathname == '/upload' ){
                if( req.method.toLowerCase() == 'post' ) {

                    //  we have a new upload! Ready the form!
                    log( "Receiving: \t" + r.query.guid, req.socket.remoteAddress );
                    var form = uploads[r.query.guid] = new formidable.IncomingForm();

                    //  Handy Formidable method for abstracting away the chunks of data
                    form.parse( req, function(err, fields, files) {
                        //  In here, we're done and we have the file uploaded
                        var webPath = path.join(
                            "uploads/" +
                            crypto.createHash('md5').update(r.query.guid).digest("hex") +
                            path.extname( files.upload.name )
                        );
                        var localPath = path.join( process.cwd(), webPath );

                        //  Move the file from temporary path to somewhere visible.
                        fs.rename( files.upload.path, localPath, function(){
                            res.writeHead( 200, {'content-type': 'text/html'} ); //essentially returns JSONP to iFrame
                            res.end( "<script type='text/javascript'>parent.finishUpload(\"" + webPath + "\")</script>" );
                            log( "Uploaded: \t" + r.query.guid + " \t saved to " + localPath, req.socket.remoteAddress );
                        });
                    });
                } else {
                    res.writeHead( 200 );
                    res.end();
                }
            } else if ( r.pathname == '/progress' ) {
                /*
                 *  When the client polls for progress, this gives it to them.
                 *  Sockets would be much better, but Socket.IO is a large dependency
                 *  and requires numerous fallbacks to flash/polling/etc.
                 */
                res.writeHead( 200, {'content-type': 'application/json'} );
                var received = null, expected = null;
                if ( typeof uploads[r.query.guid] != "undefined" ){
                    received = uploads[r.query.guid].bytesReceived;
                    expected = uploads[r.query.guid].bytesExpected;

                    //  If file is done, send one last 100% progress update, then garbage collect:
                    if ( received == expected ) delete uploads[r.query.guid];
                }
                res.end( JSON.stringify( {"bytesReceived": received, "bytesExpected": expected} ) );

                return;
            }
        } else if ( r.pathname == '/description' ) {
            var postData;
            req.setEncoding('binary');
            req.addListener('data', function ( POST ) {
                postData = querystring.parse( POST );  
            }).addListener('end', function () {
                if ( typeof postData.description != "undefined" && postData.description != "" ){
                    /*
                     *  Ideally, this would be database-driven, but I don't
                     *  want to set up Mongo or SQL just for this little demo.
                     *  A quick file-based "database" will do instead.
                     */
                    var webPath = path.join(
                        "descriptions/" +
                        crypto.createHash('md5').update(postData.guid).digest("hex") +
                        ".txt"
                    );
                    var localPath = path.join( process.cwd(), webPath );
                    fs.writeFile( localPath, postData.description, function( err ) {
                        res.writeHead( 200 );
                        res.end();
                        log( "Description: \t" + postData.guid + " \t saved to " + localPath, req.socket.remoteAddress );
                    });
                } else {
                    res.writeHead( 400 );   //resisted the urge to make this 418, "I'm a Teapot"
                    res.end();
                }
            }); 
        } else {
            /*
             *  None of our custom pages? This handles static file serving.
             */
            if ( r.pathname.indexOf("..") != -1 ){
                res.writeHead( 403 );
                res.end();
                return;
            }
            var filename = path.join( process.cwd(), r.pathname );
            path.exists( filename, function( exists ) {
                if( !exists ) {
                    fs.readFile( "index.html", "binary", function( err, file ) {
                        res.writeHead( 200, {'content-type': 'text/html'} );
                        res.end( file, "binary" );
                    });
                } else {
                    fs.readFile( filename, "binary", function( err, file ) {
                        if( err ) {
                            fs.readFile( "index.html", "binary", function( err, file ) {
                                res.writeHead( 200, {'content-type': 'text/html'} );
                                res.end( file, "binary" );
                            });
                            return;
                        }
                        res.writeHead( 200 );
                        res.end( file, "binary" );
                        return;
                    });
                }
            });
        }
    } catch ( e ) {
        res.writeHead( 500 );
        res.end( JSON.stringify( e ) );
    }
}).listen(81);

