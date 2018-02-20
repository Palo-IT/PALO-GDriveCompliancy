     // Client ID and API key from the Developer Console
     var CLIENT_ID = '762060065345-2se4jutkcc9sq320lfppd6i7khreb1rv.apps.googleusercontent.com';
     var API_KEY = 'AIzaSyC-1mQtdt4Rqx49qLL1580emL_h2051Z0I';

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
            console.log("Response", response);
            appendPre('Fichier: ' + fileName +' possède les permissions: ');
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
            }
        },
            function (err) { console.error("Execute error", err); });
}


     /**
      * Print files.
      */
     function listFiles() {
       gapi.client.drive.files.list({
         'pageSize': 10,
         'fields': "nextPageToken, files(id, name)"
       }).then(function(response) {
         appendPre('Files:');
         var files = response.result.files;
         if (files && files.length > 0) {
           for (var i = 0; i < files.length; i++) {
             var file = files[i];
             listPermissions(file.id, file.name);
             appendPre(file.name + ' (' + file.id + ')');
           }
         } else {
           appendPre('No files found.');
         }
       });
     }
