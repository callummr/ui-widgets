var app = app || {},
// Need to add jquery no conflict as storefront already uses 1.3
_$ = jQuery.noConflict(true);

// Required to use _$ instead of $ to do a multiple versions of jquery being loaded.

_$(document).ready(function(){
	'use strict';
	// _$ = dom elements
	// _ = fabric elements

	// Canvas Elements/Settings
	app._ct_canvas;
	app._cp_canvas;
	app.canvasMargins = {}

	// Grid Squares
	app.gridSquare      = 8;

	// Units/Measurements
	app.ptSize          = 0.75; // 1px > 1pt
	app.mmSize          = 0.2645833333333; // 1px > 1mm
	app.MMtoPxSize      = 3.779527559055; // 1mm > 1px
	app.ptToPxSize		= 1.333333333333; // 1pt > 1px

	// Template Creation Settings/Values
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

	app.fontColours		=	[
								{
									rgb:       '140,198,63',
									cmyk:      '54,0,99,0',
									name:  	   'Light Green',
									className: 'color-light-green',
									isDefault: true // This setting is required for when creating a template we can set a default
								},
								{
									rgb:       '0,162,70',
									cmyk:      '84,9,100,1',
									name:  	   'Mid Green',
									className: 'color-mid-green'
								},
								{
									rgb:       '0,92,70',
									cmyk:      '90,39,76,33',
									name:  	   'Dark Green',
									className: 'color-dark-green'
								},
								{
									rgb:       '104,44,136',
									cmyk:      '74,99,7,1',
									name:  	   'Purple',
									className: 'color-purple'
								},
								{
									rgb:       '241,131,21',
									cmyk:      '2,59,100,0',
									name:  	   'Orange',
									className: 'color-orange'
								},
								{
									rgb:       '227,35,51',
									cmyk:      '5,99,87,1',
									name:  	   'Red',
									className: 'color-red'
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
									lineheight: 75									
								},
								{
									lineheight: 100,
									isDefault: true // This setting is required for when creating a template we can set a default
								},
								{
									lineheight: 125
								}
							];
	
	// DOM elements
	app._$tempBlockName  	= _$('#at-block-title');
	app._$documentSizeBtns  = _$('input[name=doc-size]');
	app._$body 				= _$('body');

	// Enviornment Check
	app.isLocalEnv      = document.location.hostname ===  "widget.macmillan.org.uk";
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
	    steppedOptionHandler: function($el){
	      // console.log($el);
	      var $this               = $el,
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
	    	var rgb  = color.replace('rgb(', '').replace(')', ''),
	    		cmyk = '75,68,97,90'; // Black by default

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
	    // convertUnit: function(unit, targetUnit){
	    // 	// 10px > Pts
	    // 	// Math.floor(10 * 0.264583) = 2.64583

	    // 	// 2.64583pts > PXs = 
	    //   return parseInt( parseFloat(unit * targetUnit).toFixed(5) );    
	    //   // return unit * targetUnit;    
	    // },
	    convertPtToPx: function(size){
	    	// console.log( 'convertPtToPx: ' +  Math.round(parseInt(size) * app.ptToPxSize) )
	    	return Math.round(parseInt(size) * app.ptToPxSize)
	    },
	    convertMMtoPX: function(unit, canvasScale){
	    	// console.log(unit, canvasScale);
	    	var pxUnit,
	    		scale     = typeof(canvasScale) !== 'undefined' ? canvasScale : 1;
	    	// Multiple the MM unit by it's the MMtoPxSize to get the pixel and then round it up
	    	pxUnit = Math.ceil(parseInt(unit) * app.MMtoPxSize);
	    	// console.log( pxUnit );
	    	// Divide the MM pixel by the scale and then round up.
	    	pxUnit = Math.ceil(pxUnit / scale);

	    	// console.log(pxUnit, app.canvasMargins.bleed);
	    	// console.log(pxUnit < app.canvasMargins.bleed);

		    if(pxUnit < 0){
		        return 0
		    } else{
		    	return pxUnit
		    }
	    },
	    setDocumentSize: function(){
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
	        } 
	      }     
	    },	    
        setProductDimensions: function(){
        	// console.log(app.docDimensions);
			var patt = new RegExp('A[0-9]'),
				res;
        	// Handle business card options
        	app.docDimensions.forEach(function(size){
        		// Test for A-Something format doc size. If found remove the business card option.
        		// Otherwise remove all of the A- options
        		res = patt.test(size);
        		if(res === true){
        			// Hide the business type option as a user cannot change an A4 document into a business card
        			_$('.doc-size-business').parent().addClass('hidden');
        			_$('input[value="' + size + '"]').prop('checked', true).addClass('template-default-size');
        		} else{
        			// Hide all A- options as a user cannot change an Business Card to an A- document
        			_$('input[id^=a]').parent().addClass('hidden');
        			_$('input[value="' + size + '"]').prop('checked', true).attr('disabled', 'disabled');
        		}
        	});
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
	      //console.log(gridLines);
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
			if(docWidth === 85 && docHeight === 55){        
				app.templateType  = 'business';
				settings.width    = 332;
				settings.height   = 207;
				// Set the canvas margin (5mm for Business Cards)
                app.canvasMargins.bleed = Math.ceil(Math.ceil(5 * app.MMtoPxSize) / 2);
                // Make the number a multiple of 8, so its fits to the grid properly
                app.canvasMargins.bleed = Math.ceil(app.canvasMargins.bleed / 8) * 8;
			} else{
				if(docWidth < docHeight){
				 	settings.width  = 396;
				 	settings.height = 561;
				} else{
				 	settings.width  = 561;
				 	settings.height = 396;
				}
				// Set the canvas margin (15mm for standard A4 Documents) / Divided by the canvas scale
                app.canvasMargins.bleed = Math.ceil(Math.ceil(15 * app.MMtoPxSize) / 2.0174);
                // Make the number a multiple of 8, so its fits to the grid properly
                app.canvasMargins.bleed = Math.ceil(app.canvasMargins.bleed / 8) * 8;
			}

			// Set the level of scaling so the when converting the cooridinates to pixels that are accurate      
			if((docWidth === 420 && docHeight === 594) || (docHeight=== 420 && docWidth === 594)){
				// A2 = 420x594 or 594x420
				settings.canvasScale = 2;
			} else if((docWidth === 297 && docHeight === 420) || (docHeight=== 297 && docWidth === 420)){
				// A3 = 297x420 or 420x297
				settings.canvasScale = 1.4142;
			} else if((docWidth === 210 && docHeight === 297) || (docHeight=== 210 && docWidth === 297)){
				// A4 = 210x297 or 297x210
				settings.canvasScale = 1;
			} else if((docWidth === 148 && docHeight === 210) || ((docHeight === 148 || docHeight === 148.5) && docWidth === 210)){
				// A5 = 148x210 or 210x148
				settings.canvasScale = 0.7071;    
			} else if((docWidth === 105 && docHeight === 148) || (docHeight >= 104 && docHeight <= 105 && docWidth === 148)){
				// A6 = 105x148 or 148x105
				settings.canvasScale = 0.5;
			} else if((docWidth === 74 && docHeight === 105) || (docHeight === 74 && docWidth === 105)){
				// A7 = 74x105 or 105x74
				settings.canvasScale = 0.3536;
			} else if(docWidth === 85 && docHeight === 55){
				// Business Card = 85x55
				settings.canvasScale = 1;
			}
			return settings;
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
			} else if(docWidth === 85 && docHeight === 55){
				// Business Card = 85x55
				return ['Business Card'];
			}	
	    },
	    
	    /**
			CANVAS UPDATE FUNCTIONS
	    **/
	    wrapCanvasText: function(t, canvas, maxW, maxH, justify, createNewObj){
	    	// console.log(maxW);
	    	// console.log(maxW, maxH)
	    	// http://jsfiddle.net/maxenko/nyw5myq5/4/light/
		    if (typeof maxH === "undefined") {
		        maxH = 0;
		    }
		    var words = t.text.split(" ");
		    var formatted = '';

		    // This works only with monospace fonts
		    justify = justify || 'left';

		    // clear newlines
		    var sansBreaks = t.text.replace(/(\r\n|\n|\r)/gm, "");
		    // console.log(sansBreaks);
		    // calc line height
		    var lineHeight = new fabric.Text(sansBreaks, {
		        fontFamily: t.fontFamily,
		        fontSize: t.fontSize
		    }).height;

		    // adjust for vertical offset
		    var maxHAdjusted = maxH > 0 ? maxH - lineHeight : 0;
		    var context = canvas.getContext("2d");


		    context.font = t.fontSize + "px " + t.fontFamily;
		    var currentLine = '';
		    var breakLineCount = 0;

		    var n = 0;
		    while (n < words.length) {
		        var isNewLine = currentLine == "";
		        var testOverlap = currentLine + ' ' + words[n];

		        // are we over width?
		        var w = context.measureText(testOverlap).width;

		        if (w < maxW) { // if not, keep adding words
		            if (currentLine != '') currentLine += ' ';
		            currentLine += words[n];
		            // formatted += words[n] + ' ';
		        } else {

		            // if this hits, we got a word that need to be hypenated
		            if (isNewLine) {
		                var wordOverlap = "";

		                // test word length until its over maxW
		                for (var i = 0; i < words[n].length; ++i) {

		                    wordOverlap += words[n].charAt(i);
		                    var withHypeh = wordOverlap + "-";

		                    if (context.measureText(withHypeh).width >= maxW) {
		                        // add hyphen when splitting a word
		                        withHypeh = wordOverlap.substr(0, wordOverlap.length - 2) + "-";
		                        // update current word with remainder
		                        words[n] = words[n].substr(wordOverlap.length - 1, words[n].length);
		                        formatted += withHypeh; // add hypenated word
		                        break;
		                    }
		                }
		            }
		            while (justify == 'right' && context.measureText(' ' + currentLine).width < maxW)
		            currentLine = ' ' + currentLine;

		            while (justify == 'center' && context.measureText(' ' + currentLine + ' ').width < maxW)
		            currentLine = ' ' + currentLine + ' ';

		            formatted += currentLine + '\n';
		            breakLineCount++;
		            currentLine = "";

		            continue; // restart cycle
		        }
		        if (maxHAdjusted > 0 && (breakLineCount * lineHeight) > maxHAdjusted) {
		            // add ... at the end indicating text was cutoff
		            formatted = formatted.substr(0, formatted.length - 3) + "...\n";
		            currentLine = "";
		            break;
		        }
		        n++;
		    }

		    if (currentLine != '') {
		        while (justify == 'right' && context.measureText(' ' + currentLine).width < maxW)
		        currentLine = ' ' + currentLine;

		        while (justify == 'center' && context.measureText(' ' + currentLine + ' ').width < maxW)
		        currentLine = ' ' + currentLine + ' ';

		        formatted += currentLine + '\n';
		        breakLineCount++;
		        currentLine = "";
		    }

		    // get rid of empy newline at the end
		    formatted = formatted.substr(0, formatted.length - 1);
		    // console.log(formatted);
		    var _canvasobj,
		    	_objSettings = {
			        fill: t.fill,	
                    fontFamily: t.fontFamily,
                    fontSize: t.fontSize,
      				hasBorders: true,
                    hasRotatingPoint: t.hasRotatingPoint,
                    left: t.left,
                    lineHeight: t.lineHeight,
                    lockRotation: t.lockRotation,
                    lockScalingFlip: t.lockScalingFlip,
                    originX: t.originX,
        			originY: t.originY,
        			selectable: t.selectable,                                         
                    textAlign: t.textAlign,
                    top: t.top
			    };

			// Only return a new obj when creating a text block, when loading or creating a product 
			if(createNewObj === true){
				// console.log(t['text-block-type']);
			    if(typeof(t['text-block-type']) === 'undefined' || t['text-block-type'] === 'text'){
			    	_canvasobj = new fabric.Text(formatted, _objSettings);
			    	_canvasobj['textblocktype'] = 'text';
			    } else{
			    	_canvasobj = new fabric.IText(formatted, _objSettings);
			    	_canvasobj['textblocktype'] = 'itext';
			    }			    
			    return _canvasobj
			} else{
				return formatted
			}		    
		},
		selectCanvasPropertyToEdit: function(_$el){
			var updatedVal = _$el.val(),
				elType	   = _$el.data('canvas-setting-type'),
				elChecked  = _$el.is(':checked');

			console.log(elType, updatedVal, elChecked);

			app.utils.setDomPropertiesOnEdit(_$el);
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
		            	fontColour: 'rgb(' + updatedVal + ')',
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
		            	lineheight: updatedVal,
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
		setDomPropertiesOnEdit: function(_$el){
			var elType 	   = _$el.data('canvas-setting-type'),
				updatedVal = _$el.val();

		    if(elType === 'ml'){
		    	var blockId 		= _$el.attr('id').substr(_$el.attr('id').indexOf('_') + 1),
		    		_$blockTextArea = _$('#text-block-TextBlockG_' + blockId),
		    		textAreaValue   = _$blockTextArea.val(),
		    		charsRemaining	= parseInt(updatedVal) - textAreaValue.length;

		    	if(charsRemaining < 0 || isNaN(charsRemaining) ){
		    		charsRemaining = 0;
		    	}

		    	// Update the UI to show how many characters are left
		    	_$blockTextArea.next().find('.badge').html(charsRemaining);

		    	// Update the text string so it has the correct number of characters
		    	textAreaValue = textAreaValue.substr(0, parseInt(updatedVal));

		    	// Update the textarea's attribute and value
		    	_$blockTextArea.attr('maxlength', updatedVal).val(textAreaValue);

		    	// Update the canvas obj with the new text value
		    	app.utils.setActiveTextBlockText(textAreaValue);
		    }
		},
		setActiveTextBlockText: function(objText){
			// This function updates the relevant canvas obj, after the maxlength control has been changed
			var _activeObj = app._cp_canvas.getActiveObject();
			_activeObj.set({
				text: objText
			});
			_activeObj.setCoords();
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
      		Functions needed to prepare template for export
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
	        'lineheight',
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

	      var docSettings     = app.utils.setDocumentSize(),
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
	      // console.log(docSettings);

	      // Create collection of objects for the JSON, which will be converted to XML
	      canvasData.forEach(function(el, i) {
	        // console.log(el);
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
	          var textBlockGroupName  = 'text-block-group_' + i;              
	          // Create <text-block-group>
	          baseObj[textBlockGroupName] = {
	            '_align': el.halign,
	            '_editable': 'True',
	            '_id': 'Group' + i,
	            '_lowerleftx': app.utils.calcLowerLeftX(elDimensions),
	            '_lowerlefty': app.utils.calcLowerLeftY(elDimensions),
	            '_mandatory': 'False',
	            '_orientate': 'north',
	            '_spacing': app.utils.convertPxToMM(el.spacing),
	            '_upperrightx': app.utils.calcUpperRightX(elDimensions),
	            '_upperrighty': app.utils.calcUpperRightY(elDimensions),
	            '_verticalalign': el.valign
	          };
	          el.objects.forEach(function(tEl, i){
	            console.log(tEl);
	            // Create <text-block>
	            var textBlockName  = 'text-block_' + i;         
	            baseObj[textBlockGroupName][textBlockName] = {
	                                                          '_colour': app.utils.rgbToCMYK(tEl.fontColor),
	                                                          '_editable': tEl.isEditable,
	                                                          '_font-family': tEl.fontFamily,
	                                                          '_font-size': app.utils.convertPtToPx(tEl.fontSize),
	                                                          '_id': 'TextBlockG_' + i,
	                                                          '_leading': tEl.lineheight + '%',
	                                                          '_mandatory': tEl.isManditory,
	                                                          '_textmode': 'multiline',
	                                                          '_title': tEl.blockTitle                                                     
	                                                        }
	            if(tEl.maxLength >= 0 ){
	              baseObj[textBlockGroupName]['_maxlen'] = tEl.maxLength;
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
	          console.log(el);
	          var textBlockName  = 'text-block_' + i;
	          baseObj[textBlockName] = {
	                                    '_align': el.halign,
	                                    '_colour': app.utils.rgbToCMYK(el.fontColor),
	                                    '_editable': el.isEditable,
	                                    '_font-family': el.fontFamily,
	                                    '_font-size': app.utils.convertPtToPx(el.fontSize),
	                                    '_id': 'TextBlock_' + i,
	                                    '_leading': el.lineheight + '%',
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
	          if(el.maxLength > 0 ){
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
	        }
	        // Otherwise it will be treated as an image block
	        else{
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
	            data: {tn : app.templateName,tx : xml, ti : app.imagedata, o : app.orientation, dim : app.docDimensions, id: app.templateId},
	            success: function (data) {
	            	alert('Template Created. Please click "Add product" to use this template');
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
	            		alert('Template Created. Please click "Add product" to use this template');
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
	    	// console.log('DEBUG: Left margin reached: ', app.canvasMargins.bleed)
	    	// console.log('DEBUG: Right margin reached: ', canvasWidth - app.canvasMargins.bleed - elWidth)
	    	// console.log('DEBUG: Current position ok: ', leftPos)

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
	    validateTopPos: function(canvasHeight, upperX, elHeight){
	    	// This function checks whether the top position is valid
	    	var maxTopPos   = canvasHeight - (app.canvasMargins.bleed * 2),
	    		topPosition = canvasHeight - upperX;
	    	// console.log('DEBUG: Validate Bottom margin: ', topPosition + elHeight > maxTopPos);
	    	// console.log('DEBUG: Validate Top margin: ', topPosition < app.canvasMargins.bleed);
	    	// console.log('DEBUG: Validate Top Position: ', upperX, maxTopPos);
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
	    validateMaxLengthTextArea: function(textVal, maxLength, _$targetel){
	    	console.log(textVal, typeof(maxLength));
	    	// If a targetElement is set, then update the UI to show the characters remaining
	    	if(typeof(_$targetel) !== 'undefined'){
	    		_$targetel.html(maxLength - textVal.length);
	    	}

	    	// Check if a max length has been set. If it hasnt, then return true
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
})