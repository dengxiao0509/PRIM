var sensors_rule = [];
var effectors_rule = [];

var isAddingRule = false;

$("#addRulePopup").draggable();
$("#addRuleChooseSE").draggable();


/////////////////////////////////////////////////////////////////////////////////////
///////////////////////////// buttons in Popups /////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

// ----------------  addRuleChooseSE popup ----------------- //

//open
$("#addRuleIcon").click(function(){
    closeAllPopup();
    $("#addRuleChooseSE").show();
    $("#ruleSEFormTitle").html("");
    enterToSubmit("doneRuleSE");
    updateObjList();
});

//done button
$("#doneRuleSE").click(function(){

    if($("#sensorList").val() == null || $("#effectorList").val() == null ){
        $("#ruleSEFormMsg").html("You must choose at least one sensor and one actor.");
        return;
    }

    $("#addRuleChooseSE").hide();
    $(document).unbind("keypress");
    $("#addRulePopup").show();

    enterToSubmit("ruleSavebt");

    var sensors = $("#sensorList").val() || [];
    var actors = $("#effectorList").val() || [];

    if(sensors.length > 0 && actors.length > 0) {

        $("#addRulePopup").show();
        $('#ruleFormTitle').html('Add a rule');

        resetRuleForm();
        var sensorsDiv = document.getElementById("sensors");
        var actorsDiv = document.getElementById("actors");

        sensors_rule = [];
        effectors_rule = [];

        for(var i in sensors){

            var sensorItem = localData.nodes.get(sensors[i]);
            var sensorName = sensorItem.label;
            var sensorVars = sensorItem.variables;

            // if(sensorVars.hasOwnProperty("env")) {
            //     delete sensorVars["env"];
            // }

            var sensorId = sensorItem.id;

            sensors_rule.push(sensorId);

            var sensorDiv = document.createElement("div");
            sensorDiv.setAttribute("class","sensorDiv");
            sensorDiv.id = i;

            var snDiv = document.createElement("div");
            snDiv.appendChild(document.createTextNode(sensorName));
            snDiv.setAttribute("class","NameDiv");
            sensorDiv.appendChild(snDiv);

            var varDiv = document.createElement("div");
            varDiv.setAttribute("class","varDiv");


            for(var j in sensorVars){

                if(j == "env"){
                    for(var envVar_i in sensorVars[j]){
                        var temp_varRow = createVarRow(sensorId,sensorVars[j][envVar_i],true);
                        varDiv.appendChild(temp_varRow);
                    }
                }
                else {
                    var temp_varRow = createVarRow(sensorId,j,false);
                    varDiv.appendChild(temp_varRow);
                }
            }

            sensorDiv.appendChild(varDiv);

            sensorsDiv.appendChild(sensorDiv);


        }

        for(var i in actors){

            var actorItem = localData.nodes.get(actors[i]);
            var actorName = actorItem.label;
            var actorVars = actorItem.variables;

            //no environment variables in effectors
            if(actorVars.hasOwnProperty("env")) {
                delete actorVars["env"];
            }
            var actorId = actorItem.id;

            effectors_rule.push(actorId);

            var actorDiv = document.createElement("div");
            actorDiv.setAttribute("class","actorDiv");

            var anDiv = document.createElement("div");
            anDiv.appendChild(document.createTextNode(actorName));
            anDiv.setAttribute("class","NameDiv");
            actorDiv.appendChild(anDiv);

            var varDiv = document.createElement("div");
            varDiv.setAttribute("class","varDiv");
            var temp = 0;
            for(var j in actorVars){
                var varRow = document.createElement("div");
                varRow.setAttribute("class","varRow");
                var varName = document.createElement("input");
                varName.type = "checkbox";
                temp++;
                varName.id = actorId+"_"+temp;
                // varName.value = actorId +"_"+j;
                varName.setAttribute("class","varName");

                var label = document.createElement('label')

                label.htmlFor = actorId+"_"+temp;
                label.appendChild(document.createTextNode(j));


                varRow.appendChild(varName);
                varRow.appendChild(label);

                //when checkbox is checked, show this part
                var checkedShowDiv = document.createElement("div");
                checkedShowDiv.setAttribute("class","checkedShow");

                //equal operator
                //                    var equal = document.createElement("div");
                //                    equal.appendChild(document.createTextNode("="));
                checkedShowDiv.appendChild(document.createTextNode("="));

                //input text
                var val = document.createElement("input");
                val.type = "text";
                val.setAttribute("class","valInput");

                checkedShowDiv.appendChild(val);

                varRow.appendChild(checkedShowDiv);
                varDiv.appendChild(varRow);
            }

            actorDiv.appendChild(varDiv);
            actorsDiv.appendChild(actorDiv);
        }

        $(".varName").change(function(){

            if($(this).prop("checked") == true) {
                $(this).siblings(".checkedShow").show();
            }
            else {
                $(this).siblings(".checkedShow").hide();
            }

        });

        //add edges
        //TODO
    }
    else{
        alert("You need to choose at least one sensor and one actor ...");
    }

});

//cancel button
$("#cancelRuleSE").click(function(){
    $("#addRuleChooseSE").hide();
    $(document).unbind("keypress");
});

//create a variable row in the addRulePopup
function createVarRow(sensor_Id,variable_Name,isEnvVar){
    var varRow = document.createElement("div");
    varRow.setAttribute("class","varRow");

    var temp = 0;

    //variable name and checkbox
    var varName = document.createElement("input");
    varName.type = "checkbox";
    temp++;
    varName.id = sensor_Id+"_"+temp;
    varName.setAttribute("class","varName");


    var label = document.createElement('label')
    if(isEnvVar){
        label.setAttribute("class","envVarLabel");
    }
    label.htmlFor =  sensor_Id+"_"+temp;
    label.appendChild(document.createTextNode(variable_Name));

    varRow.appendChild(varName);
    varRow.appendChild(label);

    //when checkbox is checked, show this part
    var checkedShowDiv = document.createElement("div");
    checkedShowDiv.setAttribute("class","checkedShow");

    //compare operator
    var compSelect = document.createElement("select");
    var opt = document.createElement("option");
    opt.value = "=";
    opt.innerHTML = "=";
    compSelect.appendChild(opt);
    var opt = document.createElement("option");
    opt.value = "!=";
    opt.innerHTML = "!=";
    compSelect.appendChild(opt);
    var opt = document.createElement("option");
    opt.value = ">";
    opt.innerHTML = ">";
    compSelect.appendChild(opt); var opt = document.createElement("option");
    opt.value = "<";
    opt.innerHTML = "<";
    compSelect.appendChild(opt);

    checkedShowDiv.appendChild(compSelect);

    //input text
    var val = document.createElement("input");
    val.type = "text";
    val.setAttribute("class","valInput");

    checkedShowDiv.appendChild(val);

    varRow.appendChild(checkedShowDiv);

    return varRow;
}



// ---------------   addRulePopup  popup ------------------- //

//save button
$("#ruleSavebt").click(function () {

    var isEdit;
    if($("#ruleFormTitle").html().includes("Add")){
        isEdit = false;
    }
    else if($("#ruleFormTitle").html().includes("Edit")){
        isEdit = true;
    }

    var ruleName = $("#ruleName").val();

    var sensorVals = $("#sensors .varName:checked");
    var actorVals = $("#actors .varName:checked");

    if (ruleName.replace(/ /g, '') == "") {
        $("#ruleFormMsg").html("You must give it a name...");
    }
    else if (sensorVals.length == 0 || actorVals.length == 0) {
        $("#ruleFormMsg").html("You must choose at least one variable of sensors and one of actors.");
    }
    else {
        var newRule = {};
        if(isEdit) {
            newRule.id = $("#ruleId").val();
            newRule.user = localData.rules[newRule.id].user;
        }
        else {
            newRule.id = (Math.random() * 1e7).toString(32);
            newRule.id = newRule.id.replace(/\./g, "0");
            newRule.user = user;
        }

        newRule.name = ruleName;
        newRule.color = $("#ruleColor").val();

        var newEdgesObj = [];

        if(!isEdit) {
            var newEdgesIds = [];

            //create edges for the new rule
            for(var s in sensors_rule){
                for(var e in effectors_rule){
                    var newEdge = {};
                    newEdge.id = (Math.random() * 1e7).toString(32);
                    newEdge.from = sensors_rule[s];
                    newEdge.to = effectors_rule[e];
                    newEdge.color = newRule.color;
                    newEdge.title = newRule.name;
                    newEdgesObj.push(newEdge);
                    newEdgesIds.push(newEdge.id);
                }
            }
            newRule.edges = newEdgesIds;
        }
        else{
            newRule.edges = localData.rules[newRule.id].edges.slice();
        }

        newRule.if = {};
        newRule.then = {};

        var checkedSensor = [];

        for (var i = 0; i < sensorVals.length; i++) {

            var temp_id = sensorVals[i].id;
            var t = temp_id.split("_");
            var s = t[0];  //sensor id

            var v =$("#"+temp_id).siblings("label").html();
            console.log(v);
            if(checkedSensor.indexOf(s) == "-1") {
                checkedSensor.push(s);
            }

            //get input value
            var val = $("#" + temp_id).siblings(".checkedShow").children("input").val();
            if (val.replace(/ /g, '') == "") {
                $("#ruleFormMsg").html("You must set a value for checked variables.");
                return;
            }

            //get logical operator
            var lop = $("#" + temp_id).siblings(".checkedShow").children("select").val();

            if (newRule.if[s] == undefined) {
                newRule.if[s] = [];
            }
            newRule.if[s].push([v, lop, val]);
        }

        //check all sensors are checked
        var sensorNum = document.getElementsByClassName("sensorDiv").length;
        if(checkedSensor.length != sensorNum) {
            $("#ruleFormMsg").html("You must check at least 1 value for every sensor.");
            return;
        }

        var checkedActor = [];

        for (var i = 0; i < actorVals.length; i++) {

            var temp_id = actorVals[i].id;
            var t = temp_id.split("_");
            var a = t[0];  //actor id
//                var v = t[1];   // variable name
            var v =$("#"+temp_id).siblings("label").html();

            if(checkedActor.indexOf(a) == "-1") {
                checkedActor.push(a);
            }

            //get input value
            var val = $("#" + temp_id).siblings(".checkedShow").children("input").val();
            if (val.replace(/ /g, '') == "") {
                $("#ruleFormMsg").html("You must set a value for checked variables.");
                return;
            }

            if (newRule.then[a] == undefined) {
                newRule.then[a] = [];
            }
            newRule.then[a].push([v, "=", val]);

        }

        //check all actors are checked
        var actorNum = document.getElementsByClassName("actorDiv").length;
        if(checkedActor.length != actorNum) {
            $("#ruleFormMsg").html("You must check at least 1 value for every actor.");
            return;
        }

        // localData.rules[newRule.id] = newRule;

        //change data in server
        if(!isEdit) {
            var newEdges = [];
            for (var i in newEdgesObj) {
                var e = newEdgesObj[i];
                newEdges.push(e);
            }

            if (session_global) {
                session_global.call('sdlSCI.data.changeRule', ['add', newRule, newEdges]).then(
                    function (res) {
                        $("#addRulePopup").hide();
                        $(document).unbind("keypress");
                        ruleEdges = [];
                    }, session_global.log);

            }
            else {
                console.log("failed: no sesion");
            }
        }
        else {
            //change edge color and title
            for (var i in newRule.edges) {
                var e = newRule.edges[i];
                e.color = newRule.color;
                e.title = newRule.name;
            }

            if (session_global) {
                session_global.call('sdlSCI.data.changeRule', ['update', newRule, null]).then(
                    function (res) {
                        $("#addRulePopup").hide();
                        $(document).unbind("keypress");
                        ruleEdges = [];
                    }, session_global.log);

            }
            else {
                console.log("failed: no sesion");
            }
        }

    }


});

//cancel button
$("#ruleCancelbt").click(function(){
    //delete edges added
//        localData.edges.remove(ruleEdges);
//        ruleEdges = [];
    $("#addRulePopup").hide();
    $(document).unbind("keypress");

});

//delete button
$("#deleteThisRule").click(function () {

    var ruleId = $("#ruleId").val();
    data = localData.rules[ruleId];

    if (confirm("Are you sure that you want to delete this rule ?") && ruleId != "") {

        delete localData.rules[ruleId];

        var deleteRule = {};
        deleteRule.id = ruleId;

        var deleteEdges = [];
        for (var i in data.edges) {
            deleteEdges.push(localData.allEdges.get(data.edges[i]).id);

        }
        // console.log(deleteEdges);

        session_global.call('sdlSCI.data.changeRule', ['delete', deleteRule, deleteEdges]).then(
            function (res) {
                $("#addRulePopup").hide();
                $(document).unbind("keypress");
            }, session_global.log);
    }
    else {
        $("#deleteThisRule").blur();
    }

});

function resetRuleForm() {
    $("#ruleFormMsg").html("");
    $("#ruleName").val("");

    var sensorsDiv = document.getElementById("sensors");
    while (sensorsDiv.firstChild) {
        sensorsDiv.removeChild(sensorsDiv.firstChild);
    }

    var actorsDiv = document.getElementById("actors");
    while (actorsDiv.firstChild) {
        actorsDiv.removeChild(actorsDiv.firstChild);
    }

    $("#deleteThisRule").hide();
    $("#ruleId").val("");

    $("#ruleColor").val("#2B7CE9");


}

//double click on a rule label, open edit rule popup
function dblclickRule(target) {

    var ruleId = target.id;
    var data = localData.rules[ruleId];

    resetRuleForm();
    $("#ruleId").val(ruleId);


    $('#ruleFormTitle').html('Edit a rule');
    $('#addRulePopup').show();
    enterToSubmit("ruleSavebt");

    $('#ruleName').val(data.name);
    $("#ruleColor").val(data.color)


    var sensorsDiv = document.getElementById("sensors");
    var actorsDiv = document.getElementById("actors");

    for (var i in data.if) {

        //i is the id of sensor

        var sensorItem = localData.nodes.get(i);
        var sensorName = sensorItem.label;
        var sensorVars = sensorItem.variables;

        var sensorDiv = document.createElement("div");
        sensorDiv.setAttribute("class", "sensorDiv");
        sensorDiv.id = i;

        var snDiv = document.createElement("div");
        snDiv.appendChild(document.createTextNode(sensorName));
        snDiv.setAttribute("class", "NameDiv");
        sensorDiv.appendChild(snDiv);

        var varDiv = document.createElement("div");
        varDiv.setAttribute("class", "varDiv");

        for (var j in sensorVars) {
            if(j == "env"){
                for(var envVar_i in sensorVars[j]){
                    var temp_varRow = createVarRow(i,sensorVars[j][envVar_i],true);
                    varDiv.appendChild(temp_varRow);
                }
            }
            else {
                var temp_varRow = createVarRow(i,j,false);
                varDiv.appendChild(temp_varRow);
            }
        }

        sensorDiv.appendChild(varDiv);
        sensorsDiv.appendChild(sensorDiv);
    }

    for (var i in data.then) {

        //i is the id of actor

        var actorItem = localData.nodes.get(i);
        var actorName = actorItem.label;
        var actorVars = actorItem.variables;
        //TODO
        if(actorVars.hasOwnProperty("env")) {
            delete actorVars["env"];
        }
        var actorId = actorItem.id;

        var actorDiv = document.createElement("div");
        actorDiv.setAttribute("class", "actorDiv");

        var anDiv = document.createElement("div");
        anDiv.appendChild(document.createTextNode(actorName));
        anDiv.setAttribute("class", "NameDiv");
        actorDiv.appendChild(anDiv);

        var varDiv = document.createElement("div");
        varDiv.setAttribute("class", "varDiv");
        var temp = 0;
        for (var j in actorVars) {
            var varRow = document.createElement("div");
            varRow.setAttribute("class", "varRow");
            var varName = document.createElement("input");
            varName.type = "checkbox";
            varName.id = actorId + "_" + temp;
            varName.name = actorId;
            varName.value = j;
            temp ++;
            varName.setAttribute("class", "varName");

            var label = document.createElement('label')
            label.htmlFor = actorId + "_" + temp;
            label.appendChild(document.createTextNode(j));


            varRow.appendChild(varName);
            varRow.appendChild(label);

            //when checkbox is checked, show this part
            var checkedShowDiv = document.createElement("div");
            checkedShowDiv.setAttribute("class", "checkedShow");

            //equal operator
            checkedShowDiv.appendChild(document.createTextNode("="));

            //input text
            var val = document.createElement("input");
            val.type = "text";
            val.setAttribute("class", "valInput");

            checkedShowDiv.appendChild(val);

            varRow.appendChild(checkedShowDiv);

            varDiv.appendChild(varRow);
        }


        actorDiv.appendChild(varDiv);

        actorsDiv.appendChild(actorDiv);


    }

    $(".varName").change(function () {

        if ($(this).prop("checked") == true) {
            $(this).siblings(".checkedShow").show();
        }
        else {
            $(this).siblings(".checkedShow").hide();
        }

    });

    //check defined variables
    for (var sId in data.if) {
        for (var temp in data.if[sId]) {
            var v = data.if[sId][temp][0];
            var opt = data.if[sId][temp][1];
            var val = data.if[sId][temp][2];

            var target = $(".varName[value='" + v + "'][name='"+sId+"']");

            target.prop("checked", true);
            target.siblings(".checkedShow").show();
            target.siblings(".checkedShow").children("input").val(val);
            target.siblings(".checkedShow").children("select").val(opt);

        }
    }

    for (var aId in data.then) {
        for (var temp in data.then[aId]) {
            var v = data.then[aId][temp][0];
            var opt = data.then[aId][temp][1];
            var val = data.then[aId][temp][2];

            var target =  $(".varName[value='" + v + "'][name='"+aId+"']") ;

            target.prop("checked", true);
            target.siblings(".checkedShow").show();
            target.siblings(".checkedShow").children("input").val(val);
            target.siblings(".checkedShow").children("select").val(opt);

        }
    }

    $("#deleteThisRule").show();
}

//click on a rule label, show edges of this rule
function clickRule(target){
    var ruleId = target.id;
    var data = localData.rules[ruleId];
    if(data) {
        var edgesOfRule = data.edges;
        localData.edges.clear();
        for(var i in edgesOfRule){
            localData.edges.add(localData.allEdges.get(edgesOfRule[i]));
        }
    }else{
        console.log("no corresponded rule found");
    }

}

function updateExistingRules(){
    var htmlContent = "";
    var targetUser = $("#userList").val();

    //hide all edges
    localData.edges.clear();

    if(user == "admin") {
        //show rules belonging to the selected user(s)
        if (targetUser == "all") {
            for (var k in localData.rules) {
                var ruleName = localData.rules[k]["name"];
                htmlContent += "<div class='objClassDiv' ondblclick='dblclickRule(this)' onclick='clickRule(this)'  id='" + k + "'>" + ruleName + "</div>";
            }
            /*
             localData.edges.clear();
             localData.edges.add(localData.allEdges.get());
             */
        }
        else if (targetUser == "allUsers") {
            //var ruleGroup = [];

            for (var k in localData.rules) {
                var ruleItem = localData.rules[k];
                if (ruleItem.user !== "admin") {
                    var ruleName = ruleItem.name;
                    htmlContent += "<div class='objClassDiv' ondblclick='dblclickRule(this)' onclick='clickRule(this)' id='" + k + "'>" + ruleName + "</div>";

                    /*
                     //get all edges of this user's rules
                     for(var e in ruleItem.edges){
                     var eId = ruleItem.edges[e];
                     if(ruleGroup.indexOf(eId) == '-1'){
                     ruleGroup.push(eId);
                     }
                     }
                     */
                }
            }
            /*
             localData.edges.clear();
             localData.edges.add(localData.allEdges.get(ruleGroup));
             */
        }
        else {
            // var ruleGroup = [];
            for (var k in localData.rules) {
                var ruleItem = localData.rules[k];

                if (ruleItem.user == targetUser) {
                    var ruleName = ruleItem.name;
                    htmlContent += "<div class='objClassDiv' ondblclick='dblclickRule(this)' onclick='clickRule(this)' id='" + k + "'>" + ruleName + "</div>";
                }
            }
        }
    }
    else {
        for (var k in localData.rules) {
            var ruleItem = localData.rules[k];

            if (ruleItem.user == user) {
                var ruleName = ruleItem.name;
                htmlContent += "<div class='objClassDiv' ondblclick='dblclickRule(this)' onclick='clickRule(this)' id='" + k + "'>" + ruleName + "</div>";
            }
        }
    }

    $("#existingRules").html(htmlContent);
}

function updateExistingUsers() {
    var htmlContent ="";
    htmlContent += "<option value='all' selected='selected'>All</option><option value='admin'>admin</option><option value='allUsers'>All users</option>";
    for(var k in localData.users){
        var u = localData.users[k];
        if(u !== "admin" && u !== "registerUser"){
            htmlContent += "<option value='"+ u +"'>"+u+"</option>";
        }
    }
    $("#userList").html(htmlContent);
}

$("#userList").change(function(){
    updateExistingRules();
});

$(".vis-connect").hide();


//update Object List
function updateObjList(){
    var htmlContent = "";
    localData.nodes.forEach(function(node){
        htmlContent += "<option value='"+node.id+"'>"+node.label+"</option>";
    });

    $("#sensorList").html(htmlContent);
    $("#effectorList").html(htmlContent);
}


//subscribe procedures
function onChangeRule(args){
    var type = args[0];
    var affectedRule = args[1];
    var affectedEdges = args[2];

    if(type == "add") {
        //add Edges
        for(var i in affectedEdges){
            if (localData.allEdges.get(affectedEdges[i].id) == null) {
                localData.allEdges.add(affectedEdges[i]);
            }
        }
        //add Rule
        localData.rules[affectedRule.id]  = affectedRule;
    }
    else if(type == 'update') {
        localData.rules[affectedRule.id] = affectedRule;
        for(var i in affectedRule.edges){
            var eId = affectedRule.edges[i];
            var e = localData.allEdges.get(eId);
            e.color = affectedRule.color;
            e.title = affectedRule.name;
            localData.allEdges.update(e);
        }
    }
    else if(type == "delete"){
        delete localData.rules[affectedRule.id];
        for(var i in affectedEdges){
            localData.allEdges.remove(affectedEdges[i]);
        }
    }

    updateExistingRules();

}