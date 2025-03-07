import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';

export default function GeneralSettings(props) {
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    TopUpLink: '',
    ChatLink: '',
    ChatLink2: '',
    QuotaPerUnit: '',
    RetryTimes: '',
    DisplayInCurrencyEnabled: false,
    DisplayTokenStatEnabled: false,
    DefaultCollapseSidebar: false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);
  function onChange(value, e) {
    const name = e.target.id;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }
  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning('You seem to have not modified anything');
    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else {
        value = inputs[item.key];
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined)) return showError('部分saveFailed，请Retry');
        }
        showSuccess('Saved successfully');
        props.refresh();
      })
      .catch(() => {
        showError('saveFailed，请Retry');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);
  return (
    <>
      <Spin spinning={loading}>
        <Banner
          type='warning'
          description={'Chat链接功能已经弃用，请使用下方ChatSettings功能'}
        />
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={'通用Settings'}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Input
                  field={'TopUpLink'}
                  label={'Recharge链接'}
                  initValue={''}
                  placeholder={'For example, the purchase link of the card issuing website'}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'ChatLink'}
                  label={'DefaultChat页面链接'}
                  initValue={''}
                  placeholder='For example, the deployment address of ChatGPT Next Web'
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'ChatLink2'}
                  label={'Chat页面 2 链接'}
                  initValue={''}
                  placeholder='For example, the deployment address of ChatGPT Next Web'
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'QuotaPerUnit'}
                  label={'Unit Dollar Quota'}
                  initValue={''}
                  placeholder='一单位货币能Redeem的Quota'
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'RetryTimes'}
                  label={'FailedRetrytimes数'}
                  initValue={''}
                  placeholder='FailedRetrytimes数'
                  onChange={onChange}
                  showClear
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'DisplayInCurrencyEnabled'}
                  label={'Display quota in the form of currency'}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      DisplayInCurrencyEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'DisplayTokenStatEnabled'}
                  label={'Billing 相close API show示TokenQuota而非UserQuota'}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DisplayTokenStatEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'DefaultCollapseSidebar'}
                  label={'Default折叠侧边栏'}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DefaultCollapseSidebar: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Button size='large' onClick={onSubmit}>
                save通用Settings
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
