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
        } else if (event.data.type === 'GO_BACK') {
          navigate(-1);
        } else if (event.data.type === 'RESIZE') {
          // Add some buffer to avoid micro-scrollbars
          setIframeHeight(`${event.data.height + 20}px`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [location.pathname, navigate]);

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        // Inject a click interceptor into the iframe to handle 'Back' buttons globally
        iframe.contentWindow.addEventListener('click', (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const link = target.closest('a');
          if (link) {
            const href = link.getAttribute('href') || '';
            const isBackLink = link.classList.contains('back-link') || 
                               href.includes('history.back()') || 
                               href.includes('javascript:history.go(-1)');
            
            if (isBackLink) {
              e.preventDefault();
              e.stopPropagation();
              window.parent.postMessage({ type: 'GO_BACK' }, '*');
            }
          }
        }, true);
      } catch (err) {
        // This might fail if the iframe is not same-origin, but here it should work
        console.error('Failed to inject back handler', err);
      }
    }
  };

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 120px)', backgroundColor: '#000099', overflow: 'visible' }}>
      <iframe
        ref={iframeRef}
        name="mainFrame"
        src={src}
        onLoad={handleIframeLoad}
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
