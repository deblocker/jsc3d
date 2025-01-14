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
	@class StlLoader

	This class implements a scene loader from an STL file. Both binary and ASCII STL files are supported.
 */
JSC3D.StlLoader = function(onload, onerror, onprogress, onresource) {
	this.onload = (onload && typeof(onload) == 'function') ? onload : null;
	this.onerror = (onerror && typeof(onerror) == 'function') ? onerror : null;
	this.onprogress = (onprogress && typeof(onprogress) == 'function') ? onprogress : null;
	this.onresource = (onresource && typeof(onresource) == 'function') ? onresource : null;
	this.decimalPrecision = 3;
	this.request = null;
};

/**
	Load scene from a given STL file.
	@param {String} urlName a string that specifies where to fetch the STL file.
 */
JSC3D.StlLoader.prototype.loadFromUrl = function(urlName) {
	var self = this;
	var isIE = JSC3D.PlatformInfo.browser == 'ie';
	//TODO: current blob implementation seems do not work correctly on IE10. Repair it or turn to an arraybuffer implementation.
	var isIE10Compatible = false;//(isIE && parseInt(JSC3D.PlatformInfo.version) >= 10);
	var xhr = new XMLHttpRequest;
	xhr.open('GET', encodeURI(urlName), true);
	if(isIE10Compatible)
		xhr.responseType = 'blob';	// use blob method to deal with STL files for IE >= 10
	else if(isIE)
		xhr.setRequestHeader("Accept-Charset", "x-user-defined");
	else
		xhr.overrideMimeType('text/plain; charset=x-user-defined');

	xhr.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200 || this.status == 0) {
				if(JSC3D.console)
					JSC3D.console.logInfo('Finished loading STL file "' + urlName + '".');
				if(self.onload) {
					if(self.onprogress)
						self.onprogress('Loading STL file ...', 1);
					if(isIE10Compatible) {
						// asynchronously decode blob to binary string
						var blobReader = new FileReader;
						blobReader.onload = function(event) {
							var scene = new JSC3D.Scene;
							scene.srcUrl = urlName;
							self.parseStl(scene, event.target.result);
							self.onload(scene);
						};
						blobReader.readAsText(this.response, 'x-user-defined');
					}
					else if(isIE) {
						// decode data from XHR's responseBody into a binary string, since it cannot be accessed directly from javascript.
						// this would work on IE6~IE9
						var scene = new JSC3D.Scene;
						scene.srcUrl = urlName;
						try {
							self.parseStl(scene, JSC3D.Util.ieXHRResponseBodyToString(this.responseBody));
						} catch(e) {}
						self.onload(scene);
					}
					else {
						var scene = new JSC3D.Scene;
						scene.srcUrl = urlName;
						self.parseStl(scene, this.responseText);
						self.onload(scene);
					}
				}
			}
			else {
				if(JSC3D.console)
					JSC3D.console.logError('Failed to load STL file "' + urlName + '".');
				if(self.onerror)
					self.onerror('Failed to load STL file "' + urlName + '".');
			}
			self.request = null;
		}
	};

	if(this.onprogress) {
		this.onprogress('Loading STL file ...', 0);
		xhr.onprogress = function(event) {
			self.onprogress('Loading STL file ...', event.loaded / event.total);
		};
	}

	this.request = xhr;
	xhr.send();
};

/**
	Abort current loading if it is not finished yet.
 */
JSC3D.StlLoader.prototype.abort = function() {
	if(this.request) {
		this.request.abort();
		this.request = null;
	}
};

/**
	Set decimal precision that defines the threshold to detect and weld vertices that coincide.
	@param {Number} precision the decimal preciison.
 */
JSC3D.StlLoader.prototype.setDecimalPrecision = function(precision) {
	this.decimalPrecision = precision;
};

/**
	Parse contents of an STL file and generate the scene.
	@private
 */
JSC3D.StlLoader.prototype.parseStl = function(scene, data) {
	var FACE_VERTICES           = 3;

	var HEADER_BYTES            = 80;
	var FACE_COUNT_BYTES        = 4;
	var FACE_NORMAL_BYTES       = 12;
	var VERTEX_BYTES            = 12;
	var ATTRIB_BYTE_COUNT_BYTES = 2;

	var mesh = new JSC3D.Mesh;
	mesh.vertexBuffer = [];
	mesh.indexBuffer = [];
	mesh.faceNormalBuffer = [];

	var isBinary = false;
	var reader = new JSC3D.BinaryStream(data);

	// Detect whether this is an ASCII STL stream or a binary STL stream by checking a snippet of contents.
	reader.skip(HEADER_BYTES + FACE_COUNT_BYTES);
	for(var i=0; i<256 && !reader.eof(); i++) {
		if(reader.readUInt8() > 0x7f) {
			isBinary = true;
			break;
		}
	}

	if(JSC3D.console)
		JSC3D.console.logInfo('This is recognised as ' + (isBinary ? 'a binary' : 'an ASCII') + ' STL file.');
	
	if(!isBinary) {
		/*
		 * This should be an ASCII STL file.
		 * By Triffid Hunter <triffid.hunter@gmail.com>.
		 */

		var facePattern =	'facet\\s+normal\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+' + 
								'outer\\s+loop\\s+' + 
									'vertex\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+' + 
									'vertex\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+' + 
									'vertex\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+([-+]?\\b(?:[0-9]*\\.)?[0-9]+(?:[eE][-+]?[0-9]+)?\\b)\\s+' + 
								'endloop\\s+' + 
							'endfacet';
		var faceRegExp = new RegExp(facePattern, 'ig');
		var matches = data.match(faceRegExp);

		if(matches) {		
			var numOfFaces = matches.length;

			mesh.faceCount = numOfFaces;
			var v2i = {};

			// reset regexp for vertex extraction
			faceRegExp.lastIndex = 0;
			faceRegExp.global = false;

			// read faces
			for(var r=faceRegExp.exec(data); r!=null; r=faceRegExp.exec(data)) {
				mesh.faceNormalBuffer.push(parseFloat(r[1]), parseFloat(r[2]), parseFloat(r[3]));

				for(var i=0; i<FACE_VERTICES; i++) {
					var x = parseFloat(r[4 + (i * 3)]);
					var y = parseFloat(r[5 + (i * 3)]);
					var z = parseFloat(r[6 + (i * 3)]);

					// weld vertices by the given decimal precision
					var vertKey = x.toFixed(this.decimalPrecision) + '-' + y.toFixed(this.decimalPrecision) + '-' + z.toFixed(this.decimalPrecision);
					var vi = v2i[vertKey];
					if(vi === undefined) {
						vi = mesh.vertexBuffer.length / 3;
						v2i[vertKey] = vi;
						mesh.vertexBuffer.push(x);
						mesh.vertexBuffer.push(y);
						mesh.vertexBuffer.push(z);
					}
					mesh.indexBuffer.push(vi);
				}

				// mark the end of the indices of a face
				mesh.indexBuffer.push(-1);
			}
		}
	}
	else {
		/*
		 * This is a binary STL file.
		 */

		reader.reset();

		// skip 80-byte's STL file header
		reader.skip(HEADER_BYTES);

		// read face count
		var numOfFaces = reader.readUInt32();

		// calculate the expected length of the stream
		var expectedLen = HEADER_BYTES + FACE_COUNT_BYTES + 
							(FACE_NORMAL_BYTES + VERTEX_BYTES * FACE_VERTICES + ATTRIB_BYTE_COUNT_BYTES) * numOfFaces;

		// is file complete?
		if(reader.size() < expectedLen) {
			if(JSC3D.console)
				JSC3D.console.logError('Failed to parse contents of the file. It seems not complete.');
			return;
		}

		mesh.faceCount = numOfFaces;
		var v2i = {};

		// read faces
		for(var i=0; i<numOfFaces; i++) {
			// read normal vector of a face
			mesh.faceNormalBuffer.push(reader.readFloat32());
			mesh.faceNormalBuffer.push(reader.readFloat32());
			mesh.faceNormalBuffer.push(reader.readFloat32());

			// read all 3 vertices of a face
			for(var j=0; j<FACE_VERTICES; j++) {
				// read coords of a vertex
				var x, y, z;
				x = reader.readFloat32();
				y = reader.readFloat32();
				z = reader.readFloat32();

				// weld vertices by the given decimal precision
				var vertKey = x.toFixed(this.decimalPrecision) + '-' + y.toFixed(this.decimalPrecision) + '-' + z.toFixed(this.decimalPrecision);
				var vi = v2i[vertKey];
				if(vi != undefined) {
					mesh.indexBuffer.push(vi);
				}
				else {
					vi = mesh.vertexBuffer.length / 3;
					v2i[vertKey] = vi;
					mesh.vertexBuffer.push(x);
					mesh.vertexBuffer.push(y);
					mesh.vertexBuffer.push(z);
					mesh.indexBuffer.push(vi);
				}
			}

			// mark the end of the indices of a face
			mesh.indexBuffer.push(-1);

			// skip 2-bytes' 'attribute byte count' field, since we do not deal with any additional attribs
			reader.skip(ATTRIB_BYTE_COUNT_BYTES);
		}
	}

	// add mesh to scene
	if(!mesh.isTrivial()) {
		// Some tools (Blender etc.) export STLs with empty face normals (all equal to 0). In this case we ...
		// ... simply set the face normal buffer to null so that they will be calculated in mesh's init stage. 
		if( Math.abs(mesh.faceNormalBuffer[0]) < 1e-6 && 
			Math.abs(mesh.faceNormalBuffer[1]) < 1e-6 && 
			Math.abs(mesh.faceNormalBuffer[2]) < 1e-6 ) {
			mesh.faceNormalBuffer = null;
		}

		scene.addChild(mesh);
	}
};

JSC3D.StlLoader.prototype.onload = null;
JSC3D.StlLoader.prototype.onerror = null;
JSC3D.StlLoader.prototype.onprogress = null;
JSC3D.StlLoader.prototype.onresource = null;
JSC3D.StlLoader.prototype.decimalPrecision = 3;
