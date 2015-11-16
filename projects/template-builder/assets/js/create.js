(function(){
  'use strict';

  // $ = dom elements
  // _ = fabric elements

  var app = app || {};

  app._canvas;
  app._grid;
  app.gridSquare    = 24;
  app.ptSize        = 0.75;
  app.mmSize        = 0.2645833333333;
  app.orientation;
  app.templateType  = 'default';
  app.imagedata;
  app.docDimesions  = [];
  app.templateName;

  if(document.location.hostname ===  "widget.macmillan.org.uk"){
    app.dummyText = $.get('assets/data/dummy-text.txt', function(data){return data}, 'text');
  }else{
    app.dummyText = $.get('../assets/data/dummy-text.txt', function(data){return data}, 'text');
  }  

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
    toggleElements: function(){
      var $this         = $(this),
          toggleTarget  = $this.data('targetel'),
          toggleGroup   = $this.data('toggle-group');

      $('.' + toggleGroup).addClass('hidden');
      $('#' + toggleTarget).removeClass('hidden');
    },
    // Canvas Controls and Events
    resetTemplate: function(){
      app._canvas.clear();
      app.docDimesions = [];
      $('.empty-on-reset').empty();
      $('.clear-on-reset').val('');
      $('.stepped-option-2').addClass('hidden');
      $('.active-option').fadeOut(100, function(){
        $('.stepped-option').removeClass('active-option');
        $('.stepped-option[data-step=0]').addClass('active-option').fadeIn(100);
      });
    },
    createNewTemp: function(){
      // The canvas needs to be created this way: For more details:
      // (http://stackoverflow.com/questions/5034529/size-of-html5-canvas-via-css-versus-element-attributes)
      var canvasEl = document.createElement('canvas'),
          size;
      
      app.c.setTemplateDetails();
      
      canvasEl.setAttribute('id', 'c');

      // Check if the document size desired template should be a regular paper size or business card.
      // All regular paper sizes use the same bases size (A4), but business cards are different.
      if( $('input[name=doc-size]:checked').val() !== 'Business Card'){
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
        app.orientation   = 'l'; // Landscape
        app.templateType  = 'business';
        canvasEl.width    = 332;  // 88mm / 332.5984251968px
        canvasEl.height   = 207;  // 55mm / 207.874015748px
      }

      document.getElementById('canvas-container').appendChild(canvasEl);
      app._canvas = new fabric.Canvas('c', { selection: false, backgroundColor: '#FFF' });
      app.c.bindCanavsEvents();
      app.c.drawGrid(396); // Pass in the width dynamically so the whole grid is covered
      // /app.c.drawDemoItems();
    },
    loadExistingTemp: function(){

    },
    setTemplateDetails: function(){
      var $orientationDetail = $('#template-orientation');
      // Set the template name
      $('#template-name').text(app.templateName);

      // Store the set document varaitions sizes to an array
      $('input[name=doc-size]').each(function() {
        var $this = $(this);
        if($this.prop('checked') === true){
          app.docDimesions.push($this.val());
        }
      });

      // template-size-options
      $('#template-size-options').text( app.docDimesions.join(','));

      // 
      if(app.orientation === 'p'){
        $orientationDetail.text('Portrait');
      }else{
        $orientationDetail.text('Landscape');
      }
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
    createTempBlock: function(){
      // Pass through the selected aspect ratio of the element
      // Add the RGB Value to the settings
      var $componentTitle = $('#at-block-title'),
          blockType       = $('input[name=template-block-type]:checked').val() === 'new-template-text-block' ? 't' : 'i',
          blockSettings   = app.c.setAspectRatio($('input[name=block-ratio]:checked').val());
          blockSettings.push($('input[name=h-pos]:checked').val());
          blockSettings.push($('input[name=v-pos]:checked').val());
          console.log(blockType);

      if( blockType === 't'){
        blockSettings.push('rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')');
      }else{
        blockSettings.push('rgb(0,0,0)');
      }
      console.log(blockSettings);

      // Create the fabric js element on the canvas
      // Use the settings from 'blockSettings' variable
      var _block = new fabric.Rect({
                                    fill: blockSettings[5],
                                    hasBorders: false,
                                    hasRotatingPoint: false,
                                    height: blockSettings[1],
                                    left: 0,
                                    lockRotation: true,
                                    lockUniScaling: blockType === 't' ? false : blockSettings[2],
                                    top: 0,
                                    width: blockSettings[0]
                                  });
      if(blockType === 't'){
        _block['blocktype']   = 'new-text-block';
        _block['fontFamily']  = $('#at-font-face .option-selected').data('fface');
        _block['fontSize']    = $('#at-font-size .option-selected').data('size');
        _block['maxLength']   = $('#at-maxlength').val();
      }else{
        _block['blocktype'] = 'new-image-block';
      }

      _block['blockTitle']  = $componentTitle.val() || 'Block';
      _block['isManditory'] = $('#at-manditory').is(':checked') ? true : false;
      _block['isEditable']  = $('#at-editable').is(':checked') ? true : false;
      _block['halign']      = blockSettings[3];
      _block['valign']      = blockSettings[4];
      app._canvas.add(_block);
      // Empty the input field with the previous component name.
      $componentTitle.val('');
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
    },

    // UI Specific Functions
    setSelectedOption: function(){
      var $this = $(this);
      $this.siblings().removeClass('option-selected').end()
           .addClass('option-selected');
    },
    steppedOptionHandler: function(){
      var $this               = $(this),
          $activeContainer    = $('.active-option'),
          activeStep          = $activeContainer.data('step'),
          btnPrimaryAction    = $this.data('step-action'),
          btnSecondaryAction  = $this.data('step-secondaction');

      $activeContainer.fadeOut(100, function(){
        $activeContainer.removeClass('active-option');
        btnPrimaryAction === 'forward'? activeStep++ : activeStep--;
        var $newActiveEl = $('[data-step=' + activeStep + ']');
        $newActiveEl.find($('[data-step-target=' + btnSecondaryAction +']')).removeClass('hidden');
        $newActiveEl.fadeIn(100, function(){
          $newActiveEl.addClass('active-option');
        });
      });
    },

    // Validation
    validateTemplateName: function(){
      var $this = $(this);
      if($this.val().length > 2){
        app.$newTempBtn.removeAttr('disabled');
        app.templateName = $.trim($this.val());
      }else{
        app.$newTempBtn.attr('disabled', 'disabled');
      }
    },
    validateDocSize: function(){
      var $this               = $(this),
          $businessCardOpt    = $('.doc-size-business'),
          $docOrientationOpts = $('input[name=doc-orientation]');
 
      if($this.val() === 'Business Card'){
        app.$documentSizeBtns.not('.doc-size-business').prop('checked', false);
        $businessCardOpt.prop('checked', true);
        $docOrientationOpts.eq(1).prop('checked', true);
        $docOrientationOpts.first().removeAttr('checked').attr('disabled', 'disabled').addClass('default-disabled');
      }else{
        // $docOrientationOpts.eq(1).prop('checked', false);
        if($docOrientationOpts.hasClass('default-disabled')){
          $docOrientationOpts.eq(0).removeAttr('disabled').prop('checked', true).removeClass('default-disabled');
        }

        if( $businessCardOpt.prop('checked') ){
          $businessCardOpt.prop('checked', false);
        }
      }
    },
    
    // Functions needed to prepare template for export
    generateJSON: function(){
      // Pass through additional attributes toe generated JSON
      var canvasData = app._canvas.toDatalessJSON([
        'blockTitle',
        'blocktype',
        'fontFamily',
        'fontSize',
        'halign',
        'isEditable',
        'isManditory',
        'maxLength',
        'stringSrc',
        'valign'    
      ]);
      if ( localStorage.getItem('canvasDataJSON') === null ){
        localStorage.removeItem('canvasDataJSON');
      }
      localStorage.setItem('canvasDataJSON', JSON.stringify(canvasData));
      // Remove the grid element group from data
      canvasData.objects.shift();
      
      // console.log(JSON.stringify(canvasData));
      // canvasData.objects.push()
      return canvasData.objects
    },
    generateCords: function(canvasData){
      // All based of fixed values of of canvas_size:print_size(A4) a scale will need to be passed to the DOC property if larger/smaller
      // The canvas doesn't allow percentage decimal values so the canvas is slighlty less than 2 times smaller than it should be mm > px.
      // The 'canvasScale' need to be 2.0174 times bigger than the canvas for default sized documents (all A sizes)
      // For business cards the canvas is set at a 1:1 scale and therefore 'canvasScale' needs to be to 1

      var docSettings     = app.c.setDocumentSize(),
          canvasScale     = app.templateType === 'default' ? 2.0174 : 1,
          cordData        = [],
          baseObj         = {},
          destDocWidth    = docSettings[0],
          destDocHeight   = docSettings[1],
          pdfbaseJSON     =   {
                                doc : {     
                                  _scalex: 1,
                                  _scaley: 1,
                                  _assetspath: 'C:\\Projects\\bemac_discovery\\BeMacDiscovery\\Assets\\268',
                                  // Path to asset root, may need to come from hidden field    
                                  page : {
                                    _width: docSettings[0],
                                    _height: docSettings[1],
                                    pdf: {
                                      _lowresfilename: '',
                                      _highresfilename: '',
                                      _align: 'left',
                                      _verticalalign: 'top',
                                      _id: 'bglayer',
                                      _mandatory: 'True',
                                      _editable: 'False',
                                      _title: 'background',
                                      _lowerleftx: '0',
                                      _lowerlefty: '0',
                                      _upperrightx: destDocWidth,
                                      _upperrighty: destDocHeight,
                                      _width: destDocWidth,
                                      _height: destDocHeight,
                                      _fitmethod: 'auto',
                                      _orientate: 'north'
                                    }
                                  }
                                }
                              };

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
        if(el.blocktype === 'new-text-block' && typeof(el.stringSrc) === 'undefined'){  
          var textBlockGroupName  = 'text-block-group_' + i
          // Create <text-block-group>
          baseObj[textBlockGroupName] = {
            '_align': el.halign,
            '_editable': el.isEditable,
            '_fitmethod': 'auto',
            '_height': elDimensions[1],
            '_id': 'Group'+ i,
            '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
            '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
            '_mandatory': el.isManditory,
            '_orientate': 'north',
            '_spacing': '0',
            '_title': el.blockTitle,
            '_upperrightx': app.c.calcUpperRightX(elDimensions),
            '_upperrighty': app.c.calcUpperRightY(elDimensions),
            '_verticalalign': el.valign,  
            '_width': elDimensions[0],
            // Create <text-block>
            'text-block': {
                            '_align': el.halign,
                            '_colour': app.c.rgbToCMYK(el.fill),
                            '_editable': el.isEditable,
                            '_fitmethod': 'auto',
                            '_font-family':el.fontFamily,
                            '_font-size': el.fontSize, // app.c.convertUnit(el.fontSize, app.ptSize),
                            '_id': el.blockTitle,
                            '_leading': '125%', // Need to add to initial form,
                            '_mandatory': el.isManditory,
                            '_maxlen': el.maxLength,
                            '_orientate': 'north',
                            '_source': '',
                            '_textmode': 'multiline',
                            '_title': el.blockTitle,
                            '_verticalalign': el.valign,                        
                            '__text': app.dummyText.responseText.substr(0, el.maxLength) //el.text
                          }
          }
          cordData.push(baseObj);
        }
        // If it is a text element that uses an external source, it DOES NOT require a wrapping 'text-block-group'
        else if(el.type === 'new-text-block' && typeof(el.stringSrc) !== 'undefined'){
          var textBlockName  = 'text-block' + i
          // Create <text-block>
          baseObj[textBlockName] = {
                                    '_align': el.halign,
                                    '_colour': '94,0,100,0', // rgbToCMYK(el.fill),
                                    '_editable': el.isEditable,
                                    '_fitmethod': 'auto',
                                    '_font-family': el.fontFamily,
                                    '_font-size': app.c.convertUnit(el.fontSize, app.ptSize),
                                    '_height': elDimensions[1],
                                    '_id': el.blockTitle,
                                    '_leading': '125%', // Need to add to initial form,
                                    '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
                                    '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
                                    '_mandatory': el.isManditory,
                                    '_maxlen': el.maxLength,
                                    '_orientate': 'north',
                                    '_source': el.stringSrc,
                                    '_textmode': 'multiline',
                                    '_title': el.blockTitle,
                                    '_upperrightx': app.c.calcUpperRightX(elDimensions),
                                    '_upperrighty': app.c.calcUpperRightY(elDimensions),
                                    '_width': elDimensions[0],
                                    '_verticalalign': el.valign,                        
                                    '__text': app.dummyText.responseText.substr(0, el.maxLength) //el.text
                                  }
          cordData.push(baseObj);
        }
        // Otherwise it will be treated as an image block
        else{
          var imgBlockName = 'image_' + i;
          baseObj[imgBlockName] = {
                                    '_align': el.halign,
                                    '_editable': el.isEditable,
                                    // '_fillcolor': app.c.rgbToCMYK(el.fill),
                                    '_fitmethod': 'auto',
                                    '_height': elDimensions[1],
                                    '_highresfilename': 'demo-800.jpg', //el.src
                                    '_id': el.blockTitle,
                                    '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
                                    '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
                                    '_lowresfilename': 'demo-800.jpg',  //el.src
                                    '_mandatory': el.isManditory,
                                    '_orientate': 'north',
                                    '_title': el.blockTitle,
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
      // console.log(pdfbaseJSON);
      app.c.generateXML(pdfbaseJSON);
    },
    generateXML: function(cordData){
      var x2js      = new X2JS(),
          xmlOutput = x2js.json2xml_str(cordData);
      // Need to update the object names so they dont contain the _[number] prefix so the XML is correct
      xmlOutput = xmlOutput.replace(/text-block-group_[0-9]/g, 'text-block-group');
      xmlOutput = xmlOutput.replace(/text-block_[0-9]/g, 'text-block');
      xmlOutput = xmlOutput.replace(/image_[0-9]/g, 'image');

      // console.log( {tn : "test",tx : 'xml', ti : app.imagedata, o : app.orientation, dim : app.docDimesions});

      if(document.location.hostname ===  "widget.macmillan.org.uk"){
        console.log(xmlOutput);
      }else{
        app.c.createTemplate(xmlOutput);
      }      
    },
    setDefaultVal: function(val, expression, defaultVal){
      if(val === expression){
        return defaultVal
      }else{
        return val
      }
    },
    // Function that sends data to the backend to create a new template
    createTemplate: function(xml) {
      // Function receives the generated XML from what has been created on the canvas
      console.log(xml)
      $.ajax({
            url: '/be/api/PDFMake.ashx',
            type: 'post',
            dataType: 'json',
            data: {tn : app.templateName,tx : xml, ti : app.imagedata, o : app.orientation, dim : app.docDimesions},
            success: function (data) {
                alert('call...sent');
            }
        });
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
      app.$reserCreateTemp  = $('#reset-create-template');
      app.$toggleGrid       = $('#toggle-grid');
      app.$addTempArea      = $('#add-template-area');
      app.$stepBtns         = $('.step-option-btn');
      app.$newTempBtn       = $('#at-new-template');
      app.$fromTempBtn      = $('#at-from-template');
      app.$documentSizeBtns = $('input[name=doc-size]');
      app.$textComponentOpt = $('.text-editor-option button');
      app.$templateName     = $('#new-template-name');
      app.$toggleElTriggers = $('.js-toggle-target-el');

      // Bind event listeners to dom elements
      app.$reserCreateTemp.on('click', app.c.resetTemplate)
      app.$saveThumb.on('click', app.c.convertCanvasToImgElement);
      app.$downloadThumb.on('click', app.c.covertCanvasToImgDownload);
      app.$toggleGrid.on('click', app.c.toggleCanvasGrid);
      app.$documentSizeBtns.on('click', app.c.validateDocSize);
      app.$newTempBtn.on('click', app.c.createNewTemp);
      app.$fromTempBtn.on('click', app.c.loadExistingTemp);
      app.$stepBtns.on('click', app.c.steppedOptionHandler);
      app.$addTempArea.on('click', app.c.createTempBlock);   
      app.$textComponentOpt.on('click', app.c.setSelectedOption);
      app.$templateName.on('keyup blur', app.c.validateTemplateName);
      app.$toggleElTriggers.on('click', app.c.toggleElements);
    },

    // Creation tool end points
    convertCanvasToImgElement: function() {
      // Remove selected states and grid before saving img
      app.c.cleanCanvas();
      var imgElement = ReImg.fromCanvas(document.querySelector('#c')).toImg(),
      $output = $('#i');
      $output.html('').append(imgElement);
      app.imagedata = app._canvas.toDataURL('image/png');
      app.c.toggleCanvasGrid(true);
      app.c.generateCords( app.c.generateJSON() );
    },
    covertCanvasToImgDownload: function(){
      // Remove selected states and grid before saving img
      app.c.cleanCanvas();
      app.imagedata = app._canvas.toDataURL('image/png');
      console.log(app.imagedata);
      this.href = app.imagedata;
      app.c.toggleCanvasGrid(true);
    }
  };

  app.c.initCreate();
})();