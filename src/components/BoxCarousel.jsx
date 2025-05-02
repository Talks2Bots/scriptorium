import React, { useState, useEffect, useRef, useCallback } from "react";
import EggBox from "./EggBox";
import { supabase } from "../supabaseClient";
import "./BoxCarousel.css";

export default function BoxCarousel() {
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const [debugMode, setDebugMode] = useState(false);

  // Helper function to construct direct storage URLs with cache busting
  const getDirectStorageUrl = useCallback((bucketName, path) => {
    const baseUrl = process.env.REACT_APP_SUPABASE_URL;
    if (!baseUrl) {
      console.error("REACT_APP_SUPABASE_URL is not defined");
      return null;
    }
    
    // Add cache busting parameter with current timestamp
    const timestamp = new Date().getTime();
    
    // Different URL construction methods to try
    const url = `${baseUrl}/storage/v1/object/public/${bucketName}/${path}?t=${timestamp}`;
    
    console.log(`Carousel constructed URL for ${path}:`, url);
    return url;
  }, []);

  // Use local fallback images if Supabase images are not available
  const getBoxImage = useCallback((folderName) => {
    // Try to use Supabase URL if available
    if (process.env.REACT_APP_SUPABASE_URL) {
      return getDirectStorageUrl('object-images', `${folderName}/closed-box.png`);
    }
    
    // Otherwise use local fallback
    return '/fallback-box.svg'; 
  }, [getDirectStorageUrl]);

  // Debug console logging helper
  const debugLog = useCallback((...args) => {
    if (debugMode) {
      console.log(...args);
    }
  }, [debugMode]);

  // Check URL for a debug parameter on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setDebugMode(true);
      console.log("Debug mode enabled via URL parameter");
    }
    
    // Log environment variables for debugging
    console.log("Environment Check:");
    console.log("REACT_APP_SUPABASE_URL:", process.env.REACT_APP_SUPABASE_URL ? "Set" : "Not set");
    console.log("REACT_APP_SUPABASE_ANON_KEY:", process.env.REACT_APP_SUPABASE_ANON_KEY ? "Set" : "Not set");
  }, []);

  // Fetch all boxes from the database
  useEffect(() => {
    const fetchBoxes = async () => {
      setLoading(true);
      setError("");
      
      try {
        console.log("Fetching boxes from database...");
        
        // Fetch all boxes, ordered by created_at
        const { data, error: fetchError } = await supabase
          .from("boxes")
          .select("*")
          .order("created_at", { ascending: true });
        
        if (fetchError) {
          console.error("Error fetching boxes:", fetchError);
          setError(fetchError.message);
          return;
        }
        
        if (!data || data.length === 0) {
          console.error("No boxes found in database");
          setError("No boxes found in the database.");
          return;
        }
        
        console.log("Fetched boxes:", data);
        debugLog("Fetched boxes:", data);
        setBoxes(data);
        
        // Pre-check image existence for each box
        data.forEach(async (box, index) => {
          try {
            const { data: folderData, error: folderError } = await supabase
              .storage
              .from('object-images')
              .list(box.folder_name, { limit: 20 });
              
            if (folderError) {
              console.error(`Error listing files for box ${box.id} (${box.folder_name}):`, folderError);
            } else {
              console.log(`Box ${box.id} (${box.folder_name}) contents:`, folderData);
            }
          } catch (err) {
            console.error(`Error checking box ${box.id} folder:`, err);
          }
        });
      } catch (err) {
        console.error("Unexpected error fetching boxes:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoxes();
  }, [debugLog]);

  // Handle wheel events for scrolling the carousel
  const handleWheel = (event) => {
    event.preventDefault();
    
    // Determine scroll direction
    const direction = event.deltaY > 0 ? 1 : -1;
    
    // Update selected box index with boundary checks
    setSelectedBoxIndex((prevIndex) => {
      const newIndex = prevIndex + direction;
      return Math.max(0, Math.min(newIndex, boxes.length - 1));
    });
  };

  // Handle touch events for mobile swiping
  const handleTouchStart = (event) => {
    isDragging.current = true;
    startY.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event) => {
    if (!isDragging.current) return;
    
    const currentY = event.touches[0].clientY;
    const deltaY = startY.current - currentY;
    
    // If enough movement detected, change the selected box
    if (Math.abs(deltaY) > 20) {
      const direction = deltaY > 0 ? 1 : -1;
      
      setSelectedBoxIndex((prevIndex) => {
        const newIndex = prevIndex + direction;
        return Math.max(0, Math.min(newIndex, boxes.length - 1));
      });
      
      // Reset for next swipe
      isDragging.current = false;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Mouse drag functionality (for desktop)
  const handleMouseDown = (event) => {
    isDragging.current = true;
    startY.current = event.clientY;
    
    // Prevent default browser drag behavior
    event.preventDefault();
  };

  const handleMouseMove = (event) => {
    if (!isDragging.current) return;
    
    const currentY = event.clientY;
    const deltaY = startY.current - currentY;
    
    // If enough movement detected, change the selected box
    if (Math.abs(deltaY) > 20) {
      const direction = deltaY > 0 ? 1 : -1;
      
      setSelectedBoxIndex((prevIndex) => {
        const newIndex = prevIndex + direction;
        return Math.max(0, Math.min(newIndex, boxes.length - 1));
      });
      
      // Reset start position
      startY.current = currentY;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Calculate position for each box along the arc
  const getBoxStyle = (index) => {
    // Number of boxes in the carousel
    const totalBoxes = boxes.length;
    
    // Calculate the relative index (distance from the selected box)
    let relativeIndex = index - selectedBoxIndex;
    
    // Calculate the angle along the arc (from -45 to 45 degrees)
    // The selected box (center) is at 0 degrees
    const maxAngle = 60; // degrees - total angle of the arc
    const angleStep = totalBoxes > 1 ? maxAngle / (totalBoxes - 1) : 0;
    const angle = -maxAngle / 2 + angleStep * index;
    
    // Convert angle to radians for calculations
    const angleRad = (angle * Math.PI) / 180;
    
    // Set the radius of the arc
    const radius = 40; // as percentage of container width
    
    // Calculate position along the arc
    const x = 10 + radius * (1 - Math.cos(angleRad)); // 10% offset from left edge
    const y = 50 + radius * Math.sin(angleRad); // 50% vertical center
    
    // Calculate scale based on distance from center
    // Center box is full size (1), boxes further away get smaller
    const scale = Math.max(0.6, 1 - Math.abs(relativeIndex) * 0.15);
    
    // Calculate z-index to ensure center box appears on top
    const zIndex = totalBoxes - Math.abs(relativeIndex);
    
    // Calculate rotation to follow the arc curve
    const rotation = angle;
    
    return {
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
      transition: 'all 0.5s ease-out',
      zIndex,
      opacity: Math.abs(relativeIndex) > 2 ? 0.3 : 1
    };
  };

  // Create a default box placeholder SVG as a data URL
  const boxPlaceholderSvg = `
    <svg width="150" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="70" x="15" y="15" fill="#8B4513" stroke="#3a2b1b" stroke-width="2" rx="5" />
      <rect width="110" height="5" x="20" y="40" fill="#3a2b1b" stroke="none" />
      <text x="75" y="65" font-family="Arial" font-size="12" text-anchor="middle" fill="#f8f3e6">Box</text>
    </svg>
  `;
  
  const boxPlaceholderDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(boxPlaceholderSvg)}`;

  // Get the currently selected box
  const selectedBox = boxes[selectedBoxIndex];

  // Show loading state
  if (loading) {
    return <div className="loading">Loading boxes...</div>;
  }

  return (
    <div className="box-carousel-container">
      {/* Page Title */}
      <div className="carousel-header">
        <h1 className="carousel-title">Scriptorium</h1>
        <p className="carousel-subtitle">A collection of poems and objects</p>
      </div>

      {/* The carousel of boxes */}
      <div 
        className="box-carousel"
        ref={carouselRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {boxes.map((box, index) => {
          const boxImageUrl = getBoxImage(box.folder_name);
          return (
            <div 
              key={box.id} 
              className={`box-item ${index === selectedBoxIndex ? 'selected' : ''}`}
              style={getBoxStyle(index)}
              onClick={() => setSelectedBoxIndex(index)}
            >
              <div className="box-label">{box.title || `Box ${index + 1}`}</div>
              <div className="box-preview">
                <img 
                  src={boxImageUrl}
                  alt={box.title || `Box ${index + 1}`}
                  onError={(e) => {
                    console.error(`Failed to load image for box ${index+1} (${box.folder_name}): ${boxImageUrl}`);
                    e.target.src = boxPlaceholderDataUrl;
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Display the selected box content */}
      <div className="selected-box-container">
        {selectedBox && (
          <div style={{ width: '100%', height: '100%' }}>
            <EggBox boxData={selectedBox} />
          </div>
        )}
      </div>
      
      {/* Debug info overlay */}
      {debugMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          maxWidth: '400px',
          maxHeight: '300px',
          overflow: 'auto',
          zIndex: 1000,
          fontSize: '12px'
        }}>
          <h3>Debug Info</h3>
          <p>Supabase URL: {process.env.REACT_APP_SUPABASE_URL || "Not set"}</p>
          <p>Anon Key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? "Set" : "Not set"}</p>
          <p>Boxes: {boxes.length}</p>
          <p>Selected Box: {selectedBoxIndex}</p>
          {selectedBox && (
            <div>
              <p>Selected ID: {selectedBox.id}</p>
              <p>Folder: {selectedBox.folder_name}</p>
              <p>Box Image URL: {getDirectStorageUrl('object-images', `${selectedBox.folder_name}/box-base.jpg`)}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Error feedback */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 