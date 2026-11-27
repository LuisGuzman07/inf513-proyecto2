import {
  Alert,
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
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../redux/theme/themeSlice';
import { RootState } from '../../redux/store';
import { useAuth } from '../../contexts/AuthContext';
import { handleApiError } from '../../services/api/apiClient';

const { Text, Link } = Typography;

type FieldType = {
  email?: string;
  password?: string;
  remember?: boolean;
};

export const SignInPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { mytheme } = useSelector((state: RootState) => state.theme);
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { message } = App.useApp();

  const onFinish = async (values: FieldType) => {
    setLoading(true);
    setError(null);

    try {
      await login({
        email: values.email!,
        password: values.password!,
      });

      message.success('Login successful! Welcome back.');

      // Redirect to the page they were trying to access, or dashboard
      const from = location.state?.from?.pathname || PATH_DASHBOARD.default;
      navigate(from, { replace: true });
    } catch (err) {
      const apiError = handleApiError(err);
      setError(
        apiError.message || 'Invalid email or password. Please try again.'
      );
      message.error(apiError.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticationFrame
      brand={<Logo color="white" />}
      welcome="Welcome back to Antd Admin"
      introduction="A dynamic and versatile multipurpose dashboard utilizing Ant Design, React, TypeScript, and Vite."
      title="Login"
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
        <Text>Don't have an account?</Text>
        <Link href={PATH_AUTH.signup}>Create an account here</Link>
      </Flex>
      {error && (
        <Alert
          title="Login Failed"
          description={error}
          type="error"
          closable={{ onClose: () => setError(null) }}
          style={{ width: '100%' }}
        />
      )}
      <Form
        name="sign-up-form"
        layout="vertical"
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
        initialValues={{
          email: 'demo@adminhub.com',
          password: 'Demo@Pass1',
          remember: true,
        }}
        onFinish={onFinish}
        autoComplete="off"
        requiredMark={false}
      >
        <Row gutter={[8, 0]}>
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
            <Form.Item<FieldType> name="remember" valuePropName="checked">
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Flex align="center" justify="space-between">
            <Button
              type="primary"
              htmlType="submit"
              size="middle"
              loading={loading}
            >
              Continue
            </Button>
            <Link href={PATH_AUTH.passwordReset}>Forgot password?</Link>
          </Flex>
        </Form.Item>
      </Form>
      <Divider className="m-0">or</Divider>
      <Flex
        vertical={isMobile}
        gap="small"
        wrap="wrap"
        style={{ width: '100%' }}
      >
        <Button icon={<GoogleOutlined />}>Sign in with Google</Button>
        <Button icon={<FacebookFilled />}>Sign in with Facebook</Button>
        <Button icon={<TwitterOutlined />}>Sign in with Twitter</Button>
      </Flex>
    </AuthenticationFrame>
  );
};
