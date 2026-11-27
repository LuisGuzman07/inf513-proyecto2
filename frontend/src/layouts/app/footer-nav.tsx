import { Layout } from 'antd';
import { PATH_GITHUB } from '../../constants';

const { Footer } = Layout;

type FooterNavProps = React.HTMLAttributes<HTMLDivElement>;

const FooterNav = ({ children, ...others }: FooterNavProps) => {
  return (
    <Footer {...others}>
      {children ?? (
        <>
          Antd dashboard © {new Date().getFullYear()}. Created by&nbsp;
          <a href={PATH_GITHUB.org} target="_blank">
            Design Sparx
          </a>
        </>
      )}
    </Footer>
  );
};

export default FooterNav;
