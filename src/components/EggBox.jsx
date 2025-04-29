import React, { useState, useEffect } from "react";
import "./EggBox.css";
import { supabase } from "../supabaseClient";

export default function EggBox() {
  const [box, setBox] = useState(null);
  const [boxFolder, setBoxFolder] = useState("");
  const [boxImageUrl, setBoxImageUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalImg, setModalImg] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [folderContents, setFolderContents] = useState([]);
  const [debugMode, setDebugMode] = useState(true);

  // Fixed positions for the 7 objects
  const CUP_POS = [
    { x: 49.1, y: 34.7 },
    { x: 69.9, y: 41.8 },
    { x: 28.8, y: 42.3 },
    { x: 71.0, y: 55.5 },
    { x: 49.8, y: 48.7 },
    { x: 32.0, y: 57.6 },
    { x: 51.8, y: 63.3 },
  ];

  // Fetch the box data on mount
  useEffect(() => {
    const fetchBoxData = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch the first box
        const { data: boxes, error: boxError } = await supabase
          .from("boxes")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1);
        
        if (boxError) throw boxError;
        if (!boxes || boxes.length === 0) throw new Error("No boxes found.");
        
        const currentBox = boxes[0];
        setBox(currentBox);
        
        // Get the folder name from the box record
        const folderName = currentBox.folder_name || "dickinson-birds";
        setBoxFolder(folderName);
        
        // First, list the folder contents to see what's available
        const { data: files, error: listError } = await supabase
          .storage
          .from('object-images')
          .list(folderName);
        
        if (listError) throw new Error("Could not list folder contents");
        setFolderContents(files || []);

        // Also check the text folder to make sure it exists
        const { data: textFiles, error: textListError } = await supabase
          .storage
          .from('object-texts')
          .list(folderName);
        
        if (textListError) {
          console.log("Warning: Could not list text folder contents");
        } else {
          console.log(`Found ${textFiles?.length || 0} text files in ${folderName}`);
        }
        
        // Get the box base image URL
        const { publicURL: boxImageURL } = supabase
          .storage
          .from('object-images')
          .getPublicUrl(`${folderName}/box-base.jpg`);
        
        setBoxImageUrl(boxImageURL);
      } catch (e) {
        setError(e.message || "Failed to load box data.");
      }
      setLoading(false);
    };
    
    fetchBoxData();
  }, []);

  const handleObjectClick = async (index) => {
    setModalOpen(true);
    setLoading(true);
    setModalText("");
    setModalTitle("");
    
    const fileIndex = index + 1;
    
    try {
      // Construct URLs for image and text based on the folder and index
      const imagePath = `${boxFolder}/img${fileIndex}.png`;
      const textPath = `${boxFolder}/text${fileIndex}.txt`;
      
      // Get image URL
      const { publicURL: imageURL } = supabase
        .storage
        .from('object-images')
        .getPublicUrl(imagePath);
      
      setModalImg(imageURL);
      setModalTitle(`Item ${fileIndex}`);
      
      // Fetch text content - use the same folder structure as images
      const { publicURL: textURL } = supabase
        .storage
        .from('object-texts')
        .getPublicUrl(textPath);  // This will look for texts in the same subfolder
      
      try {
        const res = await fetch(textURL);
        const text = await res.text();
        setModalText(text);
      } catch {
        setModalText("Could not load text for this item.");
      }
    } catch (e) {
      setModalText("Failed to load content.");
    }
    
    setLoading(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalText("");
    setModalImg("");
    setModalTitle("");
  };

  // Always show the debug page
  if (debugMode) {
    return (
      <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif'}}>
        <h2>Scriptorium Debug Information</h2>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Box Information</h3>
          {box ? (
            <div>
              <p><strong>Title:</strong> {box.title || "Untitled"}</p>
              <p><strong>Folder Name:</strong> {boxFolder}</p>
              <p><strong>Box ID:</strong> {box.id}</p>
            </div>
          ) : (
            <p>No box found or still loading...</p>
          )}
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Storage Information</h3>
          <p><strong>Expected Box Image Path:</strong> {boxFolder}/box-base.jpg</p>
          <p><strong>Box Image URL:</strong> {boxImageUrl || "Not loaded"}</p>
          <p><strong>Expected Object Images:</strong> {boxFolder}/img1.png, {boxFolder}/img2.png, etc.</p>
          <p><strong>Expected Text Files:</strong> <span style={{color: 'blue'}}>{boxFolder}/text1.txt, {boxFolder}/text2.txt, etc. (in object-texts bucket)</span></p>
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Files Found in Folder "{boxFolder}":</h3>
          {folderContents.length > 0 ? (
            <ul>
              {folderContents.map((file, i) => (
                <li key={i}>{file.name}</li>
              ))}
            </ul>
          ) : (
            <p>No files found in this folder or folder doesn't exist</p>
          )}
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Testing Image Loading</h3>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
            <div>
              <p>Box Base Image:</p>
              <img 
                src={boxImageUrl} 
                alt="Base Box" 
                style={{maxWidth: '100px', border: '1px solid #ccc'}}
              />
            </div>
            
            {[1,2,3,4,5,6,7].map(index => {
              const imagePath = `${boxFolder}/img${index}.png`;
              const { publicURL } = supabase
                .storage
                .from('object-images')
                .getPublicUrl(imagePath);
              
              return (
                <div key={index}>
                  <p>Object {index}:</p>
                  <img 
                    src={publicURL} 
                    alt={`Object ${index}`}
                    style={{maxWidth: '100px', border: '1px solid #ccc'}}
                  />
                  <p style={{fontSize: '10px'}}>{imagePath}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        <div style={{marginTop: '20px'}}>
          <button 
            onClick={() => setDebugMode(false)}
            style={{padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
          >
            View Normal Application
          </button>
        </div>
      </div>
    );
  }

  // Show a helpful error page if there's an issue
  if (error) {
    return (
      <div style={{padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif'}}>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <div style={{marginTop: '20px'}}>
          <h3>Please check:</h3>
          <ol>
            <li>Your Supabase storage has a folder named: <strong>{boxFolder || "dickinson-birds"}</strong></li>
            <li>Inside that folder, you have a file named: <strong>box-base.jpg</strong></li>
            <li>Inside that folder, you have image files named: <strong>img1.png, img2.png, etc.</strong></li>
            <li>In your object-texts bucket, in a folder named <strong>{boxFolder}</strong>, you have text files named: <strong>text1.txt, text2.txt, etc.</strong></li>
          </ol>
          <p>Files found in your folder:</p>
          <ul>
            {folderContents.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        </div>
        <div style={{marginTop: '20px'}}>
          <button 
            onClick={() => setDebugMode(true)}
            style={{padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
          >
            Show Debug Information
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="boxWrap">Loading box...</div>;
  if (!box) return <div className="boxWrap">No box found.</div>;

  return (
    <div className="boxWrap">
      <button 
        onClick={() => setDebugMode(true)}
        style={{
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          zIndex: 1000,
          padding: '5px 10px',
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Debug
      </button>
      
      {boxImageUrl ? (
        <img 
          src={boxImageUrl} 
          className="layer" 
          alt="velvet box" 
        />
      ) : (
        <div className="loading-box">Loading box image...</div>
      )}

      {/* Render the 7 object slots using the naming convention */}
      {CUP_POS.map((position, i) => {
        const imagePath = `${boxFolder}/img${i+1}.png`;
        const imageUrl = supabase
          .storage
          .from('object-images')
          .getPublicUrl(imagePath).publicURL;
        
        return (
          <img
            key={i}
            src={imageUrl}
            className="slot"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              zIndex: i,
            }}
            alt={`Object ${i+1}`}
            onClick={() => handleObjectClick(i)}
          />
        );
      })}

      {modalOpen && (
        <div className="egg-modal-overlay" onClick={closeModal}>
          <div className="egg-modal" onClick={e => e.stopPropagation()}>
            <button className="egg-modal-close" onClick={closeModal}>&times;</button>
            <h3>{modalTitle}</h3>
            {modalImg && (
              <img 
                src={modalImg} 
                alt="Selected object" 
                style={{maxWidth: '120px', margin: '0 auto'}} 
              />
            )}
            <div className="egg-modal-text">
              {loading ? "Loading..." : modalText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
