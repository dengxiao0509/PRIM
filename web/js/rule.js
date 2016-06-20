var sensors_rule = [];
var effectors_rule = [];

var isAddingRule = false;

$("#addRulePopup").draggable();
$("#addRuleChooseSE").draggable();


//begin to choose edges
/*
 $("#addruleBeginIcon").click(function(){
 network.addEdgeMode();
 $("#addruleEndIcon").show();
 $("#addruleCancelIcon").show();

 $(".remindText").css("display","inline-block");
 $("#addruleBeginIcon").hide();

 $("#deleteSelectedIcon").hide();
 isAddingRule = true;
 ruleEdges = [];
 });
 */
/*
 function addEdgesDone(){
 network.disableEditMode();

 //create a rule
 var sensors = [];
 var actors = [];
 for(var i in ruleEdges){
 var edgeItem = localData.edges.get(ruleEdges[i]);
 if(edgeItem){
 if(sensors.indexOf(edgeItem.from) == '-1') {
 sensors.push(edgeItem.from);
 }
 if(actors.indexOf(edgeItem.to) == '-1') {
 actors.push(edgeItem.to);
 }
 }
 }

 if(sensors.length > 0 && actors.length > 0) {

 $("#addRulePopup").show();
 $('#ruleFormTitle').html('Add a rule');

 resetRuleForm();
 var sensorsDiv = document.getElementById("sensors");
 var actorsDiv = document.getElementById("actors");

 for(var i in sensors){

 var sensorItem = localData.nodes.get(sensors[i]);
 var sensorName = sensorItem.label;
 var sensorVars = sensorItem.variables;
 var sensorId = sensorItem.id;

 var sensorDiv = document.createElement("div");
 sensorDiv.setAttribute("class","sensorDiv");
 sensorDiv.id = i;

 var snDiv = document.createElement("div");
 snDiv.appendChild(document.createTextNode(sensorName));
 snDiv.setAttribute("class","NameDiv");
 sensorDiv.appendChild(snDiv);

 var varDiv = document.createElement("div");
 varDiv.setAttribute("class","varDiv");
 var temp = 0;
 for(var j in sensorVars){
 var varRow = document.createElement("div");
 varRow.setAttribute("class","varRow");

 //variable name and checkbox
 var varName = document.createElement("input");
 varName.type = "checkbox";
 temp++;
 varName.id = sensorId+"_"+temp;
 varName.value = j;
 varName.setAttribute("class","varName");


 var label = document.createElement('label')
 label.htmlFor =  sensorId+"_"+temp;
 label.appendChild(document.createTextNode(j));

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


 varDiv.appendChild(varRow);
 }

 sensorDiv.appendChild(varDiv);

 sensorsDiv.appendChild(sensorDiv);


 }

 for(var i in actors){

 var actorItem = localData.nodes.get(actors[i]);
 var actorName = actorItem.label;
 var actorVars = actorItem.variables;
 var actorId = actorItem.id;

 var actorDiv = document.createElement("div");
 actorDiv.setAttribute("class","actorDiv");

 var anDiv = document.createElement("div");
 anDiv.appendChild(document.createTextNode(actorName));
 anDiv.setAttribute("class","NameDiv");
 actorDiv.appendChild(anDiv);

 var varDiv = document.createElement("div");
 varDiv.setAttribute("class","varDiv");
 var temp=0;
 for(var j in actorVars){
 var varRow = document.createElement("div");
 varRow.setAttribute("class","varRow");
 var varName = document.createElement("input");
 varName.type = "checkbox";
 temp++;
 varName.id = actorId+"_"+temp;
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

 }
 else{
 alert("You need to choose at least one sensor and one actor ...");
 }

 $("#addruleBeginIcon").show();
 $("#addruleEndIcon").hide();
 $("#addruleCancelIcon").hide();
 $(".remindText").hide();
 isAddingRule = false;

 }
 */
//add rule icon click
$("#addRuleIcon").click(function(){
    closeAllPopup();
    $("#addRuleChooseSE").show();
    $(document).keypress(function(event){

        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $("#doneRuleSE").click();
            $(document).unbind("keypress");
        }

    });
    updateObjList();
});

function updateObjList(){
    var htmlContent = "";
    localData.nodes.forEach(function(node){
        htmlContent += "<option value='"+node.id+"'>"+node.label+"</option>";
    });

    $("#sensorList").html(htmlContent);
    $("#effectorList").html(htmlContent);
}

//cancel adding rule
$("#cancelRuleSE").click(function(){
    $("#addRuleChooseSE").hide();
    $(document).unbind("keypress");
});

//finish choosing sensors and effectors in the new rule popup
$("#doneRuleSE").click(function(){
    $("#addRuleChooseSE").hide();
    $(document).unbind("keypress");
    $("#addRulePopup").show();
    $(document).keypress(function(event){

        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $("#ruleSavebt").click();
            $(document).unbind("keypress");
        }

    });

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
            //TODO  env affected?
            if(sensorVars.hasOwnProperty("env")) {
                delete sensorVars["env"];
            }
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
            var temp = 0;
            for(var j in sensorVars){
                var varRow = document.createElement("div");
                varRow.setAttribute("class","varRow");

                //variable name and checkbox
                var varName = document.createElement("input");
                varName.type = "checkbox";
                temp++;
                varName.id = sensorId+"_"+temp;
                // varName.value = sensorId + "_" +j;
                varName.setAttribute("class","varName");


                var label = document.createElement('label')
                label.htmlFor =  sensorId+"_"+temp;
                label.appendChild(document.createTextNode(j));

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


                varDiv.appendChild(varRow);
            }

            sensorDiv.appendChild(varDiv);

            sensorsDiv.appendChild(sensorDiv);


        }

        for(var i in actors){

            var actorItem = localData.nodes.get(actors[i]);
            var actorName = actorItem.label;
            var actorVars = actorItem.variables;
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

//finish choosing edges and show new rule form
// $("#addruleEndIcon").click(addEdgesDone);

/*
 $("#addruleCancelIcon").click(function(){
 //delete edges added
 localData.edges.remove(ruleEdges);
 ruleEdges = [];

 $("#addruleBeginIcon").show();
 $("#addruleEndIcon").hide();
 $("#addruleCancelIcon").hide();
 $(".remindText").hide();
 isAddingRule = false;
 network.disableEditMode();
 });
 */
////new or edit rule form buttons
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
//                var v = t[1];   // variable name

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

        localData.rules[newRule.id] = newRule;

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
        console.log(deleteEdges);

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

//double click on a rule label, show edit rule form
function dblclickRule(target) {

    var ruleId = target.id;
    var data = localData.rules[ruleId];

    resetRuleForm();
    $("#ruleId").val(ruleId);


    $('#ruleFormTitle').html('Edit a rule');
    $('#addRulePopup').show();
    $(document).keypress(function(event){

        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $("#ruleSavebt").click();
            $(document).unbind("keypress");
        }

    });

    $('#ruleName').val(data.name);
    $("#ruleColor").val(data.color)


    var sensorsDiv = document.getElementById("sensors");
    var actorsDiv = document.getElementById("actors");

    for (var i in data.if) {

        //i is the id of sensor

        var sensorItem = localData.nodes.get(i);
        var sensorName = sensorItem.label;
        var sensorVars = sensorItem.variables;
        //TODO  env affected?
        if(sensorVars.hasOwnProperty("env")) {
            delete sensorVars["env"];
        }

        var sensorDiv = document.createElement("div");
        sensorDiv.setAttribute("class", "sensorDiv");
        sensorDiv.id = i;

        var snDiv = document.createElement("div");
        snDiv.appendChild(document.createTextNode(sensorName));
        snDiv.setAttribute("class", "NameDiv");
        sensorDiv.appendChild(snDiv);

        var varDiv = document.createElement("div");
        varDiv.setAttribute("class", "varDiv");
        var temp = 0;
        for (var j in sensorVars) {
            var varRow = document.createElement("div");
            varRow.setAttribute("class", "varRow");

            //variable name and checkbox
            var varName = document.createElement("input");
            varName.type = "checkbox";
            temp++;
            varName.id = i + "_" + temp;
            varName.name = i;
            varName.value = j;
            varName.setAttribute("class", "varName");


            var label = document.createElement('label')
            label.htmlFor = i + "_" +temp;
            label.appendChild(document.createTextNode(j));

            varRow.appendChild(varName);
            varRow.appendChild(label);

            //when checkbox is checked, show this part
            var checkedShowDiv = document.createElement("div");
            checkedShowDiv.setAttribute("class", "checkedShow");

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
            compSelect.appendChild(opt);
            var opt = document.createElement("option");
            opt.value = "<";
            opt.innerHTML = "<";
            compSelect.appendChild(opt);

            checkedShowDiv.appendChild(compSelect);

            //input text
            var val = document.createElement("input");
            val.type = "text";
            val.setAttribute("class", "valInput");

            checkedShowDiv.appendChild(val);

            varRow.appendChild(checkedShowDiv);


            varDiv.appendChild(varRow);

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

    //show rules belonging to the selected user(s)
    if(targetUser == "all"){
        for(var k in localData.rules){
            var ruleName = localData.rules[k]["name"];
            htmlContent += "<div class='objClassDiv' ondblclick='dblclickRule(this)' onclick='clickRule(this)'  id='" + k + "'>" + ruleName + "</div>";
        }
        /*
         localData.edges.clear();
         localData.edges.add(localData.allEdges.get());
         */
    }
    else if(targetUser == "allUsers"){
        //var ruleGroup = [];

        for(var k in localData.rules){
            var ruleItem = localData.rules[k];
            if(ruleItem.user !== "admin") {
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
        for(var k in localData.rules){
            var ruleItem = localData.rules[k];

            if(ruleItem.user == targetUser) {
                var ruleName = ruleItem.name;
                htmlContent += "<div class='objClassDiv' ondblclick='dblclickRule(this)' onclick='clickRule(this)' id='" + k + "'>" + ruleName + "</div>";

                /*
                 //get all edges of this user's rules
                 for (var e in ruleItem.edges) {
                 var eId = ruleItem.edges[e];
                 if (ruleGroup.indexOf(eId) == '-1') {
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