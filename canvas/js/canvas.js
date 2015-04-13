"use strict";
function CanvasState(canvas) {
  // **** First some setup! ****
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');

  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null).paddingLeft, 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null).paddingTop, 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null).borderLeftWidth, 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null).borderTopWidth, 10)   || 0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****
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
  // In the future we could turn this into an array for multiple selection
  this.selection = null;
  this.selection_index = -1;
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
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
  // **** Then events! ****

  // This is an example of a closure!
  // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
  // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
  // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
  // This is our reference!
  var myState = this;
  
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  // Up, down, and move are for dragging
  canvas.addEventListener('mousedown', function(e) {
    if (myState.expectResize !== -1) {
      myState.resizeDragging = true;
      return;
    }
    var mouse = myState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var shapes = myState.shapes;
    var l = shapes.length;
    for (var i = l-1; i >= 0; i--) {
      if (shapes[i].contains(mx, my)) {
        var mySel = shapes[i];
        // Keep track of where in the object we clicked
        // so we can move it smoothly (see mousemove)
        myState.dragoffx = mx - mySel.x;
        myState.dragoffy = my - mySel.y;
        myState.dragging = true;
        myState.selection = mySel;
        myState.selection_index = i;
        myState.req_redraw = true;
        return;
      }
    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    myState.deselect();
  }, true);

  canvas.addEventListener('mousemove', function(e) {
    if (myState.dragging){
      var mouse = myState.getMouse(e);
      // We don't want to drag the object by its top-left corner,
      // we want to drag from where we clicked.
      // Thats why we saved the offset and use it here
      myState.selection.x = mouse.x - myState.dragoffx;
      myState.selection.y = mouse.y - myState.dragoffy;   
      myState.req_redraw = true; // Something's dragging so we must redraw
    } else if (myState.resizeDragging) {
      var mouse = myState.getMouse(e);
      // time to resize!
      var oldx = myState.selection.x;
      var oldy = myState.selection.y;
      // 0  1  2
      // 3     4
      // 5  6  7
      switch (myState.expectResize) {
        case 0:
          myState.selection.x = mouse.x;
          myState.selection.y = mouse.y;
          myState.selection.w += oldx - mouse.x;
          myState.selection.h += oldy - mouse.y;
          break;
        case 1:
          myState.selection.y = mouse.y;
          myState.selection.h += oldy - mouse.y;
          break;
        case 2:
          myState.selection.y = mouse.y;
          myState.selection.w = mouse.x - oldx;
          myState.selection.h += oldy - mouse.y;
          break;
        case 3:
          myState.selection.x = mouse.x;
          myState.selection.w += oldx - mouse.x;
          break;
        case 4:
          myState.selection.w = mouse.x - oldx;
          break;
        case 5:
          myState.selection.x = mouse.x;
          myState.selection.w += oldx - mouse.x;
          myState.selection.h = mouse.y - oldy;
          break;
        case 6:
          myState.selection.h = mouse.y - oldy;
          break;
        case 7:
          myState.selection.w = mouse.x - oldx;
          myState.selection.h = mouse.y - oldy;
          break;
      }
      myState.req_redraw = true;
    } else if (myState.selection !== null) {
      var mouse = myState.getMouse(e);
      for (var i = 0; i < 8; i++) {
        // 0  1  2
        // 3     4
        // 5  6  7
        var cur = myState.selectionHandles[i];

        if (mouse.x >= cur.x && mouse.x <= cur.x + myState.selectionBoxSize &&
            mouse.y >= cur.y && mouse.y <= cur.y + myState.selectionBoxSize) {
          // cursor hovering over a handle
          myState.expectResize = i;

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
      myState.expectResize = -1;
      this.style.cursor = 'auto';
    }
  }, true);

  canvas.addEventListener('mouseup', function(e) {
    myState.dragging = false;
    myState.resizeDragging = false;
    myState.expectResize = -1;
    if (myState.selection !== null) {
      if (myState.selection.w < 0) {
          myState.selection.w = -myState.selection.w;
          myState.selection.x -= myState.selection.w;
      }
      if (myState.selection.h < 0) {
          myState.selection.h = -myState.selection.h;
          myState.selection.y -= myState.selection.h;
      }
    }
  }, true);

  // double click for making new Shapes
  canvas.addEventListener('dblclick', function(e) {
    var mouse = myState.getMouse(e);

    // check if we dblclick on existing shape
    if (myState.selection && myState.selection.contains(mouse.x, mouse.y)) {
      myState.removeShape();
      return;
    }

    // dblclick on empty space creates new shape
    this.style.cursor = 'auto';
    myState.addShape(
      new Shape(mouse.x - myState.next_width/2, mouse.y - myState.next_height/2,
                myState.next_width, myState.next_height, myState.next_color)
      );
  }, true);

  // **** Options! ****
  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;  
  this.interval = 30;
  this.selectionBoxColor = 'darkred';
  this.selectionBoxSize = 6;
  this.z_index_font = "16px helvetica";
  this.z_index_color = "green"
  setInterval(function() { myState.draw(); }, myState.interval);
};


// called manually/explicitely, so "this" has the correct reference
// otherwise it refers to the canvas element
// which forces us to set e.g. canvas.state = s (in main.js)
// then use this.state.selection etc in this function
CanvasState.prototype.hotkeys = function(event) {
  var key = event.key;
  var ctrl = event.ctrlKey;

  if (ctrl && key == 'x') {
    if (this.selection)
      this.removeShape();
    // console.log('cut')
  } else if (key == 'Delete') {
    if (this.selection)
      this.removeShape();
  } else if (key == 'Escape') {
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


// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function() {
  // if our state is invalid, redraw and validate!
  if (this.req_redraw) {
    // console.log('redrawing');
    var ctx = this.ctx;
    var shapes = this.shapes;
    this.clear();
    
    // ** Add stuff you want drawn in the background all the time here **
    
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
    // right now this is just a stroke along the edge of the selected Shape
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
    
    // ** Add stuff you want drawn on top all the time here **
    this.req_redraw = false;
  }
};



// Creates an object with x and y defined,
// set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky,
// we have to worry about padding and borders
CanvasState.prototype.getMouse = function(e) {
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

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;
  
  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
};
