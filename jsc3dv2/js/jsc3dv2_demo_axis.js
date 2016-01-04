var viewer;
var loader;

function onModelLoaded(scene) {
	var meshes = scene.getChildren();
	for (var i=0; i<meshes.length; i++) {
		var mesh = meshes[i];
		if (!!mesh.mtl && !mesh.mtllib) 
			mesh.setMaterial(viewer.getMaterial(mesh.mtl));
		mesh.init();
		viewer.scene.addChild(mesh);
	}
	if (!viewer.isAutoUpdateOn)
		viewer.update();
}

function onViewerBeforeUpdate() {
	if (!this.scene)
		return;
	var meshes = this.scene.getMeshes('groundplane');
	var radians = 180 / Math.PI;
	for (var i=0; i<meshes.length; i++) {
		mesh = meshes[i];
		var f = Math.sin(viewer.rotation[1]/radians)+.1;
		mesh.scale([f,1,f]);
	}
}

(function initalize() {
	JSC3D.LoaderSelector.registerLoader('obj', JSC3D.ObjLoader);
	
	var isWebGL = JSC3D.PlatformInfo.supportWebGL;
	var canvas = document.getElementById('cv');
	var params = {
		'InitRotationX': 22,
		'InitRotationY': 0,
		'InitRotationZ': 0,
		'SceneRotation': 'on',
		'InitSceneRotation': 60,
		'AutoRotateSpeed': 1,
		'EnableRotateX': true,
		'EnableRotateY': true,
		'AutoUpdate': 'on',
		'BackgroundColor1': '#FFFFFF',
		'BackgroundColor2': '#333333',
		'Background': 'on',
		'Definition': 'default',
		'RenderMode': 'texturesmooth',
		'CreaseAngle': '30',
		'FaceCulling': 'off',
		'MipMapping': isWebGL ? 'off' : 'on',
		'Renderer': isWebGL ? 'webgl' : 'canvas'
	};
	viewer = new JSC3D.Viewer(canvas);
	viewer.setParameters(params);
	viewer.beforeupdate = onViewerBeforeUpdate;
	viewer.init();
	
	/* params: name, ambientColor, diffuseColor, specularColor, 
					 ambientReflection, diffuseReflection, specularReflection, shininess, 
					 transparency, environmentCast, lightingCast 
	*/
	viewer.addMaterial('grey_mat', 'undefined', 0x7A7B7A);
	viewer.addMaterial('yellow_mat', 'undefined', 0xFEFB10);
	viewer.addMaterial('red_mat', 'undefined', 0xF40000);
	viewer.addMaterial('blue_mat', 'undefined', 0x0006F0);
	viewer.addMaterial('orange_mat', 'undefined', 0xFF7901);
	viewer.addMaterial('green_mat', 'undefined', 0x00CB00);
	viewer.addMaterial('cyan_mat', 'undefined', 0x00E8E8);

	if (viewer.params['SceneUrl'] == '') {
		viewer.createScene(-50, 50, -50, 50, -50, 50);
		/* params: color, texture, renderMode */
		viewer.scene.makeGroundPlane(0x0000ff, null, 'wireframe');
	}
	
	loader = JSC3D.LoaderSelector.getLoader('obj');
	loader.onload = onModelLoaded;
	loader.loadFromUrl('./models/demo_axis.obj');
})();
