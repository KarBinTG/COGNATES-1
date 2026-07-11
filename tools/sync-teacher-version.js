const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const studentIndex = path.join(root, "index.html");
const studentTopics = path.join(root, "topics");
const teacherRoot = path.join(root, "COGNATES-6 v.Teacher");
const teacherIndex = path.join(teacherRoot, "index.html");
const teacherTopics = path.join(teacherRoot, "topics");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, text) {
  fs.writeFileSync(file, text, "utf8");
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

function addScriptBeforeBody(html, src) {
  if (html.includes(src)) return html;
  return html.replace("</body>", `<script src="${src}"></script>\n</body>`);
}

function addHeadOnce(html, marker, snippet) {
  if (html.includes(marker)) return html;
  return html.replace(/<head>\s*/i, `<head>\n${snippet}\n`);
}

function syncHomepageContent(html, faviconHref, gateSrc, markTeacher) {
  html = html.replace(
    "20 Weeks, 40 Sessions, Complete Presentation Deck Collection",
    "20 Weeks, 32 Session Decks + Exams"
  );
  html = html.replace("Sessions 25-32 Available", "Sessions 1-32 Available");
  html = html.replace(
    "topics/1-Prelim/week3_session6_generative_AI_responsible_use.html\" class=\"session-link\" target=\"_blank\"><span class=\"session-num\">07",
    "topics/1-Prelim/week4_session7_IoT_basics.html\" class=\"session-link\" target=\"_blank\"><span class=\"session-num\">07"
  );
  html = html.replace(
    '<a href="topics/3-Semi-final/week13_session22_5G_applications_digital_divide.html" class="session-link" target="_blank"><span class="session-num">22</span><div class="session-info"><span class="session-title">Green Computing & Sustainable IT</span><span class="session-topic">Network Slicing, PH Connectivity, Inclusion</span></div><span class="session-week">Week 13</span></a>',
    '<a href="topics/3-Semi-final/week13_session22_5G_applications_digital_divide.html" class="session-link" target="_blank"><span class="session-num">22</span><div class="session-info"><span class="session-title">5G Applications & Digital Divide</span><span class="session-topic">Network Slicing, PH Connectivity, Inclusion</span></div><span class="session-week">Week 13</span></a>'
  );
  html = html.replace(
    '<a href="topics/3-Semi-final/week14_session23_green_computing.html" class="session-link" target="_blank"><span class="session-num">22</span><div class="session-info"><span class="session-title">5G Applications & Digital Divide</span><span class="session-topic">E-waste, PUE, Energy, Carbon Footprint</span></div><span class="session-week">Week 14</span></a>',
    '<a href="topics/3-Semi-final/week14_session23_green_computing.html" class="session-link" target="_blank"><span class="session-num">23</span><div class="session-info"><span class="session-title">Green Computing & Sustainable IT</span><span class="session-topic">E-waste, PUE, Energy, Carbon Footprint</span></div><span class="session-week">Week 14</span></a>'
  );

  html = html.replace(/target="_blank"(?!\s+rel=)/g, 'target="_blank" rel="noopener noreferrer"');

  html = html.replace(/<link rel="icon"[^>]*>/g, "");
  html = addHeadOnce(html, faviconHref, `<link rel="icon" type="image/png" href="${faviconHref}">`);

  if (!html.includes('name="robots"')) {
    html = html.replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<meta name="robots" content="noindex, nofollow">'
    );
  }

  if (markTeacher && !/<html[^>]*data-teacher-version/.test(html)) {
    html = html.replace(/<html\b([^>]*)>/i, "<html$1 data-teacher-version>");
  }

  html = addScriptBeforeBody(html, gateSrc);
  return html;
}

function updateStudentIndex() {
  let html = read(studentIndex);
  html = addScriptBeforeBody(html, "assets/js/teacher-gate.js");
  write(studentIndex, html);
}

function updateStudentShortcut(file) {
  let html = read(file);
  const before = html;

  html = html.replace(
    /\(e\.key==='t'\|\|e\.key==='T'\)&&!e\.ctrlKey&&!e\.altKey&&!e\.metaKey/g,
    "(e.key==='t'||e.key==='T')&&e.ctrlKey&&e.shiftKey&&!e.altKey&&!e.metaKey"
  );
  html = html.replace(
    /\(e\.key==='T'\|\|e\.key==='t'\)&&!e\.ctrlKey&&!e\.metaKey&&!e\.altKey/g,
    "(e.key==='T'||e.key==='t')&&e.ctrlKey&&e.shiftKey&&!e.metaKey&&!e.altKey"
  );
  html = html.replace(
    /else if\(e\.key\.toLowerCase\(\)==='t'\)\{e\.preventDefault\(\);openTeacherScript\(\);\}/g,
    "else if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='t'){e.preventDefault();openTeacherScript();}"
  );

  if (html !== before) write(file, html);
}

function updateTeacherIndex() {
  let html = read(teacherIndex);
  html = syncHomepageContent(html, "../cronasia-icon.png", "../assets/js/teacher-gate.js", true);

  html = html.replace(".session-link{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:16px;padding:14px 20px;background:#141418;border:1px solid #1e1e28;border-radius:12px;text-decoration:none;color:inherit;transition:background .2s,border-color .2s,transform .15s}", ".session-link{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:16px;padding:14px 20px;background:#141418;border:1px solid #1e1e28;border-radius:8px;text-decoration:none;color:inherit;transition:background .2s,border-color .2s,transform .15s}");
  if (!html.includes(".session-link:focus-visible")) {
    html = html.replace(".session-link:hover{background:#1a1a22;border-color:#2a2a3a;transform:translateY(-1px)}", ".session-link:hover{background:#1a1a22;border-color:#2a2a3a;transform:translateY(-1px)}\n.session-link:focus-visible{outline:2px solid #e63946;outline-offset:3px}");
  }
  html = html.replace(".session-topic{font-size:12px;color:#6a6a7a}", ".session-topic{font-size:12px;color:#9a9aaa}");
  html = html.replace(".session-week{font-size:12px;color:#4a4a5a;font-family:'JetBrains Mono',monospace;text-align:right}", ".session-week{font-size:12px;color:#8a8a9a;font-family:'JetBrains Mono',monospace;text-align:right}");
  html = html.replace(".footer{text-align:center;padding:40px 24px;border-top:1px solid #1e1e28;color:#4a4a5a;font-size:13px}", ".footer{text-align:center;padding:40px 24px;border-top:1px solid #1e1e28;color:#7a7a8a;font-size:13px}");

  write(teacherIndex, html);
}

function updateTeacherTopic(file) {
  let html = read(file);
  html = html.replace(/<link rel="icon"[^>]*cronasia-icon\.png"[^>]*>\s*/g, "");
  if (!/<html[^>]*data-teacher-version/.test(html)) {
    html = html.replace(/<html\b([^>]*)>/i, "<html$1 data-teacher-version>");
  }
  html = addHeadOnce(html, "../../../cronasia-icon.png", '<link rel="icon" type="image/png" href="../../../cronasia-icon.png">');
  html = addHeadOnce(html, 'name="robots"', '<meta name="robots" content="noindex, nofollow">');
  html = addHeadOnce(html, "teacher-checking", "<script>document.documentElement.classList.add('teacher-checking');</script>");
  html = addHeadOnce(html, "../../../assets/js/teacher-gate.js", '<script src="../../../assets/js/teacher-gate.js"></script>');
  write(file, html);
}

updateStudentIndex();
for (const file of htmlFiles(studentTopics)) updateStudentShortcut(file);
updateTeacherIndex();
for (const file of htmlFiles(teacherTopics)) updateTeacherTopic(file);

console.log("Synced teacher version and student shortcuts.");
