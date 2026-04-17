import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '40px' }}>
      <div className="gallery">
        <div className="item">
          <div className="image-wrapper">
            <img src="/index/b.jpg" alt="Gallery Item 1" />
          </div>
        </div>
        <div className="item">
          <div className="image-wrapper">
            <img src="/index/picture0004.jpg" alt="Gallery Item 2" />
          </div>
        </div>
        <div className="item">
          <div className="image-wrapper">
            <img src="/index/picture0003.JPG" alt="Gallery Item 3" />
          </div>
        </div>
      </div>
      
      <div className="decade-section">
        <div className="decade-title">Entrar na Coleção / Enter Collection</div>
        <div className="link-grid">
          <Link to="/content.htm" className="nav-button" style={{ fontSize: '1.5rem', padding: '15px 40px' }}> ENTER </Link>
        </div>
      </div>

      <div style={{ textAlign: 'center', opacity: 0.7 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', marginRight: '10px' }}>
          <i>VISITOR N°: </i>
        </span>
        <img src="http://contador.s12.com.br/img-YdaACd4Z-2.gif" alt="Visitor Counter" style={{ border: 0, verticalAlign: 'middle' }} />
      </div>
    </div>
  );
};

export default Home;
