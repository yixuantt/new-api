import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  API,
  downloadTextAsFile,
  isMobile,
  showError,
  showSuccess,
} from '../../helpers';
import { renderQuotaWithPrompt } from '../../helpers/render';
import {
  AutoComplete,
  Button,
  Input,
  Modal,
  SideSheet,
  Space,
  Spin,
  Typography,
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import { Divider } from 'semantic-ui-react';

const EditRedemption = (props) => {
  const isEdit = props.editingRedemption.id !== undefined;
  const [loading, setLoading] = useState(isEdit);

  const params = useParams();
  const navigate = useNavigate();
  const originInputs = {
    name: '',
    quota: 100000,
    count: 1,
  };
  const [inputs, setInputs] = useState(originInputs);
  const { name, quota, count } = inputs;

  const handleCancel = () => {
    props.handleClose();
  };

  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const loadRedemption = async () => {
    setLoading(true);
    let res = await API.get(`/api/redemption/${props.editingRedemption.id}`);
    const { success, message, data } = res.data;
    if (success) {
      setInputs(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isEdit) {
      loadRedemption().then(() => {
        // console.log(inputs);
      });
    } else {
      setInputs(originInputs);
    }
  }, [props.editingRedemption.id]);

  const submit = async () => {
    if (!isEdit && inputs.name === '') return;
    setLoading(true);
    let localInputs = inputs;
    localInputs.count = parseInt(localInputs.count);
    localInputs.quota = parseInt(localInputs.quota);
    let res;
    if (isEdit) {
      res = await API.put(`/api/redemption/`, {
        ...localInputs,
        id: parseInt(props.editingRedemption.id),
      });
    } else {
      res = await API.post(`/api/redemption/`, {
        ...localInputs,
      });
    }
    const { success, message, data } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess('Redeem码更新Success！');
        props.refresh();
        props.handleClose();
      } else {
        showSuccess('Redeem码创建Success！');
        setInputs(originInputs);
        props.refresh();
        props.handleClose();
      }
    } else {
      showError(message);
    }
    if (!isEdit && data) {
      let text = '';
      for (let i = 0; i < data.length; i++) {
        text += data[i] + '\n';
      }
      // downloadTextAsFile(text, `${inputs.name}.txt`);
      Modal.confirm({
        title: 'Redeem码创建Success',
        content: (
          <div>
            <p>Redeem码创建Success，是否下载Redeem码？</p>
            <p>Redeem码将以文本文件的形式下载，文件名为Redeem码的Name。</p>
          </div>
        ),
        onOk: () => {
          downloadTextAsFile(text, `${inputs.name}.txt`);
        },
      });
    }
    setLoading(false);
  };

  return (
    <>
      <SideSheet
        placement={isEdit ? 'right' : 'left'}
        title={
          <Title level={3}>
            {isEdit ? '更新Redeem码信息' : '创建新的Redeem码'}
          </Title>
        }
        headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        visible={props.visiable}
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
          <Input
            style={{ marginTop: 20 }}
            label='Name'
            name='name'
            placeholder={'请EnterName'}
            onChange={(value) => handleInputChange('name', value)}
            value={name}
            autoComplete='new-password'
            required={!isEdit}
          />
          <Divider />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>{`Quota${renderQuotaWithPrompt(quota)}`}</Typography.Text>
          </div>
          <AutoComplete
            style={{ marginTop: 8 }}
            name='quota'
            placeholder={'请EnterQuota'}
            onChange={(value) => handleInputChange('quota', value)}
            value={quota}
            autoComplete='new-password'
            type='number'
            position={'bottom'}
            data={[
              { value: 500000, label: '1$' },
              { value: 5000000, label: '10$' },
              { value: 25000000, label: '50$' },
              { value: 50000000, label: '100$' },
              { value: 250000000, label: '500$' },
              { value: 500000000, label: '1000$' },
            ]}
          />
          {!isEdit && (
            <>
              <Divider />
              <Typography.Text>Generate quantity</Typography.Text>
              <Input
                style={{ marginTop: 8 }}
                label='Generate quantity'
                name='count'
                placeholder={'请EnterGenerate quantity'}
                onChange={(value) => handleInputChange('count', value)}
                value={count}
                autoComplete='new-password'
                type='number'
              />
            </>
          )}
        </Spin>
      </SideSheet>
    </>
  );
};

export default EditRedemption;
