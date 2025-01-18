const file = document.getElementById('file')
const download = document.getElementById('download')
const bids = []
let legacy = localStorage.getItem('api_key');
const showkey = document.getElementById('showkey');
const api_key_dom = document.getElementById('submit')
const log = document.getElementById('log');
// log写入函数 向log中添加一行数据
function logWrite(text, fixed) {
  const logDomText = document.createTextNode(text + '\n');
  // fixed = true 则修改最后一行数据 
  if (fixed) {
    log.lastChild.nodeValue = text;
  } else {
    log.appendChild(logDomText);
  }
}
logWrite('神秘日志\n');
logWrite(`txt file should be like

bid1
bid2
bid3
bid4

prepare your file then throw it to the file input area
add your api key, it will be bottom of your osu account setting page;
then click 下载 and wait

dont support sid yet
`);

if (legacy) {
  api_key_dom.value = legacy;
}
showkey.onclick = () => {
  const submitContainer = document.getElementById('submitContainer');
  submitContainer.style.display = 'flex';
}
download.onclick = function () {
  log.innerText = ''
  logWrite('神秘日志\n');
  const reader = new FileReader()
  reader.onload = async function () {
    const lines = reader.result.split('\n').filter(Boolean)
    if (lines.length > 100) {
      return alert('最多一次下100张图')
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const bid = parseInt(line)
      if (!isNaN(bid)) {
        bids.push(bid)
      }
    }
    const beatmaps = [];
    logWrite('准备获取谱面信息\n')
    await getBeatmapsInfo(beatmaps, bids);
    logWrite('准备下载\n')
    downloadBeatmaps(beatmaps)
  }
  reader.readAsText(file.files[0])
}

file.onchange = () => {
  logWrite('已读取文件\n')
}

// https://txy1.sayobot.cn/beatmaps/download/novideo/{set_id}?server=auto

document.getElementById('submit').onchange = function (e) {
  localStorage.setItem('api_key', e.target.value);
}

const getBeatmapsInfo = async (beatmaps, bids) => {
  const getBeatmapInfo = async (b) => {
    const map = await fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${legacy}&b=${b}`)
      .then(response => response.json())
      .then(data => {
        if (data.length === 0) {
          console.log(`bid ${b} not found`);
          return null;
        }
        return data[0]
      })
      .catch(error => {
        console.error(`Error fetching beatmap ${b}:`, error);
        return null;
      });
    return map;
  }

  logWrite(`获取谱面信息中, 当前进度 0/${bids.length}`);

  const notFound = [];
  for (const b of bids) {

    logWrite(`获取bid ${b}信息中, 当前进度 ${bids.indexOf(b) + 1}/${bids.length}\n`, true);

    const map = await getBeatmapInfo(b);
    if (map) {
      beatmaps.push(map);
    } else {
      notFound.push(b)
    }
  }
  logWrite(`获取谱面信息完成, 错误谱面 ${notFound.join(',') || '无'}\n\n\n`, true);
}



const downloadBeatmaps = async (beatmaps) => {
  const responses = [];

  const failed = [];
  logWrite(`下载中, 当前进度 0/${beatmaps.length}`);

  for (const beatmap of beatmaps) {
    const beatmapset_id = beatmap.beatmapset_id;
    const url = `https://txy1.sayobot.cn/beatmaps/download/novideo/${beatmapset_id}?server=auto`;

    logWrite(`下载中, 当前进度 ${beatmaps.indexOf(beatmap) + 1}/${beatmaps.length}\n`, true);

    const response = await fetch(url).catch(error => {
      console.info(`Error fetching beatmap ${beatmapset_id}:`, error);
      return null
    });
    if (!response) {
      failed.push(beatmap.beatmap_id);
      continue;
    }
    responses.push(response);
  }

  logWrite(`下载完成, 共下载成功${responses.length}个谱面 错误谱面 ${failed.join(',') || '无'}\n\n\n`, true);


  logWrite(`打包中`);
  // 打包成一个zip
  const zip = new JSZip();
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    const blob = await response.blob();
    response.headers.forEach((a) => { console.log(a) })
    const fileName = decodeURIComponent(response.url.split('?')[1].split('=')[1]);
    zip.file(fileName + '.osz', blob);
  }
  logWrite(`打包完成`);
  // 点击下载
  zip.generateAsync({ type: 'blob' }).then(function (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beatmaps.zip';
    a.click();
    URL.revokeObjectURL(url);
    logWrite(`下载完成`);
  });

}