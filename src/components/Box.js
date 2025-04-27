import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { CUP_MAP } from '../utils/cupMap';

// Styled components following the exact CSS recommendations
const BoxWrapper = styled.div`
  position: relative;
  width: 60vmin;
  display: inline-block;
  margin: 0 auto;
  display: block;
  
  @media (max-width: 600px) {
    width: 80vmin;
  }
`;

const BoxBackground = styled.img`
  width: 100%;
  display: block;
`;

const BoxMask = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  pointer-events: none;
`;

// The Box component now just renders the structure,
// and JavaScript handles the egg placement
const Box = () => {
  const boxRef = useRef(null);
  
  useEffect(() => {
    // Only run after component mounts and boxRef is available
    if (!boxRef.current) return;
    
    const placeEggs = () => {
      const wrapper = boxRef.current;
      if (!wrapper) return console.error('wrapper not found');
      
      // Wait until the background image has loaded
      const bg = wrapper.querySelector('.box-bg');
      if (!bg.complete) {
        bg.onload = placeEggs;
        return;
      }
      
      // Clear any existing eggs before placing new ones
      const existingEggs = wrapper.querySelectorAll('.egg');
      existingEggs.forEach(egg => egg.remove());
      
      // Get the dimensions of the wrapper
      const W = wrapper.clientWidth;
      const H = wrapper.clientHeight;
      
      // Create eggs for each cup position
      CUP_MAP.slice(0, 7).forEach((cup, i) => {
        const { cx, cy, r } = cup;
        
        // Create an egg image
        const img = new Image();
        img.src = `/images/robin-egg.png?v=${Date.now()}`;
        img.className = 'egg';
        img.alt = `Robin's Egg ${i + 1}`;
        
        // Calculate size and position
        const eggPx = r * 2 * 1.1 * W; // radius → diameter → +10%
        img.style.width = `${eggPx}px`;
        img.style.left = `${cx * W}px`;
        img.style.top = `${cy * H}px`;
        
        // Add click handler if needed
        img.addEventListener('click', () => {
          console.log(`Egg ${i + 1} clicked`);
          // Add modal handling here if desired
        });
        
        wrapper.appendChild(img);
      });
    };
    
    // Initial placement
    placeEggs();
    
    // Reposition eggs on window resize
    window.addEventListener('resize', placeEggs);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', placeEggs);
    };
  }, []);
  
  return (
    <BoxWrapper id="treasure-box" className="box-wrapper" ref={boxRef}>
      <BoxBackground 
        src="/images/open_box.jpg" 
        alt="box" 
        className="box-bg"
      />
      
      {/* Optional mask - uncomment when we have the image */}
      {/* <BoxMask 
        src="/images/box-lip-mask.png" 
        className="box-mask" 
        alt="mask"
      /> */}
      
      {/* Eggs will be added here by JavaScript */}
    </BoxWrapper>
  );
};

// Add the necessary CSS to the document
useEffect(() => {
  // Create a style element
  const style = document.createElement('style');
  
  // Add the CSS for eggs
  style.textContent = `
    .box-wrapper {
      position: relative;
      width: 60vmin;
      display: inline-block;
    }
    
    .box-bg {
      width: 100%;
      display: block;
    }
    
    .egg {
      position: absolute;
      transform: translate(-50%, -65%);
      pointer-events: auto;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .egg:hover {
      transform: translate(-50%, -65%) scale(1.05);
    }
    
    .box-mask {
      position: absolute;
      inset: 0;
      width: 100%;
      pointer-events: none;
    }
    
    /* Debug outline - remove in production */
    /* .box-wrapper { outline: 2px dashed lime; } */
  `;
  
  // Add the style to the document head
  document.head.appendChild(style);
  
  // Cleanup
  return () => {
    document.head.removeChild(style);
  };
}, []);

export default Box; 