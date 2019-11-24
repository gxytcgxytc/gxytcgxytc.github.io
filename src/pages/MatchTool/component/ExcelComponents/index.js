import XLSX from 'xlsx'
import { message } from 'antd'

export function getXlsxFile(matchData, memberNum = 6) {
  const formatedMatchData = formatMatchdata_MapToPlayer(matchData);
  const players = countPlayer(formatedMatchData, memberNum) || {};
  const {
    blue = [],
    red = [],
  } = players
  const allPlayers = [...blue, ...red]
  try {
    const csvData = [
      [null, ...allPlayers]
    ];
    if (formatedMatchData) {
      for (let mapName in formatedMatchData) {
        const line = []
        line.push(mapName)
        for (let playerName of allPlayers) {
          line.push(formatedMatchData[mapName][playerName] && formatedMatchData[mapName][playerName].score || null)
        }
        csvData.push(line)
      }
      const sheet_map_to_player = XLSX.utils.aoa_to_sheet(csvData)
      sheet_map_to_player['!cols'] = [{ wpx: 333 }].concat(new Array(memberNum * 2).fill({ wpx: 75 }))
      const wb = sheet2blob(sheet_map_to_player, 'sheet1')
      openDownloadDialog(wb, 'matchData.xlsx')
    }
  } catch (e) {
    message.error('请联系管理员..这货脑子不好使写错了点什么...');
  }
}
function formatMatchdata_MapToPlayer(matchData) {
  try {
    if (matchData) {
      const formatedData = {}
      for (let value of matchData) {
        formatedData[value.beatmap] = {}
        const playerDataArr = [...value.blueScores, ...value.redScores];
        playerDataArr.forEach(i => {
          if (i) {
            formatedData[value.beatmap][i.username] = i
          }
        })
      }
      return formatedData;
    } else {
      return {}
    }
  } catch (e) {
    message.error('请联系管理员..这货脑子不好使写错了点什么...');
  }
}
function countPlayer(formatedData, memberNum = 6) {
  const red = new Set()
  const blue = new Set()
  try {
    if (formatedData) {
      for (let mapname in formatedData) {
        for (let username in formatedData[mapname]) {
          if (username && formatedData[mapname][username].slot < (memberNum / 2)) {
            blue.add(username)
          } else if (username && formatedData[mapname][username].slot >= (memberNum / 2)) {
            red.add(username)
          }
        }
      };
      if (red.size > memberNum || blue.size > memberNum) {
        throw ({ message: '队伍规模选错了?.,..' })
      }
      return {
        red: [...red].concat(new Array(memberNum - red.size).fill('缺席了')),
        blue: [...blue].concat(new Array(memberNum - blue.size).fill('缺席了')),
      }
    } else {
      return {}
    }
  } catch (e) {
    message.error(e.message);
  }
}


// @https://www.cnblogs.com/liuxianan/p/js-excel.html
function sheet2blob(sheet, sheetName) {
  sheetName = sheetName || 'sheet1';
  var workbook = {
    SheetNames: [sheetName],
    Sheets: {}
  };
  workbook.Sheets[sheetName] = sheet;
  // 生成excel的配置项
  var wopts = {
    bookType: 'xlsx', // 要生成的文件类型
    bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
    type: 'binary'
  };
  var wbout = XLSX.write(workbook, wopts);
  var blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
  // 字符串转ArrayBuffer
  function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  }
  return blob;
}

/**
 * 通用的打开下载对话框方法，没有测试过具体兼容性
 * @param url 下载地址，也可以是一个blob对象，必选
 * @param saveName 保存文件名，可选
 */
function openDownloadDialog(url, saveName) {
  if (typeof url == 'object' && url instanceof Blob) {
    url = URL.createObjectURL(url); // 创建blob地址
  }
  var aLink = document.createElement('a');
  aLink.href = url;
  aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
  var event;
  if (window.MouseEvent) event = new MouseEvent('click');
  else {
    event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  }
  aLink.dispatchEvent(event);
}