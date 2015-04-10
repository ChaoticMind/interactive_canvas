"use strict";
// Constructor for Shape objects to hold data for all drawn objects.
// For now they will just be defined as rectangles.
function Shape(x, y, w, h, fill) {
  // This is a very simple and unsafe constructor. 
  // All we're doing is checking if the values exist.
  // "x || 0" just means "if there is a value for x, use that. Otherwise use 0."
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 1;
  this.h = h || 1;
  this.fill = fill || '#AAAAAA';
  this.selectionBoxColor = 'darkred';
}

// Draws this shape to a given context
Shape.prototype.draw = function(ctx, state) {
  // if handles_size is > 0, draws handles of that size.
  ctx.fillStyle = this.fill;
  ctx.fillRect(this.x, this.y, this.w, this.h);

  if (state.selection === this) {
    var half = state.selectionBoxSize / 2;
    // 0  1  2
    // 3     4
    // 5  6  7

    // top left, middle, right
    state.selectionHandles[0].x = this.x - half;
    state.selectionHandles[0].y = this.y - half;

    state.selectionHandles[1].x = this.x + this.w / 2 - half;
    state.selectionHandles[1].y = this.y - half;

    state.selectionHandles[2].x = this.x + this.w - half;
    state.selectionHandles[2].y = this.y - half;

    //middle left
    state.selectionHandles[3].x = this.x - half;
    state.selectionHandles[3].y = this.y + this.h / 2 - half;

    //middle right
    state.selectionHandles[4].x = this.x + this.w - half;
    state.selectionHandles[4].y = this.y + this.h / 2 - half;

    //bottom left, middle, right
    state.selectionHandles[6].x = this.x + this.w / 2 - half;
    state.selectionHandles[6].y = this.y + this.h - half;

    state.selectionHandles[5].x = this.x - half;
    state.selectionHandles[5].y = this.y + this.h - half;

    state.selectionHandles[7].x = this.x + this.w - half;
    state.selectionHandles[7].y = this.y + this.h - half;

    ctx.fillStyle = this.selectionBoxColor;
    for (var i = 0; i < 8; i += 1) {
      var cur = state.selectionHandles[i];
      ctx.fillRect(cur.x, cur.y, state.selectionBoxSize, state.selectionBoxSize);
    }
  }
};

// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Width) and its Y and (Y + Height)
  return  (this.x <= mx) && (this.x + this.w >= mx) &&
          (this.y <= my) && (this.y + this.h >= my);
};
