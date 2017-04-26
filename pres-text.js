 /*
  **Text areas**
  
  .print, .println, .ln

  
   align: left / center / right (along the "x" vertical line)
 
 */
 
 var debugMathParsing = false;

addToCodex("caption", "svgtext", {
     defaultStyle: {offsety : 4},
	 onBuild: function(i) {
		 if (typeof i.datum=="string")
			 i.style.text=i.datum;
	 }
}); 

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
			  
              i.currentIndent = "";
              var lineIndex=1;
              i.getLine= function(l) {
                  return i.down("#"+i.id+"/line"+l);
              }
              i.getLines= function(ll) {
                if (ll=="") return itemBag([]);
                if (typeof ll=="string") ll=ll.split(/\ *;\ */);             
                return itemBag(ll.map(i.getLine));
              }
              var enumerateCount = [];
              function processBullet(bullet) {
                bullet = bullet||"";//i.currentIndent||"";
                while (enumerateCount.length<bullet.length) 
                  enumerateCount.push(0);
					 
                var reset=(bullet=="");
                var out=[];
                for (var p=0;p<bullet.length; p++) {
                   if (reset) 
                     enumerateCount[p]=0;
                   
                   if (bullet[p]=="a") {
                      out.push("abcdefghijklmnopqrstuvwxyz"[enumerateCount[p]%26]);
                   }else  if (bullet[p]=="A") {
                      out.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[enumerateCount[p]%26]);
                   }else if (bullet[p]=="1") {
                      out.push((enumerateCount[p]+1)+"");
                   }else if (bullet[p]=="i") {
                      out.push(romanize(enumerateCount[p]+1).toLowerCase());
                   }else if (bullet[p]=="I") {
                      out.push(romanize(enumerateCount[p]+1));
                   }else  out.push(bullet[p]);   
                   
                   if (bullet[p]!=" ") {
                      enumerateCount[p]++;
                      reset = true;
                   }
                }
                if (reset)
                  for (var p=bullet.length; p<enumerateCount.length; p++) {
                      enumerateCount[p]=0;
                  }
                return out;
              }
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
                  
              }
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
			  i.print=function(bag, s, style,d) {
				   if (i.firstPrint && style && style.bullet) {
						i.append("bullet", style);											
					}
					if (i.firstPrint) s=s.replace(/^ */,'');
					
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
			  }
			  
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
	//	}
	},
	onLayout:function(i) {
		//console.log("layout", i.parent.datum.math, i.scale, i.style.scale);
	   codex.transform.onLayout(i);
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






	