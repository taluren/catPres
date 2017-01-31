var menu=null;
var menuLength=0;
function makeMenu () {
	var mainmenu = 
	  d3.select("body")
	   .append("div")
		.attr("id", "menu")
		.style("position","fixed")
		.style("opacity","0.05")
		.style("font-family","sans-serif")
		.on("mouseover", function() {
			 mainmenu.style("opacity","1")
			 menu.style("display", "block")})
		.on("mouseout", function() {
			menu.style("display", "none")
		mainmenu.style("opacity","0.1")})
		//.style("height","auto")
		
   mainmenu.append("button")
		//.style("display","table")
		//.attr("width",100)
		.style("background-color", "rgba(30,30,30,0.7)")
		.style("color","white")
		.style("padding","10px")
		.style("font-size","14px")
		.style("border","none")
		.style("cursor","pointer")
		
		.text("...")
  menu=mainmenu.append("div")
      .style("display","none")
      .style("position","absolute")
      .style("background-color","rgba(30,30,30,0.7)")
      .style("min-width","220px")
      .style("box-shadow","0px 8px 16px 0px rgba(0,0,0,0.2)")
      .style("z-index","1")
		 
}
function addMenu(label, f, help) {
	if (!menu) makeMenu();
	var h=15;
	var g=menu.append("a")
		//.attr("href","")
		.style("color","white")	    
		.style("padding","12px 16px")
		.style("text-decoration","none")
		.style("display","block")
		.style("cursor", "pointer")

		.on("mouseover", function() {g.style("background-color","#222")})
		.on("mouseout", function() {g.style("background-color",null)})		
		.attr("title",help)
		 .text(label)
        .on("click", function() {
			  g.style("background-color",null);
			  menu.style("display", "none"); 
		     f();
		  })		  
		  
	menuLength++;		 
	
}