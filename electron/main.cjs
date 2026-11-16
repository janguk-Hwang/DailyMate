const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// 단일 인스턴스 락 (중복 실행 방지)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;

// 설정 저장 경로
const configPath = path.join(app.getPath('userData'), 'dailymate-widget-config.json');

const defaultConfig = {
  isWidget: true,
  isLocked: false,
  alwaysOnBottom: false,
  autoStart: false,
  bounds: {
    width: 440,
    height: 720,
    x: undefined,
    y: undefined
  }
};

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return { ...defaultConfig, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
  return { ...defaultConfig };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

let appConfig = loadConfig();

function getTrayIcon() {
  // SVG 또는 생성된 PNG 아이콘 사용
  const svgPath = path.join(__dirname, '../public/favicon.svg');
  if (fs.existsSync(svgPath)) {
    const icon = nativeImage.createFromPath(svgPath);
    return icon.resize({ width: 16, height: 16 });
  }
  // 기본 빈 아이콘
  return nativeImage.createEmpty();
}

function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'DailyMate 캘린더 위젯',
      enabled: false
    },
    { type: 'separator' },
    {
      label: mainWindow && mainWindow.isVisible() ? '위젯 숨기기' : '위젯 보이기',
      click: () => {
        if (!mainWindow) return;
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
        updateTrayMenu();
      }
    },
    {
      label: '위젯 모드 (미니멀)',
      type: 'checkbox',
      checked: appConfig.isWidget,
      click: (item) => {
        setWidgetMode(item.checked);
      }
    },
    {
      label: '위치 고정 (잠금)',
      type: 'checkbox',
      checked: appConfig.isLocked,
      click: (item) => {
        setLocked(item.checked);
      }
    },
    {
      label: '바탕화면 고정 (항상 맨 아래)',
      type: 'checkbox',
      checked: appConfig.alwaysOnBottom,
      click: (item) => {
        setAlwaysOnBottom(item.checked);
      }
    },
    {
      label: '윈도우 시작 시 자동 실행',
      type: 'checkbox',
      checked: appConfig.autoStart,
      click: (item) => {
        setAutoStart(item.checked);
      }
    },
    { type: 'separator' },
    {
      label: '새로고침',
      click: () => {
        if (mainWindow) mainWindow.reload();
      }
    },
    {
      label: 'DailyMate 종료',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  const icon = getTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('DailyMate - 바탕화면 캘린더 위젯');

  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    updateTrayMenu();
  });

  tray.on('double-click', () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
    updateTrayMenu();
  });

  updateTrayMenu();
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  let x = appConfig.bounds.x;
  let y = appConfig.bounds.y;

  // 기본 위치: 우측 상단/중앙 바탕화면
  if (x === undefined || y === undefined) {
    x = Math.max(0, screenWidth - (appConfig.isWidget ? 460 : 1000));
    y = 50;
  }

  const initialWidth = appConfig.isWidget ? 440 : 1024;
  const initialHeight = appConfig.isWidget ? 720 : 768;

  mainWindow = new BrowserWindow({
    width: appConfig.bounds.width || initialWidth,
    height: appConfig.bounds.height || initialHeight,
    x: x,
    y: y,
    frame: false,                 // 윈도우 프레임/타이틀바 제거
    transparent: true,           // 투명/반투명 배경 허용
    backgroundColor: '#00000000', // 완전 투명 기본값
    hasShadow: false,            // 윈도우 그림자 제거 (위젯 스타일)
    resizable: true,
    movable: !appConfig.isLocked,
    skipTaskbar: appConfig.isWidget, // 위젯 모드 시 작업표시줄에서 숨김
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 상태 적용
  if (appConfig.alwaysOnBottom) {
    mainWindow.setAlwaysOnTop(false);
  }

  // 개발 환경 or 빌드 프로덕션 로드
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index.html:', err);
    });
  }

  // 로딩 실패 디버깅 핸들러
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('did-fail-load:', code, desc);
  });

  // 준비되면 즉시 표시 및 포커스
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 창 닫기 시 실제 종료 대신 트레이로 숨김
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      updateTrayMenu();
      return false;
    }
    // 창 크기 및 위치 저장
    const bounds = mainWindow.getBounds();
    appConfig.bounds = bounds;
    saveConfig(appConfig);
  });

  mainWindow.on('resize', () => {
    if (mainWindow) {
      appConfig.bounds = mainWindow.getBounds();
      saveConfig(appConfig);
    }
  });

  mainWindow.on('move', () => {
    if (mainWindow) {
      appConfig.bounds = mainWindow.getBounds();
      saveConfig(appConfig);
    }
  });

  mainWindow.on('show', () => updateTrayMenu());
  mainWindow.on('hide', () => updateTrayMenu());
}

function setWidgetMode(enabled) {
  appConfig.isWidget = enabled;
  saveConfig(appConfig);

  if (mainWindow) {
    mainWindow.setSkipTaskbar(enabled);
    if (enabled) {
      mainWindow.setSize(440, 720);
    } else {
      mainWindow.setSize(1024, 768);
    }
    mainWindow.webContents.send('widget-mode-changed', enabled);
  }
  updateTrayMenu();
}

function setLocked(locked) {
  appConfig.isLocked = locked;
  saveConfig(appConfig);
  if (mainWindow) {
    mainWindow.setMovable(!locked);
    mainWindow.webContents.send('locked-changed', locked);
  }
  updateTrayMenu();
}

function setAlwaysOnBottom(bottom) {
  appConfig.alwaysOnBottom = bottom;
  saveConfig(appConfig);
  if (mainWindow) {
    if (bottom) {
      mainWindow.setAlwaysOnTop(false);
    }
    mainWindow.webContents.send('always-on-bottom-changed', bottom);
  }
  updateTrayMenu();
}

function setAutoStart(enabled) {
  appConfig.autoStart = enabled;
  saveConfig(appConfig);
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true
    });
  } catch (e) {
    console.error('Failed to set login item settings:', e);
  }
  if (mainWindow) {
    mainWindow.webContents.send('auto-start-changed', enabled);
  }
  updateTrayMenu();
}

// IPC 통신 등록
ipcMain.handle('get-app-state', () => {
  const loginSettings = app.getLoginItemSettings();
  return {
    isElectron: true,
    isWidget: appConfig.isWidget,
    isLocked: appConfig.isLocked,
    alwaysOnBottom: appConfig.alwaysOnBottom,
    autoStart: loginSettings.openAtLogin ?? appConfig.autoStart
  };
});

ipcMain.on('set-widget-mode', (event, enabled) => {
  setWidgetMode(enabled);
});

ipcMain.on('set-locked', (event, locked) => {
  setLocked(locked);
});

ipcMain.on('set-always-on-bottom', (event, bottom) => {
  setAlwaysOnBottom(bottom);
});

ipcMain.on('set-auto-start', (event, enabled) => {
  setAutoStart(enabled);
});

ipcMain.on('minimize-to-tray', () => {
  if (mainWindow) {
    mainWindow.hide();
    updateTrayMenu();
  }
});

ipcMain.on('close-app', () => {
  app.isQuitting = true;
  app.quit();
});

// App lifecycle
app.whenReady().then(() => {
  createTray();
  createWindow();

  // 자동 실행 설정 동기화
  const currentLogin = app.getLoginItemSettings().openAtLogin;
  if (appConfig.autoStart !== currentLogin) {
    app.setLoginItemSettings({
      openAtLogin: appConfig.autoStart,
      openAsHidden: true
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

