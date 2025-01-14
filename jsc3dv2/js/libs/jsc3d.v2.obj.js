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
	@class ObjLoader

	This class implements a scene loader from a Wavefront obj file. 
 */
JSC3D.ObjLoader = function(onload, onerror, onprogress, onresource) {
	this.onload = (onload && typeof(onload) == 'function') ? onload : null;
	this.onerror = (onerror && typeof(onerror) == 'function') ? onerror : null;
	this.onprogress = (onprogress && typeof(onprogress) == 'function') ? onprogress : null;
	this.onresource = (onresource && typeof(onresource) == 'function') ? onresource : null;
	this.requestCount = 0;
	this.requests = [];
	this.resourceRequestCount = 0; /* scene complete */
};

/**
	Load scene from a given obj file.
	@param {String} urlName a string that specifies where to fetch the obj file.
 */
JSC3D.ObjLoader.prototype.loadFromUrl = function(urlName) {
	var urlPath = '';
	var fileName = urlName;
	var queryPart = '';

	var questionMarkAt = urlName.indexOf('?');
	if(questionMarkAt >= 0) {
		queryPart = urlName.substring(questionMarkAt);
		fileName = urlName = urlName.substring(0, questionMarkAt);
	}

	var lastSlashAt = urlName.lastIndexOf('/');
	if(lastSlashAt == -1)
		lastSlashAt = urlName.lastIndexOf('\\');
	if(lastSlashAt != -1) {
		urlPath = urlName.substring(0, lastSlashAt+1);
		fileName = urlName.substring(lastSlashAt+1);
	}

	this.requestCount = 0;
	this.resourceRequestCount = 0; /* scene complete */
	this.loadObjFile(urlPath, fileName, queryPart);
};

/**
	Abort current loading if it is not finished yet.
 */
JSC3D.ObjLoader.prototype.abort = function() {
	for(var i=0; i<this.requests.length; i++) {
		this.requests[i].abort();
	}
	this.requests = [];
	this.requestCount = 0;
	this.resourceRequestCount = 0; /* scene complete */
};

/**
	Load scene from the obj file using the given url path and file name.
	@private
 */
JSC3D.ObjLoader.prototype.loadObjFile = function(urlPath, fileName, queryPart) {
	var urlName = urlPath + fileName + queryPart;
	var self = this;
	var xhr = new XMLHttpRequest;
	xhr.open('GET', encodeURI(urlName), true);

	xhr.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200 || this.status == 0) {
				if(self.onload) {
					if(self.onprogress)
						self.onprogress('Loading obj file ...', 1);
					if(JSC3D.console)
						JSC3D.console.logInfo('Finished loading obj file "' + urlName + '".');
					var scene = new JSC3D.Scene;
					scene.srcUrl = urlName;
					/* Mesh grouping by name +++ */
					var sceneName = fileName.replace(/^.*(\\|\/|\:)/, '');
					scene.name = sceneName.substr(0,sceneName.lastIndexOf('.')) || sceneName + '';
					/* Mesh grouping by name --- */
					var mtllibs = self.parseObj(scene, this.responseText);
					if(mtllibs.length > 0) {
						for(var i=0; i<mtllibs.length; i++)
							self.loadMtlFile(scene, urlPath, mtllibs[i]);
					}
					self.requests.splice(self.requests.indexOf(this), 1);
					if(--self.requestCount == 0)
						self.onload(scene);
				}
			}
			else {
				self.requests.splice(self.requests.indexOf(this), 1);
				self.requestCount--;
				if(JSC3D.console)
					JSC3D.console.logError('Failed to load obj file "' + urlName + '".');
				if(self.onerror)
					self.onerror('Failed to load obj file "' + urlName + '".');
			}
		}
	};

	if(this.onprogress) {
		this.onprogress('Loading obj file ...', 0);
		xhr.onprogress = function(event) {
			self.onprogress('Loading obj file ...', event.loaded / event.total);
		};
	}

	this.requests.push(xhr);
	this.requestCount++;
	xhr.send();
};

/**
	Load materials and textures from an mtl file and set them to corresponding meshes.
	@private
 */
JSC3D.ObjLoader.prototype.loadMtlFile = function(scene, urlPath, fileName) {
	var urlName = urlPath + fileName;
	var self = this;
	var xhr = new XMLHttpRequest;
	xhr.open('GET', encodeURI(urlName), true);

	xhr.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200 || this.status == 0) {
				if(self.onprogress)
					self.onprogress('Loading mtl file ...', 1);
				if(JSC3D.console)
					JSC3D.console.logInfo('Finished loading mtl file "' + urlName + '".');
				var mtls = self.parseMtl(this.responseText);
				var textures = {};
				var meshes = scene.getChildren();
				for(var i=0; i<meshes.length; i++) {
					var mesh = meshes[i];
					if(mesh.mtl != null && mesh.mtllib != null && mesh.mtllib == fileName) {
						var mtl = mtls[mesh.mtl];
						if(mtl != null) {
							if(mtl.material != null)
								mesh.setMaterial(mtl.material);
							if(mtl.textureFileName != '') {
								if(!textures[mtl.textureFileName])
									textures[mtl.textureFileName] = [mesh];
								else
									textures[mtl.textureFileName].push(mesh);
							}
						}
					}
				}
				/* scene complete +++ */
				for(var textureFileName in textures) 
					self.resourceRequestCount++;
				/* scene complete --- */
				for(var textureFileName in textures)
					self.setupTexture(textures[textureFileName], urlPath + textureFileName);
			}
			else {
				//TODO: when failed to load an mtl file ...
				if(JSC3D.console)
					JSC3D.console.logWarning('Failed to load mtl file "' + urlName + '". A default material will be applied.');
			}
			self.requests.splice(self.requests.indexOf(this), 1);
			if(--self.requestCount == 0)
				self.onload(scene);
		}
	};

	if(this.onprogress) {
		this.onprogress('Loading mtl file ...', 0);
		xhr.onprogress = function(event) {
			self.onprogress('Loading mtl file ...', event.loaded / event.total);
		};
	}

	this.requests.push(xhr);
	this.requestCount++;
	xhr.send();
};

/**
	Parse contents of the obj file, generating the scene and returning all required mtllibs. 
	@private
 */
JSC3D.ObjLoader.prototype.parseObj = function(scene, data) {
	var meshes = {};
	var mtllibs = [];
	var defaultMeshName = (scene.name || 'obj'); /* Mesh grouping by name */
	var meshIndex = 0;
	var curMesh = null;
	var curMtllibName = '';
	var curMtlName = '';

	var tempVertexBuffer = [];		// temporary buffer as container for all vertices
	var tempTexCoordBuffer = [];	// temporary buffer as container for all vertex texture coords

	// create a default mesh to hold all faces that are not associated with any mtl.
	var defaultMesh = new JSC3D.Mesh;
	defaultMesh.name = defaultMeshName;
	defaultMesh.groupIndex = meshIndex++; /* Mesh grouping by name */
	defaultMesh.indexBuffer = [];
	meshes['nomtl'] = defaultMesh;
	curMesh = defaultMesh;

	var lines = data.split(/[ \t]*\r?\n[ \t]*/);
	for(var i=0; i<lines.length; i++) {
		var line = lines[i];
		var tokens = line.split(/[ \t]+/);
		if(tokens.length > 0) {
			var keyword = tokens[0];
			switch(keyword) {
			case 'v':
				if(tokens.length > 3) {
					for(var j=1; j<4; j++) {
						tempVertexBuffer.push( parseFloat(tokens[j]) );
					}
				}
				break;
			case 'vn':
				// Ignore vertex normals. These will be calculated automatically when a mesh is initialized.
				break;
			case 'vt':
				if(tokens.length > 2) {
					tempTexCoordBuffer.push( parseFloat(tokens[1]) );
					tempTexCoordBuffer.push( 1 - parseFloat(tokens[2]) );
				}
				break;
			case 'f':
				if(tokens.length > 3) {
					for(var j=1; j<tokens.length; j++) {
						var refs = tokens[j].split('/');
						var index = parseInt(refs[0]) - 1;
						curMesh.indexBuffer.push(index);
						if(refs.length > 1) {
							if(refs[1] != '') {
								if(!curMesh.texCoordIndexBuffer)
									curMesh.texCoordIndexBuffer = [];
								curMesh.texCoordIndexBuffer.push( parseInt(refs[1]) - 1 );
							}
							// Patch to deal with non-standard face statements in obj files generated by LightWave3D.
							else if(refs.length < 3 || refs[2] == '') {
								if(!curMesh.texCoordIndexBuffer)
									curMesh.texCoordIndexBuffer = [];
								curMesh.texCoordIndexBuffer.push(index);
							}
						}
					}
					curMesh.indexBuffer.push(-1);				// mark the end of vertex index sequence for the face
					if(curMesh.texCoordIndexBuffer)
						curMesh.texCoordIndexBuffer.push(-1);	// mark the end of vertex tex coord index sequence for the face
				}
				break;
			case 'g':
				/* TODO v2: why not use "g" to create new meshes? */
				if(tokens.length > 1 && tokens[1] != '') {
					var curMeshName = tokens[1];
				}
				break;
			case 'mtllib':
				if(tokens.length > 1) {
					curMtllibName = tokens[1];
					mtllibs.push(curMtllibName);
				}
				else
					curMtllibName = '';
				break;
			case 'usemtl':
				if(tokens.length > 1 && tokens[1] != '') {  /* Textures preload & materials collection */
					curMtlName = tokens[1];
					var meshid = curMtllibName + '-' + curMtlName;
					var mesh = meshes[meshid];
					if(!mesh) {
						// create a new mesh to accept faces using the same mtl
						mesh = new JSC3D.Mesh;
						//mesh.name = namePrefix + meshIndex++;
						mesh.name = defaultMeshName; /* Mesh grouping by name */
						mesh.groupIndex = meshIndex++; /* Mesh grouping by name */
						mesh.indexBuffer = [];
						mesh.mtllib = curMtllibName;
						mesh.mtl = curMtlName;
						meshes[meshid] = mesh;
					}
					curMesh = mesh;
				}
				else {
					curMtlName = '';
					curMesh = defaultMesh;
				}
				break;
			case '#':
				// ignore comments
			default:
				break;
			}
		}
	}

	var viBuffer = tempVertexBuffer.length >= 3 ? (new Array(tempVertexBuffer.length / 3)) : null;
	var tiBuffer = tempTexCoordBuffer.length >= 2 ? (new Array(tempTexCoordBuffer.length / 2)) : null;

	for(var id in meshes) {
		var mesh = meshes[id];

		// split vertices into the mesh, the indices are also re-calculated
		if(tempVertexBuffer.length >= 3 && mesh.indexBuffer.length > 0) {
			for(var i=0; i<viBuffer.length; i++)
				viBuffer[i] = -1;

			mesh.vertexBuffer = [];
			var oldVI = 0, newVI = 0;
			for(var i=0; i<mesh.indexBuffer.length; i++) {
				oldVI = mesh.indexBuffer[i];
				if(oldVI != -1) {
					if(viBuffer[oldVI] == -1) {
						var v = oldVI * 3;
						mesh.vertexBuffer.push(tempVertexBuffer[v    ]);
						mesh.vertexBuffer.push(tempVertexBuffer[v + 1]);
						mesh.vertexBuffer.push(tempVertexBuffer[v + 2]);
						mesh.indexBuffer[i] = newVI;
						viBuffer[oldVI] = newVI;
						newVI++;
					}
					else {
						mesh.indexBuffer[i] = viBuffer[oldVI];
					}
				}
			}
		}

		// split vertex texture coords into the mesh, the indices for texture coords are re-calculated as well
		if(tempTexCoordBuffer.length >= 2 && mesh.texCoordIndexBuffer != null && mesh.texCoordIndexBuffer.length > 0) {
			for(var i=0; i<tiBuffer.length; i++)
				tiBuffer[i] = -1;

			mesh.texCoordBuffer = [];
			var oldTI = 0, newTI = 0;
			for(var i=0; i<mesh.texCoordIndexBuffer.length; i++) {
				oldTI = mesh.texCoordIndexBuffer[i];
				if(oldTI != -1) {
					if(tiBuffer[oldTI] == -1) {
						var t = oldTI * 2;
						mesh.texCoordBuffer.push(tempTexCoordBuffer[t    ]);
						mesh.texCoordBuffer.push(tempTexCoordBuffer[t + 1]);
						mesh.texCoordIndexBuffer[i] = newTI;
						tiBuffer[oldTI] = newTI;
						newTI++;
					}
					else {
						mesh.texCoordIndexBuffer[i] = tiBuffer[oldTI];
					}
				}
			}
		}

		// add mesh to scene
		if(!mesh.isTrivial())
			scene.addChild(mesh);
	}

	return mtllibs;
};

/**
	Parse contents of an mtl file, returning all materials and textures defined in it.
	@private
 */
JSC3D.ObjLoader.prototype.parseMtl = function(data) {
	var mtls = {};
	var curMtlName = '';

	var lines = data.split(/[ \t]*\r?\n[ \t]*/);
	for(var i=0; i<lines.length; i++) {
		var line = lines[i];
		var tokens = line.split(/[ \t]+/);
		if(tokens.length > 0) {
			var keyword = tokens[0];
			/*
			 * This has been fixed by Laurent Piroelle <laurent.piroelle@fabzat.com> to deal with mtl 
			 * keywords in wrong case caused by some exporting tools.
			 */
			switch(keyword) {
			case 'newmtl':
				curMtlName = tokens[1];
				var mtl = {};
				mtl.material = new JSC3D.Material;
				mtl.material.name = curMtlName;
				mtl.textureFileName = '';
				mtls[curMtlName] = mtl;
				break;
			case 'Ka':
			case 'ka':
				/*
				if(tokens.length == 4 && !isNaN(tokens[1])) {
					var ambientR = (parseFloat(tokens[1]) * 255) & 0xff;
					var ambientG = (parseFloat(tokens[2]) * 255) & 0xff;
					var ambientB = (parseFloat(tokens[3]) * 255) & 0xff;
					var mtl = mtls[curMtlName];
					if(mtl != null)
						mtl.material.ambientColor = (ambientR << 16) | (ambientG << 8) | ambientB;
				}
				*/
				break;
			case 'Kd':
			case 'kd':
				if(tokens.length == 4 && !isNaN(tokens[1])) {
					var diffuseR = (parseFloat(tokens[1]) * 255) & 0xff;
					var diffuseG = (parseFloat(tokens[2]) * 255) & 0xff;
					var diffuseB = (parseFloat(tokens[3]) * 255) & 0xff;
					var mtl = mtls[curMtlName];
					if(mtl != null)
						mtl.material.diffuseColor = (diffuseR << 16) | (diffuseG << 8) | diffuseB;
				}
				break;
			case 'Ks':
			case 'ks':
				// ignore specular reflectivity definition
				break;
			case 'd':
				if(tokens.length == 2 && !isNaN(tokens[1])) {
					var opacity = parseFloat(tokens[1]);
					var mtl = mtls[curMtlName];
					if(mtl != null)
						mtl.material.transparency = 1 - opacity;
				}
				break;
			case 'illum':
				/*
				if(tokens.length == 2 && tokens[1] == '2') {
					var mtl = mtls[curMtlName];
					if(mtl != null)
						mtl.material.simulateSpecular = true;
				}
				*/
				break;
			case 'map_Kd':
			case 'map_kd':
				if(tokens.length == 2) {
					var texFileName = tokens[1];
					var mtl = mtls[curMtlName];
					if(mtl != null)
						mtl.textureFileName = texFileName;
				}
				break;
			case '#':
				// ignore any comment
			default:
				break;
			}
		}
	}

	return mtls;
};

/**
	Asynchronously load a texture from a given url and set it to corresponding meshes when done.
	@private
 */
JSC3D.ObjLoader.prototype.setupTexture = function(meshList, textureUrlName) {
	var self = this;
	var texture = new JSC3D.Texture;
	this.resourceRequestCount++; /* scene complete */

	texture.onready = function() {
		for(var i=0; i<meshList.length; i++)
			meshList[i].setTexture(this);
		if(self.onresource)
			self.onresource(this);
		/* scene complete +++ */
		if(--self.resourceRequestCount == 0)
			self.onresourcecomplete();
		/* scene complete --- */
	};

	texture.createFromUrl(textureUrlName);
};

JSC3D.ObjLoader.prototype.onload = null;
JSC3D.ObjLoader.prototype.onerror = null;
JSC3D.ObjLoader.prototype.onprogress = null;
JSC3D.ObjLoader.prototype.onresource = null;
JSC3D.ObjLoader.prototype.requestCount = 0;
JSC3D.ObjLoader.prototype.resourceRequestCount = 0; /* scene complete */
