var fs = require('fs')
var express = require('express')
var app = express()

const PORT = 8000;

app.use(express.static('www'));

//routage acec express
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/www/" + "quickstart.html");
    //res.sendFile(__dirname + "/data/images/check.gif");
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
        receiveObjectFromClient(socket);
        sendObjectToClient(socket);
    });
})

//Receive Json model from client and write on a file
function receiveObjectFromClient(socket) {
    // Quand le serveur reçoit un signal de type "message" du client
    socket.on('message', function (message) {
        console.log(message);
        fs.writeFile('data/json/myjsonfile.json', message, 'utf8',
            (error) => { console.log("Error!"); });
    });
}

//Send file to server
function sendObjectToClient(socket) {
    fs.readFile('data/json/myjsonfile.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log(err);
        } else {
            obj = JSON.parse(data); //now it an object
            json = JSON.stringify(obj); //convert it back to json
            socket.emit('message', json);
        }

    });
}
