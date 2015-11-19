(function(){
  'use strict';

  // $ = dom elements
  // _ = fabric elements

  var app = app || {};

  app._canvas;
  app._grid;
  app.gridSquare      = 24;
  app.ptSize          = 0.75; // 1px > 1pt
  app.mmSize          = 0.2645833333333; // 1px > 1mm
  app.pxSize          = 3.779527559055; // 1mm > 1px
  app.orientation;
  app.templateType    = 'default';
  app.imagedata;
  app.docDimesions    = [];
  app.templateName;
  app.$tempBlockName  = $('#at-block-title');

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


    /**
      Util functions
    **/
    createFileName: function(extension){
      var filename = $('.canvas-name-field').val() || 'template-download';
      return filename + extension
    },
    convertUnit: function(unit, targetUnit){
      return parseInt( parseFloat(unit * targetUnit).toFixed(2) );    
      // return unit * targetUnit;    
    },
    coverUnitFromMM: function(unit, targetUnit){
      var changeVal = Math.ceil(unit * targetUnit);
      if(changeVal < 0){
        return 0
      }else{
        return changeVal
      }  
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
    cmykToRGB: function(color){
      console.log(color);
      var colorArr = color.split(','),
          c        = colorArr[0] / 100,
          m        = colorArr[1] / 100,
          y        = colorArr[2] / 100,
          k        = colorArr[3] / 100,
          r,
          g,
          b;

      r = Math.round(1 - Math.min(1, c * (1 - k) + k)) * 255;
      g = Math.round(1 - Math.min(1, m * (1 - k) + k)) * 255;
      b = Math.round(1 - Math.min(1, y * (1 - k) + k)) * 255;
      console.log('rgb(' + r + ',' + g + ',' + b + ')');
      return 'rgb(' + r + ',' + g + ',' + b + ')'
    },
    toggleElements: function(){
      var $this         = $(this),
          toggleTarget  = $this.data('targetel'),
          toggleGroup   = $this.data('toggle-group');

      $('.' + toggleGroup).addClass('hidden');
      $('#' + toggleTarget).removeClass('hidden');
    },


    /**
      Canvas Controls and Events
    **/
    resetTemplate: function(){
      // Check if the canvas exists before trying to clear it.
      if(app._canvas){
        app._canvas.clear();
      }      
      app.docDimesions = [];
      // Reset the create template tool back to its default
      app.c.resetCreateTempBlock();
      $('.empty-on-reset').empty();
      $('.clear-on-reset').val('');
      $('.stepped-option-2').addClass('hidden');
      $('input[name=doc-size], input[name=doc-orientation]').not('default-setting').prop('checked', false);
      $('.default-setting').prop('checked',  true);
      $('.active-option').fadeOut(100, function(){
        $('.stepped-option').removeClass('active-option');
        $('.stepped-option[data-step=0]').addClass('active-option').fadeIn(100);
      });
    },
    resetCreateTempBlock: function(){
      // Hide the edit buttons
      app.c.toggleTempState(false);

      // Resets all checkboxes and radio buttons to the default setting.
      $('input[type="radio"].reset-to-default, input[type="checkbox"].reset-to-default').prop('checked', true);
      // Resets all text and number fields to the default setting.
      $('input[type="text"].reset-to-default, input[type="number"].reset-to-default').each(function(){
        var $this = $(this);
        if( $this.attr('value') > 0){
          var textVal = $this.attr('value');
          $this.val(textVal);
        }else{
         $this.val(''); 
       }    
      });
      // Resets all buttons back to the default settings
      $('button.reset-to-default').siblings().removeClass('option-selected').end()
                                  .addClass('option-selected');
      // Resets the tempale block options back to default
      $('.template-options').not('reset-to-default').addClass('hidden');
      $('div.reset-to-default').removeClass('hidden');
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
      app._canvas       = new fabric.Canvas('c', { selection: false, backgroundColor: '#FFF' });
      app.c.bindCanavsEvents();
      app.c.drawGrid(396); // Pass in the width dynamically so the whole grid is covered
    },
    createNewTempFromJSON: function(canvasData){
      // console.log(canvasData);
      // console.log(canvasData.doc);
      var canvasEl  = document.createElement('canvas'),
          docWidth  =  parseInt(canvasData.doc.page._width),
          docHeight =  parseInt(canvasData.doc.page._height);
      canvasEl.setAttribute('id', 'c');
      // Check if the document size is either A4 Landscape or A4 Portrait
      if(docWidth === 210 && docHeight === 297 || docHeight === 210 &&  docWidth === 297){
        if(docWidth < docHeight){
          app.orientation = 'p'; // Potrait
          canvasEl.width  = 396;
          canvasEl.height = 561;
        }else{
          app.orientation = 'l'; // Landscape
          canvasEl.width  = 561;
          canvasEl.height = 396;
        }
      } else{
        app.orientation   = 'l'; // Landscape
        app.templateType  = 'business';
        canvasEl.width    = 332;
        canvasEl.height   = 207;
      }
      document.getElementById('canvas-container').appendChild(canvasEl);
      app._canvas = new fabric.Canvas('c', { selection: false, backgroundColor: '#FFF' });
      app.c.drawGrid(396); // Pass in the width dynamically so the whole grid is covered
      // Add all of the elements to the page.
      app.c.createTempBlockFromXML(canvasData.doc.page);
      app.c.bindCanavsEvents(); 
    },
    loadExistingTemp: function(){
      var x2js = new X2JS(),
          tempJSON;
      $.ajax({
        url: $('input[name=template-url]:checked').val(),
        dataType: 'xml'
      })
      .done(function(data) {
        tempJSON = x2js.xml2json(data);
        app.c.createNewTempFromJSON(tempJSON);
      });
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
      app._canvas.renderAll();
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
      // If the edit state is active, hide the edit options
        if(!$('.disabled-in-edit-state').hasClass('hidden')){
          // Hide the edit options
          app.c.toggleTempState(false);          
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
    createTempBlockFromXML: function(templateJSON){
      // console.log(templateJSON);
      if(typeof(templateJSON['text-block-group']) !== 'undefined'){
          if(typeof(templateJSON['text-block-group'].length) === 'undefined'){
            // Only a single text block group
            app.c.createTempBlock(true, templateJSON['text-block-group']);
          }else{
            // Multiple text block groups
            templateJSON['text-block-group'].forEach(function(textBlockGroup){
              app.c.createTempBlock(true, textBlockGroup);
              // console.log(textBlockGroup['text-block']);
            });
          }
      }

      if(typeof(templateJSON['text-block']) !== 'undefined'){
        if(typeof(templateJSON['text-block'].length) === 'undefined'){
          // Only a single text block
          app.c.createTempBlock(true, templateJSON['text-block']);
        }else{
          // Multiple text blocks
          templateJSON['text-block'].forEach(function(textBlock){
            app.c.createTempBlock(true, textBlock);
            // console.log(textBlock);
          });
        }
      }

      if(typeof(templateJSON['image']) !== 'undefined'){
        if(typeof(templateJSON['image'].length) === 'undefined'){
          // Only a single image block
          app.c.createTempBlock(true, templateJSON['image']);
        }else{
          // Multiple image blocks
          templateJSON['image'].forEach(function(imgBlock){
            app.c.createTempBlock(true, imgBlock);
          });
        }
      }
    },
    createTempBlock: function(fromXML, data){
      // console.log(data);
      var blockType,
          blockSettings = {},
          blockSize;
      // Check if an element is being created using the creation tool or loading an existing template.
      if(fromXML === true){
        if( typeof(data._highresfilename) !== 'undefined'){
          blockType = 'i';
          blockSettings.blocktype     = 'new-image-block';
          blockSettings.blockTitle    = data._title;
          blockSettings.halign        = data._align;
          blockSettings.isEditable    = data._editable;
          blockSettings.isManditory   = data._mandatory;
          blockSettings.valign        = data._verticalalign;
        }else{
          blockType = 't';
          blockSettings.blocktype   = 'new-text-block';
          blockSettings.blockTitle    = data['text-block']._title;
          blockSettings.halign        = data['text-block']._align;
          blockSettings.isEditable    = data['text-block']._editable === 'true' ? true : false;
          blockSettings.isManditory   = data['text-block']._mandatory === 'true' ? true : false;
          blockSettings.valign        = data['text-block']._verticalalign;
          // Text Block Specific
          blockSettings.fontColor   = app.c.cmykToRGB(data['text-block']._colour);
          blockSettings.fontFamily  = data['text-block']['_font-family'];
          blockSettings.fontSize    = data['text-block']['_font-size'];
          blockSettings.maxLength   = data['text-block']._maxlen;
        }        
        // Generic block settings
        var canvasScale     = app.templateType === 'default' ? 2.0174 : 1,
            blockDimensions = {};
        // console.log(data._width);
        // console.log(Math.ceil(app.c.convertUnit(data._width, app.pxSize)));
        // console.log(Math.ceil( Math.ceil(app.c.convertUnit(data._width, app.pxSize)) / canvasScale));
        blockDimensions.width  = Math.ceil(Math.ceil(app.c.coverUnitFromMM(data._width, app.pxSize)) / canvasScale),      // Width
        blockDimensions.height = Math.ceil(Math.ceil(app.c.coverUnitFromMM(data._height, app.pxSize)) / canvasScale),     // Height
        blockDimensions.lowerX = Math.ceil(Math.ceil(app.c.coverUnitFromMM(data._lowerleftx, app.pxSize)) / canvasScale), // Left
        blockDimensions.lowerY = Math.ceil(Math.ceil(app.c.coverUnitFromMM(data._lowerlefty, app.pxSize)) / canvasScale)  // Top

        console.log(blockDimensions);
        console.log(app._canvas.height);
        console.log(app._canvas.height - (blockDimensions.lowerY + blockDimensions.height));
        console.log(app._canvas.height / canvasScale);
        console.log(blockDimensions.lowerY + blockDimensions.height);

        // (el.width * scalex) * canvasScale, app.mmSize
        blockSettings.height        = blockDimensions.height;
        blockSettings.left          = blockDimensions.lowerX;
        blockSettings.top           = app._canvas.height - (blockDimensions.lowerY + blockDimensions.height);
        blockSettings.width         = blockDimensions.width;
      }else{
        blockType = $('input[name=template-block-type]:checked').val() === 'new-template-text-block' ? 't' : 'i',
        blockSize = app.c.setAspectRatio($('input[name=block-ratio]:checked').val()); // This returns and array

        if(blockType === 'i'){
          blockSettings.blocktype   = 'new-image-block';
          blockSettings.fontColor   = 'rgb(0,0,0)';
        }else{
          blockSettings.blocktype   = 'new-text-block';
          blockSettings.fontColor   = 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')';
          blockSettings.fontFamily  = $('#at-font-face .option-selected').data('fface');
          blockSettings.fontSize    = $('#at-font-size .option-selected').data('size');
          blockSettings.maxLength   = $('#at-maxlength').val();
        }
        
        blockSettings.blockTitle  = app.$tempBlockName.val() || 'Block';
        blockSettings.halign      = $('input[name=h-pos]:checked').val();
        blockSettings.height      = blockSize[1];
        blockSettings.isEditable  = $('#at-editable').is(':checked') ? true : false;
        blockSettings.isManditory = $('#at-manditory').is(':checked') ? true : false;
        blockSettings.left        = 0;
        blockSettings.top         = 0;
        blockSettings.valign      = $('input[name=v-pos]:checked').val();
        blockSettings.width       = blockSize[0];
      }

      // Create the fabric js element on the canvas
      // Use the settings from 'blockSettings' object
      var _block = new fabric.Rect({
                                    hasBorders: false,
                                    hasRotatingPoint: false,
                                    height: blockSettings.height,
                                    left: blockSettings.left,
                                    lockRotation: true,
                                    // lockUniScaling: false,
                                    top: blockSettings.top,
                                    width: blockSettings.width
                                  });
      // Add additional non-block specific properties based on blocktype
      _block['blocktype']     = blockSettings.blocktype;
      _block['blockTitle']    = blockSettings.blockTitle;
      _block['halign']        = blockSettings.halign;
      _block['isEditable']    = blockSettings.isEditable; 
      _block['isManditory']   = blockSettings.isManditory;  
      _block['valign']        = blockSettings.valign;

      // Add additional properties based on blocktype 
      if(blockType === 't'){          
        _block['fontColor']   = blockSettings.fontColor;
        _block['fontFamily']  = blockSettings.fontFamily;
        _block['fontSize']    = parseInt(blockSettings.fontSize);
        _block['maxLength']   = parseInt(blockSettings.maxLength);
      }
      // console.log(_block);
      // console.log(blockType);
      // Add the new component to the canvas. This needs to be done, before we can update the background img of the object
      app._canvas.add(_block);
      // Set the relevant background image for block, based on blocktype
      app.c.setTempBlockBackgroundImg(_block, blockType);
      // Empty the input field with the previous component name.
      app.c.resetCreateTempBlock();
    },
    editTempBlock: function(){
      var _block = app._canvas.getActiveObject(),
          blockType = $('input[name=template-block-type]:checked').val() === 'new-template-text-block' ? 't' : 'i';
      // console.log(_block);
      if(blockType === 't'){
        _block.blocktype    = 'new-text-block';
        _block.fontColor    = 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')';
        _block.fontFamily   = $('#at-font-face .option-selected').data('fface');
        _block.fontSize     = $('#at-font-size .option-selected').data('size');
        _block.maxLength    = $('#at-maxlength').val();
      }else{
        $('#new-template-image-block').siblings().addClass('hidden').end()
                                      .removeClass('hidden');
        _block.blocktype    = 'new-image-block';
      }
      _block.blockTitle     = app.$tempBlockName.val();
      _block.halign         = $('input[name=h-pos]:checked').val();
      _block.isEditable     = $('#at-editable').is(':checked') ? true : false;
      _block.isManditory    = $('#at-manditory').is(':checked') ? true : false;
      // _block.lockUniScaling = blockType === 't' && !$('#no-ratio').is(':checked') ? false : true;    
      _block.valign         = $('input[name=v-pos]:checked').val();
      // Set the relevant background image for block, based on blocktype
      app.c.setTempBlockBackgroundImg(_block, blockType);
      // Reset the component creation tool.
      app.c.resetCreateTempBlock();
      // De-select the element previously selected on the canvas
      app._canvas.deactivateAll().renderAll();
    },
    setTempBlockSettings: function(_selectedEl){
      console.log(_selectedEl);
      // Set the block type name
      var blockTypeName = 'template' + _selectedEl.blocktype.replace('new', '');

      // Set the title
      app.$tempBlockName.val(_selectedEl.blockTitle);

      // Set H Align      
      $('input[value='+ _selectedEl.halign +']').prop('checked', true);

      // Set V Align
      $('input[value='+ _selectedEl.valign +']').prop('checked', true);

      // Set Editable
      console.log(_selectedEl.isEditable);
      if(_selectedEl.isEditable === true){
        $('#at-editable').prop('checked', true);
      }else{
        $('#at-editable').prop('checked', false);
      }

      // Set Manditory
      console.log(_selectedEl.isManditory);
      if(_selectedEl.isManditory === true){
        $('#at-manditory').prop('checked', true);
      }else{
        $('#at-manditory').prop('checked', false);
      }

      // Set MaxLengh
      $('#at-maxlength').val(_selectedEl.maxLength);

      // Set Block Type
      $('input[id='+ blockTypeName +']').prop('checked', true);

      // Set Block specific values
      if(blockTypeName == 'template-text-block'){
        var rgb       = _selectedEl.fontColor.replace('rgb(', '').replace(')', ''),
            rgbAttr   = 'data-rgb="' + rgb + '"',
            ffaceAtt  = 'data-fface="' + _selectedEl.fontFamily + '"';

        // Color
        $('button[' + rgbAttr +']').siblings().removeClass('option-selected').end()
                                              .addClass('option-selected');
        // Font size
        $('button[data-size='+ _selectedEl.fontSize +']').siblings().removeClass('option-selected').end()
                                                         .addClass('option-selected');
        // Font Family
        $('button['+ ffaceAtt +']').siblings().removeClass('option-selected').end()
                                              .addClass('option-selected');
        // Show the TEXT editing options                                 
        $('#new-template-text-block').removeClass('hidden');
        $('#new-template-image-block').addClass('hidden');
      }else{
        // Show the IMAGE editing options
        $('#new-template-image-block').removeClass('hidden');
        $('#new-template-text-block').addClass('hidden');
      }
    },
    setTempBlockBackgroundImg: function(_block, blocktype){
      console.log(_block);
      var imgSrc,
          repeatSetting;
      if(blocktype === 't'){
        if(document.location.hostname ===  "widget.macmillan.org.uk"){
          imgSrc = 'assets/img/text-placeholder.png';
        }else{
          imgSrc = '../assets/img/text-placeholder.png';
        }        
        repeatSetting = 'repeat';
      }else{
        if(document.location.hostname ===  "widget.macmillan.org.uk"){
          imgSrc = 'assets/img/img-placeholder.png';
        }else{
          imgSrc = '../assets/img/img-placeholder.png';
        }
        repeatSetting = 'no-repeat';
      }
      fabric.util.loadImage(imgSrc, function (img) {
          _block.setPatternFill({
              source: img,
              repeat: repeatSetting
          });
        app._canvas.renderAll();
      });
    },
    delTempBlock: function(){
      // Get the select fabric object and remove it.
      var _activeObject = app._canvas.getActiveObject();
      app._canvas.remove(_activeObject);

      // Reset the component creation tool.
      app.c.resetCreateTempBlock();
    },
    stopTempBlock: function(){
      // De-select the element previously selected on the canvas
      app._canvas.deactivateAll().renderAll();
      // Reset the component creation tool.
      app.c.resetCreateTempBlock();
    },
    toggleTempState: function(isEditing){
      if(isEditing === true){
        $('.disabled-in-edit-state').addClass('hidden');
        $('.enabled-in-edit-state').removeClass('hidden');
      }else{
        $('.disabled-in-edit-state').removeClass('hidden');
        $('.enabled-in-edit-state').addClass('hidden');
      }
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
      // This event handles whether to enter edit mode or not
      app._canvas.on('object:selected', function(e) {
        // console.log(e);
        // Show the edit options
        app.c.toggleTempState(true);
        // Set the block settings to what the currently selected blocks settings are
        app.c.setTempBlockSettings(app._canvas.getActiveObject());
      });
      app._canvas.on('mouse:down', function(e) {
        // console.log(app._canvas);
        // Checks if the canvas itself has been clicked. If it has been clicked, then get out of edit mode
        if( typeof(e.target) !== 'undefined' && typeof(e.target._objects) !== 'undefined'){
          // Reset Create template options
          app.c.resetCreateTempBlock();
          // Hide the edit options
          app.c.toggleTempState(false);
        }        
      });
      $('.template-container').on('click', app.c.deactiveCanvasControls);
    },


    /**
      UI Specific Functions
    **/
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


    /** 
      Validation
    **/
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
    

    /**
      Functions needed to prepare template for export
    **/
    generateJSON: function(){
      // Pass through additional attributes toe generated JSON
      var canvasData = app._canvas.toJSON([
        'blockTitle',
        'blocktype',
        'fontColor',
        'fontFamily',
        'fontSize',
        'halign',
        'isEditable',
        'isManditory',
        'maxLength',
        'stringSrc',
        'valign'    
      ]);
      // console.log(app.orientation);
      // console.log(app.templateType);
      // Remove the grid element group from data
      canvasData.objects.shift();
      // Add additional properties to the canvas size and orientation is stored.
      console.log(app.docDimesions);
      canvasData['canvasSize']        = app.templateType;
      canvasData['canvasOrientation'] = app.orientation;
      canvasData['templateName']      = app.templateName;
      canvasData['availableSize']     = app.docDimesions;
      // console.log(canvasData);     
      // console.log(JSON.stringify(canvasData));      
      return canvasData.objects
    },
    generateCords: function(canvasData){
      // All based of fixed values of of canvas_size:print_size(A4) a scale will need to be passed to the DOC property if larger/smaller
      // The canvas doesn't allow percentage decimal values so the canvas is slighlty less than 2 times smaller than it should be mm > px.
      // The 'canvasScale' need to be 2.0174 times bigger than the canvas for default sized documents (all A sizes)
      // For business cards the canvas is set at a 1:1 scale and therefore 'canvasScale' needs to be to 1

      var assetPath;
      if(document.location.hostname ===  "widget.macmillan.org.uk"){
        assetPath = 'C:\\Projects\\bemac_discovery\\BeMacDiscovery\\Assets\\268';
      }else{
        assetPath = '@';
      }

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
                                  _assetspath: assetPath,
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
        // console.log(el);
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
            '_fitmethod': 'nofit',
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
                            '_colour': app.c.rgbToCMYK(el.fontColor),
                            '_editable': el.isEditable,
                            '_fitmethod': 'nofit',
                            '_font-family':el.fontFamily,
                            '_font-size': el.fontSize, // app.c.convertUnit(el.fontSize, app.ptSize),
                            '_id': el.blockTitle + i,
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
                                    '_colour': app.c.rgbToCMYK(el.fontColor),
                                    '_editable': el.isEditable,
                                    '_fitmethod': 'auto',
                                    '_font-family': el.fontFamily,
                                    '_font-size': app.c.convertUnit(el.fontSize, app.ptSize),
                                    '_height': elDimensions[1],
                                    '_id': el.blockTitle + i,
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

    /** 
      Click elements
    **/
    bindClickEvents: function(){
      app.$saveThumb        = $('#save-thumb');
      app.$downloadThumb    = $('#dl-thumb');
      app.$reserCreateTemp  = $('.reset-create-template');
      app.$toggleGrid       = $('#toggle-grid');
      app.$addTempArea      = $('#add-template-area');
      app.$stepBtns         = $('.step-option-btn');
      app.$newTempBtn       = $('#at-new-template');
      app.$fromTempBtn      = $('#at-from-template');
      app.$documentSizeBtns = $('input[name=doc-size]');
      app.$textComponentOpt = $('.text-editor-option button');
      app.$templateName     = $('#new-template-name');
      app.$toggleElTriggers = $('.js-toggle-target-el');

      // Edit Canvas Component Triggers
      app.$delComponentBtn  = $('#at-remove-component');
      app.$editComponentBtn = $('#at-update-component');
      app.$stopComponentBtn = $('#at-stop-update-component');

      // Bind to dom elements to functions
      app.$reserCreateTemp.on('click', app.c.resetTemplate);
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
      app.$delComponentBtn.on('click', app.c.delTempBlock);
      app.$editComponentBtn.on('click', app.c.editTempBlock);
      app.$stopComponentBtn.on('click', app.c.stopTempBlock);
    },


    /**
      Creation tool end points
    **/
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