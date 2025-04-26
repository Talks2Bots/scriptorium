import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 20px;
  backdrop-filter: blur(3px);
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background-color: var(--popup-bg);
  background-image: radial-gradient(
    circle at top right,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(245, 239, 230, 0.98) 50%,
    rgba(235, 229, 220, 0.95) 100%
  );
  border-radius: 16px;
  padding: 40px 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.25),
    0 5px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: slideUp 0.3s ease-out;
  transform-origin: bottom center;
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    right: 5px;
    bottom: 5px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 14px;
    pointer-events: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--primary-color);
  opacity: 0.7;
  transition: all 0.3s ease;
  z-index: 2;
  height: 40px;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  
  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.05);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ModalImage = styled.img`
  max-width: 100%;
  height: auto;
  max-height: 200px;
  margin: 0 auto 30px;
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
  transition: all 0.3s ease;
  transform: scale(1);
  animation: reveal 0.5s ease-out;
  
  @keyframes reveal {
    from { 
      opacity: 0;
      transform: scale(0.9) translateY(10px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  &:hover {
    transform: scale(1.03);
  }
`;

const PlaceholderImage = styled.div`
  width: 160px;
  height: 160px;
  margin: 0 auto 30px;
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
  font-size: 56px;
  color: #2a5674;
  box-shadow: 
    inset 0 3px 8px rgba(255, 255, 255, 0.5),
    inset 0 -3px 8px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.1);
  animation: reveal 0.5s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 
      inset 0 3px 8px rgba(255, 255, 255, 0.5),
      inset 0 -3px 8px rgba(0, 0, 0, 0.1),
      0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

const ModalTitle = styled.h2`
  font-family: 'EB Garamond', Georgia, serif;
  margin-bottom: 24px;
  text-align: center;
  color: var(--primary-color);
  font-weight: normal;
  font-size: 2.2rem;
  position: relative;
  letter-spacing: 0.5px;
  
  &:after {
    content: '';
    position: absolute;
    width: 80px;
    height: 2px;
    background-color: var(--primary-color);
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.4;
  }
`;

const ModalDescription = styled.div`
  font-family: 'EB Garamond', Georgia, serif;
  line-height: 1.8;
  color: var(--text-color);
  font-size: 1.2rem;
  text-align: center;
  padding: 0 8px;
  font-style: italic;
  animation: fadeIn 0.5s ease-out 0.2s both;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Modal = ({ onClose, imageUrl, title, description }) => {
  const modalRef = useRef();
  
  useEffect(() => {
    console.log('Modal opened for:', title);
    
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    // Prevent scrolling of the body when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, title]);

  return (
    <ModalOverlay>
      <ModalContent ref={modalRef}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        
        {imageUrl ? (
          <ModalImage 
            src={imageUrl} 
            alt={title} 
            onError={(e) => {
              console.error('Error loading modal image:', imageUrl);
              e.target.style.display = 'none';
              e.target.parentNode.insertBefore(
                document.createElement('div'), 
                e.target.nextSibling
              ).outerHTML = `<div style="width:160px;height:160px;margin:0 auto 30px;background:radial-gradient(circle at center, #e0d2b4 0%, #d1c3a8 70%);border-radius:50%;display:flex;justify-content:center;align-items:center;font-size:56px;color:#2a5674;box-shadow:inset 0 3px 8px rgba(255,255,255,0.5),inset 0 -3px 8px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1);">${title.charAt(0)}</div>`;
            }}
          />
        ) : (
          <PlaceholderImage>{title.charAt(0)}</PlaceholderImage>
        )}
        
        <ModalTitle>{title}</ModalTitle>
        <ModalDescription dangerouslySetInnerHTML={{ __html: description }} />
      </ModalContent>
    </ModalOverlay>
  );
};

export default Modal; 