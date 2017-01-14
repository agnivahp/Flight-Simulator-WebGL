/**  
 * @fileoverview - This file sets up different buffers and draws the scene.
 *    It sets up the buffers for the terrain and draws it. 
 *    It also handles keyboard inputs and animates scene.
 * @author - Agnivah Poddar apoddar3
 */


var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// Create a place to store terrain geometry
var tVertexPositionBuffer;
var tColorBuffer;
//Create a place to store normals for shading
var tVertexNormalBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

// View parameters
var eyePt = vec3.fromValues(5.0,7.0,20.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

// Quaternion that holds the total rotation of the plane
var totRotation = quat.create();


var count = 0;

/**
 * This function sets up the buffers for the terrain.
 * It sets up vertexBuffer, normalBuffer, faceBuffer, colorBuffer.
 * @param none
 * @return none
 *
 */

function setupTerrainBuffers() {
    
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var cTerrain = [];  //color buffer
    var gridN=6;
    
    var numT = terrainFromIteration(gridN, -1,1,-1,1, vTerrain, fTerrain, nTerrain, cTerrain);
    
    console.log("Generated ", numT, " triangles"); 

    //Specify vertices
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    //Specify colors based on height of map
    tColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cTerrain), gl.STATIC_DRAW);
    tColorBuffer.itemSize = 4;
    tColorBuffer.numItems = (gridN+1)*(gridN+1);

    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain),
                  gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;


    
    //Setup Edges
     generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain),
                  gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = eTerrain.length;
    
     
}

/**
 * This function draws the terrain by binding the buffers.
 * @param none
 * @return none
 */
function drawTerrain(){
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 gl.bindBuffer(gl.ARRAY_BUFFER, tColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            tColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

/**
 * This function draws the edges of the terrain.
 * @param none
 * @return none
 */
function drawTerrainEdges(){
 gl.polygonOffset(1,1);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, tColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            tColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
 gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

// A dictionary that holds the keycodes of the buttons pressed
  var pressedKey = {};

/**
 * Passes true to the keycode key in the dictionary when key pressed down.
 * @param event - The event when a key is pressed down on the keyboard
 * @return none
 */
  function keyDown(event)
  {
    pressedKey[event.keyCode] = true;
  }

/**
 * Passes false to the keycode key in the dictionary when key is released.
 * @param event - The event when a key is released on the keyboard
 * @return none
 */
  function keyUp(event)
  {
    pressedKey[event.keyCode] = false;
  }

/**
 * Handles keyboard input and performs appropriate rotation.
 * @param none
 * @return none
 */
  function keyboardInput()
  { 
      var perFrameRot = quat.create();
      var tmp_viewDir = vec3.fromValues(0.0,0.0,-1.0);
      var tmp_up = vec3.fromValues(0.0,1.0,0.0);
      var tmp_viewPt = vec3.fromValues(0.0,0.0,0.0);
    
    // pitch up  
    if(pressedKey[38])  //up key
    {
      console.log("up");
      quat.rotateX(perFrameRot, perFrameRot, degToRad(1));
      quat.mul(totRotation, totRotation, perFrameRot);
      vec3.transformQuat(up,tmp_up,totRotation);
      vec3.transformQuat(viewDir,tmp_viewDir,totRotation);
      
    }
    //pitch down
    if(pressedKey[40])  //down key
    {
      console.log("down");
      quat.rotateX(perFrameRot, perFrameRot, degToRad(-1));
       quat.mul(totRotation, totRotation, perFrameRot);
      vec3.transformQuat(up,tmp_up,totRotation);
      vec3.transformQuat(viewDir,tmp_viewDir,totRotation);

    }
    //roll left
    if(pressedKey[37])  //left key
    {
       console.log("left");
       quat.rotateZ(perFrameRot, perFrameRot, degToRad(1));
       quat.mul(totRotation, totRotation, perFrameRot);
       vec3.transformQuat(up,tmp_up,totRotation);
      

    }
    //roll right
    if(pressedKey[39])  //right key
    { 
      console.log("right");
      quat.rotateZ(perFrameRot, perFrameRot, degToRad(-1));
       quat.mul(totRotation, totRotation, perFrameRot);
      vec3.transformQuat(up,tmp_up,totRotation);

    }
  }


//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");

  shaderProgram.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientMatColor");  
  shaderProgram.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseMatColor");
  shaderProgram.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularMatColor");    
    
}


//-------------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
function uploadMaterialToShader(a,d,s) {
  gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, s);
}


//----------------------------------------------------------------------------------

function setupBuffers() {
    setupTerrainBuffers();
}

//----------------------------------------------------------------------------------

/**
 * Renders the scene with lighting.
 * @param none
 * @return none
 */
function draw() { 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(30), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
    
    // Color values for ambient, diffuse, specular
     var ka = vec3.fromValues(0.15,0.45,0.65);
     var kd = vec3.fromValues(1.0,1.0,1.0);
     var ks = vec3.fromValues(0.23,0.0,0.5);

    var lightPosEye4 = vec4.fromValues(0.0,2.0,0.5,1.0);
    lightPosEye4 = vec4.transformMat4(lightPosEye4,lightPosEye4,mvMatrix);
    
    var lightPosEye = vec3.fromValues(lightPosEye4[0],lightPosEye4[1],lightPosEye4[2]);
    //Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0.0,-0.25,-3.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(25));     
    setMatrixUniforms();
    
    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
    {
      uploadLightsToShader(lightPosEye,[1.0,1.0,1.0],[1.0,1.0,1.0],[1.0,1.0,1.0]);
      uploadMaterialToShader(ka,kd,ks);
      drawTerrain();
    }
    
    if(document.getElementById("wirepoly").checked){
      uploadLightsToShader(lightPosEye,[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
      uploadMaterialToShader(ka,kd,ks);
      drawTerrainEdges();
    }

    if(document.getElementById("wireframe").checked){
      uploadLightsToShader(lightPosEye,[1.0,1.0,1.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
      uploadMaterialToShader(ka,kd,ks);
      drawTerrainEdges();
    }
    mvPopMatrix();
  
}

//----------------------------------------------------------------------------------
/**
 * Animates the scene. Updates eyePt to make the plane fly forward
 * @param none
 * @return none
 */
function animate() {
  var speed = 0.02;
 
  var flyDir = viewDir;
  vec3.normalize(flyDir,flyDir);
  vec3.scaleAndAdd(eyePt,eyePt,flyDir,speed);
  // //console.log(eyePt);
   
}

//----------------------------------------------------------------------------------
/**
 * Function called on startup of page
 * @param none
 * @return none
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.375, 0.839, 0.996, 1.0);
  gl.enable(gl.DEPTH_TEST);
  document.onkeydown = keyDown;
  document.onkeyup = keyUp;
  tick();

}

//----------------------------------------------------------------------------------
/**
 * Called every frame. Calls keyboardInput(), animate() and draw() for each frame
 * @param none
 * @return none
 */
function tick() {
    requestAnimFrame(tick);
    keyboardInput();
    animate();
    draw();
    
   // console.log("sfadfdf");
}
