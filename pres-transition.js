var newTransitionKey=0;
var transitionShop = {};

function transitionMaker(t) {
	if (t==null) return null;
	if (t.key) return t.key;
	if (!t.ease) t.ease= d3.easeLinear;
	if (typeof t.ease == "string")
		t.ease = d3["ease" + t.ease.value[0].toUpperCase() + t.ease.value.slice(1)] || d3.easeLinear;
	
	t.delay = t.delay||0;
	t.duration = t.duration ||250;
	t.key = "trans-"+(newTransitionKey++);
	t.running = false;
	t.transObj = null;
	t.make = function() {
				 if (!t.running) {
					t.transObj = d3.transition()
		                 .delay(t.delay)
		                 .duration(t.duration)
							  .ease(t.ease)
							  .on("start", function() {console.log("transition start", t.key, t.duration);})
							  //.on("end", function() {console.log("transition end", t.key, t.transObj.nodes()); t.running=false;})
				 //  t.running=true;	
				 }				 
				 return t;
					 
	}
	transitionShop[t.key] = t;
	return t.key;
	
}

function processTransition(i) {
	var hl=i.history.length;	
	var t = i.history[hl-1].transition
	if (t) {
		//console.log(t);
		if (typeof t=="number") t={duration:t};
		var bt =null;
	   if ("back" in t) {
			if (t.back!=null) {
				bt = t.back;
				if (typeof bt=="number") bt={duration:bt};
				delete t.back;
				importDefault(bt, t);
			}
		} else {
			bt = t;
		}	
		i.history[hl-1].frontTransitionKey = transitionMaker(t);
		if (hl>0)
		   i.history[hl-2].backTransitionKey = transitionMaker(bt);	
		delete i.style.transition;
	}
	/*
	|| i.history[hl-1].transition;
	if (typeof ft== "object") {		
		i.history[hl-1].forwardTrans = transitionMaker(ft);
	}
	var bt = i.history[hl-1].backwardTrans || i.history[hl-1].transition;
	if (typeof bt== "object") {		
		i.history[hl-1].backwardTrans = transitionMaker(bt);
	}	*/
}

function stopAllTransitions() {
	for (k of Object.keys(transitionShop)) {
        var t= transitionShop[k];
		if (t.running) d3.interrupt(t.transObj);
		t.running=false;
	}
}
function getTransition(style, forward) {
	var t= null;
	if (forward==1) 
		t= style.frontTransitionKey || null;
	else if (forward==-1)
		t = style.backTransitionKey || null;
	//else console.log("no transition, forward = ",forward);
	if (t) {
		console.log("get transition : ", t);
		//if (transitionShop[t].
		//transitionShop[t].make();
	}
	return t;
	
}