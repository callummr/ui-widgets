(function(){
  'use strict';

  // $ dom elements
  // _ are canvas elements

  var _canvas = new fabric.Canvas('c', { selection: false, backgroundColor: '#FFF' }),
      _grid,
      gridSquare = 50;

  // Util functions
  function createFileName(extension){
    var filename = $('.canvas-name-field').val() || 'template-download';
    return filename + extension
  }
  function closeElementControls(){
    $('.add-element-control').fadeOut(300, function(){
      $addElControls.removeClass('toggle-active');
      $('#add-controls-container').fadeIn(300);
    }); 
  }
  function constrainGridMovement(e){
    // Snap to grid
    e.target.set({
      left: Math.round(e.target.left / gridSquare) * gridSquare,
      top: Math.round(e.target.top / gridSquare) * gridSquare
    });

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
  }
  function covertToMM(pixel){
    return parseInt( parseFloat(pixel * 0.2645833333333).toFixed(2) );
  }
  function pdfDocumentSize(documentName){
    switch(documentName) {
      case 'a0':
          return [841,1189]
          break;
      case 'a1':
          return [594, 841]
          break;
      case 'a2':
          return [420,594]
          break;
      case 'a3':
          return [420,594]
          break;
      case 'a4':
          return [210,297]
          break;
      case 'a5':
          return [148,210]
          break;
      case 'a6':
          return [105,148]
          break;
      case 'a7':
          return [74,105]
          break;
      case 'a8':
            return [52,74]
            break;
    }
  }
  function rgbToCMYK(rgb){

    var computedC = 0,
        computedM = 0,
        computedY = 0,
        computedK = 0,
        rgb       = rgb.replace(/rgb|\(|\)/gi, '').split(','),
        r = parseInt(rgb[0]),
        g = parseInt(rgb[1]),
        b = parseInt(rgb[2]);

    // BLACK
    if (r==0 && g==0 && b==0) {
      computedK = 1;
      return [0,0,0,1];
    }

    computedC = 1 - (r/255);
    computedM = 1 - (g/255);
    computedY = 1 - (b/255);

    var minCMY = Math.min(computedC, Math.min(computedM,computedY));

    computedC = (computedC - minCMY) / (1 - minCMY) ;
    computedM = (computedM - minCMY) / (1 - minCMY) ;
    computedY = (computedY - minCMY) / (1 - minCMY) ;
    computedK = minCMY;

    // return [computedC,computedM,computedY,computedK];
    return computedC + ',' + computedM + ',' + computedY + ',' + computedK;
  }

  // Canvas Controls and Events
  function drawGrid(gSize){
    var gridLines = [];
    for (var i = 0; i < 20; i++) {
      gridLines.push(new fabric.Line([ i * gridSquare, 0, i * gridSquare, gSize], { stroke: '#ccc'}));
      gridLines.push(new fabric.Line([ 0, i * gridSquare, gSize, i * gridSquare], { stroke: '#ccc'}));
    }
    _grid = new fabric.Group(gridLines, {
                left: 0,
                top: 0,
                selectable: false
              });
    _canvas.add(_grid);
  }
  function cleanCanvas(){
    _grid['visible'] = false;
    _canvas.deactivateAll().renderAll();
  }
  function toggleCanvasGrid(toggle){
    var $this = $(this);
    if( $this.hasClass('grid-disabled') ){
      $this.removeClass('grid-disabled');
      _grid['visible'] = true;
    }else{
      $this.addClass('grid-disabled');
      _grid['visible'] = false;
    }

    // Show the grid, after saving the image and generating PDF
    if(toggle === true){
      _grid['visible'] = true;
    }
    _canvas.renderAll();
  }
  function toggleEl(){
    var $this = $(this),
        targetElName = $this.attr('data-targetel');


    if(!$this.hasClass('toggle-active')){
      $addElControls.removeClass('toggle-active');
      $this.addClass('toggle-active');
      if($('.add-element-control:visible').length){
        $('.add-element-control:visible').fadeOut(300, function(){
          $('#add-controls-container').fadeOut(300, function(){
            $('#' + targetElName).fadeIn(300);
          });
        });
      }else{
        $('#add-controls-container').fadeOut(300, function(){
          $('#' + targetElName).fadeIn(300);
        });
      }
    }
  }
  function deactiveCanvasControls(e){
    if(!$(e.target).hasClass('upper-canvas')){
      _canvas.deactivateAll().renderAll();
    }
  }
  function setSelectedOption (){
    var $this = $(this);
    $this.siblings().removeClass('option-selected').end()
         .addClass('option-selected');
  }
  
  // Functions needed to prepare template for export
  function generateJSON(){
    var canvasData = _canvas.toDatalessJSON();
    // Remove the grid element group from data
    canvasData.objects.shift();
    return canvasData.objects
  }
  function generateCords(canvasData){
    // All based of fixed values of 1:3 of canvas_size:print_size(A4)
    var canvasScale   = 3, // Create function to make this dyanmic based on canvas/document size ratio
        cordData      = [],
        baseObj       = {},
        destDocWidth  = pdfDocumentSize($('input[name=doc-size]:checked').val())[0], // Size of target document WIDTH in MM
        destDocHeight = pdfDocumentSize($('input[name=doc-size]:checked').val())[1]; // Size of target document HEIGHT in MM

    console.log( destDocWidth, destDocHeight );

    // Create collection of objects for the XML file
    canvasData.forEach(function(el, i) {
      console.log(el);
      var elDimensions = [
                          covertToMM(el.width),  
                          covertToMM(el.height),
                          covertToMM(el.top),
                          covertToMM(el.left),
                          destDocWidth,
                          destDocHeight
                        ];

      if(el.type === 'i-text'){        
        var textBlockName = 'text-block_' + i;
        baseObj[textBlockName] = {
                              '_align': el.textAlign,
                              '_colour': rgbToCMYK(el.fill),
                              '_editable': 'True', // Need to add to initial form
                              '_fitmethod': 'auto',
                              '_font-family': el.fontFamily,
                              '_font-size': calcFontSize(el.fontSize),
                              '_height': elDimensions[1],
                              '_id': '', // Need to add to initial form
                              '_leading': '125%', // Need to add to initial form,
                              '_lowerleftx': calcLowerLeftX(elDimensions),
                              '_lowerlefty': calcLowerLeftY(elDimensions),
                              '_mandatory': 'False', // Need to add to initial form
                              '_maxlen': '100', // Need to add to initial form
                              '_orientate': 'north',
                              '_source': '', // Need to add to initial form
                              '_textmode': 'multiline', // Need to add to initial form
                              '_title': '', // Need to add to initial form
                              '_upperrightx': calcUpperRightX(elDimensions),
                              '_upperrighty': calcUpperRightY(elDimensions),
                              '_width': elDimensions[0],
                              '_verticalalign': 'top',                        
                              '__text': el.text
                            };
        cordData.push(baseObj);
      }else{
        var imgBlockName = 'image_' + i;
        baseObj[imgBlockName] = {
                                  '_lowresfilename': el.src,
                                  '_highresfilename': el.src,
                                  '_align': setDefaultVal(el.alignX, 'none', 'left'),      // Need to add option for this
                                  '_verticalalign': setDefaultVal(el.alignY, 'none', 'top'),  // Need to add option for this
                                  '_id': '',
                                  '_mandatory': 'False',
                                  '_editable': 'False',
                                  '_title': '',
                                  '_lowerleftx': calcLowerLeftX(elDimensions),
                                  '_lowerlefty': calcLowerLeftY(elDimensions),
                                  '_upperrightx': calcUpperRightX(elDimensions),
                                  '_upperrighty': calcUpperRightY(elDimensions),
                                  '_fitmethod': 'auto',
                                  '_orientate': 'north',
                                  '_width': elDimensions[0],
                                  '_height': elDimensions[1] 
                                };
        cordData.push(baseObj);
      }
    });
    var x2js    = new X2JS(),
        xmlBase = {
                    doc : {               
                      page : {
                        _width: destDocWidth,
                        _height: destDocHeight,
                        pdf: {
                          _lowresfilename: "",
                          _highresfilename: "",
                          _align: "left",
                          _verticalalign: "top",
                          _id: "bglayer",
                          _mandatory: "False",
                          _editable: "False",
                          _title: "Background",
                          _lowerleftx: "0",
                          _lowerlefty: "0",
                          _upperrightx: destDocWidth,
                          _upperrighty: destDocHeight,
                          _width: destDocWidth,
                          _height: destDocHeight,
                          _fitmethod: "auto",
                          _orientate: "north"
                        }
                      }
                    }
                  };
    // Add all of the dynamic elements to template   
    cordData.forEach(function(el){
      $.extend( xmlBase.doc.page, el );
    });
    console.log(xmlBase);
    // Remove the end prefix from key names
    var xmlOutput = x2js.json2xml_str(xmlBase);
    // Need to update the object names so they dont contain the _[number] prefix so the XML is correct
    xmlOutput = xmlOutput.replace(/text-block_[0-9]/g, 'text-block');
    xmlOutput = xmlOutput.replace(/image_[0-9]/g, 'image');
    console.log(xmlOutput);

      // each image needs:
      // 'lowresfilename': '',
      // 'highresfilename': '',
      // 'align': '',
      // 'verticalalign': 'top',
      // 'id': '',
      // 'mandatory': ''
      // 'editable': ''
      // 'lowerleftx': 123,
      // 'lowerlefty': 22,
      // 'upperrightx': 17,
      // 'upperrighty': 60,
      // 'width': 51,
      // 'height': 50,
      // 'fitmethod': 'auto',
      // 'orientate': 'north'

      // Get the lowerleftx
      // Get the lowerlefty
      // Get the upperrightx
      // Get the upperrighty
    //
  }
  function generateXML(cordData){
    var x2js = new X2JS();
    console.log(cordData);
    console.log( x2js.json2xml_str($.parseJSON(cordData)) );
  }
  function calcFontSize(fontSize){
    // To do
    return fontSize
  }
  function setDefaultVal(val, expression, defaultVal){
    if(val === expression){
      return defaultVal
    }else{
      return val
    }
  }

  // elWidth[0], elHeight[1], top[2], left[3], docWidth[4], docHeight[5]
  function calcLowerLeftX(elDimensions){
    // left
    console.log(elDimensions[3]);
    return elDimensions[3]
  }
  function calcLowerLeftY(elDimensions){
    // docHeight - (top + height)
    console.log( elDimensions[5] - (elDimensions[2] + elDimensions[1]) );
    return elDimensions[5] -(elDimensions[2] + elDimensions[1])
  }
  function calcUpperRightX(elDimensions){
    // left + width
    console.log(elDimensions[2] + elDimensions[0]);
    return elDimensions[2] + elDimensions[0]
  }
  function calcUpperRightY(elDimensions){
    // docHeight - (left + width) 
    console.log(elDimensions[5] - (elDimensions[3] + elDimensions[0]));
    return elDimensions[5] - (elDimensions[2] + elDimensions[0])
  }    

  // Click elements
  var $saveThumb        = $('#save-thumb'),
      $downloadThumb    = $('#dl-thumb'),
      $downloadPDF      = $('#dl-pdf'),
      $toggleGrid       = $('#toggle-grid'),
      $closeBtns        = $('.close-control'),
      $addElControls    = $('.add-el-control'),
      $addTextArea      = $('#add-text-area'),
      $textComponentOpt = $('.text-editor-option button');

  // Bind event listeners to dom elements
    $saveThumb.on('click', convertCanvasToImgElement);
    $downloadThumb.on('click', covertCanvasToImgDownload);
    $downloadPDF.on('click', covertCanvasToPDFDownload);
    $toggleGrid.on('click', toggleCanvasGrid);
    $closeBtns.on('click', closeElementControls);
    $addElControls.on('click', toggleEl);
    $addTextArea.on('click', createTextArea);
    $('body').on('click', deactiveCanvasControls);
    $textComponentOpt.on('click', setSelectedOption);


  // Creation tool end points
  function convertCanvasToImgElement() {
    // Remove selected states and grid before saving img
    cleanCanvas();
    var imgElement = ReImg.fromCanvas(document.querySelector('#c')).toImg(),
    $output = $('#i');
    $output.html('').append(imgElement);
    toggleCanvasGrid(true);
    generateCords(generateJSON());
  }
  function covertCanvasToImgDownload(){
    // Remove selected states and grid before saving img
    cleanCanvas();
    var dt = _canvas.toDataURL('image/png');
    this.href = dt;
    toggleCanvasGrid(true);
  }
  function covertCanvasToPDFDownload(){
    // Remove selected states and grid before saving img
    cleanCanvas();

    var requiredPrintSize = pdfDocumentSize($('input[name=doc-size]:checked').val())

    // Get the canvas dimensions
    // var canvasDimensions = [_canvas.getWidth(), _canvas.getHeight()];
    // Find out how big that is in mm

    // Then make the canvas relative to the size 

    // only jpeg is supported by jsPDF
    var imgData = $('#c')[0].toDataURL('image/jpeg',  1.0),
        pdf     = new jsPDF($('input[name=doc-orientation]:checked').val(), 'mm', requiredPrintSize);

    pdf.addImage(imgData, 'JPEG', 0, 0);
    pdf.save(createFileName('.pdf'));
    toggleCanvasGrid(true);
  }
  function createTextArea(){ 
    var textString = $('#at-text-body').val(),
      _textComponent;

    if(textString.length && textString !== null){
      // Disable the add button after it has been added.
      // $(this).attr('disabled', 'disabled');
      _textComponent = new fabric.IText( textString, {
        left: 100,
        top: 100,
        lockRotation: true,
        hasRotatingPoint: false,
        hasBorders: true,
        isEditing : true,
        editable: true,
        editingBorderColor: 'rga(0,255,0)',
        hasControls: false,
        fill: 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')',
        // fontFamily: '',
        fontSize: $('#at-font-size .option-selected').attr('data-size'),
        lineHeight: 1.4,
        // fontStyle: '',
        // fontWeight: '',
        textAlign: $('#at-alignment .option-selected').attr('data-align')
        // textDecoration: '',
        // exitEditing: ''// Bind to the textarea
      });
      // Add further text settings
      _canvas.add(_textComponent);
    }
  }

  // Draw the grid
  drawGrid(600);

  // var _el1 = new fabric.IText( 'textString', {
  //       left: 100,
  //       top: 100,
  //       lockRotation: true,
  //       hasRotatingPoint: false,
  //       hasBorders: true,
  //       isEditing : true,
  //       editable: true,
  //       editingBorderColor: 'rga(0,255,0)',
  //       hasControls: false,
  //       fill: 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')',
  //       // fontFamily: '',
  //       fontSize: $('#at-font-size .option-selected').attr('data-size'),
  //       lineHeight: 1.4,
  //       // fontStyle: '',
  //       // fontWeight: '',
  //       textAlign: $('#at-alignment .option-selected').attr('data-align')
  //       // textDecoration: '',
  //       // exitEditing: ''// Bind to the textarea
  //     });

  // var _el2 = new fabric.IText( 'text String 2', {
  //       left: 250,
  //       top: 250,
  //       lockRotation: true,
  //       hasRotatingPoint: false,
  //       hasBorders: true,
  //       isEditing : true,
  //       editable: true,
  //       editingBorderColor: 'rga(255,255,0)',
  //       hasControls: false,
  //       fill: 'rgb(' + $('#at-font-color .option-selected').attr('data-rgb') + ')',
  //       // fontFamily: '',
  //       fontSize: $('#at-font-size .option-selected').attr('data-size'),
  //       lineHeight: 1.4,
  //       // fontStyle: '',
  //       // fontWeight: '',
  //       textAlign: $('#at-alignment .option-selected').attr('data-align')
  //       // textDecoration: '',
  //       // exitEditing: ''// Bind to the textarea
  //     });

  // // Add elements to the canvas
  // _canvas.add(_el1, _el2);

  fabric.Image.fromURL('assets/img/demo.jpg', function(oImg) {
    _canvas.add(oImg);
  }); 

  // Canvas Events
  _canvas.on('object:moving', function(e) {
    constrainGridMovement(e);
  });

  _canvas.on('object:modified', function(e) {
    constrainGridMovement(e);
  });
})();