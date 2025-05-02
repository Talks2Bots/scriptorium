import React, { useState, useEffect } from "react";
import EggBox from "./EggBox";
import { supabase } from "../supabaseClient";
import "./BoxCarousel.css";

export default function SimpleBoxCarousel() {
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailedError, setDetailedError] = useState(null);
  const [supabaseInfo, setSupabaseInfo] = useState({
    url: process.env.REACT_APP_SUPABASE_URL || "Not set",
    hasKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? "Key is set" : "Key is missing",
  });

  // Fetch boxes on component mount
  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        console.log("Fetching boxes...");
        console.log("Supabase Config:", supabaseInfo);
        setLoading(true);
        
        // Try a very simple fetch first to test connectivity
        try {
          console.log("Testing connectivity...");
          const testResponse = await fetch("https://jsonplaceholder.typicode.com/todos/1");
          if (!testResponse.ok) {
            console.log("General fetch test failed", testResponse.status);
          } else {
            console.log("General fetch test succeeded");
          }
        } catch (testError) {
          console.error("General fetch test error:", testError);
        }
        
        // Get boxes from database
        console.log("About to fetch from Supabase...");
        const { data, error: fetchError } = await supabase
          .from("boxes")
          .select("*")
          .order("created_at", { ascending: true });
        
        console.log("Supabase response:", { data, error: fetchError });
        
        if (fetchError) {
          console.error("Supabase fetch error:", fetchError);
          setDetailedError(JSON.stringify(fetchError, null, 2));
          throw fetchError;
        }
        
        console.log("Boxes fetched:", data);
        setBoxes(data || []);
      } catch (err) {
        console.error("Error fetching boxes:", err);
        setError(err.message || "Unknown error");
        setDetailedError(JSON.stringify(err, null, 2) || "No detailed error information");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoxes();
  }, [supabaseInfo]);

  // Get the currently selected box
  const selectedBox = boxes[selectedBoxIndex];

  // Handle previous/next buttons
  const goToPrevious = () => {
    setSelectedBoxIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };
  
  const goToNext = () => {
    setSelectedBoxIndex((prevIndex) => 
      Math.min(boxes.length - 1, prevIndex + 1)
    );
  };

  // If loading, show a simple loading message
  if (loading) {
    return <div className="loading">Loading boxes...</div>;
  }

  // If error, show the error but also render the EggBox without a boxData prop
  if (error) {
    return (
      <div>
        <div className="carousel-error">
          <h3>Error loading carousel: {error}</h3>
          <details>
            <summary>Debug Information</summary>
            <pre style={{ textAlign: 'left', overflowX: 'auto' }}>
              Supabase URL: {supabaseInfo.url}
              Supabase Key: {supabaseInfo.hasKey}
              Error Details: {detailedError}
            </pre>
          </details>
          <p>Falling back to single box view:</p>
        </div>
        <EggBox />
      </div>
    );
  }

  // If no boxes were found, just render the default EggBox
  if (!boxes || boxes.length === 0) {
    return (
      <div>
        <div className="carousel-info">No boxes found in database. Showing default box.</div>
        <EggBox />
      </div>
    );
  }

  return (
    <div className="box-carousel-container">
      <div className="carousel-header">
        <h1 className="carousel-title">Scriptorium</h1>
        <p className="carousel-subtitle">A collection of poems and objects</p>
      </div>
      
      {/* Simple navigation buttons */}
      <div className="carousel-navigation">
        <button 
          onClick={goToPrevious} 
          disabled={selectedBoxIndex === 0}
          className="nav-button"
        >
          Previous Box
        </button>
        
        <span className="box-indicator">
          Box {selectedBoxIndex + 1} of {boxes.length}
        </span>
        
        <button 
          onClick={goToNext} 
          disabled={selectedBoxIndex === boxes.length - 1}
          className="nav-button"
        >
          Next Box
        </button>
      </div>
      
      {/* Display the selected box */}
      <div className="selected-box-container">
        {selectedBox ? (
          <>
            <EggBox boxData={selectedBox} />
            {selectedBox.name && (
              <div className="box-name">
                {selectedBox.name}
              </div>
            )}
          </>
        ) : (
          <EggBox />
        )}
      </div>
    </div>
  );
} 