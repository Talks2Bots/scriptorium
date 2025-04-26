import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Slot from './Slot';
import { fetchObjects } from '../utils/supabase';

const BoxContainer = styled.div`
  position: relative;
  width: 90%;
  max-width: 800px;
  margin: 0 auto;
  padding-top: 40px; /* Add space for the lid */
`;

const BoxOuter = styled.div`
  background-color: var(--primary-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  position: relative;
  transform-style: preserve-3d;
  perspective: 1000px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    z-index: 2;
  }
`;

const BoxInner = styled.div`
  background-color: var(--box-bg-color);
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  border-radius: 8px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 20px;
  position: relative;
  z-index: 1;
  min-height: 500px;
  box-shadow: 
    inset 0 2px 10px rgba(0, 0, 0, 0.2),
    inset 0 0 50px rgba(247, 235, 218, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.1);
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
  transform: ${props => props.isOpen ? 'rotateX(-110deg)' : 'rotateX(0)'};
  transition: transform 1.8s cubic-bezier(0.33, 1, 0.68, 1);
  box-shadow: 
    0 5px 15px rgba(0, 0, 0, 0.2),
    0 15px 35px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 16px;
    left: 16px;
    right: 16px;
    bottom: 16px;
    background-color: var(--secondary-color);
    border-radius: 8px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'EB Garamond', Georgia, serif;
    text-align: center;
  }
  
  &:after {
    content: 'Scriptorium';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 2.5rem;
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

const Box = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [objects, setObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
    return Array(9).fill(null).map((_, index) => ({
      id: index + 1,
      name: `Sample Object ${index + 1}`,
      image_url: null,
      opened_image_url: null,
      description: `This is a sample object for testing. No Supabase connection available.`
    }));
  };

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3>Error loading content:</h3>
        <p>{error}</p>
        <p>Displaying demo content instead.</p>
        <BoxContainer>
          <BoxOuter>
            <BoxInner>
              {objects.map((object) => (
                <Slot key={object.id} object={object} />
              ))}
            </BoxInner>
            <BoxLid isOpen={isOpen}>
              <BoxLidPattern />
            </BoxLid>
          </BoxOuter>
          <BoxShadow />
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
      <BoxOuter>
        <BoxInner>
          {isLoading ? (
            <p>Loading treasures...</p>
          ) : (
            objects.map((object) => (
              <Slot key={object.id} object={object} />
            ))
          )}
        </BoxInner>
        <BoxLid isOpen={isOpen}>
          <BoxLidPattern />
        </BoxLid>
      </BoxOuter>
      <BoxShadow />
      {!isOpen && (
        <OpenButton onClick={handleOpen}>
          Open Scriptorium
        </OpenButton>
      )}
    </BoxContainer>
  );
};

export default Box; 