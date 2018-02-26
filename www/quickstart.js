// Client ID and API key from the Developer Console
var CLIENT_ID = '';
var API_KEY = '';
var PATH_JSON = 'tree.json';
var ADDR_SERVER = 'http://localhost:8000';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    listFiles();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

// Make sure the client is loaded and sign-in is complete before calling this method.
function listPermissions(fileId, fileName) {
  return gapi.client.drive.permissions.list({
    "fileId": fileId
  })
    .then(function (response) {
      // Handle the results here (response.result has the parsed body).
      console.log("Permission", response);
     /* appendPre('Fichier: ' + fileName + ' possède les permissions: ');
      var permissions = response.result.permissions;
      if (permissions && permissions.length > 0) {
        for (var i = 0; i < permissions.length; i++) {
          var permission = permissions[i];
          appendPre('Role: ' +
            permission.role +
            ' type: ' +
            permission.type +
            ' (' +
            permission.id + ')');
          
        }
      } else {
        appendPre('No permission found.');

      }*/
    },
      function (err) { console.error("Execute error", err); });
}


/**
 * Print files.
 */
function listFiles() {
  //getFile(PATH_JSON);
  gapi.client.drive.files.list({
    'pageSize': 15,
    'fields': "nextPageToken, files(id, name, mimeType, parents, permissionIds)"
  }).then(function (response) {
    appendPre('Files:');
    console.log("Files", response);
    /*for (var i = 0; i < response.result.files.length; i++) {
      console.log("Parents", response.result.files[i]);
    }*/

    connectionToServer(response);


    /*
    var files = response.result.files;
    if (files && files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        listPermissions(file.id, file.name);
        appendPre(file.name + ' (' + file.id + ')');
      }
    } else {
      appendPre('No files found.');
    }*/
  });

}

/*
connection to the server
*/

function connectionToServer(actualJson) {
  var socket = io.connect(ADDR_SERVER);
  sendObjectToServer(socket, actualJson);
  receiveObjectToServer(socket, actualJson);
}

/*
Send the configuration file
*/
function sendObjectToServer(socket, actualJson) {
  document.getElementById('sendJson').onclick = function () {
    socket.emit('message', JSON.stringify(actualJson));
  };
}

/*
* receiveObjectToServer
*/
function receiveObjectToServer(socket, actualJson) {
  document.getElementById('receiveJson').onclick = function () {
    var socket = io.connect(ADDR_SERVER);
    socket.on('message', compareFiles.bind(null, socket, actualJson));
  };
}



var compareFiles = function (socket, actualJson, data) {
  jsonModel = JSON.parse(data)
  filesModel = jsonModel.result.files;
  filesActual = actualJson.result.files;
  console.log('Model json :', filesModel);
  console.log('Actuel json :', filesActual);

  if (_.isEqual(filesModel, filesActual)) {
    console.log("les modèles sont identiques");

  }
  else{
    var filesModelDiff =  JSON.parse(JSON.stringify( filesModel ));
    var filesActualDiff = JSON.parse(JSON.stringify( filesActual ));

    for (var i = 0; i < filesModelDiff.length; i++){
      for (var j = 0; j < filesActualDiff.length; j++){
        if (_.isEqual(filesModelDiff[i], filesActualDiff[j])){
          filesModelDiff.splice(i, 1);
          filesActualDiff.splice(j, 1);
          j=0;
        }
      }
    }
    console.log('Files model res:', filesModelDiff);
    console.log('Files actual res:', filesActualDiff);
    checkNameFiles(filesModelDiff, filesActualDiff)

    for (var i = 0; i < filesActualDiff.length; i++){
      comparePermissions(filesActualDiff[i].id, null);
    }
  }
}

function checkNameFiles(){}

function checkPermissionsFiles(){}

function comparePermissions(fileId, fileName){
  listPermissions(fileId, fileName);
}