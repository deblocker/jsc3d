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
	
	var isWebGL = JSC3D.PlatformInfo.supportWebGL ? true : false;
	var canvas = document.getElementById('cv');
	viewer = new JSC3D.Viewer(canvas);
	viewer.setParameter('InitRotationX', 22);
	viewer.setParameter('InitRotationY', 0);
	viewer.setParameter('InitRotationZ', 0);
	viewer.setParameter('SceneRotation', 'on');
	viewer.setParameter('InitSceneRotation', 60);
	viewer.setParameter('AutoRotateSpeed', 1);
	viewer.setParameter('EnableRotateX', true);
	viewer.setParameter('EnableRotateY', true);
	viewer.setParameter('AutoUpdate', 'on');
	viewer.setParameter('ModelColor', '#AAAAAA');
	viewer.setParameter('BackgroundColor1', '#FFFFFF')
	viewer.setParameter('BackgroundColor2', '#333333');
    viewer.setParameter('Background', 'on');
	viewer.setParameter('Definition', 'default');
	viewer.setParameter('RenderMode', 'texturesmooth');
	viewer.setParameter('CreaseAngle', '30');
	viewer.setParameter('FaceCulling', 'off');
	viewer.setParameter('MipMapping', isWebGL ? 'off' : 'on');
	viewer.setParameter('Renderer', isWebGL ? 'webgl' : 'canvas');
	
	viewer.beforeupdate = onViewerBeforeUpdate;
	viewer.init();
	
	/* material name, ambient color, diffuse color, alpha, specular, environmentCast */
	viewer.addMaterial('grey_mat', 0, 0x7A7B7A, 0, false, false);
	viewer.addMaterial('yellow_mat', 0, 0xFEFB10, 0, false, false);
	viewer.addMaterial('red_mat', 0, 0xF40000, 0, false, false);
	viewer.addMaterial('blue_mat', 0, 0x0006F0, 0, false, false);
	viewer.addMaterial('orange_mat', 0, 0xFF7901, 0, false, false);
	viewer.addMaterial('green_mat', 0, 0x00CB00, 0, false, false);
	viewer.addMaterial('cyan_mat', 0, 0x00E8E8, 0, false, false);

	if (viewer.params['SceneUrl'] == '') {
		viewer.createScene(-50, 50, -50, 50, -50, 50);
		viewer.scene.makeGroundPlane(0x0000ff, 'wireframe');
	}
	
	loader = JSC3D.LoaderSelector.getLoader('obj');
	loader.onload = onModelLoaded;
	loader.loadFromUrl('./models/demo_axis.obj');
})();
