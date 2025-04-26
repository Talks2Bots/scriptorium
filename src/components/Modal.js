import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: var(--popup-bg);
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  &:before {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    right: 5px;
    bottom: 5px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    pointer-events: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-color);
  opacity: 0.7;
  transition: opacity 0.3s;
  z-index: 2;
  
  &:hover {
    opacity: 1;
  }
`;

const ModalImage = styled.img`
  max-width: 100%;
  height: auto;
  max-height: 200px;
  margin: 0 auto 20px;
  display: block;
  object-fit: contain;
`;

const PlaceholderImage = styled.div`
  width: 150px;
  height: 150px;
  margin: 0 auto 20px;
  background-color: #d1c3a8;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Georgia, serif;
  font-size: 40px;
  color: #2a5674;
`;

const ModalTitle = styled.h2`
  font-family: 'Georgia', serif;
  margin-bottom: 16px;
  text-align: center;
  color: var(--primary-color);
  font-weight: normal;
  font-size: 1.8rem;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    width: 60px;
    height: 2px;
    background-color: var(--primary-color);
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.5;
  }
`;

const ModalDescription = styled.div`
  font-family: 'Georgia', serif;
  line-height: 1.8;
  color: var(--text-color);
  font-size: 1.1rem;
  text-align: center;
  padding: 0 8px;
  font-style: italic;
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
              ).outerHTML = `<div style="width:150px;height:150px;margin:0 auto 20px;background:#d1c3a8;border-radius:50%;display:flex;justify-content:center;align-items:center;font-size:40px;">${title.charAt(0)}</div>`;
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