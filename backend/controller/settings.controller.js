import Settings from "../models/Settings.js";

// Helper to fetch and sync daily reset
export const getOrInitializeSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }

  // Check if reset is needed (different day)
  const todayStr = new Date().toDateString();
  const lastResetStr = new Date(settings.lastResetDate).toDateString();
  if (todayStr !== lastResetStr) {
    settings.emailsSentToday = 0;
    settings.lastResetDate = new Date();
    await settings.save();
  }

  return settings;
};

// GET /api/settings - Fetch current settings
export const getSettings = async (req, res) => {
  try {
    const settings = await getOrInitializeSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("❌ getSettings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/settings - Update limits and delays
export const updateSettings = async (req, res) => {
  try {
    const { maxEmailsPerDay, minDelaySeconds, maxDelaySeconds } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (maxEmailsPerDay !== undefined) settings.maxEmailsPerDay = Number(maxEmailsPerDay);
    if (minDelaySeconds !== undefined) settings.minDelaySeconds = Number(minDelaySeconds);
    if (maxDelaySeconds !== undefined) settings.maxDelaySeconds = Number(maxDelaySeconds);

    // Validate min delay <= max delay
    if (settings.minDelaySeconds > settings.maxDelaySeconds) {
      return res.status(400).json({ success: false, error: "Minimum delay cannot be greater than maximum delay." });
    }

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("❌ updateSettings error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
