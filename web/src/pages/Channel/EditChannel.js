import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  API,
  isMobile,
  showError,
  showInfo,
  showSuccess,
  verifyJSON,
} from '../../helpers';
import { CHANNEL_OPTIONS } from '../../constants';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import {
  SideSheet,
  Space,
  Spin,
  Button,
  Tooltip,
  Input,
  Typography,
  Select,
  TextArea,
  Checkbox,
  Banner,
} from '@douyinfe/semi-ui';
import { Divider } from 'semantic-ui-react';
import { getChannelModels, loadChannelModels } from '../../components/utils.js';
import axios from 'axios';

const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo-0301': 'gpt-3.5-turbo',
  'gpt-4-0314': 'gpt-4',
  'gpt-4-32k-0314': 'gpt-4-32k',
};

const HEADERS_EXAMPLE = {
  'headerName': 'headerValue',
}

const STATUS_CODE_MAPPING_EXAMPLE = {
  400: '500',
};

const REGION_EXAMPLE = {
  default: 'us-central1',
  'claude-3-5-sonnet-20240620': 'europe-west1',
};

const fetchButtonTips =
  '1. 新建Channel时，请求通过当前浏览器发出；2. Edit已有Channel，请求通过后端服务器发出';

function type2secretPrompt(type) {
  // inputs.type === 15 ? '按照如下格式Enter：APIKey|SecretKey' : (inputs.type === 18 ? '按照如下格式Enter：APPID|APISecret|APIKey' : '请EnterChannel对应的鉴权Key')
  switch (type) {
    case 15:
      return '按照如下格式Enter：APIKey|SecretKey';
    case 18:
      return '按照如下格式Enter：APPID|APISecret|APIKey';
    case 22:
      return '按照如下格式Enter：APIKey-AppId，For example：fastgpt-0sp2gtvfdgyi4k30jwlgwf1i-64f335d84283f05518e9e041';
    case 23:
      return '按照如下格式Enter：AppId|SecretId|SecretKey';
    case 33:
      return '按照如下格式Enter：Ak|Sk|Region';
    default:
      return '请EnterChannel对应的鉴权Key';
  }
}

const EditChannel = (props) => {
  const navigate = useNavigate();
  const channelId = props.editingChannel.id;
  const isEdit = channelId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const handleCancel = () => {
    props.handleClose();
  };
  const originInputs = {
    name: '',
    type: 1,
    key: '',
    openai_organization: '',
    max_input_tokens: 0,
    base_url: '',
    other: '',
    model_mapping: '',
    status_code_mapping: '',
    models: [],
    auto_ban: 1,
    test_model: '',
    groups: ['default'],
    headers: '',
    proxy: '',
  };
  const [batch, setBatch] = useState(false);
  const [autoBan, setAutoBan] = useState(true);
  // const [autoBan, setAutoBan] = useState(true);
  const [inputs, setInputs] = useState(originInputs);
  const [originModelOptions, setOriginModelOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [basicModels, setBasicModels] = useState([]);
  const [fullModels, setFullModels] = useState([]);
  const [customModel, setCustomModel] = useState('');
  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
    if (name === 'type') {
      let localModels = [];
      switch (value) {
        case 2:
          localModels = [
            'mj_imagine',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_uploads',
          ];
          break;
        case 5:
          localModels = [
            'swap_face',
            'mj_imagine',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_zoom',
            'mj_shorten',
            'mj_modal',
            'mj_inpaint',
            'mj_custom_zoom',
            'mj_high_variation',
            'mj_low_variation',
            'mj_pan',
            'mj_uploads',
          ];
          break;
        case 36:
          localModels = ['suno_music', 'suno_lyrics'];
          break;
        default:
          localModels = getChannelModels(value);
          break;
      }
      if (inputs.models.length === 0) {
        setInputs((inputs) => ({ ...inputs, models: localModels }));
      }
      setBasicModels(localModels);
    }
    //setAutoBan
  };

  const loadChannel = async () => {
    setLoading(true);
    let res = await API.get(`/api/channel/${channelId}`);
    if (res === undefined) {
      return;
    }
    const { success, message, data } = res.data;
    if (success) {
      if (data.models === '') {
        data.models = [];
      } else {
        data.models = data.models.split(',');
      }
      if (data.group === '') {
        data.groups = [];
      } else {
        data.groups = data.group.split(',');
      }
      if (data.model_mapping !== '') {
        data.model_mapping = JSON.stringify(
          JSON.parse(data.model_mapping),
          null,
          2,
        );
      }
      if (data.headers !== '') {
        data.headers = JSON.stringify(
            JSON.parse(data.headers),
            null,
            2,
        );
      }
      setInputs(data);
      if (data.auto_ban === 0) {
        setAutoBan(false);
      } else {
        setAutoBan(true);
      }
      setBasicModels(getChannelModels(data.type));
      // console.log(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const fetchUpstreamModelList = async (name) => {
    if (inputs['type'] !== 1) {
      showError('Only OpenAI interface format is supported');
      return;
    }
    setLoading(true);
    const models = inputs['models'] || [];
    let err = false;
    if (isEdit) {
      const res = await API.get('/api/channel/fetch_models/' + channelId);
      if (res.data && res.data?.success) {
        models.push(...res.data.data);
      } else {
        err = true;
      }
    } else {
      if (!inputs?.['key']) {
        showError('请填写Key');
        err = true;
      } else {
        try {
          const host = new URL(inputs['base_url'] || 'https://api.openai.com');

          const url = `https://${host.hostname}/v1/models`;
          const key = inputs['key'];
          const res = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${key}`,
            },
          });
          if (res.data && res.data?.success) {
            models.push(...res.data.data.map((model) => model.id));
          } else {
            err = true;
          }
        } catch (error) {
          err = true;
        }
      }
    }
    if (!err) {
      handleInputChange(name, Array.from(new Set(models)));
      showSuccess('获取Model列表Success');
    } else {
      showError('获取Model列表Failed');
    }
    setLoading(false);
  };

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/channel/models`);
      let localModelOptions = res.data.data.map((model) => ({
        label: model.id,
        value: model.id,
      }));
      setOriginModelOptions(localModelOptions);
      setFullModels(res.data.data.map((model) => model.id));
      setBasicModels(
        res.data.data
          .filter((model) => {
            return model.id.startsWith('gpt-3') || model.id.startsWith('text-');
          })
          .map((model) => model.id),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      if (res === undefined) {
        return;
      }
      setGroupOptions(
        res.data.data.map((group) => ({
          label: group,
          value: group,
        })),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  useEffect(() => {
    let localModelOptions = [...originModelOptions];
    inputs.models.forEach((model) => {
      if (!localModelOptions.find((option) => option.key === model)) {
        localModelOptions.push({
          label: model,
          value: model,
        });
      }
    });
    setModelOptions(localModelOptions);
  }, [originModelOptions, inputs.models]);

  useEffect(() => {
    fetchModels().then();
    fetchGroups().then();
    if (isEdit) {
      loadChannel().then(() => {});
    } else {
      setInputs(originInputs);
      let localModels = getChannelModels(inputs.type);
      setBasicModels(localModels);
      setInputs((inputs) => ({ ...inputs, models: localModels }));
    }
  }, [props.editingChannel.id]);

  const submit = async () => {
    if (!isEdit && (inputs.name === '' || inputs.key === '')) {
      showInfo('Please fill in the ChannelName and ChannelKey!');
      return;
    }
    if (inputs.models.length === 0) {
      showInfo('Please select at least one Model!');
      return;
    }
    if (inputs.model_mapping !== '' && !verifyJSON(inputs.model_mapping)) {
      showInfo('Model mapping must be in valid JSON format!');
      return;
    }
    if (inputs.headers !== '' && !verifyJSON(inputs.headers)) {
      showInfo('Custom请求头必须是合法的 JSON 格式！');
      return;
    }
    let localInputs = { ...inputs };
    if (localInputs.base_url && localInputs.base_url.endsWith('/')) {
      localInputs.base_url = localInputs.base_url.slice(
        0,
        localInputs.base_url.length - 1,
      );
    }
    if (localInputs.type === 3 && localInputs.other === '') {
      localInputs.other = '2023-06-01-preview';
    }
    if (localInputs.type === 18 && localInputs.other === '') {
      localInputs.other = 'v2.1';
    }
    let res;
    if (!Array.isArray(localInputs.models)) {
      showError('SubmitFailed，请勿重复Submit！');
      handleCancel();
      return;
    }
    localInputs.auto_ban = autoBan ? 1 : 0;
    localInputs.models = localInputs.models.join(',');
    localInputs.group = localInputs.groups.join(',');
    if (isEdit) {
      res = await API.put(`/api/channel/`, {
        ...localInputs,
        id: parseInt(channelId),
      });
    } else {
      res = await API.post(`/api/channel/`, localInputs);
    }
    const { success, message } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess('Channel更新Success！');
      } else {
        showSuccess('Channel创建Success！');
        setInputs(originInputs);
      }
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
  };

  const addCustomModels = () => {
    if (customModel.trim() === '') return;
    // 使用逗号分隔字符串，然后去除每indivualModelName前后的空格
    const modelArray = customModel.split(',').map((model) => model.trim());

    let localModels = [...inputs.models];
    let localModelOptions = [...modelOptions];
    let hasError = false;

    modelArray.forEach((model) => {
      // 检查Model是否已存在，且ModelName非空
      if (model && !localModels.includes(model)) {
        localModels.push(model); // 添加到Model列表
        localModelOptions.push({
          // 添加到下拉选项
          key: model,
          text: model,
          value: model,
        });
      } else if (model) {
        showError('某些Model已存在！');
        hasError = true;
      }
    });

    if (hasError) return; // 如果有mistake则终止Operation

    // 更新Status值
    setModelOptions(localModelOptions);
    setCustomModel('');
    handleInputChange('models', localModels);
  };

  return (
    <>
      <SideSheet
        maskClosable={false}
        placement={isEdit ? 'right' : 'left'}
        title={
          <Title level={3}>{isEdit ? '更新Channel信息' : '创建新的Channel'}</Title>
        }
        headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        visible={props.visible}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button theme='solid' size={'large'} onClick={submit}>
                Submit
              </Button>
              <Button
                theme='solid'
                size={'large'}
                type={'tertiary'}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
        width={isMobile() ? '100%' : 600}
      >
        <Spin spinning={loading}>
          <div style={{marginTop: 10}}>
            <Typography.Text strong>Type：</Typography.Text>
          </div>
          <Select
              name='type'
              required
              optionList={CHANNEL_OPTIONS}
              value={inputs.type}
              onChange={(value) => handleInputChange('type', value)}
              style={{width: '50%'}}
          />
          {inputs.type === 3 && (
              <>
                <div style={{marginTop: 10}}>
                  <Banner
                      type={'warning'}
                      description={
                        <>
                          Note，<strong>Model部署Name必须和ModelName保持一致</strong>
                          , because One API will take the model in the request body
                          parameter替换为你的部署Name（ModelName中的点会被剔除），
                          <a
                              target='_blank'
                              href='https://github.com/songquanpeng/one-api/issues/133?notification_referrer_id=NT_kwDOAmJSYrM2NjIwMzI3NDgyOjM5OTk4MDUw#issuecomment-1571602271'
                          >
                            Image demo
                          </a>
                          。
                        </>
                      }
                  ></Banner>
                </div>
                <div style={{marginTop: 10}}>
                  <Typography.Text strong>
                    AZURE_OPENAI_ENDPOINT：
                  </Typography.Text>
                </div>
                <Input
                    label='AZURE_OPENAI_ENDPOINT'
                    name='azure_base_url'
                    placeholder={
                      '请Enter AZURE_OPENAI_ENDPOINT，For example：https://docs-test-001.openai.azure.com'
                    }
                    onChange={(value) => {
                      handleInputChange('base_url', value);
                    }}
                    value={inputs.base_url}
                    autoComplete='new-password'
                />
                <div style={{marginTop: 10}}>
                  <Typography.Text strong>Default API Version：</Typography.Text>
                </div>
                <Input
                    label='Default API Version'
                    name='azure_other'
                    placeholder={
                      '请EnterDefault API Version，For example：2023-06-01-preview，该配置可以被实际的请求Queryparameter所覆盖'
                    }
                    onChange={(value) => {
                      handleInputChange('other', value);
                    }}
                    value={inputs.other}
                    autoComplete='new-password'
                />
              </>
          )}
          {inputs.type === 8 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Banner
                  type={'warning'}
                  description={
                    <>
                      如果你对接的是上游One API或者New
                      API等转发项目，请使用OpenAIType，不要使用此Type，除非你知道你在做什么。
                    </>
                  }
                ></Banner>
              </div>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  完整的 Base URL，支持变量{'{model}'}：
                </Typography.Text>
              </div>
              <Input
                name='base_url'
                placeholder={
                  '请Enter完整的URL，For example：https://api.openai.com/v1/chat/completions'
                }
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete='new-password'
              />
            </>
          )}
          {inputs.type === 36 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  Note非Chat API，请务必填写正确的API address，否则可能导致None法使用
                </Typography.Text>
              </div>
              <Input
                name='base_url'
                placeholder={
                  '请Enter到 /suno 前的路径，通常就是域名，For example：https://api.example.com '
                }
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete='new-password'
              />
            </>
          )}
          <div style={{marginTop: 10}}>
            <Typography.Text strong>Name：</Typography.Text>
          </div>
          <Input
              required
              name='name'
              placeholder={'请为Channel命名'}
              onChange={(value) => {
                handleInputChange('name', value);
              }}
              value={inputs.name}
              autoComplete='new-password'
          />
          <div style={{marginTop: 10}}>
            <Typography.Text strong>Group：</Typography.Text>
          </div>
          <Select
              placeholder={'请选择可以使用该Channel的Group'}
              name='groups'
              required
              multiple
              selection
              allowAdditions
              additionLabel={'Please edit group ratio on the System Settings page to add a new Group:'}
              onChange={(value) => {
                handleInputChange('groups', value);
              }}
              value={inputs.groups}
              autoComplete='new-password'
              optionList={groupOptions}
          />
          {inputs.type === 18 && (
              <>
                <div style={{marginTop: 10}}>
                  <Typography.Text strong>ModelVersion：</Typography.Text>
                </div>
                <Input
                    name='other'
                    placeholder={
                      '请Enter星火大ModelVersion，Note是接口地址中的Version号，For example：v2.1'
                    }
                    onChange={(value) => {
                      handleInputChange('other', value);
                    }}
                    value={inputs.other}
                    autoComplete='new-password'
                />
              </>
          )}
          {inputs.type === 41 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>Deployment Region：</Typography.Text>
              </div>
              <TextArea
                name='other'
                placeholder={
                  '请EnterDeployment Region，For example：us-central1\n支持使用Model mapping格式\n' +
                  '{\n' +
                  '    "default": "us-central1",\n' +
                  '    "claude-3-5-sonnet-20240620": "europe-west1"\n' +
                  '}'
                }
                autosize={{ minRows: 2 }}
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete='new-password'
              />
              <Typography.Text
                style={{
                  color: 'rgba(var(--semi-blue-5), 1)',
                  userSelect: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  handleInputChange(
                    'other',
                    JSON.stringify(REGION_EXAMPLE, null, 2),
                  );
                }}
              >
                Fill Template
              </Typography.Text>
            </>
          )}
          {inputs.type === 21 && (
              <>
                <div style={{marginTop: 10}}>
                  <Typography.Text strong>Knowledge Base ID：</Typography.Text>
                </div>
                <Input
                    label='Knowledge Base ID'
                    name='other'
                    placeholder={'请EnterKnowledge Base ID，For example：123456'}
                    onChange={(value) => {
                      handleInputChange('other', value);
                    }}
                    value={inputs.other}
                    autoComplete='new-password'
                />
              </>
          )}
          {inputs.type === 39 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>Account ID：</Typography.Text>
              </div>
              <Input
                name='other'
                placeholder={
                  '请EnterAccount ID，For example：d6b5da8hk1awo8nap34ube6gh'
                }
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete='new-password'
              />
            </>
          )}
          <div style={{marginTop: 10}}>
            <Typography.Text strong>Model：</Typography.Text>
          </div>
          <Select
              placeholder={'Please select the Model supported by this Channel'}
              name='models'
              required
              multiple
              selection
              onChange={(value) => {
                handleInputChange('models', value);
              }}
              value={inputs.models}
              autoComplete='new-password'
              optionList={modelOptions}
          />
          <div style={{lineHeight: '40px', marginBottom: '12px'}}>
            <Space>
              <Button
                  type='primary'
                  onClick={() => {
                    handleInputChange('models', basicModels);
                  }}
              >
                Fill相closeModel
              </Button>
              <Button
                  type='secondary'
                  onClick={() => {
                    handleInputChange('models', fullModels);
                  }}
              >
                Fill所有Model
              </Button>
              <Tooltip content={fetchButtonTips}>
                <Button
                    type='tertiary'
                    onClick={() => {
                      fetchUpstreamModelList('models');
                    }}
                >
                  获取Model列表
                </Button>
              </Tooltip>
              <Button
                  type='warning'
                  onClick={() => {
                    handleInputChange('models', []);
                  }}
              >
                清除所有Model
              </Button>
            </Space>
            <Input
                addonAfter={
                  <Button type='primary' onClick={addCustomModels}>
                    Fill
                  </Button>
                }
                placeholder='EnterCustomModelName'
                value={customModel}
                onChange={(value) => {
                  setCustomModel(value.trim());
                }}
            />
          </div>
          <div style={{marginTop: 10}}>
            <Typography.Text strong>Model重定向：</Typography.Text>
          </div>
          <TextArea
              placeholder={`此项可选，用于修改请求体中的ModelName，为一indivual JSON 字符串，键为请求中ModelName，值为要替换的ModelName，For example：\n${JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2)}`}
              name='model_mapping'
              onChange={(value) => {
                handleInputChange('model_mapping', value);
              }}
              autosize
              value={inputs.model_mapping}
              autoComplete='new-password'
          />
          <Typography.Text
              style={{
                color: 'rgba(var(--semi-blue-5), 1)',
                userSelect: 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                handleInputChange(
                    'model_mapping',
                    JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2),
                );
              }}
          >
            Fill Template
          </Typography.Text>
          <div style={{marginTop: 10}}>
            <Typography.Text strong>Custom请求头：</Typography.Text>
          </div>
          <TextArea
              placeholder={`此项可选，用于Custom请求头信息，为一indivual JSON 字符串, For example：\n${JSON.stringify(HEADERS_EXAMPLE, null, 2)}`}
              name='headers'
              onChange={(value) => {
                handleInputChange('headers', value);
              }}
              autosize
              value={inputs.headers}
              autoComplete='new-password'
          />
          <Typography.Text
              style={{
                color: 'rgba(var(--semi-blue-5), 1)',
                userSelect: 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                handleInputChange(
                    'headers',
                    JSON.stringify(HEADERS_EXAMPLE, null, 2),
                );
              }}
          >
            Fill Template
          </Typography.Text>
          <div style={{marginTop: 10}}>
            <Typography.Text strong>Key：</Typography.Text>
          </div>
          {batch ? (
              <TextArea
                  label='Key'
                  name='key'
                  required
                  placeholder={'请EnterKey，一行一indivual'}
                  onChange={(value) => {
                    handleInputChange('key', value);
                  }}
                  value={inputs.key}
                  style={{minHeight: 150, fontFamily: 'JetBrains Mono, Consolas'}}
                  autoComplete='new-password'
              />
          ) : (
            <>
              {inputs.type === 41 ? (
                <TextArea
                  label='Authentication JSON'
                  name='key'
                  required
                  placeholder={
                    '{\n' +
                    '  "type": "service_account",\n' +
                    '  "project_id": "abc-bcd-123-456",\n' +
                    '  "private_key_id": "123xxxxx456",\n' +
                    '  "private_key": "-----BEGIN PRIVATE KEY-----xxxx\n' +
                    '  "client_email": "xxx@developer.gserviceaccount.com",\n' +
                    '  "client_id": "111222333",\n' +
                    '  "auth_uri": "https://accounts.google.com/o/oauth2/auth",\n' +
                    '  "token_uri": "https://oauth2.googleapis.com/token",\n' +
                    '  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",\n' +
                    '  "client_x509_cert_url": "https://xxxxx.gserviceaccount.com",\n' +
                    '  "universe_domain": "googleapis.com"\n' +
                    '}'
                  }
                  onChange={(value) => {
                    handleInputChange('key', value);
                  }}
                  autosize={{ minRows: 10 }}
                  value={inputs.key}
                  autoComplete='new-password'
                />
              ) : (
                <Input
                  label='Key'
                  name='key'
                  required
                  placeholder={type2secretPrompt(inputs.type)}
                  onChange={(value) => {
                    handleInputChange('key', value);
                  }}
                  value={inputs.key}
                  autoComplete='new-password'
                />
              )}
            </>
          )}
          {inputs.type === 1 && (
              <>
                <div style={{marginTop: 10}}>
                  <Typography.Text strong>Organization：</Typography.Text>
                </div>
                <Input
                    label='Organization，可选，不填则为DefaultOrganization'
                    name='openai_organization'
                    placeholder='请EnterOrganizationorg-xxx'
                    onChange={(value) => {
                      handleInputChange('openai_organization', value);
                    }}
                    value={inputs.openai_organization}
                />
              </>
          )}
          <div style={{marginTop: 10}}>
            <Typography.Text strong>DefaultTestModel：</Typography.Text>
          </div>
          <Input
              name='test_model'
              placeholder='不填则为Model列表第一indivual'
              onChange={(value) => {
                handleInputChange('test_model', value);
              }}
              value={inputs.test_model}
          />
          <div style={{marginTop: 10, display: 'flex'}}>
            <Space>
              <Checkbox
                  name='auto_ban'
                  checked={autoBan}
                  onChange={() => {
                    setAutoBan(!autoBan);
                  }}
                  // onChange={handleInputChange}
              />
              <Typography.Text strong>
                是否自动Disable（仅当自动Disableopen启时有效），Close后不会自动Disable该Channel：
              </Typography.Text>
            </Space>
          </div>

          {!isEdit && (
              <div style={{marginTop: 10, display: 'flex'}}>
                <Space>
                  <Checkbox
                      checked={batch}
                      label='Batch Create'
                      name='batch'
                      onChange={() => setBatch(!batch)}
                  />
                  <Typography.Text strong>Batch Create</Typography.Text>
                </Space>
              </div>
          )}
          {inputs.type !== 3 &&
            inputs.type !== 8 &&
            inputs.type !== 22 &&
            inputs.type !== 36 && (
              <>
                <div style={{ marginTop: 10 }}>
                  <Typography.Text strong>Proxy：</Typography.Text>
                </div>
                <Input
                  label='Proxy'
                  name='base_url'
                  placeholder={'此项可选，用于通过Proxy站来进行 API 调用'}
                  onChange={(value) => {
                    handleInputChange('base_url', value);
                  }}
                  value={inputs.base_url}
                  autoComplete='new-password'
                />
              </>
            )}
          {inputs.type === 22 && (
              <>
                <div style={{marginTop: 10}}>
                  <Typography.Text strong>Private Deployment Address：</Typography.Text>
                </div>
                <Input
                    name='base_url'
                    placeholder={
                      '请EnterPrivate Deployment Address，格式为：https://fastgpt.run/api/openapi'
                    }
                    onChange={(value) => {
                      handleInputChange('base_url', value);
                    }}
                    value={inputs.base_url}
                    autoComplete='new-password'
                />
              </>
          )}
          <div style={{marginTop: 10}}>
            <Typography.Text strong>
              Status码复写（仅影响本地判断，不修改返回到上游的Status码）：
            </Typography.Text>
          </div>
          <TextArea
              placeholder={`此项可选，用于复写返回的Status码，比如将claudeChannel的400mistake复写为500（用于Retry），请勿滥用该功能，For example：\n${JSON.stringify(STATUS_CODE_MAPPING_EXAMPLE, null, 2)}`}
              name='status_code_mapping'
              onChange={(value) => {
                handleInputChange('status_code_mapping', value);
              }}
              autosize
              value={inputs.status_code_mapping}
              autoComplete='new-password'
          />
          <Typography.Text
              style={{
                color: 'rgba(var(--semi-blue-5), 1)',
                userSelect: 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                handleInputChange(
                    'status_code_mapping',
                    JSON.stringify(STATUS_CODE_MAPPING_EXAMPLE, null, 2),
                );
              }}
          >
            Fill Template
          </Typography.Text>
          {/*<div style={{ marginTop: 10 }}>*/}
          {/*  <Typography.Text strong>*/}
          {/*    最大请求token（0表示不限制）：*/}
          {/*  </Typography.Text>*/}
          {/*</div>*/}
          {/*<Input*/}
          {/*  label='最大请求token'*/}
          {/*  name='max_input_tokens'*/}
          {/*  placeholder='Default为0，表示不限制'*/}
          {/*  onChange={(value) => {*/}
          {/*    handleInputChange('max_input_tokens', value);*/}
          {/*  }}*/}
          {/*  value={inputs.max_input_tokens}*/}
          {/*/>*/}
          <div style={{marginTop: 10}}>
            <Typography.Text strong>网络Proxy：</Typography.Text>
          </div>
          <Input
            label='网络Proxy，可选，通过Proxy服务器访问 API'
            name='proxy'
            placeholder='支持http/socks5，For example：socks5://username:password@proxy:port'
            onChange={(value) => {
              handleInputChange('proxy', value);
            }}
            value={inputs.proxy}
          />
        </Spin>
      </SideSheet>
    </>
  );
};

export default EditChannel;
