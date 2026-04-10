import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LegacyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [iframeHeight, setIframeHeight] = React.useState<string>('calc(100vh - 120px)');
  const src = location.pathname === '/' ? '/meindex.htm' : location.pathname;
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'NAVIGATE') {
          const newPath = event.data.path;
          if (newPath !== location.pathname) {
            navigate(newPath);
          }
        } else if (event.data.type === 'RESIZE') {
          // Add some buffer to avoid micro-scrollbars
          setIframeHeight(`${event.data.height + 20}px`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [location.pathname, navigate]);

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 120px)', backgroundColor: '#000099', overflow: 'visible' }}>
      <iframe
        ref={iframeRef}
        name="mainFrame"
        src={src}
        style={{
          width: '100%',
          height: iframeHeight,
          border: 'none',
          backgroundColor: '#000099',
          overflow: 'hidden'
        }}
        scrolling="no"
        title="Legacy Content"
      />
    </div>
  );
};

export default LegacyPage;
