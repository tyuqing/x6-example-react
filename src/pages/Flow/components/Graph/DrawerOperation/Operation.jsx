import React, { useEffect, useImperativeHandle } from 'react';
import { Form, Input, Select } from 'antd';
import { iconList } from '@/constants/graph';

const FormItem = Form.Item;
const formItemLayout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 20,
  },
};

const initialValues = {
  name: '',
  icon: '',
};

const iconOptions = iconList.map((item) => {
  return {
    value: item.value,
    label: item.icon,
  };
});
console.log(iconOptions);
const Operation = (props, ref) => {
  const { actionType, dataSource } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    form.resetFields();

    if (dataSource) {
      const newValues = { ...dataSource };
      form.setFieldsValue(newValues);
    }
  }, [form, dataSource]);

  useImperativeHandle(ref, () => {
    return {
      async getValues(callback) {
        await form
          .validateFields()
          .then((res) => {
            callback({
              ...res,
            });
          })
          .catch((res) => {
            const { errorFields } = res;
            console.log('error', errorFields);
          });
      },
    };
  });

  const isPreview = actionType === 'preview';

  return (
    <>
      <Form
        labelAlign={isPreview ? 'left' : 'right'}
        form={form}
        initialValues={initialValues}
        {...formItemLayout}
      >
        <FormItem label="名称:" name="name">
          <Input placeholder="请输入" />
        </FormItem>
        <FormItem label="图标:" name="icon">
          <Select placeholder="请选择" options={iconOptions} />
        </FormItem>
      </Form>
    </>
  );
};

export default React.forwardRef(Operation);
