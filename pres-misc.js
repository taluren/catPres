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