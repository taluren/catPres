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
		.style("width", "600")
}
function addMenu(label, f) {
	if (!menu) makeMenu();
	var h=15;
	var g=menu.append("li")
	    /*.attr("transform","translate(0,"+(menuLength*h)+")")
   g.append("rect")
	    .attr("x",0)
		 .attr("y",0)
		 */
		 .style("display","table-cell")
		 //.style("width",100)
		 .style("height",h)
		 .style("border","#838")
		 .style("background","#FAF")
		 .text(label)
	menuLength++;		 
	
}