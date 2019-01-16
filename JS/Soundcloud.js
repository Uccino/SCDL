// This client Id is used to make requests to the soundcloud API
var _clientId = "8NYwHqnYxQdaq4z7FYBj2K0nKDSiUrFT";
var _Tracklist = [];
var _folderName = "";

// =======================================================================
//                          Two main functions
// =======================================================================     
function loadSoundcloudSongs(){
    var soundcloudUrl = document.getElementById("soundcloudUrl").value;
    if(checkInput(soundcloudUrl)){
        resolveUrl = buildUrl(soundcloudUrl);

        var jsonTracks = [];
        if(soundcloudUrl.includes("sets")){
            // Get the playlist in JSON format
            JsonList = makeHttpRequest(resolveUrl);

            if(_folderName == ""){
                _folderName = JsonList.title;
            }
            jsonTracklist = JsonList.tracks;

            // Grab the Artist, Title and Id from each track and add it to a dictionary for later use. 
            jsonTracklist.forEach(element => {
                var Artist = element.user.username;
                var Title = element.title;
                var Id = element.id;

                // Push the data to a global variable 
                trackDict = TrackToDict(Title, Artist, Id);
                _Tracklist.push(trackDict);
                addTableRow(Artist, Title);
            });

            jsonTracks += jsonTracklist;
        }else{
            if(_folderName == ""){
                _folderName = "Soundcloud music"
            } 
            // Get the track in JSON format
            JsonList = makeHttpRequest(resolveUrl);

            // Grab the Artist, Title and Id from each track and add it to a dictionary for later use. 
            var Artist = JsonList.user.username;
            var Title = JsonList.title;
            var Id = JsonList.id;

            trackDict = TrackToDict(Title, Artist, Id);
            _Tracklist.push(trackDict);
            addTableRow(Artist, Title);
        }
    }
    
    if(_Tracklist.length > 0 ){
        document.getElementById('outputMessage').innerHTML = `<div id="notification "class="notification is-success"> <p>Loaded ${_Tracklist.length} songs.</p> </div>`
    }else{
        document.getElementById('outputMessage').innerHTML = `<div id="notification "class="notification is-success"> <p>Failed to load songs.</p> </div>`
    }
    

    return 0;
}

function downloadSoundcloudSongs(){

    if(_Tracklist.length > 0 ){
        var tracks = _Tracklist;
        var UrlList = [];
        tracks.forEach(element => {
            // Prepare neccecary information.
            trackId     = element[0].id;
            trackTitle  = element[0].title;
            trackUrl    = `https://api.soundcloud.com/i1/tracks/${trackId}/streams?client_id=${_clientId}`;

            var client = new HttpClient();
            
            client.get(trackUrl, function(response){
                var obj = JSON.parse(response);
                
                fileUrl     = obj.http_mp3_128_url;
                fileName    = trackTitle;

                UrlList.push({
                    Url:    fileUrl,
                    Name:   fileName
                });
            });
        })
        document.getElementById('outputMessage').innerHTML = `<div id="notification "class="notification is-success"> <p>Downloading the zip.</p> </div>`
        DownloadFiles(UrlList);
    }else{
        document.getElementById('outputMessage').innerHTML = `<div id="notification "class="notification is-warning"> <p>Enter a link and press "load" first!</p> </div>`
    }
    
}

function clearSoundcloudSongs(){
    if(_Tracklist.length > 0 ){
        _Tracklist = null;
        _folderName = null;

    document.getElementById('outputMessage').innerHTML = `<div id="notification "class="notification is-success"> <p>Song list was cleared!</p> </div>`
    }else{
        document.getElementById('outputMessage').innerHTML = `<div id="notification "class="notification is-warning"> <p>Song list was empty in the first place!</p> </div>`
    }    
}

// =======================================================================
//                          Other functions
// =======================================================================

function TrackToDict(Title, Artist, Id){    
    trackDictionary = [];
    trackDictionary.push({
        id: Id,
        artist: Artist,
        title: Title
    });

    return trackDictionary;
}

// Download all the items from the tracklist dictionary
function DownloadFiles(trackDict){
    var zip = new JSZip();
    var count = 0;
    var zipFilename = _folderName + ".zip";

    trackDict.forEach(element => {
        var filename = element.Name + ".mp3";
        var fileUrl = element.Url;
        console.log(filename);

        JSZipUtils.getBinaryContent(fileUrl, function(err, data) {
            if (err) {
                throw err; // or handle the error
            }
            zip.file(filename, data, {
                binary: true
            });
            count++;
            if (count == trackDict.length) {
                zip.generateAsync({
                    type: 'blob'
                }).then(function(content) {
                    console.log("Saving the ZIP")
                    saveAs(content, zipFilename);
                });
            }
        });
    });
}

// Check if our input is an soundcloud url 
function checkInput(input){
    if(input.includes("https://soundcloud.com/") || input.includes("www.soundcloud.com/")){
        return true;
    }else{
        return false;
    }
}

// Build the URL we can resolve
function buildUrl(soundcloudLink){
    var returnUrl = `https://api.soundcloud.com/resolve.json?url=${soundcloudLink}&client_id=${_clientId}`
    return (returnUrl);
}

// Get JSON data from the soundcloud website
function makeHttpRequest(resolveUrl){
    // Make a HTTP request
    var client = new HttpClient();
    try {
        client.get(resolveUrl, function(response) {        
            jsonResponse = JSON.parse(response);
        });
        return jsonResponse;
    } catch (error) {
        return null;
    }    
}

// Turn the tracklist JSON into a dict of id's and titles
function getTrackList(tracklist){

    trackDict = [];
    tracklist.forEach(element => {
        trackId = element.id;
        trackTitle = element.title;

        trackDict.push({
            id: trackId,
            title: trackTitle
        });
    });

    return trackDict;
}

// Add a table row to our page
function addTableRow(Artist, Title){
    // Find a <table> element with id="myTable":
    var table = document.getElementById("songTable").getElementsByTagName('tbody')[0];

    // Create an empty <tr> element and add it to the 1st position of the table:
    var row = table.insertRow(0);

    // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);

    // Add some text to the new cells:
    cell1.innerHTML = Artist;
    cell2.innerHTML = Title;
}

// We make HTTP requests using this class / function
var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() {
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200) {
                aCallback(anHttpRequest.responseText);
            }
        }
        anHttpRequest.open("GET", aUrl, false);
        anHttpRequest.send(null);
    }
}

