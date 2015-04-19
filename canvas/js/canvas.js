"use strict";
function CanvasState(canvas) {
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');

  // save padding/border info for getMouse()
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null).paddingLeft, 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null).paddingTop, 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null).borderLeftWidth, 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null).borderTopWidth, 10)   || 0;
  }

  // Save html offset info for getMouse() (if fixed-position bars are present)
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  this.req_redraw = false; // when set to true, the canvas will redraw everything
  this.shapes = [];  // the collection of things to be drawn
  this.dragging = false; // Keep track of when we are dragging
  this.resizeDragging = false; // Keep track of resize
  this.expectResize = -1; // save the # of the selection handle
  // next Shape attributes
  this.next_width = 20;
  this.next_height = 20;
  this.next_color = 'lightskyblue';
  // the current selected object.
  this.selection = null;
  this.selection_index = -1;
  this.dragoffx = 0;
  this.dragoffy = 0;

  // New, holds the 8 tiny boxes that will be our selection handles
  // the selection handles will be in this order:
  // 0  1  2
  // 3     4
  // 5  6  7

  this.selectionHandles = [];
  for (var i = 0; i < 8; i += 1) {
    this.selectionHandles.push(new Shape());
  }

  var state = this;
  
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(evt) { evt.preventDefault(); return false; }, false);

  canvas.addEventListener('mousedown', function(evt) {
    if (state.expectResize !== -1) {
      state.resizeDragging = true;
      return;
    }
    var mouse = state.getMouse(evt);
    var mx = mouse.x;
    var my = mouse.y;
    var shapes = state.shapes;
    var l = shapes.length;
    for (var i = l-1; i >= 0; i--) {
      if (shapes[i].contains(mx, my)) {
        var mySel = shapes[i];
        // Keep track of where in the object we clicked
        state.dragoffx = mx - mySel.x;
        state.dragoffy = my - mySel.y;
        state.dragging = true;
        state.selection = mySel;
        state.selection_index = i;
        state.req_redraw = true;
        return;
      }
    }

    state.deselect();  // nothing selected
  }, true);

  canvas.addEventListener('mousemove', function(evt) {
    if (state.dragging){
      var mouse = state.getMouse(evt);
      state.selection.x = mouse.x - state.dragoffx;
      state.selection.y = mouse.y - state.dragoffy;
      state.req_redraw = true;
    } else if (state.resizeDragging) {
      var mouse = state.getMouse(evt);

      var oldx = state.selection.x;
      var oldy = state.selection.y;
      // 0  1  2
      // 3     4
      // 5  6  7
      switch (state.expectResize) {
        case 0:
          state.selection.x = mouse.x;
          state.selection.y = mouse.y;
          state.selection.w += oldx - mouse.x;
          state.selection.h += oldy - mouse.y;
          break;
        case 1:
          state.selection.y = mouse.y;
          state.selection.h += oldy - mouse.y;
          break;
        case 2:
          state.selection.y = mouse.y;
          state.selection.w = mouse.x - oldx;
          state.selection.h += oldy - mouse.y;
          break;
        case 3:
          state.selection.x = mouse.x;
          state.selection.w += oldx - mouse.x;
          break;
        case 4:
          state.selection.w = mouse.x - oldx;
          break;
        case 5:
          state.selection.x = mouse.x;
          state.selection.w += oldx - mouse.x;
          state.selection.h = mouse.y - oldy;
          break;
        case 6:
          state.selection.h = mouse.y - oldy;
          break;
        case 7:
          state.selection.w = mouse.x - oldx;
          state.selection.h = mouse.y - oldy;
          break;
      }
      state.req_redraw = true;
    } else if (state.selection !== null) {
      var mouse = state.getMouse(evt);
      for (var i = 0; i < 8; i++) {
        // 0  1  2
        // 3     4
        // 5  6  7
        var cur = state.selectionHandles[i];

        if (mouse.x >= cur.x && mouse.x <= cur.x + state.selectionBoxSize &&
            mouse.y >= cur.y && mouse.y <= cur.y + state.selectionBoxSize) {
          // cursor hovering over a handle
          state.expectResize = i;

          switch (i) {
            case 0:
              this.style.cursor = 'nw-resize';
              break;
            case 1:
              this.style.cursor = 'n-resize';
              break;
            case 2:
              this.style.cursor = 'ne-resize';
              break;
            case 3:
              this.style.cursor = 'w-resize';
              break;
            case 4:
              this.style.cursor = 'e-resize';
              break;
            case 5:
              this.style.cursor = 'sw-resize';
              break;
            case 6:
              this.style.cursor = 's-resize';
              break;
            case 7:
              this.style.cursor = 'se-resize';
              break;
          }
          return;
        }
      }
      // not over a selection box, return to normal
      state.expectResize = -1;
      this.style.cursor = 'auto';
    }
  }, true);

  canvas.addEventListener('mouseup', function(evt) {
    state.dragging = false;
    state.resizeDragging = false;
    state.expectResize = -1;
    if (state.selection !== null) {
      if (state.selection.w < 0) {
          state.selection.w = -state.selection.w;
          state.selection.x -= state.selection.w;
      }
      if (state.selection.h < 0) {
          state.selection.h = -state.selection.h;
          state.selection.y -= state.selection.h;
      }
    }
  }, true);

  // double click for making new Shapes
  canvas.addEventListener('dblclick', function(evt) {
    var mouse = state.getMouse(evt);

    // check if we dblclick on existing shape
    if (state.selection && state.selection.contains(mouse.x, mouse.y)) {
      state.removeShape();
      return;
    }

    // dblclick on empty space creates new shape
    this.style.cursor = 'auto';
    state.addShape(
      new Shape(mouse.x - state.next_width/2, mouse.y - state.next_height/2,
                state.next_width, state.next_height, state.next_color)
      );
  }, true);

  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;  
  this.interval = 30;
  this.selectionBoxColor = 'darkred';
  this.selectionBoxSize = 6;
  this.z_index_font = "16px helvetica";
  this.z_index_color = "green"
  setInterval(function() { state.draw(); }, state.interval);
};


CanvasState.prototype.hotkeys = function(evt) {
  var key = evt.key.toLowerCase();
  var ctrl = evt.ctrlKey;

  if (ctrl && key == 'x') {
    if (this.selection)
      this.removeShape();
  } else if (key == 'delete') {
    if (this.selection)
      this.removeShape();
  } else if (key == 'escape') {
    this.deselect();
  } else if (key == '-') {
    if (this.selection && this.selection_index > 0) {
      var tmp = this.shapes[this.selection_index];
      this.shapes[this.selection_index] = this.shapes[this.selection_index-1];
      this.shapes[this.selection_index-1] = tmp;
      this.selection_index--;
      this.req_redraw = true;
    }
  } else if (key == '+') {
    if (this.selection && this.selection_index < this.shapes.length-1) {
      var tmp = this.shapes[this.selection_index];
      this.shapes[this.selection_index] = this.shapes[this.selection_index+1];
      this.shapes[this.selection_index+1] = tmp;
      this.selection_index++;
      this.req_redraw = true;
    }
  }
};

CanvasState.prototype.addShape = function(shape) {
  this.shapes.push(shape);
  this.req_redraw = true;
};


CanvasState.prototype.removeShape = function() {
  for (var i = this.shapes.length-1; i >= 0 ; i--) {
    if (this.shapes[i] == this.selection) {
      this.shapes.splice(i, 1);
      this.deselect();
      this.req_redraw = true;
      this.canvas.style.cursor = 'auto'; // in case cursor was over a handle
      return;
    }
  }
  console.log("warning: couldn't remove shape...");
};


CanvasState.prototype.deselect = function() {
  if (this.selection) {
    this.canvas.style.cursor = 'auto'; // in case alt-tab away or "escape"
    this.selection = null;
    this.selection_index = -1;
    this.req_redraw = true; // Need to clear the old selection border
  }
}


CanvasState.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
};


CanvasState.prototype.draw = function() {
  if (this.req_redraw) {
    // console.log('redrawing');
    var ctx = this.ctx;
    var shapes = this.shapes;
    this.clear();
    
    // draw all shapes
    var l = shapes.length;
    for (var i = 0; i < l; i++) {
      var shape = shapes[i];
      // We can skip the drawing of elements that have moved off the screen:
      if (shape.x <= this.width && shape.y <= this.height &&
          shape.x + shape.w >= 0 && shape.y + shape.h >= 0)
        shapes[i].draw(this);
    }
    
    // draw selection
    if (this.selection !== null) {
      ctx.strokeStyle = this.selectionColor;
      ctx.lineWidth = this.selectionWidth;
      var mySel = this.selection;
      ctx.strokeRect(mySel.x, mySel.y, mySel.w, mySel.h);
      // indicate z-axis
      ctx.font = this.z_index_font;
      ctx.fillStyle = this.z_index_color;
      var text = "z-index: " + (this.selection_index + 1) + "/" + this.shapes.length;
      ctx.fillText(text, canvas.width - 10 - ctx.measureText(text).width, 25);

      // draw handles
      ctx.fillStyle = this.selectionBoxColor;
      for (var i = 0; i < 8; i += 1) {
        var cur = this.selectionHandles[i];
        ctx.fillRect(cur.x, cur.y, this.selectionBoxSize, this.selectionBoxSize);
      }
    }
    
    this.req_redraw = false;
  }
};



CanvasState.prototype.getMouse = function(evt) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  
  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the html offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = evt.pageX - offsetX;
  my = evt.pageY - offsetY;
  
  return {x: mx, y: my};
};
