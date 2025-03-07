import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, isMobile, showError, showSuccess } from '../../helpers';
import { renderQuota, renderQuotaWithPrompt } from '../../helpers/render';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import {
  Button,
  Divider,
  Input,
  Modal,
  Select,
  SideSheet,
  Space,
  Spin,
  Typography,
} from '@douyinfe/semi-ui';

const EditUser = (props) => {
  const userId = props.editingUser.id;
  const [loading, setLoading] = useState(true);
  const [addQuotaModalOpen, setIsModalOpen] = useState(false);
  const [addQuotaLocal, setAddQuotaLocal] = useState('');
  const [inputs, setInputs] = useState({
    username: '',
    display_name: '',
    password: '',
    github_id: '',
    linuxdo_id: '',
    linuxdo_level: 0,
    wechat_id: '',
    telegram_id: '',
    email: '',
    quota: 0,
    group: 'default',
  });
  const [groupOptions, setGroupOptions] = useState([]);
  const {
    username,
    display_name,
    password,
    github_id,
    linuxdo_id,
    linuxdo_level,
    wechat_id,
    telegram_id,
    email,
    quota,
    group,
  } = inputs;
  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };
  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
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
  const navigate = useNavigate();
  const handleCancel = () => {
    props.handleClose();
  };
  const loadUser = async () => {
    setLoading(true);
    let res = undefined;
    if (userId) {
      res = await API.get(`/api/user/${userId}`);
    } else {
      res = await API.get(`/api/user/self`);
    }
    const { success, message, data } = res.data;
    if (success) {
      data.password = '';
      setInputs(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser().then();
    if (userId) {
      fetchGroups().then();
    }
  }, [props.editingUser.id]);

  const submit = async () => {
    setLoading(true);
    let res = undefined;
    if (userId) {
      let data = { ...inputs, id: parseInt(userId) };
      if (typeof data.quota === 'string') {
        data.quota = parseInt(data.quota);
      }
      res = await API.put(`/api/user/`, data);
    } else {
      res = await API.put(`/api/user/self`, inputs);
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess('User信息更新Success！');
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const addLocalQuota = () => {
    let newQuota = parseInt(quota) + parseInt(addQuotaLocal);
    setInputs((inputs) => ({ ...inputs, quota: newQuota }));
  };

  const openAddQuotaModal = () => {
    setAddQuotaLocal('0');
    setIsModalOpen(true);
  };

  return (
    <>
      <SideSheet
        placement={'right'}
        title={<Title level={3}>{'EditUser'}</Title>}
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
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Username</Typography.Text>
          </div>
          <Input
            label='Username'
            name='username'
            placeholder={'Please enter your new username'}
            onChange={(value) => handleInputChange('username', value)}
            value={username}
            autoComplete='new-password'
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Password</Typography.Text>
          </div>
          <Input
            label='Password'
            name='password'
            type={'password'}
            placeholder={'Please enter a new password, minimum 8 characters'}
            onChange={(value) => handleInputChange('password', value)}
            value={password}
            autoComplete='new-password'
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>show示Name</Typography.Text>
          </div>
          <Input
            label='showName'
            name='display_name'
            placeholder={'Please enter a new display name'}
            onChange={(value) => handleInputChange('display_name', value)}
            value={display_name}
            autoComplete='new-password'
          />
          {userId && (
            <>
              <div style={{ marginTop: 20 }}>
                <Typography.Text>Group</Typography.Text>
              </div>
              <Select
                placeholder={'Please select Group'}
                name='group'
                fluid
                search
                selection
                allowAdditions
                additionLabel={'Please edit group ratio on the System Settings page to add a new Group:'}
                onChange={(value) => handleInputChange('group', value)}
                value={inputs.group}
                autoComplete='new-password'
                optionList={groupOptions}
              />
              <div style={{ marginTop: 20 }}>
                <Typography.Text>{` Balance ${renderQuotaWithPrompt(quota)}`}</Typography.Text>
              </div>
              <Space>
                <Input
                  name='quota'
                  placeholder={'Please enter the new remaining balance'}
                  onChange={(value) => handleInputChange('quota', value)}
                  value={quota}
                  type={'number'}
                  autoComplete='new-password'
                />
                <Button onClick={openAddQuotaModal}>Add Quota</Button>
              </Space>
            </>
          )}
          <Divider style={{ marginTop: 20 }}>The following information cannot be modified</Divider>
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Binded GitHub Account</Typography.Text>
          </div>
          <Input
            name='github_id'
            value={github_id}
            autoComplete='new-password'
            placeholder='This item is read-only and requires the user to bind through the corresponding close bind button on the Indivual Settings page. It cannot be modified directly.'
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Binded LINUX DO Account</Typography.Text>
          </div>
          <Input
            name='linuxdo_id'
            value={linuxdo_id + '（' + linuxdo_level + '级）'}
            autoComplete='new-password'
            placeholder='This item is read-only and requires the user to bind through the corresponding close bind button on the Indivual Settings page. It cannot be modified directly.'
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Bound Wechat Account</Typography.Text>
          </div>
          <Input
            name='wechat_id'
            value={wechat_id}
            autoComplete='new-password'
            placeholder='This item is read-only and requires the user to bind through the corresponding close bind button on the Indivual Settings page. It cannot be modified directly.'
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Telegram Account that has been bound</Typography.Text>
          </div>
          <Input
            name='telegram_id'
            value={telegram_id}
            autoComplete='new-password'
            placeholder='This item is read-only and requires the user to bind through the corresponding close bind button on the Indivual Settings page. It cannot be modified directly.'
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>Bound Mail Account</Typography.Text>
          </div>
          <Input
            name='email'
            value={email}
            autoComplete='new-password'
            placeholder='This item is read-only and requires the user to bind through the corresponding close bind button on the Indivual Settings page. It cannot be modified directly.'
            readonly
          />
        </Spin>
      </SideSheet>
      <Modal
        centered={true}
        visible={addQuotaModalOpen}
        onOk={() => {
          addLocalQuota();
          setIsModalOpen(false);
        }}
        onCancel={() => setIsModalOpen(false)}
        closable={null}
      >
        <div style={{ marginTop: 20 }}>
          <Typography.Text>{`新Quota${renderQuota(quota)} + ${renderQuota(addQuotaLocal)} = ${renderQuota(quota + parseInt(addQuotaLocal))}`}</Typography.Text>
        </div>
        <Input
          name='addQuotaLocal'
          placeholder={'Quota to be added (negative numbers are supported)'}
          onChange={(value) => {
            setAddQuotaLocal(value);
          }}
          value={addQuotaLocal}
          type={'number'}
          autoComplete='new-password'
        />
      </Modal>
    </>
  );
};

export default EditUser;
