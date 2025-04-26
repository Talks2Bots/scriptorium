import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Slot from './Slot';
import { fetchObjects } from '../utils/supabase';

const BoxContainer = styled.div`
  position: relative;
  width: 95%;
  max-width: 900px;
  margin: 0 auto;
  padding-top: 40px; /* Add space for the lid */
  perspective: 1200px;
  transform-style: preserve-3d;
  
  /* Tilt the box slightly on larger screens */
  @media (min-width: 768px) {
    transform: perspective(1000px) rotateX(5deg);
  }
`;

const BoxOuter = styled.div`
  background-color: var(--primary-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 10px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  transform-style: preserve-3d;
  perspective: 1000px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* Make the box more landscape-oriented on larger screens */
  aspect-ratio: ${props => props.isSmallScreen ? '1/1.1' : '1.6/1'};
  transform: ${props => props.isSmallScreen ? 'none' : 'rotateY(5deg)'};
  
  /* Add wood-like texture to the box exterior */
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.4);
    background-image: linear-gradient(
      90deg,
      rgba(80, 50, 30, 0.1) 0%,
      rgba(60, 35, 20, 0.1) 20%,
      rgba(80, 50, 30, 0.1) 40%,
      rgba(60, 35, 20, 0.1) 60%,
      rgba(80, 50, 30, 0.1) 80%,
      rgba(60, 35, 20, 0.1) 100%
    );
    pointer-events: none;
    z-index: 2;
  }
  
  /* Inner border */
  &:after {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    pointer-events: none;
    z-index: 3;
  }
`;

const BoxInner = styled.div`
  background-color: var(--box-bg-color);
  background-image: 
    radial-gradient(
      circle at center,
      rgba(250, 245, 240, 0.7) 0%,
      rgba(225, 215, 200, 0.7) 100%
    );
  border-radius: 8px;
  padding: 20px;
  /* Grid layout that changes based on screen size */
  display: grid;
  grid-template-columns: ${props => props.isSmallScreen ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'};
  grid-template-rows: ${props => props.isSmallScreen ? 'repeat(4, auto)' : 'auto auto'};
  grid-template-areas: ${props => props.isSmallScreen ? 
    `"item1 item2"
     "item3 item4"
     "item5 item6"
     "item7 item7"` : 
    `"item1 item2 item3 item4"
     "item5 item6 item7 item7"`};
  gap: 10px;
  position: relative;
  z-index: 1;
  min-height: 300px;
  box-shadow: 
    inset 0 2px 10px rgba(0, 0, 0, 0.2),
    inset 0 0 50px rgba(247, 235, 218, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  /* Rich velvet texture */
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.03),
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.03) 2px
      );
    pointer-events: none;
    border-radius: 8px;
    z-index: -1;
  }
  
  /* Compartment grid lines */
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(
        to right,
        transparent,
        transparent calc(25% - 1px),
        rgba(120, 100, 80, 0.2) calc(25% - 1px),
        rgba(120, 100, 80, 0.2) calc(25% + 1px),
        transparent calc(25% + 1px),
        transparent calc(50% - 1px),
        rgba(120, 100, 80, 0.2) calc(50% - 1px),
        rgba(120, 100, 80, 0.2) calc(50% + 1px),
        transparent calc(50% + 1px),
        transparent calc(75% - 1px),
        rgba(120, 100, 80, 0.2) calc(75% - 1px),
        rgba(120, 100, 80, 0.2) calc(75% + 1px),
        transparent calc(75% + 1px)
      ),
      linear-gradient(
        to bottom,
        transparent,
        transparent calc(50% - 1px),
        rgba(120, 100, 80, 0.2) calc(50% - 1px),
        rgba(120, 100, 80, 0.2) calc(50% + 1px),
        transparent calc(50% + 1px)
      );
    pointer-events: none;
    z-index: 1;
    border-radius: 8px;
    display: ${props => props.isSmallScreen ? 'none' : 'block'};
  }
`;

const BoxLid = styled.div`
  position: absolute;
  top: -30px;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 12px;
  z-index: 10;
  transform-origin: top center;
  transform: ${props => props.isOpen 
    ? 'rotateX(-110deg) translateZ(10px)' 
    : 'rotateX(0) translateZ(10px)'};
  transition: transform 1.8s cubic-bezier(0.33, 1, 0.68, 1);
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.3),
    0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  aspect-ratio: ${props => props.isSmallScreen ? '1/1.1' : '1.6/1'};
  
  /* Wood-grain texture for the lid */
  &:before {
    content: '';
    position: absolute;
    top: 16px;
    left: 16px;
    right: 16px;
    bottom: 16px;
    background-color: var(--secondary-color);
    background-image: linear-gradient(
      90deg,
      rgba(232, 214, 195, 1) 0%,
      rgba(220, 200, 180, 1) 20%,
      rgba(232, 214, 195, 1) 40%,
      rgba(220, 200, 180, 1) 60%,
      rgba(232, 214, 195, 1) 80%,
      rgba(220, 200, 180, 1) 100%
    );
    border-radius: 8px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'EB Garamond', Georgia, serif;
    text-align: center;
  }
  
  /* Box label */
  &:after {
    content: 'Scriptorium';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'EB Garamond', Georgia, serif;
    font-size: clamp(1.8rem, 5vw, 2.5rem);
    color: var(--primary-color);
    font-weight: 500;
    letter-spacing: 2px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
  }
`;

const BoxLidPattern = styled.div`
  position: absolute;
  top: 25px;
  left: 25px;
  right: 25px;
  bottom: 25px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  pointer-events: none;
`;

const BoxShadow = styled.div`
  position: absolute;
  bottom: -20px;
  left: 5%;
  right: 5%;
  height: 20px;
  background: rgba(0, 0, 0, 0.2);
  filter: blur(15px);
  border-radius: 50%;
  z-index: -1;
  transform: ${props => props.isOpen ? 'scaleX(1.1)' : 'scaleX(1)'};
  transition: transform 1.8s cubic-bezier(0.33, 1, 0.68, 1);
`;

const OpenButton = styled.button`
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 30px;
  cursor: pointer;
  font-size: 1.1rem;
  font-family: 'EB Garamond', Georgia, serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: none;
  outline: none;
  
  &:hover {
    transform: translateX(-50%) translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    background-color: var(--primary-color-dark, #1d3e54);
  }
  
  &:active {
    transform: translateX(-50%) translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
`;

// Specific area styling for each slot
const SlotArea = styled.div`
  grid-area: ${props => props.area};
  position: relative;
  
  /* Make the bottom chocolates bigger */
  transform: ${props => 
    (props.area === 'item5' || props.area === 'item6' || props.area === 'item7') && !props.isSmallScreen
      ? 'scale(1.15)'
      : 'scale(1)'
  };
  
  /* Make item7 extra wide on desktop */
  ${props => props.area === 'item7' && !props.isSmallScreen && `
    width: calc(200% - 10px);
    grid-column: span 2;
  `}
  
  /* Center the extra wide item on mobile */
  ${props => props.area === 'item7' && props.isSmallScreen && `
    width: 100%;
    grid-column: span 2;
    justify-self: center;
  `}
  
  z-index: 2;
`;

const Box = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [objects, setObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Load objects
  useEffect(() => {
    console.log('Box component mounted');
    const loadObjects = async () => {
      try {
        console.log('Attempting to fetch objects from Supabase');
        const objectsData = await fetchObjects();
        console.log('Fetched objects:', objectsData);
        
        if (!objectsData || objectsData.length === 0) {
          // If no data returned, use mock data
          console.log('No data returned, using mock data');
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

  const handleOpen = () => {
    setIsOpen(true);
  };

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

  // Assign grid areas to objects
  const getGridArea = (index) => {
    const areas = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7'];
    return areas[index] || `item${index + 1}`;
  };

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3>Error loading content:</h3>
        <p>{error}</p>
        <p>Displaying demo content instead.</p>
        <BoxContainer>
          <BoxOuter isSmallScreen={isSmallScreen}>
            <BoxInner isSmallScreen={isSmallScreen}>
              {objects.slice(0, 7).map((object, index) => (
                <SlotArea 
                  key={object.id} 
                  area={getGridArea(index)}
                  isSmallScreen={isSmallScreen}
                >
                  <Slot object={object} isBiggerSlot={index >= 4} />
                </SlotArea>
              ))}
            </BoxInner>
            <BoxLid isOpen={isOpen} isSmallScreen={isSmallScreen}>
              <BoxLidPattern />
            </BoxLid>
          </BoxOuter>
          <BoxShadow isOpen={isOpen} />
          {!isOpen && (
            <OpenButton onClick={handleOpen}>
              Open Scriptorium
            </OpenButton>
          )}
        </BoxContainer>
      </div>
    );
  }

  return (
    <BoxContainer>
      <BoxOuter isSmallScreen={isSmallScreen}>
        <BoxInner isSmallScreen={isSmallScreen}>
          {isLoading ? (
            <p>Loading treasures...</p>
          ) : (
            objects.slice(0, 7).map((object, index) => (
              <SlotArea 
                key={object.id} 
                area={getGridArea(index)}
                isSmallScreen={isSmallScreen}
              >
                <Slot object={object} isBiggerSlot={index >= 4} />
              </SlotArea>
            ))
          )}
        </BoxInner>
        <BoxLid isOpen={isOpen} isSmallScreen={isSmallScreen}>
          <BoxLidPattern />
        </BoxLid>
      </BoxOuter>
      <BoxShadow isOpen={isOpen} />
      {!isOpen && (
        <OpenButton onClick={handleOpen}>
          Open Scriptorium
        </OpenButton>
      )}
    </BoxContainer>
  );
};

export default Box; 