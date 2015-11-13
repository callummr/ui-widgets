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

    app.$closeBtns        = $('.close-control');
    app.$closeBtns.on('click', app.c.closeElementControls);

    closeElementControls: function(){
      $('.add-element-control').fadeOut(100, function(){
        app.$addElControls.removeClass('toggle-active');
        $('#add-controls-container').fadeIn(100);
      }); 
    },

    // app.$addTextArea      = $('#add-text-area');
    // app.$textComponentOpt = $('.text-editor-option button');
    // app.$addTextArea.on('click', app.c.createTextArea);
      //app.$textComponentOpt.on('click', app.c.setSelectedOption);

    createTextArea: function(){ 
      var _textComponent;

      // if(textString.length && textString !== null){
        // Disable the add button after it has been added.
        // $(this).attr('disabled', 'disabled');
      _textComponent = new fabric.IText( '', {
        editable: true,
        editingBorderColor: 'rga(0,255,0)',
        // exitEditing: ''// Bind to the textarea
        fill: 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')',
        // fontFamily: '',
        fontSize: $('#at-font-size .option-selected').attr('data-size'),
        // fontStyle: '',
        // fontWeight: '',
        hasBorders: true,
        hasControls: false,
        hasRotatingPoint: false,
        isEditing : true,
        left: 60,
        lineHeight: 1,
        lockRotation: true,
        textAlign: $('#at-alignment .option-selected').attr('data-align'),
        // textDecoration: '',
        top: 99         
      });

      // Check whether the text is being loaded by a source.
      if( $('#at-src-ctrl').is(':checked') ){
        _textComponent['stringSrc'] = $('#at-src').val();
        $.get( $('#at-src').val(), function(data) {
        }, 'text').done(function(data) {
          _textComponent.set('text', data);
          app._canvas.add(_textComponent);
          app._canvas.renderAll();
        });
      }else{
       _textComponent.set('text', $('#at-text-body').val());
        app._canvas.add(_textComponent);
        app._canvas.renderAll();
      }
     
      // }
    },

    app.$downloadThumb    = $('#dl-thumb');
    app.$downloadThumb.on('click', app.c.covertCanvasToImgDownload);
    covertCanvasToImgDownload: function(){
      // Remove selected states and grid before saving img
      app.c.cleanCanvas();
      app.imagedata = app._canvas.toDataURL('image/png');
      console.log(app.imagedata);
      this.href = app.imagedata;
      app.c.toggleCanvasGrid(true);
    }