#!/usr/bin/env node
const express = require("express");
const http = require("http");
const net = require("net");
const WebSocket = require("ws");
const os = require("os");
const dgram = require("dgram");
const path = require("path");
const QRCode = require("qrcode");

const app = express();
// Preferred port; if it's taken (another dev server, a second app...) we
// walk up 3001, 3002, ... until one is free. `port` holds the real one.
const PREFERRED_PORT = Number(process.env.PORT) || 3000;
const MAX_PORT_ATTEMPTS = 100;
let port = PREFERRED_PORT;

const fs = require("fs");

app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/flags",
  express.static(path.join(__dirname, "node_modules/flag-icons")),
);

// Create a temp folder for storing uploads
const uploadDir = path.join(os.tmpdir(), "easy-share-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const files = new Map();

// HTTP upload endpoint (streams directly to disk)
app.post("/upload/:id", (req, res) => {
  const fileId = req.params.id;
  // the id comes from the client and becomes a path on disk: keep it inert
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(fileId)) {
    return res.sendStatus(400);
  }
  const tempFilePath = path.join(uploadDir, fileId);
  const writeStream = fs.createWriteStream(tempFilePath);

  req.pipe(writeStream);

  writeStream.on("finish", () => {
    files.set(fileId, {
      path: tempFilePath,
      name: req.query.name || "file",
      contentType: req.headers["content-type"] || "application/octet-stream",
    });

    // Auto-clean from disk after 20 minutes
    setTimeout(
      () => {
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (err) {
          console.error("Error cleaning up temp file:", err);
        }
        files.delete(fileId);
      },
      20 * 60 * 1000,
    );

    res.sendStatus(200);
  });

  writeStream.on("error", (err) => {
    console.error("Upload stream error:", err);
    res.sendStatus(500);
  });
});

// HTTP download endpoint (streams directly from disk)
app.get("/download/:id", (req, res) => {
  const file = files.get(req.params.id);
  if (!file || !fs.existsSync(file.path)) {
    return res.status(404).send("Fichier non trouvé ou expiré.");
  }

  // sendFile handles HTTP Range requests, which browsers need to show video
  // thumbnails and to seek (iOS Safari refuses to play video without it).
  res.attachment(file.name); // RFC 6266 filename + filename* (UTF-8)
  res.setHeader("Content-Type", file.contentType);
  res.sendFile(file.path, (err) => {
    if (err && !res.headersSent) res.sendStatus(err.status || 500);
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
// ws re-emits the HTTP server's errors (e.g. EADDRINUSE while probing ports);
// those are handled by listenOnFreePort, so don't let them crash the process.
wss.on("error", () => {});
const clients = new Map();
let hostConnectedAtLeastOnce = false;
let hostExitTimer = null;
const messageHistory = [];
const MAX_HISTORY = 100;

const VIRTUAL_IFACE_PATTERN =
  /virtual|vethernet|hyper-v|docker|vbox|virtualbox|vmware|wsl|vpn|loopback|tailscale|zerotier|hamachi|wireguard|nordlynx|tap|tun|utun|bluetooth|bridge|br-|veth/i;

function isUsableIPv4(ip) {
  return !(
    ip.startsWith("127.") || // loopback
    ip.startsWith("169.254.") || // link-local (no DHCP)
    ip.startsWith("0.") ||
    ip === "255.255.255.255"
  );
}

function isPrivateIPv4(ip) {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172.(1[6-9]|2d|3[01])./.test(ip)
  );
}

// Ask the OS which local address it would use to reach the outside world.
// UDP "connect" sends no packet; it only resolves the route. This is the
// address of the real LAN adapter (Wi-Fi/Ethernet) in almost every setup.
let defaultRouteIp = null;
function refreshDefaultRouteIp() {
  return new Promise((resolve) => {
    const socket = dgram.createSocket("udp4");
    const done = (ip) => {
      try {
        socket.close();
      } catch (_) {}
      defaultRouteIp = ip;
      resolve(ip);
    };
    socket.on("error", () => done(null));
    try {
      socket.connect(53, "1.1.1.1", () => {
        try {
          done(socket.address().address);
        } catch (_) {
          done(null);
        }
      });
    } catch (_) {
      done(null);
    }
  });
}

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    const isVirtualOrVpn = VIRTUAL_IFACE_PATTERN.test(name);
    const lowerName = name.toLowerCase();

    for (const iface of interfaces[name] || []) {
      const isIPv4 = iface.family === "IPv4" || iface.family === 4;
      if (!isIPv4 || iface.internal) continue;

      const ip = iface.address;
      if (!isUsableIPv4(ip)) continue;

      let score = 0;

      // the adapter the OS actually routes through is the best bet
      if (ip === defaultRouteIp && !isVirtualOrVpn) score += 200;

      if (/wi-?fi|wlan|wireless|^wl/.test(lowerName)) score += 100;
      else if (/ethernet|^ethd|^end|^en[ops]/.test(lowerName)) score += 80;

      // home/office LAN ranges
      if (isPrivateIPv4(ip)) score += 30;
      // CGNAT range used by Tailscale & co
      if (/^100.(6[4-9]|[7-9]d|1[01]d|12[0-7])./.test(ip)) score -= 100;

      if (isVirtualOrVpn) score -= 300;

      // .1 addresses are usually virtual gateways (WSL, Docker, Hyper-V)
      if (ip.endsWith(".1")) score -= 50;

      candidates.push({ ip, score, name });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.map((c) => c.ip);
}

function getDeviceName(ua) {
  if (!ua) return "Appareil distant";
  if (/android/i.test(ua)) return "Android";
  if (/iPad|iPhone|iPod/.test(ua)) return "iPhone / iPad";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "PC Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Appareil";
}

function broadcastClientsList() {
  const clientsList = Array.from(clients.values()).map((c) => ({
    id: c.id,
    name: c.name,
    ip: c.ip,
  }));

  const payload = JSON.stringify({
    type: "clients_list",
    clients: clientsList,
  });

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

function getHistoryFor(clientId) {
  return messageHistory.filter((msg) => {
    return (
      msg.targetId === "all" ||
      msg.targetId === clientId ||
      msg.senderId === clientId
    );
  });
}

wss.on("connection", (ws, req) => {
  const rawIp = req.socket.remoteAddress || "127.0.0.1";
  const clientIp = rawIp.replace(/^.*:/, "") || "127.0.0.1";
  const isHost =
    rawIp === "::1" || rawIp === "127.0.0.1" || rawIp.endsWith("127.0.0.1");

  if (isHost) {
    hostConnectedAtLeastOnce = true;
    if (hostExitTimer) {
      clearTimeout(hostExitTimer);
      hostExitTimer = null;
    }
  }

  const userAgent = req.headers["user-agent"];
  const baseName = getDeviceName(userAgent);

  const clientId = "c_" + Math.random().toString(36).substring(2, 9);

  const existingNames = Array.from(clients.values()).map((c) => c.name);
  let clientName = baseName;
  let counter = 2;
  while (existingNames.includes(clientName)) {
    clientName = `${baseName} ${counter}`;
    counter++;
  }

  console.log(`[Connect] ${clientName} [ID: ${clientId}]`);

  clients.set(clientId, {
    ws,
    id: clientId,
    name: clientName,
    ip: clientIp,
    isHost,
  });

  // A remote device already reached us through a working address: reuse it.
  // The host (localhost / 127.0.0.1) needs the real LAN address instead.
  const hostHeader = req.headers.host || "";
  const reachedViaLan =
    !isHost &&
    hostHeader &&
    !/^(localhost|127\.|\[::1\]|0\.0\.0\.0)/i.test(hostHeader);

  refreshDefaultRouteIp().then(() => {
    let serverUrl;
    if (reachedViaLan) {
      serverUrl = `http://${hostHeader}`;
    } else {
      const primaryIp = getLocalIPs()[0] || os.hostname();
      serverUrl = `http://${primaryIp}:${port}`;
    }

    QRCode.toDataURL(
      serverUrl,
      {
        margin: 1,
        width: 256,
        color: {
          dark: "#1d1d1f",
          light: "#ffffff",
        },
      },
      (err, qrDataUrl) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const initPayload = {
          type: "init",
          clientId: clientId,
          serverUrl: serverUrl,
          history: getHistoryFor(clientId),
        };

        if (!err) {
          initPayload.qrCode = qrDataUrl;
        }

        ws.send(JSON.stringify(initPayload));
        broadcastClientsList();
      },
    );
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "share_text" || data.type === "share_file") {
        const targetId = data.targetId || "all";
        const senderInfo = clients.get(clientId);

        const newMessage = {
          id:
            "m_" +
            Date.now().toString(36) +
            Math.random().toString(36).substring(2, 5),
          type: data.type === "share_file" ? "file" : "text",
          text: data.text || "",
          fileName: data.fileName || "",
          fileType: data.fileType || "",
          fileSize: data.fileSize || 0,
          fileId: data.fileId || null,
          sender: senderInfo ? senderInfo.name : "Inconnu",
          senderId: clientId,
          targetId: targetId,
          timestamp: new Date().toISOString(),
        };

        messageHistory.push(newMessage);
        if (messageHistory.length > MAX_HISTORY) {
          messageHistory.shift();
        }

        const payload = JSON.stringify({
          type: "new_message",
          message: newMessage,
        });

        if (targetId === "all") {
          clients.forEach((c) => {
            if (c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(payload);
            }
          });
        } else {
          const targetClient = clients.get(targetId);
          if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
            targetClient.ws.send(payload);
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
          }
        }
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  ws.on("close", () => {
    console.log(`[Disconnect] ${clientName} [ID: ${clientId}]`);
    clients.delete(clientId);
    broadcastClientsList();

    if (hostConnectedAtLeastOnce && isHost) {
      const hasHost = Array.from(clients.values()).some((c) => c.isHost);
      if (!hasHost) {
        hostExitTimer = setTimeout(() => {
          const stillHasHost = Array.from(clients.values()).some(
            (c) => c.isHost,
          );
          if (!stillHasHost) {
            console.log("Host closed tab. Exiting server...");
            process.exit(0);
          }
        }, 3000);
      }
    }
  });
});

// Is something already answering on localhost:<port>? On Windows (and
// macOS) a dev server bound to 127.0.0.1 or ::1 does NOT stop us from binding
// 0.0.0.0 on the same port, and then "localhost:<port>" opens *their* app.
// So we actively probe both loopbacks instead of trusting EADDRINUSE alone.
function isAnswering(host, candidate) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: candidate });
    const finish = (taken) => {
      socket.destroy();
      resolve(taken);
    };
    socket.setTimeout(400, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function isPortTaken(candidate) {
  const [v4, v6] = await Promise.all([
    isAnswering("127.0.0.1", candidate),
    isAnswering("::1", candidate),
  ]);
  return v4 || v6;
}

function tryListen(candidate) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve(candidate);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(candidate, "0.0.0.0");
  });
}

async function listenOnFreePort(firstPort, maxAttempts) {
  for (let candidate = firstPort; candidate < firstPort + maxAttempts; candidate++) {
    if (await isPortTaken(candidate)) {
      console.log(`Port ${candidate} is already used by another app, trying ${candidate + 1}...`);
      continue;
    }
    try {
      return await tryListen(candidate);
    } catch (err) {
      if (err.code !== "EADDRINUSE" && err.code !== "EACCES") throw err;
      console.log(`Port ${candidate} is unavailable, trying ${candidate + 1}...`);
    }
  }
  throw new Error(
    `No free port between ${firstPort} and ${firstPort + maxAttempts - 1}`,
  );
}

const ready = listenOnFreePort(PREFERRED_PORT, MAX_PORT_ATTEMPTS).then(
  async (boundPort) => {
    port = boundPort;
    await refreshDefaultRouteIp();
    const localIps = getLocalIPs();
    console.log("\n==================================================");
    console.log("🚀 Easy-Share Server Started!");
    console.log(`Access locally:      http://localhost:${port}`);

    if (localIps.length > 0) {
      console.log("\nAccess from other devices on the same network:");
      localIps.forEach((ip) => {
        console.log(`👉 http://${ip}:${port}`);
      });
    } else {
      console.log("\nNo active local network interfaces found.");
    }
    console.log("==================================================\n");
    return port;
  },
);

// When run directly (npx / node server.js), fail loudly if nothing is free.
if (require.main === module) {
  ready.catch((err) => {
    console.error("Could not start Easy-Share:", err.message);
    process.exit(1);
  });
}

module.exports = { ready };
