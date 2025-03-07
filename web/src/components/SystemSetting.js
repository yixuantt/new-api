import React, { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Form,
  Grid,
  Header,
  Message,
  Modal,
} from 'semantic-ui-react';
import { API, removeTrailingSlash, showError, verifyJSON } from '../helpers';

import { useTheme } from '../context/Theme';

const SystemSetting = () => {
  let [inputs, setInputs] = useState({
    PasswordLoginEnabled: '',
    PasswordRegisterEnabled: '',
    EmailVerificationEnabled: '',
    GitHubOAuthEnabled: '',
    GitHubClientId: '',
    GitHubClientSecret: '',
    LinuxDoOAuthEnabled: '',
    LinuxDoClientId: '',
    LinuxDoClientSecret: '',
    LinuxDoMinLevel: 0,
    Notice: '',
    SMTPServer: '',
    SMTPPort: '',
    SMTPAccount: '',
    SMTPFrom: '',
    SMTPToken: '',
    ServerAddress: '',
    OutProxyUrl: '',
    StripeApiSecret: '',
    StripeWebhookSecret: '',
    StripePriceId: '',
    PaymentEnabled: false,
    StripeUnitPrice: 8.0,
    MinTopUp: 5,
    TopupGroupRatio: '',
    Footer: '',
    WeChatAuthEnabled: '',
    WeChatServerAddress: '',
    WeChatServerToken: '',
    WeChatAccountQRCodeImageURL: '',
    TurnstileCheckEnabled: '',
    TurnstileSiteKey: '',
    TurnstileSecretKey: '',
    RegisterEnabled: '',
    UserSelfDeletionEnabled: false,
    EmailDomainRestrictionEnabled: '',
    EmailAliasRestrictionEnabled: '',
    SMTPSSLEnabled: '',
    EmailDomainWhitelist: [],
    // telegram login
    TelegramOAuthEnabled: '',
    TelegramBotToken: '',
    TelegramBotName: '',
  });
  const [originInputs, setOriginInputs] = useState({});
  let [loading, setLoading] = useState(false);
  const [EmailDomainWhitelist, setEmailDomainWhitelist] = useState([]);
  const [restrictedDomainInput, setRestrictedDomainInput] = useState('');
  const [showPasswordWarningModal, setShowPasswordWarningModal] =
    useState(false);

  const theme = useTheme();
  const isDark = theme === 'dark';

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (item.key === 'TopupGroupRatio') {
          item.value = JSON.stringify(JSON.parse(item.value), null, 2);
        }
        newInputs[item.key] = item.value;
      });
      setInputs({
        ...newInputs,
        EmailDomainWhitelist: newInputs.EmailDomainWhitelist.split(','),
      });
      setOriginInputs(newInputs);

      setEmailDomainWhitelist(
        newInputs.EmailDomainWhitelist.split(',').map((item) => {
          return { key: item, text: item, value: item };
        }),
      );
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getOptions().then();
  }, []);
  useEffect(() => {}, [inputs.EmailDomainWhitelist]);

  const updateOption = async (key, value) => {
    setLoading(true);
    switch (key) {
      case 'PasswordLoginEnabled':
      case 'PasswordRegisterEnabled':
      case 'EmailVerificationEnabled':
      case 'GitHubOAuthEnabled':
      case 'LinuxDoOAuthEnabled':
      case 'WeChatAuthEnabled':
      case 'TelegramOAuthEnabled':
      case 'TurnstileCheckEnabled':
      case 'EmailDomainRestrictionEnabled':
      case 'EmailAliasRestrictionEnabled':
      case 'SMTPSSLEnabled':
      case 'RegisterEnabled':
      case 'UserSelfDeletionEnabled':
      case 'PaymentEnabled':
        value = inputs[key] === 'true' ? 'false' : 'true';
        break;
      default:
        break;
    }
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      if (key === 'EmailDomainWhitelist') {
        value = value.split(',');
      }
      setInputs((inputs) => ({
        ...inputs,
        [key]: value,
      }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handleInputChange = async (e, { name, value }) => {
    if (name === 'PasswordLoginEnabled' && inputs[name] === 'true') {
      // block disabling password login
      setShowPasswordWarningModal(true);
      return;
    }
    if (
      name === 'Notice' ||
      (name.startsWith('SMTP') && name !== 'SMTPSSLEnabled') ||
      name === 'ServerAddress' ||
      name === 'OutProxyUrl' ||
      name === 'StripeApiSecret' ||
      name === 'StripeWebhookSecret' ||
      name === 'StripePriceId' ||
      name === 'StripeUnitPrice' ||
      name === 'MinTopUp' ||
      name === 'GitHubClientId' ||
      name === 'GitHubClientSecret' ||
      name === 'LinuxDoClientId' ||
      name === 'LinuxDoClientSecret' ||
      name === 'LinuxDoMinLevel' ||
      name === 'WeChatServerAddress' ||
      name === 'WeChatServerToken' ||
      name === 'WeChatAccountQRCodeImageURL' ||
      name === 'TurnstileSiteKey' ||
      name === 'TurnstileSecretKey' ||
      name === 'EmailDomainWhitelist' ||
      name === 'TopupGroupRatio' ||
      name === 'TelegramBotToken' ||
      name === 'TelegramBotName'
    ) {
      setInputs((inputs) => ({ ...inputs, [name]: value }));
    } else {
      await updateOption(name, value);
    }
  };

  const submitServerAddress = async () => {
    let ServerAddress = removeTrailingSlash(inputs.ServerAddress);
    await updateOption('ServerAddress', ServerAddress);
  };

  const submitOutProxyUrl = async () => {
    let OutProxyUrl = removeTrailingSlash(inputs.OutProxyUrl);
    await updateOption('OutProxyUrl', OutProxyUrl);
  };

  const submitPaymentConfig = async () => {
    if (inputs.ServerAddress === '') {
      showError('请先填写Server Address');
      return;
    }
    if (originInputs['TopupGroupRatio'] !== inputs.TopupGroupRatio) {
      if (!verifyJSON(inputs.TopupGroupRatio)) {
        showError('RechargeGroupRatioNot a valid JSON string');
        return;
      }
      await updateOption('TopupGroupRatio', inputs.TopupGroupRatio);
    }
    let stripeApiSecret = removeTrailingSlash(inputs.StripeApiSecret);
    if (stripeApiSecret && !stripeApiSecret.startsWith('sk_')) {
      showError('Enter了None效的Stripe APIKey');
      return;
    }
    stripeApiSecret && (await updateOption('StripeApiSecret', stripeApiSecret));

    let stripeWebhookSecret = removeTrailingSlash(inputs.StripeWebhookSecret);
    if (stripeWebhookSecret && !stripeWebhookSecret.startsWith('whsec_')) {
      showError('Enter了None效的Stripe Webhook签名Key');
      return;
    }
    stripeWebhookSecret &&
      (await updateOption('StripeWebhookSecret', stripeWebhookSecret));

    let stripePriceId = removeTrailingSlash(inputs.StripePriceId);
    if (stripePriceId && !stripePriceId.startsWith('price_')) {
      showError('Enter the Stripe item PricingID with None effect');
      return;
    }
    await updateOption('StripePriceId', stripePriceId);

    await updateOption('PaymentEnable', inputs.PaymentEnabled);
    await updateOption('StripeUnitPrice', inputs.StripeUnitPrice);
    await updateOption('MinTopUp', inputs.MinTopUp);
  };

  const submitSMTP = async () => {
    if (originInputs['SMTPServer'] !== inputs.SMTPServer) {
      await updateOption('SMTPServer', inputs.SMTPServer);
    }
    if (originInputs['SMTPAccount'] !== inputs.SMTPAccount) {
      await updateOption('SMTPAccount', inputs.SMTPAccount);
    }
    if (originInputs['SMTPFrom'] !== inputs.SMTPFrom) {
      await updateOption('SMTPFrom', inputs.SMTPFrom);
    }
    if (
      originInputs['SMTPPort'] !== inputs.SMTPPort &&
      inputs.SMTPPort !== ''
    ) {
      await updateOption('SMTPPort', inputs.SMTPPort);
    }
    if (
      originInputs['SMTPToken'] !== inputs.SMTPToken &&
      inputs.SMTPToken !== ''
    ) {
      await updateOption('SMTPToken', inputs.SMTPToken);
    }
  };

  const submitEmailDomainWhitelist = async () => {
    if (
      originInputs['EmailDomainWhitelist'] !==
        inputs.EmailDomainWhitelist.join(',') &&
      inputs.SMTPToken !== ''
    ) {
      await updateOption(
        'EmailDomainWhitelist',
        inputs.EmailDomainWhitelist.join(','),
      );
    }
  };

  const submitWeChat = async () => {
    if (originInputs['WeChatServerAddress'] !== inputs.WeChatServerAddress) {
      await updateOption(
        'WeChatServerAddress',
        removeTrailingSlash(inputs.WeChatServerAddress),
      );
    }
    if (
      originInputs['WeChatAccountQRCodeImageURL'] !==
      inputs.WeChatAccountQRCodeImageURL
    ) {
      await updateOption(
        'WeChatAccountQRCodeImageURL',
        inputs.WeChatAccountQRCodeImageURL,
      );
    }
    if (
      originInputs['WeChatServerToken'] !== inputs.WeChatServerToken &&
      inputs.WeChatServerToken !== ''
    ) {
      await updateOption('WeChatServerToken', inputs.WeChatServerToken);
    }
  };

  const submitGitHubOAuth = async () => {
    if (originInputs['GitHubClientId'] !== inputs.GitHubClientId) {
      await updateOption('GitHubClientId', inputs.GitHubClientId);
    }
    if (
      originInputs['GitHubClientSecret'] !== inputs.GitHubClientSecret &&
      inputs.GitHubClientSecret !== ''
    ) {
      await updateOption('GitHubClientSecret', inputs.GitHubClientSecret);
    }
  };

  const submitLinuxDoOAuth = async () => {
    if (originInputs['LinuxDoClientId'] !== inputs.LinuxDoClientId) {
      await updateOption('LinuxDoClientId', inputs.LinuxDoClientId);
    }
    if (
      originInputs['LinuxDoClientSecret'] !== inputs.LinuxDoClientSecret &&
      inputs.LinuxDoClientSecret !== ''
    ) {
      await updateOption('LinuxDoClientSecret', inputs.LinuxDoClientSecret);
    }
    if (originInputs['LinuxDoMinLevel'] !== inputs.LinuxDoMinLevel) {
      await updateOption('LinuxDoMinLevel', inputs.LinuxDoMinLevel);
    }
  };

  const submitTelegramSettings = async () => {
    // await updateOption('TelegramOAuthEnabled', inputs.TelegramOAuthEnabled);
    await updateOption('TelegramBotToken', inputs.TelegramBotToken);
    await updateOption('TelegramBotName', inputs.TelegramBotName);
  };

  const submitTurnstile = async () => {
    if (originInputs['TurnstileSiteKey'] !== inputs.TurnstileSiteKey) {
      await updateOption('TurnstileSiteKey', inputs.TurnstileSiteKey);
    }
    if (
      originInputs['TurnstileSecretKey'] !== inputs.TurnstileSecretKey &&
      inputs.TurnstileSecretKey !== ''
    ) {
      await updateOption('TurnstileSecretKey', inputs.TurnstileSecretKey);
    }
  };

  const submitNewRestrictedDomain = () => {
    const localDomainList = inputs.EmailDomainWhitelist;
    if (
      restrictedDomainInput !== '' &&
      !localDomainList.includes(restrictedDomainInput)
    ) {
      setRestrictedDomainInput('');
      setInputs({
        ...inputs,
        EmailDomainWhitelist: [...localDomainList, restrictedDomainInput],
      });
      setEmailDomainWhitelist([
        ...EmailDomainWhitelist,
        {
          key: restrictedDomainInput,
          text: restrictedDomainInput,
          value: restrictedDomainInput,
        },
      ]);
    }
  };

  return (
    <Grid columns={1}>
      <Grid.Column>
        <Form loading={loading} inverted={isDark}>
          <Header as='h3' inverted={isDark}>
            General Settings
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label='Server Address'
              placeholder='For example：https://yourdomain.com'
              value={inputs.ServerAddress}
              name='ServerAddress'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Button onClick={submitServerAddress}>
            更新Server Address
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            ProxySettings
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label='出口Proxy地址'
              placeholder='For example：http://1.2.3.4:8888'
              value={inputs.OutProxyUrl}
              name='OutProxyUrl'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Button onClick={submitOutProxyUrl}>更新ProxySettings</Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            支付Settings（当前仅支持Stripe Checkout）
            <Header.Subheader>
              Key、Webhook 等Settings请
              <a
                href='https://dashboard.stripe.com/developers'
                target='_blank'
                rel='noreferrer'
              >
                Click here
              </a>
              进行Settings，最好先在
              <a
                href='https://dashboard.stripe.com/test/developers'
                target='_blank'
                rel='noreferrer'
              >
                Test环境
              </a>
              进行Test
            </Header.Subheader>
          </Header>
          <Message>
            Webhook 填：
            <code>{`${inputs.ServerAddress}/api/stripe/webhook`}</code>
            ，需要包含事件：<code>checkout.session.completed</code> 和{' '}
            <code>checkout.session.expired</code>
          </Message>
          <Form.Group widths='equal'>
            <Form.Input
              label='APIKey'
              placeholder='sk_xxx的StripeKey，敏感信息不show示'
              value={inputs.StripeApiSecret}
              name='StripeApiSecret'
              onChange={handleInputChange}
            />
            <Form.Input
              label='Webhook签名Key'
              placeholder='whsec_xxx的Webhook签名Key，敏感信息不show示'
              value={inputs.StripeWebhookSecret}
              name='StripeWebhookSecret'
              onChange={handleInputChange}
            />
            <Form.Input
              label='商品PricingID'
              placeholder='price_xxx的商品PricingID，新建产品后可获得'
              value={inputs.StripePriceId}
              name='StripePriceId'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Input
              label='商品单价（CNY）'
              placeholder='商品的RMBPricing'
              value={inputs.StripeUnitPrice}
              name='StripeUnitPrice'
              type={'number'}
              min={0}
              onChange={handleInputChange}
            />
            <Form.Input
              label='lowestRechargequantity'
              placeholder='For example：2，就是lowestRecharge2件商品'
              value={inputs.MinTopUp}
              name='MinTopUp'
              type={'number'}
              min={1}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.TextArea
              label='RechargeGroupRatio'
              name='TopupGroupRatio'
              onChange={handleInputChange}
              style={{ minHeight: 250, fontFamily: 'JetBrains Mono, Consolas' }}
              autoComplete='new-password'
              value={inputs.TopupGroupRatio}
              placeholder='Is a JSON text，键为组Name，Value is the rate'
            />
          </Form.Group>
          <Form.Group inline>
            <Form.Button onClick={submitPaymentConfig}>
              更新支付Settings
            </Form.Button>
            <Form.Checkbox
              checked={inputs.PaymentEnabled === 'true'}
              label='open启在线支付'
              name='PaymentEnabled'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Divider />
          <Header as='h3' inverted={isDark}>
            配置LoginRegister
          </Header>
          <Form.Group inline>
            <Form.Checkbox
              checked={inputs.PasswordLoginEnabled === 'true'}
              label='Allow login via password'
              name='PasswordLoginEnabled'
              onChange={handleInputChange}
            />
            {showPasswordWarningModal && (
              <Modal
                open={showPasswordWarningModal}
                onClose={() => setShowPasswordWarningModal(false)}
                size={'tiny'}
                style={{ maxWidth: '450px' }}
              >
                <Modal.Header>警告</Modal.Header>
                <Modal.Content>
                  <p>
                    CancelPasswordLogin将导致所有未Bind其他Login方式的User（包括Admin）None法通过PasswordLogin，确认Cancel？
                  </p>
                </Modal.Content>
                <Modal.Actions>
                  <Button onClick={() => setShowPasswordWarningModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    color='yellow'
                    onClick={async () => {
                      setShowPasswordWarningModal(false);
                      await updateOption('PasswordLoginEnabled', 'false');
                    }}
                  >
                    OK
                  </Button>
                </Modal.Actions>
              </Modal>
            )}
            <Form.Checkbox
              checked={inputs.PasswordRegisterEnabled === 'true'}
              label='允许通过Password进行Register'
              name='PasswordRegisterEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.EmailVerificationEnabled === 'true'}
              label='通过PasswordRegister时需要进行Email Verification'
              name='EmailVerificationEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.GitHubOAuthEnabled === 'true'}
              label='允许通过 GitHub AccountLogin & Register'
              name='GitHubOAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.LinuxDoOAuthEnabled === 'true'}
              label='允许通过 LINUX DO AccountLogin & Register'
              name='LinuxDoOAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.WeChatAuthEnabled === 'true'}
              label='允许通过WeChatLogin & Register'
              name='WeChatAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.TelegramOAuthEnabled === 'true'}
              label='允许通过 Telegram 进行Login'
              name='TelegramOAuthEnabled'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group inline>
            <Form.Checkbox
              checked={inputs.RegisterEnabled === 'true'}
              label='允许新UserRegister（此项为否时，新User将None法以任何方式进行Register）'
              name='RegisterEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.TurnstileCheckEnabled === 'true'}
              label='Enable Turnstile User校验'
              name='TurnstileCheckEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.UserSelfDeletionEnabled === 'true'}
              label='允许User自行DeleteAccount'
              name='UserSelfDeletionEnabled'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Divider />
          <Header as='h3' inverted={isDark}>
            配置Mail域名白名单
            <Header.Subheader>
              用以防止恶意User利用临时Mail批量Register
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Checkbox
              label='EnableMail域名白名单'
              name='EmailDomainRestrictionEnabled'
              onChange={handleInputChange}
              checked={inputs.EmailDomainRestrictionEnabled === 'true'}
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Checkbox
              label='EnableMail别名限制（For example：ab.cd@gmail.com）'
              name='EmailAliasRestrictionEnabled'
              onChange={handleInputChange}
              checked={inputs.EmailAliasRestrictionEnabled === 'true'}
            />
          </Form.Group>
          <Form.Group widths={2}>
            <Form.Dropdown
              label='允许的Mail域名'
              placeholder='允许的Mail域名'
              name='EmailDomainWhitelist'
              required
              fluid
              multiple
              selection
              onChange={handleInputChange}
              value={inputs.EmailDomainWhitelist}
              autoComplete='new-password'
              options={EmailDomainWhitelist}
            />
            <Form.Input
              label='Add 新的允许的Mail域名'
              action={
                <Button
                  type='button'
                  onClick={() => {
                    submitNewRestrictedDomain();
                  }}
                >
                  Fill
                </Button>
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitNewRestrictedDomain();
                }
              }}
              autoComplete='new-password'
              placeholder='Enter新的允许的Mail域名'
              value={restrictedDomainInput}
              onChange={(e, { value }) => {
                setRestrictedDomainInput(value);
              }}
            />
          </Form.Group>
          <Form.Button onClick={submitEmailDomainWhitelist}>
            saveMail域名白名单Settings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configure SMTP
            <Header.Subheader>To support the system email sending</Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label='SMTP Server Address'
              name='SMTPServer'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPServer}
              placeholder='For example：smtp.qq.com'
            />
            <Form.Input
              label='SMTP Port'
              name='SMTPPort'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPPort}
              placeholder='Default: 587'
            />
            <Form.Input
              label='SMTP Account'
              name='SMTPAccount'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPAccount}
              placeholder='通常是Email Address'
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Input
              label='SMTP Sender email'
              name='SMTPFrom'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPFrom}
              placeholder='通常和Email Address保持一致'
            />
            <Form.Input
              label='SMTP Access Credential'
              name='SMTPToken'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              checked={inputs.RegisterEnabled === 'true'}
              placeholder='Sensitive information will not be displayed in the frontend'
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Checkbox
              label='EnableSMTP SSL（465端口强制open启）'
              name='SMTPSSLEnabled'
              onChange={handleInputChange}
              checked={inputs.SMTPSSLEnabled === 'true'}
            />
          </Form.Group>
          <Form.Button onClick={submitSMTP}>save SMTP Settings</Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configure GitHub OAuth App
            <Header.Subheader>
              用以支持通过 GitHub 进行LoginRegister，
              <a
                href='https://github.com/settings/developers'
                target='_blank'
                rel='noreferrer'
              >
                Click here
              </a>
              Manage your GitHub OAuth App
            </Header.Subheader>
          </Header>
          <Message>
            Fill in the Homepage URL <code>{inputs.ServerAddress}</code>
            ，Fill in the Authorization callback URL{' '}
            <code>{`${inputs.ServerAddress}/oauth/github`}</code>
          </Message>
          <Form.Group widths={3}>
            <Form.Input
              label='GitHub Client ID'
              name='GitHubClientId'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.GitHubClientId}
              placeholder='Enter你Register的 GitHub OAuth APP 的 ID'
            />
            <Form.Input
              label='GitHub Client Secret'
              name='GitHubClientSecret'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              value={inputs.GitHubClientSecret}
              placeholder='Sensitive information will not be displayed in the frontend'
            />
          </Form.Group>
          <Form.Button onClick={submitGitHubOAuth}>
            save GitHub OAuth Settings
          </Form.Button>
          <Divider />
          <Header as='h3'>
            配置 LINUX DO Oauth
            <Header.Subheader>
              用以支持通过 LINUX DO 进行LoginRegister，
              <a
                href='https://connect.linux.do'
                target='_blank'
                rel='noreferrer'
              >
                Click here
              </a>
              Manage你的 LINUX DO OAuth
            </Header.Subheader>
          </Header>
          <Message>
            Fill in the Homepage URL <code>{inputs.ServerAddress}</code>
            ，Fill in the Authorization callback URL{' '}
            <code>{`${inputs.ServerAddress}/oauth/linuxdo`}</code>
          </Message>
          <Form.Group widths={3}>
            <Form.Input
              label='LINUX DO Client ID'
              name='LinuxDoClientId'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.LinuxDoClientId}
              placeholder='Enter你Register的 LINUX DO OAuth 的 ID'
            />
            <Form.Input
              label='LINUX DO Client Secret'
              name='LinuxDoClientSecret'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              value={inputs.LinuxDoClientSecret}
              placeholder='Sensitive information will not be displayed in the frontend'
            />
            <Form.Input
              label='限制lowest信任grade'
              name='LinuxDoMinLevel'
              onChange={handleInputChange}
              type='number'
              min={0}
              max={4}
              value={inputs.LinuxDoMinLevel}
              placeholder='Enter允许使用的lowest LINUX DO 信任grade'
            />
          </Form.Group>
          <Form.Button onClick={submitLinuxDoOAuth}>
            save LINUX DO OAuth Settings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configure WeChat Server
            <Header.Subheader>
              用以支持通过WeChat进行LoginRegister，
              <a
                href='https://github.com/songquanpeng/wechat-server'
                target='_blank'
                rel='noreferrer'
              >
                Click here
              </a>
              Learn about WeChat Server
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label='WeChat Server Server Address'
              name='WeChatServerAddress'
              placeholder='For example：https://yourdomain.com'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatServerAddress}
            />
            <Form.Input
              label='WeChat Server Access Credential'
              name='WeChatServerToken'
              type='password'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatServerToken}
              placeholder='Sensitive information will not be displayed in the frontend'
            />
            <Form.Input
              label='WeChat Public Account QR Code Image Link'
              name='WeChatAccountQRCodeImageURL'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatAccountQRCodeImageURL}
              placeholder='Enter一indivual图片链接'
            />
          </Form.Group>
          <Form.Button onClick={submitWeChat}>
            save WeChat Server Settings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configure Telegram Login
          </Header>
          <Form.Group inline>
            <Form.Input
              label='Telegram Bot Token'
              name='TelegramBotToken'
              onChange={handleInputChange}
              value={inputs.TelegramBotToken}
              placeholder='Enter你的 Telegram Bot Token'
            />
            <Form.Input
              label='Telegram Bot Name'
              name='TelegramBotName'
              onChange={handleInputChange}
              value={inputs.TelegramBotName}
              placeholder='Enter your Telegram Bot Name'
            />
          </Form.Group>
          <Form.Button onClick={submitTelegramSettings}>
            save Telegram LoginSettings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configure Turnstile
            <Header.Subheader>
            To support User verification,
              <a
                href='https://dash.cloudflare.com/'
                target='_blank'
                rel='noreferrer'
              >
                Click here
              </a>
              Manage your Turnstile Sites, recommend selecting Invisible Widget Type
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label='Turnstile Site Key'
              name='TurnstileSiteKey'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.TurnstileSiteKey}
              placeholder='Enter你Register的 Turnstile Site Key'
            />
            <Form.Input
              label='Turnstile Secret Key'
              name='TurnstileSecretKey'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              value={inputs.TurnstileSecretKey}
              placeholder='Sensitive information will not be displayed in the frontend'
            />
          </Form.Group>
          <Form.Button onClick={submitTurnstile}>
            save Turnstile Settings
          </Form.Button>
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default SystemSetting;
