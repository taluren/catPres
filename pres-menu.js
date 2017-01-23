var menu=null;
var menuLength=0;
function makeMenu () {
	menu = 
	  d3.select("body")
	   .append("div")
		.attr("id", "menu")
		.style("position","fixed")
		.style("height","auto")
		.append("table")
		.style("display","table")
		.attr("width",100)
		 
}
function addMenu(label, f) {
	if (!menu) makeMenu();
	var h=15;
	var g=menu.append("tr").style("height",h)
		 .append("td")	   
		  .style("cursor", "pointer")
        .on("click", f)		  
		 .style("border","#838")
		 .style("background","#666")
		 .text(label)
	menuLength++;		 
	
}