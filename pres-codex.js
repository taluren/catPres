 
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
        internalNode:true,
		defaultStyle:{fill:"white", stroke:"black", color:"black", size:12, font:"sans-serif",w:10,h:10,r:5, anchor:"middle", align:"center",spaceBefore:0,spaceAfter:0, show:true,dx:0, dy:0,margin:0,x:0,y:0,model:"cat", wriggle:null}					
		},
	circle: {
        internalNode:false,
		tag:"circle",
		defaultStyle:{x:0,y:0, wriggle:defaultWriggleThreshold},
		onBuild:null,
		onDraw:function (i) {
			i.useAttr("r");
			i.useAttr("fill");	
				i.useStyle("opacity");
			i.useAttr("stroke", "stroke","fill");						
			i.useStyle("stroke-width","strokeWidth");		
            i.useStyle("stroke-dasharray", "dash");
			i.useAttr("cx","offsetx");
			i.useAttr("cy","offsety");
			i.useStyle("cursor");
			
		//	i.g.style("clip-path", "url(#"+i.id+")");
		},
		onLayout:function(i) {		
		   
			i.g.attr("transform", "translate("+xy(i.style)+")");	
		},
		
        drawInPdf: function(i, doc, opacity) {        
          
            function run() {
              doc.circle(i.style.offsetx||0,i.style.offsety||0,i.style.r);       
              i.useNumberForPdf(doc, "lineWidth", "strokeWidth");             
            };            
             if (i.style.fill && i.style.fill!="none") {
               run();
               doc.fillColor(i.style.fill, opacity);
               console.log("fill",i.id, i.style.fill, opacity);
               doc.fill();               
             }
             if (i.style.stroke&& i.style.stroke!="none" ) {
               run();
               doc.strokeColor(i.style.stroke, opacity);
               doc.stroke();
             }
        }
	},
    
	rect: {
        internalNode:false,
		tag:"rect",
		defaultStyle:  {x:0,y:0, wriggle:defaultWriggleThreshold, offsetx:0, offsety:0} ,
		onBuild:  null ,
		onDraw: function (i) {
				i.useAttr("width","w");
				i.useAttr("height","h");    
                i.useStyle("opacity");
				i.useStyle("fill");		
				i.useAttr("stroke", "stroke", "fill");	
				i.useStyle("stroke-width","strokeWidth");	
                i.useStyle("stroke-dasharray", "dash");
				i.useAttr("rx");	
				i.useAttr("ry");	
                i.g.attr("x",i.style.offsetx-i.style.w/2);
                i.g.attr("y",i.style.offsety-i.style.h/2);	
				//i.useAttr("y", "offsety");	
				
			},
		onLayout: function(i){
			
            i.g.attr("transform", "translate("+ xy(i.style)+")");    
		},
		
        drawInPdf: function(i, doc, opacity) {
            function run() {
             doc.rect(i.style.offsetx-i.style.w/2,i.style.offsety-i.style.h/2,i.style.w,i.style.h);            
             i.useNumberForPdf(doc, "lineWidth", "strokeWidth");             
            };            
             if (i.style.fill && i.style.fill!="none") {
               run();
               doc.fillColor(i.style.fill, opacity);
               doc.fill();               
             }
             if (i.style.stroke&& i.style.stroke!="none" ) {
               run();
               doc.strokeColor(i.style.stroke, opacity);
               doc.stroke();
             }            
              
        }
	},
	path: {
		tag:"path",
        internalNode:false,
		defaultStyle: {d: "", x:0, y:0, wriggle:defaultWriggleThreshold} ,
		onDraw:function(i) { 
			i.useAttr("d");	
			i.useAttr("fill");	
			i.useAttr("stroke");	                
            i.useStyle("stroke-width","strokeWidth");
			i.useStyle("opacity");
            i.useStyle("stroke-dasharray", "dash");
		},
		onLayout:function(i){
			i.g.attr("transform", "translate("+xy(i.style)+")");
		},
        
        drawInPdf: function(i, doc, opacity) {
            function run() {
               doc.path(i.style.d);            
               i.useNumberForPdf(doc, "lineWidth", "strokeWidth");             
            };            
             if (i.style.fill && i.style.fill!="none") {
               run();
               doc.fillColor(i.style.fill, opacity);
               doc.fill();               
             }
             if (i.style.stroke && i.style.stroke!="none") {
               run();
               doc.strokeColor(i.style.stroke, opacity);
               doc.stroke();
             }            
              
        }
	},
	svgtext: {
		tag:"text",
        internalNode:true,
	    defaultStyle: {x:0,y:0, text:"", select:"none", wriggle:defaultWriggleThreshold} ,
		onBuild:  function(i,s) {
          i.box.actual.type="real";          
        } ,
				
      onDraw: function (i) {checkTree(i)
			i.useAttr("x", "offsetx");
			i.useAttr("y", "offsety");
			i.useStyle("fill","color");	
			i.useStyle("opacity");
			i.useAttr("font-size","size");
			i.useAttr("font-family","font");	
			i.useAttr("font-weight","weight");	
			i.useAttr("text-anchor","anchor");	 //todo: test
			i.useAttr("alignment-baseline","alignmentBaseline"); //todo: test
			i.useStyle("cursor");
			i.useStyle("-webkit-user-select","select");
			i.useStyle("-moz-user-select","select");
			i.useStyle("-ms-user-select","select");
			i.useStyle("user-select","select");
            
            
//         console.log("svgtext : ", i.style.text);
			if (i.children.length==0) 
				i.saveG.html(i.style.text); 
			checkTree(i);
		},		
		onLayout:function(i) {	
			i.g.attr("transform", "translate("+xy(i.style)+")");				
		},
        drawInPdf: function(i, doc, opacity) {            
            doc
         /*
          *draw help circles:*/
           //   .circle(0,0,5).stroke("#FFAAAA")          
          //go to top-left corner of the bounding box, this will serve as a reference point even if the text size is a bit different
             .translate(
                 i.box.actual.x-i.box.actual.width/2,     
                 i.box.actual.y-i.box.actual.height/2+0.2125*i.box.actual.height) //0.2125 = fraction of margin included in the bounding box for svg objects on firefox
           //  .circle(0,0,5).stroke("#AAAAFF"); 
            i.useNumberForPdf(doc, "fontSize", "size");            
            doc              
              .fillColor(i.style.color||"black",  opacity)
              .text("",0,0) //clear any previous "continued" text   
              .text(i.style.text,0,0); 
        }
	},
	
	tspan: {
		tag:"tspan",
        internalNode:false,
		defaultStyle:{x:null, y:null,  wriggle:null},
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
		},
        drawInPdf: function(i, doc, opacity) {
            i.useNumberForPdf(doc, "fontSize", "size");
            
            doc              
              .fillColor(i.style.color||"black",  opacity)
              .text(i.style.text, {continued:true})
        }
	},
	svgimage: {
		tag:"image",
        internalNode:false,
		defaultStyle:{x:0,y:0, width:0, height:0},	
        onBuild:  function(i,s) {
          i.box.actual.type="real";          
        } ,
		onDraw: function(i) {	
			i.useAttr("width");	
			i.useAttr("height");
            i.g.attr("x", -i.style.width/2);
            i.g.attr("y", -i.style.height/2);
		},
        drawInPdf: function (i,doc, opacity) {
           console.warn("image is not supported")
           //no opacity option for pdf images => threshold at 10%
          /*  if (opacity<0.1) return;
            var canvas = d3.select("canvas").node(),       
                ctx = canvas.getContext("2d");
            var img=new Image(i.g.attr("xlink:href"))
             i.g.node();
            canvas.width = img.width;
            canvas.height = img.height;

            // Copy the image contents to the canvas
            ctx.drawImage(i.g.node(), 0, 0);

            // Get the data-URL formatted image
            var dataURL = canvas.toDataURL("image/png");
            
            var x=i.box.actual.x-  i.box.actual.width/2;
            var y=i.box.actual.y-  i.box.actual.height/2;
            // doc.rect(x-1,y-1,i.box.actual.width+2, i.box.actual.height+2).stroke();
              doc.image(i.g.attr("xlink:href"),
                    x,y, {width:i.box.actual.width, height:i.box.actual.height})
    */
        }
	},
	default: { //codex template:
		tag:"g",  //tag of the element to add
        internalNode:true, //may have children
		defaultStyle: {x:0, y:0, wriggle:defaultWriggleThreshold}, //default values for this node and its descendants  
		onBuild:  null, //function to be called once, at build time ("append"), parameter: item
		onLoad: null, 
		          //function called at drawing time, before children (prefix order), parameter: item
        onDrawPostOrder: null, // idem, but called after children
		onSave: null,    //function called at saving time (suffix order), parameters: item, saved style 
        onSavePrefix: null,    //function called at saving time (prefix order), parameters: item, saved style         
		onFirstRun: null, //called once in the whole simulation, at "frameManager.run()" time, before the first drawing.   
		onLayout : function(i) {
			i.g.attr("transform", "translate("+xy(i.style)+")");            
            i.useStyle("opacity");
		},//called after only x and y may have changed
		defaultBackground:null //box dimensions for the background rectangle are by default the actual bbox of the item (null or "actual"). Other options are "container" (for a container-defined background, i.e. cell in array), or any object with "x", "y", "width" and/or "height" values, or a function returning one of the above.
		
	}
	
}
addToCodex("g", "", {}); //g = default


addToCodex("transform", "g", {
	defaultStyle:{wriggle:0},
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



addToCodex("circ","circle", {});
addToCodex("rectangle","rect", {});


