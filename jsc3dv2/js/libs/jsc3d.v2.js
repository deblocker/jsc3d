/**
 * @preserve Copyright (c) 2011~2014 Humu <humu2009@gmail.com>
 * This file is part of jsc3d project, which is freely distributable under the 
 * terms of the MIT license.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


/**
	@namespace JSC3D
 */
var JSC3D = JSC3D || {};


/**
	@class Viewer

	Viewer is the main class of JSC3D. It provides presentation of and interaction with a simple static 3D scene 
	which can either be given as the url of the scene file, or be manually constructed and passed in. It 
	also provides some settings to adjust the mode and quality of the rendering.<br /><br />

	Viewer should be constructed with an existing canvas object where to perform the rendering.<br /><br />

	Viewer provides 3 way to specify the scene:<br />
	1. Use setParameter() method before initilization and set 'SceneUrl' parameter with a valid url  
	   that describes where to load the scene. <br />
	2. Use replaceSceneFromUrl() method, passing in a valid url to load/replace scene at runtime.<br />
	3. Use replaceScene() method, passing in a manually constructed scene object to replace the current one 
	   at runtime.<br />
 */
JSC3D.Viewer = function(canvas, parameters) {
	if(parameters)
		this.params = {
			SceneUrl:			parameters.SceneUrl || '', 
			InitRotationX:		parameters.InitRotationX || 0, 
			InitRotationY:		parameters.InitRotationY || 0, 
			InitRotationZ:		parameters.InitRotationZ || 0, 
			SceneRotation:		parameters.SceneRotation ||  'off', /* Scene Rotation */
			InitSceneRotation:	parameters.InitSceneRotation || 0,  /* Scene Rotation */
			ModelColor:			parameters.ModelColor || '#caa618', 
			BackgroundColor1:	parameters.BackgroundColor1 || '#ffffff', 
			BackgroundColor2:	parameters.BackgroundColor2 || '#383840', 
			BackgroundImageUrl:	parameters.BackgroundImageUrl || '', 
			Background:			parameters.Background || 'on', 
			RenderMode:			parameters.RenderMode || 'flat', 
			Definition:			parameters.Definition || 'standard', 
			FaceCulling:		parameters.FaceCulling || 'on', 
			MipMapping:			parameters.MipMapping || 'off', 
			CreaseAngle:		parameters.CreaseAngle || -180, 
			SphereMapUrl:		parameters.SphereMapUrl || '', 
			ProgressBar:		parameters.ProgressBar || 'on', 
			Renderer:			parameters.Renderer || '', 
			AutoUpdate:			parameters.AutoUpdate || 'off',  /* FPS */
			AutoRotateSpeed:	parameters.AutoRotateSpeed || 0, /* AutoRotation */
			LightingMode:		parameters.LightingMode || 'standard',  /* Lighting */
			LocalBuffers:		parameters.LocalBuffers || 'retain'
		};
	else
		this.params = {
			SceneUrl: '', 
			InitRotationX: 0, 
			InitRotationY: 0, 
			InitRotationZ: 0, 
			InitSceneRotation: 0, /* Scene Rotation */
			SceneRotation: 'off', /* Scene Rotation */
			ModelColor: '#caa618', 
			BackgroundColor1: '#ffffff', 
			BackgroundColor2: '#383840', 
			BackgroundImageUrl: '', 
			Background: 'on', 
			RenderMode: 'flat', 
			Definition: 'standard', 
			FaceCulling: 'on', 
			MipMapping: 'off', 
			CreaseAngle: -180, 
			SphereMapUrl: '', 
			ProgressBar: 'on', 
			Renderer: '', 
			AutoUpdate: 'off', /* FPS */
			AutoRotateSpeed: 0, /* AutoRotation */
			LightingMode: 'standard', /* Lighting */
			LocalBuffers: 'retain'
		};

	this.canvas = canvas;
	this.ctx2d = null;
	this.canvasData = null;
	this.bkgColorBuffer = null;
	this.colorBuffer = null;
	this.zBuffer = null;
	this.selectionBuffer = null;
	this.frameWidth = null; /* Viewer Resize */
	this.frameHeight = null; /* Viewer Resize */
	this.scene = null;
	this.textures = []; /* Textures preload & materials collection */
	this.materials = []; /* Textures preload & materials collection */
	this.defaultMaterial = null;
	this.sphereMap = null;
	this.isLoaded = false;
	this.isFailed = false;
	this.abortUnfinishedLoadingFn = null;
	this.needUpdate = false;
	this.needRepaint = false;
	this.initRotX = 0;
	this.initRotY = 0;
	this.initRotZ = 0;
	this.initSceneRotation = 0; /* Scene Rotation */
	this.sceneRotation = 0; /* Scene Rotation */
	this.isSceneRotationEnabled = false;  /* Scene Rotation */
	this.zoomFactor = 1;
	this.panning = [0, 0];
	this.rotation = [0, 0, 0]; /* Scene Rotation */
	this.fps = 0; /* FPS */
	this.frameNumber = 0; /* FPS */
	this.rotMatrix = new JSC3D.Matrix3x4;
	this.transformMatrix = new JSC3D.Matrix3x4;
	this.sceneUrl = '';
	this.modelColor = 0xcaa618;
	this.bkgColor1 = 0xffffff;
	this.bkgColor2 = 0x383840;
	this.bkgImageUrl = '';
	this.bkgImage = null;
	this.isBackgroundOn = true;
	this.renderMode = 'flat';
	this.definition = 'standard';
	this.isCullingDisabled = false;
	this.isMipMappingOn = false;
	this.creaseAngle = -180;
	this.sphereMapUrl = '';
	this.isAutoUpdateOn = false; /* FPS */
	this.autoRotateSpeed = 0; /* AutoRotation */
	this.lightingMode = 'standard'; /* Lighting */
	this.showLights = false; /* Lighting */
	this.showProgressBar = true;
	this.buttonStates = {};
	this.keyStates = {};
	this.mouseX = 0;
	this.mouseY = 0;
	this.mouseDownX = -1;
	this.mouseDownY = -1;
	this.isTouchHeld = false;
	this.baseZoomFactor = 1;
	this.suppressDraggingRotation = false;
	this.onloadingstarted = null;
	this.onloadingcomplete = null;
	this.onloadingprogress = null;
	this.onloadingaborted = null;
	this.onloadingerror = null;
	this.onmousedown = null;
	this.onmouseup = null;
	this.onmousemove = null;
	this.onmousewheel = null;
	this.onmouseclick = null;
	this.beforeupdate = null;
	this.afterupdate = null;
	this.onscenerotation = null; /* Scene Rotation */
	this.ontick = null; /* FPS */
	this.mouseUsage = 'default';
	this.isDefaultInputHandlerEnabled = true;
	this.progressFrame = null;
	this.progressRectangle = null;
	this.messagePanel = null;
	this.webglBackend = null;

	/* Modern all-in-one touch & tablet w. kb */

    /* 
	Event sequence:
	1) touchstart
    2) touchmove
    3) touchend
    4) mouseover
    5) mousemove
    6) mousedown
    7) mouseup
    8) click 
	*/
	
	// setup input handlers.
	// compatibility for touch devices is taken into account
	var self = this;
	if(!JSC3D.PlatformInfo.isTouchDevice) {
		this.canvas.addEventListener('mousedown', function(e){self.mouseDownHandler(e);}, false);
		this.canvas.addEventListener('mouseup', function(e){self.mouseUpHandler(e);}, false);
		this.canvas.addEventListener('mousemove', function(e){self.mouseMoveHandler(e);}, false);
		//this.canvas.addEventListener('click', function(e){self.mouseClickHandler(e);}, false);
		document.addEventListener('keydown', function(e){self.keyDownHandler(e);}, false);
		document.addEventListener('keyup', function(e){self.keyUpHandler(e);}, false);
	}
	else if(JSC3D.Hammer) {
		JSC3D.Hammer(this.canvas).on('touch release hold drag pinch transformend', function(e){self.gestureHandler(e);});
	}
	else {
		this.canvas.addEventListener('touchstart', function(e){self.touchStartHandler(e);}, false);
		this.canvas.addEventListener('touchend', function(e){self.touchEndHandler(e);}, false);
		this.canvas.addEventListener('touchmove', function(e){self.touchMoveHandler(e);}, false);
		/* Modern all-in-one touch & tablet w. kb */
		this.canvas.addEventListener('touchcancel', function(e){self.touchCancelHandler(e);}, false);
		this.canvas.addEventListener('touchleave', function(e){self.touchCancelHandler(e);}, false);
	}
	/* Modern all-in-one touch & tablet w. kb */
	this.canvas.addEventListener('onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll', function(e){self.mouseWheelHandler(e);});	
};

/**
	Set the initial value for a parameter to parameterize the viewer.<br />
	Available parameters are:<br />
	'<b>SceneUrl</b>':				URL string that describes where to load the scene, default to '';<br />
	'<b>InitRotationX</b>':			initial rotation angle around x-axis for the whole scene, default to 0;<br />
	'<b>InitRotationY</b>':			initial rotation angle around y-axis for the whole scene, default to 0;<br />
	'<b>InitRotationZ</b>':			initial rotation angle around z-axis for the whole scene, default to 0;<br />
	'<b>CreaseAngle</b>':			an angle to control the shading smoothness between faces. Two adjacent faces will be shaded with discontinuity at the edge if the angle between their normals exceeds this value. Not used by default;<br />
	'<b>ModelColor</b>':			fallback color for all meshes, default to '#caa618';<br />
	'<b>BackgroundColor1</b>':		color at the top of the background, default to '#ffffff';<br />
	'<b>BackgroundColor2</b>':		color at the bottom of the background, default to '#383840';<br />
	'<b>BackgroundImageUrl</b>':	URL string that describes where to load the image used for background, default to '';<br />
	'<b>Background</b>':			turn on/off rendering of background. If this is set to 'off', the background area will be transparent. Default to 'on';<br />
	'<b>RenderMode</b>':			render mode, default to 'flat';<br />
	'<b>FaceCulling</b>':			turn on/off back-face culling for all meshes, default to 'on';<br />
	'<b>Definition</b>':			quality level of rendering, default to 'standard';<br />
	'<b>MipMapping</b>':			turn on/off mip-mapping, default to 'off';<br />
	'<b>SphereMapUrl</b>':			URL string that describes where to load the image used for sphere mapping, default to '';<br />
	'<b>ProgressBar</b>':			turn on/off the progress bar when loading, default to 'on'. By turning off the default progress bar, a user defined loading indicator can be used instead;<br />
	'<b>Renderer</b>':				set to 'webgl' to enable WebGL for rendering, default to ''.
	@param {String} name name of the parameter to set.
	@param value new value for the parameter.
 */
JSC3D.Viewer.prototype.setParameter = function(name, value) {
	this.params[name] = value;
};

JSC3D.Viewer.prototype.setParameters = function(params) {
	for (var name in params) {
		var value = params[name];
		this.params[name] = value;
	}
};

/**
	Initialize viewer for rendering and interactions.
 */
JSC3D.Viewer.prototype.init = function() {
	this.sceneUrl = this.params['SceneUrl'];
	this.initRotX = parseFloat(this.params['InitRotationX']);
	this.initRotY = parseFloat(this.params['InitRotationY']);
	this.initRotZ = parseFloat(this.params['InitRotationZ']);
	this.modelColor = parseInt('0x' + this.params['ModelColor'].substring(1));
	this.bkgColor1 = parseInt('0x' + this.params['BackgroundColor1'].substring(1));
	this.bkgColor2 = parseInt('0x' + this.params['BackgroundColor2'].substring(1));
	this.bkgImageUrl = this.params['BackgroundImageUrl'];
	this.isBackgroundOn = this.params['Background'].toLowerCase() == 'on';
	this.renderMode = this.params['RenderMode'].toLowerCase();
	this.definition = this.params['Definition'].toLowerCase();
	this.isCullingDisabled = this.params['FaceCulling'].toLowerCase() == 'off';
	this.creaseAngle = parseFloat(this.params['CreaseAngle']);
	this.isMipMappingOn = this.params['MipMapping'].toLowerCase() == 'on';
	this.sphereMapUrl = this.params['SphereMapUrl'];
	this.showProgressBar = this.params['ProgressBar'].toLowerCase() == 'on';
	this.useWebGL = this.params['Renderer'].toLowerCase() == 'webgl';
	this.isAutoUpdateOn = this.params['AutoUpdate'].toLowerCase() == 'on'; /* FPS */
	this.autoRotateSpeed = parseFloat(this.params['AutoRotateSpeed']); /* AutoRotation */
	this.releaseLocalBuffers = this.params['LocalBuffers'].toLowerCase() == 'release';
	this.isSceneRotationEnabled = this.params['SceneRotation'].toLowerCase() == 'on'; /* Scene Rotation */
	this.initSceneRotation = parseFloat(this.params['InitSceneRotation']); /* Scene Rotation */
	this.lightingMode = this.params['LightingMode'].toLowerCase(); /* Lighting */
	
	/* FPS +++ */
	if (this.definition == 'default')
		this.definition = JSC3D.PlatformInfo.profile;
	/* FPS --- */
	
	/* Viewer Resize +++ */
	var cb = this.getInnerSize();
	this.canvas.width = cb[0];
	this.canvas.height = cb[1];
	/* Viewer Resize --- */
	
	// Create WebGL render back-end if it is assigned to.
	if(this.useWebGL && JSC3D.PlatformInfo.supportWebGL && JSC3D.WebGLRenderBackend) {
		try {
			this.webglBackend = new JSC3D.WebGLRenderBackend(this.canvas, this.releaseLocalBuffers);
			this.webglBackend.isLightingOn = (this.lightingMode != 'standard'); /* Lighting */
		} catch(e){}
	}

	// Fall back to software rendering when WebGL is not assigned or unavailable.
	if(!this.webglBackend) {
		if(this.useWebGL) {
			if(JSC3D.console)
				JSC3D.console.logWarning('WebGL is not available. Software rendering is enabled instead.');
		}
		try {
			this.ctx2d = this.canvas.getContext('2d');
			this.canvasData = this.ctx2d.getImageData(0, 0, this.canvas.width, this.canvas.height);
		}
		catch(e) {
			this.ctx2d = null;
			this.canvasData = null;
		}
	}

	if(this.canvas.width <= 2 || this.canvas.height <= 2)
		this.definition = 'standard';
	
	// calculate dimensions of frame buffers
	switch(this.definition) {
	case 'low':
		this.frameWidth = ~~((this.canvas.width + 1) / 2);
		this.frameHeight = ~~((this.canvas.height + 1) / 2);
		break;
	case 'high':
		this.frameWidth = this.canvas.width * 2;
		this.frameHeight = this.canvas.height * 2;
		break;
	case 'standard':
	default:
		this.frameWidth = this.canvas.width;
		this.frameHeight = this.canvas.height;
		break;
	}

	// initialize states
	this.zoomFactor = 1;
	this.panning = [0, 0];
	this.rotation = [0, 0, 0]; /* Scene Rotation */
	this.rotMatrix.identity();
	this.transformMatrix.identity();
	this.isLoaded = false;
	this.isFailed = false;
	this.needUpdate = false;
	this.needRepaint = false;
	this.scene = null;

	// create a default material to render meshes that don't have one
	/* params: name, ambientColor, diffuseColor, specularColor, 
					 ambientReflection, diffuseReflection, specularReflection, shininess, 
					 transparency, environmentCast, lightingCast 
	*/
	this.defaultMaterial = new JSC3D.Material('default', undefined, this.modelColor);

	// allocate memory storage for frame buffers
	if(!this.webglBackend) {
		this.colorBuffer = new Array(this.frameWidth * this.frameHeight);
		this.zBuffer = new Array(this.frameWidth * this.frameHeight);
		this.selectionBuffer = new Array(this.frameWidth * this.frameHeight);
		this.bkgColorBuffer = new Array(this.frameWidth * this.frameHeight);
	}

	// apply background
	this.generateBackground();
	this.drawBackground();

	/* Scene rotation */
	if (!this.isAutoUpdateOn && this.autoRotateSpeed != 0) 
		if(JSC3D.console)
			JSC3D.console.logWarning('AutoRotate need to have AutoUpdate switched on!');
	
	/* Lighting */
	if(!this.webglBackend) {
		this.lightingMode = 'standard';
	}
	// wake up update routine per 30 milliseconds
	var self = this;
	
	/* FPS +++ */
	var frameUpdateTime = (new Date)*1;
	(function tick() {
		/* thanks: avih */
		var interval = 1000 / 30;
		var now = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
		// setTimeout can return early, make sure to target the next frame.
		if (self.frameTargetTime && now < self.frameTargetTime)
			now = self.frameTargetTime + 0.01; // Floating point errors may result in just too early.
		var delay = interval - now % interval;
		self.frameTargetTime = now + delay;
		var fps = 1000 / (now - frameUpdateTime);
		if (now != frameUpdateTime){
			self.fps += (fps - self.fps) / 30; /* low-pass filter */
			frameUpdateTime = now;
		}
		
		if (self.ctx2d || self.webglBackend) {
			self.frameNumber++; /* FPS */
		
			self.doUpdate();
			if(self.ontick != null && (typeof self.ontick) == 'function')
				self.ontick();
		}
		
		if (self.isAutoUpdateOn) 
			setTimeout(tick, delay);
		
	}) ();
	/* FPS --- */

	// load background image if any
	this.setBackgroudImageFromUrl(this.bkgImageUrl);

	// load scene if any
	this.loadScene();
	
	// load sphere mapping image if any
	this.setSphereMapFromUrl(this.sphereMapUrl);
};

/**
	Ask viewer to render a new frame or just repaint last frame.
	@param {Boolean} repaintOnly true to repaint last frame; false(default) to render a new frame.
 */
JSC3D.Viewer.prototype.update = function(repaintOnly) {
	if(this.isFailed)
		return;

	if(repaintOnly)
		this.needRepaint = true;
	else
		this.needUpdate = true;
	
	if (!this.isAutoUpdateOn) {
		this.needUpdate = true; /* Hotfix Pick info after resize*/
		this.doUpdate();
	}
};

/**
	Setup an initial empty scene with given extent
 */
JSC3D.Viewer.prototype.createScene = function(minX, maxX, minY, maxY, minZ, maxZ) {
	if(this.abortUnfinishedLoadingFn)
		this.abortUnfinishedLoadingFn();

	this.scene = null;
	this.isLoaded = false;
	this.update();
	
	var scene = new JSC3D.Scene;
	scene.aabb = new JSC3D.AABB();
	scene.aabb.minX = minX;
	scene.aabb.maxX = maxX;
	scene.aabb.minY = minY;
	scene.aabb.maxY = maxY;
	scene.aabb.minZ = minZ;
	scene.aabb.maxZ = maxZ;
	this.replaceScene(scene);
};

/**
	Viewer Resize +++ 
 */
JSC3D.Viewer.prototype.getInnerSize = function() {
	var style = window.getComputedStyle(this.canvas);
	var padLR = parseInt(style.paddingLeft) + parseInt(style.paddingRight);
	var padTB = parseInt(style.paddingTop) + parseInt(style.paddingBottom);
	return [this.canvas.clientWidth - padLR, this.canvas.clientHeight - padTB];
}
/* Viewer Resize --- */

/**
	Rotate the scene with given angles around Cardinal axes.
	@param {Number} rotX rotation angle around X-axis in degrees.
	@param {Number} rotY rotation angle around Y-axis in degrees.
	@param {Number} rotZ rotation angle around Z-axis in degrees.
 */
JSC3D.Viewer.prototype.rotate = function(rotX, rotY, rotZ) {
	this.rotateAboutXAxis(rotX); /* Scene Rotation */
	this.rotateAboutYAxis(rotY); /* Scene Rotation */
	this.rotateAboutZAxis(rotZ); /* Scene Rotation */
};

JSC3D.Viewer.prototype.calcRotation = function() { /* Scene Rotation */
	var m = this.rotMatrix;
	var radians = 180 / Math.PI;
	
	var angleX = Math.atan2(-m.m12, m.m22);
	var c2 = Math.sqrt(m.m00*m.m00+m.m01*m.m01);
	var angleY = Math.atan2(m.m02, c2);
	var s1 = Math.sin(angleX);
	var c1 = Math.cos(angleX);
	var angleZ = Math.atan2(-s1*m.m20+c1*m.m10, c1*m.m11+s1*m.m21);
		
    var degX = angleX * radians;
    var degY = angleY * radians;
    var degZ = angleZ * radians;
	
	this.rotation[0] = degX; this.rotation[1] = degY; this.rotation[2] = degZ; /* Viewer calcRotation */
}

JSC3D.Viewer.prototype.rotateAboutXAxis = function(rotX) { /* Scene Rotation */
	if (!!rotX) {
		rotX %= 360;
		this.rotMatrix.rotateAboutXAxis(rotX);
	}
}

JSC3D.Viewer.prototype.rotateAboutYAxis = function(rotY) { /* Scene Rotation */
	if (!!rotY) {
		rotY %= 360;
		this.rotMatrix.rotateAboutYAxis(rotY);
	}
}

JSC3D.Viewer.prototype.rotateAboutZAxis = function(rotZ) { /* Scene Rotation */
	if (!!rotZ) {
		rotZ %= 360;
		this.rotMatrix.rotateAboutZAxis(rotZ);
	}
}

JSC3D.Viewer.prototype.rotateScene = function(degY) { /* Scene Rotation */
	if (!!degY) {
		degY %= 360;
		var degX = this.initRotX, degZ = this.initRotZ;
		this.rotMatrix.rotateAboutXAxis(-degX);
		this.rotMatrix.rotateAboutZAxis(-degZ);
		this.rotMatrix.rotateAboutYAxis(degY);
		this.rotMatrix.rotateAboutZAxis(degZ);
		this.rotMatrix.rotateAboutXAxis(degX);
	}
	this.sceneRotation += degY;
	switch (true) {
		case (this.sceneRotation >= 180):
			this.sceneRotation -= 360;
			break;
		case (this.sceneRotation <= -180):
			this.sceneRotation += 360;
			break;
	}
	this.calcRotation(); /* Scene Rotation */
	
	if(this.onscenerotation != null && (typeof this.onscenerotation) == 'function') {
		var self = this;
		self.onscenerotation(self.sceneRotation);
	}
}

JSC3D.Viewer.prototype.autoRotateScene = function() { /* AutoRotation */
	if (this.autoRotateSpeed != 0) {
		this.rotateScene(this.autoRotateSpeed);
		this.needUpdate = true;
	}
}
/**
	Set render mode.<br />
	Available render modes are:<br />
	'<b>point</b>':         render meshes as point clouds;<br />
	'<b>wireframe</b>':     render meshes as wireframe;<br />
	'<b>flat</b>':          render meshes as solid objects using flat shading;<br />
	'<b>smooth</b>':        render meshes as solid objects using smooth shading;<br />
	'<b>texture</b>':       render meshes as solid textured objects, no lighting will be apllied;<br />
	'<b>textureflat</b>':   render meshes as solid textured objects, lighting will be calculated per face;<br />
	'<b>texturesmooth</b>': render meshes as solid textured objects, lighting will be calculated per vertex and interpolated.<br />
	@param {String} mode new render mode.
 */
JSC3D.Viewer.prototype.setRenderMode = function(mode) {
	this.params['RenderMode'] = mode;
	this.renderMode = mode;
};

/**
	Set quality level of rendering.<br />
	Available quality levels are:<br />
	'<b>low</b>':      low-quality rendering will be applied, with highest performance;<br />
	'<b>standard</b>': normal-quality rendering will be applied, with modest performace;<br />
	'<b>high</b>':     high-quality rendering will be applied, with lowest performace.<br />
	@params {String} definition new quality level.
 */
JSC3D.Viewer.prototype.setDefinition = function(definition) {
	if(this.canvas.width <= 2 || this.canvas.height <= 2)
		definition = 'standard';

	if(definition == this.definition)
		return;
	
	this.params['Definition'] = definition;
	this.definition = definition;

	var oldFrameWidth = this.frameWidth;

	switch(this.definition) {
	case 'low':
		this.frameWidth = ~~((this.canvas.width + 1) / 2);
		this.frameHeight = ~~((this.canvas.height + 1) / 2);
		break;
	case 'high':
		this.frameWidth = this.canvas.width * 2;
		this.frameHeight = this.canvas.height * 2;
		break;
	case 'standard':
	default:
		this.frameWidth = this.canvas.width;
		this.frameHeight = this.canvas.height;
		break;
	}

	var ratio = this.frameWidth / oldFrameWidth;
	// zoom factor should be adjusted, otherwise there would be an abrupt zoom-in or zoom-out on next frame
	this.zoomFactor *= ratio;
	// likewise, panning should also be adjusted to avoid abrupt jump on next frame
	this.panning[0] *= ratio;
	this.panning[1] *= ratio;

	if(this.webglBackend)
		return;

	/*
		Reallocate frame buffers using the dimensions of current definition.
	 */
	var newSize = this.frameWidth * this.frameHeight;
	if(this.colorBuffer.length < newSize)
		this.colorBuffer = new Array(newSize);
	if(this.zBuffer.length < newSize)
		this.zBuffer = new Array(newSize);
	if(this.selectionBuffer.length < newSize)
		this.selectionBuffer = new Array(newSize);
	if(this.bkgColorBuffer.length < newSize)
		this.bkgColorBuffer = new Array(newSize);

	this.generateBackground();
};

/**
	Specify the url for the background image.
	@param {String} backgroundImageUrl url string for the background image.
 */
JSC3D.Viewer.prototype.setBackgroudImageFromUrl = function(backgroundImageUrl) {
	this.params['BackgroundImageUrl'] = backgroundImageUrl;
	this.bkgImageUrl = backgroundImageUrl;

	if(backgroundImageUrl == '') {
		this.bkgImage = null;
		return;
	}

	var self = this;
	var img = new Image;

	img.onload = function() {
		self.bkgImage = this;
		self.generateBackground();
	};

	img.crossOrigin = 'anonymous'; // explicitly enable cross-domain image
	img.src = encodeURI(backgroundImageUrl);
};

/**
	Specify a new image from the given url which will be used for applying sphere mapping.
	@param {String} sphereMapUrl url string that describes where to load the image.
 */
JSC3D.Viewer.prototype.setSphereMapFromUrl = function(sphereMapUrl) {
	this.params['SphereMapUrl'] = sphereMapUrl;
	this.sphereMapUrl = sphereMapUrl;

	if(sphereMapUrl == '') {
		this.sphereMap = null;
		return;
	}

	var self = this;
	var newMap = new JSC3D.Texture;

	newMap.onready = function() {
		self.sphereMap = newMap;
		self.update();
	};

	newMap.createFromUrl(this.sphereMapUrl);
};

/**
	Textures preload & materials collection
 */
JSC3D.Viewer.prototype.addTexture = function(textureUrlName) {
	var fileName = textureUrlName.replace(/^.*(\\|\/|\:)/, '');
	var textureName = fileName.substr(0,fileName.lastIndexOf('.')) || fileName + '';
	var texture = new JSC3D.Texture(textureName);
	texture.createFromUrl(textureUrlName);
	
	this.textures.push(texture);
};

/**
	Textures preload & materials collection
 */
JSC3D.Viewer.prototype.getTexture = function(textureName) {
	for(var i=0, l=this.textures.length; i<l; i++) {
		var texture = this.textures[i];
		if(texture.name == textureName)
			return texture;
	}
	return null;
};

/**
	Textures preload & materials collection
 */
JSC3D.Viewer.prototype.addMaterial = function(name, ambientColor, diffuseColor, specularColor, ambientReflection, diffuseReflection, specularReflection, shininess, transparency, environmentCast, lightingCast) {
	/* EnvironmentCast of Material, Lighting */
	var material = new JSC3D.Material(name, ambientColor, diffuseColor, specularColor, ambientReflection, diffuseReflection, specularReflection, shininess, transparency, environmentCast, lightingCast);
	this.materials.push(material);
};

/**
	Textures preload & materials collection
 */
JSC3D.Viewer.prototype.getMaterial = function(materialName) {
	for(var i=0, l=this.materials.length; i<l; i++) {
		var material = this.materials[i];
		if(material.name == materialName)
			return material;
	}
	return null;
};

/**
	Enable/Disable the default mouse and key event handling routines.
	@param {Boolean} enabled true to enable the default handler; false to disable them.
 */
JSC3D.Viewer.prototype.enableDefaultInputHandler = function(enabled) {
	this.isDefaultInputHandlerEnabled = enabled;
};

/* Scene Rotation */
JSC3D.Viewer.prototype.enableSceneRotation = function(enabled) {
	this.isSceneRotationEnabled = enabled;
};

/**
	Set control of mouse pointer.
	Available options are:<br />
	'<b>default</b>':	default mouse control will be used;<br />
	'<b>free</b>':		this tells {JSC3D.Viewer} a user-defined mouse control will be adopted. 
						This is often used together with viewer.enableDefaultInputHandler(false) 
						and viewer.onmousedown, viewer.onmouseup and/or viewer.onmousemove overridden.<br />
	'<b>rotate</b>':	mouse will be used to rotate the scene;<br />
	'<b>zoom</b>':		mouse will be used to do zooming.<br />
	'<b>pan</b>':		mouse will be used to do panning.<br />
	@param {String} usage control of mouse pointer to be set.
	@deprecated This method is obsolete since version 1.5.0 and may be removed in the future.
 */
JSC3D.Viewer.prototype.setMouseUsage = function(usage) {
	this.mouseUsage = usage;
};

/**
	Check if WebGL is enabled for rendering.
	@returns {Boolean} true if WebGL is enabled; false if WebGL is not enabled or unavailable.
 */
JSC3D.Viewer.prototype.isWebGLEnabled = function() {
	return this.webglBackend != null;
};

/**
	Load a new scene from the given url to replace the current scene.
	@param {String} sceneUrl url string that describes where to load the new scene.
 */
JSC3D.Viewer.prototype.replaceSceneFromUrl = function(sceneUrl) {
	this.params['SceneUrl'] = sceneUrl;
	this.sceneUrl = sceneUrl;
	this.isFailed = this.isLoaded = false;
	this.loadScene();
};

/**
	Replace the current scene with a given scene.
	@param {JSC3D.Scene} scene the given scene.
 */
JSC3D.Viewer.prototype.replaceScene = function(scene) {
	this.params['SceneUrl'] = '';
	this.sceneUrl = '';
	this.isFailed = false;
	this.isLoaded = true;
	this.setupScene(scene);
};

/**
	Reset the current scene to its initial state.
 */
JSC3D.Viewer.prototype.resetScene = function() {
	var d = (!this.scene || this.scene.isEmpty()) ? 0 : this.scene.aabb.lengthOfDiagonal();
	this.zoomFactor = (d == 0) ? 1 : (this.frameWidth < this.frameHeight ? this.frameWidth : this.frameHeight) / d;
	this.panning = [0, 0];
	this.currentMesh = null; /* Selected mesh */
	this.rotMatrix.identity();
	this.scene.isLightingOn = (this.lightingMode != 'standard');
	this.setup3PointLighting(this.lightingMode, this.showLights); 
	this.sceneRotation = 0; /* Scene Rotation */
	this.rotateAboutXAxis(this.initRotX); /* Scene Rotation */
	this.rotateAboutYAxis(this.initRotY); /* Scene Rotation */
	this.rotateAboutZAxis(this.initRotZ); /* Scene Rotation */
	this.rotateScene(this.initSceneRotation); /* Scene Rotation */
};

/**
	Get the current scene.
	@returns {JSC3D.Scene} the current scene.
 */
JSC3D.Viewer.prototype.getScene = function() {
	return this.scene;
};

/**
	Query information at a given position on the canvas.
	@param {Number} clientX client x coordinate on the current page.
	@param {Number} clientY client y coordinate on the current page.
	@returns {JSC3D.PickInfo} a PickInfo object which holds the result.
 */
JSC3D.Viewer.prototype.pick = function(clientX, clientY) {
	var pickInfo = new JSC3D.PickInfo;

	var canvasRect = this.canvas.getBoundingClientRect();
	var canvasX = clientX - canvasRect.left;
	var canvasY = clientY - canvasRect.top;

	pickInfo.canvasX = canvasX;
	pickInfo.canvasY = canvasY;
	
	var pickedId = 0;
	if(this.webglBackend) {
		pickedId = this.webglBackend.pick(canvasX, canvasY);
	}
	else {
		var frameX = canvasX;
		var frameY = canvasY;
		if( this.selectionBuffer != null && 
			canvasX >= 0 && canvasX < this.canvas.width && 
			canvasY >= 0 && canvasY < this.canvas.height ) {
			switch(this.definition) {
			case 'low':
				frameX = ~~(frameX / 2);
				frameY = ~~(frameY / 2);
				break;
			case 'high':
				frameX *= 2;
				frameY *= 2;
				break;
			case 'standard':
			default:
				break;
			}

			pickedId  = this.selectionBuffer[frameY * this.frameWidth + frameX];
			if(pickedId > 0)
				pickInfo.depth = this.zBuffer[frameY * this.frameWidth + frameX];
		}
	}

	if(pickedId > 0) {
		var meshes = this.scene.getChildren();
		for(var i=0; i<meshes.length; i++) {
			if(meshes[i].internalId == pickedId) {
				pickInfo.mesh = meshes[i];
				break;
			}
		}
	}

	return pickInfo;
};

/**
	Render a new frame or repaint last frame.
	@private
 */
JSC3D.Viewer.prototype.doUpdate = function() {
	this.autoRotateScene(); /* AutoRotation */
	
	//if (this.isAutoUpdateOn) this.needUpdate = true;
	
	if(this.needUpdate || this.needRepaint) {
		if(this.beforeupdate != null && (typeof this.beforeupdate) == 'function')
			this.beforeupdate();

		if(this.scene) {
			/*
			 * Render a new frame or just redraw last frame.
			 */
			if(this.needUpdate) {
				this.beginScene();
				this.render();
				this.endScene();
			}
			this.paint();
		}
		else {
			// Only need to redraw the background since there is nothing to render.
			this.drawBackground();
		}

		// clear dirty flags
		this.needRepaint = false;
		this.needUpdate = false;

		if(this.afterupdate != null && (typeof this.afterupdate) == 'function')
			this.afterupdate();
	}
};

/**
	Paint onto canvas.
	@private
 */
JSC3D.Viewer.prototype.paint = function() {
	if(this.webglBackend || !this.ctx2d)
		return;

	this.ctx2d.putImageData(this.canvasData, 0, 0);
};

/**
	The mouseDown event handling routine.
	@private
 */
JSC3D.Viewer.prototype.mouseDownHandler = function(e) {
	if(!this.isLoaded)
		return;

	if(this.onmousedown) {
		var info = this.pick(e.clientX, e.clientY);
		/* Selected mesh group name */
		this.scene.currentMesh = info.mesh;
		var groupName = info.mesh ? info.mesh.getGroupName() : null; 
		this.onmousedown(info.canvasX, info.canvasY, e.button, info.depth, info.mesh);
	}
	
	e.preventDefault();
	e.stopPropagation();

	if(!this.isDefaultInputHandlerEnabled)
		return;

	this.buttonStates[e.button] = true;
	this.mouseX = e.clientX;
	this.mouseY = e.clientY;
	this.mouseDownX = e.clientX;
	this.mouseDownY = e.clientY;
};

/**
	The mouseUp event handling routine.
	@private
 */
JSC3D.Viewer.prototype.mouseUpHandler = function(e) {
	if(!this.isLoaded)
		return;

	var info;
	if(this.onmouseup || this.onmouseclick) {
		info = this.pick(e.clientX, e.clientY);
	}

	if(this.onmouseup) {
		this.onmouseup(info.canvasX, info.canvasY, e.button, info.depth, info.mesh);
	}

	if(this.onmouseclick && this.mouseDownX == e.clientX && this.mouseDownY == e.clientY) {
		this.onmouseclick(info.canvasX, info.canvasY, e.button, info.depth, info.mesh);
		this.mouseDownX = -1;
		this.mouseDownY = -1;
	}

	e.preventDefault();
	e.stopPropagation();

	/* Modern all-in-one touch & tablet w. kb */
	this.isTouchHeld = false; 
	this.suppressDraggingRotation = false;
	
	if(!this.isDefaultInputHandlerEnabled)
		return;

	this.buttonStates[e.button] = false;
};

/* Modern all-in-one touch & tablet w. kb */
JSC3D.Viewer.prototype.mouseClickHandler = function(e) {
	if(!this.isLoaded)
		return;

	var info;
	if(this.onmouseclick && this.mouseDownX == e.clientX && this.mouseDownY == e.clientY) {
		info = this.pick(e.clientX, e.clientY);
		this.onmouseclick(info.canvasX, info.canvasY, e.button, info.depth, info.mesh);
		this.mouseDownX = -1;
		this.mouseDownY = -1;
	}

	e.preventDefault();
	e.stopPropagation();

	/* Modern all-in-one touch & tablet w. kb */
	this.isTouchHeld = false; 
	this.suppressDraggingRotation = false;
	
	if(!this.isDefaultInputHandlerEnabled)
		return;

	this.buttonStates[e.button] = false;
};
/**
	The mouseMove event handling routine.
	@private
 */
JSC3D.Viewer.prototype.mouseMoveHandler = function(e) {
	if(!this.isLoaded)
		return;

	if(this.onmousemove) {
		var info = this.pick(e.clientX, e.clientY);
		this.onmousemove(info.canvasX, info.canvasY, e.button, info.depth, info.mesh);
	}

	e.preventDefault();
	e.stopPropagation();

	if(!this.isDefaultInputHandlerEnabled)
		return;

	var isDragging = this.buttonStates[0] == true;
	var isShiftDown = this.keyStates[0x10] == true;
	var isCtrlDown = this.keyStates[0x11] == true;
	if(isDragging) {
		if((isShiftDown && this.mouseUsage == 'default') || this.mouseUsage == 'zoom') {
			this.zoomFactor *= this.mouseY <= e.clientY ? 1.04 : 0.96;
		}
		else if((isCtrlDown && this.mouseUsage == 'default') || this.mouseUsage == 'pan') {
			var ratio = (this.definition == 'low') ? 0.5 : ((this.definition == 'high') ? 2 : 1);
			this.panning[0] += ratio * (e.clientX - this.mouseX);
			this.panning[1] += ratio * (e.clientY - this.mouseY);
		}
		else if(this.mouseUsage == 'default' || this.mouseUsage == 'rotate') {
			var rotX = (e.clientY - this.mouseY) * 360 / this.canvas.width;
			var rotY = (e.clientX - this.mouseX) * 360 / this.canvas.height;
			if (this.isSceneRotationEnabled) { 
				this.rotateScene(rotY); /* Scene Rotation */
			} else {
				this.rotateAboutXAxis(rotX); /* Scene Rotation */
				this.rotateAboutYAxis(rotY); /* Scene Rotation */
			}
		}
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		this.mouseDownX = -1;
		this.mouseDownY = -1;
		this.update();
	}
};

JSC3D.Viewer.prototype.mouseWheelHandler = function(e) {
	if(!this.isLoaded)
		return;

	if(this.onmousewheel) {
		var info = this.pick(e.clientX, e.clientY);
		this.onmousewheel(info.canvasX, info.canvasY, e.button, info.depth, info.mesh);
	}

	e.preventDefault();
	e.stopPropagation();

	if(!this.isDefaultInputHandlerEnabled)
		return;

	this.mouseDownX = -1;
	this.mouseDownY = -1;

	this.zoomFactor *= (e.wheelDelta ? e.wheelDelta : e.deltaY ? -e.deltaY : -e.detail) < 0 ? 1.1 : 0.91;

	this.update();
};

/**
	The touchStart event handling routine. This is for compatibility for touch devices.
	@private
 */
JSC3D.Viewer.prototype.touchStartHandler = function(e) {
	if(!this.isLoaded)
		return;

	if(e.touches.length > 0) {
		var clientX = e.touches[0].clientX;
		var clientY = e.touches[0].clientY;

		if(this.onmousedown) {
			var info = this.pick(clientX, clientY);
			/* Selected mesh group name */
			this.scene.currentMesh = info.mesh;
			var groupName = info.mesh ? info.mesh.getGroupName() : null; 
			this.onmousedown(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
		}
		
		e.preventDefault();
		e.stopPropagation();

		if(!this.isDefaultInputHandlerEnabled)
			return;

		this.buttonStates[0] = true;
		this.mouseX = clientX;
		this.mouseY = clientY;
		this.mouseDownX = clientX;
		this.mouseDownY = clientY;
	}
};

/**
	The touchEnd event handling routine. This is for compatibility for touch devices.
	@private
 */
JSC3D.Viewer.prototype.touchEndHandler = function(e) {
	if(!this.isLoaded)
		return;

	var info;
	if(this.onmouseup || this.onmouseclick) {
		info = this.pick(this.mouseX, this.mouseY);
	}

	if(this.onmouseup) {
		this.onmouseup(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
	}

	if(this.onmouseclick && this.mouseDownX == e.touches[0].clientX && this.mouseDownY == e.touches[0].clientY) {
		this.onmouseclick(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
		this.mouseDownX = -1;
		this.mouseDownY = -1;
	}

	e.preventDefault();
	e.stopPropagation();

	if(!this.isDefaultInputHandlerEnabled)
		return;

	this.buttonStates[0] = false;
};

/**
	The touchMove event handling routine. This is for compatibility for touch devices.
	@private
 */
JSC3D.Viewer.prototype.touchMoveHandler = function(e) {
	if(!this.isLoaded)
		return;

	if(e.touches.length > 0) {
		var clientX = e.touches[0].clientX;
		var clientY = e.touches[0].clientY;

		if(this.onmousemove) {
			var info = this.pick(clientX, clientY);
			this.onmousemove(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
		}

		e.preventDefault();
		e.stopPropagation();

		if(!this.isDefaultInputHandlerEnabled)
			return;

		if(this.mouseUsage == 'zoom') {
			this.zoomFactor *= (this.mouseY <= clientY) ? 1.04 : 0.96;
		}
		else if(this.mouseUsage == 'pan') {
			var ratio = (this.definition == 'low') ? 0.5 : ((this.definition == 'high') ? 2 : 1);
			this.panning[0] += ratio * (clientX - this.mouseX);
			this.panning[1] += ratio * (clientY - this.mouseY);
		}
		else if(this.mouseUsage == 'default' || this.mouseUsage == 'rotate') {
			var rotX = (clientY - this.mouseY) * 360 / this.canvas.width;
			var rotY = (clientX - this.mouseX) * 360 / this.canvas.height;
			if (this.isSceneRotationEnabled) { 
				this.rotateScene(rotY); /* Scene Rotation */
			} else {
				this.rotateAboutXAxis(rotX); /* Scene Rotation */
				this.rotateAboutYAxis(rotY); /* Scene Rotation */
			}
		}
		this.mouseX = clientX;
		this.mouseY = clientY;
		this.mouseDownX = -1;
		this.mouseDownY = -1;

		this.update();
	}
};

/* Modern all-in-one touch & tablet w. kb */
JSC3D.Viewer.prototype.touchCancelHandler = function(e) {
	if(!this.isLoaded)
		return;

	if(e.touches.length > 0) {


		e.preventDefault();
		e.stopPropagation();

		if(!this.isDefaultInputHandlerEnabled)
			return;

		this.buttonStates[0] = false;
			
		this.mouseDownX = -1;
		this.mouseDownY = -1;

		this.update();
	}
};

/**
	The keyDown event handling routine.
	@private
 */
JSC3D.Viewer.prototype.keyDownHandler = function(e) {
	if(!this.isDefaultInputHandlerEnabled)
		return;

	this.keyStates[e.keyCode] = true;
};

/**
	The keyUp event handling routine.
	@private
 */
JSC3D.Viewer.prototype.keyUpHandler = function(e) {
	if(!this.isDefaultInputHandlerEnabled)
		return;

	this.keyStates[e.keyCode] = false;
};

/**
	The gesture event handling routine which implements gesture-based control on touch devices.
	This is based on Hammer.js gesture event implementation.
	@private
 */
JSC3D.Viewer.prototype.gestureHandler = function(e) {
	if(!this.isLoaded)
		return;

	var clientX = e.gesture.center.pageX - document.body.scrollLeft;
	var clientY = e.gesture.center.pageY - document.body.scrollTop;
	var info = this.pick(clientX, clientY);
	/* Selected mesh group name */
	var groupName = info.mesh ? info.mesh.getGroupName() : null; 

	//console.log('GESTURE EVENT Type: ' + e.type);
	switch(e.type) {
	case 'touch':
		if(this.onmousedown)
			this.onmousedown(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
		this.baseZoomFactor = this.zoomFactor;
		this.mouseX = clientX;
		this.mouseY = clientY;
		this.mouseDownX = clientX;
		this.mouseDownY = clientY;
		break;
	case 'release':
		if(this.onmouseup)
			this.onmouseup(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
		if(this.onmouseclick && this.mouseDownX == clientX && this.mouseDownY == clientY)
			this.onmouseclick(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
		this.mouseDownX = -1;
		this.mouseDownY = -1;
		this.isTouchHeld = false;
		break;
	case 'hold':
		this.isTouchHeld = true;
		this.mouseDownX = -1;
		this.mouseDownY = -1;
		break;
	case 'drag':
		if(this.onmousemove)
			this.onmousemove(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
		if(!this.isDefaultInputHandlerEnabled)
			break;
		if(this.isTouchHeld) {						// pan
			var ratio = (this.definition == 'low') ? 0.5 : ((this.definition == 'high') ? 2 : 1);
			this.panning[0] += ratio * (clientX - this.mouseX);
			this.panning[1] += ratio * (clientY - this.mouseY);
		}
		else if(!this.suppressDraggingRotation) {	// rotate
			var rotX = (clientY - this.mouseY) * 360 / this.canvas.width;
			var rotY = (clientX - this.mouseX) * 360 / this.canvas.height;
			if (this.isSceneRotationEnabled) { 
				this.rotateScene(rotY); /* Scene Rotation */
			} else {
				this.rotateAboutXAxis(rotX); /* Scene Rotation */
				this.rotateAboutYAxis(rotY); /* Scene Rotation */
			}
		}
		this.mouseX = clientX;
		this.mouseY = clientY;
		this.mouseDownX = -1;
		this.mouseDownY = -1;
		this.update();
		break;
	case 'pinch':									// zoom
		if(this.onmousewheel)
			this.onmousewheel(info.canvasX, info.canvasY, 0, info.depth, info.mesh);
		if(!this.isDefaultInputHandlerEnabled)
			break;
		this.suppressDraggingRotation = true;
		this.zoomFactor = this.baseZoomFactor * e.gesture.scale;
		this.mouseDownX = -1;
		this.mouseDownY = -1;
		this.update();
		break;
	case 'transformend':
		/*
		 * Reset the flag to enable dragging rotation again after a delay of 0.25s after the end of a zooming.
		 * This fixed unnecessary rotation at the end of a zooming when one finger has leaved the touch device 
		 * while the other still stays on it sliding.
		 * By Jeremy Ellis <jeremy.ellis@mpsd.ca>
		 */
		var self = this;
		setTimeout(function() {
			self.suppressDraggingRotation = false;
		}, 250);
		break;
	default:
		break;
	}

	e.gesture.preventDefault();
	e.gesture.stopPropagation();
};

/**
	Viewer Resize +++ 
 */
JSC3D.Viewer.prototype.resize = function() {
	var cb = this.getInnerSize();
	var w = cb[0];
	var h = cb[1];
	var oldFrameWidth = this.frameWidth, oldFrameHeight = this.frameHeight;
	
	var frameWidth = 0, frameHeight = 0;
	switch (this.definition) {
		case 'low':
			frameWidth = ~~((w + 1) / 2);
			frameHeight = ~~((h + 1) / 2);
			break;
		case 'high':
			frameWidth = w * 2;
			frameHeight = h * 2;
			break;
		case 'standard':
		default:
			frameWidth = w;
			frameHeight = h;
			break;
	}
	
	if (frameWidth != oldFrameWidth || frameHeight != oldFrameHeight) {
		this.canvas.width = w;
		this.canvas.height = h;
		var ratio = frameWidth / oldFrameWidth;
		this.zoomFactor *= ratio;
		this.panning[0] *= ratio;
		this.panning[1] *= ratio;
		this.frameWidth = frameWidth;
		this.frameHeight = frameHeight;	
		if (this.webglBackend) {
			this.webglBackend.resizeFrame(w,h);
		} else {
			if (this.ctx2d) {
				this.canvasData = this.ctx2d.getImageData(0, 0, this.canvas.width, this.canvas.height);
				var newSize = frameWidth * frameHeight;
				if(this.colorBuffer.length < newSize)
					this.colorBuffer = new Array(newSize);
				if(this.zBuffer.length < newSize)
					this.zBuffer = new Array(newSize);
				if(this.selectionBuffer.length < newSize)
					this.selectionBuffer = new Array(newSize);
				if(this.bkgColorBuffer.length < newSize)
					this.bkgColorBuffer = new Array(newSize);
			}
		}
		if (this.isLoaded) {
			this.generateBackground();
			this.needUpdate = true;
			this.doUpdate();
		}
	}
};
/* Viewer Resize --- */

/**
	Lighting
 */
JSC3D.Viewer.prototype.setup3PointLighting = function(lightingMode,showLights) {
	var greyLights = (lightingMode == 'greyscale');
	var aabb = this.scene.aabb;
	this.scene.xformMat.identity();
	this.scene.lights = [];
	var lights = [
		{position:[aabb.minX,.1*aabb.maxY,0],diffuse:(greyLights) ? 0x444444 : 0xFF0000,enabled: true}, // Key light
		{position:[0,.5*aabb.maxY,aabb.maxZ],diffuse:(greyLights) ? 0x666666 : 0x00FF00,enabled: true}, // Fill light
		{position:[aabb.maxX,aabb.maxY,aabb.minZ],diffuse:(greyLights) ? 0xCBCBCB : 0x0000FF,enabled: true}, // Back light
		];
	for(var i=0, l=lights.length; i<l; i++) {
		var lightVisible = (lights[i].enabled && showLights);
		var lightEnabled = (lights[i].enabled && lightingMode != 'standard');
		this.scene.addLight(lights[i].position[0], lights[i].position[1], lights[i].position[2], lights[i].ambient, lights[i].diffuse, lightEnabled, lightVisible);
	}
};

JSC3D.Viewer.prototype.rotateLights = function() {
	if (!this.scene) return;

	var light = this.scene.getMeshes('light-1')[0];
	light.rotate([0,1,0]);
	var meshCenter = light.aabb.center();
	this.scene.lights[0].position = [meshCenter[0],meshCenter[1],meshCenter[2]];
	this.scene.lights[0].compiled = null;
	
	var light = this.scene.getMeshes('light-2')[0];
	light.rotate([0,1,0]);
	var meshCenter = light.aabb.center();
	this.scene.lights[1].position = [meshCenter[0],meshCenter[1],meshCenter[2]];
	this.scene.lights[1].compiled = null;

	var light = this.scene.getMeshes('light-3')[0];
	light.rotate([0,0,1]);
	var meshCenter = light.aabb.center();
	this.scene.lights[2].position = [meshCenter[0],meshCenter[1],meshCenter[2]];
	this.scene.lights[2].compiled = null;
	
	this.needUpdate = true;
};

/**
	Internally load a scene.
	@private
 */
JSC3D.Viewer.prototype.loadScene = function() {
	// terminate current loading if it is not finished yet
	if(this.abortUnfinishedLoadingFn)
		this.abortUnfinishedLoadingFn();

	this.scene = null;
	this.isLoaded = false;

	this.update();

	if(this.sceneUrl == '')
		return false;


	/*
	 * Discard the query part of the URL string, if any, to get the correct file name.
	 * By negatif@gmail.com
	 */
	var questionMarkAt = this.sceneUrl.indexOf('?');
	var sceneUrlNoQuery = questionMarkAt == -1 ? this.sceneUrl : this.sceneUrl.substring(0, questionMarkAt);

	var lastSlashAt = sceneUrlNoQuery.lastIndexOf('/');
	if(lastSlashAt == -1)
		lastSlashAt = sceneUrlNoQuery.lastIndexOf('\\');
	
	var fileName = sceneUrlNoQuery.substring(lastSlashAt + 1);
	var lastDotAt = fileName.lastIndexOf('.');
	if(lastDotAt == -1) {
		if(JSC3D.console)
			JSC3D.console.logError('Cannot get file format for the lack of file extension.');
		return false;
	}

	var fileExtName = fileName.substring(lastDotAt + 1);
	var loader = JSC3D.LoaderSelector.getLoader(fileExtName);
	if(!loader) {
		if(JSC3D.console)
			JSC3D.console.logError('Unsupported file format: "' + fileExtName + '".');
		return false;
	}

	var self = this;

	loader.onload = function(scene) {
		self.abortUnfinishedLoadingFn = null;
		self.setupScene(scene);
		if(self.onloadingcomplete && (typeof self.onloadingcomplete) == 'function')
			self.onloadingcomplete();
	};

	loader.onerror = function(errorMsg) {
		self.scene = null;
		self.isLoaded = false;
		self.isFailed = true;
		self.abortUnfinishedLoadingFn = null;
		self.update();
		self.reportError(errorMsg);
		if(self.onloadingerror && (typeof self.onloadingerror) == 'function')
			self.onloadingerror(errorMsg);
	};

	loader.onprogress = function(task, prog) {
		if(self.showProgressBar)
			self.reportProgress(task, prog);
		if(self.onloadingprogress && (typeof self.onloadingprogress) == 'function')
			self.onloadingprogress(task, prog);
	};

	loader.onresource = function(resource) {
		if((resource instanceof JSC3D.Texture) && self.isMipMappingOn && !resource.hasMipmap())
			resource.generateMipmaps();		
		self.update();
	};

	this.abortUnfinishedLoadingFn = function() {
		loader.abort();
		self.abortUnfinishedLoadingFn = null;
		self.hideProgress();
		if(self.onloadingaborted && (typeof self.onloadingaborted) == 'function')
			self.onloadingaborted();
	};

	loader.loadFromUrl(this.sceneUrl);

	if(this.onloadingstarted && (typeof this.onloadingstarted) == 'function')
		this.onloadingstarted();

	return true;
};

/**
	Prepare for rendering of a new scene.
	@private
 */
JSC3D.Viewer.prototype.setupScene = function(scene) {
	// crease-angle should be applied onto each mesh before their initialization
	if(this.creaseAngle >= 0) {
		var cAngle = this.creaseAngle;
		scene.forEachChild(function(mesh) {
			mesh.creaseAngle = cAngle;
		});
	}

	scene.init();
	
	if(scene.aabb) {  /* Setup an initial empty scene with given extent */
		var d = scene.aabb.lengthOfDiagonal();
		var w = this.frameWidth;
		var h = this.frameHeight;
		this.zoomFactor = (d == 0) ? 1 : (w < h ? w : h) / d;
		this.panning = [0, 0];
	}

	this.rotMatrix.identity();
	this.sceneRotation = 0; /* Scene Rotation */
	this.rotateAboutXAxis(this.initRotX); /* Scene Rotation */
	this.rotateAboutYAxis(this.initRotY); /* Scene Rotation */
	this.rotateAboutZAxis(this.initRotZ); /* Scene Rotation */
	this.rotateScene(this.initSceneRotation); /* Scene Rotation */
	this.scene = scene;

	/* Lighting +++ */
	this.scene.rotMat.copy(this.rotMatrix);
	this.scene.isLightingOn = (this.lightingMode != 'standard');
	this.setup3PointLighting(this.lightingMode, this.showLights); 
	/* Lighting --- */
	
	this.isLoaded = true;
	this.isFailed = false;
	this.needUpdate = false;
	this.needRepaint = false;
	this.update();
	this.hideProgress();
	this.hideError();
};

/**
	Show progress with information on current time-cosuming task.
	@param {String} task text information about current task.
	@param {Number} progress progress of current task. this should be a number between 0 and 1.
 */
JSC3D.Viewer.prototype.reportProgress = function(task, progress) {
	if(!this.progressFrame) {
		var canvasRect = this.canvas.getBoundingClientRect();

		var r = 255 - ((this.bkgColor1 & 0xff0000) >> 16);
		var g = 255 - ((this.bkgColor1 & 0xff00) >> 8);
		var b = 255 - (this.bkgColor1 & 0xff);
		var color = 'rgb(' + r + ',' + g + ',' + b + ')';

		var barX = window.pageXOffset + canvasRect.left + 40;
		var barY = window.pageYOffset + canvasRect.top  + canvasRect.height * 0.38;
		var barWidth = canvasRect.width - (barX - canvasRect.left) * 2;
		var barHeight = 20;

		this.progressFrame = document.createElement('div');
		this.progressFrame.style.position = 'absolute';
		this.progressFrame.style.left   = barX + 'px';
		this.progressFrame.style.top    = barY + 'px';
		this.progressFrame.style.width  = barWidth + 'px';
		this.progressFrame.style.height = barHeight + 'px';
		this.progressFrame.style.border = '1px solid ' + color;
		this.progressFrame.style.pointerEvents = 'none';
		document.body.appendChild(this.progressFrame);

		this.progressRectangle = document.createElement('div');
		this.progressRectangle.style.position = 'absolute';
		this.progressRectangle.style.left   = (barX + 3) + 'px';
		this.progressRectangle.style.top    = (barY + 3) + 'px';
		this.progressRectangle.style.width  = '0px';
		this.progressRectangle.style.height = (barHeight - 4) + 'px';
		this.progressRectangle.style.background = color;
		this.progressRectangle.style.pointerEvents = 'none';
		document.body.appendChild(this.progressRectangle);

		if(!this.messagePanel) {
			this.messagePanel = document.createElement('div');
			this.messagePanel.style.position = 'absolute';
			this.messagePanel.style.left   = barX + 'px';
			this.messagePanel.style.top    = (barY - 16) + 'px';
			this.messagePanel.style.width  = barWidth + 'px';
			this.messagePanel.style.height = '14px';
			this.messagePanel.style.font   = 'bold 14px Courier New';
			this.messagePanel.style.color  = color;
			this.messagePanel.style.pointerEvents = 'none';
			document.body.appendChild(this.messagePanel);
		}
	}

	if(this.progressFrame.style.display != 'block') {
		this.progressFrame.style.display = 'block';
		this.progressRectangle.style.display = 'block';
	}
	if(task && this.messagePanel.style.display != 'block')
		this.messagePanel.style.display = 'block';

	this.progressRectangle.style.width = (parseFloat(this.progressFrame.style.width) - 4) * progress + 'px';
	this.messagePanel.innerHTML = task;
};

/**
	Hide the progress bar.
	@private
 */
JSC3D.Viewer.prototype.hideProgress = function() {
	if(this.progressFrame) {
		this.messagePanel.style.display = 'none';
		this.progressFrame.style.display = 'none';
		this.progressRectangle.style.display = 'none';
	}
};

/**
	Show information about a fatal error.
	@param {String} message text information about this error.
 */
JSC3D.Viewer.prototype.reportError = function(message) {
	if(!this.messagePanel) {
		var canvasRect = this.canvas.getBoundingClientRect();

		var r = 255 - ((this.bkgColor1 & 0xff0000) >> 16);
		var g = 255 - ((this.bkgColor1 & 0xff00) >> 8);
		var b = 255 - (this.bkgColor1 & 0xff);
		var color = 'rgb(' + r + ',' + g + ',' + b + ')';

		var panelX = window.pageXOffset + canvasRect.left + 40;
		var panelY = window.pageYOffset + canvasRect.top  + canvasRect.height * 0.38;
		var panelWidth = canvasRect.width - (panelX - canvasRect.left) * 2;
		var panelHeight = 14;

		this.messagePanel = document.createElement('div');
		this.messagePanel.style.position = 'absolute';
		this.messagePanel.style.left   = panelX + 'px';
		this.messagePanel.style.top    = (panelY - 16) + 'px';
		this.messagePanel.style.width  = panelWidth + 'px';
		this.messagePanel.style.height = panelHeight + 'px';
		this.messagePanel.style.font   = 'bold 14px Courier New';
		this.messagePanel.style.color  = color;
		this.messagePanel.style.pointerEvents = 'none';
		document.body.appendChild(this.messagePanel);
	}

	// hide the progress bar if it is visible
	if(this.progressFrame.style.display != 'none') {
		this.progressFrame.style.display = 'none';
		this.progressRectangle.style.display = 'none';
	}

	if(message && this.messagePanel.style.display != 'block')
		this.messagePanel.style.display = 'block';

	this.messagePanel.innerHTML = message;
};

/**
	Hide the error message.
	@private
 */
JSC3D.Viewer.prototype.hideError = function() {
	if(this.messagePanel)
		this.messagePanel.style.display = 'none';
};

/**
	Fill the background color buffer.
	@private
 */
JSC3D.Viewer.prototype.generateBackground = function() {
	if(this.webglBackend) {
		if(this.bkgImage)
			this.webglBackend.setBackgroundImage(this.bkgImage);
		else
			this.webglBackend.setBackgroundColors(this.bkgColor1, this.bkgColor2);
		return;
	}

	if(this.bkgImage)
		this.fillBackgroundWithImage();
	else
		this.fillGradientBackground();
};

/**
	Do fill the background color buffer with gradient colors.
	@private
 */
JSC3D.Viewer.prototype.fillGradientBackground = function() {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var pixels = this.bkgColorBuffer;

	var r1 = (this.bkgColor1 & 0xff0000) >> 16;
	var g1 = (this.bkgColor1 & 0xff00) >> 8;
	var b1 = this.bkgColor1 & 0xff;
	var r2 = (this.bkgColor2 & 0xff0000) >> 16;
	var g2 = (this.bkgColor2 & 0xff00) >> 8;
	var b2 = this.bkgColor2 & 0xff;

	var alpha = this.isBackgroundOn ? 0xff000000 : 0;

	var pix = 0;
	for(var i=0; i<h; i++) {
		var r = (r1 + i * (r2 - r1) / h) & 0xff;
		var g = (g1 + i * (g2 - g1) / h) & 0xff;
		var b = (b1 + i * (b2 - b1) / h) & 0xff;

		for(var j=0; j<w; j++) {
			pixels[pix++] = alpha | r << 16 | g << 8 | b;
		}
	}
};

/**
	Do fill the background color buffer with a loaded image.
	@private
 */
JSC3D.Viewer.prototype.fillBackgroundWithImage = function() {
	var w = this.frameWidth;
	var h = this.frameHeight;	
	if(this.bkgImage.width <= 0 || this.bkgImage.height <= 0)
		return;

	var isCanvasClean = false;
	var canvas = JSC3D.Texture.cv;
	if(!canvas) {
		try {
			canvas = document.createElement('canvas');
			JSC3D.Texture.cv = canvas;
			isCanvasClean = true;
		}
		catch(e) {
			return;
		}
	}

	if(canvas.width != w || canvas.height != h) {
		canvas.width = w;
		canvas.height = h;
		isCanvasClean = true;
	}

	var data = null;
	try {
		var ctx = canvas.getContext('2d');
		if(!isCanvasClean)
			ctx.clearRect(0, 0, w, h);
		ctx.drawImage(this.bkgImage, 0, 0, w, h);
		var imgData = ctx.getImageData(0, 0, w, h);
		data = imgData.data;
	}
	catch(e) {
		return;
	}

	var pixels = this.bkgColorBuffer;
	var size = w * h;
	var alpha = this.isBackgroundOn ? 0xff000000 : 0;
	for(var i=0, j=0; i<size; i++, j+=4) {
		pixels[i] = alpha | data[j] << 16 | data[j+1] << 8 | data[j+2];
	}
};

/**
	Draw background onto canvas.
	@private
 */
JSC3D.Viewer.prototype.drawBackground = function() {
	if(!this.webglBackend && !this.ctx2d)
		return;

	this.beginScene();
	this.endScene();

	this.paint();
};

/**
	Begin to render a new frame.
	@private
 */
JSC3D.Viewer.prototype.beginScene = function() {
	var w = this.frameWidth, h = this.frameHeight;
	if(this.webglBackend) {
		this.webglBackend.beginFrame(this.definition, this.isBackgroundOn, w, h);
		return;
	}

	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var bbuf = this.bkgColorBuffer;
	var size = this.frameWidth * this.frameHeight;
	var MIN_Z = -Infinity;

	for(var i=0; i<size; i++) {
		cbuf[i] = bbuf[i];
		zbuf[i] = MIN_Z;
		sbuf[i] = 0;
	}
	
};

/**
	End for rendering of a frame.
	@private
 */
JSC3D.Viewer.prototype.endScene = function() {
	if(this.webglBackend) {
		this.webglBackend.endFrame();
		return;
	}

	var data = this.canvasData.data;
	var width = this.canvas.width;
	var height = this.canvas.height;
	var cbuf = this.colorBuffer;
	var cwidth = this.frameWidth;
	var cheight = this.frameHeight;
	var csize = cwidth * cheight;

	switch(this.definition) {
	case 'low':
		var halfWidth = width >> 1;
		var surplus = cwidth - halfWidth;
		var src = 0, dest = 0;
		for(var i=0; i<height; i++) {
			for(var j=0; j<width; j++) {
				var color = cbuf[src];
				data[dest    ] = (color & 0xff0000) >> 16;
				data[dest + 1] = (color & 0xff00) >> 8;
				data[dest + 2] = color & 0xff;
				data[dest + 3] = color >>> 24;
				src += (j & 1);
				dest += 4;
			}
			src += (i & 1) ? surplus : -halfWidth;
		}
		break;
	case 'high':
		var src = 0, dest = 0;
		for(var i=0; i<height; i++) {
			for(var j=0; j<width; j++) {
				var color0 = cbuf[src];
				var color1 = cbuf[src + 1];
				var color2 = cbuf[src + cwidth];
				var color3 = cbuf[src + cwidth + 1];
				data[dest    ] = ((color0 & 0xff0000) + (color1 & 0xff0000) + (color2 & 0xff0000) + (color3 & 0xff0000)) >> 18;
				data[dest + 1] = ((color0 & 0xff00) + (color1 & 0xff00) + (color2 & 0xff00) + (color3 & 0xff00)) >> 10;
				data[dest + 2] = ((color0 & 0xff) + (color1 & 0xff) + (color2 & 0xff) + (color3 & 0xff)) >> 2;
				data[dest + 3] = color0 >>> 24;
				src += 2;
				dest += 4;
			}
			src += cwidth;
		}
		break;
	case 'standard':
	default:
		for(var src=0, dest=0; src<csize; src++, dest+=4) {
			var color = cbuf[src];
			data[dest    ] = (color & 0xff0000) >> 16;
			data[dest + 1] = (color & 0xff00) >> 8;
			data[dest + 2] = color & 0xff;
			data[dest + 3] = color >>> 24;
		}
		break;
	}
};

/**
	Render a new frame.
	@private
 */
JSC3D.Viewer.prototype.render = function() {
	if(this.scene.isEmpty())
		return;

	var w = this.frameWidth;
	var h = this.frameHeight;
	var aabb = this.scene.aabb;
	var d = aabb.lengthOfDiagonal();
	
	// calculate transformation matrix
	if(this.webglBackend) {
		/* TODO v2: fix meshes goes sometimes clipped in Z+ */
		this.transformMatrix.identity();
		this.transformMatrix.translate(-0.5*(aabb.minX+aabb.maxX), -0.5*(aabb.minY+aabb.maxY), -0.5*(aabb.minZ+aabb.maxZ));
		this.transformMatrix.multiply(this.rotMatrix);
		this.transformMatrix.scale(2*this.zoomFactor/w, 2*this.zoomFactor/h, -2/d);
		this.transformMatrix.translate(2*this.panning[0]/w, -2*this.panning[1]/h, 0);
	}
	else {
		this.transformMatrix.identity();
		this.transformMatrix.translate(-0.5*(aabb.minX+aabb.maxX), -0.5*(aabb.minY+aabb.maxY), -0.5*(aabb.minZ+aabb.maxZ));
		this.transformMatrix.multiply(this.rotMatrix);
		this.transformMatrix.scale(this.zoomFactor, -this.zoomFactor, this.zoomFactor);
		this.transformMatrix.translate(0.5*w+this.panning[0], 0.5*h+this.panning[1], 0);
	}
	
	/* Lighting +++ */
	if(this.webglBackend) {
		this.scene.xformMat.identity();
		this.scene.xformMat.translate(-0.5*(aabb.minX+aabb.maxX), -0.5*(aabb.minY+aabb.maxY), -0.5*(aabb.minZ+aabb.maxZ));
		this.scene.xformMat.multiply(this.scene.rotMat);
		this.scene.xformMat.scale(2*this.zoomFactor/w, 2*this.zoomFactor/h, -2/d);
		this.scene.xformMat.translate(2*this.panning[0]/w, -2*this.panning[1]/h, 0);
	}
	else {
		this.scene.xformMat.identity();
		this.scene.xformMat.translate(-0.5*(aabb.minX+aabb.maxX), -0.5*(aabb.minY+aabb.maxY), -0.5*(aabb.minZ+aabb.maxZ));
		this.scene.xformMat.multiply(this.scene.rotMat);
		this.scene.xformMat.scale(this.zoomFactor, -this.zoomFactor, this.zoomFactor);
		this.scene.xformMat.translate(0.5*w+this.panning[0], 0.5*h+this.panning[1], 0);
	}
	for(var i=0,l= this.scene.lights.length; i<l; i++) {
		JSC3D.Math3D.transformVectors(this.scene.xformMat, this.scene.lights[i].position, this.scene.lights[i].transformedPosition);
	}
	/* Lighting --- */

	// sort meshes into a render list
	var renderList = this.sortScene(this.transformMatrix);

	// delegate to WebGL backend to do the rendering
	if(this.webglBackend) {
		this.webglBackend.render(this.scene.getChildren(), this.scene.lights, this.scene.xformMat, this.scene.rotMat, this.transformMatrix, this.rotMatrix, this.renderMode, this.defaultMaterial, this.sphereMap, this.isCullingDisabled);
		return;
	}

	// transform and render meshes inside the scene
	for(var i=0; i<renderList.length; i++) {
		var mesh = renderList[i];

		if(!mesh.isTrivial()) {
			/* Lighting */
			if (mesh.isPositionFixed) {
				JSC3D.Math3D.transformVectors(this.scene.xformMat, mesh.vertexBuffer, mesh.transformedVertexBuffer);
			} else {
				JSC3D.Math3D.transformVectors(this.transformMatrix, mesh.vertexBuffer, mesh.transformedVertexBuffer);
			}

			if(mesh.visible) {
				switch(mesh.renderMode || this.renderMode) {
				case 'point':
					this.renderPoint(mesh);
					break;
				case 'wireframe':
					this.renderWireframe(mesh);
					break;
				case 'flat':
					this.renderSolidFlat(mesh);
					break;
				case 'smooth':
					this.renderSolidSmooth(mesh);
					break;
				case 'texture':
					if(mesh.hasTexture())
						this.renderSolidTexture(mesh);
					else
						this.renderSolidFlat(mesh);
					break;
				case 'textureflat':
					if(mesh.hasTexture())
						this.renderTextureFlat(mesh);
					else
						this.renderSolidFlat(mesh);
					break;
				case 'texturesmooth':
					var matEnvCast = (mesh.material) ? mesh.material.isEnvironmentCast : false; /* EnvironmentCast of Material */
					var texEnvCast = (mesh.texture) ? mesh.texture.isEnvironmentCast : false; /* EnvironmentCast of Texture */
					var environmentCast = matEnvCast || texEnvCast;
					if(environmentCast && this.sphereMap != null && this.sphereMap.hasData())
						this.renderSolidSphereMapped(mesh);
					else if(mesh.hasTexture())
						this.renderTextureSmooth(mesh);
					else
						this.renderSolidSmooth(mesh);
					break;
				default:
					this.renderSolidFlat(mesh);
					break;
				}
			}
		}
	}
};

/**
	Sort meshes inside the scene into a render list. The sorting criterion is a mixture of trnasparency and depth.
	This routine is necessary to ensure a correct rendering order. It also helps to reduce fill rate.
	@private
 */
JSC3D.Viewer.prototype.sortScene = function(mat) {
	var renderList = [];

	var meshes = this.scene.getChildren();
	for(var i=0; i<meshes.length; i++) {
		var mesh = meshes[i];
		if(!mesh.isTrivial()) {
			renderList.push(mesh);
			var meshCenter = mesh.aabb.center();
			JSC3D.Math3D.transformVectors(mat, meshCenter, meshCenter);
			var meshMaterial = mesh.material ? mesh.material : this.defaultMaterial;
			mesh.sortKey = { 
				depth: meshCenter[2], 
				isTransparnt: (meshMaterial.transparency > 0) || (mesh.hasTexture() ? mesh.texture.hasTransparency : false)
			};
		}
	}

	renderList.sort( 
		function(mesh0, mesh1) {
			// opaque meshes should always be prior to transparent ones to be rendered
			if(!mesh0.sortKey.isTransparnt && mesh1.sortKey.isTransparnt)
				return -1;

			// opaque meshes should always be prior to transparent ones to be rendered
			if(mesh0.sortKey.isTransparnt && !mesh1.sortKey.isTransparnt)
				return 1;

			// transparent meshes should be rendered from far to near
			if(mesh0.sortKey.isTransparnt)
				return mesh0.sortKey.depth - mesh1.sortKey.depth;

			// opaque meshes should be rendered form near to far
			return mesh1.sortKey.depth - mesh0.sortKey.depth;
	} );

	return renderList;
};

/**
	Render the given mesh as points.
	@private
 */
JSC3D.Viewer.prototype.renderPoint = function(mesh) {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var xbound = w - 1;
	var ybound = h - 1;
//	var ibuf = mesh.indexBuffer;
	var vbuf = mesh.transformedVertexBuffer;
//	var nbuf = mesh.transformedVertexNormalZBuffer;
	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var numOfVertices = vbuf.length / 3;
	var id = mesh.internalId;
	var color = 0xff000000 | (mesh.material ? mesh.material.diffuseColor : this.defaultMaterial.diffuseColor);
	
//	if(!nbuf || nbuf.length < numOfVertices) {
//		mesh.transformedVertexNormalZBuffer = new Array(numOfVertices);
//		nbuf = mesh.transformedVertexNormalZBuffer;
//	}

//	JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.vertexNormalBuffer, nbuf);

	for(var i=0, j=0; i<numOfVertices; i++, j+=3) {
//		var xformedNz = nbuf[i];
//		if(mesh.isDoubleSided)
//			xformedNz = xformedNz > 0 ? xformedNz : -xformedNz;
//		if(xformedNz > 0) {
			var x = ~~(vbuf[j    ] + 0.5);
			var y = ~~(vbuf[j + 1] + 0.5);
			var z = vbuf[j + 2];
			if(x >=0 && x < xbound && y >=0 && y < ybound) {
				var pix = y * w + x;
				if(z > zbuf[pix]) {
					zbuf[pix] = z;
					cbuf[pix] = color;
					sbuf[pix] = id;
				}
				pix++;
				if(z > zbuf[pix]) {
					zbuf[pix] = z;
					cbuf[pix] = color;
					sbuf[pix] = id;
				}
				pix += xbound;
				if(z > zbuf[pix]) {
					zbuf[pix] = z;
					cbuf[pix] = color;
					sbuf[pix] = id;
				}
				pix++;
				if(z > zbuf[pix]) {
					zbuf[pix] = z;
					cbuf[pix] = color;
					sbuf[pix] = id;
				}
			}
//		}
	}
};

/**
	Render the given mesh as wireframe.
	@private
 */
JSC3D.Viewer.prototype.renderWireframe = function(mesh) {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var xbound = w - 1;
	var ybound = h - 1;
	var ibuf = mesh.indexBuffer;
	var vbuf = mesh.transformedVertexBuffer;
	var nbuf = mesh.transformedFaceNormalZBuffer;
	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var numOfFaces = mesh.faceCount;
	var id = mesh.internalId;
	var color = 0xff000000 | (mesh.material ? mesh.material.diffuseColor : this.defaultMaterial.diffuseColor);
	var drawBothSides = mesh.isDoubleSided || this.isCullingDisabled;

	if(!nbuf || nbuf.length < numOfFaces) {
		mesh.transformedFaceNormalZBuffer = new Array(numOfFaces);
		nbuf = mesh.transformedFaceNormalZBuffer;
	}

	/* Lighting */
	if (mesh.isPositionFixed) {
		nbuf = mesh.faceNormalBuffer;
	} else {
		JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.faceNormalBuffer, nbuf);
	}

	var i = 0, j = 0;
	while(i < numOfFaces) {
		var xformedNz = nbuf[i++];
		if(drawBothSides)
			xformedNz = xformedNz > 0 ? xformedNz : -xformedNz;
		if(xformedNz < 0) {
			do {
			} while (ibuf[j++] != -1);
		}
		else {
			var vStart, v0, v1;
			v0 = ibuf[j++] * 3;
			v1 = ibuf[j++] * 3;
			vStart = v0;

			var isClosed = false;
			while(!isClosed) {
				var x0 = ~~(vbuf[v0    ] + 0.5);
				var y0 = ~~(vbuf[v0 + 1] + 0.5);
				var z0 = vbuf[v0 + 2];
				var x1 = ~~(vbuf[v1    ] + 0.5);
				var y1 = ~~(vbuf[v1 + 1] + 0.5);
				var z1 = vbuf[v1 + 2];

				var dx = x1 - x0;
				var dy = y1 - y0;
				var dz = z1 - z0;

				var dd;
				var xInc, yInc, zInc;
				if(Math.abs(dx) > Math.abs(dy)) {
					dd = dx;
					xInc = dx > 0 ? 1 : -1;
					yInc = dx != 0 ? xInc * dy / dx : 0;
					zInc = dx != 0 ? xInc * dz / dx : 0;
				}
				else {
					dd = dy;
					yInc = dy > 0 ? 1 : -1;
					xInc = dy != 0 ? yInc * dx / dy : 0;
					zInc = dy != 0 ? yInc * dz / dy : 0;
				}

				var x = x0;
				var y = y0;
				var z = z0;

				if(dd < 0) {
					x = x1;
					y = y1;
					z = z1;
					dd = -dd;
					xInc = -xInc;
					yInc = -yInc;
					zInc = -zInc;
				}

				for(var k=0; k<dd; k++) {
					if(x >=0 && x < xbound && y >=0 && y < ybound) {
						var pix = (~~y) * w + (~~x);
						if(z > zbuf[pix]) {
							zbuf[pix] = z;
							cbuf[pix] = color;
							sbuf[pix] = id;
						}
					}

					x += xInc;
					y += yInc;
					z += zInc;
				}

				if(v1 == vStart) {
					isClosed = true;
				}
				else {
					v0 = v1;

					if(ibuf[j] != -1) {
						v1 = ibuf[j++] * 3;
					}
					else {
						v1 = vStart;
					}
				}
			}

			j++;
		}
	}
};

/**
	Render the given mesh as solid object, using flat shading.
	@private
 */
JSC3D.Viewer.prototype.renderSolidFlat = function(mesh) {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var ibuf = mesh.indexBuffer;
	var vbuf = mesh.transformedVertexBuffer;
	var nbuf = mesh.transformedFaceNormalZBuffer;
	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var numOfFaces = mesh.faceCount;
	var id = mesh.internalId;
	var material = mesh.material ? mesh.material : this.defaultMaterial;
	var palette = material.getPalette();
	var isOpaque = material.transparency == 0;
	var trans = ~~(material.transparency * 255);
	var opaci = 255 - trans;
	var drawBothSides = mesh.isDoubleSided || this.isCullingDisabled;

	/*
	 * This single line removes some weird error related to floating point calculation on Safari for Apple computers.
	 * See http://code.google.com/p/jsc3d/issues/detail?id=8.
	 * By Vasile Dirla <vasile@dirla.ro>.
	 */
	var fixForMacSafari = 1 * null;

	// skip this mesh if it is completely transparent
	if(material.transparency == 1)
		return;

	if(!nbuf || nbuf.length < numOfFaces) {
		mesh.transformedFaceNormalZBuffer = new Array(numOfFaces);
		nbuf = mesh.transformedFaceNormalZBuffer;
	}

	JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.faceNormalBuffer, nbuf);

	var Xs = new Array(3);
	var Ys = new Array(3);
	var Zs = new Array(3);
	var i = 0, j = 0;
	while(i < numOfFaces) {
		var xformedNz = nbuf[i++];
		if(drawBothSides)
			xformedNz = xformedNz > 0 ? xformedNz : -xformedNz;
		if(xformedNz < 0) {
			do {
			} while (ibuf[j++] != -1);
		}
		else {
			var color = 0xff000000 | palette[~~(xformedNz * 255)];

			var v0, v1, v2;
			v0 = ibuf[j++] * 3;
			v1 = ibuf[j++] * 3;

			do {
				v2 = ibuf[j++] * 3;

				Xs[0] = ~~(vbuf[v0    ] + 0.5);
				Ys[0] = ~~(vbuf[v0 + 1] + 0.5);
				Zs[0] = vbuf[v0 + 2];
				Xs[1] = ~~(vbuf[v1    ] + 0.5);
				Ys[1] = ~~(vbuf[v1 + 1] + 0.5);
				Zs[1] = vbuf[v1 + 2];
				Xs[2] = ~~(vbuf[v2    ] + 0.5);
				Ys[2] = ~~(vbuf[v2 + 1] + 0.5);
				Zs[2] = vbuf[v2 + 2];

				var high = Ys[0] < Ys[1] ? 0 : 1;
				high = Ys[high] < Ys[2] ? high : 2;
				var low = Ys[0] > Ys[1] ? 0 : 1;
				low = Ys[low] > Ys[2] ? low : 2;
				var mid = 3 - low - high;

				if(high != low) {
					var x0 = Xs[low];
					var z0 = Zs[low];
					var dy0 = Ys[low] - Ys[high];
					dy0 = dy0 != 0 ? dy0 : 1;
					var xStep0 = (Xs[low] - Xs[high]) / dy0;
					var zStep0 = (Zs[low] - Zs[high]) / dy0;

					var x1 = Xs[low];
					var z1 = Zs[low];
					var dy1 = Ys[low] - Ys[mid];
					dy1 = dy1 != 0 ? dy1 : 1;
					var xStep1 = (Xs[low] - Xs[mid]) / dy1;
					var zStep1 = (Zs[low] - Zs[mid]) / dy1;

					var x2 = Xs[mid];
					var z2 = Zs[mid];
					var dy2 = Ys[mid] - Ys[high];
					dy2 = dy2 != 0 ? dy2 : 1;
					var xStep2 = (Xs[mid] - Xs[high]) / dy2;
					var zStep2 = (Zs[mid] - Zs[high]) / dy2;

					var linebase = Ys[low] * w;
					for(var y=Ys[low]; y>Ys[high]; y--) {
						if(y >=0 && y < h) {
							var xLeft = ~~x0;
							var zLeft = z0;
							var xRight, zRight;
							if(y > Ys[mid]) {
								xRight = ~~x1;
								zRight = z1;
							}
							else {
								xRight = ~~x2;
								zRight = z2;
							}

							if(xLeft > xRight) {
								var temp;
								temp = xLeft;
								xLeft = xRight;
								xRight = temp;
								temp = zLeft;
								zLeft = zRight;
								zRight = temp;
							}

							if(xLeft < 0)
								xLeft = 0;
							if(xRight >= w)
								xRight = w - 1;

							var zInc = (xLeft != xRight) ? ((zRight - zLeft) / (xRight - xLeft)) : 1;
							var pix = linebase + xLeft;
							if(isOpaque) {
								for(var x=xLeft, z=zLeft; x<=xRight; x++, z+=zInc) {
									if(z > zbuf[pix]) {
										zbuf[pix] = z;
										cbuf[pix] = color;
										sbuf[pix] = id;
									}
									pix++;
								}
							}
							else {
								for(var x=xLeft, z=zLeft; x<xRight; x++, z+=zInc) {
									if(z > zbuf[pix]) {
										var foreColor = color;
										var backColor = cbuf[pix];
										var rr = ((backColor & 0xff0000) * trans + (foreColor & 0xff0000) * opaci) >> 8;
										var gg = ((backColor & 0xff00) * trans + (foreColor & 0xff00) * opaci) >> 8;
										var bb = ((backColor & 0xff) * trans + (foreColor & 0xff) * opaci) >> 8;
										var aa = (backColor & 0xff000000) | (opaci << 24);
										cbuf[pix] = aa | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
						}

						// step up to next scanline
						//
						x0 -= xStep0;
						z0 -= zStep0;
						if(y > Ys[mid]) {
							x1 -= xStep1;
							z1 -= zStep1;
						}
						else {
							x2 -= xStep2;
							z2 -= zStep2;
						}
						linebase -= w;
					}
				}

				v1 = v2;
			} while (ibuf[j] != -1);

			j++;
		}
	}
};

/**
	Render the given mesh as solid object, using smooth shading.
	@private
 */
JSC3D.Viewer.prototype.renderSolidSmooth = function(mesh) {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var ibuf = mesh.indexBuffer;
	var vbuf = mesh.transformedVertexBuffer;
	var vnbuf = mesh.transformedVertexNormalZBuffer;
	var vnibuf = mesh.vertexNormalIndexBuffer ? mesh.vertexNormalIndexBuffer : mesh.indexBuffer;
	var fnbuf = mesh.transformedFaceNormalZBuffer;
	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var numOfFaces = mesh.faceCount;
	var numOfVertices = vbuf.length / 3;
	var id = mesh.internalId;
	var material = mesh.material ? mesh.material : this.defaultMaterial;
	var palette = material.getPalette();
	var isOpaque = material.transparency == 0;
	var trans = ~~(material.transparency * 255);
	var opaci = 255 - trans;
	var drawBothSides = mesh.isDoubleSided || this.isCullingDisabled;

	// fix for http://code.google.com/p/jsc3d/issues/detail?id=8
	// By Vasile Dirla <vasile@dirla.ro>.
	var fixForMacSafari = 1 * null;

	// skip this mesh if it is completely transparent
	if(material.transparency == 1)
		return;

	if(!vnbuf || vnbuf.length < mesh.vertexNormalBuffer.length/3) {
		mesh.transformedVertexNormalZBuffer = new Array(mesh.vertexNormalBuffer.length / 3);
		vnbuf = mesh.transformedVertexNormalZBuffer;
	}

	if(!fnbuf || fnbuf.length < numOfFaces) {
		mesh.transformedFaceNormalZBuffer = new Array(numOfFaces);
		fnbuf = mesh.transformedFaceNormalZBuffer;
	}

	/* Lighting */
	if (mesh.isPositionFixed) {
		vnbuf = mesh.vertexNormalBuffer;
		fnbuf = mesh.faceNormalBuffer;
	} else {
		JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.vertexNormalBuffer, vnbuf);
		JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.faceNormalBuffer, fnbuf);
	}
	
	var Xs = new Array(3);
	var Ys = new Array(3);
	var Zs = new Array(3);
	var Ns = new Array(3);
	var i = 0, j = 0;
	while(i < numOfFaces) {
		var xformedFNz = fnbuf[i++];
		if(drawBothSides)
			xformedFNz = xformedFNz > 0 ? xformedFNz : -xformedFNz;
		if(xformedFNz < 0) {
			do {
			} while (ibuf[j++] != -1);
		}
		else {
			var i0, i1, i2;
			var v0, v1, v2;
			var ni0, ni1, ni2;
			i0 = ibuf[j];
			v0 = i0 * 3;
			ni0 = vnibuf[j];
			j++;
			i1 = ibuf[j];
			v1 = i1 * 3;
			ni1 = vnibuf[j];
			j++;

			do {
				i2 = ibuf[j];
				v2 = i2 * 3;
				ni2 = vnibuf[j];
				j++;

				Xs[0] = ~~(vbuf[v0    ] + 0.5);
				Ys[0] = ~~(vbuf[v0 + 1] + 0.5);
				Zs[0] = vbuf[v0 + 2];
				Xs[1] = ~~(vbuf[v1    ] + 0.5);
				Ys[1] = ~~(vbuf[v1 + 1] + 0.5);
				Zs[1] = vbuf[v1 + 2];
				Xs[2] = ~~(vbuf[v2    ] + 0.5);
				Ys[2] = ~~(vbuf[v2 + 1] + 0.5);
				Zs[2] = vbuf[v2 + 2];

				Ns[0] = vnbuf[ni0];
				Ns[1] = vnbuf[ni1];
				Ns[2] = vnbuf[ni2];
				if(drawBothSides) {
					if(Ns[0] < 0)
						Ns[0] = -Ns[0];
					if(Ns[1] < 0)
						Ns[1] = -Ns[1];
					if(Ns[2] < 0)
						Ns[2] = -Ns[2];
				}

				var high = Ys[0] < Ys[1] ? 0 : 1;
				high = Ys[high] < Ys[2] ? high : 2;
				var low = Ys[0] > Ys[1] ? 0 : 1;
				low = Ys[low] > Ys[2] ? low : 2;
				var mid = 3 - low - high;

				if(high != low) {
					var x0 = Xs[low];
					var z0 = Zs[low];
					var n0 = Ns[low] * 255;
					var dy0 = Ys[low] - Ys[high];
					dy0 = dy0 != 0 ? dy0 : 1;
					var xStep0 = (Xs[low] - Xs[high]) / dy0;
					var zStep0 = (Zs[low] - Zs[high]) / dy0;
					var nStep0 = (Ns[low] - Ns[high]) * 255 / dy0;

					var x1 = Xs[low];
					var z1 = Zs[low];
					var n1 = Ns[low] * 255;
					var dy1 = Ys[low] - Ys[mid];
					dy1 = dy1 != 0 ? dy1 : 1;
					var xStep1 = (Xs[low] - Xs[mid]) / dy1;
					var zStep1 = (Zs[low] - Zs[mid]) / dy1;
					var nStep1 = (Ns[low] - Ns[mid]) * 255 / dy1;

					var x2 = Xs[mid];
					var z2 = Zs[mid];
					var n2 = Ns[mid] * 255;
					var dy2 = Ys[mid] - Ys[high];
					dy2 = dy2 != 0 ? dy2 : 1;
					var xStep2 = (Xs[mid] - Xs[high]) / dy2;
					var zStep2 = (Zs[mid] - Zs[high]) / dy2;
					var nStep2 = (Ns[mid] - Ns[high]) * 255 / dy2;

					var linebase = Ys[low] * w;
					for(var y=Ys[low]; y>Ys[high]; y--) {
						if(y >=0 && y < h) {
							var xLeft = ~~x0;
							var zLeft = z0;
							var nLeft = n0;
							var xRight, zRight, nRight;
							if(y > Ys[mid]) {
								xRight = ~~x1;
								zRight = z1;
								nRight = n1;
							}
							else {
								xRight = ~~x2;
								zRight = z2;
								nRight = n2;
							}

							if(xLeft > xRight) {
								var temp;
								temp = xLeft;
								xLeft = xRight;
								xRight = temp;
								temp = zLeft;
								zLeft = zRight;
								zRight = temp;
								temp = nLeft;
								nLeft = nRight;
								nRight = temp;
							}

							var zInc = (xLeft != xRight) ? ((zRight - zLeft) / (xRight - xLeft)) : 1;
							var nInc = (xLeft != xRight) ? ((nRight - nLeft) / (xRight - xLeft)) : 1;
							if(xLeft < 0) {
								zLeft -= xLeft * zInc;
								nLeft -= xLeft * nInc;
								xLeft = 0;
							}
							if(xRight >= w) {
								xRight = w - 1;
							}
							var pix = linebase + xLeft;
							if(isOpaque) {
								for(var x=xLeft, z=zLeft, n=nLeft; x<=xRight; x++, z+=zInc, n+=nInc) {
									if(z > zbuf[pix]) {
										zbuf[pix] = z;
										cbuf[pix] = 0xff000000 | palette[n > 0 ? (~~n) : 0];
										sbuf[pix] = id;
									}
									pix++;
								}
							}
							else {
								for(var x=xLeft, z=zLeft, n=nLeft; x<xRight; x++, z+=zInc, n+=nInc) {
									if(z > zbuf[pix]) {
										var foreColor = palette[n > 0 ? (~~n) : 0];
										var backColor = cbuf[pix];
										var rr = ((backColor & 0xff0000) * trans + (foreColor & 0xff0000) * opaci) >> 8;
										var gg = ((backColor & 0xff00) * trans + (foreColor & 0xff00) * opaci) >> 8;
										var bb = ((backColor & 0xff) * trans + (foreColor & 0xff) * opaci) >> 8;
										var aa = (backColor & 0xff000000) | (opaci << 24);
										cbuf[pix] = aa | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
						}

						// step up to next scanline
						//
						x0 -= xStep0;
						z0 -= zStep0;
						n0 -= nStep0;
						if(y > Ys[mid]) {
							x1 -= xStep1;
							z1 -= zStep1;
							n1 -= nStep1;
						}
						else {
							x2 -= xStep2;
							z2 -= zStep2;
							n2 -= nStep2;
						}
						linebase -= w;
					}
				}

				v1 = v2;
				i1 = i2;
				ni1 = ni2;
			} while (ibuf[j] != -1);

			j++;
		}
	}
};

/**
	Render the given mesh as textured object, with no lightings.
	@private
 */
JSC3D.Viewer.prototype.renderSolidTexture = function(mesh) {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var ibuf = mesh.indexBuffer;
	var vbuf = mesh.transformedVertexBuffer;
	var nbuf = mesh.transformedFaceNormalZBuffer;
	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var numOfFaces = mesh.faceCount;
	var id = mesh.internalId;
	var texture = mesh.texture;
	var isOpaque = !texture.hasTransparency;
	var tbuf = mesh.texCoordBuffer;
	var tibuf = mesh.texCoordIndexBuffer ? mesh.texCoordIndexBuffer : mesh.indexBuffer;
	var tdata = texture.data;
	var tdim = texture.width;
	var tbound = tdim - 1;
	var mipmaps = texture.hasMipmap() ? texture.mipmaps : null;
	var mipentries = mipmaps ? texture.mipentries : null;
	var drawBothSides = mesh.isDoubleSided || this.isCullingDisabled;

	// fix for http://code.google.com/p/jsc3d/issues/detail?id=8
	// By Vasile Dirla <vasile@dirla.ro>.
	var fixForMacSafari = 1 * null;

	if(!nbuf || nbuf.length < numOfFaces) {
		mesh.transformedFaceNormalZBuffer = new Array(numOfFaces);
		nbuf = mesh.transformedFaceNormalZBuffer;
	}

	JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.faceNormalBuffer, nbuf);

	var Xs = new Array(3);
	var Ys = new Array(3);
	var Zs = new Array(3);
	var THs = new Array(3);
	var TVs = new Array(3);
	var i = 0, j = 0;
	while(i < numOfFaces) {
		var xformedNz = nbuf[i++];
		if(drawBothSides)
			xformedNz = xformedNz > 0 ? xformedNz : -xformedNz;
		if(xformedNz < 0) {
			do {
			} while (ibuf[j++] != -1);
		}
		else {
			var v0, v1, v2;
			var t0, t1, t2;
			v0 = ibuf[j] * 3;
			t0 = tibuf[j] * 2;
			j++;
			v1 = ibuf[j] * 3;
			t1 = tibuf[j] * 2;
			j++;

			// select an appropriate mip-map level for texturing
			//
			if(mipmaps) {
				v2 = ibuf[j] * 3;
				t2 = tibuf[j] * 2;

				tdim = texture.width;

				Xs[0] = vbuf[v0    ];
				Ys[0] = vbuf[v0 + 1];
				Xs[1] = vbuf[v1    ];
				Ys[1] = vbuf[v1 + 1];
				Xs[2] = vbuf[v2    ];
				Ys[2] = vbuf[v2 + 1];

				THs[0] = tbuf[t0    ] * tdim;
				TVs[0] = tbuf[t0 + 1] * tdim;
				THs[1] = tbuf[t1    ] * tdim;
				TVs[1] = tbuf[t1 + 1] * tdim;
				THs[2] = tbuf[t2    ] * tdim;
				TVs[2] = tbuf[t2 + 1] * tdim;

				var faceArea = (Xs[1] - Xs[0]) * (Ys[2] - Ys[0]) - (Ys[1] - Ys[0]) * (Xs[2] - Xs[0]);
				if(faceArea < 0)
					faceArea = -faceArea;
				faceArea += 1;
				var texArea = (THs[1] - THs[0]) * (TVs[2] - TVs[0]) - (TVs[1] -  TVs[0]) * (THs[2] - THs[0]);
				if(texArea < 0)
					texArea = -texArea;
				var mipRatio = texArea / faceArea;

				var level = 0;
				if(mipRatio < mipentries[1])
					level = 0;
				else if(mipRatio >= mipentries[mipentries.length - 1]) {
					level = mipentries.length - 1;
					tdim = 1;
				}
				else {
					while(mipRatio >= mipentries[level+1]) {
						level++;
						tdim /= 2;
					}
				}

				tdata = mipmaps[level];
				tbound = tdim - 1;
			}

			do {
				v2 = ibuf[j] * 3;
				t2 = tibuf[j] * 2;
				j++;

				Xs[0] = ~~(vbuf[v0    ] + 0.5);
				Ys[0] = ~~(vbuf[v0 + 1] + 0.5);
				Zs[0] = vbuf[v0 + 2];
				Xs[1] = ~~(vbuf[v1    ] + 0.5);
				Ys[1] = ~~(vbuf[v1 + 1] + 0.5);
				Zs[1] = vbuf[v1 + 2];
				Xs[2] = ~~(vbuf[v2    ] + 0.5);
				Ys[2] = ~~(vbuf[v2 + 1] + 0.5);
				Zs[2] = vbuf[v2 + 2];

				THs[0] = tbuf[t0    ] * tdim;
				TVs[0] = tbuf[t0 + 1] * tdim;
				THs[1] = tbuf[t1    ] * tdim;
				TVs[1] = tbuf[t1 + 1] * tdim;
				THs[2] = tbuf[t2    ] * tdim;
				TVs[2] = tbuf[t2 + 1] * tdim;

				var high = Ys[0] < Ys[1] ? 0 : 1;
				high = Ys[high] < Ys[2] ? high : 2;
				var low = Ys[0] > Ys[1] ? 0 : 1;
				low = Ys[low] > Ys[2] ? low : 2;
				var mid = 3 - low - high;

				if(high != low) {
					var x0 = Xs[low];
					var z0 = Zs[low];
					var th0 = THs[low];
					var tv0 = TVs[low];
					var dy0 = Ys[low] - Ys[high];
					dy0 = dy0 != 0 ? dy0 : 1;
					var xStep0 = (Xs[low] - Xs[high]) / dy0;
					var zStep0 = (Zs[low] - Zs[high]) / dy0;
					var thStep0 = (THs[low] - THs[high]) / dy0;
					var tvStep0 = (TVs[low] - TVs[high]) / dy0;

					var x1 = Xs[low];
					var z1 = Zs[low];
					var th1 = THs[low];
					var tv1 = TVs[low];
					var dy1 = Ys[low] - Ys[mid];
					dy1 = dy1 != 0 ? dy1 : 1;
					var xStep1 = (Xs[low] - Xs[mid]) / dy1;
					var zStep1 = (Zs[low] - Zs[mid]) / dy1;
					var thStep1 = (THs[low] - THs[mid]) / dy1;
					var tvStep1 = (TVs[low] - TVs[mid]) / dy1;

					var x2 = Xs[mid];
					var z2 = Zs[mid];
					var th2 = THs[mid];
					var tv2 = TVs[mid];
					var dy2 = Ys[mid] - Ys[high];
					dy2 = dy2 != 0 ? dy2 : 1;
					var xStep2 = (Xs[mid] - Xs[high]) / dy2;
					var zStep2 = (Zs[mid] - Zs[high]) / dy2;
					var thStep2 = (THs[mid] - THs[high]) / dy2;
					var tvStep2 = (TVs[mid] - TVs[high]) / dy2;

					var linebase = Ys[low] * w;
					for(var y=Ys[low]; y>Ys[high]; y--) {
						if(y >=0 && y < h) {
							var xLeft = ~~x0;
							var zLeft = z0;
							var thLeft = th0;
							var tvLeft = tv0;
							var xRight, zRight, thRight, tvRight;
							if(y > Ys[mid]) {
								xRight = ~~x1;
								zRight = z1;
								thRight = th1;
								tvRight = tv1;
							}
							else {
								xRight = ~~x2;
								zRight = z2;
								thRight = th2;
								tvRight = tv2;
							}

							if(xLeft > xRight) {
								var temp;
								temp = xLeft;
								xLeft = xRight;
								xRight = temp;
								temp = zLeft;
								zLeft = zRight;
								zRight = temp;
								temp = thLeft;
								thLeft = thRight;
								thRight = temp;
								temp = tvLeft;
								tvLeft = tvRight;
								tvRight = temp;
							}

							var zInc = (xLeft != xRight) ? ((zRight - zLeft) / (xRight - xLeft)) : 1;
							var thInc = (xLeft != xRight) ? ((thRight - thLeft) / (xRight - xLeft)) : 1;
							var tvInc = (xLeft != xRight) ? ((tvRight - tvLeft) / (xRight - xLeft)) : 1;

							if(xLeft < 0) {
								zLeft -= xLeft * zInc;
								thLeft -= xLeft * thInc;
								tvLeft -= xLeft * tvInc;
								xLeft = 0;
							}
							if(xRight >= w)
								xRight = w - 1;

							var pix = linebase + xLeft;
							if(isOpaque) {
								for(var x=xLeft, z=zLeft, th=thLeft, tv=tvLeft; x<=xRight; x++, z+=zInc, th+=thInc, tv+=tvInc) {
									if(z > zbuf[pix]) {
										zbuf[pix] = z;
										cbuf[pix] = tdata[(tv & tbound) * tdim + (th & tbound)];
										sbuf[pix] = id;
									}
									pix++;
								}
							}
							else {
								for(var x=xLeft, z=zLeft, th=thLeft, tv=tvLeft; x<xRight; x++, z+=zInc, th+=thInc, tv+=tvInc) {
									if(z > zbuf[pix]) {
										var foreColor = tdata[(tv & tbound) * tdim + (th & tbound)];
										var backColor = cbuf[pix];
										var opaci = (foreColor >> 24) & 0xff;
										var trans = 255 - opaci;
										var rr = ((backColor & 0xff0000) * trans + (foreColor & 0xff0000) * opaci) >> 8;
										var gg = ((backColor & 0xff00) * trans + (foreColor & 0xff00) * opaci) >> 8;
										var bb = ((backColor & 0xff) * trans + (foreColor & 0xff) * opaci) >> 8;
										var aa = (backColor & 0xff000000) | (opaci << 24);
										cbuf[pix] = aa | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
						}

						// step up to next scanline
						//
						x0 -= xStep0;
						z0 -= zStep0;
						th0 -= thStep0;
						tv0 -= tvStep0;
						if(y > Ys[mid]) {
							x1 -= xStep1;
							z1 -= zStep1;
							th1 -= thStep1;
							tv1 -= tvStep1;
						}
						else {
							x2 -= xStep2;
							z2 -= zStep2;
							th2 -= thStep2;
							tv2 -= tvStep2;
						}
						linebase -= w;
					}
				}

				v1 = v2;
				t1 = t2;
			} while (ibuf[j] != -1);

			j++;
		}
	}
};

/**
	Render the given mesh as textured object. Lighting will be calculated per face.
	@private
 */
JSC3D.Viewer.prototype.renderTextureFlat = function(mesh) {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var ibuf = mesh.indexBuffer;
	var vbuf = mesh.transformedVertexBuffer;
	var nbuf = mesh.transformedFaceNormalZBuffer;
	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var numOfFaces = mesh.faceCount;
	var id = mesh.internalId;
	var material = mesh.material ? mesh.material : this.defaultMaterial;
	var palette = material.getPalette();
	var texture = mesh.texture;
	var isOpaque = (material.transparency == 0) && !texture.hasTransparency;
	var matOpacity = ~~((1 - material.transparency) * 255);
	var tbuf = mesh.texCoordBuffer;
	var tibuf = mesh.texCoordIndexBuffer ? mesh.texCoordIndexBuffer : mesh.indexBuffer;
	var tdata = texture.data;
	var tdim = texture.width;
	var tbound = tdim - 1;
	var mipmaps = texture.hasMipmap() ? texture.mipmaps : null;
	var mipentries = mipmaps ? texture.mipentries : null;
	var drawBothSides = mesh.isDoubleSided || this.isCullingDisabled;

	// fix for http://code.google.com/p/jsc3d/issues/detail?id=8
	// By Vasile Dirla <vasile@dirla.ro>.
	var fixForMacSafari = 1 * null;

	// skip this mesh if it is completely transparent
	if(material.transparency == 1)
		return;

	if(!nbuf || nbuf.length < numOfFaces) {
		mesh.transformedFaceNormalZBuffer = new Array(numOfFaces);
		nbuf = mesh.transformedFaceNormalZBuffer;
	}

	JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.faceNormalBuffer, nbuf);

	var Xs = new Array(3);
	var Ys = new Array(3);
	var Zs = new Array(3);
	var THs = new Array(3);
	var TVs = new Array(3);
	var i = 0, j = 0;
	while(i < numOfFaces) {
		var xformedNz = nbuf[i++];
		if(drawBothSides)
			xformedNz = xformedNz > 0 ? xformedNz : -xformedNz;
		if(xformedNz < 0) {
			do {
			} while (ibuf[j++] != -1);
		}
		else {
			var color = 0xff000000 | palette[~~(xformedNz * 255)];

			var v0, v1, v2;
			var t0, t1, t2;
			v0 = ibuf[j] * 3;
			t0 = tibuf[j] * 2;
			j++;
			v1 = ibuf[j] * 3;
			t1 = tibuf[j] * 2;
			j++;

			if(mipmaps) {
				v2 = ibuf[j] * 3;
				t2 = tibuf[j] * 2;

				tdim = texture.width;

				Xs[0] = vbuf[v0    ];
				Ys[0] = vbuf[v0 + 1];
				Xs[1] = vbuf[v1    ];
				Ys[1] = vbuf[v1 + 1];
				Xs[2] = vbuf[v2    ];
				Ys[2] = vbuf[v2 + 1];

				THs[0] = tbuf[t0    ] * tdim;
				TVs[0] = tbuf[t0 + 1] * tdim;
				THs[1] = tbuf[t1    ] * tdim;
				TVs[1] = tbuf[t1 + 1] * tdim;
				THs[2] = tbuf[t2    ] * tdim;
				TVs[2] = tbuf[t2 + 1] * tdim;

				var faceArea = (Xs[1] - Xs[0]) * (Ys[2] - Ys[0]) - (Ys[1] - Ys[0]) * (Xs[2] - Xs[0]);
				if(faceArea < 0)
					faceArea = -faceArea;
				faceArea += 1;
				var texArea = (THs[1] - THs[0]) * (TVs[2] - TVs[0]) - (TVs[1] -  TVs[0]) * (THs[2] - THs[0]);
				if(texArea < 0)
					texArea = -texArea;
				var mipRatio = texArea / faceArea;

				var level = 0;
				if(mipRatio < mipentries[1])
					level = 0;
				else if(mipRatio >= mipentries[mipentries.length - 1]) {
					level = mipentries.length - 1;
					tdim = 1;
				}
				else {
					while(mipRatio >= mipentries[level+1]) {
						level++;
						tdim /= 2;
					}
				}

				tdata = mipmaps[level];
				tbound = tdim - 1;
			}

			do {
				v2 = ibuf[j] * 3;
				t2 = tibuf[j] * 2;
				j++;

				Xs[0] = ~~(vbuf[v0    ] + 0.5);
				Ys[0] = ~~(vbuf[v0 + 1] + 0.5);
				Zs[0] = vbuf[v0 + 2];
				Xs[1] = ~~(vbuf[v1    ] + 0.5);
				Ys[1] = ~~(vbuf[v1 + 1] + 0.5);
				Zs[1] = vbuf[v1 + 2];
				Xs[2] = ~~(vbuf[v2    ] + 0.5);
				Ys[2] = ~~(vbuf[v2 + 1] + 0.5);
				Zs[2] = vbuf[v2 + 2];

				THs[0] = tbuf[t0    ] * tdim;
				TVs[0] = tbuf[t0 + 1] * tdim;
				THs[1] = tbuf[t1    ] * tdim;
				TVs[1] = tbuf[t1 + 1] * tdim;
				THs[2] = tbuf[t2    ] * tdim;
				TVs[2] = tbuf[t2 + 1] * tdim;

				var high = Ys[0] < Ys[1] ? 0 : 1;
				high = Ys[high] < Ys[2] ? high : 2;
				var low = Ys[0] > Ys[1] ? 0 : 1;
				low = Ys[low] > Ys[2] ? low : 2;
				var mid = 3 - low - high;

				if(high != low) {
					var x0 = Xs[low];
					var z0 = Zs[low];
					var th0 = THs[low];
					var tv0 = TVs[low];
					var dy0 = Ys[low] - Ys[high];
					dy0 = dy0 != 0 ? dy0 : 1;
					var xStep0 = (Xs[low] - Xs[high]) / dy0;
					var zStep0 = (Zs[low] - Zs[high]) / dy0;
					var thStep0 = (THs[low] - THs[high]) / dy0;
					var tvStep0 = (TVs[low] - TVs[high]) / dy0;

					var x1 = Xs[low];
					var z1 = Zs[low];
					var th1 = THs[low];
					var tv1 = TVs[low];
					var dy1 = Ys[low] - Ys[mid];
					dy1 = dy1 != 0 ? dy1 : 1;
					var xStep1 = (Xs[low] - Xs[mid]) / dy1;
					var zStep1 = (Zs[low] - Zs[mid]) / dy1;
					var thStep1 = (THs[low] - THs[mid]) / dy1;
					var tvStep1 = (TVs[low] - TVs[mid]) / dy1;

					var x2 = Xs[mid];
					var z2 = Zs[mid];
					var th2 = THs[mid];
					var tv2 = TVs[mid];
					var dy2 = Ys[mid] - Ys[high];
					dy2 = dy2 != 0 ? dy2 : 1;
					var xStep2 = (Xs[mid] - Xs[high]) / dy2;
					var zStep2 = (Zs[mid] - Zs[high]) / dy2;
					var thStep2 = (THs[mid] - THs[high]) / dy2;
					var tvStep2 = (TVs[mid] - TVs[high]) / dy2;

					var linebase = Ys[low] * w;
					for(var y=Ys[low]; y>Ys[high]; y--) {
						if(y >=0 && y < h) {
							var xLeft = ~~x0;
							var zLeft = z0;
							var thLeft = th0;
							var tvLeft = tv0;
							var xRight, zRight, thRight, tvRight;
							if(y > Ys[mid]) {
								xRight = ~~x1;
								zRight = z1;
								thRight = th1;
								tvRight = tv1;
							}
							else {
								xRight = ~~x2;
								zRight = z2;
								thRight = th2;
								tvRight = tv2;
							}

							if(xLeft > xRight) {
								var temp;
								temp = xLeft;
								xLeft = xRight;
								xRight = temp;
								temp = zLeft;
								zLeft = zRight;
								zRight = temp;
								temp = thLeft;
								thLeft = thRight;
								thRight = temp;
								temp = tvLeft;
								tvLeft = tvRight;
								tvRight = temp;
							}

							var zInc = (xLeft != xRight) ? ((zRight - zLeft) / (xRight - xLeft)) : 1;
							var thInc = (xLeft != xRight) ? ((thRight - thLeft) / (xRight - xLeft)) : 1;
							var tvInc = (xLeft != xRight) ? ((tvRight - tvLeft) / (xRight - xLeft)) : 1;

							if(xLeft < 0) {
								zLeft -= xLeft * zInc;
								thLeft -= xLeft * thInc;
								tvLeft -= xLeft * tvInc;
								xLeft = 0;
							}
							if(xRight >= w)
								xRight = w - 1;

							var pix = linebase + xLeft;
							if(isOpaque) {
								for(var x=xLeft, z=zLeft, th=thLeft, tv=tvLeft; x<=xRight; x++, z+=zInc, th+=thInc, tv+=tvInc) {
									if(z > zbuf[pix]) {
										zbuf[pix] = z;
										var texel = tdata[(tv & tbound) * tdim + (th & tbound)];
										var rr = (((color & 0xff0000) >> 16) * ((texel & 0xff0000) >> 8));
										var gg = (((color & 0xff00) >> 8) * ((texel & 0xff00) >> 8));
										var bb = ((color & 0xff) * (texel & 0xff)) >> 8;
										cbuf[pix] = 0xff000000 | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
							else {
								for(var x=xLeft, z=zLeft, th=thLeft, tv=tvLeft; x<xRight; x++, z+=zInc, th+=thInc, tv+=tvInc) {
									if(z > zbuf[pix]) {
										var foreColor = tdata[(tv & tbound) * tdim + (th & tbound)];
										var backColor = cbuf[pix];
										var opaci = (((foreColor >> 24) & 0xff) * (matOpacity & 0xff)) >> 8;
										var rr = (((color & 0xff0000) >> 16) * ((foreColor & 0xff0000) >> 8));
										var gg = (((color & 0xff00) >> 8) * ((foreColor & 0xff00) >> 8));
										var bb = ((color & 0xff) * (foreColor & 0xff)) >> 8;
										var aa = (backColor & 0xff000000) | (opaci << 24);
										if(opaci > 250) {
											zbuf[pix] = z;
										}
										else {
											var trans = 255 - opaci;
											rr = (rr * opaci + (backColor & 0xff0000) * trans) >> 8;
											gg = (gg * opaci + (backColor & 0xff00) * trans) >> 8;
											bb = (bb * opaci + (backColor & 0xff) * trans) >> 8;
										}
										cbuf[pix] = aa | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
						}

						// step up to next scanline
						//
						x0 -= xStep0;
						z0 -= zStep0;
						th0 -= thStep0;
						tv0 -= tvStep0;
						if(y > Ys[mid]) {
							x1 -= xStep1;
							z1 -= zStep1;
							th1 -= thStep1;
							tv1 -= tvStep1;
						}
						else {
							x2 -= xStep2;
							z2 -= zStep2;
							th2 -= thStep2;
							tv2 -= tvStep2;
						}
						linebase -= w;
					}
				}

				v1 = v2;
				t1 = t2;
			} while (ibuf[j] != -1);

			j++;
		}
	}
};

/**
	Render the given mesh as textured object. Lighting will be calculated per vertex and then interpolated between and inside scanlines.
	@private
 */
JSC3D.Viewer.prototype.renderTextureSmooth = function(mesh) {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var ibuf = mesh.indexBuffer;
	var vbuf = mesh.transformedVertexBuffer;
	var vnbuf = mesh.transformedVertexNormalZBuffer;
	var vnibuf = mesh.vertexNormalIndexBuffer ? mesh.vertexNormalIndexBuffer : mesh.indexBuffer;
	var fnbuf = mesh.transformedFaceNormalZBuffer;
	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var numOfFaces = mesh.faceCount;
	var id = mesh.internalId;
	var numOfVertices = vbuf.length / 3;
	var material = mesh.material ? mesh.material : this.defaultMaterial;
	var palette = material.getPalette();
	var texture = mesh.texture;
	var isOpaque = (material.transparency == 0) && !texture.hasTransparency;
	var matOpacity = ~~((1 - material.transparency) * 255);
	var tbuf = mesh.texCoordBuffer;
	var tibuf = mesh.texCoordIndexBuffer ? mesh.texCoordIndexBuffer : mesh.indexBuffer;
	var tdata = texture.data;
	var tdim = texture.width;
	var tbound = tdim - 1;
	var mipmaps = texture.hasMipmap() ? texture.mipmaps : null;
	var mipentries = mipmaps ? texture.mipentries : null;
	var drawBothSides = mesh.isDoubleSided || this.isCullingDisabled;

	// fix for http://code.google.com/p/jsc3d/issues/detail?id=8
	// By Vasile Dirla <vasile@dirla.ro>.
	var fixForMacSafari = 1 * null;

	// skip this mesh if it is completely transparent
	if(material.transparency == 1)
		return;

	if(!vnbuf || vnbuf.length < mesh.vertexNormalBuffer.length/3) {
		mesh.transformedVertexNormalZBuffer = new Array(mesh.vertexNormalBuffer.length / 3);
		vnbuf = mesh.transformedVertexNormalZBuffer;
	}

	if(!fnbuf || fnbuf.length < numOfFaces) {
		mesh.transformedFaceNormalZBuffer = new Array(numOfFaces);
		fnbuf = mesh.transformedFaceNormalZBuffer;
	}

	JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.vertexNormalBuffer, vnbuf);
	JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.faceNormalBuffer, fnbuf);

	var Xs = new Array(3);
	var Ys = new Array(3);
	var Zs = new Array(3);
	var Ns = new Array(3);
	var THs = new Array(3);
	var TVs = new Array(3);
	var i = 0, j = 0;
	while(i < numOfFaces) {
		var xformedFNz = fnbuf[i++];
		if(drawBothSides)
			xformedFNz = xformedFNz > 0 ? xformedFNz : -xformedFNz;
		if(xformedFNz < 0) {
			do {
			} while (ibuf[j++] != -1);
		}
		else {
			var i0, i1, i2;
			var v0, v1, v2;
			var t0, t1, t2;
			var ni0, ni1, ni2;
			i0 = ibuf[j];
			v0 = i0 * 3;
			t0 = tibuf[j] * 2;
			ni0 = vnibuf[j];
			j++;
			i1 = ibuf[j];
			v1 = i1 * 3;
			t1 = tibuf[j] * 2;
			ni1 = vnibuf[j];
			j++;

			if(mipmaps) {
				v2 = ibuf[j] * 3;
				t2 = tibuf[j] * 2;

				tdim = texture.width;

				Xs[0] = vbuf[v0    ];
				Ys[0] = vbuf[v0 + 1];
				Xs[1] = vbuf[v1    ];
				Ys[1] = vbuf[v1 + 1];
				Xs[2] = vbuf[v2    ];
				Ys[2] = vbuf[v2 + 1];

				THs[0] = tbuf[t0    ] * tdim;
				TVs[0] = tbuf[t0 + 1] * tdim;
				THs[1] = tbuf[t1    ] * tdim;
				TVs[1] = tbuf[t1 + 1] * tdim;
				THs[2] = tbuf[t2    ] * tdim;
				TVs[2] = tbuf[t2 + 1] * tdim;

				var faceArea = (Xs[1] - Xs[0]) * (Ys[2] - Ys[0]) - (Ys[1] - Ys[0]) * (Xs[2] - Xs[0]);
				if(faceArea < 0)
					faceArea = -faceArea;
				faceArea += 1;
				var texArea = (THs[1] - THs[0]) * (TVs[2] - TVs[0]) - (TVs[1] -  TVs[0]) * (THs[2] - THs[0]);
				if(texArea < 0)
					texArea = -texArea;
				var mipRatio = texArea / faceArea;

				var level = 0;
				if(mipRatio < mipentries[1])
					level = 0;
				else if(mipRatio >= mipentries[mipentries.length - 1]) {
					level = mipentries.length - 1;
					tdim = 1;
				}
				else {
					while(mipRatio >= mipentries[level+1]) {
						level++;
						tdim /= 2;
					}
				}

				tdata = mipmaps[level];
				tbound = tdim - 1;
			}
			
			do {
				i2 = ibuf[j];
				v2 = i2 * 3;
				t2 = tibuf[j] * 2;
				ni2 = vnibuf[j];
				j++;

				Xs[0] = ~~(vbuf[v0    ] + 0.5);
				Ys[0] = ~~(vbuf[v0 + 1] + 0.5);
				Zs[0] = vbuf[v0 + 2];
				Xs[1] = ~~(vbuf[v1    ] + 0.5);
				Ys[1] = ~~(vbuf[v1 + 1] + 0.5);
				Zs[1] = vbuf[v1 + 2];
				Xs[2] = ~~(vbuf[v2    ] + 0.5);
				Ys[2] = ~~(vbuf[v2 + 1] + 0.5);
				Zs[2] = vbuf[v2 + 2];

				THs[0] = tbuf[t0    ] * tdim;
				TVs[0] = tbuf[t0 + 1] * tdim;
				THs[1] = tbuf[t1    ] * tdim;
				TVs[1] = tbuf[t1 + 1] * tdim;
				THs[2] = tbuf[t2    ] * tdim;
				TVs[2] = tbuf[t2 + 1] * tdim;

				Ns[0] = vnbuf[ni0];
				Ns[1] = vnbuf[ni1];
				Ns[2] = vnbuf[ni2];
				if(drawBothSides) {
					if(Ns[0] < 0)
						Ns[0] = -Ns[0];
					if(Ns[1] < 0)
						Ns[1] = -Ns[1];
					if(Ns[2] < 0)
						Ns[2] = -Ns[2];
				}

				var high = Ys[0] < Ys[1] ? 0 : 1;
				high = Ys[high] < Ys[2] ? high : 2;
				var low = Ys[0] > Ys[1] ? 0 : 1;
				low = Ys[low] > Ys[2] ? low : 2;
				var mid = 3 - low - high;

				if(high != low) {
					var x0 = Xs[low];
					var z0 = Zs[low];
					var th0 = THs[low];
					var tv0 = TVs[low];
					var n0 = Ns[low] * 255;
					var dy0 = Ys[low] - Ys[high];
					dy0 = dy0 != 0 ? dy0 : 1;
					var xStep0 = (Xs[low] - Xs[high]) / dy0;
					var zStep0 = (Zs[low] - Zs[high]) / dy0;
					var thStep0 = (THs[low] - THs[high]) / dy0;
					var tvStep0 = (TVs[low] - TVs[high]) / dy0;
					var nStep0 = (Ns[low] - Ns[high]) * 255 / dy0;

					var x1 = Xs[low];
					var z1 = Zs[low];
					var th1 = THs[low];
					var tv1 = TVs[low];
					var n1 = Ns[low] * 255;
					var dy1 = Ys[low] - Ys[mid];
					dy1 = dy1 != 0 ? dy1 : 1;
					var xStep1 = (Xs[low] - Xs[mid]) / dy1;
					var zStep1 = (Zs[low] - Zs[mid]) / dy1;
					var thStep1 = (THs[low] - THs[mid]) / dy1;
					var tvStep1 = (TVs[low] - TVs[mid]) / dy1;
					var nStep1 = (Ns[low] - Ns[mid]) * 255 / dy1;

					var x2 = Xs[mid];
					var z2 = Zs[mid];
					var th2 = THs[mid];
					var tv2 = TVs[mid];
					var n2 = Ns[mid] * 255;
					var dy2 = Ys[mid] - Ys[high];
					dy2 = dy2 != 0 ? dy2 : 1;
					var xStep2 = (Xs[mid] - Xs[high]) / dy2;
					var zStep2 = (Zs[mid] - Zs[high]) / dy2;
					var thStep2 = (THs[mid] - THs[high]) / dy2;
					var tvStep2 = (TVs[mid] - TVs[high]) / dy2;
					var nStep2 = (Ns[mid] - Ns[high]) * 255 / dy2;

					var linebase = Ys[low] * w;
					for(var y=Ys[low]; y>Ys[high]; y--) {
						if(y >=0 && y < h) {
							var xLeft = ~~x0;
							var zLeft = z0;
							var thLeft = th0;
							var tvLeft = tv0;
							var nLeft = n0;
							var xRight, zRight, thRight, tvRight, nRight;
							if(y > Ys[mid]) {
								xRight = ~~x1;
								zRight = z1;
								thRight = th1;
								tvRight = tv1;
								nRight = n1;
							}
							else {
								xRight = ~~x2;
								zRight = z2;
								thRight = th2;
								tvRight = tv2;
								nRight = n2;
							}

							if(xLeft > xRight) {
								var temp;
								temp = xLeft;
								xLeft = xRight;
								xRight = temp;
								temp = zLeft;
								zLeft = zRight;
								zRight = temp;
								temp = thLeft;
								thLeft = thRight;
								thRight = temp;
								temp = tvLeft;
								tvLeft = tvRight;
								tvRight = temp;
								temp = nLeft;
								nLeft = nRight;
								nRight = temp;
							}

							var zInc = (xLeft != xRight) ? ((zRight - zLeft) / (xRight - xLeft)) : 1;
							var thInc = (xLeft != xRight) ? ((thRight - thLeft) / (xRight - xLeft)) : 1;
							var tvInc = (xLeft != xRight) ? ((tvRight - tvLeft) / (xRight - xLeft)) : 1;
							var nInc = (xLeft != xRight) ? ((nRight - nLeft) / (xRight - xLeft)) : 0;

							if(xLeft < 0) {
								zLeft -= xLeft * zInc;
								thLeft -= xLeft * thInc;
								tvLeft -= xLeft * tvInc;
								nLeft -= xLeft * nInc;
								xLeft = 0;
							}
							if(xRight >= w)
								xRight = w - 1;

							var pix = linebase + xLeft;
							if(isOpaque) {
								for(var x=xLeft, z=zLeft, n=nLeft, th=thLeft, tv=tvLeft; x<=xRight; x++, z+=zInc, n+=nInc, th+=thInc, tv+=tvInc) {
									if(z > zbuf[pix]) {
										zbuf[pix] = z;
										var color = palette[n > 0 ? (~~n) : 0];
										var texel = tdata[(tv & tbound) * tdim + (th & tbound)];
										var rr = (((color & 0xff0000) >> 16) * ((texel & 0xff0000) >> 8));
										var gg = (((color & 0xff00) >> 8) * ((texel & 0xff00) >> 8));
										var bb = ((color & 0xff) * (texel & 0xff)) >> 8;
										cbuf[pix] = 0xff000000 | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
							else {
								for(var x=xLeft, z=zLeft, n=nLeft, th=thLeft, tv=tvLeft; x<xRight; x++, z+=zInc, n+=nInc, th+=thInc, tv+=tvInc) {
									if(z > zbuf[pix]) {
										var color = palette[n > 0 ? (~~n) : 0];
										var foreColor = tdata[(tv & tbound) * tdim + (th & tbound)];
										var backColor = cbuf[pix];
										var opaci = (((foreColor >> 24) & 0xff) * (matOpacity & 0xff)) >> 8;
										var rr = (((color & 0xff0000) >> 16) * ((foreColor & 0xff0000) >> 8));
										var gg = (((color & 0xff00) >> 8) * ((foreColor & 0xff00) >> 8));
										var bb = ((color & 0xff) * (foreColor & 0xff)) >> 8;
										var aa = (backColor & 0xff000000) | (opaci << 24);
										if(opaci > 250) {
											zbuf[pix] = z;
										}
										else {
											var trans = 255 - opaci;
											rr = (rr * opaci + (backColor & 0xff0000) * trans) >> 8;
											gg = (gg * opaci + (backColor & 0xff00) * trans) >> 8;
											bb = (bb * opaci + (backColor & 0xff) * trans) >> 8;
										}
										cbuf[pix] = aa | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
						}

						// step up to next scanline
						//
						x0 -= xStep0;
						z0 -= zStep0;
						th0 -= thStep0;
						tv0 -= tvStep0;
						n0 -= nStep0;
						if(y > Ys[mid]) {
							x1 -= xStep1;
							z1 -= zStep1;
							th1 -= thStep1;
							tv1 -= tvStep1;
							n1 -= nStep1;
						}
						else {
							x2 -= xStep2;
							z2 -= zStep2;
							th2 -= thStep2;
							tv2 -= tvStep2;
							n2 -= nStep2;
						}
						linebase -= w;
					}
				}

				i1 = i2;
				v1 = v2;
				t1 = t2;
				ni1 = ni2;
			} while (ibuf[j] != -1);

			j++;
		}
	}
};

/**
	Render the given mesh as solid object with sphere mapping. Lighting will be calculated per vertex and then interpolated between and inside scanlines.
	@private
 */
JSC3D.Viewer.prototype.renderSolidSphereMapped = function(mesh) {
	var w = this.frameWidth;
	var h = this.frameHeight;
	var ibuf = mesh.indexBuffer;
	var vbuf = mesh.transformedVertexBuffer;
	var vnbuf = mesh.transformedVertexNormalBuffer;
	var vnibuf = mesh.vertexNormalIndexBuffer ? mesh.vertexNormalIndexBuffer : mesh.indexBuffer;
	var fnbuf = mesh.transformedFaceNormalZBuffer;
	var cbuf = this.colorBuffer;
	var zbuf = this.zBuffer;
	var sbuf = this.selectionBuffer;
	var numOfFaces = mesh.faceCount;
	var numOfVertices = vbuf.length / 3;
	var id = mesh.internalId;
	var material = mesh.material ? mesh.material : this.defaultMaterial;
	var palette = material.getPalette();
	var sphereMap = this.sphereMap;
	var sdata = sphereMap.data;
	var sdim = sphereMap.width;
	var sbound = sdim - 1;
	var isOpaque = material.transparency == 0;
	var trans = ~~(material.transparency * 255);
	var opaci = 255 - trans;
	var drawBothSides = mesh.isDoubleSided || this.isCullingDisabled;

	// fix for http://code.google.com/p/jsc3d/issues/detail?id=8
	// By Vasile Dirla <vasile@dirla.ro>.
	var fixForMacSafari = 1 * null;

	// skip this mesh if it is completely transparent
	if(material.transparency == 1)
		return;

	if(!vnbuf || vnbuf.length < mesh.vertexNormalBuffer.length) {
		mesh.transformedVertexNormalBuffer = new Array(mesh.vertexNormalBuffer.length);
		vnbuf = mesh.transformedVertexNormalBuffer;
	}

	if(!fnbuf || fnbuf.length < numOfFaces) {
		mesh.transformedFaceNormalZBuffer = new Array(numOfFaces);
		fnbuf = mesh.transformedFaceNormalZBuffer;
	}

	JSC3D.Math3D.transformVectors(this.rotMatrix, mesh.vertexNormalBuffer, vnbuf);
	JSC3D.Math3D.transformVectorZs(this.rotMatrix, mesh.faceNormalBuffer, fnbuf);

	var Xs = new Array(3);
	var Ys = new Array(3);
	var Zs = new Array(3);
	var NXs = new Array(3);
	var NYs = new Array(3);
	var NZs = new Array(3);
	var i = 0, j = 0;
	while(i < numOfFaces) {
		var xformedFNz = fnbuf[i++];
		if(drawBothSides)
			xformedFNz = xformedFNz > 0 ? xformedFNz : -xformedFNz;
		if(xformedFNz < 0) {
			do {
			} while (ibuf[j++] != -1);
		}
		else {
			var v0, v1, v2;
			var vn0, vn1, vn2;
			v0 = ibuf[j] * 3;
			vn0 = vnibuf[j] * 3;
			j++;
			v1 = ibuf[j] * 3;
			vn1 = vnibuf[j] * 3;
			j++

			do {
				v2 = ibuf[j] * 3;
				vn2 = vnibuf[j] * 3;
				j++

				Xs[0] = ~~(vbuf[v0    ] + 0.5);
				Ys[0] = ~~(vbuf[v0 + 1] + 0.5);
				Zs[0] = vbuf[v0 + 2];
				Xs[1] = ~~(vbuf[v1    ] + 0.5);
				Ys[1] = ~~(vbuf[v1 + 1] + 0.5);
				Zs[1] = vbuf[v1 + 2];
				Xs[2] = ~~(vbuf[v2    ] + 0.5);
				Ys[2] = ~~(vbuf[v2 + 1] + 0.5);
				Zs[2] = vbuf[v2 + 2];

				NXs[0] = vnbuf[vn0    ];
				NYs[0] = vnbuf[vn0 + 1];
				NZs[0] = vnbuf[vn0 + 2];
				NXs[1] = vnbuf[vn1    ];
				NYs[1] = vnbuf[vn1 + 1];
				NZs[1] = vnbuf[vn1 + 2];
				NXs[2] = vnbuf[vn2    ];
				NYs[2] = vnbuf[vn2 + 1];
				NZs[2] = vnbuf[vn2 + 2];
				if(drawBothSides) {
					if(NZs[0] < 0)
						NZs[0] = -NZs[0];
					if(NZs[1] < 0)
						NZs[1] = -NZs[1];
					if(NZs[2] < 0)
						NZs[2] = -NZs[2];
				}

				var high = Ys[0] < Ys[1] ? 0 : 1;
				high = Ys[high] < Ys[2] ? high : 2;
				var low = Ys[0] > Ys[1] ? 0 : 1;
				low = Ys[low] > Ys[2] ? low : 2;
				var mid = 3 - low - high;

				if(high != low) {
					var x0 = Xs[low];
					var z0 = Zs[low];
					var n0 = NZs[low] * 255;
					var sh0 = ((NXs[low] / 2 + 0.5) * sdim) & sbound;
					var sv0 = ((0.5 - NYs[low] / 2) * sdim) & sbound;
					var dy0 = Ys[low] - Ys[high];
					dy0 = dy0 != 0 ? dy0 : 1;
					var xStep0 = (Xs[low] - Xs[high]) / dy0;
					var zStep0 = (Zs[low] - Zs[high]) / dy0;
					var nStep0 = (NZs[low] - NZs[high]) * 255 / dy0;
					var shStep0 = (((NXs[low] - NXs[high]) / 2) * sdim) / dy0;
					var svStep0 = (((NYs[high] - NYs[low]) / 2) * sdim) / dy0;

					var x1 = Xs[low];
					var z1 = Zs[low];
					var n1 = NZs[low] * 255;
					var sh1 = ((NXs[low] / 2 + 0.5) * sdim) & sbound;
					var sv1 = ((0.5 - NYs[low] / 2) * sdim) & sbound;
					var dy1 = Ys[low] - Ys[mid];
					dy1 = dy1 != 0 ? dy1 : 1;
					var xStep1 = (Xs[low] - Xs[mid]) / dy1;
					var zStep1 = (Zs[low] - Zs[mid]) / dy1;
					var nStep1 = (NZs[low] - NZs[mid]) * 255 / dy1;
					var shStep1 = (((NXs[low] - NXs[mid]) / 2) * sdim) / dy1;
					var svStep1 = (((NYs[mid] - NYs[low]) / 2) * sdim) / dy1;

					var x2 = Xs[mid];
					var z2 = Zs[mid];
					var n2 = NZs[mid] * 255;
					var sh2 = ((NXs[mid] / 2 + 0.5) * sdim) & sbound;
					var sv2 = ((0.5 - NYs[mid] / 2) * sdim) & sbound;
					var dy2 = Ys[mid] - Ys[high];
					dy2 = dy2 != 0 ? dy2 : 1;
					var xStep2 = (Xs[mid] - Xs[high]) / dy2;
					var zStep2 = (Zs[mid] - Zs[high]) / dy2;
					var nStep2 = (NZs[mid] - NZs[high]) * 255 / dy2;
					var shStep2 = (((NXs[mid] - NXs[high]) / 2) * sdim) / dy2;
					var svStep2 = (((NYs[high] - NYs[mid]) / 2) * sdim) / dy2;

					var linebase = Ys[low] * w;
					for(var y=Ys[low]; y>Ys[high]; y--) {
						if(y >=0 && y < h) {
							var xLeft = ~~x0;
							var zLeft = z0;
							var nLeft = n0;
							var shLeft = sh0;
							var svLeft = sv0;
							var xRight, zRight, nRight, shRight, svRight;
							if(y > Ys[mid]) {
								xRight = ~~x1;
								zRight = z1;
								nRight = n1;
								shRight = sh1;
								svRight = sv1;
							}
							else {
								xRight = ~~x2;
								zRight = z2;
								nRight = n2;
								shRight = sh2;
								svRight = sv2;
							}

							if(xLeft > xRight) {
								var temp;
								temp = xLeft;
								xLeft = xRight;
								xRight = temp;
								temp = zLeft;
								zLeft = zRight;
								zRight = temp;
								temp = nLeft;
								nLeft = nRight;
								nRight = temp;
								temp = shLeft;
								shLeft = shRight;
								shRight = temp;
								temp = svLeft;
								svLeft = svRight;
								svRight = temp;
							}

							var zInc = (xLeft != xRight) ? ((zRight - zLeft) / (xRight - xLeft)) : 1;
							var nInc = (xLeft != xRight) ? ((nRight - nLeft) / (xRight - xLeft)) : 1;
							var shInc = (xLeft != xRight) ? ((shRight - shLeft) / (xRight - xLeft)) : 1;
							var svInc = (xLeft != xRight) ? ((svRight - svLeft) / (xRight - xLeft)) : 1;
							if(xLeft < 0) {
								zLeft -= xLeft * zInc;
								nLeft -= xLeft * nInc;
								shLeft -= shLeft * shInc;
								svLeft -= svLeft * svInc;
								xLeft = 0;
							}
							if(xRight >= w) {
								xRight = w - 1;
							}
							var pix = linebase + xLeft;
							if(isOpaque) {
								for(var x=xLeft, z=zLeft, n=nLeft, sh=shLeft, sv=svLeft; x<=xRight; x++, z+=zInc, n+=nInc, sh+=shInc, sv+=svInc) {
									if(z > zbuf[pix]) {
										zbuf[pix] = z;
										var color = palette[n > 0 ? (~~n) : 0];
										var stexel = sdata[(sv & sbound) * sdim + (sh & sbound)];
										var rr = (((color & 0xff0000) >> 16) * ((stexel & 0xff0000) >> 8));
										var gg = (((color & 0xff00) >> 8) * ((stexel & 0xff00) >> 8));
										var bb = ((color & 0xff) * (stexel & 0xff)) >> 8;
										cbuf[pix] = 0xff000000 | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
							else {
								for(var x=xLeft, z=zLeft, n=nLeft, sh=shLeft, sv=svLeft; x<xRight; x++, z+=zInc, n+=nInc, sh+=shInc, sv+=svInc) {
									if(z > zbuf[pix]) {
										var color = palette[n > 0 ? (~~n) : 0];
										var foreColor = sdata[(sv & sbound) * sdim + (sh & sbound)];
										var backColor = cbuf[pix];										
										var rr = (((color & 0xff0000) >> 16) * ((foreColor & 0xff0000) >> 8));
										var gg = (((color & 0xff00) >> 8) * ((foreColor & 0xff00) >> 8));
										var bb = ((color & 0xff) * (foreColor & 0xff)) >> 8;
										var aa = (backColor | color) & 0xff000000;
										rr = (rr * opaci + (backColor & 0xff0000) * trans) >> 8;
										gg = (gg * opaci + (backColor & 0xff00) * trans) >> 8;
										bb = (bb * opaci + (backColor & 0xff) * trans) >> 8;
										cbuf[pix] = aa | (rr & 0xff0000) | (gg & 0xff00) | (bb & 0xff);
										sbuf[pix] = id;
									}
									pix++;
								}
							}
						}

						// step up to next scanline
						//
						x0 -= xStep0;
						z0 -= zStep0;
						n0 -= nStep0;
						sh0 -= shStep0;
						sv0 -= svStep0;
						if(y > Ys[mid]) {
							x1 -= xStep1;
							z1 -= zStep1;
							n1 -= nStep1;
							sh1 -= shStep1;
							sv1 -= svStep1;
						}
						else {
							x2 -= xStep2;
							z2 -= zStep2;
							n2 -= nStep2;
							sh2 -= shStep2;
							sv2 -= svStep2;
						}
						linebase -= w;
					}
				}

				v1 = v2;
				vn1 = vn2;
			} while (ibuf[j] != -1);

			j++;
		}
	}
};

JSC3D.Viewer.prototype.params = null;
JSC3D.Viewer.prototype.canvas = null;
JSC3D.Viewer.prototype.ctx2d = null;
JSC3D.Viewer.prototype.canvasData = null;
JSC3D.Viewer.prototype.bkgColorBuffer = null;
JSC3D.Viewer.prototype.colorBuffer = null;
JSC3D.Viewer.prototype.zBuffer = null;
JSC3D.Viewer.prototype.selectionBuffer = null;
JSC3D.Viewer.prototype.frameWidth = 0;
JSC3D.Viewer.prototype.frameHeight = 0;
JSC3D.Viewer.prototype.scene = null;
JSC3D.Viewer.prototype.textures = []; /* Textures preload & materials collection */
JSC3D.Viewer.prototype.materials = []; /* Textures preload & materials collection */
JSC3D.Viewer.prototype.defaultMaterial = null;
JSC3D.Viewer.prototype.sphereMap = null;
JSC3D.Viewer.prototype.isLoaded = false;
JSC3D.Viewer.prototype.isFailed = false;
JSC3D.Viewer.prototype.needUpdate = false;
JSC3D.Viewer.prototype.needRepaint = false;
JSC3D.Viewer.prototype.initRotX = 0;
JSC3D.Viewer.prototype.initRotY = 0;
JSC3D.Viewer.prototype.initRotZ = 0;
JSC3D.Viewer.prototype.initSceneRotation = 0; /* Scene Rotation */
JSC3D.Viewer.prototype.sceneRotation = 0; /* Scene Rotation */
JSC3D.Viewer.prototype.zoomFactor = 1;
JSC3D.Viewer.prototype.panning = [0, 0];
JSC3D.Viewer.prototype.rotation = [0, 0, 0]; /* Scene Rotation */
JSC3D.Viewer.prototype.fps = 0; /* FPS */
JSC3D.Viewer.prototype.frameNumber = 0; /* FPS */
JSC3D.Viewer.prototype.rotMatrix = null;
JSC3D.Viewer.prototype.transformMatrix = null;
JSC3D.Viewer.prototype.sceneUrl = '';
JSC3D.Viewer.prototype.modelColor = 0xcaa618;
JSC3D.Viewer.prototype.bkgColor1 = 0xffffff;
JSC3D.Viewer.prototype.bkgColor2 = 0xffff80;
JSC3D.Viewer.prototype.renderMode = 'flat';
JSC3D.Viewer.prototype.definition = 'standard';
JSC3D.Viewer.prototype.isCullingDisabled = false;
JSC3D.Viewer.prototype.isMipMappingOn = false;
JSC3D.Viewer.prototype.creaseAngle = -180;
JSC3D.Viewer.prototype.sphereMapUrl = '';
JSC3D.Viewer.prototype.showProgressBar = true;
JSC3D.Viewer.prototype.isAutoUpdateOn = false; /* FPS */
JSC3D.Viewer.prototype.autoRotateSpeed = 0; /* AutoRotation */
JSC3D.Viewer.prototype.lightingMode = 'standard'; /* Lighting */
JSC3D.Viewer.prototype.showLights = false; /* Lighting */
JSC3D.Viewer.prototype.buttonStates = null;
JSC3D.Viewer.prototype.keyStates = null;
JSC3D.Viewer.prototype.mouseX = 0;
JSC3D.Viewer.prototype.mouseY = 0;
/**
 * {Function} A callback function that will be invoked as soon as a new loading is started.
 */
JSC3D.Viewer.prototype.onloadingstarted = null;
/**
 * {Function} A callback function that will be invoked when the previous loading finished successfully.
 */
JSC3D.Viewer.prototype.onloadingcomplete = null;
/**
 * {Function} A callback function that will be invoked 0, once or several times as a loading is in progress.
 */
JSC3D.Viewer.prototype.onloadingprogress = null;
/**
 * {Function} A callback function that will be invoked when the previous loading has been aborted.
 */
JSC3D.Viewer.prototype.onloadingaborted = null;
/**
 * {Function} A callback function that will be invoked when error occurs in loading.
 */
JSC3D.Viewer.prototype.onloadingerror = null;
/**
 * {Function} A callback function that will be invoked when there is a mousedown event on the canvas.
 */
JSC3D.Viewer.prototype.onmousedown = null;
/**
 * {Function} A callback function that will be invoked when there is a mouseup event on the canvas.
 */
JSC3D.Viewer.prototype.onmouseup = null;
/**
 * {Function} A callback function that will be invoked when there is a mousemove event on the canvas.
 */
JSC3D.Viewer.prototype.onmousemove = null;
/**
 * {Function} A callback function that will be invoked when there is a mousewheel event on the canvas.
 */
JSC3D.Viewer.prototype.onmousewheel = null;
/**
 * {Function} A callback function that will be invoked when there is a mouseclick event on the canvas.
 */
JSC3D.Viewer.prototype.onmouseclick = null;
/**
 * {Function} A callback function that will be invoked before each update.
 */
JSC3D.Viewer.prototype.beforeupdate = null;
/**
 * {Function} A callback function that will be invoked after each update.
 */
JSC3D.Viewer.prototype.afterupdate = null;
JSC3D.Viewer.prototype.mouseUsage = 'default';
JSC3D.Viewer.prototype.isDefaultInputHandlerEnabled = false;
JSC3D.Viewer.prototype.isSceneRotationEnabled = false; /* Scene Rotation */
JSC3D.Viewer.prototype.onscenerotation = null; /* Scene Rotation */
JSC3D.Viewer.prototype.ontick = null; /* FPS */

/**
	@class PickInfo

	PickInfo is used as the return value of {JSC3D.Viewer}'s pick() method, holding picking result on a given position
	on the canvas.
 */
JSC3D.PickInfo = function() {
	/**
	 * {Number} X coordinate on canvas.
	 */
	this.canvasX = 0;
	/**
	 * {Number} Y coordinate on canvas.
	 */
	this.canvasY = 0;
	/**
	 * {Number} The depth value.
	 */
	this.depth = -Infinity;
	/**
	 * {JSC3D.Mesh} Mesh picked on current position or null if none.
	 */
	this.mesh = null;
};


/**
	@class Scene

	This class implements scene that contains a group of meshes that forms the world. 
 */
JSC3D.Scene = function(name) {
	this.name = name || '';
	this.srcUrl = '';
	this.aabb = null;
	this.children = [];
	this.maxChildId = 1;
	this.currentMesh = null; /* Selected mesh */
	this.isLightingOn = false; /* Lighting */
	this.rotMat = new JSC3D.Matrix3x4; /* Lighting */
	this.xformMat = new JSC3D.Matrix3x4; /* Lighting */
	this.lights = []; /* Lighting */
};

/**
	Initialize the scene.
 */
JSC3D.Scene.prototype.init = function() {
	if(this.isEmpty())
		return;
	
	this.currentMesh = null; /* Selected mesh */
	
	for(var i=0; i<this.children.length; i++)
		this.children[i].init();

	if(!this.aabb) {
		this.aabb = new JSC3D.AABB;
		this.calcAABB();
	}
};

/**
	See if the scene is empty.
	@returns {Boolean} true if it does not contain meshes; false if it has any.
 */
JSC3D.Scene.prototype.isEmpty = function() {
	return (this.children.length == 0);
};

/**
	Add a mesh to the scene.
	@param {JSC3D.Mesh} mesh the mesh to be added.
 */
JSC3D.Scene.prototype.addChild = function(mesh) {
	mesh.internalId = this.maxChildId++;
	/* Mesh positioning */
	if (!mesh.axis) {
		mesh.setAxis();
	}

	this.children.push(mesh);
};

/**
	Remove a mesh from the scene.
	@param {JSC3D.Mesh} mesh the mesh to be removed.
 */
JSC3D.Scene.prototype.removeChild = function(mesh) {
	var foundAt = this.children.indexOf(mesh);
	if(foundAt >= 0)
		this.children.splice(foundAt, 1);
};

/**
	Get all meshes in the scene.
	@returns {Array} meshes as an array.
 */
JSC3D.Scene.prototype.getChildren = function() {
	return this.children.slice(0);
};

/**
	Traverse meshes in the scene, calling a given function on each of them.
	@param {Function} operator a function that will be called on each mesh.
 */
JSC3D.Scene.prototype.forEachChild = function(operator) {
	if((typeof operator) != 'function')
		return;

	for(var i=0; i<this.children.length; i++) {
		if(operator.call(null, this.children[i]))
			break;
	}
};

/**
	Calculate AABB of the scene.
	@private
 */
JSC3D.Scene.prototype.calcAABB = function() {
	this.aabb.minX = this.aabb.minY = this.aabb.minZ = Infinity;
	this.aabb.maxX = this.aabb.maxY = this.aabb.maxZ = -Infinity;
	for(var i=0; i<this.children.length; i++) {
		var child = this.children[i];
		if(!child.isTrivial()) {
			var minX = child.aabb.minX;
			var minY = child.aabb.minY;
			var minZ = child.aabb.minZ;
			var maxX = child.aabb.maxX;
			var maxY = child.aabb.maxY;
			var maxZ = child.aabb.maxZ;
			if(this.aabb.minX > minX)
				this.aabb.minX = minX;
			if(this.aabb.minY > minY)
				this.aabb.minY = minY;
			if(this.aabb.minZ > minZ)
				this.aabb.minZ = minZ;
			if(this.aabb.maxX < maxX)
				this.aabb.maxX = maxX;
			if(this.aabb.maxY < maxY)
				this.aabb.maxY = maxY;
			if(this.aabb.maxZ < maxZ)
				this.aabb.maxZ = maxZ;
		}
	}
};

/**
 * {String} Name of the scene.
 */
JSC3D.Scene.prototype.name = '';
/**
 * {String} Source URL of the scene, empty if none. Read only.
 */
JSC3D.Scene.prototype.srcUrl = '';
/**
 * {JSC3D.AABB} The Axis-aligned bounding box of the whole scene. Read only.
 */
JSC3D.Scene.prototype.aabb = null;
JSC3D.Scene.prototype.children = null;
JSC3D.Scene.prototype.maxChildId = 1;
JSC3D.Scene.prototype.currentMesh = null; /* Selected mesh */
JSC3D.Scene.prototype.isLightingOn = false; /* Lighting */
JSC3D.Scene.prototype.xformMat = null; /* Lighting */
JSC3D.Scene.prototype.lights = []; /* Lighting */

/**
	Mesh grouping by name
 */
JSC3D.Scene.prototype.getMeshes = function(groupName) {
	var meshes = [];
	for (var i=0,l=this.children.length; i<l; i++) {
		var mesh = this.children[i];
		if (mesh.name === groupName) {
			meshes.push(mesh);
		}
	}
	return meshes;
};

JSC3D.Scene.prototype.renameMeshes = function(groupName, newGroupName) {
	var meshes = this.getMeshes(groupName);
	for(var i=0, l=meshes.length; i<l; i++) {
		var mesh = meshes[i];
		mesh.setGroupName(newGroupName);
	}
};

JSC3D.Scene.prototype.rotateMeshes = function(groupName, rotation, rotationMode) {
	var meshes = this.getMeshes(groupName);
	for(var i=0, l=meshes.length; i<l; i++) {
		var mesh = meshes[i];
		mesh.rotate(rotation, rotationMode);
	}
};

JSC3D.Scene.prototype.translateMeshes = function(groupName, translation, translationMode) {
	var meshes = this.getMeshes(groupName);
	for(var i=0, l=meshes.length; i<l; i++) {
		var mesh = meshes[i];
		mesh.translate(translation, translationMode);
	}
};

JSC3D.Scene.prototype.scaleMeshes = function(groupName, scaling, scaleMode) {
	var meshes = this.getMeshes(groupName);
	for(var i=0, l=meshes.length; i<l; i++) {
		var mesh = meshes[i];
		mesh.scale(scaling, scaleMode);
	}
};

JSC3D.Scene.prototype.transformMeshes = function(groupName, rotation, rotationMode, translation, translationMode, scaling, scaleMode) {
	var meshes = this.getMeshes(groupName);
	for(var i=0, l=meshes.length; i<l; i++) {
		var mesh = meshes[i];
		mesh.transform(rotation, rotationMode, translation, translationMode, scaling, scaleMode);
	}
};

/* Mesh clone +++ */
JSC3D.Scene.prototype.cloneMeshes = function(groupName, newGroupName, rotation, rotationMode, translation, translationMode, scaling, scaleMode) {
	var meshes = this.getMeshes(groupName);
	for(var i=0, l=meshes.length; i<l; i++) {
		var mesh = meshes[i];
		var newMesh = mesh.clone(newGroupName, rotation, rotationMode, translation, translationMode, scaling, scaleMode);
		this.addChild(newMesh);
	}
};
/* Mesh clone --- */

/**
	Groundplane, thanks: humu2009
 */
JSC3D.Scene.prototype.makeGroundPlane = function(color, texture, renderMode) {
	var rMode = renderMode || 'wireframe';
	var lightingCast = true;
	var aabb = this.aabb;
	var planeCenter = aabb.center();
	var planeHalfSize = 0.5 * Math.max(aabb.maxX - aabb.minX, aabb.maxZ - aabb.minZ);

	var planeMinX = planeCenter[0] - planeHalfSize;
	var planeMinZ = planeCenter[2] - planeHalfSize;

	/* move the ground plane slightly off the bottom of the bounding box */
	/* to avoid potential z-fighting between the plane and the model */
	var planeY = aabb.minY - 0.001 * (aabb.maxY - aabb.minY);
	/* construct the ground plane */
	var plane = new JSC3D.Mesh;
	plane.name = 'groundplane';
	
	if (renderMode == 'texture' || renderMode == 'textureflat' || renderMode == 'texturesmooth') {
		plane.vertexBuffer = [planeMinZ,planeY,-planeMinX, -planeMinZ,planeY,-planeMinX, -planeMinZ,planeY,planeMinX, planeMinZ,planeY,planeMinX];
		plane.indexBuffer = [0,1,2,-1,3,0,2,-1];
		plane.texCoordBuffer = [1,0,0,0,0,1,1,1];
		plane.texCoordIndexBuffer = [0,1,2,-1,3,0,2,-1];		
	} else {
		/* to be simple, we just split the ground plane to 10x10 sub faces */
		var numOfGridsPerDimension = 10;
		var sizePerGrid = 2 * planeHalfSize / numOfGridsPerDimension;
		/* compute vertices of the plane */
		plane.vertexBuffer = [];
		for (var i=0; i<=numOfGridsPerDimension; i++) {
			for (var j=0; j<=numOfGridsPerDimension; j++) {
				plane.vertexBuffer.push(planeMinX + j * sizePerGrid, planeY, planeMinZ + i * sizePerGrid);
			}
		}
		/* compute indices of the plane */
		plane.indexBuffer = [];
		for (var i=0; i<numOfGridsPerDimension; i++) {
			for (var j=0; j<numOfGridsPerDimension; j++) {
				plane.indexBuffer.push(i * (numOfGridsPerDimension + 1) + j, (i + 1) * (numOfGridsPerDimension + 1) + j, (i + 1) * (numOfGridsPerDimension + 1) + j + 1, i * (numOfGridsPerDimension + 1) + j + 1, -1);
			}
		}
	}
	plane.isDoubleSided = true; /* disable backface culling */
	if (renderMode == 'point' || renderMode == 'wireframe' || renderMode == 'flat' || renderMode == 'texture')
		lightingCast = false;
	
	if (texture) {
		plane.setTexture(texture);
		plane.texture.isLightingCast = lightingCast;
	}

	if (color) {
		plane.setMaterial(new JSC3D.Material('groundplane', undefined, color));
		plane.material.isLightingCast = lightingCast;
	}

	plane.setRenderMode(rMode);
	plane.init();
	this.addChild(plane);
	return this.children[this.children.length-1];
};

/**
	Icosahedron, generator code from "Tessellation of sphere" http://student.ulb.ac.be/~claugero/sphere/index.html
 */
JSC3D.Scene.prototype.makeLightSphere = function(color, renderMode) {
	var sphere = new JSC3D.Mesh;
	var id = this.lights.length;
	sphere.name = 'light';
	sphere.groupIndex = id;
	sphere.vertexBuffer = [];
	sphere.indexBuffer = [];
	
	var s = 1, 
		r = (1+Math.sqrt(5))/2, 
		t = (r/Math.sqrt(1+r*r)) * s, 
		o = (1/Math.sqrt(1+r*r)) * s;
	var icosahedron = {
		points: [[t,o,0],[-t,o,0],[-t,-o,0],[t,-o,0],[o,0,t],[o,0,-t],[-o,0,-t],[-o,0,t],[0,t,o],[0,-t,o],[0,-t,-o],[0,t,-o]],
		faces: [[4,8,7],[4,7,9],[5,6,11],[5,10,6],[0,4,3],[0,3,5],[2,7,1],[2,1,6],[8,0,11],[8,11,1],[9,10,3],[9,2,10],[8,4,0],[11,0,5],[4,9,3],[5,3,10],[7,8,1],[6,1,11],[7,2,9],[6,10,2]]
	};
	
	for(var i=0,l=icosahedron.points.length; i<l; i++) {
		for(var j=0; j<3; j++) {
			sphere.vertexBuffer.push(icosahedron.points[i][j]);
		}
	}
	for(var i=0,l=icosahedron.faces.length; i<l; i++) {
		for(var j=0; j<3; j++) {
			sphere.indexBuffer.push(icosahedron.faces[i][j]);
		}
		sphere.indexBuffer.push(-1);
	}
	
	sphere.creaseAngle = 41;
	sphere.init();
	sphere.setRenderMode(renderMode);
	sphere.setMaterial(new JSC3D.Material('light-'+id, undefined, color));
	this.addChild(sphere);
	return this.children[this.children.length-1];
} 
 
/**
	Lighting
 */
JSC3D.Scene.prototype.addLight = function(posX, posY, posZ, ambientColor, diffuseColor, enabled, visible) {
	var aabb = this.aabb;
	var size = 0.01 * Math.max(aabb.maxX - aabb.minX, aabb.maxZ - aabb.minZ);
	var id = this.lights.length;

	if (id == 6) {
		if(JSC3D.console)
			JSC3D.console.logError('Cannot add another light. Max number of lights reached!');
	}
		
	var light = new JSC3D.Light('light-'+(id+1),[posX, posY, posZ], ambientColor, diffuseColor, enabled);
	this.lights.push(light);
	var mesh = this.makeLightSphere(diffuseColor, 'flat');
	mesh.isPositionFixed = true;
	mesh.resize([size,size,size], 'center');
	mesh.translate([posX,posY,posZ], 'scene');
	mesh.visible = this.isLightingOn ? visible : false;
}
 
/**
	@class Mesh

	This class implements mesh that is used as an expression of 3D object and the basic primitive for rendering. <br />
	A mesh basically consists of a sequence of faces, and optioanlly a material, a texture mapping and other attributes and metadata.<br />
	A face consists of 3 or more coplanary vertex that should be descript in counter-clockwise order.<br />
	A texture mapping includes a valid texture object with a sequence of texture coordinats specified per vertex.<br />
 */
 /**
 	Mesh positioning 
		rotation center (pivoting)
			options:
				"axis":   mesh will rotate about mesh axis using stored translation
				"scene":  mesh will rotate about scene center, e.g. "orbit"
				"center": mesh will rotate about mesh.aabb.center
			default: 
				"center"
		resize center (direction of increase/decrease size)
			options:
				"plus":   mesh.aabb.minX, .minY, .minZ remains untouched
				"minus":  mesh.aabb.maxX, .maxY, .maxZ remains untouched
				"center": mesh will resize centered to mesh.aabb.center
			default: 
				"center"
*/
JSC3D.Mesh = function(name, visible, material, texture, creaseAngle, doubleSided, positionFixed, coordBuffer, indexBuffer, texCoordBuffer, texCoordIndexBuffer) {
	this.name = name || '';
	this.groupIndex = 0; /* Mesh grouping by name */
	this.metadata = '';
	this.visible = (visible != undefined) ? visible : true;
	this.renderMode = null;
	this.aabb = null;
	this.axis = null; /* Mesh positioning */
	this.rotation = [0,0,0]; /* Mesh positioning */
	this.translation = [0,0,0]; /* Mesh positioning */
	this.scaling = [1,1,1]; /* Mesh positioning */
	this.vertexBuffer = coordBuffer || null;
	this.indexBuffer = indexBuffer || null;
	this.vertexNormalBuffer = null;
	this.vertexNormalIndexBuffer = null;
	this.faceNormalBuffer = null;
	this.material = material || null;
	this.texture = texture || null;
	this.faceCount = 0;
	this.creaseAngle = (creaseAngle >= 0) ? creaseAngle : -180;
	this.isDoubleSided = (typeof doubleSided) == 'boolean' ? doubleSided : false;
	this.isPositionFixed = (typeof positionFixed == 'boolean') ? positionFixed : false; /* Lighting */
	this.internalId = 0;
	this.texCoordBuffer = texCoordBuffer || null;
	this.texCoordIndexBuffer = texCoordIndexBuffer || null;
	this.transformedVertexBuffer = null;
	this.transformedVertexNormalZBuffer = null;
	this.transformedFaceNormalZBuffer = null;
	this.transformedVertexNormalBuffer = null;
};

/**
	Initialize the mesh.
 */
JSC3D.Mesh.prototype.init = function() {
	if(this.isTrivial()) {
		return;
	}

	if(this.faceCount == 0) {
		this.calcFaceCount();
		if(this.faceCount == 0)
			return;
	}

	if(!this.aabb) {
		this.aabb = new JSC3D.AABB;
		this.calcAABB();
	}

	if(!this.faceNormalBuffer) {
		this.faceNormalBuffer = new Array(this.faceCount * 3);
		this.calcFaceNormals();
	}

	if(!this.vertexNormalBuffer) {
		if(this.creaseAngle >= 0) {
			this.calcCreasedVertexNormals();
		}
		else {
			this.vertexNormalBuffer = new Array(this.vertexBuffer.length);
			this.calcVertexNormals();
		}
	}

	this.normalizeFaceNormals();

	this.transformedVertexBuffer = new Array(this.vertexBuffer.length);
};

/**
	See if the mesh is a trivial mesh. A trivial mesh should be omited in any calculation or rendering.
	@returns {Boolean} true if it is trivial; false if not.
 */
JSC3D.Mesh.prototype.isTrivial = function() {
	return ( !this.vertexBuffer || this.vertexBuffer.length < 3 || 
			 !this.indexBuffer || this.indexBuffer.length < 3 );
};

/**
	Set material for the mesh.
	@param {JSC3D.Material} material the material object.
 */
JSC3D.Mesh.prototype.setMaterial = function(material) {
	this.material = material;
};

/**
	Set texture for the mesh.
	@param {JSC3D.Texture} texture the texture object.
 */
JSC3D.Mesh.prototype.setTexture = function(texture) {
	this.texture = texture;
};

/**
	See if the mesh has valid texture mapping.
	@returns {Boolean} true if it has valid texture mapping; false if not.
 */
JSC3D.Mesh.prototype.hasTexture = function() {
	return ( (this.texture != null) && this.texture.hasData() &&
			 (this.texCoordBuffer != null) && (this.texCoordBuffer.length >= 2) && 
			 ((this.texCoordIndexBuffer == null) || ((this.texCoordIndexBuffer.length >= 3) && (this.texCoordIndexBuffer.length >= this.indexBuffer.length))) );
};

/**
	Set render mode of the mesh.<br />
	Available render modes are:<br />
	'<b>point</b>':         render meshes as point clouds;<br />
	'<b>wireframe</b>':     render meshes as wireframe;<br />
	'<b>flat</b>':          render meshes as solid objects using flat shading;<br />
	'<b>smooth</b>':        render meshes as solid objects using smooth shading;<br />
	'<b>texture</b>':       render meshes as solid textured objects, no lighting will be apllied;<br />
	'<b>textureflat</b>':   render meshes as solid textured objects, lighting will be calculated per face;<br />
	'<b>texturesmooth</b>': render meshes as solid textured objects, lighting will be calculated per vertex and interpolated.<br />
	@param {String} mode new render mode.
 */
JSC3D.Mesh.prototype.setRenderMode = function(mode) {
	this.renderMode = mode;
};

/**
	Calculate count of faces.
	@private
 */
JSC3D.Mesh.prototype.calcFaceCount = function() {
	this.faceCount = 0;

	var ibuf = this.indexBuffer;

	// add the last -1 if it is omitted
	if(ibuf[ibuf.length - 1] != -1)
		ibuf.push(-1);

	for(var i=0; i<ibuf.length; i++) {
		if(ibuf[i] == -1)
			this.faceCount++;
	}
};

/**
	Calculate AABB of the mesh.
	@private
 */
JSC3D.Mesh.prototype.calcAABB = function() {
	var minX, minY, minZ, maxX, maxY, maxZ;
	minX = minY = minZ = Infinity;
	maxX = maxY = maxZ = -Infinity;

	var vbuf = this.vertexBuffer;
	for(var i=0; i<vbuf.length; i+=3) {
		var x = vbuf[i    ];
		var y = vbuf[i + 1];
		var z = vbuf[i + 2];

		if(x < minX)
			minX = x;
		if(x > maxX)
			maxX = x;
		if(y < minY)
			minY = y;
		if(y > maxY)
			maxY = y;
		if(z < minZ)
			minZ = z;
		if(z > maxZ)
			maxZ = z;
	}

	this.aabb.minX = minX;
	this.aabb.minY = minY;
	this.aabb.minZ = minZ;
	this.aabb.maxX = maxX;
	this.aabb.maxY = maxY;
	this.aabb.maxZ = maxZ;
};

/**
	Mesh movements - get scale as units e.g. width, height, depht
 */
JSC3D.Mesh.prototype.getSize = function() {
	var meshBox = this.aabb;
	return [meshBox.maxX - meshBox.minX, meshBox.maxY - meshBox.minY, meshBox.maxZ - meshBox.minZ];
};

/**
	Mesh movements - set pivot for Mesh.rotationMode="axis" from current position
 */
JSC3D.Mesh.prototype.setAxis = function() {
	if(!this.aabb) {
		this.aabb = new JSC3D.AABB;
		this.calcAABB();
	}
	this.axis = this.aabb.center();
}
	
/**
	Calculate per face normals. The result remain un-normalized for later vertex normal calculations.
	@private
 */
JSC3D.Mesh.prototype.calcFaceNormals = function() {
	var vbuf = this.vertexBuffer;
	var ibuf = this.indexBuffer;
	var nbuf = this.faceNormalBuffer;
	var i = 0, j = 0;
	while(i < ibuf.length) {
		var index = ibuf[i++] * 3;
		var x0 = vbuf[index    ];
		var y0 = vbuf[index + 1];
		var z0 = vbuf[index + 2];

		index = ibuf[i++] * 3;
		var x1 = vbuf[index    ];
		var y1 = vbuf[index + 1];
		var z1 = vbuf[index + 2];

		index = ibuf[i++] * 3;
		var x2 = vbuf[index    ];
		var y2 = vbuf[index + 1];
		var z2 = vbuf[index + 2];

		var dx1 = x1 - x0;
		var dy1 = y1 - y0;
		var dz1 = z1 - z0;
		var dx2 = x2 - x0;
		var dy2 = y2 - y0;
		var dz2 = z2 - z0;

		var nx = dy1 * dz2 - dz1 * dy2;
		var ny = dz1 * dx2 - dx1 * dz2;
		var nz = dx1 * dy2 - dy1 * dx2;

		nbuf[j++] = nx;
		nbuf[j++] = ny;
		nbuf[j++] = nz;

		do {
		} while (ibuf[i++] != -1);
	}
};

/**
	Normalize face normals.
	@private
 */
JSC3D.Mesh.prototype.normalizeFaceNormals = function() {
	JSC3D.Math3D.normalizeVectors(this.faceNormalBuffer, this.faceNormalBuffer);
};

/**
	Calculate per vertex normals.
	@private
 */
JSC3D.Mesh.prototype.calcVertexNormals = function() {
	if(!this.faceNormalBuffer) {
		this.faceNormalBuffer = new Array(this.faceCount * 3);
		this.calcFaceNormals();
	}

	var vbuf = this.vertexBuffer;
	var ibuf = this.indexBuffer;
	var fnbuf = this.faceNormalBuffer;
	var vnbuf = this.vertexNormalBuffer;
	for(var i=0; i<vnbuf.length; i++) {
		vnbuf[i] = 0;
	}

	// in this case, the vertex normal index buffer should be set to null 
	// since the vertex index buffer will be used to reference vertex normals
	this.vertexNormalIndexBuffer = null;

	var numOfVertices = vbuf.length / 3;

	/*
		Generate vertex normals.
		Normals of faces around each vertex will be summed to calculate that vertex normal.
	*/
	var i = 0, j = 0, k = 0;
	while(i < ibuf.length) {
		k = ibuf[i++];
		if(k == -1) {
			j += 3;
		}
		else {
			var index = k * 3;
			// add face normal to vertex normal
			vnbuf[index    ] += fnbuf[j    ];
			vnbuf[index + 1] += fnbuf[j + 1];
			vnbuf[index + 2] += fnbuf[j + 2];
		}
	}

	// normalize vertex normals
	JSC3D.Math3D.normalizeVectors(vnbuf, vnbuf);
};

/**
	Calculate per vertex normals. The given crease-angle will be taken into account.
	@private
 */
JSC3D.Mesh.prototype.calcCreasedVertexNormals = function() {
	if(!this.faceNormalBuffer) {
		this.faceNormalBuffer = new Array(this.faceCount * 3);
		this.calcFaceNormals();
	}

	var ibuf = this.indexBuffer;
	var numOfVerts = this.vertexBuffer.length / 3;

	/*
		Go through vertices. For each one, record the indices of faces who touch this vertex.
		The new length of the vertex normal buffer will also be calculated.
	*/
	var vertTouchedFaces = new Array(numOfVerts);
	var expectedVertNormalBufferLength = 0;
	for(var i=0, findex=0, vindex=0; i<ibuf.length; i++) {
		vindex = ibuf[i];
		if(vindex >= 0) {
			expectedVertNormalBufferLength += 3;
			var faces = vertTouchedFaces[vindex];
			if(!faces)
				vertTouchedFaces[vindex] = [findex];
			else
				faces.push(findex);
		}
		else {
			findex++;
		}
	}

	var fnbuf = this.faceNormalBuffer;
	// generate normalized face normals which will be used for calculating dot product
	var nfnbuf = new Array(fnbuf.length);
	JSC3D.Math3D.normalizeVectors(fnbuf, nfnbuf);

	// realloc and initialize the vertex normal buffer
	if(!this.vertexNormalBuffer || this.vertexNormalBuffer.length < expectedVertNormalBufferLength)
		this.vertexNormalBuffer = new Array(expectedVertNormalBufferLength);
	var vnbuf = this.vertexNormalBuffer;
	for(var i=0; i<vnbuf.length; i++) {
		vnbuf[i] = 0;
	}

	// the vertex normal index buffer will be re-calculated
	this.vertexNormalIndexBuffer = [];
	var nibuf = this.vertexNormalIndexBuffer;

	/* 
		Generate vertex normals and normal indices. 
		In this case, There will be a separate normal for each vertex of each face.
	*/
	var threshold = Math.cos(this.creaseAngle * Math.PI / 180);
	for(var i=0, vindex=0, nindex=0, findex0=0; i<ibuf.length; i++) {
		vindex = ibuf[i];
		if(vindex >= 0) {
			var n = nindex * 3; 
			var f0 = findex0 * 3;
			// add face normal to vertex normal
			vnbuf[n    ] += fnbuf[f0    ];
			vnbuf[n + 1] += fnbuf[f0 + 1];
			vnbuf[n + 2] += fnbuf[f0 + 2];
			var fnx0 = nfnbuf[f0    ];
			var fny0 = nfnbuf[f0 + 1];
			var fnz0 = nfnbuf[f0 + 2];
			// go through faces around this vertex, accumulating normals
			var faces = vertTouchedFaces[vindex];
			for(var j=0; j<faces.length; j++) {
				var findex1 = faces[j];
				if(findex0 != findex1) {
					var f1 = findex1 * 3;
					var fnx1 = nfnbuf[f1    ];
					var fny1 = nfnbuf[f1 + 1];
					var fnz1 = nfnbuf[f1 + 2];
					// if the angle between normals of the adjacent faces is less than the crease-angle, the 
					// normal of the other face will be accumulated to the vertex normal of the current face
					if(fnx0 * fnx1 + fny0 * fny1 + fnz0 * fnz1 > threshold) {
						vnbuf[n    ] += fnbuf[f1    ];
						vnbuf[n + 1] += fnbuf[f1 + 1];
						vnbuf[n + 2] += fnbuf[f1 + 2];
					}
				}
			}
			nibuf.push(nindex++);
		}
		else {
			findex0++;
			nibuf.push(-1);
		}
	}

	// normalize the results
	JSC3D.Math3D.normalizeVectors(vnbuf, vnbuf);
};

JSC3D.Mesh.prototype.checkValid = function() {
	//TODO: not implemented yet
};

/**
 * {String} Name of the mesh.
 */
JSC3D.Mesh.prototype.name = '';
JSC3D.Mesh.prototype.groupIndex = 0; /* Mesh grouping by name */
JSC3D.Mesh.prototype.metadata = '';
/**
 * {Boolean} Visibility of the mesh. If it is set to false, the mesh will be ignored in rendering.
 */
JSC3D.Mesh.prototype.visible = false;
JSC3D.Mesh.prototype.renderMode = 'flat';
/**
 * {JSC3D.AABB} The Axis-aligned bounding box of the mesh. Read only.
 */
JSC3D.Mesh.prototype.aabb = null;
/** 
 * The Axis position of the mesh. Set to 0 0 0 on mesh load. Read only.
 */
JSC3D.Mesh.prototype.axis = null; /* Mesh positioning */
/** 
 * The Axis rotation of the mesh. Set to 0 0 0 on mesh load. Read only.
 */
JSC3D.Mesh.prototype.rotation = null; /* Mesh positioning */
/** 
 * The Axis translation of the mesh. Set to 0 0 0 on mesh load. Read only.
 */
JSC3D.Mesh.prototype.translation = null; /* Mesh positioning */
/** 
 * The scale factor of the mesh. Set to 0 0 0 on mesh load. Read only.
 */
JSC3D.Mesh.prototype.scaling = null; /* Mesh positioning */
/**
 * {Array} The plain sequence of vertex coordinates of the mesh.
 */
JSC3D.Mesh.prototype.vertexBuffer = null;
/**
 * {Array} The sequence of vertex indices that describe faces. Each face contains at least 3 vertex 
 * indices that are ended by a -1. Faces are not limited to triangles.
 */
JSC3D.Mesh.prototype.indexBuffer = null;
JSC3D.Mesh.prototype.vertexNormalBuffer = null;
JSC3D.Mesh.prototype.vertexNormalIndexBuffer = null;
JSC3D.Mesh.prototype.faceNormalBuffer = null;
/**
 * {Array} The plain sequence of texture coordinates of the mesh, or null if none.
 */
JSC3D.Mesh.prototype.texCoordBuffer = null;
/**
 * {Array} The sequence of tex coord indices. If it is null, the indexBuffer will be used.
 */
JSC3D.Mesh.prototype.texCoordIndexBuffer = null;
JSC3D.Mesh.prototype.material = null;
JSC3D.Mesh.prototype.texture = null;
/**
 * {Number} Number of faces of the mesh. Read only.
 */
JSC3D.Mesh.prototype.faceCount = 0;
/**
 * {Number} An angle to preserve sharp edges in smooth rendering. If the angle between the normals of two adjacent faces exceeds this value, the edge will be recognized as an sharp edge thus it will not be smoothed.
 */
JSC3D.Mesh.prototype.creaseAngle = -180;
/**
 * {Boolean} If set to true, both sides of the faces will be rendered.
 */
JSC3D.Mesh.prototype.isDoubleSided = false;
JSC3D.Mesh.prototype.isPositionFixed = false; /* Lighting */
JSC3D.Mesh.prototype.internalId = 0;
JSC3D.Mesh.prototype.transformedVertexBuffer = null;
JSC3D.Mesh.prototype.transformedVertexNormalZBuffer = null;
JSC3D.Mesh.prototype.transformedFaceNormalZBuffer = null;
JSC3D.Mesh.prototype.transformedVertexNormalBuffer = null;

/* Mesh positioning +++ */
/** 
	rotationMode:
	"axis":   mesh will rotate about mesh axis using stored translation
	"scene":  mesh will rotate about scene center, e.g.: orbit about scene center
	"center": mesh will rotate about mesh.aabb.center
*/
JSC3D.Mesh.prototype.rotate = function(rotation, rotationMode) {
	var xformMat = new JSC3D.Matrix3x4;
	var normalMat = new JSC3D.Matrix3x4;
	var vertexRotMat = new JSC3D.Matrix3x4;
	
	var pivot;
	var center = this.aabb.center();
	switch (rotationMode) {
		case 'axis':
			//pivot = [center[0]-this.axis[0],center[1]-this.axis[1],center[2]-this.axis[2]];
			pivot = [this.translation[0],this.translation[1],this.translation[2]];
			break;
		case 'scene':
			break;
		case 'center':
			pivot = this.aabb.center();
			break;
	}
	
	/* store rotation */
	var f = 360, s = 180;
	rotation[0] %= f; rotation[1] %= f; rotation[2] %= f;
	var maxX = this.rotation[0]+rotation[0]; /* Mesh rotate */
	var maxY = this.rotation[1]+rotation[1]; /* Mesh rotate */
	var maxZ = this.rotation[2]+rotation[2]; /* Mesh rotate */
	
	var degX = rotation[0], degY = rotation[1], degZ = rotation[2];
	if (maxX < -s) degX += f; if (maxX >= s) degX -= f;
	if (maxY < -s) degY += f; if (maxY >= s) degY -= f;
	if (maxZ < -s) degZ += f; if (maxZ >= s) degZ -= f;
	this.rotation[0]+=degX;this.rotation[1]+=degY;this.rotation[2]+=degZ; /* Mesh rotate */
	
	/* rotate normals */
	if (!!degX) normalMat.rotateAboutXAxis(degX);
	if (!!degY) normalMat.rotateAboutYAxis(degY);
	if (!!degZ) normalMat.rotateAboutZAxis(degZ);
	/* generate the rotation matrix, using the desired pivot */
	if (pivot) vertexRotMat.translate(-pivot[0], -pivot[1], -pivot[2]);
	if (!!degX) vertexRotMat.rotateAboutXAxis(degX);
	if (!!degY) vertexRotMat.rotateAboutYAxis(degY);
	if (!!degZ) vertexRotMat.rotateAboutZAxis(degZ);
	if (pivot) vertexRotMat.translate(pivot[0], pivot[1], pivot[2]);
	/* then generate the full transformation matrix */
	xformMat.multiply(vertexRotMat);	
	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.faceNormalBuffer, this.faceNormalBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.vertexNormalBuffer, this.vertexNormalBuffer);
	this.calcAABB();
	this.compiled = null;
};

JSC3D.Mesh.prototype.translate = function(translation, translationMode) {
	var xformMat = new JSC3D.Matrix3x4;

	// TODO: implement translationMode
	/* store translation */
	this.translation[0]+=translation[0];
	this.translation[1]+=translation[1];
	this.translation[2]+=translation[2];
	
	/* translate */
	xformMat.translate(translation[0], translation[1], translation[2]);
	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	this.calcAABB();
	this.compiled = null;
};

/** 
	scaleMode, resizeMode:
	"plus":   mesh.aabb.minX, .minY, .minZ remains untouched
	"minus":  mesh.aabb.maxX, .maxY, .maxZ remains untouched
	"center": mesh will resize centered to mesh.aabb.center
*/
JSC3D.Mesh.prototype.scale = function(scaling, scaleMode) {
	var xformMat = new JSC3D.Matrix3x4;
	var meshBox = this.aabb;
	var actualCenter = meshBox.center();
	
	var pctX = 1, pctY = 1, pctZ = 1;
	if (scaling[0]) { 
		pctX = scaling[0]/this.scaling[0];
		/* store scaling */
		this.scaling[0] *= pctX;
	}
	if (scaling[1]) {
		pctY = scaling[1]/this.scaling[1];
		/* store scaling */
		this.scaling[1] *= pctY;
	}
	if (scaling[2]) {
		pctZ = scaling[2]/this.scaling[2];
		/* store scaling */
		this.scaling[2] *= pctZ;
	}
	/* scale */
	xformMat.scale(pctX, pctY, pctZ);

	/* translate */
	var shiftX = 0, shiftY = 0, shiftZ = 0;
	switch (scaleMode) {
		case 'plus':
			shiftX = meshBox.minX-(meshBox.minX*pctX);
			shiftY = meshBox.minY-(meshBox.minY*pctY);
			shiftZ = meshBox.minZ-(meshBox.minZ*pctZ);
			break;
		case 'minus':
			shiftX = meshBox.maxX-(meshBox.maxX*pctX);
			shiftY = meshBox.maxY-(meshBox.maxY*pctY);
			shiftZ = meshBox.maxZ-(meshBox.maxZ*pctZ);
			break;
		case 'center':
			shiftX = actualCenter[0]-(actualCenter[0]*pctX);
			shiftY = actualCenter[1]-(actualCenter[1]*pctY);
			shiftZ = actualCenter[2]-(actualCenter[2]*pctZ);
			break;
	}
	xformMat.translate(shiftX, shiftY, shiftZ);
	
	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	this.calcAABB();
	this.compiled = null;
	
	var newSize = [meshBox.maxX - meshBox.minX, meshBox.maxY - meshBox.minY, meshBox.maxZ - meshBox.minZ];
};

JSC3D.Mesh.prototype.transform = function(rotation, rotationMode, translation, translationMode, scaling, scaleMode) {
	var pivot;
	var center = this.aabb.center();
	switch (rotationMode) {
		case 'axis':
			//pivot = [center[0]-this.axis[0],center[1]-this.axis[1],center[2]-this.axis[2]];
			pivot = [this.translation[0],this.translation[1],this.translation[2]];
			break;
		case 'scene':
			break;
		case 'center':
			pivot = this.aabb.center();
			break;
	}

	// TODO: implement translationMode: axis by inverting order of matrix rotation/translation
	// TODO: implement scaleMode
	var xformMat = new JSC3D.Matrix3x4;
	var normalMat = new JSC3D.Matrix3x4;
	var vertexRotMat = new JSC3D.Matrix3x4;

	if (rotation) {
		/* store rotation */
		var f = 360, s = 180;
		rotation[0] %= f; rotation[1] %= f; rotation[2] %= f;
		var maxX = this.rotation[0]+rotation[0]; /* Mesh rotate */
		var maxY = this.rotation[1]+rotation[1]; /* Mesh rotate */
		var maxZ = this.rotation[2]+rotation[2]; /* Mesh rotate */
		
		var degX = rotation[0], degY = rotation[1], degZ = rotation[2];
		if (maxX < -s) degX += f; if (maxX >= s) degX -= f;
		if (maxY < -s) degY += f; if (maxY >= s) degY -= f;
		if (maxZ < -s) degZ += f; if (maxZ >= s) degZ -= f;
		this.rotation[0]+=degX;this.rotation[1]+=degY;this.rotation[2]+=degZ; /* Mesh rotate */
		
		if (pivot) vertexRotMat.translate(-pivot[0], -pivot[1], -pivot[2]);	
		normalMat.rotateAboutXAxis(rotation[0]); 
		vertexRotMat.rotateAboutXAxis(rotation[0]); 
		normalMat.rotateAboutYAxis(rotation[1]); 
		vertexRotMat.rotateAboutYAxis(rotation[1]); 
		normalMat.rotateAboutZAxis(rotation[2]); 
		vertexRotMat.rotateAboutZAxis(rotation[2]); 
		if (pivot) vertexRotMat.translate(pivot[0], pivot[1], pivot[2]);
	}
	
	xformMat.multiply(vertexRotMat);
	if (translation) {
		/* store translation */
		this.translation[0]+=translation[0];
		this.translation[1]+=translation[1];
		this.translation[2]+=translation[2];
		xformMat.translate(translation[0], translation[1], translation[2]);
	}
	if (scaling) {
		var pctX = 1, pctY = 1, pctZ = 1;
		if (scaling[0]) { 
			pctX = scaling[0]/this.scaling[0];
			/* store scaling */
			this.scaling[0] *= pctX;
		}
		if (scaling[1]) {
			pctY = scaling[1]/this.scaling[1];
			/* store scaling */
			this.scaling[1] *= pctY;
		}
		if (scaling[2]) {
			pctZ = scaling[2]/this.scaling[2];
			/* store scaling */
			this.scaling[2] *= pctZ;
		}
		xformMat.scale(pctX, pctY, pctZ);
	}
	

	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.faceNormalBuffer, this.faceNormalBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.vertexNormalBuffer, this.vertexNormalBuffer);
}

JSC3D.Mesh.prototype.resize = function(size, resizeMode) {
	var xformMat = new JSC3D.Matrix3x4;
	var meshBox = this.aabb;
	var actualSize = [meshBox.maxX - meshBox.minX, meshBox.maxY - meshBox.minY, meshBox.maxZ - meshBox.minZ];
	var actualCenter = meshBox.center();
	
	var pctX = 1, pctY = 1, pctZ = 1;
	if (size[0]) { 
		pctX = size[0]/actualSize[0];
		/* store scaling */
		this.scaling[0] *= size[0]/actualSize[0];
	}
	if (size[1]) {
		pctY = size[1]/actualSize[1];
		/* store scaling */
		this.scaling[1] *= size[1]/actualSize[1];
	}
	if (size[2]) {
		pctZ = size[2]/actualSize[2];
		/* store scaling */
		this.scaling[2] *= size[2]/actualSize[2];
	}
	
	/* scale */
	xformMat.scale(pctX, pctY, pctZ);

	/* translate */
	var shiftX = 0, shiftY = 0, shiftZ = 0;
	switch (resizeMode) {
		case 'plus':
			shiftX = meshBox.minX-(meshBox.minX*pctX);
			shiftY = meshBox.minY-(meshBox.minY*pctY);
			shiftZ = meshBox.minZ-(meshBox.minZ*pctZ);
			break;
		case 'minus':
			shiftX = meshBox.maxX-(meshBox.maxX*pctX);
			shiftY = meshBox.maxY-(meshBox.maxY*pctY);
			shiftZ = meshBox.maxZ-(meshBox.maxZ*pctZ);
			break;
		case 'center':
			shiftX = actualCenter[0]-(actualCenter[0]*pctX);
			shiftY = actualCenter[1]-(actualCenter[1]*pctY);
			shiftZ = actualCenter[2]-(actualCenter[2]*pctZ);
			break;
	}
	xformMat.translate(shiftX, shiftY, shiftZ);
	
	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	this.calcAABB();
	this.compiled = null;
	
	var newSize = [meshBox.maxX - meshBox.minX, meshBox.maxY - meshBox.minY, meshBox.maxZ - meshBox.minZ];
}

JSC3D.Mesh.prototype.shiftX = function() {
	var xformMat = new JSC3D.Matrix3x4;
	var center = this.aabb.center();
	
	/* relative to mesh position, not to scene aabb center  */
	var cX = center[0];
		
	/* translate */
	xformMat.translate(-2 * cX, 0, 0);
	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	this.calcAABB();
	this.compiled = null;
};

JSC3D.Mesh.prototype.shiftZ = function() {
	var xformMat = new JSC3D.Matrix3x4;
	var center = this.aabb.center();
	
	/* relative to mesh position, not to scene aabb center  */
	var cZ = center[2];	
	
	/* translate */
	xformMat.translate(0, 0, -2 * cZ);
	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	this.calcAABB();
	this.compiled = null;
};

JSC3D.Mesh.prototype.flipX = function() {
	/* move along the X axis and rotate about Y axis */
	var xformMat = new JSC3D.Matrix3x4;
	var xformMat2 = new JSC3D.Matrix3x4;
	var normalMat = new JSC3D.Matrix3x4;
	var vertexRotMat = new JSC3D.Matrix3x4;
	
	var pivot = this.aabb.center();
	
	/* relative to mesh position, not to scene aabb center  */
	var pX = pivot[0], pY = pivot[1], pZ = pivot[2];
	
	/* store rotation with smallest angle */
	var s = 180, r = 90, z = 0;
	var rotY, degY, rotMatY = this.rotation[1]; /* Mesh flipY */
	
	if (rotMatY < z && rotMatY >= -r) {
		rotY = -s-2*rotMatY;
		degY = rotY;
	}
	if (rotMatY >= z && rotMatY < r) {
		rotY = -s-2*rotMatY; 
		degY = rotY;
	}
	if (rotMatY >= r && rotMatY < s) {
		rotY = 2*(s-rotMatY)- s; 
		degY = rotY;
	}
	if (rotMatY < -r && rotMatY >= -s) {
		rotY = s-2*(s+rotMatY);
		degY = rotY;
	}

	this.rotation[1]+=degY; /* Mesh flipX */
	
	/* rotate normals */ 
	normalMat.rotateAboutYAxis(rotY);
	/* generate the rotation matrix, using the center point of mesh's aabb as the the pivot */
	vertexRotMat.translate(-pX, -pY, -pZ);
	vertexRotMat.rotateAboutYAxis(rotY);
	vertexRotMat.translate(pX, pY, pZ);
	
	/* then generate the full transformation matrix */
	xformMat.multiply(vertexRotMat);	
	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.faceNormalBuffer, this.faceNormalBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.vertexNormalBuffer, this.vertexNormalBuffer);
	this.calcAABB();
	
	var center = this.aabb.center();
	/* relative to mesh position, not to scene aabb center  */
	var cX = center[0];
	/* translate */
	xformMat2.translate(-2 * cX, 0, 0);
	JSC3D.Math3D.transformVectors(xformMat2, this.vertexBuffer, this.vertexBuffer);
	this.calcAABB();
	this.compiled = null;
};

JSC3D.Mesh.prototype.flipZ = function() {
	/* move along the Z axis and rotate about Y axis */
	var xformMat = new JSC3D.Matrix3x4;
	var xformMat2 = new JSC3D.Matrix3x4;
	var normalMat = new JSC3D.Matrix3x4;
	var vertexRotMat = new JSC3D.Matrix3x4;
	
	var pivot = this.aabb.center();
	
	/* relative to mesh position, not to scene aabb center  */
	var pX = pivot[0], pY = pivot[1], pZ = pivot[2];
	
	/* store rotation with smallest angle */
	var f = 360, s = 180, r = 90, z = 0;
	var rotY, degY, rotMatY = this.rotation[1]; /* Mesh flipZ */

	if (rotMatY < z && rotMatY >= -r) {
		rotY = -2*rotMatY; 
		degY = rotY; 
	}
	if (rotMatY >= z && rotMatY < r) {
		rotY = -2*rotMatY; 
		degY = rotY; 
	}
	if (rotMatY >= r && rotMatY < s) {
		rotY = f - 2*rotMatY; 
		degY = rotY - f; 
	}
	if (rotMatY < -r && rotMatY > -s) {
		rotY = -f -2*rotMatY; 
		degY = rotY + f; 
	}
	if (rotMatY == -s) {
		rotY = z; 
		degY = z; 
	}

	this.rotation[1]+=degY; /* Mesh flipZ */
	
	/* rotate normals */ 
	normalMat.rotateAboutYAxis(rotY);
	/* generate the rotation matrix, using the center point of mesh's aabb as the the pivot */
	vertexRotMat.translate(-pX, -pY, -pZ);
	vertexRotMat.rotateAboutYAxis(rotY);
	vertexRotMat.translate(pX, pY, pZ);
	
	/* then generate the full transformation matrix */
	xformMat.multiply(vertexRotMat);	
	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, this.vertexBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.faceNormalBuffer, this.faceNormalBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.vertexNormalBuffer, this.vertexNormalBuffer);
	this.calcAABB();
	
	var center = this.aabb.center();
	/* relative to mesh position, not to scene aabb center  */
	var cZ = center[2];
	/* translate */
	xformMat2.translate(0, 0, -2 * cZ);
	JSC3D.Math3D.transformVectors(xformMat2, this.vertexBuffer, this.vertexBuffer);
	this.calcAABB();
	this.compiled = null;
};
/* Mesh positioning --- */

/* Mesh clone +++ */
JSC3D.Mesh.prototype.clone = function(newName, rotation, rotationMode, translation, translationMode, scaling, scaleMode) {
	var newMesh = new JSC3D.Mesh;
	newMesh.name = newName || this.name;
	newMesh.groupIndex = this.groupIndex;
	newMesh.visible = this.visible;
	newMesh.creaseAngle = this.creaseAngle;
	newMesh.isDoubleSided = this.isDoubleSided;
	newMesh.renderMode = this.renderMode;
	newMesh.isLightingCast = this.isLightingCast; /* Lighting */
	newMesh.axis = [this.axis[0],this.axis[1],this.axis[2]];
	//newMesh.rotation = [this.rotation[0],this.rotation[1],this.rotation[2]];
	//newMesh.translation = [this.translation[0],this.translation[1],this.translation[2]];
	//newMesh.scaling = [this.scaling[0],this.scaling[1],this.scaling[2]];
	newMesh.mtllib = this.mtllib;
	newMesh.mtl = this.mtl;
	newMesh.setMaterial(this.material);
	newMesh.setTexture(this.texture);
	
	var xformMat = new JSC3D.Matrix3x4;
	var normalMat = new JSC3D.Matrix3x4;
	var vertexRotMat = new JSC3D.Matrix3x4;

	var pivot;
	var center = this.aabb.center();
	switch (rotationMode) {
		case 'axis':
			//pivot = [center[0]-this.axis[0],center[1]-this.axis[1],center[2]-this.axis[2]];
			pivot = [this.translation[0],this.translation[1],this.translation[2]]; 
			break;
		case 'scene':
			break;
		case 'center':
			pivot = this.aabb.center();
			break;
	}

	if (rotation) {
		/* store rotation */
		var f = 360, s = 180;
		rotation[0] %= f; rotation[1] %= f; rotation[2] %= f;
		var maxX = this.rotation[0]+rotation[0]; /* Mesh rotate */
		var maxY = this.rotation[1]+rotation[1]; /* Mesh rotate */
		var maxZ = this.rotation[2]+rotation[2]; /* Mesh rotate */
		
		var degX = rotation[0], degY = rotation[1], degZ = rotation[2];
		if (maxX < -s) degX += f; if (maxX >= s) degX -= f;
		if (maxY < -s) degY += f; if (maxY >= s) degY -= f;
		if (maxZ < -s) degZ += f; if (maxZ >= s) degZ -= f;
		newMesh.rotation[0]=degX;newMesh.rotation[1]=degY;newMesh.rotation[2]=degZ; /* Mesh rotate */
		
		if (pivot) vertexRotMat.translate(-pivot[0], -pivot[1], -pivot[2]);	
		normalMat.rotateAboutXAxis(rotation[0]); 
		vertexRotMat.rotateAboutXAxis(rotation[0]); 
		normalMat.rotateAboutYAxis(rotation[1]); 
		vertexRotMat.rotateAboutYAxis(rotation[1]); 
		normalMat.rotateAboutZAxis(rotation[2]); 
		vertexRotMat.rotateAboutZAxis(rotation[2]); 
		if (pivot) vertexRotMat.translate(pivot[0], pivot[1], pivot[2]);
	}
	
	xformMat.multiply(vertexRotMat);
	if (translation) {
		/* store translation */
		var transX = this.translation[0]+translation[0];
		var transY = this.translation[1]+translation[1];
		var transZ = this.translation[2]+translation[2];
		newMesh.translation[0]=transX;newMesh.translation[1]=transY;newMesh.translation[2]=transZ;
		xformMat.translate(translation[0], translation[1], translation[2]);
	}

	if (scaling) {
		var pctX = 1, pctY = 1, pctZ = 1;
		if (scaling[0]) { 
			pctX = scaling[0]/this.scaling[0];
			/* store scaling */
			this.scaling[0] *= pctX;
		}
		if (scaling[1]) {
			pctY = scaling[1]/this.scaling[1];
			/* store scaling */
			this.scaling[1] *= pctY;
		}
		if (scaling[2]) {
			pctZ = scaling[2]/this.scaling[2];
			/* store scaling */
			this.scaling[2] *= pctZ;
		}
		xformMat.scale(pctX, pctY, pctZ);
	}
	
	newMesh.indexBuffer = this.indexBuffer;
	newMesh.vertexBuffer = new Array(this.vertexBuffer.length);
	newMesh.faceNormalBuffer = new Array(this.faceNormalBuffer.length);

	JSC3D.Math3D.transformVectors(xformMat, this.vertexBuffer, newMesh.vertexBuffer);
	JSC3D.Math3D.transformVectors(normalMat, this.faceNormalBuffer, newMesh.faceNormalBuffer);

	newMesh.texCoordBuffer = []; /* TODO ? */
	newMesh.texCoordIndexBuffer = []; /* TODO ? */
	newMesh.init();
	return newMesh;
};
/* Mesh clone --- */

/* Mesh grouping by name +++ */
JSC3D.Mesh.prototype.getGroupName = function() {
	return this.name;
};

JSC3D.Mesh.prototype.getGroupIndex = function() {
	return this.groupIndex;
};

JSC3D.Mesh.prototype.setGroupName = function(newGroupName, newGroupIndex) {
	var groupName = this.getGroupName();
	var groupIndex = this.getGroupIndex();
	this.name = (newGroupName) ? newGroupName : groupName;
	this.groupIndex = (newGroupIndex) ? newGroupIndex : groupIndex;
};
/* Mesh grouping by name --- */

/**
	@class Material

	This class implements material which describes the feel and look of a mesh.
 */
JSC3D.Material = function(name, ambientColor, diffuseColor, specularColor, ambientReflection, diffuseReflection, specularReflection, shininess, transparency, environmentCast, lightingCast) {
	this.name = name || '';
	this.diffuseColor = diffuseColor || 0x7f7f7f;
	// default ambient color will be of 1/8 the intensity of the diffuse color
	this.ambientColor = (typeof ambientColor) == 'number' ? ambientColor : (((this.diffuseColor & 0xff0000) >> 3) & 0xff0000 | ((this.diffuseColor & 0xff00) >> 3) & 0xff00 | ((this.diffuseColor & 0xff) >> 3));
	this.specularColor = (typeof specularColor) == 'number' ? specularColor : diffuseColor; /* Lighting */
	this.ambientReflection = (typeof ambientReflection) == 'number' ? ambientReflection : .2; /* Lighting: 0..1 */
	this.diffuseReflection = (typeof diffuseReflection) == 'number' ? diffuseReflection : 1; /* Lighting: 0..1 */
	this.specularReflection = (typeof specularReflection) == 'number' ? specularReflection : 0; /* Lighting: 0..1 */
	this.shininess = (typeof shininess) == 'number' ? shininess : 1; /* Lighting: 1..128 */
	
	this.simulateSpecular = (this.specularReflection > 0.0) ? true : false;
	this.transparency = (typeof transparency) == 'number' ? transparency : 0;
	this.isEnvironmentCast = (typeof environmentCast) == 'boolean' ? environmentCast : false; /* EnvironmentCast of Material */
	this.isLightingCast = (typeof lightingCast) == 'boolean' ? lightingCast : true; /* LightingCast of Material */
	this.palette = null;
};

/**
	Get the palette of the material used for shadings.
	@return {Array} palette of the material as an array.
 */
JSC3D.Material.prototype.getPalette = function() {
	if(!this.palette) {
		this.palette = new Array(256);
		this.generatePalette();
	}

	return this.palette;
};

/**
	@private
 */
JSC3D.Material.prototype.generatePalette = function() {
	var ambientR = (this.ambientColor & 0xff0000) >> 16;
	var ambientG = (this.ambientColor & 0xff00) >> 8;
	var ambientB = this.ambientColor & 0xff;
	var diffuseR = (this.diffuseColor & 0xff0000) >> 16;
	var diffuseG = (this.diffuseColor & 0xff00) >> 8;
	var diffuseB = this.diffuseColor & 0xff;

	if(this.simulateSpecular) {
		var i = 0;
		while(i < 204) {
			var r = Math.max(ambientR, i * diffuseR / 204);
			var g = Math.max(ambientG, i * diffuseG / 204);
			var b = Math.max(ambientB, i * diffuseB / 204);
			if(r > 255)
				r = 255;
			if(g > 255)
				g = 255;
			if(b > 255)
				b = 255;

			this.palette[i++] = r << 16 | g << 8 | b;
		}

		// simulate specular high light
		while(i < 256) {
			var r = Math.max(ambientR, diffuseR + (i - 204) * (255 - diffuseR) / 82);
			var g = Math.max(ambientG, diffuseG + (i - 204) * (255 - diffuseG) / 82);
			var b = Math.max(ambientB, diffuseB + (i - 204) * (255 - diffuseB) / 82);
			if(r > 255)
				r = 255;
			if(g > 255)
				g = 255;
			if(b > 255)
				b = 255;

			this.palette[i++] = r << 16 | g << 8 | b;
		}
	}
	else {
		var i = 0;
		while(i < 256) {
			var r = Math.max(ambientR, i * diffuseR / 256);
			var g = Math.max(ambientG, i * diffuseG / 256);
			var b = Math.max(ambientB, i * diffuseB / 256);
			
			/* Lighting */
			var x = i / 256;
			var center = 0, amplitude = 1;
			var mul = 1+Math.exp(-Math.pow((x*2)-center,2))*amplitude; 
			r *= mul; g *= mul; b *= mul;
			
			if(r > 255)
				r = 255;
			if(g > 255)
				g = 255;
			if(b > 255)
				b = 255;

			this.palette[i++] = r << 16 | g << 8 | b;
		}
	}
};

/**
 * {String} Name of the material.
 */
JSC3D.Material.prototype.name = '';
JSC3D.Material.prototype.ambientColor = 0;
JSC3D.Material.prototype.diffuseColor = 0x7f7f7f;
JSC3D.Material.prototype.specularColor = 0x7f7f7f; /* Lighting */
JSC3D.Material.prototype.ambientReflection = .2; /* Lighting */
JSC3D.Material.prototype.diffuseReflection = 1; /* Lighting */
JSC3D.Material.prototype.specularReflection = 0; /* Lighting */
JSC3D.Material.prototype.shininess = 50; /* Lighting */
JSC3D.Material.prototype.transparency = 0;
JSC3D.Material.prototype.isLightingCast = true; /* LightingCast of Material */
JSC3D.Material.prototype.isEnvironmentCast = false; /* EnvironmentCast of Material */
JSC3D.Material.prototype.simulateSpecular = false;
JSC3D.Material.prototype.palette = null;


/**
	@class Texture

	This class implements texture which describes the surface details for a mesh.
 */
JSC3D.Texture = function(name, onready) {
	this.name = name || '';
	this.width = 0;
	this.height = 0;
	this.data = null;
	this.mipmaps = null;
	this.mipentries = null;
	this.hasTransparency = false;
	this.isLightingCast = true; /* LightingCast of Texture */
	this.isEnvironmentCast = false; /* EnvironmentCast of Texture */
	this.srcUrl = '';
	this.onready = (onready && typeof(onready) == 'function') ? onready : null;
};

/**
	Load an image and extract texture data from it.
	@param {String} imageUrl where to load the image.
	@param {Boolean} useMipmap set true to generate mip-maps; false(default) not to generate mip-maps.
 */
JSC3D.Texture.prototype.createFromUrl = function(imageUrl, useMipmap) {
	var self = this;
	var img = new Image;

	img.onload = function() {
		self.data = null;
		self.mipmaps = null;
		self.mipentries = null;
		self.width = 0;
		self.height = 0;
		self.hasTransparency = false;
		self.srcUrl = '';
		self.createFromImage(this, useMipmap);
		if(JSC3D.console)
			JSC3D.console.logInfo('Finished loading texture image file "' + this.src + '".');
	};

	img.onerror = function() {
		self.data = null;
		self.mipmaps = null;
		self.mipentries = null;
		self.width = 0;
		self.height = 0;
		self.hasTransparency = false;
		self.srcUrl = '';
		if(JSC3D.console)
			JSC3D.console.logWarning('Failed to load texture image file "' + this.src + '". This texture will be discarded.');
	};

	img.crossOrigin = 'anonymous'; // explicitly enable cross-domain image
	img.src = encodeURI(imageUrl);
};

/**
	Extract texture data from an exsisting image.
	@param {Image} image image as datasource of the texture.
	@param {Boolean} useMipmap set true to generate mip-maps; false(default) not to generate mip-maps.
 */
JSC3D.Texture.prototype.createFromImage = function(image, useMipmap) {
	if(image.width <=0 || image.height <=0)
		return;

	var isCanvasClean = false;
	var canvas = JSC3D.Texture.cv;
	if(!canvas) {
		try {
			canvas = document.createElement('canvas');
			JSC3D.Texture.cv = canvas;
			isCanvasClean = true;
		}
		catch(e) {
			return;
		}
	}

	// look for appropriate texture dimensions
	var dim = image.width > image.height ? image.width : image.height;
	if(dim <= 16)
		dim = 16;
	else if(dim <= 32)
		dim = 32;
	else if(dim <= 64)
		dim = 64;
	else if(dim <= 128)
		dim = 128;
	else if(dim <= 256)
		dim = 256;
	else if(dim <= 512)
		dim = 512;
	else
		dim = 1024;

	if(canvas.width != dim || canvas.height != dim) {
		canvas.width = canvas.height = dim;
		isCanvasClean = true;
	}

	var data;
	try {
		var ctx = canvas.getContext('2d');
		if(!isCanvasClean)
			ctx.clearRect(0, 0, dim, dim);
		ctx.drawImage(image, 0, 0, dim, dim);
		var imgData = ctx.getImageData(0, 0, dim, dim);
		data = imgData.data;
	}
	catch(e) {
		return;
	}

	var size = data.length / 4;
	this.data = new Array(size);
	var alpha;
	for(var i=0, j=0; i<size; i++, j+=4) {
		alpha = data[j + 3];
		this.data[i] = alpha << 24 | data[j] << 16 | data[j+1] << 8 | data[j+2];
		if(alpha < 255)
			this.hasTransparency = true;
	}

	this.width = dim;
	this.height = dim;

	this.mipmaps = null;
	if(useMipmap)
		this.generateMipmaps();

	this.srcUrl = image.src;

	if(this.onready != null && (typeof this.onready) == 'function')
		this.onready();
};

/**
	See if this texture contains texel data.
	@returns {Boolean} true if it has texel data; false if not.
 */
JSC3D.Texture.prototype.hasData = function() {
	return (this.data != null);
};

/**
	Generate mip-map pyramid for the texture.
 */
JSC3D.Texture.prototype.generateMipmaps = function() {
	if(this.width <= 1 || this.data == null || this.mipmaps != null)
		return;

	this.mipmaps = [this.data];
	this.mipentries = [1];
	
	var numOfMipLevels = 1 + ~~(0.1 + Math.log(this.width) * Math.LOG2E);
	var dim = this.width >> 1;
	for(var level=1; level<numOfMipLevels; level++) {
		var map = new Array(dim * dim);
		var uppermap = this.mipmaps[level - 1];
		var upperdim = dim << 1;

		var src = 0, dest = 0;
		for(var i=0; i<dim; i++) {
			for(var j=0; j<dim; j++) {
				var texel0 = uppermap[src];
				var texel1 = uppermap[src + 1];
				var texel2 = uppermap[src + upperdim];
				var texel3 = uppermap[src + upperdim + 1];
				var a = ( ((texel0 & 0xff000000) >>> 2) + ((texel1 & 0xff000000) >>> 2) + ((texel2 & 0xff000000) >>> 2) + ((texel3 & 0xff000000) >>> 2) ) & 0xff000000;
				var r = ( ((texel0 & 0xff0000) + (texel1 & 0xff0000) + (texel2 & 0xff0000) + (texel3 & 0xff0000)) >> 2 ) & 0xff0000;
				var g = ( ((texel0 & 0xff00) + (texel1 & 0xff00) + (texel2 & 0xff00) + (texel3 & 0xff00)) >> 2 ) & 0xff00;
				var b = ( ((texel0 & 0xff) + (texel1 & 0xff) + (texel2 & 0xff) + (texel3 & 0xff)) >> 2 ) & 0xff;
				map[dest] = a + r + g + b;
				src += 2;
				dest++;
			}
			src += upperdim;
		}

		this.mipmaps.push(map);
		this.mipentries.push(Math.pow(4, level));
		dim = dim >> 1;
	}
};

/**
	See if this texture has mip-maps.
	@returns {Boolean} true if it has mip-maps; false if not.
 */
JSC3D.Texture.prototype.hasMipmap = function() {
	return (this.mipmaps != null);
};

/**
 * {String} Name of the texture.
 */
JSC3D.Texture.prototype.name = '';
JSC3D.Texture.prototype.data = null;
JSC3D.Texture.prototype.mipmaps = null;
JSC3D.Texture.prototype.mipentries = null;
JSC3D.Texture.prototype.isLightingCast = true; /* LightingCast of Texture */
JSC3D.Texture.prototype.isEnvironmentCast = false; /* EnvironmentCast of Texture */
/**
 * {Number} Width of the texture in pixels. Read only.
 */
JSC3D.Texture.prototype.width = 0;
/**
 * {Number} Height of the texture in pixels. Read only.
 */
JSC3D.Texture.prototype.height = 0;
/**
 * {Boolean} Whether the texture contains tranparent pixels. Read only.
 */
JSC3D.Texture.prototype.hasTransparency = false;
/**
 * {String} URL of the image source of the texture. Read only.
 */
JSC3D.Texture.prototype.srcUrl = '';
/**
 * {Function} A callback function that will be invoked immediately as the texture is ready.
 */
JSC3D.Texture.prototype.onready = null;
JSC3D.Texture.cv = null;

/**
	Lighting
 */
JSC3D.Light = function(name,position,ambientColor,diffuseColor,enabled) {
	var diffuseR = (diffuseColor & 0xff0000) >> 16;
	var diffuseG = (diffuseColor & 0xff00) >> 8;
	var diffuseB = diffuseColor & 0xff;
	var ambient = (typeof ambientColor) == 'number' ? ambientColor : ((diffuseR >> 3) & 0xff0000 | (diffuseG >> 3) & 0xff00 | (diffuseB >> 3));
	this.name = name || 'light';
	this.position = position || [0,0,0];
	this.transformedPosition = [0,0,0];
	this.ambientColor = ambient; 
	this.diffuseColor = diffuseColor;
	this.enabled = enabled;
};

/**
	@class AABB

	This class implements the Axis-Aligned Bounding Box to measure spatial enclosure.
 */
JSC3D.AABB = function() {
	/**
	 * {Number} X coordinate of the minimum edge of the box.
	 */
	this.minX = 0;
	/**
	 * {Number} Y coordinate of the minimum edge of the box.
	 */
	this.minY = 0;
	/**
	 * {Number} Z coordinate of the minimum edge of the box.
	 */
	this.minZ = 0;
	/**
	 * {Number} X coordinate of the maximum edge of the box.
	 */
	this.maxX = 0;
	/**
	 * {Number} Y coordinate of the maximum edge of the box.
	 */
	this.maxY = 0;
	/**
	 * {Number} Z coordinate of the maximum edge of the box.
	 */
	this.maxZ = 0;
};

/**
	Get center coordinates of the AABB.
	@param {Array} c an array to receive the result.
	@returns {Array} center coordinates as an array.
 */
JSC3D.AABB.prototype.center = function(c) {
	if(c) {
		c[0] = 0.5 * (this.minX + this.maxX);
		c[1] = 0.5 * (this.minY + this.maxY);
		c[2] = 0.5 * (this.minZ + this.maxZ);
	}
	else
		c = [0.5 * (this.minX + this.maxX), 0.5 * (this.minY + this.maxY), 0.5 * (this.minZ + this.maxZ)];
	return c;
};

/**
	Get the length of the diagonal of the AABB.
	@returns {Number} length of the diagonal.
 */
JSC3D.AABB.prototype.lengthOfDiagonal = function() {
	var xx = this.maxX - this.minX;
	var yy = this.maxY - this.minY;
	var zz = this.maxZ - this.minZ;
	return Math.sqrt(xx * xx + yy * yy + zz * zz);
};


/**
	@class Matrix3x4

	This class implements 3x4 matrix and mass operations for 3D transformations.
 */
JSC3D.Matrix3x4 = function() {
	this.m00 = 1; this.m01 = 0; this.m02 = 0; this.m03 = 0;
	this.m10 = 0; this.m11 = 1; this.m12 = 0; this.m13 = 0;
	this.m20 = 0; this.m21 = 0; this.m22 = 1; this.m23 = 0;
};

/**
	Make the matrix an identical matrix.
 */
JSC3D.Matrix3x4.prototype.identity = function() {
	this.m00 = 1; this.m01 = 0; this.m02 = 0; this.m03 = 0;
	this.m10 = 0; this.m11 = 1; this.m12 = 0; this.m13 = 0;
	this.m20 = 0; this.m21 = 0; this.m22 = 1; this.m23 = 0;
};

/**
	Scale the matrix using scaling factors on each axial directions.
	@param {Number} sx scaling factors on x-axis.
	@param {Number} sy scaling factors on y-axis.
	@param {Number} sz scaling factors on z-axis.
 */
JSC3D.Matrix3x4.prototype.scale = function(sx, sy, sz) {
	this.m00 *= sx; this.m01 *= sx; this.m02 *= sx; this.m03 *= sx;
	this.m10 *= sy; this.m11 *= sy; this.m12 *= sy; this.m13 *= sy;
	this.m20 *= sz; this.m21 *= sz; this.m22 *= sz; this.m23 *= sz;
};

/**
	Translate the matrix using translations on each axial directions.
	@param {Number} tx translations on x-axis.
	@param {Number} ty translations on y-axis.
	@param {Number} tz translations on z-axis.
 */
JSC3D.Matrix3x4.prototype.translate = function(tx, ty, tz) {
	this.m03 += tx;
	this.m13 += ty;
	this.m23 += tz;
};

/**
	Rotate the matrix an arbitrary angle about the x-axis.
	@param {Number} angle rotation angle in degrees.
 */
JSC3D.Matrix3x4.prototype.rotateAboutXAxis = function(angle) {
	if(angle != 0) {
		angle *= Math.PI / 180;
		var c = Math.cos(angle);
		var s = Math.sin(angle);

		var m10 = c * this.m10 - s * this.m20;
		var m11 = c * this.m11 - s * this.m21;
		var m12 = c * this.m12 - s * this.m22;
		var m13 = c * this.m13 - s * this.m23;
		var m20 = c * this.m20 + s * this.m10;
		var m21 = c * this.m21 + s * this.m11;
		var m22 = c * this.m22 + s * this.m12;
		var m23 = c * this.m23 + s * this.m13;

		this.m10 = m10; this.m11 = m11; this.m12 = m12; this.m13 = m13;
		this.m20 = m20; this.m21 = m21; this.m22 = m22; this.m23 = m23;
	}
};

/**
	Rotate the matrix an arbitrary angle about the y-axis.
	@param {Number} angle rotation angle in degrees.
 */
JSC3D.Matrix3x4.prototype.rotateAboutYAxis = function(angle) {
	if(angle != 0) {
		angle *= Math.PI / 180;
		var c = Math.cos(angle);
		var s = Math.sin(angle);

		var m00 = c * this.m00 + s * this.m20;
		var m01 = c * this.m01 + s * this.m21;
		var m02 = c * this.m02 + s * this.m22;
		var m03 = c * this.m03 + s * this.m23;
		var m20 = c * this.m20 - s * this.m00;
		var m21 = c * this.m21 - s * this.m01;
		var m22 = c * this.m22 - s * this.m02;
		var m23 = c * this.m23 - s * this.m03;

		this.m00 = m00; this.m01 = m01; this.m02 = m02; this.m03 = m03;
		this.m20 = m20; this.m21 = m21; this.m22 = m22; this.m23 = m23;
	}
};

/**
	Rotate the matrix an arbitrary angle about the z-axis.
	@param {Number} angle rotation angle in degrees.
 */
JSC3D.Matrix3x4.prototype.rotateAboutZAxis = function(angle) {
	if(angle != 0) {
		angle *= Math.PI / 180;
		var c = Math.cos(angle);
		var s = Math.sin(angle);

		var m10 = c * this.m10 + s * this.m00;
		var m11 = c * this.m11 + s * this.m01;
		var m12 = c * this.m12 + s * this.m02;
		var m13 = c * this.m13 + s * this.m03;
		var m00 = c * this.m00 - s * this.m10;
		var m01 = c * this.m01 - s * this.m11;
		var m02 = c * this.m02 - s * this.m12;
		var m03 = c * this.m03 - s * this.m13;

		this.m00 = m00; this.m01 = m01; this.m02 = m02; this.m03 = m03;
		this.m10 = m10; this.m11 = m11; this.m12 = m12; this.m13 = m13;
	}
};

/**
	Multiply the matrix by another matrix.
	@param {JSC3D.Matrix3x4} mult another matrix to be multiplied on this.
 */
JSC3D.Matrix3x4.prototype.multiply = function(mult) {
	var m00 = mult.m00 * this.m00 + mult.m01 * this.m10 + mult.m02 * this.m20;
	var m01 = mult.m00 * this.m01 + mult.m01 * this.m11 + mult.m02 * this.m21;
	var m02 = mult.m00 * this.m02 + mult.m01 * this.m12 + mult.m02 * this.m22;
	var m03 = mult.m00 * this.m03 + mult.m01 * this.m13 + mult.m02 * this.m23 + mult.m03;
	var m10 = mult.m10 * this.m00 + mult.m11 * this.m10 + mult.m12 * this.m20;
	var m11 = mult.m10 * this.m01 + mult.m11 * this.m11 + mult.m12 * this.m21;
	var m12 = mult.m10 * this.m02 + mult.m11 * this.m12 + mult.m12 * this.m22;
	var m13 = mult.m10 * this.m03 + mult.m11 * this.m13 + mult.m12 * this.m23 + mult.m13;
	var m20 = mult.m20 * this.m00 + mult.m21 * this.m10 + mult.m22 * this.m20;
	var m21 = mult.m20 * this.m01 + mult.m21 * this.m11 + mult.m22 * this.m21;
	var m22 = mult.m20 * this.m02 + mult.m21 * this.m12 + mult.m22 * this.m22;
	var m23 = mult.m20 * this.m03 + mult.m21 * this.m13 + mult.m22 * this.m23 + mult.m23;

	this.m00 = m00; this.m01 = m01; this.m02 = m02; this.m03 = m03;
	this.m10 = m10; this.m11 = m11; this.m12 = m12; this.m13 = m13;
	this.m20 = m20; this.m21 = m21; this.m22 = m22; this.m23 = m23;
};

JSC3D.Matrix3x4.prototype.copy = function(m) {
	var m00 = m.m00;
	var m01 = m.m01;
	var m02 = m.m02;
	var m03 = m.m03;
	var m10 = m.m10;
	var m11 = m.m11;
	var m12 = m.m12;
	var m13 = m.m13;
	var m20 = m.m20;
	var m21 = m.m21;
	var m22 = m.m22;
	var m23 = m.m23;
	
	this.m00 = m00; this.m01 = m01; this.m02 = m02; this.m03 = m03;
	this.m10 = m10; this.m11 = m11; this.m12 = m12; this.m13 = m13;
	this.m20 = m20; this.m21 = m21; this.m22 = m22; this.m23 = m23;
};

/**
	@class Math3D

	This class provides some utility methods for 3D mathematics.
 */
JSC3D.Math3D = {

	/**
		Transform vectors using the given matrix.
		@param {JSC3D.Matrix3x4} mat the transformation matrix.
		@param {Array} vecs a batch of vectors to be transform.
		@param {Array} xfvecs where to output the transformed vectors.
	 */
	transformVectors: function(mat, vecs, xfvecs) {
		for(var i=0; i<vecs.length; i+=3) {
			var x = vecs[i    ];
			var y = vecs[i + 1];
			var z = vecs[i + 2];
			xfvecs[i    ] = mat.m00 * x + mat.m01 * y + mat.m02 * z + mat.m03;
			xfvecs[i + 1] = mat.m10 * x + mat.m11 * y + mat.m12 * z + mat.m13;
			xfvecs[i + 2] = mat.m20 * x + mat.m21 * y + mat.m22 * z + mat.m23;
		}
	},

	/**
		Transform vectors using the given matrix. Only z components (transformed) will be written out.
		@param {JSC3D.Matrix3x4} mat the transformation matrix.
		@param {Array} vecs a batch of vectors to be transform.
		@param {Array} xfveczs where to output the transformed z components of the input vectors.
	 */
	transformVectorZs: function(mat, vecs, xfveczs) {
		var num = vecs.length / 3;
		var i = 0, j = 0
		while(i < num) {
			xfveczs[i] = mat.m20 * vecs[j] + mat.m21 * vecs[j + 1] + mat.m22 * vecs[j + 2] + mat.m23;
			i++;
			j += 3;
		}
	}, 

	/**
		Normalize vectors.
		@param {Array} src a batch of vectors to be normalized.
		@param {Array} dest where to output the normalized results.
	 */
	normalizeVectors: function(src, dest) {
		var num = src.length;
		for(var i=0; i<num; i+=3) {
			var x = src[i    ];
			var y = src[i + 1];
			var z = src[i + 2];
			var len = Math.sqrt(x * x + y * y + z * z);
			if(len > 0) {
				len = 1 / len;
				x *= len;
				y *= len;
				z *= len;
			}

			dest[i    ] = x;
			dest[i + 1] = y;
			dest[i + 2] = z;
		}
	}

};


/**
	@class LoaderSelector
 */
JSC3D.LoaderSelector = {

	/**
		Register a scene loader for a specific file format, using the file extesion name for lookup.
		@param {String} fileExtName extension name for the specific file format.
		@param {Function} loaderCtor constructor of the loader class.
	 */
	registerLoader: function(fileExtName, loaderCtor) {
		if((typeof loaderCtor) == 'function') {
			JSC3D.LoaderSelector.loaderTable[fileExtName] = loaderCtor;
		}
	},

	/**
		Get the proper loader for a target file format using the file extension name.
		@param {String} fileExtName file extension name for the specific format.
		@returns {Object} loader object for the specific format; null if not found.
	 */
	getLoader: function(fileExtName) {
		var loaderCtor = JSC3D.LoaderSelector.loaderTable[fileExtName.toLowerCase()];
		if(!loaderCtor)
			return null;

		var loaderInst;
		try {
			loaderInst = new loaderCtor();
		}
		catch(e) {
			loaderInst = null; 
		}

		return loaderInst;
	},

	loaderTable: {}
};


JSC3D.Util = {

	/**
	 * Convert content of a responseBody, as the result of an XHR request, to a (binary) string. 
	 * This method is special for IE.
	 */
	ieXHRResponseBodyToString: function(responseBody) {
		// I had expected this could be done by a single line: 
		//     String.fromCharCode.apply(null, (new VBArray(responseBody)).toArray()); 
		// But it tends to result in an 'out of stack space' exception on larger streams. 
		// So we just cut the array to smaller pieces (64k for each) and convert them to 
		// strings which can then be combined into one.
		var arr = (new VBArray(responseBody)).toArray();
		var str = '';
		for(var i=0; i<arr.length-65536; i+=65536)
			str += String.fromCharCode.apply(null, arr.slice(i, i+65536));
		return str + String.fromCharCode.apply(null, arr.slice(i));
	},
	
	/* Credits: https://github.com/rhysbrettbowen/debounce */
	debounce: function(func, wait) {
		var timeout, args, context, timestamp;
		return function() {
			context = this;
			args = [].slice.call(arguments, 0);
			timestamp = new Date();
			var later = function() {
				var last = (new Date()) - timestamp;
				if (last < wait) {
					timeout = setTimeout(later, wait - last);
				} else {
					timeout = null;
					func.apply(context, args);
				}
			};
			if (!timeout) {
				timeout = setTimeout(later, wait);
			}
		}
	}
};


JSC3D.PlatformInfo = (function() {
	var info = {
		browser:			'other',
		version:			'n/a',
		profile:			'default', /* FPS */
		isTouchDevice:		(document.createTouch != undefined), 		// detect if it is running on touch device
		supportTypedArrays:	(window.Uint32Array != undefined),			// see if Typed Arrays are supported 
		supportWebGL:		(window.WebGLRenderingContext != undefined)	// see if WebGL context is supported
	};

	var agents = [
		['firefox', /Firefox[\/\s](\d+(?:\.\d+)*)/], 
		['chrome',  /Chrome[\/\s](\d+(?:\.\d+)*)/ ], 
		['opera',   /Opera[\/\s](\d+(?:\.\d+)*)/], 
		['safari',  /Safari[\/\s](\d+(?:\.\d+)*)/], 
		['webkit',  /AppleWebKit[\/\s](\d+(?:\.\d+)*)/], 
		['ie',      /MSIE[\/\s](\d+(?:\.\d+)*)/], 
		/*
		 * For IE11 and above, as the old keyword 'MSIE' no longer exists there.
		 * By Laurent Piroelle <laurent.piroelle@fabzat.com>.
		 */
		['ie',      /Trident\/\d+\.\d+;\s.*rv:(\d+(?:\.\d+)*)/]
	];

	var matches;
	for(var i=0; i<agents.length; i++) {
		if((matches = agents[i][1].exec(window.navigator.userAgent))) {
			info.browser = agents[i][0];
			info.version = matches[1];
			break;
		}
	}

	/* FPS +++ */
	var ops = 0;
	var start = new Date();
	var interval = 200;
	while(new Date().getTime() - start < interval){
		/* shameless trivial */
		var c = new Array();
		for(var deg=-180; deg<180; deg++) {
			c.push(Math.cos(deg * Math.PI/180));
		}
		c = null;
		ops ++;
	}
	ops /= interval;
	if (ops < 3) info.profile = 'low';
	if (ops > 30) info.profile = 'high';
	/* FPS --- */
	
	return info;
}) ();

