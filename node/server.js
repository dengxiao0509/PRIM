///////////////////////////////////////////////////////////////////////////////
//  NodeJS application
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('autobahn');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

//script used to run SDL server
var cmd_createCP = './myscript.sh';

var process_child;
var currentSDLBytes = 0;

//data base files' pathes
var data_path = "/tmp/data.txt";
var users_path = "/tmp/users.txt";
var cmds_path = "/tmp/cmds.txt";
var trace_path= '/tmp/trace.txt';
var pidAndNodeId_path  = '/tmp/pid_nodeId.txt';
var sessions_path = '/tmp/savedSessions';

//connect to WAMP router
var connection = new autobahn.Connection({
        url: process.argv[2],   //127.0.0.1:9000
        realm: process.argv[3], //realm1
        authmethods:["wampcra"],
        authid: process.argv[4],
        onchallenge: onchallenge
    }
);

// ----------  initialize variables from text files  ----------//

//users
if(fs.existsSync(users_path)) {
    var users_json = fs.readFileSync(users_path, 'utf8');
    if(users_json == "") {
        var users = {};
    }
    else {
        var users = JSON.parse(users_json);
    }
}
else {
    var users = {};
}

//data :  nodes, edges, nodeClasses, rules, environment variables
if(fs.existsSync(data_path)) {
    var data_json = fs.readFileSync(data_path, 'utf8');
    if(data_json == "") {
        var data = {nodeClasses:{},nodes:{},edges:{},rules:{},env:{}};
    }
    else {
        var data = JSON.parse(data_json);
    }
}
else {
    var data = {nodeClasses:{},nodes:{},edges:{},rules:{},env:{}};
}

// correspondances between node ids(graph) and pids (SDL server)
if(fs.existsSync(pidAndNodeId_path)) {
    var NodeId_Pid_json = fs.readFileSync(pidAndNodeId_path, 'utf8');
    if(NodeId_Pid_json == "") {
        var NodeId_Pid = {};
    }
    else {
        var NodeId_Pid = JSON.parse(NodeId_Pid_json);
    }
}
else {
    var NodeId_Pid = {};
}

//get saved sessions
var sessions = (getSessions() == null) ? [] : getSessions();
//current session name
var currentSession = "untitled";
//boolean : is connected to SDL server or not
var isConnectSDL = false;

//authentication
function onchallenge(session,method,extra) {
    if(method === 'wampcra') {
        return autobahn.auth_cra.sign(process.argv[5], extra.challenge);
    } else {
        throw "don't know how to authenticate using '" + method + "'";
    }
}

// --------  clean the text files if existe, if not create them --------//
fs.writeFile(trace_path, '', function (err) {
    if (err) {
        return console.log(err);
    }
});

fs.writeFile(cmds_path, '', function (err) {
    if (err) {
        return console.log(err);
    }
});

fs.writeFile(data_path, '', function (err) {
    if (err) {
        return console.log(err);
    }
});


//update node_pid.txt
function updatePidAndNodeIdFile(){
    if(fs.existsSync(pidAndNodeId_path)) {
        fs.writeFile(pidAndNodeId_path, '', function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }
    fs.writeFile(pidAndNodeId_path, JSON.stringify(NodeId_Pid), function (err) {
        if (err) {
            return console.log(err);
        }
    });

}


//use regular expression to find pid from a text
function check_SDL_output_Pid(text){

    //get Pid from text
     var re = /CREATE\s(.+)\n/;
     var found = text.match(re);

     if(found == null) return null;
     else return found[1];

}




// ------- functions sending commands to SDL server ----------//

//create a child process(SDL server)
//and listen to its stdout and stderr events  => append them to a file called trace.txt
function connectSDL() {

    // unbuffering stdin stdout and stderr: nodejs will execute child process with non interactive terminal, and stdout maybe buffered
    // ps, interactive terminal: stdout buffer will flush out while reaching'\n'
    // process_child = spawn('stdbuf',['-i0','-o0','-e0',cmd_createCP]);

    process_child = spawn(cmd_createCP);

    var w = fs.watch(trace_path,function (event,filename) {
        if (event == "change") {
            setTimeout(SendCMD_Go,500);   //wait 500ms then send command Go to trace.txt and child process
            w.close();
        }
    });

    if(process_child) {
        //listen to stdout events of child process
        process_child.stdout.on('data', function (data) {

            //append child process stdout to external file
            fs.appendFile(trace_path, data, function (err) {
                if (err) {
                    return console.log(err);
                }
                //get file size.
                //remember the read pointer position for next reading
                var fileStat = fs.statSync(trace_path);
                currentSDLBytes = fileStat.size;
            });
        });


        //listen to stderr events of child process
        process_child.stderr.on('data', function (data) {
            console.log('stderr : ' + data);
        });

        isConnectSDL = true;

        return "ok";
    }
    else {
        return "error";
    }
}

//send cmd "GO" to child process and write to trace.txt
function SendCMD_Go(args) {

    fs.appendFileSync(trace_path, "GO \n");

    //write cmd "GO" to child process stdin
    process_child.stdin.write("GO \n");
}

//write a command to child process and to trace.txt, then execute 'GO'
function sendCmd(cmd){

    var w;
    fs.appendFileSync(cmds_path, cmd);

    fs.appendFileSync(trace_path, cmd);

    //wait until the create AE command execution finished
    w = fs.watch(trace_path,function (event,filename) {
        if (event == "change") {
            console.log("file change");
            setTimeout(SendCMD_Go,500);
            w.close();
        }
    });

    //write cmd to child process stdin
    process_child.stdin.write(cmd);
}




// --------  functions about sessions  ----------------//
//return sessions by checking existance of directories
function getSessions(){
    if (!fs.existsSync(sessions_path)){
        fs.mkdirSync(sessions_path);
    }

    var sessions = getDirectories(sessions_path);
    console.log("sessions :"+sessions);
    return sessions;
}

//get sub directories in a folder
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

//write an array of commands to child process stdin,
// and redirect child process stdout to trace.txt
function executeSavedCmds(targetCmds){

    //read cmds from cmds.txt and execute them one by one
    if(fs.existsSync(targetCmds)){
        var fileContent = fs.readFileSync(targetCmds);
        fileContent = fileContent.toString();

        if (fileContent.replace(/\s/g,'') != "") {

            var cmdArray = fileContent.match(/[^\r\n]+/g);

            var cmdNum = cmdArray.length;
            console.log('Saved cmds number : '+cmdNum);

            if(cmdArray.length > 0) {

                var i=0;
                //write first command to child process
                if(cmdArray[i].replace(/\s/g,'') != "") {
                    console.log(cmdArray[i]);
                    fs.appendFileSync(trace_path, cmdArray[i]+"\n");
                    writeNextCmd();
                    //write cmd to child process stdin
                    process_child.stdin.write(cmdArray[i]+"\n");
                }


                //write next command to child process when the stdout of current command has been appended to trace file,
                //just to keep the trace clear
                function writeNextCmd() {
                    //when trace file content changed, write next cmd to child process
                    var w = fs.watch(trace_path, function (event, filename) {
                        if (event == "change") {
                            i++;
                            if (i == cmdNum) {
                                SendCMD_Go();
                                w.close();
                            }
                            else {
                                if (cmdArray[i].replace(/\s/g, '') != "") {
                                    console.log(cmdArray[i]);
                                    w.close(); //close this watch because fs.appendFileSync() below will trigger it
                                    fs.appendFileSync(trace_path, cmdArray[i]+"\n");
                                    writeNextCmd();
                                    //write cmd to child process stdin
                                    process_child.stdin.write(cmdArray[i]+"\n");
                                }
                            }

                        }
                    });
                }
            }
        }
    }
    else {
        console.log("cmds.txt not found");
    }
    return "ok";
}


connection.onopen = function (session) {

    console.log("server connected");

    // ---------- REGISTER procedures for remote calling -----------

    //get data from data.txt and return initial data to browser
    function getData() {
        // console.log("getData() called");
        if(fs.existsSync(data_path)) {
            var data_json = fs.readFileSync(data_path, 'utf8');
            if(data_json == "") {
                var data = {nodeClasses:{},nodes:{},edges:{},rules:{},env:{}};
            }
            else {
                var data = JSON.parse(data_json);
            }
        }
        else {
            var data = {nodeClasses:{},nodes:{},edges:{},rules:{},env:{}};
        }

        data.users = users;
        data.currentSession = currentSession;
        data.isConnectSDL = isConnectSDL;
        return data;
    }

    //add/update/remove object in data.txt and publish change object event to browsers
    //args : type(node or edge),event[,array of affected objects,msgvalid]
    function changeData(args) {
        // console.log("change data called");
        if(args.length >= 3){
            var type = args[0];
            var event = args[1];
            var affectedItem = args[2];
            var msgValid = args[3];
            if(msgValid == undefined) {
                msgValid = "ok";
            }
            if(type === 'node') {
                if(event === 'add'){

                    // var result = create_AE([affectedItem.label,affectedItem.id,affectedItem.description]);
                    // console.log("result = "+result);
                    // if(result == 'ok'){
                    if(msgValid == "ok") {
                        data.nodes[affectedItem.id] = affectedItem;     //change the data
                    }
                    //TODO if couldn't find pid?
                    else {
                        console.log(msgValid);
                    }
                    // }
                    // else if(result == 'error'){
                    //     console.log("Cannot create AE in SDL Server.");
                        // return "error";
                    // }
                    // else {
                    //     console.log("no result defined");
                    // }
                }
                else if(event === 'remove'){
                    //affectedItem is an array of selected nodes, and referring edges and rules
                    var itemId;
                    for(itemId in affectedItem.nodes)
                    {
                        console.log("#"+affectedItem.nodes[itemId]);
                        console.log(data.nodes);
                        delete  data.nodes[affectedItem.nodes[itemId]];
                    }
                    for(itemId in affectedItem.edges){
                        delete  data.edges[affectedItem.edges[itemId]];
                    }
                    for(itemId in affectedItem.rules){
                        delete data.rules[affectedItem.rules[itemId]];
                    }
                }
                else if(event === 'update'){
                    data.nodes[affectedItem.id] = affectedItem;
                }
            }


            if(msgValid == "ok") {

                //publish the change data event
                session.publish("sdlSCI.data.onChangeObj", args);

                //write data to external file data.txt
                var data_json = JSON.stringify(data);

                fs.writeFile(data_path, '', function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });

                fs.writeFile(data_path, data_json, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });

                return 'ok';
            }


        }
        else {
            console.log('3 args needed for function changeDate');
        }
    }

    //update node positions in data.txt, then publish update node position event
    function updateNodePosition(args){
        var nodePos = args[0];

        //update positions of all nodes in data
        if(nodePos) {
            console.log(nodePos);
            for (var k in nodePos) {
                data.nodes[k]["x"] = nodePos[k]["x"];
                data.nodes[k]["y"] = nodePos[k]["y"];
            }


        //update file data.txt
        //write data to external file .txt

        var data_json = JSON.stringify(data);

        //clear file content
        fs.writeFile(data_path, '', function(err) {
            if(err) {
                return console.log(err);
            }
        });

        fs.writeFile(data_path, data_json, function(err) {
            if(err) {
                return console.log(err);
            }
        });
        }

        //publish the update
        session.publish("sdlSCI.data.onUpdatePos", args);
    }

    //add/update/remove node classes in data.txt and publish change node class event
    function changeNodeClass(args){
        // console.log("changeNodeClass ");
        var type = args[0];
        var affectedNodeClass = args[1];
        if(type == "add") {
            data.nodeClasses[affectedNodeClass.id] = affectedNodeClass;
        }
        else if(type == "update") {
            data.nodeClasses[affectedNodeClass.id] = affectedNodeClass;
        }
        else if(type == "delete"){
            delete  data.nodeClasses[affectedNodeClass.id];
        }

        // publish the add new node class event
        session.publish("sdlSCI.data.onchangeNodeClass", args);

        //write data to external file .txt
        var data_json = JSON.stringify(data);

        //clear file content
        fs.writeFile(data_path, '', function(err) {
            if(err) {
                return console.log(err);
            }
            // console.log("The file was cleared!");
        });

        fs.writeFile(data_path, data_json, function(err) {
            if(err) {
                return console.log(err);
            }
            // console.log("The file was saved!");
        });
    }

    //add/update/remove rules in data.txt and publish change rule event
    function changeRule(args){

        if(args.length >= 3){
            var event = args[0];
            var affectedItem = args[1];
            var affectedEdges = args[2];

            if (event === 'add') {
                //add rule
                data.rules[affectedItem.id] = affectedItem;
                //add edges
                for(var i in affectedEdges) {
                    data.edges[affectedEdges[i].id] = affectedEdges[i];
                }
            }
            else if (event === 'delete') {

                delete  data.rules[affectedItem.id];
                for(var i in affectedEdges) {
                    console.log(affectedEdges[i]);
                    delete data.edges[affectedEdges[i]];
                }

            }
            else if (event === 'update') {
                data.rules[affectedItem.id] = affectedItem;
                for(var i in affectedItem.edges){
                    var eId = affectedItem.edges[i];
                    data.edges[eId].color = affectedItem.color;
                    data.edges[eId].title = affectedItem.name;
                }
            }

            //publish the change data event
            session.publish("sdlSCI.data.onChangeRule", args);

            //write data to external file .txt
            var data_json = JSON.stringify(data);

            //clear file content
            fs.writeFile(data_path, '', function(err) {
                if(err) {
                    return console.log(err);
                }
                // console.log("The file was cleared!");
            });

            fs.writeFile(data_path, data_json, function(err) {
                if(err) {
                    return console.log(err);
                }
                // console.log("The file was saved!");
            });

        }
        else {
            console.log('3 args needed for function changeRule');
        }

    }

    //add/update/remove environment variables in data.txt and publish change environment event
    function changeEnv(args) {
        if(args.length >= 2){
            var event = args[0];
            var affectedEnv = args[1];

            if (event === 'add') {
                if(data.env == undefined){
                    data.env = {};
                }
                //add env vars

                //check whether variable name already exist
                for(var i in affectedEnv){
                    if(data.env.hasOwnProperty(i)){
                        return "rename_"+i;
                    }
                }

                for(var i in affectedEnv){
                    data.env[i] = affectedEnv[i];
                }
            }
            else if (event === 'delete') {
                delete  data.env[affectedEnv];
            }
            else if (event === 'update') {
                for(var i in affectedEnv){
                    data.env[i] = affectedEnv[i];
                }
            }

            //publish the change data event
            session.publish("sdlSCI.data.onChangeEnv", args);

            //write data to external file .txt
            var data_json = JSON.stringify(data);

            //clear file content
            fs.writeFile(data_path, '', function(err) {
                if(err) {
                    return console.log(err);
                }
            });

            fs.writeFile(data_path, data_json, function(err) {
                if(err) {
                    return console.log(err);
                }
            });
            return "ok";
        }
        else {
            console.log('2 args needed for function changeEnv');
            return "error";
        }
    }

    //save session
    //create a session folder, then copy data.txt, cmds.txt and node_pid.txt to session directory
    //publish change session name event
    function saveSession(args){
        var sName = args[0];
        var isOverWrite = (args[1] == undefined)? false : args[1];

        //if this session name already exists
        if(sessions.indexOf(sName) != -1 && !isOverWrite){
            return "exists";
        }

        if(isOverWrite) {
            //remove files
            if (fs.existsSync(sessions_path+'/'+sName+"/data.txt")) {
                fs.unlinkSync(sessions_path+'/'+sName+"/data.txt");
            }
            if (fs.existsSync(sessions_path+'/'+sName+"/cmds.txt")) {
                fs.unlinkSync(sessions_path+'/'+sName+"/cmds.txt");
            }
            if (fs.existsSync(sessions_path+'/'+sName+"/pid_nodeId.txt")) {
                fs.unlinkSync(sessions_path+'/'+sName+"/pid_nodeId.txt");
            }
        }
        else{
            fs.mkdirSync(sessions_path+'/'+sName);
        }
        //copy data.txt cmds.txt and pid_nodeId.txt to new folder named by sName

        fs.createReadStream(data_path).pipe(fs.createWriteStream(sessions_path+'/'+sName+"/data.txt"));
        fs.createReadStream(cmds_path).pipe(fs.createWriteStream(sessions_path+'/'+sName+"/cmds.txt"));
        fs.createReadStream(pidAndNodeId_path).pipe(fs.createWriteStream(sessions_path+'/'+sName+"/pid_nodeId.txt"));

        sessions.push(sName);

        currentSession = sName;

        session.publish("sdlSCI.session.onChangeSessionName",[sName]);

        return "ok";

    }

    //change session
    //open a session : copy files from session directory to /tmp, reinitialize, then publish change session event to browsers
    //create a new session : clean files in /tmp, reinitialize, then publish
    function changeSession(args){
        var newSess = args[0];
        // console.log(newSess != null);
        //open an existing session
        if(newSess != null) {
            //find necessary files
            if (fs.existsSync(sessions_path + "/" + newSess) && fs.lstatSync(sessions_path + "/" + newSess).isDirectory()) {
                var targetData = sessions_path + "/" + newSess + "/data.txt";
                var targetCmds = sessions_path + "/" + newSess + "/cmds.txt";
                var targetPid = sessions_path + "/" + newSess + "/pid_nodeId.txt";

                if (fs.existsSync(targetData) && fs.existsSync(targetCmds) && fs.existsSync(targetPid)) {

                    //clear trace
                    if (fs.existsSync(trace_path)) {
                        fs.writeFileSync(trace_path, '');
                    }

                    // if (process_child) {
                    //     process_child.kill();
                    // }

                    connectSDL();

                    //copy files to main directory and replace old ones if exists
                    if (fs.existsSync(data_path)) {
                        fs.unlinkSync(data_path);
                    }
                    if (fs.existsSync(cmds_path)) {
                        fs.unlinkSync(cmds_path);
                    }
                    if (fs.existsSync(pidAndNodeId_path)) {
                        fs.unlinkSync(pidAndNodeId_path);
                    }
                    try {
                        fs.createReadStream(targetData).pipe(fs.createWriteStream(data_path));
                        fs.createReadStream(targetCmds).pipe(fs.createWriteStream(cmds_path));
                        fs.createReadStream(targetPid).pipe(fs.createWriteStream(pidAndNodeId_path));
                    } catch (e) {
                        console.log(e);
                    }


                    if (fs.existsSync(targetPid)) {
                        var NodeId_Pid_json = fs.readFileSync(targetPid, 'utf8');
                        if (NodeId_Pid_json == "") {
                            NodeId_Pid = {};
                        }
                        else {
                            NodeId_Pid = JSON.parse(NodeId_Pid_json);
                        }
                    }
                    else {
                        NodeId_Pid = {};
                    }
                    // console.log(NodeId_Pid);

                    if (fs.existsSync(targetData)) {
                        var data_json = fs.readFileSync(targetData, 'utf8');
                        if (data_json == "") {
                            data = {nodeClasses: {}, nodes: {}, edges: {}, rules: {}, env: {}};
                        }
                        else {
                            data = JSON.parse(data_json);
                        }
                    }
                    else {
                        data = {nodeClasses: {}, nodes: {}, edges: {}, rules: {}, env: {}};
                    }

                    data.users = users;
                    data.currentSession = newSess;
                    currentSession = newSess;
                    data.isConnectSDL = isConnectSDL;

                    //execute saved cmds
                    setTimeout(function () {
                        executeSavedCmds(targetCmds);
                    }, 2000);

                    session.publish("sdlSCI.session.onChangeSession",[data]);

                    return "ok";
                }
                else {
                    return "filesError";
                }
            }
            else {
                return "dirError";
            }
        }
        //create a new session
        else {

            //clear trace
            if (fs.existsSync(trace_path)) {
                fs.writeFileSync(trace_path, '');
            }

            //clear pid_nodeId
            if (fs.existsSync(pidAndNodeId_path)) {
                fs.writeFileSync(pidAndNodeId_path, '');
            }
            NodeId_Pid = {};

            //clear data
            if (fs.existsSync(data_path)) {
                fs.writeFileSync(data_path, '');
            }

            data = {nodeClasses: {}, nodes: {}, edges: {}, rules: {}, env: {}, users: users, currentSession :"untitled"};


            //clear cmds
            if (fs.existsSync(cmds_path)) {
                fs.writeFileSync(cmds_path, '');
            }

            // if (process_child) {
            //     process_child.kill();
            // }
            //process_child = spawn(cmd_createCP);

            connectSDL();

            data.isConnectSDL = isConnectSDL;

            session.publish("sdlSCI.session.onChangeSession",[data]);

            return "ok";

        }

    }

    //*********************** EXTENTABLE **************************************
    //////  create AE in SDL server, remote procedure called by browser
    //if valid, call function to change data in server
    //if not, return not valid
    function create_AE(args){

        var newNode = args[0];
        var name = newNode.label;
        var nodeId = newNode.id;
        var nodeDes = (newNode.description == undefined) ? "" : newNode.description;

        //cmd to create an AE
        var cmd = "Output-To Create_AE('"+name+"','"+nodeDes+"',0,0) Builder \n";

        bytesStart = currentSDLBytes;

        //listen on file change
        var w = fs.watch(trace_path,function (event,filename) {
            if(event == "change"){
                var result;
                var msgValid;

                fs.open(trace_path, 'r',function(err,fd){
                    console.log("reading file begins ...：");
                    var buf = new Buffer(1024 * 5);
                    var bytes = fs.readSync(fd, buf, 0, buf.length, bytesStart);
                    console.log(bytes + "  bytes readed");

                    if (bytes > 0) {
                        var text = buf.slice(0, bytes).toString();

                        //TODO
                        //if got not valid message, stop listening on file change and return not valid
                        //check whether text contains 'error:not valid AE...'

                        //if text doesn't contain 'error:not valid AE...', keep listening and try to find a pid
                        var Pid = check_SDL_output_Pid(text);
                        console.log("Pid =" + Pid);

                        if (Pid == null) {
                            console.log("Couldn't get Pid");
                            msgValid = "no pid found";
                        }
                        else {   //if pid got, stop listening and return valid
                            NodeId_Pid[nodeId] = Pid;
                            updatePidAndNodeIdFile();
                            msgValid = "ok";
                            w.close();
                            var res = ["node","add",newNode,msgValid];
                            changeData(res);  //add node
                        }
                    }
                    else {
                        console.log("empty trace read");
                        return;
                    }

                });
            }
        });
        sendCmd(cmd);

    }

    //TODO
    //here you can add various functions to send commands to SDL server
    //then publish an event or return error according to output of SDL server
    //for example, delete/update object/rule, etc.

    //list process
    function listProcess(){
        var cmd = "List-Process - \n";

        fs.appendFile(trace_path, cmd, function(err) {
            if(err) {
                return console.log(err);
            }
        });

        //write cmd to child process stdin
        sendCmd(cmd);

    }

    //examine variables
    function examineVariable(){
        var cmd = "Examine-Variable ( Builder list_AE \n";

        fs.appendFile(trace_path, cmd, function(err) {
            if(err) {
                return console.log(err);
            }
        });

        //write cmd to child process stdin
        sendCmd(cmd);
    }


    session.register('sdlSCI.data.getData', getData).then(
        function (reg) {
            console.log("procedure getData() registered");
        },
        function (err) {
            console.log("failed to register procedure: " + err);
        }
    );

    session.register('sdlSCI.data.changeData', changeData).then(
        function (reg) {
            console.log("procedure changeData() registered");
        },
        function (err) {
            console.log("failed to register procedure: " + err);
        }
    );

    session.register('sdlSCI.data.updateNodePosition', updateNodePosition).then(
        function (reg) {
            console.log("procedure updateNodePosition() registered");
        },
        function (err) {
            console.log("failed to register procedure updateNodePosition: " + err);
        }
    );

    session.register('sdlSCI.data.changeNodeClass', changeNodeClass).then(
        function (reg) {
            console.log("procedure changeNodeClass() registered");
        },
        function (err) {
            console.log("failed to register procedure changeNodeClass: " + err);
        }
    );

    session.register('sdlSCI.data.changeRule', changeRule).then(
        function (reg) {
            console.log("procedure changeRule() registered");
        },
        function (err) {
            console.log("failed to register procedure changeRule: " + err);
        }
    );

    session.register('sdlSCI.data.changeEnv', changeEnv).then(
        function (reg) {
            console.log("procedure changeEnv() registered");
        },
        function (err) {
            console.log("failed to register procedure changeEnv: " + err);
        }
    );

    session.register('sdlSCI.data.saveSession', saveSession).then(
        function (reg) {
            console.log("procedure saveSession() registered");
        },
        function (err) {
            console.log("failed to register procedure saveSession: " + err);
        }
    );

    session.register('sdlSCI.data.getSessions', getSessions).then(
        function (reg) {
            console.log("procedure getSessions() registered");
        },
        function (err) {
            console.log("failed to register procedure getSessions: " + err);
        }
    );

    session.register('sdlSCI.data.changeSession', changeSession).then(
        function (reg) {
            console.log("procedure changeSession() registered");
        },
        function (err) {
            console.log("failed to register procedure changeSession: " + err);
        }
    );

    

    //register functions used to communicate with child process
    session.register('sdlSCI.data.connectSDL', connectSDL).then(
        function (reg) {
            console.log("procedure connectSDL() registered");
        },
        function (err) {
            console.log("failed to register procedure: " + err);
        }
    );

    session.register('sdlSCI.data.executeSavedCmds', executeSavedCmds).then(
        function (reg) {
            console.log("procedure executeSavedCmds() registered");
        },
        function (err) {
            console.log("failed to register procedure: executeSavedCmds " + err);
        }
    );


    session.register('sdlSCI.data.SendCMD_Go', SendCMD_Go).then(
        function (reg) {
            console.log("procedure SendCMD_Go() registered");
        },
        function (err) {
            console.log("failed to register procedure: " + err);
        }
    );


    session.register('sdlSCI.data.create_AE', create_AE).then(
        function (reg) {
            console.log("procedure create_AE() registered");
        },
        function (err) {
            console.log("failed to register procedure create_AE: " + err);
        }
    );
};

connection.open();




