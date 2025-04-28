import React, { useState } from "react";
import "./EggBox.css";

// base box JPG in /public/images  ➜  reference with /images/ URL
const BOX_SRC = "/images/base_box.jpg";

// if your egg PNGs live in /public/images, use /images/ URLs:
const IMGS = [
  "/images/img1.png",
  "/images/img2.png",
  "/images/img3.png",
  "/images/img4.png",
  "/images/img5.png",
  "/images/img6.png",
  "/images/img7.png",
];

// Positions reordered: farthest eggs first, front eggs last
const CUP_POS = [
    {x:49.1, y:34.7},  // top middle egg
    {x:69.9, y:41.8},  // top right egg
    {x:28.8, y:42.3},  // top left egg
    {x:71.0, y:55.5},  // mid right egg
    {x:49.8, y:48.7},  // mid center egg
    {x:32, y:57.6},  // mid left egg
    {x:51.8, y:63.3},  // bottom center egg
  ];
  
export default function EggBox() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalImg, setModalImg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEggClick = async (i) => {
    setModalOpen(true);
    setModalImg(IMGS[i]);
    setLoading(true);
    try {
      const res = await fetch(`/texts/text${i + 1}.txt`);
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

  return (
    <div className="boxWrap">
      <img src={BOX_SRC} className="layer" alt="velvet box" />

      {IMGS.map((src, i) => (
        <img
          key={i}
          src={src}
          className="slot"
          style={{
            left: `${CUP_POS[i].x}%`,
            top: `${CUP_POS[i].y}%`,
            zIndex: i,               // ensures lower eggs overlap upper
          }}
          alt={`egg-${i}`}
          onClick={() => handleEggClick(i)}
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