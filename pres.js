
var alignDebug = false;
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
//********************************************//

function importDefault(obj, def, def2, def3) {
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
	var out={};
	for (key in s) {
		if (keys.indexOf(key)==-1) {
			out[key] = s[key];
		}
	}
   return out;		
}
function copyWithDefault(obj, def) {
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
	
	var bbox = element.getLayoutBBox(kx, kwidth);		

	
	
	
	if (targetWidth==null) stop(["Cannot align when "+kwidth+" is not defined", element]);
	
	if (align == "l" || align=="t") 
					move[kx] = (targetX - targetWidth/2) - ( bbox[kx] )
	if (align == "c" || align=="m")  
					move[kx] = targetX                   - ( bbox[kx] + bbox[kwidth]/2 );
	if (align == "r" || align=="b") 
					move[kx] = (targetX + targetWidth/2) - ( bbox[kx] + bbox[kwidth] )
		
   if (alignDebug) console.log("align "+kx+align, move.x,targetX,targetWidth, bbox[kx], bbox[kwidth]);
	return move;	
}
	
function itemAndFrameFunctions(i) {
	//i.transitions=[];

	
   i.append=function (type, style, d) {
	  if (i.mainItem)
	     return Item(i.mainItem, type, style, d);
     else
		  return Item(i, type, style, d);
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
  i.goto = function(selector) {
	  var sel=selector.split("#");
	  if (sel[1]) return i.root.index[sel[1]];
	  return i.root.down(sel);
  }
  i.up = function(selector) {
	  if (!i.parent)   return null;
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
	  
	  
	  var s={};
	  importDefault(s, i.style, i.defaultStyle, inheritStyle);  	  	  
	  if (i.parent) {
		  while (i.parent.history.length>i.history.length+1) {
			  i.history.push(importDefault({show:false}, s));
			  i.showBefore=false;
		  }
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
	//  console.log(i.history.length);
   /*  if (i.fortrans) {
		  if (!i.transitions[ov]) i.transitions[ov]={back:null, front:null};
		  i.transitions[ov].front=i.fortrans;
		  delete i.fortrans;
	  }
     if (i.backtrans) {
		  if (!i.transitions[ov-1]) i.transitions[ov-1]={back:null, front:null};
		  i.transitions[ov-1].back=i.backtrans;
		  delete i.backtrans;
	  }*/
	  
	  for (var c=0; c<i.children.length; c++) {
		  i.children[c].save(copyExceptKeys(s, ["x", "y", "opacity", "margin","width", "height", "marginTop","marginBottom","marginLeft","marginRight","bg", "align","alignV", "model"]));
	  }	
	  processTransition(i);
	  
	  if (i.savingFunction) i.savingFunction(i, s);
	  
	  
	  //run scheduled style for next overlay
	  if (i.schedule) i.runSchedule();
	  
  }
  
}
function useAttr(i,attr,key1, key2, key3) {
	key1 = key1 ||attr;  
	if (key1 in i.style) {
		i.g.attr(attr,i.style[key1]);		
		return;
	}	
	if (key2!=null) {
		if (key2 in i.style) {
			i.g.attr(attr,i.style[key2]);		
			return;
		} 
		if (key3!=null && key3 in i.style) {
			i.g.attr(attr,i.style[key3]);		
			return;
		}
	}
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
	  index:{},
	  style:style,
	  history:[]
  } 
  fb.root=fb;
  fb.title=function(s) {
		fb.goto("#title")//.children[0]
		  .set({text:s});
  }
  fb.draw=function(f, regular) {
	  
	  for (var c=0; c<fb.children.length; c++) {
		  fb.children[c].load(f, regular);
	  }
	  checkTree(fb);
	//  console.log("checked");
    
	  //fb.logXY();
	  for (var c=0; c<fb.children.length; c++) {
		  fb.children[c].draw(regular);
	  }	  
     checkTree(fb);//console.log("checked");
  
  } 
  itemAndFrameFunctions(fb);  
  frameStyleCatalog[fb.style.model||fb.defaultStyle.model](fb);
  fb.mainItem = fb.goto("#main")||fb;
  
		
		
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
	  console.log("Warning: type "+type+" unknown.");
  }
  var tag=code.tag;
  var id = splitTandId[1] || (type+"-"+(nextId++));
  
  var i= {
    parent:parent,
	 frame:parent.frame, //+parent.history.length,
	 root:parent.root, //+parent.history.length,
	 type:type,
	 tag:tag,
	 id:id,
    g:parent.g.append(tag).attr("class",type),//.style("visibility", "hidden"),
	 style:(style||{}),
	 defaultStyle:code.defaultStyle || {},
    children:[],
	 history:[],
	 lastDraw:-2,
	 bgRect:null,
	 showBefore:true,
	 showAfter:true,	 
	 drawingFunction:code.onDraw,
	 drawingFunctionPostOrder:code.onDrawPostOrder,
	 loadingFunction:code.onLoad,
	 savingFunction:code.onSave,
	 layoutFunction:code.onLayout,
	 datum:d,
	 schedule:[]
  }
  
  i.root.index[id] = i;
  i.g.attr("id", i.id);
  if (i.parent.children.length>0) i.parent.children[i.parent.children.length-1].nextSibling=i;
  i.parent.children.push(i);
  i.g.datum(i);
  /*if (d && (typeof d == "object") && d.id) {
     i.g.attr("id", d.id);
  }*/
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
  }
  i.show = function () {
	  i.style.show =true;
  }  
  i.set=function(s) {
	  for (var k in s) {
		  if (s[k]==null) {
			  delete i.style[k];
			  console.log ("set ",s, " delete ", k);
		  }
		  else 
			  i.style[k]=s[k];		 		  
	  } 
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
	  //i.propagate(dx, function(i,v) {
	  if (typeof dx=="object") {
		  dy=dx.y;
		  dx=dx.x;
	  }
	  if (isNaN(dx) || isNaN(dy)) {
			console.log("move "+xy(dx,dy));	    
		  zzz.zz=0;
	  }
	  i.style.x=i.style.x||i.defaultStyle.x||0; 
	  i.style.x += dx
	  //i.propagate(dy, function(i,v) {
	  i.style.y=i.style.y||i.defaultStyle.y||0; i.style.y += dy//});	  	  
	  return i;	  	  
  }
  i.moveInner=function(move) {
	 for (var c=0; c<i.children.length; c++) {
		  i.children[c].move(move.x, move.y)//.layout();		  
	 }
	 //i.layout();
  }

  i.decoration=function (codex, style) {
	  
	  if (typeof codex== "object") {style=codex; codex="border"};
	  if (!style) style={};
	  if (!i.bgRect) {
		  i.bgRect={
			   g:i.g.insert("rect", ":first-child").attr("class", "background"),				
				useAttr : function (attr, key1,key2,key3) {  useAttr(i.bgRect,attr,key1, key2, key3);},
  
				useStyle :function (attr, key1,key2,key3) {useStyle(i.bgRect, attr,key1,key2,key3);},
				automatic : true //disable this flag if  background box cannot be computed at draw time. Call i.drawBackground(false) later on.
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
	  if (containerWidth == null) containerWidth = i.style[kwidth];	  
	  i.move(getAlignMove(kx, kwidth, align, targetX||0, containerWidth, i));
  }
	
  i.get = function(c) {
	  console.warn("deprecated");
	  return i.children[c];
  }
  /*i.transition = function(t) {
	  i.fortrans=i.backtrans = t;
	  return i;
  }
  i.forwardTransition = function(t) {
	  i.fortrans=t;
	  return i;
  }
  i.backwardTransition = function(t) {
	  i.backtrans=t;
	  return i;
  } */ 

  i.allNodes = function() {
	  var b= itemBag([i]);
	  for (var c=i.children.length-1; c>=0; c--) {
		  b.merge(i.children[c].allNodes());
	  }	
	  return b;
  }
  i.childBag = function() {
	  return itemBag(i.children);
  }
  
	i.on = function(when, style) {
		if (typeof when=="number") 
			i.schedule.push([when,when+1, style])
		else {
			if (when.length==1)
				i.schedule.push([when[0], -1, style])
			else
				i.schedule.push([when[0], when[1]+1, style])			
		}
//		console.log(i.schedule);
		return i;
			
	}
	
	/****private ***/
	i.setWidthToActual = function (kx, kwidth) {
	  i.style[kwidth] = i.getLayoutBBox(kx, kwidth)[kwidth];
	  return i;
   }
  
	i.setWidthToMin = i.setWidthToActual;
	
  i.drawBackground=function(automatic) {
	  if (i.bgRect && (!automatic || i.bgRect.automatic)) {
		
		//  marginAndPadding(i.style.bg, "padding");
		  var bbox=i.getBackgroundBBox();
		  console.log(i.type, bbox)
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
  /*i.onDraw=function (f) {
	  i.drawingFunction =f;	  
  }*/
  
  i.load=function(f, regular) {
	 var ov=f-i.frame;
    //console.log("draw "+i.type+" for ov "+ov);
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
	 if (i.nextDraw != i.lastDraw ||!regular) {
		 i.style = shallowCopy(i.history[i.nextDraw]);
		 i.trans = getTransition(i.style, i.nextDraw  - i.lastDraw)/* i.transitions[i.nextDraw];
		 if (i.trans && i.lastDraw!=-2) {
			 i.trans=i.trans[(i.lastDraw>i.nextDraw?"back":"front")];
		 } else {
			 i.trans=i.parent.trans;
		 }*/
		 //pick only right direction, and check that last != -2, also inherit.
		 if (show==null) show=i.style.show;
		 i.display=show;
		 //i.g.style("visibility", show?"visible":"hidden");
		 //i.g.style("opacity", show?"1":"0.5");
		 i.g.style("display", show?null:"none");
	 } 
	 
	 if (i.loadingFunction) i.loadingFunction(i, show);
	 for (var c=0; c<i.children.length; c++) {
		  i.children[c].load(f, regular);
	 }
  }
  i.layout = function(layers) {
	  i.bbox=null;
	  if (i.layoutFunction) i.layoutFunction(i);
	  if (layers) {
		 for (var c=0; c<i.children.length; c++) {
			  i.children[c].layout(layers-1);
		 }	
		  
	  }
  }
  i.draw=function(regular) {	  
	 i.bbox=null;
	 if (i.lastDraw!=i.nextDraw || !regular) {
		 i.saveG=i.g;
		 if (i.trans && regular) {
		    //var side=(i.lastDraw>i.nextDraw?"back":"front");
			 console.log("transition:"+i.type, i.trans);
			 i.g = i.g.transition(
			 //i.g = 
			           transitionShop[i.trans].make().transObj);//.select(i.g.node()); //());
		 }
		 i.fillUpWidthHeight();
		 checkTree(i);
		 if (i.drawingFunction!=null) {
	       i.drawingFunction(i, regular); 
		 }			 
		 //if (i.parent.parent)
		 checkTree(i);
		 for (var c=0; c<i.children.length; c++) {
			  i.children[c].draw(regular);
			  checkTree(i);
		 }	
		 if (i.drawingFunctionPostOrder!=null) {
			 i.drawingFunctionPostOrder(i, regular); 
		 }
	    i.drawBackground(true); //automatic drawing, may be disabled
		 checkTree(i);
		 i.layout();
		 i.g=i.saveG;
		 delete i.saveG;
		 delete i.trans;
		 i.lastDraw=i.nextDraw;		 
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
	 	if (i.style.width=="fill" && typeof parent.style.width =="number") {
			i.style.width=parent.style.width;
			//i.style.x=i.style.width/2;
		}
		if (i.style.height=="fill" && typeof parent.style.height =="number") {
			i.style.height=parent.style.height;
			//i.style.y=i.style.height/2;			
		}	
		if (i.style.w=="fill" && typeof parent.style.width =="number") {
			i.style.w=parent.style.width;
			//i.style.x=i.style.w/2;
		}
		if (i.style.h=="fill" && typeof parent.style.height =="number") {
			i.style.h=parent.style.height;
			//i.style.y=i.style.h/2;			
		}	
		if (i.style.r=="fill") {
			var r=Infinity;
			if (typeof parent.style.width =="number" ) {
			//   i.style.x=parent.style.width/2;				
				r=min(r, parent.style.width/2);
			}
			if (typeof parent.style.height=="number" ) {
			//   i.style.y=parent.style.height/2;				
				r=min(r, parent.style.height/2);
			}
			if (r<Infinity)
				i.style.r=r;			
		}	
		//if (typeof i.style.width== "string") i.style.width*=1;
		//if (typeof i.style.height== "string") i.style.height*=1;
		//i.style.w=i.style.w*1;
		//i.style.h=i.style.h*1;
		
  }
  
  i.useAttr= function (attr, key1,key2,key3) {
	   useAttr(i,attr,key1, key2, key3);
  }
  i.useStyle= function (attr, key1, key2, key3) {
     useStyle(i, attr,key1, key2, key3);	
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
	 // if (i.style.float&&!evenFloat) return {x:0,y:0,width:0, height:0};	  
	  
	  var b=i.childBag().getParentBBox(evenFloat);	  
	  
	  
	  return b;
	  
  }
  i.getLayoutBBox= function(kx, kwidth) {
	  return i.getParentBBox();
  }
  
  if (code.getBackgroundBBox) 
	  i.getBackgroundBBox = function() { return code.getBackgroundBBox(i)};
  else 
	  i.getBackgroundBBox = function() {
	     return i.childBag().getParentBBox(false);
     }
  	  
  if (code.getAnchoredBBox) 
	  i.getAnchoredBBox = function() { return code.getAnchoredBBox(i)};
  else 
	  i.getAnchoredBBox = function() {
		  if (i.style.float) return {x:0,y:0,width:0, height:0}
	     return i.getBBox();
     }
  
  
  if (code.onBuild) code.onBuild(i);

  return i;
}

function itemBag (itemList) {
	"use strict";
	var b= {
		items:itemList||[],
		style:{}
	}
	b.size=function() {
		return b.items.length;
	}
	b.get = function(x) {
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
	b.up= function(selector) {
		return b.items[0].up(selector);
	}
	b.move=function(p,q) {
		for (var x=0;x<b.items.length; x++) {
			var P= (typeof p == "function") ? p(b.items[x], x) : p;
			var Q= (typeof q == "function") ? q(b.items[x], x) : q;
			b.items[x].move(P,Q);
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
	b.filter=function(type) {
		return itemBag(b.items.filter(function(i) {return i.type==type}))
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
			m=max(m, b.items[x].getLayoutBBox(kx, kwidth)[kwidth]);
		}
		return m;
	}
	b.align=function (kx, kwidth,align, targetX, containerWidth,  keepRelative) {
		if (targetX== null) targetX = b.style[kx];
		if (containerWidth==null) containerWidth=b.style[kwidth];
		
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
	  b.style[kwidth] = b.getLayoutBBox(kx, kwidth)[kwidth];
	  return b;
   }
	
	return b;
	
}
function stop(log) {
	console.log("Error ", log);
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
		frames:[]
	}
	if (!sozi) {
		fm.camera = cameraManager();
		
		fm.camera.start(style);
		
	}
	fm.frame=function(s, style, camera) {		
	   if (!camera) camera={};
		camera.mainFrame=true;
		while (fm.topF && fm.topF.hasSchedule()) {
			
			//if (fm.topF) console.log(fm.topF.hasSchedule());
			fm.nextOverlay({});
		} 
	   fm.nextOverlay(camera);
	   console.log("*****************prepare next frame*********************");
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
   fm.nextOverlay=function(camera) {			
		if (!camera) camera={};
		importDefault(camera, {mainFrame:false});
		
		fm.camera.nextFrame(fm.f, camera)
		
		if (fm.topF!=null) {
		//	console.log("*************    save overlay    *****************");
		  	
			fm.f++;
			fm.topF.save({show:true});
			console.log("saved for frame "+(fm.f-1));
			
		}		
	}
	fm.append = function (type, style, d) {
	  return fm.topF.append(type, style, d);
   }
	fm.goto = function(selector) {
		return fm.topF.goto(selector);
	}
	fm.currentFrame = function() {
		if (sozi) 
			
		   return sozi.player.currentFrameIndex+1;
		else 
			return fm.camera.frame;
	}
	fm.drawing=false;
	var updateFrame = function(regular) {
		console.log("updateFrame");
		
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
			console.log("Frame "+f + (regular?"":" --special--"));			
			for (i=0;i<fm.frames.length;i++) fm.frames[i].draw(f, regular);		
			if (fm.drawAgain) {
				console.log("draw again!");
			   regular=fm.drawAgain.regular;					
			} else break;
		} while (true);
		fm.drawing=false;
	}
	
	
	fm.run=function() {
	   fm.nextOverlay();
		if (sozi)
			sozi.player.on("frameChange",function() {updateFrame(true)});	
		if (fm.camera) {
         fm.camera
			   .onFrameChange(function() {updateFrame(true)})
			   .run();
		}
			
		updateFrame(false);
		if (MathJaxImport) {
			MathJaxImport(fm.localImport, function() {updateFrame(false);});
		}	
	}
	
	return fm;
}
