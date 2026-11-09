const statusIndicator = document.getElementById("connection-status");
const statusText = statusIndicator.querySelector(".status-text");
const myDeviceName = document.getElementById("my-device-name");
const emptyState = document.getElementById("empty-state");
const devicesContainer = document.getElementById("devices-container");

const desktopQrcodeImg = document.getElementById("desktop-qrcode-img");
const desktopQrcodePlaceholder = document.getElementById(
  "desktop-qrcode-placeholder",
);
const desktopCopyBtn = document.getElementById("desktop-copy-btn");

const burgerMenuBtn = document.getElementById("burger-menu-btn");
const mobileQrModal = document.getElementById("mobile-qr-modal");
const mobileQrClose = document.getElementById("mobile-qr-close");
const mobileQrcodeImg = document.getElementById("mobile-qrcode-img");
const mobileQrcodePlaceholder = document.getElementById(
  "mobile-qrcode-placeholder",
);
const mobileCopyBtn = document.getElementById("mobile-copy-btn");

const sendModal = document.getElementById("send-modal");
const sendModalClose = document.getElementById("send-modal-close");
const sendModalTitle = document.getElementById("send-modal-title");
const textInput = document.getElementById("text-input");
const fileInput = document.getElementById("file-input");
const modalDropZone = document.getElementById("modal-drop-zone");
const selectedFilesBox = document.getElementById("selected-files");
const selectedFilesSummary = document.getElementById("selected-files-summary");
const selectedFilesGrid = document.getElementById("selected-files-grid");
const clearFilesBtn = document.getElementById("clear-files-btn");
const uploadProgress = document.getElementById("upload-progress");
const uploadProgressLabel = document.getElementById("upload-progress-label");
const uploadProgressPercent = document.getElementById(
  "upload-progress-percent",
);
const uploadProgressBar = document.getElementById("upload-progress-bar");
const sendBtn = document.getElementById("send-btn");
const sendBtnLabel = sendBtn.querySelector("span");
const sendCard = sendModal.querySelector(".modal-card");

const receivedModal = document.getElementById("received-modal");
const receivedModalClose = document.getElementById("received-modal-close");
const receivedModalTitle = document.getElementById("received-modal-title");
const receivedModalSubtitle = document.getElementById(
  "received-modal-subtitle",
);
const receivedModalBody = document.getElementById("received-modal-body");
const receivedTexts = document.getElementById("received-texts");
const receivedGrid = document.getElementById("received-grid");
const downloadAllBtn = document.getElementById("download-all-btn");
const receivedCloseBtn = document.getElementById("received-close-btn");

const lightbox = document.getElementById("lightbox");
const lightboxStage = document.getElementById("lightbox-stage");
const lightboxCaption = document.getElementById("lightbox-caption");
const lightboxDownload = document.getElementById("lightbox-download");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toast-text");
const toastAction = document.getElementById("toast-action");

const aboutModal = document.getElementById("about-modal");
const aboutTriggerBtn = document.getElementById("about-trigger-btn");
const aboutModalClose = document.getElementById("about-modal-close");
const aboutCloseBtn = document.getElementById("about-close-btn");

const troubleModal = document.getElementById("trouble-modal");
const desktopTroubleBtn = document.getElementById("desktop-trouble-btn");
const mobileTroubleBtn = document.getElementById("mobile-trouble-btn");
const troubleModalClose = document.getElementById("trouble-modal-close");
const troubleCloseBtn = document.getElementById("trouble-close-btn");

const langDropdown = document.getElementById("lang-dropdown");
const langDropdownTrigger = document.getElementById("lang-dropdown-trigger");
const langCurrentLabel = document.getElementById("lang-current-label");
const langOptions = document.querySelectorAll(".lang-option");

const langLabels = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

let socket = null;
let reconnectTimeout = null;
let serverUrl = "";
let myClientId = "";
let connectedClients = [];
let activeTargetId = "";
let selectedFiles = [];
let currentLang = "en";

const i18n = { fr, en, es, de, it, pt };

const copySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`;

const monitorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`;
const smartphoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`;
const fileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;
const downloadSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>`;
const playSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>`;
const xSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

function getTranslation(key) {
  if (i18n[currentLang] && i18n[currentLang][key]) {
    return i18n[currentLang][key];
  }
  if (i18n["en"] && i18n["en"][key]) {
    return i18n["en"][key];
  }
  return key;
}

function applyLanguage(lang) {
  currentLang = lang;

  langCurrentLabel.textContent = langLabels[lang] || lang;
  langOptions.forEach((opt) => {
    opt.classList.toggle("active", opt.dataset.lang === lang);
  });

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    // Avoid overwriting elements whose state has been resolved (like custom device name or server URL)
    if (
      el.id === "my-device-name" &&
      el.textContent !== "Détection..." &&
      el.textContent !== "Detecting..."
    ) {
      return;
    }
    const key = el.getAttribute("data-i18n");
    el.textContent = getTranslation(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", getTranslation(key));
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    el.innerHTML = getTranslation(key).replace(
      "{port}",
      window.location.port || "80",
    );
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", getTranslation(el.getAttribute("data-i18n-title")));
  });

  if (selectedFiles.length > 0) updateSelectedSummary();
  if (!receivedModal.classList.contains("hidden")) updateReceivedHeader();

  if (!sendModal.classList.contains("hidden") && activeTargetId) {
    const activeClient = connectedClients.find((c) => c.id === activeTargetId);
    if (activeClient) {
      sendModalTitle.textContent = `${getTranslation("shareWith")} ${activeClient.name}`;
    }
  }

  localStorage.setItem("easy-share-lang", lang);
}

function detectLanguage() {
  const savedLang = localStorage.getItem("easy-share-lang");
  if (savedLang && i18n[savedLang]) {
    return savedLang;
  }
  const lang = (
    navigator.language ||
    navigator.userLanguage ||
    ""
  ).toLowerCase();
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("it")) return "it";
  if (lang.startsWith("pt")) return "pt";
  return "en";
}

function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

function connect() {
  clearTimeout(reconnectTimeout);
  updateStatus("connecting", "connecting");

  const wsUrl = getWebSocketUrl();
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    updateStatus("connected", "connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "init") {
        myClientId = data.clientId;
        serverUrl = data.serverUrl;

        if (data.qrCode) {
          desktopQrcodeImg.src = data.qrCode;
          desktopQrcodeImg.style.display = "block";
          desktopQrcodePlaceholder.style.display = "none";

          mobileQrcodeImg.src = data.qrCode;
          mobileQrcodeImg.style.display = "block";
          mobileQrcodePlaceholder.style.display = "none";
        }
      } else if (data.type === "clients_list") {
        connectedClients = data.clients;

        const me = connectedClients.find((c) => c.id === myClientId);
        if (me) {
          myDeviceName.textContent = me.name;
        }

        renderDevices();
      } else if (data.type === "new_message") {
        if (data.message.senderId !== myClientId) {
          showReceivedPopup(data.message);
        }
      }
    } catch (err) {
      console.error("Error parsing WS message:", err);
    }
  };

  socket.onclose = () => {
    updateStatus("disconnected", "disconnected");
    reconnectTimeout = setTimeout(connect, 3000);
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
    socket.close();
  };
}

function updateStatus(state, key) {
  statusIndicator.className = `status-indicator status-${state}`;
  statusText.setAttribute("data-i18n", key);
  statusText.textContent = getTranslation(key);
}

function renderDevices() {
  devicesContainer.innerHTML = "";

  const peerClients = connectedClients.filter((c) => c.id !== myClientId);

  if (peerClients.length === 0) {
    emptyState.classList.remove("hidden");
    devicesContainer.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  devicesContainer.classList.remove("hidden");

  peerClients.forEach((client) => {
    const bubble = document.createElement("div");
    bubble.className = "device-bubble";
    bubble.dataset.id = client.id;

    let deviceIconSvg = monitorSvg;
    if (/iphone|ipad/i.test(client.name)) deviceIconSvg = smartphoneSvg;
    else if (/android/i.test(client.name)) deviceIconSvg = smartphoneSvg;

    bubble.innerHTML = `
      <div class="bubble-node">${deviceIconSvg}</div>
      <span class="device-label">${escapeHTML(client.name)}</span>
    `;

    bubble.addEventListener("click", () => {
      openSendModal(client.id, client.name);
    });

    setupDragAndDropOnBubble(bubble, client.id);

    devicesContainer.appendChild(bubble);
  });
}

function setupDragAndDropOnBubble(bubbleElement, targetId) {
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    bubbleElement.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      false,
    );
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    bubbleElement.addEventListener(
      eventName,
      () => {
        bubbleElement.classList.add("drag-over");
      },
      false,
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    bubbleElement.addEventListener(
      eventName,
      () => {
        bubbleElement.classList.remove("drag-over");
      },
      false,
    );
  });

  bubbleElement.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      sendDroppedFiles(files, targetId);
    }
  });
}

/* ---------------------------------------------------------
   File helpers
   --------------------------------------------------------- */

function newFileId() {
  return (
    "f_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  );
}

function getFileExt(name) {
  const match = /\.([a-z0-9]{1,6})$/i.exec(name || "");
  return match ? match[1].toUpperCase() : "";
}

function getFileKind(type, name) {
  const mime = (type || "").toLowerCase();
  const ext = getFileExt(name).toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz"].includes(ext))
    return "archive";
  if (
    ["doc", "docx", "odt", "rtf", "txt", "md", "xls", "xlsx", "csv", "ppt", "pptx", "key", "pages"].includes(ext)
  )
    return "doc";
  return "file";
}

function formatCount(n) {
  return n === 1
    ? getTranslation("fileOne")
    : getTranslation("fileMany").replace("{n}", n);
}

function totalSize(list, getSize) {
  return list.reduce((sum, item) => sum + (getSize(item) || 0), 0);
}

function thumbHtml(kind, url, name) {
  if (kind === "image" && url) {
    return `<img src="${url}" alt="" loading="lazy" decoding="async" />`;
  }
  if (kind === "video" && url) {
    // #t=0.1 makes mobile Safari paint the first frame as a poster
    return `<video src="${url}#t=0.1" preload="metadata" muted playsinline></video><span class="tile-play">${playSvg}</span>`;
  }
  const ext = getFileExt(name);
  return `<div class="tile-icon">${fileSvg}${ext ? `<span class="tile-ext">${escapeHTML(ext)}</span>` : ""}</div>`;
}

/* Upload a single file with byte-level progress (fetch can't report upload progress). */
function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fileId = newFileId();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/upload/${fileId}?name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(fileId);
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(file);
  });
}

function announceFile(file, fileId, targetId, text = "") {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error("Not connected");
  }
  socket.send(
    JSON.stringify({
      type: "share_file",
      targetId,
      text,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      fileId,
    }),
  );
}

/* ---------------------------------------------------------
   Drag & drop straight onto a device bubble
   --------------------------------------------------------- */

async function sendDroppedFiles(fileList, targetId) {
  const files = Array.from(fileList);
  const bubble = document.querySelector(
    `.device-bubble[data-id="${targetId}"]`,
  );
  const label = bubble ? bubble.querySelector(".device-label") : null;
  const node = bubble ? bubble.querySelector(".bubble-node") : null;
  const originalText = label ? label.textContent : "";

  const grandTotal = totalSize(files, (f) => f.size) || 1;
  let doneBytes = 0;
  let failed = 0;

  const setProgress = (pct, text) => {
    if (node) {
      node.classList.add("uploading");
      node.style.setProperty("--progress", pct.toFixed(1));
    }
    if (label) {
      label.textContent = text;
      label.style.color = "var(--primary-color)";
    }
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const prefix =
      files.length > 1
        ? `${getTranslation("sending")} ${i + 1}/${files.length}`
        : getTranslation("sending");
    try {
      const fileId = await uploadFile(file, (loaded) => {
        const pct = ((doneBytes + loaded) / grandTotal) * 100;
        setProgress(pct, `${prefix} · ${Math.floor(pct)} %`);
      });
      announceFile(file, fileId, targetId);
    } catch (err) {
      console.error(err);
      failed++;
    }
    doneBytes += file.size;
  }

  if (node) {
    node.classList.remove("uploading");
    node.style.removeProperty("--progress");
  }
  if (label) {
    label.textContent =
      failed === 0
        ? getTranslation("sendSuccess")
        : `${getTranslation("uploadFailed")} (${failed})`;
    label.style.color =
      failed === 0 ? "var(--success-color)" : "var(--danger-color)";
    setTimeout(() => {
      label.textContent = originalText;
      label.style.color = "";
    }, 2500);
  }
}

/* ---------------------------------------------------------
   Send modal
   --------------------------------------------------------- */

let isSending = false;

function openSendModal(targetId, targetName) {
  activeTargetId = targetId;
  sendModalTitle.textContent = `${getTranslation("shareWith")} ${targetName}`;

  textInput.value = "";
  clearFileSelection();

  sendModal.classList.remove("hidden");
  textInput.focus();
}

function closeSendModal() {
  if (isSending) return;
  sendModal.classList.add("hidden");
}

sendModalClose.addEventListener("click", closeSendModal);

function fileKey(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

function addFilesToSelection(fileList) {
  if (isSending) return;
  const existing = new Set(selectedFiles.map((item) => item.key));
  Array.from(fileList).forEach((file) => {
    const key = fileKey(file);
    if (existing.has(key)) return;
    existing.add(key);
    const kind = getFileKind(file.type, file.name);
    selectedFiles.push({
      key,
      file,
      kind,
      previewUrl:
        kind === "image" || kind === "video" ? URL.createObjectURL(file) : null,
      status: "pending",
      tile: null,
    });
  });
  fileInput.value = "";
  renderSelectedFiles();
  updateSendBtnState();
}

function removeSelectedFile(key) {
  const item = selectedFiles.find((i) => i.key === key);
  if (item && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  selectedFiles = selectedFiles.filter((i) => i.key !== key);
  renderSelectedFiles();
  updateSendBtnState();
}

function clearFileSelection() {
  selectedFiles.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
  selectedFiles = [];
  fileInput.value = "";
  renderSelectedFiles();
  hideUploadProgress();
  updateSendBtnState();
}

function updateSelectedSummary() {
  const size = totalSize(selectedFiles, (i) => i.file.size);
  selectedFilesSummary.textContent = `${formatCount(selectedFiles.length)} · ${formatBytes(size)}`;
}

function renderSelectedFiles() {
  selectedFilesGrid.innerHTML = "";
  selectedFilesBox.classList.toggle("hidden", selectedFiles.length === 0);
  sendCard.classList.toggle("has-files", selectedFiles.length > 0);
  if (selectedFiles.length === 0) return;

  updateSelectedSummary();

  selectedFiles.forEach((item) => {
    const tile = document.createElement("div");
    tile.className = `file-tile is-${item.status}`;
    tile.title = item.file.name;
    tile.innerHTML = `
      <div class="tile-thumb kind-${item.kind}">${thumbHtml(item.kind, item.previewUrl, item.file.name)}</div>
      <div class="tile-meta">
        <span class="tile-name">${escapeHTML(item.file.name)}</span>
        <span class="tile-size">${formatBytes(item.file.size)}</span>
      </div>
      <div class="tile-progress"><div></div></div>
      <button class="tile-remove" type="button" aria-label="Remove">${xSvg}</button>
    `;
    tile.querySelector(".tile-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      removeSelectedFile(item.key);
    });
    item.tile = tile;
    selectedFilesGrid.appendChild(tile);
  });
}

function setTileStatus(item, status, pct) {
  item.status = status;
  if (!item.tile) return;
  item.tile.className = `file-tile is-${status}`;
  if (typeof pct === "number") {
    item.tile.querySelector(".tile-progress > div").style.width = `${pct}%`;
  }
  if (status === "error") {
    item.tile.querySelector(".tile-size").textContent =
      getTranslation("uploadFailedShort");
  }
}

function showUploadProgress(label, pct, isError = false) {
  uploadProgress.classList.remove("hidden");
  uploadProgress.classList.toggle("has-error", isError);
  uploadProgressLabel.textContent = label;
  uploadProgressPercent.textContent = isError ? "" : `${Math.floor(pct)} %`;
  uploadProgressBar.style.width = `${pct}%`;
}

function hideUploadProgress() {
  uploadProgress.classList.add("hidden");
  uploadProgress.classList.remove("has-error");
  uploadProgressBar.style.width = "0%";
}

function setSendingState(sending) {
  isSending = sending;
  sendCard.classList.toggle("sending", sending);
  textInput.disabled = sending;
  clearFilesBtn.disabled = sending;
  updateSendBtnState();
}

async function sendModalPayload() {
  if (isSending) return;
  const text = textInput.value.trim();
  if (!text && selectedFiles.length === 0) return;
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  if (selectedFiles.length === 0) {
    socket.send(
      JSON.stringify({
        type: "share_text",
        targetId: activeTargetId,
        text: text,
      }),
    );
    sendModal.classList.add("hidden");
    return;
  }

  const queue = selectedFiles.filter((item) => item.status !== "done");
  const grandTotal = totalSize(queue, (i) => i.file.size) || 1;
  let doneBytes = 0;
  let failed = 0;
  let textSent = false;

  setSendingState(true);
  showUploadProgress(getTranslation("sending"), 0);

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const label = `${getTranslation("sending")} ${i + 1}/${queue.length}`;
    setTileStatus(item, "uploading", 0);
    if (item.tile) item.tile.scrollIntoView({ block: "nearest" });

    try {
      const fileId = await uploadFile(item.file, (loaded, total) => {
        setTileStatus(item, "uploading", (loaded / total) * 100);
        showUploadProgress(label, ((doneBytes + loaded) / grandTotal) * 100);
      });
      announceFile(item.file, fileId, activeTargetId, textSent ? "" : text);
      textSent = true;
      setTileStatus(item, "done", 100);
    } catch (err) {
      console.error(err);
      failed++;
      setTileStatus(item, "error");
    }
    doneBytes += item.file.size;
  }

  setSendingState(false);

  if (failed === 0) {
    showUploadProgress(getTranslation("sendSuccess"), 100);
    setTimeout(() => {
      sendModal.classList.add("hidden");
      clearFileSelection();
    }, 600);
    return;
  }

  // keep only what failed so a second click retries just those
  selectedFiles
    .filter((item) => item.status === "done")
    .forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  selectedFiles = selectedFiles.filter((item) => item.status !== "done");
  if (textSent) textInput.value = "";
  renderSelectedFiles();
  selectedFiles.forEach((item) => setTileStatus(item, "error"));
  showUploadProgress(
    `${getTranslation("uploadFailed")} (${failed}) — ${getTranslation("retryHint")}`,
    100,
    true,
  );
  updateSendBtnState();
}

function updateSendBtnState() {
  const isConnected = socket && socket.readyState === WebSocket.OPEN;
  const hasContent =
    textInput.value.trim().length > 0 || selectedFiles.length > 0;
  sendBtn.disabled = isSending || !isConnected || !hasContent;
}

textInput.addEventListener("input", updateSendBtnState);
sendBtn.addEventListener("click", sendModalPayload);
clearFilesBtn.addEventListener("click", clearFileSelection);

textInput.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    sendModalPayload();
  }
});

modalDropZone.addEventListener("click", () => {
  if (!isSending) fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    addFilesToSelection(files);
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  modalDropZone.addEventListener(
    eventName,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      modalDropZone.classList.add("drag-over");
    },
    false,
  );
});

["dragleave", "drop"].forEach((eventName) => {
  modalDropZone.addEventListener(
    eventName,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      modalDropZone.classList.remove("drag-over");
    },
    false,
  );
});

modalDropZone.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    addFilesToSelection(files);
  }
});

// Dropping anywhere on the open send card adds files too
sendCard.addEventListener("dragover", (e) => e.preventDefault());
sendCard.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    addFilesToSelection(e.dataTransfer.files);
  }
});

// Never let a stray drop navigate the window away to the file
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

/* ---------------------------------------------------------
   Received modal: texts + file gallery
   --------------------------------------------------------- */

let receivedFiles = [];
let receivedTextCount = 0;
let receivedSenders = new Set();

function resetReceived() {
  receivedTexts.innerHTML = "";
  receivedGrid.innerHTML = "";
  receivedFiles = [];
  receivedTextCount = 0;
  receivedSenders = new Set();
}

function updateReceivedHeader() {
  receivedModalTitle.textContent = getTranslation("newShare");
  const parts = [];
  if (receivedSenders.size > 0) {
    parts.push(`${getTranslation("from")} ${Array.from(receivedSenders).join(", ")}`);
  }
  if (receivedFiles.length > 0) {
    parts.push(formatCount(receivedFiles.length));
    parts.push(formatBytes(totalSize(receivedFiles, (m) => m.fileSize)));
  }
  receivedModalSubtitle.textContent = parts.join(" · ");
  downloadAllBtn.classList.toggle("hidden", receivedFiles.length < 2);
}

function downloadUrl(message) {
  return `/download/${message.fileId}`;
}

function triggerDownload(message) {
  const a = document.createElement("a");
  a.href = downloadUrl(message);
  a.download = message.fileName || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function createTextCard(text, withCopy = true) {
  const card = document.createElement("div");
  card.className = "text-card";
  card.innerHTML = `
    <div class="received-text-body">${escapeHTML(text)}</div>
    ${withCopy ? `<div class="received-actions"><button class="action-btn-small copy-btn">${getTranslation("copyText")}</button></div>` : ""}
  `;
  const copyBtn = card.querySelector(".copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => copyTextToClipboard(text, copyBtn));
  }
  return card;
}

function createReceivedTile(message) {
  const url = downloadUrl(message);
  const kind = getFileKind(message.fileType, message.fileName);
  const isMedia = kind === "image" || kind === "video";

  const tile = document.createElement("div");
  tile.className = "file-tile";
  tile.innerHTML = `
    <button class="tile-thumb kind-${kind}" type="button" title="${escapeHTML(message.fileName)}">
      ${thumbHtml(kind, url, message.fileName)}
    </button>
    <div class="tile-meta">
      <span class="tile-name" title="${escapeHTML(message.fileName)}">${escapeHTML(message.fileName)}</span>
      <span class="tile-size">${formatBytes(message.fileSize)}</span>
    </div>
    <a class="tile-action" href="${url}" download="${escapeHTML(message.fileName)}" title="${getTranslation("download")}">${downloadSvg}</a>
  `;

  tile.querySelector(".tile-thumb").addEventListener("click", () => {
    if (isMedia) openLightbox(message);
    else triggerDownload(message);
  });

  return tile;
}

function showReceivedPopup(message) {
  if (receivedModal.classList.contains("hidden")) {
    resetReceived();
    receivedModal.classList.remove("hidden");
    receivedModalBody.scrollTop = 0;
  }

  if (message.sender) receivedSenders.add(message.sender);

  if (message.type === "file") {
    if (message.text) {
      receivedTexts.appendChild(createTextCard(message.text));
      receivedTextCount++;
    }
    receivedFiles.push(message);
    receivedGrid.appendChild(createReceivedTile(message));
  } else {
    receivedTexts.appendChild(createTextCard(message.text));
    receivedTextCount++;
  }

  updateReceivedHeader();
}

downloadAllBtn.addEventListener("click", async () => {
  const files = receivedFiles.slice();
  for (const message of files) {
    triggerDownload(message);
    // browsers drop rapid-fire downloads; space them out a little
    await new Promise((r) => setTimeout(r, 350));
  }
});

receivedModalClose.addEventListener("click", () => {
  receivedModal.classList.add("hidden");
});
receivedCloseBtn.addEventListener("click", () => {
  receivedModal.classList.add("hidden");
});

/* ---------------------------------------------------------
   Lightbox (images & videos)
   --------------------------------------------------------- */

let lightboxItems = [];
let lightboxIndex = 0;

function openLightbox(message) {
  lightboxItems = receivedFiles.filter((m) => {
    const kind = getFileKind(m.fileType, m.fileName);
    return kind === "image" || kind === "video";
  });
  lightboxIndex = Math.max(0, lightboxItems.indexOf(message));
  renderLightbox();
  lightbox.classList.remove("hidden");
}

function renderLightbox() {
  const message = lightboxItems[lightboxIndex];
  if (!message) return;
  const url = downloadUrl(message);
  const kind = getFileKind(message.fileType, message.fileName);

  lightboxStage.innerHTML =
    kind === "video"
      ? `<video src="${url}" controls autoplay playsinline></video>`
      : `<img src="${url}" alt="${escapeHTML(message.fileName)}" />`;

  const counter =
    lightboxItems.length > 1
      ? `${lightboxIndex + 1}/${lightboxItems.length} · `
      : "";
  lightboxCaption.textContent = `${counter}${message.fileName} · ${formatBytes(message.fileSize)}`;
  lightboxDownload.href = url;
  lightboxDownload.setAttribute("download", message.fileName || "file");

  const multi = lightboxItems.length > 1;
  lightboxPrev.classList.toggle("hidden", !multi);
  lightboxNext.classList.toggle("hidden", !multi);
}

function stepLightbox(delta) {
  if (lightboxItems.length < 2) return;
  lightboxIndex =
    (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
  renderLightbox();
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  lightboxStage.innerHTML = ""; // stops any playing video
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => stepLightbox(-1));
lightboxNext.addEventListener("click", () => stepLightbox(1));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox || e.target === lightboxStage) closeLightbox();
});

// basic swipe on touch screens
let touchStartX = null;
lightbox.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
  },
  { passive: true },
);
lightbox.addEventListener("touchend", (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  touchStartX = null;
  if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("hidden")) {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") stepLightbox(1);
    else if (e.key === "ArrowLeft") stepLightbox(-1);
    return;
  }
  if (e.key === "Escape") {
    if (!receivedModal.classList.contains("hidden")) {
      receivedModal.classList.add("hidden");
    } else if (!sendModal.classList.contains("hidden")) {
      closeSendModal();
    }
  }
});

/* ---------------------------------------------------------
   Toast (desktop app: "saved to Downloads")
   --------------------------------------------------------- */

let toastTimer = null;

function showToast(text, actionLabel, action) {
  toastText.textContent = text;
  if (actionLabel && action) {
    toastAction.textContent = actionLabel;
    toastAction.onclick = action;
    toastAction.classList.remove("hidden");
  } else {
    toastAction.classList.add("hidden");
    toastAction.onclick = null;
  }
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 5000);
}

if (window.easyShareDesktop) {
  let savedBatch = 0;
  let savedBatchTimer = null;
  window.easyShareDesktop.onDownloadDone((info) => {
    if (info.state !== "completed") {
      showToast(`${getTranslation("uploadFailedShort")} : ${info.fileName}`);
      return;
    }
    savedBatch++;
    clearTimeout(savedBatchTimer);
    savedBatchTimer = setTimeout(() => (savedBatch = 0), 6000);
    const what = savedBatch === 1 ? info.fileName : formatCount(savedBatch);
    showToast(
      `${what} — ${getTranslation("savedToDownloads")}`,
      getTranslation("showInFolder"),
      () => window.easyShareDesktop.showInFolder(info.path),
    );
  });
}

burgerMenuBtn.addEventListener("click", () => {
  mobileQrModal.classList.remove("hidden");
});

const openLargeQr = () => {
  mobileQrModal.classList.remove("hidden");
};

desktopQrcodeImg.addEventListener("click", openLargeQr);
desktopQrcodePlaceholder.addEventListener("click", openLargeQr);

mobileQrClose.addEventListener("click", () => {
  mobileQrModal.classList.add("hidden");
});

[sendModal, receivedModal, mobileQrModal, aboutModal, troubleModal].forEach(
  (modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        if (modal === sendModal) closeSendModal();
        else modal.classList.add("hidden");
      }
    });
  },
);

aboutTriggerBtn.addEventListener("click", () => {
  aboutModal.classList.remove("hidden");
});

aboutModalClose.addEventListener("click", () => {
  aboutModal.classList.add("hidden");
});

aboutCloseBtn.addEventListener("click", () => {
  aboutModal.classList.add("hidden");
});

const openTroubleModal = () => {
  troubleModal.classList.remove("hidden");
};

desktopTroubleBtn.addEventListener("click", openTroubleModal);
mobileTroubleBtn.addEventListener("click", openTroubleModal);

troubleModalClose.addEventListener("click", () => {
  troubleModal.classList.add("hidden");
});

troubleCloseBtn.addEventListener("click", () => {
  troubleModal.classList.add("hidden");
});

desktopCopyBtn.addEventListener("click", () => {
  copyTextToClipboard(serverUrl, desktopCopyBtn);
});

mobileCopyBtn.addEventListener("click", () => {
  copyTextToClipboard(serverUrl, mobileCopyBtn);
});

function copyTextToClipboard(text, buttonElement) {
  if (!navigator.clipboard) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      setCopyFeedback(buttonElement);
    } catch (err) {
      console.error(err);
    }
    document.body.removeChild(textarea);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      setCopyFeedback(buttonElement);
    })
    .catch((err) => {
      console.error(err);
    });
}

function setCopyFeedback(btn) {
  if (btn.classList.contains("copy-link-btn")) {
    const span = btn.querySelector("span");
    const originalHtml = btn.innerHTML;
    if (span) span.textContent = getTranslation("linkCopied");
    btn.classList.add("copied");
    setTimeout(() => {
      btn.classList.remove("copied");
      if (span) span.textContent = getTranslation("copyLink");
    }, 1800);
  } else if (btn.classList.contains("icon-btn-small")) {
    btn.classList.add("copied");
    btn.innerHTML = checkSvg;
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.innerHTML = copySvg;
    }, 1500);
  } else {
    const originalText = btn.textContent;
    btn.textContent = getTranslation("copiedFeedback");
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove("copied");
    }, 1800);
  }
}

function formatBytes(bytes, decimals = 1) {
  const sizes = getTranslation("sizeUnits").split(",");
  if (!bytes || bytes <= 0) return "0 " + sizes[0];
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  );
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function escapeHTML(str) {
  return String(str ?? "").replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag,
  );
}

langDropdownTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  langDropdown.classList.toggle("open");
  langDropdownTrigger.setAttribute(
    "aria-expanded",
    langDropdown.classList.contains("open"),
  );
});

langOptions.forEach((opt) => {
  opt.addEventListener("click", () => {
    applyLanguage(opt.dataset.lang);
    langDropdown.classList.remove("open");
    langDropdownTrigger.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", () => {
  langDropdown.classList.remove("open");
  langDropdownTrigger.setAttribute("aria-expanded", "false");
});

const detectedLang = detectLanguage();
applyLanguage(detectedLang);

connect();
