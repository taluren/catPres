 function toPDF(fm) {
	 doc = new PDFDocument({size:[400,300]});
	 stream = doc.pipe(blobStream())
	 doc.text("hello pdf world");
	 doc.rect(20,30,40,55)
	 doc.addPage();
	 /*doc.rect(-200,-300,400,550)
	 
	 doc.moveTo(0, 20)                            
      .lineTo(100, 160)                            
      .quadraticCurveTo(130, 200, 150, 120)        
      .bezierCurveTo(190, -40, 200, 200, 300, 150) 
      .lineTo(400, 90)       
      .stroke()              
		*/
	  fm.frames.forEach(function(f) {
		 
		 f.toPdf(doc);
	 })
	 
	 doc.end()
	 
	 stream.on('finish', 
	   function() {  blob = stream.toBlob('application/pdf')
			saveData(blob);

      /*url = stream.toBlobURL('application/pdf')
      iframe.src = url*/
	 })
	 
	 var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (blob) {
       var      url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = "truc.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
    };
	}());


 }