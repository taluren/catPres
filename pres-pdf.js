 var blob;
 
 function toPDF(fm, download) {
	 var doc = new PDFDocument(
        {
          size:[400,300],
          autoFirstPage: false,
          margin:0
        });
     createMathPNGs(exportTheRest)
     stream = doc.pipe(blobStream())	 
     function exportTheRest() {
      fm.camera.goFirst();
      var i =0;
      while(1) {       
        console.log("page")            
        fm.frames[i].toPdf(doc);
        if (fm.camera.isLastFrame()) break;
        fm.camera.switchFrame(+1);         
        if (i+1< fm.frames.length && fm.camera.frame>= fm.frames[i+1].frame) i++; 
      }
        
      //doc.text("[PDF: last page]");
      doc.end()
     }
	 stream.on('finish', 
	   function() {  blob = stream.toBlob('application/pdf')
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url = window.URL.createObjectURL(blob);
        console.log(url);
        if (download) {
          a.download = "slides.pdf";
          a.click();
          setTimeout(1000, function(){window.URL.revokeObjectURL(url)});
        }
	 });


 }