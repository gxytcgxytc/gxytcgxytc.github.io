import React from 'react';
import { Form, Select, InputNumber, Card, Button, Cascader } from 'antd';
import { useModel } from '@umijs/max';
import { MatchConfig } from '../../hooks/useMatchProcess';
import { setOptions } from '../../constances';

const { Option } = Select;

const Configs: React.FC<any> = () => {
  const [form] = Form.useForm();
  const { config, setConfig } = useModel("HscTool.index");

  // 初始化表单值
  React.useEffect(() => {
    form.setFieldsValue(config);
  }, [config]);

  return (
    <Card title="比赛配置" style={{ marginBottom: 20 }}>
      <Form
        form={form}
        layout="inline"
        onValuesChange={(_, values) => {
          setConfig(values);
        }}
      >
        <Form.Item
          name="poolType"
          label="图池类型"
          rules={[{ required: true, message: '请选择图池类型' }]}
        >
          <Select placeholder="请选择图池类型">
            <Option value="Ro16">Ro16</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="setType"
          label="Class&Set"
          rules={[{ required: true, message: 'select a set' }]}
        >
          <Cascader
            options={setOptions}
            fieldNames={{
              label: 'label',
              value: 'value',
            }}
            placeholder="请选择图池类型"
          />
        </Form.Item>
        <Form.Item
          name="boNumber"
          label="Bo?"
          rules={[{ required: true, message: 'select a set' }]}
        >
          <InputNumber min={9} max={13} />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Configs;