import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from './Modal';

const SlotContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ObjectImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
`;

const Slot = ({ object, slotClassName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Force cache refresh with a unique timestamp to show the updated egg image
  const eggImagePath = '/images/robin-egg.png?v=' + Date.now();
  
  const handleClick = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <SlotContainer onClick={handleClick}>
        <ObjectImage 
          src={eggImagePath} 
          alt="Robin's Egg" 
          className="chocolate"
        />
      </SlotContainer>
      
      {isModalOpen && (
        <Modal 
          onClose={handleCloseModal}
          imageUrl={eggImagePath}
          title="Robin's Egg"
          description="A beautiful robin's egg with a speckled blue shell."
        />
      )}
    </>
  );
};

export default Slot; 