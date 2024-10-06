import * as THREE from 'three';

// Manually merge vertices by eliminating duplicates
function mergeVertices(bufferGeometry) {
  const position = bufferGeometry.attributes.position.array;
  const vertices = [];
  const indexMapping = new Map();
  const newIndices = [];
  const uniquePositions = [];

  // Gather unique vertices and build a mapping
  for (let i = 0; i < position.length; i += 3) {
    const vertex = `${position[i].toFixed(6)},${position[i + 1].toFixed(6)},${position[i + 2].toFixed(6)}`;
    if (!indexMapping.has(vertex)) {
      uniquePositions.push(position[i], position[i + 1], position[i + 2]);
      indexMapping.set(vertex, uniquePositions.length / 3 - 1);
    }
    newIndices.push(indexMapping.get(vertex));
  }

  // Create new geometry with merged vertices
  const newGeometry = new THREE.BufferGeometry();
  newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(uniquePositions, 3));
  newGeometry.setIndex(newIndices);

  return newGeometry;
}

// Helper functions for SimplifyModifier
function pushIfUnique(array, object) {
  if (array.indexOf(object) === -1) array.push(object);
}

function removeFromArray(array, object) {
  const index = array.indexOf(object);
  if (index > -1) array.splice(index, 1);
}

function computeEdgeCollapseCost(u, v) {
  const edgelength = u.position.distanceTo(v.position);
  let curvature = 0;

  const sideFaces = [];
  let i, il = u.faces.length;

  for (i = 0; i < il; i++) {
    const face = u.faces[i];
    if (face.hasVertex(v)) sideFaces.push(face);
  }

  for (i = 0; i < il; i++) {
    let minCurvature = 1;
    const face = u.faces[i];
    for (let j = 0; j < sideFaces.length; j++) {
      const sideFace = sideFaces[j];
      const dotProd = face.normal.dot(sideFace.normal);
      minCurvature = Math.min(minCurvature, (1.001 - dotProd) / 2);
    }
    curvature = Math.max(curvature, minCurvature);
  }

  const borders = sideFaces.length < 2 ? 1 : 0;
  const cost = edgelength * curvature + borders;
  return cost;
}

function computeEdgeCostAtVertex(v) {
  if (v.neighbors.length === 0) {
    v.collapseNeighbor = null;
    v.collapseCost = -0.01;
    return;
  }

  v.collapseCost = 100000;
  v.collapseNeighbor = null;

  for (let i = 0; i < v.neighbors.length; i++) {
    const collapseCost = computeEdgeCollapseCost(v, v.neighbors[i]);
    if (!v.collapseNeighbor || collapseCost < v.collapseCost) {
      v.collapseNeighbor = v.neighbors[i];
      v.collapseCost = collapseCost;
    }
  }
}

function removeVertex(v, vertices) {
  while (v.neighbors.length) {
    const n = v.neighbors.pop();
    removeFromArray(n.neighbors, v);
  }

  removeFromArray(vertices, v);
}

function collapse(vertices, faces, u, v) {
  if (!v) {
    removeVertex(u, vertices);
    return;
  }

  const tmpVertices = [...u.neighbors];

  for (let i = u.faces.length - 1; i >= 0; i--) {
    if (u.faces[i].hasVertex(v)) {
      removeFromArray(faces, u.faces[i]);
    }
  }

  for (let i = u.faces.length - 1; i >= 0; i--) {
    u.faces[i].replaceVertex(u, v);
  }

  removeVertex(u, vertices);

  for (let i = 0; i < tmpVertices.length; i++) {
    computeEdgeCostAtVertex(tmpVertices[i]);
  }
}

// A class to represent a vertex in the geometry
class Vertex {
  constructor(position, id) {
    this.position = position;
    this.id = id;
    this.faces = [];
    this.neighbors = [];
    this.collapseCost = 0;
    this.collapseNeighbor = null;
  }

  addUniqueNeighbor(vertex) {
    pushIfUnique(this.neighbors, vertex);
  }

  removeIfNonNeighbor(vertex) {
    const index = this.neighbors.indexOf(vertex);
    if (index !== -1) {
      this.neighbors.splice(index, 1);
    }
  }
}

// Class to represent a face (triangle) in the geometry
class Triangle {
  constructor(v1, v2, v3) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;

    this.normal = new THREE.Vector3();
    this.computeNormal();

    v1.faces.push(this);
    v2.faces.push(this);
    v3.faces.push(this);

    v1.addUniqueNeighbor(v2);
    v1.addUniqueNeighbor(v3);
    v2.addUniqueNeighbor(v1);
    v2.addUniqueNeighbor(v3);
    v3.addUniqueNeighbor(v1);
    v3.addUniqueNeighbor(v2);
  }

  computeNormal() {
    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();

    ab.subVectors(this.v2.position, this.v1.position);
    cb.subVectors(this.v3.position, this.v2.position);
    cb.cross(ab).normalize();
    this.normal.copy(cb);
  }

  hasVertex(vertex) {
    return vertex === this.v1 || vertex === this.v2 || vertex === this.v3;
  }

  replaceVertex(oldVertex, newVertex) {
    if (oldVertex === this.v1) {
      this.v1 = newVertex;
    } else if (oldVertex === this.v2) {
      this.v2 = newVertex;
    } else if (oldVertex === this.v3) {
      this.v3 = newVertex;
    }

    oldVertex.removeIfNonNeighbor(this.v1);
    oldVertex.removeIfNonNeighbor(this.v2);
    oldVertex.removeIfNonNeighbor(this.v3);

    this.v1.addUniqueNeighbor(this.v2);
    this.v1.addUniqueNeighbor(this.v3);
    this.v2.addUniqueNeighbor(this.v1);
    this.v2.addUniqueNeighbor(this.v3);
    this.v3.addUniqueNeighbor(this.v1);
    this.v3.addUniqueNeighbor(this.v2);

    this.computeNormal();
  }
}

// SimplifyModifier class
export class SimplifyModifier {
  modify(bufferGeometry, percentage) {
    // Manually merge vertices
    bufferGeometry = mergeVertices(bufferGeometry);
    
    const vertices = [];
    const faces = [];

    const positionAttr = bufferGeometry.attributes.position;
    const indexAttr = bufferGeometry.index?.array;

    if (!indexAttr) {
      console.error('Geometry has no index array.');
      return bufferGeometry;
    }

    // Create vertices
    for (let i = 0; i < positionAttr.count; i++) {
      const position = new THREE.Vector3(
        positionAttr.getX(i),
        positionAttr.getY(i),
        positionAttr.getZ(i)
      );
      vertices.push(new Vertex(position, i));
    }

    // Create faces
    for (let i = 0; i < indexAttr.length; i += 3) {
      const a = indexAttr[i];
      const b = indexAttr[i + 1];
      const c = indexAttr[i + 2];
      faces.push(new Triangle(vertices[a], vertices[b], vertices[c]));
    }

    // Compute edge collapse costs
    vertices.forEach((v) => computeEdgeCostAtVertex(v));

    // Simplify vertices
    const targetCount = Math.round(vertices.length * percentage);

    while (vertices.length > targetCount) {
      const nextVertex = vertices.reduce((min, v) =>
        v.collapseCost < min.collapseCost ? v : min
      );
      collapse(vertices, faces, nextVertex, nextVertex.collapseNeighbor);
    }

    // Build simplified BufferGeometry
    const newPositions = [];
    const newIndices = [];

    vertices.forEach((v) => {
      newPositions.push(v.position.x, v.position.y, v.position.z);
    });

    faces.forEach((f) => {
      newIndices.push(
        vertices.indexOf(f.v1),
        vertices.indexOf(f.v2),
        vertices.indexOf(f.v3)
      );
    });

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(newPositions, 3)
    );
    newGeometry.setIndex(newIndices);

    return newGeometry;
  }
}
