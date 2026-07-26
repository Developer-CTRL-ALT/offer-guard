const CATEGORY_DEFINITIONS = [
  {
    id: "fees_and_payments",
    title: "Upfront fees or unusual payments",
    cap: 30,
    whyItMatters:
      "Legitimate employers do not normally require candidates to pay to receive a job.",
    rules: [
      {
        id: "pay-to-proceed",
        points: 20,
        reason: "A payment appears to be required before the process can continue.",
        pattern:
          /\b(?:pay|send|deposit|transfer)\b[\s\S]{0,45}\b(?:fee|money|amount|deposit|charge|rupees?|inr|rs\.?|₹)\b/gi
      },
      {
        id: "named-fee",
        points: 18,
        reason: "The message names a fee commonly used in recruitment scams.",
        pattern:
          /\b(?:registration|application|processing|training|security|verification|onboarding|refundable)\s+(?:fee|deposit|charge|amount)\b/gi
      },
      {
        id: "unusual-payment-rail",
        points: 12,
        reason: "The requested payment method is difficult to reverse or trace.",
        pattern: /\b(?:upi|gift\s*cards?|cryptocurrency|bitcoin|usdt|wallet\s+transfer)\b/gi
      }
    ]
  },
  {
    id: "sensitive_information",
    title: "Requests for sensitive information",
    cap: 28,
    whyItMatters:
      "Passwords, OTPs, card security codes, and banking credentials should never be shared with a recruiter.",
    rules: [
      {
        id: "account-secret",
        points: 24,
        reason: "The message asks for an account or payment secret.",
        pattern:
          /\b(?:share|send|provide|reply\s+with|enter|confirm)\b[\s\S]{0,45}\b(?:otp|one[-\s]?time\s+password|password|pin|cvv|card\s+number|netbanking|login)\b/gi
      },
      {
        id: "identity-document",
        points: 12,
        reason: "Sensitive identity or banking documents are requested unusually early.",
        pattern:
          /\b(?:share|send|upload|provide)\b[\s\S]{0,45}\b(?:aadhaar|aadhar|pan\s*card|passport|bank\s+(?:statement|details|account)|cancelled\s+cheque)\b/gi
      }
    ]
  },
  {
    id: "unrealistic_promises",
    title: "Unrealistic promises",
    cap: 20,
    whyItMatters:
      "Guaranteed selection and extraordinary income claims are used to bypass normal scrutiny.",
    rules: [
      {
        id: "guaranteed-selection",
        points: 14,
        reason: "The offer promises selection or employment without a normal assessment.",
        pattern:
          /\b(?:100%\s+)?guaranteed\s+(?:job|placement|selection|income)|\byou(?:'re|\s+are)?\s+(?:already\s+)?selected\b/gi
      },
      {
        id: "no-interview",
        points: 12,
        reason: "The message offers a role without an interview or assessment.",
        pattern:
          /\b(?:no|without\s+an?)\s+(?:interview|assessment)|\bdirect\s+(?:joining|selection|appointment)\b/gi
      },
      {
        id: "easy-income",
        points: 10,
        reason: "The income claim is framed as unusually easy or certain.",
        pattern:
          /\b(?:earn|make)\s+(?:up\s+to\s+)?(?:₹|rs\.?|inr)?\s*\d[\d,]*(?:\s*(?:per|\/)\s*(?:day|week))?[\s\S]{0,30}\b(?:easy|guaranteed|from\s+home|daily)\b/gi
      }
    ]
  },
  {
    id: "urgency_and_pressure",
    title: "Urgency and pressure",
    cap: 16,
    whyItMatters:
      "Artificial deadlines reduce the time available to verify an employer and make a considered decision.",
    rules: [
      {
        id: "act-now",
        points: 10,
        reason: "The message pressures the candidate to act immediately.",
        pattern:
          /\b(?:act\s+now|respond\s+(?:now|immediately)|urgent(?:ly)?|immediate\s+action|required\s+today|within\s+\d+\s+hours?)\b/gi
      },
      {
        id: "scarcity",
        points: 8,
        reason: "Scarcity language is used to rush the decision.",
        pattern:
          /\b(?:limited\s+(?:slots?|seats?|vacancies)|last\s+chance|offer\s+expires?|today\s+only|first\s+\d+\s+(?:applicants|candidates))\b/gi
      },
      {
        id: "secrecy",
        points: 8,
        reason: "The sender asks the candidate not to seek outside verification.",
        pattern:
          /\b(?:keep\s+(?:this|it)\s+(?:secret|confidential)|do\s+not\s+(?:tell|contact|verify)|don't\s+(?:tell|contact|verify))\b/gi
      }
    ]
  },
  {
    id: "identity_and_channel",
    title: "Unverifiable identity or channel",
    cap: 16,
    whyItMatters:
      "Scammers often move candidates to private messaging channels or use free email accounts to impersonate employers.",
    rules: [
      {
        id: "private-chat-only",
        points: 9,
        reason: "The process is moved to a private chat channel without an official verification path.",
        pattern:
          /\b(?:contact|message|text|interview|reply)\b[\s\S]{0,30}\b(?:whats\s*app|telegram)\b|\b(?:whats\s*app|telegram)\s+only\b/gi
      },
      {
        id: "free-mail-recruiter",
        points: 10,
        reason: "A recruiter is using a free consumer email address rather than an employer domain.",
        pattern:
          /\b[A-Z0-9._%+-]+@(?:gmail|yahoo|outlook|hotmail|protonmail)\.(?:com|in)\b/gi
      },
      {
        id: "no-verifiable-contact",
        points: 7,
        reason: "The sender discourages contact through the company's official channels.",
        pattern:
          /\b(?:do\s+not|don't)\s+(?:call|email|contact)\s+(?:the\s+)?(?:company|office|hr)\b/gi
      }
    ]
  },
  {
    id: "hiring_process",
    title: "Broken or vague hiring process",
    cap: 16,
    whyItMatters:
      "A real hiring process should identify the role, employer, responsibilities, and assessment steps.",
    rules: [
      {
        id: "instant-joining",
        points: 10,
        reason: "Joining is requested before a documented hiring process.",
        pattern:
          /\b(?:join|start)\s+(?:immediately|today|tomorrow)|\bimmediate\s+joining\b/gi
      },
      {
        id: "mass-hiring-pitch",
        points: 8,
        reason: "The message uses a generic mass-hiring pitch with little role context.",
        pattern:
          /\b(?:anyone\s+can\s+apply|no\s+experience\s+(?:needed|required)|students?\s+and\s+housewives|simple\s+(?:typing|data\s+entry)\s+work)\b/gi
      },
      {
        id: "offer-before-process",
        points: 10,
        reason: "An offer or appointment is presented before standard screening.",
        pattern:
          /\b(?:offer|appointment)\s+letter\b[\s\S]{0,50}\b(?:without|no)\s+(?:interview|screening|assessment)\b/gi
      }
    ]
  },
  {
    id: "links_and_files",
    title: "Suspicious links or files",
    cap: 22,
    whyItMatters:
      "Shortened links and executable files can hide credential theft or malware.",
    rules: [
      {
        id: "short-link",
        points: 12,
        reason: "A shortened link hides the final destination.",
        pattern:
          /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|rb\.gy|shorturl\.at)\/[^\s<>"']+/gi
      },
      {
        id: "executable-file",
        points: 20,
        reason: "The message asks the candidate to open or install a potentially executable file.",
        pattern: /\b[^\s<>"']+\.(?:apk|exe|msi|scr|bat|cmd)\b/gi
      },
      {
        id: "form-or-download",
        points: 8,
        reason: "An external form or download is used without clear employer verification.",
        pattern:
          /https?:\/\/(?:forms\.gle|docs\.google\.com\/forms|drive\.google\.com|dropbox\.com)\/[^\s<>"']*/gi
      }
    ]
  },
  {
    id: "contract_and_documents",
    title: "Unsafe contract or document demands",
    cap: 20,
    whyItMatters:
      "Original documents, blank financial instruments, and punitive bonds create serious legal and financial risk.",
    rules: [
      {
        id: "original-documents",
        points: 14,
        reason: "The sender asks to retain original identity or education documents.",
        pattern:
          /\b(?:submit|deposit|hand\s+over|surrender)\b[\s\S]{0,35}\boriginal\s+(?:documents?|certificates?|passport|marksheets?)\b/gi
      },
      {
        id: "blank-instrument",
        points: 18,
        reason: "A blank cheque or signed blank document is requested.",
        pattern:
          /\b(?:blank\s+(?:cheque|check|paper|stamp\s+paper)|signed\s+blank\s+(?:form|paper|document))\b/gi
      },
      {
        id: "punitive-bond",
        points: 12,
        reason: "The message threatens a large penalty or bond before the role is verified.",
        pattern:
          /\b(?:employment|service|training)\s+bond\b|\bpenalty\s+of\s+(?:₹|rs\.?|inr)?\s*\d[\d,]*/gi
      }
    ]
  }
];

const SAFE_SIGNAL_RULES = [
  {
    message: "The message explicitly says candidates will not be charged a fee.",
    pattern:
      /\b(?:no|zero)\s+(?:application|registration|recruitment|processing)?\s*fees?\b|\b(?:never|will\s+not|won't)\s+(?:ask|require)\b[\s\S]{0,30}\b(?:payment|fee)\b/gi
  },
  {
    message: "A structured interview or assessment process is described.",
    pattern:
      /\b(?:interview\s+(?:rounds?|process)|technical\s+(?:round|interview|assessment)|screening\s+call|coding\s+assessment)\b/gi
  },
  {
    message: "The candidate is directed to an employer careers or jobs page.",
    pattern:
      /https?:\/\/(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}\/(?:careers?|jobs?)(?:\/[^\s<>"']*)?/gi
  },
  {
    message: "The message encourages independent verification through official channels.",
    pattern:
      /\b(?:verify|confirm|check)\b[\s\S]{0,35}\b(?:official\s+(?:website|careers?\s+page|email)|company\s+website|hr\s+team)\b/gi
  },
  {
    message: "Written role or employment documentation is mentioned.",
    pattern:
      /\b(?:formal\s+offer\s+letter|written\s+job\s+description|employment\s+contract|salary\s+breakdown)\b/gi
  }
];

export const RISK_CATEGORY_IDS = Object.freeze(
  CATEGORY_DEFINITIONS.map((category) => category.id)
);

function evidenceFor(text, pattern, ruleId, reason) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  const evidence = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const start = match.index;
    const end = start + matchedText.length;
    evidence.push({ text: matchedText, start, end, ruleId, reason });
    if (matchedText.length === 0) regex.lastIndex += 1;
    if (evidence.length >= 4) break;
  }

  return evidence;
}

function isExplicitlyNegated(text, evidence, categoryId) {
  if (categoryId !== "fees_and_payments" && categoryId !== "sensitive_information") {
    return false;
  }

  const contextStart = Math.max(0, evidence.start - 70);
  const contextEnd = Math.min(text.length, evidence.end + 35);
  const context = text.slice(contextStart, contextEnd);
  const lead = text.slice(contextStart, evidence.start);
  const currentClause = lead
    .split(/[.!?;]|\b(?:but|however|although|yet|instead)\b/i)
    .at(-1);
  const directlyNegated =
    /\b(?:never|will\s+not|won't|do\s+not|don't)\b(?:\s+(?:ask|require|request|tell|instruct|expect))?(?:\s+(?:you|candidates?))?(?:\s+to)?\s*$/i.test(
      currentClause
    );

  if (directlyNegated) return true;

  if (categoryId === "fees_and_payments") {
    return (
      /\b(?:no|zero)\s+(?:application|registration|recruitment|processing|training)?\s*(?:fees?|charges?|deposits?)\b|\b(?:fees?|charges?|deposits?)\s+(?:is|are|will\s+be)\s+(?:not|never)\s+(?:required|charged|requested)\b/i.test(
        context
      ) ||
      /\b(?:never|will\s+not|won't|do\s+not|don't)\b[\s\S]{0,35}\b(?:ask|require|request)\b[\s\S]{0,30}\b(?:payment|fees?|charges?|deposits?|upi|gift\s*cards?|crypto(?:currency)?)\b/i.test(
        context
      )
    );
  }

  return false;
}

export function levelForScore(score) {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "caution";
  return "low";
}

export function headlineForLevel(level) {
  const headlines = {
    low: "Few common scam signals found",
    caution: "Pause and verify before proceeding",
    high: "Multiple serious offer risks detected",
    critical: "Do not proceed until independently verified"
  };
  return headlines[level];
}

function severityForPoints(points) {
  if (points >= 20) return "high";
  if (points >= 12) return "medium";
  return "low";
}

function buildActions(level, categoryIds) {
  const categories = new Set(categoryIds);
  const actions = [];

  if (level === "critical" || level === "high") {
    actions.push(
      "Stop responding for now and verify the role using contact details you find independently on the employer's official website."
    );
  } else if (level === "caution") {
    actions.push(
      "Pause before accepting and verify the recruiter, role, and hiring process through the employer's official careers page."
    );
  } else {
    actions.push(
      "Continue normal due diligence; a low score is not proof that an offer is genuine."
    );
  }

  if (categories.has("fees_and_payments")) {
    actions.push("Do not pay any fee, deposit, training charge, or refundable amount.");
  }
  if (categories.has("sensitive_information")) {
    actions.push(
      "Do not share OTPs, passwords, PINs, CVVs, banking logins, or unwatermarked identity documents."
    );
  }
  if (categories.has("links_and_files")) {
    actions.push(
      "Do not open the link or file; locate the vacancy independently on the official careers site."
    );
  }
  if (categories.has("identity_and_channel")) {
    actions.push(
      "Ask the recruiter to continue from a verifiable company email address and confirm their identity with the company."
    );
  }
  if (categories.has("contract_and_documents")) {
    actions.push(
      "Keep original documents and blank signed instruments; have any bond or penalty clause reviewed before signing."
    );
  }
  if (
    categories.has("unrealistic_promises") ||
    categories.has("hiring_process")
  ) {
    actions.push(
      "Request the job description, interviewer names, selection stages, reporting manager, and written compensation details."
    );
  }
  if (level === "critical") {
    actions.push(
      "Save screenshots and report the sender to the job portal or messaging platform if impersonation or fraud is confirmed."
    );
  }

  return [...new Set(actions)].slice(0, 6);
}

export function analyzeOffer(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new TypeError("Offer text must be a non-empty string.");
  }

  const findings = [];
  let uncappedScore = 0;

  for (const category of CATEGORY_DEFINITIONS) {
    const matchedRules = [];
    const evidence = [];

    for (const rule of category.rules) {
      const ruleEvidence = evidenceFor(
        text,
        rule.pattern,
        rule.id,
        rule.reason
      ).filter((item) => !isExplicitlyNegated(text, item, category.id));
      if (ruleEvidence.length > 0) {
        matchedRules.push(rule);
        evidence.push(...ruleEvidence);
      }
    }

    if (matchedRules.length === 0) continue;
    const points = Math.min(
      category.cap,
      matchedRules.reduce((sum, rule) => sum + rule.points, 0)
    );
    uncappedScore += points;
    findings.push({
      id: category.id,
      title: category.title,
      severity: severityForPoints(points),
      points,
      whyItMatters: category.whyItMatters,
      evidence: evidence
        .sort((a, b) => a.start - b.start || a.end - b.end)
        .filter(
          (item, index, all) =>
            all.findIndex(
              (candidate) =>
                candidate.start === item.start && candidate.end === item.end
            ) === index
        )
        .slice(0, 8)
    });
  }

  const score = Math.min(100, uncappedScore);
  const level = levelForScore(score);
  const safeSignals = SAFE_SIGNAL_RULES.filter(
    (rule) => evidenceFor(text, rule.pattern, "safe-signal", rule.message).length > 0
  ).map((rule) => rule.message);
  const categoryIds = findings.map((finding) => finding.id);
  const evidenceMatches = findings.reduce(
    (sum, finding) => sum + finding.evidence.length,
    0
  );
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return {
    score,
    level,
    headline: headlineForLevel(level),
    summary:
      findings.length === 0
        ? "No common high-risk patterns were detected. Verify the employer independently before sharing information or accepting."
        : `${findings.length} of 8 risk categories were triggered by ${evidenceMatches} exact text signal${evidenceMatches === 1 ? "" : "s"}.`,
    findings,
    safeSignals,
    actions: buildActions(level, categoryIds),
    stats: {
      characters: text.length,
      words,
      categoriesChecked: CATEGORY_DEFINITIONS.length,
      categoriesTriggered: findings.length,
      evidenceMatches,
      safeSignals: safeSignals.length,
      uncappedScore
    }
  };
}

export function getRiskCategories() {
  return CATEGORY_DEFINITIONS.map(({ id, title, cap, whyItMatters }) => ({
    id,
    title,
    cap,
    whyItMatters
  }));
}
