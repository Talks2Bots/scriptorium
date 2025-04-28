import React from "react";
import "./EggBox.css";

// base box JPG in /public  ➜  reference with plain URL
const BOX_SRC = "/base_box.jpg";

// if your egg PNGs live in /public, use plain URLs:
const IMGS = [
  "/img1.png",
  "/img2.png",
  "/img3.png",
  "/img4.png",
  "/img5.png",
  "/img6.png",
  "/img7.png",
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
        />
      ))}
    </div>
  );
} 