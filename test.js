var Generator = require("./json-rpc-generator");
var fs = require("fs");

fs.readFile("big-canvas.types", "utf8", function (err,data) {
  if (err) {
    return console.log(err);
  }
  try {
    var generator = new Generator(data);
    
    var testCases = [
      { type: "ActionType", object: "BRUSH", result: true },
      { type: "ActionType", object: "UNDO", result: false },
      { type: "BigInteger", object: "1234", result: true },
      { type: "BigInteger", object: "-56789", result: true },
      { type: "BigInteger", object: "5abc", result: false },
      { type: "BigInteger", object: "+13579", result: true },
      { type: "StrokeWidth", object: 1, result: true },
      { type: "StrokeWidth", object: 100, result: true },
      { type: "StrokeWidth", object: 101, result: false },
      { type: "StrokeWidth", object: 50, result: true },
      { type: "StrokeWidth", object: "70", result: false },
      { type: "ActionIds", object: ["70", "-100", "50"], result: true },
      { type: "ActionIds", object: ["70", 50, "+abc"], result: false },
      { type: "Point", object: {x: "0", y: "-1"}, result: true },
      { type: "Point", object: {x: 0, y: -1}, result: false },
    ];
    
    for(var i=0; i<testCases.length; i++) {
      var type = testCases[i].type;
      var object = testCases[i].object;
      var result = generator.Types[type].validate(object);
      var answer = result ? "Yes" : "No";
      var passed = result == testCases[i].result ? "Passed" : "FAILED";
      console.log("Is "+JSON.stringify(object)+" a '"+type+"'? "
                  +answer+". "+passed+".");
    }
    
    //generator.ServerStub
    //generator.ClientStub
  } catch(ex) {
    console.log(ex);
  }
});