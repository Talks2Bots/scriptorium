import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --primary-color: #2a5674;
    --primary-color-dark: #1d3e54;
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
    font-family: 'EB Garamond', Georgia, serif;
    background-color: #f0f0f0;
    color: var(--text-color);
    line-height: 1.6;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background-image: linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%);
    position: relative;
    overflow-x: hidden;
  }

  /* Add subtle texture to the background */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.025' fill-rule='evenodd'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: -1;
  }

  button {
    font-family: 'EB Garamond', Georgia, serif;
    cursor: pointer;
    border: none;
    background: none;
    outline: none;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'EB Garamond', Georgia, serif;
    font-weight: normal;
    color: var(--primary-color);
  }

  /* Add smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Better focus styles for accessibility */
  :focus {
    outline: 2px dashed var(--primary-color);
    outline-offset: 2px;
  }

  /* Hide focus outline for mouse users, but keep for keyboard */
  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Improve tap target sizes on mobile */
  @media (max-width: 768px) {
    button, 
    input, 
    select, 
    textarea {
      min-height: 44px;
      min-width: 44px;
    }
  }
`;

export default GlobalStyles; 