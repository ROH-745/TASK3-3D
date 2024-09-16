import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./App.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEyeSlash, faEye, faSearch } from '@fortawesome/free-solid-svg-icons';

function FBXViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(
    new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
  );

  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controlsRef = useRef(null);
  const cumulativeBoundingBox = useRef(
    new THREE.Box3(
      new THREE.Vector3(Infinity, Infinity, Infinity),
      new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    )
  );

  const [isVisible, setIsVisible] = useState(true);
  const [fileSizes, setFileSizes] = useState([]);
  const [saveDirectory, setSaveDirectory] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [convertedModels, setConvertedModels] = useState([]);

  useEffect(() => {
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setClearColor(0xd3d3d3); // Light grey background color
    rendererRef.current.outputEncoding = THREE.sRGBEncoding; // Use sRGB encoding for correct color management
    mountRef.current.appendChild(rendererRef.current.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.1;

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      mountRef.current.removeChild(rendererRef.current.domElement);
      controlsRef.current.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const selectSaveDirectory = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      setSaveDirectory(dirHandle);
    } catch (err) {
      console.error("Error selecting directory:", err);
    }
  };

  const onFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  const processModels = async () => {
    const loader = new FBXLoader();
    const objects = [];
    const newFileSizes = [];
    const newConvertedModels = [];

    cumulativeBoundingBox.current = new THREE.Box3(
      new THREE.Vector3(Infinity, Infinity, Infinity),
      new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    );

    for (const file of selectedFiles) {
      try {
        const fbxObject = await new Promise((resolve, reject) => {
          loader.load(
            URL.createObjectURL(file),
            (object) => resolve(object),
            undefined,
            (error) => reject(error)
          );
        });

        // Convert FBX to glTF
        const gltfData = await new Promise((resolve, reject) => {
          const exporter = new GLTFExporter();
          exporter.parse(fbxObject, (result) => {
            const output = JSON.stringify(result);
            const blob = new Blob([output], { type: 'application/json' });
            resolve(blob);
          }, { binary: false }, (error) => reject(error));
        });

        // Load converted glTF for rendering
        const gltfLoader = new GLTFLoader();
        const gltfObject = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            gltfLoader.parse(e.target.result, '', (gltf) => resolve(gltf.scene), reject);
          };
          reader.readAsText(gltfData);
        });

        objects.push(gltfObject);
        const boundingBox = new THREE.Box3().setFromObject(gltfObject);
        cumulativeBoundingBox.current.union(boundingBox);
        
        newFileSizes.push({
          name: file.name,
          fbxSize: file.size,
          gltfSize: gltfData.size
        });

        newConvertedModels.push({
          fileName: file.name.replace('.fbx', '.gltf'),
          data: gltfData
        });
      } catch (error) {
        console.error("Error processing model:", error);
      }
    }

    objects.forEach((obj) => sceneRef.current.add(obj));
    adjustCamera();
    setFileSizes(newFileSizes);
    setConvertedModels(newConvertedModels);
  };

  const saveConvertedModels = async () => {
    if (!saveDirectory) {
      alert("Please select a save directory first.");
      return;
    }

    if (convertedModels.length === 0) {
      alert("No models have been processed yet. Please process models before saving.");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const model of convertedModels) {
      try {
        const newHandle = await saveDirectory.getFileHandle(model.fileName, { create: true });
        const writable = await newHandle.createWritable();
        await writable.write(model.data);
        await writable.close();
        successCount++;
      } catch (error) {
        console.error("Error saving file:", model.fileName, error);
        failCount++;
      }
    }

    alert(`Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`);
  };

  const adjustCamera = () => {
    const center = new THREE.Vector3();
    cumulativeBoundingBox.current.getCenter(center);
    const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
    const distance = size.length();
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = distance / (2 * Math.tan(fov / 2));
    cameraZ *= 2.5; // Adjust multiplier to ensure all models are visible

    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  const animate = () => {
    requestAnimationFrame(animate);
    if (isVisible) {  // Only update controls and render if visible
        controlsRef.current.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const toggleVisibility = (visible) => {
    setIsVisible(visible);
    sceneRef.current.traverse(function (object) {
        if (object instanceof THREE.Mesh) {
            object.visible = visible;
        }
    });
  };

  const resetCameraView = () => {
    const center = new THREE.Vector3();
    cumulativeBoundingBox.current.getCenter(center);
    const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
    const distance = size.length();
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = distance / (2 * Math.tan(fov / 2));
    cameraZ *= 2.5;  // Adjust to ensure all models are visible

    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  return (
    <div className="main">
      <div className="canvas-container">
        <button onClick={selectSaveDirectory}>Select Save Directory</button>
        <input
          className="button"
          type="file"
          multiple
          onChange={onFileChange}
          accept=".fbx"
        />
        <button onClick={processModels}>Process Models</button>
        <button onClick={saveConvertedModels}>Save Converted Models</button>
        <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
      </div>

      <div className="button-container">
        <button className="custom-button hide-show" onClick={() => toggleVisibility(true)}>
          <FontAwesomeIcon icon={faEye} />
        </button>
        <button className="custom-button" onClick={() => toggleVisibility(false)}>
          <FontAwesomeIcon icon={faEyeSlash} />
        </button>
        <button className="custom-button fit-view" onClick={resetCameraView}>
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>

      <div className="file-sizes">
        {fileSizes.map((file, index) => (
          <div key={index}>
            <p>{file.name}</p>
            <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
            <p>glTF size: {(file.gltfSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FBXViewer;