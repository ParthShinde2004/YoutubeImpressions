'use strict';

const WebSocket = require('ws');

const port = 3009;

const wss = new WebSocket.Server({ port });
console.log(`Server is listening at port ${port}`);
console.log(`
Please go to https://studio.youtube.com/robots.txt and open console by pressing F12 and run the code in \`inspector.js\`
`);

const rejectAll = ws => ws.close();

(async () => {
  while(true){
    console.log(`Awaiting connection....`);
    wss.off('connection', rejectAll);
    const ws = await new Promise(rs => wss.once('connection', rs));
    wss.on('connection', rejectAll);
    console.log(`Connection establised`);
    const closePromise = new Promise(rs => ws.once('close', rs)).then(() => false);
    while(true){
      const consolePromise = new Promise(rs => process.stdin.once('data', rs));
      console.log(`Press enter your youtube id to fetch it's metric`);
      let result = await Promise.race([closePromise, consolePromise]);
      if(result === false) break;
      console.log(`Fetching metric....`);
      ws.send((result + '').trim());
      const metricPromise = new Promise(rs => ws.once('message', rs));
      result = await Promise.race([metricPromise, closePromise]);
      if(result === false) break;
      console.log(`Received metric: ${result}`);
    }
    console.log(`Connection closed`);
  }
})(); 
