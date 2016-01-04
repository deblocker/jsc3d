var viewer;
var loader;

function scaleFullScreen(){
	viewer.resize();
}

(function initalize() {
	window.addEventListener('resize', scaleFullScreen, false);
	
	JSC3D.LoaderSelector.registerLoader('obj', JSC3D.ObjLoader);
	
	var isWebGL = JSC3D.PlatformInfo.supportWebGL;
	var canvas = document.getElementById('cv');
	var params = {
		'SceneUrl': './models/dragon.obj',
		'InitRotationX': 22,
		'InitRotationY': 0,
		'InitRotationZ': 0,
		'SceneRotation': 'on',
		'InitSceneRotation': 60,
		'AutoRotateSpeed': 0,
		'EnableRotateX': true,
		'EnableRotateY': true,
		'AutoUpdate': 'on',
		'BackgroundColor1': '#2271B3',
		'BackgroundColor2': '#721422',
		'Background': 'on',
		'Definition': 'high',
		'RenderMode': 'texturesmooth',
		'LightingMode': 'color',
		'Renderer': isWebGL ? 'webgl' : 'canvas'
	};
	viewer = new JSC3D.Viewer(canvas);
	viewer.setParameters(params);
	viewer.showLights = true;
	viewer.init();
})();
