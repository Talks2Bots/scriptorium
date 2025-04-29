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
        
        // Get the box base image URL
        const { publicURL: boxImageURL, error: boxImgError } = supabase
          .storage
          .from('object-images')
          .getPublicUrl(`${folderName}/box-base.jpg`);
        
        if (boxImgError) throw boxImgError;
        setBoxImageUrl(boxImageURL);
        
        console.log("Box loaded successfully:", currentBox.title || "Untitled Box");
        console.log("Using folder:", folderName);
        console.log("Box image URL:", boxImageURL);
      } catch (e) {
        setError(e.message || "Failed to load box data.");
        console.error("Error loading box:", e);
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
    
    // Use 1-based indexing for files
    const fileIndex = index + 1;
    
    try {
      // Construct URLs for image and text based on the folder and index
      const imagePath = `${boxFolder}/img${fileIndex}.png`;
      const textPath = `${boxFolder}/text${fileIndex}.txt`;
      
      console.log("Loading image:", imagePath);
      console.log("Loading text:", textPath);
      
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
      
      const res = await fetch(textURL);
      if (!res.ok) throw new Error(`Failed to fetch text: ${res.status}`);
      
      const text = await res.text();
      setModalText(text);
    } catch (e) {
      console.error("Error loading object content:", e);
      setModalText("Failed to load text.");
    }
    
    setLoading(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalText("");
    setModalImg("");
    setModalTitle("");
  };

  if (loading && !modalOpen) return <div className="boxWrap">Loading box...</div>;
  if (error) return <div className="boxWrap">Error: {error}</div>;
  if (!box) return <div className="boxWrap">No box found.</div>;

  return (
    <div className="boxWrap">
      {boxImageUrl ? (
        <img 
          src={boxImageUrl} 
          className="layer" 
          alt="velvet box" 
          onError={(e) => {
            console.error("Failed to load box image:", boxImageUrl);
            e.target.onerror = null;
          }}
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
            onError={(e) => {
              console.error(`Failed to load object image ${i+1}:`, imagePath);
              e.target.onerror = null;
            }}
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
                onError={(e) => {
                  console.error("Failed to load modal image:", modalImg);
                  e.target.onerror = null;
                }}
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
