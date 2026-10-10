import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Persistent server-side store file
const DATA_DIR = path.join(__dirname, 'server-data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const TRAFFIC_FILE = path.join(DATA_DIR, 'global_traffic_summary.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'global_feedback_inventory.json');

const DEFAULT_PROJECTS = {
  bart: {
    id: 'bart',
    name: 'BART Schedule Planner',
    category: 'Transit & Infrastructure',
    path: '/myprojects/bart',
    viewCount: 0,
    totalDwellSeconds: 0,
    lastVisitedAt: null,
    mobileViews: 0,
    desktopViews: 0,
  },
  roboinvestor: {
    id: 'roboinvestor',
    name: 'RoboInvestor (Robinhood Agent)',
    category: 'Autonomous Agent & Finance',
    path: '/myprojects/roboinvestor',
    viewCount: 0,
    totalDwellSeconds: 0,
    lastVisitedAt: null,
    mobileViews: 0,
    desktopViews: 0,
  },
  'toddler-activities': {
    id: 'toddler-activities',
    name: 'Kids & Youth Activity Hub',
    category: 'Family & Education',
    path: '/myprojects/toddler-activities',
    viewCount: 0,
    totalDwellSeconds: 0,
    lastVisitedAt: null,
    mobileViews: 0,
    desktopViews: 0,
  },
  'cosmic-game': {
    id: 'cosmic-game',
    name: 'Cosmic Defender (Arcade Game)',
    category: 'Gaming & Canvas Motion',
    path: '/mygames',
    viewCount: 0,
    totalDwellSeconds: 0,
    lastVisitedAt: null,
    mobileViews: 0,
    desktopViews: 0,
  },
};

function readTraffic(): any {
  try {
    if (fs.existsSync(TRAFFIC_FILE)) {
      const content = fs.readFileSync(TRAFFIC_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      parsed.projects = { ...DEFAULT_PROJECTS, ...(parsed.projects || {}) };
      return parsed;
    }
  } catch (err) {
    console.error('Error reading traffic file', err);
  }
  return {
    totalPageViews: 0,
    totalSessions: 0,
    firstTrackedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    projects: { ...DEFAULT_PROJECTS },
    pageViewsByRoute: {},
  };
}

function writeTraffic(data: any): void {
  try {
    fs.writeFileSync(TRAFFIC_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing traffic file', err);
  }
}

function readFeedback(): any[] {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      const content = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading feedback file', err);
  }
  return [];
}

function writeFeedback(data: any[]): void {
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing feedback file', err);
  }
}

// ----------------- API ENDPOINTS -----------------

// Global Traffic: Get aggregate statistics across ALL users
app.get('/api/traffic', (req, res) => {
  res.json(readTraffic());
});

// Global Traffic: Record view or dwell time from any user
app.post('/api/traffic/record', (req, res) => {
  const { route, projectId, isMobile, isNewSession, dwellSeconds } = req.body;
  const data = readTraffic();
  const now = new Date().toISOString();

  if (route) {
    data.totalPageViews += 1;
    data.lastActiveAt = now;
    data.pageViewsByRoute[route] = (data.pageViewsByRoute[route] || 0) + 1;
  }

  if (isNewSession) {
    data.totalSessions += 1;
  }

  if (projectId && data.projects[projectId]) {
    const p = data.projects[projectId];
    if (route) {
      p.viewCount += 1;
      p.lastVisitedAt = now;
      if (isMobile) {
        p.mobileViews += 1;
      } else {
        p.desktopViews += 1;
      }
    }
    if (typeof dwellSeconds === 'number' && dwellSeconds > 0) {
      p.totalDwellSeconds += Math.round(dwellSeconds);
    }
  }

  writeTraffic(data);
  res.json({ success: true, data });
});

// Global Traffic: Reset endpoint
app.post('/api/traffic/reset', (req, res) => {
  const resetData = {
    totalPageViews: 0,
    totalSessions: 0,
    firstTrackedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    projects: { ...DEFAULT_PROJECTS },
    pageViewsByRoute: {},
  };
  writeTraffic(resetData);
  res.json({ success: true, data: resetData });
});

// Global Feedback: Get all user recommendations
app.get('/api/feedback', (req, res) => {
  res.json(readFeedback());
});

// Global Feedback: Submit new recommendation
app.post('/api/feedback', (req, res) => {
  const newItem = req.body;
  if (!newItem || !newItem.title) {
    return res.status(400).json({ error: 'Missing title' });
  }
  const items = readFeedback();
  const fullItem = {
    ...newItem,
    id: newItem.id || `fb-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    submittedAt: newItem.submittedAt || new Date().toISOString(),
    upvotes: newItem.upvotes || 1,
    status: newItem.status || 'submitted',
  };
  items.unshift(fullItem);
  writeFeedback(items);
  res.json({ success: true, item: fullItem, items });
});

// Global Feedback: Upvote
app.post('/api/feedback/:id/upvote', (req, res) => {
  const { id } = req.params;
  const items = readFeedback();
  let updatedCount = 0;
  const updated = items.map((item) => {
    if (item.id === id) {
      updatedCount = (item.upvotes || 0) + 1;
      return { ...item, upvotes: updatedCount };
    }
    return item;
  });
  writeFeedback(updated);
  res.json({ success: true, id, newCount: updatedCount });
});

// Global Feedback: Update status / notes by site owner / staff
app.post('/api/feedback/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, ownerNotes, deployedCommit } = req.body;
  const items = readFeedback();
  let updatedItem = null;
  const updated = items.map((item) => {
    if (item.id === id) {
      updatedItem = {
        ...item,
        status,
        deployedAt: status === 'deployed' ? item.deployedAt || new Date().toISOString() : item.deployedAt,
        agentAnalysis: {
          ...item.agentAnalysis,
          reviewedByOwner: true,
          ownerNotes: ownerNotes !== undefined ? ownerNotes : item.agentAnalysis?.ownerNotes,
          deployedCommit: deployedCommit !== undefined ? deployedCommit : item.agentAnalysis?.deployedCommit,
        },
      };
      return updatedItem;
    }
    return item;
  });
  writeFeedback(updated);
  res.json({ success: true, item: updatedItem });
});

// ----------------- VITE MIDDLEWARE SETUP -----------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
