import React, { useState, useEffect } from "react";
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
  const [debugMode, setDebugMode] = useState(true);
  const [buckets, setBuckets] = useState([]);
  const [textFolderContents, setTextFolderContents] = useState([]);
  const [detailedError, setDetailedError] = useState(null);
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

  // Fetch the box data on mount
  useEffect(() => {
    const fetchBoxData = async () => {
      setLoading(true);
      setError("");
      setDetailedError(null);
      
      try {
        console.log("Supabase Client URL:", process.env.REACT_APP_SUPABASE_URL);
        console.log("Supabase Key Available:", process.env.REACT_APP_SUPABASE_ANON_KEY ? "Yes" : "No");
        
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
          console.log("Buckets found:", bucketsData);
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
        console.log("Box data:", currentBox);
        setBox(currentBox);
        
        // Get the folder name from the box record
        const folderName = currentBox.folder_name || "dickinson-birds";
        setBoxFolder(folderName);
        console.log("Using folder name:", folderName);
        
        // First, list the folder contents to see what's available
        const { data: files, error: listError } = await supabase
          .storage
          .from('object-images')
          .list(folderName);
        
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
        
        console.log("Files in image folder:", files);
        setFolderContents(files || []);

        // Also check the text folder to make sure it exists
        const { data: textFiles, error: textListError } = await supabase
          .storage
          .from('object-texts')
          .list(folderName);
        
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
        
        // Get the box base image URL
        const { publicURL: boxImageURL, error: urlError } = supabase
          .storage
          .from('object-images')
          .getPublicUrl(`${folderName}/box-base.jpg`);
        
        if (urlError) {
          console.error("Box image URL error:", urlError);
          setDetailedError({
            type: "image-url",
            message: urlError.message,
            details: urlError.details,
            path: `${folderName}/box-base.jpg`
          });
        } else {
          console.log("Box image URL:", boxImageURL);
        }
        
        setBoxImageUrl(boxImageURL);
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
  }, [detailedError]);

  const handleObjectClick = async (index) => {
    setModalOpen(true);
    setLoading(true);
    setModalText("");
    setModalTitle("");
    
    const fileIndex = index + 1;
    
    try {
      // Construct URLs for image and text based on the folder and index
      const imagePath = `${boxFolder}/img${fileIndex}.png`;
      const textPath = `${boxFolder}/text${fileIndex}.txt`;
      
      // Get image URL
      const { publicURL: imageURL, error: imgError } = supabase
        .storage
        .from('object-images')
        .getPublicUrl(imagePath);
      
      if (imgError) {
        console.error(`Error getting image URL for ${imagePath}:`, imgError);
      }
      
      setModalImg(imageURL);
      setModalTitle(`Item ${fileIndex}`);
      
      // Fetch text content - use the same folder structure as images
      const { publicURL: textURL, error: textUrlError } = supabase
        .storage
        .from('object-texts')
        .getPublicUrl(textPath);  // This will look for texts in the same subfolder
      
      if (textUrlError) {
        console.error(`Error getting text URL for ${textPath}:`, textUrlError);
      }
      
      try {
        console.log(`Fetching text from URL: ${textURL}`);
        const res = await fetch(textURL);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const text = await res.text();
        setModalText(text);
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

  // Always show the debug page
  if (debugMode) {
    return (
      <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif'}}>
        <h2>Scriptorium Debug Information</h2>
        
        <div style={{marginBottom: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f7f7f7'}}>
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
              
              const { publicURL } = supabase
                .storage
                .from('object-images')
                .getPublicUrl(testPath);
              
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
                __html: supabase.storage.from('object-images').getPublicUrl(`${boxFolder}/img1.png`).publicURL ? 
                  `<img src="${supabase.storage.from('object-images').getPublicUrl(`${boxFolder}/img1.png`).publicURL}" 
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
              const { publicURL } = supabase
                .storage
                .from('object-images')
                .getPublicUrl(imagePath);
              
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
              const textPath = `${boxFolder}/text${index}.txt`;
              const { publicURL } = supabase
                .storage
                .from('object-texts')
                .getPublicUrl(textPath);
              
              return (
                <div key={index} style={{marginBottom: '10px', padding: '5px', border: '1px solid #eee'}}>
                  <p>Text {index}:</p>
                  <p style={{fontSize: '10px'}}>{textPath}</p>
                  <p><a href={publicURL} target="_blank" rel="noopener noreferrer">Open Text URL</a></p>
                </div>
              );
            })}
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
      
      {boxImageUrl ? (
        <img 
          src={boxImageUrl} 
          className="layer" 
          alt="velvet box" 
        />
      ) : (
        <div className="loading-box">Loading box image...</div>
      )}

      {/* Render the 7 object slots using the naming convention */}
      {CUP_POS.map((position, i) => {
        const imagePath = `${boxFolder}/img${i+1}.png`;
        const imageUrl = supabase
          .storage
          .from('object-images')
          .getPublicUrl(imagePath).publicURL;
        
        // Add debugging console log
        console.log(`Rendering object ${i+1} from URL:`, imageUrl);
        
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
            onError={(e) => console.error(`Failed to load object ${i+1}`, e)}
          />
        );
      })}

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
              {loading ? "Loading..." : modalText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
