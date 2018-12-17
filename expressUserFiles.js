var express = require('express'),
bodyParser = require('body-parser');


var serveIndex = require('serve-index')

var app = express();

var path = require('path');


// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
app.use('/files', express.static(path.join(__dirname + '/files/')), serveIndex(path.join(__dirname + '/files/'), {'icons': true}))

app.get('/things/:name/:id', function(req, res) {
    res.send('id: ' + req.params.id + ' and name: ' + req.params.name);
});

app.post('/post', function (req, res) {
    res.send({name: req.body.name})
})

app.get('*', function(req, res){
    res.send('Sorry, this is an invalid URL.');
});


app.listen(3000);