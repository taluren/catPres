 
function addToCodex(type, base,  details) {
	codex[type]=details;
	base=codex[base] || codex.default;
	importDefault(codex[type], base);	
	importDefault(codex[type].defaultStyle, base.defaultStyle);
}
var decorationCodex = {
	border:{fill:"none", stroke:"black", strokeWidth:1},
	background:{fill:"#AAA"},
	box:{fill:"#AAA", stroke:"black", strokeWidth:1},
	highlight:{fill:"yellow"}
}

var codex = {
	frame: {
		defaultStyle:{fill:"white", stroke:"black", color:"black", size:12, font:"sans-serif",w:10,h:10,r:5, anchor:"middle", align:"center",spaceBefore:0,spaceAfter:0, show:true,dx:0, dy:0,margin:0,x:0,y:0,model:"cat"}					
		},
	circle: {
		tag:"circle",
		defaultStyle:{x:0,y:0},
		onBuild:null,
		onDraw:function (i) {
			i.useAttr("r");
			i.useAttr("fill");	
				i.useStyle("opacity");
			i.useAttr("stroke", "stroke","fill");						
			i.useStyle("stroke-width","strokeWidth");		
			i.useAttr("cx","offsetx");
			i.useAttr("cy","offsety");
			
			
		//	i.g.style("clip-path", "url(#"+i.id+")");
		},
		onLayout:function(i) {		
		   
			i.g.attr("transform", "translate("+xy(i.style)+")");	
		}
	},
	rect: {
		tag:"rect",
		defaultStyle:  {x:0,y:0} ,
		onBuild:  null ,
		onDraw: function (i) {
				i.useAttr("width","w");
				i.useStyle("opacity");
				i.useStyle("fill");		
				i.useAttr("stroke", "stroke", "fill");	
				i.useStyle("stroke-width","strokeWidth");	
				i.useAttr("rx");	
				i.useAttr("ry");	
				i.useAttr("x","offsetx");	
				i.useAttr("y", "offsety");	
				i.useAttr("height","h");	
			},
		onLayout: function(i){
			i.g.attr("x", i.style.x-i.style.w/2);
			i.g.attr("y", i.style.y-i.style.h/2);
		}
	},
	path: {
		tag:"path",
		defaultStyle: {d: "", x:0, y:0} ,
		onDraw:function(i) { 
			i.useAttr("d");	
			i.useAttr("fill");	
			i.useAttr("stroke");	
				i.useStyle("opacity");
		},
		onLayout:function(i){
			i.g.attr("transform", "translate("+xy(i.style)+")");
		}
	},
	svgtext: {
		tag:"text",
		defaultStyle: {x:0,y:0, text:""} ,
		onBuild:  function(i,s) {i.g.style("-moz-user-select","none")} ,
				
      onDraw: function (i) {checkTree(i)
			i.useAttr("x", "offsetx");
			i.useAttr("y", "offsety");
			i.useStyle("fill","color");	
		    i.useStyle("opacity");
			i.useAttr("font-size","size");
			i.useAttr("font-family","font");	
			i.useAttr("font-weight","weight");	
			i.useAttr("text-anchor","anchor");	
            i.useAttr("alignment-baseline","alignmentBaseline");
//         console.log("svgtext : ", i.style.text);
			if (i.children.length==0) 
				i.saveG.html(i.style.text); 
			checkTree(i);
		},		
		onLayout:function(i) {	
			i.g.attr("transform", "translate("+xy(i.style)+")");				
		}
	},
	tspan: {
		tag:"tspan",
		defaultStyle:{x:null, y:null},
		onBuild:    function(i,s) {i.g.style("-moz-user-select","none")},
		onDraw: function (i) {	
      	i.useAttr("dx");
			i.useAttr("dy");
			i.useStyle("fill","color");	
			i.useAttr("font-size","size");
			i.useAttr("font-family","font");	
			i.useAttr("font-weight","weight");	
			i.useAttr("text-anchor","anchor");				
			if (i.children.length==0) 
				i.saveG.html(i.style.text);
		},	
		onLayout:function(i) {			
		}		
	},
	default: { //codex template:
		tag:"g",  //tag of the elemnt to add
		defaultStyle: {x:0, y:0}, //default values for this node and its descendants  
		onBuild:  null, //function to be called once, at build time ("append"), parameter: item
		onLoad: null, 
		          //function called at drawing time, before children (prefix order), parameter: item
        onDrawPostOrder: null, // idem, but called after children
		onSave: null,	 //function called at saving time (suffix order), parameters: item, saved style	
		    
		onLayout : function(i) {
			i.g.attr("transform", "translate("+xy(i.style)+")");            
            i.useStyle("opacity");
		}//called after only x and y may have changed
		
	}
	
}
addToCodex("g", "", {}); //g = default


addToCodex("transform", "g", {
	onDraw: function (i) {			  	
		},    
  onLayout : function(i) {
			i.g.attr("transform", 
			  "translate("+xy(i.style)+")"
			  + (i.style.scale?"scale("+(typeof i.style.scale == "object" ? xy(i.style.scale) : i.style.scale)+")":"")
			  + (i.style.angle?"rotate("+i.style.angle+")":"")
			 );      
            i.useStyle("opacity");      
		}
});

addToCodex("custom","", {
	tag:"g",
	onBuild: function(i) {
		i.g.node().innerHTML = i.datum		
	}
})

