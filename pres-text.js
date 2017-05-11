 /*
  **Text areas**
  
  .print, .println, .ln

  
   align: left / center / right (along the "x" vertical line)
 
 */
 
 var debugMathParsing = false;

addToCodex("caption", "svgtext", {
     defaultStyle: {offsety : 4},
	 onBuild: function(i) {
         codex.svgtext.onBuild(i);
		 if (typeof i.datum=="string")
			 i.style.text=i.datum;
	 }
}); 


addToCodex("niceBox","vector",  {
  defaultStyle: {width:300, titleBG:"#400060", contentBG:"#602080"},
  onBuild:function(i) {
    codex.vector.onBuild(i);
    if (!i.datum) i.datum={};  
    if (typeof i.datum == "string") i.datum={title: i.datum}       
    i.title= i.append("writer").decoration("background", {fill:function() {return i.style.titleBG}})
    i.content=i.append("writer").decoration("background", {fill:function() {return i.style.contentBG}})
    i.title.box.bg.use="container"
    i.content.box.bg.use="container"
    i.title.write(i.datum.title);
    i.write=i.content.write;    
  }
  
})

addToCodex("writer","g",  {
	  
	  onBuild: function(i) {
          if (!i.datum) i.datum={};          
          if (!i.datum.cols) i.datum.cols="l";
          if (!i.datum.rows) i.datum.rows="t"; 
           
		  i.currentArray = i.append("array", {}, {cols:i.datum.cols, rows:i.datum.rows});
		  i.currentParagraph=i.currentArray.appendIn(0,0,"text");
		  i.currentLine = i.currentParagraph.append("sweetTextLine")  
		  i.openedSvgText = null;
		  i.openedBags = [];
		  i.currentCoords=[0,0];
		  i.checkIsArray= function() { //private
			  if (i.currentArray) return;
			  //todo: make this an item function
			  i.currentArray = i.append("array")
			  i.children.splice(1, i.children.indexOf(i.currentParagraph))
			  i.currentArray.children.push(i.currentParagraph);
			  
		  }
		  i.addToBags= function(j) {
			    i.openedBags.forEach(function (b) {
						  b.add(j);						    
					  })
					
		  }
		  
          i.currentIndent = "";
          i.enumerateCount = [];
          i.processIndentString= function(bullet) {
            if (bullet==null)  //if no bullet is provided: indend as previous line, but don't draw any bullet
              return i.currentIndent
            bullet = bullet||"";//i.currentIndent||"";
            while (i.enumerateCount.length<bullet.length) 
              i.enumerateCount.push(0);
                  
            var reset=(bullet=="");
            var out=[];
            for (var p=0;p<bullet.length; p++) {
                if (reset) 
                  i.enumerateCount[p]=0;
             
                
                if (bullet[p]=="a") {
                  out.push("abcdefghijklmnopqrstuvwxyz"[i.enumerateCount[p]%26]);
                }else  if (bullet[p]=="A") {
                  out.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i.enumerateCount[p]%26]);
                }else if (bullet[p]=="1") {
                  out.push((i.enumerateCount[p]+1)+"");
                }else if (bullet[p]=="i") {
                  out.push(romanize(i.enumerateCount[p]+1).toLowerCase());
                }else if (bullet[p]=="I") {
                  out.push(romanize(i.enumerateCount[p]+1));
                }else  out.push(bullet[p]);   
                
                if (bullet[p]!=" ") {
                  i.enumerateCount[p]++;
                  reset = true;
                }
            }
            if (reset)
              for (var p=out.length; p<i.enumerateCount.length; p++) {
                  i.enumerateCount[p]=0;
              }

            i.currentIndent = Array(out.length+1).join(" ");           
            return out;
          }
		  i.write = function (s) {
             if (s instanceof Array)
               s=s.raw[0]
             console.log(s);
             var a=parser.parse(s);
             i.writeParsedInput(a);
             return i;
          }
		  i.writeParsedInput=function(a) {
			  console.log("write "+a.length+" tokens");
			  var token;
			  while ((token= a.shift())!=null) {
				  console.log(token);
				  if (typeof token == "string") {
                      //print a regular string 
					  if( !i.openedSvgText)
						  i.openedSvgText = i.currentLine.append("svgtext")
					  var x=i.openedSvgText.append("tspan", {text:token});
					  i.addToBags(x);
					  continue;
				  }
				  if (typeof token != "object") 
					  console.error("invalid token type", token);
				  
				  if (token.array) {
                      //array-control token: & and //
					  i.checkIsArray();
					  i.openedSvgText =null;
					  if (token.array=="&") i.currentCoords[1]++;
					  if (token.array=="//") {
					    i.currentCoords[0]++;
						i.currentCoords[1]=0;
					  }
					  i.currentParagraph=i.currentArray
					                      .appendIn(i.currentCoords[1], i.currentCoords[0], "text");
                      i.currentLine = i.currentParagraph.append("sweetTextLine")  
                      i.currentLine.setBullet(i.processIndentString(token.indenter.indent))
				  }
				  if ("math" in token) {
                      //math formula token: $...$
					  i.openedSvgText =null;
                      var x= i.currentLine.append("mathBox",{}, {math:token.math});
                      i.addToBags(x);
                      continue;
				  }
				  if ("newline" in token) {
                      //new line token: \n, maybe with a bullet command, e.g. "\n  -|"
					  i.openedSvgText = null;
					  i.currentLine = i.currentParagraph.append("sweetTextLine");               i.currentLine.setBullet(i.processIndentString(token.indenter.indent))  
                        
                      continue;
				  }
				  if ("inside" in token) {
                      //a complex command: \(params)#(id){..contents..}
					  if (token.param && token.param.box) {
                        //the token is "boxed" (open a new paragraph for it)
                        var extra={};
                        if ("array" in token.param) {
                          if (typeof token.param.array=="String") {
                             extra.cols=token.param.array;
                          } else {
                            if (token.param.cols) extra.cols=token.param.cols;
                            if (token.param.rows) extra.cols=token.param.rows;
                          }
                        }
           
                        var x=i.currentLine
                                  .append("g"+(token.id?"#"+token.id:""))
                                  .append("writer",{},extra)
                        i.addToBags(x);
                        x.writeParsedInput(token.inside);
                      } else {
                        var bag = itemBag();
                        i.openedBags.push(bag);
                        i.writeParsedInput(token.inside);
                        i.openedBags.pop();
                        if (token.param) 
                          bag.set(token.param);
                        if (token.id) 
                          i.root.index[token.id]=bag;
                      }
                      continue;
				  }
			  }
		  }
	  }
})

addToCodex("text","verticalVector",  {
		defaultStyle: {align:"left", layout:"dense", width:null, height:null} ,
		onBuild:  function (i) {
			  codex.verticalVector.onBuild(i);
			  i.datum=i.datum || {};
			  if (!("x" in i.style)) {
				  
				  var column=i.datum.column ||1;
				  var columns=i.datum.of || 1;
				  i.style.x = 0;//((column-1)/columns*2-1)*170;
			  }
			  /*
			  i.printBag = function(x) {
				  var b=  itemBag(x?[x]:[]);
				  b.print=function(s, style,d) { 
					  b.merge(i.print(s,style,d));
					  return b;
				  }
				  b.p=b.print;
				  b.printnl=function(s, style,d) { 
				     b.merge(i.printnl(s,style,d));
					  return b;
				  }
				  b.nl=function() { 
				     b.merge(i.nl());
					  return b;
				  }
				  b.freeBox=function(content) {
					  b.merge(i.freeBox(content));
					  return b;
				  }
				  return b;				  
			  }
			  i.nl=function(style) {
				  i.append("sweetTextLine",style);
				  return i.printBag();  
			  };
			  i.nl();
			  i.print=function(s, style,d) {
				  var b=i.printBag();;  
				  var ss = s.split("\n");
				  while (ss.length>1) {
					  i.getLast("sweetTextLine").print(b, ss.shift(),style,d);			
					  i.nl();
				  } 
				  i.getLast("sweetTextLine").print(b, ss.shift(),style,d);
				  return	b;			  
			  }
			  i.p=i.print;
			  i.printnl=function(s, style,d) {
				  var b=i.print(s,style,d);
				  i.nl();
				  return b;
			  }
			  i.freeBox=function (content) {
				  return i.printBag(i.getLast("sweetTextLine").freeBox(content));
			  }
			  */
              
              /*var lineIndex=1;
              i.getLine= function(l) {
                  return i.down("#"+i.id+"/line"+l);
              }
              i.getLines= function(ll) {
                if (ll=="") return itemBag([]);
              */
                //if (typeof ll=="string") ll=ll.split(/\ *;\ */);             
                /*return itemBag(ll.map(i.getLine));
              }*/
                
              /*
              i.nnl=function(bullet, style) {                
                  i.append("sweetTextLine#"+i.id+"/line"+(lineIndex++), style)
                    .append("bullet",{bullet:processBullet(bullet)}, style) ;
                  //if (bullet==null) bullet=i.currentIndent;
                     
                  return i; //.printBag();  
              };
              i.np = function (s, style, d) {
                  if (!style) style={};
                  style=shallowCopy(style);
                  var bullet=null;                  
                  if ("bullet" in style) {
                     if (typeof style.bullet=="number") { 
                       bullet=Array(style.bullet).join(" ")+".";
                     } else {
                       bullet=style.bullet;
                     }                     
                     delete style["bullet"];                                         
                  } else if (s.indexOf("|")>=0) {
                    var spl = s.split("|");
                    bullet = spl.shift();
                    s=spl.join("|");                    
                  }
                  if (bullet!=null) {
                    i.nnl(bullet, style);
                    i.currentIndent = Array(bullet.length+1).join(" ");
                  }           
                  var ss = s.split("\n");
                  var b=i.printBag();
                  while (ss.length>1) {
                      i.getLast("sweetTextLine").print(b, ss.shift(),style,d);          
                      i.nnl(i.currentIndent, style);
                  }
                  i.getLast("sweetTextLine").print(b, ss.shift(),style,d);
                  return   i;                        
                  
              }*/
              
		}
	});
	
	
addToCodex("sweetTextLine", "horizontalVector", {
	  defaultStyle:{x:0,y:0, align:"none", layout:"dense", marginTop:1,marginBottom:1},
		onBuild:   function(i) {
			  codex.horizontalVector.onBuild(i);
			  i.firstPrint=true;;
              i.setBullet = function(bullet) {
                  i.append("bullet", {bullet:bullet});            
              }
			/*  i.print=function(bag, s, style,d) {
				   if (i.firstPrint && style && style.bullet) {
						i.append("bullet", style);											
					}
					if (i.firstPrint) s=s.replace(/^ * /,''); //extra space here
					
				   mathSplit= s.split("$");
					var last=i;
					for (j=0; j<mathSplit.length; j++) {
						if (j%2 == 0) {
							if (!i.inner) i.inner=
							   i.append("textBox")
			    		   i.inner
							  .print(bag, mathSplit[j], style, d);							
						} else {
							bag.add(i.append("mathBox",style, {math:mathSplit[j]}));
							i.inner=null;
						}																			
					}
	

					i.firstPrint=false;
					
				  //return i.inner; //.print(s,style,d);
			  };				
			  
			  i.freeBox=function(content) {
				  var b= i.append("freeBox");
				  i.inner=null;
				  content(b);
				  return b;
			  }*/
			  
		} 
			
	});
addToCodex("textBox", "svgtext", {
		onBuild:  function(i) {
            codex.svgtext.onBuild(i);
			i.print=function(bag, label, style,d) {
   			var st={text:label};
				importDefault(st, style);
				bag.add(i.append("tspan", st, d));     
			} 
			i.g.attr("xml:space","preserve");
			  
		}
		
});
	

addToCodex("bullet","g",  {
	defaultStyle:{bullet:"."},
	onBuild: function(i) {	
	   var margin=0;
      if (typeof i.style.bullet== "number") i.style.bullet=Array(i.style.bullet).join(" ")+".";
      i.bullet=i.style.bullet;
		i.style.width =i.width=i.style.bullet.length *20;
		i.style.height = i.height=12;
		codex.blackbox.onBuild(i);
		i.append("rect", {x:0, y:0, opacity:0, w:i.width, h:1});
        for (var p=0; p<i.bullet.length; p++) {
           var c = i.bullet[p];
           if (c==' ') continue;           
			  if (!margin) margin = 6*2/(p+2);
           var bid="#"+i.id+"/"+p
           var pos=i.append("transform"+bid, {x:p*20+11-i.width/2,  y:-4, scale:(1.5/(p+1.5)+0.4)})
           if (c=='>') {
               pos.append("path", {d:"M-4.2,0 L4,0 M0.2,3.8 L 4.2,0 0.2,-3.8", strokeWidth:2, fill:"none", stroke:"#008"});
              continue;
           } if (c=='-') {
               pos.append("path", {d:"M-4,0 L4,0", strokeWidth:1.5, fill:"none", stroke:"#008"});
              continue;
           } 
           if (c=='.') {
             pos.append("circle", {x:0,  y:0, r:3.5, fill:"#008", stroke:null});           
             continue;
           }
           if (c=='o') {
             pos.append("circle", {x:0,  y:0, r:3.5, fill:"none", stroke:"#008"});           
             continue;
           }
           pos.append("svgtext", {text:c, color:"#008", y:4})
             
        }
		  if (margin) importDefault(i.parent.style, {marginTop:margin})
	},
    
    onSavePrefix: function(i, style) {
       var keys=["fill","stroke", "r", "size", "color"];
       for  (var k=0; k<keys.length; k++) {
          for (var j=0; j<i.bullet.length; j++) {
             var sk = keys[k]+"Bullet";
             var s={};
             if (sk+(j+1) in style) {
               s[keys[k]] = style[sk+(j+1)]
             } else if (sk in style) {
               s[keys[k]] = style[sk]
             } else {
               continue;
             }
             var b= i.down("#"+i.id+"/"+j, true);
             if (b) b.allNodes().set(s);
             
          }
       }
    }
	
	/* TODO : ondraw: 
     * export style bullet_fill to children
     *              bulletfill-1 to first level
     *              etc. 
     * */
})	
addToCodex("mathBox","g", {
	onBuild:function(i) {
		i.mathSpan = i.append("svgtext", {text:"$"+i.datum.math+"$"});
		i.mathJaxed = i.append("mathJaxed");		
	},
	onDraw: function(i) {
		i.g.select("svg").attr("color", i.style.color);
	}
	
})

addToCodex("freeBox","g", {
	defaultStyle:{linePosition:"top"},
	
	onBuild:function(i) {
			
	},
	onSave: function(i,s) {
		
	}
	
})

function oldprepareImages(mathNodes, callBack) {
  console.log(`exporting ${mathNodes.length} formulas to png`)
  var count=mathNodes.length;
  var canvas = d3.select("canvas"),       
      context = canvas.node().getContext("2d");
  function isReady(image, n) {
      return function() {
        console.log("ready ",count)
        context.clearRect(0, 0, canvas.width, canvas.height);     
        context.drawImage(image, 0, 0);    
        n.png = canvas.toDataURL("image/png");     
        count--;
        console.log(`${count} remaining`)
        if (count==0) callBack();
      }
  }
  mathNodes.forEach(function(n, i) {
    
    var defs=d3.select("#MathJax_SVG_glyphs").node().outerHTML;
    var svgSrc= n.g.node().children[0].outerHTML
      .replace('</svg>', defs+'</svg>');
    
    var imgsrc = 'data:image/svg+xml;base64,'+ btoa(svgSrc);
   
    var DOMURL = window.URL || window.webkitURL || window;
    
    var image = new Image();
    var svgBlob = new Blob([svgSrc], {type: 'image/svg+xml;charset=utf-8'});
    var url = DOMURL.createObjectURL(svgBlob);

     image.src = url; 
    image.onload =   function() {
        console.log("ready ",count)
        context.clearRect(0, 0, canvas.width, canvas.height);     
        context.drawImage(image, 0, 0);    
        n.png = canvas.toDataURL("image/png");     
        count--;
        console.log(`${count} remaining`)
        if (count==0) callBack();
      }
    
    //isReady(image, n); 
    
    
    console.log("loading "+ svgSrc)//.substring(0,50)+"...", svgBlob)
  })
    
}



function createMathPNGs(callBack) {
  var mathNodes=d3.selectAll(".mathBox");
  console.log(`exporting ${mathNodes.size()} formulas to png`)
  var count=mathNodes.size();  
  
  mathNodes.each(function(d,i) {
    var n=d.mathJaxed;
    savePNG(d3.select(n.g.node().children[0]), function(d) {
      console.log(d.length);
      n.png=d;
      count--;
      console.log(`${count} remaining`)
      if (count==0) callBack();
    })    
  })    
}
function prepareImageBlobs(mathNodes, callBack) {
  console.log(`exporting ${mathNodes.length} formulas to png`)
  var count=mathNodes.length;
  mathNodes.forEach(function(n, i) {
    savePNGBlob(d3.select(n.g.node().children[0]), function(d) {
      console.log(d);
      n.png=d;
      count--;
      console.log(`${count} remaining`)
      if (count==0) callBack();
    })    
  })    
}

d3.select("body").append("canvas")
  .attr("id", "exportToPng")
  .style("display", "none");
  
function savePNG(svgNode, callBack) {
  
    var pngScale=8;
      var defs=d3.select("#MathJax_SVG_glyphs").node().outerHTML;
      var svgSrc = svgNode
      .attr("version", 1.1)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .node().outerHTML
      .replace('</svg>', defs+'</svg>')
  
      
     var imgsrc = 'data:image/svg+xml;base64,'+ btoa(svgSrc);
   //  button.attr("href", "#"); 
     var canvas = document.querySelector("#exportToPng"),
         context = canvas.getContext("2d");
    
     var image = new Image;
     image.src = imgsrc;
     image.onload = function() {
         var w=image.width*pngScale;
         var h=image.height*pngScale;
         canvas.width=w;
         canvas.height=h;         
         context.drawImage(image, 0, 0,w,h);        
         var canvasdata = canvas.toDataURL("image/png"); 
         console.log(canvasdata.substring(0,30));
         callBack(canvasdata);
    };
}
function savePNGBlob(svgNode, callBack) {
    var pngScale=4;
      var defs=d3.select("#MathJax_SVG_glyphs").node().outerHTML;
      var svgSrc = svgNode
      .attr("version", 1.1)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .node().outerHTML
      .replace('</svg>', defs+'</svg>')
  
      
     var imgsrc = 'data:image/svg+xml;base64,'+ btoa(svgSrc);
   //  button.attr("href", "#"); 
     var canvas = document.querySelector("canvas"),
         context = canvas.getContext("2d");
    
     var image = new Image;
     image.src = imgsrc;
     image.onload = function() {
         var w=image.width*pngScale;
         var h=image.height*pngScale;
         canvas.width=w;
         canvas.height=h;         
         context.drawImage(image, 0, 0,w,h);    
         canvas.toBlob(callBack, "image/png");
    };
}

function getBase64(svgNode) {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var data = (new XMLSerializer()).serializeToString(svgNode);
    var DOMURL = window.URL || window.webkitURL || window;

    var img = new Image();
    var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    var url = DOMURL.createObjectURL(svgBlob);

     img.src = url; 
 //   img.onload = function () {
      ctx.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);

      var imgURI = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');

      return imgURI;
  
}
addToCodex("mathJaxed","transform", {
	onBuild:function(i) {
		i.ready=false;
		i.deltaY=-12; //looks good on first approximation
	 //	i.append("circle",{fill:"none",r:1});
	},
    internalNode:false, //does not contain children in the item tree (but child elements are directly added to the DOM)
	onDraw:function(i) {
		//if (i.ready) {			
		i.style.x=0;
		i.style.y=i.deltaY;
		i.style.scale = i.scale;
		codex.transform.onDraw(i);		
        if ("color" in i.style &&  i.g.node().children.length)
           i.g.node().children[0].setAttribute("color", i.style.color);
        //i.useStyle("color"); 
	//	}
	},
	onLayout:function(i) {
		//console.log("layout", i.parent.datum.math, i.scale, i.style.scale);
	   codex.transform.onLayout(i);
	},
     drawInPdf: function(i, doc, opacity) {            
       var DOMURL = window.URL || window.webkitURL || window;
       console.log(xy(i.style), i.box.actual);
       var x=i.box.actual.x-  i.box.actual.width/2;
       var y=i.box.actual.y-  i.box.actual.height/2;
         // doc.rect(x-1,y-1,i.box.actual.width+2, i.box.actual.height+2).stroke();
          doc.image(//DOMURL.createObjectURL(
                     i.png//)//getBase64(i.g.node().children[0])
                 ,x,y, {width:i.box.actual.width, height:i.box.actual.height})
     }
});

function getFormulasJSON() {
	var formulas = [];
	d3.selectAll(".mathBox").each(function(d) {
	  formulas.push(
	   {math:d.datum.math, 
		 svg:{
			 html:d.mathJaxed.g.node().innerHTML,
			 deltaY:d.mathJaxed.deltaY,
			 scale:d.mathJaxed.scale
		}});
  })
  formulas = {svgs: formulas, glyphs:d3.select("#MathJax_SVG_glyphs").node().outerHTML}
  return JSON.stringify(formulas);
	
}

function saveToLocalStorage() {	
   localStorage.setItem('formulas',getFormulasJSON());
}
function getFromLocalStorage() {	
	return JSON.parse(localStorage.getItem('formulas')||"false") 
}
function clearLocalStorage() {	
   localStorage.setItem('formulas',null); 
}

function useMathSvg(i, svg) {
	 if (debugMathParsing)
		  console.log("**** import", i.type, i.datum.math);
    var target = i.mathJaxed; //span.node().parentNode.parentNode.parentNode;
	 
	 
	 target.g.node().innerHTML = svg.html;
	 target.ready=true;
    target.scale = getComputed("size", i.mathSpan) / 15; 
	 //target.scale = svg.scale;
    target.deltaY = svg.deltaY*(target.scale||1)/(svg.scale||1);
	 
	 i.mathSpan.history.forEach(function(s) {
		if (s) {
			s.show=false;
			s.text="";
		} 
	 })
}
function forceDisplay(i) {
  i.g.style("display", null);	
  if (i.parent) forceDisplay(i.parent);
	
}
function parseMathJaxOutput (i) {	
  if (debugMathParsing)  console.log("***mathjax: parsing", i.type, i.datum.math);
  var svg = i.g.select("svg");
  if (svg.empty()) {console.log("ERROR : no svg found"); return;} 

  var target = i.mathJaxed; //span.node().parentNode.parentNode.parentNode;


  svg.attr("color","#000");
  target.g.node().appendChild(svg.node());
  target.ready=true;
  forceDisplay(target);
  setTimeout(()=>{	 
      target.scale = getComputed("size", i.mathSpan) / 15; 
      target.deltaY = -(target.g.node().getBBox().height + svg.style("vertical-align").slice(0,-3)*1 +3.8 )*target.scale; 
		  //3.8 = magic number for  good horizontal alignment, for some reason
  },1);
  i.mathSpan.history.forEach(function(s) {
    if (s) {
        s.show=false;
        s.text="";
    } 
  })
  //addExportLink();
}


MathJaxImport = function(useMathJax, callBackFunction) {
  useMathJax= 	typeof MathJax != "undefined"
  /*if (useMathJax && typeof MathJax == "undefined") {
     console.error("MathJax is not loaded, disable \"mathjax\" in the top settings");
     useMathJax=false;     
  }*/
  if (useMathJax) {
	  MathJax.Hub.Config({
		 tex2jax: {
			inlineMath: [ ['$','$']], //, ["\\(","\\)"] ],
			processEscapes: true
		 }
	  });
  }
  var knownData = null;
  if (importedMathFormulas) {
	  knownData = importedMathFormulas;
  } else {
	  knownData = getFromLocalStorage();
  }
  if (knownData) {
    if (typeof knownData=="string") {
		console.error("Using string for math input is Deprecated");
      try{
        d3.json(knownData, runWithData) ; 
      } catch (e) {
        runWithData(e, null);
      }
    } else {
      runWithData(false, knownData);
    }
  }
  else 
    runWithData(true, null);
  
  
 function runWithData(error, data) {
	  mathToSvg=null;
	  if (!error) {
		  mathToSvg = data;
		  d3.select("body").append("svg").style("display", "none").html(mathToSvg.glyphs);
	  }
		  
	  d3.selectAll(".mathBox").each(function(d) {
		  var node = this;
		  var svg=null;
		  if (mathToSvg) mathToSvg.svgs.forEach(function(s) {
			  if (s.math == d.datum.math) svg = s.svg; 
		  });
		  if (svg) {
			  useMathSvg(d, svg);
		  } else if (useMathJax) {
           if (debugMathParsing)  console.log("***mathjax: queue", d.datum.math);
  			  MathJax.Hub.Queue(["Typeset", MathJax.Hub, node]);    
			  MathJax.Hub.Queue(function() { //when mathjax is done
	//			  setTimeout(function(){ //wait for complete rendering (=> math bbox is computed)
					  parseMathJaxOutput(d) //transform mathjax output to fit within the item tree
		//			  }, 0) 
					  });
		  } else {
			  console.log("Error : Mathjax is disabled, cannot parse formula "+d.datum.math);
		  }
	  })
	  
	  setTimeout(()=>{
	  if (useMathJax) 
		 MathJax.Hub.Queue(function() {callBack();});
	  else 
	    callBack();},1) 
  }
  function callBack() {
      setTimeout(()=>{			
          console.log("Math processing complete"); 
			 saveToLocalStorage();  
          callBackFunction();
      }, 1);
  }
};

//do not edit the following line, it is modified when the presentation is exported as a single html file.	
var importedMathFormulas = null;






	