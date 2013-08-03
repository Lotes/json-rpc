json-rpc
========

json-rpc is a small framework for object validation and remote procedure calls.

Dependencies: Backbone.js, Underscore.js.

Makefile
--------
* compile the parser for the definition file with "make compile"
* load dependencies with "make init"
* run the tests with "make run"

Examples
========
The definition file
-------------------
  interface Test {
    function add(a: Integer, b: Integer): Integer;
    event onAdd(a: Integer, b: Integer, result: Integer);
  }
  type BigInteger = String in /^[+-]?[0-9]+$/
  struct Point {
    x: BigInteger;
    y: BigInteger;
  }

Create an stub generator
------------------------
  //create a stub generator
  var Generator = require("./json-rpc-generator");
  var generator = new Generator(definition);
  //"definition" is the text of the definition file
  
Object validation
-----------------
  generator.Types.Point.validate({
    x: "1234",
    y: "5678"
  }); //returns true
  
  generator.Types.Point.validate({
    x: "1234"
  }); //returns false
  
  generator.Types.Point.validate({
    x: 1234,
    y: 5678
  }); //returns false
  
Remote Procedure calls
----------------------  
  //create client and server stub
  var client = new generator.Interfaces.Test.Client({
    //client-side implementation of all events
    onAdd: function(a, b, result) { 
      console.log("EVENT: "+a+" + "+b+" = "+result); 
    }
  });
  var server = new generator.Interfaces.Test.Server({
    //server-side implementation of all remote functions
    add: function(a, b, callback) {
      var result = a + b;
      callback(null, result); //returns the result
      //send an event to an arbitrary client
      var event = server.onAdd(a, b, result);      
      client.receive(event);
    }
  });

  //connect server with client stub
  client.on("send", function(obj) { server.receive(obj); });
  server.on("send", function(obj) { client.receive(obj); });

  //the remote procedure call
  client.add(1, 2, function(err, result) {
    if(err)
      console.log(err);
    else
      console.log("Result: "+result);
  }); //returns "Result: 3"