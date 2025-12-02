const socketClient = require("socket.io-client");
/* sky connection get */
let sky = socketClient(client.sky_url, {
    transports: ["websocket"],
    upgrade: false,
    forceNew: true,
    secure: true,
  });