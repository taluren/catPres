addToCodex("mathBox","g", {
	onBuild:function(i) {
		i.mathSpan = i.append("svgtext", {text:"$"+i.datum.math+"$"});
		i.mathJaxed = i.append("mathJaxed");		
	},
	onDraw: function(i) {
		i.style.x = i.parent.cursorX;
		codex.g.onDraw(i);
		i.g.select("svg").attr("color", i.style.color);
	},
	onDrawPostOrder : function(i) {
		i.width = i.g.node().getBBox().width;
      i.parent.cursorX += i.width;		
	}
	
})

addToCodex("freeBox","g", {
	defaultStyle:{linePosition:"top"},
	
	onBuild:function(i) {
			
	},
	onSave: function(i,s) {
		if (s.linePosition=="top") {
			s.y-=s.size;
		}else if (s.linePosition=="middle") {
			s.y-=s.size/2;
		}else if (s.linePosition=="bottom") {
			s.y-=0;
		}else console.log("invalid linePosition: "+s.linePosition, s);
		
		
	},
	onDraw: function(i) {
		i.style.x = i.parent.cursorX;		
	},
	
	onDrawPostOrder : function(i) {
		var bbox=i.g.node().getBBox();
		i.width = bbox.width;
		i.style.x-=bbox.x;
		codex.g.onDraw(i);		
      i.parent.cursorX += i.width;		
	}
	
})

addToCodex("mathJaxed","g", {
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
			codex.g.onDraw(i);		
	//	}
	}
});

function getComputed(key, d) {
	if (key in d.style) return d.style[key];
	if (key in d.defaultStyle) return d.defaultStyle[key];
	if (parent in d) return getComputed(key, d.parent);
	return null;	
}

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
  var a =d3.select("body").append("div").style("position","absolute").style("top","0").style("width","10¨%").style("align","center").append("a").text("Save Formulas Locally");	
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
function parseMathJaxOutput (i) {
	
		    console.log("**** parsing", i.type, i.datum.math);
          var svg = i.g.select("svg");
			 if (svg.empty()) {console.log("ERROR : no svg found"); return;} 
			 
			 
			 var target = i.mathJaxed; //span.node().parentNode.parentNode.parentNode;
			 
			 
			 svg.attr("color","#000");
			 target.g.node().appendChild(svg.node());
			 target.ready=true;
			 target.scale = getComputed("size", i.mathSpan) / 15; 
			 target.deltaY = -(target.g.node().getBBox().height + svg.style("vertical-align").slice(0,-3)*1 +3 )*target.scale; 
			 
			 i.mathSpan.history.forEach(function(s) {
				if (s) {
					s.show=false;
					s.text="";
				} 
			 })
			 addExportLink();
}

MathJaxImport = function(localImport, callBack) {
	if (typeof MathJax == "undefined") MathJax=null;
  if (MathJax) {
	  MathJax.Hub.Config({
		 tex2jax: {
			inlineMath: [ ['$','$'], ["\\(","\\)"] ],
			processEscapes: true
		 }
	  });
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
			  MathJax.Hub.Queue(function() {parseMathJaxOutput(d)});
		  } else {
			  console.log("Error : Mathjax not found to parse formula "+d.datum.math);
		  }
	  })
	  
	  setTimeout(()=>{
	  if (MathJax) 
		MathJax.Hub.Queue(function() {console.log("mathjax complete"); callBack();});
	  else 
	  callBack();},1) 
  });
  
};
