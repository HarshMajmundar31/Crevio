import { createHash } from 'node:crypto';
import path from 'node:path';

function normalizeDate(raw) {
  if (!raw) {
    return null;
  }

  const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const slash = raw.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (!slash) {
    return null;
  }

  const day = slash[1].padStart(2, '0');
  const month = slash[2].padStart(2, '0');
  const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
  return `${year}-${month}-${day}`;
}

function detectPlatform(text) {
  const match = text.match(/\b(instagram|youtube|tiktok|twitter|linkedin|facebook)\b/i);
  return match ? match[1][0].toUpperCase() + match[1].slice(1).toLowerCase() : 'Instagram';
}

function extractDeliverables(text, defaultPlatform, fallbackDeadline) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const deliverableLines = lines.filter((line) => /\b(deliverable|reel|video|post|story|content)\b/i.test(line));
  const source = deliverableLines.length > 0 ? deliverableLines : lines.slice(0, 3);

  return source.slice(0, 5).map((line, index) => {
    const deadlineMatch = line.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
    const parsedDeadline = normalizeDate(deadlineMatch?.[0] || '') || fallbackDeadline;

    return {
      index: index + 1,
      description: line.replace(/^[-*\d.\s]+/, '').slice(0, 240),
      platform: detectPlatform(line) || defaultPlatform,
      deadline: parsedDeadline,
    };
  });
}

function extractRules(text) {
  const rules = [
    {
      ruleType: 'deliverable',
      description: 'All contract deliverables must be submitted and verified',
    },
    {
      ruleType: 'deadline',
      description: 'All deliverables must be submitted before deadline',
    },
  ];

  if (/\b(ftc|disclosure|sponsored|ad\b)/i.test(text)) {
    rules.push({
      ruleType: 'compliance',
      description: 'FTC disclosure must be present in all required content',
    });
  }

  if (/\b(prohibited|forbidden|restricted content)\b/i.test(text)) {
    rules.push({
      ruleType: 'compliance',
      description: 'No prohibited content is allowed',
    });
  }

  return rules;
}

function extractPayment(text) {
  const match = text.match(/\b(payment|amount|budget)\s*[:=-]?\s*\$?\s*(\d+(?:\.\d{1,2})?)\b/i);
  return match ? Number(match[2]) : null;
}

function extractPrimaryDeadline(text) {
  const match = text.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
  return normalizeDate(match?.[0] || '') || null;
}

export async function readUploadedDocument(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isPdf = file.mimetype === 'application/pdf' || ext === '.pdf';

  if (isPdf) {
    if (typeof globalThis.DOMMatrix === 'undefined') {
      globalThis.DOMMatrix = class DOMMatrix {};
    }
    if (typeof globalThis.ImageData === 'undefined') {
      globalThis.ImageData = class ImageData {};
    }
    if (typeof globalThis.Path2D === 'undefined') {
      globalThis.Path2D = class Path2D {};
    }

    try {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const parsed = await pdfParse(file.buffer);
      return parsed.text || '';
    } catch (err) {
      console.error('[PDF Extraction Warning]', err);
      // Fallback: extract ASCII string content if pdf-parse fails
      const raw = file.buffer.toString('utf8');
      const readableText = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      return readableText.trim() || raw;
    }
  }

  return file.buffer.toString('utf8');
}

export function extractContractTermsFromText(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const platform = detectPlatform(cleaned);
  const deadline = extractPrimaryDeadline(cleaned) || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const paymentAmount = extractPayment(cleaned);

  const deliverables = extractDeliverables(text, platform, deadline);
  const rules = extractRules(text);

  return {
    summary: cleaned.slice(0, 2000),
    platform,
    deadline,
    paymentAmount,
    totalValue: paymentAmount || 0,
    confidenceScore: 85,
    deliverables,
    rules,
  };
}

export async function parseContractWithAI(text) {
  const fallbackTerms = extractContractTermsFromText(text);

  if (!process.env.OPENAI_API_KEY) {
    return fallbackTerms;
  }

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert legal contract analyzer for influencer and creator campaigns.
Extract key contract details from the provided contract text and respond strictly in JSON matching this schema:
{
  "summary": "Executive summary of the contract (2-3 sentences)",
  "totalValue": number (total payment/fee including potential bonus, e.g. 60000),
  "paymentAmount": number (fixed fee amount, e.g. 45000),
  "paymentTerms": "string (e.g. 50% advance on signing + 50% on final delivery)",
  "platform": "Instagram | YouTube | TikTok | Cross-Platform",
  "deadline": "YYYY-MM-DD",
  "confidenceScore": number (80-99),
  "deliverables": [
    {
      "description": "string (quantity, format, description)",
      "platform": "string",
      "deadline": "YYYY-MM-DD"
    }
  ],
  "rules": [
    {
      "ruleType": "compliance | deliverable | deadline | exclusivity | rights",
      "description": "string"
    }
  ],
  "performanceTargets": "string (view count, engagement rate, or bonus criteria if mentioned)",
  "rights": "string usage rights and exclusivity info"
}`,
        },
        {
          role: 'user',
          content: text.slice(0, 10000),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return {
      summary: parsed.summary || fallbackTerms.summary,
      totalValue: parsed.totalValue || parsed.paymentAmount || fallbackTerms.paymentAmount || 0,
      paymentAmount: parsed.paymentAmount || parsed.totalValue || fallbackTerms.paymentAmount || 0,
      paymentTerms: parsed.paymentTerms || 'Standard milestone distribution',
      platform: parsed.platform || fallbackTerms.platform,
      deadline: parsed.deadline || fallbackTerms.deadline,
      confidenceScore: parsed.confidenceScore || 95,
      deliverables: Array.isArray(parsed.deliverables) && parsed.deliverables.length > 0 ? parsed.deliverables : fallbackTerms.deliverables,
      rules: Array.isArray(parsed.rules) && parsed.rules.length > 0 ? parsed.rules : fallbackTerms.rules,
      performanceTargets: parsed.performanceTargets || '',
      rights: parsed.rights || 'Standard digital media usage rights included',
    };
  } catch (err) {
    console.error('[OpenAI Contract Parsing Warning]', err?.message || err);
    return fallbackTerms;
  }
}

export function createContentHash(text) {
  return createHash('sha256').update(text).digest('hex');
}

export function createImmutableTermsHash(contractSnapshot) {
  const stable = JSON.stringify(contractSnapshot, Object.keys(contractSnapshot).sort());
  return createHash('sha256').update(stable).digest('hex');
}

