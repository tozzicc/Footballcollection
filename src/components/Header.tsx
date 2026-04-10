import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '20px 0',
      width: '100%',
      gap: '20px'
    }}>
      <div className="item is-logo" style={{ flex: '0 0 auto' }}>
        <img src="/index/Picture0001.jpg" style={{ width: '120px', borderRadius: '8px' }} alt="Logo Left" />
      </div>
      <div style={{ flex: '1', maxWidth: '600px', textAlign: 'center' }}>
        <Link to="/">
          <img src="/logo1.jpg" style={{ width: '100%', maxWidth: '450px', border: 'none' }} alt="HOME PAGE" />
        </Link>
      </div>
      <div className="item is-logo" style={{ flex: '0 0 auto' }}>
        <img src="/index/f2.jpg" style={{ width: '120px', borderRadius: '8px' }} alt="Logo Right" />
      </div>
    </header>
  );
};

export default Header;
