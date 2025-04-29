import React, { useState, useEffect, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
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
  const [folderContents, setFolderContents] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [buckets, setBuckets] = useState([]);
  const [textFolderContents, setTextFolderContents] = useState([]);
  const [detailedError, setDetailedError] = useState(null);
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [closedBoxImageUrl, setClosedBoxImageUrl] = useState("");
  const [supabaseInfo] = useState({
    url: process.env.REACT_APP_SUPABASE_URL || "Not set",
    hasKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? "Key is set" : "Key is missing",
    fullInfo: true
  });

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
    const baseUrl = process.env.REACT_APP_SUPABASE_URL;
    if (!baseUrl) return null;
    
    // Add cache busting parameter with current timestamp
    const timestamp = new Date().getTime();
    return `${baseUrl}/storage/v1/object/public/${bucketName}/${path}?t=${timestamp}`;
  }, []);

  // Debug console logging helper
  const debugLog = useCallback((...args) => {
    if (debugMode) {
      console.log(...args);
    }
  }, [debugMode]);

  // Check URL for a debug parameter on component mount
  useEffect(() => {
    // Check if there's a debug=true parameter in the URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setDebugMode(true);
      console.log("Debug mode enabled via URL parameter");
    }
  }, []);

  // Fetch the box data on mount
  useEffect(() => {
    const fetchBoxData = async () => {
      setLoading(true);
      setError("");
      setDetailedError(null);
      
      try {
        debugLog("Supabase Client URL:", process.env.REACT_APP_SUPABASE_URL);
        debugLog("Supabase Key Available:", process.env.REACT_APP_SUPABASE_ANON_KEY ? "Yes" : "No");
        
        // Get all available buckets for debugging
        const { data: bucketsData, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          console.error("Bucket listing error:", bucketsError);
          setDetailedError({
            type: "buckets",
            message: bucketsError.message,
            details: bucketsError.details
          });
        } else {
          debugLog("Buckets found:", bucketsData);
          setBuckets(bucketsData || []);
        }
        
        // Fetch the first box
        const { data: boxes, error: boxError } = await supabase
          .from("boxes")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1);
        
        if (boxError) {
          console.error("Box fetch error:", boxError);
          setDetailedError({
            type: "database",
            message: boxError.message,
            details: boxError.details
          });
          throw boxError;
        }
        
        if (!boxes || boxes.length === 0) throw new Error("No boxes found.");
        
        const currentBox = boxes[0];
        debugLog("Box data:", currentBox);
        setBox(currentBox);
        
        // Get the folder name from the box record
        const folderName = currentBox.folder_name || "dickinson-birds";
        setBoxFolder(folderName);
        debugLog("Using folder name:", folderName);
        
        // Force refresh of Supabase storage listing to avoid caching
        const listOptions = {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        };
        
        // First, list the folder contents to see what's available
        const { data: files, error: listError } = await supabase
          .storage
          .from('object-images')
          .list(folderName, listOptions);
        
        if (listError) {
          console.error("Image folder listing error:", listError);
          setDetailedError({
            type: "image-folder-listing",
            message: listError.message,
            details: listError.details,
            folderPath: folderName
          });
          throw new Error(`Could not list image folder contents: ${listError.message}`);
        }
        
        debugLog("Files in image folder:", files);
        setFolderContents(files || []);

        // Also check the text folder to make sure it exists
        const { data: textFiles, error: textListError } = await supabase
          .storage
          .from('object-texts')
          .list(folderName, listOptions);
        
        if (textListError) {
          console.error("Text folder listing error:", textListError);
          setDetailedError({
            type: "text-folder-listing",
            message: textListError.message,
            details: textListError.details,
            folderPath: folderName
          });
          console.log("Warning: Could not list text folder contents");
          
          // Try to create the folder in object-texts if it doesn't exist
          try {
            console.log("Attempting to create text folder:", folderName);
            const { error: createError } = await supabase
              .storage
              .from('object-texts')
              .upload(`${folderName}/.emptyFolderPlaceholder`, new Blob(['']));
              
            if (createError) {
              console.error("Failed to create text folder:", createError);
            } else {
              console.log("Successfully created text folder placeholder");
            }
          } catch (createFolderError) {
            console.error("Create folder attempt failed:", createFolderError);
          }
        } else {
          setTextFolderContents(textFiles || []);
          console.log(`Found ${textFiles?.length || 0} text files in ${folderName}`);
        }
        
        // Get the box base image URL using direct URL construction instead of Supabase
        const boxImageURL = getDirectStorageUrl('object-images', `${folderName}/box-base.jpg`);
        debugLog("Box image URL:", boxImageURL);
        setBoxImageUrl(boxImageURL);
        
        // Get the closed box image URL
        const closedBoxImageURL = getDirectStorageUrl('object-images', `${folderName}/closed-box.png`);
        debugLog("Closed box image URL:", closedBoxImageURL);
        setClosedBoxImageUrl(closedBoxImageURL);
      } catch (e) {
        console.error("General error in fetchBoxData:", e);
        setError(e.message || "Failed to load box data.");
        if (!detailedError) {
          setDetailedError({
            type: "unknown",
            message: e.message,
            stack: e.stack
          });
        }
      }
      setLoading(false);
    };
    
    fetchBoxData();
  }, [debugLog, getDirectStorageUrl, detailedError]);

  const handleObjectClick = async (index) => {
    setModalOpen(true);
    setLoading(true);
    setModalText("");
    setModalTitle("");
    
    const fileIndex = index + 1;
    
    try {
      // Construct URLs for image and text based on the folder and index
      const imagePath = `${boxFolder}/img${fileIndex}.png`;
      const textPath = `${boxFolder}/text${fileIndex}.md`;
      
      // Use direct URL construction instead of Supabase getPublicUrl
      const imageURL = getDirectStorageUrl('object-images', imagePath);
      
      setModalImg(imageURL);
      setModalTitle(`Item ${fileIndex}`);
      
      // Use direct URL construction for text URL too
      const textURL = getDirectStorageUrl('object-texts', textPath);
      
      try {
        debugLog(`Fetching text from URL: ${textURL}`);
        // Add cache control headers to the fetch request
        const res = await fetch(textURL, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (!res.ok) {
          // If .md file is not found, try .txt as fallback for backward compatibility
          const txtURL = getDirectStorageUrl('object-texts', `${boxFolder}/text${fileIndex}.txt`);
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
          } else {
            throw new Error(`HTTP error ${res.status}`);
          }
        } else {
          const markdownContent = await res.text();
          setModalText(markdownContent);
        }
      } catch (fetchError) {
        console.error(`Error fetching text: ${fetchError.message}`);
        setModalText(`Could not load text for this item. Error: ${fetchError.message}`);
      }
    } catch (e) {
      console.error(`General error in handleObjectClick: ${e.message}`);
      setModalText(`Failed to load content. Error: ${e.message}`);
    }
    
    setLoading(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalText("");
    setModalImg("");
    setModalTitle("");
  };

  // Add a cache-clearing utility function
  const clearBrowserCache = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await window.caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            return window.caches.delete(cacheName);
          })
        );
        alert('Browser cache cleared! Refreshing page...');
        window.location.reload(true);
      } catch (e) {
        console.error('Failed to clear cache:', e);
        alert('Failed to clear cache. Try refreshing manually with Ctrl+F5');
      }
    } else {
      alert('Cache API not supported in this browser. Try refreshing manually with Ctrl+F5');
    }
  }, []);

  // Toggle box open/closed state
  const toggleBoxState = () => {
    setIsBoxOpen(prev => !prev);
  };

  // Always show the debug page
  if (debugMode) {
    return (
      <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif'}}>
        <h2>Scriptorium Debug Information</h2>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f7f7f7'}}>
          <h3>Box State Controls</h3>
          <p>Current State: <strong>{isBoxOpen ? 'Open' : 'Closed'}</strong></p>
          <button 
            onClick={toggleBoxState}
            style={{
              padding: '8px 15px', 
              background: isBoxOpen ? '#dc3545' : '#28a745', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            {isBoxOpen ? 'Close Box' : 'Open Box'}
          </button>
          <div style={{marginTop: '10px'}}>
            <p><strong>Box Images:</strong></p>
            <div style={{display: 'flex', gap: '15px', marginTop: '8px'}}>
              <div>
                <p>Closed Box:</p>
                <img 
                  src={closedBoxImageUrl} 
                  alt="Closed Box" 
                  style={{
                    maxWidth: '100px', 
                    border: '1px solid #ccc',
                    opacity: isBoxOpen ? 0.5 : 1
                  }}
                />
              </div>
              <div>
                <p>Open Box:</p>
                <img 
                  src={boxImageUrl} 
                  alt="Open Box" 
                  style={{
                    maxWidth: '100px', 
                    border: '1px solid #ccc',
                    opacity: isBoxOpen ? 1 : 0.5
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f7f7f7'}}>
          <h3>Cache Control</h3>
          <p>Having trouble seeing updated content? Try the tools below:</p>
          <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
            <button 
              onClick={clearBrowserCache}
              style={{padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Clear Browser Cache
            </button>
            <button 
              onClick={() => window.location.reload(true)}
              style={{padding: '10px', backgroundColor: '#0275d8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Force Refresh
            </button>
          </div>
          <p style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
            <strong>Note:</strong> All content requests now include cache-busting parameters and headers. The timestamp for current requests is: {new Date().getTime()}
          </p>
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Supabase Configuration</h3>
          <p><strong>Supabase URL:</strong> {supabaseInfo.url}</p>
          <p><strong>Supabase Key Status:</strong> {supabaseInfo.hasKey}</p>
          <p><strong>Environment Variables Present:</strong> {process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY ? "Both URL and key are set" : "Missing one or both variables"}</p>
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Box Information</h3>
          {box ? (
            <div>
              <p><strong>Title:</strong> {box.title || "Untitled"}</p>
              <p><strong>Folder Name:</strong> {boxFolder}</p>
              <p><strong>Box ID:</strong> {box.id}</p>
            </div>
          ) : (
            <p>No box found or still loading...</p>
          )}
        </div>
        
        {detailedError && (
          <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #f00', backgroundColor: '#fff0f0'}}>
            <h3>Detailed Error Information</h3>
            <p><strong>Error Type:</strong> {detailedError.type}</p>
            <p><strong>Message:</strong> {detailedError.message}</p>
            {detailedError.details && <p><strong>Details:</strong> {JSON.stringify(detailedError.details)}</p>}
            {detailedError.path && <p><strong>Path:</strong> {detailedError.path}</p>}
            {detailedError.folderPath && <p><strong>Folder Path:</strong> {detailedError.folderPath}</p>}
            {detailedError.stack && (
              <div>
                <p><strong>Stack:</strong></p>
                <pre style={{overflowX: 'auto'}}>{detailedError.stack}</pre>
              </div>
            )}
          </div>
        )}
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Storage Buckets Available:</h3>
          {buckets.length > 0 ? (
            <ul>
              {buckets.map((bucket, i) => (
                <li key={i}>{bucket.name}</li>
              ))}
            </ul>
          ) : (
            <p>No buckets found or error retrieving buckets</p>
          )}
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Storage Information</h3>
          <p><strong>Expected Box Image Path:</strong> {boxFolder}/box-base.jpg <span style={{color: 'gray'}}>(in object-images bucket)</span></p>
          <p><strong>Box Image URL:</strong> <a href={boxImageUrl} target="_blank" rel="noopener noreferrer">{boxImageUrl || "Not loaded"}</a></p>
          <p><strong>Expected Object Images:</strong> {boxFolder}/img1.png, {boxFolder}/img2.png, etc. <span style={{color: 'gray'}}>(in object-images bucket)</span></p>
          <p><strong>Expected Text Files:</strong> <span style={{color: 'blue'}}>{boxFolder}/text1.txt, {boxFolder}/text2.txt, etc. (in object-texts bucket)</span></p>
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Files Found in Image Folder "{boxFolder}": <span style={{color: 'gray'}}>(in object-images bucket)</span></h3>
          {folderContents.length > 0 ? (
            <ul>
              {folderContents.map((file, i) => (
                <li key={i}>{file.name}</li>
              ))}
            </ul>
          ) : (
            <p>No files found in this folder or folder doesn't exist</p>
          )}
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Files Found in Text Folder "{boxFolder}": <span style={{color: 'gray'}}>(in object-texts bucket)</span></h3>
          {textFolderContents.length > 0 ? (
            <ul>
              {textFolderContents.map((file, i) => (
                <li key={i}>{file.name}</li>
              ))}
            </ul>
          ) : (
            <p>No text files found in this folder or folder doesn't exist</p>
          )}
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f0f8ff'}}>
          <h3>Storage Permission Tests</h3>
          <p>These tests can help identify Supabase bucket permission issues:</p>
          
          <div style={{marginTop: '10px'}}>
            <h4>Test 1: Direct URL Access</h4>
            <p>Try opening these directly in a new tab to test public permissions:</p>
            {[0,1,2,3].map(index => {
              const testPath = index === 0 
                ? `${boxFolder}/box-base.jpg` 
                : `${boxFolder}/img${index}.png`;
              
              const publicURL = getDirectStorageUrl('object-images', testPath);
              
              return (
                <div key={index} style={{margin: '5px 0', padding: '5px', border: '1px solid #ddd'}}>
                  <p style={{fontSize: '12px', marginBottom: '5px'}}><strong>File: </strong>{testPath}</p>
                  <p style={{fontSize: '12px', marginBottom: '5px', wordBreak: 'break-all'}}>
                    <strong>Full URL: </strong>
                    <a href={publicURL} target="_blank" rel="noopener noreferrer">{publicURL}</a>
                  </p>
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch(publicURL);
                        if (response.ok) {
                          alert(`Success! The URL is accessible (${response.status})`);
                        } else {
                          alert(`Error! Status: ${response.status} - ${response.statusText}`);
                        }
                      } catch (error) {
                        alert(`Fetch error: ${error.message}`);
                      }
                    }}
                    style={{padding: '5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px'}}
                  >
                    Test URL Fetch
                  </button>
                </div>
              );
            })}
          </div>
          
          <div style={{marginTop: '20px'}}>
            <h4>Test 2: Bucket Policy</h4>
            <p>Your Supabase storage bucket policies should have these settings:</p>
            <pre style={{backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto'}}>
{`FOR bucket_id = 'object-images'
TO "anon"
USING ( true )
WITH CHECK ( true )`}
            </pre>
            <p><strong>Note:</strong> Check your Supabase dashboard: Storage → Policies → object-images bucket</p>
          </div>
          
          <div style={{marginTop: '20px'}}>
            <h4>Test 3: Manual Image Embedding Test</h4>
            <p>This bypasses React's image handling to test direct HTML embedding:</p>
            
            <div style={{marginTop: '10px', padding: '10px', border: '1px dashed #ccc'}}>
              <p>Box Base Image (Manual HTML):</p>
              <div dangerouslySetInnerHTML={{
                __html: boxImageUrl ? 
                  `<img src="${boxImageUrl}" alt="Direct HTML Test" style="max-width:150px; border:1px solid blue;" />` :
                  "<p>No URL available</p>"
              }} />
              
              <p style={{marginTop: '10px'}}>Object 1 Image (Manual HTML):</p>
              <div dangerouslySetInnerHTML={{
                __html: getDirectStorageUrl('object-images', `${boxFolder}/img1.png`) ? 
                  `<img src="${getDirectStorageUrl('object-images', `${boxFolder}/img1.png`)}" 
                        alt="Direct HTML Test" style="max-width:150px; border:1px solid blue;" />` :
                  "<p>No URL available</p>"
              }} />
            </div>
          </div>
          
          <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#fffaf0', border: '1px solid #ffa500'}}>
            <h4>URL Structure Investigation (404 Error Help)</h4>
            <p>If you're getting 404 errors, let's check the URL structure:</p>
            
            <div style={{marginTop: '10px'}}>
              <h5>1. Base URL Check</h5>
              <p style={{fontSize: '14px'}}>Your Supabase project URL should look like: <code>https://[project-id].supabase.co</code></p>
              <p style={{fontSize: '14px'}}>Your environment has: <code>{process.env.REACT_APP_SUPABASE_URL || "Not set in environment"}</code></p>
            </div>
            
            <div style={{marginTop: '15px'}}>
              <h5>2. Full URL Analysis</h5>
              {(() => {
                const testPath = `${boxFolder}/box-base.jpg`;
                const url = supabase.storage.from('object-images').getPublicUrl(testPath).publicURL;
                
                // Parse URL to check components
                let urlParts = null;
                try {
                  const parsedUrl = new URL(url);
                  urlParts = {
                    protocol: parsedUrl.protocol,
                    host: parsedUrl.host,
                    pathname: parsedUrl.pathname,
                    full: url
                  };
                } catch (e) {
                  console.error("URL parsing error:", e);
                }
                
                return (
                  <div>
                    <p style={{fontSize: '14px', marginBottom: '5px'}}><strong>For file:</strong> {testPath}</p>
                    {urlParts ? (
                      <div style={{fontSize: '14px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px'}}>
                        <p><strong>Protocol:</strong> {urlParts.protocol}</p>
                        <p><strong>Host:</strong> {urlParts.host}</p>
                        <p><strong>Path:</strong> {urlParts.pathname}</p>
                        <p><strong>Full URL:</strong> <code style={{wordBreak: 'break-all'}}>{urlParts.full}</code></p>
                      </div>
                    ) : (
                      <p>Could not parse URL: {url || "No URL generated"}</p>
                    )}
                  </div>
                );
              })()}
            </div>
            
            <div style={{marginTop: '15px'}}>
              <h5>3. Alternative URL Test</h5>
              <p style={{fontSize: '14px'}}>Let's try constructing a URL manually:</p>
              
              {(() => {
                const baseUrl = process.env.REACT_APP_SUPABASE_URL || "";
                // Construct a URL in the format that Supabase typically uses
                const manualUrl = baseUrl 
                  ? `${baseUrl}/storage/v1/object/public/object-images/${boxFolder}/box-base.jpg`
                  : "Cannot construct URL without REACT_APP_SUPABASE_URL";
                  
                return (
                  <div>
                    <p style={{fontSize: '14px', wordBreak: 'break-all'}}>
                      <strong>Manual URL:</strong> <code>{manualUrl}</code>
                    </p>
                    <button
                      onClick={async () => {
                        if (!baseUrl) {
                          alert("Cannot test without base URL");
                          return;
                        }
                        try {
                          const response = await fetch(manualUrl);
                          if (response.ok) {
                            alert(`Success with manual URL! (${response.status})`);
                          } else {
                            alert(`Error with manual URL! Status: ${response.status} - ${response.statusText}`);
                          }
                        } catch (error) {
                          alert(`Fetch error with manual URL: ${error.message}`);
                        }
                      }}
                      style={{padding: '5px 10px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '4px', marginTop: '5px'}}
                    >
                      Test Manual URL
                    </button>
                  </div>
                );
              })()}
            </div>
            
            <div style={{marginTop: '15px'}}>
              <h5>4. Common 404 Fixes:</h5>
              <ul style={{fontSize: '14px'}}>
                <li>Verify the bucket is named exactly <strong>object-images</strong> (case-sensitive)</li>
                <li>Check if the folder path <strong>{boxFolder}</strong> exists exactly as spelled</li>
                <li>Confirm file names match exactly (case-sensitive): <strong>box-base.jpg</strong>, <strong>img1.png</strong>, etc.</li>
                <li>If using file IDs in URLs, try switching to the folder/filename approach</li>
                <li>Verify your Supabase project URL is correct in your environment variables</li>
              </ul>
            </div>
            
            <div style={{marginTop: '15px'}}>
              <h5>5. URL Path Variation Tests</h5>
              <p style={{fontSize: '14px'}}>Let's try different URL path variations to find the correct format:</p>
              
              {(() => {
                const baseUrl = process.env.REACT_APP_SUPABASE_URL || "";
                if (!baseUrl) return <p>Cannot test without base URL in environment variables</p>;
                
                // Different path variations to try
                const variations = [
                  {
                    name: "Standard path",
                    url: `${baseUrl}/storage/v1/object/public/object-images/${boxFolder}/box-base.jpg`
                  },
                  {
                    name: "Without folder",
                    url: `${baseUrl}/storage/v1/object/public/object-images/box-base.jpg`
                  },
                  {
                    name: "With auth path",
                    url: `${baseUrl}/storage/v1/object/authenticated/object-images/${boxFolder}/box-base.jpg`
                  },
                  {
                    name: "Without v1",
                    url: `${baseUrl}/storage/object/public/object-images/${boxFolder}/box-base.jpg`
                  },
                  {
                    name: "Download URL",
                    url: `${baseUrl}/storage/v1/object/download/object-images/${boxFolder}/box-base.jpg`
                  }
                ];
                
                return (
                  <div style={{marginTop: '10px'}}>
                    {variations.map((variation, index) => (
                      <div key={index} style={{marginBottom: '10px', padding: '5px', borderBottom: '1px solid #ddd'}}>
                        <p style={{fontSize: '14px'}}><strong>{variation.name}:</strong></p>
                        <p style={{fontSize: '12px', wordBreak: 'break-all', backgroundColor: '#f0f0f0', padding: '5px'}}>
                          <code>{variation.url}</code>
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(variation.url);
                              if (response.ok) {
                                alert(`Success with ${variation.name}! (${response.status})`);
                              } else {
                                alert(`Error with ${variation.name}! Status: ${response.status} - ${response.statusText}`);
                              }
                            } catch (error) {
                              alert(`Fetch error with ${variation.name}: ${error.message}`);
                            }
                          }}
                          style={{padding: '3px 8px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '4px', marginTop: '3px', fontSize: '12px'}}
                        >
                          Test This Variation
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Testing Image Loading</h3>
          <div>
            <p><strong>Basic authentication test:</strong></p>
            <button
              onClick={async () => {
                const { data, error } = await supabase.auth.getSession();
                console.log("Current session:", data, error);
                alert(error 
                  ? `Error: ${error.message}` 
                  : `Session: ${data?.session ? "Active" : "None"}`);
              }}
              style={{padding: '5px 10px', margin: '5px 0', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px'}}
            >
              Check Authentication
            </button>
          </div>
          
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px'}}>
            <div>
              <p>Box Base Image:</p>
              <img 
                src={boxImageUrl} 
                alt="Base Box" 
                style={{maxWidth: '100px', border: '1px solid #ccc'}}
                onError={(e) => {
                  console.error("Failed to load box image", e);
                  e.target.style.border = "2px solid red";
                  e.target.style.padding = "10px";
                  e.target.style.background = "#ffeeee";
                }}
              />
              <p style={{fontSize: '10px'}}>{boxFolder}/box-base.jpg</p>
              <p style={{fontSize: '10px', color: boxImageUrl ? 'green' : 'red'}}>
                URL: {boxImageUrl || "Not generated"}
              </p>
            </div>
            
            {[1,2,3,4,5,6,7].map(index => {
              const imagePath = `${boxFolder}/img${index}.png`;
              const publicURL = getDirectStorageUrl('object-images', imagePath);
              
              // Log each URL for debugging
              console.log(`Object ${index} URL:`, publicURL);
              
              return (
                <div key={index}>
                  <p>Object {index}:</p>
                  <img 
                    src={publicURL} 
                    alt={`Object ${index}`}
                    style={{maxWidth: '100px', border: '1px solid #ccc'}}
                    onError={(e) => {
                      console.error(`Failed to load object ${index} image`, e);
                      e.target.style.border = "2px solid red";
                      e.target.style.padding = "10px";
                      e.target.style.background = "#ffeeee";
                    }}
                  />
                  <p style={{fontSize: '10px'}}>{imagePath}</p>
                  <p style={{fontSize: '10px', color: publicURL ? 'green' : 'red'}}>
                    URL: {publicURL ? (publicURL.length > 30 ? publicURL.substring(0, 30) + '...' : publicURL) : "Not generated"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc'}}>
          <h3>Testing Text Files</h3>
          <div>
            {[1,2,3,4,5,6,7].map(index => {
              const mdPath = `${boxFolder}/text${index}.md`;
              const txtPath = `${boxFolder}/text${index}.txt`;
              const mdUrl = getDirectStorageUrl('object-texts', mdPath);
              const txtUrl = getDirectStorageUrl('object-texts', txtPath);
              
              return (
                <div key={index} style={{marginBottom: '10px', padding: '5px', border: '1px solid #eee'}}>
                  <p>Text {index}:</p>
                  <p style={{fontSize: '10px'}}>{mdPath} <span style={{color: 'green'}}>(preferred)</span></p>
                  <p><a href={mdUrl} target="_blank" rel="noopener noreferrer">Open Markdown URL</a></p>
                  <p style={{fontSize: '10px', marginTop: '5px'}}>{txtPath} <span style={{color: 'orange'}}>(fallback)</span></p>
                  <p><a href={txtUrl} target="_blank" rel="noopener noreferrer">Open Text URL</a></p>
                  <div style={{marginTop: '10px', fontSize: '12px', backgroundColor: '#f8f8f8', padding: '5px', borderRadius: '3px'}}>
                    <p><strong>Note:</strong> The app will first try to load .md files, then fall back to .txt files if needed.</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{marginTop: '20px', padding: '10px', backgroundColor: '#e6f7ff', borderRadius: '4px'}}>
            <h4>Markdown Sample Preview</h4>
            <div style={{backgroundColor: 'white', padding: '10px', border: '1px solid #ddd', marginTop: '10px'}}>
              <ReactMarkdown>
                {`# Sample Markdown
                
## This is a heading

This is **bold** text and this is *italic* text.

### Lists
- Item 1
- Item 2
  - Nested item

### Links
[Visit Supabase](https://supabase.io)

### Code
\`\`\`
const message = "Hello World";
console.log(message);
\`\`\`

> This is a blockquote that shows how quotes would appear.

![Image description](https://via.placeholder.com/150)
`}
              </ReactMarkdown>
            </div>
          </div>
        </div>
        
        <div style={{marginTop: '20px'}}>
          <button 
            onClick={() => setDebugMode(false)}
            style={{padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
          >
            View Normal Application
          </button>
        </div>
      </div>
    );
  }

  // Show a helpful error page if there's an issue
  if (error) {
    return (
      <div style={{padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif'}}>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <div style={{marginTop: '20px'}}>
          <h3>Please check:</h3>
          <ol>
            <li>Your Supabase storage has a folder named: <strong>{boxFolder || "dickinson-birds"}</strong></li>
            <li>Inside that folder, you have a file named: <strong>box-base.jpg</strong></li>
            <li>Inside that folder, you have image files named: <strong>img1.png, img2.png, etc.</strong></li>
            <li>In your object-texts bucket, in a folder named <strong>{boxFolder}</strong>, you have text files named: <strong>text1.txt, text2.txt, etc.</strong></li>
          </ol>
          <p>Files found in your folder:</p>
          <ul>
            {folderContents.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        </div>
        <div style={{marginTop: '20px'}}>
          <button 
            onClick={() => setDebugMode(true)}
            style={{padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
          >
            Show Debug Information
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="boxWrap">Loading box...</div>;
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
      
      {/* Show closed or open box based on state */}
      {!isBoxOpen ? (
        // Closed box view
        <div className="closed-box-container">
          <img 
            src={closedBoxImageUrl} 
            className="layer" 
            alt="closed box" 
            onClick={toggleBoxState} 
          />
          <div className="box-interaction-hint">Click to open</div>
        </div>
      ) : (
        // Open box view (existing content)
        <>
          <img 
            src={boxImageUrl} 
            className="layer" 
            alt="velvet box" 
          />

          {/* Render the 7 object slots using the direct URL construction */}
          {CUP_POS.map((position, i) => {
            const imagePath = `${boxFolder}/img${i+1}.png`;
            // Use direct URL construction instead of Supabase getPublicUrl
            const imageUrl = getDirectStorageUrl('object-images', imagePath);
            
            // Add debugging console log
            debugLog(`Rendering object ${i+1} from URL:`, imageUrl);
            
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
                onError={(e) => debugMode && console.error(`Failed to load object ${i+1}`, e)}
              />
            );
          })}
          
          {/* Lid icon to close the box */}
          <div className="lid-icon" onClick={toggleBoxState} title="Close box">
            <span className="lid-icon-text">Close Box</span>
          </div>
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
              />
            )}
            <div className="egg-modal-text">
              {loading ? "Loading..." : (
                <ReactMarkdown 
                  components={{
                    // Customize paragraph handling to control spacing
                    p: ({node, ...props}) => <p style={{marginTop: '0.5em', marginBottom: '0.5em'}} {...props} />
                  }}
                >
                  {/* Normalize line endings to prevent spacing issues */}
                  {modalText.replace(/\r\n/g, '\n')}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Small developer note at the bottom */}
      <div style={{
        position: 'fixed', 
        bottom: '5px', 
        right: '5px', 
        fontSize: '10px', 
        color: 'rgba(0,0,0,0.3)',
        padding: '3px',
        background: 'rgba(255,255,255,0.5)',
        borderRadius: '3px'
      }}>
        For debugging: Add ?debug=true to URL
      </div>
    </div>
  );
}
