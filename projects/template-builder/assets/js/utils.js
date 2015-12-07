var app = app || {};
(function(){
	'use strict';
	// $ = dom elements
	// _ = fabric elements

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
	app.templateId      = null;
	app.tempGroupCnt    = 0;
	app.tempGBlockCnt   = 0;
	app.filteredCanvasObjs;

	app.fontColours		=	[
								{
									rgb:       '140,198,63',
									name:  	   'Light Green',
									className: 'color-light-green'
								},
								{
									rgb:       '0,162,70',
									name:  	   'Mid Green',
									className: 'color-mid-green'
								},
								{
									rgb:       '0,92,70',
									name:  	   'Dark Green',
									className: 'color-dark-green'
								},
								{
									rgb:       '104,44,136',
									name:  	   'Purple',
									className: 'color-purple'
								},
								{
									rgb:       '241,131,21',
									name:  	   'Orange',
									className: 'color-orange'
								},
								{
									rgb:       '227,35,51',
									name:  	   'Red',
									className: 'color-red'
								},
								{
									rgb:       '0,0,0',
									name:  	   'Black',
									className: 'color-black'
								}

							];
	app.fontFaces		=   [
								{
									ffname: 'FuturaBT-Book',
									fftitle: 'Regular'
								},
								{
									ffname: 'FuturaBT-Medium',
									fftitle: 'Medium'
								},
								{
									ffname: 'FuturaBT-Heavy',
									fftitle: 'Headline'
								}
							];
	app.fontSizes		= 	[
								{
									sizeName: 'X Small',
									size:  	  '9'
								},
								{
									sizeName: 'Small',
									size:  	  '16'
								},
								{
									sizeName: 'Medium',
									size:  	  '20'
								},
								{
									sizeName: 'Large',
									size:  	  '36'
								},
								{
									sizeName: 'X-Large',
									size:  	  '44'
								}
							]

	// DOM elements
	app.$downloadThumb  = $('[data-action=download-thumbnail]');
	app.$toggleGrid     = $('[data-action=toggle-grid]');

	app.$tempBlockName  = $('#at-block-title');

	// Enviornment Check
	app.templateDatURL  = '';
	app.isLocalEnv      = document.location.hostname ===  "widget.macmillan.org.uk";
	// Sets the default templates and some example text for textblocks
	if(app.isLocalEnv){
		app.dummyText = $.get('assets/data/dummy-text.txt', function(data){return data}, 'text');
		app.templateDatURL = 'assets/data/data.templates.txt';
	}else{
		app.dummyText = $.get('../assets/data/dummy-text.txt', function(data){return data}, 'text');
		app.templateDatURL = '/be/api/PDF/Template.ashx';
	}

	app.utils = {
		/**
			UTIL FUNCTION
		**/ 
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

	    /**
			CREATE CANVAS & CANVAS ELEMENTS FUNCTIONS
	    **/

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
	    cleanCanvas: function(){
	      app._grid['visible'] = false;
	      app._canvas.deactivateAll().renderAll();
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
	    setCanvasSettings: function(docWidth, docHeight){
	    	var settings = {};
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
				settings.width    = 332;
				settings.height   = 207;
			} else{
				if(docWidth < docHeight){
				 	settings.width  = 396;
				 	settings.height = 561;
				} else{
				 	settings.width  = 561;
				 	settings.height = 396;
				}
			}

			// Set the level of scaling so the when converting the cooridinates to pixels that are accurate      
			if((docWidth === 420 && docHeight === 594) || (docHeight=== 420 && docWidth === 594)){
				// A2 = 420x594 or 594x420
				settings.canvasScale = 2;
				app.isLocalEnv === true ? app.docDimesions = ['A2'] : [];
			}
			else if((docWidth === 297 && docHeight === 420) || (docHeight=== 297 && docWidth === 420)){
				// A3 = 297x420 or 420x297
				settings.canvasScale = 1.4142;
				app.isLocalEnv === true ? app.docDimesions = ['A3'] : [];
			} else if((docWidth === 210 && docHeight === 297) || (docHeight=== 210 && docWidth === 297)){
				// A4 = 210x297 or 297x210
				settings.canvasScale = 1;
				app.isLocalEnv === true ? app.docDimesions = ['A4'] : [];
			} else if((docWidth === 148 && docHeight === 210) || ((docHeight === 148 || docHeight === 148.5) && docWidth === 210)){
				// A5 = 148x210 or 210x148
				settings.canvasScale = 0.7071;
				app.isLocalEnv === true ? app.docDimesions = ['A5'] : [];    
			} else if((docWidth === 105 && docHeight === 148) || (docHeight >= 104 && docHeight <= 105 && docWidth === 148)){
				// A6 = 105x148 or 148x105
				settings.canvasScale = 0.5;
				app.isLocalEnv === true ? app.docDimesions = ['A6'] : [];
			} else if((docWidth === 74 && docHeight === 105) || (docHeight === 74 && docWidth === 105)){
			// A7 = 74x105 or 105x74
				settings.canvasScale = 0.3536;
				app.isLocalEnv === true ? app.docDimesions = ['A7'] : [];
			} else if(docWidth === 85 && docHeight === 55){
				// Business Card = 85x55
				settings.canvasScale = 1;
				app.isLocalEnv === true ? app.docDimesions = ['Business Card'] : [];
			}
			return settings;
	    },
	    createTextBlock: function(blockSettings){

	    },
	    createFilteredCanvasObjects: function(){
	    	app.filteredCanvasObjs = app._canvas._objects.filter(function(obj, i){
	    		return i > 0
	    	});  
	    },
	    createBlockDataFromXML: function(data){
	    	console.log(data);
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
	        // Set parent id, to the root element
	        blockSettings.parentid    = typeof(data._id) !== 'undefined' ? data._id : '';
	        blockSettings.id   		  = typeof(data._id) !== 'undefined' ? data._id : '';
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

	        } else if(data.block === 'tbg'){
	       		// TEXT BLOCK GROUP 
	       		console.log('Handle Adding a text block group');
	         	var listItems = '';
	         	data['text-block'].forEach(function(block){
	            // console.log(block);
	            var innerBlockSettings = {};
	            // console.log(block);
	            innerBlockSettings.isEditable  = typeof(block._editable) !== 'undefined' ? block._editable : 'false';
	            innerBlockSettings.isManditory = typeof(block._mandatory)!== 'undefined' ? block._mandatory : 'false';
	            innerBlockSettings.fface       = typeof(block['_font-family']) !== 'undefined' ? block['_font-family'] : 'FuturaBT-Book';
	            innerBlockSettings.fontColor   = app.utils.cmykToRGB(block._colour);
	            innerBlockSettings.fontSize    = typeof(block['_font-size']) !== 'undefined' ? block['_font-size'] : 12;
	            innerBlockSettings.lineheight  = typeof(block._leading)  !== 'undefined' ? String(block._leading).replace('%', '') : '100';
	            innerBlockSettings.id          = typeof(block._id) !== 'undefined' ? block._id : 'false';
	            innerBlockSettings.parentid    = blockSettings.parentid;
	            innerBlockSettings.label       = typeof(block._title) !== 'undefined' ? block._title : 'false';
	            innerBlockSettings.maxLength   = typeof(block._maxlen) !== 'undefined' ? block._maxlen : '';
	            if(typeof(block._source) !== 'undefined'){
	              innerBlockSettings.stringSrc = block._source;
	            }
	            if(typeof(block.__text) !== 'undefined'){
	              innerBlockSettings.textVal = block.__text;
	            }
	            listItems += app.ct.textBlockHtmlSnippet(innerBlockSettings); // NEED TO CHANGE depending on template or product creation
	          });
	          $('#at-text-block-group-list').append(listItems); // NEED TO CHANGE depending on template or product creation
	          app.ct.createTempBlockGroup(blockSettings); // NEED TO CHANGE depending on template or product creation
	        }
	        // console.log(blockSettings);
	    },
	    createBlockDataFromJSON: function(data){
	    	var blockType,
		        blockSettings = {},
		        blockSize;

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
	          app.utils.createBlockRegular(blockSettings);
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
	          app.utils.createBlockRegular(blockSettings);
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
	    },
	    wrapCanvasText: function(t, canvas, maxW, maxH, justify){
	    	// console.log(maxW);
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
      				hasBorders: t.hasBorders,
                    hasRotatingPoint: t.hasRotatingPoint,
                    // height: t.height,
                    left: t.left,
                    lineHeight: t.lineHeight,
                    lockRotation: t.lockRotation,
                    originX: t.originX,
        			originY: t.originY,
        			selectable: t.selectable,                                         
                    textAlign: t.textAlign,
                    top: t.top
			    };

		    // console.log(t['text-block-type']);
		    if(typeof(t['text-block-type']) === 'undefined' || t['text-block-type'] === 'text'){
		    	_canvasobj = new fabric.Text(formatted, _objSettings);
		    	_canvasobj['textblocktype'] = 'text';
		    } else{
		    	_canvasobj = new fabric.IText(formatted, _objSettings);
		    	_canvasobj['textblocktype'] = 'itext';
		    }
		    
		    return _canvasobj;
		},

		/**
			CANVAS BLOCK SETTINGS
		**/
		createTextBlockSettings: function(_block){
			// console.log(_block);
			var blockSettings = {};
			blockSettings.blocktype     = _block.blocktype;
			blockSettings.blockTitle    = _block.blockTitle;
			blockSettings.halign 	    = _block.halign;
			blockSettings.isEditable    = _block.isEditable;
			blockSettings.isManditory   = _block.isManditory;
			blockSettings.parentid      = _block.parentid;
			blockSettings.id 		    = _block.id;
			blockSettings.valign 	    = _block.valign;
			blockSettings.fontColor     = _block.fontColor;
			blockSettings.fontFamily    = _block.fontFamily;
			blockSettings.fontSize      = _block.fontSize;
			blockSettings.lineheight    = _block.lineheight;
			blockSettings.maxLength     = _block.maxLength;
			blockSettings.stringSrc     = _block.stringSrc;
			blockSettings.textVal    	= _block.textVal;
			blockSettings.textblocktype = _block.textblocktype;
			return blockSettings;
		},
		setTextBlockSettings: function(_block, blockSettings){
			console.log(_block);
			_block['blocktype']     = blockSettings.blocktype;
			_block['blockTitle']    = blockSettings.blockTitle;
			_block['halign']        = blockSettings.halign;
			_block['isEditable']    = blockSettings.isEditable; 
			_block['isManditory']   = blockSettings.isManditory;  
			_block['parentid']      = blockSettings.parentid;
			_block['id']      		= blockSettings.id;
			_block['valign']        = blockSettings.valign;

			_block['origWidth']		= blockSettings.width,
			_block['origHeight']	= blockSettings.height,
      
			_block['fontColor']     = blockSettings.fontColor;
			_block['fontFamily']    = blockSettings.fontFamily;
			_block['fontSize']      = parseInt(blockSettings.fontSize);
			_block['lineheight']    = String(blockSettings.lineheight).replace('%', '');
			_block['maxLength']     = parseInt(blockSettings.maxLength);
			_block['stringSrc']     = blockSettings.stringSrc;
			_block['textVal']       = blockSettings.textVal;
			_block['textblocktype'] = blockSettings.textblocktype;
			return _block;
		},


		/**
			CANVAS EVENTS
		**/
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
	    bindGlobalCanvasEvents: function(){
	    	// This event handler stops elements being moved outside of the canvas element when moving an element on the canvas
			app._canvas.on('object:moving', function(e) {
				app.utils.constrainGridMovement(e);
			});
			// This event handler stops elements being moved outside of the canvas element when and element is being modified (resized)
			app._canvas.on('object:modified', function(e) {
				app.utils.constrainGridMovement(e);
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
	    // validateMaxLength: function($el, $targetEl){

	    // },

	    covertCanvasToImgDownload: function(){
	      // Remove selected states and grid before saving img
	      app.utils.cleanCanvas();
	      app.imagedata = app._canvas.toDataURL('image/png');
	      // console.log(app.imagedata);
	      this.href = app.imagedata;
	      app.utils.toggleCanvasGrid(true);
	    },
	};
})();