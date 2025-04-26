import React, { useEffect } from 'react';
import Box from './components/Box';
import GlobalStyles from './styles/GlobalStyles';

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
      <div className="App">
        <h1 style={{ 
          textAlign: 'center', 
          margin: '0 0 40px 0',
          fontFamily: 'Georgia, serif',
          fontWeight: 'normal',
          color: '#2a5674',
          fontSize: '2.5rem'
        }}>
          Scriptorium
        </h1>
        <Box />
      </div>
    </>
  );
}

export default App; 