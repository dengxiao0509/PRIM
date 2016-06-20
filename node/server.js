///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('autobahn');
var fs = require('fs');
var path = require('path');
var cmd_createCP = './myscript.sh';
var spawn = require('child_process').spawn;
var process_child;
var currentSDLBytes = 0;


var file_path = "/tmp/data.txt";
// var rules_path = "/tmp/rules.txt";
var users_path = "/tmp/users.txt";
var cmds_path = "/tmp/cmds.txt";
var pidAndNodeId_path  = '/tmp/pid_nodeId.txt';
var sessions_path = '/tmp/savedSessions';


var connection = new autobahn.Connection({
        url: process.argv[2],   //127.0.0.1:9000
        realm: process.argv[3], //realm1
        authmethods:["wampcra"],
        authid: process.argv[4],
        onchallenge: onchallenge
    }
);

//initialize variables from files
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

if(fs.existsSync(file_path)) {
    var data_json = fs.readFileSync(file_path, 'utf8');
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


var sessions = (getSessions() == null) ? [] : getSessions();
var currentSession = "untitled";

function onchallenge(session,method,extra) {
    // console.log('onchallenge',method,extra);
    if(method === 'wampcra') {
        // console.log("authenticating via '" + method + "' and challenge '" + extra.challenge + "'");
        return autobahn.auth_cra.sign(process.argv[5], extra.challenge);
    } else {
        throw "don't know how to authenticate using '" + method + "'";
    }
}


////////  connection to child process ---- SDL server /////////////////////////////////////

var file_path_trace = '/tmp/trace.txt';

////  clear the file trace.txt every time   ////
//if(fs.existsSync(file_path_trace)) {
    fs.writeFile(file_path_trace, '', function (err) {
        if (err) {
            return console.log(err);
        }
    });
//}


//if(fs.existsSync(cmds_path)) {
    fs.writeFile(cmds_path, '', function (err) {
        if (err) {
            return console.log(err);
        }
    });
//}

//if(fs.existsSync(file_path)) {
    fs.writeFile(file_path, '', function (err) {
        if (err) {
            return console.log(err);
        }
    });
//}



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

//create a child process and listen to stdout and stderr events  => append them to an external file trace.txt
function connectSDL() {

    //create a child process

    // unbuffering stdin stdout and stderr: nodejs will execute child process with non interactive terminal, and stdout maybe buffered
    // ps, interactive terminal: stdout buffer will flush out while reaching'\n'
    // process_child = spawn('stdbuf',['-i0','-o0','-e0',TEST]);

    process_child = spawn(cmd_createCP);

    var w = fs.watch(file_path_trace,function (event,filename) {
        if (event == "change") {
            //console.log("Go sent");
            SendCMD_Go();
            w.close();
        }
    });

    if(process_child) {
        //listen to stdout events of child process
        process_child.stdout.on('data', function (data) {

            //append child process stdout to external file
            fs.appendFile(file_path_trace, data, function (err) {
                if (err) {
                    return console.log(err);
                }
                //get file size
                var fileStat = fs.statSync(file_path_trace);
                // console.log(stats.size);
                currentSDLBytes = fileStat.size;

            });


        });


        //listen to stderr events of child process
        process_child.stderr.on('data', function (data) {
            console.log('stderr : ' + data);
        });



        return "ok";

    }
    else {
        return "error";
    }
}


function executeSavedCmds(targetCmds){

    //console.log("called");


    //read cmds from cmds.txt and execute them one by one
    if(fs.existsSync(targetCmds)){
        var fileContent = fs.readFileSync(targetCmds);
        fileContent = fileContent.toString();
        // console.log("$"+fileContent+"$"+fileContent.replace(/\s/g,'').length);

        if (fileContent.replace(/\s/g,'') != "") {

            // var cmdArray = fileContent.split("\n");
            var cmdArray = fileContent.match(/[^\r\n]+/g);

            var cmdNum = cmdArray.length;
            console.log('Saved cmds number : '+cmdNum);

            if(cmdArray.length > 0) {

                var i=0;
                if(cmdArray[i].replace(/\s/g,'') != "") {
                    console.log(cmdArray[i]);
                    writeCmd(cmdArray[i] + "\n");
                }

                var w = fs.watch(file_path_trace,function (event,filename) {
                    if (event == "change") {
                        i++;
                        if(i == cmdNum) {
                            SendCMD_Go();
                            w.close();
                        }
                        else {
                            if(cmdArray[i].replace(/\s/g,'') != "") {
                                console.log(cmdArray[i]);
                                writeCmd(cmdArray[i] + "\n");
                            }
                        }

                    }
                });
            }
            // if(cmdArray.length > 0) {
            //     for (var i in cmdArray) {
            //
            //         if(cmdArray[i].replace(/\s/g,'') != ""){
            //             console.log(cmdArray[i]);
            //             writeCmd(cmdArray[i] + "\n");
            //         }
            //     }
            //
            //     SendCMD_Go();
            // }
        }
    }
    else {
        console.log("cmds.txt not found");
    }
    return "ok";
}

//send cmd "GO" to child process
function SendCMD_Go(args) {

    fs.appendFile(file_path_trace, "GO ", function(err) {
          if(err) {
              return console.log(err);
          }
    });



    //write cmd "GO" to child process stdin
    process_child.stdin.write("GO \n");
    // var w = fs.watch(file_path_trace,function (event,filename) {
    //     if (event == "change") {
    //         fs.appendFile(file_path_trace, "GO ", function(err) {
    //             if(err) {
    //                 return console.log(err);
    //             }
    //         });
    //         w.close();
    //     }
    // });
    //console.log("Go sent");

}


//send cmd of creating a new EM to child process
function create_EM (args) {

    //cmd of creating a new EM
    var cmd = "Output-To Add_EM ('"+args[0]+"',"+args[1]+"') EM_Admin \n";

    fs.appendFile(file_path_trace, cmd, function(err) {
        if(err) {
            return console.log(err);
        }
    });

    //write cmd to child process stdin
    process_child.stdin.write(cmd);
    process_child.stdin.write("\n");

    // fs.appendFile(file_path_trace, "GO ", function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    // });

    process_child.stdin.write("GO \n");

}

function check_SDL_output_Pid(text){

    //get Pid from text
     var re = /CREATE\s(.+)\n/;
     var found = text.match(re);

     if(found == null) return null;
     else return found[1];

}

function sendCmd(cmd){

    fs.appendFileSync(file_path_trace, cmd);
    fs.appendFileSync(cmds_path, cmd);


    //write cmd to child process stdin
    process_child.stdin.write(cmd);

    //wait until the create AE command execution finished
    var w = fs.watch(file_path_trace,function (event,filename) {
        if (event == "change") {
            //console.log("Go sent");
            SendCMD_Go();
            w.close();
        }
    });

    // SendCMD_Go();
}

//write saved cmds to child process
function writeCmd(cmd){
    fs.appendFileSync(file_path_trace, cmd);

    //write cmd to child process stdin
    process_child.stdin.write(cmd);
}


function listProcess(){
    var cmd = "List-Process - \n";

    fs.appendFile(file_path_trace, cmd, function(err) {
        if(err) {
            return console.log(err);
        }
    });

    //write cmd to child process stdin
    process_child.stdin.write(cmd);
    process_child.stdin.write("\n");

    process_child.stdin.write("GO \n");

}

function examineVariable(){
    var cmd = "Examine-Variable ( Builder list_AE \n";

    fs.appendFile(file_path_trace, cmd, function(err) {
        if(err) {
            return console.log(err);
        }
    });

    //write cmd to child process stdin
    process_child.stdin.write(cmd);
    process_child.stdin.write("\n");

    process_child.stdin.write("GO \n");

}

//define nodes
/*
var nodes = {
    '1': {id: 1, label: 'Node 1'},
    '2': {id: 2, label: 'Node 2'},
    '3': {id: 3, label: 'Node 3'},
    '4': {id: 4, label: 'Node 4'},
    '5': {id: 5, label: 'Node 5'}
};

//define edges
var edges = {
    '13': {id :'13', from: 1, to: 3},
    '12': {id :'12', from: 1, to: 2},
    '24': {id :'24', from: 2, to: 4},
    '25': {id :'25', from: 2, to: 5}
};

var data = {
    nodes: nodes,
    edges: edges
};*/


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

    fs.createReadStream(file_path).pipe(fs.createWriteStream(sessions_path+'/'+sName+"/data.txt"));
    fs.createReadStream(cmds_path).pipe(fs.createWriteStream(sessions_path+'/'+sName+"/cmds.txt"));
    fs.createReadStream(pidAndNodeId_path).pipe(fs.createWriteStream(sessions_path+'/'+sName+"/pid_nodeId.txt"));

    sessions.push(sName);

    currentSession = sName;

    return 'ok';

}

function getSessions(){
    if (!fs.existsSync(sessions_path)){
        fs.mkdirSync(sessions_path);
    }

    var sessions = getDirectories(sessions_path);
    console.log("sessions :"+sessions);
    return sessions;
}

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

function changeSession(args){
    var newSess = args[0];

    //open an existing session
    if(newSess != null) {
        //find necessary files
        if (fs.existsSync(sessions_path + "/" + newSess) && fs.lstatSync(sessions_path + "/" + newSess).isDirectory()) {
            var targetData = sessions_path + "/" + newSess + "/data.txt";
            var targetCmds = sessions_path + "/" + newSess + "/cmds.txt";
            var targetPid = sessions_path + "/" + newSess + "/pid_nodeId.txt";

            if (fs.existsSync(targetData) && fs.existsSync(targetCmds) && fs.existsSync(targetPid)) {

                //clear trace
                if (fs.existsSync(file_path_trace)) {
                    fs.writeFileSync(file_path_trace, '');
                }

                if (process_child) {
                    process_child.kill();
                }
                process_child = spawn(cmd_createCP);

                connectSDL();

                //copy files to main directory and replace old ones if exists
                if (fs.existsSync(file_path)) {
                    fs.unlinkSync(file_path);
                }
                if (fs.existsSync(cmds_path)) {
                    fs.unlinkSync(cmds_path);
                }
                if (fs.existsSync(pidAndNodeId_path)) {
                    fs.unlinkSync(pidAndNodeId_path);
                }
                try {
                    fs.createReadStream(targetData).pipe(fs.createWriteStream(file_path));
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

                //execute saved cmds
                setTimeout(function () {
                    executeSavedCmds(targetCmds);
                }, 2000);

                return data;
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
        if (fs.existsSync(file_path_trace)) {
            fs.writeFileSync(file_path_trace, '');
        }

        //clear pid_nodeId
        if (fs.existsSync(pidAndNodeId_path)) {
            fs.writeFileSync(pidAndNodeId_path, '');
        }
        NodeId_Pid = {};

        //clear data
        if (fs.existsSync(file_path)) {
            fs.writeFileSync(file_path, '');
        }

        data = {nodeClasses: {}, nodes: {}, edges: {}, rules: {}, env: {}, users: users, currentSession :"untitled"};


        //clear cmds
        if (fs.existsSync(cmds_path)) {
            fs.writeFileSync(cmds_path, '');
        }

        if (process_child) {
            process_child.kill();
        }
        process_child = spawn(cmd_createCP);

        connectSDL();

        return data;

    }
    
}

// function checkFolderExists(foldPath){
//
//         // Is it a directory?
//         if (stats.isDirectory()) {
//             return true;
//         }
//         else {
//             return false;
//         }
//
// }

/*
////  clear the file data.txt every time   ////
if(fs.existsSync(file_path)) {
    fs.writeFile(file_path, '', function (err) {
        if (err) {
            return console.log(err);
        }
    });

}
*/
// var data = {nodes: {}, edges: {}};



//////////////////////////////////////////////


connection.onopen = function (session) {

    console.log("server connected");


    function create_AE(args){

        var newNode = args[0];
        var name = newNode.label;
        var nodeId = newNode.id;
        var nodeDes = (newNode.description == undefined) ? "" : newNode.description;

        //cmd to create an AE
        var cmd = "Output-To Create_AE('"+name+"','"+nodeDes+"',0,0) Builder \n";

        bytesStart = currentSDLBytes;

        //solution 1: wait 2 seconds
        // setTimeout(function() {
        //
        //     var result;
        //     var msgValid;
        //
        //     // var text = readTrace();
        //
        //     fs.open(file_path_trace, 'r',function(err,fd){
        //         console.log("reading file begins ...：");
        //         var buf = new Buffer(1024 * 5);
        //         var bytes = fs.readSync(fd, buf, 0, buf.length, bytesStart);
        //         console.log(bytes + "  bytes readed");
        //
        //         if (bytes > 0) {
        //             var text = buf.slice(0, bytes).toString();
        //             console.log(text);
        //             //get Pid
        //             if (text) {
        //                 var Pid = check_SDL_output_Pid(text);
        //                 console.log("Pid =" + Pid);
        //                 if (Pid == null) {
        //                     console.log("Couldn't get Pid");
        //                     msgValid = "no pid found";
        //                 }
        //                 else {
        //                     NodeId_Pid[nodeId] = Pid;
        //                     msgValid = "ok";
        //                 }
        //             }
        //         }
        //         else {
        //             console.log("empty trace read");
        //             msgValid = 'empty trace read';
        //         }
        //         var res = ["node","add",newNode,msgValid];
        //         changeData(res);  //add node
        //     });
        // },2000);

        //solution 2: listen on file change
        var w = fs.watch(file_path_trace,function (event,filename) {
            if(event == "change"){
                var result;
                var msgValid;

                //console.log("file changed");

                fs.open(file_path_trace, 'r',function(err,fd){
                    console.log("reading file begins ...：");
                    var buf = new Buffer(1024 * 5);
                    var bytes = fs.readSync(fd, buf, 0, buf.length, bytesStart);
                    console.log(bytes + "  bytes readed");

                    if (bytes > 0) {
                        var text = buf.slice(0, bytes).toString();
                        // console.log(text);
                        //check whether output is ready
                        //TODO

                        //if ready ,try to get Pid
                        var Pid = check_SDL_output_Pid(text);
                        console.log("Pid =" + Pid);
                        if (Pid == null) {
                           console.log("Couldn't get Pid");
                           msgValid = "no pid found";
                        }
                        else {
                           NodeId_Pid[nodeId] = Pid;
                            updatePidAndNodeIdFile();
                           msgValid = "ok";
                            w.close();
                            var res = ["node","add",newNode,msgValid];
                            changeData(res);  //add node
                        }

                        //else, return
                    }
                    else {
                        console.log("empty trace read");
                        return;
                    }

                });
            }
        });

        sendCmd(cmd);

        // listProcess();
        // examineVariable();
        
    }


    // REGISTER a procedure for remote calling
    //
    function getData() {
        // console.log("getData() called");
        if(fs.existsSync(file_path)) {
            var data_json = fs.readFileSync(file_path, 'utf8');
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
        return data;
    }

    session.register('sdlSCI.data.getData', getData).then(
        function (reg) {
            console.log("procedure getData() registered");
        },
        function (err) {
            console.log("failed to register procedure: " + err);
        }
    );


    // REGISTER a procedure for remote calling
    //
    //args : type(node or edge),event[,array of affected objects]
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
                /*
            else if(type === 'edge'){
                if(event === 'add'){
                    data.edges[affectedItem.id] = affectedItem;
                    // console.log(affectedItem.from,' + ',affectedItem.to);
                }
                else if(event === 'remove'){
                    var itemId;
                    for(itemId in affectedItem.edges){
                        delete  data.edges[affectedItem.edges[itemId]];
                    }

                }
                else if(event === 'update'){
                    data.edges[affectedItem.id] = affectedItem;
                }
            }
            */


            if(msgValid == "ok") {

                //publish the change data event
                session.publish("sdlSCI.data.onChange", args);

                //write data to external file .txt
                var data_json = JSON.stringify(data);

                //clear file content
                fs.writeFile(file_path, '', function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    // console.log("The file was cleared!");
                });

                fs.writeFile(file_path, data_json, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    // console.log("The file was saved!");
                });
            }

            return 'ok';
        }
        else {
            console.log('3 args needed for function changeDate');
        }
    }

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
        fs.writeFile(file_path, '', function(err) {
            if(err) {
                return console.log(err);
            }
        });

        fs.writeFile(file_path, data_json, function(err) {
            if(err) {
                return console.log(err);
            }
        });
        }

        //publish the update
        session.publish("sdlSCI.data.onUpdatePos", args);
    }

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
        fs.writeFile(file_path, '', function(err) {
            if(err) {
                return console.log(err);
            }
            // console.log("The file was cleared!");
        });

        fs.writeFile(file_path, data_json, function(err) {
            if(err) {
                return console.log(err);
            }
            // console.log("The file was saved!");
        });
    }

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
            fs.writeFile(file_path, '', function(err) {
                if(err) {
                    return console.log(err);
                }
                // console.log("The file was cleared!");
            });

            fs.writeFile(file_path, data_json, function(err) {
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
            fs.writeFile(file_path, '', function(err) {
                if(err) {
                    return console.log(err);
                }
            });

            fs.writeFile(file_path, data_json, function(err) {
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

    

    //subscribe functions used to communicate with child process
    //

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

    session.register('sdlSCI.data.create_EM', create_EM).then(
        function (reg) {
            console.log("procedure create_EM() registered");
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




