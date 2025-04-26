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
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 3px rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  
  /* Add subtle ripple effect to background */
  background-image: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(0, 0, 0, 0.05) 100%
  );
  
  &:hover {
    transform: translateY(-8px) scale(1.03);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.2),
      inset 0 1px 5px rgba(255, 255, 255, 0.4);
    z-index: 5;
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 12px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.15);
    pointer-events: none;
  }
  
  /* Delicate paper crinkle texture */
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.4;
    pointer-events: none;
  }
`;

const ObjectImageContainer = styled.div`
  position: relative;
  width: 80%;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  
  ${SlotContainer}:hover & {
    transform: translateY(-5px) scale(1.1);
  }
`;

const ObjectImage = styled.img`
  max-width: 100%;
  max-height: 100px;
  object-fit: contain;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
`;

const PlaceholderImage = styled.div`
  width: 80px;
  height: 80px;
  background-color: #d1c3a8;
  background-image: radial-gradient(
    circle at center,
    #e0d2b4 0%,
    #d1c3a8 70%
  );
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 28px;
  color: #2a5674;
  box-shadow: 
    inset 0 2px 4px rgba(255, 255, 255, 0.5),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  ${SlotContainer}:hover & {
    transform: scale(1.1);
    box-shadow: 
      inset 0 3px 6px rgba(255, 255, 255, 0.5),
      inset 0 -3px 6px rgba(0, 0, 0, 0.15),
      0 5px 10px rgba(0, 0, 0, 0.1);
  }
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
        <ObjectImageContainer>
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
        </ObjectImageContainer>
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