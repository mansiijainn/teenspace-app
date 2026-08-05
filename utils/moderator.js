const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';

// These keywords ALWAYS get caught regardless of API
const CRITICAL_KEYWORDS = [
  'suicide', 'commit suicide', 'kill myself', 'want to die',
  'end my life', 'self harm', 'self-harm', 'cut myself',
  'cutting myself', 'hurt myself', 'overdose', 'hang myself',
  'khatam kar lun', 'mar jaunga', 'mar jaun', 'khud ko hurt',
  'jeena nahi', 'jina nahi chahta', 'zindagi khatam',
];

const BULLYING_KEYWORDS = [
  'kys', 'kill yourself', 'you should die', 'nobody likes you',
  'go die', 'worthless', 'you deserve to die', 'i will kill you', 'i will kill', 'gonna kill',
  'want to kill', 'i want to murder', 'gonna murder',
  'i hate you', 'i will hurt you', 'beat you up',
  'gonna hurt you', 'watch your back', 'murder' , 'kill' 
];

function keywordCheck(content) {
  const lower = content.toLowerCase();

  for (const keyword of CRITICAL_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        safe: false,
        severity: 'high',
        reason: 'self harm or suicide related content',
        category: 'self_harm',
      };
    }
  }

  for (const keyword of BULLYING_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        safe: false,
        severity: 'high',
        reason: 'targeted harm or bullying',
        category: 'bullying',
      };
    }
  }

  return null;
}

const MODERATION_PROMPT = `You are a strict but fair content moderator for a teen community app (ages 13-19).

Analyze the given post and respond ONLY with a JSON object in this exact format:
{
  "safe": true or false,
  "severity": "none", "low", "medium", or "high",
  "reason": "brief reason if not safe, empty string if safe",
  "category": "none", "bullying", "hate_speech", "self_harm", "sexual", "spam", "profanity"
}

Rules:
- "high" severity: self-harm, suicide, sexual content, serious threats
- "medium" severity: bullying, hate speech, slurs
- "low" severity: mild profanity, borderline content
- "none": safe content
- Teens venting frustration is NORMAL and should be ALLOWED
- Be lenient with emotional expression, strict with targeted harm`;

export async function moderatePost(content) {
  // Always run keyword check first — works without API
  const keywordResult = keywordCheck(content);
  if (keywordResult) return keywordResult;

  // Then try AI moderation
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${MODERATION_PROMPT}\n\nPost to moderate: "${content}"` }]
          }],
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return { safe: true, severity: 'none', reason: '', category: 'none' };

    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.log('Moderation API error — keyword check already passed');
    return { safe: true, severity: 'none', reason: '', category: 'none' };
  }
}

export function getViolationMessage(result) {
  switch (result.category) {
    case 'self_harm':
      return "we care about you. if you're struggling, please reach out to iCall at 9152987821. they're really good listeners.";
    case 'bullying':
      return "let's keep this space kind. targeted attacks aren't allowed here.";
    case 'hate_speech':
      return "hate speech isn't tolerated here. everyone deserves respect.";
    case 'sexual':
      return "sexual content isn't allowed here.";
    case 'spam':
      return "looks like spam. keep it real!";
    case 'profanity':
      return "watch the language a little. keep it chill.";
    default:
      return "this post goes against our community guidelines.";
  }
}
