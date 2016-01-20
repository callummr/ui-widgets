var app = app || {};

// Required to use _$ instead of $ to do a multiple versions of jquery being loaded.
// jQueryConflict is set in the utils file

_$(document).ready(function () {
    'use strict';
    // _$ = dom elements

    app.pageCounter = 0;
    app.zIndexCounter = 1;
    app._$productStage = _$('#product-stage-master-container');
    app.productStageSize;
    app.defaultImgBlockPath = 'white-block.jpg';
    app.docAssetPath;
   
    // ucp = USER CREATE PRODUCT
    app.ucp = {
        init: function () {            
            app.ucp.loadAnimation(true);
            app.ucp.getProductDetails();
            app.ucp.bindUserCreateProductDomEvents();
        },

        /**
            LOAD A PRODUCTS DETAILS
        **/
        getProductDetails: function(){
            var x2js = new X2JS(),
                productData,
                productJSON;

            if(app.isLocalEnv){
                _$.ajax({
                    // url: 'assets/data/data.product1.txt',
                    // url: 'assets/data/data.product2.txt',
                    url: 'assets/data/data.product3-a4.txt',
                    dataType: 'text'
                })
                .done(function (data) {
                    productData = JSON.parse(data);
                    // console.log(productData)
                    productJSON = x2js.xml_str2json(productData.XML);
                    if(typeof(productJSON.doc._assetpath) !== 'undefined'){
                        app.docAssetPath = productJSON.doc._assetpath;
                    }
                    console.log(productJSON)
                    productJSON = productJSON.doc.page;

                    // Set the products details
                    app.ucp.generateProductDetails(productJSON, productData.Dimensions);
                })
                .fail(function (data) {
                    alert('Loading product details failed. Please try again.')
                })
            } else{
                var pageUrl = window.location.search,
                    idRegex = /id=([0-9]+)/,
                    productId = pageUrl.match(idRegex);
                    console.log(productId[1]); 

                _$.ajax({
                    url: globalUrls.assetBaseUrl + '/be/api/BeMacmillanApi.asmx/GetItem?id=' + productId
                })
                .done(function (data) {                    
                    // NEED TO CREATE THE PRODUCT JSON:
                    app.ucp.generateProductDetails(productJSON, productData.Dimensions, productData.ProductName);
                })
                .fail(function (data) {                    
                    alert('Loading product details failed. Please try again.')
                })
            }
        },
        generateProductDetails: function(productJSON, productDimension, productName){
            var isSinglePage = typeof(productJSON.length) === 'undefined' ? true : false,
                pageWidth,
                pageHeight;

            // Check if a single page or multiple pages
            if(isSinglePage){
                pageWidth  = parseInt(productJSON._width)
                pageHeight = parseInt(productJSON._height)
            } else{
                // This creates each page at the same size
                pageWidth  = parseInt(productJSON[0]._width)
                pageHeight = parseInt(productJSON[0]._height)
            }

            // If the docDimensions is empty, then manually set it. The old templates do not have associated doc dimensions
            if(productDimension !== ''){
                app.docDimensions = productDimension.replace(' ', '').split(',');
                console.log()
            } else{
                app.docDimensions = app.utils.validateDocDimensions(pageWidth, pageHeight);
            }                

            // Set Product Name
            _$('#product-name').html(productName);

            // Create the relevant number of product page stages
            if(isSinglePage){
                app.ucp.createProductPageStages(0);
            } else{
                productJSON.forEach(function(pageJSON, i){
                    app.ucp.createProductPageStages(i);                     
                });
            }

            // Set the product stage size
            var patt = new RegExp('A[0-9]'),
                testASize;

            // Test for A-Something format doc size. If found remove the business card option.
            testASize = patt.test(app.docDimensions);

            console.log('DOCUMENT SIZES:' + pageWidth + ' ' + pageHeight)
            if(testASize){
                // Set the template type being used
                app.templateType = 'default';
                // Check the orientation of the document
                if(pageWidth > pageHeight){
                    // Set the class on the product stage
                    app._$productStage.find('.product-stage-container').addClass('a4-landscape-container');
                    // Set the Stage Size
                    app.productStageSize =  {
                                                width: 561,
                                                height: 396
                                            }
                } else{
                    // Set the class on the product stage
                    app._$productStage.find('.product-stage-container').addClass('a4-portrait-container');
                    // Set the Stage Size
                    app.productStageSize =  {
                                                width: 396,
                                                height: 561
                                            }
                }                
            } else{
                 // Set the template type being used
                app.templateType = 'business';
                // Set the class on the product stage
                app._$productStage.find('.product-stage-container').addClass('business-card-container');
                // Set the Stage Size
                app.productStageSize =  {
                                            width: 85,
                                            height: 55
                                        }
            }

            // Check if is a single page or multiple pages before creating HTML BLOCKS and PRODUCT STAGE
            if(isSinglePage){
                app.ucp.createProductHTMLBlocks(productJSON, false);
            } else{
                productJSON.forEach(function(pageJSON, i){
                    app.ucp.createProductHTMLBlocks(pageJSON, true);                     
                });
            }
        },
        createProductPageStages: function(counter){
            app._$productStage.append('<div class="product-stage-container" id="product-stage-' + counter + '"></div>');
        },
        createProductHTMLBlocks: function(pageData, multiplePage){

            // This needs to be set dynamically / A3
            app.canvasScale = 1.4142;

            var blockListingString = '',
                productCanvasString = '';

            if(multiplePage){
                app.pageCounter++;
                blockListingString+= '<div><hr><h2>Page:' + app.pageCounter +'</h2><hr></div>';
            }

            // Set the stage background if one has been set
            if(typeof(app.docAssetPath) !== 'undefined' && typeof(pageData.pdf._highresfilename) !== 'undefined'){
                app.ucp.createStageBackgroundFromPDF(app.docAssetPath, pageData.pdf._highresfilename);
            }

            // console.log(pageData)

            // Check for text-block groups
            if (typeof (pageData['text-block-group']) !== 'undefined') {
                // console.log(pageData['text-block-group'])
                if (typeof (pageData['text-block-group'].length) !== 'undefined') {
                    // Multiple text block groups
                    // console.log(pageData['text-block-group'])
                    pageData['text-block-group'].forEach(function(textBlockGroup){
                        // console.log(textBlock)
                        if(typeof(textBlockGroup['text-block'].length) !== 'undefined'){
                            textBlockGroup['text-block'].forEach(function(textBlock){
                                // console.log(textBlock)
                                textBlock['block'] = 'tb';
                                textBlock['scale'] = app.canvasScale;
                                blockListingString+= app.ucp.createTextBlockSettings(textBlock);
                            });
                        } else{
                            // console.log(textBlockGroup['text-block'])
                            pageData['text-block-group']['text-block']['block'] = 'tb';
                            textBlockGroup['text-block']['scale'] = app.canvasScale;
                            blockListingString+= app.ucp.createTextBlockSettings(textBlockGroup['text-block']);                            
                        } 
                        textBlockGroup['block'] = 'tbg';
                        textBlockGroup['scale'] = app.canvasScale;
                        app.ucp.createProductCanvasStage(textBlockGroup);                      
                    });                    
                } else {                    
                    // Only a single text block group
                    // console.log(pageData['text-block-group'])
                    if(typeof(pageData['text-block-group']['text-block'].length) !== 'undefined'){
                        pageData['text-block-group']['text-block'].forEach(function (textBlock) {
                            // console.log(textBlock)
                            textBlock['block'] = 'tbg';
                            textBlock['scale'] = app.canvasScale;
                            blockListingString+= app.ucp.createTextBlockSettings(textBlock);
                        });
                    } else{
                        // console.log(pageData['text-block-group']['text-block'])
                        pageData['text-block-group']['text-block']['block'] = 'tbg';
                        pageData['text-block-group']['text-block']['scale'] = app.canvasScale;
                        blockListingString+= app.ucp.createTextBlockSettings(pageData['text-block-group']['text-block']);
                    }
                    pageData['text-block-group']['block'] = 'tbg';
                    pageData['text-block-group']['scale'] = app.canvasScale;
                    app.ucp.createProductCanvasStage(pageData['text-block-group']);
                }
            }

            if (typeof (pageData['text-block']) !== 'undefined') {
                if (typeof (pageData['text-block'].length) === 'undefined') {
                    // Only a single text block
                    pageData['text-block']['block'] = 'tb';
                    pageData['text-block']['scale'] = app.canvasScale;
                    blockListingString+= app.ucp.createTextBlockSettings(pageData['text-block']);
                    app.ucp.createProductCanvasStage(pageData['text-block']);
                } else {
                    // Multiple text blocks
                    pageData['text-block'].forEach(function (textBlock) {
                        textBlock['block'] = 'tb';
                        textBlock['scale'] = app.canvasScale;
                        blockListingString+= app.ucp.createTextBlockSettings(textBlock);
                        app.ucp.createProductCanvasStage(textBlock);
                    });
                }
            }

            if (typeof (pageData['image']) !== 'undefined') {
                if (typeof (pageData['image'].length) === 'undefined') {
                    // Only a single image block
                    pageData['image']['block'] = 'ib';
                    pageData['image']['scale'] = app.canvasScale;
                    blockListingString+= app.ucp.createImageBlockSettings(pageData['image']);
                    app.ucp.createProductCanvasStage(pageData['image']);
                } else {
                    // Multiple image blocks
                    pageData['image'].forEach(function (imgBlock) {
                        imgBlock['block'] = 'ib';
                        imgBlock['scale'] = app.canvasScale;
                        blockListingString+= app.ucp.createImageBlockSettings(imgBlock);
                        app.ucp.createProductCanvasStage(imgBlock);
                    });
                }
            } 

            // Add the markup to the page 
            _$('#product-blocks-container').append(blockListingString);
        },
        createProductCanvasStage: function (data) {
            var blockSettings = app.utils.calcBlockCoords(data, app.productStageSize.width, app.productStageSize.height);
            // console.log(data)
            if (data.block === 'ib') {
                app.ucp.createProductStageImgBlock(blockSettings);
            } else if (data.block == 'tb') {
               app.ucp.createProductStageTextBlock(blockSettings);
            } else if (data.block === 'tbg') {
                // This check is required if a textblock group only has 1 text block inside it.
                blockSettings.textBlocks = [];
                if(typeof(data['text-block'].length) !== 'undfined'){
                    data['text-block'].forEach(function(textBlock, i){
                        blockSettings.textBlocks.push(app.utils.createInnerTextBlock(textBlock, blockSettings, i));
                    });                    
                } else{
                    blockSettings.textBlocks.push(app.utils.createInnerTextBlock(data['text-block'], blockSettings, 0));
                }
                app.ucp.createProductStageTextBlockFromGroup(blockSettings);
            } else{
                console.log('Unknown block type!')
            }

            // Close the loader
            app.ucp.loadAnimation(false);
        },
        createInnerTextBlock: function(block, blockSettings, i){
            // console.log(block);
            var innerBlockSettings = {};
            innerBlockSettings.blocktype = 'new-text-block';
            innerBlockSettings.blockTitle = typeof(block._title) !== 'undefined' ? block._title : '';
            innerBlockSettings.halign = blockSettings.halign;  // Take from the parent element
            innerBlockSettings.isEditable = typeof(block._editable) !== 'undefined' ? block._editable : 'false';
            innerBlockSettings.isManditory = typeof(block._mandatory) !== 'undefined' ? block._mandatory : 'false';
            innerBlockSettings.fontFamily = typeof(block['_font-family']) !== 'undefined' ? block['_font-family'] : 'FuturaBT-Book';
            innerBlockSettings.fontColor = app.utils.cmykToRGB(block._colour);
            innerBlockSettings.fontSize = typeof (block['_font-size']) !== 'undefined' ? block['_font-size'] : 12;
            innerBlockSettings.lineHeight = typeof (block._leading) !== 'undefined' ? block._leading.toString().replace('%', '') : '100';
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

            console.log(innerBlockSettings)

            return innerBlockSettings;
        },
        createStageBackgroundFromPDF:function(assetPath, assetName){
            var imgData,
                width  = app.productStageSize.width + 'px',
                height = app.productStageSize.height + 'px',
                pdfBackgroundString = '',
                widthStyle = 'width:' + width + ';',
                heightStyle = 'height:' + height + ';',
                zIndexStyle = 'z-index:' + app.zIndexCounter + ';',
                imgStyleString = widthStyle + heightStyle + zIndexStyle;

            // Need to call and API to convert a PDF to an image.
            // This can't be done server side due to browser support
            // _$.ajax({
            //     url: imgUrl
            // })
            // .done(function(data){
            //     console.log(data)
            // })
            // .fail(function(data){
            //     console.log(data)
            // })
            if(app.isLocalEnv){
                pdfBackgroundString+= '<img src="assets/pdfs/' + assetName.replace('.pdf', '.jpg') + '" class="pdf-background" style="' + imgStyleString + '" />';
            } else{
                pdfBackgroundString+= '<img src="' + assetName.replace('.pdf', '.jpg') + '" class="pdf-background" style="' + imgStyleString + '" />';
            }  

            var stageId = app.pageCounter > 0 ? (app.pageCounter-1).toString() : '0';
            console.log(pdfBackgroundString)
            _$('#product-stage-' + stageId).append(pdfBackgroundString);
            // Increment the zIndex counter
            app.zIndexCounter++;
        },


        // HTML TEMPLATES:
        createTextBlockSettings: function(textBlock){
            // console.log(textBlock)
            // TO DO: replace textvalue with an ajax request
            var textBlockString = '',
                textValue       = typeof(textBlock.__text) !== 'undefined' ? textBlock.__text : '',
                blockId         = textBlock._id.replace(/ /g, ''),
                maxlength       = typeof(textBlock._maxlen) !== 'undefined' ? textBlock._maxlen : app.defaultMaxCharLength,
                charsRemaning   = parseInt(maxlength) - textValue.length,
                isfromSrc       = typeof(textBlock._source) !== 'undefined' ? true : false,
                isNotEditable   = typeof(textBlock._editable) !== 'undefined' && textBlock._editable.toLowerCase() === 'false' ? true : false;

            // console.log(typeof(textBlock._editable) !== 'undefined', textBlock._editable.toLowerCase() === 'false')

            // If a block, is from a source (e.g. terms and conditions), then 
            // console.log(!isfromSrc, !isNotEditable)
            if(!isfromSrc && !isNotEditable){
                textBlockString+= '<li class="clearfix list-group-item">'; 
                    textBlockString+= '<h2 class="block-item-heading">' + textBlock._title + '</h2>';
                    textBlockString+= '<button type="button" class="btn btn-info pull-top-right" data-action="show-product-block" ';
                        textBlockString+= 'data-blockid="' + blockId + '">V</button>';
                    textBlockString+= '<div class="ucp-block-container hidden" data-blockid="' + blockId + '">';
                        textBlockString+= '<textarea id="textarea_' + blockId +'" class="form-control" data-blockid="' + blockId + '" ';
                            textBlockString+= 'data-action="update-text-block-control" maxlength="' + maxlength + '" >' + textValue +'</textarea>';
                        textBlockString+= '<p>Characters remaining: <span class="badge">' + charsRemaning +'</span></p>';
                        textBlockString+= '<hr><button type="button" class="btn btn-warning" data-action="close-product-block">Close</button>';
                    textBlockString+= '</div>';
                textBlockString+= '</li>'; 
            }
           
            return textBlockString;
        },
        createImageBlockSettings: function(imageBlock){
            // console.log(imageBlock, imageBlock._highresfilename)
            var imgBlockString = '',
                imgRef         = imageBlock._highresfilename,
                hasImgSet      = typeof(imgRef) !== 'undefined' && imgRef !== 'null' && imgRef === 'string' ? true : false,
                blockId        = imageBlock._id.replace(/ /g, ''),
                imgUrl;

            console.log(imgRef, hasImgSet)

            if (!app.isLocalEnv && typeof(app.isLocalEnv) !== 'undefined' && hasImgSet) {
                imgUrl = globalUrls.assetBaseUrl;
            } else{
                imgUrl = 'assets/img/demo.jpg';
            }

            if(!hasImgSet){
                // Temp variable
                app.userBlockAssets = ['assets/img/demo-1-800.jpg', 'assets/img/demo-2-800.jpg']
            } else{
                app.userBlockAssets = [];
            }



            imgBlockString+= '<li class="clearfix list-group-item">'; 
                imgBlockString+= '<h2 class="block-item-heading">' + imageBlock._title + '</h2>';
                imgBlockString+= '<button type="button" class="btn btn-info pull-top-right" data-action="show-product-block" ';
                    imgBlockString+=  'data-blockid="' + blockId + '">V</button>'; 
                imgBlockString+= '<div class="ucp-block-container hidden" data-blockid="' + blockId + '">';
                    if(hasImgSet){
                        imgBlockString+= '<div class="image-block-assets-container">';
                            imgBlockString+= '<a href="#" data-action="update-image-block-control" data-blockid="' + blockId + '" class="active-image-selection">';
                                imgBlockString+= '<img src="' + imgUrl + '" alt="' + imageBlock._title + '- Image Asset" class="">';
                            imgBlockString+= '</a>';
                            // HANDLE BLOCK ASSETS
                            if(typeof(app.userBlockAssets.length) !== 'undefined'){
                                var blockAssetsString = '';                        
                                app.userBlockAssets.forEach(function(asset){
                                    // Need to update path
                                    blockAssetsString+= '<a href="#" data-action="update-image-block-control" data-blockid="' + blockId + '">';
                                        blockAssetsString+= '<img src="'+ asset +'" alt="" class="" />';
                                    blockAssetsString+= '</a>'
                                });                        
                                console.log(app.userBlockAssets)
                                // Check if there are any assets.
                                    // If there are... then show the image.
                                    //
                                imgBlockString+= blockAssetsString;
                            }
                        imgBlockString+= '</div>';
                    } else{
                        // Add upload field?
                        imgBlockString+= '<div class="form-group">';
                            imgBlockString+= '<input type="file" class="form-control" data-action="user-upload-image" data-blockid="' + blockId + '" />';
                            imgBlockString+= '<a href="#" class="btn btn-danger remove-upload-btn" data-action="delete-uploaded-image" ';
                                imgBlockString+= 'data-blockid="' + blockId + '">Delete</a>';
                            imgBlockString+= '<img src="' + app.defaultImgBlockPath + '" data-blockid="' + blockId + '" alt="Uploaded Image" class="uploaded-image" />';
                        imgBlockString+= '</div>';
                    }

                    imgBlockString+= '<hr><button type="button" class="btn btn-warning" data-action="close-product-block">Close</button>';        
                imgBlockString+= '</div>';
            imgBlockString+= '</li>'; 

            return imgBlockString;
        },
        createProductStageImgBlock: function(blockSettings){
            console.log(blockSettings)
            var stageImgBlockString = '',
                valign,
                halign,
                maxImgWidth  = 'max-width:' + blockSettings.width + 'px;',
                maxImgHeight = 'max-height:' + blockSettings.height + 'px;',
                parentWidth  = 'width:' + blockSettings.width + 'px;',
                parentHeight = 'height:' + blockSettings.height + 'px;',
                parentTop    = 'top:' + blockSettings.top + 'px;',
                parentLeft   = 'left:' + blockSettings.left + 'px;',
                zIndex       =  'z-index:' + app.zIndexCounter + ';',
                parentStyleString = parentWidth + parentHeight + parentTop + parentLeft + zIndex,
                childStyleString;

            // Need to handle Center somehow with absolutely positioned elements
            if(blockSettings.halign === 'right'){
                halign = 'right: 0;'
            } else{
                halign = 'left: 0;';
            }

            if(blockSettings.valign === 'bottom'){
                valign = 'bottom: 0;'
            } else{
                valign = 'top: 0;';
            }

            var imgUrl;
            if (!app.isLocalEnv && typeof(app.isLocalEnv) !== 'undefined') {
                imgUrl = globalUrls.assetBaseUrl + '';
            } else{
                imgUrl = 'assets/img/demo.jpg';
            }

            childStyleString = maxImgWidth + maxImgHeight + valign + halign + zIndex
            
            // Add ARIA ROLES
            stageImgBlockString+= '<div class="image-block-container" style="' + parentStyleString + '">';
                stageImgBlockString+= '<div class="image-block-content-container" style="' + parentWidth + parentHeight +'">';
                    stageImgBlockString+= '<img src="' + imgUrl +'" alt="' + blockSettings.blockTitle + ' - Image" class="image-block-content" ';
                        stageImgBlockString+= 'data-action="activate-block-control" data-blockid="' + blockSettings.id + '" ';
                        stageImgBlockString+= 'style="' + childStyleString + '" />';
                stageImgBlockString+= '</div>';
            stageImgBlockString+= '</div>';

            var stageId = app.pageCounter > 0 ? (app.pageCounter-1).toString() : '0';
            _$('#product-stage-' + stageId).append(stageImgBlockString);

            // Increment the zIndex counter
            app.zIndexCounter++;
        },
        createProductStageTextBlock: function(blockSettings){
            console.log(blockSettings)
            var stageTextBlockString = '',
                stageCanvasScale = app.templateType === 'default' ? 2.0174 : 1,
                valign,
                halign,
                parentWidth,
                parentHeight,
                fontColor     = 'color:' + blockSettings.fontColor + ';',
                fontUnit      = Math.ceil(app.utils.convertPtToPx(parseInt(blockSettings.fontSize)) / app.canvasScale) / stageCanvasScale,
                fontSize      = 'font-size:' + fontUnit + 'px;',
                fontFamily    = 'font-family:' + blockSettings.fontFamily + ';',
                lineHeight    = 'line-height:' + parseInt(blockSettings.lineHeight) / 100 + ';',
                zIndex        =  'z-index:' + app.zIndexCounter + ';',
                styleString   = fontColor + fontSize + fontFamily + lineHeight + zIndex,
                isfromSrc     = typeof(blockSettings.stringSrc) !== 'undefined' ? true : false,
                isNotEditable = typeof(blockSettings.isEditable) !== 'undefined' && blockSettings.isEditable.toString().toLowerCase() === 'false' ? true : false,
                controlString = '';

            if(!isfromSrc && !isNotEditable){
                controlString = 'data-action="activate-block-control"';
            } else{
                controlString = 'data-action="inactive-block-control"';
            }

            if(blockSettings.halign === 'right'){
                halign = 'text-align: right;'
            } else if(blockSettings.halign === 'center'){
                halign = 'text-align: center;';
            } else{
                halign = 'text-align: left;';
            }

            if(blockSettings.valign === 'bottom'){
                valign = 'bottom: 0;'
            } else{
                valign = 'top: 0;';
            }

            // Add ARIA ROLES
            stageTextBlockString+= '<div class="text-block-container" ';
                stageTextBlockString+= 'style="width:' + blockSettings.width + 'px;height:' + blockSettings.height + 'px;top:' + blockSettings.top + 'px;left:' + blockSettings.left + 'px;">';
                stageTextBlockString+= '<div style="' + halign +'">';
                    stageTextBlockString+= '<p ' + controlString +' data-blockid="' + blockSettings.id + '" ';
                        stageTextBlockString+= 'class="text-block-content" style="' + styleString + valign + halign + '">' + blockSettings.textVal + '</p>';
                stageTextBlockString+= '</div>';
            stageTextBlockString+= '</div>';

            var stageId = app.pageCounter > 0 ? (app.pageCounter-1).toString() : '0';
            _$('#product-stage-' + stageId).append(stageTextBlockString);
            // Increment the zIndex counter
            app.zIndexCounter++;
        },
        createProductStageTextBlockFromGroup: function(blockSettings){
            // console.log(blockSettings);
            var stageTextBlockString  = '',
                innerTextBlocksString = '',
                valign,
                halign,
                parentWidth  = 'width:' + blockSettings.width + 'px;',
                parentHeight = 'height:' + blockSettings.height + 'px;',
                parentTop    = 'top:' + blockSettings.top + 'px;',
                parentLeft   = 'left:' + blockSettings.left + 'px;',
                zIndex       =  'z-index:' + app.zIndexCounter + ';',
                parentStyleString = parentWidth + parentHeight + parentTop + parentLeft + zIndex;

            // Set other parent container settings:
            if(blockSettings.halign === 'right'){
                halign = 'text-align: right;'
            } else if(blockSettings.halign === 'center'){
                halign = 'text-align: center;';
            } else{
                halign = 'text-align: left;';
            }

            if(blockSettings.valign === 'bottom'){
                valign = 'bottom: 0;'
            } else{
                valign = 'top: 0;';
            }

            // Create inner text block string
            // Check that there is more than 1 textblock in the textblock groups array
            if(typeof(blockSettings.textBlocks.length) !== 'undefined'){
                blockSettings.textBlocks.forEach(function(block){
                    innerTextBlocksString+= app.ucp.createProductStageInnerTextBlock(block, blockSettings.spacing);
                });
            } else{
                innerTextBlocksString+= app.ucp.createProductStageInnerTextBlock(blockSettings.textBlocks[0], blockSettings.spacing);
            }   

            // Combine the parent container string and the inner textblocks string
            // Add ARIA ROLES
            stageTextBlockString+= '<div class="text-block-container" style="' + parentStyleString +'">';
                stageTextBlockString+= innerTextBlocksString;
            stageTextBlockString+= '</div>';

           var stageId = app.pageCounter > 0 ? (app.pageCounter-1).toString() : '0';
            _$('#product-stage-' + stageId).append(stageTextBlockString);

            // Increment the zIndex counter
            app.zIndexCounter++;
        },
        createProductStageInnerTextBlock: function(block, spacing){
            // console.log(spacing)
            var innerTextBlockString = '',
                stageCanvasScale = app.templateType === 'default' ? 2.0174 : 1,
                display      = block.textVal.length ? 'display: block;' : 'display: none;',           
                spacingUnit  = Math.ceil(app.utils.convertMMtoPX(parseInt(spacing) / app.canvasScale) / stageCanvasScale),
                marginBottom = 'margin-bottom:' + spacingUnit + 'px;',
                fontColor    = 'color:' + block.fontColor + ';',
                fontUnit     = Math.ceil(app.utils.convertPtToPx(parseInt(block.fontSize) / app.canvasScale) / stageCanvasScale),
                fontSize     = 'font-size:' + fontUnit + 'px;',
                fontFamily   = 'font-family:' + block.fontFamily + ';',
                lineHeight   = 'line-height:' + parseInt(block.lineHeight) / 100 + ';',
                styleString  = display + marginBottom + fontColor + fontSize + fontFamily + lineHeight,                
                isfromSrc     = typeof(block._source) !== 'undefined' ? true : false,
                isNotEditable = typeof(block._editable) !== 'undefined' && block._editable.toLowerCase() === 'false' ? true : false,
                controlString = '';

            if(!isfromSrc && !isNotEditable){
                controlString = 'data-action="activate-block-control"';
            }
            // console.log(spacingUnit)

            innerTextBlockString+= '<p ' + controlString + ' data-blockid="' + block.id + '" ';
                innerTextBlockString+= 'class="text-block-content" style="' + styleString + '">' + block.textVal + '</p>';

            return innerTextBlockString;
        },

        /**
            UI MANIPULATIONS
        **/
        toggleBlockOutlines: function(){
            var _$this      = _$(this),
                activeClass = 'active-outlines';
            if(_$this.hasClass(activeClass)){
                app._$productStage.removeClass(activeClass)
                _$this.removeClass(activeClass);
            } else{
                app._$productStage.addClass(activeClass)
                _$this.addClass(activeClass);
            }
        },
        toggleProductBlock: function(blockId, openBlock){
            // console.log(blockId, openBlock)
            if(openBlock){
                _$('.ucp-block-container').addClass('hidden');                
                _$('.ucp-block-container[data-blockid='+ blockId +']').removeClass('hidden');
            } else{
                _$('.ucp-block-container').addClass('hidden'); 
            }
        },
        updateStageTextField: function(textVal, blockId){
            if(textVal.length > 0){
                _$('p[data-blockid=' + blockId + ']').text(textVal).show();
            } else{
                _$('p[data-blockid=' + blockId + ']').text(textVal).hide();
            }
        },
        updateStageImageBlock: function(){
            var _$this      = _$(this),                
                blockId     = _$this.data('blockid'),
                newImgSrc   = _$this.find('img').attr('src'),
                activeClass = 'active-image-selection';

            if(_$this.hasClass(activeClass)){
                alert('This image is already selected.')
            } else{
                // Update UI to show which image is selected
                _$this.siblings().removeClass(activeClass);
                _$this.addClass(activeClass)

                // Update the stage to show the new image selection
                _$('.image-block-content-container > img[data-blockid=' + blockId + ']').attr('src', newImgSrc);
            }            
        },
        previewUserImageUpload: function(e, _$el){
            // Check for the various File API support.
            if (window.File && window.FileReader && window.FileList && window.Blob) {
               var files = e.target.files; // FileList object

                // Loop through the FileList and render image files as thumbnails.
                for (var i = 0, f; f = files[i]; i++) {

                  // Only process image files.
                  if (!f.type.match('image.*')) {
                    continue;
                  } 

                  var reader = new FileReader();

                  // Closure to capture the file information.
                  reader.onload = (function(theFile) {
                    return function(e) {
                        var newImgSrc   = e.target.result,
                            blockId     = _$el.data('blockid'),
                            activeClass = 'show-element';
                        console.log(_$el, blockId)
                        // Hide the upload file field
                        _$el.hide();
                        // Show the remove button
                        _$('.remove-upload-btn[data-blockid=' + blockId + ']').attr('src', newImgSrc).addClass(activeClass);
                        // Show the preivew of the image 
                        _$('.uploaded-image[data-blockid=' + blockId + ']').attr('src', newImgSrc).addClass(activeClass);
                        // Update the stage to show the new image selection
                        _$('.image-block-content-container > img[data-blockid=' + blockId + ']').attr('src', newImgSrc).show();
                    };
                  })(f);

                  // Read in the image file as a data URL.
                  reader.readAsDataURL(f);
                }
            } else {
              alert('The File APIs are not fully supported in this browser. You will not be able to see a live preview of your image.');
            }
        },
        removeImageUploadFile: function(){
            var _$this        = _$(this),
                blockId       = _$this.data('blockid'),
                _$uploadField = _$('[data-action=user-upload-image][data-blockid=' + blockId + ']'),
                activeClass   = 'show-element';

            // Reset the form
            _$uploadField.wrap('<form></form>').parent().trigger('reset').children().unwrap('<form></form>');

            // Update the block on the stage and then hide
            _$('.image-block-content-container > img[data-blockid=' + blockId + ']').attr('src', app.defaultImgBlockPath).removeClass(activeClass);
            // Update the preview image with the default
            _$('.uploaded-image[data-blockid=' + blockId + ']').attr('src', app.defaultImgBlockPath).removeClass(activeClass);
            // Hide remove button
            _$this.removeClass(activeClass);
            // Show the upload field again
           _$uploadField.show();

        },
        

        /**
            DOM EVENT LISTENSERS
        **/
        bindUserCreateProductDomEvents: function(){
            app._$body.on('click', '[data-action=show-product-block]', function(){
                // Open block
                app.ucp.toggleProductBlock(_$(this).data('blockid'), true);
            });

            app._$body.on('click', '[data-action=close-product-block]', function(){
                // Close block
                app.ucp.toggleProductBlock(_$(this).data('blockid'), false);
            });

            app._$body.on('keyup', '[data-action=update-text-block-control]', function(){
                var _$this       = _$(this),
                    textVal      = _$this.val(),
                    maxLength    = _$this.attr('maxlength'),
                    _$targetel   = _$this.next().find('.badge'),
                    blockId      = _$this.data('blockid'),
                    isValidInput = app.utils.validateMaxLengthTextArea(textVal, maxLength, _$targetel);      

                // console.log(isValidInput, textVal.length)
                if(isValidInput){
                    app.ucp.updateStageTextField(textVal, blockId);
                } else{
                    alert('Max character limit reached.')
                }
            });

            app._$body.on('click', '[data-action=update-image-block-control]', app.ucp.updateStageImageBlock);

            app._$body.on('change', '[data-action=user-upload-image]', function(e){
                e.preventDefault();
                app.ucp.previewUserImageUpload(e, _$(this));
            });

            app._$body.on('click', '[data-action=delete-uploaded-image]', app.ucp.removeImageUploadFile);

            app._$body.on('click', '[data-action=activate-block-control]', function(){
                // Open block
                app.ucp.toggleProductBlock(_$(this).data('blockid'), true);
            });

            _$('[data-action=toggle-block-outlines]').on('click', app.ucp.toggleBlockOutlines);
        },

        
        loadAnimation: function(showAnimation){
            if(showAnimation){

            } else{

            }
        }
    };

    

    // Init a loader
    // Make an ajax request and the products    
        // Resolve loader on fail/success
    // Render the HTML blocks on the left
        // HANDLE PDF BACKGROUND IMAGES
        // All other images should have a loader
        // Show releated products on the right
        // Determine when an img upload should be used
            // Support image upload
                // Preview upload image (when supported)
    // Create a 'canvas-like-wrapper div'
        // Place items onto the canvas
            // Add 2-way binding between textblocks
            // Add the ability to click on an item and then interact with relevant block on the left.

    // On save
        // Replace all images with the full-res ones
        // Make the XML the correct size.

    // Save available document sizes
        // 

    if(_$('[data-template=user-create-product]').length > 0){
        app.ucp.init();   
    }    
});