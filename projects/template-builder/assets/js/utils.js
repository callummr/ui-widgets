var app = app || {},
// Need to add jquery no conflict as storefront already uses 1.3
_$ = jQuery.noConflict();

// Required to use _$ instead of $ to do a multiple versions of jquery being loaded.

_$(document).ready(function(){
	'use strict';
	// _$ = dom elements
	// _ = fabric elements

	// Canvas Elements/Settings
	app._ct_canvas;
	app._cp_canvas;
	app.canvasMargins = {}
	app.canvasScale;
	app.stageCanvasScale;

	// Grid Squares
	app.gridSquare      = 8;

	// Units/Measurements
	app.ptSize          = 0.75; // 1px > 1pt
	app.mmSize          = 0.2645833333333; // 1px > 1mm
	app.MMtoPxSize      = 3.779527559055; // 1mm > 1px
	app.ptToPxSize		= 1.333333333333; // 1pt > 1px
	app.pxToPtSize		= 0.75; // 1px > 1pt

	// Template Creation Settings/Values
	app.defaultMaxCharLength = 2500;
	app.defaultLineHeight = 100;
	app.defaultFontSize = 16;
	app.defaultFontFace = 'FuturaBT-Book';
	app.orientation;
	app.templateType    = 'default';
	app.imagedata;
	app.docDimensions   = [];
	app.templateName;
	app.templateId      = null;
	app.tempGroupCnt    = 0;
	app.tempGBlockCnt   = 0;

	// State Handlers
	app.isCreateTemplate = false;
	app.isCreateProduct  = false;
	app.isUpdateProduct  = false;

	// Temprory variable. Should be replaced by and Ajax request
    app.termsAndConditionsString = 'Organised in aid of Macmillan Cancer Support, registered charity in England and Wales (261017), Scotland (SC039907) and the Isle of Man (604). Also operating in Northern Ireland.';


	app.fontColours		=	[
								{
									rgb:       '140,198,63',
									cmyk:      '50,0,100,0',
									name:  	   'Light Green',
									className: 'color-light-green',
									isDefault: true // This setting is required for when creating a template we can set a default
								},								
								{
									rgb:       '0,162,70',
									cmyk:      '94,0,100,0',
									name:  	   'Mid Green',
									className: 'color-mid-green'
								},
								{
									rgb:       '0,92,70',
									cmyk:      '100,0,75,45',
									name:  	   'Dark Green',
									className: 'color-dark-green'
								},
								{
									rgb:       '104,44,136',
									cmyk:      '53,99,0,0',
									name:  	   'Pop Purple',
									className: 'color-purple'
								},
								{
									rgb:       '241,131,21',
									cmyk:      '0,60,100,0',
									name:  	   'Pop Orange',
									className: 'color-orange'
								},
								{
									rgb:       '227,35,51',
									cmyk:      '0,100,80,0',
									name:  	   'Pop Red',
									className: 'color-red'
								},
								{
									rgb:       '154,204,201',
									cmyk:      '55,0,35,0',
									name:  	   'Sensitive Turquoise',
									className: 'color-turquoise'
								},
								{
									rgb:       '140,157,184',
									cmyk:      '43,30,20,0',
									name:  	   'Sensitive Lilac',
									className: 'color-lilac'
								},
								{
									rgb:       '192,97,91',
									cmyk:      '10,70,60,0',
									name:  	   'Sensitive Brown',
									className: 'color-brown'
								},
								{
									rgb:       '0,0,0',
									cmyk:      '75,68,97,90',
									name:  	   'Black',
									className: 'color-black'
								}

							];
	app.fontFaces		=   [
								{
									ffname: 'FuturaBT-Book',
									fftitle: 'Regular',
									isDefault: true // This setting is required for when creating a template we can set a default
								},
								{
									ffname: 'FuturaBT-Medium',
									fftitle: 'Medium'
								},
								{
									ffname: 'FuturaBT-Heavy',
									fftitle: 'Heavy'
								},
								{
									ffname: 'Macmillan-Headline',
									fftitle: 'Headline'
								}
							];
	app.lineHeights		=   [
								{
									lineHeight: 75									
								},

								{
									lineHeight: 100,
									isDefault: true // This setting is required for when creating a template we can set a default
								},
								{
									lineHeight: 125
								}
							];
	
	// DOM elements
	app._$tempBlockName  	= _$('#at-block-title');
	app._$documentSizeBtns  = _$('input[name=doc-size]');
	app._$body 				= _$('body');

	// Enviornment Check
	var host = document.location.hostname;
	app.isLocalEnv      = host ===  "widget.macmillan.org.uk" || host === "localhost";
	app.templateDatURL  = '';
	
	// Sets the default templates and some example text for textblocks
	if(app.isLocalEnv){
		app.dummyText = _$.get('assets/data/dummy-text.txt', function(data){return data}, 'text');
		app.templateDatURL = 'assets/data/data.templates.txt';
	}else{
		app.dummyText = _$.get('/be/assets/data/dummy-text.txt', function(data){return data}, 'text');
		app.templateDatURL = '/be/api/PDF/Template.ashx';
	}

	app.utils = {
		/**
			UTIL FUNCTION
		**/
		initUtils: function(){
			app.utils.setFontSize();
		},
		setFontSize: function(){
			app.fontSizes		= 	[
									{
										sizeName: 'X Small',
										ptSize: 9,
										pxSize: app.utils.convertPtToPx(9)
									},
									{
										sizeName: 'Small',
										ptSize: 16,
										pxSize: app.utils.convertPtToPx(16)
									},
									{
										sizeName: 'Medium',
										ptSize: 20,
										pxSize: app.utils.convertPtToPx(20),
										isDefault: true // This setting is required for when creating a template we can set a default
									},
									{
										sizeName: 'Large',
										ptSize: 36,
										pxSize: app.utils.convertPtToPx(36)
									},
									{
										sizeName: 'X-Large',
										ptSize: 44,
										pxSize: app.utils.convertPtToPx(44)
									}
								];
		},
		filterResponse: function(data){
	      // Ugly way of dealing with store front response which contains extra junk in the request.
	      // This cleans up the reponse so it can be parsed as JSON.
	      var response  = data,
	          start     = response.indexOf('['),
	          fin       = response.indexOf(']');
	      return response.substr(start,fin+1)
	    },
	    steppedOptionHandler: function(_$el){
	      // console.log(_$el);
	      var $this               = _$el,
	          $activeContainer    = _$('.active-option'),
	          activeStep          = $activeContainer.data('step'),
	          btnPrimaryAction    = $this.data('step-action'),
	          btnSecondaryAction  = $this.data('step-secondaction');

	      $activeContainer.fadeOut(100, function(){
	        $activeContainer.removeClass('active-option');
	        btnPrimaryAction === 'forward'? activeStep++ : activeStep--;
	        var $newActiveEl = _$('[data-step=' + activeStep + ']');
	        $newActiveEl.find(_$('[data-step-target=' + btnSecondaryAction +']')).removeClass('hidden');
	        $newActiveEl.fadeIn(100, function(){
	          $newActiveEl.addClass('active-option');
	        });
	      });
	    },
	    rgbToCMYK: function(color){
	    	console.log(color)
	    	var rgb  = color.replace('rgb(', '').replace(')', ''),
	    		cmyk = '75,68,97,90'; // Black by default
	    	console.log(rgb)	    		

	    	app.fontColours.forEach(function(colorOpt){
	    		if(rgb === colorOpt.rgb){
	    			cmyk = colorOpt.cmyk
	    		}
	    	});

	    	return cmyk;
	    },
	    cmykToRGB: function(color){
	    	var cmyk  = color,
		    	rgb   = 'rgb(0,0,0)'; // Black by default
	    	if(typeof(cmyk) !== 'undefined'){
		    	app.fontColours.forEach(function(colorOpt){
		    		if(cmyk === colorOpt.cmyk){
		    			rgb = 'rgb(' + colorOpt.rgb + ')';
		    		}
		    	});
	    	}    	
	    	return rgb;
	    },
	    convertPxToMM: function(width){
	    	// console.log('DEBUG: convertPxToMM:', Math.floor(width * app.mmSize))
	    	return Math.floor(width * app.mmSize)
	    },	    
	    convertPtToPx: function(size){
	    	// console.log(size, app.ptToPxSize, size * app.ptToPxSize)
	    	// console.log( 'convertPtToPx: ' +  Math.round(parseInt(size) * app.ptToPxSize) )
	    	return Math.round(parseInt(size) * app.ptToPxSize)
	    },
	    convertPxToPt: function(size){
	    	console.log(Math.round((parseInt(size) * app.pxToPtSize) / app.canvasScale))
	    	return Math.round((parseInt(size) * app.pxToPtSize) / app.canvasScale)
	    },
	    convertMMtoPX: function(unit){
	    	// console.log(unit, canvasScale);
	    	// Multiple the MM unit by it's the MMtoPxSize to get the pixel and then round it up
	    	var pxUnit = Math.ceil(parseInt(unit) * app.MMtoPxSize);

		    if(pxUnit < 0){
		        return 0
		    } else{
		    	return pxUnit
		    }
	    },
	    convertLineheight: function(lineheight){
	    	var wholeNumber = isNaN(lineheight) ? parseInt(lineheight) : lineheight;
	    	// console.log((wholeNumber * 100).toString()  + '%')
	    	return (wholeNumber * 100).toString() + '%'
	    },
	    setDocumentSizeandScale: function(){
	      // X, Y, % of A4.
	      // console.log(app.orientation);
	      // console.log(app.docDimensions);

	      console.log(app.orientation, app.templateType, app.docDimensions);

	      if(app.templateType !== 'default'){
	       	return [88,55, 1]      // Business Card 
	      } else{
	        if(app.orientation === 'p' && app.docDimensions[0] === 'A2'){
	          return [420,594,2]      // A2 Portrait
	        } else if(app.orientation === 'l' && app.docDimensions[0] === 'A2'){  
	          return [594,420,2]      // A2 Landscape
	        } else if(app.orientation === 'p' && app.docDimensions[0] === 'A3'){
	          return [297,420,1.4142] // A3 Portrait
	        } else if(app.orientation === 'l' && app.docDimensions[0] === 'A3'){  
	          return [420,297,1.4142] // A3 Landscape
	        } else if(app.orientation === 'p' && app.docDimensions[0] === 'A4'){
	          return [210,297,1]      // A4 Portrait
	        } else if(app.orientation === 'l' && app.docDimensions[0] === 'A4'){  
	          return [297,210,1]      // A4 Landscape
	        } else if(app.orientation === 'p' && app.docDimensions[0] === 'A5'){
	          return [148,210,0.7071] // A5 Potrait
	        } else if(app.orientation === 'l' && app.docDimensions[0] === 'A5'){
	          return [210,148,0.7071] // A5 Landscape
	        } else if(app.orientation === 'p' && app.docDimensions[0] === 'A6'){
	          return [105,148,0.5]    // A6 Potrait
	        } else if(app.orientation === 'l' && app.docDimensions[0] === 'A6'){
	          return [148,105,0.5]    // A6 Landscape
	        } else if(app.orientation === 'p' && app.docDimensions[0] === 'A7'){
	          return [74,105,0.3536]  // A7 Potrait
	        } else if(app.orientation === 'l' && app.docDimensions[0] === 'A7'){
	          return [105,74,0.3536]  // A7 Landscape
	        } else{
	        	alert('Ivalid Document Size');
	        	return [210,297,1] // A4 Portrait as a default
	        }
	      }     
	    },	    
        setProductDimensions: function(size){
        	// console.log(app.docDimensions);

			var patt = new RegExp('A[0-9]'),
				res;
        	// Handle business card options
    		// Test for A-Something format doc size. If found remove the business card option.
    		// Otherwise remove all of the A- options
    		res = patt.test(size);
    		// Remove the default checked setting
    		_$('#a4').prop('checked', false);
    		if(res === true){
    			// Hide the business type option as a user cannot change an A4 document into a business card
    			_$('.doc-size-business').parent().addClass('hidden');
    			_$('input[value="' + size + '"]').prop('checked', true).addClass('template-default-size');
    		} else{
    			// Hide all A- options as a user cannot change an Business Card to an A- document
    			_$('input[id^=a]').parent().addClass('hidden');
    			_$('input[value="' + size + '"]').prop('checked', true).attr('disabled', 'disabled');
    		}
        },

        /**
			UI DOM CHANGES
        **/
        setSelectedOption: function () {
            var _$this = _$(this);
            _$this.siblings().removeClass('option-selected').end()
                 .addClass('option-selected');
        },

	    /**
			CREATE CANVAS & CANVAS ELEMENTS FUNCTIONS
	    **/

	    drawGrid: function(_canvas){
	      var gridLines = [],
	      	  _grid,
	      	  maxCanvasDimension = _canvas.width > _canvas.height ? _canvas.width : _canvas.height;

	      // Create grid lines
	      for (var i = 0; i < (maxCanvasDimension/app.gridSquare); i++) {
	        gridLines.push(new fabric.Line([ i * app.gridSquare, 0, i * app.gridSquare, maxCanvasDimension], { stroke: '#F0F0F0'}));
	        gridLines.push(new fabric.Line([ 0, i * app.gridSquare, maxCanvasDimension, i * app.gridSquare], { stroke: '#F0F0F0'}));
	      }

	      // Create bleedarea for the canvas
	      var _bleedarea = new fabric.Rect({
								      		fill: 'rgba(255,255,255,0)',
							                hasBorders: false,
							                hasRotatingPoint: false,
							                height: _canvas.height - app.canvasMargins.bleed,
							                left: 0,
							                lockRotation: true,
							                top: 0,
							                width: _canvas.width - app.canvasMargins.bleed,
							                strokeWidth: app.canvasMargins.bleed,
							                stroke: 'rgba(205,205,205,0.5)'
							            });

		  gridLines.push(_bleedarea);
	      _grid = new fabric.Group(gridLines, {
	                  left: 0,
	                  top: 0,
	                  selectable: false
	                });
	      _canvas.add(_grid).renderAll();
	    },	    
	    cleanCanvas: function(_canvas){
	      _canvas._objects[0]['visible'] = false;
	      _canvas.deactivateAll().renderAll();
	    },	    
	    toggleCanvasGrid: function($el, toggle, _canvas){
	    	// console.log($el);
		    if($el.hasClass('grid-disabled')){
		        $el.removeClass('grid-disabled');
		        _canvas._objects[0]['visible'] = true;
		    } else{
		    	$el.addClass('grid-disabled');
		    	_canvas._objects[0]['visible'] = false;
		    }

	      	// Show the grid, after saving the image and generating PDF
	      	if(toggle === true){
	        	_canvas._objects[0]['visible'] = true;
	      	}
	      	_canvas.renderAll();
	    },
	    setCanvasSettings: function(docWidth, docHeight){
	    	// console.log(docWidth, docHeight)
	    	var settings = {};
	    	// Set the orientation
			if(docWidth < docHeight){
				app.orientation   = 'p'; // Portrait
				_$('#template-orientation').text('Portrait');
			}else{
				app.orientation   = 'l'; // Landscape
				_$('#template-orientation').text('Landscape');
			}

	    	// Set the width of the canvas based on asset type. All assets use an A4 as a base, except business cards
			if((docWidth >= 85 && docWidth <= 88) && docHeight === 55){        
				app.templateType  = 'business';
				settings.width    = 332;
				settings.height   = 207;
				app.utils.setCanvasBleedSettings(5);
			} else{
				if(docWidth < docHeight){
				 	settings.width  = 396;
				 	settings.height = 561;
				} else{
				 	settings.width  = 561;
				 	settings.height = 396;
				}
				app.utils.setCanvasBleedSettings(10);
			}

			// Set the level of scaling so the when converting the cooridinates to pixels that are accurate      
			if((docWidth === 420 && docHeight === 594) || (docHeight=== 420 && docWidth === 594)){
				// A2 = 420x594 or 594x420
				app.canvasScale = 2;
			} else if((docWidth === 297 && docHeight === 420) || (docHeight=== 297 && docWidth === 420)){
				// A3 = 297x420 or 420x297
				app.canvasScale = 1.4142;
			} else if((docWidth === 210 && docHeight === 297) || (docHeight=== 210 && docWidth === 297)){
				// A4 = 210x297 or 297x210
				app.canvasScale = 1;
			} else if((docWidth === 148 && docHeight === 210) || ((docHeight === 148 || docHeight === 148.5) && docWidth === 210)){
				// A5 = 148x210 or 210x148
				app.canvasScale = 0.7071;    
			} else if((docWidth === 105 && docHeight === 148) || (docHeight >= 104 && docHeight <= 105 && docWidth === 148)){
				// A6 = 105x148 or 148x105
				app.canvasScale = 0.5;
			} else if((docWidth === 74 && docHeight === 105) || (docHeight === 74 && docWidth === 105)){
				// A7 = 74x105 or 105x74
				app.canvasScale = 0.3536;
			} else if((docWidth >= 85 && docWidth <= 88) && docHeight === 55){
				// Business Card = 85x55
				app.canvasScale = 1;
			} else{
                app.canvasScale = 1;
			}
			return settings;
	    },
	    setCanvasBleedSettings: function(marginSize){
	    	console.log(app.stageCanvasScale)
	    	if(typeof(app.stageCanvasScale) === 'undefined'){
	    		app.stageCanvasScale = app.templateType === 'default' ? 2.0174 : 1;
	    	}
	    	// Set the canvas margin (10mm for standard A4 Documents) / Divided by the canvas scale
	    	// Set the canvas margin (5mm for standard Business Cards) / Divided by the canvas scale
            app.canvasMargins.bleed = Math.ceil(Math.ceil(10 * app.MMtoPxSize) / app.stageCanvasScale);
            // Make the number a multiple of 8, so its fits to the grid properly
            app.canvasMargins.bleed = Math.ceil(app.canvasMargins.bleed / 8) * 8;
	    },
	    setCanvasMaxMargins: function(_canvas){
	    	var canvasWidth  = _canvas.width,
	    		canvasHeight = _canvas.height;

	    	app.canvasMargins.maxLeft   = app.canvasMargins.bleed;
	    	app.canvasMargins.maxRight  = canvasWidth - app.canvasMargins.bleed;
	    	app.canvasMargins.maxTop    = app.canvasMargins.bleed;
	    	app.canvasMargins.maxBottom = canvasHeight - app.canvasMargins.bleed; 
	    },

	    // Need to refactor the above and below functions so there is only 1 that does both as they are very similar.

	    dimensionlessDocSettings: function(docWidth, docHeight){
	    	console.log(docWidth, docHeight)
	    	// Set the level of scaling so the when converting the cooridinates to pixels that are accurate      
			if((docWidth === 420 && docHeight === 594) || (docHeight=== 420 && docWidth === 594)){
				// A2 = 420x594 or 594x420
				return ['A2'];
			} else if((docWidth === 297 && docHeight === 420) || (docHeight=== 297 && docWidth === 420)){
				// A3 = 297x420 or 420x297
				console.log('a3');
				return ['A3'];
			} else if((docWidth === 210 && docHeight === 297) || (docHeight=== 210 && docWidth === 297)){
				// A4 = 210x297 or 297x210
				return ['A4'];
			} else if((docWidth === 148 && docHeight === 210) || ((docHeight === 148 || docHeight === 148.5) && docWidth === 210)){
				// A5 = 148x210 or 210x148
				return ['A5'];    
			} else if((docWidth === 105 && docHeight === 148) || (docHeight >= 104 && docHeight <= 105 && docWidth === 148)){
				// A6 = 105x148 or 148x105
				return ['A6'];
			} else if((docWidth === 74 && docHeight === 105) || (docHeight === 74 && docWidth === 105)){
				// A7 = 74x105 or 105x74
				return ['A7'];
			} else if((docWidth >= 85 && docWidth <= 88) && docHeight === 55){
				// Business Card = 85x55
				return ['Business Card'];
			} else{
				alert('Invalid dimension')
			}
	    },
	    
	    /**
			CANVAS UPDATE FUNCTIONS
	    **/
		selectCanvasPropertyToEdit: function(_$el, canvasobjId){
			var updatedVal = _$el.val(),
				elType	   = _$el.data('canvas-setting-type'),
				elChecked  = _$el.is(':checked');

			// console.log(elType, updatedVal, elChecked);
			// Update the DOM with new values on update
			app.utils.setDomPropertiesOnEdit(_$el, canvasobjId);
			// Futher dom manipulation is needed when updating the max length value		   
			
			switch(elType) {
		        case 'bt': // Block Title
		            return {
		            	blockTitle: updatedVal
		            }
		            break;
		        case 'ff': // Font Face
		            return {
		            	fontFamily: updatedVal
		            }
		            break;
		        case 'fs':
		        	// console.log(app.utils.convertPtToPx(updatedVal))
		            return {
		            	// Need to convert the equvielant of Xpt to Xpx
		            	fontSize: app.utils.convertPtToPx(updatedVal)
		            }
		            break;
		        case 'fc':
		            return {
		            	fontColor: 'rgb(' + updatedVal + ')',
		            	fill: 'rgb(' + updatedVal + ')'
		            }
		            break;
		        case 'ml':
		            return {
		            	maxLength: updatedVal
		            }
		            break;
		        case 'lh':
		            return {
		            	lineHeight: updatedVal / 100
		            }
		            break;
		        case 'ah':
		           	return {
		            	halign: updatedVal
		            }
		            break;
		        case 'av':
		            return {
		            	valign: updatedVal
		            }
		        case 'ma':
		            return {
		            	isManditory: elChecked === true ? true : false
		            }
		            break;
		        case 'ed':
		            return {
		            	isEditable: elChecked === true ? true : false
		            }
		            break;
		        case 'sp':
		            return {
		            	spacing: updatedVal
		            }
		            break;
		        case 'bi':
		            return {
		            	imgSrc: updatedVal
		            }
		        	break;
		    }
		},
		setDomPropertiesOnEdit: function(_$el, canvasobjId){
			var elType 	   = _$el.data('canvas-setting-type'),
				updatedVal = _$el.val();

		    if(elType === 'ml'){
		    	console.log(_$el.attr('id'))
		    	var _$parentBlock	= _$el.closest('[data-prodblockid]'),
		    		_$blockTextArea,
		    		textAreaValue,
		    		charsRemaining;

		    	console.log(_$parentBlock.attr('data-parentblockid'))
		    	if(_$parentBlock.attr('data-parentblockid')){
		    		_$blockTextArea = _$parentBlock.find('[id*=text-blockTextBlockG_]');
		    	} else{
		    		_$blockTextArea = _$parentBlock.find('[id*=text-blockTextBlock]');
		    	}

		    	// Checks if the textarea is from a textblock group or a standalone text block
		    	// console.log(_$('[id*=text-blockTextBlockG_' + blockId + ']').length)
		    	// if(_$('[id*=text-blockTextBlockG_' + blockId + ']').length > 0){ // _-text-blockTextBlock_2
		    	// 	_$blockTextArea = _$('[id*=text-blockTextBlockG_' + blockId + ']') 
		    	// } else{
		    	// 	_$blockTextArea =  _$('[id*=text-blockTextBlock_' + blockId + ']')
		    	// }
		    	// console.log(_$blockTextArea )
		    	
		    	// Set the texatrea value and the chars remaining length
	    		textAreaValue   = _$blockTextArea.val(),
	    		charsRemaining	= parseInt(updatedVal) - textAreaValue.length;

		    	if(charsRemaining < 0 || isNaN(charsRemaining) ){
		    		charsRemaining = 0;
		    	}

		    	// _$blockTextArea.next().find('.badge').css('background', 'red');

		    	// Update the UI to show how many characters are left
		    	_$blockTextArea.next().find('.badge').html(charsRemaining);

		    	// Update the text string so it has the correct number of characters
		    	textAreaValue = textAreaValue.substr(0, parseInt(updatedVal));
		    	console.log(charsRemaining, textAreaValue)

		    	// Update the textarea's attribute and value
		    	_$blockTextArea.attr('maxlength', updatedVal).val(textAreaValue);

		    	// Update the canvas obj with the new text value
		    	app.utils.setActiveTextBlockText(textAreaValue, canvasobjId);
		    }
		},
		setActiveTextBlockText: function(textAreaValue, canvasBlockId){
			app._activeEditEl = null;
			// This function updates the relevant canvas obj, after the maxlength control has been changed
			// Set the relevant object to its active state
            app.cp.setActiveCanvasObj(canvasBlockId);
            console.log(app._activeEditEl)
			app._activeEditEl.set({
				text: textAreaValue,
				textVal: textAreaValue
			});
			app._activeEditEl.setCoords();
			app._cp_canvas.renderAll();
		},

		/**
			CANVAS EVENTS
		**/
		activeKeyboardMovements: function(_currentActiveObj, _canvas){
			var _activeObj = _currentActiveObj;

			// MULTIPLE OBJECTS ARE MOVING...

			app._$body.on('keydown', function(e){
				if(e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40){
					// Prevent the page scrolling
					e.preventDefault();
					if(e.keyCode === 37){
						// Left Arrow
						if((_activeObj.left - app.gridSquare) > app.canvasMargins.maxLeft){					
							_activeObj.set({
								left: _activeObj.left - app.gridSquare
							});	
						} else{
							_activeObj.set({
								left: app.canvasMargins.maxLeft
							});
						}
					} else if(e.keyCode === 38){
						// Up Arrow
						if((_activeObj.top - app.gridSquare) > app.canvasMargins.maxTop){
							_activeObj.set({
								top: _activeObj.top - app.gridSquare
							});
						} else{
							_activeObj.set({
								top: app.canvasMargins.maxTop
							});
						}
					} else if(e.keyCode === 39){
						// Right Arrow
						console.log((_activeObj.left + (_activeObj.width * _activeObj.scaleX) + app.gridSquare) , app.canvasMargins.maxRight)
						if((_activeObj.left + (_activeObj.width * _activeObj.scaleX) + app.gridSquare) < app.canvasMargins.maxRight){
							_activeObj.set({
								left: _activeObj.left + app.gridSquare
							});
						} else{
							_activeObj.set({
								left: app.canvasMargins.maxRight - _activeObj.width
							});
						}
					} else if(e.keyCode === 40){
						// Down Arrow
						if((_activeObj.top + (_activeObj.height * _activeObj.scaleY) + app.gridSquare) < app.canvasMargins.maxBottom){
							_activeObj.set({
								top: _activeObj.top + app.gridSquare
							});
						} else{
							_activeObj.set({
								top: app.canvasMargins.maxBottom - _activeObj.height
							});
						}
					}
					_activeObj.setCoords();
					_canvas.renderAll();

					// Add delete and backspace to delete canvas OBJ and relevant block..	
				}
			});
		},
		constrainGridMovement: function(e, _canvas){
		  var obj = e.target;
	      // Snap to grid
	      obj.set({
	        left: Math.round(obj.left / app.gridSquare) * app.gridSquare,
	        top: Math.round(obj.top / app.gridSquare) * app.gridSquare
	      });

	      // Only allow movement inside the canvas bounds
	      
	      // // if object is too big ignore
	      // if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
	      //     return;
	      // }        
	      obj.setCoords();        
	      // top-left  corner
	      if(obj.getBoundingRect().top < app.canvasMargins.bleed || obj.getBoundingRect().left < app.canvasMargins.bleed){
	          obj.top = Math.max(obj.top, obj.top-obj.getBoundingRect().top + app.canvasMargins.bleed);
	          obj.left = Math.max(obj.left, obj.left-obj.getBoundingRect().left + app.canvasMargins.bleed);
	      }
	      // bot-right corner
	      if(obj.getBoundingRect().top+obj.getBoundingRect().height + app.canvasMargins.bleed > obj.canvas.height || obj.getBoundingRect().left+obj.getBoundingRect().width + app.canvasMargins.bleed > obj.canvas.width){
	          obj.top = Math.min(obj.top, obj.canvas.height-obj.getBoundingRect().height+obj.top-obj.getBoundingRect().top - app.canvasMargins.bleed);
	          obj.left = Math.min(obj.left, obj.canvas.width-obj.getBoundingRect().width+obj.left-obj.getBoundingRect().left - app.canvasMargins.bleed);
	      }

	      // Sets the drawmax width and height of an element
	      // console.log(_canvas.width, app.canvasMargins.bleed * 2)
	      var objWidth  = obj.width * obj.scaleX,
	      	  objHeight = obj.height * obj.scaleY,
	      	  maxWidth  = _canvas.width  - (app.canvasMargins.bleed * 2),
	      	  maxHeight = _canvas.height - (app.canvasMargins.bleed * 2);

	      // Handle width
	      if(objWidth > maxWidth){
	      	obj.set({
	      		width: maxWidth,
	      		left: app.canvasMargins.bleed,
	      		scaleX: 1
	      	});
	      }

	      // Handle height
	      if(objHeight > maxHeight){
	      	obj.set({
	      		height: maxHeight,
	      		top: app.canvasMargins.bleed,
	      		scaleY: 1
	      	});
	      }

	      // Updates the canvas and an obj's coordinates
	      _canvas.renderAll();
	      obj.setCoords();	      	      
	    },
	    bindGlobalCanvasEvents: function(){
	    	// This event handler stops elements being moved outside of the canvas element when moving an element on the canvas
	    	if(typeof(app._ct_canvas) !== 'undefined'){
	    		app._ct_canvas.on('object:moving', function(e) {
					app.utils.constrainGridMovement(e, app._ct_canvas);
				});
				// This event handler stops elements being moved outside of the canvas element when and element is being modified (resized)
				app._ct_canvas.on('object:modified', function(e) {
					app.utils.constrainGridMovement(e, app._ct_canvas);
				});
	    	}

	    	if(typeof(app._cp_canvas) !== 'undefined'){
	    		app._cp_canvas.on('object:moving', function(e) {
					app.utils.constrainGridMovement(e, app._cp_canvas);
				});
				// This event handler stops elements being moved outside of the canvas element when and element is being modified (resized)
				app._cp_canvas.on('object:modified', function(e) {
					app.utils.constrainGridMovement(e, app._cp_canvas);
				});
	    	}	
	    },

	    /**
      		Functions needed to prepare template/product for export
	    **/
	    generateJSON: function(_canvas){
	      // Pass through additional attributes to generated JSON
	      var canvasData = _canvas.toJSON([
	        'blockId',
	        'blockTitle',
	        'blocktype',
	        'fontColor',
	        'fontFamily',
	        'fontSize',
	        'halign',
	        'id',
	        'imgSrc',
	        'isEditable',
	        'isManditory',
	        'label',
	        'lineHeight',
	        'maxLength',
	        'spacing',
	        'stringSrc',	        
	        'textVal',
	        'valign',	        
	        'parentId',
			'parentTitle',
			'parentEditable',
			'parentManditory',
			'parentHalign',
			'parentValign',
			'parentHeight',
			'parentWidth',	
	      ]);
	      // console.log(app.orientation);
	      // console.log(app.templateType);
	      // Remove the grid element group from data
	      canvasData.objects.shift();
	      // Add additional properties to the canvas size and orientation is stored.
	      // console.log(app.docDimensions);
	      canvasData['canvasSize']        = app.templateType;
	      canvasData['canvasOrientation'] = app.orientation;
	      canvasData['templateName']      = app.templateName;
	      canvasData['availableSize']     = app.docDimensions;
	      console.log(canvasData);     
	      // console.log(JSON.stringify(canvasData));      
	      return canvasData.objects
	    },
	    generateFlattendedJSON: function(canvasJSON){
	    	// console.log(canvasJSON);
	    	// When the canvas's JSON is created at a product level, the text-blocks which should be in
		    // a group need to be reformatted in the JSON so it can generate the correct XML
		    var flattenedBlocks = [],
		    	blockIds 		= [];

			canvasJSON.forEach(function(block){				
				var isGroupElement = typeof(block.parentId) !== 'undefined';
				console.log(block);
				if(blockIds.indexOf(block.parentId) < 0){
					if(isGroupElement){
						// Create a new group obj
						var groupEl = {
							'blockId': block.parentId,
							'blocktype': 'new-text-block-group',	
							'halign': block.parentHalign,
							'height': block.parentHeight,
							'isEditable': block.parentEditable,
							'isManditory': block.parentManditory,
							'left': block.left,
							'objects': [block],
							'scaleX': 1,
							'scaleY': 1,
							'spacing': block.spacing,
							'top': block.top,
							'type': 'group',
							'valign': block.parentValign,
							'width': block.parentWidth,
						}
						// Add the new group element to the objects array
						flattenedBlocks.push(groupEl);
						// Push block id to ids's array
						blockIds.push(block.parentId);
					}else{
						flattenedBlocks.push(block);
					}
				}else{
					if(isGroupElement){
						// Add the element to the relevant group
						flattenedBlocks.forEach(function(objs, i){
							if(objs.blockId === block.parentId){
								flattenedBlocks[i].objects.push(block);
							}
						});
					}else{
						flattenedBlocks.push(block);
					}
				}
			});
			return flattenedBlocks;
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

	      var docSettings     = app.utils.setDocumentSizeandScale(),
	          canvasScale     = app.templateType === 'default' ? 2.0174 : 1, // This needs to be updated to use stageCanvasScale(this needs to be set somewhere in a template)
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
	      // console.log(docSettings);

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
	                              app.utils.convertPxToMM((el.width * scalex) * canvasScale) * docSettings[2],
	                              app.utils.convertPxToMM((el.height * scaley) * canvasScale, app.mmSize) * docSettings[2],
	                              app.utils.convertPxToMM(el.top * canvasScale) * docSettings[2],
	                              app.utils.convertPxToMM(el.left * canvasScale) * docSettings[2],
	                              destDocWidth,
	                              destDocHeight
	                            ];
	            // Width | Height | Top | Left | DocWidth | DocHeight

	        if(el.blocktype === 'new-text-block-group'){
	          // Check if it is a text block group
	          var textBlockGroupName  = 'text-block-group_' + i,
	          	  spacingSize = app.isCreateTemplate ? el.spacing : Math.ceil(app.utils.convertPxToMM(el.spacing * app.canvasScale) * app.stageCanvasScale);            
	          // Create <text-block-group>
	          baseObj[textBlockGroupName] = {
	            '_align': el.halign,
	            '_editable': 'True',
	            '_id': 'Group' + i,
	            '_lowerleftx': app.utils.calcLowerLeftX(elDimensions),
	            '_lowerlefty': app.utils.calcLowerLeftY(elDimensions),
	            '_mandatory': 'False',
	            '_orientate': 'north',
	            '_spacing': spacingSize,
	            '_upperrightx': app.utils.calcUpperRightX(elDimensions),
	            '_upperrighty': app.utils.calcUpperRightY(elDimensions),
	            '_verticalalign': el.valign
	          };
	          el.objects.forEach(function(tEl, i){
	            // console.log(tEl);
	            // Create <text-block>
	            var textBlockName  = 'text-block_' + i,
	            	fontSize 	   = app.isCreateTemplate ? tEl.fontSize : Math.floor((app.utils.convertPxToPt(tEl.fontSize) * app.canvasScale) * app.stageCanvasScale),
	            	lineHeight     = app.isCreateTemplate ? tEl.lineHeight + '%' : app.utils.convertLineheight(tEl.lineHeight);
	            	console.log(fontSize, lineHeight);
	            baseObj[textBlockGroupName][textBlockName] = {
	                                                          '_colour': app.utils.rgbToCMYK(tEl.fontColor),
	                                                          '_editable': tEl.isEditable,
	                                                          '_font-family': tEl.fontFamily,
	                                                          '_font-size': fontSize,
	                                                          '_id': 'TextBlockG_' + i,
	                                                          '_leading': lineHeight,
	                                                          '_mandatory': tEl.isManditory,
	                                                          '_textmode': 'multiline',
	                                                          '_title': tEl.blockTitle                                                     
	                                                        }

	            if(typeof(tEl.maxLength) !== 'undefined'){
	              baseObj[textBlockGroupName][textBlockName]['_maxlen'] = tEl.maxLength;
	            }
	            if(typeof(tEl.stringSrc) !== 'undefined'){
	              baseObj[textBlockGroupName][textBlockName]['_source'] = assetPath + tEl.stringSrc;             
	            }
	            if(typeof(tEl.textVal) !== 'undefined'){
	              baseObj[textBlockGroupName][textBlockName]['__text']  = tEl.textVal;
	              // app.dummyText.responseText.substr(0, el.maxLength); 
	            }
	          });                            
	          // console.log(baseObj);
	          cordData.push(baseObj);
	        } else if(el.blocktype === 'new-text-block'){
	          // If it is a text element that uses an external source, it DOES NOT require a wrapping 'text-block-group'
	          // Create <text-block>
	          // console.log(el);
	          var textBlockName  = 'text-block_' + i,
	          	  fontSize 	     = app.isCreateTemplate ? el.fontSize : Math.floor((app.utils.convertPxToPt(el.fontSize) * app.canvasScale) * app.stageCanvasScale),
	          	  lineHeight     = app.isCreateTemplate ? el.lineHeight + '%' : app.utils.convertLineheight(el.lineHeight);

	          	baseObj[textBlockName] = {
	                                    '_align': el.halign,
	                                    '_colour': app.utils.rgbToCMYK(el.fontColor),
	                                    '_editable': el.isEditable,
	                                    '_font-family': el.fontFamily,
	                                    '_font-size': fontSize,
	                                    '_id': 'TextBlock_' + i,
	                                    '_leading': lineHeight,
	                                    '_lowerleftx': app.utils.calcLowerLeftX(elDimensions),
	                                    '_lowerlefty': app.utils.calcLowerLeftY(elDimensions),
	                                    '_mandatory': el.isManditory,
	                                    '_orientate': 'north',                                    
	                                    '_textmode': 'multiline',
	                                    '_title': el.blockTitle,
	                                    '_upperrightx': app.utils.calcUpperRightX(elDimensions),
	                                    '_upperrighty': app.utils.calcUpperRightY(elDimensions),
	                                    '_verticalalign': el.valign                       
	                                  }

		        if(typeof(el.maxLength) !== 'undefined'){
		            baseObj[textBlockName]['_maxlen'] = el.maxLength;
		        }
		        if(typeof(el.stringSrc) !== 'undefined'){
		            baseObj[textBlockName]['_source'] = assetPath + el.stringSrc;
		        }
		        if(typeof(el.textVal) !== 'undefined' && typeof(el.stringSrc) === 'undefined' ){
		        	baseObj[textBlockName]['__text']  = el.textVal;
		        	// app.dummyText.responseText.substr(0, el.maxLength); 
		        }
	          
	          cordData.push(baseObj);
	        } else{
	        	// Otherwise it will be treated as an image block
	          	var imgBlockName = 'image_' + i,
	          	  	imgURL 	   =  typeof(el.imgSrc) !== 'undefined' || el.imgSrc !== null ? el.imgSrc : 'demo-800.jpg'
	          	baseObj[imgBlockName] = {
	                                    '_align': el.halign,
	                                    '_editable': el.isEditable,
	                                    '_fitmethod': 'auto',
	                                    '_highresfilename': imgURL,
	                                    '_id': el.blockTitle + i,
	                                    '_lowerleftx': app.utils.calcLowerLeftX(elDimensions),
	                                    '_lowerlefty': app.utils.calcLowerLeftY(elDimensions),
	                                    '_lowresfilename': imgURL,
	                                    '_mandatory': el.isManditory,
	                                    '_orientate': 'north',
	                                    '_title': el.blockTitle,
	                                    '_upperrightx': app.utils.calcUpperRightX(elDimensions),
	                                    '_upperrighty': app.utils.calcUpperRightY(elDimensions),
	                                    '_verticalalign': el.valign
	                                  };
	          cordData.push(baseObj);
	        }
	      });
	      // Add all of the dynamic elements to template   
	      cordData.forEach(function(el){
	        _$.extend( pdfbaseJSON.doc.page, el );
	      });
	      // console.log(pdfbaseJSON);
	      app.utils.generateXML(pdfbaseJSON);
	    },
	    generateXML: function(cordData){
	      var x2js      = new X2JS(),
	          xmlOutput = x2js.json2xml_str(cordData);
	      	// Need to update the object names so they dont contain the _[number] prefix so the XML is correct
	      	xmlOutput = xmlOutput.replace(/text-block-group_[0-9][0-9]?/g, 'text-block-group');
	      	xmlOutput = xmlOutput.replace(/text-block_[0-9][0-9]?/g, 'text-block');
	     	xmlOutput = xmlOutput.replace(/image_[0-9][0-9]?/g, 'image');

	      	// Update the hidden field with the generated XML
	      	_$('#pdfItemAdmin1_hdnXML').val(xmlOutput);
	      	// Update the hidden image data field
            _$('#pdfItemAdmin1_hdnTemplateImg').val(app.imagedata);

	      	// console.log(app.templateId);
	      	console.log(xmlOutput);

	      	if(!app.isLocalEnv){
		      	if(app.isCreateTemplate){
		      		// Create a new template
		      		app.utils.createTemplate(xmlOutput);
		      	} else if(app.isCreateProduct || app.isUpdateProduct){
		      		// Make sure a hidden checkbox is checked as the BE needs to know this.
		      		_$('#pdfItemAdmin1_chkIsPDF').prop('checked', true);		

		      		// Mimic a click on the storefront button that updates/creates a product
		      		_$('#btnSubmit').click();	       
		        }  
	      	}    
	    },
	    createTemplate: function(xml) {
	      // Function receives the generated XML from what has been created on the canvas
	      // Then POST's that data to the backend to create a new template
	      // console.log(xml);
	      // Template name can not be null/empty.
	      app.templateName = app.templateName || 'Template Name Not Set';
	      console.log({tn : app.templateName,tx : xml, ti : app.imagedata, o : app.orientation, dim : app.docDimensions, id: app.templateId});
	      _$.ajax({
	            url: '/be/api/PDF/Template.ashx',
	            type: 'POST',
	            dataType: 'json',
	            data: {
	            	tn : app.templateName,
	            	tx : xml,
	            	ti : app.imagedata,
	            	o : app.orientation,
	            	dim : app.docDimensions,
	            	id: app.templateId
	            },
	            success: function (data) {
	            	alert('Template created successfully.');
	            	// Reset the template creation tool
	            	if(app.isCreateTemplate){
	            		app.ct.resetTemplate();
	            		// After creating a template, empty the template list... then re-load the template list.
					    _$('#dynamic-templates').empty();
					    app.ct.loadTempList();
	            	}	                
	            },
	            error: function(data){
	            	// This check is added because request is being successful, but triggering error state.
	            	if(data.status === 200){
	            		alert('Template created successfully.');
	            		// Reset the template creation tool
		            	if(app.isCreateTemplate){
		            		app.ct.resetTemplate();
		            		// After creating a template, empty the template list... then re-load the template list.
					    	_$('#dynamic-templates').empty();
					    	app.ct.loadTempList()
		            	}		                
	            	} else{
	            		alert('Template Creation failed');
	            		console.log(data);
	            	}	            	
	            }
	        });
	    },

	    /**
	    	COORDINATE UTIL FUNCTION
	    **/
	    calcBlockCoords: function (data, canvasWidth, canvasHeight) {
            // console.log(data);
            var blockType,
                blockSettings = {},
                blockSize;
            if (data.block === 'ib') {
                blockType = 'ib';
                blockSettings.blocktype = 'new-image-block';
                blockSettings.blockTitle = typeof (data._title) !== 'undefined' ? data._title : '';
                blockSettings.halign = typeof (data._align) !== 'undefined' ? data._align : 'left';
                blockSettings.imgSrc = typeof (data._lowresfilename) !== 'undefined' ? data._lowresfilename : null;
                blockSettings.isEditable = typeof (data._editable) !== 'undefined' ? data._editable : 'false';
                blockSettings.isManditory = typeof (data._mandatory) !== 'undefined' ? data._mandatory : 'false';
                blockSettings.valign = typeof (data._verticalalign) !== 'undefined' ? data._verticalalign : 'top';
            } else if (data.block == 'tb') {
                blockType = 'tb';
                blockSettings.blocktype = 'new-text-block';
                blockSettings.halign = typeof (data._align) !== 'undefined' ? data._align : 'left';
                blockSettings.isEditable = typeof (data._editable) !== 'undefined' ? data._editable : 'false';
                blockSettings.isManditory = typeof (data._mandatory) !== 'undefined' ? data._mandatory : 'false';
                blockSettings.lineHeight = typeof (data._leading) !== 'undefined' ? data._leading.toString().replace('%', '') : app.defaultLineHeight;
                blockSettings.valign = typeof (data._verticalalign) !== 'undefined' ? data._verticalalign : 'top';
                // Text Block Specific
                blockSettings.fontColor = app.utils.cmykToRGB(data._colour);
                blockSettings.fontFamily = typeof (data['_font-family']) !== 'undefined' ? data['_font-family'] : app.defaultFontFace;
                blockSettings.fontSize = typeof (data['_font-size']) !== 'undefined' ? data['_font-size'] : app.defaultFontSize;
                // console.log(data._maxlen)
                blockSettings.maxLength = typeof (data._maxlen) !== 'undefined' ? data._maxlen : app.defaultMaxCharLength;
                blockSettings['text-block-type'] = 'text';
                if (typeof (data._source) !== 'undefined') {
                    blockSettings.stringSrc = data._source;
                    // Need to set the text value here...
                    blockSettings.textVal = app.termsAndConditionsString;
                } else {
                    blockSettings.textVal = typeof (data.__text) !== 'undefined' ? data.__text : '';
                }
            } else if (data.block === 'tbg') {
                blockSettings.blocktype = 'new-text-block-group';
                blockSettings.blockTitle = typeof (data._title) !== 'undefined' ? data._title : '';
                blockSettings.halign = typeof (data._align) !== 'undefined' ? data._align : 'left';
                blockSettings.isEditable = typeof (data._editable) !== 'undefined' ? data._editable : 'false';
                blockSettings.isManditory = typeof (data._mandatory) !== 'undefined' ? data._mandatory : 'false';
                // console.log(data._spacing);
                blockSettings.spacing = typeof (data._spacing) !== 'undefined' ? data._spacing : 'false';
                blockSettings.valign = typeof (data._verticalalign) !== 'undefined' ? data._verticalalign : 'top';
            }
            // Set parent id, to the root element
            blockSettings.blockTitle = typeof (data._title) !== 'undefined' ? data._title : '';
            // Set the orientation if it is set
            if(typeof(data._orientate) !== 'undefined'){
            	blockSettings.orientation = data._orientate;
            }
            // blockSettings.parentId    = typeof(data._id) !== 'undefined' ? data._id : '';
            blockSettings.id     = typeof (data._id) !== 'undefined' ? data._id.replace(/ /g, '') : '';
            blockSettings.origId = typeof (data._id) !== 'undefined' ? data._id : '';

            // Convert to booleans
            blockSettings.isEditable = 'true' ? true : false;
            blockSettings.isManditory = 'true' ? true : false;

            // Convert the unit to its equivelant based on an A4
            // console.log('After Conversion: ' + data._upperrightx, data._upperrighty, data._lowerleftx, data._lowerleftx, data._lowerlefty);
            // Generic block settings
            var blockDimensions  = {},
                upperX           = data._upperrightx / app.canvasScale,
                upperY 			 = data._upperrighty / app.canvasScale,
                lowerX 			 = data._lowerleftx / app.canvasScale,
                lowerY 			 = data._lowerlefty / app.canvasScale;

            if(typeof(app.stageCanvasScale) === 'undefined'){
            	app.stageCanvasScale = app.templateType === 'default' ? 2.0174 : 1
            }

            // console.log(app.stageCanvasScale, data._upperrightx, upperX, app.utils.convertMMtoPX(upperX), app.utils.convertMMtoPX(upperX) / app.stageCanvasScale, Math.ceil(app.utils.convertMMtoPX(upperX) / app.stageCanvasScale))

            // Base of 15mm at a3(1.4142 x bigger than A4...
            // 1. Convert the unit to what it would be at when a4 > 15mm > (15 / 1.4142 = 10.60670343657191)
            // 2. Convert the MM to its Pixel equivelant || Math.ceil(10.60670343657191 * 3.779527559055) = 41
            // 3. Convert that unit to the relevant size based of the app.stageCanvasScale || Math.ceil(41 / 2.0174)  = 21

            blockDimensions.upperX = Math.ceil(app.utils.convertMMtoPX(upperX) / app.stageCanvasScale);
            blockDimensions.upperY = Math.ceil(app.utils.convertMMtoPX(upperY) / app.stageCanvasScale);
            blockDimensions.lowerX = Math.ceil(app.utils.convertMMtoPX(lowerX) / app.stageCanvasScale);
            blockDimensions.lowerY = Math.ceil(app.utils.convertMMtoPX(lowerY) / app.stageCanvasScale);            

            // console.log('CANVAS DIMENSONS: ' + canvasWidth + ' ' + canvasHeight)
            blockSettings.height = app.utils.validateHeight(canvasHeight, app.utils.calcHeight(blockDimensions));
            blockSettings.width  = app.utils.validateWidth(canvasWidth, app.utils.calcWidth(blockDimensions));
            blockSettings.left   = app.utils.validateLeftPos(canvasWidth, blockDimensions.lowerX, blockSettings.width);
            blockSettings.top    = app.utils.validateTopPos(canvasHeight, blockDimensions.upperY, blockSettings.height);
            // console.log(blockDimensions);
            // console.log(blockSettings);
            // console.log(data)
            return blockSettings;
        },
        createInnerTextBlock: function(block, blockSettings, i){
            // console.log(block);
            var innerBlockSettings = {};
            innerBlockSettings.blocktype = 'new-text-block';
            innerBlockSettings.blockTitle = typeof(block._title) !== 'undefined' ? block._title : '';
            innerBlockSettings.halign = blockSettings.halign;  // Take from the parent element
            innerBlockSettings.isEditable = typeof(block._editable) !== 'undefined' ? block._editable : 'false';
            innerBlockSettings.isManditory = typeof(block._mandatory) !== 'undefined' ? block._mandatory : 'false';
            innerBlockSettings.fontFamily = typeof(block['_font-family']) !== 'undefined' ? block['_font-family'] : app.defaultFontFace;
            innerBlockSettings.fontColor = app.utils.cmykToRGB(block._colour);
            innerBlockSettings.fontSize = typeof (block['_font-size']) !== 'undefined' ? block['_font-size'] : app.defaultFontSize;
            innerBlockSettings.lineHeight = typeof (block._leading) !== 'undefined' ? block._leading.toString().replace('%', '') : app.defaultLineHeight;
            innerBlockSettings.id = typeof (block._id) !== 'undefined' ? block._id : 'false';
            innerBlockSettings.label = typeof (block._title) !== 'undefined' ? block._title : 'false';
            innerBlockSettings.maxLength = typeof (block._maxlen) !== 'undefined' ? block._maxlen : app.defaultMaxCharLength;
            innerBlockSettings.valign = blockSettings.valign;  // Take from the parent element
            innerBlockSettings.top = blockSettings.top;     // Take from the parent element
            innerBlockSettings.width = blockSettings.width;   // Take from the parent element
            innerBlockSettings.left = blockSettings.left;    // Take from the parent element                
            innerBlockSettings.spacing = blockSettings.spacing; // Take from the parent element 
            innerBlockSettings.groupPosId = i;

            // Settings need to pass through additional parent information
            innerBlockSettings.parentId = blockSettings.id;
            innerBlockSettings.parentTitle = blockSettings.blockTitle;
            innerBlockSettings.parentEditable = blockSettings.isEditable;
            innerBlockSettings.parentManditory = blockSettings.isManditory;
            innerBlockSettings.parentHalign = blockSettings.halign;
            innerBlockSettings.parentValign = blockSettings.valign;
            innerBlockSettings.parentHeight = blockSettings.height;
            innerBlockSettings.parentTop = blockSettings.top;
            innerBlockSettings.parentWidth = blockSettings.width;

            //console.log(block._source);
            if (typeof (block._source) !== 'undefined' && block._source !== '') {
                innerBlockSettings.stringSrc = block._source;
            }
            if (typeof (block.__text) !== 'undefined') {
                innerBlockSettings.textVal = block.__text;
            } else{
                 innerBlockSettings.textVal = '';
            }
            // console.log(innerBlockSettings)

            return innerBlockSettings;
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
			Validation
	    **/
	    validateLeftPos: function(canvasWidth, leftPos, elWidth){
	    	console.log(canvasWidth, leftPos, elWidth, app.canvasMargins.bleed)  	
	    	console.log('DEBUG: Left margin reached: ', app.canvasMargins.bleed)
	    	console.log('DEBUG: Right margin reached: ', canvasWidth - app.canvasMargins.bleed - elWidth)
	    	console.log('DEBUG: Current position ok: ', leftPos)

	    	// console.log( leftPos < app.canvasMargins.bleed, leftPos + elWidth > canvasWidth - app.canvasMargins.bleed)
	    	console.log( leftPos + elWidth,  canvasWidth - app.canvasMargins.bleed)

	    	// This function checks whether the top position is valid
	    	if(leftPos < app.canvasMargins.bleed){	    		
	    		// Check the element position is greater than the left margin
	    		return app.canvasMargins.bleed
	    	} else if(leftPos + elWidth > canvasWidth - app.canvasMargins.bleed){	    		
	    		// Check the element position is less than the right margin
	    		return canvasWidth - app.canvasMargins.bleed - elWidth
	    	} else{	    		
	    		// Otherwise the left position is ok and outside of both sides margins
	    		return leftPos
	    	}
	    },
	    validateTopPos: function(canvasHeight, upperY, elHeight){
	    	// This function checks whether the top position is valid
	    	var maxTopPos   = canvasHeight - (app.canvasMargins.bleed * 2),
	    		topPosition = canvasHeight - upperY;
	    	// console.log(maxTopPos, topPosition)
	    	// console.log('DEBUG: Validate Bottom margin: ', topPosition + elHeight > maxTopPos);
	    	// console.log('DEBUG: Validate Top margin: ', topPosition < app.canvasMargins.bleed);
	    	// console.log('DEBUG: Validate Top Position: ', upperY, maxTopPos);
	    	if(topPosition + elHeight > maxTopPos){
	    		// Check the elements position is outside the bottom margin
	    		return canvasHeight - app.canvasMargins.bleed - elHeight
	    	} else if(topPosition < app.canvasMargins.bleed){
	    		// Check the elements position is outside the top margin
	    		return app.canvasMargins.bleed
	    	} else{
	    		// Other wise the top position is ok and outside both margins
	    		return topPosition
	    	}
	    },
	    validateWidth: function(canvasWidth, elWidth){
	    	if(elWidth > canvasWidth - (app.canvasMargins.bleed * 2)){
	    		return canvasWidth - (app.canvasMargins.bleed * 2)
	    	} else{
	    		return elWidth
	    	}
	    },
	    validateHeight: function(canvasHeight, elHeight){
	    	if(elHeight > canvasHeight - (app.canvasMargins.bleed * 2)){
	    		return canvasHeight - (app.canvasMargins.bleed * 2)
	    	} else{
	    		return elHeight
	    	}
	    },
	    validateMaxLengthTextArea: function(textVal, maxLength, _$targetel){
	    	// console.log(textVal, maxLength, typeof(maxLength), _$targetel);
	    	// If a targetElement is set, then update the UI to show the characters remaining
	    	// console.log(_$targetel)
	    	// console.log(typeof(_$targetel) !== 'undefined')
	    	if(typeof(_$targetel) !== 'undefined'){
	    		if(typeof(textVal.length) === 'undefined'){
	    			_$targetel.html(maxLength);	
	    		} else{
	    			_$targetel.html(maxLength - textVal.length);
	    		}	    		
	    	}

	    	// Check if a max length has been set. If it hasn't, then return true
	    	if(typeof(maxLength) === 'number'){
	    		if(textVal.length <= maxLength){
		    		return true
		    	} else{
		    		return false
		    	}
	    	} else{
	    		return true
	    	}
	    },	    	
	    validateCanvasTextBlock: function(_block){
	    },
	    validateDocDimensions: function(docWidth, docHeight){
	    	console.log(docWidth, docHeight)
    		// Set the level of scaling so the when converting the cooridinates to pixels that are accurate      
			if((docWidth === 420 && docHeight === 594) || (docHeight=== 420 && docWidth === 594)){
				return ['A2'] // 420x594 or 594x420
			} else if((docWidth === 297 && docHeight === 420) || (docHeight=== 297 && docWidth === 420)){
				return ['A3'] // 297x420 or 420x297
			} else if((docWidth === 210 && docHeight === 297) || (docHeight=== 210 && docWidth === 297)){
				return ['A4'] // 210x297 or 297x210
			} else if((docWidth === 148 && docHeight === 210) || ((docHeight === 148 || docHeight === 148.5) && docWidth === 210)){
				return ['A5'] // 148x210 or 210x148   
			} else if((docWidth === 105 && docHeight === 148) || (docHeight >= 104 && docHeight <= 105 && docWidth === 148)){
				return ['A6'] // 105x148 or 148x105
			} else if((docWidth === 74 && docHeight === 105) || (docHeight === 74 && docWidth === 105)){
				return ['A7'] // 74x105 or 105x74
			} else if((docWidth >= 85 || docWidth <= 88) && docHeight === 55){
				return ['Business Card'] // 85x55
			} else{
				console.log('INVALD DOC DIMENSION')
				return ['A4']
			}
	    },


	    /**
			CANVAS END POINTS
	    **/
	    convertCanvasToImgDownload: function(_$el, _canvas){
	      // Remove selected states and grid before saving img
	      app.utils.cleanCanvas(_canvas);
	      app.imagedata = _canvas.toDataURL('image/png');
	      // console.log(app.imagedata);
	      _$el[0].href = app.imagedata;
	      app.utils.toggleCanvasGrid(_$el, true, _canvas);
	    },
	    setProductThumbnail: function (_canvas) {
            app.utils.cleanCanvas(_canvas);
            app.imagedata = _canvas.toDataURL('image/png');            
            _$('#pdfItemAdmin1_hdnProductImg').val(app.imagedata);
        },

	    generateCanvasPreviewImg: function(_$el,_canvas, prefix){
	    	// @ _canvas = farbic canvas object | {}
	    	// @ prefix  = prefix for the hidden canvas | string

	    	// Remove selected states and grid before saving img
	    	console.log(_canvas);
	        app.utils.cleanCanvas(_canvas);
	        // Create an image from the canvas and add it to the relevant div
	        var imgElement = ReImg.fromCanvas(_$('#' + prefix +'_canvas')[0]).toImg(),
	            _$output    = _$('#' + prefix +'_image');
	        _$output.empty().append(imgElement);
	        // Save the image data so this can be used later when saving the image for the template
	        app.imagedata = _canvas.toDataURL('image/png');
	        // Enable the grid again
	        app.utils.toggleCanvasGrid(_$el, true, _canvas);
	    },
	    // Not in use currently.
	    debounce: function(func, wait, immediate) {
			var timeout;
			return function() {
				var context = this,
					args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		}
	};
	app.utils.initUtils();
});