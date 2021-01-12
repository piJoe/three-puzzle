import {BufferGeometry} from "three/src/core/BufferGeometry";
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute';
import { Vector3 } from 'three/src/math/Vector3';
import {Vector2} from "three/src/math/Vector2";

export class UVBoxBufferGeometry extends BufferGeometry {
    constructor( width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1 ) {

        super();

        this.type = 'UVBoxBufferGeometry';

        this.parameters = {
            width: width,
            height: height,
            depth: depth,
            widthSegments: widthSegments,
            heightSegments: heightSegments,
            depthSegments: depthSegments
        };

        const scope = this;

        // segments

        widthSegments = Math.floor( widthSegments );
        heightSegments = Math.floor( heightSegments );
        depthSegments = Math.floor( depthSegments );

        // buffers

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // helper variables

        let numberOfVertices = 0;
        let groupStart = 0;

        // build each side of the box geometry

        const totalUVWidth = width+depth*2;
        const totalUVHeight = height+depth*2;

        // uv mapping
        const uvLongTop = [new Vector2(depth/totalUVWidth, 0), new Vector2((depth+width)/totalUVWidth, depth/totalUVHeight)];
        const uvLongBot = [new Vector2(depth/totalUVWidth, (depth+height)/totalUVHeight), new Vector2((depth+width)/totalUVWidth,1)];

        const uvShortLeft = [new Vector2(0, depth/totalUVHeight), new Vector2(depth/totalUVWidth, (depth+height)/totalUVHeight)];
        const uvShortRight = [new Vector2((depth+width)/totalUVWidth, depth/totalUVHeight), new Vector2(1, (depth+height)/totalUVHeight)];

        const uvTop = [new Vector2(depth/totalUVWidth, depth/totalUVHeight), new Vector2((depth+width)/totalUVWidth, (depth+height)/totalUVHeight)];
        const uvBot = [new Vector2(0,0), new Vector2(depth/totalUVWidth, depth/totalUVHeight)];

        console.log('UV STUFF', totalUVWidth, totalUVHeight, width, height, depth);

        // top/bottom
        buildPlane( 'x', 'y', 'z', 1, - 1, width, height, depth, widthSegments, heightSegments, uvTop ); // pz
        buildPlane( 'x', 'y', 'z', - 1, - 1, width, height, - depth, widthSegments, heightSegments, uvBot ); // nz

        // long sides
        buildPlane( 'x', 'z', 'y', 1, 1, width, depth, height, widthSegments, depthSegments, uvLongTop ); // py
        buildPlane( 'x', 'z', 'y', 1, - 1, width, depth, - height, widthSegments, depthSegments, uvLongBot ); // ny

        // sides
        buildPlane( 'z', 'y', 'x', - 1, - 1, depth, height, width, depthSegments, heightSegments, uvShortRight ); // px
        buildPlane( 'z', 'y', 'x', 1, - 1, depth, height, - width, depthSegments, heightSegments, uvShortLeft ); // nx


        // build geometry

        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

        function buildPlane( u, v, w, udir, vdir, width, height, depth, gridX, gridY, uvRange ) {

            const segmentWidth = width / gridX;
            const segmentHeight = height / gridY;

            const widthHalf = width / 2;
            const heightHalf = height / 2;
            const depthHalf = depth / 2;

            const gridX1 = gridX + 1;
            const gridY1 = gridY + 1;

            let vertexCounter = 0;
            let groupCount = 0;

            const vector = new Vector3();

            // generate vertices, normals and uvs

            for ( let iy = 0; iy < gridY1; iy ++ ) {

                const y = iy * segmentHeight - heightHalf;

                for ( let ix = 0; ix < gridX1; ix ++ ) {

                    const x = ix * segmentWidth - widthHalf;

                    // set values to correct vector component

                    vector[ u ] = x * udir;
                    vector[ v ] = y * vdir;
                    vector[ w ] = depthHalf;

                    // now apply vector to vertex buffer

                    vertices.push( vector.x, vector.y, vector.z );

                    // set values to correct vector component

                    vector[ u ] = 0;
                    vector[ v ] = 0;
                    vector[ w ] = depth > 0 ? 1 : - 1;

                    // now apply vector to normal buffer

                    normals.push( vector.x, vector.y, vector.z );

                    // uvs

                    const uvU = (new Vector2()).lerpVectors(uvRange[0], uvRange[1], ix/gridX);
                    const uvV = (new Vector2()).lerpVectors(uvRange[0], uvRange[1], iy/gridY);
                    uvs.push(uvU.x);
                    uvs.push(1-uvV.y);
                    console.log(uvU.x, uvV.y);

                    // counters

                    vertexCounter += 1;

                }

            }

            // indices

            // 1. you need three indices to draw a single face
            // 2. a single segment consists of two faces
            // 3. so we need to generate six (2*3) indices per segment

            for ( let iy = 0; iy < gridY; iy ++ ) {

                for ( let ix = 0; ix < gridX; ix ++ ) {

                    const a = numberOfVertices + ix + gridX1 * iy;
                    const b = numberOfVertices + ix + gridX1 * ( iy + 1 );
                    const c = numberOfVertices + ( ix + 1 ) + gridX1 * ( iy + 1 );
                    const d = numberOfVertices + ( ix + 1 ) + gridX1 * iy;

                    // faces

                    indices.push( a, b, d );
                    indices.push( b, c, d );

                    // increase counter

                    groupCount += 6;

                }

            }

            // add a group to the geometry. this will ensure multi material support

            scope.addGroup( groupStart, groupCount, 0 );

            // calculate new start value for groups

            groupStart += groupCount;

            // update total number of vertices

            numberOfVertices += vertexCounter;

        }

    }

}