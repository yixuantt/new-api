import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import HeaderBar from './components/HeaderBar';
import 'semantic-ui-offline/semantic.min.css';
import './index.css';
import { UserProvider } from './context/User';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { StatusProvider } from './context/Status';
import { Layout } from '@douyinfe/semi-ui';
import SiderBar from './components/SiderBar';
import { ThemeProvider } from './context/Theme';
import FooterBar from './components/Footer';

// initialization

const { Sider, Content, Header, Footer } = Layout;

// 创建一个布局组件，根据当前路径决定是否显示侧边栏
function RootLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  
  return (
    <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header>
        <HeaderBar />
      </Header>
      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        {!isHomePage && (
          <Sider>
            <SiderBar />
          </Sider>
        )}
        <Layout style={{ width: '100%' }}>
          <Content style={{ 
            overflowY: 'auto', 
            padding: '24px',
            width: '100%'
          }}>
            <App />
          </Content>
          <Footer>
            <FooterBar />
          </Footer>
        </Layout>
      </Layout>
      <ToastContainer />
    </Layout>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StatusProvider>
      <UserProvider>
        <BrowserRouter>
          <ThemeProvider>
            <RootLayout />
          </ThemeProvider>
        </BrowserRouter>
      </UserProvider>
    </StatusProvider>
  </React.StrictMode>
);