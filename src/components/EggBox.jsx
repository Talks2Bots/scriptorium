import React, { useState, useEffect, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import "./EggBox.css";
import { supabase } from "../supabaseClient";

export default function EggBox({ boxData }) {
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
  const [debugMode, setDebugMode] = useState(false);
  const [buckets] = useState([]);
  const [textFolderContents, setTextFolderContents] = useState([]);
  const [detailedError, setDetailedError] = useState(null);
  const [isBoxOpen, setIsBoxOpen] = useState(false); // Start with closed box
  const [closedBoxImageUrl, setClosedBoxImageUrl] = useState("");
  const [supabaseInfo] = useState({
    url: process.env.REACT_APP_SUPABASE_URL || "Not set",
    hasKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? "Key is set" : "Key is missing",
    fullInfo: true
  });

  // Debug console logging helper
  const debugLog = useCallback((...args) => {
    if (debugMode) {
      console.log(...args);
    }
  }, [debugMode]);

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

  // Helper function to construct direct storage URLs with cache busting
  const getDirectStorageUrl = useCallback((bucketName, path) => {
    console.log("Building URL for", bucketName, path);
    const baseUrl = process.env.REACT_APP_SUPABASE_URL;
    if (!baseUrl) {
      console.error("No REACT_APP_SUPABASE_URL available");
      return null;
    }
    
    // Add cache busting parameter with current timestamp
    const timestamp = new Date().getTime();
    const url = `${baseUrl}/storage/v1/object/public/${bucketName}/${path}?t=${timestamp}`;
    console.log("Built URL:", url);
    return url;
  }, []);

  // Use the original Supabase method to get public URL
  const getSupabasePublicUrl = useCallback((bucketName, path) => {
    console.log("Using Supabase getPublicUrl for", bucketName, path);
    try {
      const { publicURL } = supabase.storage.from(bucketName).getPublicUrl(path);
      console.log("Supabase publicURL:", publicURL);
      return publicURL;
    } catch (err) {
      console.error("Error getting Supabase public URL:", err);
      return null;
    }
  }, []);

  // Check URL for a debug parameter on component mount
  useEffect(() => {
    // Check if there's a debug=true parameter in the URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setDebugMode(true);
      console.log("Debug mode enabled via URL parameter");
    }
    
    // Always enable console logs for diagnosing
    console.log("EggBox component mounted");
    console.log("Supabase URL:", process.env.REACT_APP_SUPABASE_URL);
    console.log("Supabase key available:", !!process.env.REACT_APP_SUPABASE_ANON_KEY);
  }, []);

  // Set up the box - using original approach but accepting boxData from carousel
  useEffect(() => {
    const setupBox = async () => {
      console.log("Setting up box...");
      setLoading(true);
      setError("");
      setDetailedError(null);
      
      try {
        let currentBox;
        
        // If boxData is provided, use it directly
        if (boxData) {
          console.log("Using provided boxData");
          currentBox = boxData;
        } else {
          // Otherwise fetch the first box (original behavior)
          console.log("Fetching box from database");
          try {
            const { data: boxes, error: boxError } = await supabase
              .from("boxes")
              .select("*")
              .order("created_at", { ascending: true })
              .limit(1);
            
            if (boxError) {
              console.error("Box fetch error:", boxError);
              throw boxError;
            }
            
            if (!boxes || boxes.length === 0) {
              console.error("No boxes found in database");
              throw new Error("No boxes found.");
            }
            
            console.log("Box data retrieved:", boxes[0]);
            currentBox = boxes[0];
          } catch (dbError) {
            console.error("Database error:", dbError);
            throw new Error(`Database error: ${dbError.message}`);
          }
        }
        
        setBox(currentBox);
        
        // Get the folder name from the box record
        const folderName = currentBox.folder_name || "dickinson-birds";
        console.log("Using folder name:", folderName);
        setBoxFolder(folderName);
        
        // Force refresh of Supabase storage listing to avoid caching
        const listOptions = {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        };
        
        try {
          // First, list the folder contents to see what's available
          console.log("Listing files in object-images/" + folderName);
          const { data: files, error: listError } = await supabase
            .storage
            .from('object-images')
            .list(folderName, listOptions);
          
          if (listError) {
            console.error("Image folder listing error:", listError);
            throw new Error(`Could not list image folder contents: ${listError.message}`);
          }
          
          console.log("Files found in object-images/" + folderName + ":", files);
          setFolderContents(files || []);
        } catch (storageError) {
          console.error("Storage listing error:", storageError);
        }

        try {
          // Also check the text folder to make sure it exists
          console.log("Listing files in object-texts/" + folderName);
          const { data: textFiles, error: textListError } = await supabase
            .storage
            .from('object-texts')
            .list(folderName, listOptions);
          
          if (textListError) {
            console.error("Text folder listing error:", textListError);
            console.log("Warning: Could not list text folder contents");
          } else {
            console.log("Files found in object-texts/" + folderName + ":", textFiles);
            setTextFolderContents(textFiles || []);
          }
        } catch (textStorageError) {
          console.error("Text storage listing error:", textStorageError);
        }
        
        // Try both methods to get URLs
        try {
          // First method: Direct URL construction
          const boxImageURL = getDirectStorageUrl('object-images', `${folderName}/box-base.jpg`);
          console.log("Direct box image URL:", boxImageURL);
          
          // Second method: Use Supabase's getPublicUrl
          const supabaseBoxImageURL = getSupabasePublicUrl('object-images', `${folderName}/box-base.jpg`);
          console.log("Supabase box image URL:", supabaseBoxImageURL);
          
          // Use the Supabase method if available, otherwise direct construction
          setBoxImageUrl(supabaseBoxImageURL || boxImageURL);
          
          // Get the closed box image URL
          const closedBoxImageURL = getSupabasePublicUrl('object-images', `${folderName}/closed-box.png`) || 
                                   getDirectStorageUrl('object-images', `${folderName}/closed-box.png`);
          setClosedBoxImageUrl(closedBoxImageURL);
        } catch (urlError) {
          console.error("Error constructing URLs:", urlError);
        }
      } catch (e) {
        console.error("General error in setupBox:", e);
        setError(e.message || "Failed to load box data.");
      }
      
      setLoading(false);
    };
    
    setupBox();
  }, [boxData, getDirectStorageUrl, getSupabasePublicUrl]);
  
  // Handle clicking on objects - using original implementation
  const handleObjectClick = async (index) => {
    console.log(`Object ${index + 1} clicked`);
    setModalOpen(true);
    setLoading(true);
    setModalText("");
    setModalTitle("");
    
    const fileIndex = index + 1;
    
    try {
      // Construct URLs for image and text based on the folder and index
      const imagePath = `${boxFolder}/img${fileIndex}.png`;
      const textPath = `${boxFolder}/text${fileIndex}.md`;
      
      // Use Supabase getPublicUrl first, fallback to direct URL construction
      const imageURL = getSupabasePublicUrl('object-images', imagePath) || 
                      getDirectStorageUrl('object-images', imagePath);
      
      console.log("Using image URL:", imageURL);
      setModalImg(imageURL);
      setModalTitle(`Item ${fileIndex}`);
      
      // Use Supabase getPublicUrl for text URL too
      const textURL = getSupabasePublicUrl('object-texts', textPath) || 
                     getDirectStorageUrl('object-texts', textPath);
      
      try {
        console.log("Fetching text from URL:", textURL);
        // Add cache control headers to the fetch request - as in original
        const res = await fetch(textURL, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!res.ok) {
          console.log(`Markdown fetch failed with status ${res.status}, trying txt fallback`);
          // If .md file is not found, try .txt as fallback for backward compatibility
          const txtPath = `${boxFolder}/text${fileIndex}.txt`;
          const txtURL = getSupabasePublicUrl('object-texts', txtPath) || 
                        getDirectStorageUrl('object-texts', txtPath);
          
          console.log("Trying txt URL:", txtURL);
          const txtRes = await fetch(txtURL, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (txtRes.ok) {
            const txtContent = await txtRes.text();
            setModalText(txtContent);
            console.log("Text content loaded from txt file");
          } else {
            console.error(`HTTP error ${txtRes.status} for txt fallback`);
            throw new Error(`HTTP error ${res.status} for MD, ${txtRes.status} for TXT`);
          }
        } else {
          const markdownContent = await res.text();
          setModalText(markdownContent);
          console.log("Text content loaded from markdown file");
        }
      } catch (fetchError) {
        console.error("Full fetch error:", fetchError);
        setModalText(`Could not load text for this item. Error: ${fetchError.message}`);
      }
    } catch (e) {
      console.error("General error in handleObjectClick:", e);
      setModalText(`Failed to load content. Error: ${e.message}`);
    }
    
    setLoading(false);
  };

  // Close the modal
  const closeModal = () => {
    setModalOpen(false);
    setModalText("");
    setModalImg("");
    setModalTitle("");
  };

  // Add a function to toggle the box open/closed
  const toggleBoxState = () => {
    setIsBoxOpen(prev => !prev);
    console.log("Box state toggled:", !isBoxOpen);
  };
  
  if (loading) return <div className="boxWrap">Loading box...</div>;
  if (error) return <div className="boxWrap">Error: {error}</div>;
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
      
      {/* Show closed or open box based on isBoxOpen state */}
      {!isBoxOpen ? (
        <div className="closed-box-container" onClick={toggleBoxState}>
          <img 
            src={closedBoxImageUrl} 
            alt="Closed box" 
            onError={(e) => {
              console.error("Closed box image failed to load:", e);
              e.target.style.border = "2px solid red";
              e.target.style.width = "300px";
              e.target.style.height = "200px";
              e.target.style.background = "#ffeeee";
            }}
          />
          <div className="box-interaction-hint">Click to open</div>
        </div>
      ) : (
        <>
          <div 
            className="lid-icon" 
            onClick={toggleBoxState}
            title="Close box"
          >
            Close
          </div>
          
          <img 
            src={boxImageUrl} 
            className="layer" 
            alt="velvet box" 
            onError={(e) => {
              console.error("Box base image failed to load:", e);
              e.target.style.border = "2px solid red";
              e.target.style.width = "300px";
              e.target.style.height = "200px";
              e.target.style.background = "#ffeeee";
            }}
          />

          {/* Render the 7 object slots using the direct URL construction */}
          {CUP_POS.map((position, i) => {
            const imagePath = `${boxFolder}/img${i+1}.png`;
            // Try both URL methods
            const imageUrl = getSupabasePublicUrl('object-images', imagePath) || 
                            getDirectStorageUrl('object-images', imagePath);
            
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
                  console.error(`Object ${i+1} image failed to load:`, e);
                  e.target.style.border = "2px solid red";
                  e.target.style.background = "#ffeeee";
                }}
              />
            );
          })}
        </>
      )}
      
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
                  console.error("Modal image failed to load:", e);
                  e.target.style.border = "2px solid red";
                  e.target.style.background = "#ffeeee";
                }}
              />
            )}
            <div className="egg-modal-text">
              {loading ? "Loading..." : (
                <ReactMarkdown>
                  {modalText.replace(/\r\n/g, '\n')}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
