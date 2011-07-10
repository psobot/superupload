Superupload
====================
A spiffy node.js-based file uploader by Peter Sobot.

July 8 & 9, 2011. http://soundcloud.petersobot.com:81/

How it works:
-------------

Superupload uses a custom Node http server to receive file uploads. This server uses Node's built-in ability to receive chunks of a file separately, and processes each chunk asynchronously. (I used the wonderful formidable library to handle the parsing of the multipart upload - it's very ugly low-level code to write.)

jQuery is used on the front end to allow easy-to-read code while providing nice GUI animations and easy access to the XMLHTTPRequest API.

**Note**: This currently runs on port 81, to allow me to host it alongside my traditional server. It could easily work on just port 80, as well, though.

Todo:
-----
If this were a serious project, actually used in production anywhere, I'd:
 - Move the backend to a database instead of simple file-based storage
 - Implement a proper router in Node
 - Add more descriptive, more useful logging output
 - Test security much more heavily.
 - Get rid of polling for progress updates, instead use fancy new WebSockets (Socket.IO!)


Simple Startup:
---------------
> ./startServer.sh
or
> node superupload.js

Usage:
------
 - Click "Choose File"
 - Choose a file from your local machine
 - Hit "Ok"
 - Watch shiny progress bar increment
 - While waiting, write a poem (or, anything really) in the description box
 - Hit "Save description" at any time
 - Watch as your description is saved!
 - Once your file is done, click "Uploaded to here" to find out where it went.
 - ???
 - Profit!