"use strict";
function Shape(x, y, w, h, fill) {
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 1;
  this.h = h || 1;

  this.fill = fill || '#AAAAAA';
}

Shape.prototype.draw = function(state) {
  state.ctx.fillStyle = this.fill;
  state.ctx.fillRect(this.x, this.y, this.w, this.h);

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
  }
};

Shape.prototype.contains = function(mx, my) {
  return  (this.x <= mx) && (this.x + this.w >= mx) &&
          (this.y <= my) && (this.y + this.h >= my);
};
