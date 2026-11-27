import {
  Button,
  Checkbox,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  App,
  Row,
  Switch,
  Tooltip,
  Typography,
} from 'antd';
import {
  FacebookFilled,
  GoogleOutlined,
  MoonOutlined,
  SunOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import { Logo } from '../../components/shared/logo/logo';
import { AuthenticationFrame } from './authentication-frame';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH, PATH_DASHBOARD } from '../../constants/routes';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/theme/themeSlice';
import { RootState } from '../../redux/store';

const { Text, Link } = Typography;

type FieldType = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  cPassword?: string;
  terms?: boolean;
};

export const SignUpPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const onFinish = () => {
    setLoading(true);

    message.open({
      type: 'loading',
      content: 'Creating your account...',
      duration: 1.5,
    });

    // Mock authentication - in production, this would be an API call
    setTimeout(() => {
      message.destroy();
      message.success('Account created successfully!', 1);

      setTimeout(() => {
        setLoading(false);
        navigate(PATH_DASHBOARD.default);
      }, 1000);
    }, 1500);
  };

  const onFinishFailed = () => {
    // This is a demo: never log form values or credentials.
  };

  return (
    <AuthenticationFrame
      brand={<Logo color="white" />}
      welcome="Welcome to Antd Admin"
      introduction="A dynamic and versatile multipurpose dashboard utilizing Ant Design, React, TypeScript, and Vite."
      title="Create an account"
      controls={
        <Tooltip title="Toggle theme">
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            checked={mytheme === 'dark'}
            onClick={() => dispatch(toggleTheme())}
          />
        </Tooltip>
      }
    >
      <Flex gap={4}>
        <Text>Already have an account?</Text>
        <Link href={PATH_AUTH.signin}>Sign in here</Link>
      </Flex>
      <Flex
        vertical={isMobile}
        gap="small"
        wrap="wrap"
        style={{ width: '100%' }}
      >
        <Button icon={<GoogleOutlined />}>Sign up with Google</Button>
        <Button icon={<FacebookFilled />}>Sign up with Facebook</Button>
        <Button icon={<TwitterOutlined />}>Sign up with Twitter</Button>
      </Flex>
      <Divider className="m-0">or</Divider>
      <Form
        name="sign-up-form"
        layout="vertical"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 24 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        requiredMark={false}
      >
        <Row gutter={[8, 0]}>
          <Col xs={24} lg={12}>
            <Form.Item<FieldType>
              label="First name"
              name="firstName"
              rules={[
                {
                  required: true,
                  message: 'Please input your first name!',
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item<FieldType>
              label="Last name"
              name="lastName"
              rules={[
                { required: true, message: 'Please input your last name!' },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item<FieldType>
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Please input your email' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item<FieldType>
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' },
              ]}
            >
              <Input.Password />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item<FieldType>
              label="Confirm password"
              name="cPassword"
              rules={[
                {
                  required: true,
                  message: 'Please ensure passwords match!',
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item<FieldType> name="terms" valuePropName="checked">
              <Flex>
                <Checkbox>I agree to</Checkbox>
                <Link>terms and conditions</Link>
              </Flex>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="middle"
            loading={loading}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </AuthenticationFrame>
  );
};
