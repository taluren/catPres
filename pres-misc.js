var savedCoordinates = {};
defaultWriggleThreshold = 1;
console.log("hello");

function checkNoWriggle(i) {
  if (!i.style.wriggle) return true;
  var key= i.frame+"/"+i.type+"#"+i.id;
  var sc= savedCoordinates[key];
  if (sc !=null) {
     var delta=Math.abs(i.style.x - sc.x)+Math.abs(i.style.y-sc.y);
     if (delta<i.style.wriggle) {
     /*   if (delta>0)
           console.log("no wriggle ", delta, xy(i.style), i.id);*/
        return false
     }
  }
  savedCoordinates[key] = {x: i.style.x, y:i.style.y};
  return true;
}


function romanize (num) {
    if (!+num)
        return false;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}


function exportSingleHTML() {
   var done="";
	var todo="";
	
	function addMathJSON() {
		//alert(done.length);
		done=done.replace("importedMathFormulas ="+" null;",
            		"importedMathFormulas  = "+ getFormulasJSON());		
      //alert(done.length);
    	//alert(done.indexOf("importedMathFormulas ="+" null;"));
	}
   function readNextScriptFile(script) {
	   if (script!="") {
	      done+="\n"+script+"\n"		
		} 
		var spl=todo.split(/src\=\"([^\"]*)\">([\s\S]*)/)
		if (spl.length>=2) {  
			done+=spl[0]+">\n//import "+spl[1]+"\n";
			todo = spl[2];
			//alert(spl[1]+" "+ todo.length);
			d3.text(spl[1], readNextScriptFile)	
			return;
		} 
		done +=todo;
		todo="";
		addMathJSON();		
		save(done,"Slides.html", "text/html");
   }
	d3.text("./pres.html", function(f) {
		todo=f;
		readNextScriptFile("");
	})	
}

function save(content, fileName, mime) {
	var url = "data:"+mime+";charset=utf-8,"+encodeURIComponent(content);
	d3.select("body").append("a")
		.attr("href", url)
		.attr("download", fileName)
		.node().dispatchEvent( new MouseEvent("click"))
	
}

function showGraph(fm, disable) {
	return function() {
		fm.frames.forEach(function(f) {
			f.allNodes("graph").each(function(n) {
				
					console.log(n);
				n.g.on("click", disable? null: function(e) {
					
					console.log(n);
				   save("//insert following code in the presentation to set the graph coordinates:\n  .goto(\"#"+n.id+"\")\n    .import("+n.export()+")", n.id+".json", "text/json")
					showGraph(fm, true);
				}  )
			})			
		})
		
	}
}