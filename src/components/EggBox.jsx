import React, { useState, useEffect } from "react";
import "./EggBox.css";
import { supabase } from "../supabaseClient";

export default function EggBox() {
  const [objects, setObjects] = useState([]);
  const [box, setBox] = useState(null);
  const [boxImageUrl, setBoxImageUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalImg, setModalImg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch the first box and its objects on mount
  useEffect(() => {
    const fetchBoxAndObjects = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch the first box (or you can add selection logic)
        const { data: boxes, error: boxError } = await supabase
          .from("boxes")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1);
        if (boxError) throw boxError;
        if (!boxes || boxes.length === 0) throw new Error("No boxes found.");
        setBox(boxes[0]);
        
        // Get the box base image URL
        const { publicURL: boxImageURL, error: boxImgError } = supabase
          .storage
          .from('object-images')
          .getPublicUrl('dickinson-birds/box-base.jpg');
        
        if (boxImgError) throw boxImgError;
        setBoxImageUrl(boxImageURL);

        // Fetch the 7 objects for this box, ordered by 'order'
        const { data: objs, error: objError } = await supabase
          .from("objects")
          .select("*")
          .eq("box_id", boxes[0].id)
          .order("order", { ascending: true });
        if (objError) throw objError;
        setObjects(objs);
      } catch (e) {
        setError(e.message || "Failed to load box data.");
      }
      setLoading(false);
    };
    fetchBoxAndObjects();
  }, []);

  const handleEggClick = async (obj) => {
    setModalOpen(true);
    setModalImg(obj.image_url);
    setLoading(true);
    setModalText("");
    try {
      // Fetch the text file from Supabase Storage (public URL)
      const { publicURL, error: urlError } = supabase.storage.from('object-texts').getPublicUrl(obj.text_url.replace(/^object-texts\//, ""));
      if (urlError) throw urlError;
      const res = await fetch(publicURL);
      const text = await res.text();
      setModalText(text);
    } catch (e) {
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

  // Use the same CUP_POS as before, or store positions in the DB if you want per-box layouts
  const CUP_POS = [
    { x: 49.1, y: 34.7 },
    { x: 69.9, y: 41.8 },
    { x: 28.8, y: 42.3 },
    { x: 71.0, y: 55.5 },
    { x: 49.8, y: 48.7 },
    { x: 32.0, y: 57.6 },
    { x: 51.8, y: 63.3 },
  ];

  return (
    <div className="boxWrap">
      {boxImageUrl ? (
        <img src={boxImageUrl} className="layer" alt="velvet box" />
      ) : (
        <div className="loading-box">Loading box...</div>
      )}

      {objects.slice(0, 7).map((obj, i) => (
        <img
          key={obj.id}
          src={supabase.storage.from('object-images').getPublicUrl(obj.image_url.replace(/^object-images\//, "")).publicURL}
          className="slot"
          style={{
            left: `${CUP_POS[i].x}%`,
            top: `${CUP_POS[i].y}%`,
            zIndex: i,
          }}
          alt={obj.title || `egg-${i+1}`}
          onClick={() => handleEggClick(obj)}
        />
      ))}

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