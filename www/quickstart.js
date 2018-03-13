// Client ID and API key from the Developer Console
var CLIENT_ID = '';
var API_KEY = '';
var PATH_JSON = 'tree.json';
var ADDR_SERVER = 'http://localhost:8000';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.metadata';

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');


//Attribut à modifier dans le drive
var actionEnum = Object.freeze({ "name": 1, "tuesday": 2, "wednesday": 3, })

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
      
    },
      function (err) { console.error("Execute error", err); });
}


/**
 * Print files.
 */
function listFiles() {
  gapi.client.drive.files.list({
    'pageSize': 25,
    'fields': "nextPageToken, files(id, name, mimeType, parents, permissionIds)"
  }).then(function (response) {
    console.log("Files", response);
    connectionToServer(response);
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


//Compare files Json Model and actual drive
var compareFiles = function (socket, actualJson, data) {
  jsonModel = JSON.parse(data)
  filesModel = jsonModel.result.files;
  filesActual = actualJson.result.files;
  console.log('Model json :', filesModel);
  console.log('Actuel json :', filesActual);

  if (_.isEqual(filesModel, filesActual)) {
    console.log("les modèles sont identiques");

  }
  else {
    var filesModelDiff = JSON.parse(JSON.stringify(filesModel));
    var filesActualDiff = JSON.parse(JSON.stringify(filesActual));

    for (var i = 0; i < filesModelDiff.length; i++) {
      for (var j = 0; j < filesActualDiff.length; j++) {
        if (_.isEqual(filesModelDiff[i], filesActualDiff[j])) {
          filesModelDiff.splice(i, 1);
          filesActualDiff.splice(j, 1);
          j = 0;
        }
      }
    }
    console.log('Files model res:', filesModelDiff);
    console.log('Files actual res:', filesActualDiff);
    checkNameFiles(filesModelDiff, filesActualDiff)

    for (var i = 0; i < filesActualDiff.length; i++) {
      comparePermissions(filesActualDiff[i].id, null);
    }
  }
}


//Affichage de la gestion des corrections
function correctionPre(filesModelDiff, i, filesActualDiff, j, actionEnum, nbDiff) {
  var pre = document.getElementById('message-correction');

  //Creation des bouttons
  var correct = document.createElement("BUTTON");
  correct.appendChild(document.createTextNode("Corriger !"))
  correct.setAttribute("id", "correct" + nbDiff);

  var modelCorrect = document.createElement("BUTTON");
  modelCorrect.appendChild(document.createTextNode("Changer le model"))
  modelCorrect.setAttribute("id", "model-correct" + nbDiff);

  var noCorrect = document.createElement("BUTTON");
  noCorrect.appendChild(document.createTextNode("Ne pas corriger"))
  noCorrect.setAttribute("id", "no-correct" + nbDiff);


  //Creation du css
  pre.appendChild(document.createTextNode('Le fichier du model: '));
  var span1 = document.createElement('span1');
  span1.style.color = 'red';
  var span2 = document.createElement('span2');
  span2.style.color = 'red';

  //Creation du paragraphe
  span1.appendChild(document.createTextNode(filesModelDiff[i].name + ' '));
  pre.appendChild(span1);
  pre.appendChild(document.createTextNode(' et le fichier du drive: '));
  span2.appendChild(document.createTextNode(filesActualDiff[j].name));
  pre.appendChild(span2);
  pre.appendChild(document.createTextNode(' on le même id\n Voulez-vous modifier le nom de l\'un des fichiers?\n'));


  //Affichage image validation
  var img = document.createElement("img");
  img.src = "/images/check.gif";
  img.style.display = 'none';
  img.width = '160';
  img.setAttribute("id", "check" + nbDiff);
  pre.appendChild(img);

  //Affichage des bouttons/*
  pre.appendChild(document.createTextNode('\n'));
  pre.appendChild(correct);
  pre.appendChild(document.createTextNode('  '));
  pre.appendChild(modelCorrect);
  pre.appendChild(document.createTextNode('  '));
  pre.appendChild(noCorrect);
  pre.appendChild(document.createTextNode('\n\n'));


  document.getElementById("correct" + nbDiff).onclick = function () {
    document.getElementById("correct" + nbDiff).style.display = 'none';
    document.getElementById("model-correct" + nbDiff).style.display = 'none';
    document.getElementById("no-correct" + nbDiff).style.display = 'none';
    document.getElementById("check" + nbDiff).style.display = 'block';
    renameFile(filesActualDiff[j].id, filesModelDiff[i].name);

  };
  document.getElementById('model-correct' + nbDiff).onclick = function () {
    document.getElementById('correct' + nbDiff).style.display = 'none';
    document.getElementById('model-correct' + nbDiff).style.display = 'none';
    document.getElementById('no-correct' + nbDiff).style.display = 'none';
  };
  document.getElementById('no-correct' + nbDiff).onclick = function () {
    document.getElementById('correct' + nbDiff).style.display = 'none';
    document.getElementById('model-correct' + nbDiff).style.display = 'none';
    document.getElementById('no-correct' + nbDiff).style.display = 'none';
  };

}

function checkNameFiles(filesModelDiff, filesActualDiff) {
  var nbDiff = 0;
  for (var i = 0; i < filesModelDiff.length; i++) {
    for (var j = 0; j < filesActualDiff.length; j++) {
      if (filesModelDiff[i].id == filesActualDiff[j].id
        && filesModelDiff[i].name != filesActualDiff[j].name) {
        correctionPre(filesModelDiff, i, filesActualDiff, j, actionEnum.name, nbDiff);
        nbDiff++;
      }
    }
  }
}

function checkPermissionsFiles() { }

function comparePermissions(fileId, fileName) {
  //listPermissions(fileId, fileName);
}

  //Try this https://advancedweb.hu/2015/05/26/accessing-google-drive-in-javascript/
  //https://gist.github.com/mkaminsky11/8624150
function renameFile(fileId, newTitle) {
  var body = {'title': newTitle};
  var request = gapi.client.drive.files.update({
    'fileId': fileId,
    'resource': body
  });
  request.execute(function(resp) {
    console.log('New Title: ' + resp.title);
  });
}