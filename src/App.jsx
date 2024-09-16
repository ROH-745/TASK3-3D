// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import "./App.css";
// // import myImg from '\vite.svg'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faEyeSlash, faEye, faSearch } from '@fortawesome/free-solid-svg-icons';


// function FBXViewer() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(
//     new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     )
//   );

  

//   const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );

//   const [isVisible, setIsVisible] = useState(true);  // State to control visibility

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.setClearColor(0xd3d3d3); // Light grey background color
//     rendererRef.current.gammaOutput = true; // Ensure correct color management
//     rendererRef.current.gammaFactor = 2.2; // Good default gamma factor
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     // Add lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);

//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     controlsRef.current.enableDamping = true;
//     controlsRef.current.dampingFactor = 0.1;

//     animate();

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//     };
//   }, []);

//   const loadModels = (files) => {
//     const loader = new FBXLoader();
//     let loadedCount = 0;
//     const totalFiles = files.length;
//     const objects = [];

//     Array.from(files).forEach((file) => {
//       loader.load(
//         URL.createObjectURL(file),
//         (object) => {
//           // Adjust materials to ensure they react to light
//           object.traverse((child) => {
//             if (child.isMesh && child.material) {
//               child.material = new THREE.MeshStandardMaterial({
//                 color: child.material.color,
//                 map: child.material.map, // Keep the texture if any
//               });
//             }
//           });

//           objects.push(object);
//           const boundingBox = new THREE.Box3().setFromObject(object);
//           cumulativeBoundingBox.current.union(boundingBox);
//           loadedCount++;

//           if (loadedCount === totalFiles) {
//             // All files have been loaded, add them to the scene
//             objects.forEach((obj) => sceneRef.current.add(obj));
//             adjustCamera(); // Adjust the camera once after all models have been loaded
//           }
//         },
//         undefined,
//         (error) => {
//           console.error("Error loading model:", error);
//         }
//       );
//     });
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5; // Adjust multiplier to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const onFileChange = (event) => {
//     // Reset cumulative bounding box for new set of files
//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );
//     loadModels(event.target.files);
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {  // Only update controls and render if visible
//         controlsRef.current.update();
//         rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
// };

//   // const toggleVisibility = () => {
//   //   setIsVisible(!isVisible);  // Toggle the visibility state
//   //   sceneRef.current.traverse(function (object) {  // Apply visibility change to all objects in the scene
//   //       if (object instanceof THREE.Mesh) {
//   //           object.visible = !isVisible;
//   //       }
//   //   });
//   // };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//         if (object instanceof THREE.Mesh) {
//             object.visible = visible;
//         }
//     });
// };
  

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;  // Adjust to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
// };



//   return (
//     <div className="main">
//     <div className="canvas-container">
//         <input
//             className="button"
//             type="file"
//             multiple
//             onChange={onFileChange}
//             accept=".fbx"
//         />
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//     </div>

//     <div className="button-container">
//         <button className="custom-button hide-show" onClick={() => toggleVisibility(true)}>
//           <FontAwesomeIcon icon={faEye}  />
//           </button>
//           <button className="custom-button"   onClick={() => toggleVisibility(false)}>
//           <FontAwesomeIcon icon={faEyeSlash} />
//           </button>
       
          
          
            
        
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//         <FontAwesomeIcon icon={faSearch}  />
          
//         </button>
//     </div>
// </div>

//   );
// }

// export default FBXViewer;






// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import "./App.css";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faEyeSlash, faEye, faSearch } from '@fortawesome/free-solid-svg-icons';

// function FBXViewer() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(
//     new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     )
//   );

//   const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );

//   const [isVisible, setIsVisible] = useState(true);
//   const [fileSizes, setFileSizes] = useState([]);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.setClearColor(0xd3d3d3); // Light grey background color
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding; // Use sRGB encoding for correct color management
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     // Add lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);

//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     controlsRef.current.enableDamping = true;
//     controlsRef.current.dampingFactor = 0.1;

//     animate();

//     const handleResize = () => {
//       const width = window.innerWidth;
//       const height = window.innerHeight;
//       rendererRef.current.setSize(width, height);
//       cameraRef.current.aspect = width / height;
//       cameraRef.current.updateProjectionMatrix();
//     };

//     window.addEventListener('resize', handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener('resize', handleResize);
//     };
//   }, []);

//   const loadModels = async (files) => {
//     const loader = new FBXLoader();
//     let loadedCount = 0;
//     const totalFiles = files.length;
//     const objects = [];
//     const newFileSizes = [];

//     // Reset cumulative bounding box for new set of files
//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );

//     for (const file of files) {
//       try {
//         const fbxObject = await new Promise((resolve, reject) => {
//           loader.load(
//             URL.createObjectURL(file),
//             (object) => resolve(object),
//             undefined,
//             (error) => reject(error)
//           );
//         });

//         // Convert FBX to glTF
//         const gltfData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(fbxObject, (result) => resolve(result), { binary: true }, (error) => reject(error));
//         });

//         // Save glTF file
//         const gltfBlob = new Blob([gltfData], { type: 'application/octet-stream' });
//         const gltfUrl = URL.createObjectURL(gltfBlob);
//         const link = document.createElement('a');
//         link.href = gltfUrl;
//         link.download = file.name.replace('.fbx', '.glb');
//         link.click();
//         URL.revokeObjectURL(gltfUrl);

//         // Load converted glTF
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(gltfData, '', (gltf) => resolve(gltf.scene), reject);
//         });

//         // Adjust materials
//         gltfObject.traverse((child) => {
//           if (child.isMesh && child.material) {
//             child.material = new THREE.MeshStandardMaterial({
//               color: child.material.color,
//               map: child.material.map,
//             });
//           }
//         });

//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);
        
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           gltfSize: gltfBlob.size
//         });

//         loadedCount++;
//         if (loadedCount === totalFiles) {
//           objects.forEach((obj) => sceneRef.current.add(obj));
//           adjustCamera();
//           setFileSizes(newFileSizes);
//         }
//       } catch (error) {
//         console.error("Error processing model:", error);
//       }
//     }
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5; // Adjust multiplier to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const onFileChange = (event) => {
//     loadModels(event.target.files);
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {  // Only update controls and render if visible
//         controlsRef.current.update();
//         rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//         if (object instanceof THREE.Mesh) {
//             object.visible = visible;
//         }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;  // Adjust to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   return (
//     <div className="main">
//       <div className="canvas-container">
//         <input
//           className="button"
//           type="file"
//           multiple
//           onChange={onFileChange}
//           accept=".fbx"
//         />
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//       </div>

//       <div className="button-container">
//         <button className="custom-button hide-show" onClick={() => toggleVisibility(true)}>
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button className="custom-button" onClick={() => toggleVisibility(false)}>
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//       </div>

//       <div className="file-sizes">
//         {fileSizes.map((file, index) => (
//           <div key={index}>
//             <p>{file.name}</p>
//             <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>glTF size: {(file.gltfSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;



// REMOVED TEXTURES,MATERIALS

// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import "./App.css";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faEyeSlash, faEye, faSearch } from '@fortawesome/free-solid-svg-icons';

// function FBXViewer() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(
//     new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     )
//   );

//   const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );

//   const [isVisible, setIsVisible] = useState(true);
//   const [fileSizes, setFileSizes] = useState([]);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.setClearColor(0xd3d3d3); // Light grey background color
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding; // Use sRGB encoding for correct color management
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     // Add lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);

//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     controlsRef.current.enableDamping = true;
//     controlsRef.current.dampingFactor = 0.1;

//     animate();

//     const handleResize = () => {
//       const width = window.innerWidth;
//       const height = window.innerHeight;
//       rendererRef.current.setSize(width, height);
//       cameraRef.current.aspect = width / height;
//       cameraRef.current.updateProjectionMatrix();
//     };

//     window.addEventListener('resize', handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener('resize', handleResize);
//     };
//   }, []);

//   // const loadModels = async (files) => {
//   //   const loader = new FBXLoader();
//   //   let loadedCount = 0;
//   //   const totalFiles = files.length;
//   //   const objects = [];
//   //   const newFileSizes = [];

//   //   // Reset cumulative bounding box for new set of files
//   //   cumulativeBoundingBox.current = new THREE.Box3(
//   //     new THREE.Vector3(Infinity, Infinity, Infinity),
//   //     new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//   //   );

//   //   for (const file of files) {
//   //     try {
//   //       const fbxObject = await new Promise((resolve, reject) => {
//   //         loader.load(
//   //           URL.createObjectURL(file),
//   //           (object) => resolve(object),
//   //           undefined,
//   //           (error) => reject(error)
//   //         );
//   //       });

//   //       // Convert FBX to glTF
//   //       const gltfData = await new Promise((resolve, reject) => {
//   //         const exporter = new GLTFExporter();
//   //         exporter.parse(fbxObject, (result) => resolve(result), { binary: true }, (error) => reject(error));
//   //       });

//   //       // Create Blob and calculate size
//   //       const gltfBlob = new Blob([gltfData], { type: 'application/octet-stream' });
//   //       const gltfSize = gltfBlob.size;

//   //       // Save glTF file
//   //       const gltfUrl = URL.createObjectURL(gltfBlob);
//   //       const link = document.createElement('a');
//   //       link.href = gltfUrl;
//   //       link.download = file.name.replace('.fbx', '.glb');
//   //       link.click();
//   //       URL.revokeObjectURL(gltfUrl);

//   //       // Load converted glTF
//   //       const gltfLoader = new GLTFLoader();
//   //       const gltfObject = await new Promise((resolve, reject) => {
//   //         gltfLoader.parse(gltfData, '', (gltf) => resolve(gltf.scene), reject);
//   //       });

//   //       // Adjust materials
//   //       gltfObject.traverse((child) => {
//   //         if (child.isMesh && child.material) {
//   //           child.material = new THREE.MeshStandardMaterial({
//   //             color: child.material.color,
//   //             map: child.material.map,
//   //           });
//   //         }
//   //       });

//   //       objects.push(gltfObject);
//   //       const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//   //       cumulativeBoundingBox.current.union(boundingBox);
        
//   //       newFileSizes.push({
//   //         name: file.name,
//   //         fbxSize: file.size,
//   //         gltfSize: gltfSize  // Use the calculated gltfSize here
//   //       });

//   //       loadedCount++;
//   //       if (loadedCount === totalFiles) {
//   //         objects.forEach((obj) => sceneRef.current.add(obj));
//   //         adjustCamera();
//   //         setFileSizes(newFileSizes);
//   //       }
//   //     } catch (error) {
//   //       console.error("Error processing model:", error);
//   //     }
//   //   }
//   // };

//   const loadModels = async (files) => {
//     const loader = new FBXLoader();
//     let loadedCount = 0;
//     const totalFiles = files.length;
//     const objects = [];
//     const newFileSizes = [];
  
//     // Reset cumulative bounding box for new set of files
//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );
  
//     for (const file of files) {
//       try {
//         const fbxObject = await new Promise((resolve, reject) => {
//           loader.load(
//             URL.createObjectURL(file),
//             (object) => resolve(object),
//             undefined,
//             (error) => reject(error)
//           );
//         });
  
//         // Optimize the FBX object
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             // Remove textures
//             if (child.material) {
//               if (Array.isArray(child.material)) {
//                 child.material.forEach(mat => {
//                   mat.map = null;
//                   mat.normalMap = null;
//                   mat.specularMap = null;
//                   mat.alphaMap = null;
//                 });
//               } else {
//                 child.material.map = null;
//                 child.material.normalMap = null;
//                 child.material.specularMap = null;
//                 child.material.alphaMap = null;
//               }
//             }
            
//             // Simplify material to a basic material
//             child.material = new THREE.MeshBasicMaterial({
//               color: child.material.color || 0xcccccc,
//               wireframe: false
//             });
  
//             // Optionally, you can also remove vertex colors if present
//             if (child.geometry.attributes.color) {
//               delete child.geometry.attributes.color;
//             }
//           }
//         });
  
//         // Convert optimized FBX to glTF
//         const gltfData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(fbxObject, (result) => resolve(result), { binary: true }, (error) => reject(error));
//         });
  
//         // Create Blob and calculate size
//         const gltfBlob = new Blob([gltfData], { type: 'application/octet-stream' });
//         const gltfSize = gltfBlob.size;
  
//         // Save glTF file
//         const gltfUrl = URL.createObjectURL(gltfBlob);
//         const link = document.createElement('a');
//         link.href = gltfUrl;
//         link.download = file.name.replace('.fbx', '_optimized.glb');
//         link.click();
//         URL.revokeObjectURL(gltfUrl);
  
//         // Load converted glTF
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(gltfData, '', (gltf) => resolve(gltf.scene), reject);
//         });
  
//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);
        
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           gltfSize: gltfSize
//         });
  
//         loadedCount++;
//         if (loadedCount === totalFiles) {
//           objects.forEach((obj) => sceneRef.current.add(obj));
//           adjustCamera();
//           setFileSizes(newFileSizes);
//         }
//       } catch (error) {
//         console.error("Error processing model:", error);
//       }
//     }
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5; // Adjust multiplier to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const onFileChange = (event) => {
//     loadModels(event.target.files);
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {  // Only update controls and render if visible
//         controlsRef.current.update();
//         rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//         if (object instanceof THREE.Mesh) {
//             object.visible = visible;
//         }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;  // Adjust to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   return (
//     <div className="main">
//       <div className="canvas-container">
//         <input
//           className="button"
//           type="file"
//           multiple
//           onChange={onFileChange}
//           accept=".fbx"
//         />
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//       </div>

//       <div className="button-container">
//         <button className="custom-button hide-show" onClick={() => toggleVisibility(true)}>
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button className="custom-button" onClick={() => toggleVisibility(false)}>
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//       </div>

//       <div className="file-sizes">
//         {fileSizes.map((file, index) => (
//           <div key={index}>
//             <p>{file.name}</p>
//             <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>glTF size: {(file.gltfSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;





// SAVING SINGLE FILES

// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import "./App.css";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faEyeSlash, faEye, faSearch } from '@fortawesome/free-solid-svg-icons';

// function FBXViewer() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(
//     new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     )
//   );

//   const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );

//   const [isVisible, setIsVisible] = useState(true);
//   const [fileSizes, setFileSizes] = useState([]);
//   const [saveDirectory, setSaveDirectory] = useState(null);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [convertedModels, setConvertedModels] = useState([]);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.setClearColor(0xd3d3d3); // Light grey background color
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding; // Use sRGB encoding for correct color management
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     // Add lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);

//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     controlsRef.current.enableDamping = true;
//     controlsRef.current.dampingFactor = 0.1;

//     animate();

//     const handleResize = () => {
//       const width = window.innerWidth;
//       const height = window.innerHeight;
//       rendererRef.current.setSize(width, height);
//       cameraRef.current.aspect = width / height;
//       cameraRef.current.updateProjectionMatrix();
//     };

//     window.addEventListener('resize', handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener('resize', handleResize);
//     };
//   }, []);

//   const selectSaveDirectory = async () => {
//     try {
//       const dirHandle = await window.showDirectoryPicker();
//       setSaveDirectory(dirHandle);
//     } catch (err) {
//       console.error("Error selecting directory:", err);
//     }
//   };

//   const onFileChange = (event) => {
//     setSelectedFiles(Array.from(event.target.files));
//   };

//   const processModels = async () => {
//     const loader = new FBXLoader();
//     const objects = [];
//     const newFileSizes = [];
//     const newConvertedModels = [];

//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );

//     for (const file of selectedFiles) {
//       try {
//         const fbxObject = await new Promise((resolve, reject) => {
//           loader.load(
//             URL.createObjectURL(file),
//             (object) => resolve(object),
//             undefined,
//             (error) => reject(error)
//           );
//         });

//         // Optimize the FBX object
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             // Remove textures
//             if (child.material) {
//               if (Array.isArray(child.material)) {
//                 child.material.forEach(mat => {
//                   mat.map = null;
//                   mat.normalMap = null;
//                   mat.specularMap = null;
//                   mat.alphaMap = null;
//                 });
//               } else {
//                 child.material.map = null;
//                 child.material.normalMap = null;
//                 child.material.specularMap = null;
//                 child.material.alphaMap = null;
//               }
//             }
            
//             // Simplify material to a basic material
//             child.material = new THREE.MeshBasicMaterial({
//               color: child.material.color || 0xcccccc,
//               wireframe: false
//             });

//             // Optionally, you can also remove vertex colors if present
//             if (child.geometry.attributes.color) {
//               delete child.geometry.attributes.color;
//             }
//           }
//         });

//         // Convert optimized FBX to glTF
//         const gltfData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(fbxObject, (result) => resolve(result), { binary: true }, (error) => reject(error));
//         });

//         // Load converted glTF for rendering
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(gltfData, '', (gltf) => resolve(gltf.scene), reject);
//         });

//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);
        
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           gltfSize: gltfData.byteLength
//         });

//         newConvertedModels.push({
//           fileName: file.name.replace('.fbx', '_optimized.glb'),
//           data: gltfData
//         });
//       } catch (error) {
//         console.error("Error processing model:", error);
//       }
//     }

//     objects.forEach((obj) => sceneRef.current.add(obj));
//     adjustCamera();
//     setFileSizes(newFileSizes);
//     setConvertedModels(newConvertedModels);
//   };

//   const saveConvertedModels = async () => {
//     if (!saveDirectory) {
//       alert("Please select a save directory first.");
//       return;
//     }

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, { create: true });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//       } catch (error) {
//         console.error("Error saving file:", error);
//       }
//     }

//     alert("All files have been saved successfully!");
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5; // Adjust multiplier to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {  // Only update controls and render if visible
//         controlsRef.current.update();
//         rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//         if (object instanceof THREE.Mesh) {
//             object.visible = visible;
//         }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;  // Adjust to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   return (
//     <div className="main">
//       <div className="canvas-container">
//         <button onClick={selectSaveDirectory}>Select Save Directory</button>
//         <input
//           className="button"
//           type="file"
//           multiple
//           onChange={onFileChange}
//           accept=".fbx"
//         />
//         <button onClick={processModels}>Process Models</button>
//         <button onClick={saveConvertedModels}>Save Converted Models</button>
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//       </div>

//       <div className="button-container">
//         <button className="custom-button hide-show" onClick={() => toggleVisibility(true)}>
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button className="custom-button" onClick={() => toggleVisibility(false)}>
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//       </div>

//       <div className="file-sizes">
//         {fileSizes.map((file, index) => (
//           <div key={index}>
//             <p>{file.name}</p>
//             <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>glTF size: {(file.gltfSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;




