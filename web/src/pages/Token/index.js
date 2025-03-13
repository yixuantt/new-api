import React from 'react';
import TokensTable from '../../components/TokensTable';
import { Banner, Layout, LocaleProvider } from '@douyinfe/semi-ui';

import en_US from '@douyinfe/semi-ui/lib/es/locale/source/en_US';

const Token = () => (
  <>
    <Layout>
      <LocaleProvider locale={en_US}>
      <Layout.Content>
        <TokensTable />
      </Layout.Content>
      </LocaleProvider>
    </Layout>
  </>
);

export default Token;
