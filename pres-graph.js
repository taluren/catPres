

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

addToCodex("link", "path", {
   onBuild: function(i) {    
       i.source = i.datum.source;
       i.target = i.datum.target;
   },
   onLoad: function(i) {
       if (!i.source.display || !i.target.display)
          i.display=false;
   },
   onDraw: function(i) {
        i.style.d= "M"+xy(i.datum.source.style)+ " L"+xy(i.datum.target.style);       
        codex.path.onDraw(i);
        // using i.datum.source afterwards is deprecated
    }
})

addToCodex("simpleNode", "g", {
   defaultStyle:{cursor:"pointer", fill:"#ddd", r:8, stroke:"none", wriggle:0},
   onBuild: function(i) {
      i.append("circle");
      i.caption = i.append("caption");      
        
   },
   onDraw: function(i) {
      i.caption.style.text = i.style.label;
   }
})

//simulation may have datum with
// - nodes
// - links
// otherwise, it uses all the parent's (graph's) visible nodes and links at each frame

addToCodex("simulation", "g", {
  defaultStyle:{active:true},
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
         var w=i.parent.style.width;
         var h=i.parent.style.height;         
         i.simulation.nodes().forEach(function(n) {
            if (n.x>w/2)  n.vx-=(n.x-w/2)*alpha;                                      
            if (n.x<-w/2) n.vx-=(n.x+w/2)*alpha;                                      
            if (n.y>h/2)  n.vy-=(n.y-h/2)*alpha;                                      
            if (n.y<-h/2) n.vy-=(n.y+h/2)*alpha;                                      
         });
    }
     var ticked = function() {              
              i.simulation.nodes().forEach(function(n) {
                    n.set({x:n.x, y:n.y})
              });
              if (i.shown) {
                 console.log("draw");
                 i.parent.reLayout();
              }
            };
     i.simulation =
        d3.forceSimulation()
           .force("link", d3.forceLink())
              .force("collide",d3.forceCollide(10).iterations(2) )
              .force("charge", d3.forceManyBody().strength(-100))
              .force("center", d3.forceCenter(0,0))
              .force("y", d3.forceY(0))
              .force("x", d3.forceX(0))    
              .force("keepInBox", keepInBox)  
              .force("momentum", keepMomentum)         
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
     console.log(i.style.active , i.differentFrameLoaded, i.display)
     if (i.style.active && i.differentFrameLoaded && i.display) {       
       var nodes = i.datum.nodes || i.parent.nodes().filterShown().items;
       var links = i.datum.links || i.parent.links().filterShown().items;
       console.log("run with ",nodes.length," nodes and ", links.length, " links");
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
       console.log(links);
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
 //*  in freeGraph: dimensions are free (it should adapt to inline/arrays/etc depending on its actual size. Does not behave well with simulations.
 *  in graph: dimensions are fixed
 */

addToCodex("freeGraph", "g", {
    defaultStyle:{rx:5,ry:2, x:0, y:0, width:150, height:150},
    onBuild: function(i) {
        i.datum = i.datum || {};
        var d=i.datum;
        importDefault(d, {nodeType:"simpleNode", seed:Math.random(), drag:true, simulation:false});    
        console.log("Graph seed for "+i.id+" : ", i.datum.seed);
        var generator = seededRndGenerator(i.datum.seed);
        
        var nodeBox= i.append("g");
        var linkBox= i.append("g");
        
        var nodeStyle = {};
        var linkStyle = {};
        
        //links must be before the nodes according to the DOM, but they must be after in the item hierarchy (loading/drawing a link depends on its endpoints)
        linkBox.g.lower();        
        
        
        i.nodes= function() {
            return nodeBox.childBag();
        }
        i.links = function() {
            return linkBox.childBag();
        }
        
        // mapping from (user's) node id to node item
        var nodeIndex = {};
        var linkIndex = {};
        var importedCoords={};
        //simulation item
        var simulation = null;
        i.setNodeStyle=function(s) {
           nodeStyle = copyWithDefault(s, nodeStyle);
           return i; 
        }        
        i.setLinkStyle=function(s) {
           linkStyle = copyWithDefault(s, linkStyle); 
           return i;
        }
        //reLayout: to be called each time the node coordinates have changed to update the graph layout
        i.reLayout = function() {
          linkBox.draw(false);  // update links drawing (change path coordinates, not regular)
          nodeBox.layout(1); //recursively update nodes' transform attributes (no redrawing)
        }
        //add node with given id. If x and y are undefined, use random position instead
        i.addNode = function(id, x, y) {
           if (id in importedCoords) {
             x=importedCoords[id].x;
             y=importedCoords[id].y;
           }
           if (typeof x == "undefined") x= (generator.random()-0.5)*getComputed("width", i);
           if (typeof y == "undefined") y= (generator.random()-0.5)*getComputed("height", i);
           nodeIndex[id] = nodeBox.append(d.nodeType + "#" + i.id + "/" +id, copyWithDefault(nodeStyle, {x:x, y:y}));
           nodeIndex[id].x=x;
           nodeIndex[id].y=y;
           
           nodeIndex[id].set({label:id});
           return nodeIndex[id];           
        }
        i.addNodes = function(ids) {           
           ids.split(/\ *;\ */).map(function(n) {return i.addNode(n)});
           return i;           
        }
        //return the node with a given id o(creates one if necessary)
        i.getOrAddNode = function(id) {
           return nodeIndex[id] || i.addNode(id);
        }
        //add a link from src to tgt, or with one parameter "src-tgt"
        i.addLink = function(idSrc, idTgt) {
          if (typeof idTgt == "undefined") {
            var s = idSrc.split(/\ *\-\ */);
            idSrc=s[0];
            idTgt=s[1];
          }          
          var src= i.getOrAddNode(idSrc);
          var tgt= i.getOrAddNode(idTgt);
          var linkId = idSrc+"-"+idTgt;
          linkIndex[linkId] = linkBox.append("link#"+i.id+"/"+linkId,shallowCopy(linkStyle),{source:src, target:tgt});
          return i;
        }
        //add links from a ;-separated list
        i.addLinks=function (links) {
          var s = links.split(/\ *\;\ */);
          var x;
          for (x=0; x<s.length;x++) {
            i.addLink(s[x]);
          }          
          return i;
        }
        //returns a link by id (e.g. "5-8")
        i.getLink = function(id) {
           return linkIndex[id];
        }
        //returns a bag of links
        i.getLinks = function(id) {
           return itemBag(id.split(/\ *;\ */).map(i.getLink))
        }
        //returns a node by id
        i.getNode = function(id) {
           return nodeIndex[id];
        }
        //returns a bag of nodes
        i.getNodes = function(ids) {
           return itemBag(ids.split(/\ *;\ */).map(i.getNode))           
        }
        i.getNeighborLinks = function(id) {
          var n=nodeIndex[id];
          console.log(n);
          console.log( i.links().filter(function(l){return l.source==n || l.target==n}))
          return  i.links().filter(function(l){return l.source==n || l.target==n})
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
          console.log(JSON.stringify(out)); 
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
              }
          }        
          function dragged(d) {           
              d.fx = d3.event.x;
              d.fy = d3.event.y;
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
        
       
        
        
    },
    onFirstRun : function(i) {
        if (i.datum.drag) {
            i.nodes().each(i.allowNodeDrag);
        }
    }
});
/**/
addToCodex("graph", "freeGraph", { 
 getBackgroundBBox: codex.box.getBackgroundBBox,
 getAnchoredBBox: codex.box.getAnchoredBBox, 
 onBuild: function(i){  
   codex.blackbox.onBuild(i);
   codex.freeGraph.onBuild(i);
 },
 onLoad: function(i) {   
   i.width=i.style.width;
   i.height=i.style.height;  
 }
});/**/
