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
        name: "Boolean",
        validate: function(obj) { 
          return typeof(obj) === "boolean"; 
        }
      },
      String: {     
        baseType: "STRING",
        name: "String",
        validate: function(obj) { 
          return typeof(obj) === "string"; 
        }
      },
      Float: {
        baseType: "FLOAT",
        name: "Float",
        validate: function(obj) { 
          return typeof(obj) === "number"; 
        }
      },
      Integer: {
        baseType: "INTEGER",
        name: "Integer",
        validate: function(obj) { 
          return typeof(obj) === "number" 
                 && Math.floor(obj) === obj; 
        }
      },
      Void: {
        baseType: "VOID",
        name: "Void",
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
              name: name,
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
                name: name,
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
                name: name,
                validate: validate
              };   
            }
            break;
          case "struct":
            function typeCheckMembers(members) {
              var checker = [];
              for(var j=0; j<members.length; j++) {
                var member = members[j];
                var memberName = member.name;
                var memberType = resolveType(member.type);
                var memberChecker = {
                  name: memberName,
                  type: memberType
                  //cases
                };                
                var casesChecker = [];
                if(member.match) {
                  for(var k=0; k<match.length; k++) {
                    var match = member.match[k];
                    var caseChecker = {};
                    if(match.value != null)
                      switch(match.value.valueKind) {
                        case "constant": 
                          if(!memberType.validate(match.value.name))
                            throw new Error("'"+match.value.name+"' is not a member of type '"+member.type+"'.");
                          caseChecker.value = match.value.name;
                          break;
                        case "number":
                          if(!memberType.validate(match.value.value))
                            throw new Error("'"+match.value.name+"' is not a member of type '"+member.type+"'.");
                          caseChecker.value = match.value.value;
                      }
                    caseChecker.membersChecker = typeCheckMembers(match.members);
                  }
                }
                memberChecker.cases = casesChecker;
                checker.push(memberChecker);
              }
              return checker;
            }
            function validateMembers(checker, object) {
              for(var m=0; m<checker.length; m++) {
                var memberChecker = checker[m];
                if(!(memberChecker.name in object))
                  return false;
                var value = object[memberChecker.name];
                if(!memberChecker.type.validate(value))
                  return false;
                for(var n=0; n<memberChecker.cases.length; n++) {
                  var caseChecker = memberChecker.cases[n];
                  if(caseChecker.value == value) {
                    if(!validateMembers(caseChecker.membersChecker, object))
                      return false;
                    break;
                  }
                }
              }
              return true;
            }
            var checker = typeCheckMembers(def.members);
            types[name] = {
              baseType: "STRUCT",
              name: name,
              validate: (function(ch){
                return function(obj) {
                  return validateMembers(ch, obj);
                };
              })(checker)
            };
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