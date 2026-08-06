const reconsiderMessages = [
  "要不要再给我一次机会？我会用行动证明我的认真。",
  "再想一小会儿嘛，我真的很想成为那个陪着你的人。",
  "你的这个答案，我想申请一次重新考虑的机会。",
  "不如先点一次“同意”试试看？以后的甜，我慢慢补给你。",
  "我还是想再认真问一遍：晓雨，可以给我一个机会吗？",
];

let messageIndex = 0;

const bindProposalDialog = () => {
  const noButton = document.querySelector("#no-button");
  const dialog = document.querySelector("#dialog");
  const dialogMessage = document.querySelector("#dialog-message");
  const dialogClose = document.querySelector("#dialog-close");

  if (!noButton || !dialog || !dialogMessage || !dialogClose) return;

  noButton.addEventListener("click", () => {
    dialogMessage.textContent = reconsiderMessages[messageIndex];
    messageIndex = (messageIndex + 1) % reconsiderMessages.length;
    dialog.hidden = false;
    dialogClose.focus();
  });

  dialogClose.addEventListener("click", () => {
    dialog.hidden = true;
    noButton.focus();
  });
};

bindProposalDialog();

const backgroundMusic = document.querySelector("#bg-music");
const musicToggle = document.querySelector("#music-toggle");

if (backgroundMusic && musicToggle) {
  const enabledKey = "xiaoyu-music-enabled";
  const timeKey = "xiaoyu-music-time";
  let musicEnabled = sessionStorage.getItem(enabledKey) !== "false";
  let lastSavedSecond = -1;

  backgroundMusic.volume = 0.45;

  const updateMusicButton = () => {
    const isPlaying = !backgroundMusic.paused;
    const label = isPlaying ? "暂停背景音乐" : "播放背景音乐";

    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-label", label);
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.title = label;
  };

  const restoreMusicTime = () => {
    const savedTime = Number(sessionStorage.getItem(timeKey));

    if (Number.isFinite(savedTime) && savedTime > 0) {
      backgroundMusic.currentTime = savedTime;
    }
  };

  const playMusic = () => {
    if (!musicEnabled) return;

    const playAttempt = backgroundMusic.play();
    if (playAttempt) playAttempt.catch(updateMusicButton);
  };

  const playThroughWechat = () => {
    if (window.WeixinJSBridge) {
      window.WeixinJSBridge.invoke("getNetworkType", {}, playMusic);
    } else {
      playMusic();
    }
  };

  if (backgroundMusic.readyState >= 1) {
    restoreMusicTime();
  } else {
    backgroundMusic.addEventListener("loadedmetadata", restoreMusicTime, { once: true });
  }

  backgroundMusic.addEventListener("play", updateMusicButton);
  backgroundMusic.addEventListener("pause", updateMusicButton);
  backgroundMusic.addEventListener("timeupdate", () => {
    const currentSecond = Math.floor(backgroundMusic.currentTime);

    if (currentSecond !== lastSavedSecond) {
      lastSavedSecond = currentSecond;
      sessionStorage.setItem(timeKey, String(backgroundMusic.currentTime));
    }
  });

  musicToggle.addEventListener("click", () => {
    if (backgroundMusic.paused) {
      musicEnabled = true;
      sessionStorage.setItem(enabledKey, "true");
      playMusic();
    } else {
      musicEnabled = false;
      sessionStorage.setItem(enabledKey, "false");
      backgroundMusic.pause();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest("#music-toggle")) playMusic();
  }, { once: true });
  document.addEventListener("WeixinJSBridgeReady", playThroughWechat, { once: true });
  window.addEventListener("pagehide", () => {
    sessionStorage.setItem(timeKey, String(backgroundMusic.currentTime));
  });

  if (window.WeixinJSBridge) playThroughWechat();

  const internalPages = new Set(["index.html", "proposal.html", "success.html"]);
  let navigationInProgress = false;

  const isPersistentElement = (element) => (
    element.id === "music-toggle"
    || element.id === "bg-music"
    || (element.tagName === "SCRIPT" && element.getAttribute("src")?.startsWith("app.js"))
  );

  const navigateWithoutStoppingMusic = async (targetUrl, addHistoryEntry) => {
    if (navigationInProgress) return;
    navigationInProgress = true;

    try {
      const response = await fetch(targetUrl.href, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Page request failed: ${response.status}`);

      const nextDocument = new DOMParser().parseFromString(await response.text(), "text/html");
      const nextElements = Array.from(nextDocument.body.children)
        .filter((element) => !isPersistentElement(element))
        .map((element) => document.importNode(element, true));

      Array.from(document.body.children)
        .filter((element) => !isPersistentElement(element))
        .forEach((element) => element.remove());

      document.body.className = nextDocument.body.className;
      document.title = nextDocument.title;
      nextElements.forEach((element) => document.body.insertBefore(element, musicToggle));

      if (addHistoryEntry) history.pushState(null, "", targetUrl.href);

      window.scrollTo(0, 0);
      bindProposalDialog();
      updateMusicButton();
    } catch {
      window.location.assign(targetUrl.href);
    } finally {
      navigationInProgress = false;
    }
  };

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (!link) return;

    const targetUrl = new URL(link.href, window.location.href);
    const pageName = targetUrl.pathname.split("/").pop() || "index.html";

    if (targetUrl.origin !== window.location.origin || !internalPages.has(pageName)) return;

    event.preventDefault();
    navigateWithoutStoppingMusic(targetUrl, true);
  });

  window.addEventListener("popstate", () => {
    navigateWithoutStoppingMusic(new URL(window.location.href), false);
  });

  updateMusicButton();
  playMusic();
}
