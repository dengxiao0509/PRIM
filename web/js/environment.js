$("#addEnvPopup").draggable();
$("#editEnvPopup").draggable();


/////////////////////////////////////////////////////////////////////////////////////
///////////////////////////// buttons in Popups /////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

// -------------------- addEnvPopup ----------------------------------//

//open
$("#addEnvIcon").click(function(){
    closeAllPopup();
    $("#addEnvPopup").show();
    enterToSubmit("saveEnvbt");
    $("#envFormMsg").html("");
    var div = document.getElementById("newEnvVar");
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
});

//save button
$("#saveEnvbt").click(function () {
    envVariables = {};
    var varRows = document.getElementById("newEnvVar").getElementsByTagName('div');
    for (var i = 0; i < varRows.length; i++) {
        var vName = varRows[i].getElementsByTagName('input')[0].value.trim();  //delete spaces in both sides
        var vValue = varRows[i].getElementsByTagName('input')[1].value;

        //check whether variable name already exists
        if(localData["env"].hasOwnProperty(vName)){
            varRows[i].getElementsByTagName('input')[0].style.border = "1px red solid";
            $("#envFormMsg").html("Variable name already exists.");
            return;
        }
        else{
            varRows[i].getElementsByTagName('input')[0].style.border = "";
        }
        envVariables[vName] = {"value":vValue};
    }

    //change data in server, call remote function
    session_global.call('sdlSCI.data.changeEnv', ['add', envVariables]).then(
        function (res) {
            if(res == "ok") {
                $("#addEnvPopup").hide();
                $(document).unbind("keypress");
            }
            else {
                var resArray = res.split("_");
                if(resArray[0] == "rename"){
                    $("#envFormMsg").html("Variable name already exists: ["+resArray[1]+"]");
                }
                else{
                    console.log(res);
                }
            }
        }, session_global.log);
});

//cancel button
$("#cancelEnvbt").click(function(){
    $("#addEnvPopup").hide();
    $(document).unbind("keypress");
});

//new var button
$("#addEnvVarIcon").click(function(){
    var container = document.getElementById("newEnvVar");
    var nodeDiv = newVarRow();
    container.appendChild(nodeDiv);
});

//add or delete new variables
function deleteNewVar(node){
    var p = node.parentNode;
    p.parentNode.removeChild(p);
}

function newVarRow() {
    var nodeDiv = document.createElement("div");
    nodeDiv.setAttribute("class","row");

    var nodeInput1 = document.createElement("input");
    nodeInput1.setAttribute("placeholder","Name");
    nodeInput1.setAttribute("type","text");

    var nodeInput2 = document.createElement("input");
    nodeInput2.setAttribute("placeholder","Value");
    nodeInput2.setAttribute("type","text");

    var nodeImg = document.createElement("img");
    nodeImg.setAttribute("class","deleteVarIcon");
    nodeImg.setAttribute("onclick","deleteNewVar(this)");
    nodeImg.setAttribute("src",'image/delete.png');
    nodeImg.setAttribute("width",'16px');
    nodeImg.setAttribute("title",'delete this variable');

    nodeDiv.appendChild(nodeInput1);
    nodeDiv.appendChild(nodeInput2);
    nodeDiv.appendChild(nodeImg);

    return nodeDiv;
}



// -------------------- editEnvPopup ----------------------------------//

//open
function dblclickEnv(target){
    closeAllPopup();
    $("#editEnvPopup").show();
    enterToSubmit("saveEnvEditbt");

    var VName = target.id.split("_")[1];
    var obj = localData.env[VName];
    var vVar = obj["value"];

    $("#vname").html(VName);
    $("#vvar").val(vVar);

    if(obj["isEvolute"] == "true"){
        $("#evolutionDiv").show();
        $("#isEvolute").prop("checked",true);
        $("#rangeFrom").val(obj["range"][0]);
        $("#rangeTo").val(obj["range"][1]);
        $("#interval").val(obj["interval"]);

    }else{
        $("#evolutionDiv").hide();
        $("#isEvolute").prop("checked",false);
        $("#rangeFrom").val("");
        $("#rangeTo").val("");
        $("#interval").val("");
    }

    $("#editEnvPopup input[type='hidden']").val(VName);
}

//save button
$("#saveEnvEditbt").click(function(){

    var vName = $("#editEnvPopup input[type='hidden']").val();
    var rangeFrom = $("#rangeFrom").val();
    var rangeTo= $("#rangeTo").val();
    var interval = $("#interval").val();

    //check input type
    //TODO

    var vVar = $("#vvar").val();
    var res = {};
    var obj = {};

    if ($('#isEvolute').is(':checked')){
        obj["isEvolute"] = "true";
        obj["range"] = [rangeFrom,rangeTo];
        obj["interval"] = interval;
    }
    else {
        obj["isEvolute"] = "false";
        delete obj["range"];
        delete obj["interval"];
    }

    obj["value"] = vVar;
    
    res[vName] = obj;


    session_global.call('sdlSCI.data.changeEnv', ['update', res]).then(
        function (res) {
            $("#editEnvPopup").hide();
            $(document).unbind("keypress");
        }, session_global.log);

});

//cancel button
$("#cancelEnvEditbt").click(function(){
    $("#editEnvPopup").hide();
    $(document).unbind("keypress");
});

//delete button
$("#deleteThisEnv").click(function(){
    if(confirm("Do you want to delete this environment variable?")) {
        var vName = $("#editEnvPopup input[type='hidden']").val();

        //delete this variable in server
        session_global.call('sdlSCI.data.changeEnv', ['delete', vName]).then(
            function (res) {
                $("#editEnvPopup").hide();
                $(document).unbind("keypress");
            }, session_global.log);
    }
    else {
        $("#deleteThisEnv").blur();
    }
});

//evolution checkbox
$("#isEvolute").change(function(){
    $("#evolutionDiv").toggle();
});




//start simulation button
// TODO
// define environment evolution here
$("#startSimulIcon").click(function(){
    //get all environment variables
    var env = localData.env;

    //get variables that will evolute
    var envEvo = [];
    for(var vName in env){
        if(env[vName].hasOwnProperty("isEvolute") && env[vName]["isEvolute"] == "true"){
            envEvo.push(vName);
            // env[vName].value = env[vName].range[0];  //change variable value to rangeFrom
        }
    }

    //start simulation
    var interval = 1000; //1s
    // setInterval(function(){
    //     for(var j in envEvo){
    //
    //     }
    // },interval);
    var incre = [3,2,1,-1,-2,-4];   //array of increment
    var i=0;
    var increLength = incre.length;

    console.log("begin simulation");
    $("#progressbar").css("display",'inline-block');
    $("#progressbar").progressbar({max:100});
    $("#startSimulIcon").hide();
    
    (function(){
        if(i<increLength -1){

            for(var j in envEvo){
                var vName = envEvo[j];
                env[vName].value = parseInt(env[vName].value)+incre[i];
            }
            i++;
            setTimeout(arguments.callee, interval);
        }
        else{  //last evolution
            for(var j in envEvo){
                var vName = envEvo[j];
                env[vName].value = parseInt(env[vName].value)+incre[i];
            }
            console.log("end simulation");
            //change env in server
            session_global.call('sdlSCI.data.changeEnv', ['update', env]).then(
                function (res) {
                    $("#progressbar").css("display",'none');
                    $("#startSimulIcon").show();
                }, session_global.log);
        }
        updateEnv();
        $("#progressbar").progressbar("option", "value", (100/increLength)*i);
    })();
});

//update environment variables list
function updateEnv(){
    var htmlContent = "";
    for(var k in localData.env){
        var VName = k;
        htmlContent += "<div class='objClassDiv' ondblclick='dblclickEnv(this)' id='env_"+k+"'>"+ VName+" : "+localData.env[k]['value'] +"</div>";
    }
    $("#envVars").html(htmlContent);
}


//subscribe procedures
function onChangeEnv(args){
    var type = args[0];
    var affectedEnv = args[1];

    if(type == "add") {
        if(localData.env == undefined){
            localData.env = {};
        }
        for(var i in affectedEnv){
            localData.env[i] = affectedEnv[i];
        }
    }
    else if(type == "delete"){
        delete localData.env[affectedEnv];
    }
    else if(type == "update"){
        for(var i in affectedEnv){
            localData.env[i] = affectedEnv[i];
        }
    }

    updateEnv();
}