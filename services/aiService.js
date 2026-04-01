// backend/services/aiService.js — Claude AI features
// Uses Anthropic API for smart issue categorization, citizen chatbot, and report summaries

const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../config/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are CitiConnect AI, the smart assistant for Addis Ababa's city portal.
You help citizens report city issues, find community help, and understand city services.
You are helpful, friendly, and concise. You speak in a warm, community-focused tone.
You know Addis Ababa well — its sub-cities (Bole, Kirkos, Yeka, Lideta, Addis Ketema, Gulele, Nifas Silk-Lafto, Kolfe Keranio, Akaky Kaliti, Lemi Kura, Bole Lemi),
landmarks, and common infrastructure challenges.
Always respond in the same language the user writes in (English or Amharic).
Keep responses under 150 words unless asked for more detail.`;

/**
 * Auto-categorize a reported issue from its title and description.
 * Returns { category, severity, suggestedArea, summary }
 */
const categorizeIssue = async (title, description, location) => {
  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 256,
      system: `You are a city issue categorizer for Addis Ababa. 
Respond ONLY with a JSON object, no markdown, no explanation.
Categories: water, waste, road, power, infrastructure
Severity: low, medium, high, critical`,
      messages: [{
        role: 'user',
        content: `Categorize this city issue:
Title: ${title}
Description: ${description}
Location: ${location || 'Unknown'}

Respond with JSON only: { "category": "...", "severity": "...", "suggestedArea": "...", "summary": "one sentence summary" }`,
      }],
    });

    const text = msg.content[0].text.trim();
    return JSON.parse(text);
  } catch (err) {
    logger.error('AI categorize failed:', err.message);
    return { category: 'infrastructure', severity: 'medium', suggestedArea: location || 'Unknown', summary: title };
  }
};

/**
 * Generate a plain-language summary of analytics data.
 * Returns a 2-3 sentence insight string.
 */
const summarizeAnalytics = async (stats) => {
  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 200,
      system: 'You are a city data analyst. Write 2-3 clear, actionable sentences summarizing city issue data for officials and citizens. Be specific and direct.',
      messages: [{
        role: 'user',
        content: `Summarize this CitiConnect data for Addis Ababa:
- Total issues: ${stats.totalIssues}
- Open: ${stats.openIssues} (${Math.round(stats.openIssues / stats.totalIssues * 100)}%)
- Resolved: ${stats.resolvedIssues}
- Top category: ${stats.topCategory}
- Worst area: ${stats.worstArea}
- Active citizens: ${stats.activeUsers}
- Avg response time: ${stats.avgResponseDays} days`,
      }],
    });
    return msg.content[0].text.trim();
  } catch (err) {
    logger.error('AI analytics summary failed:', err.message);
    return 'Analytics summary unavailable.';
  }
};

/**
 * Citizen chatbot — answers questions about city services, issues, and community.
 * Supports multi-turn conversation.
 * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
 * @param {string} userMessage - Latest message from citizen
 * @returns {string} - AI response
 */
const chatbotReply = async (history, userMessage) => {
  try {
    const messages = [
      ...history.slice(-10), // Keep last 10 turns for context
      { role: 'user', content: userMessage },
    ];

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    return msg.content[0].text.trim();
  } catch (err) {
    logger.error('Chatbot failed:', err.message);
    return 'Sorry, I am unable to respond right now. Please try again shortly.';
  }
};

/**
 * Generate a daily city report summary from issue data.
 * Used for the email digest.
 */
const generateDailyReport = async (issues, communityStats) => {
  try {
    const topIssues = issues
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3)
      .map(i => `- ${i.title} (${i.votes} upvotes, ${i.area})`).join('\n');

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 400,
      system: 'You write engaging, informative city newsletter summaries for Addis Ababa citizens. Be warm, clear, and action-oriented.',
      messages: [{
        role: 'user',
        content: `Write a brief daily CitiConnect report for today.
New reports today: ${communityStats.newReports}
Total open issues: ${communityStats.openIssues}
Resolved today: ${communityStats.resolved}
Top 3 most-upvoted open issues:
${topIssues}
Active community helpers: ${communityStats.activeHelpers}

Write a 3-paragraph summary suitable for an email newsletter.`,
      }],
    });

    return msg.content[0].text.trim();
  } catch (err) {
    logger.error('Daily report generation failed:', err.message);
    return null;
  }
};

/**
 * Translate text to Amharic using Claude.
 * Used for auto-translating newly reported issues.
 */
const translateToAmharic = async (text) => {
  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 256,
      system: 'You are a professional English-to-Amharic translator. Translate accurately and naturally. Respond ONLY with the Amharic translation, nothing else.',
      messages: [{ role: 'user', content: `Translate to Amharic: "${text}"` }],
    });
    return msg.content[0].text.trim();
  } catch (err) {
    logger.error('Translation failed:', err.message);
    return text;
  }
};

module.exports = { categorizeIssue, summarizeAnalytics, chatbotReply, generateDailyReport, translateToAmharic };
