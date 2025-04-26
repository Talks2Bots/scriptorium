import React, { useEffect } from 'react';
import styled from 'styled-components';
import Box from './components/Box';
import GlobalStyles from './styles/GlobalStyles';

const AppContainer = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
  position: relative;
`;

const AppTitle = styled.h1`
  text-align: center;
  margin: 0 0 60px 0;
  font-family: 'EB Garamond', Georgia, serif;
  font-weight: normal;
  color: var(--primary-color);
  font-size: 3.2rem;
  position: relative;
  letter-spacing: 2px;

  &:after {
    content: '';
    position: absolute;
    width: 120px;
    height: 2px;
    background-color: var(--primary-color);
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.4;
  }
`;

function App() {
  useEffect(() => {
    console.log('App component mounted');
    // Check if GlobalStyles and other components are loading
    console.log('Components loaded:', {
      GlobalStyles: !!GlobalStyles,
      Box: !!Box
    });
  }, []);

  return (
    <>
      <GlobalStyles />
      <AppContainer>
        <AppTitle>Scriptorium</AppTitle>
        <Box />
      </AppContainer>
    </>
  );
}

export default App; 