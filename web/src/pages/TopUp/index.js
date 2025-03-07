import React, { useEffect, useState } from 'react';
import { API, isMobile, showError, showInfo, showSuccess } from '../../helpers';
import { renderNumber, renderQuota } from '../../helpers/render';
import {
  Col,
  Layout,
  Row,
  Typography,
  Card,
  Button,
  Form,
  Divider,
  Space,
  Modal,
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import { Link } from 'react-router-dom';

const TopUp = () => {
  const [redemptionCode, setRedemptionCode] = useState('');
  const [topUpCode, setTopUpCode] = useState('');
  const [topUpCount, setTopUpCount] = useState(10);
  const [minTopupCount, setMinTopUpCount] = useState(1);
  const [payAmount, setPayAmount] = useState(0.0);
  const [chargedAmount, setChargedAmount] = useState(0.0);
  const [minTopUp, setMinTopUp] = useState(1);
  const [topUpLink, setTopUpLink] = useState('');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [userQuota, setUserQuota] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [open, setOpen] = useState(false);
  const [payWay, setPayWay] = useState('');

  const topUp = async () => {
    if (redemptionCode === '') {
      showError('请EnterRedeem码！');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: redemptionCode,
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess('RedeemSuccess！');
        Modal.success({
          title: 'RedeemSuccess！',
          content: 'SuccessRedeemQuota：' + renderQuota(data),
          centered: true,
        });
        setUserQuota((quota) => {
          return quota + data;
        });
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError('请求Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError('超级Admin未SettingsRecharge链接！');
      return;
    }
    window.open(topUpLink, '_blank');
  };

  const preTopUp = async (payment) => {
    if (!paymentEnabled) {
      showError('Admin未open启在线Recharge！');
      return;
    }
    if (!Number.isInteger(Number(topUpCount))) {
      showError('Rechargequantity必须是整数！');
      return;
    }
    if (payAmount === 0) {
      await getAmount();
    }
    if (topUpCount < minTopUp) {
      showError('Rechargequantity不能小于' + minTopUp);
      return;
    }
    setPayWay(payment);
    setOpen(true);
  };

  const onlineTopUp = async () => {
    if (payAmount === 0) {
      await getAmount();
    }
    if (topUpCount < minTopUp) {
      showError('Rechargequantity不能小于' + minTopUp);
      return;
    }
    setOpen(false);
    try {
      setIsPaying(true);
      const res = await API.post('/api/user/pay', {
        amount: parseInt(topUpCount),
        top_up_code: topUpCode,
        payment_method: payWay,
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        // showInfo(message);
        if (message === 'success') {
          location.href = data.payLink;
        } else {
          setIsPaying(false);
          showError(data);
        }
      } else {
        setIsPaying(false);
        showError(res);
      }
    } catch (err) {
      console.log(err);
    } finally {
    }
  };

  const getUserQuota = async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      setUserQuota(data.quota);
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.top_up_link) {
        setTopUpLink(status.top_up_link);
      }
      if (status.min_topup) {
        setMinTopUp(status.min_topup);
      }
      if (status.payment_enabled) {
        setPaymentEnabled(status.payment_enabled);
      }
    }
    getUserQuota().then();
  }, []);

  const renderAmount = () => {
    // console.log(amount);
    return payAmount + 'CNY';
  };

  const getAmount = async (value) => {
    if (value === undefined) {
      value = topUpCount;
    }
    try {
      const res = await API.post('/api/user/amount', {
        amount: parseFloat(value),
        top_up_code: topUpCode,
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        // showInfo(message);
        if (message === 'success') {
          setPayAmount(parseFloat(data.payAmount));
          setChargedAmount(parseFloat(data.chargedAmount));
        } else {
          showError(data);
          // setTopUpCount(parseInt(res.data.count));
          // setAmount(parseInt(data));
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
    } finally {
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <div>
      <Layout>
        <Layout.Header>
          <h3>我的Wallet</h3>
        </Layout.Header>
        <Layout.Content>
          <Modal
            title='OK要Recharge吗'
            visible={open}
            onOk={onlineTopUp}
            onCancel={handleCancel}
            maskClosable={false}
            size={'small'}
            centered={true}
          >
            <p>
              Rechargequantity：{topUpCount}$（实到：{chargedAmount}$）
            </p>
            <p>Actual payment amount: {renderAmount()}</p>
            <p>是否确认Recharge？</p>
          </Modal>
          <div
            style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}
          >
            <Card style={{ width: '500px', padding: '20px' }}>
              <Title level={3} style={{ textAlign: 'center' }}>
                Balance {renderQuota(userQuota)}
              </Title>
              <div style={{ marginTop: 20 }}>
                <Divider>RedeemBalance</Divider>
                <Form>
                  <Form.Input
                    field={'redemptionCode'}
                    label={'Redeem码'}
                    placeholder='Redeem码'
                    name='redemptionCode'
                    value={redemptionCode}
                    onChange={(value) => {
                      setRedemptionCode(value);
                    }}
                  />
                  <Space>
                    {topUpLink ? (
                      <Button
                        type={'primary'}
                        theme={'solid'}
                        onClick={openTopUpLink}
                      >
                        获取Redeem码
                      </Button>
                    ) : null}
                    <Button
                      type={'warning'}
                      theme={'solid'}
                      onClick={topUp}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Redeem中...' : 'Redeem'}
                    </Button>
                  </Space>
                </Form>
              </div>
              {paymentEnabled ? (
                <div style={{ marginTop: 20 }}>
                  <Divider>在线Recharge</Divider>
                  <Form>
                    <Form.Input
                      disabled={!paymentEnabled}
                      field={'redemptionCount'}
                      label={'Actual payment amount: ' + renderAmount()}
                      placeholder={'Rechargequantity，必须整数，lowest' + minTopUp + '$'}
                      name='redemptionCount'
                      type={'number'}
                      value={topUpCount}
                      suffix={'$'}
                      min={minTopUp}
                      defaultValue={minTopUp}
                      max={100000}
                      onChange={async (value) => {
                        if (value < 1) {
                          value = 1;
                        }
                        if (value > 100000) {
                          value = 100000;
                        }
                        setTopUpCount(value);
                        await getAmount(value);
                      }}
                    />
                    <Space>
                      <Button
                        style={{ backgroundColor: '#b161fe' }}
                        type={'primary'}
                        disabled={isPaying}
                        theme={'solid'}
                        onClick={async () => {
                          preTopUp('stripe');
                        }}
                      >
                        {isPaying ? 'Paying' : '去支付'}
                      </Button>
                    </Space>
                  </Form>
                </div>
              ) : (
                <></>
              )}
              {/*<div style={{ display: 'flex', justifyContent: 'right' }}>*/}
              {/*    <Text>*/}
              {/*        <Link onClick={*/}
              {/*            async () => {*/}
              {/*                window.location.href = '/topup/history'*/}
              {/*            }*/}
              {/*        }>Recharge记录</Link>*/}
              {/*    </Text>*/}
              {/*</div>*/}
            </Card>
          </div>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default TopUp;
