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
  const [urlCache, setUrlCache] = useState({});

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

  // Helper function to construct direct storage URLs without cache busting
  const getDirectStorageUrl = useCallback((bucketName, path) => {
    const cacheKey = `${bucketName}:${path}`;
    
    // Check URL cache first
    if (urlCache[cacheKey]) {
      console.log(`📥 Using cached URL for ${path}`);
      return urlCache[cacheKey];
    }

    console.log(`🔍 Requesting file from ${bucketName}: ${path}`);
    const baseUrl = process.env.REACT_APP_SUPABASE_URL;
    if (!baseUrl) {
      console.error("No REACT_APP_SUPABASE_URL available");
      return null;
    }
    
    const url = `${baseUrl}/storage/v1/object/public/${bucketName}/${path}`;
    
    // Cache the URL
    setUrlCache(prev => ({...prev, [cacheKey]: url}));
    
    console.log("📥 Generated URL:", url);
    return url;
  }, [urlCache]);

  // Use the Supabase method to get public URL
  const getSupabasePublicUrl = useCallback((bucketName, path) => {
    const cacheKey = `${bucketName}:${path}`;
    
    // Check URL cache first
    if (urlCache[cacheKey]) {
      console.log(`📥 Using cached URL for ${path}`);
      return urlCache[cacheKey];
    }

    console.log(`🔍 Getting Supabase URL for ${bucketName}: ${path}`);
    try {
      const { publicURL } = supabase.storage.from(bucketName).getPublicUrl(path);
      if (!publicURL) {
        console.log("No Supabase URL available, using direct URL");
        return getDirectStorageUrl(bucketName, path);
      }
      
      // Cache the URL
      setUrlCache(prev => ({...prev, [cacheKey]: publicURL}));
      
      console.log("📥 Generated Supabase URL:", publicURL);
      return publicURL;
    } catch (err) {
      console.error("Error getting Supabase public URL:", err);
      return getDirectStorageUrl(bucketName, path);
    }
  }, [urlCache, getDirectStorageUrl]);

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
      console.log("📦 Setting up box...");
      console.group("Box Setup Details");
      setLoading(true);
      setError("");
      setDetailedError(null);
      
      try {
        let currentBox;
        
        // If boxData is provided, use it directly
        if (boxData) {
          console.log("Using provided boxData:", boxData);
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
        console.log("📂 Using folder:", folderName);
        setBoxFolder(folderName);
        
        // Force refresh of Supabase storage listing to avoid caching
        const listOptions = {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        };
        
        try {
          // First, list the folder contents to see what's available
          console.log(`📝 Listing files in object-images/${folderName}`);
          const { data: files, error: listError } = await supabase
            .storage
            .from('object-images')
            .list(folderName, listOptions);
          
          if (listError) {
            console.error("Image folder listing error:", listError);
            throw new Error(`Could not list image folder contents: ${listError.message}`);
          }
          
          console.log("📸 Image files found:", files);
          setFolderContents(files || []);
        } catch (storageError) {
          console.error("Storage listing error:", storageError);
        }

        try {
          // Also check the text folder to make sure it exists
          console.log(`📝 Listing files in object-texts/${folderName}`);
          const { data: textFiles, error: textListError } = await supabase
            .storage
            .from('object-texts')
            .list(folderName, listOptions);
          
          if (textListError) {
            console.error("Text folder listing error:", textListError);
            console.log("Warning: Could not list text folder contents");
          } else {
            console.log("📄 Text files found:", textFiles);
            setTextFolderContents(textFiles || []);
          }
        } catch (textStorageError) {
          console.error("Text storage listing error:", textStorageError);
        }
        
        // Try only one method to get URLs
        try {
          // Use only one method to get URLs
          const boxImageURL = getSupabasePublicUrl('object-images', `${folderName}/box-base.jpg`);
          console.log("📥 Box base image URL:", boxImageURL);
          setBoxImageUrl(boxImageURL);
          
          // Get the closed box image URL
          const closedBoxImageURL = getSupabasePublicUrl('object-images', `${folderName}/closed-box.png`);
          setClosedBoxImageUrl(closedBoxImageURL);
          console.log("📥 Closed box image URL:", closedBoxImageURL);
        } catch (urlError) {
          console.error("Error constructing URLs:", urlError);
        }
      } catch (e) {
        console.error("General error in setupBox:", e);
        setError(e.message || "Failed to load box data.");
      }
      
      setLoading(false);
      console.groupEnd();
    };
    
    setupBox();

    // Cleanup function to handle component unmounting
    return () => {
      console.log("🧹 Cleaning up box setup effect");
      setLoading(false);
      setError("");
      setDetailedError(null);
      setFolderContents([]);
      setTextFolderContents([]);
    };
  }, [boxData, getDirectStorageUrl, getSupabasePublicUrl]); // Only run when boxData or URL functions change
  
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
      
      // Use single method for URL construction
      const imageURL = getSupabasePublicUrl('object-images', imagePath);
      console.log("Using image URL:", imageURL);
      setModalImg(imageURL);
      setModalTitle(`Item ${fileIndex}`);
      
      // Check localStorage first for cached text content
      const cacheKey = `${boxFolder}-text-${fileIndex}`;
      const cachedContent = localStorage.getItem(cacheKey);
      
      if (cachedContent) {
        console.log("Using cached text content");
        setModalText(cachedContent);
        setLoading(false);
        return;
      }
      
      // If not in cache, fetch from Supabase
      const textURL = getSupabasePublicUrl('object-texts', textPath);
      
      try {
        console.log("Fetching text from URL:", textURL);
        // Allow browser caching
        const res = await fetch(textURL);
        
        if (!res.ok) {
          console.log(`Markdown fetch failed with status ${res.status}, trying txt fallback`);
          // Try .txt fallback
          const txtPath = `${boxFolder}/text${fileIndex}.txt`;
          const txtURL = getSupabasePublicUrl('object-texts', txtPath);
          
          console.log("Trying txt URL:", txtURL);
          const txtRes = await fetch(txtURL);
          
          if (txtRes.ok) {
            const txtContent = await txtRes.text();
            // Cache the content
            try {
              localStorage.setItem(cacheKey, txtContent);
            } catch (cacheError) {
              console.warn("Could not cache text content:", cacheError);
            }
            setModalText(txtContent);
            console.log("Text content loaded from txt file");
          } else {
            console.error(`HTTP error ${txtRes.status} for txt fallback`);
            throw new Error(`HTTP error ${res.status} for MD, ${txtRes.status} for TXT`);
          }
        } else {
          const markdownContent = await res.text();
          // Cache the content
          try {
            localStorage.setItem(cacheKey, markdownContent);
          } catch (cacheError) {
            console.warn("Could not cache text content:", cacheError);
          }
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
            const imageUrl = getSupabasePublicUrl('object-images', imagePath);
            
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
