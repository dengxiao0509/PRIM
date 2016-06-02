///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////

var autobahn = require('autobahn');
var fs = require('fs');
var cmd_createCP = './myscript.sh';
var spawn = require('child_process').spawn;
var process_child;

var file_path = "/tmp/data.txt";
// var rules_path = "/tmp/rules.txt";
var users_path = "/tmp/users.txt";

var connection = new autobahn.Connection({
        url: process.argv[2],   //127.0.0.1:9000
        realm: process.argv[3], //realm1
        authmethods:["wampcra"],
        authid: process.argv[4],
        onchallenge: onchallenge
    }
);

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
if(fs.existsSync(file_path_trace)) {
    fs.writeFile(file_path_trace, '', function (err) {
        if (err) {
            return console.log(err);
        }
    });

}


//create a child process and listen to stdout and stderr events  => append them to an external file trace.txt
function connectSDL(args) {

    //create a child process

    // unbuffering stdin stdout and stderr: nodejs will execute child process with non interactive terminal, and stdout maybe buffered
    // ps, interactive terminal: stdout buffer will flush out while reaching'\n'
    // process_child = spawn('stdbuf',['-i0','-o0','-e0',TEST]);

    process_child = spawn(cmd_createCP);


    //listen to stdout events of child process
    process_child.stdout.on('data',function(data){
        console.log('stdout :'+data);

        //append child process stdout to external file
        fs.appendFile(file_path_trace, data, function(err) {
            if(err) {
                return console.log(err);
            }
        });

    });

    //listen to stderr events of child process
    process_child.stderr.on('data', function(data){
        console.log('stderr : '+data);
    });
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


    // REGISTER a procedure for remote calling
    //
    function getData() {
        // console.log("getData() called");
        data.users = users;
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
            if(type === 'node') {
                if(event === 'add'){
                    data.nodes[affectedItem.id] = affectedItem;     //change the data
                }
                else if(event === 'remove'){
                    //affectedItem is an array of selected nodes, and referring edges and rules
                    var itemId;
                    for(itemId in affectedItem.nodes)
                    {
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

        }
        else {
            console.log('2 args needed for function changeEnv');
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

 //function used to change rules file

};



connection.open();




