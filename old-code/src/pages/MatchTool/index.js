import React, { PureComponent } from 'react';
import { Input, Button, Modal, message, Table, Select, Icon, Tooltip } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import styles from './index.less'
import ScoreCell from './component/ScoreCell'
import getColumns from './component/columns';
import { getXlsxFile } from './component/ExcelComponents';
const { Option } = Select;
// 没有对fail的分数处理  ******************************************

class MatchList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      mplink: '',
      mpdata: {},
      finalScore: [0, 0],
      member: 6,
      apiKey: '',
    }
  }

  componentDidMount() {
    this.setState({
      apiKey: localStorage.getItem('apiKey') || '',
      mplink: localStorage.getItem('mplink') || '',
    })
  }
  // 链接处理失败
  getError = () => {
    message.error('emmmm?好像有哪里填错了')
  }

  // 双向绑定
  setValue = (e) => {
    this.setState({
      mplink: e.target.value || '',
    })
  }

  getScore = (scores) => {
    let num = 0
    scores.forEach(i => num += Number.parseInt(i && i.score || 0))
    return num
  }

  // 获取比赛信息
  getMatch = async () => {
    this.setState({ loading: true })
    const { mplink = '', apiKey = '' } = this.state;
    localStorage.setItem('apiKey', apiKey)
    localStorage.setItem('mplink', mplink)
    const link = mplink.replace(/\s/g, '').match(/([0-9]*)$/g) && mplink.replace(/\s/g, '').match(/([0-9]*)$/g)[0];
    if (link) {
      try {
        await fetch(`https://osu.ppy.sh/api/get_match?k=${apiKey}&mp=${link}`)
          .then((res) => {
            return res.json()
          })
          .then(async res => {
            if (res.match && res.games) {
              const users = await this.getUsers(res);
              const games = await this.getMaps(res);
              const mpdata = this.formatData(res, { users, games })
              const finalScore = this.getFinalScore(mpdata.matchData)
              this.setState({
                mpdata,
                finalScore,
                loading: false,
              })
            } else {
              this.setState({ loading: false })
              message.error('啥也没看到...你输了啥玩意?')
            }
          });
      } catch (e) {
        this.setState({ loading: false })
        message.error(e.message)
      }
    } else {
      this.setState({ loading: false })
      this.getError();
    }
  }
  // 获取user列表
  getUsers = async (res) => {
    const { apiKey } = this.state;
    const userListSet = new Set()
    res.games.forEach(match => {
      match.scores && match.scores.forEach(slot => {
        userListSet.add(slot.user_id)
      })
    })
    const userListArr = [...userListSet]
    const userListResult = await Promise.all(userListArr.map(i => fetch(`https://osu.ppy.sh/api/get_user?k=${apiKey}&u=${i}`).then(res => res.json())))
    return userListResult.map(i => ({
      user_id: i[0].user_id,
      username: i[0].username,
    }))
  }

  // 获取map列表
  // 返回一个新的games
  // 对重赛去重(还没做)
  getMaps = async (res) => {
    const { apiKey } = this.state;
    const mapList = [];
    res.games.forEach(match => {
      mapList.push(match.game_id)
    })
    const filtedGames = []
    for (let value of mapList) {
      for (let game of res.games) {
        if (game.game_id === value) {
          filtedGames.push({
            beatmap_id: game.beatmap_id,
            scores: game.scores,
          })
        }
      }
    };
    const mapListResult = await Promise.all(filtedGames.map(i => fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${apiKey}&b=${i.beatmap_id}`).then(res => res.json())))
    const mapNameList = {}
    mapListResult.forEach(i => {
      mapNameList[i[0].beatmap_id] = {
        label: `${i[0].artist} - ${i[0].title} [${i[0].version}]`,
        beatmapset_id: i[0].beatmapset_id,
      }
    })
    filtedGames.forEach(i => {
      i.beatmap = mapNameList[i.beatmap_id] && mapNameList[i.beatmap_id].label;
      i.beatmapset_id = mapNameList[i.beatmap_id] && mapNameList[i.beatmap_id].beatmapset_id;
    })
    return filtedGames;
  }


  // 以下为格式化数据函数
  formatData = (res, { users, games }) => {
    const mpdata = {};
    const {
      match,
    } = res;
    mpdata.teamNames = this.getTeamName(match.name);
    mpdata.matchData = this.getMatchData(games, users);
    return mpdata
  }

  getTeamName = (name) => {
    if (name) {
      const nameArr = name.match(/(\(.*?\))/g)
      const teamNames = nameArr.map(i => {
        return i.slice(1, -1)
      })
      return teamNames;
    }
    return []
  }
  getMatchData = (games, users) => {
    // 参赛人数
    const { member } = this.state;
    return games.map((i, index) => {
      const scores = i.scores.map(result => {
        if (Number.parseInt(result.slot) < Number.parseInt(member)) {// 判断是否为选手
          const simpleScore = {};
          const {
            count300 = 0,
            count100 = 0,
            count50 = 0,
            countmiss = 0,
          } = result
          simpleScore['username'] = users.find(i => i.user_id === result.user_id).username;
          simpleScore['slot'] = result.slot;
          simpleScore['score'] = result.score;
          simpleScore['combo'] = result.maxcombo;
          simpleScore['acc'] = Math.round((count300 / 1 + count100 / 3 + count50 / 6) / (Number(count300) + Number(count100) + Number(count50) + Number(countmiss)) * 10000) / 100
          return simpleScore;
        }
        return undefined;
      })
      i.blueScores = scores.slice(0, member / 2);
      i.redScores = scores.slice(member / 2, member);
      i.blueTeamScores = this.getScore(scores.slice(0, member / 2));
      i.redTeamScores = this.getScore(scores.slice(member / 2, member));
      return i;
    })
  }
  getFinalScore = (mpdata) => {
    let blue = 0;
    let red = 0;
    for (let value of mpdata) {
      if (value.blueTeamScores > value.redTeamScores) {
        blue++
      } else if (value.redTeamScores > value.blueTeamScores) {
        red++
      }
    }
    return [blue, red];
  }
  // 千分数字 
  formatNum = (num) => {
    var reg = /\d{1,3}(?=(\d{3})+$)/g;
    return (num + '').replace(reg, '$&,');
  }

  // 渲染展开行
  expandedRowRender = (record, index, indent, expanded) => {
    const { member } = this.state;
    if (record.blueScores.length) {
      const Children = []
      for (let i = 0; i < member / 2; i++) {
        if (record.blueScores[i] && record.redScores[i]) {
          const child = <div style={{ display: 'flex' }} key={`${i}Scores`}>
            <div className="blue-team-detail">
              <span>{record.blueScores[i].username}</span>
              <span>{record.blueScores[i].acc}</span>
              <span>{record.blueScores[i].combo}</span>
              <span>{this.formatNum(record.blueScores[i].score)}</span>
            </div>
            <div className="red-team-detail">
              {record.redScores[i] ?
                <>
                  <span>{this.formatNum(record.redScores[i].score)}</span>
                  <span>{record.redScores[i].combo}</span>
                  <span>{record.redScores[i].acc}</span>
                  <span>{record.redScores[i].username}</span>
                </>
                : <span>...掉线了?.,..</span>
              }
            </div>
          </div>
          Children.push(child)
        }
      }
      return (
        <div className="expend-container" style={{ backgroundImage: `url(https://assets.ppy.sh/beatmaps/${record.beatmapset_id}/covers/cover.jpg)` }}>
          <div className="backgrount-layout">
            <div style={{ display: 'flex' }}>
              <div className="blue-team-detail">
                <span>ID</span>
                <span>acc</span>
                <span>combo</span>
                <span>score</span>
              </div>
              <div className="red-team-detail">
                <span>score</span>
                <span>combo</span>
                <span>acc</span>
                <span>ID</span>
              </div>
            </div>
            {Children}
          </div>
        </div>)
    } else {
      return (
        <div className="expend-container" style={{ backgroundImage: `url(https://assets.ppy.sh/beatmaps/${record.beatmapset_id}/covers/cover.jpg)` }}>
          <div className="backgrount-layout">
            <h4>老哥...这把可能abort了...</h4>
          </div>
        </div>)
    }
  }

  render() {
    const {
      setValue,
      getMatch,
    } = this;
    const {
      matchData,
      teamNames = [],
    } = this.state.mpdata;
    const {
      loading,
      member,
    } = this.state
    return (
      <div className={styles.MatchList}>
        <p>MATCH VIEWER</p>
        <div style={{ color: '#444' }}>还在写...由于低技术力此页面随时可能崩溃...</div>
        <div className="match-list-banner">
          <div style={{ width: 450, marginLeft: '7%' }}>
            <Input style={{ width: '341px', margin: 10 }}
              value={this.state.mplink || ''}
              onChange={setValue}
              onPressEnter={getMatch}
              placeholder="输个mpLink试试?"
            />
            <Tooltip title={<span>惨 我 惨, api不会用作保存~ <a target="_blank" href="https://old.ppy.sh/p/api">点这里申请apiKey</a></span>}><Icon type="info-circle" style={{ color: 'white', fontSize: '20px' }} /></Tooltip><Input
              placeholder="API key 惨 没服务器 惨"
              onChange={(e) => { this.setState({ apiKey: e.target.value }) }}
              style={{ width: '200px', margin: 10 }}
              value={this.state.apiKey}
            />
            <Select
              placeholder="队伍规模是?"
              onChange={(e) => { this.setState({ member: e }) }}
              style={{ width: '120px', margin: 10 }}
              value={this.state.member}
            >
              <Option value={2}>1 v 1</Option>
              <Option value={4}>2 v 2</Option>
              <Option value={6}>3 v 3</Option>
              <Option value={8}>4 v 4</Option>
            </Select>
            <Button type="primary" onClick={getMatch} loading={loading} >回车!</Button>
          </div>
          <div className="hexagon-box-banner">
            <div className="hexagon-score">
              <span>{this.state.finalScore[0]}</span>
              <span>vs</span>
              <span>{this.state.finalScore[1]}</span>
            </div>
            <div className="hexagon-box-name">
              <div>
                <span><span>{teamNames[0]}</span></span>
                <span><span>{teamNames[1]}</span></span>
              </div>
            </div>
          </div>
        </div>
        <div className="main-container">
          <Button style={{
            position: 'relative',
            top: '12px',
            left: '1124px',
          }} onClick={() => getXlsxFile(matchData, member)} type="primary">xlsx<Icon type="download" /></Button>
          <div className="mp-info">
            <Table
              loading={loading}
              pagination={false}
              rowKey={record => record.blueTeamScores + record.redTeamScores}
              className={styles.MatchInfoTable}
              dataSource={matchData}
              columns={getColumns.call(this, teamNames)}
              expandRowByClick={true}
              expandIcon={() => null}
              expandedRowRender={this.expandedRowRender}
              expandIconAsCell={false}
            />
          </div>
        </div>
        <footer>
          <div><span>Copyright&copy;2019 Gxy</span><span><Icon type="github" /></span><span><a target="_blank" href="https://pro.ant.design/">Ant Design Pro</a></span></div>
        </footer>
      </div>
    )
  }
}

export default MatchList;
