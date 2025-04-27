import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from './Modal';
import { getImageUrl } from '../utils/supabase';

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

// Special styling for the egg image
const EggImage = styled.img`
  width: 300%; /* Dramatically increase the egg size */
  height: 300%;
  object-fit: contain;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  transform: translateY(20%); /* Position egg */
  
  &:hover {
    transform: translateY(20%) scale(1.05);
  }
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
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
`;

const Slot = ({ object, slotClassName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { name, image_url, opened_image_url, description } = object || {};
  
  // Check if this is slot-1 to show the robin egg
  const isEgg = slotClassName === 'slot-1';
  
  const handleClick = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // If image URL is null, use a placeholder
  const imageSource = image_url ? getImageUrl(image_url) : null;
  const openedImageSource = opened_image_url ? getImageUrl(opened_image_url) : null;

  // Force cache refresh with a random number
  const eggImagePath = '/images/robin-egg.png?v=' + Math.floor(Math.random() * 10000000);

  return (
    <>
      <SlotContainer onClick={handleClick}>
        {isEgg ? (
          <ObjectImage 
            src={eggImagePath} 
            alt="Robin's Egg" 
            className="chocolate"
          />
        ) : (
          imageSource ? (
            <ObjectImage 
              src={imageSource} 
              alt={name} 
              className="chocolate"
              onError={(e) => {
                console.error('Error loading image:', imageSource);
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;background:#d1c3a8;border-radius:50%;display:flex;justify-content:center;align-items:center;font-size:28px;color:#2a5674;">${name?.charAt(0) || 'O'}</div>`;
              }}
            />
          ) : (
            <PlaceholderImage>
              {name?.charAt(0) || 'O'}
            </PlaceholderImage>
          )
        )}
      </SlotContainer>
      
      {isModalOpen && (
        <Modal 
          onClose={handleCloseModal}
          imageUrl={isEgg ? eggImagePath : openedImageSource}
          title={isEgg ? "Robin's Egg" : name}
          description={isEgg ? "A beautiful robin's egg with a speckled blue shell." : description}
        />
      )}
    </>
  );
};

export default Slot; 