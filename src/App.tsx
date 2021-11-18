import React, {useContext, useState, useEffect, useRef, FunctionComponent} from 'react';
import {Table, Input, Button, Popconfirm, Form, InputNumber} from 'antd';
import { FormInstance } from 'antd/lib/form';

const EditableContext = React.createContext<FormInstance | null>(null);

interface Item {
  key: string;
  name: string;
  age: string;
  address: string;
}

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
      <Form form={form} component={false}>
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  inputType: 'number' | 'text';
  children: React.ReactNode;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
                                                     title,
                                                     editable,
                                                     children,
                                                     dataIndex,
                                                     inputType,
                                                     record,
                                                     handleSave,
                                                     ...restProps
                                                   }) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<Input>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing && inputType !== 'number') {
      inputRef.current!.focus();
    }
  }, [editing, inputType]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  const inputNode = inputType === 'number' ? <InputNumber autoFocus onPressEnter={save} onBlur={save} style={{width: '100%'}} /> : <Input ref={inputRef} onPressEnter={save} onBlur={save}/>;

  if (editable) {
    childNode = editing ? (
        <Form.Item
            style={{ margin: 0 }}
            name={dataIndex}
        >
          {inputNode}
        </Form.Item>
    ) : (
        <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
          {children}
        </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
  key: React.Key;
  name: string;
  age: string;
  address: string;
}

interface EditableTableState {
  value?: DataType[];
  onChange?(values: DataType[]): void
}
type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

export const EditTable: FunctionComponent<EditableTableProps & EditableTableState> = ({value=[], onChange}) => {
  const columns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [{
    title: 'name',
    dataIndex: 'name',
    width: '30%',
    editable: true,
  },
    {
      title: 'age',
      dataIndex: 'age',
      width: 200,
      editable: true,
    },
    {
      title: 'address',
      dataIndex: 'address',
      editable: true,
      width: 350,
    },
    {
      title: 'operation',
      dataIndex: 'operation',
      render: (_, record: any) =>
          value.length >= 1 ? (
              <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}>
                <span>Delete</span>
              </Popconfirm>
          ) : null,
    }]

  const handleDelete = (key: React.Key) => {
    if (onChange) {
      onChange(value.filter(item => item.key !== key))
    }
  };

  const handleAdd = () => {
    const newData: DataType = {
      key: value.length,
      name: '',
      age: '',
      address: '',
    };
    if (onChange) {
      onChange([...value, newData])
    }
  };

  const handleSave = (row: DataType) => {
    const newData = [...value];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    if (onChange) {
      onChange(newData)
    }
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  return <div>
    <div>
      <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
        Add a row
      </Button>
      <Table
          components={components}
          rowClassName={() => 'editable-row'}
          bordered
          dataSource={value}
          columns={columns.map(col => {
            if (!col.editable) {
              return col;
            }
            return {
              ...col,
              onCell: (record: DataType) => ({
                record,
                editable: col.editable,
                inputType: col.dataIndex === 'age' ? 'number' : 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave: handleSave,
              }),
            };
          }) as ColumnTypes}
          pagination={false}
      />
    </div>
  </div>
}

const App: FunctionComponent = () => {
  return <Form onFinish={(values) => {
    console.log(values);
  }} initialValues={{
    users: []
  }}>
    <Form.Item name={'users'}>
      <EditTable/>
    </Form.Item>
    <Form.Item>
      <Button htmlType={'submit'}>Save</Button>
    </Form.Item>
  </Form>
}

export default App
