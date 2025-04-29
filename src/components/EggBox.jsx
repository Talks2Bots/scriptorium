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
      
      // Fetch text content
      const { publicURL: textURL } = supabase
        .storage
        .from('object-texts')
        .getPublicUrl(textPath);
      
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
            <li>In your object-texts bucket, you have text files named: <strong>text1.txt, text2.txt, etc.</strong></li>
          </ol>
          <p>Files found in your folder:</p>
          <ul>
            {folderContents.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (loading) return <div className="boxWrap">Loading box...</div>;
  if (!box) return <div className="boxWrap">No box found.</div>;

  return (
    <div className="boxWrap">
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
