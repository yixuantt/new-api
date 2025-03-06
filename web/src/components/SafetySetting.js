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

const SafetySetting = () => {
  let [inputs, setInputs] = useState({
    PasswordLoginEnabled: '',
    PasswordRegisterEnabled: '',
    EmailVerificationEnabled: '',
    GitHubOAuthEnabled: '',
    GitHubClientId: '',
    GitHubClientSecret: '',
    Notice: '',
    SMTPServer: '',
    SMTPPort: '',
    SMTPAccount: '',
    SMTPFrom: '',
    SMTPToken: '',
    ServerAddress: '',
    WorkerUrl: '',
    WorkerValidKey: '',
    EpayId: '',
    EpayKey: '',
    Price: 7.3,
    MinTopUp: 1,
    TopupGroupRatio: '',
    PayAddress: '',
    CustomCallbackAddress: '',
    Footer: '',
    WeChatAuthEnabled: '',
    WeChatServerAddress: '',
    WeChatServerToken: '',
    WeChatAccountQRCodeImageURL: '',
    TurnstileCheckEnabled: '',
    TurnstileSiteKey: '',
    TurnstileSecretKey: '',
    RegisterEnabled: '',
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
      case 'WeChatAuthEnabled':
      case 'TelegramOAuthEnabled':
      case 'TurnstileCheckEnabled':
      case 'EmailDomainRestrictionEnabled':
      case 'EmailAliasRestrictionEnabled':
      case 'SMTPSSLEnabled':
      case 'RegisterEnabled':
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
      if (key === 'Price') {
        value = parseFloat(value);
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
      name === 'WorkerUrl' ||
      name === 'WorkerValidKey' ||
      name === 'EpayId' ||
      name === 'EpayKey' ||
      name === 'Price' ||
      name === 'PayAddress' ||
      name === 'GitHubClientId' ||
      name === 'GitHubClientSecret' ||
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

  const submitWorker = async () => {
    let WorkerUrl = removeTrailingSlash(inputs.WorkerUrl);
    await updateOption('WorkerUrl', WorkerUrl);
    if (inputs.WorkerValidKey !== '') {
      await updateOption('WorkerValidKey', inputs.WorkerValidKey);
    }
  };

  const submitPayAddress = async () => {
    if (inputs.ServerAddress === '') {
      showError('请先填写Server Address');
      return;
    }
    if (originInputs['TopupGroupRatio'] !== inputs.TopupGroupRatio) {
      if (!verifyJSON(inputs.TopupGroupRatio)) {
        showError('RechargeGroup倍率不是合法的 JSON 字符串');
        return;
      }
      await updateOption('TopupGroupRatio', inputs.TopupGroupRatio);
    }
    let PayAddress = removeTrailingSlash(inputs.PayAddress);
    await updateOption('PayAddress', PayAddress);
    if (inputs.EpayId !== '') {
      await updateOption('EpayId', inputs.EpayId);
    }
    if (inputs.EpayKey !== undefined && inputs.EpayKey !== '') {
      await updateOption('EpayKey', inputs.EpayKey);
    }
    await updateOption('Price', '' + inputs.Price);
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
            通用Settings
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
          <Header as='h3' inverted={isDark}>
            ProxySettings（支持{' '}
            <a
              href='https://github.com/Calcium-Ion/new-api-worker'
              target='_blank'
              rel='noreferrer'
            >
              new-api-worker
            </a>
            ）
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label='Worker地址，不填写则不EnableProxy'
              placeholder='For example：https://workername.yourdomain.workers.dev'
              value={inputs.WorkerUrl}
              name='WorkerUrl'
              onChange={handleInputChange}
            />
            <Form.Input
              label='WorkerKey，根据你部署的 Worker 填写'
              placeholder='For example：your_secret_key'
              value={inputs.WorkerValidKey}
              name='WorkerValidKey'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Button onClick={submitWorker}>更新WorkerSettings</Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            支付Settings（当前仅支持易支付接口，Default使用上方Server Address作为回调地址！）
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label='支付地址，不填写则不Enable在线支付'
              placeholder='For example：https://yourdomain.com'
              value={inputs.PayAddress}
              name='PayAddress'
              onChange={handleInputChange}
            />
            <Form.Input
              label='易支付商户ID'
              placeholder='For example：0001'
              value={inputs.EpayId}
              name='EpayId'
              onChange={handleInputChange}
            />
            <Form.Input
              label='易支付商户Key'
              placeholder='Sensitive information will not be displayed in the frontend'
              value={inputs.EpayKey}
              name='EpayKey'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Input
              label='回调地址，不填写则使用上方Server Address作为回调地址'
              placeholder='For example：https://yourdomain.com'
              value={inputs.CustomCallbackAddress}
              name='CustomCallbackAddress'
              onChange={handleInputChange}
            />
            <Form.Input
              label='Recharge价格（x元/美金）'
              placeholder='For example：7，就是7元/美金'
              value={inputs.Price}
              name='Price'
              min={0}
              onChange={handleInputChange}
            />
            <Form.Input
              label='最低Recharge美元数量（以美金为单位，如果使用Quota请自行换算！）'
              placeholder='For example：2，就是最低Recharge2$'
              value={inputs.MinTopUp}
              name='MinTopUp'
              min={1}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.TextArea
              label='RechargeGroup倍率'
              name='TopupGroupRatio'
              onChange={handleInputChange}
              style={{ minHeight: 250, fontFamily: 'JetBrains Mono, Consolas' }}
              autoComplete='new-password'
              value={inputs.TopupGroupRatio}
              placeholder='Is a JSON text，键为组Name，Value is the rate'
            />
          </Form.Group>
          <Form.Button onClick={submitPayAddress}>更新支付Settings</Form.Button>
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
                    确定
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
              label='允许通过 GitHub 账户Login & Register'
              name='GitHubOAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.WeChatAuthEnabled === 'true'}
              label='允许通过微信Login & Register'
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
          </Form.Group>
          <Divider />
          <Header as='h3' inverted={isDark}>
            配置邮箱域名白名单
            <Header.Subheader>
              用以防止恶意User利用临时邮箱批量Register
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Checkbox
              label='Enable邮箱域名白名单'
              name='EmailDomainRestrictionEnabled'
              onChange={handleInputChange}
              checked={inputs.EmailDomainRestrictionEnabled === 'true'}
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Checkbox
              label='Enable邮箱别名限制（For example：ab.cd@gmail.com）'
              name='EmailAliasRestrictionEnabled'
              onChange={handleInputChange}
              checked={inputs.EmailAliasRestrictionEnabled === 'true'}
            />
          </Form.Group>
          <Form.Group widths={2}>
            <Form.Dropdown
              label='允许的邮箱域名'
              placeholder='允许的邮箱域名'
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
              label='添加新的允许的邮箱域名'
              action={
                <Button
                  type='button'
                  onClick={() => {
                    submitNewRestrictedDomain();
                  }}
                >
                  填入
                </Button>
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitNewRestrictedDomain();
                }
              }}
              autoComplete='new-password'
              placeholder='Enter新的允许的邮箱域名'
              value={restrictedDomainInput}
              onChange={(e, { value }) => {
                setRestrictedDomainInput(value);
              }}
            />
          </Form.Group>
          <Form.Button onClick={submitEmailDomainWhitelist}>
            保存邮箱域名白名单Settings
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
              label='EnableSMTP SSL（465端口强制开启）'
              name='SMTPSSLEnabled'
              onChange={handleInputChange}
              checked={inputs.SMTPSSLEnabled === 'true'}
            />
          </Form.Group>
          <Form.Button onClick={submitSMTP}>保存 SMTP Settings</Form.Button>
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
            保存 GitHub OAuth Settings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configure WeChat Server
            <Header.Subheader>
              用以支持通过微信进行LoginRegister，
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
              placeholder='Enter一个图片链接'
            />
          </Form.Group>
          <Form.Button onClick={submitWeChat}>
            保存 WeChat Server Settings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            配置 Telegram Login
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
              placeholder='Enter你的 Telegram Bot Name'
            />
          </Form.Group>
          <Form.Button onClick={submitTelegramSettings}>
            保存 Telegram LoginSettings
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            Configure Turnstile
            <Header.Subheader>
              用以支持User校验，
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
            保存 Turnstile Settings
          </Form.Button>
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default SystemSetting;
