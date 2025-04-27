import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { fetchObjects } from '../utils/supabase';
import { CUP_MAP } from '../utils/cupMap';
import Modal from './Modal';

const BoxWrapper = styled.div`
  position: relative;
  width: 80vmin;
  max-width: 900px;
  margin: 0 auto;
  
  @media (max-width: 600px) {
    width: 95vmin;
  }
`;

const BoxBackground = styled.img`
  width: 100%;
  display: block;
`;

const Egg = styled.img`
  position: absolute;
  transform: translate(-50%, -65%);
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translate(-50%, -65%) scale(1.05);
  }
  
  /* Add slight perspective tilt to back row eggs */
  &.back-row {
    transform: translate(-50%, -65%) perspective(700px) rotateX(12deg);
    
    &:hover {
      transform: translate(-50%, -65%) perspective(700px) rotateX(12deg) scale(1.05);
    }
  }
`;

const BoxMask = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  pointer-events: none;
  z-index: 2;
`;

const LoadingMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  text-shadow: 0 0 5px rgba(0,0,0,0.7);
  font-size: 1.2rem;
`;

const Box = () => {
  const [objects, setObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalInfo, setModalInfo] = useState({ isOpen: false, object: null });
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const wrapperRef = React.useRef(null);

  // Load objects
  useEffect(() => {
    const loadObjects = async () => {
      try {
        const objectsData = await fetchObjects();
        
        if (!objectsData || objectsData.length === 0) {
          // If no data returned, use mock data
          setObjects(getMockObjects());
        } else {
          setObjects(objectsData);
        }
      } catch (err) {
        console.error('Error loading objects:', err);
        setError(err.message);
        // Use mock data on error
        setObjects(getMockObjects());
      } finally {
        setIsLoading(false);
      }
    };

    loadObjects();
  }, []);

  // Update wrapper size on mount and window resize
  useEffect(() => {
    const updateSize = () => {
      if (wrapperRef.current) {
        setWrapperSize({
          width: wrapperRef.current.offsetWidth,
          height: wrapperRef.current.offsetHeight
        });
      }
    };

    // Initial size
    updateSize();

    // Add resize listener
    window.addEventListener('resize', updateSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Mock data function
  const getMockObjects = () => {
    return Array(7).fill(null).map((_, index) => ({
      id: index + 1,
      name: `Sample Object ${index + 1}`,
      image_url: null,
      opened_image_url: null,
      description: `This is a sample object for testing. No Supabase connection available.`
    }));
  };

  const handleEggClick = (object) => {
    setModalInfo({
      isOpen: true,
      object
    });
  };

  const handleCloseModal = () => {
    setModalInfo({
      isOpen: false,
      object: null
    });
  };

  // Force cache refresh with a unique timestamp
  const getEggImagePath = () => '/images/robin-egg.png?v=' + Date.now();

  // Determine if an egg is in the back row (for perspective tilt)
  const isBackRow = (index) => {
    // Cups 0, 1, 2 are in the back row
    return index <= 2;
  };

  if (error && !objects.length) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3>Error loading content:</h3>
        <p>{error}</p>
        <p>Displaying demo content instead.</p>
      </div>
    );
  }

  return (
    <>
      <BoxWrapper ref={wrapperRef}>
        <BoxBackground src="/images/open_box.jpg" alt="Open Box" />
        
        {isLoading ? (
          <LoadingMessage>Loading treasures...</LoadingMessage>
        ) : (
          objects.slice(0, 7).map((object, index) => {
            const cup = CUP_MAP[index];
            if (!cup) return null;
            
            // Calculate position and size based on cup map
            const left = cup.cx * wrapperSize.width;
            const top = cup.cy * wrapperSize.height;
            const diameter = cup.r * 2 * 1.1 * wrapperSize.width; // 1.1x cup diameter
            
            return (
              <Egg
                key={object.id}
                src={getEggImagePath()}
                alt={`Robin's Egg ${index + 1}`}
                className={isBackRow(index) ? 'back-row' : ''}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${diameter}px`,
                }}
                onClick={() => handleEggClick(object)}
              />
            );
          })
        )}
        
        {/* Box lip mask - optional, uncomment if you add this image */}
        {/* <BoxMask src="/images/box-lip-mask.png" alt="" /> */}
      </BoxWrapper>
      
      {modalInfo.isOpen && (
        <Modal
          onClose={handleCloseModal}
          imageUrl={getEggImagePath()}
          title="Robin's Egg"
          description="A beautiful robin's egg with a speckled blue shell."
        />
      )}
    </>
  );
};

export default Box; 