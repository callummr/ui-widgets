var app = app || {};
(function(){
	'use strict';
	// $ = dom elements
	// _ = fabric elements

	app.blockScale 		= 1;
	app.textBlockGroups = [];
	app._activeEditEl   = null;

	app.cp = {
		/**
			Initiliase Create Product Functionality
		**/ 
		initCreateProduct: function(){
			app.cp.loadProductList();
			app.cp.bindCreateProductClickEvents();
		},

		/**
			DOM MANIPULATION
		**/
		setActiveBlock: function(){
			var $firstBlockitem = $('#product-blocks-list .list-group-item:first-child');
			$firstBlockitem.find('.cp-block-container').removeClass('hidden');
			$firstBlockitem.find('button').addClass('toggle-active');
			app.cp.setActiveCanvasObj($firstBlockitem.data('prodblockid'));
		},
		toggleOptions: function($el, secondaryClass){
	    	// Expects an element that has been clicked, which sits inside a container
	    	// Check if the button clicked is already active.
	    	if(!$el.hasClass('toggle-active')){
	    		// Hide all of the elements with the secondary class
	    		$el.parent().siblings().find(secondaryClass).addClass('hidden');
	    		// Removeclass off of all toggle buttons
	    		$el.parent().siblings().find('[data-action=toggle-product-block]').removeClass('toggle-active');

	    	   	// $el.parent().removeClass('hidden');

	    	   	$el.parent().find(secondaryClass).removeClass('hidden');
	    	   	$el.addClass('toggle-active');
	    	}
	    },
	    toggleEditTbFromTbg: function(){
	    	$(this).next().removeClass('hidden');
	    	$(this).parent().siblings().find('.edit-tb-defaults-container').addClass('hidden');
	    },
	    closeEditTbFromTbg: function(){
	    	$(this).parents('.edit-tb-defaults-container').addClass('hidden');
	    },


		/**
	      LOAD AN EXISITNG PRODUCT
	    **/ 
		loadProductList: function(){
			$('#product-list').remove();
      		$('#dynamic-product-templates').removeClass('hidden');
			$.ajax({
				url: app.templateDatURL,
				dataType: 'text'
			})
			.done(function(data){
				// Filter the response and then create JSON        
				var templatesData = JSON.parse(app.utils.filterResponse(data)),
				    prodString = '';
				// console.log(templatesData);
				// console.log(JSON.parse(data));

				templatesData.forEach(function(template){
					prodString+= app.cp.createProductList(template);
				});
				$('#dynamic-product-templates').append(prodString);
				$('#dynamic-product-templates .template-selection').first().prop('checked', true);
			});
		},
		loadExistingProduct: function(){
	      	var x2js  = new X2JS(),
	         	ajaxUrl,
	          	$this = $(this);

	    	app.utils.steppedOptionHandler($this);
	     	app.templateId = $this.data('tempid'); 

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
				var productData, 
					productJSON;

				if(app.isLocalEnv){
					productData = data;
					productJSON = x2js.xml2json(productData);
				}else{
					productData = JSON.parse(app.utils.filterResponse(data));
					productJSON = x2js.xml_str2json(productData[0].XML);
					app.docDimesions = productData[0].Dimensions.replace(' ', '').split(',');
				}
				// Set the dimensions of the template
				$('#template-size-options').text(app.docDimesions.join(','));
				// Set the name of the template so the user can see once in the edit modes
				$('#template-name').text($this.next().find('.template-name').text());
				// Create the Canvas Element based of JSON created from the XML
				app.cp.loadProductFromJSON(productJSON);				        
			}).fail(function(){
				alert('Load product request failed');
			});
	    },
	    loadProductFromJSON: function(canvasData){
	      // console.log(canvasData);
	      // console.log(canvasData.doc);
	      var canvasEl    = document.createElement('canvas'),
	          docWidth    = parseInt(canvasData.doc.page._width),
	          docHeight   = parseInt(canvasData.doc.page._height);

	      // Set the ID of the Canvas      
	      canvasEl.setAttribute('id', 'c');

	      var canvasSettings = app.utils.setCanvasSettings(docWidth, docHeight);

	      canvasEl.width  = canvasSettings.width;
	      canvasEl.height = canvasSettings.height;
	      app.blockScale  = canvasSettings.canvasScale;

	      document.getElementById('canvas-container').appendChild(canvasEl);
	      app._canvas = new fabric.Canvas('c', { selection: false, backgroundColor: '#FFF' });
	      app.utils.drawGrid(396); // Pass in the width dynamically so the whole grid is covered
	      // Add all of the elements to the page.
	      app.cp.createProductBlocksSettings(canvasData.doc.page);
	      app.cp.bindCreateProductCanvasEvents();
	      app.utils.bindGlobalCanvasEvents();
	    },
	    createProductBlocksSettings: function(productData){
	    	// console.log(productData);
	    	var blockListingString = '';
	    	if(typeof(productData['text-block-group']) !== 'undefined'){
		         if(typeof(productData['text-block-group'].length) === 'undefined'){
		            // Only a single text block group
		            productData['text-block-group']['block'] = 'tbg';
		            productData['text-block-group']['scale'] = app.blockScale;
		            blockListingString+= app.cp.createTextBlockGroupBlockSettings(productData['text-block-group']);
		            app.cp.createBlockDataFromXML(productData['text-block-group']);
		        } else{
		            // Multiple text block groups
		            productData['text-block-group'].forEach(function(textBlockGroup){
		              textBlockGroup['block'] = 'tbg';
		              textBlockGroup['scale'] = app.blockScale;
		              blockListingString+= app.cp.createTextBlockGroupBlockSettings(textBlockGroup);
		              app.cp.createBlockDataFromXML(textBlockGroup);
		            });
		        }
		    }

		    if(typeof(productData['text-block']) !== 'undefined'){
		        if(typeof(productData['text-block'].length) === 'undefined'){
		          // Only a single text block
		          productData['text-block']['block'] = 'tb';
		          productData['text-block']['scale'] = app.blockScale;
		          blockListingString+= app.cp.createTextBlockBlockSettings(productData['text-block'], false);
		          app.cp.createBlockDataFromXML(productData['text-block']);
		        } else{
		          // Multiple text blocks
		          productData['text-block'].forEach(function(textBlock){
		            textBlock['block'] = 'tb';
		            textBlock['scale'] = app.blockScale;
		            blockListingString+= app.cp.createTextBlockBlockSettings(textBlock, false);
		            app.cp.createBlockDataFromXML(textBlock);
		          });
		        }
		    }

		    if(typeof(productData['image']) !== 'undefined'){
		        if(typeof(productData['image'].length) === 'undefined'){
		          // Only a single image block
		          productData['image']['block'] = 'ib';
		          productData['image']['scale'] = app.blockScale;
		          blockListingString+= app.cp.createImageBlockSettings(productData['image']);
		          app.cp.createBlockDataFromXML(productData['image']);
		        } else{
		          // Multiple image blocks
		          productData['image'].forEach(function(imgBlock){
		            imgBlock['block'] = 'ib';
		            imgBlock['scale'] = app.blockScale;
		            blockListingString+= app.cp.createImageBlockSettings(imgBlock);
		            app.cp.createBlockDataFromXML(imgBlock);
		          });
		        }
		     }
	    	$('#product-blocks-list').append(blockListingString);

	    	// Filter all canvas objects except the grid which is the first object
	    	app.utils.createFilteredCanvasObjects();
	    		
	    	app.cp.reformatTextBlockGroups();
	    	// app.cp.setActiveBlock();
	    	// console.log(app._canvas);
	    },

	    // HTML BLOCKS
	    createImageBlockSettings: function(imgBlock){
	    	var imgBlockString = '',
	    		blockId		   = imgBlock._id.replace(' ', '');
	    	// console.log(imgBlock);
	    	imgBlockString+= '<li class="clearfix list-group-item" data-prodblockid="' + blockId + '">';
	    		imgBlockString+= '<button type="button" class="btn btn-info pull-top-right" data-action="toggle-product-block">X</button>';
	    		imgBlockString+= '<h2 class="block-item-heading">' + imgBlock._title + '</h2>';
	    			imgBlockString+= '<div class="cp-block-container hidden">';			    		
			    		imgBlockString+= '<input type="text" class="form-control" value="' + imgBlock._title +'" />';
			    		imgBlockString+= '<div class="clearfix">';
				    		// V Align & H Align Settings
				    		imgBlockString+= app.cp.createAlignmentSettings(blockId, imgBlock._align, imgBlock._verticalalign);
				    	imgBlockString+= '</div>';				    		
				    	imgBlockString+= '<div class="clearfix">';
				    		// Editable & Manditory Settings
				    		imgBlockString+= app.cp.createUserSettings(blockId, imgBlock._editable, imgBlock._mandatory);
				    	imgBlockString+= '</div>';
			    	imgBlockString+= '</div>';
	    	imgBlockString+= '</li>';
			//console.log(imgBlockString); 

	    	return imgBlockString;
	    },
	    createTextBlockGroupBlockSettings: function(tbgBlock){
	    	var tbgBlockString = '',
	    		blockId 	   = tbgBlock._id.replace(' ', '');

	    	tbgBlockString+= '<li class="clearfix list-group-item" data-prodblockid="' + blockId + '">';
	    		tbgBlockString+= '<button type="button" class="btn btn-info pull-top-right" data-action="toggle-product-block">X</button>';
	    		tbgBlockString+= '<h2 class="block-item-heading">' + tbgBlock._title + '</h2>';
    			tbgBlockString+= '<div class="cp-block-container hidden">';			    		
		    		tbgBlockString+= '<input type="text" class="form-control" value="' + tbgBlock._title +'" />';
		    		// Block Spacing Setting
		    		tbgBlockString+= app.cp.createSpacingSetting(blockId, tbgBlock._spacing);
		    		tbgBlockString+= '<div class="clearfix">';
			    		// V Align & H Align Settings
			    		tbgBlockString+= app.cp.createAlignmentSettings(blockId, tbgBlock._align, tbgBlock.__verticalalign);
			    	tbgBlockString+= '</div>';
			    	tbgBlockString+= '<div class="clearfix">';
			    		// Editable & Manditory Settings
			    		tbgBlockString+= app.cp.createUserSettings(blockId, tbgBlock._editable, tbgBlock._mandatory);
			    	tbgBlockString+= '</div>';
		    		// Create the list of text blocks with text bloxk group
		    		tbgBlockString+= app.cp.createTbBlockFromTbgList(blockId, tbgBlock['text-block']);
		    	tbgBlockString+= '</div>';
	    	tbgBlockString+= '</li>';

			// console.log(tbgBlockString); 
	    	return tbgBlockString;
	    },
	    createTextBlockBlockSettings: function(tBlock, fromTbg){
	    	var tBlockString = '',
	    		blockId 	 = tBlock._id.replace(' ', '');

	    	if(fromTbg === false){
	    		tBlockString+= '<li class="clearfix list-group-item" data-prodblockid="' + blockId + '">';
	    			tBlockString+= '<h2 class="block-item-heading">' + tBlock._title + '</h2>';
	    			tBlockString+= '<button type="button" class="btn btn-info pull-top-right" data-action="toggle-product-block">X</button>';
		    		// Need to hidden active class to button conditionally;
		    		tBlockString+= '<div class="cp-block-container hidden">';
	    	}else{
	    		tBlockString+= '<div class="clearfix text-block-defaults-container" data-prodblockid="' + blockId + '">';
	    			tBlockString+= '<h2 class="block-item-heading">' + tBlock._title + '</h2>';
	    	}	    	
		    		// Block Title
		    		tBlockString+= '<input type="text" class="form-control" value="' + tBlock._title +'" />';
		    		// FFACE
		    		tBlockString+= app.cp.createFontFaceSetting(blockId, tBlock['_font-family']);
		    		// SIZE	    		
		    		tBlockString+= app.cp.createFontSizeSetting(blockId, tBlock['_font-size']);
		    		// Color Settings
		    		tBlockString+= app.cp.createFontColorSetting(blockId, tBlock._colour);
		    		tBlockString+= '<div class="clearfix">';
			    		// Maxlength Setting
			    		tBlockString+= app.cp.createMaxLengthSetting(blockId, tBlock._maxlen);
			    		// Lineheight Setting
			    		tBlockString+= app.cp.createlineHeightSetting(blockId, tBlock._leading);
			    	tBlockString+= '</div>';
			    	tBlockString+= '<div class="clearfix">';
			    		// V Align & H Align Settings
			    		tBlockString+= app.cp.createAlignmentSettings(blockId, tBlock._align, tBlock.__verticalalign);
			    	tBlockString+= '</div>';
			    	tBlockString+= '<div class="clearfix">';
			    		// Editable & Manditory Settings
			    		tBlockString+= app.cp.createUserSettings(blockId, tBlock._editable, tBlock._mandatory);
			    	tBlockString+= '</div>';
		    		// Set the text value for the user
		    		tBlockString+= app.cp.createTextSettings(blockId, tBlock);

		    if(fromTbg === false){
		    		tBlockString+= '</div>';
	    		tBlockString+= '</li>';
	    	}else{
	    		tBlockString+= '</div>';
	    	}

	    	return tBlockString;
	    },

	    /**
	      CANVAS CONTROLS & EVENTS
	    **/

	    createBlockDataFromXML: function(data){
	    	// console.log(data);
	    	var blockType,
		        blockSettings = {},
		        blockSize;
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
				blockSettings.fontFamily  = typeof(data['_font-family']) !== 'undefined' ? data['_font-family'] : 'FuturaBT-Book';
				blockSettings.fontSize    = typeof(data['_font-size']) !== 'undefined' ? data['_font-size'] : '12';
				blockSettings.maxLength   = typeof(data._maxlen) !== 'undefined' ? data._maxlen : '';
				blockSettings['text-block-type'] = 'text';
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
	        // Set parent id, to the root element
	        blockSettings.parentid    = typeof(data._id) !== 'undefined' ? data._id : '';
	        blockSettings.id    	  = typeof(data._id) !== 'undefined' ? data._id : '';
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
	        blockSettings.top     = app._canvas.height - blockDimensions.upperY;
	        blockSettings.width   = app.utils.calcWidth(blockDimensions);
	        // console.log(blockSettings);
	        if(data.block === 'ib'){
	        	app.cp.createProductImageBlock(blockSettings);
	        } else if(data.block =='tb'){
	        	app.cp.createProductTextBlock(blockSettings);
	        } else if(data.block === 'tbg'){
	        	app.textBlockGroups.push({
					id: blockSettings.parentid,
					width: blockSettings.width,
					height: blockSettings.height
				});
	         	data['text-block'].forEach(function(block, i){
		            // console.log(block);
		            var innerBlockSettings = {};
		            // console.log(block);
		            innerBlockSettings.blocktype   = 'new-text-block';
		            innerBlockSettings.blockTitle  = typeof(block._title) !== 'undefined' ? block._title : '';
		          	innerBlockSettings.halign      = blockSettings.halign;  // Take from the parent element
		            innerBlockSettings.isEditable  = typeof(block._editable) !== 'undefined' ? block._editable : 'false';
		            innerBlockSettings.isManditory = typeof(block._mandatory)!== 'undefined' ? block._mandatory : 'false';
		            innerBlockSettings.fontFamily  = typeof(block['_font-family']) !== 'undefined' ? block['_font-family'] : 'FuturaBT-Book';
		            innerBlockSettings.fontColor   = app.utils.cmykToRGB(block._colour);
		            innerBlockSettings.fontSize    = typeof(block['_font-size']) !== 'undefined' ? block['_font-size'] : 12;
		            innerBlockSettings.lineheight  = typeof(block._leading)  !== 'undefined' ? String(block._leading).replace('%', '') : '100';
		            innerBlockSettings.id          = typeof(block._id) !== 'undefined' ? block._id : 'false';
		            innerBlockSettings.parentid    = blockSettings.parentid; // Take from the parent element
		            innerBlockSettings.parentWidth = blockSettings.width;    // Take from the parent element
		            innerBlockSettings.label       = typeof(block._title) !== 'undefined' ? block._title : 'false';
		            innerBlockSettings.maxLength   = typeof(block._maxlen) !== 'undefined' ? block._maxlen : '';
		            innerBlockSettings.valign      = blockSettings.valign;  // Take from the parent element
		            innerBlockSettings.top		   = blockSettings.top;     // Take from the parent element
		            innerBlockSettings.width	   = blockSettings.width;   // Take from the parent element
		            innerBlockSettings.left   	   = blockSettings.left;    // Take from the parent element	            
		            innerBlockSettings.spacing     = blockSettings.spacing; // Take from the parent element	            
		            //console.log(block._source);
		            if(typeof(block._source) !== 'undefined' && block._source !== ''){
		              innerBlockSettings.stringSrc = block._source;
		            }
		            if(typeof(block.__text) !== 'undefined'){
		              innerBlockSettings.textVal = block.__text;
		            }
		            //console.log(innerBlockSettings);
		            app.cp.createProductTextBlock(innerBlockSettings);
	          	});
	        }
	        // console.log(blockSettings);
	    },
	    createProductImageBlock: function(blockSettings){
			// Create the fabric js element on the canvas
		    // Use the settings from 'blockSettings' object
		    //console.log(blockSettings);
		    var _block = new fabric.Rect({
	                                    hasBorders: true,
	                                    hasRotatingPoint: false,
	                                    height: blockSettings.height,
	                                    left: blockSettings.left,
	                                    lockRotation: true,
	                                    selectable: false,
	                                    top: blockSettings.top,
	                                    width: blockSettings.width
	                                  });
	      
		    // Add additional non-block specific properties based on blocktype
		    _block['blocktype']     = blockSettings.blocktype;
		    _block['blockTitle']    = blockSettings.blockTitle;
		    _block['halign']        = blockSettings.halign;
		    _block['isEditable']    = blockSettings.isEditable; 
		    _block['isManditory']   = blockSettings.isManditory;  
		    _block['parentid']      = blockSettings.parentid;
		    _block['id']      		= blockSettings.id;
		    _block['valign']        = blockSettings.valign;

	    	// console.log(_block);

			// If a product... then will need to load image settings.
			// If it has a default image, set it as the background image.

	    	// Add the new component to the canvas. This needs to be done, before we can update the background img of the object
	    	app._canvas.add(_block).renderAll();
	    },
	    createProductTextBlock: function(blockSettings){
	   		// Create the fabric js element on the canvas using the settings from 'blockSettings' object
	   		
	    	// Set the text of the element
	    	// console.log(blockSettings);
	    	if(typeof(blockSettings.stringSrc) !== 'undefined'){
	    		// Ajax request to the source of the asset.	    		
	    		blockSettings.textVal = 'Organised in aid of Macmillan Cancer Support, registered charity in England and Wales (261017), Scotland (SC039907) and the Isle of Man (604). Also operating in Northern Ireland.';
	    		// If text is from a source, then it should not be editable.
	    		blockSettings.isEditable === false;
	    	} else if(typeof(blockSettings.textVal) === 'undefined' || blockSettings.textVal === ''){
	    		blockSettings.textVal  = 'Default Text';
	    	}

	    	// Create Boolean to test if this block is from a source file or free text
	    	var fromTextSrc = typeof(blockSettings.stringSrc) !== 'undefined' ? true : false;

	      	var _block,
	      		_formattedBlock;

	      	_block = new fabric.Text(blockSettings.textVal, {
	      				  										fill: app.utils.cmykToRGB(blockSettings.fontColor),	
										                        fontFamily: blockSettings.fontFamily,
										                        fontSize: parseInt(blockSettings.fontSize), // Need to convert PT to Pixel here
											      				hasBorders: true,
										                        hasRotatingPoint: false,
										                        height: blockSettings.height,
										                        left: blockSettings.left,
										                        // lineHeight: String(blockSettings.lineheight).replace('%', ''), TODO
										                        lockRotation: true,
										                        selectable: false,                                             
										                        textAlign: blockSettings.halign,
										                        top: blockSettings.top, 
										                        width: blockSettings.width
															});

	      	// This additional property is required within the wrapCanvasText function
	      	if(fromTextSrc){
	      		_block['text-block-type'] = 'text';
	      		blockSettings.textblocktype = 'text';
	      	} else{
	      		_block['text-block-type'] = 'itext';
	      		blockSettings.textblocktype = 'itext';
	      	}

	      	// Sort the wrapping out for the text element, requires:
	      	// fabric block, the canvas, maxWidth, maxHeight, alignment
	
	      	_formattedBlock	= app.utils.wrapCanvasText(_block, app._canvas, blockSettings.width, 0, blockSettings.halign);
	      	_formattedBlock.width = blockSettings.width;
	    	
	    	// console.log(blockSettings);
	    	 console.log(_formattedBlock.width);
	      
	    	// Add additional block proprties to the newly formatted block;
	    	var _updatedBlock = app.utils.setTextBlockSettings(_formattedBlock, blockSettings);
	    	console.log(_updatedBlock.width);

	      	// Add the new component to the canvas. This needs to be done, before we can update the background img of the object
	      	app._canvas.add(_updatedBlock).renderAll();
	      	// console.log(app._canvas);
	    },

	    deactiveCanvasObj: function(){
	    	app._canvas.deactivateAll().renderAll();
	    },
	    reformatTextBlockGroups:function(){
	    	// For each text block group in the array, format the text blocks inside it.
	    	app.textBlockGroups.forEach(function(block){
	    		app.filteredCanvasObjs.forEach(function(obj,i){
	    			// console.log(block.id, obj.parentid, obj);
	    			if(block.id === obj.parentid){
	    				var prevObjIndex = i > 0 ? i - 1 : 0;
	    				// console.log(prevObjIndex, app.filteredCanvasObjs[prevObjIndex].top, app.filteredCanvasObjs[prevObjIndex].height, app.filteredCanvasObjs[prevObjIndex].spacing );
	    				obj.set({
	    					width: block.parentWidth,
	    					top: app.filteredCanvasObjs[prevObjIndex].top + app.filteredCanvasObjs[prevObjIndex].height + 10 // Need to add spacing
	    				});	    				
	    			}
	    			app._canvas.renderAll();
	    		});
	    		// Find the elements were the group matches the id + -group
	    		// Then apply make the width 100% of its parent
	    		// Then set the top value based off of the objects around it.
	    	});
	    },	    	    
	    updateCanvasBlockText: function(){
	    	var $textarea	   = $(this),
	    		newTextVal 	   = $textarea.val(),
	    		canvasBlockId  = $textarea.parents('[data-prodblockid]').data('prodblockid') || $textarea.parent('[data-prodblockid]').data('prodblockid');

	    	// before running the foreach check if a variable exists with the obj that is needed to be updated.

	    	if(app._activeEditEl === null){
	    		app.filteredCanvasObjs.forEach(function(block){
		    		if(block.id === canvasBlockId){
		    			app._activeEditEl = block;
		    		}	    		
		    	});
	    	}

	    	// console.log(app.filteredCanvasObjs, canvasBlockId, app._activeEditEl);
	    	app._canvas.setActiveObject(app._activeEditEl);
	    	app._activeEditEl.set({
	    		text: newTextVal,
	    		textVal: newTextVal
	    	});

	    	// Update the text of the canvas element
	    	// Then reformat it
	    	// Then update canvas (renderall)
	    	app._canvas.renderAll();
	    },
	    setActiveCanvasObj: function(id){
	    	// This function sets the relevant canvas object to its active state 
	    	var _canvasObjs = app._canvas._objects;
	    	_canvasObjs.forEach(function(obj, i){
	    		if(obj.parentid === id){
	    			app._canvas.setActiveObject(_canvasObjs[i]);
	    		}
	    	});
	    },
	    setBlockControlTextarea:function(activeObj){
	    	var $targetTextarea = $('[data-prodblockid=' + activeObj.target.parentid + '] textarea');
	    	$targetTextarea.val(activeObj.target.text);
	    },
	    setModifedBlockScale: function(obj){
	    	//console.log(obj);
	    	obj.set({
	    		height: obj.height * obj.scaleY,
	    		scaleX: 1,
	    		scaleY: 1,
	    		width: obj.width * obj.scaleX,
	    	});
	    	app._canvas.renderAll();
	    },
	    toggleIsVarient: function(){
	    	// Make all canvas objects selectable
	    	app.filteredCanvasObjs.forEach(function(block){
	    		block.set({selectable: false});
	    	});
	    	// Remove the checkbox option
	    	$(this).parent().next().remove().end()
	    		   .remove();
	    },
	    bindCreateProductCanvasEvents: function(){
	    	// This event handles whether to enter edit mode or not
			app._canvas.on('object:selected', function(e) {
				// Get the id of the selected element 
				var _activeObj = app._canvas.getActiveObject();
				// console.log(_activeObj);
				// Show the relevant blocks' settings that has been selected
				$('[data-prodblockid=' + _activeObj.parentid + ']').find('[data-action=toggle-product-block]').click();				
			});
			// This event handles when an IText Field has beem edited
			app._canvas.on('text:changed', function(e){
				//console.log(e);
				app.cp.setBlockControlTextarea(e);
				e.target['textVal'] = e.target.text;
			});// This event handles when an IText Field has beem edited
			app._canvas.on('text:editing:entered', function(e){
				// Set 2 new properties to store the elements original width and height
				var _activeObj = e.target;
				_activeObj.origWidth  = _activeObj.width;
				_activeObj.origHeight = _activeObj.height;
			});
			app._canvas.on('text:editing:exited', function(e){
				// console.log(e);
				// Check the width and the height are not any smaller than what the block was originally before editing
				// This is required as after editing a textblock its dimensions are changed to wrap the new text value;
				var _activeObj = e.target;
				if(_activeObj.width < _activeObj.origWidth){
					_activeObj.width = _activeObj.origWidth;
				}
				if(_activeObj.height < _activeObj.origHeight){
					_activeObj.height = _activeObj.origHeight;
				}
				app._canvas.renderAll();				
			});
			// This capatures when an object has been modified
			app._canvas.on('object:modified', function(e) {
				app.cp.setModifedBlockScale(e.target);	
			});
	    },


	    /**
			HTML TEMPLATES
	    **/
	    createProductList: function(product){
	    	var productString = '';

	    	productString += '<div class="col-xs-6 col-md-3">';
				productString += '<input type="radio" id="template' + product.ID +'" name="template-url" value="' + product.ID +'" class="template-selection hidden">';
				productString += '<label for="template' + product.ID +'" class="thumbnail">';
				 	productString += '<span class="template-name">' + product.Name + '</span>';
				 	productString += '<img src="../templates/' + product.ID +'.jpg" alt="' + product.Name + '" class="">';
				 	productString += '<button type="button" class="btn btn-primary step-option-btn" data-tempid="' + product.ID + '" data-action="load-from-product" data-step-action="forward">Use Product</button>';
				productString += '</label>';          
			productString += '</div>';

			return productString;
	    },
	    createSpacingSetting: function(id, spacing){
	    	var spacingString = '',

	    		blockSpacing  = typeof(spacing) !== 'undefined' ? spacing : 10;

			spacingString+= '<h3 class="block-item-heading">Text block Spacing</h3>';
			spacingString+= '<input type="number" value="' + blockSpacing + '" id="at-spacing-'+ id +'" class="form-control">';
			spacingString+= '<hr>';

			return spacingString;
	    },
	    createTbBlockFromTbgList: function(id, tbBlocks){
	    	var tbBlockList = '';

	    	tbBlockList += '<ul class="list-group clear-all list-margin-top" id="tbg-' + id + '">';
    		tbBlocks.forEach(function(tbBlock, i){
    			// console.log(tbBlock);
    			var blockId = tbBlock._id.replace(' ', '');
    			tbBlockList += '<li class="list-group-item" data-tbg-parent="tbg-' + id + '" id="tb-' + blockId +'">';
    				tbBlockList += tbBlock._title;
    				tbBlockList += '<button type="button" class="btn btn-sm btn-info pull-right" data-action="edit-text-block-defaults">Edit</button>';
    				tbBlockList += '<div class="edit-tb-defaults-container hidden">';
    					tbBlockList += '<button type="button" class="btn btn-warning btn-sm pull-top-right" data-action="close-text-block-defaults">Back</button>'
    					tbBlockList += app.cp.createTextBlockBlockSettings(tbBlock, true);
      				tbBlockList += '</div>';
	    		tbBlockList += '</li>';
	    		// console.log(tbBlockList);
    		});
	    	tbBlockList += '</ul>';

	    	return tbBlockList;
	    },
	    createFontColorSetting: function(id, colour){
	    	var fontColorString = '',
	    		blockColour		= typeof(colour) !== 'undefined' ? colour : '0,0,0' ; // NEED to convert CMYK to RGB
	    	// console.log(blockColour);
	    	fontColorString+= '<h3 class="block-item-heading">Font Colour</h3>';
			app.fontColours.forEach(function(fontColour){
				// console.log(fontColour);
				// console.log(blockColour);
				var isChecked = blockColour === fontColour.rgb ? 'checked' : '';
						fontColorString+= '<input type="radio" id="block-' + fontColour.rgb.replace(/,/g, '') + '" name="color-default" value="' + fontColour.rgb + '" ' + isChecked + '>';
						fontColorString+= '<label for="block-' + fontColour.rgb.replace(/,/g, '') + '">' + fontColour.name + '</label>';
				});

			return fontColorString;
	    },
	    createFontFaceSetting: function(id, fface){
	    	var fontFaceString = '',
	    		blockFFace	   = typeof(fface) !== 'undefined' ? fface : 'FuturaBT-Book' ;

		  	fontFaceString+= '<h3 class="block-item-heading">Font Face</h3>';
			app.fontFaces.forEach(function(font){
				var isChecked = blockFFace === font.ffname ? 'checked' : '';
				// console.log(font);
				// console.log(blockFFace);
				fontFaceString+= '<input type="radio" id="block-' +  font.ffname.toLowerCase() + '-fface" name="ff-defualt" value="' + font.ffname + '" '+ isChecked +'>';
				fontFaceString+= '<label for="block-' + font.ffname.toLowerCase() + '-fface">' + font.fftitle + '</label>';
			});

			return fontFaceString;
	    },
	    createFontSizeSetting: function(id, size){
	    	var fontSizeString = '',
	    		blockFSize	   = typeof(size) !== 'undefined' ? size : '24' ;

		  	fontSizeString+= '<h3 class="block-item-heading">Font Size</h3>';
			app.fontSizes.forEach(function(fsize){
				var isChecked = blockFSize === fsize.size ? 'checked' : '';
				// console.log(fsize.size);
				// console.log(blockFSize);
				fontSizeString+= '<input type="radio" id="block-' + fsize.size + '-fsize" name="fsize-default" value="' + fsize.size + '" '+ isChecked +'>';
				fontSizeString+= '<label for="block-' + fsize.size + '-fsize">' + fsize.sizeName + '</label>';
			});

			return fontSizeString;
	    },
	    createlineHeightSetting: function(id, lineHeight){
	    	var lineHeightString = '',
	    		blockLineHeight  = typeof(lineHeight) !== 'undefined' ? lineHeight.replace('%', '') : '';

	    	lineHeightString+= '<div class="col-md-7">';
				lineHeightString+= '<h3 class="block-item-heading">Line Height</h3>';
				lineHeightString+= '<input type="number" value="' + blockLineHeight + '" id="at-maxlength'+ id +'" class="form-control">';
			lineHeightString+= '</div>';

			return lineHeightString;
	    },
	    createMaxLengthSetting: function(id, maxLength){
	    	var spacingString 	= '',
	    		blockMaxlength  = typeof(maxLength) !== 'undefined' ? maxLength : '';

	    	spacingString+= '<div class="col-md-5">';
				spacingString+= '<h3 class="block-item-heading">Max length</h3>';
				spacingString+= '<input type="number" value="' + blockMaxlength + '" id="at-maxlength'+ id +'" class="form-control">';
			spacingString+= '</div>';

			return spacingString;
	    },	    
	    createAlignmentSettings: function(id, halign, valign){
	    	var halign_lowerc	= typeof(halign) !== 'undefined' ? halign.toLowerCase() : 'left',
	    		valign_lowerc	= typeof(valign) !== 'undefined' ? valign.toLowerCase() : 'top',
	    		alignmentString = '',
	    		halignLeft		= '',
	    		halignCenter    = '',
	    		halignRight 	= '',
	    		valignTop		= '',
	    		valignCenter	= '',
	    		valignBottom	= '',
	    		checkedAttr		= 'checked';

	    	// console.log(halign_lowerc);
	    	// console.log(valign_lowerc);

	    	if(halign_lowerc === 'center'){
	    		halignCenter = checkedAttr;
	    	} else if(halign_lowerc === 'right'){
	    		halignRight = checkedAttr;
	    	} else{ // Default to Left	    		
	    		halignLeft = checkedAttr;
	    	}

	    	if(valign_lowerc === 'bottom'){
	    		valignBottom = checkedAttr;
	    	} else if(valign_lowerc === 'center'){
	    		valignCenter = checkedAttr;
	    	} else{ // Default to Top	    		
	    		valignTop = checkedAttr;
	    	}

			alignmentString+= '<h3 class="block-item-heading">Horizontal &amp; Vertical positioning</h3>';
			alignmentString+= '<div class="col-md-6">';
				alignmentString+= '<span>';
					alignmentString+= '<input type="radio" id="' + id + '-h-left" class="hidden show-border-when-selected" name="ap-h-pos" ' + halignLeft + ' value="left">';
	          		alignmentString+= '<label class="align-icon align-left" for="' + id + '-h-left"></label>';
	          	alignmentString+= '</span>';
	          	alignmentString+= '<span>';
	          		alignmentString+= '<input type="radio" id="' + id + '-h-center" class="hidden show-border-when-selected" name="ap-h-pos" ' + halignCenter + ' value="center">';
	          		alignmentString+= '<label class="align-icon align-center" for="' + id + '-h-center"></label>';
	          	alignmentString+= '</span>';
	          	alignmentString+= '<span>';
	          		alignmentString+= '<input type="radio" id="' + id + '-h-right" class="hidden show-border-when-selected" name="ap-h-pos" ' + halignRight + ' value="right">';
	          		alignmentString+= '<label class="align-icon align-right" for="' + id + '-h-right"></label>';
	          	alignmentString+= '</span>';
	        alignmentString+= '</div>';
	         	
			alignmentString+= '<div class="col-md-6">';
				alignmentString+= '<span>';
					alignmentString+= '<input type="radio" id="' + id + '-v-top" class="hidden" name="ap-v-pos" ' + valignTop + ' value="top">';
	          		alignmentString+= '<label class="align-icon align-top" for="' + id + '-v-top"></label>';
	          	alignmentString+= '</span>';
	          	alignmentString+= '<span>';
	          		alignmentString+= '<input type="radio" id="' + id + '-v-middle" class="hidden" name="ap-v-pos" ' + valignCenter + ' value="center">';
	          		alignmentString+= '<label class="align-icon align-middle" for="' + id + '-v-middle"></label>';
	          	alignmentString+= '</span>';
	          	alignmentString+= '<span>';
	          		alignmentString+= '<input type="radio" id="' + id + '-v-bottom" class="hidden" name="ap-v-pos" ' + valignBottom + ' value="bottom">';
	          		alignmentString+= '<label class="align-icon align-bottom" for="' + id + '-v-bottom"></label>';		            	
	          	alignmentString+= '</span>';
	        alignmentString+= '</div>';

	    	return alignmentString;
	    },
	    createUserSettings: function(id, editable, manditory){
	    	var userSettings = '',
	    		isEditable   = editable  === 'true' || editable  === 'True' && typeof(editable)  !== 'undefined' ? 'checked' : '',
	    		isManditory  = manditory === 'true' || manditory === 'True' && typeof(manditory) !== 'undefined' ? 'checked' : '';

			userSettings+= '<div class="col-md-6">';
				userSettings+= '<div class="onoffswitch">';
					userSettings+= '<h3 class="block-item-heading">Manditory?</h3>';
				    userSettings+= '<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" ' + isEditable + ' id="at-manditory-' + id + '">';
				    userSettings+= '<label class="onoffswitch-label" for="at-manditory-' + id + '">';
				        userSettings+= '<span class="onoffswitch-inner"></span>';
				        userSettings+= '<span class="onoffswitch-switch"></span>';
				    userSettings+= '</label>';
				userSettings+= '</div>';
			userSettings+= '</div>';
			userSettings+= '<div class="col-md-6">';
				userSettings+= '<div class="onoffswitch">';
					userSettings+= '<h3 class="block-item-heading">Editable?</h3>';
				    userSettings+= '<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" ' + isManditory + ' id="at-editable-' + id + '">';
				    userSettings+= '<label class="onoffswitch-label" for="at-editable-' + id + '">';
				        userSettings+= '<span class="onoffswitch-inner"></span>';
				        userSettings+= '<span class="onoffswitch-switch"></span>';
				    userSettings+= '</label>';
				userSettings+= '</div>';
			userSettings+= '</div>';

	    	return userSettings;
	    },
	    createTextSettings: function(id, block){
	    	// console.log(block);
	    	var blockTextSettings = '',
	    		fromSource		  = typeof(block._source) !== 'undefined' && block._source !== '' ? true : false,
	    		disabledAttr	  = '',
	    		blockText;
	    	// console.log(fromSource);

	    	// If the blocks text value is from an external source, retreive the text
	    	if(fromSource === true){
	    		// Do an Ajax request and get the contents
	    		blockText = 'Organised in aid of Macmillan Cancer Support, registered charity in England and Wales (261017), Scotland (SC039907) and the Isle of Man (604). Also operating in Northern Ireland.'
	    		// Set the disabledAttr to disabled, so a user cant change the text
	    		disabledAttr = 'disabled';
	    	} else{
	    		blockText = typeof(block.__text) !== 'undefined' ? block.__text : '';
	    	}

	    	blockTextSettings+= '<h3 class="block-item-heading">Block Text</h3>';
	    	blockTextSettings+= '<textarea class="form-control" data-action="update-block-text" ' + disabledAttr + '>';
	    		blockTextSettings+= blockText
	    	blockTextSettings+= '</textarea>';

	    	return blockTextSettings;
	    },	  


		/** 
	      DOCUMENT EVENT HANDLER
	    **/
	    bindCreateProductClickEvents: function(){
	    	var $body = $('body');
	    	$body.on('click', '[data-action=load-from-product]', app.cp.loadExistingProduct);
	    	$body.on('click', '[data-action=edit-text-block-defaults]', app.cp.toggleEditTbFromTbg);
	    	$body.on('click', '[data-action=close-text-block-defaults]', app.cp.closeEditTbFromTbg);
	    	$body.on('click', '[data-action=toggle-product-block]', function(){
	    		app.cp.toggleOptions($(this), '.cp-block-container');
	    	});
	    	$body.on('keyup', '[data-action=update-block-text]', app.cp.updateCanvasBlockText);
	    	$body.on('blur', '[data-action=update-block-text]', function(){
	    		// Deselect the previously selected canvas obj
	    		app.cp.deactiveCanvasObj();

	    		console.log(app._activeEditEl.origWidth);
	    		var blockSettings   = app.utils.createTextBlockSettings(app._activeEditEl),
	    			_formattedBlock = app.utils.wrapCanvasText(app._activeEditEl, app._canvas, app._activeEditEl.origWidth, 0, app._activeEditEl.textAlign),
	    			_updatedBlock   = app.utils.setTextBlockSettings(_formattedBlock, blockSettings);
	    		console.log(_formattedBlock);
	    		// Remove the old block
	    		app._canvas.remove(app._activeEditEl);
	    		// Add the newly reformatted block
	    		app._canvas.add(_updatedBlock).renderAll();
	    		// console.log(app._canvas);
	    		// Make the activeEditEl null as there is not longer an active element.
	    		app._activeEditEl = null;
	    		// Update the objects on the canvas
	    		app.utils.createFilteredCanvasObjects();
	    	});
      		app.$downloadThumb.on('click', app.utils.covertCanvasToImgDownload);
      		$('#non-variant').on('click', app.cp.toggleIsVarient);
	    }
	};
	app.cp.initCreateProduct();
})();