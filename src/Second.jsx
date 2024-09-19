// GETTING AS GLTF FORMAT(MAIN)

// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import "./App.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";

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
//   const [backgroundColor, setBackgroundColor] = useState(0x000000);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     // rendererRef.current.setClearColor(0xd3d3d3); // Light grey background color
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

//     window.addEventListener("resize", handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     // ...
//     rendererRef.current.setClearColor(backgroundColor);
//     // ...
//   }, [backgroundColor]);

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

//         // Remove colors, textures, and materials
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             // Remove materials and textures
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });

//             // Remove vertex colors if present
//             if (child.geometry.attributes.color) {
//               child.geometry.deleteAttribute("color");
//             }

//             // Remove UV coordinates
//             if (child.geometry.attributes.uv) {
//               child.geometry.deleteAttribute("uv");
//             }

//             // Remove normal data to further reduce size
//             if (child.geometry.attributes.normal) {
//               child.geometry.deleteAttribute("normal");
//             }
//           }
//         });

//         // Convert FBX to GLTF
//         const gltfData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(
//             fbxObject,
//             (result) => {
//               const output = JSON.stringify(result);
//               resolve(output);
//             },
//             {
//               binary: false, // Use JSON format for GLTF
//               includeCustomExtensions: false,
//               forceIndices: true,
//               truncateDrawRange: true,
//             },
//             (error) => reject(error)
//           );
//         });

//         // Load converted GLTF for rendering
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(gltfData, "", (gltf) => resolve(gltf.scene), reject);
//         });

//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);

//         const gltfBlob = new Blob([gltfData], { type: "application/json" });

//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           gltfSize: gltfBlob.size,
//         });

//         newConvertedModels.push({
//           fileName: file.name.replace(".fbx", ".gltf"),
//           data: gltfBlob,
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

//     if (convertedModels.length === 0) {
//       alert(
//         "No models have been processed yet. Please process models before saving."
//       );
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, {
//           create: true,
//         });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(
//       `Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`
//     );
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
//     if (isVisible) {
//       // Only update controls and render if visible
//       controlsRef.current.update();
//       rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//       if (object instanceof THREE.Mesh) {
//         object.visible = visible;
//       }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5; // Adjust to ensure all models are visible

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
//         <button
//           className="custom-button hide-show"
//           onClick={() => toggleVisibility(true)}
//         >
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button
//           className="custom-button"
//           onClick={() => toggleVisibility(false)}
//         >
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//         <input
//           type="color"
//           value={"#" + backgroundColor.toString(16).padStart(6, "0")}
//           onChange={(e) =>
//             setBackgroundColor(parseInt(e.target.value.slice(1), 16))
//           }
//         />
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



// COVERTED TO GLTF ZIP
// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import "./App.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";
// import pako from 'pako'; // Import pako for GZIP compression

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
//   const [backgroundColor, setBackgroundColor] = useState(0x000000);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
//     mountRef.current.appendChild(rendererRef.current.domElement);

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

//     window.addEventListener("resize", handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     rendererRef.current.setClearColor(backgroundColor);
//   }, [backgroundColor]);

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

//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
//             if (child.geometry.attributes.color) {
//               child.geometry.deleteAttribute("color");
//             }
//             if (child.geometry.attributes.uv) {
//               child.geometry.deleteAttribute("uv");
//             }
//             if (child.geometry.attributes.normal) {
//               child.geometry.deleteAttribute("normal");
//             }
//           }
//         });

//         // Convert FBX to GLTF
//         const gltfData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(
//             fbxObject,
//             (result) => {
//               const output = JSON.stringify(result);
//               resolve(output);
//             },
//             {
//               binary: false,
//               includeCustomExtensions: false,
//               forceIndices: true,
//               truncateDrawRange: true,
//             },
//             (error) => reject(error)
//           );
//         });

//         // Compress GLTF data using GZIP
//         const compressedData = pako.gzip(gltfData);

//         // Load converted GLTF for rendering
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(gltfData, "", (gltf) => resolve(gltf.scene), reject);
//         });

//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);

//         const gltfBlob = new Blob([gltfData], { type: "application/json" });
//         const gzipBlob = new Blob([compressedData], { type: "application/gzip" });

//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           gltfSize: gltfBlob.size,
//           gzipSize: gzipBlob.size,
//         });

//         newConvertedModels.push({
//           fileName: file.name.replace(".fbx", ".gltf.gz"),
//           data: gzipBlob,
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

//     if (convertedModels.length === 0) {
//       alert(
//         "No models have been processed yet. Please process models before saving."
//       );
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, {
//           create: true,
//         });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(
//       `Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`
//     );
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {
//       controlsRef.current.update();
//       rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//       if (object instanceof THREE.Mesh) {
//         object.visible = visible;
//       }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

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
//         <button
//           className="custom-button hide-show"
//           onClick={() => toggleVisibility(true)}
//         >
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button
//           className="custom-button"
//           onClick={() => toggleVisibility(false)}
//         >
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//         <input
//           type="color"
//           value={"#" + backgroundColor.toString(16).padStart(6, "0")}
//           onChange={(e) =>
//             setBackgroundColor(parseInt(e.target.value.slice(1), 16))
//           }
//         />
//       </div>

//       <div className="file-sizes">
//         {fileSizes.map((file, index) => (
//           <div key={index}>
//             <p>{file.name}</p>
//             <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>GLTF size: {(file.gltfSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>GZIP size: {(file.gzipSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;





// GETTING AS A GLB FORMAT(MAIN)

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
//   const [optimizeModel, setOptimizeModel] = useState(true);
//   const [processingStatus, setProcessingStatus] = useState('');
//   const [failedFiles, setFailedFiles] = useState([]);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.setClearColor(0x000000); // Black background color
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
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
//     const newFailedFiles = [];

//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );

//     const batchSize = 10;
//     for (let i = 0; i < selectedFiles.length; i += batchSize) {
//       const batch = selectedFiles.slice(i, i + batchSize);
//       setProcessingStatus(`Processing files ${i + 1} to ${Math.min(i + batchSize, selectedFiles.length)} of ${selectedFiles.length}`);

//       await Promise.all(batch.map(async (file) => {
//         try {
//           const fbxObject = await new Promise((resolve, reject) => {
//             loader.load(
//               URL.createObjectURL(file),
//               (object) => resolve(object),
//               (xhr) => {
//                 console.log(`${file.name}: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
//               },
//               (error) => {
//                 console.error(`Error loading ${file.name}:`, error);
//                 reject(error);
//               }
//             );
//           });

//           if (optimizeModel) {
//             try {
//               fbxObject.traverse((child) => {
//                 if (child.isMesh) {
//                   child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });

//                   if (child.geometry.attributes.uv) {
//                     delete child.geometry.attributes.uv;
//                   }

//                   if (child.geometry.attributes.normal) {
//                     delete child.geometry.attributes.normal;
//                   }

//                   if (child.geometry.attributes.position.count > 1000) {
//                     const decimatedGeometry = child.geometry.toNonIndexed();
//                     const step = Math.ceil(decimatedGeometry.attributes.position.count / 1000);
//                     for (let i = decimatedGeometry.attributes.position.count - 1; i >= 0; i -= step) {
//                       decimatedGeometry.attributes.position.array.splice(i * 3, 3);
//                     }
//                     decimatedGeometry.attributes.position.count = decimatedGeometry.attributes.position.array.length / 3;
//                     child.geometry = decimatedGeometry;
//                   }
//                 }
//               });
//             } catch (optimizeError) {
//               console.error(`Error optimizing ${file.name}:`, optimizeError);
//             }
//           }

//           const glbData = await new Promise((resolve, reject) => {
//             const exporter = new GLTFExporter();
//             exporter.parse(fbxObject, (result) => {
//               resolve(result);
//             }, {
//               binary: true,
//               forceIndices: true,
//               truncateDrawRange: true
//             }, (error) => {
//               console.error(`Error exporting ${file.name} to GLB:`, error);
//               reject(error);
//             });
//           });

//           const gltfLoader = new GLTFLoader();
//           const glbObject = await new Promise((resolve, reject) => {
//             gltfLoader.parse(glbData, '', (gltf) => resolve(gltf.scene), reject);
//           });

//           objects.push(glbObject);
//           const boundingBox = new THREE.Box3().setFromObject(glbObject);
//           cumulativeBoundingBox.current.union(boundingBox);

//           newFileSizes.push({
//             name: file.name,
//             fbxSize: file.size,
//             glbSize: glbData.byteLength
//           });

//           newConvertedModels.push({
//             fileName: file.name.replace('.fbx', '.glb'),
//             data: new Blob([glbData], { type: 'application/octet-stream' })
//           });

//           console.log(`Successfully processed ${file.name}`);
//         } catch (error) {
//           console.error(`Error processing file ${file.name}:`, error);
//           newFailedFiles.push({ name: file.name, error: error.message || 'Unknown error' });
//         }
//       }));
//     }

//     objects.forEach((obj) => sceneRef.current.add(obj));
//     adjustCamera();
//     setFileSizes(newFileSizes);
//     setConvertedModels(newConvertedModels);
//     setFailedFiles(newFailedFiles);
//     setProcessingStatus(`Processing complete. ${newConvertedModels.length} files converted. ${newFailedFiles.length} files failed.`);
//     if (newFailedFiles.length > 0) {
//       console.log("Failed files:", newFailedFiles);
//     }
//   };

//   const saveConvertedModels = async () => {
//     if (!saveDirectory) {
//       alert("Please select a save directory first.");
//       return;
//     }

//     if (convertedModels.length === 0) {
//       alert("No models have been processed yet. Please process models before saving.");
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, { create: true });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//         setProcessingStatus(`Saving file ${successCount + failCount} of ${convertedModels.length}`);
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     setProcessingStatus(`Saving complete. ${successCount} files saved successfully. ${failCount} files failed to save.`);
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
//         <label>
//           <input
//             type="checkbox"
//             checked={optimizeModel}
//             onChange={(e) => setOptimizeModel(e.target.checked)}
//           />
//           Optimize (Reduce file size)
//         </label>
//         <button onClick={processModels}>Process Models</button>
//         <button onClick={saveConvertedModels}>Save Converted Models</button>
//         <div>{processingStatus}</div>
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
//             <p>GLB size: {(file.glbSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>

//       {failedFiles.length > 0 && (
//         <div className="failed-files">
//           <h3>Failed Files:</h3>
//           <ul>
//             {failedFiles.map((file, index) => (
//               <li key={index}>{file.name}: {file.error}</li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
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
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";

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
//   const [backgroundColor, setBackgroundColor] = useState(0x000000);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     // rendererRef.current.setClearColor(0xd3d3d3); // Light grey background color
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

//     window.addEventListener("resize", handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     // ...
//     rendererRef.current.setClearColor(backgroundColor);
//     // ...
//   }, [backgroundColor]);

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

  
//   // const processModels = async () => {
//   //   const loader = new FBXLoader();
//   //   const objects = [];
//   //   const newFileSizes = [];
//   //   const newConvertedModels = [];

//   //   cumulativeBoundingBox.current = new THREE.Box3(
//   //     new THREE.Vector3(Infinity, Infinity, Infinity),
//   //     new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//   //   );

//   //   for (const file of selectedFiles) {
//   //     try {
//   //       const fbxObject = await new Promise((resolve, reject) => {
//   //         loader.load(
//   //           URL.createObjectURL(file),
//   //           (object) => resolve(object),
//   //           undefined,
//   //           (error) => reject(error)
//   //         );
//   //       });

//   //       // Remove colors, textures, and materials
//   //       fbxObject.traverse((child) => {
//   //         if (child.isMesh) {
//   //           // Remove materials and textures
//   //           child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });

//   //           // Remove vertex colors if present
//   //           if (child.geometry.attributes.color) {
//   //             child.geometry.deleteAttribute("color");
//   //           }

//   //           // Remove UV coordinates
//   //           if (child.geometry.attributes.uv) {
//   //             child.geometry.deleteAttribute("uv");
//   //           }

//   //           // Remove normal data to further reduce size
//   //           if (child.geometry.attributes.normal) {
//   //             child.geometry.deleteAttribute("normal");
//   //           }
//   //         }
//   //       });

//   //       // Convert FBX to GLTF
//   //       const gltfData = await new Promise((resolve, reject) => {
//   //         const exporter = new GLTFExporter();
//   //         exporter.parse(
//   //           fbxObject,
//   //           (result) => {
//   //             const output = JSON.stringify(result);
//   //             resolve(output);
//   //           },
//   //           {
//   //             binary: false, // Use JSON format for GLTF
//   //             includeCustomExtensions: false,
//   //             forceIndices: true,
//   //             truncateDrawRange: true,
//   //           },
//   //           (error) => reject(error)
//   //         );
//   //       });

//   //       // Load converted GLTF for rendering
//   //       const gltfLoader = new GLTFLoader();
//   //       const gltfObject = await new Promise((resolve, reject) => {
//   //         gltfLoader.parse(gltfData, "", (gltf) => resolve(gltf.scene), reject);
//   //       });

//   //       objects.push(gltfObject);
//   //       const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//   //       cumulativeBoundingBox.current.union(boundingBox);

//   //       const gltfBlob = new Blob([gltfData], { type: "application/json" });

//   //       newFileSizes.push({
//   //         name: file.name,
//   //         fbxSize: file.size,
//   //         gltfSize: gltfBlob.size,
//   //       });

//   //       newConvertedModels.push({
//   //         fileName: file.name.replace(".fbx", ".glb"),
//   //         data: gltfBlob,
//   //       });
//   //     } catch (error) {
//   //       console.error("Error processing model:", error);
//   //     }
//   //   }

//   //   objects.forEach((obj) => sceneRef.current.add(obj));
//   //   adjustCamera();
//   //   setFileSizes(newFileSizes);
//   //   setConvertedModels(newConvertedModels);
//   // };

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
  
//         // Remove colors, textures, and materials
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             // Remove materials and textures
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
  
//             // Remove vertex colors if present
//             if (child.geometry.attributes.color) {
//               child.geometry.deleteAttribute("color");
//             }
  
//             // Remove UV coordinates
//             if (child.geometry.attributes.uv) {
//               child.geometry.deleteAttribute("uv");
//             }
  
//             // Remove normal data to further reduce size
//             if (child.geometry.attributes.normal) {
//               child.geometry.deleteAttribute("normal");
//             }
//           }
//         });
  
//         // Convert FBX to GLB
//         const glbData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(
//             fbxObject,
//             (result) => {
//               if (result instanceof ArrayBuffer) {
//                 resolve(result); // GLB binary data
//               } else {
//                 const blob = new Blob([JSON.stringify(result)], {
//                   type: "application/json",
//                 });
//                 blob.arrayBuffer().then(resolve).catch(reject);
//               }
//             },
//             { binary: true }, // Set binary to true to get GLB format
//             (error) => reject(error)
//           );
//         });
  
//         // Load converted GLB for rendering
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(glbData, "", (gltf) => resolve(gltf.scene), reject);
//         });
  
//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);
  
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           glbSize: glbData.byteLength,
//         });
  
//         const blob = new Blob([glbData], { type: "application/octet-stream" });
//         newConvertedModels.push({
//           fileName: file.name.replace(".fbx", ".glb"),
//           data: blob,
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

//     if (convertedModels.length === 0) {
//       alert(
//         "No models have been processed yet. Please process models before saving."
//       );
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, {
//           create: true,
//         });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(
//       `Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`
//     );
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
//     if (isVisible) {
//       // Only update controls and render if visible
//       controlsRef.current.update();
//       rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//       if (object instanceof THREE.Mesh) {
//         object.visible = visible;
//       }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5; // Adjust to ensure all models are visible

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
//         <button
//           className="custom-button hide-show"
//           onClick={() => toggleVisibility(true)}
//         >
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button
//           className="custom-button"
//           onClick={() => toggleVisibility(false)}
//         >
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//         <input
//           type="color"
//           value={"#" + backgroundColor.toString(16).padStart(6, "0")}
//           onChange={(e) =>
//             setBackgroundColor(parseInt(e.target.value.slice(1), 16))
//           }
//         />
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


// GLB WITH GZIP

// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import pako from 'pako'; // Import pako for GZIP compression
// import "./App.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";

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
//   const [backgroundColor, setBackgroundColor] = useState(0x000000);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
//     mountRef.current.appendChild(rendererRef.current.domElement);

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

//     window.addEventListener("resize", handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     rendererRef.current.setClearColor(backgroundColor);
//   }, [backgroundColor]);

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
  
//         // Remove colors, textures, and materials
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
//             if (child.geometry.attributes.color) {
//               child.geometry.deleteAttribute("color");
//             }
//             if (child.geometry.attributes.uv) {
//               child.geometry.deleteAttribute("uv");
//             }
//             if (child.geometry.attributes.normal) {
//               child.geometry.deleteAttribute("normal");
//             }
//           }
//         });
  
//         // Convert FBX to GLB
//         const glbData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(
//             fbxObject,
//             (result) => {
//               if (result instanceof ArrayBuffer) {
//                 resolve(result); // GLB binary data
//               } else {
//                 const blob = new Blob([JSON.stringify(result)], {
//                   type: "application/json",
//                 });
//                 blob.arrayBuffer().then(resolve).catch(reject);
//               }
//             },
//             { binary: true }, // Set binary to true to get GLB format
//             (error) => reject(error)
//           );
//         });
  
//         // GZIP compression
//         const compressedData = pako.gzip(new Uint8Array(glbData));
  
//         // Load converted GLB for rendering
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(glbData, "", (gltf) => resolve(gltf.scene), reject);
//         });
  
//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);
  
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           glbSize: glbData.byteLength,
//           compressedSize: compressedData.byteLength,
//         });
  
//         const blob = new Blob([compressedData], { type: "application/octet-stream" });
//         newConvertedModels.push({
//           fileName: file.name.replace(".fbx", ".glb.gz"),
//           data: blob,
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

//     if (convertedModels.length === 0) {
//       alert(
//         "No models have been processed yet. Please process models before saving."
//       );
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, {
//           create: true,
//         });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(
//       `Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`
//     );
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {
//       controlsRef.current.update();
//       rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//       if (object instanceof THREE.Mesh) {
//         object.visible = visible;
//       }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

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
//         <button
//           className="custom-button hide-show"
//           onClick={() => toggleVisibility(true)}
//         >
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button
//           className="custom-button"
//           onClick={() => toggleVisibility(false)}
//         >
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//         <input
//           type="color"
//           value={"#" + backgroundColor.toString(16).padStart(6, "0")}
//           onChange={(e) =>
//             setBackgroundColor(parseInt(e.target.value.slice(1), 16))
//           }
//         />
//       </div>

//       <div className="file-sizes">
//         {fileSizes.map((file, index) => (
//           <div key={index}>
//             <p>{file.name}</p>
//             <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>GLB size: {(file.glbSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>Compressed size: {(file.compressedSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;



// GLB ZIP (WEBGL CONTEXT LOSS)
// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import pako from 'pako';
// import "./App.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";

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
//   const [backgroundColor, setBackgroundColor] = useState(0x000000);
//   const [processingStatus, setProcessingStatus] = useState('');

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
//     mountRef.current.appendChild(rendererRef.current.domElement);

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

//     window.addEventListener("resize", handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     rendererRef.current.setClearColor(backgroundColor);
//   }, [backgroundColor]);

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
  
//     setProcessingStatus('Starting file processing...');
  
//     for (let i = 0; i < selectedFiles.length; i++) {
//       const file = selectedFiles[i];
//       setProcessingStatus(`Processing file ${i + 1} of ${selectedFiles.length}: ${file.name}`);
      
//       try {
//         const fbxObject = await new Promise((resolve, reject) => {
//           loader.load(
//             URL.createObjectURL(file),
//             (object) => resolve(object),
//             undefined,
//             (error) => reject(error)
//           );
//         });
  
//         setProcessingStatus(`Optimizing model: ${file.name}`);
//         // Remove colors, textures, and materials
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
//             if (child.geometry.attributes.color) {
//               child.geometry.deleteAttribute("color");
//             }
//             if (child.geometry.attributes.uv) {
//               child.geometry.deleteAttribute("uv");
//             }
//             if (child.geometry.attributes.normal) {
//               child.geometry.deleteAttribute("normal");
//             }
//           }
//         });
  
//         setProcessingStatus(`Converting to GLB: ${file.name}`);
//         // Convert FBX to GLB
//         const glbData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(
//             fbxObject,
//             (result) => {
//               if (result instanceof ArrayBuffer) {
//                 resolve(result); // GLB binary data
//               } else {
//                 const blob = new Blob([JSON.stringify(result)], {
//                   type: "application/json",
//                 });
//                 blob.arrayBuffer().then(resolve).catch(reject);
//               }
//             },
//             { binary: true },
//             (error) => reject(error)
//           );
//         });
  
//         setProcessingStatus(`Compressing: ${file.name}`);
//         // GZIP compression
//         const compressedData = pako.gzip(new Uint8Array(glbData));
  
//         setProcessingStatus(`Preparing for rendering: ${file.name}`);
//         // Load converted GLB for rendering
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(glbData, "", (gltf) => resolve(gltf.scene), reject);
//         });
  
//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);
  
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           glbSize: glbData.byteLength,
//           compressedSize: compressedData.byteLength,
//         });
  
//         const blob = new Blob([compressedData], { type: "application/octet-stream" });
//         newConvertedModels.push({
//           fileName: file.name.replace(".fbx", ".glb.gz"),
//           data: blob,
//         });
//       } catch (error) {
//         console.error("Error processing model:", error);
//         setProcessingStatus(`Error processing ${file.name}: ${error.message}`);
//       }
//     }
  
//     objects.forEach((obj) => sceneRef.current.add(obj));
//     adjustCamera();
//     setFileSizes(newFileSizes);
//     setConvertedModels(newConvertedModels);
//     setProcessingStatus('Processing complete.');
//   };

//   const saveConvertedModels = async () => {
//     if (!saveDirectory) {
//       alert("Please select a save directory first.");
//       return;
//     }

//     if (convertedModels.length === 0) {
//       alert(
//         "No models have been processed yet. Please process models before saving."
//       );
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     setProcessingStatus('Starting to save files...');

//     for (let i = 0; i < convertedModels.length; i++) {
//       const model = convertedModels[i];
//       setProcessingStatus(`Saving file ${i + 1} of ${convertedModels.length}: ${model.fileName}`);
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, {
//           create: true,
//         });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     setProcessingStatus(`Saving complete. ${successCount} files saved successfully. ${failCount} files failed to save.`);
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {
//       controlsRef.current.update();
//       rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//       if (object instanceof THREE.Mesh) {
//         object.visible = visible;
//       }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

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
//         <div>{processingStatus}</div>
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//       </div>

//       <div className="button-container">
//         <button
//           className="custom-button hide-show"
//           onClick={() => toggleVisibility(true)}
//         >
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button
//           className="custom-button"
//           onClick={() => toggleVisibility(false)}
//         >
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//         <input
//           type="color"
//           value={"#" + backgroundColor.toString(16).padStart(6, "0")}
//           onChange={(e) =>
//             setBackgroundColor(parseInt(e.target.value.slice(1), 16))
//           }
//         />
//       </div>

//       <div className="file-sizes">
//         {fileSizes.map((file, index) => (
//           <div key={index}>
//             <p>{file.name}</p>
//             <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>GLB size: {(file.glbSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>Compressed size: {(file.compressedSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;






// FBX TO JSON
// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
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
//     rendererRef.current.setClearColor(0x000000); // Black background color
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
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
  
//         // Remove colors, textures, and materials (if you want to optimize)
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
            
//             if (child.geometry.attributes.color) {
//               child.geometry.deleteAttribute('color');
//             }
  
//             if (child.geometry.attributes.uv) {
//               child.geometry.deleteAttribute('uv');
//             }
  
//             if (child.geometry.attributes.normal) {
//               child.geometry.deleteAttribute('normal');
//             }
//           }
//         });
  
//         // Convert to Three.js JSON
//         const jsonData = fbxObject.toJSON();
//         const jsonString = JSON.stringify(jsonData);
//         const threeJsonBlob = new Blob([jsonString], { type: 'application/json' });
  
//         objects.push(fbxObject);
//         const boundingBox = new THREE.Box3().setFromObject(fbxObject);
//         cumulativeBoundingBox.current.union(boundingBox);
        
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           threeJsonSize: threeJsonBlob.size
//         });
  
//         newConvertedModels.push({
//           fileName: file.name.replace('.fbx', '.json'),
//           data: threeJsonBlob
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

//     if (convertedModels.length === 0) {
//       alert("No models have been processed yet. Please process models before saving.");
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, { create: true });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(`Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`);
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
//             <p>Three.js JSON size: {(file.threeJsonSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;





// converted to json zip

// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';
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
//     rendererRef.current.setClearColor(0x000000); // Black background color
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
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
//     const simplifyModifier = new SimplifyModifier();
  
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
  
//         // Aggressively optimize the model
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             // Simplify geometry
//             const count = Math.floor(child.geometry.attributes.position.count * 0.25); // Reduce vertices by 75%
//             child.geometry = simplifyModifier.modify(child.geometry, count);
  
//             // Remove all materials and use a basic one
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
            
//             // Remove all unnecessary attributes
//             ['color', 'uv', 'normal', 'tangent', 'bitangent'].forEach(attr => {
//               if (child.geometry.attributes[attr]) child.geometry.deleteAttribute(attr);
//             });
  
//             // Optimize indices
//             if (child.geometry.index) {
//               child.geometry.setIndex(Array.from(child.geometry.index.array));
//             }
  
//             // Remove any bones or weights for skinning
//             delete child.geometry.attributes.skinWeight;
//             delete child.geometry.attributes.skinIndex;
  
//             // Remove any morph targets
//             child.geometry.morphAttributes = {};
//             child.geometry.morphTargetsRelative = false;
//           }
//         });
  
//         // Remove any animations
//         fbxObject.animations = [];
  
//         // Convert to Three.js JSON
//         const jsonData = fbxObject.toJSON();
        
//         // Further optimize the JSON
//         delete jsonData.materials;
//         delete jsonData.textures;
//         delete jsonData.images;
//         if (jsonData.object) {
//           delete jsonData.object.userData;
//           if (jsonData.object.children) {
//             jsonData.object.children = jsonData.object.children.map(child => {
//               delete child.userData;
//               return child;
//             });
//           }
//         }
  
//         const jsonString = JSON.stringify(jsonData);
        
//         // Compress the JSON string
//         const compressedJsonString = await compressString(jsonString);
//         const threeJsonBlob = new Blob([compressedJsonString], { type: 'application/json' });
  
//         objects.push(fbxObject);
//         const boundingBox = new THREE.Box3().setFromObject(fbxObject);
//         cumulativeBoundingBox.current.union(boundingBox);
        
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           threeJsonSize: threeJsonBlob.size
//         });
  
//         newConvertedModels.push({
//           fileName: file.name.replace('.fbx', '.json.gz'),
//           data: threeJsonBlob
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
  
//   // Function to compress string using pako
 
  
  
//   const compressString = async (string) => {
//     const pako = await import('pako');
//     return pako.gzip(string);
//   };

//   const saveConvertedModels = async () => {
//     if (!saveDirectory) {
//       alert("Please select a save directory first.");
//       return;
//     }

//     if (convertedModels.length === 0) {
//       alert("No models have been processed yet. Please process models before saving.");
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, { create: true });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(`Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`);
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
//             <p>Optimized JSON size: {(file.threeJsonSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;





// ADDED DRACO AND CONVERT TO GLTF


// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import "./App.css";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";

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
//   const dracoLoaderRef = useRef(new DRACOLoader());

//   const [isVisible, setIsVisible] = useState(true);
//   const [fileSizes, setFileSizes] = useState([]);
//   const [saveDirectory, setSaveDirectory] = useState(null);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [convertedModels, setConvertedModels] = useState([]);
//   const [backgroundColor, setBackgroundColor] = useState(0x000000);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     // Set up Draco loader
//     dracoLoaderRef.current.setDecoderPath('/draco/');

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

//     window.addEventListener("resize", handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     rendererRef.current.setClearColor(backgroundColor);
//   }, [backgroundColor]);

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

//   // const processModels = async () => {
//   //   const loader = new FBXLoader();
//   //   const objects = [];
//   //   const newFileSizes = [];
//   //   const newConvertedModels = [];

//   //   // Set up GLTFLoader with Draco
//   //   const gltfLoader = new GLTFLoader();
//   //   gltfLoader.setDRACOLoader(dracoLoaderRef.current);

//   //   cumulativeBoundingBox.current = new THREE.Box3(
//   //     new THREE.Vector3(Infinity, Infinity, Infinity),
//   //     new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//   //   );

//   //   for (const file of selectedFiles) {
//   //     try {
//   //       const fbxObject = await new Promise((resolve, reject) => {
//   //         loader.load(
//   //           URL.createObjectURL(file),
//   //           (object) => resolve(object),
//   //           undefined,
//   //           (error) => reject(error)
//   //         );
//   //       });

//   //       // Optimize the model
//   //       fbxObject.traverse((child) => {
//   //         if (child.isMesh) {
//   //           // Simplify material
//   //           child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });

//   //           // Remove unnecessary attributes
//   //           ['color', 'uv', 'normal', 'tangent', 'bitangent'].forEach(attr => {
//   //             if (child.geometry.attributes[attr]) child.geometry.deleteAttribute(attr);
//   //           });
//   //         }
//   //       });

//   //       // Convert to glTF (GLB format) with Draco compression
//   //       const glbBuffer = await new Promise((resolve, reject) => {
//   //         const exporter = new GLTFExporter();
//   //         exporter.parse(fbxObject, (result) => {
//   //           resolve(result);
//   //         }, {
//   //           binary: true,
//   //           forceIndices: true,
//   //           truncateDrawRange: true,
//   //           embedImages: true,
//   //           includeCustomExtensions: true,
//   //           dracoOptions: {
//   //             compression: true,
//   //             compressionLevel: 7,
//   //             quantizePosition: 11,
//   //             quantizeNormal: 8,
//   //             quantizeColor: 8,
//   //             quantizeGeneric: 8
//   //           }
//   //         }, (error) => reject(error));
//   //       });

//   //       // Load converted GLB for rendering
//   //       const gltfObject = await new Promise((resolve, reject) => {
//   //         gltfLoader.parse(glbBuffer, "", (gltf) => resolve(gltf.scene), reject);
//   //       });

//   //       objects.push(gltfObject);
//   //       const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//   //       cumulativeBoundingBox.current.union(boundingBox);

//   //       const glbBlob = new Blob([glbBuffer], { type: 'application/octet-stream' });

//   //       newFileSizes.push({
//   //         name: file.name,
//   //         fbxSize: file.size,
//   //         glbSize: glbBlob.size,
//   //       });

//   //       newConvertedModels.push({
//   //         fileName: file.name.replace('.fbx', '.glb'),
//   //         data: glbBlob,
//   //       });
//   //     } catch (error) {
//   //       console.error("Error processing model:", error);
//   //     }
//   //   }

//   //   objects.forEach((obj) => sceneRef.current.add(obj));
//   //   adjustCamera();
//   //   setFileSizes(newFileSizes);
//   //   setConvertedModels(newConvertedModels);
//   // };

//   const processModels = async () => {
//     const loader = new FBXLoader();
//     const objects = [];
//     const newFileSizes = [];
//     const newConvertedModels = [];
  
//     // Set up GLTFLoader with Draco
//     const gltfLoader = new GLTFLoader();
//     gltfLoader.setDRACOLoader(dracoLoaderRef.current);
  
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
  
//         // Simplify the model
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             // Apply a uniform gray color
//             child.material = new THREE.MeshBasicMaterial({ color: 0x808080 });
  
//             // Remove unnecessary attributes
//             if (child.geometry.attributes.color) child.geometry.deleteAttribute('color');
//             if (child.geometry.attributes.uv) child.geometry.deleteAttribute('uv');
//             if (child.geometry.attributes.normal) child.geometry.deleteAttribute('normal');
//           }
//         });
  
//         // Remove animations
//         fbxObject.animations = [];
  
//         // Convert to glTF (JSON format) with Draco compression
//         const gltfData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(fbxObject, (result) => {
//             resolve(JSON.stringify(result));
//           }, {
//             binary: false,
//             includeCustomExtensions: true,
//             dracoOptions: {
//               compression: true,
//               compressionLevel: 7,
//               quantizePosition: 11,
//               quantizeGeneric: 8
//             }
//           }, (error) => reject(error));
//         });
  
//         // Load converted glTF for rendering
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(gltfData, "", (gltf) => resolve(gltf.scene), reject);
//         });
  
//         objects.push(gltfObject);
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);
  
//         const gltfBlob = new Blob([gltfData], { type: 'application/json' });
  
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           gltfSize: gltfBlob.size,
//         });
  
//         newConvertedModels.push({
//           fileName: file.name.replace('.fbx', '.gltf'),
//           data: gltfBlob,
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

//     if (convertedModels.length === 0) {
//       alert(
//         "No models have been processed yet. Please process models before saving."
//       );
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, {
//           create: true,
//         });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(
//       `Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`
//     );
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {
//       controlsRef.current.update();
//       rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//       if (object instanceof THREE.Mesh) {
//         object.visible = visible;
//       }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

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
//         <button
//           className="custom-button hide-show"
//           onClick={() => toggleVisibility(true)}
//         >
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button
//           className="custom-button"
//           onClick={() => toggleVisibility(false)}
//         >
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//         <input
//           type="color"
//           value={"#" + backgroundColor.toString(16).padStart(6, "0")}
//           onChange={(e) =>
//             setBackgroundColor(parseInt(e.target.value.slice(1), 16))
//           }
//         />
//       </div>

//       <div className="file-sizes">
//         {fileSizes.map((file, index) => (
//           <div key={index}>
//             <p>{file.name}</p>
//             <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>GLB size: {(file.glbSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FBXViewer;







