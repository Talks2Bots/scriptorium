import React, { useState, useEffect } from "react";
import "./EggBox.css";
import { supabase } from "../supabaseClient";

export default function EggBox() {
  const [objects, setObjects] = useState([]);
  const [box, setBox] = useState(null);
  const [boxFolder, setBoxFolder] = useState("");
  const [boxImageUrl, setBoxImageUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalImg, setModalImg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Define CUP_POS here so it's available throughout the component
  const CUP_POS = [
    { x: 49.1, y: 34.7 },
    { x: 69.9, y: 41.8 },
    { x: 28.8, y: 42.3 },
    { x: 71.0, y: 55.5 },
    { x: 49.8, y: 48.7 },
    { x: 32.0, y: 57.6 },
    { x: 51.8, y: 63.3 },
  ];

  // Fetch the first box and its objects on mount
  useEffect(() => {
    const fetchBoxAndObjects = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch the first box with its folder name
        const { data: boxes, error: boxError } = await supabase
          .from("boxes")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1);
        if (boxError) throw boxError;
        if (!boxes || boxes.length === 0) throw new Error("No boxes found.");
        
        const currentBox = boxes[0];
        setBox(currentBox);
        
        // Get the folder name (could be stored in the DB or hardcoded)
        const folderName = currentBox.folder_name || "dickinson-birds";
        setBoxFolder(folderName);
        
        // Get the box base image URL using the folder
        const { publicURL: boxImageURL, error: boxImgError } = supabase
          .storage
          .from('object-images')
          .getPublicUrl(`${folderName}/box-base.jpg`);
        
        if (boxImgError) throw boxImgError;
        setBoxImageUrl(boxImageURL);

        // Fetch the objects for this box
        const { data: objs, error: objError } = await supabase
          .from("objects")
          .select("*")
          .eq("box_id", currentBox.id)
          .order("order", { ascending: true });
        if (objError) throw objError;
        setObjects(objs);
      } catch (e) {
        setError(e.message || "Failed to load box data.");
        console.error("Error loading box:", e);
      }
      setLoading(false);
    };
    fetchBoxAndObjects();
  }, []);

  const handleEggClick = async (obj) => {
    setModalOpen(true);
    setLoading(true);
    setModalText("");
    
    try {
      // Get the image path - handle both full paths and just filenames
      const imagePath = obj.image_url.includes('/') 
        ? obj.image_url 
        : `${boxFolder}/${obj.image_url}`;
      
      const { publicURL: imageURL } = supabase
        .storage
        .from('object-images')
        .getPublicUrl(imagePath);
      
      setModalImg(imageURL);
      
      // Get the text path - similar approach for text files
      const textPath = obj.text_url.includes('/')
        ? obj.text_url
        : `${boxFolder}/${obj.text_url}`;
      
      const { publicURL, error: urlError } = supabase
        .storage
        .from('object-texts')
        .getPublicUrl(textPath);
      
      if (urlError) throw urlError;
      const res = await fetch(publicURL);
      const text = await res.text();
      setModalText(text);
    } catch (e) {
      console.error("Error loading object:", e);
      setModalText("Failed to load text.");
    }
    setLoading(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalText("");
    setModalImg("");
    setLoading(false);
  };

  if (loading && !modalOpen) return <div className="boxWrap">Loading...</div>;
  if (error) return <div className="boxWrap">{error}</div>;
  if (!box || objects.length === 0) return <div className="boxWrap">No box data found.</div>;

  return (
    <div className="boxWrap">
      {boxImageUrl ? (
        <img src={boxImageUrl} className="layer" alt="velvet box" />
      ) : (
        <div className="loading-box">Loading box...</div>
      )}

      {objects.slice(0, 7).map((obj, i) => {
        // Handle both full paths and just filenames for images
        const imagePath = obj.image_url.includes('/')
          ? obj.image_url
          : `${boxFolder}/${obj.image_url}`;
        
        const imageUrl = supabase
          .storage
          .from('object-images')
          .getPublicUrl(imagePath).publicURL;
        
        return (
          <img
            key={obj.id}
            src={imageUrl}
            className="slot"
            style={{
              left: `${CUP_POS[i].x}%`,
              top: `${CUP_POS[i].y}%`,
              zIndex: i,
            }}
            alt={obj.title || `egg-${i+1}`}
            onClick={() => handleEggClick(obj)}
          />
        );
      })}

      {modalOpen && (
        <div className="egg-modal-overlay" onClick={closeModal}>
          <div className="egg-modal" onClick={e => e.stopPropagation()}>
            <button className="egg-modal-close" onClick={closeModal}>&times;</button>
            {modalImg && <img src={modalImg} alt="egg" style={{maxWidth: '120px', margin: '0 auto'}} />}
            <div className="egg-modal-text">
              {loading ? "Loading..." : modalText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
