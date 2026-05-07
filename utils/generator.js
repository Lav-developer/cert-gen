const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CERT_WIDTH = 1120;
const CERT_HEIGHT = 790;

const COLORS = {
  navy: '#0f2742',
  gold: '#c8a14d',
  goldSoft: '#ead7a5',
  sand: '#f7f1e4',
  paper: '#fffdf8',
  ink: '#20324a',
  muted: '#5f7187',
  line: '#d7c38d'
};

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text, maxCharsPerLine) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxCharsPerLine) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

function fitFontSize(text, maxWidth, baseSize, minSize) {
  const safeText = String(text).trim();
  const length = safeText.length || 1;
  const estimate = Math.floor((maxWidth / Math.max(length * 0.62, 1)) * baseSize * 0.18);
  return Math.max(minSize, Math.min(baseSize, estimate));
}

function buildPattern() {
  return `
    <pattern id="patternGrid" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#e8dcc0" stroke-width="1" opacity="0.35" />
      <circle cx="60" cy="60" r="2.4" fill="#ead7a5" opacity="0.55" />
      <path d="M60 18 L67 53 L102 60 L67 67 L60 102 L53 67 L18 60 L53 53 Z" fill="none" stroke="#ead7a5" stroke-width="1.2" opacity="0.4" />
    </pattern>`;
}

function buildCertificateSvg(data) {
  const fullName = escapeXml(data.full_name);
  const role = escapeXml(data.role);
  const eventName = escapeXml(data.event_name);
  const eventDate = escapeXml(data.event_date);
  const certId = escapeXml(data.certificate_id);
  const eventLines = wrapText(eventName, 30);
  const eventFontSize = eventLines.length > 2 ? 20 : 22;
  const eventStartY = eventLines.length > 1 ? 520 : 532;
  const nameFontSize = fitFontSize(fullName, 680, 58, 38);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${CERT_WIDTH}" height="${CERT_HEIGHT}" viewBox="0 0 ${CERT_WIDTH} ${CERT_HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f7f0df" />
        <stop offset="45%" stop-color="#fffdf8" />
        <stop offset="100%" stop-color="#e7dcc6" />
      </linearGradient>
      <linearGradient id="panel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fffefb" />
        <stop offset="100%" stop-color="#f6f0e0" />
      </linearGradient>
      <linearGradient id="frame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8d6a1f" />
        <stop offset="50%" stop-color="#d7b563" />
        <stop offset="100%" stop-color="#8d6a1f" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#fff6d4" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#fff6d4" stop-opacity="0" />
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#1c2940" flood-opacity="0.18" />
      </filter>
      <filter id="sealShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#8d6a1f" flood-opacity="0.24" />
      </filter>
      ${buildPattern()}
    </defs>

    <rect width="100%" height="100%" fill="url(#bg)" />
    <rect width="100%" height="100%" fill="url(#patternGrid)" opacity="0.45" />

    <circle cx="195" cy="165" r="190" fill="url(#glow)" opacity="0.8" />
    <circle cx="925" cy="620" r="210" fill="url(#glow)" opacity="0.55" />

    <rect x="36" y="36" width="1048" height="718" rx="18" fill="url(#frame)" opacity="0.92" filter="url(#shadow)" />
    <rect x="55" y="55" width="1010" height="680" rx="12" fill="url(#panel)" />
    <rect x="78" y="78" width="964" height="634" rx="10" fill="none" stroke="#d8c48f" stroke-width="2" opacity="0.9" />
    <rect x="92" y="92" width="936" height="606" rx="8" fill="none" stroke="#fff7df" stroke-width="2" opacity="0.85" />

    <path d="M 145 150 C 205 104, 260 106, 315 150" fill="none" stroke="${COLORS.gold}" stroke-width="3" stroke-linecap="round" />
    <path d="M 805 150 C 860 106, 915 104, 975 150" fill="none" stroke="${COLORS.gold}" stroke-width="3" stroke-linecap="round" />
    <path d="M 145 640 C 205 684, 260 684, 315 640" fill="none" stroke="${COLORS.gold}" stroke-width="3" stroke-linecap="round" opacity="0.95" />
    <path d="M 805 640 C 860 684, 915 684, 975 640" fill="none" stroke="${COLORS.gold}" stroke-width="3" stroke-linecap="round" opacity="0.95" />

    <circle cx="160" cy="160" r="28" fill="none" stroke="#d9bf7d" stroke-width="2" />
    <circle cx="160" cy="160" r="14" fill="none" stroke="#d9bf7d" stroke-width="2" />
    <circle cx="960" cy="160" r="28" fill="none" stroke="#d9bf7d" stroke-width="2" />
    <circle cx="960" cy="160" r="14" fill="none" stroke="#d9bf7d" stroke-width="2" />

    <text x="560" y="158" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-weight="700" letter-spacing="7" fill="${COLORS.muted}">CERTIFICATE OF ACHIEVEMENT</text>
    <text x="560" y="214" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700" letter-spacing="4" fill="${COLORS.navy}">Certificate</text>
    <text x="560" y="251" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" letter-spacing="8" fill="${COLORS.gold}">PRESENTED WITH DISTINCTION</text>

    <text x="560" y="312" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" fill="${COLORS.ink}">This certifies that</text>
    <line x1="285" y1="334" x2="835" y2="334" stroke="url(#frame)" stroke-width="2.5" stroke-linecap="round" />
    <line x1="360" y1="344" x2="760" y2="344" stroke="#e9dcc0" stroke-width="1.5" stroke-linecap="round" />

    <text x="560" y="418" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${nameFontSize}" font-style="italic" font-weight="700" fill="${COLORS.navy}">${fullName}</text>
    <line x1="285" y1="434" x2="835" y2="434" stroke="#d9bf7d" stroke-width="1.5" stroke-linecap="round" opacity="0.9" />

    <text x="560" y="486" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" fill="${COLORS.ink}">
      has successfully completed the role of <tspan font-weight="700" fill="${COLORS.gold}">${role}</tspan>
    </text>
    ${eventLines.map((line, index) => `<text x="560" y="${eventStartY + (index * 30)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${eventFontSize}" font-weight="700" letter-spacing="0.3" fill="${COLORS.navy}">${escapeXml(line)}</text>`).join('\n')}

    <text x="560" y="610" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" letter-spacing="1.2" fill="${COLORS.muted}">Date of Achievement</text>
    <text x="560" y="642" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-weight="700" fill="${COLORS.ink}">${eventDate}</text>

    <g transform="translate(130 626)">
      <line x1="0" y1="0" x2="250" y2="0" stroke="#8e9aab" stroke-width="1.5" />
      <text x="125" y="26" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="${COLORS.muted}">Authorized Signature</text>
      <text x="125" y="51" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="20" font-weight="700" fill="${COLORS.ink}">Program Director</text>
    </g>

    <g transform="translate(740 626)">
      <line x1="0" y1="0" x2="250" y2="0" stroke="#8e9aab" stroke-width="1.5" />
      <text x="125" y="26" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="${COLORS.muted}">Verification Code</text>
      <text x="125" y="51" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="20" font-weight="700" fill="${COLORS.ink}">${certId}</text>
    </g>

    <g transform="translate(915 100)" filter="url(#sealShadow)">
      <circle cx="0" cy="0" r="54" fill="#fff8e5" stroke="${COLORS.gold}" stroke-width="5" />
      <circle cx="0" cy="0" r="42" fill="none" stroke="#d9bf7d" stroke-width="1.5" stroke-dasharray="2 5" />
      <text x="0" y="-10" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" letter-spacing="1.5" fill="${COLORS.gold}">OFFICIAL</text>
      <text x="0" y="10" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-weight="700" fill="${COLORS.navy}">SEAL</text>
      <text x="0" y="30" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing="1" fill="${COLORS.muted}">VERIFIED</text>
    </g>
  </svg>`;
}

async function writePdfFromImage(imageBuffer, pdfPath) {
  const pdf = new PDFDocument({ size: [CERT_WIDTH, CERT_HEIGHT], margin: 0 });
  const stream = fs.createWriteStream(pdfPath);

  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
    pdf.on('error', reject);

    pdf.pipe(stream);
    pdf.image(imageBuffer, 0, 0, { width: CERT_WIDTH, height: CERT_HEIGHT });
    pdf.end();
  });
}

async function generateCertificates(data) {
  const svg = buildCertificateSvg(data);

  // Generate PDF (A4 landscape)
  const pdfPath = path.join(
    __dirname, '..', 'public', 'generated',
    `${data.certificate_id}.pdf`
  );
  const imageBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  await writePdfFromImage(imageBuffer, pdfPath);

  // Generate PNG image
  const imgPath = path.join(
    __dirname, '..', 'public', 'generated',
    `${data.certificate_id}.png`
  );
  await sharp(Buffer.from(svg)).png().toFile(imgPath);

  // Return relative paths for the database
  return {
    pdfPath: `generated/${data.certificate_id}.pdf`,
    imagePath: `generated/${data.certificate_id}.png`
  };
}

module.exports = { generateCertificates };