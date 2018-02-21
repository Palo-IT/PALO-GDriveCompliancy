var express = require('express')
var app = express()

const PORT = 8000;

app.use(express.static('www'));

//routage acec express
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/www/" + "quickstart.html");
})

app.get('/process_get', function (req, res) {
    // Prepare output in JSON format
    response = {
        first_name: req.query.first_name,
        last_name: req.query.last_name
    };
    console.log(response);
    //res.end(JSON.stringify(response));
})

var server = app.listen(PORT, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)

    // Chargement de socket.io
    // Permet la connection avec le client et echange de ficher JSon
    var io = require('socket.io').listen(server);

    // Quand un client se connecte, on le note dans la console
    io.sockets.on('connection', function (socket) {
        socket.emit('message', 'Vous êtes bien connecté !');
               // Quand le serveur reçoit un signal de type "message" du client    
        socket.on('message', function (message) {
            console.log('Un client me parle ! Il me dit : ' + message);
        });	
    });
 

})