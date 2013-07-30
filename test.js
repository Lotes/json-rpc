var Generator = require("./json-rpc-generator");
var fs = require("fs");

fs.readFile("big-canvas.types", "utf8", function (err,data) {
  if (err) {
    return console.log(err);
  }
  try {
    var generator = new Generator(data);
    //generator.ServerStub
    //generator.ClientStub
  } catch(ex) {
    console.log(ex);
  }
});