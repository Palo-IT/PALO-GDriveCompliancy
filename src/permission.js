// @ts-check
var CLIENT_ID = '762060065345-39pdlv7e8vjrsutageiftgqj812m5goc.apps.googleusercontent.com';
var API_KEY = 'AIzaSyBtd-BYVKiqOTzBOxOrCuLibnSpB_qi2E8';
var SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';


function authenticate() {
    return gapi.auth2.getAuthInstance()
        .signIn({ scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly" })
        .then(function () { console.log("Sign-in successful"); },
            function (err) { console.error("Error signing in", err); });
}
function loadClient() {
    return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest")
        .then(function () { console.log("GAPI client loaded for API"); },
            function (err) { console.error("Error loading GAPI client for API", err); });
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
    }).then(function (response) {
        console.log("Response", response);
        appendPre('Files:');
        var files = response.result.files;
        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                listPermissions(file.id, file.name);
                appendPre(file.name + ' (' + file.id + ')');
                
            }
            appendPre('\n');
        } else {
            appendPre('No files found.');
        }
    });
}


gapi.load("client:auth2", function () {
    gapi.auth2.init({
        client_id: CLIENT_ID,
        apiKey: API_KEY,
        scope: SCOPES
    });
});

