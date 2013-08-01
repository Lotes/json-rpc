var parser = require("./json-rpc-parser");

var Generator = function(schemeText) {
  try {
    var definitions = parser.parse(schemeText);
    //console.log(JSON.stringify(definitions, null, 2));
        
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
    function resolveType(name) {
      if(name in types)
			  return types[name];
		  else
			  throw new Error("Could not resolve type '"+name+"'.");
    } 
    for(var i=0; i<definitions.length; i++) {
      var def = definitions[i];
      var name = def.name;
      if(def.typeKind != "interface") {
        if(name in types)
          throw new Error("Type '"+name+"' already exists!");
        switch(def.typeKind) {
          case "enum":
            types[name] = {
              baseType: "STRING",
              validate: (function(values) {
                return function(obj) {
                  if(typeof(obj) !== "string")
                    return false;
                  for(var j=0; j<values.length; j++)
                    if(obj === values[j])
                      return true;
                  return false;
                };
              })(def.values)
            };
            break;
          case "alias":
            if(def.isList) {
              var elementType = resolveType(def.elementType);
              types[name] = {
                baseType: "LIST",
                validate: (function(elemType) {
                  return function(obj) {
                    if(typeof(obj) !== "object" || !("length" in obj))
                      return false;
                    for(var j=0; j<obj.length; j++)
                      if(!elemType.validate(obj[j]))
                        return false;
                    return true;
                  };
                })(elementType)
              };
            } else {
              var base = resolveType(def.alias);
              var baseType = base.baseType;
              var validate = base.validate;
              if(def.restriction) {
                var restriction = def.restriction;
                switch(restriction.restrictionKind) {
                  case "regex":
                    if(baseType !== "STRING")
                      throw new Error("Regular expression restriction holds only for string types (type: "+name+").");
                    validate = (function(vali, regex) {
                      return function(obj) {
                        return vali(obj) && obj.match(regex) != null;
                      };
                    })(validate, eval(restriction.regex));
                    break;
                  case "range":
                    switch(baseType) {
                      case "INTEGER":
                      case "FLOAT":
                        if(restriction.from.valueKind !== "number"
                           || restriction.to.valueKind !== "number")
                           throw new Error("Range restriction must consist of numeric limits (type: "+name+").");
                        if(restriction.from.value > restriction.to.value)
                          throw new Error("Lower limit must be smaller or equal to the upper limit (type: "+name+").");
                        validate = (function(vali, lower, upper) {
                          return function(obj) {
                            return vali(obj) && obj >= lower && obj <= upper;
                          };
                        })(validate, restriction.from.value, restriction.to.value);
                        break;
                      default:
                        throw new Error("Range restriction holds only for numeric types (type: "+name+").");
                    }
                    break;
                }
              }
              types[name] = {
                baseType: baseType,
                validate: validate
              };   
            }
            break;
          case "struct":
            break;
        }
      }
    }
      
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