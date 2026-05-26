import React from 'react';
import Lottie from 'lottie-react';
import handAnimation from '../assets/lazy-hand.json';

/**
 * LoadingScreen component that displays a Lottie animation centered on the screen.
 * Ideal for use with React.Suspense or global navigation states.
 */
const LoadingScreen: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#ffffff',
        zIndex: 9999,
      }}
    >
      <div style={{ width: '300px', height: '300px' }}>
        <Lottie animationData={handAnimation} loop={true} />
      </div>
    </div>
  );
};

export default LoadingScreen;