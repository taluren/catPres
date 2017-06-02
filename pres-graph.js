

//lace takes datum: {nodeType (circle, rect, ...), d (array) or size (then d:=[0,1,...size-1])}
addToCodex("lace", "g", {
    defaultStyle:{rx:5,ry:2},
    onBuild: function(i) {
        i.datum = i.datum || {};
        var d=i.datum;
        importDefault(d, {nodeType:"circle"});      
        if (d.d) {
            d.size=d.d.length;          
        } else {
            importDefault(d, {size: 10})
            d.d=d3.range(d.size);
        }
        var links= i.append("g");
        var nodes= i.append("g");
        var prevn= null;
        for (var x=0; x<d.size; x++) {
            var n =nodes.append(d.nodeType, {x:(x-d.size/2)*15, y:0, angle:30}, d.d[x]); 
            if (prevn) {
                links.append("link",{},{source:prevn, target:n})
            }
            prevn=n;
        }
        i.nodes= function() {
            return nodes.childBag();
        }
        i.links = function() {
            return links.childBag();
        }
        
    }
});

addToCodex("laceLink", "path", {
   onDraw: function(i) {
        i.style.d= "M"+xy(i.datum.source.style)+ " L"+xy(i.datum.target.style);       
        codex.path.onDraw(i);
    }
})

addToCodex("autoFrame", "rect", {
   defaultStyle:{margin:1},
   onDraw: function(i) {
          var left=Infinity, right=-Infinity, top=Infinity, bottom=-Infinity;
          var margin=i.style.margin;
          for (var c=0; c<i.datum.length; c++) {
              if (!i.datum[c].style.show) continue;
              var cx =i.datum[c].box.actual.x + i.datum[c].style.x;
              var cy =i.datum[c].box.actual.y + i.datum[c].style.y;
              var cwh =i.datum[c].box.actual.width/2;
              var chh =i.datum[c].box.actual.height/2;
              left=min(left, cx-cwh);
              right=max(right, cx+cwh)
              top=min(top, cy-chh);
              bottom=max(bottom, cy+chh);
          }               
          left-=margin;
          right+=margin;
          top-=margin;
          bottom+=margin;
          if (left==Infinity) right=left=0;
          if (top==Infinity) top =bottom=0;
           
          i.style.w = right-left;
          i.style.x = (left+right)/2;
          i.style.h= bottom-top
          i.style.y = (top+bottom)/2;  
          codex.rect.onDraw(i);
          i.layout(0);     
  }
})

//link: draw a straight link or a bezier curve (give srcTangent and tgtTangent vectors for a curve)
addToCodex("link", "path", {
	defaultStyle:{fill:"none"},
   onBuild: function(i) {    
       i.source = i.datum.source;
       i.target = i.datum.target;
   },
   onLoad: function(i) {
       if (!i.source.display || !i.target.display)
          i.display=false;
   },
   onDraw: function(i) {
		  var cp1=null;
		  var cp2=null;
        i.style.d= "M"+xy(i.datum.source.style);
			if (i.style.srcTangent) 
				cp1={x:i.datum.source.style.x+(i.style.srcTangent.x||0), 
				y:i.datum.source.style.y+(i.style.srcTangent.y||0)};
			if (i.style.tgtTangent) 
				cp2={x:i.datum.target.style.x+(i.style.tgtTangent.x||0), 
				y:i.datum.target.style.y+(i.style.tgtTangent.y||0)};
				
			if (!cp1 && !cp2)
				i.style.d+=" L";       
			else if (cp1 && cp2)
				i.style.d+=" C"+xy(cp1)+" "+xy(cp2)+" ";       
			else if (cp1)
				i.style.d+=" Q"+xy(cp1)+" ";
			else 
				i.style.d+=" Q"+xy(cp2)+" ";
			i.style.d+=xy(i.datum.target.style)
         codex.path.onDraw(i);
        // using i.datum.source afterwards is deprecated
    }
})

addToCodex("emptyNode", "g", {
   //dragPriority: 
  //  -1: node position is reset at every frame change, even if dragged
  //   0: node position is reset only if coordinates change
  //   1: once dragged, the node stays where it is dropped, even on coordinate change
   defaultStyle:{cursor:"pointer",  wriggle:0, dragPriority:0},
   
   onLoad:function(i) {
     console.log(i.lastLoad)
      if (i.lastLoad && i.style.dragPriority <= 0) {
       if (i.style.dragPriority<0 || i.lastLoad.x!= i.style.x || i.lastLoad.y!=i.style.y) {
         i.x=i.style.x;
         i.y=i.style.y;
       }
     }     
     i.lastLoad={x:i.style.x, y:i.style.y};
  
   }
})
addToCodex("rectNode", "emptyNode", {
   defaultStyle:{fill:"#ddd", w:14, h:10, stroke:"none"},
   onBuild: function(i) {
      i.append("rect");
      i.caption = i.append("caption");              
   },
   onDraw: function(i) {
      i.caption.style.text = i.style.label;
   }
})
addToCodex("simpleNode", "emptyNode", {
   defaultStyle:{fill:"#ddd", r:8, stroke:"none"},
   onBuild: function(i) {
      i.append("circle");
      i.caption = i.append("caption");      
        
   },
   onDraw: function(i) {
      i.caption.style.text = i.style.label;
   }
})
addToCodex("faddingNode", "simpleNode", {
   defaultStyle:{fadding:1},
   onBuild: function(i) {
      i.bg=i.append("circle", {fill:"white", stroke:"none"});
      codex.simpleNode.onBuild(i);        
   },
   onSavePrefix:function(i) {
     i.children.forEach(function(n) {
       if (n!=i.bg) n.set({opacity:i.style.fadding})
     })
   }
})
//simulation may have datum with
// - nodes
// - links
// otherwise, it uses all the parent's (graph's) visible nodes and links at each frame

addToCodex("simulation", "g", {
  defaultStyle:{active:true, enforceContainerX:true, enforceContainerY:true},
  onBuild: function(i){      
     i.datum=i.datum || {};
     
    var keepMomentum=function(alpha) {
        var momentum=0; //angular momentum (depends on velocity)
        var I =0;       //area momentum of the shape (weighted by square of distance)
        i.simulation.nodes().forEach(function(n) {
            I += n.x*n.x+n.y*n.y; //multiply by mass if any
            momentum += (n.vy*n.x - n.vx*n.y);
        });
        if (momentum!=0) {
           var dm= -momentum/I;             
           i.simulation.nodes().forEach(function(n) {
             n.vx+=dm*(-n.y); //multiply by mass if any
             n.vy+=dm*(n.x);
           });  
        }
     
    } 
    var keepInBox=function(alpha) {
         var w=i.parent.style.width||i.parent.container.width;
         var h=i.parent.style.height||i.parent.container.height;         
         i.simulation.nodes().forEach(function(n) {
            var wb=n.box.actual.width;
            var hb=n.box.actual.width;
            if (n.x>(w-wb)/2)  n.vx-=(n.x-(w-wb)/2)*alpha;                                      
            if (n.x<-(w-wb)/2) n.vx-=(n.x+(w-wb)/2)*alpha;                                      
            if (n.y>(h-hb)/2)  n.vy-=(n.y-(h-hb)/2)*alpha;                                      
            if (n.y<-(h-hb)/2) n.vy-=(n.y+(h-hb)/2)*alpha;                                      
         });
    }
     var ticked = function() {              
              console.log("tick");
              i.simulation.nodes().forEach(function(n) {
                    n.set({x:n.x, y:n.y})
                    if (n.id=="graph-84/ss4:3") console.log(xy(n), xy(n.style));
              });
              if (i.shown) {
                 //console.log("draw");
                 i.parent.reLayout();
              }
            };
     i.simulation =
        d3.forceSimulation()
           .force("link", d3.forceLink())
              .force("collide",d3.forceCollide(10).iterations(2) )
              .force("charge", d3.forceManyBody().strength(-100))
          //    .force("center", d3.forceCenter(0,0))
              .force("y", d3.forceY(0))
              .force("x", d3.forceX(0))    
              .force("momentum", keepMomentum)    
              .force("keepInBox", keepInBox)       
              .alpha(1)
              .alphaMin(0.05)
              .stop()
              .on("tick", ticked);/**/
     
     i.runOnce = function() {
        i.simulation.tick();
        i.simulation.tick();
        i.simulation.tick();
        ticked();
        i.simulation
          .alpha(0.5)
          .alphaTarget(0)
          .restart();          
     }
     i.runAlways = function() {
        i.simulation
          .alpha(0.1)
          .alphaTarget(0.3)
          .restart();          
     }         
     i.runEnd = function() {
       i.simulation
          .alphaTarget(0)
     }     
     i.nodes = function(n) {
       i.datum.nodes =n;    
     }
     i.links= function(l) {
       i.datum.links =l;      
     }
  },
  onLoad: function(i, show, focus) {
    console.log("simulation load")
     if (i.style.active && i.differentFrameLoaded && i.display) {       
       var nodes = i.datum.nodes || i.parent.nodes().filterShown().items;
       var links = i.datum.links || i.parent.links().filterShown().items;
       nodes.forEach(function(n){
         if (n.style.fix) {
           n.fx=n.x;
           n.fy=n.y;
         } else {
           n.fx=null;
           n.fy=null;
         }
       });
       i.simulation.nodes(nodes);
     //  console.log(links);
       i.simulation.force("link")
            .links(links);       
       
       i.runOnce();
     } else {
     }
  }
  
})

/* graph  
 *  takes a datum with graph parameters :
 *    - nodeType = item types to be added (default= "simpleNode")
 *    - seed = used to generate seemingly random positions (default= random value)
 *    - drag = allow nodes to be dragged by the mouse (default= true)
 *    - simulation = run force simulation (same as calling i.simulation(), default= false)
 */

addToCodex("graph", "g", {
    defaultStyle:{rx:5,ry:2, x:0, y:0, width:150, height:150},
    onBuild: function(i) {
        i.datum = i.datum || {};
        var d=i.datum;
        importDefault(d, {nodeType:"simpleNode", seed:Math.random(), drag:true, simulation:false});    
        console.log("Graph seed for "+i.id+" : ", i.datum.seed);
        var generator = seededRndGenerator(i.datum.seed);
        
        var bgBox = i.append("g#"+i.id+"-bg",{priority:-10});
        var linkBox= i.append("g#"+i.id+"-links");
        var nodeBox= i.append("g#"+i.id+"-nodes", {priority:10});
        
        var nodeStyle = {};
        var linkStyle = {};
        
        var linkStyleStack=[];
        var nodeStyleStack=[];
        //links must be before the nodes according to the DOM, but they must be after in the item hierarchy (loading/drawing a link depends on its endpoints)
       // linkBox.g.lower();        
        
        
        i.nodes= function() {
            return i.graphBag(nodeBox.children);
        }
        i.links = function() {
            return i.graphBag(linkBox.children);
        }
        
        // mapping from (user's) node id to node item
        var nodeIndex = {};
        var linkIndex = {};
        var importedCoords={};
        //simulation item
        var simulation = null;
        function splitIds(ids) {          
          if (ids=="") return [];
          if (ids instanceof Array) return ids;
          return ids.split(/\ *;\ */);
        }
        i.setNodeStyle=function(s) {
           nodeStyle = copyWithDefault(s, nodeStyle);
           return i; 
        }        
        i.setLinkStyle=function(s) {
           linkStyle = copyWithDefault(s, linkStyle); 
           return i;
        }     
        i.pushLinkStyle=function(s) {
           linkStyleStack.push(linkStyle);
           linkStyle = copyWithDefault(s, linkStyle); 
           return i;
        } 
        i.popLinkStyle=function() {
           linkStyle = linkStyleStack.pop(); 
           return i;
        }
        //reLayout: to be called each time the node coordinates have changed to update the graph layout
        i.reLayout = function() {
          bgBox.draw(false);  // update links drawing (change path coordinates, not regular)
          linkBox.draw(false);  // update links drawing (change path coordinates, not regular)
          nodeBox.layout(1); //recursively update nodes' transform attributes (no redrawing)
        }
        //add node with given id. If x and y are undefined, use random position instead
        //instead of x,y, a single object with x and y coordinates may be used
        i.addNode = function(id, x, y) {
           if (id in importedCoords) {
             x=importedCoords[id].x;
             y=importedCoords[id].y;
           }
           if (typeof x=="object" && ("y" in x) && ("x" in x)) {
             y=x.y;
             x=x.x;
           } else if (typeof x=="object" && ("style" in x)) {
             y=x.style.y;
             x=x.style.x;
           }
           if (typeof x == "undefined") x= (generator.random()-0.5)*getComputed("width", i);
           if (typeof y == "undefined") y= (generator.random()-0.5)*getComputed("height", i);
           nodeIndex[id] = nodeBox.append(d.nodeType + "#" + i.id + "/" +id, copyWithDefault(nodeStyle, {x:x, y:y}));
           nodeIndex[id].x=x;
           nodeIndex[id].y=y;
           nodeIndex[id].nodeId=id;
           
           nodeIndex[id].set({label:id});
           return nodeIndex[id];           
        }
        i.addNodes = function(ids) {           
		     
           splitIds(ids).map(function(n) {return i.addNode(n)});
           return i;           
        }
        //return the node with a given id (or creates one if necessary)
        i.getOrAddNode = function(id) {
           if (typeof id=="object") {
             
              if (i.nodes().items.indexOf(id)!=-1) return id;
              console.error("id is not a valid node", id);
           }
           return nodeIndex[id] || i.addNode(id);
        }
		  
        //add a link from src to tgt, or with one parameter "src-tgt"
        i.addLink = function(idSrc, idTgt) {
          if (typeof idTgt == "undefined") {
            if (idSrc instanceof Array) {
              idTgt=idSrc[1];
              idSrc=idSrc[0];
            } else if (typeof idSrc== "object") {
              idTgt=idSrc.target;
              idSrc=idSrc.source;
              console.log(idTgt)
              
            } else {
              var s = idSrc.split(/\ *\-\ */);
              idSrc=s[0];
              idTgt=s[1];
            }
            if (typeof idSrc=="undefined" ||typeof idTgt=="undefined") {
              console.error("cannot add link with ", idSrc, idTgt);
            }
          }          
          var src= i.getOrAddNode(idSrc);
          var tgt= i.getOrAddNode(idTgt);
          var linkId = src.nodeId+"-"+tgt.nodeId;
          linkIndex[linkId] = linkBox.append("link#"+i.id+"/"+linkId,shallowCopy(linkStyle),{source:src, target:tgt});
          return i.graphBag([linkIndex[linkId]]);
        }
        //add links from a ;-separated list
        i.addLinks=function (links) {
          var s = splitIds(links);
          var x;
			 var theselinks = i.graphBag([]);
          for (x=0; x<s.length;x++) {
            theselinks.merge(i.addLink(s[x]));
          }          
          return theselinks;
        }
        //returns a link by id (e.g. "5-8")
        i.getLink = function(id) {
           return linkIndex[id];
        }
        //returns a bag of links
        i.getLinks = function(id) {
           return i.graphBag(splitIds(id).map(i.getLink))
        }
        //returns a node by id
        i.getNode = function(id) {
           if (typeof id=="object") {
             return id;
           }
           return nodeIndex[id+""];
        }
        //returns a bag of nodes
        i.getNodes = function(ids) {
          if (typeof ids=="object" && ids.isItemBag) return ids;
           return i.graphBag(splitIds(ids).map(i.getNode))           
        }
        i.getNeighborLinks = function(ids) {
          var ns=i.getNodes(ids).items;
          return  i.graphBag(i.links().filter(function(l){return ns.indexOf(l.source)>=0 || ns.indexOf(l.target)>=0}))
        }
		  
		  i.addLace = function(id, style, d ) {
				d = d||{};
				if (d.d) {
				  d.size=d.d.length;          
				} else {
				   importDefault(d, {size: 10})
					d.d=d3.range(d.size);
				}
				style=style||{};
				importDefault(style, {x:0,y:0, dx:15, dy:0});			
				var newNodes= [];
				for (var u=0; u<d.size; u++) {
					   var x= style.x + (u-d.size/2)*style.dx;
						var y= style.y + (u-d.size/2)*style.dy;
						newNodes.push(i.addNode(id+":"+u, x, y)
						  .set(copyWithDefault(style, {label:d.d[u]}))
						  .set({x:x, y:y}));
						if (u>0) {
							 i.addLink(id+":"+(u-1)+"-"+id+":"+u)
						}
				 }
				 return i.graphBag(newNodes);
			 
		  }
        //creates (or returns) a force simulation for node placement
        i.simulation=function(d) {          
          if (simulation==null) {            
            simulation = i.append("simulation");        
          }          
          return simulation;
        }
        i.export = function() {
          var out={};
          for (id in nodeIndex) {
            var n=nodeIndex[id];
            out[id]={x:n.x, y:n.y};
          }
          return JSON.stringify(out); 
        }
        i.import = function(coords) {
          importedCoords = coords;
          return i;
        }
        if (i.datum.simulation) i.simulation();
           
        //give dragging behavior:
        
        //define helper functions
        function dragstarted(d) {
              if (simulation) {
                if (!d3.event.active) simulation.runAlways();
                d.fx = d.x;
                d.fy = d.y;
              } else {
                if (typeof d.x== "undefined") d.x=d.style.x;
                if (typeof d.y== "undefined") d.y=d.style.y; 
                d.fx=d.x;
                d.fy=d.y;
              }
          }        
          function dragged(d) {   
              if (d.style.dragAxis) {
                keepFOnAxis(d, d3.event, d.style.dragAxis)
              } else {                            
                d.fx = d3.event.x;
                d.fy = d3.event.y;
              }
              if (!simulation) {
                d.x=d.fx;
                d.y=d.fy;
                i.reLayout();
              }
          }        
          function dragended(d) {
              if (simulation) {              
                if (!d3.event.active) simulation.runEnd();
                if (!d.style.fix) {
                  d.fx = null;
                  d.fy = null;
                }
              }
          }  
        //give the behavior to a single node          
        i.allowNodeDrag = function (n) {           
          //call d3.drag
          n.g.call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended)
                  );          
        }
        
		  i.graphBag = function (set) {
			  var b=set;
			  if (b instanceof Array) b = itemBag(set);
			  
              b.nodes = i.nodes;
              b.links = i.links;
              b.then = i.then;
              b.setNodeStyle = i.setNodeStyle
              b.setLinkStyle = i.setLinkStyle
			  b.addNode = i.addNode;
			  b.addLink = i.addLink;
			  b.getNode = i.getNode;
			  b.getLink = i.getLink;
			  b.addNodes = i.addNodes;
			  b.addLinks = i.addLinks;
              b.getNodes = i.getNodes;
              b.popLinkStyle = i.popLinkStyle;
              b.pushLinkStyle = i.pushLinkStyle;
            /*  b.getLinks = i.getLinks;
              b.getLinks = i.getLinks;*/
			  b.getNeighborLinks = i.getNeighborLinks;
			  b.addLace = i.addLace;
              
              b.getSubgraphLinks = function() {
                return  i.graphBag(i.links().filter(function(l){return b.items.indexOf(l.source)>=0 || b.items.indexOf(l.target)>=0}))
              }
              var oldGet=b.get;
              b.get=function(x) {
                if (x instanceof Array) return i.graphBag(oldGet(x).items);
                return oldGet(x);
              }
              b.frameNodes= function(id, style) {
                bgBox.append("autoFrame"+(id?"#"+id:""),style, b.items);
              }
              
			  
			  return b;
		  }
       
        
        
    },
    onRun : function(i) {
        if (i.datum.drag) {
            i.nodes().each(i.allowNodeDrag);
        }
    }
});
/**/


addToCodex("laceGraph", "graph", {
    defaultStyle:{rx:5,ry:2, r:5},
    onBuild: function(i) {
		  codex.graph.onBuild(i);
		  var d = i.datum;
        if (d.d) {
            d.size=d.d.length;          
        } else {
            importDefault(d, {size: 10, gap:15})
            d.d=d3.range(d.size);
        }
        
		  var prevn= null;
        for (var x=0; x<d.size; x++) {
			   i.addNode(x, (x-d.size/2)*d.gap, 0).set({label:d.d[x]});
            if (x>0) {
                i.addLink((x-1)+"-"+x)
            }
        }
    }
});
