
// breakpoint on warnings:
if (false) {
  var oldWarningFunction = console.warn;
  console.warn = function () {
      debugger;
      oldWarningFunction.apply(console, arguments);
  };
}


var alignDebug = false;
var logNextFrame = false;
/*style computation at save time:
 * i.style, then i.defaultStyle, then parent's computed style

 * style keys:
 *  x, y : relative coordinates to parent 
 *  color, size, font : text properties
 *  spaceAfter, spacebefore : text interlines
 *  w,h : dimensions of rectangles
 *  r : circle radius
 *  stroke, fill : drawing colors for path, rect, and circle 
 */
 

function getComputed(key, d) {
	if (key in d.style) return d.style[key];
	if (key in d.defaultStyle) return d.defaultStyle[key];
	if (parent in d) return getComputed(key, d.parent);
	return null;	
}
function getter(key) {
	return function(x) {return x[key]};
}

function seededRndGenerator(seed) {
  var gen = {seed: seed};   
  gen.random = function() {    
    gen.seed = (gen.seed * 9301 + 49297) % 233280;
    return  gen.seed / 233280;
  }
  return gen;
}
//********************************************//


function IsNumeric(val) {
    return Number(parseFloat(val))==val;
}


function importDefault(obj, def, def2, def3) {
    checkType(obj, ["object"])
    checkType(def, ["object"])
    checkType(def2, ["object", "undefined"])
    checkType(def3, ["object","undefined"])
	for (key in def) {
		if (!(key in obj)) {
			obj[key] = def[key];
		}
	}	
	if (typeof def2 == "object")
		for (key in def2) {
		if (!(key in obj)) {
			obj[key] = def2[key];
		}
	}	
	if (typeof def3 == "object")
		for (key in def3) {
		if (!(key in obj)) {
			obj[key] = def3[key];
		}
	}	
	return obj;
}

function copyExceptKeys(s, keys) {
    checkType(s, ["object"])
	var out={};
	for (key in s) {
		if (keys.indexOf(key)==-1) {
			out[key] = s[key];
		}
	}
   return out;		
}
function copyWithDefault(obj, def) {
    checkType(obj, ["undefined", "object"])
    checkType(def, ["undefined", "object"])
	out={};
	if (!obj) obj={};
	for (key in obj) {
		out[key]=obj[key];
	}
	for (key in def) {
		if (!(key in obj)) {
			out[key] = def[key];
		}
	}	
	return out;
}

function shallowCopy(obj) {
	return copyWithDefault(obj,{});
}
function onlyXY(i) {
   return {x:i.x, y:i.y}; 
}
function midPoint(i,j) {
  return {x:(i.x+j.x)/2, y:(i.y+j.y)/2};
}
function projection(point,origin,unitAxis) {
   var scal=(point.x-origin.x)*unitAxis.x+(point.y-origin.y)*unitAxis.y;
  return {x:origin.x+scal*unitAxis.x,  y:origin.y+scal*unitAxis.y};
}
function keepFOnAxis(point,target, unitAxis) {  
 // console.log(point,target, unitAxis) 
   var scal=(target.dx)*unitAxis.x+(target.dy)*unitAxis.y;
  // console.log(scal);
   point.fx += scal*unitAxis.x; 
   point.fy += scal*unitAxis.y;
}
function xy(a,b) {
  if (typeof b == "undefined") 
    return a.x+","+a.y; 
  else
    return a+","+b;
}


function max(a,b) {
	return a<b? b:a
}
function min(a,b) {
	return a>b? b:a
}

function marginAndPadding(s, key) {
	if (key in s) {
		
		["Top", "Bottom", "Left", "Right"].forEach(function(k) {
			var x= {};
			x[key+k] = s[key];
			importDefault(s, x);		
		})
	}
}


  
function getAlignMove(kx, kwidth, align, targetX, targetWidth, element) {


	var move={x:0,y:0};			
	if (align == "n") return move;
	
	var boxC = element.actualBox(kx)+element.style[kx];
	var boxW = element.actualBox(kwidth);			
	
	
	if (targetWidth==null) stop(["Cannot align when "+kwidth+" is not defined", element]);
	
	if (align == "l" || align=="t") 
					move[kx] = (targetX - targetWidth/2) - ( boxC - boxW/2 )
	if (align == "c" || align=="m")  
					move[kx] = targetX                   - ( boxC );
	if (align == "r" || align=="b") 
					move[kx] = (targetX + targetWidth/2) - ( boxC + boxW/2 )
    if (isNaN(move[kx])) stop(move);		
   if (alignDebug) console.log("align "+kx+align, move.x,targetX,targetWidth, bbox[kx], bbox[kwidth]);
	return move;	
}
	
function itemAndFrameFunctions(i) {
	//i.transitions=[];

	i.open = i.root.open;
	i.close = i.root.close;
	i.continue = i.root.continue;
	i.addTo = function(id) {
		i.root.addToSet(i, id);
        return i;
	}
   i.append=function (type, style, d) {
	  return i.root.saveToBlocks(Item(i.mainItem || i, type, style, d));
     
   }

	i.addFirst=function(type, style, d) {
	   var newi = i.append(type, style, d);
		i.children.unshift(i.children.pop());		
		
	}
	
  i.down =function (selector, silent) {
	  if (typeof selector == "string") selector=selector.split("#");//optional
	  
	  for (var c=i.children.length-1; c>=0; c--) {
         var get = i.children[c].down(selector,true);
			if (get) return get;
	  }
	  if (i.match(selector)) return i;
	  if (!silent) console.error("Not found...",i.id, selector[1]);
	  return null;
  }
  i.goto = function(selector, silent) {
	  var sel=selector.split("#");
	  if (sel[1]) return i.root.index[sel[1]];
	  return i.root.down(sel, silent);
  }
  i.up = function(selector) {
	  if (!i.parent) {
        console.log(".up(\""+selector+ "\") not found");
        return null;
      }
	  if (!selector) return i.parent;
	  if (i.parent.match(selector)) return i.parent;
	  return i.parent.up(selector);	  
  }
  
	  
  i.match= function(selector) {
	  if ( selector instanceof Array) {
		  return (selector[0] && i.type==selector[0]) || (selector[1] && i.id==selector[1]);
	  }	
	  return i.match(selector.split("#"));
  }  
  
  i.allNodes = function(type) {
	  var b= itemBag([i]);
	  if (type) b=b.filter(type);
	  for (var c=i.children.length-1; c>=0; c--) {
		  b.merge(i.children[c].allNodes(type));
	  }	
	  return b;
  }
  
  i.childBag = function() {
	  return itemBag(i.children);
  }
  i.log = function(prefix, keys) {
	  prefix=prefix||"";
	  var st;
	  if (keys) {
		  st=" ";
		  for (k of keys) {
			  st+=k+":"+i.style[k]+" ";
		  }
	  } else {
		  st = JSON.stringify(i.style); 
	  }
	  console.log(prefix +"[" + i.frame+"."+i.history.length+"] "+i.type+" <"+i.tag+"> "+st );

	  for (var c=0; c<i.children.length; c++) {
		  i.children[c].log(prefix+"| ", keys);
	  }	  
	  
  }
  i.logXY = function(prefix, layers) {
	  if (isNaN(layers)) layers=100;
	  if (layers==0) return;
	  prefix=prefix||"";
	  console.log(prefix +i.type+" "+xy(i.style) +" ["+(i.style.width||"--")+","+(i.style.height||"--")+"]"+(i.style.align||" ")[0]);
	  for (var c=0; c<i.children.length; c++) {
			  i.children[c].logXY(prefix+"| ", layers-1);
		}	  
		  
  }
  
  function parseOnValue(s) {
    if (typeof s!="string")
       return s;
    if (isNaN(s)) {
      var match;
      if (match=s.match(/[\[](\d+),(\d+)[\]]/)) {         
       return [+match[1],+match[2]]
      }
      if (match=s.match(/[\[](\d+)[\]]/)) {         
       return [+match[1]]
      }
    } else {
       return +s;
    }
  }
  i.set=function(s) {     
      if (typeof s== "undefined") return i;
      if ("on" in s) { 
        var when=parseOnValue(s.on);
        delete s.on;
        i.on(when, s);
        return;  
      }
	  for (var k in s) {
		  if (s[k]==null) {
			  delete i.style[k];
		  }
		  else {
              if (k=="showOn") {
                i.style.show=false;
                i.on(parseOnValue(s[k]),{show:true})
              } else 
                i.style[k]=s[k];		 		  
          }
	  } 
     return i;		 	  
  }
  i.hasSchedule = function() {
	  if (i.schedule) {//console.log (i.schedule); 
	    return i.schedule.length;}
	  for (var c=0;c<i.children.length;c++){ 
		  if (i.children[c].hasSchedule()) 
			  return i.children[c].hasSchedule();
	  }
	  return false;
	  
  }
  i.save=function(inheritStyle) {
	  
	  /*if (inheritStyle.phantom!=null)
		  inheritStyle.phantom=1;
	  */
	  var s={};
	  importDefault(s, i.style, i.defaultStyle, inheritStyle);  	  	  
	  if (i.parent) {
		  while (i.parent.history.length>i.history.length+1) {
			  
			  if (s.phantom!=null) {
				  
			     i.history.push(importDefault({show:true, opacity:s.phantom*(("opacity" in s)?s.opacity:1)}, s))  
				  s.phantom=1;
			  }
			  else
			     i.history.push(importDefault({show:false}, s));
			  i.showBefore=false;
		  }
	  } else  {
        i.remainingOverlays--;
      }
	  //if (i.tag=="text") console.log(s.anchor);
	  
	  var ov=i.history.length;
	  marginAndPadding(s, "margin");
	  if (s.bg) marginAndPadding(s, "padding");
	  
		if (i.tag!="tspan" && i.parent) {
			if (!("x" in s) || isNaN(s.x)) stop(i);
			if (!("y" in s) || isNaN(s.y)) stop(i);
			
		}
	  i.history.push(s);  

      if (i.savingFunctionPrefix) i.savingFunctionPrefix(i, s);
      
	  for (var c=0; c<i.children.length; c++) {
		  i.children[c].save(copyExceptKeys(s, ["x", "y", "opacity", "margin","width", "height", "marginTop","marginBottom","marginLeft","marginRight","bg", "align","alignV", "model", "priority"]));
	  }	
	  processTransition(i);
	  
	  if (i.savingFunction) i.savingFunction(i, s);
	  
	  
	  if (i.schedule) i.runSchedule();
	  
  }
  
}
function useAttr(i,attr,key1, key2, key3) {
   
	key1 = key1 ||attr;  
	if (key1 in i.style) {
		i.g.attr(attr,i.style[key1]);		
        if (attr=="y" && isNaN(i.style[key1])) stop(i);
		return;
	}	
	if (key2!=null) {
		if (key2 in i.style) {
			i.g.attr(attr,i.style[key2]);	
            if (attr=="y" && isNaN(i.style[key2])) stop(i);	
			return;
		} 
		if (key3!=null && key3 in i.style) {
			i.g.attr(attr,i.style[key3]);		
			return;
		}
	}
        if (attr=="y" && i.type!="svgtext") stop(i);
	i.g.attr(attr,null);		
}
function useStyle(i,attr,key1,key2,key3) {
    key1 = key1 ||attr;  
    if (key1 in i.style) {
        i.g.style(attr,i.style[key1]);      
        return;
    }   
    if (key2!=null) {
        if (key2 in i.style) {
            i.g.style(attr,i.style[key2]);      
            return;
        } 
        if (key3!=null && key3 in i.style) {
            i.g.style(attr,i.style[key3]);      
            return;
        }
    }
    i.g.style(attr,null);       
}
function useForPdf(i,doc,f,key1,key2,key3) {
    if (key1 in i.style) {
      
       console.log("use "+f,key1, i.style[key1]);
        doc[f].call(doc, i.style[key1]);      
        return;
    }   
    if (key2!=null) {
        if (key2 in i.style) {
            doc[f].call(doc,i.style[key2]);      
            return;
        } 
        if (key3!=null && key3 in i.style) {
            doc[f].call(doc,i.style[key3]);      
            return;
        }
    }     
}
function useNumberForPdf(i,doc,f,key1,key2,key3) {
    if (key1 in i.style) {
      
       console.log("use "+f,key1, i.style[key1]);
        doc[f].call(doc, i.style[key1]*1);      
        return;
    }   
    if (key2!=null) {
        if (key2 in i.style) {
            doc[f].call(doc,i.style[key2]*1);      
            return;
        } 
        if (key3!=null && key3 in i.style) {
            doc[f].call(doc,i.style[key3]*1);      
            return;
        }
    }     
}
function FrameBase(frame, holder, transform, style) { 
  if (!style) style={};
  importDefault(style, {
		width:400,
		height:300,
		show:true
		})
  var fb=  {
	  frame:frame,
	  g:holder.append("g").attr("transform",transform).attr("id","frame"+frame),
	  children:[],	  
	  inheritStyle:{},
	  defaultStyle:codex.frame.defaultStyle,
      id:"root",  
	  index:{},
	  style:style,
	  history:[],
	  box:{container:{x:0, y:0, width:400, height:300}},
      remainingOverlays:1
  } 
  fb.root=fb;
  fb.index["root"] = fb;
  fb.title=function(s) {
        console.log(s);
		var t=fb.goto("#title");
        if (t.write) 
          t.write(s);
        else 
		  t.set({text:s});
        return fb;
  }
  fb.subtitle=function(s) {
      console.log(s);
		
		var st=fb.index["subtitle"];
		if (!st) {
	   	var t=fb.goto("#title");
        if (t.write) 
           t.write("\n\\size:14{"+s+"}");
        else  
           console.log("Subtitle cannot be printed in this frame style");			  
			return fb;
		}
		st.show();
      if (st.write) 
        st.write(s);
      else 
		  st.set({text:s});
      return fb;
  }
  
  fb.firstRun = function () {    
      for (var c=0; c<fb.children.length; c++) {
          fb.children[c].firstRun();
      }
  }
  fb.draw=function(f, regular) {
	  console.log("-----draw------- ", regular)
	  for (var c=0; c<fb.children.length; c++) {
		  fb.children[c].load(f, regular);
	  }
	  checkTree(fb);
	  for (var c=0; c<fb.children.length; c++) {
		  fb.children[c].draw(regular);
	  }	  
      checkTree(fb);
  
  } 
  itemAndFrameFunctions(fb);  
  
  var openBlocks= {};
  var blockIds = [];
  
  fb.open=function (blockId) {
	  if (blockIds.indexOf(blockId) != -1) console.error("set "+blockId+" already open");
	  blockIds.push(blockId);		  
	  openBlocks[blockId]=itemBag([]);
      fb.index[blockId] = openBlocks[blockId];
	  return this;
  }
  fb.addToSet=function (item, blockId) {
     /* if (blockIds.indexOf(blockId) == -1) fb.open(blockId);
	  openBlocks[blockId].add(i);
	  */
      if (! (blockId in fb.index))  
        fb.index[blockId]=itemBag([item])
      else 
        fb.index[blockId].add(item);
	  return this;
  }
  fb.continue = function(blockId) {
	  if (blockIds.indexOf(blockId) != -1) console.error("set "+blockId+" already open");
	  blockIds.push(blockId);
	  openBlocks[blockId]=fb.index[blockId]||itemBag([]);
	  return this;
  }
  fb.close=function (blockId) {
	  if (!blockId)
		  blockId=blockIds.shift();
	  else {
		  var j = blockIds.indexOf(blockId)
		  if (j==-1) console.error("set "+blockId+" not open");
        blockIds.splice(j, 1);
	  }
	  delete openBlocks[blockId];
	  return this;
  }
  fb.saveToBlocks = function(i) {
	  for (k in openBlocks) {
		  openBlocks[k].add(i);
	  }
	  return i;	  
  }  
  
  fb.minRemainingOverlays= function(howMuch) {
      fb.remainingOverlays=Math.max(fb.remainingOverlays, howMuch+1); //number of time we must call save
    
  }
  
  /*base frame is ready, run model to draw background, title, etc.*/
  frameStyleCatalog[fb.style.model||fb.defaultStyle.model](fb);
  fb.mainItem = fb.goto("#main")||fb;
  fb.toPdf = function (doc) {
	  doc.addPage();
	  doc.translate(200,150);
	  doc.text("frame: "+fb.id);
	  fb.children.forEach(function (i) {i.toPdf(doc,1)});
	  
  }
  return fb;
}

  
var nextId=0;

function Item(parent, typeAndId, style, d) {
	"use strict";
	
  var splitTandId = typeAndId.split("#");
  var type = splitTandId[0];
  
  var code=codex.default
  if (type in codex) {
	  code=codex[type];	  
  } else {
	  console.error("Warning: type "+type+" unknown.");
  }
  var tag=code.tag;
  var id = splitTandId[1] || (type+"-"+(nextId++));
  
  var i= {
		parent:parent,
		frame:parent.frame, 
		root:parent.root, 
		type:type,
		tag:tag,
		id:id,
		g:parent.g.append(tag).attr("class",type),
		style:style||{},
		defaultStyle:code.defaultStyle || {},
		children:[],
		history:[],
		lastDraw:-2,
		bgRect:null,
		showBefore:true,
		showAfter:true,	
		shown:false,
        orderedChildren : false,
        internalNode:code.internalNode,
		drawingFunction:code.onDraw,
		drawingFunctionPostOrder:code.onDrawPostOrder,
		loadingFunction:code.onLoad,
		savingFunction:code.onSave,
		savingFunctionPrefix:code.onSavePrefix,
		layoutFunction:code.onLayout,
		firstRunFunction:code.onRun,
		datum:d,
		schedule:[],
		box:{container:copyWithDefault(code.containerBox, {type:"inherit"}), 
             actual:{type:code.internalNode?"children":"real"}, 
             bg: {use:code.defaultBackground||"actual"}},
		drawInPdf:code.drawInPdf ||function(){}
  }
  
  i.root.index[id] = i;
  i.g.attr("id", i.id);
  if (i.parent.children.length>0) i.parent.children[i.parent.children.length-1].nextSibling=i;
  i.parent.children.push(i);
  i.g.datum(i);
  itemAndFrameFunctions(i); 
  
  i.getLast=function (type) {
	 for (var c=i.children.length-1; c>=0; c--) {
		  if (i.children[c].type==type) return i.children[c];
	 }	  
	 return null;  	  
  }  

  i.then = i.parent.append;  
  
  i.hide = function () {
	  i.style.show =false;
     return i;
  }
  i.show = function () {
	  i.style.show =true;
     return i;
  }  
  i.setAndKeep=function(s) {
	  var out={};
	  for (var k in s) {
		  out[k] = i.style[k];
		  if (s[k]==null)
			  delete i.style[k];
		  else 
		   	i.style[k]=s[k];		 		  
			
	  }
	  return out;	  
  }  
  i.move = function(dx, dy) {
	  if (typeof dx=="object") {
		  dy=dx.y;
		  dx=dx.x;
	  }
	  if (isNaN(dx) || isNaN(dy)) {
		   stop("move "+xy(dx,dy));	    
	  }
	  i.style.x = i.style.x||i.defaultStyle.x||0; 
	  i.style.x+= dx
	  i.style.y = i.style.y||i.defaultStyle.y||0; 
	  i.style.y+= dy;
	  return i;	  	  
  }
  i.moveInner=function(move) {
	 for (var c=0; c<i.children.length; c++) {
		  i.children[c].move(move.x, move.y)//.layout();		  
	 }
	 //i.layout();
      return i;
  }

  
  i.decoration=function (codex, style) {
	  
	  if (typeof codex== "object") {style=codex; codex="border"};
	  if (!style) style={};
	  if (!i.bgRect) {
		  i.bgRect={
			    g:i.g.insert("rect", ":first-child").attr("class", "background"),				
				useAttr : function (attr, key1,key2,key3){useAttr(i.bgRect,attr,key1, key2, key3);},
  
				useStyle :function (attr, key1,key2,key3){useStyle(i.bgRect, attr,key1,key2,key3);},
				useForPdf : function (doc, f, key1, key2, key3){useForPdf (i.bgRect, doc, f, key1, key2, key3);},
                useNumberForPdf: function (doc, f, key1, key2, key3){useNumberForPdf (i.bgRect, doc, f, key1, key2, key3);},
				automatic : true //disable this flag if background box cannot be computed at draw time. Call i.drawBackground(false) later on.
		  };
		  
		  if (typeof codex=="string")
			 i.style.bg=decorationCodex[codex];
	  }
	  if (typeof codex == "object") 
		  style=codex;
	  // console.log(style);
	  importDefault(style, i.style.bg);
	  i.style.bg=style;	
     return i;	  
  }
  
  i.align=function (kx, kwidth,align, targetX, containerWidth) {
	  if (containerWidth == null) containerWidth = i.containerBox(kwidth);
	  i.move(getAlignMove(kx, kwidth, align, targetX||0, containerWidth, i));
  }
	
  i.get = function(c) {
	  console.warn("deprecated");
	  return i.children[c];
  }  
  
	i.on = function(when, style) {
        if (i.schedule == null) i.schedule = [];
		if (typeof when=="number") {
            // .on(frame)
            i.root.minRemainingOverlays(when);
            if (when ==0) {
              //apply now, schedule "revert" for next frame              
              i.schedule.push([1, -1, i.setAndKeep(style)])
            } else {              
              //schedule style for "when" and revert for "when+1"			  
              i.schedule.push([when,when+1, style])
            }
        } else {
            i.root.minRemainingOverlays(when[0]);
			if (when.length==1) {
                // .on([firstframe])
                if (when[0]==0) 
                  //.on([0]): apply style now
                  i.set(style)
                else   
                  //other: schedule style, no revert
				  i.schedule.push([when[0], -1, style])
            } else {
                // .on([firstframe, lastFrame])
                if (when[0]==0) 
                  //[0,end]: apply style now and schedule the revert
                  i.schedule.push([when[1]+1, -1, i.setAndKeep(style)])
                else 
                  //other: schedule style and revert
				  i.schedule.push([when[0], when[1]+1, style])			
            }
		}
		return i;
			
	}
	
	i.cell = i.parent.cell || null;
	i.appendIn = i.parent.appendIn || null;
	i.np = i.parent.np || null;
	
	  
	//i.setWidthToMin = i.setWidthToActual;
	
  
  /*load: prepare an item for drawing:
     - copy saved style for required frame to item style
     - sets an item's display attribute
     - calls specific loading function
  */
  i.firstRun = function () {    
      i.childIndex=i.parent.children.indexOf(i);
      if (i.style.priority) {
        i.parent.orderedChildren=true;
      }
        
      if (i.firstRunFunction) i.firstRunFunction(i);
      for (var c=0; c<i.children.length; c++) {
          i.children[c].firstRun();
      }
      
      if (i.orderedChildren) {
          i.orderedChildren =
            i.children.map(function(e, j) {
              return { index: j, priority:e.style.priority||0, node: e};
            }).sort(function(a, b) {
               return (a.priority==b.priority ? a.index-b.index : b.priority-a.priority)
            }).map(function(n){return n.node});        
      }
  }
  i.load=function(f, regular) {
     var ov=f-i.frame;
     var show=null;
     if (ov<0) {
       show =  i.showBefore?1:0;
       ov=0;
     }
     delete i.trans;
     if (ov>=i.history.length) {
        show = i.showAfter?1:0;
        ov=i.history.length-1;
     }
     i.nextDraw=ov;    
     i.differentFrameLoaded = (i.nextDraw != i.lastDraw) 
     if (i.differentFrameLoaded || !regular) {
         i.style = shallowCopy(i.history[i.nextDraw]);
         i.trans = getTransition(i.style, i.nextDraw  - i.lastDraw)     
     } 
     
     if (show==null) show=i.style.show;
     i.display=show;
     
     if (i.loadingFunction) i.loadingFunction(i, show, ov==f-i.frame);
     
     i.g.style("display", i.display?null:"none");
	  i.updateContainerBox();
      
     var sortedChildren=i.orderedChildren || i.children;
     for (var c=0; c<sortedChildren.length; c++) {
          sortedChildren[c].load(f, regular);
     }
  }
  
  
  //layout: place the item at the correct coordinates 
  i.layout = function(layers) {
	  i.bbox=null;
      //override style's x and y by root x and y if defined
      if ("x" in i) i.style.x= i.x;
      if ("y" in i) i.style.y= i.y;
      //run layout function (typically: transform = translate(i.style.x, i.style.y)
	  if (i.layoutFunction && checkNoWriggle(i)) i.layoutFunction(i);
      //recursive call to children if layout over multiple layers is required
	  if (layers) {
		 for (var c=0; c<i.children.length; c++) {
			  i.children[c].layout(layers-1);
		 }	
	  }
  }
  i.containerBox= function (key, value) {
    if (typeof value=="undefined")  {
       return i.box.container[key];
    } else {
      i.box.container[key]=value;
      return i;
    }
  }
  i.actualBox= function (key, value) {
    if (typeof value=="undefined")  {
       return i.box.actual[key];
    } else {
      //console.log ("redefine actual box", i.id, key, value)
      i.box.actual[key]=value;
      return i;
    }
  }
  i.getBackgroundBBox = function() {
    var defaultBG=i.box.bg.use;
   
    if (typeof defaultBG== "function") defaultBG=defaultBG(i);
    if (defaultBG == "actual") 
       defaultBG=i.box.actual
    else if (defaultBG == "container") 
       defaultBG=i.box.container    
//    console.log(defaultBG); 
    return  copyWithDefault(i.box.bg, defaultBG); 
  }
  
  i.setFixedBoundingBox = function(box) {
    if (("x" in box) &&  ("width" in box)) {
       i.box.container.typeX=i.box.actual.typeX="custom";
       i.box.container.x=i.box.actual.x=box.x;
       i.box.container.width=i.box.actual.width=box.width;
    }
    if (("y" in box) &&  ("height" in box)) {
       i.box.container.typeY=i.box.actual.typeY="custom";
       i.box.container.y=i.box.actual.y=box.y;
       i.box.container.height=i.box.actual.height=box.height;
    }
    return i;
  }
  i.updateContainerBox =function() {
      importDefault(i.box.container, {x:0, y:0, width:0, height:0});
      if (!i.box.container.typeX) i.box.container.typeX=i.box.container.type;
      if (!i.box.container.typeY) i.box.container.typeY=i.box.container.type;
	  if (i.box.container.typeX == "inherit"  ) {
		  i.box.container.width = i.parent.box.container.width;
		  i.box.container.x = i.parent.box.container.x - i.style.x;
	  } else if (i.box.container.typeX == "tight") {
		  i.box.container.width = null;
		  i.box.container.x = 0;
	  }
	  if (i.box.container.typeY == "inherit" ) {
		  i.box.container.height = i.parent.box.container.height;
		  i.box.container.y = i.parent.box.container.y - i.style.y;	  
	  } else if (i.box.container.typeY == "tight") {
		  i.box.container.height = null;
		  i.box.container.y =0;		  
	  }
	  
      if ("width" in i.style) {
        i.box.container.width=i.style.width;
        i.box.container.x=0;        
      }
      if ("height" in i.style) {
        i.box.container.height=i.style.height;
        i.box.container.y=0;       
        
      }
   /*   if (i.type=="cell")
          console.log("updated Box", i.id, i.style,  i.box.container);*/
      if (i.box.container.type!="inherit") {
        //  console.log("updated Box", i.id, i.box.container);
      } else if (i.box.container.width==null || i.box.container.height==null) {
      //    console.log("updated Box", i.style, i.id, i.box.container);
      }
        
	  //"custom", "array"-> do nothing
  }
  i.updateActualBox =function() {
      //todo include padding here.
      if (!i.box.actual.typeX) i.box.actual.typeX=i.box.actual.type;
      if (!i.box.actual.typeY) i.box.actual.typeY=i.box.actual.type;
      var scale=(i.style.scale || 1);
      if (i.box.actual.typeX == "real" || i.box.actual.typeY=="real") {
        var bbox=false;
        if (i.display && i.tag!="tspan") {
          try {
            bbox=shallowCopy(i.g.node().getBBox()) 
          } catch (e) {console.log(i.id+": bbox unavailable")};
        }
        if (!bbox) bbox = {x:0,y:0,width:0, height:0};
        if (i.box.actual.typeX == "real") {
          i.box.actual.x= bbox.x+bbox.width/2;
          i.box.actual.width= bbox.width;          
        }
        if (i.box.actual.typeY == "real") {
          i.box.actual.y= bbox.y+bbox.height/2;
          i.box.actual.height= bbox.height;          
        }
      }
      if (i.box.actual.typeX == "children" || i.box.actual.typeY=="children") {
		  var left=0, right=0, top=0, bottom=0;
		  for (var c=0; c<i.children.length; c++) {
			  if (!i.children[c].style.show) continue;
			  var cx =i.children[c].box.actual.x + i.children[c].style.x;
			  var cy =i.children[c].box.actual.y + i.children[c].style.y;
			  var cwh =i.children[c].box.actual.width/2;
			  var chh =i.children[c].box.actual.height/2;
              if (i.children.typeX!="outside") {
                left=min(left, cx-cwh);
                right=max(right, cx+cwh)
              }
			  if (i.children.typeY!="outside") {
                top=min(top, cy-chh);
                bottom=max(bottom, cy+chh);
              }              
		  }
		  if (i.box.actual.typeX == "children") {				  
			  i.box.actual.width = right-left;
			  i.box.actual.x = (left+right)/2;
		  }
		  if (i.box.actual.typeY == "children") {
			  i.box.actual.height = bottom-top
			  i.box.actual.y = (top+bottom)/2;			  
		  }
	  } 
      if (i.box.actual.typeX == "children" || i.box.actual.typeX == "real") {        
              i.box.actual.width *=scale;
              i.box.actual.x *=scale;
      }
      if (i.box.actual.typeY == "children" || i.box.actual.typeY == "real") {        
              i.box.actual.height *=scale;
              i.box.actual.y *=scale;
      }
	  if (i.box.actual.typeX == "outside") {
			i.box.actual.width=0;			
			i.box.actual.x=0;	
	  } else if (i.box.actual.typeX == "fill") {
			i.box.actual.width=i.box.container.width;			
			i.box.actual.x=i.box.container.x;
	  } 
	  if (i.box.actual.typeY == "outside") {
			i.box.actual.height=0;
			i.box.actual.y=0;		
	  } else  if (i.box.actual.typeY == "fill") {
			i.box.actual.height=i.box.container.height;			
			i.box.actual.y=i.box.container.y;	
	  }
	  
	   if ("width" in i.style  && i.style.width!=null) {
        var x=0;
        if ("alignX" in i.style) {
           if (i.style.alignX[0]=="c") x = i.box.actual.x;
           if (i.style.alignX[0]=="l") x = i.box.actual.x+(i.box.actual.width-i.style.width)/2;
           if (i.style.alignX[0]=="r") x = i.box.actual.x-(i.box.actual.width-i.style.width)/2;           
        }
        i.box.actual.x=x;  
        i.box.actual.width=i.style.width;      
      }
      if ("height" in i.style && i.style.height!=null) {
        var y=0;
        if ("alignY" in i.style) {
           if (i.style.alignY[0]=="m") y = i.box.actual.y;
           if (i.style.alignY[0]=="t") y = i.box.actual.y+(i.box.actual.height-i.style.height)/2;
           if (i.style.alignY[0]=="b") y = i.box.actual.y-(i.box.actual.height-i.style.height)/2;           
        }
        i.box.actual.y=y;       
        i.box.actual.height=i.style.height; 
      }

      
      
      
      
/*      if (["textBox", "svgtext"].indexOf(i.type)>-1) console.log(i.id+" updateActualBox ",i.box.actual)*/
	  //"custom" -> do nothing
  }
  
  /*draw: draw an item and all its descendants
   * applied only if frame is different or "irregular" calls
   * 
   */ 	
  
  i.propagateContainerChange = function() {
     i.updateContainerBox();
     i.fillUpWidthHeight();
     i.drawBackground(true);   
     for (var c=0; c<i.children.length; c++) {
         var j= i.children[c];
         if (j.box.container.typeX=="inherit" || 
             j.box.container.typeY=="inherit" ||
             j.box.container.typeX=="array" || 
             j.box.container.typeY=="array") 
         j.propagateContainerChange();            
    }        
  }
  i.draw=function(regular) {	  
     i.shown=true;
	 i.bbox=null;
	 if (i.differentFrameLoaded || !regular) {
         //make a "transition-free" copy of the item 
		 i.saveG=i.g;
         //add a transition if necessary
		 if (i.trans && regular) {
//			 console.log("transition:"+i.type, i.trans);
			 i.g = i.g.transition(transitionShop[i.trans].make().transObj);             
		 }
		 //compute width and height when defined 
         i.updateContainerBox();  
		 i.fillUpWidthHeight();
		 
       //call the actual drawing function (draw lines, text, etc.)
		 if (i.drawingFunction!=null) {
	       i.drawingFunction(i, regular); 
		 }			 
		 //recursive call to children
         var sortedChildren=i.orderedChildren || i.children;
            
         for (var c=0; c<i.children.length; c++) {
			  sortedChildren[c].draw(regular);
			  checkTree(i);
		 }	
		 //suffix order: make adjustments depending on children (e.g. for an array)
		 if (i.drawingFunctionPostOrder!=null) {
			 i.drawingFunctionPostOrder(i, regular); 
		 }
		 
		 i.updateActualBox();
		 //draw the background rectangle if necessary
	     i.drawBackground(true); //automatic drawing, may be disabled         
		 checkTree(i);
         //place the item at the correct coordinates
		 i.layout();
         //drawing is complete, we recover the "transition-free" item
		 i.g=i.saveG;
         //clean-up
		 delete i.saveG;
		 delete i.trans;
		 i.lastDraw=i.nextDraw;		 
	 }
  }
  
  
  
  i.drawBackground=function(automatic) {
      if (i.bgRect && (!automatic || i.bgRect.automatic)) {
        
        //  marginAndPadding(i.style.bg, "padding");
          var bbox=i.getBackgroundBBox();
//          console.log("DRAW BACKGROUND", i.id,  bbox);
          //console.log(i.type, bbox)
          if (!bbox) return false;
          
          if (i.type=="text") {console.log("text", bbox, i.style.width);}
          i.style.bg.offsetx = bbox.x-(i.style.bg.paddingLeft || 0);
          i.style.bg.offsety = bbox.y-(i.style.bg.paddingTop || 0);
          i.style.bg.w = bbox.width+(i.style.bg.paddingLeft||0) +(i.style.bg.paddingRight|| 0);
          i.style.bg.h = bbox.height+(i.style.bg.paddingTop||0)+(i.style.bg.paddingBottom || 0);
          i.bgRect.style=i.style.bg;
          codex.rect.onDraw(i.bgRect);
     }
  }  
  
  
	i.runSchedule = function() {
		var newSchedule = [];
		i.schedule.forEach(function (s) {
   		if (s[0]>1) 
				newSchedule.push([s[0]-1, s[1]-1, s[2]]);			
			else {				
				s[2] = i.setAndKeep(s[2]);
				if (s[1]>1) {
					newSchedule.push([s[1]-1, -1, s[2]]);			
				}
			}
		//	console.log(i.style.fill);
		});
		if (newSchedule.length)
		  i.schedule = newSchedule;
	    else 
		  i.schedule=null;
		
	}
	i.fillUpWidthHeight = function() {	 	
		if (i.style.w=="fill") {// && typeof parent.style.width =="number") {
            if (isNaN(i.box.container.width)) stop(i);
			i.style.w=i.box.container.width
			i.style.x+=i.box.container.x;
			i.box.container.x=0;
		}
		if (i.style.h=="fill" ) {
            if (isNaN(i.box.container.height)) stop(i);
			i.style.h=i.box.container.height	
            i.style.y+=i.box.container.y;	
            i.box.container.y  =0; 
		}	
		if (i.style.r=="fill") {
			var r=Infinity;
            if (i.box.container.width!=null) {
                r=min(r, i.box.container.width/2);
                i.style.x+=i.box.container.x ;
                i.box.container.x=0;
            }
            if (i.box.container.height!=null) {
                r=min(r, i.box.container.height/2);
                i.style.y+=i.box.container.y
                i.box.container.y  =0; 
            }
			if (r<Infinity)
				i.style.r=r;			
		}			
  }
  
  i.useAttr= function (attr, key1,key2,key3) {
	 useAttr(i,attr,key1, key2, key3);
  }
  i.useStyle= function (attr, key1, key2, key3) {
     useStyle(i, attr,key1, key2, key3);	
  }
  i.useForPdf=function (doc, f, key1, key2, key3) {
     useForPdf (i, doc, f, key1, key2, key3);  
  }
  i.useNumberForPdf=function (doc, f, key1, key2, key3) {
     useNumberForPdf (i, doc, f, key1, key2, key3);  
  }
  i.getBBox= function() {
	  if (!i.display) return i.bbox = {x:0,y:0,width:0, height:0};
	  if (i.bbox) return i.bbox;
	  //if (i.style.float) return i.bbox = {x:0,y:0,width:0, height:0};
	  
	  i.bbox=shallowCopy(i.g.node().getBBox());
	  if (!i.bbox) return i.bbox = {x:0,y:0,width:0, height:0};
	  i.bbox.x-=(i.style.marginLeft||0);
	  i.bbox.y-=(i.style.marginTop||0);
	  i.bbox.width+=(i.style.marginLeft||0)+(i.style.marginRight||0);
	  i.bbox.height+=(i.style.marginTop||0)+(i.style.marginBottom||0);	  
	  if (isNaN(i.bbox.x) || isNaN(i.bbox.y)) stop(i);
	  return i.bbox;	  
  }
  i.getParentBBox= function(evenFloat) {
	  if (i.style.float &&!evenFloat) return {x:0,y:0,width:0, height:0};
	  i.getBBox();
	  //console.log(i.bbox);

	  if (isNaN(i.style.x) || isNaN(i.style.y)) stop(i);
	  return {x:i.bbox.x + i.style.x, y: i.bbox.y+i.style.y, width: i.bbox.width, height:i.bbox.height};	  	  
	  
  }
  i.getInnerBBox= function(evenFloat) {	        
	  var b=i.childBag().getParentBBox(evenFloat);	  
	  return b;
	  
  }
  
  
  /*if (code.getBackgroundBBox) 
	  i.getBackgroundBBox = function() { return code.getBackgroundBBox(i)};
  else 
	  i.getBackgroundBBox = function() {
	     return i.childBag().getParentBBox(false);
     }
  	*/  
  if (code.getAnchoredBBox) 
	  i.getAnchoredBBox = function() { return code.getAnchoredBBox(i)};
  else 
	  i.getAnchoredBBox = function() {
		  if (i.style.float) return {x:0,y:0,width:0, height:0}
	     return i.getBBox();
     }
  
  
  i.toPdf = function(doc, opacity) {
      if (!i.display) return;
	  doc.save();
       if (IsNumeric(i.style.x)  && IsNumeric(i.style.y) ) {
		doc.translate(i.style.x, i.style.y);
        if (i.tag=="tspan") console.log("translate")
      }
      if ("opacity" in i.style) opacity*=i.style.opacity;
	  if (i.bgRect) {
        codex.rect.drawInPdf(i.bgRect,  doc, opacity);
      }
	  i.drawInPdf(i, doc, opacity);
	  i.children.forEach(function (i) {i.toPdf(doc, opacity)});	   
	  doc.restore();
	  
  }
  if (code.onBuild) code.onBuild(i);

  return i;
}

function itemBag (itemList) {
	"use strict";
	var b= {
		items:itemList||[],
		style:{},
		isItemBag:true
	}
	b.size=function() {
		return b.items.length;
	}
	b.get = function(x) {
      if (x instanceof Array) 
         return itemBag(x.map(b.get));
	  return b.items[x];
	}
	b.concat = function(b2) {
		return itemBag(b.items.concat(b2.items));
	} 
	b.merge = function(b2) {
		b.items  = b.items.concat(b2.items);
		return b;
	} 
	b.add = function(i) {
		b.items.push(i);
		return b;
	}
	b.goto = function(selector) {
		return b.items[0].goto(selector);
	}
	b.open = function(id) {
		return b.items[0].open(id);
	}
	b.close = function(id) {
		return b.items[0].close(id);
	}
	b.addTo = function(id) {
		for (var x=0;x<b.items.length; x++) {
			b.items[x].addTo(id);
		}
		return b;
	}
	b.up= function(selector) {
		return b.items[0].up(selector);
	}
	b.move=function(p,q) {
      console.log(b, " move ", p, q);
		for (var x=0;x<b.items.length; x++) {
			var P= (typeof p == "function") ? p(b.items[x], x) : p;
			var Q= (typeof q == "function") ? q(b.items[x], x) : q;
			b.items[x].move(P,Q);
		}			
		return b;
	}
	b.hide = function() {
        for (var x=0;x<b.items.length; x++) {
            b.items[x].hide();
        }           
        return b;
    }
    b.show = function() {
        for (var x=0;x<b.items.length; x++) {
            b.items[x].show();
        }           
        return b;
    }
	b.getParentBBox= function(evenFloat) { //assumes that all items have a common parent
		var bbox={x:Infinity, y:Infinity, xr:-Infinity, yb:-Infinity}
		for (var x=0;x<b.items.length; x++) {
			if (!b.items[x]) continue;
			var ib = b.items[x].getParentBBox(evenFloat);
			if (!ib || (ib.width==0 && ib.height==0)) continue;
			
			bbox.x=min(bbox.x, ib.x);
			bbox.y=min(bbox.y, ib.y);
			bbox.xr=max(bbox.xr, ib.x+ib.width);
			bbox.yb=max(bbox.yb, ib.y+ib.height);			
		}		
		if (bbox.x==Infinity) return {x:0,y:0,width:0, height:0};
		return {x:bbox.x, y:bbox.y, width:bbox.xr-bbox.x, height:bbox.yb-bbox.y};
	}
	
	b.getLayoutBBox = function(kx, kwidth) {
		var x=Infinity; 		
		var xr=-Infinity;
		for (var i=0;i<b.items.length; i++) {
			if (!b.items[i]) continue;
			var ib = b.items[i].getLayoutBBox(kx, kwidth);
			x= min(x, ib[kx]);
			xr=max(xr, ib[kx]+ib[kwidth]);
		}		
		if (x==Infinity) return {x:0,y:0,width:0, height:0};
		var box={};
		box[kx]=x;
		box[kwidth]=xr-x;
		return box;		
		
	}
	
  b.containerBox= function (key, value) {
    if (typeof value=="undefined")  {
       return b.items[0].containerBox(key);
    } else {
       for (var i=0;i<b.items.length; i++) 
         b.items[i].containerBox(key,value);
      return b;
    }
  }
  b.unionBox = function(kx, kwidth) {
       var left=0, right=0;
       for (var i=0;i<b.items.length; i++)  {
         if (!b.items[i].style.show) continue;
         var cx =b.items[i].box.actual[kx] + i.children[c].style[kx];
         var cwh =i.children[c].box.actual[kwidth]/2;
         left=min(left, cx-cwh);
         right=max(right, cx+cwh)              
         
      }
      out={};
      out[kx]=left+right/2;
      out[kwidth]=right-left;
      return out;
  }
  b.actualBox= function (key, value) {
    if (typeof value=="undefined")  {
       return b.items[0].actualBox(key);
    } else {
       for (var i=0;i<b.items.length; i++) 
         b.items[i].actualBox(key,value);
      return b;
    }
  }
  b.getMaxSize= function (key) { 
     var m=0;
     for (var i=0;i<b.items.length; i++) 
         m=max(m, b.items[i].actualBox(key));
     return m;    
  }
  b.getMinSize= function (key) { 
     var m=0;
     for (var i=0;i<b.items.length; i++) 
         m=min(m, b.items[i].actualBox(key));
     return m;    
  }
	/*
	
	b.getTheoreticalBBox = function(evenFloat) {
     if (b.style.float &&!evenFloat) return {x:0,y:0,width:0, height:0};
	  var bb=b.getParentBBox(evenFloat);
	  extendBBoxWithFixedDimensions(bb,b);
	 
	 
	  return bb;
	  
  
	}*/
   b.getInnerBBox=function(kx, kwidth) {
		var x=Infinity; 		
		var xr=-Infinity;
		for (x=0;x<b.items.length; x++) {
			if (!b.items[x]) continue;
			var ib = b.items[x].getInnerBBox(false);
			x= min(x, ib[kx]);
			xr=max(xr, ib[kx]+ib[kwidth]);
		}		
		if (x==Infinity) return {x:0,y:0,width:0, height:0};
		var box={};
		box[kx]=x;
		box[kwidth]=xr-x;
		return box;		
	};	
	b.getAnchoredBBox= function() {
		return {x : -b.style.width/2, y : -b.style.height/2, width:b.style.width, height:b.style.height};
	}
	b.set = function(s) {
		var x;
		if (typeof s=="function") {
		  for (x=0;x<b.items.length; x++) {
			  b.items[x].set(s(b.items[x],x));
		  }
		} else if (s instanceof Array) {
		  for (x=0;x<b.items.length && x<s.length; x++) {
			  b.items[x].set(s[x]);
		  }		
		} else {
		  for (x=0;x<b.items.length; x++) {
            if (typeof b.items[x] == "undefined") 
              stop(b);
			b.items[x].set(s);
		  }		  
		}
		return b;
	}
	b.on = function(when, s) {
		var x;
		if (typeof s=="function") {
		  for (x=0;x<b.items.length; x++) {
			  b.items[x].on(when, s(b.items[x],x));
		  }
		} else if (s instanceof Array) {
		  for (x=0;x<b.items.length && x<s.length; x++) {
			  b.items[x].on(when, s[x]);
		  }		
		} else {
		  for (x=0;x<b.items.length; x++) {
			  b.items[x].on(when, s);
		  }		  
		}
		return b;
	}
	b.layout= function() {
		for (x=0;x<b.items.length; x++) {
			  b.items[x].layout();
		}		
	}
	b.map = function (f) {
        return itemBag(b.items.map(f))
    }
	b.filter=function(f) {
        if (typeof f=="string") {
          var type=f;
          f=function(i) {return i.type==type};
        }
		return itemBag(b.items.filter(f))
	}
    b.filterShown=function() {
        return itemBag(b.items.filter(function(i) {return i.display}))
    }
	b.each =function(f) {
		for (var x=0;x<b.items.length; x++) {
		//	console.log("b.each : ", x, " out of ", b.items.length);
			f(b.items[x], x);
		}					
		return b;
	}
	b.getMaxInnerDimension= function (kx, kwidth) {
		var m=0;
		for (var x=0;x<b.items.length; x++) {
		
   //		console.log(b.items[x].getLayoutBBox(kx, kwidth));
			m=max(m, b.items[x].actualBox(kwidth));
		}
		return m;
	}
	b.align=function (kx, kwidth, align, targetX, containerWidth,  keepRelative) {
		if (targetX== null) targetX = b.containerBox(kx);
		if (containerWidth==null) containerWidth=b.containerBox(kwidth);
		
		//console.log(targetX, containerWidth);
		if (keepRelative) {
			var move = getAlignMove(kx, kwidth, align, targetX, containerWidth, b );
			// console.log("aligning box: "+xy(move));
			b.each(function(j) {
				j.move(move);
			})
		} else  {		
//			console.log("containerWidth: ", containerWidth);
			b.each(function(j) {
			//	console.log(targetX, containerWidth);
				j.align(kx, kwidth, align, targetX, containerWidth);
			})
		}
		return b;
	} 
	b.setWidthToMin = function (kx, kwidth) {
	  b.style[kwidth] = b.getMaxInnerDimension(kx, kwidth);
	  return b;
   }
	b.setWidthToActual = function (kx, kwidth) {
	  b.style[kwidth] = b.actualBox(kwidth);
	  return b;
   }
   b.saveAs = function(id) {
     b.items[0].root.index[id]=b; 
     return b;
   }
   b.intersect = function(otherBag) {
     return b.filter(function(i) {return otherBag.items.indexOf(i)>-1} )
   }
	
	return b;
	
}
function stop(log) {
	console.log("Error ", log);
    debugger;
	zzz.Zzzzz=zzz.zz;
}

function checkTree(item) {
	if (item.items) {
		item.each(checkTree);
		return;
	}
	if (item.tag!="tspan" && item.parent) {
        if (!("x" in item.style) || isNaN(item.style.x)) stop(item);
        if (!("y" in item.style) || isNaN(item.style.y)) stop(item);
        if (("width" in item.style) && isNaN(item.style.width)) stop(item);
        if (("height" in item.style) && isNaN(item.style.height)) stop(item);
		
	}
	item.children.forEach(checkTree);
	
}

function makeSoziBox(sozi, frame, style) {
  var holder = d3.select("svg").select("g").select("g")
  var view=sozi.presentation.frames[frame-1].cameraStates[0];
  var transform = "translate("+view.cx+","+view.cy+")rotate("+view.angle+")scale("+view.width/400+","+view.height/300+")";
  
  var fb=FrameBase(frame, holder, transform);
  fb.scaleY = view.height/300;
  return fb;
  
}
function makeFreeBox(cameraManager, frame, style) {
  //var x = cameraManager.nextFrame(camera)
  
  var fb=FrameBase(frame, cameraManager.holder, cameraManager.lastTransform(), style);
  //fb.scaleY = x.height/300;
  return fb;
  
}

frameManager = function(style, sozi)  {
	
	var fm= {
		f:1,
		topF:null,
		frames:[],
        style:style
	}
	if (!sozi) {
		fm.camera = cameraManager();
		
		fm.camera.start(style);
		
	}
	function completeCurrentFrame(leaveOne) {
      while (fm.topF && fm.topF.remainingOverlays>(leaveOne?1:0)) {          
            fm.nextOverlay({});        
      } 
    }
	fm.frame=function(s, style, camera) {
       //if (s.raw) s=s.raw;
//        console.log(String.raw(s), typeof s);
        if (!camera) camera={};
        camera.mainFrame=true;
        completeCurrentFrame(true);
        fm.nextOverlay(camera);
        console.log("*****************prepare next frame*********************");
        if (!style) style={};
        if (typeof style == "string") style={model:style};
		if (!sozi || camera) 
			fm.topF = makeFreeBox(fm.camera, fm.f, style)
		else 
			fm.topF = makeSoziBox(sozi, fm.f, style);
		fm.topF.title(s);		
		fm.frames.push(fm.topF);
		return fm.topF;	
   }
	fm.log= function() {
	 	for (i=0;i<fm.frames.length;i++) fm.frames[i].log("|");		
	}
	fm.logXY= function(layers) {
	 	for (i=0;i<fm.frames.length;i++) fm.frames[i].logXY("|", layers);		
	}
   fm.nextOverlays=function(n) {    
     for (var i=0;i<n; i++ ) {
       fm.nextOverlay(); 
     }
     return fm;
   }
   fm.nextOverlay=function(camera) {    		
		if (!camera) camera={};
		importDefault(camera, {mainFrame:false});
		
		fm.camera.nextFrame(fm.f, camera)
		
		if (fm.topF!=null) {
		//	console.log("*************    save overlay    *****************");
		  	
			fm.f++;
			fm.topF.save({show:true});
			if (logNextFrame) console.log("saved for frame "+(fm.f-1));
			
		}		
		return fm;
	}
	fm.append = function (type, style, d) {
	  return fm.topF.append(type, style, d);
   }
	fm.goto = function(selector) {
        var i=fm.frames.length-1;
        while (i>=0) {
          var x = fm.frames[i].goto(selector, true);
          if (typeof x != "undefined") return x;
          i--;          
        }
        console.error(selector+ " is not found")
       
	}
	fm.currentFrame = function() {
		if (sozi) 
			
		   return sozi.player.currentFrameIndex+1;
		else 
			return fm.camera.frame;
	}
	fm.drawing=false;
	var updateFrame = function(regular) {
		//console.log("updateFrame");
		
		if (fm.drawing) {
			if (!fm.drawAgain) {
				fm.drawAgain={regular:regular};
				return;
			} 
			fm.drawAgain.regular=fm.drawAgain.regular && regular;
         return;
		} 
		fm.drawing=true;		
		do {			
         delete fm.drawAgain;		
			var f=fm.currentFrame(); //sozi.player.currentFrameIndex+1;
			console.log("Frame "+f + (regular?"":" [special]"));			
			for (i=0;i<fm.frames.length;i++) fm.frames[i].draw(f, regular);
			drawHelpLines();
			if (fm.drawAgain) {
				console.log("draw again!");
			   regular=fm.drawAgain.regular;					
			} else break;
		} while (true);
		fm.drawing=false;
	}
	
	addMenu("Start", function() {fm.camera.goFirst()}, "Go to first frame")
	addMenu("Export HTML", exportSingleHTML, "Export as a single HTML file without dependencies (including all scripts, images and math formulas).")    
    addMenu("Export as PDF", function(){toPDF(fm, true)}, "[incomplete] Export the slides as pdf, some important differences may occur.")
    addMenu("Export graph coordinates", showGraph(fm), "Click on a graph to copy the node coordinates, to be hard-coded for future use.")
	addMenu("Clear Saved Formulas", clearLocalStorage, "Delete cached math formulas, to be recomputed with MathJax next time.")
	//addMenu("debug PDF", function(){toPDF(fm, false)}, "debug function for PDF generation")
    
    fm.run=function() {
       completeCurrentFrame(false);
       console.log("===============================");       
       console.log("======     Running !     ======");
       console.log("===============================");
		if (sozi)
			sozi.player.on("frameChange",function() {updateFrame(true)});	
		if (fm.camera) {
         fm.camera
			   .onFrameChange(function() {updateFrame(true)})
			   .run();
		}
		
	    for (i=0;i<fm.frames.length;i++) 
           fm.frames[i].firstRun();     
            
        updateFrame(false);
        updateFrame(true);
        if (fm.style.math) {
			MathJaxImport(fm.style.mathjax, function() {updateFrame(false);});
		}
	}
	
	return fm;
}
