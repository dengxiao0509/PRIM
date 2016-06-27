
$("#saveSessionPopup").draggable();
$("#openSessionPopup").draggable();

/////////////////////////////////////////////////////////////////////////////////////
///////////////////////////// buttons in Popups /////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

// ---------------  saveSession ------------------------//
//open
$("#saveSession").click(function(){
    closeAllPopup();
    $("#saveSessionPopup").show();
    enterToSubmit("saveSessionBtn");

    $("#sessionName").val(currentSession);
    $("#saveSessionFormMsg").html("");
    $("#hid_new").val("");
    $("#hid_open").val("");
});
//save button
$("#saveSessionBtn").click(function(){
    var sName = $("#sessionName").val();
    if(sName.replace(/\s/g,'') == ""){
        $("#saveSessionFormMsg").html("Please enter a name ...");
        return;
    }

    //call remote function in server
    session_global.call("sdlSCI.data.saveSession", [sName]).then(
        function (res) {
            if (res == "exists") {
                if (confirm("This name already existes, overwrite it ?")) {
                    session_global.call("sdlSCI.data.saveSession", [sName, true]).then(
                        function (res) {
                            if (res == "ok") {
                                $("#saveSessionPopup").hide();
                                $(document).unbind("keypress");
                                var nS = $("#hid_open").val();
                                var newEmptyS = $("#hid_new").val();
                                if (nS != "") {
                                    //OPEN a  session after saving
                                    changeSession(nS);
                                }
                                else if (newEmptyS != "") {
                                    //create new a session after saving
                                    changeSession(null);
                                }
                                else {
                                    //change current session name
                                    // currentSession = sName;
                                    // $("#currentSession").html(currentSession);
                                }
                            }
                            else {
                                console.log(res);
                            }

                        }, session_global.log);
                }
            }
            else if (res == "ok") {

                $("#saveSessionPopup").hide();
                $(document).unbind("keypress");
                var nS = $("#hid_open").val();
                var newEmptyS = $("#hid_new").val();
                if (nS != "") {
                    changeSession(nS);
                }
                else if (newEmptyS != "") {
                    changeSession(null);
                }
                else {
                    //change current session name
                    // currentSession = sName;
                    // $("#currentSession").html(currentSession);
                }
            }
            else {
                console.log(res);
            }
        }, session_global.log
    );

});
//cancel button
$("#cancelSessionBtn").click(function(){
    $("#saveSessionPopup").hide();
    $(document).unbind("keypress");
});



// ---------------  openSession ------------------------//
//open
$("#openSession").click(function(){
    closeAllPopup();
    $("#openSessionPopup").show();
    enterToSubmit("openSessionBtn");
    updateExistingSessions();
});
//open button
$("#openSessionBtn").click(function(){
    var newSession = $("#existingSessions").val();
    if(newSession == null) {
        $("#openSessionFormMsg").html("No session choosen!");
        return;
    }

    $("#openSessionPopup").hide();
    $(document).unbind("keypress");
    if (confirm("Do you want to save changes before opening another session?")) {
        $("#saveSession").trigger("click");
        $("#hid_new").val("");

        $("#sessionName").val(currentSession);
        $("#hid_open").val(newSession);

        $("#cancelSessionBtn").click(function () {
            changeSession(newSession, true)
        });

    }
    else {
        changeSession(newSession);
    }
});
//cancel button
$("#cancelOpenSessionBtn").click(function(){
    $("#openSessionPopup").hide();
    $(document).unbind("keypress");
});



// ---------------  newSession ------------------------//
//open
$("#newSession").click(function(){
    closeAllPopup();
    var newSession = null;
    if (confirm("Do you want to save changes before opening another session?")) {
        $("#saveSession").trigger("click");
        $("#sessionName").val(currentSession);
        $("#hid_new").val("new");
        $("#hid_open").val("");

        $("#cancelSessionBtn").click(function () {
            changeSession(newSession, true)
        });

    }
    else {
        changeSession(newSession);
    }
})

//change current session
function changeSession(newSess,isUnbind){
    if(isUnbind == undefined) {
        isUnbind = false;
    }
    session_global.call("sdlSCI.data.changeSession",[newSess]).then(
        function(res){
//                console.log(res);
            if(res == "filesError"){
                $("#openSessionPopup").show();
                $("#openSessionFormMsg").html("Files of this session are not all found.");
                //TODO remove it
            }
            else if(res == "dirError"){
                $("#openSessionPopup").show();
                $("#openSessionFormMsg").html("Directory of this session not found.");
                //TODO remove it
            }
            else if(res=="ok") {
                console.log("open session successfully");
                //renew interface
                // init(res);
                //
                // isConnectSDL = true;
                // $("#connectSDLBtn").html(" SDL Server Connected ");

                // $("#currentSession").html(currentSession);
            }

        },session_global.log
    );
    if(isUnbind) {
        console.log("isunbins");
        $("#cancelSessionBtn").unbind("click",changeSession);
    }


}


//update sessions
function updateExistingSessions(){

    var htmlContent = "";
    for(var i in sessions){
        htmlContent += "<option value='"+sessions[i]+"'>"+sessions[i]+"</option>";
    }
    $("#existingSessions").html(htmlContent);
}


//subscribe procedures
function onChangeSessionName(args) {
    currentSession = args[0];
    if(sessions.indexOf(currentSession) == -1) {
        sessions.push(currentSession);
        updateExistingSessions();
    }
    $("#currentSession").html(currentSession);
}

function onChangeSession(res){
    init(res[0]);
    isConnectSDL = true;
    $("#connectSDLBtn").html(" SDL Server Connected ");
}
