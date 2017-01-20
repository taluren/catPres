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
        if (delta>0)
           console.log("no wriggle ", delta, xy(i.style), i.id);
        return false
     }
  }
  savedCoordinates[key] = {x: i.style.x, y:i.style.y};
  return true;
}