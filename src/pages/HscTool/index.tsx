import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import Configs from './components/Configs';
import MatchProcess from './components/MatchProcess';
import styles from './index.less';

const HomePage: React.FC = () => {

  return (
    <PageContainer ghost title="HSC比赛助手">
      <div className={styles.container}>
        <Configs />
        <MatchProcess />
      </div>
    </PageContainer>
  );
};

export default HomePage;