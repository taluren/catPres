 var blob;
 
 function toPDF(fm) {
	 doc = new PDFDocument(
        {
          size:[400,300],
          autoFirstPage: false,
          margin:0
        });
	 stream = doc.pipe(blobStream())	 
	 fm.frames.forEach(function(f) {
	
         console.log("new page")	 
		 f.toPdf(doc);
	 })
     doc.text("hello");
	 
	 doc.end()
	 
	 stream.on('finish', 
	   function() {  blob = stream.toBlob('application/pdf')
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url = window.URL.createObjectURL(blob);
        console.log(url);
        a.download = "truc.pdf";
        a.click();
        setTimeout(1000, function(){window.URL.revokeObjectURL(url)});
	 })
	 ;


 }