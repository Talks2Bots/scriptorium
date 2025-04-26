import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --primary-color: #2a5674;
    --secondary-color: #e8d6c3;
    --box-bg-color: #f5efe6;
    --text-color: #4a4a4a;
    --popup-bg: rgba(245, 239, 230, 0.98);
    --shadow-color: rgba(0, 0, 0, 0.15);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Georgia', serif;
    background-color: #f0f0f0;
    color: var(--text-color);
    line-height: 1.6;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background-image: linear-gradient(to bottom, #e6e9f0 0%, #eef1f5 100%);
  }

  button {
    font-family: 'Georgia', serif;
    cursor: pointer;
    border: none;
    background: none;
    outline: none;
  }

  img {
    max-width: 100%;
    height: auto;
  }
`;

export default GlobalStyles; 