import React from 'react';
import TokensTable from '../../components/TokensTable';
import { Banner, Layout } from '@douyinfe/semi-ui';
const Token = () => (
  <>
    <Layout>
      {/* <Layout.Header>
        <Banner
          type='warning'
          description='TokenNone法精确控制使用Quota，请勿直接将Token分发给User。'
        />
      </Layout.Header> */}
      <Layout.Content>
        <TokensTable />
      </Layout.Content>
    </Layout>
  </>
);

export default Token;
