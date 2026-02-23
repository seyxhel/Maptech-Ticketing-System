import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div style={{padding: '2rem', textAlign: 'center'}}>
      <h1 style={{fontSize: '2rem', marginBottom: '0.5rem'}}>404 — Page Not Found</h1>
      <p style={{marginBottom: '1rem'}}>Sorry, the page you are looking for does not exist.</p>
      <Link to="/">Go back to Home</Link>
    </div>
  );
};

export default NotFoundPage;
