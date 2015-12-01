(function(){
  'use strict';

  // $ = dom elements
  // _ = fabric elements

  var app = app || {};

  // Canvas Elements/Settings
  app._canvas;
  app._grid;
  app.gridSquare      = 24;
  // Units/Measurements
  app.ptSize          = 0.75; // 1px > 1pt
  app.mmSize          = 0.2645833333333; // 1px > 1mm
  app.pxSize          = 3.779527559055; // 1mm > 1px
  // Template Creation Settings/Values
  app.orientation;
  app.templateType    = 'default';
  app.imagedata;
  app.docDimesions    = [];
  app.templateName;
  app.$tempBlockName  = $('#at-block-title');
  app.templateDatURL  = '';
  app.templateId      = null;
  app.tempGroupCnt    = 0;
  app.tempGBlockCnt   = 0;
  // Enviornment Check
  app.isLocalEnv      = document.location.hostname ===  "widget.macmillan.org.uk";
  // State controllers
  app.gEditActive     = false; // Global active mode
  app.tbgEditActive   = false; // Text Block Group Edit Active

  // Sets the default templates and some example text for textblocks
  if(app.isLocalEnv){
    app.dummyText = $.get('assets/data/dummy-text.txt', function(data){return data}, 'text');
    app.templateDatURL = 'assets/data/data.templates.txt';
  }else{
    app.dummyText = $.get('../assets/data/dummy-text.txt', function(data){return data}, 'text');
    app.templateDatURL = '/be/api/PDF/Template.ashx';
  }
  
  app.c = {
    initCreate: function(){
      app.c.bindClickEvents();
      app.c.loadTempList();
    },

    /**
      Util functions
    **/
    createFileName: function(extension){
      var filename = $('.canvas-name-field').val() || 'template-download';
      return filename + extension
    },
    convertUnit: function(unit, targetUnit){
      return parseInt( parseFloat(unit * targetUnit).toFixed(5) );    
      // return unit * targetUnit;    
    },
    coverUnitFromMM: function(unit, targetUnit){
      var changeVal = Math.ceil(unit * targetUnit);
      if(changeVal < 0){
        // console.log(0);
        return 0
      }else{
        // console.log(changeVal);
        return changeVal
      }  
    },
    setDocumentSize: function(){
      // X, Y, % of A4.
      console.log(app.orientation);
      console.log(app.docDimesions);
      if(app.templateType !== 'default'){
        return [88,55, 1]      // Business Card 
      }else{
        if(app.orientation === 'p' && app.docDimesions[0] === 'A2'){
          return [420,594,2]      // A2 Portrait
        } else if(app.orientation === 'l' && app.docDimesions[0] === 'A2'){  
          return [594,420,2]      // A2 Landscape
        } else if(app.orientation === 'p' && app.docDimesions[0] === 'A3'){
          return [297,420,1.4142] // A3 Portrait
        } else if(app.orientation === 'l' && app.docDimesions[0] === 'A3'){  
          return [420,297,1.4142] // A3 Landscape
        } else if(app.orientation === 'p' && app.docDimesions[0] === 'A4'){
          return [210,297,1]      // A4 Portrait
        } else if(app.orientation === 'l' && app.docDimesions[0] === 'A4'){  
          return [297,210,1]      // A4 Landscape
        } else if(app.orientation === 'p' && app.docDimesions[0] === 'A5'){
          return [148,210,0.7071] // A5 Potrait
        } else if(app.orientation === 'l' && app.docDimesions[0] === 'A5'){
          return [210,148,0.7071] // A5 Landscape
        } else if(app.orientation === 'p' && app.docDimesions[0] === 'A6'){
          return [105,148,0.5]    // A6 Potrait
        } else if(app.orientation === 'l' && app.docDimesions[0] === 'A6'){
          return [148,105,0.5]    // A6 Landscape
        } else if(app.orientation === 'p' && app.docDimesions[0] === 'A7'){
          return [74,105,0.3536]  // A7 Potrait
        } else if(app.orientation === 'l' && app.docDimesions[0] === 'A7'){
          return [105,74,0.3536]  // A7 Landscape
        } 
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
      //console.log(color);
      // if(typeof(color) !== 'undefined'){
      //   var colorArr = color.split(','),
      //       c        = colorArr[0] / 100,
      //       m        = colorArr[1] / 100,
      //       y        = colorArr[2] / 100,
      //       k        = colorArr[3] / 100,
      //       r,
      //       g,
      //       b;

      //   r = Math.round(1 - Math.min(1, c * (1 - k) + k)) * 255;
      //   g = Math.round(1 - Math.min(1, m * (1 - k) + k)) * 255;
      //   b = Math.round(1 - Math.min(1, y * (1 - k) + k)) * 255;
      //   //console.log('rgb(' + r + ',' + g + ',' + b + ')');
      //   return 'rgb(' + r + ',' + g + ',' + b + ')'
      // }else{
      //   return 'rgb(0,0,0)'
      // }
      return 'rgb(0,0,0)'
    },
    toggleElements: function(){
      var $this         = $(this),
          toggleTarget  = $this.data('targetel'),
          toggleGroup   = $this.data('toggle-group');

      $('.' + toggleGroup).addClass('hidden');
      $('#' + toggleTarget).removeClass('hidden');
    },
    filterResponse: function(data){
      // Ugly way of dealing with store front response which contains extra junk in the request.
      // This cleans up the reponse so it can be parsed as JSON.
      var response  = data,
          start     = response.indexOf('['),
          fin       = response.indexOf(']');
      return response.substr(start,fin+1)
    },

    /**
      Working with existing templateas
    **/
    loadTempList: function(){
      $('#static-templates').remove();
      $('#dynamic-templates').removeClass('hidden');
      $.ajax({
        url: app.templateDatURL,
        dataType: 'text'
      })
      .done(function(data){
        // Filter the response and then create JSON        
        var templatesData = JSON.parse(app.c.filterResponse(data)),
            tempString = '';
        // console.log(templatesData);
        // console.log(JSON.parse(data));

        templatesData.forEach(function(template){
          tempString += '<div class="col-xs-6 col-md-3">';
            tempString += '<input type="radio" id="template' + template.ID +'" name="template-url" value="' + template.ID +'" class="template-selection hidden">';
            tempString += '<label for="template' + template.ID +'" class="thumbnail">';
              tempString += '<span class="template-name">' + template.Name + '</span>';
              tempString += '<img src="../templates/' + template.ID +'.jpg" alt="' + template.Name + '" class="">';
            tempString += '</label>';          
          tempString += '</div>';
        });
        $('#dynamic-templates').append(tempString);
        $('#dynamic-templates .template-selection').first().prop('checked', true);
      });
    },
    loadExistingTemp: function(){
      var x2js = new X2JS(),
          ajaxUrl,
          $selectedInput = $('input[name=template-url]:checked');
      
      app.templateId = $selectedInput.val();      
      if(app.isLocalEnv){
        ajaxUrl = 'assets/xml/' + app.templateId + '.xml';
      } else{
        ajaxUrl = '/be/api/PDF/Template.ashx?id='+ app.templateId +'&incXml=true'
      }

      $.ajax({
        type: 'GET',
        url: ajaxUrl
      })
      .success(function(data){
        var templateData, 
            tempJSON;

        if(app.isLocalEnv){
          templateData = data;
          tempJSON = x2js.xml2json(templateData);
        }else{
          templateData = JSON.parse(app.c.filterResponse(data));2
          tempJSON = x2js.xml_str2json(templateData[0].XML);
          app.docDimesions = templateData[0].Dimensions.replace(' ', '').split(',');
        }
        // Set the dimensions of the template
        $('#template-size-options').text(app.docDimesions.join(','));
        // Set the name of the template so the user can see once in the edit mode.s
        $('#template-name').text($selectedInput.next().find('.template-name').text());       
        $('#template-tools-navigation').addClass('col-md-4');

        app.c.loadTempFromJSON(tempJSON);        
      });

    },    
    loadTempFromJSON: function(canvasData){
      // console.log(canvasData);
      // console.log(canvasData.doc);
      var canvasEl    = document.createElement('canvas'),
          docWidth    = parseInt(canvasData.doc.page._width),
          docHeight   = parseInt(canvasData.doc.page._height),
          canvasScale = 0; 

      // Set the ID of the Canvas      
      canvasEl.setAttribute('id', 'c');      

      // Set the orientation
      if(docWidth < docHeight){
        app.orientation   = 'p'; // Portrait
        $('#template-orientation').text('Portrait');
      }else{
        app.orientation   = 'l'; // Landscape
        $('#template-orientation').text('Landscape');
      }

      // Set the width of the canvas based on asset type. All assets use an A4 as a base, except business cards
      if(docWidth === 85 && docHeight === 55){        
        app.templateType  = 'business';
        canvasEl.width    = 332;
        canvasEl.height   = 207;
      } else{
        if(docWidth < docHeight){
          canvasEl.width  = 396;
          canvasEl.height = 561;
        } else{
          canvasEl.width  = 561;
          canvasEl.height = 396;
        }
      }

      // Set the level of scaling so the when converting the cooridinates to pixels that are accurate      
      if((docWidth === 420 && docHeight === 594) || (docHeight=== 420 && docWidth === 594)){
        // A2 = 420x594 or 594x420
        canvasScale = 2;
        app.isLocalEnv == true ? app.docDimesions = ['A2'] : [];
      }
      else if((docWidth === 297 && docHeight === 420) || (docHeight=== 297 && docWidth === 420)){
        // A3 = 297x420 or 420x297
        canvasScale = 1.4142;
        app.isLocalEnv == true ? app.docDimesions = ['A3'] : [];
      } else if((docWidth === 210 && docHeight === 297) || (docHeight=== 210 && docWidth === 297)){
        // A4 = 210x297 or 297x210
        canvasScale = 1;
        app.isLocalEnv == true ? app.docDimesions = ['A4'] : [];
      } else if((docWidth === 148 && docHeight === 210) || ((docHeight === 148 || docHeight === 148.5) && docWidth === 210)){
        // A5 = 148x210 or 210x148
        canvasScale = 0.7071;
        app.isLocalEnv == true ? app.docDimesions = ['A5'] : [];    
      } else if((docWidth === 105 && docHeight === 148) || (docHeight >= 104 && docHeight <= 105 && docWidth === 148)){
        // A6 = 105x148 or 148x105
        canvasScale = 0.5;
        app.isLocalEnv == true ? app.docDimesions = ['A6'] : [];
      } else if((docWidth === 74 && docHeight === 105) || (docHeight === 74 && docWidth === 105)){
        // A7 = 74x105 or 105x74
        canvasScale = 0.3536;
        app.isLocalEnv == true ? app.docDimesions = ['A7'] : [];
      } else if(docWidth === 85 && docHeight === 55){
        // Business Card = 85x55
        canvasScale = 1;
        app.isLocalEnv == true ? app.docDimesions = ['Business Card'] : [];
      } 
      console.log(docWidth, docHeight, canvasScale)

      document.getElementById('canvas-container').appendChild(canvasEl);
      app._canvas = new fabric.Canvas('c', { selection: false, backgroundColor: '#FFF' });
      app.c.drawGrid(396); // Pass in the width dynamically so the whole grid is covered
      // Add all of the elements to the page.
      app.c.createTempBlockFromXML(canvasData.doc.page, canvasScale);
      app.c.bindCanavsEvents(); 
    },
    createTempBlockFromXML: function(templateJSON, scale){
      // console.log(templateJSON);
      if(typeof(templateJSON['text-block-group']) !== 'undefined'){
          if(typeof(templateJSON['text-block-group'].length) === 'undefined'){
            // Only a single text block group
            templateJSON['text-block-group']['block'] = 'tbg';
            templateJSON['text-block-group']['scale'] = scale;
            app.c.createTempBlockData(true, templateJSON['text-block-group']);
          }else{
            // Multiple text block groups
            templateJSON['text-block-group'].forEach(function(textBlockGroup){
              textBlockGroup['block'] = 'tbg';
              textBlockGroup['scale'] = scale;
              app.c.createTempBlockData(true, textBlockGroup);
            });
          }
      }

      if(typeof(templateJSON['text-block']) !== 'undefined'){
        if(typeof(templateJSON['text-block'].length) === 'undefined'){
          // Only a single text block
          templateJSON['text-block']['block'] = 'tb';
          templateJSON['text-block']['scale'] = scale;
          app.c.createTempBlockData(true, templateJSON['text-block']);
        }else{
          // Multiple text blocks
          templateJSON['text-block'].forEach(function(textBlock){
            textBlock['block'] = 'tb';
            textBlock['scale'] = scale;
            app.c.createTempBlockData(true, textBlock);
          });
        }
      }

      if(typeof(templateJSON['image']) !== 'undefined'){
        if(typeof(templateJSON['image'].length) === 'undefined'){
          // Only a single image block
          templateJSON['image']['block'] = 'ib';
          templateJSON['image']['scale'] = scale;
          app.c.createTempBlockData(true, templateJSON['image']);
        }else{
          // Multiple image blocks
          templateJSON['image'].forEach(function(imgBlock){
            imgBlock['block'] = 'ib';
            imgBlock['scale'] = scale;
            app.c.createTempBlockData(true, imgBlock);
          });
        }
      }
    },


    /**
      Canvas Controls and Events
    **/
    resetTemplate: function(){
      // Check if the canvas exists before trying to clear it.
      if(app._canvas){
        app._canvas.clear();
      }      
      app.docDimesions  = [];
      app.gEditActive   = false;
      app.tbgEditActive = false;
      app.tempGroupCnt      = 0;
      app.tempGBlockCnt     = 0
      // Reset the create template tool back to its default
      app.c.resetCreateTempBlock();
      $('.empty-on-reset').empty();
      $('.clear-on-reset').val('');
      $('.stepped-option-2').addClass('hidden');
      $('.new-template-container').removeClass('load-template-state');

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

      // Reset the text block group editing settings
      app.c.handleTbgState(false);
      // Empty the the text block group list
      $('#at-text-block-group-list').empty();
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
      // Enable all block type selections
      $('input[name=template-block-type]').removeAttr('disabled');
      // Resets all buttons back to the default settings
      $('button.reset-to-default').siblings().removeClass('option-selected').end()
                                  .addClass('option-selected');
      // Resets the tempale block options back to default
      $('.template-options').not('reset-to-default').addClass('hidden');
      $('div.reset-to-default').removeClass('hidden');
    },
    resetGroupTextBlock: function(){
      // Reset Maxlength
      var $groupMaxLength = $('#at-maxlength-g'),
          textVal = $groupMaxLength.attr('value');
      $groupMaxLength.val(textVal);

      // Reset Block name
      $('#at-text-block-title').val('');

      // Reset Manditory and Editable
      $('#at-text-block-group-el-options input[type="checkbox"].reset-to-default').prop('checked', true);

      // Reset Block Colour, Font, Size
      $('#at-text-block-group-el-options button.reset-to-default').siblings().removeClass('option-selected').end()
                                                                  .addClass('option-selected');
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

      // Set the text for available sizes
      $('#template-size-options').text( app.docDimesions.join(','));

      // Set the text to show orientation selected
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
    deactiveCanvasControls: function(){
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
    setBlockType: function(type){
      switch(type) {
        case 'new-template-text-block':
            return 'tb'  // Text Block
            break;
        case 'new-template-text-block-group':
            return 'tbg' // Text Block Group
            break;
        case 'new-template-image-block':
            return 'ib'  // Image Block
            break;
        case 'new-template-line-block':
            return 'lb'  // Line Block
            break;
      }
    },
    createTempBlockData: function(fromXML, data){
      // console.log(data);
      var blockType,
          blockSettings = {},
          blockSize;
      // Check if an element is being created using the creation tool or loading an existing template.
      if(fromXML === true){
        console.log(data);
        if(data.block === 'ib'){
          blockType = 'ib';
          blockSettings.blocktype     = 'new-image-block';
          blockSettings.blockTitle    = typeof(data._title) !== 'undefined' ? data._title : '';
          blockSettings.halign        = typeof(data._align) !== 'undefined' ? data._align : '';
          blockSettings.isEditable    = typeof(data._editable) !== 'undefined' ? data._editable : 'false';
          blockSettings.isManditory   = typeof(data._mandatory) !== 'undefined' ? data._mandatory : 'false';
          blockSettings.valign        = typeof(data._verticalalign) !== 'undefined' ? data._verticalalign : '';
        } else if(data.block =='tb'){
          blockType = 'tb';
          blockSettings.blocktype     = 'new-text-block';   
          blockSettings.blockTitle    = typeof(data._title) !== 'undefined' ? data._title : '';
          blockSettings.halign        = typeof(data._align) !== 'undefined' ? data._align : 'left';
          blockSettings.isEditable    = typeof(data._editable) !== 'undefined' ? data._editable : 'false';
          blockSettings.isManditory   = typeof(data._mandatory) !== 'undefined' ? data._mandatory : 'false';
          blockSettings.lineheight    = typeof(data._leading) !== 'undefined' ? data._leading.replace('%', '') : '100';
          blockSettings.valign        = typeof(data._verticalalign) !== 'undefined' ? data._verticalalign : 'top';
          // Text Block Specific
          blockSettings.fontColor   = app.c.cmykToRGB(data._colour);
          blockSettings.fontFamily  = typeof(data['_font-family']) !== 'undefined' ? data['_font-family'] : 'FuturaBT-Heavy';
          blockSettings.fontSize    = typeof(data['_font-size']) !== 'undefined' ? data['_font-size'] : '12';
          blockSettings.maxLength   = typeof(data._maxlen) !== 'undefined' ? data._maxlen : '';
          if(typeof(data._source) !== 'undefined'){
            blockSettings.stringSrc = data._source;
          }else{
            blockSettings.textVal = typeof(data.__text) !== 'undefined' ? data.__text : '';
          }
        } else if(data.block === 'tbg'){
          blockSettings.blocktype     = 'new-text-block-group';
          blockSettings.blockTitle    = typeof(data._title) !== 'undefined' ? data._title : '';         
          blockSettings.halign        = typeof(data._align) !== 'undefined' ? data._align : 'left';
          blockSettings.isEditable    = typeof(data._editable) !== 'undefined' ? data._editable : 'false';
          blockSettings.isManditory   = typeof(data._mandatory) !== 'undefined' ? data._mandatory : 'false';
          blockSettings.spacing       = typeof(data._spacing) !== 'undefined' ? data._spacing : 'false';
          blockSettings.valign        = typeof(data._verticalalign) !== 'undefined' ? data._verticalalign : 'top';
        }
        // Convert to booleans
        blockSettings.isEditable  = 'true' ? true : false;
        blockSettings.isManditory = 'true' ? true : false;

        // Convert the unit to its equivelant based on an A4
        // console.log(data);
        // console.log('Before Conversion: ' + data._upperrightx, data._upperrighty, data._lowerleftx, data._lowerleftx, data._lowerlefty);
        data._upperrightx = data._upperrightx / data.scale;
        data._upperrighty = data._upperrighty / data.scale;
        data._lowerleftx  = data._lowerleftx  / data.scale;
        data._lowerlefty  = data._lowerlefty  / data.scale;
        // console.log('After Conversion: ' + data._upperrightx, data._upperrighty, data._lowerleftx, data._lowerleftx, data._lowerlefty);
        // Generic block settings
        var canvasScale     = app.templateType === 'default' ? 2.0174 : 1,
            blockDimensions = {};

        // Base of 15 at a3...
        // 1. Convert a unit into its equivelant it would be in a4. || 15 / 1.4142 (10.60670343657191)
        // 2. Convert the MM to its Pixel equivelant                || Math.ceil(10.60670343657191 * 3.779527559055) = 41
        // 3. Convert the that unit to the relevant size based of the scale of the canvas || Math.ceil(41 / 2.0174)  = 21
        
        // console.log(Math.ceil(app.c.convertUnit(data._width, app.pxSize)));
        // console.log(Math.ceil( Math.ceil(app.c.convertUnit(data._width, app.pxSize)) / canvasScale));
        blockDimensions.upperX = Math.ceil(Math.ceil(app.c.coverUnitFromMM(data._upperrightx, app.pxSize)) / canvasScale);
        blockDimensions.upperY = Math.ceil(Math.ceil(app.c.coverUnitFromMM(data._upperrighty, app.pxSize)) / canvasScale);
        blockDimensions.lowerX = Math.ceil(Math.ceil(app.c.coverUnitFromMM(data._lowerleftx, app.pxSize)) / canvasScale);
        blockDimensions.lowerY = Math.ceil(Math.ceil(app.c.coverUnitFromMM(data._lowerlefty, app.pxSize)) / canvasScale);
        // console.log(blockDimensions);

        // (el.width * scalex) * canvasScale, app.mmSize
        blockSettings.height  = app.c.calcHeight(blockDimensions);
        blockSettings.left    = blockDimensions.lowerX;
        blockSettings.top     = app._canvas.height - blockDimensions.upperY;
        blockSettings.width   = app.c.calcWidth(blockDimensions);
        console.log(blockSettings);

        if(data.block === 'tbg'){
          var listItems = '';
          data['text-block'].forEach(function(block){
            console.log(block);
            var blockSettings = {};
            // console.log(block);
            blockSettings.isEditable  = typeof(block._editable) !== 'undefined' ? block._editable : 'false';
            blockSettings.isManditory = typeof(block._mandatory)!== 'undefined' ? block._mandatory : 'false';
            blockSettings.fface       = typeof(block['_font-family']) !== 'undefined' ? block['_font-family'] : 'FuturaBT-Book';
            blockSettings.fontColor   = app.c.cmykToRGB(block._colour);
            blockSettings.fontSize    = typeof(block['_font-size']) !== 'undefined' ? block['_font-size'] : 12;
            blockSettings.lineheight  = typeof(block._leading)  !== 'undefined' ? block._leading.replace('%', '') : '100';
            blockSettings.id          = typeof(block._id) !== 'undefined' ? block._id : 'false';
            blockSettings.label       = typeof(block._title) !== 'undefined' ? block._title : 'false';
            blockSettings.maxLength   = typeof(block._maxlen) !== 'undefined' ? block._maxlen : '';
            if(typeof(block._source) !== 'undefined'){
              blockSettings.stringSrc = block._source;
            }
             if(typeof(block.__text) !== 'undefined'){
              blockSettings.textVal = block.__text;
            }
            listItems += app.c.textBlockHtmlSnippet(blockSettings);
          });
          $('#at-text-block-group-list').append(listItems);
          app.c.createTempBlockGroup(blockSettings);
        }else{
          app.c.createTempBlockRegular(blockSettings)
        }
        // console.log(blockSettings);
      }else{
        blockType = app.c.setBlockType($('input[name=template-block-type]:checked').val());
        blockSize = app.c.setAspectRatio($('input[name=block-ratio]:checked').val()); // This returns and array

        // console.log(blockType);

        blockSettings.blockTitle  = app.$tempBlockName.val() || 'Block';
        blockSettings.halign      = $('input[name=h-pos]:checked').val();
        blockSettings.height      = blockSize[1];
        blockSettings.isEditable  = $('#at-editable').is(':checked') ? true : false;
        blockSettings.isManditory = $('#at-manditory').is(':checked') ? true : false;
        blockSettings.left        = 0;
        blockSettings.top         = 0;
        blockSettings.valign      = $('input[name=v-pos]:checked').val();
        blockSettings.width       = blockSize[0];

        if(blockType === 'ib'){
          // If this is a image block;
          blockSettings.blocktype   = 'new-image-block';
          blockSettings.fontColor   = 'rgb(0,0,0)';
          app.c.createTempBlockRegular(blockSettings);
        } else if(blockType === 'tb'){
          // If this is a text block;
          blockSettings.blocktype   = 'new-text-block';
          blockSettings.fontColor   = 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')';
          blockSettings.fontFamily  = $('#at-font-face .option-selected').data('fface');
          blockSettings.fontSize    = $('#at-font-size .option-selected').data('size');
          blockSettings.lineheight  = $('#at-lineheight .option-selected').data('lineheight');
          blockSettings.maxLength   = $('#at-maxlength').val();
          if($('#at-source-yes').is(':checked')){
            blockSettings.stringSrc = $('#at-src').val();
            $.ajax({
              url: 'assets/' + blockSettings.stringSrc,
              dataType: 'text'
            })
            .done(function(data){
              //console.log(data);
              blockSettings.textVal = data;
            });
          }else{
            blockSettings.textVal   = app.dummyText.responseText.substr(0, blockSettings.maxLength);
          }
          app.c.createTempBlockRegular(blockSettings);
        } else if(blockType === 'tbg'){
          // If is a text block group
          blockSettings.blocktype   = 'new-text-block-group';
          blockSettings.spacing     = parseInt($('#at-spacing-g').val());
          //console.log(blockSettings);
          app.c.createTempBlockGroup(blockSettings);
        } else{
          // This is a line block
          blockSettings.blocktype   = 'new-line-block';
          app.c.createTempBlockLine(blockSettings);
        }
      }
    },
    createTempBlockRegular: function(blockSettings){
      // Create the fabric js element on the canvas
      // Use the settings from 'blockSettings' objetect
      console.log(blockSettings);
      var _block = new fabric.Rect({
                                    hasBorders: false,
                                    hasRotatingPoint: false,
                                    height: blockSettings.height,
                                    left: blockSettings.left,
                                    lockRotation: true,
                                    top: blockSettings.top,
                                    width: blockSettings.width
                                  });
      //console.log(_block);
      // console.log(blockSettings);
      // Add additional non-block specific properties based on blocktype
      _block['blocktype']     = blockSettings.blocktype;
      _block['blockTitle']    = blockSettings.blockTitle;
      _block['halign']        = blockSettings.halign;
      _block['isEditable']    = blockSettings.isEditable; 
      _block['isManditory']   = blockSettings.isManditory;  
      _block['valign']        = blockSettings.valign;

      // Add additional properties based on blocktype
      if(blockSettings.blocktype === 'new-text-block'){          
        _block['fontColor']   = blockSettings.fontColor;
        _block['fontFamily']  = blockSettings.fontFamily;
        _block['fontSize']    = parseInt(blockSettings.fontSize);
        _block['lineheight']  = blockSettings.lineheight.replace('%', '');
        _block['maxLength']   = parseInt(blockSettings.maxLength);
        _block['stringSrc']   = blockSettings.stringSrc;
        _block['textVal']     = blockSettings.textVal;
      } 

      // console.log('Before adding: ', _block);
      // console.log(blockType);
      // Add the new component to the canvas. This needs to be done, before we can update the background img of the object
      app._canvas.add(_block);
      // Set the relevant background image for block, based on blocktype
      app.c.setTempBlockBackgroundImg(_block, app.c.setBlockType($('input[name=template-block-type]:checked').val()));
      // Empty the input field with the previous component name.
      app.c.resetCreateTempBlock();
    },
    createTempBlockGroup: function(blockSettings, _block){
      // Create the fabric js element on the canvas      
      // Only increment the counter if it is a new object
      // console.log(blockSettings);
      app.tempGroupCnt       = typeof(_block) !== 'undefined' ? app.tempGroupCnt : app.tempGroupCnt++;
      var $textBlockList     = $('#at-text-block-group-list'),
          _blockId           = typeof(_block) !== 'undefined' ? _block.blockId : 'tbg_' + app.tempGroupCnt;

      // console.log(_block);
      // Check if this is creating a group from an exisitng group. (Performing an update)
      if(typeof(_block) !== 'undefined'){
        // Create indiviual text block for the text block group   
        var _tblocks = app.c.createTempBlockGroupItem($textBlockList.find('li'), $('#at-spacing-g'));
          // Add each block to the exiting group
          console.log(_block);
          _tblocks.forEach(function(block){
            console.log(block);
            // Add each block to the group
            _block.add(block);
          });
        // Add the group to the canvas
        app._canvas.add(_block); 
      }else if($textBlockList.find('li').length > 0){
        // Use the settings from 'blockSettings' object if this is a new group
        var _tblocks = app.c.createTempBlockGroupItem($textBlockList.find('li'), blockSettings.spacing);
        // Add the group elements to the group container
        var _tblockg = new fabric.Group(_tblocks, {
                                                  backgroundColor: 'rgb(0,0,0)',
                                                  fill: 'rgb(0,0,0)',
                                                  hasBorders: true,
                                                  hasRotatingPoint: false,
                                                  height: typeof(blockSettings.height) !== 'undefined' ? blockSettings.height : 200,
                                                  lockRotation: true,
                                                  originX: 'left',
                                                  originY: 'top',
                                                  width: typeof(blockSettings.width) !== 'undefined' ? blockSettings.width : 200,
                                                  top: typeof(blockSettings.top) !== 'undefined' ? blockSettings.top : 200,
                                                  left: typeof(blockSettings.left) !== 'undefined' ? blockSettings.left : 0,
                                                });
        // Set the id and blocktype of the Text Block Group
        // console.log(blockSettings);
        _tblockg['blockId']     = _blockId;
        _tblockg['blocktype']   = 'new-text-block-group';
        _tblockg['halign']      = blockSettings.halign;
        _tblockg['isEditable']  = blockSettings.isEditable; 
        _tblockg['isManditory'] = blockSettings.isManditory;
        _tblockg['spacing']     = blockSettings.spacing;
        _tblockg['valign']      = blockSettings.valign;

        // Add the group to the canvas
        app._canvas.add(_tblockg);        
      }else{
        alert('No text blocks added to text block group. Please try again');
      }

      // Empty the list when complete
      $textBlockList.empty();
      // Add the group to the canvas
      app._canvas.renderAll();  

      // Empty the input field with the previous component name.
      app.c.resetCreateTempBlock();
    },
    createTempBlockGroupItem: function($els, spacing){
      var _blocksCollection = [];
      // console.log(blockSettings.spacing, blockSettings.spacing * parseInt(i + 1) );
      $els.each(function(i){
        var $template   = $(this),
            _innerblock = new fabric.Rect({
                                            fill: 'rgb(255,255,255)',
                                            hasBorders: true,
                                            hasRotatingPoint: false,
                                            height: 20,
                                            left: 20,
                                            lockRotation: true,
                                            originX: 'left',
                                            originY: 'top',
                                            top: spacing * parseInt(i + 1) + 20,
                                            width: 180                                             
                                          });
        // Add additional non-block specific properties based on blocktype
        _innerblock['blocktype']     = 'new-text-block';
        _innerblock['blockTitle']    = $template.text(),
        _innerblock['isEditable']    = $template.data('editable'); 
        _innerblock['isManditory']   = $template.data('manditory');
        _innerblock['id']            = $template.data('id');
        _innerblock['lineheight']    = $template.data('lineheight');
        _innerblock['fontColor']     = $template.data('rgb');
        _innerblock['fontFamily']    = $template.data('fface');
        _innerblock['fontSize']      = parseInt($template.data('size'));
        _innerblock['label']         = $template.data('label');
        _innerblock['maxLength']     = parseInt($template.data('maxlength'));
        _innerblock['textVal']       = $template.find('.text-value').text();
        // console.log(_innerblock);
        _blocksCollection.push(_innerblock);
      });
      return _blocksCollection;
    },
    createTempBlockLine: function(blockSettings){
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
        _block['stringSrc']   = blockSettings.stringSrc;
        _block['textVal']     = blockSettings.textVal;
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
      var _block    = app._canvas.getActiveObject(),
          blockType = app.c.setBlockType($('input[name=template-block-type]:checked').val());
      // console.log(blockType);
      // console.log(_block);
      if(blockType === 'tb'){
        _block.blocktype    = 'new-text-block';
        _block.fontColor    = 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')';
        _block.fontFamily   = $('#at-font-face .option-selected').data('fface');
        _block.fontSize     = $('#at-font-size .option-selected').data('size');
        _block.lineheight   = $('#at-lineheight .option-selected').data('lineheight');
        _block.maxLength    = $('#at-maxlength').val();
        if(typeof(_block.stringSrc) !== 'undefined'){
          _block.stringSrc  = $('#at-src').val();
        }
      } else if(blockType === 'ib'){
        $('#new-template-image-block').siblings().addClass('hidden').end()
                                      .removeClass('hidden');
        _block.blocktype    = 'new-image-block';
      } else if(blockType === 'tbg'){
          // Remove the current objects inside of the group
          console.log(_block);
          _block.forEachObject(function(o){
            console.log(o);
            _block.remove(o);
            console.log(_block);
          });
          // Add new items...
          console.log('Should be empty', _block);

          if( $('#at-text-block-group-list').find('li').length > 0){
            app.c.createTempBlockGroup( $('#at-text-block-group-list').find('li'), _block);
          }else{
            alert('The text block does not contain any text blocks, so it will be removed.');
            app._canvas.remove(_block);
          }
      }
      // Set non-specific block settings
      _block.blockTitle     = app.$tempBlockName.val();
      _block.halign         = $('input[name=h-pos]:checked').val();
      _block.isEditable     = $('#at-editable').is(':checked') ? true : false;
      _block.isManditory    = $('#at-manditory').is(':checked') ? true : false;   
      _block.valign         = $('input[name=v-pos]:checked').val();

      // Set the relevant background image for block, based on blocktype
      if(blockType !== 'tbg'){
        app.c.setTempBlockBackgroundImg(_block, blockType);
      }      
      // Reset the component creation tool.
      app.c.resetCreateTempBlock();
      // De-select the element previously selected on the canvas
      app._canvas.deactivateAll().renderAll();
      // Upadate Global Edit State
      app.gEditActive = false;
    },    
    editBlockFromGroup: function($el){
      // Set the active mode
      app.tbgEditActive = true;
      $('.divider').removeClass('hidden');

      // Update the the settings on the list Item 
      var $blockEl  = $el.parent(),
          rgbAttr   = 'data-rgb="' + $blockEl.data('rgb') + '"',
          ffaceAttr = 'data-fface="' +  $blockEl.data('fface') + '"';
      $('#at-text-block-group-el-options').data('tbgid', $blockEl.data('id'));

      $('#at-text-block-title').val($blockEl.data('label'));
      $('#at-font-face-g button[' + ffaceAttr + ']').siblings().removeClass('option-selected').end()
                                                    .addClass('option-selected');

      $('#at-font-size-g button[data-size=' + $blockEl.data('size') + ']').siblings().removeClass('option-selected').end()
                                                                          .addClass('option-selected');

      $('#at-font-color-g button[' + rgbAttr + ']').siblings().removeClass('option-selected').end()
                                                   .addClass('option-selected');

      $('#at-lineheight-g button[data-lineheight=' + $blockEl.data('lineheight') + ']').siblings().removeClass('option-selected').end()
                                                                                       .addClass('option-selected');
      $('#at-maxlength-g').val($blockEl.data('maxlength'));
      $('#at-manditory-g').prop('checked', $blockEl.data('manditory'));
      $('#at-editable-g').prop('checked', $blockEl.data('editable'));
    },
    updateBlockFromGroup: function(){
      app.c.handleTbgState(false);
      var blockInEditIndex = $('#at-text-block-group-el-options').data('tbgid'),
          $blockItem       = $('#at-text-block-group-list li[data-id=' + blockInEditIndex + ']');

      // Update the name of the element
      $blockItem.find('.badge').text($('#at-text-block-title').val());
      // Update the attributes of the element
      $blockItem.data('label', $('#at-text-block-title').val());
      $blockItem.data('fface', $('#at-font-face-g .option-selected').data('fface'));
      $blockItem.data('size', $('#at-font-size-g .option-selected').data('size'));
      $blockItem.data('rgb', $('#at-font-color-g .option-selected').data('rgb'));
      $blockItem.data('maxlength', $('#at-maxlength-g').val());
      $blockItem.data('lineheight',  $('#at-lineheight-g .option-selected').data('lineheight'));
      $blockItem.data('manditory', $('#at-manditory-g').is(':checked'));
      $blockItem.data('editable', $('#at-editable-g').is(':checked'));
      app.c.stopBlockFromGroup();
      // Update the Edit active state
      app.tbgEditActive = false;
    },
    stopBlockFromGroup: function(){
      app.c.handleTbgState(false);
      // Hide or show the relevant controls
      if(app.gEditActive === true){
        $('[data-state=disable-in-tgb-edit-state]').addClass('hidden');
      }else{
        $('[data-state=disable-in-tgb-edit-state]').removeClass('hidden');
      }
      app.tbgEditActive = false;
    },
    setTempBlockSettings: function(_selectedEl){
      console.log(_selectedEl);
      var test = app._canvas.getActiveGroup();
      console.log(test);
      // Set the block type name
      // template-text-block-group
      var blockTypeName = 'template' + _selectedEl.blocktype.replace('new', '');
      //console.log(blockTypeName);

      // Set the title
      app.$tempBlockName.val(_selectedEl.blockTitle);

      // Set H Align      
      $('input[value='+ _selectedEl.halign +']').prop('checked', true);
      // Set V Align
      $('input[value='+ _selectedEl.valign +']').prop('checked', true);

      // Set Editable
      if(_selectedEl.isEditable === true){
        $('#at-editable').prop('checked', true);
      }else{
        $('#at-editable').prop('checked', false);
      }

      // Set Manditory
      if(_selectedEl.isManditory === true){
        $('#at-manditory').prop('checked', true);
      }else{
        $('#at-manditory').prop('checked', false);
      }

      // Set Block Type
      // console.log(typeof(blockTypeName), blockTypeName);
      $('#' + blockTypeName).prop('checked', true);

      // Set Block specific values
      if(blockTypeName === 'template-text-block'){
        $('#template-text-block-group').attr('disabled', 'disabled');
        $('#template-text-block, #template-image-block').removeAttr('disabled', 'disabled');
        // Set the text block specific settings.
        var rgb       = _selectedEl.fontColor.replace('rgb(', '').replace(')', ''),
            rgbAttr   = 'data-rgb="' + rgb + '"',
            ffaceAttr = 'data-fface="' + _selectedEl.fontFamily + '"',
            linehAttr = 'data-lineheight="' + _selectedEl.lineheight + '"';

        // Color
        $('button[' + rgbAttr +']').siblings().removeClass('option-selected').end()
                                              .addClass('option-selected');
        // Font size
        $('button[data-size='+ _selectedEl.fontSize +']').siblings().removeClass('option-selected').end()
                                                         .addClass('option-selected');
        // Font Family
        $('button['+ ffaceAttr +']').siblings().removeClass('option-selected').end()
                                    .addClass('option-selected');
        
        // Line Height
        $('button['+ linehAttr +']').siblings().removeClass('option-selected').end()
                                              .addClass('option-selected');
        
        //  MaxLength
        $('#at-maxlength').val(_selectedEl.maxLength);

        // From Source
        if(typeof(_selectedEl.stringSrc) !== 'undefined'){
          $('#at-src').val(_selectedEl.stringSrc);
          $('#at-source-yes').prop('checked', true);
        }else{
          $('#at-source-no').prop('checked', true)
        }

        // Show the TEXT editing options only                              
        $('#new-template-text-block').removeClass('hidden');
        $('#new-template-image-block, #new-template-text-block-group').addClass('hidden');
      } else if(blockTypeName === 'template-image-block'){
        $('#template-text-block-group').attr('disabled', 'disabled');
        $('#template-text-block, #template-image-block').removeAttr('disabled', 'disabled');
        // Show the IMAGE editing options only
        $('#new-template-image-block').removeClass('hidden');
        $('#new-template-text-block, #new-template-text-block-group').addClass('hidden');
      } else if(blockTypeName === 'template-text-block-group'){
        $('#template-text-block, #template-image-block').attr('disabled', 'disabled');
        // Show the TEXT BLOCK GROUP editing options only
        $('#new-template-text-block-group').removeClass('hidden');
        $('#new-template-text-block, #new-template-image-block').addClass('hidden');
        // Set Spacing
        $('#at-spacing-g').val(_selectedEl.spacing);

        // Set text blocks inside text block group
        var $textBlockList = $('#at-text-block-group-list'),
            blockHTML      = '',
            blockDetails   = {};
        // Empty the list of text blocks from the list and then show the element
        $textBlockList.empty().show();
        // Create each text block with its previous settings set
        _selectedEl._objects.forEach(function(_textBlock){
          blockDetails.fontSize    = _textBlock.fontSize;
          blockDetails.fface       = _textBlock.fontFamily;      
          blockDetails.fontColor   = _textBlock.fontColor;
          blockDetails.id          = _textBlock.id;
          blockDetails.isEditable  = _textBlock.isEditable;
          blockDetails.isManditory = _textBlock.isManditory;
          blockDetails.label       = _textBlock.label;
          blockDetails.lineheight  = _textBlock.lineheight;
          blockDetails.maxLength   = _textBlock.maxLength;
          blockDetails.textVal     = _textBlock.textVal;
          // console.log(blockDetails);
          blockHTML = app.c.textBlockHtmlSnippet(blockDetails);
          $textBlockList.append(blockHTML);
        });
        // Add stuff for line elements        
      }
    },
    setTempBlockBackgroundImg: function(_block, blocktype){
      //console.log(_block);
      var imgSrc,
          repeatSetting;
      // console.log('setTempBlockBackgroundImg ' + blocktype);
      if(blocktype === 'tb'){
        if(app.isLocalEnv){
          imgSrc = 'assets/img/text-placeholder.png';
        }else{
          imgSrc = '../assets/img/text-placeholder.png';
        }        
        repeatSetting = 'repeat';
      } else if(blocktype === 'ib'){
        if(app.isLocalEnv){
          imgSrc = 'assets/img/img-placeholder.png';
        }else{
          imgSrc = '../assets/img/img-placeholder.png';
        }
        repeatSetting = 'no-repeat';
      }

      if( blocktype === 'tb' || blocktype === 'ib'){
        fabric.util.loadImage(imgSrc, function(img) {
            _block.setPatternFill({
                source: img,
                repeat: repeatSetting
            });
          app._canvas.renderAll();
        });
      }
    },
    delTempBlock: function(){
      // Get the select fabric object and remove it.
      var _activeObject = app._canvas.getActiveObject();
      console.log(_activeObject);
      // Remove the item from the canvas
      app._canvas.remove(_activeObject).renderAll();
      // Reset the component creation tool.
      app.c.resetCreateTempBlock();
      // Upadate Global Edit State
      app.gEditActive = false;
    },
    stopTempBlock: function(){
      // De-select the element previously selected on the canvas
      app._canvas.deactivateAll().renderAll();
      // Reset the component creation tool.
      app.c.resetCreateTempBlock();
      // Upadate Global Edit State
      app.gEditActive = false;
    },
    toggleTempState: function(isEditing){
      // console.log(isEditing);
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
        // Set the global edit state
        app.gEditActive = true;
        // Set the block settings to what the currently selected blocks settings are
        app.c.setTempBlockSettings(app._canvas.getActiveObject());
        // Show the edit options
        app.c.toggleTempState(true);
      });
      app._canvas.on('mouse:down', function(e) {
        // console.log(e);
        // console.log(typeof(e.target) !== 'undefined');
        // console.log(typeof(e.target._objects) !== 'undefined');
        // console.log(e.target.blocktype !== 'new-text-block-group');
        // Checks if the canvas itself has been clicked. If it has been clicked, then get out of edit mode
        if(typeof(e.target) !== 'undefined' && typeof(e.target._objects) !== 'undefined' && e.target.blocktype !== 'new-text-block-group'){
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

      app.c.showTemplates($this);

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
    showTemplates: function(el){
      var $templateControlsContainer = $('#template-tools-navigation'),
          $templateCanvasContainer   = $('.new-template-container');
      if(el.attr('id') === 'at-show-templates'){
        $templateControlsContainer.removeClass('col-md-4'); 
      }else{
        $templateControlsContainer.addClass('col-md-4')
      }

      if(el.hasClass('at-from-template')){
        $templateCanvasContainer.addClass('load-template-state');
      } else{
        $templateCanvasContainer.removeClass('load-template-state');
      }
    },
    toggleTempGroupOpts: function(isClose){
      var $blockControls = $('.new-block-controls'),
          $groupControls = $('.new-group-controls');

      if($(this).attr('id') === 'at-save-block-to-group'){
        $blockControls.removeClass('hidden');
        $groupControls.addClass('hidden');
        app.c.addBlockToGroup(app.tempGBlockCnt);
        app.c.resetGroupTextBlock();
        app.tempGBlockCnt++;
      }else{
        $('#at-text-block-group-el-options').attr('data-tbgid', app.tempGBlockCnt);
        $blockControls.addClass('hidden');
        $groupControls.removeClass('hidden');
      }

      if(isClose === false){
        $blockControls.removeClass('hidden');
        $groupControls.addClass('hidden');  
      }
    },
    addBlockToGroup: function(blockId){
      var $textBlockList = $('#at-text-block-group-list'),
          blockHTML,
          blockDetails   = {};
      if($textBlockList.find('li').length === 0){
        $textBlockList.show();
      }
      blockDetails.fontSize    = $('#at-font-size-g .option-selected').data('size');
      blockDetails.fface       = $('#at-font-face-g .option-selected').data('fface');      
      blockDetails.fontColor   = $('#at-font-color-g .option-selected').data('rgb');
      blockDetails.id          = blockId;
      blockDetails.isEditable  = $('#at-editable-g').is(':checked') ? true : false;
      blockDetails.isManditory = $('#at-manditory-g').is(':checked') ? true : false;
      blockDetails.label       = $('#at-text-block-title').val().length > 0 ? $('#at-text-block-title').val() : 'Text Block ' + blockId;
      blockDetails.lineheight  = $('#at-lineheight-g .option-selected').data('lineheight');
      blockDetails.maxLength   = $('#at-maxlength-g').val();

      blockHTML = app.c.textBlockHtmlSnippet(blockDetails);
      $textBlockList.append(blockHTML);
    },
    handleTbgState: function(state){
      // Update the UI
      //console.log('handleTbgState ' + state)
      if(state === true){
        $('[data-state=disable-text-block-controls]').addClass('hidden');
        $('[data-state=enable-text-block-controls]').removeClass('hidden');        
      } else{
        $('[data-state=disable-text-block-controls]').removeClass('hidden');
        $('[data-state=enable-text-block-controls]').addClass('hidden');
      }
    },
    textBlockHtmlSnippet: function(settings){
      // console.log(settings)
      var htmlString = '';
      htmlString+= '<li class="list-group-item" ';
              htmlString+= 'data-editable="' + settings.isEditable + '" ';
              htmlString+= 'data-fface="' + settings.fface + '" ';
              htmlString+= 'data-rgb="' + settings.fontColor + '" ';
              htmlString+= 'data-size="' + settings.fontSize + '" ';             
              htmlString+= 'data-id="' + settings.id + '" ';
              htmlString+= 'data-label="' + settings.label + '" ';
              htmlString+= 'data-lineheight="' + settings.lineheight + '" ';
              htmlString+= 'data-manditory="' + settings.isManditory +'" ';
              htmlString+= 'data-maxlength="' + settings.maxLength +'">';
        htmlString+= '<span class="badge">' + settings.label + '</span>';        
        htmlString+= '<span class="hidden text-value">' + settings.textVal + '</span>';
        htmlString+= '<button type="button" data-action="remove-tb-from-tbg" class="btn btn-danger pull-right">X</button>';
        htmlString+= '<button type="button" data-action="edit-tb-from-tbg" class="btn btn-info pull-right">Edit</button>';
      htmlString+= '</li>';
      return htmlString
    },


    /** 
      Validation
    **/
    validateTemplateName: function(){
      app.$newTempBtn.removeAttr('disabled');
      // var $this = $(this);
      // if($this.val().length > 2){
      //   app.$newTempBtn.removeAttr('disabled');
      //   app.templateName = $.trim($this.val());
      // }else{
      //   app.$newTempBtn.attr('disabled', 'disabled');
      // }
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
        'blockId',
        'blockTitle',
        'blocktype',
        'fontColor',
        'fontFamily',
        'fontSize',
        'halign',
        'isEditable',
        'isManditory',
        'label',
        'lineheight',
        'maxLength',
        'spacing',
        'stringSrc',
        'textVal',
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
      // console.log(canvasData);
      // All based of fixed values of of canvas_size:print_size(A4) a scale will need to be passed to the DOC property if larger/smaller
      // The canvas doesn't allow percentage decimal values so the canvas is slighlty less than 2 times smaller than it should be mm > px.
      // The 'canvasScale' need to be 2.0174 times bigger than the canvas for default sized documents (all A sizes)
      // For business cards the canvas is set at a 1:1 scale and therefore 'canvasScale' needs to be to 1

      var assetPath;
      if(app.isLocalEnv){
        assetPath = 'C:\\Projects\\bemac_discovery\\BeMacDiscovery\\Assets\\';
      }else{
        assetPath = '@';
      }

      var docSettings     = app.c.setDocumentSize(),
          canvasScale     = app.templateType === 'default' ? 2.0174 : 1,
          cordData        = [],
          baseObj         = {},
          destDocWidth    = docSettings[0],
          destDocHeight   = docSettings[1],
          pdfbaseJSON     = {
                              doc : {     
                                _scalex: 1,
                                _scaley: 1,
                                _assetspath: assetPath,
                                // Path to asset root, may need to come from hidden field    
                                page : {
                                  _width: docSettings[0],
                                  _height: docSettings[1],
                                  pdf: {
                                    // _lowresfilename: '',
                                    // _highresfilename: '',
                                    _align: 'left',
                                    _editable: 'false',                                    
                                    _id: 'bglayer',                                    
                                    _lowerleftx: '0',
                                    _lowerlefty: '0',
                                    _orientate: 'north',
                                    _title: 'background',
                                    _upperrightx: destDocWidth,
                                    _upperrighty: destDocHeight,
                                    _verticalalign: 'top'                                    
                                  }
                                }
                              }
                            };
      console.log(docSettings);

      // Create collection of objects for the JSON, which will be converted to XML
      canvasData.forEach(function(el, i) {
        console.log(el);
        // Check if the element has been scaled. If it has then get the scaled value
        var scalex        = el.scaleX === 1 ? 1 : el.scaleX,
            scaley        = el.scaleY === 1 ? 1 : el.scaleY,
            // Width X ElementScale * How much bigger the document is by the canvas
            // Convert that into MM
            // Multiply that by the ratio based on the document size. E.g A3 is 1.4142 Bigger than A4.
            elDimensions  = [
                              app.c.convertUnit((el.width * scalex) * canvasScale, app.mmSize) * docSettings[2],
                              app.c.convertUnit((el.height * scaley) * canvasScale, app.mmSize) * docSettings[2],
                              app.c.convertUnit(el.top * canvasScale, app.mmSize) * docSettings[2],
                              app.c.convertUnit(el.left * canvasScale, app.mmSize) * docSettings[2],
                              destDocWidth,
                              destDocHeight
                            ];
            // Width | Height | Top | Left | DocWidth | DocHeight

        if(el.blocktype === 'new-text-block-group'){
          // Check if it is a text block group
          var textBlockGroupName  = 'text-block-group_' + i;              
          // Create <text-block-group>
          baseObj[textBlockGroupName] = {
            '_align': el.halign,
            '_editable': 'True',
            '_id': 'Group' + i,
            '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
            '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
            '_mandatory': 'False',
            '_orientate': 'north',
            '_spacing': el.spacing,
            '_upperrightx': app.c.calcUpperRightX(elDimensions),
            '_upperrighty': app.c.calcUpperRightY(elDimensions),
            '_verticalalign': el.valign
          };
          el.objects.forEach(function(tEl, i){
            console.log(tEl);
            // Create <text-block>
            var textBlockName  = 'text-block_' + i;         
            baseObj[textBlockGroupName][textBlockName] = {
                                                          // '_colour': app.c.rgbToCMYK(tEl.fontColor),
                                                          '_editable': tEl.isEditable,
                                                          '_font-family': tEl.fontFamily,
                                                          '_font-size': tEl.fontSize, // app.c.convertUnit(tEl.fontSize, app.ptSize),
                                                          '_id': 'TextBlockG_' + i,
                                                          '_leading': tEl.lineheight + '%',
                                                          '_mandatory': tEl.isManditory,
                                                          '_textmode': 'multiline',
                                                          '_title': tEl.label                                                     
                                                        }
            if(tEl.maxLength >= 0 ){
              baseObj[textBlockGroupName]['_maxlen'] = tEl.maxLength;
            }
            if(typeof(tEl.stringSrc) !== 'undefined'){
              baseObj[textBlockGroupName][textBlockName]['_source'] = assetPath + tEl.stringSrc;             
            }
            console.log(typeof(tEl.textVal));
            console.log(tEl.textVal);
            if(typeof(tEl.textVal) !== 'undefined'){
              baseObj[textBlockGroupName][textBlockName]['__text']  = tEl.textVal;
              // app.dummyText.responseText.substr(0, el.maxLength); 
            }
          });                            
          console.log(baseObj);
          cordData.push(baseObj);
        } else if(el.blocktype === 'new-text-block'){
          // If it is a text element that uses an external source, it DOES NOT require a wrapping 'text-block-group'
          // Create <text-block>
          console.log(el);
          var textBlockName  = 'text-block_' + i;
          baseObj[textBlockName] = {
                                    '_align': el.halign,
                                    // '_colour': app.c.rgbToCMYK(el.fontColor),
                                    '_editable': el.isEditable,
                                    // '_fitmethod': 'clip',
                                    '_font-family': el.fontFamily,
                                    '_font-size': el.fontSize, // app.c.convertUnit(el.fontSize, app.ptSize),
                                    '_id': 'TextBlock_' + i,
                                    '_leading': el.lineheight + '%',
                                    '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
                                    '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
                                    '_mandatory': el.isManditory,
                                    '_orientate': 'north',                                    
                                    '_textmode': 'multiline',
                                    '_title': el.blockTitle,
                                    '_upperrightx': app.c.calcUpperRightX(elDimensions),
                                    '_upperrighty': app.c.calcUpperRightY(elDimensions),
                                    '_verticalalign': el.valign                       
                                  }
          if(el.maxLength > 0 ){
            baseObj[textBlockName]['_maxlen'] = el.maxLength;
          }
          if(typeof(el.stringSrc) !== 'undefined'){
            baseObj[textBlockName]['_source'] = assetPath + el.stringSrc;
          }
          console.log(typeof(el.textVal));
          console.log(el.textVal);
          if(typeof(el.textVal) !== 'undefined'){
            baseObj[textBlockName]['__text']  = el.textVal;
            // app.dummyText.responseText.substr(0, el.maxLength); 
          }
          
          cordData.push(baseObj);
        }
        // Otherwise it will be treated as an image block
        else{
          var imgBlockName = 'image_' + i;
          baseObj[imgBlockName] = {
                                    '_align': el.halign,
                                    '_editable': el.isEditable,
                                    '_fitmethod': 'auto',
                                    '_highresfilename': 'demo-800.jpg', //el.src
                                    '_id': el.blockTitle + i,
                                    '_lowerleftx': app.c.calcLowerLeftX(elDimensions),
                                    '_lowerlefty': app.c.calcLowerLeftY(elDimensions),
                                    '_lowresfilename': 'demo-800.jpg',  //el.src
                                    '_mandatory': el.isManditory,
                                    '_orientate': 'north',
                                    '_title': el.blockTitle,
                                    '_upperrightx': app.c.calcUpperRightX(elDimensions),
                                    '_upperrighty': app.c.calcUpperRightY(elDimensions),
                                    '_verticalalign': el.valign
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
      xmlOutput = xmlOutput.replace(/text-block-group_[0-9][0-9]?/g, 'text-block-group');
      xmlOutput = xmlOutput.replace(/text-block_[0-9][0-9]?/g, 'text-block');
      xmlOutput = xmlOutput.replace(/image_[0-9][0-9]?/g, 'image');

      // console.log(app.templateId);
      if(app.isLocalEnv){
        console.log(xmlOutput);
      }else{
        app.c.createTemplate(xmlOutput);
      }      
    },
    createTemplate: function(xml) {
      // Function receives the generated XML from what has been created on the canvas
      // Then POST's that data to the backend to create a new template
      console.log(xml);
      $.ajax({
            url: '/be/api/PDF/Template.ashx',
            type: 'POST',
            dataType: 'json',
            data: {tn : app.templateName,tx : xml, ti : app.imagedata, o : app.orientation, dim : app.docDimesions, id: app.templateId},
            success: function (data) {
                alert('call...sent');
            },
            error: function(data){
              console.log(data);
            }
        });
    },
    calcLowerLeftX: function(elDimensions){
      // Width | Height | Top | Left | DocWidth | DocHeight
      return elDimensions[3]
    },
    calcLowerLeftY: function(elDimensions){
      // Width | Height | Top | Left | DocWidth | DocHeight
      // docHeight - (top + height)
      return elDimensions[5] - (elDimensions[2] + elDimensions[1])
    },
    calcUpperRightX: function(elDimensions){
      // Width | Height | Top | Left | DocWidth | DocHeight
      // documentWidth - (left + width)
      return elDimensions[3] + elDimensions[0]
    },
    calcUpperRightY: function(elDimensions){
      // Width | Height | Top | Left | DocWidth | DocHeight
      // docHeight - top 
      return elDimensions[5] - elDimensions[2]
    },
    calcWidth: function(elDimensions){
      return elDimensions.upperX - elDimensions.lowerX
    },
    calcHeight: function(elDimensions){
      return elDimensions.upperY - elDimensions.lowerY
    },

    /** 
      Click elements
    **/
    bindClickEvents: function(){
      app.$tempActionBtn    = $('.create-template, .update-template');
      app.$downloadThumb    = $('#dl-thumb');
      app.$reserCreateTemp  = $('.reset-create-template');
      app.$toggleGrid       = $('#toggle-grid');
      app.$addTempArea      = $('#add-template-block');
      app.$addBlockToGroup  = $('#at-add-block-to-group');
      app.$saveBlockToGroup = $('#at-save-block-to-group');
      app.$exitBlockToGroup = $('#at-close-block-to-group');
      app.$stepBtns         = $('.step-option-btn');
      app.$newTempBtn       = $('#at-new-template');
      app.$fromTempBtn      = $('.at-from-template');
      app.$documentSizeBtns = $('input[name=doc-size]');
      app.$textComponentOpt = $('.text-editor-option button');
      app.$templateName     = $('#new-template-name');
      app.$toggleElTriggers = $('.js-toggle-target-el');
      app.$updateTbBtn      = $('button[data-action=update-tb-from-tbg]');
      app.$stopTbBtn        = $('button[data-action=stop-tb-from-tbg');

      // Edit Canvas Component Triggers
      app.$delComponentBtn  = $('#at-remove-component');
      app.$editComponentBtn = $('#at-update-component');
      app.$stopComponentBtn = $('#at-stop-update-component');

      // Bind to dom elements to functions
      app.$reserCreateTemp.on('click', app.c.resetTemplate);
      app.$tempActionBtn.on('click', app.c.createTempInit);
      app.$downloadThumb.on('click', app.c.covertCanvasToImgDownload);
      app.$toggleGrid.on('click', app.c.toggleCanvasGrid);
      app.$documentSizeBtns.on('click', app.c.validateDocSize);
      app.$newTempBtn.on('click', app.c.createNewTemp);
      app.$fromTempBtn.on('click', app.c.loadExistingTemp);
      app.$stepBtns.on('click', app.c.steppedOptionHandler);
      app.$addTempArea.on('click', app.c.createTempBlockData);
      app.$addBlockToGroup.on('click', function(){
        app.c.toggleTempGroupOpts();
        app.c.resetGroupTextBlock();
      });
      app.$saveBlockToGroup.on('click', app.c.toggleTempGroupOpts);      
      app.$updateTbBtn.on('click', app.c.updateBlockFromGroup);
      app.$stopTbBtn.on('click', app.c.stopBlockFromGroup);
      app.$exitBlockToGroup.on('click', function(){
        app.c.toggleTempGroupOpts(false);
        app.c.resetGroupTextBlock();
      });
      app.$textComponentOpt.on('click', app.c.setSelectedOption);
      app.$templateName.on('keyup blur', app.c.validateTemplateName);
      app.$toggleElTriggers.on('click', app.c.toggleElements);
      app.$delComponentBtn.on('click', app.c.delTempBlock);
      app.$editComponentBtn.on('click', app.c.editTempBlock);
      app.$stopComponentBtn.on('click', app.c.stopTempBlock);
      $('body').on('click', 'button[data-action=remove-tb-from-tbg]', function(){
        $(this).parent().remove();
        if( $('#at-text-block-group-list li').length > 0){
          $('#at-text-block-group-list li').removeAttr('style');
        }
      });
      $('body').on('click', 'button[data-action=edit-tb-from-tbg]', function(){
        app.c.handleTbgState(true);   
        app.c.editBlockFromGroup($(this));
      });
    },


    /**
      Creation tool end points
    **/
    createTempInit: function(){
      var confrimation;
      // Check if a user is trying to make and update or create a new template
      if($(this).hasClass('update-template')){
        confrimation = confirm("Are you sure you want to update this template? This will effect any products that have been created using this template.");
        // Confrim to the user that they are making an update.
        if (confrimation == true) {
          // Set the templateId so this can be passed through to the POST request and update the correct template
          app.templateId = $('input[name=template-url]:checked').val();
        }
      }

      // Check that if is is an update, they have confirmed they are happy to make it. Otherwise this request is to create a new template
      if(!$(this).hasClass('update-template') || confrimation === true){
        // We are creating a template, rather than updating.
        if(typeof(confrimation) === 'undefined'){
          app.templateId = null;
        } 
        // Remove selected states and grid before saving img
        app.c.cleanCanvas();
        // Create an image from the canvas and add it to the relevant div
        var imgElement = ReImg.fromCanvas(document.querySelector('#c')).toImg(),
        $output = $('#i');
        $output.html('').append(imgElement);
        // Save the image data so this can be used later when saving the image for the template
        app.imagedata = app._canvas.toDataURL('image/png');
        // Enable the grid again
        app.c.toggleCanvasGrid(true);
        // Begin creating the templates' cooridnates/XML
        app.c.generateCords( app.c.generateJSON() );
      }
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