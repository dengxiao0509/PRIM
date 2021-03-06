$("#addObjClassPopup").draggable();
$("#newNodePopup").draggable();
$("#editNodePopup").draggable();

//add new variable icon in addObjClass and editNodePopup
$("#addVarIcon").click(function(){
    var container = document.getElementById("newVar");
    var nodeDiv = newVarRow();
    container.appendChild(nodeDiv);
});

$("#addVarIconEditNode").click(function(){
    var container = document.getElementById("editNodeVars");
    var nodeDiv = newVarRow();
    container.appendChild(nodeDiv);
});



//add env vars icon in addObjClass and editNodePopup
$("#nodeClassAddEnvVarIcon").click(function(){
    $("#envEditDiv").toggle("slow");
});

$("#editNodeAddEnvVarIcon").click(function(){
    $("#editNodeEnvEditDiv").toggle("slow");
});


function resetAddNodeClassForm(isEdit) {
    //isEdit =  false : clear all fields
    //true : clear all fields except Name and Shape
    if (!isEdit) {
        $('#nodeName').val('');
        $('#dot').prop("checked", true);
        updateEnvForNodeForm();
    }

    $('#EMdes').val('');
    $('#newVar').html();
    var container = document.getElementById("newVar");

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function dblclickObjClass(target){
    return false;
}


var clicks = 0;
var timer = null;

//click one object class label : double click (edit object class)or single click(create new object)
function clickObjClassLabel(target) {
    var DELAY = 700;

    clicks++;  //count clicks

    if (clicks === 1) { //perform single-click action

        timer = setTimeout(function () {

            clicks = 0;                   //after action performed, reset counter

            if(isConnectSDL) {
                var ncId = target.id;

                $("#nodeClassId").val(ncId);

                //create a new object
                $("#newNodeFormMsg").html("");
                $('#newNodeName').val("");
                $('#newNodeDS').val("");
                closeAllPopup();
                $("#newNodePopup").show();
                enterToSubmit("saveNewNode");
            }
            else {
                alert("To create nodes, please connect to SDL server first...");
            }
        }, DELAY);

    }
    else { //perform double-click action

        clearTimeout(timer);    //prevent single-click action
        clicks = 0;             //after action performed, reset counter

        var ncId = target.id;
        var data = localData.nodeClasses[ncId];

        resetAddNodeClassForm(false);
        $('#nodeFormTitle').html('Edit an object class');
        closeAllPopup();
        $('#addObjClassPopup').show();
        $("#nodeFormMsg").html("");
        enterToSubmit("savebt");

        $('#nodeName').val(data.label);
        var shape = data.shape;

        $('#nodeId').val(ncId);

        //doesn't trigger change event
        $('#' + shape).prop("checked", true);

        //EM
        if (shape == 'dot') {
            $('#EMdes').val(data.description);

            var container = document.getElementById("newVar");

            for(var vName in data.variables) {

                if(vName == "env"){
                    for(var t in data.variables["env"]){
                        $("#nodeEnvVars option[value='"+data.variables["env"][t]+"']").prop("selected",true);
                    }
                }
                else
                {
                    var nodeDiv = document.createElement("div");
                    nodeDiv.setAttribute("class","row");

                    var nodeInput1 = document.createElement("input");
                    nodeInput1.setAttribute("placeholder","Name");
                    nodeInput1.setAttribute("type","text");
                    nodeInput1.setAttribute("value",vName);

                    var nodeInput2 = document.createElement("input");
                    nodeInput2.setAttribute("placeholder","Value");
                    nodeInput2.setAttribute("type","text");
                    nodeInput2.setAttribute("value",data.variables[vName]);

                    var nodeImg = document.createElement("img");
                    nodeImg.setAttribute("class","deleteVarIcon");
                    nodeImg.setAttribute("onclick","deleteNewVar(this)");
                    nodeImg.setAttribute("src",'image/delete.png');
                    nodeImg.setAttribute("width",'16px');
                    nodeImg.setAttribute("title",'delete this variable');

                    nodeDiv.appendChild(nodeInput1);
                    nodeDiv.appendChild(nodeInput2);
                    nodeDiv.appendChild(nodeImg);

                    container.appendChild(nodeDiv);
                }
            }

        }
        //user
//        else if (shape == 'square') {
//            $('#alVal').val(data.authoritylevel);
//        }
        else {
            console.log('no shape info got');
        }

        $("#deleteThis").show();

    }
}


/////////////////////////////////////////////////////////////////////////////////////
///////////////////////////// buttons in Popups /////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

// -------------------- newNodePopup ----------------------------------//

//save button
$("#saveNewNode").click(function () {

    var newN_label = $("#newNodeName").val();

    if ($('#newNodeName').val().replace(/ /g, '') == "") {
        $("#newNodeFormMsg").html("Please give it a name...");
        return;
    }

    var data = $("#nodeClassId").val();
    var newNC = localData.nodeClasses[data];
    var newN = {};
    var htmlContent = " <div>";
    newN.label = newN_label;
    htmlContent += "<div>" + "label" + ": " + newN_label + "</div>";

    newN.id = (Math.random() * 1e7).toString(32);
    newN.id = newN.id.replace(/\./g, "0");
    newN.devicestate = $("#newNodeDS").val();

    for (var key in newNC) {
        if (key == "label" || key == "id") continue;
        if (newNC[key]) {
            newN[key] = newNC[key];
            if (key == "description" || key == "variables") {
                if (key == "variables") {
                    htmlContent += "<div> --- " + key + " --- </div>";
                    for (var k in newNC["variables"]) {
                        htmlContent += "<div>" + k + " : " + newNC["variables"][k] + "</div>";
                    }
                }
                else {
                    htmlContent += "<div>" + key + " : " + newNC[key] + "</div>";
                }
            }
        }
    }
    htmlContent += "</div>";

    newN.title = htmlContent;
    //position of new node
    newN.x = Math.floor(Math.random() * (200 - (-200))) + (-200);;
    newN.y = -200;

    // msg: waitting....
    $("#saveNewNode").prop("disabled", true);
    $("#saveNewNode").val("Processing...");
    $("#cancelNewNode").hide();

    //send create AE cmd to SDL server
    session_global.call('sdlSCI.data.create_AE', [newN]).then(
        function (res) {
            //TODO
            //if not valid by SDL server
            //show error message
        }, session_global.log);
});

//cancel button
$("#cancelNewNode").click(function(){
    $("#newNodePopup").hide();
    $("#nodeClassId").val("");
    $("#thisNodeID").val("");
    $(document).unbind("keypress");
});



// -------------------- editNodePopup ----------------------------------//

//save button
$("#saveEditNode").click(function(){
    var newN_label = $("#editNodeName").val();
    if ($('#editNodeName').val().replace(/ /g, '') == ""){
        $("#editNodeFormMsg").html("Please give it a name...");
        return;
    }

    var nodeId = $("#editNodeID").val();
    var data = localData.nodes.get(nodeId);
    data.label = newN_label;
    data.devicestate = $("#editNodeDS").val();
    data.description = $("#editNodeDes").val();

    data.variables = {};
    var varRows = document.getElementById("editNodeVars").getElementsByTagName('div');
    for (var i = 0; i < varRows.length; i++) {
        var vName = varRows[i].getElementsByTagName('input')[0].value;
        var vValue = varRows[i].getElementsByTagName('input')[1].value;
        data.variables[vName] = vValue;
    }

    var envs = $("#editNodeEnvVars").val() || [];
    if (envs.length > 0) {
        data.variables["env"] = [];
        for (var t in envs) {
            data.variables["env"].push(envs[t]);
        }
    }

    var htmlContent = " <div>";

    for (var key in data) {

        if (data[key]) {
            if (key == "label" || key == "devicestate" || key == "description" || key == "variables") {
                if (key == "variables") {
                    htmlContent += "<div> --- " + key + " --- </div>";
                    for (var k in data["variables"]) {
                        htmlContent += "<div>" + k + " : " + data["variables"][k] + "</div>";
                    }
                }
                else {
                    htmlContent += "<div>" + key + " : " + data[key] + "</div>";
                }
            }
        }
    }
    htmlContent += "</div>";

    data.title = htmlContent;
    data.shadow = false;

    localData.nodes.update(data);
    var select = [];
    select[0] = data.id;
    network.selectNodes(select);

    //change data in server, call remote function

    session_global.call('sdlSCI.data.changeData', ['node', 'update', data]).then(
        function (res) {
            $("#editNodeID").val("");
            $("#editNodePopup").hide();
            $(document).unbind("keypress");
            updateObjList();
        }, session_global.log);

});

//cancel button
$("#cancelEditNode").click(function(){
    $(document).unbind("keypress");
    $("#editNodePopup").hide();
});



// -------------------  addObjClassPopup -------------------------------//

//update env vars in node class form
function updateEnvForNodeForm(){
    var htmlContent = "";
    for(var i in localData.env){
        htmlContent += "<option value='"+i+"'>"+i+"</option>";
    }
    $("#nodeEnvVars").html(htmlContent);
    $("#editNodeEnvVars").html(htmlContent);
    $("#nodeEnvVars option:selected").removeAttr("selected");
    $("#editNodeEnvVars option:selected").removeAttr("selected");
}

//open popup
$("#addObjClassIcon").click(function(){
    closeAllPopup();
    $("#addObjClassPopup").show();
    enterToSubmit("savebt");

    resetAddNodeClassForm(false);
    $('#nodeFormTitle').html('Add an object class');
    $('#nodeId').val("");
    $("#deleteThis").hide();
    $("#envEditDiv").hide();
});

//save button
$("#savebt").click(function () {

    var data = getNodeInputData();

    if($('#nodeId').val() != ""){
        data.id = $('#nodeId').val();
    }

    if($("#nodeFormTitle").html().includes("Add")) {
        //add node class in server, call remote function
        session_global.call('sdlSCI.data.changeNodeClass', ["add", data]).then(
            function (res) {
                $("#addObjClassPopup").hide();
                $(document).unbind("keypress");
            },session_global.log);

    }
    else if($("#nodeFormTitle").html().includes("Edit")) {
        session_global.call('sdlSCI.data.changeNodeClass', ['update', data]).then(
            function (res) {
                $("#addObjClassPopup").hide();
                $(document).unbind("keypress");
            }, session_global.log);
    }
    else {
        console.log($("#nodeFormTitle").html());
    }
});

//cancel button
$('#cancelbt').click(function () {
    $('#addObjClassPopup').css("display", "none");
    $(document).unbind("keypress");
});

//delete button in the addObjectClassPopup
$("#deleteThis").click(function(){

    var ncId = $("#nodeId").val();

    if(confirm("Are you sure that you want to delete this node class?") && ncId != ""){


        delete localData.nodeClasses[ncId];

        var data = {};
        data.id = ncId;

        session_global.call('sdlSCI.data.changeNodeClass', ['delete', data]).then(
            function (res) {
                $("#addObjClassPopup").hide();
                $(document).unbind("keypress");
            }, session_global.log);
    }
    else {
        $("#deleteThis").blur();
    }
});





//get all fields in addObjClass Popup
function getNodeInputData() {

    //if label is empty or contains only spaces
    if ($('#nodeName').val().replace(/ /g, '') == "") {
        $("#nodeFormMsg").html("You must fill all the fields with * ");
        return null;
    }
    else {
        var data = {};
        data.id = (Math.random() * 1e7).toString(32);
        data.id = data.id.replace(/\./g,"0");
        data.label = $('#nodeName').val();
        var newShape = $('input:radio[name=nodeShapes]:checked').val();
        data.shape = newShape;
        data.size = 20;
        //AE
        if (newShape == 'dot') {
            data.description = $('#EMdes').val();

            data.variables = {};

            var envs = $("#nodeEnvVars").val() || [];
            if(envs.length > 0){
                var envArray = [];
                for(var i in envs){
                    envArray.push(envs[i]);
                }
                data.variables["env"] = envArray;
            }

            var varRows = document.getElementById("newVar").getElementsByTagName('div');
            for (var i = 0; i < varRows.length; i++) {
                var vName = varRows[i].getElementsByTagName('input')[0].value;
                var vValue = varRows[i].getElementsByTagName('input')[1].value;
                data.variables[vName] = vValue;
                //                    console.log(vName);
            }

            var htmlContent = " <div>";
            for (var key in data) {
                if (key !== "label" && key !== "description" && key !== "variables") continue;
                if (data[key]) {
                    htmlContent += "<div>" + key + " : " + data[key] + "</div>";
                }
            }
            htmlContent += "</div>";
            data.title = htmlContent;
        }
        //user
        //            else if (newShape == 'square') {
        //                data.authoritylevel = $('#alVal').val();
        //
        //                var htmlContent = " <div>";
        //                for (var key in data) {
        //                    if (key !== "label" && key !== "authoritylevel") continue;
        //                    if (data[key]) {
        //                        htmlContent += "<div>" + key + " : " + data[key] + "</div>";
        //                    }
        //                }
        //                htmlContent += "</div>";
        //
        //                data.title = htmlContent;
        //            }
        else {
            console.log('no node shape detected');
        }

        return data;
    }
}

//change node(object) position event handler
function dragEndEventHandler(params) {
    var dragedNodeIDs = params.nodes;
    if(dragedNodeIDs.length > 0) {
        var dragedNodePos =  network.getPositions(dragedNodeIDs);
        session_global.call('sdlSCI.data.updateNodePosition', [dragedNodePos]).then(
            session_global.log, session_global.log);
    }

}


//update node class list
function updateExistingObjClass(){
    var htmlContent = "";
    for(var k in localData.nodeClasses){
        var nodeName = localData.nodeClasses[k]["label"];
        htmlContent += "<div class='objClassDiv' ondblclick='dblclickObjClass(this)' onclick='clickObjClassLabel(this)' id='"+k+"'>"+ nodeName +"</div>";
    }
    $("#existingObj").html(htmlContent);
}


//subscribe procedures
function onChangeObj(args) {
    var type = args[0];
    var event = args[1];
    var affectedItem = args[2];
    var msgValide = args[3];

    if (type === 'node') {
        if (event === 'add') {
            if (msgValide == "ok") {
                //success
                if (localData.nodes.get(affectedItem.id) == null) {
                    localData.nodes.add(affectedItem);
                }
                updateObjList();
                if ($("#newNodePopup").css("display") !== "none") {
                    $("#nodeClassId").val("");
                    $("#newNodePopup").hide();
                    $(document).unbind("keypress");
                    $("#saveNewNode").prop("disabled", false);
                    $("#saveNewNode").val("Save");
                    $("#cancelNewNode").show();
                }
            }
            else {
                //error
                if ($("#newNodePopup").css("display") !== "none") {
                    console.log("failed creating nodes :" + msgValide);
                    $("#newNodeFormMsg").html("Failed creating node in SDL server.");
                    $("#saveNewNode").prop("disabled", false);
                    $("#saveNewNode").val("Save");
                    $("#cancelNewNode").show();
                }
            }
        }
        else if (event === 'remove') {
            var itemId;
            for (itemId in affectedItem.nodes) {
                if (localData.nodes.get(affectedItem.nodes[itemId])) {
                    localData.nodes.remove(affectedItem.nodes[itemId]);
                }
            }
            for (itemId in affectedItem.edges) {
                if (localData.allEdges.get(affectedItem.edges[itemId])) {
                    localData.allEdges.remove(affectedItem.edges[itemId]);
                }
            }
            for (i in affectedItem.rules) {
                if (localData.rules.hasOwnProperty(affectedItem.rules[i])) {
                    delete localData.rules[affectedItem.rules[i]];
                }
            }
            updateExistingRules();
        }
        else if (event === 'update') {
            if (localData.nodes.get(affectedItem.id)) {
                localData.nodes.update(affectedItem);
            }
        }
        else {
            console.log('event unknown :', event);
        }
    }
    else {
        console.log('Type of affected item unknown');
    }
}

function onUpdatePos(args){
    var nodePos = args[0];
    if(args) {
        for (var k in nodePos) {

            console.log(localData.nodes[k]);
            localData.nodes.update({id:k,x:nodePos[k]["x"],y:nodePos[k]["y"]});

        }
    }

}

function onchangeNodeClass(args){
    var type = args[0];
    var affectedNodeClass = args[1];

    if(type == "add") {
        localData.nodeClasses[affectedNodeClass.id] = affectedNodeClass;
    }
    else if(type == 'update') {
        localData.nodeClasses[affectedNodeClass.id] = affectedNodeClass;
    }
    else if(type == "delete"){
        delete localData.nodeClasses[affectedNodeClass.id];
    }
    updateExistingObjClass();

}