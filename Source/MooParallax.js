/*
---
description: A MooTools class to simulate parallax effect

license: MIT-style

authors:
- Ryan Mitchell

requires:
- core/1.3.0: '*'

provides: [MooParallax]

...
*/
var MooParallax = new Class({

	Implements: [Options],
	
	options: {
		mouseResponse: true,						// Sets mouse response
		mouseActiveOutside: false,					// Makes mouse affect layers from outside of the mouseport. 
		xparallax: true,						// Sets directions to move in
		yparallax: true,						//
		xorigin: 0.5,				    // Sets default alignment - only comes into play when travel is not 1
		yorigin: 0.5,				    //
		xtravel: 1,              // Factor by which travel is amplified
		ytravel: 1,              //
		takeoverFactor: 0.65,						// Sets rate of decay curve for catching up with target mouse position
		takeoverThresh: 0.002,					// Sets the distance within which virtualmouse is considered to be on target, as a multiple of mouseport width.
		frameDuration: 25							// In milliseconds
	},
	
	initialize: function(els, options){
	
		// elementize the passed els
		this.els = new Elements(els);
		
		// set options
		this.setOptions(options);
		
		// init origin
		this.initOrigin(this.options);
				
		// self referencing
		var self = this;
		
		// loop over elements
		this.els.each(function(el){
					
			// mouse defaults
			var localmouse = virtualmouse = { x: 0.5, y: 0.5 };
			
			// timer
			var timer = {
				running: false,
				frame: self.options.frameDuration,
				fire: function(x, y){
				  	self.positionMouse(mouseport, localmouse, virtualmouse);
			        self.moveLayers(layer, virtualmouse.x, virtualmouse.y);
				  	this.running = setTimeout(function(){
						if (localmouse.x!=x || localmouse.y!=y || !mouseport.ontarget ){
							timer.fire(localmouse.x, localmouse.y);
				  		} else if (timer.running){
				  			timer.running=false;
				  		}
					}, timer.frame);
				}
			};
			
			// viewport
			var viewport = { element: el };
			
			// mouseport
			var mouseport = {
  				element: viewport.element,
				takeoverFactor:	self.options.takeoverFactor,
				takeoverThresh:	self.options.takeoverThresh,
				xinside: false,		// is the mouse inside the mouseport's dimensions?
				yinside: false,
				active: false,		// are the mouse coordinates still being read?
				ontarget: false			// is the top layer inside the takeoverThresh?
			};
			
			// layer
			var layer = [];
			
			// setup ports
			self.setupPorts(viewport, mouseport);
			
			// Cycle through and create layers
			viewport.element.getChildren()
			.setStyle('position', 'absolute')
			.each(function(child, i){
				
				// add to layer
				layer[i] = {
					element: child,
		  			xparallax: self.options.xparallax,
		  			yparallax: self.options.yparallax,
		  			xorigin: self.options.xorigin,
		  			yorigin: self.options.yorigin,
		  			xtravel: self.options.xtravel,
		  			ytravel: self.options.ytravel
				};
				
				// setup layer
				self.setupLayer(layer, i, mouseport);
	      
	      		// setup contents
	      		if (self.options.triggerResponse) {
					self.setupLayerContents(layer, i, viewport.element.getCoordinates());
				}
				
			}, this);
			
    		// set initial position
			self.moveLayers(layer, 0.5, 0.5);
		
			// Mouse Response
			if (self.options.mouseResponse){
			
				// what el to we listen on?
				movel = self.options.mouseActiveOutside ? document.id(document.body) : el;
			
				// add mouse move
				movel.addEvent('mousemove', function(event){
							
					// Is mouse inside?
					mouseport.xinside = (event.page.x >= mouseport.left && event.page.x < mouseport.width+mouseport.left) ? true : false;
					mouseport.yinside = (event.page.y >= mouseport.top  && event.page.y < mouseport.height+mouseport.top)  ? true : false;
					
					// Then switch active on.
					if (mouseport.xinside && mouseport.yinside && !mouseport.active){
						mouseport.ontarget = false;
						mouseport.active = true;
					}
					
					// If active is on give localmouse coordinates
					if (mouseport.active){
						if (mouseport.xinside) { localmouse.x = (event.page.x - mouseport.left) / mouseport.width; }
						else { localmouse.x = (event.page.x < mouseport.left) ? 0 : 1; }
						if (mouseport.yinside) { localmouse.y = (event.page.y - mouseport.top) / mouseport.height; } 
						else { localmouse.y = (event.page.y < mouseport.top) ? 0 : 1; }
					}
										
					// If mouse is inside, fire timer
					if (mouseport.xinside && mouseport.yinside){ 
						if (!timer.running){
							timer.fire(localmouse.x, localmouse.y); 
						}
					} else if (mouseport.active){ 
						mouseport.active = false; 
					}	
							
				}.bind(this));
				
			};
		
			// Window Resize Response
			window.addEvent('resize', function(){

		  		setupPorts(viewport, mouseport);
		  		for (var i=0; i<layer.length; i++){
		    		setupLayer(layer, i, mouseport);
				}
				
			}.bind(this));
		
		
		});
	
	},
	
	setupPorts: function(viewport, mouseport){
	
		// get offset
		var offset = mouseport.element.getCoordinates();
		
		// extend viewport
		viewport.width = viewport.element.getSize().x;
		viewport.height = viewport.element.getSize().y;
		
		// extend viewport
		mouseport.width = mouseport.element.getSize().x;
		mouseport.height = mouseport.element.getSize().y;
		mouseport.top = offset.top;
		mouseport.left = offset.left;
	
	},
	
	setupLayer: function(layer, i, mouseport){
	
		var xStuff;
		var yStuff;
		var cssObject = {};
				
		layer[i].width = layer[i].element.getSize().x;
		layer[i].height = layer[i].element.getSize().y;

		xStuff = this.parseTravel(layer[i].xtravel, layer[i].xorigin, layer[i].width);
		yStuff = this.parseTravel(layer[i].ytravel, layer[i].yorigin, layer[i].height);
		
		layer[i] = Object.merge(layer[i], {
		  	// Used in triggerResponse
		  	diffxrat:    mouseport.width / (layer[i].width - mouseport.width),
		  	diffyrat:    mouseport.height / (layer[i].height - mouseport.height),
		  	// Used in moveLayers
		  	xtravel:     xStuff.travel,
		  	ytravel:     yStuff.travel,
		  	xtravelpx:   xStuff.travelpx,
		  	ytravelpx:   yStuff.travelpx,
		  	xoffset:     xStuff.offset,
		  	yoffset:     yStuff.offset		
		});

		// Set origin now if it won't be altered in moveLayers()
		if (xStuff.travelpx) {cssObject.left = xStuff.cssPos;}
		if (yStuff.travelpx) {cssObject.top = yStuff.cssPos;}
		if (xStuff.travelpx || yStuff.travelpx) {layer[i].element.setStyles(cssObject);}
	
	},
	
	setupLayerContents: function(layer, i, viewportOffset){

		var contentOffset;
		
		// Give layer a content object
		layer[i].content = [];
		
		// Layer content: get positions, dimensions and calculate element offsets for centering children of layers
		element.getChildren().each(function(child, n){
		  
			if (!layer[i].content[n]){
		  		layer[i].content[n] = {};
			}
		  
			if (!layer[i].content[n].element){
				layer[i].content[n]['element'] = child;
			}
		  
			// Store the anchor name if one has not already been specified.  You can specify anchors in Layer Options rather than html if you want.
			if (!layer[i].content[n].anchor && layer[i].content[n].element.getElement('a[name]')){
				layer[i].content[n]['anchor'] = layer[i].content[n].element.getElement('a[name]');
			}
		  
			// Only bother to store child's dimensions if child has an anchor.  What's the point otherwise?
			if (layer[i].content[n].anchor){
			
				contentOffset = layer[i].content[n].element.getCoordinates();
				
				layer[i].content[n] = Object.merge(layer[i].content[n], {
					width: layer[i].content[n].element.getSize().x,
					height: layer[i].content[n].element.getSize().y,
					x: contentOffset.left - viewportOffset.left,
					y: contentOffset.top - viewportOffset.top
				});
					
				layer[i].content[n] = Object.merge(layer[i].content[n], { 
					  posxrat:  (layer[i].content[n].x + layer[i].content[n].width/2) / layer[i].width,
					  posyrat:  (layer[i].content[n].y + layer[i].content[n].height/2) / layer[i].height
				});
				
			}
			
		});
		
	},
	
	moveLayers: function(layer, xratio, yratio){
		
		var xpos;
		var ypos;
		var cssObject;
		
		for (var i=0; i<layer.length; i++){
		
			// Calculate the moving factor
			xpos = layer[i].xtravel * xratio + layer[i].xoffset;
			ypos = layer[i].ytravel * yratio + layer[i].yoffset;
			cssObject = {};
					
			// Do the moving by pixels or by ratio depending on travelpx
			if (layer[i].xparallax){
			
				if (layer[i].xtravelpx){
					cssObject.marginLeft = xpos * -1 + 'px';
				} else {
					cssObject.left = xpos * 100 + '%';
					cssObject.marginLeft = xpos * layer[i].width *-1 + 'px';
				}
				
			}
			
			if (layer[i].yparallax){
			
				if (layer[i].ytravelpx){
					cssObject.marginTop = ypos * -1 + 'px';
				} else {
					cssObject.top = ypos * 100 + '%';
					cssObject.marginTop = ypos * layer[i].height * -1 + 'px';
				}
				
			}
					
			layer[i].element.setStyles(cssObject);
			
		}
		
	},
	
	parseTravel: function(travel, origin, dimension){
	  
	  var offset;
	  var cssPos;
	  
	  if (typeof(travel) === 'string'){
		if (travel.search(/^\d+\s?px$/) != -1){
			travel = travel.replace('px', '');
			travel = parseInt(travel, 10);
			// Set offset constant used in moveLayers()
			offset = origin * (dimension-travel);
			// Set origin now because it won't get altered in moveLayers()
			cssPos = origin * 100 + '%';   
			return {travel: travel, travelpx: true, offset: offset, cssPos: cssPos};
		} else if (travel.search(/^\d+\s?%$/) != -1) {
			travel.replace('%', '');
			travel = parseInt(travel, 10) / 100;
		} else {
			travel=1;
		}
	  }
	  
	  // Set offset constant used in moveLayers()
	  offset = origin * (1 - travel);
	  return {travel: travel, travelpx: false, offset: offset};
	  
	},

	positionMouse: function(mouseport, localmouse, virtualmouse){
	
		var difference = {x: 0, y: 0, sum: 0};
				
		// Set where the virtual mouse is, if not on target
		if (!mouseport.ontarget){
		
			// Calculate difference
			difference.x    = virtualmouse.x - localmouse.x;
			difference.y    = virtualmouse.y - localmouse.y;
			difference.sum  = Math.sqrt(difference.x*difference.x + difference.y*difference.y);
			
			// Reset virtualmouse
			virtualmouse.x = localmouse.x + difference.x * mouseport.takeoverFactor;
			virtualmouse.y = localmouse.y + difference.y * mouseport.takeoverFactor;
			
			// If mouse is inside the takeoverThresh set ontarget to true
			if (difference.sum < mouseport.takeoverThresh && difference.sum > mouseport.takeoverThresh*-1) {
				mouseport.ontarget=true;
			}
			
		} else {
			// Set where the layer is if on target
			virtualmouse.x = localmouse.x;
			virtualmouse.y = localmouse.y;
		}
		
	},
	
	initOrigin: function(l){
	
		if (l.xorigin=='left'){
			l.xorigin=0;
		} else if (l.xorigin=='middle' || l.xorigin=='centre' || l.xorigin=='center'){
			l.xorigin=0.5;
		} else if (l.xorigin=='right'){
			l.xorigin=1;
		}
		
		if (l.yorigin=='top'){
			l.yorigin=0;
		} else if (l.yorigin=='middle' || l.yorigin=='centre' || l.yorigin=='center'){
			l.yorigin=0.5;
		} else if (l.yorigin=='bottom'){
			l.yorigin=1;
		}
		
	}
	
});