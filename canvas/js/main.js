"use strict";
window.onload = initialize;
// http://simonsarris.com/blog/510-making-html5-canvas-useful

function initialize() {
	var s = new CanvasState(document.getElementById('canvas'));

	s.addShape(new Shape(40,40,50,50)); // The default is gray
	s.addShape(new Shape(60,140,40,60, 'lightskyblue'));
	// Lets make some partially transparent
	s.addShape(new Shape(80,150,60,30, 'rgba(127, 255, 212, .5)'));
	s.addShape(new Shape(125,80,30,80, 'rgba(245, 222, 179, .7)'));
}
