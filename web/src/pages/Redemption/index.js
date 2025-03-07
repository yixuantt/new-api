import React from 'react';
import RedemptionsTable from '../../components/RedemptionsTable';
import { Layout } from '@douyinfe/semi-ui';

const Redemption = () => (
  <>
    <Layout>
      <Layout.Header>
        <h3>ManageRedeem码</h3>
      </Layout.Header>
      <Layout.Content>
        <RedemptionsTable />
      </Layout.Content>
    </Layout>
  </>
);

export default Redemption;
