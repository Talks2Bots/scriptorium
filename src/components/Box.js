import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Slot from './Slot';
import { fetchObjects } from '../utils/supabase';

const BoxContainer = styled.div`
  position: relative;
  width: 90vw;
  max-width: 500px;
  margin: 0 auto;
  aspect-ratio: 1/1;
  
  /* Increase width slightly on very small screens */
  @media (max-width: 400px) {
    width: 95vw;
  }
`;

const BoxImage = styled.div`
  width: 100%;
  height: 100%;
  background-image: url('/images/open_box.jpg');
  background-size: cover;
  background-position: center;
  border-radius: 50%;
  position: relative;
`;

// Slot positioning
const SlotPosition = styled.div`
  position: absolute;
  width: 15%;
  height: 15%;
  transform: translate(-50%, -50%);
  
  &.slot-1 {
    top: 23%;
    left: 50%;
  }
  
  &.slot-2 {
    top: 38%;
    left: 78%;
  }
  
  &.slot-3 {
    top: 70%;
    left: 70%;
  }
  
  &.slot-4 {
    top: 83%;
    left: 50%;
  }
  
  &.slot-5 {
    top: 70%;
    left: 30%;
  }
  
  &.slot-6 {
    top: 38%;
    left: 22%;
  }
  
  &.slot-center {
    top: 53%;
    left: 50%;
    width: 20%; /* Make center slot slightly larger */
    height: 20%;
  }
`;

const Box = () => {
  const [objects, setObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Define slot positions
  const slotPositions = [
    'slot-1',
    'slot-2',
    'slot-3',
    'slot-4',
    'slot-5',
    'slot-6',
    'slot-center'
  ];

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3>Error loading content:</h3>
        <p>{error}</p>
        <p>Displaying demo content instead.</p>
        <BoxContainer>
          <BoxImage>
            {objects.slice(0, 7).map((object, index) => (
              <SlotPosition 
                key={object.id} 
                className={slotPositions[index]}
              >
                <Slot 
                  object={object} 
                  slotClassName={slotPositions[index]}
                />
              </SlotPosition>
            ))}
          </BoxImage>
        </BoxContainer>
      </div>
    );
  }

  return (
    <BoxContainer>
      <BoxImage>
        {isLoading ? (
          <p style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            textShadow: '0 0 5px rgba(0,0,0,0.7)'
          }}>
            Loading treasures...
          </p>
        ) : (
          objects.slice(0, 7).map((object, index) => (
            <SlotPosition 
              key={object.id} 
              className={slotPositions[index]}
            >
              <Slot 
                object={object} 
                slotClassName={slotPositions[index]}
              />
            </SlotPosition>
          ))
        )}
      </BoxImage>
    </BoxContainer>
  );
};

export default Box; 