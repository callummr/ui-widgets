    covertCanvasToPDFDownload: function(){
      // Remove selected states and grid before saving img
      app.c.cleanCanvas();

      var requiredPrintSize   = app.c.pdfDocumentSize( $('input[name=doc-size]:checked').val() ),
          documentOrientation = $('input[name=doc-orientation]:checked').val();

      // Check the orientation of the document
      // If is landscape,  reverse the document sizes
      if( documentOrientation === 'l' ){
        var x = requiredPrintSize[1],
            y = requiredPrintSize[0]
        requiredPrintSize = [x,y];
      }
      console.log(requiredPrintSize);

      // Then make the canvas relative to the size 

      // only jpeg is supported by jsPDF
      var imgData = $('#c')[0].toDataURL('image/jpeg',  1.0),
          pdf     = new jsPDF($('input[name=doc-orientation]:checked').val(), 'mm', requiredPrintSize);

      pdf.addImage(imgData, 'JPEG', 0, 0);
      pdf.save( app.c.createFileName('.pdf') );
      app.c.toggleCanvasGrid(true);
    },

    calcFontSize: function(fontSize){
      // To do
      return fontSize
    }

    toggleEl: function(){
      var $this = $(this),
          targetElName = $this.attr('data-targetel');

      if(!$this.hasClass('toggle-active')){
        app.$addElControls.removeClass('toggle-active');
        $this.addClass('toggle-active');
        if($('.add-element-control:visible').length){
          $('.add-element-control:visible').fadeOut(100, function(){
            $('#add-controls-container').fadeOut(100, function(){
              $('#' + targetElName).fadeIn(100);
            });
          });
        }else{
          $('#add-controls-container').fadeOut(100, function(){
            $('#' + targetElName).fadeIn(100);
          });
        }
      }
    },

    switch(documentName) {
        case 'a2':
            return [420,594]
            break;
        case 'a3':
            return [420,594]
            break;
        case 'a4':
            return [210,297]
            break;
        case 'a5':
            return [148,210]
            break;
        case 'a6':
            return [105,148]
            break;
        case 'a7':
            return [74,105]
            break;
        case 'business':
              return [88,55]
              break;
    }