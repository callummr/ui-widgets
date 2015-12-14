var app = app || {};
$(document).ready(function(){
	'use strict';
	// $ = dom elements
	// _ = fabric elements

	app.blockScale 		= 1;
	app.textBlockGroups = [];
	app._activeEditEl   = null;
	app.activeImageBlockId;

	app.$productBlockList  = $('#product-blocks-list');
	app.$blockAssetLibrary = $('#block-asset-lib');
	app.$saveBlockAssetBtn = $('[data-action=save-block-assets]');
	app.$blockAssetsJSONel = $('#pdfItemAdmin1_hdnBlockAssets');

	app.cp = {
		/**
			Initiliase Create Product Functionality
		**/ 
		initCreateProduct: function(){
			// Check if the user is creating a new product from a template, or updating a product.
			// If a user is updating then the hdnXML field will not be empty
			// console.log($('#hdnXML').val().length > 0, $('#pdfItemAdmin1_hdnXML').val().length > 0, app.isLocalEnv, !app.isLocalEnv);
			var $hiddenXmlEl = $('#pdfItemAdmin1_hdnXML');
			// console.log( $hiddenXmlEl.val() );
			// console.log( $hiddenXmlEl.val() === '', typeof($hiddenXmlEl) === 'undefined' );
			if( $hiddenXmlEl.val() === '' || typeof($hiddenXmlEl) === 'undefined'){
				console.log('Empty XML');
				// Set the type of operation that is taking place
				app.isCreateProduct = true;
				app.isUpdateProduct = false;
				// Show a user a list of templates to select from.
				app.cp.loadProductList();
				// This is a temporary UI change
				// if(!app.isLocalEnv){
				// 	$('.product-container').addClass('col-md-9').find('[data-template=build-product]').removeClass('container');
				// 	$('.product-asset-lib-container').addClass('col-md-3').removeClass('hidden');
				// }
			}else{
				console.log('XML is not empty');
				// Set the type of operation that is taking place
				app.isUpdateProduct = true;
				app.isCreateProduct = false;
				
				var x2js    	= new X2JS(),
					productData = $.parseXML($hiddenXmlEl.val()),	
					productJSON = x2js.xml2json(productData);
					// console.log(productData);
					// console.log(productJSON);
				// Process the XML in the hidden field and show the canvas editing options
				// Move the step loader on one step, Using the first template button as the element to do so.
				$('[data-step="1"]').fadeIn(100, function(){
					$(this).addClass('active-option');
				}) 
				// Set templateID to the loaded templates ID
	     		app.templateId = $('#pdfItemAdmin1_hdnTemplateId');		     	
		     	// $('#pdfItemAdmin1_hdnTemplateId').val(app.templateId); // NEED TO ADD THE NAME
		     	// app.docDimesions = productData[0].Dimensions.replace(' ', '').split(','); // NEED TO ADD THE DIMENSIONS
		     	app.docDimesions = ['A4'];
		     	$('#template-size-options')
				// Set the dimensions of the template
				// $('#template-size-options').text(app.docDimesions.join(',')); // NEED TO ADD THE NAME OF THE SITES
				// Set the name of the template so the user can see once in the edit modes
				// $('#template-name').text($this.next().find('.template-name').text()); // NEED TO SET THE NAME

				// Create the Canvas Element based of JSON created from the XML				
				app.cp.loadProductFromJSON(productJSON);
			}		
			app.cp.bindCreateProductDomEvents();
		},

		/**
			DOM MANIPULATION
		**/
		// setActiveBlock: function(){
		// 	var $firstBlockitem = $('#product-blocks-list .list-group-item:first-child');
		// 	$firstBlockitem.find('.cp-block-container').removeClass('hidden');
		// 	$firstBlockitem.find('button').addClass('toggle-active');
		// 	app.cp.setActiveCanvasObj($firstBlockitem.data('prodblockid'));
		// },
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
				$('#dynamic-product-templates').append(prodString).removeClass('hidden');
				$('#dynamic-product-templates .template-selection').first().prop('checked', true);
			});
		},
		loadExistingProduct: function(){
	      	var x2js  = new X2JS(),
	         	ajaxUrl,
	          	$this = $(this);

	    	app.utils.steppedOptionHandler($this);
	     	app.templateId = $this.data('tempid');

	     	// Set templateID hidden field to the loaded templates ID.
	     	$('#pdfItemAdmin1_hdnTemplateId').val(app.templateId);

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
					// app.docDimesions is set Locally as a dummy value in setCanvasSettings
				} else{
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
			var canvasEl       = document.createElement('canvas'),
			  	docWidth       = parseInt(canvasData.doc.page._width),
			  	docHeight      = parseInt(canvasData.doc.page._height),
			  	canvasSettings = app.utils.setCanvasSettings(docWidth, docHeight);

			// Set the ID of the Canvas      
			canvasEl.setAttribute('id', 'cp_canvas');
			canvasEl.width  = canvasSettings.width;
			canvasEl.height = canvasSettings.height;
			app.blockScale  = canvasSettings.canvasScale;

			document.getElementById('product-canvas-container').appendChild(canvasEl);

			// console.log(document.getElementById('c'));
			app._cp_canvas = new fabric.Canvas('cp_canvas', { selection: false, backgroundColor: '#FFF' });
			app.utils.drawGrid(396, app._cp_canvas); // Pass in the width dynamically so the whole grid is covered
			// Add all of the elements to the page.
			app.cp.createProductBlocksSettings(canvasData.doc.page);
			// app.cp.bindCreateProductCanvasEvents();
			// app.utils.bindGlobalCanvasEvents();
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
	    	app.$productBlockList.append(blockListingString);

	    	// Filter all canvas objects except the grid which is the first object
	    	// app.utils.createFilteredCanvasObjects();
	    		
	    	app.cp.reformatTextBlockGroups();
	    	// app.cp.setActiveBlock();
	    	// console.log(app._cp_canvas);
	    },

	    // HTML BLOCKS
	    createImageBlockSettings: function(imgBlock){
	    	var imgBlockString = '',
	    		blockId		   = imgBlock._id.replace(' ', '');
	    	// console.log(imgBlock);
	    	imgBlockString+= '<li class="clearfix list-group-item" data-prodblockid="' + blockId + '" data-block-type="block-item">';
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
				    	imgBlockString+= '<hr>';				    	
				    	imgBlockString+= '<button type="button" class="btn btn-info" data-action="add-images-to-block" data-id="' + blockId + '">Add Image</button>';				    	
				    	imgBlockString+= '<div class="block-asset-item-list-wrapper">';				    	
				    		imgBlockString+= '<table data-asset-block="' + blockId + '" class="table block-asset-item-list hidden"></table>';				    	
			    		imgBlockString+= '</div>';			
			    	imgBlockString+= '</div>';
	    	imgBlockString+= '</li>';
			//console.log(imgBlockString); 

	    	return imgBlockString;
	    },
	    createTextBlockGroupBlockSettings: function(tbgBlock){
	    	// console.log(tbgBlock);
	    	var tbgBlockString = '',
	    		blockId 	   = tbgBlock._id.replace(' ', '');

	    	tbgBlockString+= '<li class="clearfix list-group-item" data-prodblockid="' + blockId + '" data-block-type="text-block-group-item">';
	    		tbgBlockString+= '<button type="button" class="btn btn-info pull-top-right" data-action="toggle-product-block">X</button>';
	    		tbgBlockString+= '<h2 class="block-item-heading">' + tbgBlock._id + '</h2>';
    			tbgBlockString+= '<div class="cp-block-container hidden">';			    		
		    		// tbgBlockString+= '<input type="text" class="form-control" value="' + tbgBlock._title +'" />';
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
		    		console.log(tbgBlock);
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
	    		tBlockString+= '<li class="clearfix list-group-item" data-prodblockid="' + blockId + '" data-block-type="text-block-item">';
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
		    		// Set the text value for the user
		    		tBlockString+= app.cp.createTextSettings(blockId, tBlock, tBlock._maxlen);
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
				blockSettings.imgSrc        = typeof(data._lowresfilename) !== 'undefined' ? data._lowresfilename : null;
				blockSettings.isEditable    = typeof(data._editable) !== 'undefined' ? data._editable : 'false';
				blockSettings.isManditory   = typeof(data._mandatory) !== 'undefined' ? data._mandatory : 'false';
				blockSettings.valign        = typeof(data._verticalalign) !== 'undefined' ? data._verticalalign : '';
	        } else if(data.block =='tb'){
	         	blockType = 'tb';
				blockSettings.blocktype     = 'new-text-block';  
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
	        blockSettings.blockTitle  = typeof(data._title) !== 'undefined' ? data._title : '';
	        // blockSettings.parentId    = typeof(data._id) !== 'undefined' ? data._id : '';
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
	        blockSettings.top     = app._cp_canvas.height - blockDimensions.upperY;
	        blockSettings.width   = app.utils.calcWidth(blockDimensions);
	        // console.log(blockSettings);
	        if(data.block === 'ib'){
	        	app.cp.createProductImageBlock(blockSettings);
	        } else if(data.block =='tb'){
	        	app.cp.createProductTextBlock(blockSettings);
	        } else if(data.block === 'tbg'){
	        	app.textBlockGroups.push({
	        		height: blockSettings.height,
					id: blockSettings.id,
					spacing: parseInt(blockSettings.spacing),
					parentTitle: blockSettings.blockTitle,
					parentEditable: blockSettings.isEditable,
					parentManditory: blockSettings.isManditory,
					parentHalign: blockSettings.halign,
					parentValign: blockSettings.valign,
					parentHeight: blockSettings.height,
					parentWidth: blockSettings.width,
					width: blockSettings.width,
				});
				// These needs reformatting so it does not get repeated.
				// This check is required if a textblock group only has 1 text block inside it.
				if(typeof(data['text-block']).length !== 'undefined'){
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
			            innerBlockSettings.label       = typeof(block._title) !== 'undefined' ? block._title : 'false';
			            innerBlockSettings.maxLength   = typeof(block._maxlen) !== 'undefined' ? block._maxlen : '';
			            innerBlockSettings.valign      = blockSettings.valign;  // Take from the parent element
			            innerBlockSettings.top		   = blockSettings.top;     // Take from the parent element
			            innerBlockSettings.width	   = blockSettings.width;   // Take from the parent element
			            innerBlockSettings.left   	   = blockSettings.left;    // Take from the parent element	            
			            innerBlockSettings.spacing     = blockSettings.spacing; // Take from the parent element	

			            // Settings need to pass through additional parent information
			            innerBlockSettings.parentId    	   = blockSettings.id;
			            innerBlockSettings.parentTitle 	   = blockSettings.blockTitle;
						innerBlockSettings.parentEditable  = blockSettings.isEditable;
						innerBlockSettings.parentManditory = blockSettings.isManditory;
						innerBlockSettings.parentHalign    = blockSettings.halign;
						innerBlockSettings.parentValign    = blockSettings.valign;
						innerBlockSettings.parentHeight    = blockSettings.height;
						innerBlockSettings.parentWidth     = blockSettings.width;

			                 
			            //console.log(block._source);
			            if(typeof(block._source) !== 'undefined' && block._source !== ''){
			              innerBlockSettings.stringSrc = block._source;
			            }
			            if(typeof(block.__text) !== 'undefined'){
			              innerBlockSettings.textVal = block.__text;
			            }
			            // console.log(innerBlockSettings);
			            app.cp.createProductTextBlock(innerBlockSettings);
		          	});
				} else{
					var block = data['text-block'];
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
		            innerBlockSettings.label       = typeof(block._title) !== 'undefined' ? block._title : 'false';
		            innerBlockSettings.maxLength   = typeof(block._maxlen) !== 'undefined' ? block._maxlen : '';
		            innerBlockSettings.valign      = blockSettings.valign;  // Take from the parent element
		            innerBlockSettings.top		   = blockSettings.top;     // Take from the parent element
		            innerBlockSettings.width	   = blockSettings.width;   // Take from the parent element
		            innerBlockSettings.left   	   = blockSettings.left;    // Take from the parent element	            
		            innerBlockSettings.spacing     = blockSettings.spacing; // Take from the parent element	

		            // Settings need to pass through additional parent information
		            innerBlockSettings.parentId    	   = blockSettings.id;
		            innerBlockSettings.parentTitle 	   = blockSettings.blockTitle;
					innerBlockSettings.parentEditable  = blockSettings.isEditable;
					innerBlockSettings.parentManditory = blockSettings.isManditory;
					innerBlockSettings.parentHalign    = blockSettings.halign;
					innerBlockSettings.parentValign    = blockSettings.valign;
					innerBlockSettings.parentHeight    = blockSettings.height;
					innerBlockSettings.parentWidth     = blockSettings.width;

		                 
		            //console.log(block._source);
		            if(typeof(block._source) !== 'undefined' && block._source !== ''){
		              innerBlockSettings.stringSrc = block._source;
		            }
		            if(typeof(block.__text) !== 'undefined'){
		              innerBlockSettings.textVal = block.__text;
		            }
		            // console.log(innerBlockSettings);
		            app.cp.createProductTextBlock(innerBlockSettings);
				}
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
		    _block['imgSrc']   		= blockSettings.imgSrc;  
		    // _block['parentId']      = blockSettings.parentId;
		    _block['id']      		= blockSettings.id;
		    _block['valign']        = blockSettings.valign;

		    if(_block.imgSrc !== null){
		    	// Set the background of the block to that image.
		    }

	    	// console.log(_block);

			// If a product... then will need to load image settings.
			// If it has a default image, set it as the background image.

	    	// Add the new component to the canvas. This needs to be done, before we can update the background img of the object
	    	app._cp_canvas.add(_block).renderAll();
	    },
	    createProductTextBlock: function(settings){
	   		// Create the fabric js element on the canvas using the settings from 'settings' object
	   		var cTBSettings = settings;
	    	// Set the text of the element
	    	// console.log(cTBSettings);
	    	if(typeof(cTBSettings.stringSrc) !== 'undefined'){
	    		// Ajax request to the source of the asset.	    		
	    		cTBSettings.textVal = 'Organised in aid of Macmillan Cancer Support, registered charity in England and Wales (261017), Scotland (SC039907) and the Isle of Man (604). Also operating in Northern Ireland.';
	    		// If text is from a source, then it should not be editable.
	    		cTBSettings.isEditable === false;
	    	} else if(typeof(cTBSettings.textVal) === 'undefined' || cTBSettings.textVal === ''){
	    		cTBSettings.textVal  = 'Default Text';
	    	}

	    	// Create Boolean to test if this block is from a source file or free text
	    	var fromTextSrc = typeof(cTBSettings.stringSrc) !== 'undefined' ? true : false;

	      	var _ptblock,
	      		_formattedBlock;

	      	_ptblock = new fabric.Text(cTBSettings.textVal, {
	      				  										fill: app.utils.cmykToRGB(cTBSettings.fontColor),	
										                        fontFamily: cTBSettings.fontFamily,
										                        fontSize: parseInt(cTBSettings.fontSize), // Need to convert PT to Pixel here
											      				hasBorders: true,
										                        hasRotatingPoint: false,
										                       //  height: cTBSettings.height,
										                        left: cTBSettings.left,
										                        // lineHeight: String(cTBSettings.lineheight).replace('%', ''), TODO
										                        lockRotation: true,
										                        selectable: false,                                             
										                        textAlign: cTBSettings.halign,
										                        top: cTBSettings.top, 
										                        // width: cTBSettings.width
															});

	      	// This additional property is required within the wrapCanvasText function
	      	if(fromTextSrc){
	      		_ptblock['text-block-type'] = 'text';
	      		cTBSettings.textblocktype = 'text';
	      	} else{
	      		_ptblock['text-block-type'] = 'itext';
	      		cTBSettings.textblocktype = 'itext';
	      	}

	      	// app._cp_canvas.add(_ptblock).renderAll();

	      	// Sort the wrapping out for the text element, requires:
	      	// fabric block, the canvas, maxWidth, maxHeight, alignment
	
	      	_formattedBlock	= app.utils.wrapCanvasText(_ptblock, app._cp_canvas, cTBSettings.width, 0, cTBSettings.halign);
	    	
	    	// console.log(_formattedBlock);
	    	// console.log(_formattedBlock.width);
	      
	    	// Add additional block proprties to the newly formatted block;
	    	_formattedBlock['blocktype']     = cTBSettings.blocktype;
			_formattedBlock['blockTitle']    = cTBSettings.blockTitle;
			_formattedBlock['halign']        = cTBSettings.halign;
			_formattedBlock['isEditable']    = cTBSettings.isEditable; 
			_formattedBlock['isManditory']   = cTBSettings.isManditory;			
			_formattedBlock['id']      		 = cTBSettings.id;
			_formattedBlock['valign']        = cTBSettings.valign;

			_formattedBlock['origWidth']	= cTBSettings.width,
			_formattedBlock['origHeight']	= cTBSettings.height,
      
			_formattedBlock['fontColor']     = cTBSettings.fontColor;
			_formattedBlock['fontFamily']    = cTBSettings.fontFamily;
			_formattedBlock['fontSize']      = parseInt(cTBSettings.fontSize);
			_formattedBlock['lineheight']    = String(cTBSettings.lineheight).replace('%', '');
			_formattedBlock['maxLength']     = parseInt(cTBSettings.maxLength);
			_formattedBlock['textVal']       = cTBSettings.textVal;
			_formattedBlock['textblocktype'] = cTBSettings.textblocktype;

			if(typeof(cTBSettings.parentId) !== 'undefined'){
				// console.log(cTBSettings.parentHeight, cTBSettings.parentWidth)
				_formattedBlock['parentId'] = cTBSettings.parentId;
				_formattedBlock['parentTitle'] = cTBSettings.parentTitle;
				_formattedBlock['parentEditable'] = cTBSettings.parentEditable;
				_formattedBlock['parentManditory'] = cTBSettings.parentManditory;
				_formattedBlock['parentHalign'] = cTBSettings.parentHalign;
				_formattedBlock['parentValign'] = cTBSettings.parentValign;
				_formattedBlock['parentHeight']    = cTBSettings.parentHeight;
				_formattedBlock['parentWidth']   = cTBSettings.parentWidth;
				_formattedBlock['spacing']   = cTBSettings.spacing;
			}

			if(typeof(cTBSettings.stringSrc) !== 'undefined'){
				_formattedBlock['stringSrc'] = cTBSettings.stringSrc;
			}

	      	// Add the new component to the canvas. This needs to be done, before we can update the background img of the object
	      	app._cp_canvas.add(_formattedBlock).renderAll();
	    },

	    deactiveCanvasObj: function(){
	    	// Make the _activeEl variable null
	    	app._activeEditEl = null;
	    	// Then deselect the element from the canvas and re-render the canvas
	    	app._cp_canvas.deactivateAll().renderAll();
	    },
	    reformatTextBlockGroups:function(){
	    	// There is an error in the block.
	    	app.filteredCanvasObjs = app._cp_canvas._objects.filter(function(block){
	    								return typeof(block.id) !== 'undefined'
	    							 });
	    	// console.log(app.filteredCanvasObjs);
	    	// For each text block group in the array, format the text blocks inside it.
	    	app.textBlockGroups.forEach(function(block){
	    		// console.log(block);
	    		app.filteredCanvasObjs.forEach(function(obj,i){
	    			// console.log(obj);
    				if(block.id === obj.parentId){
	    				var prevObjIndex = i === 0 ? 0 : i - 1;
	    				obj.set({
	    					width: block.width,
	    					top: app.filteredCanvasObjs[prevObjIndex].top + app.filteredCanvasObjs[prevObjIndex].height + block.spacing
	    				});
	    				app._cp_canvas.renderAll();
	    				// console.log(obj);				    			
	    			}
	    		});
	    	// 	// Find the elements were the group matches the id + -group
	    	// 	// Then apply make the width 100% of its parent
	    	// 	// Then set the top value based off of the objects around it.
	    	});
	    },	    	    
	    updateCanvasBlockText: function($el){
	    	console.log($el)
	    	var $textarea	   = $el,
	    		newTextVal 	   = $textarea.val(),
	    		canvasBlockId  = $textarea.parent().data('prodblockid') || $textarea.parents('[data-prodblockid]').data('prodblockid');

	    	// Set the active canvas obj
	    	app.cp.setActiveCanvasObj(canvasBlockId);
	    	// Update the active canvas objects text and textVal values
	    	app._activeEditEl.set({
	    		text: newTextVal,
	    		textVal: newTextVal
	    	});

	    	// Update the text of the canvas element
	    	// Then reformat it
	    	// Then update canvas (renderall)
	    	app._cp_canvas.renderAll();
	    },
	    setActiveCanvasObj: function(id){
	    	// This function sets the relevant canvas object to its active state
	    	var _canvasObjs = app._cp_canvas._objects;
	    	if(app._activeEditEl === null){
		    	_canvasObjs.forEach(function(obj, i){
		    		if(obj.id === id){
		    			app._activeEditEl = obj;
		    			app._cp_canvas.setActiveObject(_canvasObjs[i]);
		    		}
		    	});
		    }
		    console.log(app._activeEditEl);
	    },
	    setBlockControlTextarea:function(activeObj){
	    	var $targetTextarea = $('[data-prodblockid=' + activeObj.target.parentId + '] textarea');
	    	// Debounce the textarea being updated.
	    	$.debounce($targetTextarea.val(activeObj.target.text), 500);	    	
	    },
	    setModifedBlockScale: function(obj){
	    	//console.log(obj);
	    	obj.set({
	    		height: obj.height * obj.scaleY,
	    		scaleX: 1,
	    		scaleY: 1,
	    		width: obj.width * obj.scaleX,
	    	});
	    	app._cp_canvas.renderAll();
	    },
	    updateCanvasObjSetting: function(){
	    	var $this = $(this),
	    		canvasBlockId  = $this.parent().data('prodblockid') || $this.parents('[data-prodblockid]').data('prodblockid');

	    	// Set the relevant object to its active state
	    	app.cp.setActiveCanvasObj(canvasBlockId);
	    	// console.log(app._cp_canvas._objects);
	    	// Returns an object to that sets the correct property with the new value
	    	var objSetting = app.utils.selectCanvasPropertyToEdit($this);	    	
		    // Updated the selected objects relevant properties
		    console.log(app._activeEditEl);
	    	app._activeEditEl.set(objSetting);
	    	console.log(app._activeEditEl);
	    	// Re-Render the canvas to show the update
	    	app._cp_canvas.renderAll();
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
	    setActiveBlockImage:function($el){
	    	// Get the canvas object id from the relevant block
	    	var canvasObjId = $el.data('blockid'),
	    		imgURL		= $el.data('img-url');

	    	// Sets the relevant canvas object to active state
	    	app.cp.setActiveCanvasObj(canvasObjId);

	    	// Set canvas obj's background color to white
	    	app._activeEditEl.set({fill:'rgb(255,255,255'});
	    	app._activeEditEl['imgSrc'] = imgURL;

	    	// Set canvas obj's background image to relevant img
	    	fabric.util.loadImage(imgURL, function(img) {
	            app._activeEditEl.setPatternFill({
	                source: img,
	                repeat: 'no-repeat'
	            });
	          app._cp_canvas.renderAll();
	        });       

	    	// TO DO
	    		// Save the block's settings
	    },
	    bindCreateProductCanvasEvents: function(){
	    	// This event handles whether to enter edit mode or not
			app._cp_canvas.on('object:selected', function(e) {
				console.log('Clicked');
				// Get the id of the selected element 
				var _activeObj = app._cp_canvas.getActiveObject();
				// console.log($('[data-prodblockid=' + _activeObj.parentId + ']').find('[data-action=toggle-product-block]'));
				// console.log(_activeObj);
				// Show the relevant blocks' settings that has been selected
				$('[data-prodblockid=' + _activeObj.parentId + ']').find('[data-action=toggle-product-block]').click();				
			});
			// This event handles when an IText Field has beem edited
			app._cp_canvas.on('text:changed', function(e){
				//console.log(e);
				app.cp.setBlockControlTextarea(e);
				e.target['textVal'] = e.target.text;
			});// This event handles when an IText Field has beem edited
			app._cp_canvas.on('text:editing:entered', function(e){
				// Set 2 new properties to store the elements original width and height
				var _activeObj = e.target;
				_activeObj.origWidth  = _activeObj.width;
				_activeObj.origHeight = _activeObj.height;
			});
			app._cp_canvas.on('text:editing:exited', function(e){
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
				app._cp_canvas.renderAll();				
			});
			// This capatures when an object has been modified
			app._cp_canvas.on('object:modified', function(e) {
				app.cp.setModifedBlockScale(e.target);	
			});
	    },

	    /**
			ASSET LIBRARY CONTROLS
	    **/
	    initAssetLibrary: function(){
	    	// Remove the asset library results if working locally.
	    	if(!app.isLocalEnv){
	    		$('#asset-lib-item-list').empty();
	    	}

	    	// Change the UI to show asset library
	    	app.$productBlockList.addClass('hidden');
	    	app.$blockAssetLibrary.removeClass('hidden');
	    	$('#asset-lib-item-list').removeClass('hidden');  	
	    	// Update the active block id to the block that is being edited
	    	app.activeImageBlockId = $(this).data('id');
	    	// Set the id on the save asset button, to the block id that is being edited.
	    	app.$saveBlockAssetBtn.data('boundblockid', app.activeImageBlockId);
	    },
	    closeAssetLibrary: function(){
	    	var confrimation = confirm('Are you sure you don\'t have any changes to save?');
	    	// Check that the user is happy to close the asset library without saving their changes
	    	if(confrimation === true){
	    		// Update the UI and reset app.activeImageBlockId && the save buttons boundblockid
	    		app.cp.updateActiveAssetBlock();
	    	}	    	
	    },
	    saveAssetsToBlock: function(){
	    	// Save the the asset to the block
	    	var $blockAssetTable  = $('[data-asset-block=' + app.activeImageBlockId + ']'),	    		
	    		$checkedAssetsEls = $('input[name=block-asset-item]:checked'),
	    		assetList 		  = '';

			$checkedAssetsEls.each(function(i) {
				// Get the ID of the Asset and IMG URL				
				var $this     = $(this),
					assetId   = $this.val(),					
					imgURL    = $this.next().find('img').attr('src'),
					isChecked;

				// Check if this is the first asset to be added. If it is, then show the list
				if(i === 0 && $blockAssetTable.find('tr').length <= 0 ){
					$blockAssetTable.removeClass('hidden');
					isChecked = 'checked';
				} else{
					isChecked = '';
				}
				// console.log($blockAssetTable);
				// console.log($blockAssetTable.find('img[data-assetid=' + assetId + ']'));
				// console.log($blockAssetTable.find('img[data-assetid=' + assetId + ']').length);
				// Check if the image asset already exists in the list. If it doesnt, then add it to the list
				if( $blockAssetTable.find('img[data-assetid=' + assetId + ']').length === 0 ){
					assetList+= app.cp.createBlockImgAssetItem(assetId, app.activeImageBlockId, isChecked, imgURL);
				}
			});

			// Add the items to the list
			$blockAssetTable.append(assetList);	
			// Update the UI and reset app.activeImageBlockId && the save buttons boundblockid
	    	app.cp.updateActiveAssetBlock();
	    },
	    updateActiveAssetBlock: function(){
	    	// Change the UI to show the block being edited again.
    		app.$productBlockList.removeClass('hidden');
    		app.$blockAssetLibrary.addClass('hidden');
    		// Remove the previous search results
    		if(app.isLocalEnv){
    			$('#asset-lib-item-list').addClass('hidden');
    			$('input[name=block-asset-item]').prop('checked', false);

    		}else{
    			$('#asset-lib-item-list').empty().addClass('hidden');
    		}
			
			// Update the search field controls
			// TO DO
    		// Update the active block id to null
    		app.activeImageBlockId = '';
    		// Remove the id on the save asset button
    		app.$saveBlockAssetBtn.data('boundblockid', app.activeImageBlockId);
	    },
	    removeAssetFromBlock: function(){
	    	var $this = $(this),
	    		$blockAssetList = $this.parents('.block-asset-item-list'),
	    		canvasObjId = $this.data('blockid');

	    	// Check if this is the last item to be deleted from the blocks' list.
	    	if($blockAssetList.find('tr').length <= 1){
	    		// This is the last element so hide the table
	    		$blockAssetList.addClass('hidden');
	    	} 
    		// Then remove the item from the DOM
    		$this.parents('tr').remove();

    		// Check if there is another img to set as the default
    		console.log( $blockAssetList.find('[name^=asset-default-block]'))
    		if($blockAssetList.find('[name^=asset-default-block]').length > 0){
    			// Find the img element in the blocks' list of assets.
    			var $firstImgAsset = $blockAssetList.find('[name^=asset-default-block]').first();
    			// Set is a the new default
    			$firstImgAsset.prop('checked', true);
    			// Set the blocks background image and updates the objects properties
    			app.cp.setActiveBlockImage($this);
    		} else{
    			// Make the user aware of their action.
    			alert('All images removed. Please select another image.');
    			// Sets the relevant canvas object to active state
	    		app.cp.setActiveCanvasObj(canvasObjId);
	    		// Remove the relevant canvas obj 'imgSrc' property
	    		app._activeEditEl['imgSrc'] = null;    			
    			// Remove the relevant canvas's obj background
    			app._activeEditEl.set({
    				fill: 'rgb(0,0,0)'
    			});
    			app._cp_canvas.renderAll();
    		}    		
    		// Update the JSON to reflect the changes
	    },

	    createImageBlockAssetJSON: function(){
	    	var blockJSON = [];
	    	// Iterate over all image blocks
	    	$('[data-block-type=block-item]').each(function(){
	    		var blockAssetData = {
	    			BlockId: $(this).data('prodblockid'),
	    			Assets: []
	    		};
	    		// Within each image block, find the blocks' list of assets
	    		$(this).find('.block-asset-item-list-wrapper input[name^=asset-default-block]').each(function(){
	    			var $this 	  = $(this),
	    				assetData = {
		    				AssetId: $this.data('assetid'),
							Def: $this.is(':checked') ? 1 : 0
		    			};
		    		// console.log(assetData);
	    			blockAssetData.Assets.push(assetData)
	    		})
	    		// console.log(blockAssetData)
	    		blockJSON.push(blockAssetData);
	    	});
	    	// Update the hidden field so the backend can use this data when the form is posted
	    	$('#pdfItemAdmin1_hdnBlockAssets').val(JSON.stringify(blockJSON));
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
			spacingString+= '<input type="number" value="' + blockSpacing + '" id="at-spacing-'+ id +'" class="form-control" ';
				spacingString+= 'data-action="update-canvas-control" data-canvas-setting-type="sp">';
			spacingString+= '<hr>';

			return spacingString;
	    },
	    createTbBlockFromTbgList: function(id, tbBlocks){
	    	var tbBlockList = '';
	    	console.log(tbBlocks);
	    	tbBlockList += '<ul class="list-group clear-all list-margin-top" id="tbg-' + id + '">';
	    	console.log(typeof(tbBlocks.length) !== 'undefined');
    		if(typeof(tbBlocks.length) !== 'undefined'){
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
    		}else{
    			var blockId = tbBlocks._id.replace(' ', '');
    			tbBlockList += '<li class="list-group-item" data-tbg-parent="tbg-' + id + '" id="tb-' + blockId +'">';
    				tbBlockList += tbBlocks._title;
    				tbBlockList += '<button type="button" class="btn btn-sm btn-info pull-right" data-action="edit-text-block-defaults">Edit</button>';
    				tbBlockList += '<div class="edit-tb-defaults-container hidden">';
    					tbBlockList += '<button type="button" class="btn btn-warning btn-sm pull-top-right" data-action="close-text-block-defaults">Back</button>'
    					tbBlockList += app.cp.createTextBlockBlockSettings(tbBlocks, true);
      				tbBlockList += '</div>';
	    		tbBlockList += '</li>';
    		}    		
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
						fontColorString+= '<input type="radio" ';
							fontColorString+= 'id="block-' + fontColour.rgb.replace(/,/g, '') + '" ';
							fontColorString+= 'name="color-default" data-action="update-canvas-control" data-canvas-setting-type="fc" ';
							fontColorString+= 'value="' + fontColour.rgb + '" ' + isChecked + '>';
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
				fontFaceString+= '<input type="radio" ';
					fontFaceString+= 'id="block-' +  font.ffname.toLowerCase() + '-fface" ';
					fontFaceString+= 'name="ff-defualt" data-action="update-canvas-control" data-canvas-setting-type="ff"';
					fontFaceString+= 'value="' + font.ffname + '" '+ isChecked +'>';
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
				fontSizeString+= '<input type="radio" id="block-' + fsize.size + '-fsize" ';
						fontSizeString+= 'name="fsize-default" data-action="update-canvas-control" data-canvas-setting-type="fs" ';
						fontSizeString+= 'value="' + fsize.size + '" '+ isChecked +'>';
				fontSizeString+= '<label for="block-' + fsize.size + '-fsize">' + fsize.sizeName + '</label>';
			});

			return fontSizeString;
	    },
	    createlineHeightSetting: function(id, lineHeight){
	    	var lineHeightString = '',
	    		blockLineHeight  = typeof(lineHeight) !== 'undefined' ? lineHeight.replace('%', '') : '';

	    	lineHeightString+= '<div class="col-md-7">';
				lineHeightString+= '<h3 class="block-item-heading">Line Height</h3>';
				lineHeightString+= '<input type="number" data-action="update-canvas-control" data-canvas-setting-type="lh" ';
					lineHeightString+= 'value="' + blockLineHeight + '" id="at-maxlength'+ id +'" class="form-control" min="75" max="150">';
			lineHeightString+= '</div>';

			return lineHeightString;
	    },
	    createMaxLengthSetting: function(id, maxLength){
	    	var spacingString 	= '',
	    		blockMaxlength  = typeof(maxLength) !== 'undefined' ? maxLength : '';

	    	spacingString+= '<div class="col-md-5">';
				spacingString+= '<h3 class="block-item-heading">Max length</h3>';
				spacingString+= '<input type="number" data-action="update-canvas-control" data-canvas-setting-type="ml" ';
					spacingString+= 'value="' + blockMaxlength + '" id="at-maxlength'+ id +'" class="form-control">';
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
					alignmentString+= '<input type="radio"  data-action="update-canvas-control" data-canvas-setting-type="ah" ';
						alignmentString+= 'id="' + id + '-h-left" class="hidden show-border-when-selected" name="ap-h-pos" ' + halignLeft + ' value="left">';
	          		alignmentString+= '<label class="align-icon align-left" for="' + id + '-h-left"></label>';
	          	alignmentString+= '</span>';
	          	alignmentString+= '<span>';
	          		alignmentString+= '<input type="radio" data-action="update-canvas-control" data-canvas-setting-type="ah" ';
	          			alignmentString+= 'id="' + id + '-h-center" class="hidden show-border-when-selected" name="ap-h-pos" ' + halignCenter + ' value="center">';
	          		alignmentString+= '<label class="align-icon align-center" for="' + id + '-h-center"></label>';
	          	alignmentString+= '</span>';
	          	alignmentString+= '<span>';
	          		alignmentString+= '<input type="radio" data-action="update-canvas-control" data-canvas-setting-type="ah" ';
	          			alignmentString+= 'id="' + id + '-h-right" class="hidden show-border-when-selected" name="ap-h-pos" ' + halignRight + ' value="right">';
	          		alignmentString+= '<label class="align-icon align-right" for="' + id + '-h-right"></label>';
	          	alignmentString+= '</span>';
	        alignmentString+= '</div>';
	         	
			alignmentString+= '<div class="col-md-6">';
				alignmentString+= '<span>';
					alignmentString+= '<input type="radio" data-action="update-canvas-control" data-canvas-setting-type="av" ';
						alignmentString+= 'id="' + id + '-v-top" class="hidden" name="ap-v-pos" ' + valignTop + ' value="top">';
	          		alignmentString+= '<label class="align-icon align-top" for="' + id + '-v-top"></label>';
	          	alignmentString+= '</span>';
	          	alignmentString+= '<span>';
	          		alignmentString+= '<input type="radio" data-action="update-canvas-control" data-canvas-setting-type="av" ';
	          			alignmentString+= ' id="' + id + '-v-middle" class="hidden" name="ap-v-pos" ' + valignCenter + ' value="center">';
	          		alignmentString+= '<label class="align-icon align-middle" for="' + id + '-v-middle"></label>';
	          	alignmentString+= '</span>';
	          	alignmentString+= '<span>';
	          		alignmentString+= '<input type="radio" data-action="update-canvas-control" data-canvas-setting-type="av" ';
	          			alignmentString+= ' id="' + id + '-v-bottom" class="hidden" name="ap-v-pos" ' + valignBottom + ' value="bottom">';
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
				    userSettings+= '<input type="checkbox" data-action="update-canvas-control" data-canvas-setting-type="ma" ';
				    	userSettings+= 'name="onoffswitch" class="onoffswitch-checkbox" ' + isEditable + ' id="at-manditory-' + id + '">';
				    userSettings+= '<label class="onoffswitch-label" for="at-manditory-' + id + '">';
				        userSettings+= '<span class="onoffswitch-inner"></span>';
				        userSettings+= '<span class="onoffswitch-switch"></span>';
				    userSettings+= '</label>';
				userSettings+= '</div>';
			userSettings+= '</div>';
			userSettings+= '<div class="col-md-6">';
				userSettings+= '<div class="onoffswitch">';
					userSettings+= '<h3 class="block-item-heading">Editable?</h3>';
				    userSettings+= '<input type="checkbox" data-action="update-canvas-control" data-canvas-setting-type="ed" ';
				    	userSettings+= 'name="onoffswitch" class="onoffswitch-checkbox" ' + isManditory + ' id="at-editable-' + id + '">';
				    userSettings+= '<label class="onoffswitch-label" for="at-editable-' + id + '">';
				        userSettings+= '<span class="onoffswitch-inner"></span>';
				        userSettings+= '<span class="onoffswitch-switch"></span>';
				    userSettings+= '</label>';
				userSettings+= '</div>';
			userSettings+= '</div>';

	    	return userSettings;
	    },
	    createTextSettings: function(id, block, maxLength){
	     	var blockTextSettings = '',
	    		fromSource		  = typeof(block._source) !== 'undefined' && block._source !== '' ? true : false,
	    		disabledAttr	  = '',
	    		hasMaxLength	  = typeof(maxLength) !== 'undefined' && maxLength > 0,
	    		maxLengthAttr	  = hasMaxLength === true ? 'maxlength="' + maxLength + '"' : '',
	    		blockText;
	    	// console.log(block);

	    	// If the blocks text value is from an external source, retreive the text
	    	if(fromSource === true){
	    		// Do an Ajax request and get the contents
	    		blockText = 'Organised in aid of Macmillan Cancer Support, registered charity in England and Wales (261017), Scotland (SC039907) and the Isle of Man (604). Also operating in Northern Ireland.'
	    		// Set the disabledAttr to disabled, so a user cant change the text
	    		disabledAttr = 'disabled';
	    	} else{
	    		blockText = typeof(block.__text) !== 'undefined' ? block.__text : '';
	    	}

	    	blockTextSettings+= '<label for="text-block-' + id + '" class="block-item-heading">Block Text</label>';
	    	blockTextSettings+= '<textarea id="text-block-' + id + '" class="form-control" data-action="update-block-text" ' + disabledAttr + ' ' + maxLengthAttr + '>';
	    		blockTextSettings+= blockText
	    	blockTextSettings+= '</textarea>';

	    	// Only apply a maxlength if there is one.
	    	if(hasMaxLength){
	    		var charsRemaining = parseInt(maxLength) - blockText.length;
	    		if(charsRemaining < 0){
	    			charsRemaining = 0;
	    		}
				blockTextSettings+= '<p>Characters remaining: <span class="badge">' + charsRemaining +'</span></p>';
	    	}  	

	    	return blockTextSettings;
	    },
	    createBlockImgAssetItem: function(assetId, blockId, isChecked, imgUrl){
	    	// This function creates a unordered list, that contains the block's image options
	    	var assetItemString = '';
	    	console.log(imgUrl)
	    		// img-url'

	        	assetItemString+= '<tr>';
	        		assetItemString+= '<td>';
	        			assetItemString+= '<button type="button" data-action="update-block-img-on-canvas"  data-blockid="' + blockId + '" ';
	        					assetItemString+= 'data-img-url="' + imgUrl + '" class="show-asset-on-canvas-btn">';
	        				assetItemString+= '<img src="' + imgUrl + '" alt="image name" data-assetid="' + assetId + '" class="block-asset-thumb">';
	        			assetItemString+= '</button>';
	        		assetItemString+= '</td>';
	        		assetItemString+= '<td>';
	        			assetItemString+= '<input type="radio" '+ isChecked +' data-action="update-canvas-control" ';
	        				   assetItemString+= 'data-canvas-setting-type="bi" data-assetid="' + assetId + '" ';
	        			       assetItemString+= 'value="assets/img/demo-thumbs/' + assetId + '.jpg" name="asset-default-block_' + blockId + '" ';
	        			       assetItemString+= 'id="block_' + blockId + '_asset_' + assetId + ' ">';
	        			assetItemString+= '<label for="block_' + blockId + '_asset_' + assetId + '">image name</label>';
	        		assetItemString+= '</td>';
	        		assetItemString+= '<td>';
	        			assetItemString+= '<button type="button" class="btn btn-danger" data-action="remove-block-img" ';
	        				assetItemString+= 'data-img-url="' + imgUrl + '" data-id="' + blockId + '" >X</button>';
	        		assetItemString+= '</td>';
	        	assetItemString+= '</tr>';

	    	return assetItemString
	    },


		/** 
	      DOCUMENT EVENT HANDLER
	    **/
	    bindCreateProductDomEvents: function(){
	    	var $body = $('body');
	    	$body.on('click', '[data-action=load-from-product]', app.cp.loadExistingProduct);
	    	$body.on('click', '[data-action=edit-text-block-defaults]', app.cp.toggleEditTbFromTbg);
	    	$body.on('click', '[data-action=close-text-block-defaults]', app.cp.closeEditTbFromTbg);

	    	$body.on('click', '[data-action=toggle-product-block]', function(){
	    		app.cp.deactiveCanvasObj();
	    		app.cp.toggleOptions($(this), '.cp-block-container');
	    	});
	    	// Debounce this event, so it doesnt occur on every keypress/focus as the next process is processor heavy.
	    	// https://code.google.com/p/jquery-debounce/
	    	// When focusing or typing on these textareasm update the relevant canvas object with the new text value
	    	$body.on('keyup focus', '[data-action=update-block-text]', function(){
	    		$.debounce(app.cp.updateCanvasBlockText($(this)), 500);
	    	});
	    	// After finishing editing a canvas objects's text, handle that event
	    	$body.on('blur', '[data-action=update-block-text]', app.cp.textareaBlurHandler);

	    	// PRODUCT CREATION TOOLS
	    	// Saves a new product's XML
	    	$('[data-action=save-product]').on('click', function(){
	    		// Set what type of request this is. Required by the utils.generateXML
	    		app.isCreateTemplate = false;
	    		// Create JSON for each image block
	    		app.cp.createImageBlockAssetJSON();
	    		// Generate the Canvas's JSON and then group any text block groups into groups.
	    		var _flattenedCanvasData = app.utils.generateFlattendedJSON(app.utils.generateJSON(app._cp_canvas));
	    		// Create a preview image on the page of what is on the canvas
	    		app.utils.generateCanvasPreviewImg(app._cp_canvas, 'cp');
	    		app.utils.generateCords(_flattenedCanvasData);
	    	});
	    	// Listens for change and click events, and then updates the active canvas object with the new value
	    	$body.on('change keyup', '[data-action=update-canvas-control]', app.cp.updateCanvasObjSetting);

	    	var $productToggleBtn = $('.product-container [data-action=toggle-grid]');	    	
      		$productToggleBtn.on('click', function(){
	        	app.utils.toggleCanvasGrid($(this), false, app._cp_canvas);
	     	});
	     	// Downloads an image of what is on the canvas 
      		$('.product-container [data-action=download-thumbnail]').on('click', function(){
      			app.utils.covertCanvasToImgDownload($(this), app._cp_canvas);
      		});

      		// Initiate the usage of the asset Library
      		$body.on('click', '[data-action=add-images-to-block]', app.cp.initAssetLibrary);
      		// Save Assets to block
      		app.$saveBlockAssetBtn.on('click', app.cp.saveAssetsToBlock);
      		// Close Asset Library Without Saving      		
      		$('[data-action=close-asset-library]').on('click', app.cp.closeAssetLibrary);
      		// Updates the canvas with the relevant image selected with the image block
      		$body.on('click', '[data-action=update-block-img-on-canvas]',  function(){
      			app.cp.setActiveBlockImage($(this));
      		});
      		// Remove an asset from a block
      		$body.on('click', '[data-action=remove-block-img]', app.cp.removeAssetFromBlock);		

      		// UI CONTROLS
      		// Determines whether to create a new template/Sub template or not when creating a product
      		$('#non-variant').on('click', app.cp.toggleIsVarient);
	    },
	    textareaBlurHandler: function(){
	    	// console.log(app._activeEditEl);
	    	// console.log(app._cp_canvas);
	    	app.cp.deactiveCanvasObj();	    			
    		// var blockSettings   = app.utils.createTextBlockSettings(app._activeEditEl),
    		// 	_formattedBlock = app.utils.wrapCanvasText(app._activeEditEl, app._cp_canvas, app._activeEditEl.origWidth, 0, app._activeEditEl.textAlign),
    		// 	_updatedBlock   = app.utils.setTextBlockSettings(_formattedBlock, blockSettings);
    		// // console.log(_formattedBlock);
    		// // Remove the old block
    		// // console.log(app._activeEditEl)
    		// app._cp_canvas.remove(app._cp_canvas.getActiveObject()).renderAll();
    		// // console.log(app._cp_canvas.getActiveObject(), app._activeEditEl);
    		// // console.log(app._cp_canvas);
    		// app.cp.deactiveCanvasObj();

    		// // Add the newly reformatted block
    		// //console.log(_updatedBlock);
    		// app._cp_canvas.add(_updatedBlock).renderAll();
    		// // console.log(app._cp_canvas);
    		// // Make the activeEditEl null as there is not longer an active element.
    		// app._activeEditEl = null;
    		// Update the objects on the canvas
    		// This function crashes the browser
    		// app.utils.createFilteredCanvasObjects();
	    }
	};
	app.cp.initCreateProduct();
});