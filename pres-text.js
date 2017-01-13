 /*
  **Text areas**
  
  .print, .println, .ln

  
   align: left / center / right (along the "x" vertical line)
 
 */
 
 var debugMathJaxParsing = true;

addToCodex("caption", "svgtext", {
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
		}
	});
	
	
addToCodex("sweetTextLine", "horizontalVector", {
	  defaultStyle:{x:0,y:0, align:"none", layout:"dense", marginTop:1,marginBottom:1},
		onBuild:   function(i) {
			  codex.horizontalVector.onBuild(i);
			  i.firstPrint=true;;
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
			i.print=function(bag, label, style,d) {
   			var st={text:label};
				importDefault(st, style);
				bag.add(i.append("tspan", st, d));     
			} 
			i.g.attr("xml:space","preserve");
			  
		}
		
});
	

addToCodex("bullet","g",  {
	defaultStyle:{bullet:1},
	onBuild: function(i) {	
		i.style.width =i.width=i.style.bullet*20;
		i.style.height = i.height=12;
		codex.blackbox.onBuild(i);
		i.append("rect", {x:0, y:0, opacity:0, w:i.width, h:1});
		i.append("circle", {x:i.width/2-8, r:max(5-i.style.bullet,2), y:-4, fill:"#008", stroke:null});
	}
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
	onDraw:function(i) {
		//if (i.ready) {			
			i.style.x=0;
			i.style.y=i.deltaY;
			i.style.scale = i.scale;
			codex.transform.onDraw(i);		
	//	}
	}
});

function addExportLink() {
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
  var a =d3.select("body").append("div").style("position","absolute").style("top","0").style("width","10%").style("align","center").append("a").text("Save Formulas Locally");	
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formulas));
  a.attr("href",     dataStr     );
  a.attr("download", "math.json");

}

function useMathSvg(i, svg) {
	 console.log("**** import", i.type, i.datum.math);
    var target = i.mathJaxed; //span.node().parentNode.parentNode.parentNode;
	 
	 
	 target.g.node().innerHTML = svg.html;
	 target.ready=true;
	 target.scale = svg.scale;
	 target.deltaY = svg.deltaY;
	 
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
	
		    console.log("**** parsing", i.type, i.datum.math);
          var svg = i.g.select("svg");
			 if (svg.empty()) {console.log("ERROR : no svg found"); return;} 
			 
			 //if (debugMathJaxParsing) console.log("found svg : ", svg.node());
			 
			 var target = i.mathJaxed; //span.node().parentNode.parentNode.parentNode;
			 
			 
			 svg.attr("color","#000");
			 target.g.node().appendChild(svg.node());
			 
			 target.ready=true;
			 forceDisplay(target);
	   	 setTimeout(()=>{	 
				 target.scale = getComputed("size", i.mathSpan) / 15; 
				 target.deltaY = -(target.g.node().getBBox().height + svg.style("vertical-align").slice(0,-3)*1 +3 )*target.scale; 
			 },1);
			 i.mathSpan.history.forEach(function(s) {
				if (s) {
					s.show=false;
					s.text="";
				} 
			 })
			 addExportLink();
}
MathJaxImport = function(localImport, callBackFunction) {
	if (typeof MathJax == "undefined") MathJax=null;
  if (MathJax) {
	  MathJax.Hub.Config({
		 tex2jax: {
			inlineMath: [ ['$','$'], ["\\(","\\)"] ],
			processEscapes: true
		 }
	  });
  }
  function callBack() {
	  setTimeout(()=>{
		  console.log("mathjax complete"); 
		  callBackFunction();
	  }, 1);
  }
  d3.json(localImport, function(error, data) {
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
		  } else if (MathJax) {
			  MathJax.Hub.Queue(["Typeset", MathJax.Hub, node]);    
			  MathJax.Hub.Queue(function() { //when mathjax is done
	//			  setTimeout(function(){ //wait for complete rendering (=> math bbox is computed)
					  parseMathJaxOutput(d) //transform mathjax output to fit within the item tree
		//			  }, 0) 
					  });
		  } else {
			  console.log("Error : Mathjax not found to parse formula "+d.datum.math);
		  }
	  })
	  
	  setTimeout(()=>{
	  if (MathJax) 
		 MathJax.Hub.Queue(function() {callBack();});
	  else 
	    callBack();},1) 
  });
  
};

	
	