/* ========================================
   源养智助官网 - 交互逻辑（多页面版）
   接入腾讯混元大模型（非模拟）
   ======================================== */

/* ===========================
   1. 移动端导航菜单
   =========================== */

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// 点击导航链接后关闭移动端菜单
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const navLinks = document.getElementById('navLinks');
      if (navLinks) navLinks.classList.remove('open');
    });
  });
});


/* ===========================
   2. 混元大模型 AI 助手
   =========================== */

const HUNYUAN_API_KEY = 'sk-Iey0jtguH9gkVYvIfG0vr6qQXiwdCZn2VPp5Vum2uOIsgO3o';
const HUNYUAN_API_URL = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
const PROXY_URLS = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

let chatHistory = [];

async function sendAIMsg() {
  const input = document.getElementById('aiInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  addMessage(text, 'user');
  addLoadingMessage();

  try {
    const reply = await callHunyuan(text);
    removeLoadingMessage();
    addMessage(reply, 'bot');
  } catch (e) {
    removeLoadingMessage();
    addMessage('抱歉，AI 服务暂时无法连接（可能是浏览器跨域限制）。\n\n建议：在 Chrome 浏览器中打开，或部署到服务器后访问即可正常使用。', 'bot');
  }
}

async function callHunyuan(userText) {
  const messages = [
    {
      role: 'system',
      content: '你是「源养小智」，一个专业的中医养生AI助手。你专注于：中医体质辨识、药食同源养生建议、贵州道地药材（折耳根、茯苓、黄姜等）介绍、熬夜膏/折耳根膏/茯苓黄姜膏等产品说明。请用温和专业的语气回答，回答控制在200字以内，并在涉及疾病时提醒用户及时就医。'
    },
    ...chatHistory,
    { role: 'user', content: userText }
  ];

  const urls = [
    HUNYUAN_API_URL,
    ...PROXY_URLS.map(p => p + encodeURIComponent(HUNYUAN_API_URL))
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUNYUAN_API_KEY}`
        },
        body: JSON.stringify({
          model: 'hunyuan-lite',
          messages: messages,
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || '抱歉，我没有理解您的问题。';

        chatHistory.push({ role: 'user', content: userText });
        chatHistory.push({ role: 'assistant', content: reply });
        if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);

        return reply;
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error('All request attempts failed');
}

function addMessage(text, type) {
  const container = document.getElementById('aiMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `ai-msg ${type}`;
  const avatar = type === 'bot' ? 'assets/jiqiren.png' : 'assets/yonghu.png';
  div.innerHTML = `
    <img src="${avatar}" class="msg-avatar-img" alt="" />
    <div class="msg-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addLoadingMessage() {
  const container = document.getElementById('aiMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'ai-msg bot';
  div.id = 'loadingMsg';
  div.innerHTML = `
    <img src="assets/jiqiren.png" class="msg-avatar-img" alt="" />
    <div class="msg-bubble" id="loadingText">思考中.</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  const dots = ['.', '..', '...'];
  let i = 0;
  window.loadingTimer = setInterval(() => {
    const el = document.getElementById('loadingText');
    if (el) el.textContent = '思考中' + dots[i++ % 3];
  }, 400);
}

function removeLoadingMessage() {
  clearInterval(window.loadingTimer);
  const el = document.getElementById('loadingMsg');
  if (el) el.remove();
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}


/* ===========================
   3. 体质测评逻辑
   =========================== */

const quizQuestions = [
  {
    q: '您平时容易感到疲乏吗？',
    options: [
      { text: '经常感到疲劳，精神不振', score: 3 },
      { text: '偶尔会感到疲劳', score: 2 },
      { text: '很少感到疲劳', score: 1 }
    ]
  },
  {
    q: '您的手脚经常是冰凉的还是温热的？',
    options: [
      { text: '经常手脚冰凉，怕冷', score: 3 },
      { text: '冷热交替，不稳定', score: 2 },
      { text: '手脚温热', score: 1 }
    ]
  },
  {
    q: '您的舌苔情况？',
    options: [
      { text: '舌苔厚腻、发黄', score: 3 },
      { text: '舌苔薄白', score: 2 },
      { text: '舌红少苔', score: 3 }
    ]
  },
  {
    q: '您容易上火（口干、口腔溃疡等）吗？',
    options: [
      { text: '经常上火', score: 3 },
      { text: '偶尔上火', score: 2 },
      { text: '很少上火', score: 1 }
    ]
  },
  {
    q: '您的睡眠质量如何？',
    options: [
      { text: '经常失眠或睡眠很浅', score: 3 },
      { text: '偶尔失眠', score: 2 },
      { text: '睡眠质量好', score: 1 }
    ]
  },
  {
    q: '您体型偏胖还是偏瘦？',
    options: [
      { text: '偏胖，腹部赘肉多', score: 3 },
      { text: '适中', score: 2 },
      { text: '偏瘦', score: 1 }
    ]
  }
];

const quizResults = {
  yangxu: {
    icon: 'assets/jiqiren.png',
    title: '阳虚体质',
    desc: '您属于阳虚体质，表现为怕冷、手脚冰凉、精神不振。建议多吃温补食物，如姜、桂圆、羊肉，可配合熬夜膏进行温补调理。',
    products: ['熬夜膏', '茯苓黄姜膏']
  },
  yinxu: {
    icon: 'assets/jiqiren.png',
    title: '阴虚体质',
    desc: '您属于阴虚体质，表现为怕热、口干舌燥、易上火。建议多食滋阴食物，如银耳、百合、枸杞，避免熬夜，配合折耳根膏清热。',
    products: ['折耳根膏', '茯苓黄姜膏']
  },
  shire: {
    icon: 'assets/jiqiren.png',
    title: '湿热体质',
    desc: '您属于湿热体质，表现为面部油光、容易长痘、大便粘滞。建议清热祛湿，多吃冬瓜、绿豆、薏米，茯苓黄姜膏适合您。',
    products: ['茯苓黄姜膏', '折耳根膏']
  },
  qixu: {
    icon: 'assets/jiqiren.png',
    title: '气虚体质',
    desc: '您属于气虚体质，表现为气短懒言、容易疲劳。建议补气养血，多食山药、红枣，可配合熬夜膏进行日常调理。',
    products: ['熬夜膏', '茯苓黄姜膏']
  },
  pinghe: {
    icon: 'assets/jiqiren.png',
    title: '平和体质',
    desc: '恭喜！您属于平和体质，身体健康。建议保持良好生活习惯，均衡饮食，适当运动。',
    products: ['熬夜膏', '折耳根膏']
  }
};

let currentQuestion = 0;
let totalScore = 0;

function startQuiz() {
  currentQuestion = 0;
  totalScore = 0;
  const startEl = document.getElementById('quizStart');
  const qEl = document.getElementById('quizQuestions');
  const rEl = document.getElementById('quizResult');
  if (startEl) startEl.style.display = 'none';
  if (qEl) qEl.style.display = 'block';
  if (rEl) rEl.style.display = 'none';
  showQuestion();
}

function showQuestion() {
  const q = quizQuestions[currentQuestion];
  const bar = document.getElementById('quizProgressBar');
  const textEl = document.getElementById('quizQuestionText');
  const optionsEl = document.getElementById('quizOptions');
  if (bar) bar.style.width = ((currentQuestion) / quizQuestions.length * 100) + '%';
  if (textEl) textEl.textContent = `(${currentQuestion + 1}/${quizQuestions.length}) ${q.q}`;
  if (optionsEl) {
    optionsEl.innerHTML = '';
    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt.text;
      btn.onclick = () => selectAnswer(opt.score);
      optionsEl.appendChild(btn);
    });
  }
}

function selectAnswer(score) {
  totalScore += score;
  currentQuestion++;
  if (currentQuestion < quizQuestions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const qEl = document.getElementById('quizQuestions');
  const rEl = document.getElementById('quizResult');
  const bar = document.getElementById('quizProgressBar');
  if (qEl) qEl.style.display = 'none';
  if (rEl) rEl.style.display = 'flex';
  if (bar) bar.style.width = '100%';

  const avgScore = totalScore / quizQuestions.length;
  let result;

  if (avgScore >= 2.5) {
    if (totalScore >= 14) result = quizResults.yinxu;
    else if (totalScore >= 10) result = quizResults.qixu;
    else result = quizResults.yangxu;
  } else if (avgScore >= 1.8) {
    result = quizResults.shire;
  } else {
    result = quizResults.pinghe;
  }

  const iconEl = document.getElementById('quizResultIcon');
  const titleEl = document.getElementById('quizResultTitle');
  const descEl = document.getElementById('quizResultDesc');
  if (iconEl) iconEl.src = result.icon;
  if (titleEl) titleEl.textContent = result.title;
  if (descEl) descEl.textContent = result.desc;

  const productsEl = document.getElementById('quizResultProducts');
  if (productsEl) {
    productsEl.innerHTML = '';
    result.products.forEach(name => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = name;
      productsEl.appendChild(span);
    });
  }
}

function restartQuiz() {
  const startEl = document.getElementById('quizStart');
  const qEl = document.getElementById('quizQuestions');
  const rEl = document.getElementById('quizResult');
  const bar = document.getElementById('quizProgressBar');
  if (startEl) startEl.style.display = 'flex';
  if (qEl) qEl.style.display = 'none';
  if (rEl) rEl.style.display = 'none';
  if (bar) bar.style.width = '0%';
}
