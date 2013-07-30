var parser = require("./json-rpc-parser");

var Generator = function(schemeText) {
  try {
    var definitions = parser.parse(schemeText);
    console.log(JSON.stringify(definitions, null, 2));
    
    var interfaceDefinitions = {};
    var typeDefinitions = {};
    var i;
    
    //check for duplicate types/interfaces
    for(i=0; i<definitions.length; i++) {
      var def = definitions[i];
      var name = def.name;
      if(def.typeKind == "interface") {
        if(name in interfaceDefinitions)
          throw new Error("Interface '"+name+"' already exists!");
        interfaceDefinitions[name] = def;
      } else {
        if(name in typeDefinitions)
          throw new Error("Type '"+name+"' already exists!");
        typeDefinitions[name] = def;
      }
    }
    
    //build types
    //base type: BOOLEAN, STRING, FLOAT, INTEGER, VOID, STRUCT, LIST
    var types = {
      Boolean: {
        baseType: "BOOLEAN",
        validate: function(obj) { 
          return typeof(obj) === "boolean"; 
        }
      },
      String: {     
        baseType: "STRING",
        validate: function(obj) { 
          return typeof(obj) === "string"; 
        }
      },
      Float: {
        baseType: "FLOAT",
        validate: function(obj) { 
          return typeof(obj) === "number"; 
        }
      },
      Integer: {
        baseType: "INTEGER",
        validate: function(obj) { 
          return typeof(obj) === "number" 
                 && Math.floor(obj) === obj; 
        }
      },
      Void: {
        baseType: "VOID",
        validate: function(obj) { 
          return typeof(obj) === "undefined"; 
        }
      }
    };
    for(var name in typeDefinitions)
      types[name] = {}; 
    function resolveType(name) {
      if(name in types)
			  return types[name];
		  else
			  throw new Error("Could not resolve type '"+name+"'.");
    }
    function Type(name, definition) {
      switch(definition.typeKind) {
        case "enum":
          var values = definition.values;
          this.validate = function(obj) {
            for(var i=0; i<values.length; i++)
              if(obj === values[i])
                return true;
            return false;
          };
          break;
        case "alias":
          break;
        case "struct":
          break;
      }
    }  
    for(var name in typeDefinitions)
      types[name].__proto__ = new Type(name, typeDefinitions[name]);  
      
    //result
    this.Types = types;
    /*
    Result:
    this.Types.Point.validate(obj) returns Boolean
              .TileId.validate(obj) ...
    new this.Interfaces.Main.ServerStub(implementation)
    new this.Interfaces.Main.ClientStub(implementation)
    */
  } catch(ex) {
    console.log(ex);
  }
};

module.exports = Generator;