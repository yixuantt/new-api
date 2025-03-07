import React, { useEffect, useRef, useState } from 'react';
import { Banner, Button, Col, Form, Row } from '@douyinfe/semi-ui';
import { API, showError, showSuccess } from '../helpers';
import { marked } from 'marked';

const OtherSetting = () => {
  let [inputs, setInputs] = useState({
    Notice: '',
    SystemName: '',
    Logo: '',
    Footer: '',
    About: '',
    HomePageContent: '',
  });
  let [loading, setLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    tag_name: '',
    content: '',
  });

  const updateOption = async (key, value) => {
    setLoading(true);
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      setInputs((inputs) => ({ ...inputs, [key]: value }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const [loadingInput, setLoadingInput] = useState({
    Notice: false,
    SystemName: false,
    Logo: false,
    HomePageContent: false,
    About: false,
    Footer: false,
  });
  const handleInputChange = async (value, e) => {
    const name = e.target.id;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  // 通用Settings
  const formAPISettingGeneral = useRef();
  // 通用Settings - Notice
  const submitNotice = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Notice: true }));
      await updateOption('Notice', inputs.Notice);
      showSuccess('Announcement已更新');
    } catch (error) {
      console.error('Announcement更新Failed', error);
      showError('Announcement更新Failed');
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Notice: false }));
    }
  };
  // indivual性化Settings
  const formAPIPersonalization = useRef();
  //  indivual性化Settings - SystemName
  const submitSystemName = async () => {
    try {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        SystemName: true,
      }));
      await updateOption('SystemName', inputs.SystemName);
      showSuccess('SystemName已更新');
    } catch (error) {
      console.error('SystemName更新Failed', error);
      showError('SystemName更新Failed');
    } finally {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        SystemName: false,
      }));
    }
  };

  // indivual性化Settings - Logo
  const submitLogo = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Logo: true }));
      await updateOption('Logo', inputs.Logo);
      showSuccess('Logo updated');
    } catch (error) {
      console.error('Logo 更新Failed', error);
      showError('Logo 更新Failed');
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Logo: false }));
    }
  };
  // indivual性化Settings - Home内容
  const submitOption = async (key) => {
    try {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        HomePageContent: true,
      }));
      await updateOption(key, inputs[key]);
      showSuccess('Home内容已更新');
    } catch (error) {
      console.error('Home内容更新Failed', error);
      showError('Home内容更新Failed');
    } finally {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        HomePageContent: false,
      }));
    }
  };
  // indivual性化Settings - About
  const submitAbout = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, About: true }));
      await updateOption('About', inputs.About);
      showSuccess('About content has been updated');
    } catch (error) {
      console.error('About Content Update Failed', error);
      showError('About Content Update Failed');
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, About: false }));
    }
  };
  // indivual性化Settings - Footer
  const submitFooter = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Footer: true }));
      await updateOption('Footer', inputs.Footer);
      showSuccess('Footer content has been updated');
    } catch (error) {
      console.error('Footer content update Failed', error);
      showError('Footer content update Failed');
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Footer: false }));
    }
  };

  const openGitHubRelease = () => {
    window.location = 'https://github.com/songquanpeng/one-api/releases/latest';
  };

  const checkUpdate = async () => {
    const res = await API.get(
      'https://api.github.com/repos/songquanpeng/one-api/releases/latest',
    );
    const { tag_name, body } = res.data;
    if (tag_name === process.env.REACT_APP_VERSION) {
      showSuccess(`Is the latest version：${tag_name}`);
    } else {
      setUpdateData({
        tag_name: tag_name,
        content: marked.parse(body),
      });
      setShowUpdateModal(true);
    }
  };
  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (item.key in inputs) {
          newInputs[item.key] = item.value;
        }
      });
      setInputs(newInputs);
      formAPISettingGeneral.current.setValues(newInputs);
      formAPIPersonalization.current.setValues(newInputs);
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getOptions();
  }, []);

  return (
    <Row>
      <Col span={24}>
        {/* 通用Settings */}
        <Form
          values={inputs}
          getFormApi={(formAPI) => (formAPISettingGeneral.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={'通用Settings'}>
            <Form.TextArea
              label={'Announcement'}
              placeholder={'在此Enter新的Announcement内容，支持 Markdown & HTML 代码'}
              field={'Notice'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button onClick={submitNotice} loading={loadingInput['Notice']}>
              SettingsAnnouncement
            </Button>
          </Form.Section>
        </Form>
        {/* indivual性化Settings */}
        <Form
          values={inputs}
          getFormApi={(formAPI) => (formAPIPersonalization.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={'indivual性化Settings'}>
            <Form.Input
              label={'SystemName'}
              placeholder={'在此EnterSystemName'}
              field={'SystemName'}
              onChange={handleInputChange}
            />
            <Button
              onClick={submitSystemName}
              loading={loadingInput['SystemName']}
            >
              SettingsSystemName
            </Button>
            <Form.Input
              label={'Logo Image URL'}
              placeholder={'在此Enter Logo Image URL'}
              field={'Logo'}
              onChange={handleInputChange}
            />
            <Button onClick={submitLogo} loading={loadingInput['Logo']}>
              Settings Logo
            </Button>
            <Form.TextArea
              label={'Home内容'}
              placeholder={
                '在此EnterHome内容，支持 Markdown & HTML 代码，Settings后Home的Status信息将不再show示。如果Enter的是一indivual链接，则会使用该链接作为 iframe 的 src 属性，这允许你Settings任意网页作为Home。'
              }
              field={'HomePageContent'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button
              onClick={() => submitOption('HomePageContent')}
              loading={loadingInput['HomePageContent']}
            >
              SettingsHome内容
            </Button>
            <Form.TextArea
              label={'About'}
              placeholder={
                '在此Enter新的About内容，支持 Markdown & HTML 代码。如果Enter的是一indivual链接，则会使用该链接作为 iframe 的 src 属性，这允许你Settings任意网页作为About页面。'
              }
              field={'About'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button onClick={submitAbout} loading={loadingInput['About']}>
              SettingsAbout
            </Button>
            {/*  */}
            <Banner
              fullMode={false}
              type='info'
              description='Removal of One API copyright mark must first be authorized. Project maintenance requires a lot of effort. If this project is meaningful to you, please actively support it.。'
              closeIcon={null}
              style={{ marginTop: 15 }}
            />
            <Form.Input
              label={'Footer'}
              placeholder={
                '在此Enter新的Footer，留空则使用DefaultFooter，支持 HTML 代码'
              }
              field={'Footer'}
              onChange={handleInputChange}
            />
            <Button onClick={submitFooter} loading={loadingInput['Footer']}>
              SettingsFooter
            </Button>
          </Form.Section>
        </Form>
      </Col>
      {/*<Modal*/}
      {/*  onClose={() => setShowUpdateModal(false)}*/}
      {/*  onOpen={() => setShowUpdateModal(true)}*/}
      {/*  open={showUpdateModal}*/}
      {/*>*/}
      {/*  <Modal.Header>New Version：{updateData.tag_name}</Modal.Header>*/}
      {/*  <Modal.Content>*/}
      {/*    <Modal.Description>*/}
      {/*      <div dangerouslySetInnerHTML={{ __html: updateData.content }}></div>*/}
      {/*    </Modal.Description>*/}
      {/*  </Modal.Content>*/}
      {/*  <Modal.Actions>*/}
      {/*    <Button onClick={() => setShowUpdateModal(false)}>Close</Button>*/}
      {/*    <Button*/}
      {/*      content='Details'*/}
      {/*      onClick={() => {*/}
      {/*        setShowUpdateModal(false);*/}
      {/*        openGitHubRelease();*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  </Modal.Actions>*/}
      {/*</Modal>*/}
    </Row>
  );
};

export default OtherSetting;
