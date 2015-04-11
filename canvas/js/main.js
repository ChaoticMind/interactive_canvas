"use strict";
window.onload = initialize;
// http://simonsarris.com/blog/510-making-html5-canvas-useful


function initialize() {
	canvas = document.getElementById('canvas');
	canvas.tabIndex = 100; // to be able to register onkeydown
	var s = new CanvasState(canvas);

	// in jquery, events bubble up
	$('#nextshape').change({cs: s}, function(event) {
		update_next(event.data.cs)
	});
	// var form = document.getElementById('nextshape');
	// form.onchange = update_next(s);
	canvas.onkeydown = function(event) {s.hotkeys(event);}
	canvas.onblur = function(event) {s.deselect();}
	update_next(s);

	s.addShape(new Shape(40, 40, 50, 50)); // The default is gray
	s.addShape(new Shape(60, 140, 40, 60, 'lightskyblue'));
	// Lets make some partially transparent
	s.addShape(new Shape(80, 150, 60, 30, 'rgba(127, 255, 212, .5)'));
	s.addShape(new Shape(125, 80, 30, 80, 'rgba(245, 222, 179, .7)'));
}


function update_next(cs) {
	var width = parseInt(document.getElementById('width').value) || 20;
	var height = parseInt(document.getElementById('height').value) || 20;
	var alpha = document.getElementById('transparent').checked ? '0.5' : '1';
	var color = $('input[name="color"]:checked').val();
	color = color.replace(')', ', ' + alpha + ')').replace('rgb', 'rgba');

	// set attributes for next shape
	cs.next_width = Math.abs(width);
	cs.next_height = Math.abs(height);
	cs.next_color = color;
}
