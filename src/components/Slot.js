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

const PlaceholderImage = styled.div`
  width: 80px;
  height: 80px;
  background-color: #d1c3a8;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Georgia, serif;
  color: #2a5674;
`;

const Slot = ({ object }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { name, image_url, opened_image_url, description } = object;
  
  const handleClick = () => {
    console.log('Slot clicked:', name);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // If image URL is null, use a placeholder
  const imageSource = image_url ? getImageUrl(image_url) : null;
  const openedImageSource = opened_image_url ? getImageUrl(opened_image_url) : null;

  return (
    <>
      <SlotContainer onClick={handleClick}>
        {imageSource ? (
          <ObjectImage 
            src={imageSource} 
            alt={name} 
            onError={(e) => {
              console.error('Error loading image:', imageSource);
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `<div style="width:80px;height:80px;background:#d1c3a8;border-radius:50%;display:flex;justify-content:center;align-items:center;">${name.charAt(0)}</div>`;
            }}
          />
        ) : (
          <PlaceholderImage>
            {name.charAt(0)}
          </PlaceholderImage>
        )}
      </SlotContainer>
      
      {isModalOpen && (
        <Modal 
          onClose={handleCloseModal}
          imageUrl={openedImageSource}
          title={name}
          description={description}
        />
      )}
    </>
  );
};

export default Slot; 