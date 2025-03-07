import React, { useState, useEffect } from 'react';
import { Card, Typography } from '@douyinfe/semi-ui';
import styles from './Doc.module.css';

const { Title } = Typography;

function Doc() {
  const [docContent, setDocContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Option 1: Hardcoded URL
    setDocContent('https://yixuantt.github.io/pages/doc');
    setLoading(false);
    
    // Option 2: From API (similar to the example code)
    // const fetchDocContent = async () => {
    //   try {
    //     const res = await API.get('/api/doc_content');
    //     if (res.data.success) {
    //       setDocContent(res.data.data);
    //     } else {
    //       setDocContent('Failed to load documentation');
    //     }
    //   } catch (error) {
    //     setDocContent('Error loading documentation');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchDocContent();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.docContainer}>
      <Card className={styles.docCard}>
        {/* <Title heading={3}>Documentation</Title> */}  
        {docContent.startsWith('https://') ? (
          <iframe
            src={docContent}
            style={{ width: '100%', height: '80vh', border: 'none' }}
            title="Documentation"
          />
        ) : (
          <div 
            style={{ fontSize: 'larger' }}
            dangerouslySetInnerHTML={{ __html: docContent }}
          />
        )}
      </Card>
    </div>
  );
}

export default Doc;