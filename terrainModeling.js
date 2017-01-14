/**  
 * @fileoverview - This file implements the algorithms for terrain generation.
 *    It implements the Diamond Square Algorithm.
 *    Also calculates the normals and colormap.
 * @author - Agnivah Poddar apoddar3
 */

/**
 * This function sets up the buffers for the terrain.
 * @param n Size of the grid
 * @param minX minimum x value of viewport
 * @param maxX maximum x value of viewport
 * @param minY minimum y value of viewport
 * @param maxY maximum y value of viewport
 * @param vertexArray Buffer for the vertices
 * @param faceArray Buffer for each face of the mesh
 * @param normalArray Buffer for each vertex normal
 * @param colorArray Buffer for the colors of each vertex
 * @return none
 *
 */
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray,normalArray, colorArray)
{
  var size = Math.pow(2,n) + 1;
  var grid = size*size;
  var heightMap = new Float32Array(grid);
   
  var scale = 0.6;
    
  //Applies diamond square algo to create Height map
  diamondSquare(scale, size, heightMap);
  //console.log("heightMap", heightMap);


  var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
  
  //Pushes vertices and initializes normal array to 0
    for(var i=0;i<=size;i++)
       for(var j=0;j<=size;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
         // Push height calculated from DiamondSquare Algorithm
           vertexArray.push(heightMap[i+size*j]/6);
         

         //Apply color based on height     
          if(heightMap[i+size*j]/6 <= -2)
          {
            colorArray.push(0);
            colorArray.push(0);
            colorArray.push(0.6);
            colorArray.push(1);
          }
          // else if(-2<(heightMap[i+size*j]/6)<=-1)
          // {
          //   colorArray.push(0);
          //   colorArray.push(0);
          //   colorArray.push(0);
          //   colorArray.push(1);

          // }
          
          else if(-1<(heightMap[i+size*j]/6)<=-0.8)
          {
            colorArray.push(0);
            colorArray.push(0.4);
            colorArray.push(0);
            colorArray.push(1);

          }
          else if(-0.8<(heightMap[i+size*j]/6)<=-0.6)
          {
            colorArray.push(0.34);
            colorArray.push(0.4);
            colorArray.push(0);
            colorArray.push(1);

          }
          else if(-0.6<(heightMap[i+size*j]/6)<=-0.4)
          {
            colorArray.push(0.5);
            colorArray.push(0.2);
            colorArray.push(0.8);
            colorArray.push(1);

          }
          else if(-0.4<(heightMap[i+size*j]/6)<=-0.2)
          {
            colorArray.push(0.0);
            colorArray.push(0.4);
            colorArray.push(0.3);
            colorArray.push(1);

          }
          else if(-0.2<(heightMap[i+size*j]/6)<=0.6)
          {
            colorArray.push(0.0);
            colorArray.push(0.7);
            colorArray.push(0);
            colorArray.push(1);

          }
          
          else if(0.6<(heightMap[i+size*j]/6)<=0.8)
          {
            colorArray.push(0.7);
            colorArray.push(0.4);
            colorArray.push(0.3);
            colorArray.push(1);

          }

             else
            {
              colorArray.push(1.0);
              colorArray.push(1.0);
              colorArray.push(1.0);
            colorArray.push(1);

            }
        
        //Initialize normals to 0
           normalArray.push(0);
           normalArray.push(0);
           normalArray.push(0);
         
       }

   //Create a faceArray by pushing correct vertex indices
    var numT=0;
    for(var i=0;i<size;i++)
       for(var j=0;j<size;j++)
       {
           var vid = i*(size+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+size+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+size+1);
           faceArray.push(vid+size+1);
           numT+=2;
       }

       /*
        *  Calculation of normals for shading. 
        *  For each face from faceArray, obtain vertices and calculate normal for face. Normalize it and store it in
        *  normalArray.
        */
  
       var numFaces = faceArray.length/3;
       for(var f = 0; f<numFaces; f++)
       {
          var fid = f*3;
          //get vertex ids from faceArray
          var vid = faceArray[fid];
          var vertex1 = vec3.fromValues(vertexArray[3*vid], vertexArray[3*vid+1], vertexArray[3*vid+2]);

          vid = faceArray[fid +1];
          var vertex2 =  vec3.fromValues(vertexArray[3*vid], vertexArray[3*vid+1], vertexArray[3*vid+2]);
          
          vid = faceArray[fid + 2];
          var vertex3 = vec3.fromValues(vertexArray[3*vid], vertexArray[3*vid+1], vertexArray[3*vid+2]); 
          
          var n1 = vec3.fromValues(0,0,0);
          var n2 = vec3.fromValues(0,0,0);
          var n = vec3.fromValues(0,0,0);

          //Compute normal vector for face
          vec3.sub(n1, vertex2, vertex1);
          vec3.sub(n2, vertex3, vertex1);
          vec3.cross(n, n1, n2); 
          vec3.normalize(n,n);
          
          //Add normals for each vertex that is part of the face
          vid = faceArray[fid];
          normalArray[3*vid] += n[0];
          normalArray[3*vid+1] +=n[1];
          normalArray[3*vid+2] +=n[2];

          vid = faceArray[fid+1];
          normalArray[3*vid] += n[0];
          normalArray[3*vid+1] +=n[1];
          normalArray[3*vid+2] +=n[2];

          vid = faceArray[fid+2];
          normalArray[3*vid] += n[0];
          normalArray[3*vid+1] +=n[1];
          normalArray[3*vid+2] +=n[2];
          
          
       }
     

       /*
        *  Normalize the vertex normals and the overwrite with normalized normals
        */
       for(var k = 0; k<numFaces; k++)
       {
          var fid = k*3;
          //get vertex ids from faceArray
          var vid = faceArray[fid];

          //Extract vertex normal and normalize it 
          var tmp = vec3.fromValues( normalArray[3*vid],normalArray[3*vid +1],normalArray[3*vid +2]);
          vec3.normalize(tmp,tmp);
          normalArray[3*vid] = tmp[0];
          normalArray[3*vid +1] = tmp[1];
          normalArray[3*vid +2] = tmp[2];

          vid = faceArray[fid +1];
          tmp = vec3.fromValues( normalArray[3*vid],normalArray[3*vid +1],normalArray[3*vid +2]);
          vec3.normalize(tmp,tmp);
          normalArray[3*vid] = tmp[0];
          normalArray[3*vid +1] = tmp[1];
          normalArray[3*vid +2] = tmp[2];

          vid = faceArray[fid +2];
          tmp = vec3.fromValues( normalArray[3*vid],normalArray[3*vid +1],normalArray[3*vid +2]);
          vec3.normalize(tmp,tmp);
          normalArray[3*vid] = tmp[0];
          normalArray[3*vid +1] = tmp[1];
          normalArray[3*vid +2] = tmp[2];
       }

    return numT;
}
//-------------------------------------------------------------------------

/**
 * This function retrieves the value in the heightmap
 * @param x x-coordinate for vertex we wish to access
 * @param x y-coordinate for vertex we wish to access
 * @param size Edge size of the grid
 * @param heightMap The height map that is being created
 * @return heightMap[x + size * y] The value for a particular vertex
 *
 */
  function getHeight(x,y,size,heightMap)
  {
    if((x<0 || x> size -1) || (y<0 || y> size -1))
        return -1;
    return heightMap[x + size * y];
  }
//-------------------------------------------------------------------------

/**
 * This function sets the height value in the heightmap
 * @param val The value to be pushed in the height map
 * @param x x-coordinate for vertex we wish to access
 * @param x y-coordinate for vertex we wish to access
 * @param size Edge size of the grid
 * @param heightMap The height map that is being created
 * @return none
 *
 */
  function setHeight(val,x,y,size,heightMap)
  {
    heightMap[x + size * y] = val;
  }
//-------------------------------------------------------------------------

/**
 * This function creates the Height Map using Diamond Square Algorithm
 * @param scale The roughness factor for the algorithm
 * @param size Edge size of the grid
 * @param heightMap The height map that is being created
 * @return none 
 *
 */
function diamondSquare(scale,size,heightMap)
  {
   
    //Initialize the four corners of terrain
    heightMap[0 + size * 0] = 0;
    heightMap[0 + size * (size-1)] = 0;
    heightMap[(size -1) + size * (size -1)] = 0;
    heightMap[(size -1) + size * 0] = 0;

    console.log("Initialized 4 corners"); 

    divSmallerSeg(size-1,size, scale, heightMap);

  }

/**
 * This function recursively calls itself. Performs the square and diamond functions
 * on smaller segments of the whole grid each time it calls itself
 * @param factor Factor that is used to create random height
 * @param size Edge size of the grid
 * @param scale The roughness factor for the algorithm
 * @param heightMap The height map that is being created
 * @return none 
 */
function divSmallerSeg(factor, size, scale, heightMap)
    {
      var x, y;
      var z = scale * factor;

      var center = factor /2 ;
      

      if(center<1)
        return;
      //Performed for each square in grid
      for(y = center; y<size-1; y = y+factor)
      {
        for(x= center; x<size-1; x = x+factor)
        {
          square(x, y, center, Math.random()*z*2 - z, size,heightMap);
        //  console.log("square"); 

        }
      }
    
      //Performed for each diamond in grid
      for(y = 0; y<size-1; y = y+center)
      {
        for(x = (y + center)%factor; x<size-1; x = x+factor)
        {
          diamond(x, y, center, Math.random()*z*2 - z,size,heightMap);
  //  console.log("diamond"); 

        }
      }
      //recursive call
      divSmallerSeg(factor/2,size, scale,heightMap);
    }

//-------------------------------------------------------------------------

/**
 * This function executes the square step.
 * Calculates the average of neighbouring 3 or 4 contributions and sets height.
 * @param x x-coordinate for vertex 
 * @param x y-coordinate for vertex 
 * @param factor Factor that is used to create random height
 * @param z Height factor that we would assign
 * @param size Edge size of the grid
 * @param heightMap The height map that is being created
 * @return none 
 */
function square(x,y,factor,z,size, heightMap)
    {
      var avg = 0;
      var count =0;
      if(getHeight(x-factor, y-factor, size, heightMap) !=-1)
      {
        avg += getHeight(x-factor, y-factor, size,heightMap);
        count +=1;
      }
      if(getHeight(x-factor, y+factor, size, heightMap) !=-1)
      {
        avg += getHeight(x-factor, y+factor, size, heightMap);
        count +=1;
      }
      if(getHeight(x+factor, y-factor, size, heightMap) !=-1)
      {
        avg += getHeight(x+factor, y-factor, size, heightMap);
        count +=1;
      }
      if(getHeight(x+factor, y+factor, size, heightMap) !=-1)
      {
        avg += getHeight(x+factor, y+factor, size, heightMap);
        count +=1;
      }
      avg = avg/count;
      setHeight(avg + z,x,y, size, heightMap);

    }


//-------------------------------------------------------------------------

/**
 * This function executes the diamond step.
 * Calculates the average of neighbouring 4 contributions and sets height.
 * @param x x-coordinate for vertex 
 * @param x y-coordinate for vertex 
 * @param factor Factor that is used to create random height
 * @param z Height factor that we would assign
 * @param size Edge size of the grid
 * @param heightMap The height map that is being created
 * @return none 
 */

function diamond(x,y,factor,z, size,heightMap)
    {
      var avg = 0;
      avg += getHeight(x, y-factor, size, heightMap);
      avg += getHeight(x-factor, y, size, heightMap);
      avg += getHeight(x+factor, y, size, heightMap);
      avg += getHeight(x, y+factor, size, heightMap);
      avg = avg/4;
      setHeight(avg + z,x,y, size, heightMap);

    }

//-------------------------------------------------------------------------
/**
 * This function generates lines for each triangle
 * @param faceArray Used to obtain vertex index for each face
 * @param lineArray Array modified to generate lines
 * @return none 
 */
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

//-------------------------------------------------------------------------






