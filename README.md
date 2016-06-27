How to install

Before installing

To run and develop this application, first you need to ensure that all the following software is installed correctly and works well:

•Crossbar.io

Crossbar.io is a networking platform for distributed and microservice applications, implementing the open Web Application Messaging Protocol (WAMP).


You can download it from its website http://crossbar.io/. When successful, the installation will have created a crossbar command line tool, the path to the crossbar executable will depend on your environment. You can then verify the install by running ‘crossbar version’, which lists the software versions of important Crossbar.io components


•Node.js

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.

To install it and to know how it works with crossbar.io, see: 

“Getting started with JavaScript in Nodejs” :  http://crossbar.io/docs/Getting-started-with-NodeJS/



•ibmRationalSDL

This is used to create SDL server stimulation. To install it, just download the compressed file, uncompressing it and put it in a directory, remember the path. 





Begin to install 


1.Download the install package from Github, then uncompressing it to a directory.

https://github.com/dengxiao0509/PRIM.git



*In this package you have the source code and all the JavaScript libraries needed.

You could find the structure of this package later in the documentation.



2.Change the path ‘../ibmRationalSDL/bin/telelogic.profile’ in file “/PRIM/node/myscript.sh” to yours.


3.Open the terminal and go to the path ../PRIM. Run command ‘crossbar start’.


Make sure no errors appearing in terminal. At the end you should see several procedures registered messages.


4.Open a navigator (Chrome or Firefox), go to address localhost:8080.



That it!



*Please make sure you have access to Internet. Because we need some online JavaScript source.


