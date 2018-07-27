
document.addEventListener("DOMContentLoaded", function(event) {
  
    //sign in
    document.getElementById('signin-button').addEventListener('click', function(event) {
        
        event.preventDefault()
        blockstack.redirectToSignIn()
        
    });
    //sign out
    document.getElementById('signout-button').addEventListener('click', function(event) {
        
        event.preventDefault()
        blockstack.signUserOut(window.location.origin);
        
    })
   
    //add new file
    document.getElementById('createDocumentButton').addEventListener('click', function(){
        var data = extractNewDocumentData();
        console.log(data)
    });
    // fetch user files
    document.getElementById('refreshFilesButton').addEventListener('click', listUserFiles);
    // open "New File" form
    document.getElementById('createFormButton').addEventListener('click', function(){
        showNewFileForm();
    });
    // open "List Files" form
    document.getElementById('listFilesButton').addEventListener('click', async function(){
        await showListFilesForm();
    });

    // search for profile by Blockstack ID
    document.getElementById('searchSubmit').addEventListener('click', function(event){
        
        let input = document.getElementById('searchInput').value;
        
        if(input !== undefined && input !== ""){

            blockstack.lookupProfile(input)
            .then(profile => {
                var person = new blockstack.Person(profile);
                //console.log(person);
                showSearchResult(person);
            })
            .catch(error => {
                //console.log(error);
                alert("Given ID is not present. Try another one.");
            });
        }
    });

    //dynamic file preview
    document.getElementById('filesList').addEventListener('click', async function(event){
        var id = event.target.id;
        if(id !== undefined && (id === 'delete' || id === 'view')){
            var fileId = event.target.parentNode.parentNode.id;
            if(id === 'delete'){
                alert("Delete feature is NOT implemented...");
            }
            else if(id === 'view'){
                await fetchAndShowFileToChange(fileId);
            }
        }
    });

    //fetch file by name to change
    document.getElementById('getFileByNameButton').addEventListener('click', async function(event){
        var fileName = document.getElementById('getFileByNameInput').value;

        await fetchAndShowFileToChange(fileName);
    });


    //save changes of previously fetched file
    document.getElementById('changeFileSubmitButton').addEventListener('click', async function(){
        var fileName = document.getElementById('documentName').value;
        var file = document.getElementById('documentText').value;

        updateFileSimple(fileName, file);
    });

    /////////////////////////////////////////////////////////////////////////////////////////////
    /*
        Bussiness functions
    */
    async function listUserFiles(){
        // 1. get Index
        var index = await getIndexFileSimple();
        // 3. update dom
        showUserFiles(index.files);
    }
    async function fetchAndShowFileToChange(fileName){

        //reset DOM
        clearChangeFileSection();

        //user input check
        if(fileName !== undefined && fileName !== ""){
            //fetch file
            var file = await getFileSimple(fileName);
            if(file === null){
                alert("File name does NOT exist.");
            }
            else{
                //show file
                showFileToChange(fileName, file);              
            }
        }
    }
    /////////////////////////////////////////////////////////////////////////////////////////////
    /*
        DOM Manipulation
    */
    //Extract data to create new file
    function extractNewDocumentData(){
        var newDocumentName = document.getElementById('newDocumentName').value;
        var newDocumentText = document.getElementById('newDocumentText').value;

        return {
            name: newDocumentName,
            text: newDocumentText
        }
    }
    function showNewFileForm(){
        // 1. hide some elements
        document.getElementById('filesList').setAttribute('hidden', true);
        document.getElementById('createFormButton').setAttribute('hidden', true);
        document.getElementById('refreshFilesButton').setAttribute('hidden', true);
        // 2. show list files button
        document.getElementById('listFilesButton').removeAttribute('hidden');
        // 3. show create file form
        document.getElementById('createFileForm').removeAttribute('hidden');
    }
    async function showListFilesForm(){
        // 1. hide some elements
        document.getElementById('listFilesButton').setAttribute('hidden', true);
        document.getElementById('createFileForm').setAttribute('hidden', true);
        
        // 2. show some elements
        document.getElementById('filesList').removeAttribute('hidden');
        document.getElementById('createFormButton').removeAttribute('hidden');
        document.getElementById('refreshFilesButton').removeAttribute('hidden');
    }
    //clear change document area
    function clearChangeFileSection(){
       document.getElementById('documentName').value = "";
       document.getElementById('documentText').value = "";
       document.getElementById('documentText').setAttribute("disabled", true);
       document.getElementById('changeFileSubmitButton').setAttribute("disabled", true);
    }
    //show file to change
    function showFileToChange(fileName, file){
        document.getElementById('documentName').value = fileName;
        document.getElementById('documentText').value = file;
        document.getElementById('documentText').removeAttribute("disabled");
        document.getElementById('changeFileSubmitButton').removeAttribute("disabled");
    }
    //list user files
    function showUserFiles(files){
        document.getElementById('filesList').innerHTML = "";

        for(var i = 0; i < files.length; i++){
            var html = `<div class="card fileCard glow" id=${files[i]}>
            <img class="card-img-top img-fluid" src="/fileIcon.jpg" alt="Card image cap">
            <div class="card-body">
                <h5 class="card-title">${files[i]}</h5>
            </div>
            <ul class="list-group list-group-flush" style="margin-bottom: 30px; margin-left: 10px; margin-right: 10px;">
                <a href="#changeFileSection" class="list-group-item btn btn-primary" id="view">Preview</a>
                <button class="list-group-item btn btn-primary" id="delete">Delete</button>
            </ul>
        </div>`;

            document.getElementById('filesList').insertAdjacentHTML('beforeend', html);

        }
    }
    //display searched profile
    function showSearchResult(person){

        document.getElementById('searchResponse').innerHTML = "";
        
        let imgSource = "";

        if(person.avatarUrl()) {
            imgSource = person.avatarUrl();
        }
        else{
            imgSource = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';
        }
        let html = `<hr/><div class="panel panel-primary"><div class="panel-body"><img src=${imgSource} class="img-rounded avatar glow" style="margin-bottom: 20px;" id="avatar-image"><h3>${person.name()}</h3><h5><i>"${person.description()}"</i></h5></div></div>`;
        document.getElementById('searchResponse').insertAdjacentHTML('beforeend', html);
    }

    // display user profile
    function showProfile(profile) {
        //console.log(profile);
        var person = new blockstack.Person(profile);
        //console.log(person);

        document.getElementById('heading-name').innerHTML = person.name() ? (person.name()) : "Nameless Person";
        document.getElementById("description").innerHTML = person.description() ? ('"' + person.description() + '"') : "No description present";

        if(person.avatarUrl()) {
        document.getElementById('avatar-image').setAttribute('src', person.avatarUrl())
        }
        document.getElementById('section-1').style.display = 'none'
        document.getElementById('section-2').style.display = 'block'
        
    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    /*
        Authentification
    */
    if (blockstack.isUserSignedIn()) {
        console.log("Signed in.");
        var profile = blockstack.loadUserData().profile;
        
        // show user profile
        showProfile(profile);
        //show user data
        listUserFiles();
    } 
    else if (blockstack.isSignInPending()) {
        console.log("Pending sign in.");
        blockstack.handlePendingSignIn().then(function(userData) {
        window.location = window.location.origin
        })
    }
    else{
        console.log("Not signed in.");
    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    /*
        How to call Blockstack.Core functions
    */
    /*
    function getKnownNodes(){
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://core.blockstack.org/v1/prices/namespaces/graphite", true);
        xhr.onload = function(){
            console.log("Names fetched!");
            console.log(JSON.parse(xhr.responseText));
        };
        xhr.onerror = function(){
            console.log("GetAllNames error.");
        };

        xhr.send(null);
    }
    */
})

/////////////////////////////////////////////////////////////////////////////////////////////
    /*
        FILE HIERARCHY SIMPLE
    */

// Index Class
var IndexSimple = function(){
    this.files = [];
    this.filesCount = 0;
}
IndexSimple.prototype.getPageName = function(){
    return this.pageName;
};

IndexSimple.prototype.getFileAtIndex = function(fileIndex){
    return this.files[fileIndex];
};
IndexSimple.prototype.addNewFile = function(newFile){
    this.files.push(newFile);
    this.filesCount ++;
}
IndexSimple.prototype.removeFileAtIndex = function(fileIndex){
    var x = this.files.splice(fileIndex, 1);
    if(x.length === 1){
        this.filesCount --;
    }
};
IndexSimple.prototype.removeFileByName = function(fileName){
    var i = this.files.indexOf(fileName);

    var x = this.files.splice(i, 1);
    if(x.length === 1){
        this.filesCount --;
    }
}

// blockstack api
async function getFileSimple(fileName){
    
    var file = undefined;
    
    await blockstack.getFile("/" + fileName)
    .then((data) => {
        console.log("File FETCHED -> " + fileName);
        file = data;
    })
    .catch(() => {
        console.log("FAILED fetching -> " + fileName);
    });

    return file;
}
async function addFileSimple(newFileName, newFile){
    // 1. fetch index file
    var index = await getIndexFileSimple();
    // 2. update index file
    new IndexSimple().addNewFile.call(index, newFileName);
    // 3. save index file
    await saveIndexFileSimple(index);
    // 4. add file to Gaia
    await blockstack.putFile("/" + newFileName, newFile)
    .then(() => {
        console.log("File SAVED -> " + newFileName);
    })
    .catch(() => {
        console.log("FAILED saving -> " + newFileName);
    });
    
}
function updateFileSimple(fileName, file){
    // no need for getting Index
    // 1. update file to Gaia
    blockstack.putFile("/" + fileName, file)
    .then(() => {
        console.log("File SAVED -> " + fileName);
    })
    .catch(() => {
        console.log("FAILED saving -> " + fileName);
    });
}
function removeFileSimple(fileName){
    blockstack.deleteFile("/" + fileName)
    .then(() => {
        console.log("File DELETED -> " + fileName);
    })
    .catch(() => {
        console.log("FAILED deleting -> " + fileName);
    });
}

function saveIndexFileSimple(indexSimple){
    var indexJson = JSON.stringify(indexSimple);
    blockstack.putFile("/indexSimple.json", indexJson)
        .then((response) => {
            console.log("IndexSimple file SAVED!");
        })
        .catch(error => {
            console.log("IndexSimple save FAILED!");
        });
}
async function getIndexFileSimple(){
    var index = undefined;
    await blockstack.getFile("/indexSimple.json")
    .then((indexJson) => {
        console.log("IndexSimple fetched successfully.");
        index = JSON.parse(indexJson);
    })
    .catch((error) => {
        console.log("IndexSimple cannot be fetched.");
    });

    return index;

}
/////////////////////////////////////////////////////////////////////////////////////////////
    /*
        Common functions
    */
function saveIndexFile(index){
    var indexJson = JSON.stringify(index);
    blockstack.putFile("/index.json", indexJson)
        .then((response) => {
            alert("Index file SAVED!")
        })
        .catch(error => {
            alert("Index save FAILED!");
        });
}
function getIndexFile(){
    blockstack.getFile("/index.json")
    .then((indexJson) => {
        alert("Index fetched successfully => see console.");
        var index = JSON.parse(indexJson);
        return index;
    })
    .catch((error) => {
        alert("Index cannot be fetched.");
    });
}


/////////////////////////////////////////////////////////////////////////////////////////////
    /*
        FILE HIERARCHY WITH PAGES
    */
// INDEX
var Index = function(){
    this.pageSize = 10;
    this.pages = [];
    this.pagesCount = 0;
};
Index.prototype.getPageByNumber = function(pageNumber){
    return this.pages[pageNumber];
};
Index.prototype.addNewPage = function(newPage){
    this.pages.push(newPage);
    this.pagesCount ++;
};
Index.prototype.removePageAtIndex = function(index){
    var x = this.pages.splice(index, 1);
    if(x.length === 1){
        this.pagesCount --;
    }
};

//PAGE
var Page = function(pageName){
    this.pageName = pageName;
    this.files = [];
    this.filesCount = 0;
};
Page.prototype.getPageName = function(){
    return this.pageName;
};

Page.prototype.getFileAtIndex = function(fileIndex){
    return this.files[fileIndex];
};
Page.prototype.addNewFile = function(newFile){
    this.files.push(newFile);
    this.filesCount ++;
}
Page.prototype.removeFileAtIndex = function(fileIndex){
    var x = this.files.splice(fileIndex, 1);
    if(x.length === 1){
        this.filesCount --;
    }
};

function savePageFile(pageFileName, pageFile){
    var pageFileJson = JSON.stringify(pageFile);
    blockstack.putFile("/" + pageFileName, pageFileJson)
    .then((response) => {
        alert("Page file SAVED!")
    })
    .catch((error) => {
        alert("Page save FAILED!");
    });
}
function getPageFile(fileName){
    blockstack.getFile("/" + fileName)
    .then((pageJson) => {
        alert("PAGE fetched successfully => see console.");
        var page = JSON.parse(pageJson);
        console.log(page);

        //console.log(pageJson);
    })
    .catch((error) => {
        alert("PAGE cannot be fetched.");
    });
}
function addNewFile(){
    // page?
    // add to page
    // save page
    // add to gaia
}
function deleteFile(){

}