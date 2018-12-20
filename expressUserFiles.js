var express = require('express'),
    bodyParser = require('body-parser'),
    path = require('path'),
    finalhandler = require('finalhandler');

// Local file indexer
var serveIndex = require('serve-index')

// Initializing express app
var app = express();


// For parsing application/json
app.use(bodyParser.json()); 

// For parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 


app.use('/voices/:userId', function (req, res) {
    dir = req.params.userId;
    addr = path.join(`${__dirname}/voices/${dir}`);
    done = finalhandler(req, res);
    express.static(addr)(req, res, function onNext() {
        console.log(addr);
        serveIndex(addr, {'icons': true})(req, res, done)
    });
});

app.use('/voicefiles', express.static(path.join(__dirname + '/voices/')), serveIndex(path.join(__dirname + '/voices/'), {'icons': true}));


// For all pathes with no handler
app.get('*', function(req, res){
    res.send('Sorry, this is an invalid URL.');
});

// Start the server
app.listen(3030);