
addToCodex("image", "transform", {
	defaultStyle: {maxWidth:350, maxHeight:250},
	onBuild: function(i) {
		var img = i.append("svgimage");
		i.url = function(url) {
				i.imgWidth=20;
				i.imgHeight=20;				
				var myImage = new Image();
            myImage.onload = function() {
               i.imgWidth = this.width;
					i.imgHeight = this.height;
					if (i.drawn) i.draw(false);
					console.log("loaded");
						
            }
				myImage.src=url;
				img.g.attr("xlink:href", url);					
				return i;
			}
		
	},
	onDraw: function(i) {		  
	     var w, h;
		   if (i.style.width||i.style.height) {
				var r=i.imgWidth/i.imgHeight;
			   w=i.style.width || (i.style.height*r);
			   h=i.style.height || (i.style.width*r);
			} else {
				w=i.imgWidth;
				h=i.imgHeight;
				if (w>(i.style.maxWidth||Infinity)) {
					var r=i.style.maxWidth/w;
					w*=r;
					h*=r;					
				}
				if (h>(i.style.maxHeight||Infinity)) {
					var r=i.style.maxHeight/h;
					w*=r;
					h*=r;					
				}
			}
		   i.down("svgimage").set({width:w, height:h})
			console.log(i.down("svgimage").style);
			
		}
});