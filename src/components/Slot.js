import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from './Modal';
import { getImageUrl } from '../utils/supabase';

const SlotContainer = styled.div`
  background-color: var(--secondary-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px var(--shadow-color);
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px var(--shadow-color);
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 12px;
    box-shadow: inset 0 0 8px var(--shadow-color);
    pointer-events: none;
  }
`;

const ObjectImage = styled.img`
  max-width: 100%;
  max-height: 120px;
  object-fit: contain;
  transition: all 0.3s ease;
`;

const Slot = ({ object }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { name, image_url, opened_image_url, description } = object;
  
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
          src={getImageUrl(image_url)} 
          alt={name} 
        />
      </SlotContainer>
      
      {isModalOpen && (
        <Modal 
          onClose={handleCloseModal}
          imageUrl={getImageUrl(opened_image_url)}
          title={name}
          description={description}
        />
      )}
    </>
  );
};

export default Slot; 