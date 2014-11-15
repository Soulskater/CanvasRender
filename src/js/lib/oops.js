/*
 * Copyright 2010 Rajendra Patil
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */
/** To get class/function string on browsers where toSource is not available
 */
 if(!Function.prototype.toSource){
     Function.prototype.toSource = function(){
         return "("+this.toString()+")";
     }
 }
 
/**
 * <p>This method ensures that current class has defined instance methods as defined by an implementing interfaces otherwises throws an error.<p>
 * 
 * <h3>Usage</h3>
 * <h4>1. Define an interface - as JSON object</h4>
 *  <pre>
 *	var IRenderable = {
 *		//no body please. leave it empty.
 * 		<b>render: function(){};</b> 
 *	};
 *	</pre>
 * <h4>2. Define your class and say it implemets an interface</h4>
 *  <pre>
 *	var CuteButton = function(){
 *		....
 *		//implemented method as guided by an interface IRenderable 
 *		<b>this.render = function(){...here you define body...}</b>
 *		....
 *		
 *	}.<b>implements(IRenderable)</b>; 
 *	//will throw exception if render method is not defined 
 *	</pre>
 * <h4>3. You can implement multiple interfaces as </h4>
 *  <pre>
 *	var CuteButton = function(){
 * 		...
 *	}.<b>implements(IRenderable,IClickable);</b>; 
 *  </pre> 
 *	<h4>OR like this</h4>
 *  <pre>
 *	var CuteButton = function(){
 * 		...
 *	}.<b>implements(IRenderable).implements(IClickable);</b>; 
 *  </pre>
 *
 * @param iFaces comma separated list interfaces to be implemented
 * @returns this - the same class 
 */
Function.prototype.implements = function(iFaces){
	var org = new this();
	for(var i = 0, l = arguments.length; i < l; i++){
		var iFace = arguments[i];
		for(var m in iFace){
		    if (m && typeof iFace[m] === "function" && !iFace[m]._isEmpty()) {
				throw("Interface method " + m + " should not have body."); 
			}
        	if(m && m != "_super" && m != "implements" && m != "inherits" && typeof(iFace[m]) != typeof(org[m])){
				throw(this.toSource() + " does not implement '" + m +"'");
        	}
			if(typeof(iFace[m]) === "function" && iFace[m].arity !== org[m].arity){
				throw(this.toSource() + " does not implement proper '" + m +"'. Should have '" + iFace[m].arity + "' argument(s) but found '" + org[m].arity+"'");
			}
    	}
	}
	delete org;
    return this;
};
/**
@private
This is internal helper method to check function is empty function or has body
*/
Function.prototype._isEmpty = function(){
	var s = this.toSource().replace(/[ \t\n]+/," ");
	if(s){
		s = s.replace(/\s*\(function\s*(\w+)?\s*\([ \t\w]*\)[ \t]*\{[ \t\r\n]*\}\s*\)/img,"");
		if(s.length > 0){
			return false;
		}
	}
	return true;
};

/**
 * <p>Can be called on functions. Should actually be called on class's internal function to mark it as abstract
 * Abstract method should have no body and it should be implemented by child class or child class can again mark
 * it as abstract</p>
 * <h3>Usage</h3>
 * <h4>1. Define a class empty method and mark it as abstract</h4>
 * <pre>
 *  var MyClass = function(){
 *      ...
 *      this.exampleAbstractMethod = function(){}.<b>isAbstract()</b>;
 *      ...
 *  }
 * </pre>
 *
 * <p> This ensures that any class which inherits MyClass should have written body for this method.
 * Child class again mark this method as abstract if it wants to delegate responsibility further down
 * in the hierarchy 
 * </p>
 *
 */
 
Function.prototype.isAbstract = function(){
	if(!this._isEmpty()){ //this is a class method
		throw("Abstract method should not have body."); 
	}
	return function(){var __abstract__ = 'Abstract';throw(__abstract__+" method can't be called.")};
};

/**
 * <p>Can be called on functions. Should actually be called on class's internal function to mark it as final method.
 * This is kind of reverse of Abstract method. Final method can't be overrided by the child class once marked as final
 * in the parent class.</p>
 *
 * <h3>Usage</h3>
 * <h4>1. Define a class method and mark it as final</h4>
 * <pre>
 *  var MyClass = function(){
 * 	    ...
 *      this.exampleFinalMethod = function(){
 *          ...
 *      }<b>.isFinal()</b>; //now child can't redefine it.
 * 		...
 *  }
 * </pre>
 *
 * <p> This ensures that any class which inherits MyClass can never override body for this method.
 * It has to be inherited from parent only.</p>
 * 
 *
 */
Function.prototype.isFinal = function(){
	var me = this;
	try{
	    var obj = new this();
	    if(obj.init)
	        return function(){var __finalclass__ = 'FinalClass';me.apply(obj,arguments); return obj;};
	}catch(ex){

	}
	return function(){var __final__ = 'Final'; return me.apply(me,arguments);};
};

/**
 * <p>This method redefines your class with capabilities from parentClass and extends/overrides it with your own class capabilities. 
 *	The private vars and methods from parent class are also inherited. The inherited class can use <b>_super</b> variable to access parent's vars/methods 
 * <p>
 * 
 * <h3>Usage</h3>
 * <h4>1. Define your class </h4>
 *  <pre>
 *	var Employee = function(){
 * 
 *		//private variables	- actually protected - will be inherited
 *		var _name;
 *		var _employeeId;
 *		
 *		//private methods - actually protected - will be inherited
 *		var _setName = function(name){
 *			_name = name;
 *		} 
 *		var _getName = function(){
 *			return _name;
 *		}
 *		//public methods
 *		//Constructor
 *		this.init = function(name,id){
 *			_name = name;
 *			_employeeId = id;
			return this; //Most IMP - init must return this;		
 *		}
 * 		
 *		this.getName = function(){
 *			return _name;
 *		}
 *		
 *		this.getEmployeeId = function(){
 *			return _employeeId;
 *		}
 *	};
 *	</pre>
 * <h4>2. Derive the child class from above class</h4>
 *  <pre>
 *	var Manager = function(){
 *		
 * 		//own private var	
 *		var _reportees = []; 
 *
 *		//own private methods
 *		var _addReportee = function(employee){
 *			_reportees.push(employee);
 *		}
 *		
 *		//own public methods
 *		//Constructor
 *		this.init = function(name,id){
 *			_super.init(name,id);//_super points to parent
 *			_reportees = [];	
 *			return this;//Most IMP - init must return this;		
 *		};
 * 		//Method overriding
 *		this.getName = function(){
 *			return _super._getName(); //calling super's private method
 *		}
 *		
 *		this.getReportees = function(){
 *			return _reportees;
 *		}
 *		
 *	}.<b>inherits(Employee)</b>; 
 *	...
 *	...
 *  <style>i{color:red}</style> 
 *	<b>var e = new Employee().init("rpatil","1");
 *	e.getName();
 *	e.getEmployeeId();
 *	e instanceof Employee;</b> //true 
 *
 *	e.<b>_setName</b>("NewName");//<b><i>Not allowed - private method - ERROR</i></b>
 *	e.<b>_name</b>;//<b><i>Not allowed - private var - ERROR</i></b>
 * 
 *	<b>var m = new Manager().init("sumit","2");</b>
 *
 *	m.getName(); //Overridden - will be called from manager
 *	m.getEmployeeId(); //Inherited - will be called from Employee
 *	m.getReportees();
 *	m instanceof Manager; //true
 *	<b>m instanceof Employee;</b> //false. This doesn't work :(
 *
 *	m.<b>_reportees</b>;//<b><i>Not allowed - private var - ERROR</i></b>
 *	m.<b>_super</b>;//<b><i>Not allowed - _super? what is that? - ERROR</i></b>
 *	m._name;//Not allowed - private var inherited from parent - public access not allowd.
 *	...
 * 
 *	</pre>
 * <h4>3. You can inherit and implement at the same time </h4>
 *  <pre>
 *	var Manager = function(){
 * 		...
 *	}.<b>inherits(Employee).implements(IAuthor);</b>; 
 *	//Manager is inheriting employee and implementing IAuthor
 * </pre>
 * <p>and this is how <b>IAuthor</b> may look like</p>
 *  <pre>
 *	var IAuthor = {
 *		writeBooks:function(){...}
 *	}
 *  </pre> 
 *
 * @param parentClass name of the parent class from which this class will inherit properties.
 * @returns newClass - the new redefined class with properties from parent class + child class 
 */

Function.prototype.inherits = function(parentClass){
    var checkIfInheritable = function(aClassString){
        if(aClassString.indexOf("__finalclass__") > 0){
	        throw ("Final class can't be inherited.");
        }
    };
    var removeAbstractMethod = function(m,op,parentProps){
        var rgxp =  new RegExp("this\."+m+" = .*isAbstract\(\).*(this\.\w+\s*=)?","igm");
        parentProps = parentProps.replace(rgxp,"$1");
        return parentProps;    
    };

	var op = new parentClass();
	var oo = new this();
    var parentProps = parentClass.toString().replace(/\\s+/ig," ").replace(/}$/,"");
    if(parentProps.indexOf("[native code]") > 0){
        return this.inheritsNative(parentClass);
    }
    checkIfInheritable(parentProps);
    var childProps = this.toString().replace(/\\s+/ig," ").replace(/function\s*(\w+)?\(\)\s*{/,"");
	var _s = "_s$s_";//Prefix for parent methods
	var d  = Function.depth === undefined ? (Function.depth = 0) : (Function.depth = Function.depth+1);
	_s += d;
	
	//Comment below code if we want multiple inheritance 
	if(childProps.indexOf("_s$s_") > 0){
		throw ("Multiple inheritance not allowed.");
	}
	
	for(m in op){
		if(oo[m] === undefined) {
			if(op[m].toSource().indexOf("__abstract__") > 0){
				throw ("Method '"+m+"' is abstract in parent class. Child class MUST override it.");
			}
		
			// i.e m in parent is not overridden in child - so _super.m should resolve to this.m in this 
			// as all parent m's are inherited to child automatically
			var rgx = new RegExp("_super\\.("+m+")\s*(\(\))","ig");
			childProps = childProps.replace(rgx,"(typeof(this.$1) !== 'undefined' && ('_s$s_'==='_s$s_') ? this.$1$2 : $1$2)"); 
			//&& condition above is kind of marker to detect already inherited class
			continue;
		}
		if(op[m].toSource().indexOf("__abstract__") > 0){
            parentProps = removeAbstractMethod(m,op,parentProps);
        }
		if(op[m].toSource().indexOf("__final__") > 0){
				throw ("Method '"+m+"' is final in parent class. Child class CAN'T override it.");
		}
		// i.e m in parent is overridden in child - so rename parent m and resolve super.m in child to renamed m
		parentProps = parentProps.replace("this."+m,"this."+_s+m).replace(/[ \r\n\t]+$/igm,"");// + " = this."+_s+m);
		childProps = childProps.replace("this._super","_super").replace("_super."+m,"this."+_s+m);
	}
	var rgx = /_super.(\w+)/ig; //There is no real _super :). So in super.m, child actually trying to access private (actually protected) m of super which is already inherited by child
	// so replace super.m for private m's to just m's in child which are availble in child if were there is parent;
	childProps = childProps.replace(rgx,"$1");
	
	newObjectProps = "("+parentProps + childProps+")";
	//delete this; some browsers don't allow to delete this
	//console.log(newObjectProps);
	var resClass = eval(newObjectProps);
    //
    //Set the prototype to the parent
	resClass.prototype = op;
	resClass.constructor = this;

	return resClass;
};

/**
 * This function adds ability to inherit from native Objects for example defining your own Array by inheriting native Array object;
 * Original Array object is unchanged and new custom array with capabilities like original array + your own methods/properties
 * gets defined.
 * eg.
 * <pre>
 * var MyArray = function(){
 *   this.myPush = function(obj){
 *       console.log("My push called for "+obj);
 *       this.push(obj);
 *   };
 *   this.push = function(obj){
 *      console.log("Overrided push called for " + obj + " ");
 *      this._super.push(obj);
 *   };

}.inheritsNative(Array);

 * </pre>
 */
Function.prototype.inheritsNative = function(nativeClass){
    var s = nativeClass.toString().replace(/[\n\t ]/igm," ").replace(/.*function\s*(\w+).*/igm,"$1");
    var source = this.toString().replace(/\\s+/ig," ").replace(/function\s*(\w+)?\(\)\s*{/igm,"");
    source = "(function(){var _super = this._super = new "+ s +"();" + source + ".add$Proto())";
    source = source.replace(/_super\.(\w+)\s*\(/igm,"_super.$1.call(this,");
    return eval(source);
};
