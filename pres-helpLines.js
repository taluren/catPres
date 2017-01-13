function drawItemTree(item, style) {
	drawItemTree2(item.parent, item, 15, style);
}
function drawItemTree2(holder, item, r, style) {
	if (r<=0) 
		if (style.loop)
			r=15;
		else return;
	console.log(style.r)
	style.r=r;
	if (item.type=="tspan") return;
	holder.append("itemTree-path",style, item);
	var next = holder.append("itemTree-g", style, item);
	next.append("circle", shallowCopy(style));
	//next.parent.append("itemTree-hBBox", {}, item);
	//next.parent.append("itemTree-vBBox", {}, item);
	item.children.forEach(function(i) {drawItemTree2(next, i, r-2, style);})
	
}
function hasXY(s) {
	return (typeof s.x!="undefined") && (typeof s.y!="undefined")
}
addToCodex("itemTree-path", "path", {
	onDraw : function(i) {
			i.style.d="M 0,0 L"+xy(i.datum.style);
			codex.path.onDraw(i);				
	}
	
})
addToCodex("itemTree-hBBox", "path", {
	defaultStyle: {fill:"none", stroke:"#550"},
	onDraw : function(i) {
		   b=i.datum.getTheoreticalBBox(true);
			i.style.d="M "+b.x+","+(b.y+b.height/2+3)+" l0,-6 l0,3 l"+b.width+",0 l0,3 l0,-6";
			codex.path.onDraw(i);			
	
	}
})
addToCodex("itemTree-vBBox", "path", {
	defaultStyle: {fill:"none", stroke:"#550"},
	onDraw : function(i) {
		   b=i.datum.getTheoreticalBBox(true);
			i.style.d="M "+(b.x+b.width/2+3)+","+b.y+" l-6,0 l3,0 l0,"+b.height+" l3,0 l-6,0";
			codex.path.onDraw(i);			
	
	}
})
addToCodex("itemTree-g", "g", {
	onDraw : function(i) {
		i.style.x=i.datum.style.x;
		i.style.y=i.datum.style.y;
		
	} 
	
})
