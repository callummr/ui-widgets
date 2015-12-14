var app = app || {};
$(document).ready(function(){
  'use strict';

  // $ = dom elements
  // _ = fabric elements

  // State controllers
  app.gEditActive     = false; // Global active mode
  app.tbgEditActive   = false; // Text Block Group Edit Active

  
  app.ct = {
    initCreateTemp: function(){
      app.ct.bindCreateTemplateClickEvents();
      app.ct.loadTempList();
    },

    /**
      Util functions
    **/
    createFileName: function(extension){
      var filename = $('.canvas-name-field').val() || 'template-download';
      return filename + extension
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
      Working with existing templates
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
        var templatesData = JSON.parse(app.utils.filterResponse(data)),
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
          templateData = JSON.parse(app.utils.filterResponse(data));
          tempJSON = x2js.xml_str2json(templateData[0].XML);
          app.docDimesions = templateData[0].Dimensions.replace(' ', '').split(',');
        }
        // Set the dimensions of the template
        $('#template-size-options').text(app.docDimesions.join(','));
        // Set the name of the template so the user can see once in the edit mode.s
        $('#template-name').text($selectedInput.next().find('.template-name').text());       
        $('#template-tools-navigation').addClass('col-md-4');

        app.ct.loadTempFromJSON(tempJSON);        
      }).fail(function(){
        alert('Load template request failed');
      });
    },    
    loadTempFromJSON: function(canvasData){
      // console.log(canvasData);
      // console.log(canvasData.doc);
      var canvasEl    = document.createElement('canvas'),
          docWidth    = parseInt(canvasData.doc.page._width),
          docHeight   = parseInt(canvasData.doc.page._height);

      // Set the ID of the Canvas      
      canvasEl.setAttribute('id', 'ct_canvas');

      var canvasSettings = app.utils.setCanvasSettings(docWidth, docHeight);
      canvasEl.width  = canvasSettings.width;
      canvasEl.height = canvasSettings.height;

      document.getElementById('template-canvas-container').appendChild(canvasEl);
      app._ct_canvas = new fabric.Canvas('ct_canvas', { selection: false, backgroundColor: '#FFF' });
      app.utils.drawGrid(396, app._ct_canvas); // Pass in the width dynamically so the whole grid is covered
      // Add all of the elements to the page.
      app.ct.createTempBlockFromXML(canvasData.doc.page, canvasSettings.canvasScale);
      app.ct.bindCreateTemplateCanvasEvents();
      app.utils.bindGlobalCanvasEvents();
    },
    createTempBlockFromXML: function(templateJSON, scale){
      // console.log(templateJSON);
      if(typeof(templateJSON['text-block-group']) !== 'undefined'){
          if(typeof(templateJSON['text-block-group'].length) === 'undefined'){
            // Only a single text block group
            templateJSON['text-block-group']['block'] = 'tbg';
            templateJSON['text-block-group']['scale'] = scale;
            app.ct.createTempBlockData(true, templateJSON['text-block-group']);
          }else{
            // Multiple text block groups
            templateJSON['text-block-group'].forEach(function(textBlockGroup){
              textBlockGroup['block'] = 'tbg';
              textBlockGroup['scale'] = scale;
              app.ct.createTempBlockData(true, textBlockGroup);
            });
          }
      }

      if(typeof(templateJSON['text-block']) !== 'undefined'){
        if(typeof(templateJSON['text-block'].length) === 'undefined'){
          // Only a single text block
          templateJSON['text-block']['block'] = 'tb';
          templateJSON['text-block']['scale'] = scale;
          app.ct.createTempBlockData(true, templateJSON['text-block']);
        }else{
          // Multiple text blocks
          templateJSON['text-block'].forEach(function(textBlock){
            textBlock['block'] = 'tb';
            textBlock['scale'] = scale;
            app.ct.createTempBlockData(true, textBlock);
          });
        }
      }

      if(typeof(templateJSON['image']) !== 'undefined'){
        if(typeof(templateJSON['image'].length) === 'undefined'){
          // Only a single image block
          templateJSON['image']['block'] = 'ib';
          templateJSON['image']['scale'] = scale;
          app.ct.createTempBlockData(true, templateJSON['image']);
        }else{
          // Multiple image blocks
          templateJSON['image'].forEach(function(imgBlock){
            imgBlock['block'] = 'ib';
            imgBlock['scale'] = scale;
            app.ct.createTempBlockData(true, imgBlock);
          });
        }
      }
    },


    /**
      Canvas Controls and Events
    **/
    resetTemplate: function(){
      // Check if the canvas exists before trying to clear it.
      if(app._ct_canvas){
        app._ct_canvas.clear();
      }      
      app.docDimesions  = [];
      app.gEditActive   = false;
      app.tbgEditActive = false;
      app.tempGroupCnt  = 0;
      app.tempGBlockCnt = 0
      // Reset the create template tool back to its default
      app.ct.resetCreateTempBlock();
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
      console.log('Called');
      // Hide the edit buttons
      app.ct.toggleTempState(false);

      // Reset the text block group editing settings
      app.ct.handleTbgState(false);
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
       canvasEl.setAttribute('id', 'ct_canvas');

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
      app.ct.setTemplateDetails();

      document.getElementById('template-canvas-container').appendChild(canvasEl);
      app._ct_canvas       = new fabric.Canvas('ct_canvas', { selection: false, backgroundColor: '#FFF' });
      app.ct.bindCreateTemplateCanvasEvents();
      app.utils.drawGrid(396, app._ct_canvas); // Pass in the width dynamically so the whole grid is covered
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
    deactiveCanvasControls: function(){
      // If the edit state is active, hide the edit options
        if(!$('.disabled-in-edit-state').hasClass('hidden')){
          // Hide the edit options
          app.ct.toggleTempState(false);          
        }
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
      // Replace with app.utils.createBlockDataFromXML(data) & app.utils.createBlockDataFromJSON(data);
      if(fromXML === true){
        // console.log(data);
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
          blockSettings.lineheight    = typeof(data._leading) !== 'undefined' ? String(data._leading).replace('%', '') : '100';
          blockSettings.valign        = typeof(data._verticalalign) !== 'undefined' ? data._verticalalign : 'top';
          // Text Block Specific
          blockSettings.fontColor   = app.utils.cmykToRGB(data._colour);
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
        
        // console.log(Math.ceil(app.utils.convertUnit(data._width, app.pxSize)));
        // console.log(Math.ceil( Math.ceil(app.utils.convertUnit(data._width, app.pxSize)) / canvasScale));
        blockDimensions.upperX = Math.ceil(Math.ceil(app.utils.coverUnitFromMM(data._upperrightx, app.pxSize)) / canvasScale);
        blockDimensions.upperY = Math.ceil(Math.ceil(app.utils.coverUnitFromMM(data._upperrighty, app.pxSize)) / canvasScale);
        blockDimensions.lowerX = Math.ceil(Math.ceil(app.utils.coverUnitFromMM(data._lowerleftx, app.pxSize)) / canvasScale);
        blockDimensions.lowerY = Math.ceil(Math.ceil(app.utils.coverUnitFromMM(data._lowerlefty, app.pxSize)) / canvasScale);
        // console.log(blockDimensions);

        // (el.width * scalex) * canvasScale, app.mmSize
        blockSettings.height  = app.utils.calcHeight(blockDimensions);
        blockSettings.left    = blockDimensions.lowerX;
        blockSettings.top     = app._ct_canvas.height - blockDimensions.upperY;
        blockSettings.width   = app.utils.calcWidth(blockDimensions);
        // console.log(blockSettings);

        if(data.block === 'tbg'){
          var listItems = '';
          data['text-block'].forEach(function(block){
            // console.log(block);
            var blockSettings = {};
            // console.log(block);
            blockSettings.isEditable  = typeof(block._editable) !== 'undefined' ? block._editable : 'false';
            blockSettings.isManditory = typeof(block._mandatory)!== 'undefined' ? block._mandatory : 'false';
            blockSettings.fface       = typeof(block['_font-family']) !== 'undefined' ? block['_font-family'] : 'FuturaBT-Book';
            blockSettings.fontColor   = app.utils.cmykToRGB(block._colour);
            blockSettings.fontSize    = typeof(block['_font-size']) !== 'undefined' ? block['_font-size'] : 12;
            blockSettings.lineheight  = typeof(block._leading)  !== 'undefined' ? String(block._leading).replace('%', '') : '100';
            blockSettings.id          = typeof(block._id) !== 'undefined' ? block._id : 'false';
            blockSettings.label       = typeof(block._title) !== 'undefined' ? block._title : 'false';
            blockSettings.maxLength   = typeof(block._maxlen) !== 'undefined' ? block._maxlen : '';
            if(typeof(block._source) !== 'undefined'){
              blockSettings.stringSrc = block._source;
            }
             if(typeof(block.__text) !== 'undefined'){
              blockSettings.textVal = block.__text;
            }
            listItems += app.ct.textBlockHtmlSnippet(blockSettings);
          });
          $('#at-text-block-group-list').append(listItems);
          app.ct.createTempBlockGroup(blockSettings);
        }else{
          app.ct.createTempBlockRegular(blockSettings)
        }
        // console.log(blockSettings);
      }else{
        blockType = app.ct.setBlockType($('input[name=template-block-type]:checked').val());
        blockSize = app.ct.setAspectRatio($('input[name=block-ratio]:checked').val()); // This returns and array

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
          app.ct.createTempBlockRegular(blockSettings);
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
          app.ct.createTempBlockRegular(blockSettings);
        } else if(blockType === 'tbg'){
          // If is a text block group

          blockSettings.blocktype   = 'new-text-block-group';
          blockSettings.height      = 200;
          blockSettings.spacing     = parseInt($('#at-spacing-g').val());
          blockSettings.width       = 200;
          //console.log(blockSettings);
          app.ct.createTempBlockGroup(blockSettings);
        } else{
          // This is a line block
          blockSettings.blocktype   = 'new-line-block';
          app.ct.createTempBlockLine(blockSettings);
        }
      }
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
        var _tblocks = app.ct.createTempBlockGroupItem($textBlockList.find('li'), $('#at-spacing-g'));
          // Add each block to the exiting group
          console.log(_block);
          _tblocks.forEach(function(block){
            console.log(block);
            // Add each block to the group
            _block.add(block);
          });
        // Add the group to the canvas
        app._ct_canvas.add(_block); 
      }else if($textBlockList.find('li').length > 0){
        // Use the settings from 'blockSettings' object if this is a new group
        var _tblocks = app.ct.createTempBlockGroupItem($textBlockList.find('li'), blockSettings.spacing);
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
        console.log(_tblockg);
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
        app._ct_canvas.add(_tblockg);        
      }else{
        alert('No text blocks added to text block group. Please try again');
      }

      // Empty the list when complete
      $textBlockList.empty();
      // Add the group to the canvas
      app._ct_canvas.renderAll();  

      // Empty the input field with the previous component name.
      app.ct.resetCreateTempBlock();
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
      
      // Add additional non-block specific properties based on blocktype
      _block['blocktype']     = blockSettings.blocktype;
      _block['blockTitle']    = blockSettings.blockTitle;
      _block['halign']        = blockSettings.halign;
      _block['isEditable']    = blockSettings.isEditable; 
      _block['isManditory']   = blockSettings.isManditory;  
      _block['parentid']      = blockSettings.parentid;
      _block['valign']        = blockSettings.valign;
      // console.log(blockSettings);
      // Add additional properties based on blocktype
      if(blockSettings.blocktype === 'new-text-block'){          
        _block['fontColor']   = blockSettings.fontColor;
        _block['fontFamily']  = blockSettings.fontFamily;
        _block['fontSize']    = parseInt(blockSettings.fontSize);
        _block['lineheight']  = String(blockSettings.lineheight).replace('%', '');
        _block['maxLength']   = parseInt(blockSettings.maxLength);
        _block['stringSrc']   = blockSettings.stringSrc;
        _block['textVal']     = blockSettings.textVal;
      } 

      // console.log('Before adding: ', _block);
      // console.log(blockType);
      // Add the new component to the canvas. This needs to be done, before we can update the background img of the object
      app._ct_canvas.add(_block);
      
      // Set the relevant background image for block, based on blocktype
      app.ct.setTempBlockBackgroundImg(_block, app.ct.setBlockType($('input[name=template-block-type]:checked').val()));
      // Empty the input field with the previous component name.
      app.ct.resetCreateTempBlock();
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
      app._ct_canvas.add(_block);
      // Set the relevant background image for block, based on blocktype
      app.ct.setTempBlockBackgroundImg(_block, blockType);
      // Empty the input field with the previous component name.
      app.ct.resetCreateTempBlock();
    },
    editTempBlock: function(){
      var _block    = app._ct_canvas.getActiveObject(),
          blockType = app.ct.setBlockType($('input[name=template-block-type]:checked').val());
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
            app.ct.createTempBlockGroup( $('#at-text-block-group-list').find('li'), _block);
          }else{
            alert('The text block does not contain any text blocks, so it will be removed.');
            app._ct_canvas.remove(_block);
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
        app.ct.setTempBlockBackgroundImg(_block, blockType);
      }      
      // Reset the component creation tool.
      app.ct.resetCreateTempBlock();
      // De-select the element previously selected on the canvas
      app._ct_canvas.deactivateAll().renderAll();
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
      app.ct.handleTbgState(false);
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
      app.ct.stopBlockFromGroup();
      // Update the Edit active state
      app.tbgEditActive = false;
    },
    stopBlockFromGroup: function(){
      app.ct.handleTbgState(false);
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
      var test = app._ct_canvas.getActiveGroup();
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
          blockHTML = app.ct.textBlockHtmlSnippet(blockDetails);
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
          app._ct_canvas.renderAll();
        });
      }
    },
    delTempBlock: function(){
      // Get the select fabric object and remove it.
      var _activeObject = app._ct_canvas.getActiveObject();
      console.log(_activeObject);
      // Remove the item from the canvas
      app._ct_canvas.remove(_activeObject).renderAll();
      // Reset the component creation tool.
      app.ct.resetCreateTempBlock();
      // Upadate Global Edit State
      app.gEditActive = false;
    },
    stopTempBlock: function(){
      // De-select the element previously selected on the canvas
      app._ct_canvas.deactivateAll().renderAll();
      // Reset the component creation tool.
      app.ct.resetCreateTempBlock();
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
    bindCreateTemplateCanvasEvents: function(){
      // This event handles whether to enter edit mode or not
      app._ct_canvas.on('object:selected', function(e) {
        // Set the global edit state
        app.gEditActive = true;
        // Set the block settings to what the currently selected blocks settings are
        app.ct.setTempBlockSettings(app._ct_canvas.getActiveObject());
        // Show the edit options
        app.ct.toggleTempState(true);
      });
      app._ct_canvas.on('mouse:down', function(e) {
        // console.log(e);
        // console.log(typeof(e.target) !== 'undefined');
        // console.log(typeof(e.target._objects) !== 'undefined');
        // console.log(e.target.blocktype !== 'new-text-block-group');
        // Checks if the canvas itself has been clicked. If it has been clicked, then get out of edit mode
        if(typeof(e.target) !== 'undefined' && typeof(e.target._objects) !== 'undefined' && e.target.blocktype !== 'new-text-block-group'){
          // Reset Create template options
          app.ct.resetCreateTempBlock();
          // Hide the edit options
          app.ct.toggleTempState(false);
        }        
      });
      $('.template-container').on('click', app.ct.deactiveCanvasControls);
    },


    /**
      UI Specific Functions
    **/
    setSelectedOption: function(){
      var $this = $(this);
      $this.siblings().removeClass('option-selected').end()
           .addClass('option-selected');
    },
    showTemplates: function($el){
      console.log($el);
      var $templateControlsContainer = $('#template-tools-navigation'),
          $templateCanvasContainer   = $('.new-template-container');
      if($el.attr('id') === 'at-show-templates'){
        $templateControlsContainer.removeClass('col-md-4'); 
      }else{
        $templateControlsContainer.addClass('col-md-4')
      }

      if($el.hasClass('at-from-template')){        
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
        app.ct.addBlockToGroup(app.tempGBlockCnt);
        app.ct.resetGroupTextBlock();
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

      blockHTML = app.ct.textBlockHtmlSnippet(blockDetails);
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
      Click elements
    **/
    bindCreateTemplateClickEvents: function(){
      app.$tempActionBtn    = $('.create-template, .update-template');
      
      app.$reserCreateTemp  = $('.reset-create-template');
      app.$addTempArea      = $('#add-template-block');
      app.$addBlockToGroup  = $('#at-add-block-to-group');
      app.$saveBlockToGroup = $('#at-save-block-to-group');
      app.$exitBlockToGroup = $('#at-close-block-to-group');
      app.$stepBtns         = $('.step-option-btn:not(.at-from-template)');
      app.$newTempBtn       = $('#at-new-template');
      app.$fromTempBtn      = $('.at-from-template');
      app.$documentSizeBtns = $('input[name=doc-size]');
      app.$textComponentOpt = $('.text-editor-option button');
      app.$templateName     = $('#new-template-name');
      app.$toggleElTriggers = $('.js-toggle-target-el');
      app.$updateTbBtn      = $('[data-action=update-tb-from-tbg]');
      app.$stopTbBtn        = $('[data-action=stop-tb-from-tbg');

      // Edit Canvas Component Triggers
      app.$delComponentBtn  = $('#at-remove-component');
      app.$editComponentBtn = $('#at-update-component');
      app.$stopComponentBtn = $('#at-stop-update-component');

      // Bind to dom elements to functions
      app.$reserCreateTemp.on('click', app.ct.resetTemplate);
      app.$tempActionBtn.on('click', app.ct.createTempInit);
      app.$tmplToggleBtn = $('.template-container [data-action=toggle-grid]');
      app.$tmplToggleBtn.on('click', function(){
        app.utils.toggleCanvasGrid($(this), false, app._ct_canvas);
      });
      $('.template-container [data-action=download-thumbnail]').on('click', function(){
        console.log(app._ct_canvas);
        app.utils.covertCanvasToImgDownload($(this), app._ct_canvas);
      });
      app.$documentSizeBtns.on('click', app.ct.validateDocSize);
      app.$newTempBtn.on('click', app.ct.createNewTemp);
      app.$stepBtns.on('click', function(){
        app.utils.steppedOptionHandler($(this));
      });
      app.$fromTempBtn.on('click', function(){
        var $this = $(this);
        app.utils.steppedOptionHandler($this);
        app.ct.toggleTempState(false);
        app.ct.loadExistingTemp();
      });     
      app.$addTempArea.on('click', app.ct.createTempBlockData);
      app.$addBlockToGroup.on('click', function(){
        app.ct.toggleTempGroupOpts();
        app.ct.resetGroupTextBlock();
      });
      app.$saveBlockToGroup.on('click', app.ct.toggleTempGroupOpts);      
      app.$updateTbBtn.on('click', app.ct.updateBlockFromGroup);
      app.$stopTbBtn.on('click', app.ct.stopBlockFromGroup);
      app.$exitBlockToGroup.on('click', function(){
        app.ct.toggleTempGroupOpts(false);
        app.ct.resetGroupTextBlock();
      });
      app.$textComponentOpt.on('click', app.ct.setSelectedOption);
      app.$templateName.on('keyup blur', app.ct.validateTemplateName);
      app.$toggleElTriggers.on('click', app.ct.toggleElements);
      app.$delComponentBtn.on('click', app.ct.delTempBlock);
      app.$editComponentBtn.on('click', app.ct.editTempBlock);
      app.$stopComponentBtn.on('click', app.ct.stopTempBlock);
      $('body').on('click', 'button[data-action=remove-tb-from-tbg]', function(){
        $(this).parent().remove();
        if( $('#at-text-block-group-list li').length > 0){
          $('#at-text-block-group-list li').removeAttr('style');
        }
      });
      $('body').on('click', 'button[data-action=edit-tb-from-tbg]', function(){
        app.ct.handleTbgState(true);   
        app.ct.editBlockFromGroup($(this));
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
        // Set what type of request this is. Required by the utils.generateXML 
        app.isCreateTemplate = true;        
        app.isCreateProduct  = false;
        app.isUpdateProduct  = false;
        // We are creating a template, rather than updating.
        if(typeof(confrimation) === 'undefined'){
          app.templateId = null;
        } 
        // Create a preview image on the page of what is on the canvas
        app.utils.generateCanvasPreviewImg(app._ct_canvas, 'ct');
        // Begin creating the templates' cooridnates/XML
        app.utils.generateCords( app.utils.generateJSON(app._ct_canvas) );
      }
    },
  };

  app.ct.initCreateTemp();
});