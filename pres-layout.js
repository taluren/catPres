
/*layout :
    auto:
    spread: fill up height with gaps between elements
	 top: all elements at the top
	 bottom: all elements at the bottom
	 middle: 
	 
*/




/***
 bounding boxes:
 
 
 .getBBox()          : bbox of DOM element, in its own relative coordinates
 .getParentBBox()    : bbox of DOM element, in its parent coordinates
     *in bag
 .getBackgroundBBox(): logical area where the  background should be drawn, 
								* may be larger (e.g. fixed size cells)
								* may be smaller (e.g. with overflow)
	  
 .getInnerBBox()     : union of getParentBBox's of the children 
 .getLayoutBBox()    : bbox of the elements that need to be rendered, 
                        for layout purpose, ignoring self decoration
								in parents coordinates
 .getAnchoredBBox()  : logical area used by the element around its anchor
   



**/ 

//box: has known width and height (may be set up to drawPostOrder at the latest)
//all children should "try" to fit in the [0,width]x[0,height] box.
//does not override layoutBBox (for layout, a box bbox is the visible one)
addToCodex("box", "g", {
	getBackgroundBBox : function(i) {
		if ( i.style.width == null || i.style.height==null) stop(["box dimensions are not set",i]);
		return {x:-i.style.width/2, y:-i.style.height/2, width:i.style.width, height:i.style.height};
	},	
	getAnchoredBBox : function(i) {
		return {x:-i.style.width/2, y:-i.style.height/2, width:i.style.width, height:i.style.height};
		//return {x:i.style.x, y:i.style.y, width:i.style.width+i.style.x, height:i.style.height+i.style.y};
	}
	
	
})
addToCodex("customBGBox", "g", {
	getBackgroundBBox : function(i) {
		var b= {x:-i.bgWidth/2, y:-i.bgHeight/2, width:i.bgWidth, height:i.bgHeight};
		if ( i.bgWidth == null || i.bgHeight==null) {
			var b2 = i.childBag().getParentBBox(false);
			if (i.bgWidth== null) {
				b.x=b2.x;
				b.width=b2.width;
			}
			if (i.bgHeight == null) {
				b.y=b2.y;
				b.height=b2.height;
			}
		}
			
		return b;
	}//,	
	//getAnchoredBBox:null
})

//same as box, but also override getLayoutBBox, i.e. inner contents should never be probed.
addToCodex("blackbox", "box", {	
 onBuild: function(i){ 	
	i.getLayoutBBox= function(kx, kwidth) {	  
      if (!(kwidth in i)) i[kwidth] = i.style[kwidth];  
	  return {x:i.style.x-i.width/2, y:i.style.y-i.height/2, width:i.width, height:i.height};	  
   }

 }
});

//cell: box 
addToCodex("cell", "box", {	
 onBuild: function(i){ 
	
	i.getLayoutBBox= function(kx, kwidth) {	  
	  if (!kx || !kwidth) stop("invalid parameters");
	  var b=i.childBag().getLayoutBBox(kx, kwidth);	 
    
   	 b.x+=i.style.x;
	  b.y+=i.style.y;
	  return b;	  
   }
	
	i.move = i.moveInner;

 },
 onDraw: function (i) {
	 if (i.bgRect) i.bgRect.automatic=false; 
	 //don't draw background rectangle at normal time, let the parent trigger it instead.
	 //can be onRun	 
 }
});

addToCodex("array", "box", {
	defaultStyle:{width:null, height:null},
	onBuild: function(i) {
		if (typeof i.datum== "string") {
			i.datum={cols:i.datum}
		}
		if (!i.datum) i.datum={};
		if (!i.datum.cols) i.datum.cols="c";
		if (!i.datum.rows) i.datum.rows="m";
		
		i.currentRow=0;
		i.currentColumn=0;
		
		
	   i.vl = layoutManager(i.datum.rows, false);	
		i.hl = layoutManager(i.datum.cols, true);			
		
		i.rowBag=itemBag();
		i.colBag=itemBag();
		
		i.fillCellsUpToDimension=function(c,r, nowarning) {
			if (!nowarning && (i.colBag.size()<=c || i.rowBag.size()<=r))
				console.warn("The array is being extended to have column "+c+" and row "+r+".");
			//console.log("fill up to ",c,r);
			while (i.colBag.size()<=c) {
				i.colBag.add(itemBag())
			};
			
			while (i.rowBag.size()<=r) {
				i.rowBag.add(itemBag())
			};
			i.colBag.each(function(b) {
				while (b.size()<i.rowBag.size()) {
					var newCell = i.append("cell");
					newCell.cell = i.cell;
					newCell.appendIn = i.appendIn;
					newCell.print = i.print;
					newCell.colBag= b;
					b.add(newCell);
				};	
				// console.log("col:",b.size(),"=",b.items.length,  r);
			})
		   

			i.rowBag.each(function(b, x) {
			
				while (b.size()<i.colBag.size()) {
					var c =i.colBag.get(b.size()).get(x);
					b.add(c);
					c.rowBag = b;					
				};	
			})			
			
		}
		i.cell = function(c,r) {
			i.fillCellsUpToDimension(c,r);			
			return i.colBag.get(c).get(r);
		}
		i.appendIn=function(type,c,r, style, data, more) {
		   //console.log("**** appendIn  **** ", c,r, type);	
			
			var cell= i.cell(c,r);
			var inside =cell.append(type,style, data);
			if (more) {more(inside);}
			i.currentColumn = c;
			i.currentRow= r;
			return cell;
	   }
		
		i.print= function (text, style, data) {
			var rows = text.split("\\\\");
			for (var ir =0; ir<rows.length; ir++) {
				if (ir) {						
					i.currentColumn=0;
					i.currentRow ++;
				}
				var cells = rows[ir].split("&");
				for (var ic =0; ic<cells.length; ic++) {					
					if (ic) i.currentColumn++;
					i.appendIn("text", i.currentColumn, i.currentRow, style, data, function(i) {i.print(cells[ic])// style.text = cells[ic]
					});
				}
			}			
			return i;
		}
		
		i.fillCellsUpToDimension(i.hl.arrange.length-1, i.vl.arrange.length-1, true);
		
	},
	
		
	onDraw: function(i) {
	   i.vl.setBag(i.rowBag, true);
		i.vl.setFixedDimensions(i.style.height);						
	
	   i.hl.setBag(i.colBag, true);
		i.hl.setFixedDimensions(i.style.width);		
	   
	},
   onDrawPostOrder: function(i) {
		
		i.vl.apply();
		i.hl.apply();
		i.style.width=i.hl.totalSize;
		i.style.height=i.vl.totalSize;
		i.layout(2);
		for (var ic =0; ic<i.children.length; ic++) {					
			i.children[ic].drawBackground();
		}
			
	}
})



addToCodex("verticalVector", "customBGBox", {
	defaultStyle:{width:null, height:null,  layout:"dense", align:"c"},
	onBuild: function(i) {
		if (i.style.layout=="spread") {		  
			i.lm = layoutManager("*n*", false);	
			
		} else {//dense
			i.lm =layoutManager("n", false);
		}		
	},
	
	onDraw: function(i) {
      i.lm.setBag(i.childBag());
		
		if (i.style.layout=="spread" && i.style.height==null) console.warn("Missing height for vertical layout in \"spread\" mode")
			
		i.lm.setFixedDimensions(i.style.height);							
	
	},
   onDrawPostOrder: function(i) {
		//vertical arrange
		i.lm.apply();
		
		
		//horizontal align
		var b= i.childBag();
		if (i.style.align[0]!="n") 
			b.setWidthToMin("x","width")
			 .align("x","width",i.style.align[0],i.style.x, i.style.width, false);
	  // else 
		//	b.setWidthToActual("x", "width");
		
		//compute self dimensions
		if (i.style.width == null) 
			i.style.width=b.style.width;
		
		//if (i.style.height == null) 
		//	i.style.height=b.setWidthToActual("y", "height").style.height;
		
	   i.bgWidth = i.style.width;
		i.bgHeight = i.style.height;
		
		//layout itself and children
		i.layout(1);
	}
})


addToCodex("horizontalVector", "customBGBox", {
	defaultStyle:{width:null, height:null, y:0, layout:"dense", align:"m"},
	onBuild: function(i) {
		if (i.style.layout=="spread") {		  
			i.lm = layoutManager("*n*", true);	
			
		} else {//dense
			i.lm =layoutManager("n", true);
		}		
	},
	
	onDraw: function(i) {
		if (i.style.layout=="spread" && i.style.width==null) console.warn("Missing width for horizontal layout in \"spread\" mode")
			
      i.lm.setBag(i.childBag());
		i.lm.setFixedDimensions(i.style.width);							
	
	},
   onDrawPostOrder: function(i) {
		//arrange horizontaly
		i.lm.apply();
		
		//vertical align
		var b= i.childBag();		
		if (i.style.align[0]!="n")  {		
			b.setWidthToMin("y","height")
		   b.align("y","height",i.style.align[0],i.style.y, i.style.height,false);
		}
		
		//compute self dimensions
		if (i.style.height == null) 
			i.style.height=b.style.height;
		
        i.bgWidth = i.style.width;
		i.bgHeight = i.style.height;
		i.layout(1);
	}
})


addToCodex("vector", "customBGBox", {
	defaultStyle:{width:null, height:null,  layout:"dense", align:"c", direction:"v"},
	onBuild: function(i) {
		i.horizontal = (i.style.direction || "v")[0].toLowerCase() == "h";
		if (i.horizontal)
			codex.horizontalVector.onBuild(i);
		else 
			codex.verticalVector.onBuild(i);
	},
	onDraw: function(i) {
		if (i.horizontal)
			codex.horizontalVector.onDraw(i);
		else 
			codex.verticalVector.onDraw(i);
	},
	
	onDrawPostOrder: function(i) {
		if (i.horizontal)
			codex.horizontalVector.onDrawPostOrder(i);
		else 
			codex.verticalVector.onDrawPostOrder(i);
	}
	
})

	//usage:
	// l =layoutManager("llrrl", true)
	// l.setBag(elements to  layout, deep) //can be a bag of bag, then deep=true;
   // l.setFixedDimensions() on draw, prefix order
	// l.layout()  on draw, suffix order
function layoutManager(str, horizontal) {
	"use strict";
	var l = {
		arrange:[],
		gaps:[],
		deep:false,
		debug:false,
		horizontal:horizontal,
		kx : horizontal?"x":"y",
		//ky : horizontal?"y":"x",
		kwidth:horizontal?"width":"height",
		//kheight:horizontal?"height":"width",
		kl : horizontal?"l":"t",
		kc : horizontal?"c":"m",
		kr : horizontal?"r":"b",		
		lineExp : horizontal? /(k?[nlcr]?(?:\d*\.?\d*[%x]?)?)/ // /(k?[lcr]((\d*|\d+\.\d*|\d*\.\d+)[%x]?)?)/ :
		   : /(k?[ntmb]?(?:\d*\.?\d*[%x]?)?)/,
		singleExp: horizontal? /(k?)([nlcr]?)(?:(\d*\.?\d*)([%x]?))?/ : /(k?)([ntmb]?)(?:(\d*\.?\d*)([%x]?))?/ 
			
		                  //   /(k?[tmb]((\d*|\d+\.\d*|\d*\.\d+)[%x]?)?)/		
	}
	
	
	
	if (!str) throw("Error: empty string");
	var splits = 
	   str.replace(/ /g, '')
		   .toLowerCase()
		   .split(l.lineExp);
	if (splits[splits.length-1]=="") splits.pop();
	
	if (l.debug) console.log(str, l.lineExp, splits+"");
	while (splits.length>0) {
		var x=splits.shift();
  
			if (x == "*") {l.gaps.push("*"); continue;}
			if (x == "|") {l.gaps.push("|"); continue;}
			if (x == "," || x=="") {l.gaps.push(","); continue;}
				
  
		var match=x.match(l.singleExp);
		if (match) {
		   var c={str:x};
			c.keepRelative = match[1]=="k";
			c.align = match[2] || l.kc;
			if (isNaN(match[3])) {
				c.value= null;
				c.ratio=null;
			} else {
				c.value=match[3]*1;
				c.ratio=match[4];
				if (c.ratio=="%") c.value/=100;
			}			
         l.arrange.push(c);	
         //console.log(match, c);			
			continue;
		} else {
			var gap ={str:x};
			//@10|
		}
		
		
		
		stop("invalid section: "+x+ "in "+str);		
		
	}
	
	l.setBag = function(b, deep) {
		l.bag=b;
		l.deep=deep;
		
		while (l.arrange.length<l.bag.items.length) {
			l.arrange.push(l.arrange[l.arrange.length-1]);
		}
		while (l.gaps.length<l.bag.items.length+1) {
			l.gaps.push(l.gaps[l.gaps.length-1]);
		}
	}
	l.setFixedDimensions = function(totalSize) {
		l.totalSize=totalSize;
		l.fixedSize=0;
		l.unknownPercent=0;
		l.sumX = 0;
		if (l.debug) console.log("SetFixedDimensions "+(l.horizontal?"H":"V"));
		l.bag.each(function(i, col) {
			var a= l.arrange[col];
			var width=null;
			if (a.ratio=="") 	{
				width=a.value;	
			}
			if (a.ratio=="%") {
				if (l.totalSize !=  null) 
					width = a.value * l.totalSize;
				else
					l.unknownPercent += a.value;
				//console.log(width, isNaN(l.totalSize), l.totalSize);
			}
            if (l.debug) console.log(width);				
			if (a.ratio == "x") l.sumX += a.value;
			//if (width!=null)  //add this if to keep child dimensions ... TODO
               i.style[l.kwidth] = width;
			if (width) l.fixedSize+=width;
		})
		
		if (l.totalSize != null) {
		   var x = (l.totalSize-l.fixedSize)/l.sumX;		
			if (l.debug) console.log("set x values with factor ",x);
			l.bag.each(function(i, col) {
				var a= l.arrange[col];
				if (a.ratio == "x") {
					var width = a.value * x;
				   i.style[l.kwidth] = width;
				   l.fixedSize+=width;
				}
			})			
		}
		
		if (l.deep) 
			l.bag.each(function(i, col) {
			 	i.each(function(j) {j.style[l.kwidth] = i.style[l.kwidth]});
			})
			
		if (l.debug) {
			console.log("end of setFixed dimensions: cols with fixed width only")
			console.log(l.bag.items.map(function(b,col) {return l.arrange[col].str+":"+b.style[l.kx]+"[+"+b.style[l.kwidth]+"]";}))
		}
	}
	
	l.computeMissingSizes = function() {
		if (l.debug) console.log("compute missing sizes "+(l.horizontal?"H":"V"));
		l.minX =0;
		l.minPercent = 0;
		l.bag.each(function(i, col) {
			
			if (i.style[l.kwidth]!=null) { return;};
			
			
			var a= l.arrange[col];
			if (!l.deep || a.keepRelative) { 
				i.setWidthToActual(l.kx, l.kwidth);
				//i.style[l.kwidth] = i.getLayoutBBox(l.kx, l.kwidth)[l.kwidth];
				if (l.debug) console.log("col ", col, " gets real width = ", i.style[l.kwidth]);
			}
			else {
				i.setWidthToMin(l.kx, l.kwidth);
				if (l.debug) console.log("col ", col, " gets min  possible width = ", i.style[l.kwidth]);
				//i.style[l.kwidth] = i.getMaxInnerDimension(l.kwidth);
			}			
		
			if (l.debug) console.log("box width according to bbox:", i.style[l.kwidth]);
			if (a.ratio=="%" || a.ratio=="x") {
				if (a.ratio =="x") {
					l.minX= max(l.minX, i.style[l.kwidth]/a.value);
				}
				if (a.ratio =="%") {
					l.minPercent= max(l.minPercent, i.style[l.kwidth] /a.value);
				}
			} 
			if (a.value==null) {
				l.fixedSize+=i.style[l.kwidth];
			}
		})
		
		if (l.totalSize==null) {
			//compute width of cells with "%" and "x"			
			if (l.debug) console.log("l.minX", l.minX, "l.minPercent", l.minPercent);
			
			//set width of cells with an "x" to minimum possible value to avoid overlap
			l.bag.each(function(i, col) {
				var a= l.arrange[col];
				if (a.ratio =="x") {
					i.style[l.kwidth] = l.minX * a.value;
					l.fixedSize += i.style[l.kwidth];
				}			
			})
			
			//set width of cells with a % to the minimum so that:
			//    - there is no overlap in % cells
			//    - the rest (100 - % values) can contain the rest of the array
			// if there is no rest: behave like "x"
			if (l.unknownPercent>0) {
				if (l.unknownPercent>=1 && l.fixedSize>0) stop("invalid total percentage in unknown size layout");				
				
				var percent = l.fixedSize / (1 - l.unknownPercent);
				if (isNaN(percent)) percent=0;				
				l.totalSize = max(percent, l.minPercent);
		//		console.log("100% = ", percent);
				l.bag.each(function(i, col) {
					var a= l.arrange[col];
					if (a.ratio =="%") {
						i.style[l.kwidth] = l.totalSize * a.value;
						l.fixedSize += i.style[l.kwidth];
					}
				});			
			}
		
		}
		//copy width from bag to each child
		if (l.deep) 
			l.bag.each(function(i, col) {
			 	i.each(function(j) {j.style[l.kwidth] = i.style[l.kwidth]});
			})
		
		
		if (l.totalSize==null) l.totalSize = l.fixedSize;
		
		if (l.debug) {		
			console.log("end of setFixed dimensions: all width should be set")
			console.log(l.bag.items.map(function(b,col) {return l.arrange[col].str+":"+b.style[l.kx]+"[+"+b.style[l.kwidth]+"]";}))
		} 
	}
	
	
	l.computePositions = function() {
		if (l.debug) console.log("compute positions " +(l.horizontal?"H": "V"), " width: ", l.totalSize)
		var ngaps= l.gaps[0]=="*"?1:0; 
		var cursor=0;
		
		l.bag.each(function(child, col) {
			
			child.style[l.kx] = cursor - child.getAnchoredBBox()[l.kx];
			if (l.debug) console.log("cursor: ",cursor, child.getAnchoredBBox(), child.style);
			cursor += child.style[l.kwidth];
			if (l.gaps[col+1]=="*") ngaps++;
			
		})
		var rest=l.totalSize - cursor;
		if (l.debug) console.log("rest : ", rest, ngaps);
		if (rest>0 && ngaps>0) {
			var delta= 0;//rest/ngaps; 
			l.bag.each(function(child, col) {
				if (l.gaps[col]=="*") {
					delta+=rest/ngaps;
				}
				child.style[l.kx] += delta;	
				
			})	
		}	
		l.bag.each(function(child, col) {
			
			
				child.style[l.kx] -=  l.totalSize/2;	//assume anchor at middle of container
				
		});
		if (l.deep) {
			l.bag.each(function(child, col) {
				child.each(function(i) {
					i.style[l.kx] = child.style[l.kx];
				})
				if (l.debug) console.log("child x width:", child.style[l.kx], child.style[l.kwidth]);
			})	
		}
		l.bag.each(function(child, col) {
			
			
			var a= l.arrange[col];
			
			if (l.debug) console.log("align bag: "+l.kx+a.align, child.style[l.kx], child.style[l.kwidth])
			
			child.align(l.kx, l.kwidth, a.align, null, null, a.keepRelative);
			
			
		});	
		
	}
	l.apply = function() {
		if (l.debug) console.log("Apply layout manager ", l.arrange, l.totalSize);
		if (l.totalSize == null) {
			l.computeMissingSizes();
		} else {
			l.bag.each(function(i, col) {
				if (i.style[l.kwidth]==null)  
				   i.setWidthToActual(l.kx, l.kwidth);
			});			
		}
		l.computePositions();		
		if (l.debug) console.log("Apply layout manager ", l.arrange, " : complete.");
	}
	
	var color= {vector:"red", 
	            horizontalVector:"blue", 
					text:"green",
					sweetTextLine:"yellow",
					array:"purple"}
	l.drawHelpLines=function (g) {
		g.selectAll(".lmHelpLines"+l.kx).remove();
		l.bag.each(function(child, col) {
			//console.log(g, g.datum());
			g.append("rect")
			  .attr("x",-3-col/2)
			  .attr("y",-3-col/2)
			  .attr("width",6+col)
			  .attr("height",6+col)
			  .style("opacity",0.5)
			  .style("stroke","black")
			  .attr("class", "lmHelpLines"+l.kx)
			  .style("fill", color[g.datum().type] ||"gray")
			  .attr(l.kx, child.style[l.kx]-child.style[l.kwidth]/2)
			  .attr(l.kwidth, child.style[l.kwidth])				
		});		
	}
	return l;
	
}
var needHelpLines = [];
function addHelpLines(i) {
	needHelpLines.push(i);
}
function drawRecursiveHelpLines(i) {
		if (i.vl) i.vl.drawHelpLines(i.g);
		if (i.hl) i.hl.drawHelpLines(i.g);
		if (i.lm) i.lm.drawHelpLines(i.g);
		//console.log(i);
		i.children.forEach(drawRecursiveHelpLines);			
}
	
function drawHelpLines() {
	
	needHelpLines.forEach(drawRecursiveHelpLines);
}

