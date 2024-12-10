import React from 'react';
// import './App.css'; // Make sure to import your CSS file

const StyledTextComponent = () => {
  return (
    <div style={{padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          margin: '20px auto',
          maxWidth: '600px',}}>
      <h1 style={styles.title}>Solana Blockchain keeps your SOL!</h1>
      <h2 style={styles.subtitle}>You can get it back!</h2>
      {/* <h3 style={styles.joinHeader}>JOIN THE MEME REVOLUTION</h3> */}
      {/* <p style={{fontFamily: "Impact", color: 'white', fontStyle: 'italic'}}>
      Share with your friends and receive 20% of the included donation!
      </p> */}
      <p style={styles.mintMessage}>
      Share with your friends and receive 20% of the included donation!
      </p>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    // backgroundColor: '#f0f8ff',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    margin: '20px auto',
    maxWidth: '600px',
  },
  title: {
    fontSize: '2.5rem',
    color: '#ff6347',
    margin: '10px 0',
    fontStyle: 'italic'
  },
  subtitle: {
    fontSize: '2rem',
    color: '#4682b4',
    margin: '5px 0',
  },
  joinHeader: {
    fontSize: '1.75rem',
    color: '#5f9ea0',
    margin: '15px 0',
  },
  description: {
    fontSize: '1.2rem',
    color: 'white',
    lineHeight: '1.5',
    margin: '20px 0',
  },
  mintMessage: {
    fontSize: '1.4rem',
    color: '#32cd32',
    fontWeight: 'bold',
    margin: '20px 0',
    fontStyle: 'italic'
  },
};

export default StyledTextComponent;