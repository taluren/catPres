 cameraManager=function() {
	 var cm= {frame:1, cameraPositions:[]}; 
	 
	 cm.onFrameChange = function(callback) {
		 cm.callback = callback;
		 return cm;
	 } 
	 cm.run = function() {
   	var hash = window.location.hash.substr(1);		
		if (hash)  {
			cm.frame = hash.match(/\d+/)[0]*1;
            cm.frame = max(1, min(cm.cameraPositions.length, cm.frame));
		}
		cm.updateZoom();
		return cm;
	 }
	 cm.switchFrame= function (delta)  {
		cm.frame+=delta;
		cm.frame = max(1, min(cm.cameraPositions.length, cm.frame));
		//console.log(" switchFrame ", cm.frame);
		window.location.hash = "frame"+cm.frame;
		cm.updateZoom();
		stopAllTransitions();
		cm.callback();
		return cm;
	 }
	 cm.goFirst = function() {
	  cm.switchFrame(-Infinity);	 
	 }
	 cm.nextMain = function() {
		 var d=cm.frame+1;
		 while (d<cm.cameraPositions.length-1 && !cm.cameraPositions[d].mainFrame) {
			 d++;
		 }
		 return cm.switchFrame(d-cm.frame);
		 
	 }
	 cm.prevMain = function() {
		 var d=cm.frame-1;
		 while (d>0 && !cm.cameraPositions[d].mainFrame) {
			 d--;
		 }
		 return cm.switchFrame(d-cm.frame);
		 
	 }
	 
	 cm.updateZoom = function() {
		var c=cm.cameraPositions[cm.frame-1];
		cm.zoom
			.transform(cm.svg,
				d3.zoomIdentity
				  .translate(-c.x/c.scale, -c.y/c.scale).scale(1/c.scale)
				  );
		return cm;
	 }
		 
		function keyup (e) {
			
			if (d3.event.key== "ArrowLeft" || d3.event.key== "PageUp" ) cm.switchFrame(-1);
			else if (d3.event.key== "ArrowRight"|| d3.event.key== "PageDown") cm.switchFrame(1);
			else if (d3.event.key==" ") {
				if (d3.event.shiftKey) {
					cm.prevMain()
				} else {
					cm.nextMain()
				}
			}
			else	console.log(d3.event);
			
		} 
	 cm.start=function(style) {		
	   style=style||{};
		importDefault(style,{screenBackground:"#eee"})		 
		cm.zoom = d3.zoom()
			 .scaleExtent([0.001, 1000])
			 .on("zoom", zoomed);	 
			 
		function zoomed() {
		  cm.holder.attr("transform",  d3.event.transform);
		}
		 
		 cm.svg =
		   d3.select("body")			 
				 .on("keyup", keyup)
		   .append("svg") 
				.style("background", style.screenBackground)
				.attr("viewBox", "-200 -150 400 300")
		   	 .call(cm.zoom)
			
			  .attr("height", "100%")
			  .attr("width", "100%")   
		
      		.style("position", "fixed")
			 .style("top", "0")
			 .style("bottom", "0")
			 .style("left", "0")
			 .style("right", "0")/**/
		cm.holder=cm.svg.append("g")
		
		
	 }
	 cm.lastTransform = function() {
		return cm.cameraPositions[cm.cameraPositions.length -1].transform;		
		 
	 }
	 cm.nextFrame = function(frame, camera)  {
		if (!camera) camera={};
		camera.frame=frame;
		var recall =  (camera.recall || -1);
		var prevCamera = cm.cameraPositions[cm.cameraPositions.length + recall];		
		
			
		var def = {x:0,y:0, scale:1}
		if (prevCamera)  
			def = {
				x: prevCamera.x + (camera.mainFrame ? 600/prevCamera.scale : 0),
				y: prevCamera.y,
				scale: prevCamera.scale
			}					
	
		
		importDefault(camera, def);
		
		camera.x += (camera.dx ||0);
		camera.y += (camera.dy ||0);
		camera.scale *= (camera.dscale || 1); 
		
		camera.transform = "translate("+xy(camera)+")scale("+camera.scale+")";
		//o.scaleY=camera.scale;
	   camera.holder= cm.holder;
		cm.cameraPositions.push(camera);
		//console.log("camera : ", camera);
		
		 
	 }
	 
	 return cm;
	 
 }
 