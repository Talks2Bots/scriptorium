import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Slot from './Slot';
import { fetchObjects } from '../utils/supabase';

const BoxContainer = styled.div`
  position: relative;
  width: 90%;
  max-width: 800px;
  margin: 0 auto;
`;

const BoxOuter = styled.div`
  background-color: var(--primary-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 24px var(--shadow-color), 
              inset 0 2px 6px rgba(255, 255, 255, 0.2);
  position: relative;
  transform-style: preserve-3d;
  perspective: 1000px;
`;

const BoxInner = styled.div`
  background-color: var(--box-bg-color);
  border-radius: 8px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 20px;
  position: relative;
  z-index: 1;
  min-height: 500px;
  box-shadow: inset 0 0 10px var(--shadow-color);
`;

const BoxLid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 12px;
  z-index: 10;
  transform-origin: top center;
  transform: ${props => props.isOpen ? 'rotateX(-110deg)' : 'rotateX(0)'};
  transition: transform 1.5s ease-in-out;
  box-shadow: 0 8px 24px var(--shadow-color);
  
  &:before {
    content: '';
    position: absolute;
    top: 16px;
    left: 16px;
    right: 16px;
    bottom: 16px;
    background-color: var(--secondary-color);
    border-radius: 8px;
    box-shadow: inset 0 0 10px var(--shadow-color);
  }
`;

const OpenButton = styled.button`
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 4px 8px var(--shadow-color);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(-50%) translateY(-2px);
    box-shadow: 0 6px 12px var(--shadow-color);
  }
`;

const Box = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [objects, setObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadObjects = async () => {
      const objectsData = await fetchObjects();
      setObjects(objectsData);
      setIsLoading(false);
    };

    loadObjects();
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
  };

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
        <BoxLid isOpen={isOpen} />
      </BoxOuter>
      {!isOpen && (
        <OpenButton onClick={handleOpen}>
          Open Scriptorium
        </OpenButton>
      )}
    </BoxContainer>
  );
};

export default Box; 