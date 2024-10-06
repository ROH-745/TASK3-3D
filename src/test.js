class Triangle {
  constructor(v1, v2, v3, a, b, c, fvuv, materialIndex) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
    this.normal = new THREE.Vector3();
    this.faceVertexUvs = fvuv;
    this.materialIndex = materialIndex;

    this.computeNormal();

    v1.faces.push(this);
    v1.addUniqueNeighbor(v2);
    v1.addUniqueNeighbor(v3);

    v2.faces.push(this);
    v2.addUniqueNeighbor(v1);
    v2.addUniqueNeighbor(v3);

    v3.faces.push(this);
    v3.addUniqueNeighbor(v1);
    v3.addUniqueNeighbor(v2);
  }

  computeNormal() {
    const vA = this.v1.position;
    const vB = this.v2.position;
    const vC = this.v3.position;

    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    cb.cross(ab).normalize();

    this.normal.copy(cb);
  }

  hasVertex(v) {
    return v === this.v1 || v === this.v2 || v === this.v3;
  }

  replaceVertex(oldv, newv) {
    if (oldv === this.v1) {
      this.a = newv.id;
      this.v1 = newv;
    } else if (oldv === this.v2) {
      this.b = newv.id;
      this.v2 = newv;
    } else if (oldv === this.v3) {
      this.c = newv.id;
      this.v3 = newv;
    }

    removeFromArray(oldv.faces, this);
    newv.faces.push(this);

    oldv.removeIfNonNeighbor(this.v1);
    this.v1.removeIfNonNeighbor(oldv);

    oldv.removeIfNonNeighbor(this.v2);
    this.v2.removeIfNonNeighbor(oldv);

    oldv.removeIfNonNeighbor(this.v3);
    this.v3.removeIfNonNeighbor(oldv);

    this.v1.addUniqueNeighbor(this.v2);
    this.v1.addUniqueNeighbor(this.v3);

    this.v2.addUniqueNeighbor(this.v1);
    this.v2.addUniqueNeighbor(this.v3);

    this.v3.addUniqueNeighbor(this.v1);
    this.v3.addUniqueNeighbor(this.v2);

    this.computeNormal();
  }
}

class Vertex {
  constructor(v, id) {
    this.position = v;
    this.id = id;
    this.faces = [];
    this.neighbors = [];
    this.collapseCost = 0;
    this.collapseNeighbor = null;
  }

  addUniqueNeighbor(vertex) {
    pushIfUnique(this.neighbors, vertex);
  }

  removeIfNonNeighbor(n) {
    const index = this.neighbors.indexOf(n);
    if (index === -1) return;
    for (const face of this.faces) {
      if (face.hasVertex(n)) return;
    }
    this.neighbors.splice(index, 1);
  }
}

function pushIfUnique(array, object) {
  if (array.indexOf(object) === -1) array.push(object);
}

function removeFromArray(array, object) {
  const index = array.indexOf(object);
  if (index > -1) array.splice(index, 1);
}

function computeEdgeCollapseCost(u, v) {
  const edgelength = v.position.distanceTo(u.position);
  let curvature = 0;

  const sideFaces = [];
  for (const face of u.faces) {
    if (face.hasVertex(v)) {
      sideFaces.push(face);
    }
  }

  for (const face of u.faces) {
    let minCurvature = 1;
    for (const sideFace of sideFaces) {
      const dotProd = face.normal.dot(sideFace.normal);
      minCurvature = Math.min(minCurvature, (1.001 - dotProd) / 2);
    }
    curvature = Math.max(curvature, minCurvature);
  }

  let borders = 0;
  if (sideFaces.length < 2) {
    curvature = 1;
  }

  const amt = edgelength * curvature + borders + computeUVsCost(u, v);

  return amt;
}

function computeUVsCost(u, v) {
  if (!u.faces[0].faceVertexUvs || !v.faces[0].faceVertexUvs) return 0;
  let UVcost = 0;

  const checkUVs = (vertex) => {
    const UVsAroundVertex = vertex.faces
      .filter(f => f.hasVertex(vertex === u ? v : u))
      .map(f => getUVsOnVertex(f, vertex));

    UVsAroundVertex.reduce((prev, uv) => {
      if (prev.x && (prev.x !== uv.x || prev.y !== uv.y)) {
        UVcost += 1;
      }
      return uv;
    }, {});
  };

  checkUVs(v);
  checkUVs(u);

  return UVcost;
}

function computeEdgeCostAtVertex(v) {
  if (v.neighbors.length === 0) {
    v.collapseNeighbor = null;
    v.collapseCost = -0.01;
    return;
  }

  v.collapseCost = 100000;
  v.collapseNeighbor = null;

  for (const neighbor of v.neighbors) {
    const collapseCost = computeEdgeCollapseCost(v, neighbor);

    if (!v.collapseNeighbor) {
      v.collapseNeighbor = neighbor;
      v.collapseCost = collapseCost;
      v.minCost = collapseCost;
      v.totalCost = 0;
      v.costCount = 0;
    }

    v.costCount++;
    v.totalCost += collapseCost;

    if (collapseCost < v.minCost) {
      v.collapseNeighbor = neighbor;
      v.minCost = collapseCost;
    }
  }

  v.collapseCost = v.totalCost / v.costCount;
}

function collapse(vertices, faces, u, v, preserveTexture) {
  if (!v) {
    removeVertex(u, vertices);
    return true;
  }

  const tmpVertices = [...u.neighbors];

  let moveToThisUvsValues = null;

  for (let i = u.faces.length - 1; i >= 0; i--) {
    if (u.faces[i].hasVertex(v)) {
      if (preserveTexture && u.faces[i].faceVertexUvs) {
        moveToThisUvsValues = getUVsOnVertex(u.faces[i], v);
      }
      removeFace(u.faces[i], faces);
    }
  }

  if (preserveTexture && u.faces.length && u.faces[0].faceVertexUvs) {
    for (const face of u.faces) {
      const faceVerticeUVs = getUVsOnVertex(face, u);
      faceVerticeUVs.copy(moveToThisUvsValues);
    }
  }

  for (const face of u.faces) {
    face.replaceVertex(u, v);
  }

  removeVertex(u, vertices);

  for (const vertex of tmpVertices) {
    computeEdgeCostAtVertex(vertex);
  }

  return true;
}

function removeVertex(v, vertices) {
  console.assert(v.faces.length === 0);
  while (v.neighbors.length) {
    const n = v.neighbors.pop();
    removeFromArray(n.neighbors, v);
  }
  removeFromArray(vertices, v);
}

function removeFace(f, faces) {
  removeFromArray(faces, f);
  if (f.v1) removeFromArray(f.v1.faces, f);
  if (f.v2) removeFromArray(f.v2.faces, f);
  if (f.v3) removeFromArray(f.v3.faces, f);

  const vs = [f.v1, f.v2, f.v3];
  for (let i = 0; i < 3; i++) {
    const v1 = vs[i];
    const v2 = vs[(i + 1) % 3];
    if (!v1 || !v2) continue;
    v1.removeIfNonNeighbor(v2);
    v2.removeIfNonNeighbor(v1);
  }
}

function minimumCostEdge(vertices, skip) {
  return vertices.slice(skip).reduce((least, current) => 
    current.collapseCost < least.collapseCost ? current : least
  );
}

function getPointInBetweenByPerc(pointA, pointB, percentage) {
  const dir = pointB.clone().sub(pointA);
  const len = dir.length();
  dir.normalize().multiplyScalar(len * percentage);
  return pointA.clone().add(dir);
}

function getUVsOnVertex(face, vertex) {
  return face.faceVertexUvs[getVertexIndexOnFace(face, vertex)];
}

function getVertexIndexOnFace(face, vertex) {
  const index = [face.v1, face.v2, face.v3].indexOf(vertex);
  if (index === -1) {
    throw new Error("Vertex not found");
  }
  return index;
}
