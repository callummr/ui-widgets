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
  function drawGrid(gSize){
    var gridLines = [];
    for (var i = 0; i < (gSize / gridSquare); i++) {
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
  function toggleCanvasGrid(){
    var $this = $(this);
    if( $this.hasClass('grid-disabled') ){
      $this.removeClass('grid-disabled');
      _grid['visible'] = true;
    }else{
      $this.addClass('grid-disabled');
      _grid['visible'] = false;
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

  // Click elements
  var $saveThumb      = $('#save-thumb'),
      $downloadThumb  = $('#dl-thumb'),
      $downloadPDF    = $('#dl-pdf'),
      $toggleGrid     = $('#toggle-grid'),
      $closeBtns      = $('.close-control'),
      $addElControls  = $('.add-el-control'),
      $addTextArea    = $('#add-text-area');

  // Bind event listeners to dom elements
  $saveThumb.on('click', convertCanvasToImgElement);
  $downloadThumb.on('click', covertCanvasToImgDownload);
  $downloadPDF.on('click', covertCanvasToPDFDownload);
  $toggleGrid.on('click', toggleCanvasGrid);
  $closeBtns.on('click', closeElementControls);
  $addElControls.on('click', toggleEl);
  $addTextArea.on('click', createTextArea);

  // Creation tool end points
  function convertCanvasToImgElement() {
    // Remove selected states and grid before saving img
    cleanCanvas();
    var imgElement = ReImg.fromCanvas(document.querySelector('#c')).toImg(),
    $output = $('#i');
    $output.html('').append(imgElement);
  }
  function covertCanvasToImgDownload(){
    // Remove selected states and grid before saving img
    cleanCanvas();
    var dt = _canvas.toDataURL('image/png');
    this.href = dt;
  }
  function covertCanvasToPDFDownload(){
    // Remove selected states and grid before saving img
    cleanCanvas();
    // only jpeg is supported by jsPDF
    var imgData = document.getElementById('c').toDataURL('image/jpeg', 1.0),
    pdf = new jsPDF();
    pdf.addImage(imgData, 'JPEG', 0, 0);
    pdf.save(createFileName('.pdf'));
  }


  // create grid
  drawGrid(600);

  // add objects
  // _canvas.add(new fabric.Rect({ 
  //   left: 100, 
  //   top: 100, 
  //   width: 50, 
  //   height: 50, 
  //   fill: '#faa', 
  //   originX: 'left', 
  //   originY: 'top',
  //   lockRotation: true,
  //   hasRotatingPoint: false,
  //   hasBorders: false
  // }));

  // _canvas.add(new fabric.Circle({ 
  //   left: 300, 
  //   top: 300, 
  //   radius: 50, 
  //   fill: '#9f9', 
  //   originX: 'left', 
  //   originY: 'top',
  //   lockRotation: true,
  //   hasRotatingPoint: false,
  //   hasBorders: false
  // }));


  function createTextArea(){
    var textString = $('#at-text-body').val(),
      _textComponent = new fabric.Text( textString, {
      left: 100,
      top: 100,
      lockRotation: true,
      hasRotatingPoint: false,
      hasBorders: false,
      hasControls: false
    });

    // Add further text settings
    _canvas.add(_textComponent);
  }

  // Canvas Events
  _canvas.on('object:moving', function(e) {
    constrainGridMovement(e);
  });

  _canvas.on('object:modified', function(e) {
    constrainGridMovement(e);
  });

})();