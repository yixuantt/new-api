import React, { useContext, useEffect, useState } from 'react';
import { Card, Col, Row } from '@douyinfe/semi-ui';
import { API, showError, showNotice, timestamp2string } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { marked } from 'marked';

const Home = () => {
  const [statusState] = useContext(StatusContext);
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');

  const displayNotice = async () => {
    const res = await API.get('/api/notice');
    const { success, message, data } = res.data;
    if (success) {
      let oldNotice = localStorage.getItem('notice');
      if (data !== oldNotice && data !== '') {
        const htmlNotice = marked(data);
        showNotice(htmlNotice, true);
        localStorage.setItem('notice', data);
      }
    } else {
      showError(message);
    }
  };

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
    } else {
      showError(message);
      setHomePageContent('Failed to load the homepage content...');
    }
    setHomePageContentLoaded(true);
  };

  const getStartTimeString = () => {
    const timestamp = statusState?.status?.start_time;
    return statusState.status ? timestamp2string(timestamp) : '';
  };

  useEffect(() => {
    displayNotice().then();
    displayHomePageContent().then();
  }, []);
  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {homePageContentLoaded && homePageContent === '' ? (
        <>
          <Card
            bordered={false}
            headerLine={false}
            title='System Status'
            // bodyStyle={{ padding: '10px 20px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card
                  title='System Information'
                  headerExtraContent={
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--semi-color-text-1)',
                      }}
                    >
                      System Information Overview
                    </span>
                  }
                >
                  <p>Name：{statusState?.status?.system_name}</p>
                  <p>
                    Version：
                    {statusState?.status?.version
                      ? statusState?.status?.version
                      : 'unknown'}
                  </p>
                  <p>
                    one-api：
                    <a
                      href='https://github.com/songquanpeng/one-api'
                      target='_blank'
                      rel='noreferrer'
                    >
                      https://github.com/songquanpeng/one-api
                    </a>
                  </p>
                  <p>
                    new-api：
                    <a
                      href='https://github.com/Calcium-Ion/new-api'
                      target='_blank'
                      rel='noreferrer'
                    >
                      https://github.com/Calcium-Ion/new-api
                    </a>
                  </p>
                  <p>
                    License：
                    <a
                      href='https://www.apache.org/licenses/LICENSE-2.0'
                      target='_blank'
                      rel='noreferrer'
                    >
                      Apache-2.0 License
                    </a>
                  </p>
                  <p>Start Time：{getStartTimeString()}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title='System Configuration'
                  headerExtraContent={
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--semi-color-text-1)',
                      }}
                    >
                      System Configuration Overview
                    </span>
                  }
                >
                  <p>
                    Email Verification：
                    {statusState?.status?.email_verification === true
                      ? 'Enabled'
                      : 'Not Enabled'}
                  </p>
                  <p>
                    GitHub Authentication：
                    {statusState?.status?.github_oauth === true
                      ? 'Enabled'
                      : 'Not Enabled'}
                  </p>
                  {/* <p>
                    LINUX DO 身份验证：
                    {statusState?.status?.linuxdo_oauth === true
                      ? 'Enabled'
                      : '未Enable'}
                  </p> */}
                  {/* <p>
                    WeChat Authentication：
                    {statusState?.status?.wechat_login === true
                      ? 'Enabled'
                      : '未Enable'}
                  </p>
                  <p>
                    Turnstile User校验：
                    {statusState?.status?.turnstile_check === true
                      ? 'Enabled'
                      : '未Enable'}
                  </p>
                  <p>
                    Telegram authentication：
                    {statusState?.status?.telegram_oauth === true
                      ? 'Enabled'
                      : '未Enable'}
                  </p> */}
                </Card>
              </Col>
            </Row>
          </Card>
        </>
      ) : (
        <>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              style={{ width: '100%', height: '100vh', border: 'none', overflow: 'hidden'}}
            />
           
          ) : (
            <div
            style={{ fontSize: 'larger', width: '100%', overflowX: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: homePageContent }}
          />
        )}
      </>
    )}
  </div>
  );
};

export default Home;
