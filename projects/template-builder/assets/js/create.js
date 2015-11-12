(function(){
  'use strict';

  // $ dom elements
  // _ are canvas elements

  var app = app || {};

  app._canvas;
  app._grid;
  app.gridSquare    = 24;
  app.ptSize        = 0.75;
  app.mmSize        = 0.2645833333333;
  app.orientation;
  app.templateType  = 'default';

  app.c = {
    initCreate: function(){
      app.c.bindClickEvents();
    },

    // if( $('.container').data('template') === 'build-template' ){
    //   console.log('Build template loaded');
    //   app._canvas = new fabric.Canvas('c', { selection: false, backgroundColor: '#FFF' });
    //   app.bindClickEvents();
    //   app.drawDemoItems();
    // }else if( $('.container').data('template') === 'edit-template' ){
    //   app._canvas = new fabric.Canvas('c');
    //   console.log('Edit template loaded');
    //   var templateJSON = localStorage.getItem('canvasDataJSON')
    //   if( templateJSON !== null){
    //     console.log('Loaded from JSON');
    //     app._canvas.loadFromJSON(templateJSON);
    //   }else{
    //     alert('Something went wrong..');
    //   } 
    // }


    // Util functions
    createFileName: function(extension){
      var filename = $('.canvas-name-field').val() || 'template-download';
      return filename + extension
    },
    convertUnit: function(unit, targetUnit){
      return parseInt( parseFloat(unit * targetUnit).toFixed(2) );
    },
    setDocumentSize: function(){
      if(app.templateType === 'default'){
        if(app.orientation === 'p'){
          return [210,297]  // A4 Portrait
        }else{  
          return [297,210]  // A4 Landscape
        }
      }else{
        return [88,55]      // Business Card 
      }
    },
    rgbToCMYK: function(rgb){
      var computedC = 0,
          computedM = 0,
          computedY = 0,
          computedK = 0,
          rgb       = rgb.replace(/rgb|\(|\)/gi, '').split(','),
          r = parseInt(rgb[0]),
          g = parseInt(rgb[1]),
          b = parseInt(rgb[2]);

      // BLACK
      if (r==0 && g==0 && b==0) {
        computedK = 1;
        return [0,0,0,1];
      }

      computedC = 1 - (r/255);
      computedM = 1 - (g/255);
      computedY = 1 - (b/255);

      var minCMY = Math.min(computedC, Math.min(computedM,computedY));

      computedC = (computedC - minCMY) / (1 - minCMY) ;
      computedM = (computedM - minCMY) / (1 - minCMY) ;
      computedY = (computedY - minCMY) / (1 - minCMY) ;
      computedK = minCMY;

      // return [computedC,computedM,computedY,computedK];
      return computedC + ',' + computedM + ',' + computedY + ',' + computedK;
    },

    // Canvas Controls and Events
    createCanvas: function(){
      // The canvas needs to be created this way: For more details:
      // (http://stackoverflow.com/questions/5034529/size-of-html5-canvas-via-css-versus-element-attributes)
      var canvasEl = document.createElement('canvas'),
          size;
      canvasEl.setAttribute('id', 'c');

      // Check if the document size desired template should be a regular paper size or business card.
      // All regular paper sizes use the same bases size (A4), but business cards are different.
      if( $('input[name=doc-size]:checked').val() !== 'business'){
        // Check if the template should be portrait or landscape
        // The canvas needs to be set to a specific size based on the 2 checks above.
        if( $('input[name=doc-orientation]:checked').val() === 'p' ){
          app.orientation   = 'p'; // Potrait
          canvasEl.width    = 396;
          canvasEl.height   = 561;
        }else{
          app.orientation   = 'l'; // Landscape
          canvasEl.width    = 561;
          canvasEl.height   = 396;
        }
      }else{
        // Only update the templateType when it is not a the default size of A4 being used
        app.templateType  = 'business';
        canvasEl.width();   // 88mm
        canvasEl.height();  // 55mm
      }

      document.getElementById('canvas-container').appendChild(canvasEl);
      app._canvas = new fabric.Canvas('c', { selection: false, backgroundColor: '#FFF' });
      app.c.bindCanavsEvents();
      app.c.drawGrid(396); // Pass in the width dynamically so the whole grid is covered
      // /app.c.drawDemoItems();
    },
    drawGrid: function(gSize){
      var gridLines = [];
      for (var i = 0; i < 50; i++) {
        gridLines.push(new fabric.Line([ i * app.gridSquare, 0, i * app.gridSquare, gSize], { stroke: '#ccc'}));
        gridLines.push(new fabric.Line([ 0, i * app.gridSquare, gSize, i * app.gridSquare], { stroke: '#ccc'}));
      }
      //console.log(gridLines);
      app._grid = new fabric.Group(gridLines, {
                  left: 0,
                  top: 0,
                  selectable: false
                });
      app._canvas.add(app._grid);
    },
    constrainGridMovement: function(e){
      // Snap to grid
      // e.target.set({
      //   left: Math.round(e.target.left / app.gridSquare) * app.gridSquare,
      //   top: Math.round(e.target.top / app.gridSquare) * app.gridSquare
      // });

      // Only allow movement inside the canvas
      var obj = e.target;
      // if object is too big ignore
      if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
          return;
      }        
      obj.setCoords();        
      // top-left  corner
      if(obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0){
          obj.top = Math.max(obj.top, obj.top-obj.getBoundingRect().top);
          obj.left = Math.max(obj.left, obj.left-obj.getBoundingRect().left);
      }
      // bot-right corner
      if(obj.getBoundingRect().top+obj.getBoundingRect().height  > obj.canvas.height || obj.getBoundingRect().left+obj.getBoundingRect().width  > obj.canvas.width){
          obj.top = Math.min(obj.top, obj.canvas.height-obj.getBoundingRect().height+obj.top-obj.getBoundingRect().top);
          obj.left = Math.min(obj.left, obj.canvas.width-obj.getBoundingRect().width+obj.left-obj.getBoundingRect().left);
      }
    },
    cleanCanvas: function(){
      app._grid['visible'] = false;
      app._canvas.deactivateAll().renderAll();
    },
    deactiveCanvasControls: function(e){
      if(!$(e.target).hasClass('upper-canvas')){
        app._canvas.deactivateAll().renderAll();
      }
    },
    toggleCanvasGrid: function(toggle){
      var $this = $(this);
      if( $this.hasClass('grid-disabled') ){
        $this.removeClass('grid-disabled');
        app._grid['visible'] = true;
      }else{
        $this.addClass('grid-disabled');
        app._grid['visible'] = false;
      }

      // Show the grid, after saving the image and generating PDF
      if(toggle === true){
        app._grid['visible'] = true;
      }
      app._canvas.renderAll();
    },
    setAspectRatio: function(aspectRatio){
      switch(aspectRatio) {
        case '1:1':
            // return [200, 200, true]
            return [100, 100, true]
            break;
        case '1:2':
            return [50, 100, true]
            break;
        case '2:1':
            return [100, 50, true]
            break;
        case '3:1':
            return [100, 33.3, true]
            break;
        case '1:3':
            return [33.3, 100, true]
            break;
        case '3:2':
            return [100, 66.6, true]
            break;
        case '2:3':
            return [66.6, 100, true]
            break;
        case '3:4':
            return [75, 100, true]
            break;
        case '4:3':
            return [100, 75, true]
            break;
        case '16:9':
            return [100, 56, true]
            break;
        case '0':
            return [100, 100, false]
            break;
      }
    },

    // UI Specific Functions
    setSelectedOption: function(){
      var $this = $(this);
      $this.siblings().removeClass('option-selected').end()
           .addClass('option-selected');
    },
    handleSteppedForm: function(){
      var $this             = $(this),
          $activeContainer  = $('.active-option'),
          activeStep        = $activeContainer.data('step'),
          btnAction         = $this.data('step-action');

      $activeContainer.fadeOut(100, function(){
        $activeContainer.removeClass('active-option');
        if( btnAction === 'forward' ){
          activeStep++;
        }else{
          activeStep--;
        }
        var $newActiveEl = $('[data-step=' + activeStep + ']');
        $newActiveEl.fadeIn(100, function(){
          $newActiveEl.addClass('active-option')
        });
      });
    },
    closeElementControls: function(){
      $('.add-element-control').fadeOut(100, function(){
        app.$addElControls.removeClass('toggle-active');
        $('#add-controls-container').fadeIn(100);
      }); 
    },
    
    // Functions needed to prepare template for export
    generateJSON: function(){
      var canvasData = app._canvas.toDatalessJSON(['stringSrc', 'halign', 'valign']);
      if ( localStorage.getItem('canvasDataJSON') === null ){
        localStorage.removeItem('canvasDataJSON');
      }
      localStorage.setItem('canvasDataJSON', JSON.stringify(canvasData));
      // Remove the grid element group from data
      // console.log(JSON.stringify(canvasData));
      canvasData.objects.shift();
      // canvasData.objects.push()
      return canvasData.objects
    },
    generateCords: function(canvasData){
      // All based of fixed values of of canvas_size:print_size(A4) a scale will need to be passed to the DOC property if larger/smaller
      // The canvas doesnt allow percentage decimal values. The coordinates need to be 2.0174 times bigger than the canvas

      var docSettings     = app.c.setDocumentSize(),
          canvasScale     = 2.0174, // Create function to make this dyanmic based on canvas/document size ratio
          cordData        = [],
          baseObj         = {},
          destDocWidth    = docSettings[0],
          destDocHeight   = docSettings[1],
          pdfbaseJSON     =   {
                                doc : {     
                                  _scalex: 1, // Based from an a4 
                                  _scaley: 1, // Based from an a4
                                  _assetspath: 'C:\\Projects\\bemac_discovery\\BeMacDiscovery\\Assets\\268',
                                  // Path to asset root, may need to come from hidden field    
                                  page : {
                                    _width: docSettings[0],
                                    _height: docSettings[1],
                                    pdf: {
                                      _lowresfilename: 'Marathon_4_aw.pdf',
                                      _highresfilename: 'Marathon_4_aw.pdf',
                                      _align: 'left',
                                      _verticalalign: 'top',
                                      _id: 'bglayer',
                                      _mandatory: 'False',
                                      _editable: 'False',
                                      _title: 'background',
                                      _lowerleftx: '0',
                                      _lowerlefty: '0',
                                      _upperrightx: destDocWidth,
                                      _upperrighty: destDocHeight,
                                      _width: docSettings[0],
                                      _height: docSettings[1],
                                      _fitmethod: 'auto',
                                      _orientate: 'north'
                                    }
                                  }
                                }
                              };

      // Create collection of objects for the XML file
      canvasData.forEach(function(el, i) {
        console.log(el);
        var scalex, 
            scaley;
        // Check if the element has been scaled. If it has then get the scaled value
        el.scaleX === 1 ? scalex = 1 : scalex = el.scaleX;
        el.scaleY === 1 ? scaley = 1 : scaley = el.scaleY;

        console.log( scalex, scaley);

        var elDimensions = [
                            app.c.convertUnit( (el.width * scalex) * canvasScale, app.mmSize),
                            app.c.convertUnit( (el.height * scaley) * canvasScale, app.mmSize),
                            app.c.convertUnit(el.top * canvasScale, app.mmSize),
                            app.c.convertUnit(el.left * canvasScale, app.mmSize),
                            destDocWidth,
                            destDocHeight
                          ];
        console.log(elDimensions);

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
        }else if(el.type === 'i-text' && typeof(el.stringSrc) !== 'undefined'){
          var textBlockName  = 'text-block' + i
          // Create <text-block-group>
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
        }else{
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
      // Add all of the dynamic elements to template   
      cordData.forEach(function(el){
        $.extend( pdfbaseJSON.doc.page, el );
      });
      console.log(pdfbaseJSON);
      app.c.generateXML(pdfbaseJSON);
    },
    generateXML: function(cordData){
      var x2js      = new X2JS(),
          xmlOutput = x2js.json2xml_str(cordData);
      // Need to update the object names so they dont contain the _[number] prefix so the XML is correct
      xmlOutput = xmlOutput.replace(/text-block-group_[0-9]/g, 'text-block-group');
      xmlOutput = xmlOutput.replace(/text-block_[0-9]/g, 'text-block');
      xmlOutput = xmlOutput.replace(/image_[0-9]/g, 'image');
      console.log(xmlOutput);
    },
    setDefaultVal: function(val, expression, defaultVal){
      if(val === expression){
        return defaultVal
      }else{
        return val
      }
    },

    // elWidth[0], elHeight[1], top[2], left[3], docWidth[4], docHeight[5]
    calcLowerLeftX: function(elDimensions){
      // left
      //console.log(elDimensions[3]);
      return elDimensions[3]
    },
    calcLowerLeftY: function(elDimensions){
      // docHeight - (top + height)
      // console.log( elDimensions[5], elDimensions[2], elDimensions[1] );
      // console.log( elDimensions[5] - (elDimensions[2] + elDimensions[1]) );
      return elDimensions[5] -(elDimensions[2] + elDimensions[1])
    },
    calcUpperRightX: function(elDimensions){
      // documentWidth - (left + width)
      // console.log( elDimensions[3] + elDimensions[0] );
      return elDimensions[3] + elDimensions[0]
    },
    calcUpperRightY: function(elDimensions){
      // docHeight - top 
      // console.log(elDimensions[5] - elDimensions[2]);
      return elDimensions[5] - elDimensions[2]
    },  

    // Click elements
    bindClickEvents: function(){
      app.$saveThumb        = $('#save-thumb');
      app.$downloadThumb    = $('#dl-thumb');
      app.$downloadPDF      = $('#dl-pdf');
      app.$toggleGrid       = $('#toggle-grid');
      app.$closeBtns        = $('.close-control');
      app.$addTextArea      = $('#add-text-area');
      app.$addTempArea      = $('#add-template-area');
      app.$textComponentOpt = $('.text-editor-option button');
      app.$stepBtns         = $('.step-option-btn');
      app.$createCanvas     = $('#at-create-canvas');

      // Bind event listeners to dom elements
      app.$saveThumb.on('click', app.c.convertCanvasToImgElement);
      app.$downloadThumb.on('click', app.c.covertCanvasToImgDownload);
      app.$downloadPDF.on('click', app.c.covertCanvasToPDFDownload);
      app.$toggleGrid.on('click', app.c.toggleCanvasGrid);
      app.$closeBtns.on('click', app.c.closeElementControls);
      app.$addTextArea.on('click', app.c.createTextArea);
      app.$addTempArea.on('click', app.c.createTempBlock)
      app.$textComponentOpt.on('click', app.c.setSelectedOption);
      app.$stepBtns.on('click', app.c.handleSteppedForm);
      app.$createCanvas.on('click', app.c.createCanvas);
    },

    // Creation tool end points
    convertCanvasToImgElement: function() {
      // Remove selected states and grid before saving img
      app.c.cleanCanvas();
      var imgElement = ReImg.fromCanvas(document.querySelector('#c')).toImg(),
      $output = $('#i');
      $output.html('').append(imgElement);
      app.c.toggleCanvasGrid(true);
      app.c.generateCords( app.c.generateJSON() );
    },
    covertCanvasToImgDownload: function(){
      // Remove selected states and grid before saving img
      app.c.cleanCanvas();
      var dt = app._canvas.toDataURL('image/png');
      console.log(dt);
      this.href = dt;
      app.c.toggleCanvasGrid(true);
    },
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
    createTempBlock: function(){
      // Pass through the selected aspect ratio of the element
      // Add the RGB Value to the settings
      var blockSettings = app.c.setAspectRatio( $('input[name=block-ratio]:checked').val() );
          blockSettings.push('rgb(' + $('#adt-fill .option-selected').attr('data-rgb') + ')');
          blockSettings.push($('input[name=h-pos]:checked').val());
          blockSettings.push($('input[name=v-pos]:checked').val());

      // Create the fabric js element on the canvas
      // Use the settings from 'blockSettings' variable
      var _block = new fabric.Rect({
                                    fill: blockSettings[3],
                                    hasBorders: true,
                                    hasRotatingPoint: false,
                                    height: blockSettings[1],
                                    left: 0,
                                    lockRotation: true,
                                    lockUniScaling: blockSettings[2],
                                    top: 0,
                                    width: blockSettings[0]
                                  });
      _block['halign'] = blockSettings[4];
      _block['valign'] = blockSettings[5];
      app._canvas.add(_block);
    },
    drawDemoItems: function(){
      // Draw the grid
      app.c.drawGrid(600);
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
    bindCanavsEvents: function(){
      // This event handler stops elements being moved outside of the canvas element when moving an element on the canvas
      app._canvas.on('object:moving', function(e) {
        app.c.constrainGridMovement(e);
      });
      // This event handler stops elements being moved outside of the canvas element when and element is being modified (resized)
      app._canvas.on('object:modified', function(e) {
        app.c.constrainGridMovement(e);
      });
      // This event handler deletes the selected object from the canvas when DEL or BACKSPACE is pressed
      app._canvas.on('object:selected', function(e) {
        var _activeElement = app._canvas.getActiveObject();
        // console.log(app._canvas.getObjects());
        // console.log(_activeElement);
        // console.log(_activeElement.item);
        $('html').keydown(function(e){
            if(e.keyCode == 46 || e.keyCode === 8) {
              e.preventDefault();
              _activeElement.remove();
              // app._canvas.fxRemove(_activeElement, onComplete({
              //     app._canvas.renderAll();
              // });
            }
        });
        // e.remove();
      });

      // $('body').on('click', app.c.deactiveCanvasControls);
    }
  };

  app.c.initCreate();
})();