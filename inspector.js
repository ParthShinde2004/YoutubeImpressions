getWsEventPromise = (ws, event) => new Promise(rs => ws.addEventListener(event, rs, { once: true }));
awaitWs = async ws => {
  const ready = getWsEventPromise(ws, 'open').then(() => true);
  const close = getWsEventPromise(ws, 'close').then(() => false);
  return await Promise.any([ready, close]);
}
fetchMetric = async (id, retryIn = 1, retryAmount = 60) => {
  const iframe = document.createElement('iframe');
  iframe.src = `https://studio.youtube.com/video/${id}/analytics/tab-reach_viewers/period-default`;
  document.body.appendChild(iframe);
  while(true){
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const htmls = iframeDoc.getElementsByClassName('metric-container layout horizontal style-scope yta-key-metric-block');
    const metric = Array.from(htmls).map(html => html.innerText);
    if(metric.length === 0 && --retryAmount >= 0){
      await new Promise(rs => setTimeout(rs, retryIn * 1000));
      continue;
    }
    iframe.remove();
    return metric;
  }
}
main = async (port = 3009, retryIn = 10) => {
  while(true){
    const ws = new WebSocket(`ws://localhost:${port}`);
    console.log(`Connecting to server....`);
    const connected = await awaitWs(ws);
    if(!connected){
      console.log(`Failed to connect to server, retying in ${retryIn} second(s)`);
      await new Promise(rs => setTimeout(rs, retryIn * 1000));
      continue;
    }
    console.log(`Connected to server`);
    const closePromise = getWsEventPromise(ws, 'close').then(() => true);
    while(true){
      const msgPromise = getWsEventPromise(ws, 'message').then(({ data }) => data?.text?.() ?? data);
      const result = await Promise.any([closePromise, msgPromise]);
      if(result === true){
        console.log(`Connection closed, retying in ${retryIn} second(s)`);
        await new Promise(rs => setTimeout(rs, retryIn * 1000));
        break;
      }
      const metric = await fetchMetric(result);
      ws.send(JSON.stringify(metric));
    }
  }
}
main();
