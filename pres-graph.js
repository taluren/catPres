

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

addToCodex("link", "path", {
   onDraw: function(i) {
        i.style.d= "M"+xy(i.datum.source.style)+ " L"+xy(i.datum.target.style);       
        codex.path.onDraw(i);
    }
})

addToCodex("simpleNode", "g", {
   onBuild: function(i) {
      i.append("circle", {fill:"#ddd", r:8, stroke:"none"});
      i.caption = i.append("caption");      
        
   },
   onDraw: function(i) {
      i.caption.style.text = i.style.label;
   }
})

//simulation needs datum with
// - nodes
// - links
addToCodex("simulation", "g", {
  defaultStyle:{active:true},
  onBuild: function(i){     
     var nodes = i.datum.nodes;
     var links = i.datum.links;   
     var ticked = function() {              
              nodes.forEach(function(n) {
                    n.set({x:n.x, y:n.y})
              });
              if (i.shown) {
                 console.log("draw");
                 i.parent.draw(false);
              }
            };
     i.simulation =
        d3.forceSimulation()
           .force("link", d3.forceLink(links))
              .force("collide",d3.forceCollide(10).iterations(2) )
              .force("charge", d3.forceManyBody().strength(-100))
              .force("center", d3.forceCenter(0,0))
              .force("y", d3.forceY(0))
              .force("x", d3.forceX(0))              
              .nodes(nodes)
              .alpha(1)
              .stop()
              .on("tick", ticked);
              
     i.nodes = function(n) {
       nodes = i.datum.nodes =n;
       i.simulation.nodes(n);       
     }
     i.links= function(l) {
       links = i.datum.links =l;
       i.simulation.force("link").links(l);       
     }
  },
  onLoad: function(i) {
     if (i.style.active && i.style.show) {       
       i.simulation.restart();
     } else {
       i.simulation.stop();
     }
  }
  
})

addToCodex("graph", "g", {
    defaultStyle:{rx:5,ry:2},
    onBuild: function(i) {
        i.datum = i.datum || {};
        var d=i.datum;
        importDefault(d, {nodeType:"circle", seed:Math.random()});    
        console.log("Graph seed for "+i.id+" : ", i.datum.seed);
        var generator = seededRndGenerator(i.datum.seed);
        
        var links= i.append("g");
        var nodes= i.append("g");
        var nodeIndex = {};
        var linkIndex = {};
        var simulation = null;
        i.addNode = function(id, x, y) {
           if (typeof x == "undefined") x= generator.random()*150-75;
           if (typeof y == "undefined") y= generator.random()*150-75;
           nodeIndex[id] = nodes.append(d.nodeType + "#" + i.id + "/" +id, {x:x, y:y});
           nodeIndex[id].x=x;
           nodeIndex[id].y=y;
           
           nodeIndex[id].set({label:id});
           return nodeIndex[id];
           
        }
        i.getNode = function(id) {
           return nodeIndex[id] || i.addNode(id);
        }
        
        i.addLink = function(idSrc, idTgt) {
          if (typeof idTgt == "undefined") {
            var s = idSrc.split(/\ *\-\ */);
            idSrc=s[0];
            idTgt=s[1];
          }
          
          var src= i.getNode(idSrc);
          var tgt= i.getNode(idTgt);
          var linkId = idSrc+"-"+idTgt;
          links.append("link#"+i.id+"/"+linkId,{},{source:src, target:tgt});
          return i;
        }
        i.addLinks=function (links) {
          var s = links.split(/\ *\;\ */);
          var x;
          for (x=0; x<s.length;x++) {
            i.addLink(s[x]);
          }          
          return i;
        }
        i.simulation=function(d) {          
          if (simulation==null) {
            
            simulation = i.append("simulation", {}, {nodes:nodes.children, links:links.children.map(getter("datum"))});
            /*console.log(links.children);
            ticked = function() {              
              nodes.childBag().set(function(n) {
                    return {x:n.x, y:n.y}
              });
              if (i.shown) {
                 console.log("draw");
                 i.draw(false);
              }
            }
            simulation =
              d3.forceSimulation()
              .force("link",
                     d3.forceLink(links.children.map(getter("datum"))))
              .force("collide",d3.forceCollide(10).iterations(2) )
              .force("charge", d3.forceManyBody().strength(-100))
              .force("center", d3.forceCenter(0,0))
              .force("y", d3.forceY(0))
              .force("x", d3.forceX(0))              
              .nodes(nodes.children)
              .on("tick", ticked);
            */
          }  
        
          console.log(simulation);
          return simulation;
        }
        
        
        i.nodes= function() {
            return nodes.childBag();
        }
        i.links = function() {
            return links.childBag();
        }
        
    }
});
