var app = app || {};

// Required to use _$ instead of $ to do a multiple versions of jquery being loaded.
// jQueryConflict is set in the utils file

_$(document).ready(function () {
    'use strict';

    // _$ = dom elements
    // _ = fabric elements
    app._$templateName       = _$('#template-name');
    app._$tempNameFromTemp   = _$('#template-name-from-template');
    app._$tempDimensionsName = _$('#template-size-options');

    // State controllers
    app.gEditActive   = false; // Global active mode
    app.tbgEditActive = false; // Text Block Group Edit Active


    app.ct = {
        initCreateTemp: function () {
            app.ct.bindCreateTemplateClickEvents();
            app.ct.loadTempList();
            app.ct.createTemplateControls()
        },

        /**
          Util functions
        **/
        createFileName: function (extension) {
            var filename = _$('.canvas-name-field').val() || 'template-download';
            return filename + extension
        },
        toggleElements: function () {
            var _$this = _$(this),
                toggleTarget = _$this.data('targetel'),
                toggleGroup = _$this.data('toggle-group');

            _$('.' + toggleGroup).addClass('hidden');
            _$('#' + toggleTarget).removeClass('hidden');
        },

        /**
          Working with existing templates
        **/
        loadTempList: function () {
            _$('#static-templates').remove();
            _$('#dynamic-templates').removeClass('hidden');
            _$.ajax({
                url: app.templateDatURL,
                dataType: 'text'
            })
            .done(function (data) {
                // Filter the response and then create JSON        
                var templatesData = JSON.parse(app.utils.filterResponse(data)),
                    tempString = '',
                    imgPath;

                if (app.isLocalEnv) {
                    imgPath = '../templates/'
                } else {
                    imgPath = globalUrls.templateFolder;
                }

                // console.log(templatesData);
                // console.log(JSON.parse(data));

                templatesData.forEach(function (template) {
                    tempString += '<div class="col-xs-6 col-md-3">';
                    tempString += '<input type="radio" id="template' + template.ID + '" name="template-url" value="' + template.ID + '" class="template-selection hidden">';
                    tempString += '<label for="template' + template.ID + '" class="thumbnail">';
                    tempString += '<span class="template-name">' + template.Name + '</span>';
                    tempString += '<img src="' + imgPath + template.ID + '.jpg" alt="' + template.Name + '" class="" />';
                    tempString += '</label>';
                    tempString += '</div>';
                });
                _$('#dynamic-templates').append(tempString);
                _$('#dynamic-templates .template-selection').first().prop('checked', true);
            })
            .fail(function () {
                alert('Failed to load template list: ' + app.templateDatURL);
            });
        },
        loadExistingTemp: function () {
            var x2js = new X2JS(),
                ajaxUrl,
                _$selectedInput = _$('input[name=template-url]:checked');

            // Update UI to show additional input field to name the template
            app._$tempNameFromTemp.removeClass('hidden');
            app.templateId = parseInt(_$selectedInput.val());

            if (app.isLocalEnv) {
                ajaxUrl = 'assets/xml/' + app.templateId + '.xml';
                // Set the doc dimensions here
                _$.get('assets/data/data.templates.txt', function (data) {
                    var localData = JSON.parse(app.utils.filterResponse(data));
                    app.docDimensions = localData[app.templateId - 1].Dimensions.replace(' ', '').split(',');
                }, 'text');
            } else {
                ajaxUrl = '/be/api/PDF/Template.ashx?id=' + app.templateId + '&incXml=true'
            }

            _$.ajax({
                type: 'GET',
                url: ajaxUrl
            })
            .success(function (data) {
                var templateData,
                    tempJSON;

                if (app.isLocalEnv) {
                    templateData = data;
                    tempJSON     = x2js.xml2json(templateData);
                } else {
                    templateData = JSON.parse(app.utils.filterResponse(data));
                    // console.log(templateData, templateData[0].Dimensions, templateData[0].Dimensions === '');
                    tempJSON = x2js.xml_str2json(templateData[0].XML);
                    if (templateData[0].Dimensions === '') {
                        var docWidth = parseInt(tempJSON.doc.page._width),
                            docHeight = parseInt(tempJSON.doc.page._height);
                        // Set the doc dimensions manually
                        app.docDimensions = app.utils.dimensionlessDocSettings(docWidth, docHeight);
                        console.log(app.docDimensions);
                    } else {
                        app.docDimensions = templateData[0].Dimensions.replace(' ', '').split(',');
                    }
                    // console.log(tempJSON);
                    // console.log(app.docDimensions);
                }

                // Set the dimensions of the template
                app._$tempDimensionsName.text(app.docDimensions.join(','));
                // Set the name of the template so the user can see once in the edit modes
                app.templateName = _$selectedInput.next().find('.template-name').text();

                // Prompt the user to update the template name
                alert('Please update the template name');
                app._$tempNameFromTemp.val(app.templateName + ' - Copy');
                app._$templateName.text(app.templateName + ' - Copy');

                // Add class, to format the controls/canvas 
                _$('#template-tools-navigation').addClass('col-md-4');
                app.ct.loadTempFromJSON(tempJSON);
            })
            .fail(function () {
                alert('Load template request failed');
            });
        },
        loadTempFromJSON: function (canvasData) {
            console.log(canvasData);
            // console.log(canvasData.doc);
            var canvasEl = document.createElement('canvas'),
                docWidth = parseInt(canvasData.doc.page._width),
                docHeight = parseInt(canvasData.doc.page._height);

            // Set the ID of the Canvas      
            canvasEl.setAttribute('id', 'ct_canvas');

            var canvasSettings = app.utils.setCanvasSettings(docWidth, docHeight);
            // console.log(app.templateType);
            if(app.templateType === 'default'){
                // Set the canvas margin (15mm for A4) / Divided by the canvas scale
                app.canvasFixedMargin = Math.ceil(Math.ceil(15 * app.MMtoPxSize) / 2);
                // Make the number a multiple of 8, so its fits to the grid properly
                app.canvasFixedMargin = Math.ceil(app.canvasFixedMargin / 8) * 8;
            } else{
                // Set the canvas margin (5mm for business cards) / Divided by the canvas scale
                app.canvasFixedMargin = Math.ceil(Math.ceil(5 * app.MMtoPxSize) / 2);
                 // Make the number a multiple of 8, so its fits to the grid properly
                app.canvasFixedMargin = Math.ceil(app.canvasFixedMargin / 8) * 8;                
            }

            canvasEl.width = canvasSettings.width;
            canvasEl.height = canvasSettings.height;

            document.getElementById('template-canvas-container').appendChild(canvasEl);
            app._ct_canvas = new fabric.Canvas('ct_canvas', { selection: false, backgroundColor: '#FFF' });
            // This functions sets the max/min coordinatations an element can move to.
            app.utils.setCanvasMaxMargins(app._ct_canvas);
            app.utils.drawGrid(app._ct_canvas);
            // Add all of the elements to the page.
            app.ct.createTempBlockFromXML(canvasData.doc.page, canvasSettings.canvasScale);
            // Change the position of the document size controls within the DOM
            app.ct.repositionTempSizesControls(true);
            // Set the relevant dimensions checkboxs and disabled invalid ones.
            app.utils.setProductDimensions();
            // Bind Global and Create Template specific - Canvas events
            app.utils.bindGlobalCanvasEvents();
            app.ct.bindCreateTemplateCanvasEvents();
        },
        createTempBlockFromXML: function (templateJSON, scale) {
            console.log(scale)
            // console.log(templateJSON);
            if (typeof (templateJSON['text-block-group']) !== 'undefined') {
                if (typeof (templateJSON['text-block-group'].length) === 'undefined') {
                    // Only a single text block group
                    templateJSON['text-block-group']['block'] = 'tbg';
                    templateJSON['text-block-group']['scale'] = scale;
                    app.ct.createTempBlockData(true, templateJSON['text-block-group']);
                } else {
                    // Multiple text block groups
                    templateJSON['text-block-group'].forEach(function (textBlockGroup) {
                        textBlockGroup['block'] = 'tbg';
                        textBlockGroup['scale'] = scale;
                        app.ct.createTempBlockData(true, textBlockGroup);
                    });
                }
            }

            if (typeof (templateJSON['text-block']) !== 'undefined') {
                if (typeof (templateJSON['text-block'].length) === 'undefined') {
                    // Only a single text block
                    templateJSON['text-block']['block'] = 'tb';
                    templateJSON['text-block']['scale'] = scale;
                    app.ct.createTempBlockData(true, templateJSON['text-block']);
                } else {
                    // Multiple text blocks
                    templateJSON['text-block'].forEach(function (textBlock) {
                        textBlock['block'] = 'tb';
                        textBlock['scale'] = scale;
                        app.ct.createTempBlockData(true, textBlock);
                    });
                }
            }

            if (typeof (templateJSON['image']) !== 'undefined') {
                if (typeof (templateJSON['image'].length) === 'undefined') {
                    // Only a single image block
                    templateJSON['image']['block'] = 'ib';
                    templateJSON['image']['scale'] = scale;
                    app.ct.createTempBlockData(true, templateJSON['image']);
                } else {
                    // Multiple image blocks
                    templateJSON['image'].forEach(function (imgBlock) {
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
        resetTemplate: function () {
            // Check if the canvas exists before trying to clear it.
            if (app._ct_canvas) {
                app._ct_canvas.clear();
            }
            app.docDimensions = [];
            app.gEditActive = false;
            app.tbgEditActive = false;
            app.tempGroupCnt = 0;
            app.tempGBlockCnt = 0;

            // Reset the create template tool back to its default            
            app.ct.resetCreateTempBlock();
            _$('.empty-on-reset').empty();
            _$('.clear-on-reset').val('');
            _$('.stepped-option-2').addClass('hidden');
            _$('.new-template-container').removeClass('load-template-state');

            // Reposition the document size controls.
            app.ct.repositionTempSizesControls(false);
            // Show all document size options again
            app._$documentSizeBtns.parent().removeClass('hidden');

            _$('[name=doc-size], [name=doc-orientation]').not('default-setting').prop('checked', false);
            _$('.default-setting').prop('checked', true);
            _$('.active-option').fadeOut(100, function () {
                _$('.stepped-option').removeClass('active-option');
                _$('.stepped-option[data-step=0]').addClass('active-option').fadeIn(100);
            });
        },
        resetCreateTempBlock: function () {
            // console.log('Called');
            // Hide the edit buttons
            app.ct.toggleTempState(false);

            // Reset the text block group editing settings
            app.ct.handleTbgState(false);
            // Empty the the text block group list
            _$('#at-text-block-group-list').empty();
            // Resets all checkboxes and radio buttons to the default setting.
            _$('input[type="radio"].reset-to-default, input[type="checkbox"].reset-to-default').prop('checked', true);
            // Resets all text and number fields to the default setting.
            _$('input[type="text"].reset-to-default, input[type="number"].reset-to-default').each(function () {
                var _$this = _$(this);
                if (_$this.attr('value') > 0) {
                    var textVal = _$this.attr('value');
                    _$this.val(textVal);
                } else {
                    _$this.val('');
                }
            });
            // Enable all block type selections
            _$('input[name=template-block-type]').removeAttr('disabled');
            // Resets all buttons back to the default settings
            _$('button.reset-to-default').siblings().removeClass('option-selected').end()
                                        .addClass('option-selected');
            // Resets the tempale block options back to default
            _$('.template-options').not('reset-to-default').addClass('hidden');
            _$('div.reset-to-default').removeClass('hidden');
        },
        resetGroupTextBlock: function () {
            // Reset Maxlength
            var _$groupMaxLength = _$('#at-maxlength-g'),
                textVal = _$groupMaxLength.attr('value');
            _$groupMaxLength.val(textVal);

            // Reset Block name
            _$('#at-text-block-title').val('');

            // Reset Manditory and Editable
            _$('#at-text-block-group-el-options input[type="checkbox"].reset-to-default').prop('checked', true);

            // Reset Block Colour, Font, Size
            _$('#at-text-block-group-el-options button.reset-to-default').siblings().removeClass('option-selected').end()
                                                                        .addClass('option-selected');
        },
        repositionTempSizesControls: function (isFromExistingTemplate) {
            // Get the size Controls, then append it to the relevant container
            var _$sizeControls = _$('#template-doc-size-controls');
            if (isFromExistingTemplate === true) {
                _$("#from-template-doc-size-container").append(_$sizeControls)
            } else {
                _$("#new-template-doc-size-container").append(_$sizeControls)
            }
        },
        createNewTemp: function () {
            // Update UI to hide additional text field
            app._$tempNameFromTemp.addClass('hidden');
            // The canvas needs to be created this way: For more details:
            // (http://stackoverflow.com/questions/5034529/size-of-html5-canvas-via-css-versus-element-attributes)           
            var canvasEl = document.createElement('canvas'),
                size;
            canvasEl.setAttribute('id', 'ct_canvas');

            // Check if the document size desired template should be a regular paper size or business card.
            // All regular paper sizes use the same bases size (A4), but business cards are different.
            if (_$('[name=doc-size]:checked').val() !== 'Business Card') {
                // Set the canvas margin (15mm for standard A4 Documents) / Divided by the canvas scale
                app.canvasFixedMargin = Math.ceil(Math.ceil(15 * app.MMtoPxSize) / 2.0174);
                // Make the number a multiple of 8, so its fits to the grid properly
                app.canvasFixedMargin = Math.ceil(app.canvasFixedMargin / 8) * 8;
                // Check if the template should be portrait or landscape
                // The canvas needs to be set to a specific size based on the 2 checks above.
                if (_$('[name=doc-orientation]:checked').val() === 'p') {
                    app.orientation = 'p'; // Potrait
                    canvasEl.width = 396;
                    canvasEl.height = 561;
                } else {
                    app.orientation = 'l'; // Landscape
                    canvasEl.width = 561;
                    canvasEl.height = 396;
                }
            } else {
                // Set the canvas margin (5mm for business cards) / Divided by the canvas scale
                app.canvasFixedMargin = Math.ceil(Math.ceil(5 * app.MMtoPxSize) / 2);
                // Make the number a multiple of 8, so its fits to the grid properly
                app.canvasFixedMargin = Math.ceil(app.canvasFixedMargin / 8) * 8;
                // Only update the templateType when it is not a the default size of A4 being used
                app.orientation = 'l'; // Landscape
                app.templateType = 'business';
                canvasEl.width = 332;  // 88mm / 332.5984251968px
                canvasEl.height = 207;  // 55mm / 207.874015748px
            }
            app.ct.setTemplateDetails();

            document.getElementById('template-canvas-container').appendChild(canvasEl);
            app._ct_canvas = new fabric.Canvas('ct_canvas', { selection: false, backgroundColor: '#FFF' });
            app.utils.bindGlobalCanvasEvents();
            app.ct.bindCreateTemplateCanvasEvents();
            app.utils.drawGrid(app._ct_canvas);
        },
        setTemplateDetails: function () {
            var _$orientationDetail = _$('#template-orientation');
            // Set the template name
            // When validation is enabled, the below line can be uncommented.
            // app._$templateName.text(app.templateName);
            app._$templateName.text(app.templateName);

            // Store the set document varaitions sizes to an array
            app._$documentSizeBtns.each(function () {
                var _$this = _$(this);
                if (_$this.prop('checked') === true) {
                    app.docDimensions.push(_$this.val());
                }
            });

            // Set the text for available sizes
            app._$tempDimensionsName.text(app.docDimensions.join(','));

            // Set the text to show orientation selected
            if (app.orientation === 'p') {
                _$orientationDetail.text('Portrait');
            } else {
                _$orientationDetail.text('Landscape');
            }
        },
        deactiveCanvasControls: function () {
            // If the edit state is active, hide the edit options
            if (!_$('.disabled-in-edit-state').hasClass('hidden')) {
                // Hide the edit options
                app.ct.toggleTempState(false);
            }
        },
        setAspectRatio: function (aspectRatio) {
            switch (aspectRatio) {
                case '1:1':
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
        setBlockType: function (type) {
            switch (type) {
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
        createTempBlockData: function (fromXML, data) {
            // console.log(data);
            var blockType,
                blockSettings = {},
                blockSize;
            // Check if an element is being created using the creation tool or loading an existing template.
            // Replace with app.utils.createBlockDataFromXML(data) & app.utils.createBlockDataFromJSON(data);
            if (fromXML === true) {
                // console.log(data);
                if (data.block === 'ib') {
                    blockType = 'ib';
                    blockSettings.blocktype = 'new-image-block';
                    blockSettings.blockTitle = typeof (data._title) !== 'undefined' ? data._title : '';
                    blockSettings.halign = typeof (data._align) !== 'undefined' ? data._align : '';
                    blockSettings.isEditable = typeof (data._editable) !== 'undefined' ? data._editable : 'false';
                    blockSettings.isManditory = typeof (data._mandatory) !== 'undefined' ? data._mandatory : 'false';
                    blockSettings.valign = typeof (data._verticalalign) !== 'undefined' ? data._verticalalign : '';
                } else if (data.block == 'tb') {
                    blockType = 'tb';
                    blockSettings.blocktype = 'new-text-block';
                    blockSettings.blockTitle = typeof (data._title) !== 'undefined' ? data._title : '';
                    blockSettings.halign = typeof (data._align) !== 'undefined' ? data._align : 'left';
                    blockSettings.isEditable = typeof (data._editable) !== 'undefined' ? data._editable : 'false';
                    blockSettings.isManditory = typeof (data._mandatory) !== 'undefined' ? data._mandatory : 'false';
                    blockSettings.lineheight = typeof (data._leading) !== 'undefined' ? String(data._leading).replace('%', '') : '100';
                    blockSettings.valign = typeof (data._verticalalign) !== 'undefined' ? data._verticalalign : 'top';
                    // Text Block Specific
                    blockSettings.fontColor = app.utils.cmykToRGB(data._colour);
                    blockSettings.fontFamily = typeof (data['_font-family']) !== 'undefined' ? data['_font-family'] : 'FuturaBT-Heavy';
                    blockSettings.fontSize = typeof (data['_font-size']) !== 'undefined' ? data['_font-size'] : '12';
                    blockSettings.maxLength = typeof (data._maxlen) !== 'undefined' ? data._maxlen : '';
                    if (typeof (data._source) !== 'undefined') {
                        blockSettings.stringSrc = data._source;
                    } else {
                        blockSettings.textVal = typeof (data.__text) !== 'undefined' ? data.__text : '';
                    }
                } else if (data.block === 'tbg') {
                    blockSettings.blocktype = 'new-text-block-group';
                    blockSettings.blockTitle = typeof (data._title) !== 'undefined' ? data._title : '';
                    blockSettings.halign = typeof (data._align) !== 'undefined' ? data._align : 'left';
                    blockSettings.isEditable = typeof (data._editable) !== 'undefined' ? data._editable : 'false';
                    blockSettings.isManditory = typeof (data._mandatory) !== 'undefined' ? data._mandatory : 'false';
                    blockSettings.spacing = typeof (data._spacing) !== 'undefined' ? data._spacing : 'false';
                    blockSettings.valign = typeof (data._verticalalign) !== 'undefined' ? data._verticalalign : 'top';
                }
                // Convert to booleans
                blockSettings.isEditable  = 'true' ? true : false;
                blockSettings.isManditory = 'true' ? true : false;

                // Convert the unit to its equivelant based on an A4
                data._upperrightx = data._upperrightx / data.scale;
                data._upperrighty = data._upperrighty / data.scale;
                data._lowerleftx  = data._lowerleftx / data.scale;
                data._lowerlefty  = data._lowerlefty / data.scale;

                // console.log('Before Conversion: ' + data._upperrightx, data._upperrighty, data._lowerleftx, data._lowerleftx, data._lowerlefty);
                
                // console.log('After Conversion: ' + data._upperrightx, data._upperrighty, data._lowerleftx, data._lowerleftx, data._lowerlefty);
                // Generic block settings
                var canvasScale     = app.templateType === 'default' ? 2.0174 : 1,
                    blockDimensions = {},                    
                    canvasWidth     = app._ct_canvas.width,
                    canvasHeight    = app._ct_canvas.height;

                // Base of 15 at a3...
                // 1. Convert a unit into its equivelant it would be in a4. || 15 / 1.4142 (10.60670343657191)
                // 2. Convert the MM to its Pixel equivelant                || Math.ceil(10.60670343657191 * 3.779527559055) = 41
                // 3. Convert the that unit to the relevant size based of the scale of the canvas || Math.ceil(41 / 2.0174)  = 21

                blockDimensions.upperX = app.utils.convertMMtoPX(data._upperrightx, canvasScale);
                blockDimensions.upperY = app.utils.convertMMtoPX(data._upperrighty, canvasScale);
                blockDimensions.lowerX = app.utils.convertMMtoPX(data._lowerleftx, canvasScale);
                blockDimensions.lowerY = app.utils.convertMMtoPX(data._lowerlefty, canvasScale);
                
                blockSettings.height = app.utils.calcHeight(blockDimensions);
                blockSettings.width  = app.utils.calcWidth(blockDimensions);
                blockSettings.left   = app.utils.validateLeftPos(canvasWidth, blockDimensions.lowerX, blockSettings.width);
                blockSettings.top    = app.utils.validateTopPos(canvasHeight, blockDimensions.upperY, blockSettings.height);
                
                console.log(blockDimensions);
                console.log(blockSettings);

                if (data.block === 'tbg') {
                    var listItems = '',
                        blockSettings;
                    // Check if there is more than 1 text block inside the text block group
                    if (typeof (data['text-block'].length) !== 'undefined') {
                        data['text-block'].forEach(function (block) {
                            // console.log(block);
                            // blockSettings = {};
                            // console.log(block);
                            blockSettings.isEditable = typeof (block._editable) !== 'undefined' ? block._editable : 'false';
                            blockSettings.isManditory = typeof (block._mandatory) !== 'undefined' ? block._mandatory : 'false';
                            blockSettings.fface = typeof (block['_font-family']) !== 'undefined' ? block['_font-family'] : 'FuturaBT-Book';
                            blockSettings.fontColor = app.utils.cmykToRGB(block._colour);
                            blockSettings.fontSize = typeof (block['_font-size']) !== 'undefined' ? block['_font-size'] : 20; // Default font size
                            blockSettings.lineheight = typeof (block._leading) !== 'undefined' ? String(block._leading).replace('%', '') : '100';
                            blockSettings.id = typeof (block._id) !== 'undefined' ? block._id : 'false';
                            blockSettings.label = typeof (block._title) !== 'undefined' ? block._title : 'false';
                            blockSettings.maxLength = typeof (block._maxlen) !== 'undefined' ? block._maxlen : '';
                            if (typeof (block._source) !== 'undefined') {
                                blockSettings.stringSrc = block._source;
                            }
                            if (typeof (block.__text) !== 'undefined') {
                                blockSettings.textVal = block.__text;
                            }
                            listItems += app.ct.textBlockHtmlSnippet(blockSettings);
                        });
                    } else {
                        // console.log(block);
                        var singleBlock = data['text-block'];
                        // blockSettings = {};
                        // console.log(block);
                        blockSettings.isEditable = typeof (singleBlock._editable) !== 'undefined' ? singleBlock._editable : 'false';
                        blockSettings.isManditory = typeof (singleBlock._mandatory) !== 'undefined' ? singleBlock._mandatory : 'false';
                        blockSettings.fface = typeof (singleBlock['_font-family']) !== 'undefined' ? singleBlock['_font-family'] : 'FuturaBT-Book';
                        blockSettings.fontColor = app.utils.cmykToRGB(singleBlock._colour);
                        blockSettings.fontSize = typeof (singleBlock['_font-size']) !== 'undefined' ? singleBlock['_font-size'] : 20; // Default font size
                        blockSettings.lineheight = typeof (singleBlock._leading) !== 'undefined' ? String(singleBlock._leading).replace('%', '') : '100';
                        blockSettings.id = typeof (singleBlock._id) !== 'undefined' ? singleBlock._id : 'false';
                        blockSettings.label = typeof (singleBlock._title) !== 'undefined' ? singleBlock._title : 'false';
                        blockSettings.maxLength = typeof (singleBlock._maxlen) !== 'undefined' ? singleBlock._maxlen : '';
                        if (typeof (singleBlock._source) !== 'undefined') {
                            blockSettings.stringSrc = singleBlock._source;
                        }
                        if (typeof (singleBlock.__text) !== 'undefined') {
                            blockSettings.textVal = singleBlock.__text;
                        }
                        listItems += app.ct.textBlockHtmlSnippet(blockSettings);
                    }
                    _$('#at-text-block-group-list').append(listItems);
                    app.ct.createTempBlockGroup(blockSettings);
                } else {
                    app.ct.createTempBlockRegular(blockSettings)
                }
                // console.log(blockSettings);
            } else {
                blockType = app.ct.setBlockType(_$('input[name=template-block-type]:checked').val());
                blockSize = app.ct.setAspectRatio(_$('input[name=block-ratio]:checked').val()); // This returns and array

                // console.log(blockType);

                blockSettings.blockTitle = app._$tempBlockName.val() || 'Block';
                blockSettings.halign = _$('input[name=h-pos]:checked').val();
                blockSettings.height = blockSize[1];
                blockSettings.isEditable = _$('#at-editable').is(':checked') ? true : false;
                blockSettings.isManditory = _$('#at-manditory').is(':checked') ? true : false;
                blockSettings.left = app.canvasFixedMargin;
                blockSettings.top = app.canvasFixedMargin;
                blockSettings.valign = _$('input[name=v-pos]:checked').val();
                blockSettings.width = blockSize[0];

                if (blockType === 'ib') {
                    // If this is a image block;
                    blockSettings.blocktype = 'new-image-block';
                    blockSettings.fontColor = 'rgb(0,0,0)';
                    app.ct.createTempBlockRegular(blockSettings);
                } else if (blockType === 'tb') {
                    // If this is a text block;
                    blockSettings.blocktype = 'new-text-block';
                    blockSettings.fontColor = 'rgb(' + _$('#at-font-color .option-selected').attr('data-rgb') + ')';
                    blockSettings.fontFamily = _$('#at-font-face .option-selected').data('fface');
                    blockSettings.fontSize = _$('#at-font-size .option-selected').data('size');
                    blockSettings.lineheight = _$('#at-lineheight .option-selected').data('lineheight');
                    blockSettings.maxLength = _$('#at-maxlength').val();
                    if (_$('#at-source-yes').is(':checked')) {
                        blockSettings.stringSrc = _$('#at-src').val();
                        _$.ajax({
                            url: 'assets/' + blockSettings.stringSrc,
                            dataType: 'text'
                        })
                        .done(function (data) {
                            //console.log(data);
                            blockSettings.textVal = data;
                        })
                        .fail(function () {
                            alert('Failed to load source: ' + 'assets/' + blockSettings.stringSrc);
                        });
                    } else {
                        blockSettings.textVal = app.dummyText.responseText.substr(0, blockSettings.maxLength);
                    }
                    app.ct.createTempBlockRegular(blockSettings);
                } else if (blockType === 'tbg') {
                    // If is a text block group
                    blockSettings.blocktype = 'new-text-block-group';
                    blockSettings.height = 200;
                    blockSettings.spacing = parseInt(_$('#at-spacing-g').val());
                    blockSettings.width = 200;
                    //console.log(blockSettings);
                    app.ct.createTempBlockGroup(blockSettings);
                } else {
                    // This is a line block
                    blockSettings.blocktype = 'new-line-block';
                    app.ct.createTempBlockLine(blockSettings);
                }
            }
        },
        createTempBlockGroup: function (blockSettings, _block) {
            // Create the fabric js element on the canvas      
            // Only increment the counter if it is a new object
            console.log(blockSettings, blockSettings.width);
            app.tempGroupCnt = typeof (_block) !== 'undefined' ? app.tempGroupCnt : app.tempGroupCnt++;
            var _$textBlockList = _$('#at-text-block-group-list'),
                _blockId = typeof (_block) !== 'undefined' ? _block.blockId : 'tbg_' + app.tempGroupCnt;

            // console.log(_block);
            // Check if this is creating a group from an exisitng group. (Performing an update)
            if (typeof (_block) !== 'undefined') {
                // Create indiviual text block for the text block group   
                var _tblocks = app.ct.createTempBlockGroupItem(_$textBlockList.find('li'), _$('#at-spacing-g'), blockSettings);
                // Add each block to the exiting group
                console.log(_block);
                _tblocks.forEach(function (block) {
                    console.log(block);
                    // Add each block to the group
                    _block.add(block);
                });
                // Add the group to the canvas
                app._ct_canvas.add(_block).renderAll();
            } else if (_$textBlockList.find('li').length > 0) {
                // Use the settings from 'blockSettings' object if this is a new group
                var _tblocks = app.ct.createTempBlockGroupItem(_$textBlockList.find('li'), blockSettings.spacing, blockSettings);
                // Add the group elements to the group container
                console.log(blockSettings.left)
                var _tblockg = new fabric.Group(_tblocks, {
                    backgroundColor: 'rgb(205,205,205)',
                    fill: 'rgb(0,0,0)',
                    hasBorders: true,
                    hasRotatingPoint: false,
                    height: typeof (blockSettings.height) !== 'undefined' ? blockSettings.height : 200,
                    lockRotation: true,
                    originX: 'left',
                    originY: 'top',
                    width: typeof (blockSettings.width) !== 'undefined' ? blockSettings.width : 200,
                    top: typeof (blockSettings.top) !== 'undefined' ? blockSettings.top : app.canvasFixedMargin,
                    left: typeof (blockSettings.left) !== 'undefined' ? blockSettings.left : app.canvasFixedMargin,
                });
                // console.log(_tblockg);
                // Set the id and blocktype of the Text Block Group
                // console.log(blockSettings);
                _tblockg['blockId'] = _blockId;
                _tblockg['blocktype'] = 'new-text-block-group';
                _tblockg['halign'] = blockSettings.halign;
                _tblockg['isEditable'] = blockSettings.isEditable;
                _tblockg['isManditory'] = blockSettings.isManditory;
                _tblockg['spacing'] = blockSettings.spacing;
                _tblockg['valign'] = blockSettings.valign;

                // Add the group to the canvas
                app._ct_canvas.add(_tblockg).renderAll();
            } else {
                alert('No text blocks added to text block group. Please try again');
            }

            // Empty the list when complete
            _$textBlockList.empty();
            // Add the group to the canvas
            app._ct_canvas.renderAll();

            // Empty the input field with the previous component name.
            app.ct.resetCreateTempBlock();
        },
        createTempBlockRegular: function (blockSettings) {
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
            _block['blocktype'] = blockSettings.blocktype;
            _block['blockTitle'] = blockSettings.blockTitle;
            _block['halign'] = blockSettings.halign;
            _block['isEditable'] = blockSettings.isEditable;
            _block['isManditory'] = blockSettings.isManditory;
            _block['parentid'] = blockSettings.parentid;
            _block['valign'] = blockSettings.valign;
            // console.log(blockSettings);
            // Add additional properties based on blocktype
            if (blockSettings.blocktype === 'new-text-block') {
                _block['fontColor'] = blockSettings.fontColor;
                _block['fontFamily'] = blockSettings.fontFamily;
                _block['fontSize'] = parseInt(blockSettings.fontSize);
                _block['lineheight'] = String(blockSettings.lineheight).replace('%', '');
                _block['maxLength'] = parseInt(blockSettings.maxLength);
                _block['stringSrc'] = blockSettings.stringSrc;
                _block['textVal'] = blockSettings.textVal;
            }

            // console.log('Before adding: ', _block);
            // console.log(blockType);
            // Add the new component to the canvas. This needs to be done, before we can update the background img of the object
            app._ct_canvas.add(_block);

            // Set the relevant background image for block, based on blocktype
            app.ct.setTempBlockBackgroundImg(_block, app.ct.setBlockType(_$('input[name=template-block-type]:checked').val()));
            // Empty the input field with the previous component name.
            app.ct.resetCreateTempBlock();
        },
        createTempBlockGroupItem: function ($els, spacing, parentSettings) {
            console.log(parentSettings);
            var _blocksCollection = [],
                spacingInt        = parseInt(spacing),
                elHeight          = parentSettings.height / $els.length - (spacingInt * ($els.length - 1));
            // console.log(parentSettings.height, elHeight, spacingInt)
            // console.log(blockSettings.spacingInt, blockSettings.spacingInt * parseInt(i + 1) );
            $els.each(function (i) {
                var $template   = _$(this),
                    topVal      = i === 0 ? 0 : (i * elHeight) + (i * spacingInt),                    
                    _innerblock = new fabric.Rect({
                        fill: 'rgb(0,0,0)',
                        hasBorders: true,
                        hasRotatingPoint: false,
                        height: elHeight,
                        left: 0,
                        lockRotation: true,
                        originX: 'left',
                        originY: 'top',
                        // top: 0,
                        top: topVal,
                        width: parentSettings.width
                    });
                // Add additional non-block specific properties based on blocktype
                _innerblock['blocktype'] = 'new-text-block';
                _innerblock['blockTitle'] = $template.text(),
                _innerblock['isEditable'] = $template.data('editable');
                _innerblock['isManditory'] = $template.data('manditory');
                _innerblock['id'] = $template.data('id');
                _innerblock['lineheight'] = $template.data('lineheight');
                _innerblock['fontColor'] = $template.data('rgb');
                _innerblock['fontFamily'] = $template.data('fface');
                _innerblock['fontSize'] = parseInt($template.data('size'));
                _innerblock['label'] = $template.data('label');
                _innerblock['maxLength'] = parseInt($template.data('maxlength'));
                _innerblock['textVal'] = $template.find('.text-value').text();
                // console.log(_innerblock);
                _blocksCollection.push(_innerblock);
            });
            return _blocksCollection;
        },
        createTempBlockLine: function (blockSettings) {
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
            _block['blocktype'] = blockSettings.blocktype;
            _block['blockTitle'] = blockSettings.blockTitle;
            _block['halign'] = blockSettings.halign;
            _block['isEditable'] = blockSettings.isEditable;
            _block['isManditory'] = blockSettings.isManditory;
            _block['valign'] = blockSettings.valign;

            // Add additional properties based on blocktype 
            if (blockType === 't') {
                _block['fontColor'] = blockSettings.fontColor;
                _block['fontFamily'] = blockSettings.fontFamily;
                _block['fontSize'] = parseInt(blockSettings.fontSize);
                _block['maxLength'] = parseInt(blockSettings.maxLength);
                _block['stringSrc'] = blockSettings.stringSrc;
                _block['textVal'] = blockSettings.textVal;
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
        editTempBlock: function () {
            var _block = app._ct_canvas.getActiveObject(),
                blockType = app.ct.setBlockType(_$('input[name=template-block-type]:checked').val());
            // console.log(blockType);
            // console.log(_block);
            if (blockType === 'tb') {
                _block.blocktype = 'new-text-block';
                _block.fontColor = 'rgb(' + _$('#at-font-color .option-selected').attr('data-rgb') + ')';
                _block.fontFamily = _$('#at-font-face .option-selected').data('fface');
                _block.fontSize = _$('#at-font-size .option-selected').data('size');
                _block.lineheight = _$('#at-lineheight .option-selected').data('lineheight');
                _block.maxLength = _$('#at-maxlength').val();
                if (typeof (_block.stringSrc) !== 'undefined') {
                    _block.stringSrc = _$('#at-src').val();
                }
            } else if (blockType === 'ib') {
                _$('#new-template-image-block').siblings().addClass('hidden').end()
                                              .removeClass('hidden');
                _block.blocktype = 'new-image-block';
            } else if (blockType === 'tbg') {
                // Remove the current objects inside of the group
                console.log(_block);
                _block.forEachObject(function (o) {
                    console.log(o);
                    _block.remove(o);
                    console.log(_block);
                });
                // Add new items...
                console.log('Should be empty', _block);

                if (_$('#at-text-block-group-list').find('li').length > 0) {
                    app.ct.createTempBlockGroup(_$('#at-text-block-group-list').find('li'), _block);
                } else {
                    alert('The text block does not contain any text blocks, so it will be removed.');
                    app._ct_canvas.remove(_block);
                }
            }
            // Set non-specific block settings
            _block.blockTitle = app._$tempBlockName.val();
            _block.halign = _$('input[name=h-pos]:checked').val();
            _block.isEditable = _$('#at-editable').is(':checked') ? true : false;
            _block.isManditory = _$('#at-manditory').is(':checked') ? true : false;
            _block.valign = _$('input[name=v-pos]:checked').val();

            // Set the relevant background image for block, based on blocktype
            if (blockType !== 'tbg') {
                app.ct.setTempBlockBackgroundImg(_block, blockType);
            }
            // Reset the component creation tool.
            app.ct.resetCreateTempBlock();
            // De-select the element previously selected on the canvas
            app._ct_canvas.deactivateAll().renderAll();
            // Upadate Global Edit State
            app.gEditActive = false;
        },
        editBlockFromGroup: function ($el) {
            // Set the active mode
            app.tbgEditActive = true;
            _$('.divider').removeClass('hidden');

            // Update the the settings on the list Item 
            var $blockEl = $el.parent(),
                rgbAttr = 'data-rgb="' + $blockEl.data('rgb') + '"',
                ffaceAttr = 'data-fface="' + $blockEl.data('fface') + '"';
            _$('#at-text-block-group-el-options').data('tbgid', $blockEl.data('id'));

            _$('#at-text-block-title').val($blockEl.data('label'));
            _$('#at-font-face-g button[' + ffaceAttr + ']').siblings().removeClass('option-selected').end()
                                                          .addClass('option-selected');

            _$('#at-font-size-g button[data-size=' + $blockEl.data('size') + ']').siblings().removeClass('option-selected').end()
                                                                                .addClass('option-selected');

            _$('#at-font-color-g button[' + rgbAttr + ']').siblings().removeClass('option-selected').end()
                                                         .addClass('option-selected');

            _$('#at-lineheight-g button[data-lineheight=' + $blockEl.data('lineheight') + ']').siblings().removeClass('option-selected').end()
                                                                                             .addClass('option-selected');
            _$('#at-maxlength-g').val($blockEl.data('maxlength'));
            _$('#at-manditory-g').prop('checked', $blockEl.data('manditory'));
            _$('#at-editable-g').prop('checked', $blockEl.data('editable'));
        },
        updateBlockFromGroup: function () {
            app.ct.handleTbgState(false);
            var blockInEditIndex = _$('#at-text-block-group-el-options').data('tbgid'),
                $blockItem = _$('#at-text-block-group-list li[data-id=' + blockInEditIndex + ']');

            // Update the name of the element
            $blockItem.find('.badge').text(_$('#at-text-block-title').val());
            // Update the attributes of the element
            $blockItem.data('label', _$('#at-text-block-title').val());
            $blockItem.data('fface', _$('#at-font-face-g .option-selected').data('fface'));
            $blockItem.data('size', _$('#at-font-size-g .option-selected').data('size'));
            $blockItem.data('rgb', _$('#at-font-color-g .option-selected').data('rgb'));
            $blockItem.data('maxlength', _$('#at-maxlength-g').val());
            $blockItem.data('lineheight', _$('#at-lineheight-g .option-selected').data('lineheight'));
            $blockItem.data('manditory', _$('#at-manditory-g').is(':checked'));
            $blockItem.data('editable', _$('#at-editable-g').is(':checked'));
            app.ct.stopBlockFromGroup();
            // Update the Edit active state
            app.tbgEditActive = false;
        },
        stopBlockFromGroup: function () {
            app.ct.handleTbgState(false);
            // Hide or show the relevant controls
            if (app.gEditActive === true) {
                _$('[data-state=disable-in-tgb-edit-state]').addClass('hidden');
            } else {
                _$('[data-state=disable-in-tgb-edit-state]').removeClass('hidden');
            }
            app.tbgEditActive = false;
        },
        setTempBlockSettings: function (_selectedEl) {
            console.log(_selectedEl);
            var test = app._ct_canvas.getActiveGroup();
            console.log(test);
            // Set the block type name
            // template-text-block-group
            var blockTypeName = 'template' + _selectedEl.blocktype.replace('new', '');
            //console.log(blockTypeName);

            // Set the title
            app._$tempBlockName.val(_selectedEl.blockTitle);

            // Set H Align      
            _$('input[value=' + _selectedEl.halign + ']').prop('checked', true);
            // Set V Align
            _$('input[value=' + _selectedEl.valign + ']').prop('checked', true);

            // Set Editable
            if (_selectedEl.isEditable === true) {
                _$('#at-editable').prop('checked', true);
            } else {
                _$('#at-editable').prop('checked', false);
            }

            // Set Manditory
            if (_selectedEl.isManditory === true) {
                _$('#at-manditory').prop('checked', true);
            } else {
                _$('#at-manditory').prop('checked', false);
            }

            // Set Block Type
            // console.log(typeof(blockTypeName), blockTypeName);
            _$('#' + blockTypeName).prop('checked', true);

            // Set Block specific values
            if (blockTypeName === 'template-text-block') {
                _$('#template-text-block-group').attr('disabled', 'disabled');
                _$('#template-text-block, #template-image-block').removeAttr('disabled', 'disabled');
                // Set the text block specific settings.
                var rgb = _selectedEl.fontColor.replace('rgb(', '').replace(')', ''),
                    rgbAttr = 'data-rgb="' + rgb + '"',
                    ffaceAttr = 'data-fface="' + _selectedEl.fontFamily + '"',
                    linehAttr = 'data-lineheight="' + _selectedEl.lineheight + '"';

                // Color
                _$('button[' + rgbAttr + ']').siblings().removeClass('option-selected').end()
                                                      .addClass('option-selected');
                // Font size
                _$('button[data-size=' + _selectedEl.fontSize + ']').siblings().removeClass('option-selected').end()
                                                                 .addClass('option-selected');
                // Font Family
                _$('button[' + ffaceAttr + ']').siblings().removeClass('option-selected').end()
                                            .addClass('option-selected');

                // Line Height
                _$('button[' + linehAttr + ']').siblings().removeClass('option-selected').end()
                                                      .addClass('option-selected');

                //  MaxLength
                _$('#at-maxlength').val(_selectedEl.maxLength);

                // From Source
                if (typeof (_selectedEl.stringSrc) !== 'undefined') {
                    _$('#at-src').val(_selectedEl.stringSrc);
                    _$('#at-source-yes').prop('checked', true);
                } else {
                    _$('#at-source-no').prop('checked', true)
                }

                // Show the TEXT editing options only                              
                _$('#new-template-text-block').removeClass('hidden');
                _$('#new-template-image-block, #new-template-text-block-group').addClass('hidden');
            } else if (blockTypeName === 'template-image-block') {
                _$('#template-text-block-group').attr('disabled', 'disabled');
                _$('#template-text-block, #template-image-block').removeAttr('disabled', 'disabled');
                // Show the IMAGE editing options only
                _$('#new-template-image-block').removeClass('hidden');
                _$('#new-template-text-block, #new-template-text-block-group').addClass('hidden');
            } else if (blockTypeName === 'template-text-block-group') {
                _$('#template-text-block, #template-image-block').attr('disabled', 'disabled');
                // Show the TEXT BLOCK GROUP editing options only
                _$('#new-template-text-block-group').removeClass('hidden');
                _$('#new-template-text-block, #new-template-image-block').addClass('hidden');
                // Set Spacing
                _$('#at-spacing-g').val(_selectedEl.spacing);

                // Set text blocks inside text block group
                var $textBlockList = _$('#at-text-block-group-list'),
                    blockHTML = '',
                    blockDetails = {};
                // Empty the list of text blocks from the list and then show the element
                $textBlockList.empty().show();
                // Create each text block with its previous settings set
                _selectedEl._objects.forEach(function (_textBlock) {
                    blockDetails.fontSize = _textBlock.fontSize;
                    blockDetails.fface = _textBlock.fontFamily;
                    blockDetails.fontColor = _textBlock.fontColor;
                    blockDetails.id = _textBlock.id;
                    blockDetails.isEditable = _textBlock.isEditable;
                    blockDetails.isManditory = _textBlock.isManditory;
                    blockDetails.label = _textBlock.label;
                    blockDetails.lineheight = _textBlock.lineheight;
                    blockDetails.maxLength = _textBlock.maxLength;
                    blockDetails.textVal = _textBlock.textVal;
                    // console.log(blockDetails);
                    blockHTML = app.ct.textBlockHtmlSnippet(blockDetails);
                    $textBlockList.append(blockHTML);
                });
                // Add stuff for line elements        
            }
        },
        setTempBlockBackgroundImg: function (_block, blocktype) {
            //console.log(_block);
            var imgSrc,
                repeatSetting;
            // console.log('setTempBlockBackgroundImg ' + blocktype);
            if (blocktype === 'tb') {
                if (app.isLocalEnv) {
                    imgSrc = 'assets/img/text-placeholder.png';
                } else {
                    imgSrc = '../assets/img/text-placeholder.png';
                }
                repeatSetting = 'repeat';
            } else if (blocktype === 'ib') {
                if (app.isLocalEnv) {
                    imgSrc = 'assets/img/img-placeholder.png';
                } else {
                    imgSrc = '../assets/img/img-placeholder.png';
                }
                repeatSetting = 'no-repeat';
            }

            if (blocktype === 'tb' || blocktype === 'ib') {
                fabric.util.loadImage(imgSrc, function (img) {
                    _block.setPatternFill({
                        source: img,
                        repeat: repeatSetting
                    });
                    app._ct_canvas.renderAll();
                });
            }
        },
        delTempBlock: function () {
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
        stopTempBlock: function () {
            // De-select the element previously selected on the canvas
            app._ct_canvas.deactivateAll().renderAll();
            // Reset the component creation tool.
            app.ct.resetCreateTempBlock();
            // Upadate Global Edit State
            app.gEditActive = false;
        },
        toggleTempState: function (isEditing) {
            // console.log(isEditing);
            if (isEditing === true) {
                _$('.disabled-in-edit-state').addClass('hidden');
                _$('.enabled-in-edit-state').removeClass('hidden');
            } else {
                _$('.disabled-in-edit-state').removeClass('hidden');
                _$('.enabled-in-edit-state').addClass('hidden');
            }
        },
        bindCreateTemplateCanvasEvents: function () {
            // This event handles whether to enter edit mode or not
            app._ct_canvas.on('object:selected', function (e) {
                // Set the global edit state
                app.gEditActive = true;
                // Set the block settings to what the currently selected blocks settings are
                app.ct.setTempBlockSettings(app._ct_canvas.getActiveObject());
                // Show the edit options
                app.ct.toggleTempState(true);
            });
            app._ct_canvas.on('mouse:down', function (e) {
                // console.log(e);
                // console.log(typeof(e.target) !== 'undefined');
                // console.log(typeof(e.target._objects) !== 'undefined');
                // console.log(e.target.blocktype !== 'new-text-block-group');
                // Checks if the canvas itself has been clicked. If it has been clicked, then get out of edit mode
                if (typeof (e.target) !== 'undefined' && typeof (e.target._objects) !== 'undefined' && e.target.blocktype !== 'new-text-block-group') {
                    // Reset Create template options
                    app.ct.resetCreateTempBlock();
                    // Hide the edit options
                    app.ct.toggleTempState(false);
                }
            });
            _$('.template-container').on('click', app.ct.deactiveCanvasControls);
        },


        /**
            BUILD UI CONTROLS
        **/
        createTemplateControls: function(){
            app.ct.createTempColourControls();
            app.ct.createTempFontSizeControls();
            app.ct.createTempFontFaceControls();
            app.ct.createTempLineHeights();
        },
        createTempColourControls: function(){
            var colourOptionsString = '';
            app.fontColours.forEach(function(colorOpt){
                var defaultOpt = '';
                if(colorOpt.isDefault === true){
                    defaultOpt = 'reset-to-default option-selected';
                }
                colourOptionsString+= '<button type="button" ';
                    colourOptionsString+= 'class="at-control btn btn-default color-option ' + colorOpt.className + ' ' + defaultOpt + '"';
                    colourOptionsString+= 'data-rgb="' + colorOpt.rgb +'">';
                    colourOptionsString+= colorOpt.name;
                colourOptionsString+= '</button>';
            });
            _$('#at-font-color').append(colourOptionsString);
        },
        createTempFontSizeControls: function(){
            var fontOptionString = '';

            app.fontSizes.forEach(function(fontOpt){
                var defaultOpt = '';
                if(fontOpt.isDefault === true){
                    defaultOpt = 'reset-to-default option-selected';
                }
                fontOptionString+= '<button type="button" ';
                    fontOptionString+= 'class="at-control btn btn-default ' + defaultOpt + '" data-size="' + fontOpt.ptSize + '">';
                    fontOptionString+= fontOpt.ptSize;
                fontOptionString+= '</button>';
            });

            _$('#at-font-size').append(fontOptionString);
        },
        createTempFontFaceControls: function(){
            var fontOptionString = '';

            app.fontFaces.forEach(function(fontFaceOpt){
                var defaultOpt = '';
                if(fontFaceOpt.isDefault === true){
                    defaultOpt = 'reset-to-default option-selected';
                }
                fontOptionString+= '<button type="button" ';
                    fontOptionString+= 'class="at-control btn btn-default ' + defaultOpt + '" data-fface="' + fontFaceOpt.ffname + '">';
                    fontOptionString+= fontFaceOpt.fftitle;
                fontOptionString+= '</button>';
            });

            _$('#at-font-face').append(fontOptionString);
        },
        createTempLineHeights: function(){
            var lineheightOptionString = '';

            app.lineHeights.forEach(function(lineHeightOpt){
                var defaultOpt = '';
                if(lineHeightOpt.isDefault === true){
                    defaultOpt = 'reset-to-default option-selected';
                }
                lineheightOptionString+= '<button type="button" ';
                    lineheightOptionString+= 'class="at-control btn btn-default ' + defaultOpt + '" data-lineheight="' + lineHeightOpt.lineheight + '">';
                    lineheightOptionString+= lineHeightOpt.lineheight + '%';
                lineheightOptionString+= '</button>';
            });
  
            _$('#at-lineheight').append(lineheightOptionString);
        },


        /**
          UI Specific Functions
        **/        
        setSelectedOption: function () {
            var $this = _$(this);
            $this.siblings().removeClass('option-selected').end()
                 .addClass('option-selected');
        },
        showTemplates: function ($el) {
            console.log($el);
            var $templateControlsContainer = _$('#template-tools-navigation'),
                $templateCanvasContainer = _$('.new-template-container');
            if ($el.attr('id') === 'at-show-templates') {
                $templateControlsContainer.removeClass('col-md-4');
            } else {
                $templateControlsContainer.addClass('col-md-4')
            }

            if ($el.hasClass('at-from-template')) {
                $templateCanvasContainer.addClass('load-template-state');
            } else {
                $templateCanvasContainer.removeClass('load-template-state');
            }
        },
        toggleTempGroupOpts: function (isClose) {
            var $blockControls = _$('.new-block-controls'),
                $groupControls = _$('.new-group-controls');

            if (_$(this).attr('id') === 'at-save-block-to-group') {
                $blockControls.removeClass('hidden');
                $groupControls.addClass('hidden');
                app.ct.addBlockToGroup(app.tempGBlockCnt);
                app.ct.resetGroupTextBlock();
                app.tempGBlockCnt++;
            } else {
                _$('#at-text-block-group-el-options').attr('data-tbgid', app.tempGBlockCnt);
                $blockControls.addClass('hidden');
                $groupControls.removeClass('hidden');
            }

            if (isClose === false) {
                $blockControls.removeClass('hidden');
                $groupControls.addClass('hidden');
            }
        },
        addBlockToGroup: function (blockId) {
            var $textBlockList = _$('#at-text-block-group-list'),
                blockHTML,
                blockDetails = {};
            if ($textBlockList.find('li').length === 0) {
                $textBlockList.show();
            }
            blockDetails.fontSize = _$('#at-font-size-g .option-selected').data('size');
            blockDetails.fface = _$('#at-font-face-g .option-selected').data('fface');
            blockDetails.fontColor = _$('#at-font-color-g .option-selected').data('rgb');
            blockDetails.id = blockId;
            blockDetails.isEditable = _$('#at-editable-g').is(':checked') ? true : false;
            blockDetails.isManditory = _$('#at-manditory-g').is(':checked') ? true : false;
            blockDetails.label = _$('#at-text-block-title').val().length > 0 ? _$('#at-text-block-title').val() : 'Text Block ' + blockId;
            blockDetails.lineheight = _$('#at-lineheight-g .option-selected').data('lineheight');
            blockDetails.maxLength = _$('#at-maxlength-g').val();

            blockHTML = app.ct.textBlockHtmlSnippet(blockDetails);
            $textBlockList.append(blockHTML);
        },
        handleTbgState: function (state) {
            // Update the UI
            //console.log('handleTbgState ' + state)
            if (state === true) {
                _$('[data-state=disable-text-block-controls]').addClass('hidden');
                _$('[data-state=enable-text-block-controls]').removeClass('hidden');
            } else {
                _$('[data-state=disable-text-block-controls]').removeClass('hidden');
                _$('[data-state=enable-text-block-controls]').addClass('hidden');
            }
        },
        textBlockHtmlSnippet: function (settings) {
            // console.log(settings)
            var htmlString = '';
            htmlString += '<li class="list-group-item" ';
            htmlString += 'data-editable="' + settings.isEditable + '" ';
            htmlString += 'data-fface="' + settings.fface + '" ';
            htmlString += 'data-rgb="' + settings.fontColor + '" ';
            htmlString += 'data-size="' + settings.fontSize + '" ';
            htmlString += 'data-id="' + settings.id + '" ';
            htmlString += 'data-label="' + settings.label + '" ';
            htmlString += 'data-lineheight="' + settings.lineheight + '" ';
            htmlString += 'data-manditory="' + settings.isManditory + '" ';
            htmlString += 'data-maxlength="' + settings.maxLength + '">';
            htmlString += '<span class="badge">' + settings.label + '</span>';
            htmlString += '<span class="hidden text-value">' + settings.textVal + '</span>';
            htmlString += '<button type="button" data-action="remove-tb-from-tbg" class="btn btn-danger pull-right">X</button>';
            htmlString += '<button type="button" data-action="edit-tb-from-tbg" class="btn btn-info pull-right">Edit</button>';
            htmlString += '</li>';
            return htmlString
        },


        /** 
          Validation
        **/
        validateTemplateName: function () {
            app._$newTempBtn.removeAttr('disabled');
            app.templateName = _$.trim(_$(this).val());
            // var $this = _$(this);
            // if($this.val().length > 2){
            //   app._$newTempBtn.removeAttr('disabled');
            //   );
            // }else{
            //   app._$newTempBtn.attr('disabled', 'disabled');
            // }
        },
        validateDocSize: function () {
            var $this = _$(this),
                $businessCardOpt = _$('.doc-size-business'),
                $docOrientationOpts = _$('input[name=doc-orientation]');

            if ($this.val() === 'Business Card') {
                app._$documentSizeBtns.not('.doc-size-business').prop('checked', false);
                $businessCardOpt.prop('checked', true);
                $docOrientationOpts.eq(1).prop('checked', true);
                $docOrientationOpts.first().removeAttr('checked').attr('disabled', 'disabled').addClass('default-disabled');
            } else {
                // $docOrientationOpts.eq(1).prop('checked', false);
                if ($docOrientationOpts.hasClass('default-disabled')) {
                    $docOrientationOpts.eq(0).removeAttr('disabled').prop('checked', true).removeClass('default-disabled');
                }

                if ($businessCardOpt.prop('checked')) {
                    $businessCardOpt.prop('checked', false);
                }
            }
        },

        /** 
          Click elements
        **/
        bindCreateTemplateClickEvents: function () {
            app._$tempActionBtn = _$('.create-template, .update-template');

            app._$reserCreateTemp = _$('.reset-create-template');
            app._$addTempArea = _$('#add-template-block');
            app._$addBlockToGroup = _$('#at-add-block-to-group');
            app._$saveBlockToGroup = _$('#at-save-block-to-group');
            app._$exitBlockToGroup = _$('#at-close-block-to-group');
            app._$stepBtns = _$('.step-option-btn:not(.at-from-template)');
            app._$newTempBtn = _$('#at-new-template');
            app._$fromTempBtn = _$('.at-from-template');
            app._$toggleElTriggers = _$('.js-toggle-target-el');
            app._$updateTbBtn = _$('[data-action=update-tb-from-tbg]');
            app._$stopTbBtn = _$('[data-action=stop-tb-from-tbg');

            // Updates the template name above the canvas when typing into input field
            app._$tempNameFromTemp.on('keyup', function () {
                _$.debounce(app._$templateName.text(_$(this).val()), 500);
            });


            // Edit Canvas Component Triggers
            app._$delComponentBtn = _$('#at-remove-component');
            app._$editComponentBtn = _$('#at-update-component');
            app._$stopComponentBtn = _$('#at-stop-update-component');

            // Bind to dom elements to functions
            app._$reserCreateTemp.on('click', app.ct.resetTemplate);
            app._$tempActionBtn.on('click', app.ct.createTempInit);

            app._$tmplToggleBtn = _$('.template-container [data-action=toggle-grid]');
            app._$tmplToggleBtn.on('click', function () {
                app.utils.toggleCanvasGrid(_$(this), false, app._ct_canvas);
            });
            _$('.template-container [data-action=download-thumbnail]').on('click', function () {
                console.log(app._ct_canvas);
                app.utils.convertCanvasToImgDownload(_$(this), app._ct_canvas);
            });
            app._$documentSizeBtns.on('click', app.ct.validateDocSize);
            app._$newTempBtn.on('click', app.ct.createNewTemp);
            app._$stepBtns.on('click', function () {
                app.utils.steppedOptionHandler(_$(this));
            });
            app._$fromTempBtn.on('click', function () {
                var $this = _$(this);
                app.utils.steppedOptionHandler($this);
                app.ct.toggleTempState(false);
                app.ct.loadExistingTemp();
            });
            app._$addTempArea.on('click', app.ct.createTempBlockData);
            app._$addBlockToGroup.on('click', function () {
                app.ct.toggleTempGroupOpts();
                app.ct.resetGroupTextBlock();
            });
            app._$saveBlockToGroup.on('click', app.ct.toggleTempGroupOpts);
            app._$updateTbBtn.on('click', app.ct.updateBlockFromGroup);
            app._$stopTbBtn.on('click', app.ct.stopBlockFromGroup);
            app._$exitBlockToGroup.on('click', function () {
                app.ct.toggleTempGroupOpts(false);
                app.ct.resetGroupTextBlock();
            });
            app._$body.on('click', '.text-editor-option button', app.ct.setSelectedOption);
            app._$templateName.on('keyup blur', app.ct.validateTemplateName);
            app._$toggleElTriggers.on('click', app.ct.toggleElements);
            app._$delComponentBtn.on('click', app.ct.delTempBlock);
            app._$editComponentBtn.on('click', app.ct.editTempBlock);
            app._$stopComponentBtn.on('click', app.ct.stopTempBlock);
            app._$body.on('click', 'button[data-action=remove-tb-from-tbg]', function () {
                _$(this).parent().remove();
                if (_$('#at-text-block-group-list li').length > 0) {
                    _$('#at-text-block-group-list li').removeAttr('style');
                }
            });
            app._$body.on('click', 'button[data-action=edit-tb-from-tbg]', function () {
                app.ct.handleTbgState(true);
                app.ct.editBlockFromGroup(_$(this));
            });
        },


        /**
          Creation tool end points
        **/
        createTempInit: function () {
            var confrimation;
            // Check if a user is trying to make and update or create a new template
            if (_$(this).hasClass('update-template')) {
                confrimation = confirm("Are you sure you want to update this template? This will effect any products that have been created using this template.");
                // Confrim to the user that they are making an update.
                if (confrimation == true) {
                    // Set the templateId so this can be passed through to the POST request and update the correct template
                    app.templateId = _$('input[name=template-url]:checked').val();
                }
            }

            // Check that if is is an update, they have confirmed they are happy to make it. Otherwise this request is to create a new template
            if (!_$(this).hasClass('update-template') || confrimation === true) {
                // Set what type of request this is. Required by the utils.generateXML 
                app.isCreateTemplate = true;
                app.isCreateProduct = false;
                app.isUpdateProduct = false;
                // We are creating a template, rather than updating.
                if (typeof (confrimation) === 'undefined') {
                    app.templateId = null;
                }
                // Create a preview image on the page of what is on the canvas
                app.utils.generateCanvasPreviewImg(app._$tmplToggleBtn, app._ct_canvas, 'ct');
                // Begin creating the templates' cooridnates/XML
                app.utils.generateCords(app.utils.generateJSON(app._ct_canvas));
            }
        },
    };

    if (_$('[data-template=build-template]').length > 0) {
        app.ct.initCreateTemp();
    }
});