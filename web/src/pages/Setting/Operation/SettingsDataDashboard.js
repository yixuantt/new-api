import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin, Tag } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';

export default function DataDashboard(props) {
  const optionsDataExportDefaultTime = [
    { key: 'hour', label: 'Hour', value: 'hour' },
    { key: 'day', label: 'day', value: 'day' },
    { key: 'week', label: 'week', value: 'week' },
  ];
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    DataExportEnabled: false,
    DataExportInterval: '',
    DataExportDefaultTime: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

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
          if (res.includes(undefined)) return showError('Partial Save Failed, Please try again');
        }
        showSuccess('Saved successfully');
        props.refresh();
      })
      .catch(() => {
        showError('Save Failed, Please try again');
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
    localStorage.setItem(
      'data_export_default_time',
      String(inputs.DataExportDefaultTime),
    );
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={'DashboardSettings'}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'DataExportEnabled'}
                  label={'EnableDashboard（实验性）'}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      DataExportEnabled: value,
                    });
                  }}
                />
              </Col>
            </Row>
            <Row>
              <Col span={8}>
                <Form.InputNumber
                  label={'Dashboard更新间隔 '}
                  step={1}
                  min={1}
                  suffix={'minutes'}
                  extraText={'Settings过短会影响数据库性能'}
                  placeholder={'Dashboard更新间隔'}
                  field={'DataExportInterval'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DataExportInterval: String(value),
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Select
                  label='DashboardDefaultTime Granularity'
                  optionList={optionsDataExportDefaultTime}
                  field={'DataExportDefaultTime'}
                  extraText={'仅修改展示粒度，统计精确到Hour'}
                  placeholder={'DashboardDefaultTime Granularity'}
                  style={{ width: 180 }}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DataExportDefaultTime: String(value),
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Button size='large' onClick={onSubmit}>
                saveDashboardSettings
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
