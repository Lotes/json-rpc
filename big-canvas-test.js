var parser = require("./big-canvas-types");
var fs = require("fs");

fs.readFile("big-canvas.types", "utf8", function (err,data) {
  if (err) {
    return console.log(err);
  }
  try {
    console.log(JSON.stringify(parser.parse(data), null, 2));
  } catch(ex) {
    console.log(ex);
  }
});