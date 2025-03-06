import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API, getLogo, showError, showInfo, showSuccess } from '../helpers';
import Turnstile from 'react-turnstile';
import { Button, Card, Form, Layout } from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';

const RegisterForm = () => {
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    verification_code: '',
  });
  const { username, password, password2 } = inputs;
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const logo = getLogo();
  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setShowEmailVerification(status.email_verification);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  });

  let navigate = useNavigate();

  function handleChange(name, value) {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    if (password.length < 8) {
      showInfo('Password length must not be less than 8 characters！');
      return;
    }
    if (password !== password2) {
      showInfo('两次Enter的Password不一致');
      return;
    }
    if (username && password) {
      if (turnstileEnabled && turnstileToken === '') {
        showInfo('Please retry in a few seconds，Turnstile 正在检查User环境！');
        return;
      }
      setLoading(true);
      if (!affCode) {
        affCode = localStorage.getItem('aff');
      }
      inputs.aff_code = affCode;
      const res = await API.post(
        `/api/user/register?turnstile=${turnstileToken}`,
        inputs,
      );
      const { success, message } = res.data;
      if (success) {
        localStorage.removeItem('aff');

        navigate('/login');
        showSuccess('Register成功！');
      } else {
        showError(message);
      }
      setLoading(false);
    }
  }

  const sendVerificationCode = async () => {
    if (inputs.email === '') return;
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('Please retry in a few seconds，Turnstile 正在检查User环境！');
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`,
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('Verification Code sent successfully，请检查你的邮箱！');
    } else {
      showError(message);
    }
    setLoading(false);
  };

  return (
    <div>
      <Layout>
        <Layout.Header></Layout.Header>
        <Layout.Content>
          <div
            style={{
              justifyContent: 'center',
              display: 'flex',
              marginTop: 120,
            }}
          >
            <div style={{ width: 500 }}>
              <Card>
                <Title heading={2} style={{ textAlign: 'center' }}>
                  新UserRegister
                </Title>
                <Form size='large'>
                  <Form.Input
                    field={'username'}
                    label={'Username'}
                    placeholder='Username'
                    name='username'
                    onChange={(value) => handleChange('username', value)}
                  />
                  <Form.Input
                    field={'password'}
                    label={'Password'}
                    placeholder='Password，最短 8 位，最长 20 位'
                    name='password'
                    type='password'
                    onChange={(value) => handleChange('password', value)}
                  />
                  <Form.Input
                    field={'password2'}
                    label={'确认Password'}
                    placeholder='确认Password'
                    name='password2'
                    type='password'
                    onChange={(value) => handleChange('password2', value)}
                  />
                  {showEmailVerification ? (
                    <>
                      <Form.Input
                        field={'email'}
                        label={'邮箱'}
                        placeholder='EnterEmail Address'
                        onChange={(value) => handleChange('email', value)}
                        name='email'
                        type='email'
                        suffix={
                          <Button
                            onClick={sendVerificationCode}
                            disabled={loading}
                          >
                            获取Verification Code
                          </Button>
                        }
                      />
                      <Form.Input
                        field={'verification_code'}
                        label={'Verification Code'}
                        placeholder='EnterVerification Code'
                        onChange={(value) =>
                          handleChange('verification_code', value)
                        }
                        name='verification_code'
                      />
                    </>
                  ) : (
                    <></>
                  )}
                  <Button
                    theme='solid'
                    style={{ width: '100%' }}
                    type={'primary'}
                    size='large'
                    htmlType={'submit'}
                    onClick={handleSubmit}
                  >
                    Register
                  </Button>
                </Form>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 20,
                  }}
                >
                  <Text>
                    Already have an account？
                    <Link to='/login'>Click to log in</Link>
                  </Text>
                </div>
              </Card>
              {turnstileEnabled ? (
                <Turnstile
                  sitekey={turnstileSiteKey}
                  onVerify={(token) => {
                    setTurnstileToken(token);
                  }}
                />
              ) : (
                <></>
              )}
            </div>
          </div>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default RegisterForm;
