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
    // app.$addTextArea.on('click', app.c.createTextArea);
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

    setDefaultVal: function(val, expression, defaultVal){
      if(val === expression){
        return defaultVal
      }else{
        return val
      }
    },

    drawDemoItems: function(){
      // Draw the grid
      
      // var _el1 = new fabric.IText( 'textString', {
      //       left: 60,
      //       top: 99,
      //       // lockRotation: true,
      //       // hasRotatingPoint: false,
      //       hasBorders: true,
      //       isEditing : true,
      //       editable: true,
      //       editingBorderColor: 'rga(0,255,0)',
      //       hasControls: false,
      //       fill: 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')',
      //       // fontFamily: '',
      //       fontSize: $('#at-font-size .option-selected').attr('data-size'),
      //       lineHeight: 1.4,
      //       // fontStyle: '',
      //       // fontWeight: '',
      //       textAlign: $('#at-alignment .option-selected').attr('data-align'),
      //       // lockUniScaling: true,
      //       lockScalingX: true,
      //       lockScalingY: true,            
      //       // textDecoration: '',
      //       // exitEditing: ''// Bind to the textarea
      //     });
      // console.log(_el1);
      // _el1['stringSrc'] = 'C:\\Projects\\bemac_discovery\\BeMacDiscovery\\Assets\\terms.txt'; // need to add this property dynamically based on if this element has an option checked
      // console.log(_el1);
      // app._canvas.add(_el1);

      // var _el2 = new fabric.IText( 'text String 2', {
      //       left: 250,
      //       top: 250,
      //       lockRotation: true,
      //       hasRotatingPoint: false,
      //       hasBorders: true,
      //       isEditing : true,
      //       editable: true,
      //       editingBorderColor: 'rga(255,255,0)',
      //       hasControls: true,
      //       fill: 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')',
      //       // fontFamily: '',
      //       fontSize: $('#at-font-size .option-selected').attr('data-size'),
      //       lineHeight: 1.4,
      //       lockUniScaling: true,
      //       // fontStyle: '',
      //       // fontWeight: '',
      //       textAlign: $('#at-alignment .option-selected').attr('data-align')
      //       // textDecoration: '',
      //       // exitEditing: ''// Bind to the textarea
      //     });
      // app._canvas.add(_el2);

      // fabric.Image.fromURL('assets/img/demo.jpg', function(oImg) {
      //   oImg.lockUniScaling = true;
      //   app._canvas.add(oImg);
      // });
    },

    rgbToCMYK: function(color){
      var computedC = 0,
          computedM = 0,
          computedY = 0,
          computedK = 0,
          rgb       = color.replace(/rgb|\(|\)/gi, '').split(','),
          r         = parseInt(rgb[0]),
          g         = parseInt(rgb[1]),
          b         = parseInt(rgb[2]);

      // BLACK
      if (r==0 && g==0 && b==0) {
        computedK = 1;
        return [0,0,0,1];
      }

      computedC = 1 - (r/255);
      computedM = 1 - (g/255);
      computedY = 1 - (b/255);

      var minCMY = Math.min(computedC, Math.min(computedM,computedY));

      computedC = Math.round( (computedC - minCMY) / (1 - minCMY) * 100 );
      computedM = Math.round( (computedM - minCMY) / (1 - minCMY) * 100 );
      computedY = Math.round( (computedY - minCMY) / (1 - minCMY) * 100 );
      computedK = Math.round( minCMY * 100 );

      // return [computedC,computedM,computedY,computedK];
      // console.log( computedC + ',' + computedM + ',' + computedY + ',' + computedK );
      return computedC + ',' + computedM + ',' + computedY + ',' + computedK;
    },









    // Create collection of objects for the JSON, which will be converted to XML
      canvasData.forEach(function(el, i) {
        console.log(el);
        // Check if the element has been scaled. If it has then get the scaled value
        var scalex        = el.scaleX === 1 ? 1 : el.scaleX,
            scaley        = el.scaleY === 1 ? 1 : el.scaleY,
            elDimensions  = [
                            app.c.convertUnit( (el.width * scalex) * canvasScale, app.mmSize),
                            app.c.convertUnit( (el.height * scaley) * canvasScale, app.mmSize),
                            app.c.convertUnit(el.top * canvasScale, app.mmSize),
                            app.c.convertUnit(el.left * canvasScale, app.mmSize),
                            destDocWidth,
                            destDocHeight
                          ];
        // console.log(scalex, scaley)
        //console.log(elDimensions);

        // Check if the canvas object is a text element, and if the text for it is coming from an external source (.txt file for example)
        // If it is a regular text element, then it needs to be wrapped in a 'text-group-block'
        if(el.type === 'i-text' && typeof(el.stringSrc) === 'undefined'){  
          var textBlockGroupName  = 'text-block-group_' + i
          // Create <text-block-group>
          baseObj[textBlockGroupName] = {
            '_align': el.textAlign,
            '_editable': 'True',
            '_fitmethod': 'auto',
            '_height': elDimensions[1],
            '_id': 'Group '+ i,
            '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
            '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
            '_mandatory': 'False',
            '_orientate': 'north',
            '_spacing': '0',
            '_title': 'Group '+ i,
            '_upperrightx': app.c.calcUpperRightX(elDimensions),
            '_upperrighty': app.c.calcUpperRightY(elDimensions),
            '_verticalalign': 'top',  
            '_width': elDimensions[0],
            // Create <text-block>
            'text-block': {
                            '_align': el.textAlign,
                            '_colour': '94,0,100,0', // rgbToCMYK(el.fill),
                            '_editable': 'True', // Need to add to initial form
                            '_fitmethod': 'auto',
                            '_font-family': 'FuturaBT-Heavy', // el.fontFamily,
                            '_font-size': app.c.convertUnit(el.fontSize, app.ptSize),
                            '_height': elDimensions[1],
                            '_id': 'Block ' + i, // Need to add to initial form
                            '_leading': '125%', // Need to add to initial form,
                            '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
                            '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
                            '_mandatory': 'False', // Need to add to initial form
                            '_maxlen': '100', // Need to add to initial form
                            '_orientate': 'north',
                            '_source': 'C:\\Projects\\bemac_discovery\\BeMacDiscovery\\Assets\\terms.txt', // Need to add to initial form
                            '_textmode': 'multiline', // Need to add to initial form
                            '_title': 'Block ' + i, // Need to add to initial form
                            '_upperrightx': app.c.calcUpperRightX(elDimensions),
                            '_upperrighty': app.c.calcUpperRightY(elDimensions),
                            '_width': elDimensions[0],
                            '_verticalalign': 'top',                        
                            '__text': el.text
                          }
          }
          console.log(baseObj);
          cordData.push(baseObj);
        }
        // If it is a text element that uses an external source, it DOES NOT require a wrapping 'text-block-group'
        else if(el.type === 'i-text' && typeof(el.stringSrc) !== 'undefined'){
          var textBlockName  = 'text-block' + i
          // Create <text-block>
          baseObj[textBlockName] = {
                                    '_align': el.textAlign,
                                    '_colour': '94,0,100,0', // rgbToCMYK(el.fill),
                                    '_editable': 'True', // Need to add to initial form
                                    '_fitmethod': 'auto',
                                    '_font-family': 'FuturaBT-Heavy', // el.fontFamily,
                                    '_font-size': app.c.convertUnit(el.fontSize, app.ptSize),
                                    '_height': elDimensions[1],
                                    '_id': 'Block ' + i, // Need to add to initial form
                                    '_leading': '125%', // Need to add to initial form,
                                    '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
                                    '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
                                    '_mandatory': 'False', // Need to add to initial form
                                    '_maxlen': '100', // Need to add to initial form
                                    '_orientate': 'north',
                                    '_source': el.stringSrc, // Need to add to initial form
                                    '_textmode': 'multiline', // Need to add to initial form
                                    '_title': 'Block ' + i, // Need to add to initial form
                                    '_upperrightx': app.c.calcUpperRightX(elDimensions),
                                    '_upperrighty': app.c.calcUpperRightY(elDimensions),
                                    '_width': elDimensions[0],
                                    '_verticalalign': 'top',                        
                                    '__text': el.text
                                  }
          cordData.push(baseObj);
        }
        // Otherwise it will be treated as an image block
        else{
          var imgBlockName = 'image_' + i;
          baseObj[imgBlockName] = {
                                    '_align': el.halign,
                                    '_editable': 'False',
                                    '_fillcolor': app.c.rgbToCMYK(el.fill),
                                    '_fitmethod': 'auto',
                                    '_height': elDimensions[1],
                                    '_highresfilename': 'demo-800.jpg', //el.src
                                    '_id': 'image_' + i,
                                    '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
                                    '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
                                    '_lowresfilename': 'demo-800.jpg',  //el.src
                                    '_mandatory': 'False',
                                    '_orientate': 'north',
                                    '_title': 'image ' + i,
                                    '_upperrightx': app.c.calcUpperRightX(elDimensions),
                                    '_upperrighty': app.c.calcUpperRightY(elDimensions),
                                    '_verticalalign': el.valign,
                                    '_width': elDimensions[0]
                                  };
          cordData.push(baseObj);
        }
      });