import React, { PureComponent } from 'react';
import { Icon } from 'antd'
import './index.css';
/**
 * 
 */
class ScoreCell extends PureComponent {

    render () {
        const {
            score,
            team,
        } = this.props;
        return (
            <div className={team === 'blue' ? 'score-cell-blue' : 'score-cell-red'}>
                {score} <Icon type="star" />
            </div>
        )
    }
}




export default ScoreCell;