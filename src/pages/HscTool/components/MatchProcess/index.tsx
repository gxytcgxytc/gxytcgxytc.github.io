import React, { useState } from 'react';
import { Table, Tag, Button, Card, Row, Col, Empty, Alert, Input, Form, Select, Popconfirm } from 'antd';
import { useModel } from '@umijs/max';
import useMatchProcess from '../../hooks/useMatchProcess';
import MappoolRender, { tagRender } from './components/MappoolRender';
import undo from '@/pages/Access/undo.svg'
const teams = ["red", "blue"]
const MatchProcess: React.FC = () => {


  const { config } = useModel("HscTool.index");
  const {
    mapPool,
    matchHistory,
    setMatchHistory,
    strikedMaps,
    strikeMap,
    pickMap,
    availableMaps,
    getNextAvailableMaps,
    lastPickedMap,
    resetToMap,
  } = useMatchProcess(config);
  console.log(
    {
      matchHistory,
      strikedMaps,
      strikeMap,
      pickMap,
      availableMaps,
      getNextAvailableMaps,
      lastPickedMap,
    }

  )

  const currentStage = matchHistory.length > 0 ? 'pick' : 'strike'
  return (
    <>

      < Card title="当前规则" style={{ marginBottom: 20 }}>

      </Card >
      <Card title="比赛流程" style={{ marginBottom: 20 }}>
        <Row gutter={24}>
          {teams.map((str) => {
            return <Col key={str} span={9} >
              <Form layout="horizontal">
                {str === 'red' ? (
                  <Form.Item label="strikedMaps">
                    {strikedMaps.map(s => tagRender(s.id, s.mod))}
                  </Form.Item>
                ) : (
                  <Form.Item style={{ visibility: 'hidden' }} name={str + "Strike"} label={str + "Strike"}>
                    <Select />
                  </Form.Item>
                )}

                <div style={{ visibility: str === 'red' ? 'visible' : 'hidden' }}>
                  Default Pick: {matchHistory[0] && <>
                    {tagRender(matchHistory[0].mapId, matchHistory[0].mod)}
                    {matchHistory.find(item => item.mod === 'TB') && tagRender('TB', 'TB')}
                    <Popconfirm
                      title="reset to this pick?"
                      onConfirm={() => resetToMap(matchHistory[0].mapId)}>
                      <Button type="link"
                        style={{ padding: 0, verticalAlign: 'middle' }}>
                        <img src={undo} style={{
                          width: 20,
                          height: 20,
                        }} alt="undo" />
                      </Button>
                    </Popconfirm>
                  </>
                    || 'ah?'}
                </div>
                <br />
                <Form.Item label={str + "Picks"}>
                  <div>
                    {matchHistory.filter(item => item.team === str).map((item, index) => (
                      <li key={item.mapId} style={{ height: 30 }}>
                        {tagRender(item.mapId, item.mod)}
                        <Popconfirm
                          title="reset to this pick?"
                          onConfirm={() => resetToMap(item.mapId)}>

                          <Button type="link"
                            style={{ padding: 0, verticalAlign: 'middle' }}>
                            <img src={undo} style={{
                              width: 20,
                              height: 20,
                            }} alt="undo" />
                          </Button>
                        </Popconfirm>


                      </li>
                    ))}

                  </div>
                </Form.Item>

                <MappoolRender
                  onMapSelect={(map, mod) => {
                    if (matchHistory.length > 0) {
                      if (mod === 'TB') {
                        pickMap(map, 'all', mod)
                        return;
                      };
                      pickMap(map, str as 'blue' | 'red', mod)
                    } else {
                      strikeMap(map)
                    }
                  }}
                  mapPool={getNextAvailableMaps(str as 'all' | 'red' | 'blue')}
                  currentStage={currentStage}
                />
              </Form >
            </Col>
          })}

        </Row>

      </Card>


      {/* 下一张可选图提示 */}
      < Card title="下一张可选图" style={{ marginBottom: 20 }}>

      </Card >
    </>
  );
};

export default MatchProcess;