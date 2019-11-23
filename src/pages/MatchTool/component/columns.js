export default function getColumns(teamName) {


  return [
    {
      dataIndex: 'blueTeamScores',
      title: teamName[0] || '蓝队',
      align: 'center',
      key: 'blueTeamScores',
      width: '20%',
      render: (text, record) => {
        const Score = this.formatNum(record.blueTeamScores - record.redTeamScores);
        const className = record.blueTeamScores - record.redTeamScores > 0 ? 'blue-winner-table-cell' : ''
        return <div className={className} style={{ '--Score': `'win by ${Score}'` }}>{this.formatNum(text)}</div>
      }
    },
    {
      dataIndex: 'beatmap',
      title: 'beatmap',
      align: 'center',
      key: 'beatmap',
      width: '20%',
      render: (text) => (<div style={{ height: '32px', lineHeight: '16px' }}>{text}</div>)
    },
    {
      dataIndex: 'redTeamScores',
      align: 'center',
      title: teamName[1] || '红队',
      key: 'redTeamScores',
      width: '20%',
      render: (text, record) => {
        const Score = this.formatNum(record.redTeamScores - record.blueTeamScores);
        const className = record.redTeamScores - record.blueTeamScores > 0 ? 'red-winner-table-cell' : '';
        return <div className={className} style={{ '--Score': `'win by ${Score}'` }}>{this.formatNum(text)}</div>;
      }
    }
  ]
}