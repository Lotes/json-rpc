var parser = require("./json-rpc-parser");

var Generator = function(schemeText) {
  try {
    var definitions = parser.parse(schemeText);
  } catch(ex) {
    console.log(ex);
  }
};

module.exports = Generator;