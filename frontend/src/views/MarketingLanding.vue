<template>
  <main class="branding-page">
    <!-- <nav class="brand-nav" aria-label="EnglishMastery navigation">
      <button class="brand-mark" type="button" @click="scrollToTop">
        <span>LQ</span>
        <strong>EnglishMastery</strong>
      </button>

      <div class="nav-links">
        <a href="#route">闯关学习</a>
        <a href="#coach">口语教练</a>
        <a href="#social">好友同行</a>
      </div>

      <div class="nav-actions">
        <button class="nav-login" type="button" @click="goLogin">登录</button>
        <button class="nav-register" type="button" @click="goRegister">注册开始</button>
      </div>
    </nav> -->

    <section class="hero-section">
      <div class="hero-copy">
        <span class="section-kicker">AI 场景化英语学习平台</span>
        <h1>把英语练进真实语境，而不是只背在列表里。</h1>
        <p>
          EnglishMastery 将酒店、餐厅等真实场景拆成可完成的学习关卡：先掌握词汇，再练拼写和听力，
          最后通过 AI 任务对话与剧情模拟把表达说出来。
        </p>
        <div class="hero-actions">
          <button class="brand-button primary" type="button" @click="goRegister">免费创建学习路线</button>
          <button class="brand-button subtle" type="button" @click="goLogin">已有账号继续</button>
        </div>
      </div>

      <div class="hero-board" aria-label="场景闯关预览">
        <div class="board-card conversation-card">
          <div class="bubble assistant">Welcome to Sunny Hotel. How can I help?</div>
          <div class="bubble learner">I would like to check in, please.</div>
          <div class="task-meter">
            <span>任务式对话</span>
            <strong>3/5</strong>
          </div>
        </div>

        <img class="abc-image" :src="abcImage" alt="ABC 英语学习视觉" />

        <div class="board-card score-card">
          <span>Oral Coach</span>
          <strong>86</strong>
          <small>发音清晰度提升中</small>
        </div>
      </div>
    </section>

    <section class="metrics-strip" aria-label="平台能力">
      <div v-for="metric in metrics" :key="metric.label">
        <strong>{{ metric.value }}</strong>
        <span>{{ metric.label }}</span>
      </div>
    </section>

    <section id="route" class="split-section">
      <div class="section-heading">
        <span class="section-kicker">Scenario Quest</span>
        <h2>一条主线，完成从认词到开口的闭环</h2>
        <p>每个场景都不是孤立练习，而是一组逐步推进的任务，让学习者知道下一步该做什么。</p>
      </div>

      <div class="quest-grid">
        <article v-for="step in questSteps" :key="step.title" class="quest-card" :class="step.tone">
          <span>{{ step.index }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.desc }}</p>
        </article>
      </div>
    </section>

    <section id="coach" class="lab-section">
      <div class="lab-panel ai-panel">
        <span class="section-kicker">AI Practice Lab</span>
        <h2>题目会根据当前章节生成，对话会带着任务推进。</h2>
        <p>
          平台源码中提供个性化题目生成与任务式场景对话：系统按当前词汇生成选择、填空、完型等练习，
          再把关键表达放进 AI 对话任务里检验。
        </p>
        <div class="prompt-window">
          <div class="prompt-row">
            <span>Goal</span>
            <strong>完成酒店入住并询问早餐时间</strong>
          </div>
          <div class="prompt-row">
            <span>Words</span>
            <strong>reservation, passport, breakfast</strong>
          </div>
        </div>
      </div>

      <div class="lab-panel speaking-panel">
        <span class="section-kicker">Speaking Coach</span>
        <h2>口语教练让“会做题”继续变成“说得出”。</h2>
        <p>上传音频后获得发音评分与反馈，也可以在 AI 对话中用今天的单词完成 5 分钟热身。</p>
        <button class="brand-button primary" type="button" @click="goRegister">开启口语训练</button>
      </div>
    </section>

    <section id="social" class="story-section">
      <div class="story-card">
        <span class="section-kicker">Story Mode</span>
        <h2>闯关后进入剧情模拟，把英语用于角色任务。</h2>
        <p>剧情模式复用单词、听力、拼写和 AI 对话能力，像完成一段小冒险一样巩固所学。</p>
      </div>

      <div class="story-card social-card">
        <span class="section-kicker">Friends</span>
        <h2>好友、排行和学习对比，让坚持有回应。</h2>
        <p>查看好友学习动态，在每日任务和复习报告里保持轻量但持续的反馈。</p>
      </div>
    </section>

    <section class="cta-section">
      <h2>从一个真实场景开始，今天就完成第一轮表达。</h2>
      <button class="brand-button primary" type="button" @click="goRegister">进入 EnglishMastery</button>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'
import abcImage from '@/assets/images/ABC_pic.png'

const router = useRouter()

const metrics = [
  { value: '5', label: '步场景闯关闭环' },
  { value: 'AI', label: '个性化题目与任务对话' },
  { value: '3', label: '口语、复盘、好友长期陪跑' }
]

const questSteps = [
  { index: '01', title: '词汇学习', desc: '围绕场景认识核心词，先知道要用什么表达。', tone: 'mint' },
  { index: '02', title: '拼写练习', desc: '把词形和释义绑定起来，减少“看得懂但写不出”。', tone: 'yellow' },
  { index: '03', title: '听力训练', desc: '听音识别单词，为后续对话建立声音记忆。', tone: 'blue' },
  { index: '04', title: 'AI 题目', desc: '根据章节词汇生成题目，及时暴露薄弱点。', tone: 'orange' },
  { index: '05', title: '实战对话', desc: '带着任务和 AI 交流，把词汇放回真实沟通。', tone: 'ink' }
]

const goLogin = () => router.push('/login')
const goRegister = () => router.push('/register')
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<style scoped>
.branding-page {
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
  padding: 18px 0 72px;
}

.brand-nav {
  position: sticky;
  top: 12px;
  z-index: 5;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  min-height: 66px;
  padding: 10px 12px;
  border: 1px solid rgba(36, 49, 47, 0.1);
  border-radius: 18px;
  background: rgba(255, 253, 247, 0.86);
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 42px rgba(50, 59, 52, 0.1);
}

.brand-mark,
.nav-login,
.nav-register,
.brand-button {
  cursor: pointer;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 6px;
  background: transparent;
  color: var(--learn-ink);
  font-weight: 900;
}

.brand-mark span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #24312f;
  color: #fffdf7;
  font-size: 14px;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: clamp(12px, 3vw, 34px);
  color: #485752;
  font-size: 14px;
  font-weight: 800;
}

.nav-links a {
  text-decoration: none;
}

.nav-actions {
  display: flex;
  gap: 8px;
}

.nav-login,
.nav-register,
.brand-button {
  min-height: 42px;
  border-radius: 999px;
  font-weight: 900;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.nav-login {
  padding: 0 14px;
  background: transparent;
  color: var(--learn-ink);
}

.nav-register,
.brand-button.primary {
  padding: 0 20px;
  background: #ffd400;
  color: #1f2523;
  box-shadow: 0 14px 24px rgba(214, 159, 0, 0.2);
}

.nav-register:hover,
.brand-button:hover {
  transform: translateY(-2px);
}

.hero-section {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.82fr);
  gap: 34px;
  align-items: center;
  min-height: calc(100vh - 106px);
  padding: 54px 0 36px;
}

.hero-section::before,
.hero-section::after {
  position: absolute;
  z-index: -1;
  width: 180px;
  height: 180px;
  border: 2px solid rgba(66, 119, 184, 0.12);
  border-radius: 40px;
  content: "";
  transform: rotate(18deg);
}

.hero-section::before {
  top: 8%;
  left: -90px;
}

.hero-section::after {
  right: -80px;
  bottom: 10%;
  border-color: rgba(240, 164, 58, 0.16);
}

.hero-copy h1,
.section-heading h2,
.lab-panel h2,
.story-card h2,
.cta-section h2 {
  margin: 0;
  line-height: 1.04;
  letter-spacing: 0;
}

.hero-copy h1 {
  max-width: 820px;
  margin-top: 18px;
  font-size: clamp(46px, 7vw, 90px);
}

.hero-copy p,
.section-heading p,
.lab-panel p,
.story-card p,
.cta-section p {
  color: var(--learn-muted);
}

.hero-copy p {
  max-width: 680px;
  margin: 22px 0 0;
  font-size: 18px;
}

.section-kicker {
  display: inline-flex;
  width: fit-content;
  min-height: 30px;
  align-items: center;
  padding: 5px 12px;
  border: 1px solid rgba(31, 138, 112, 0.18);
  border-radius: 999px;
  background: rgba(31, 138, 112, 0.08);
  color: var(--learn-primary-dark);
  font-size: 13px;
  font-weight: 900;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.brand-button {
  padding: 0 22px;
}

.brand-button.subtle {
  border: 1px solid rgba(36, 49, 47, 0.13);
  background: #fffdf7;
  color: var(--learn-ink);
  box-shadow: none;
}

.hero-board {
  position: relative;
  min-height: 560px;
}

.board-card {
  position: absolute;
  border: 1px solid rgba(36, 49, 47, 0.12);
  border-radius: 18px;
  background: #fffdf7;
  box-shadow: 0 22px 48px rgba(50, 59, 52, 0.14);
}

.conversation-card {
  top: 22px;
  right: 0;
  width: min(100%, 390px);
  padding: 18px;
}

.bubble {
  width: fit-content;
  max-width: 100%;
  margin-bottom: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  font-weight: 800;
}

.bubble.assistant {
  background: var(--learn-blue-soft);
  color: #1d4f83;
}

.bubble.learner {
  margin-left: auto;
  background: var(--learn-green-soft);
  color: var(--learn-primary-dark);
}

.task-meter,
.prompt-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: var(--learn-muted);
  font-size: 14px;
  font-weight: 900;
}

.task-meter strong,
.prompt-row strong {
  color: var(--learn-ink);
}

.abc-image {
  position: absolute;
  top: 190px;
  left: 0;
  width: min(76%, 430px);
  border-radius: 18px;
  box-shadow: 0 26px 58px rgba(50, 59, 52, 0.16);
}

.score-card {
  right: 36px;
  bottom: 42px;
  width: 210px;
  padding: 22px;
  background: #24312f;
  color: #fffdf7;
}

.score-card span,
.score-card small {
  color: rgba(255, 253, 247, 0.68);
  font-weight: 800;
}

.score-card strong {
  display: block;
  font-size: 64px;
  line-height: 1;
}

.metrics-strip,
.quest-grid,
.lab-section,
.story-section {
  display: grid;
  gap: 16px;
}

.metrics-strip {
  grid-template-columns: repeat(3, 1fr);
  margin: 8px 0 64px;
}

.metrics-strip div {
  padding: 20px;
  border: 1px solid rgba(36, 49, 47, 0.1);
  border-radius: 18px;
  background: rgba(255, 253, 247, 0.78);
}

.metrics-strip strong {
  display: block;
  font-size: 40px;
  line-height: 1;
}

.metrics-strip span {
  color: var(--learn-muted);
  font-weight: 800;
}

.split-section,
.lab-section,
.story-section,
.cta-section {
  scroll-margin-top: 96px;
}

.section-heading {
  max-width: 720px;
  margin-bottom: 22px;
}

.section-heading h2,
.lab-panel h2,
.story-card h2,
.cta-section h2 {
  margin-top: 14px;
  font-size: clamp(32px, 5vw, 54px);
}

.quest-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.quest-card {
  min-height: 280px;
  padding: 22px;
  border: 1px solid rgba(36, 49, 47, 0.12);
  border-radius: 18px;
  background: #fffdf7;
  box-shadow: var(--learn-shadow-soft);
}

.quest-card span {
  font-size: 13px;
  font-weight: 900;
}

.quest-card h3 {
  margin: 64px 0 12px;
  font-size: 24px;
  line-height: 1.08;
}

.quest-card p {
  margin: 0;
  color: #586660;
  font-size: 14px;
}

.quest-card.mint {
  background: #e6f5e9;
}

.quest-card.yellow {
  background: #fff200;
}

.quest-card.blue {
  background: #bde8f7;
}

.quest-card.orange {
  background: #f28a2b;
  color: #241d16;
}

.quest-card.ink {
  background: #24312f;
  color: #fffdf7;
}

.quest-card.ink p {
  color: rgba(255, 253, 247, 0.72);
}

.lab-section {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 78px;
}

.lab-panel,
.story-card,
.cta-section {
  border: 1px solid rgba(36, 49, 47, 0.1);
  border-radius: 18px;
  box-shadow: var(--learn-shadow-soft);
}

.lab-panel {
  min-height: 430px;
  padding: clamp(26px, 4vw, 44px);
}

.ai-panel {
  background:
    linear-gradient(135deg, rgba(227, 237, 249, 0.8), rgba(255, 253, 247, 0.88)),
    #fffdf7;
}

.speaking-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background:
    linear-gradient(145deg, rgba(255, 241, 207, 0.95), rgba(255, 226, 220, 0.86)),
    #fffdf7;
}

.prompt-window {
  display: grid;
  gap: 10px;
  margin-top: 34px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 253, 247, 0.82);
}

.prompt-row {
  align-items: center;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 12px;
  background: #fff;
}

.story-section {
  grid-template-columns: repeat(2, 1fr);
  margin-top: 18px;
}

.story-card {
  min-height: 340px;
  padding: clamp(26px, 4vw, 44px);
  background: #fffdf7;
}

.social-card {
  background: #dff3e8;
}

.cta-section {
  display: grid;
  justify-items: center;
  gap: 20px;
  margin-top: 78px;
  padding: clamp(32px, 6vw, 64px);
  background: #24312f;
  color: #fffdf7;
  text-align: center;
}

.cta-section h2 {
  max-width: 760px;
}

@media (max-width: 1040px) {

  .hero-section,
  .lab-section,
  .story-section {
    grid-template-columns: 1fr;
  }

  .hero-section {
    min-height: auto;
  }

  .hero-board {
    min-height: 520px;
  }

  .quest-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .branding-page {
    width: min(100% - 20px, 1200px);
    padding-top: 10px;
  }

  .brand-nav {
    position: static;
    grid-template-columns: 1fr auto;
  }

  .nav-links {
    display: none;
  }

  .brand-mark strong {
    display: none;
  }

  .hero-section {
    padding-top: 34px;
  }

  .hero-copy h1 {
    font-size: 42px;
  }

  .hero-board {
    min-height: 560px;
  }

  .conversation-card {
    left: 0;
    right: auto;
  }

  .abc-image {
    top: 226px;
    width: 100%;
  }

  .score-card {
    right: 12px;
    bottom: 10px;
  }

  .metrics-strip,
  .quest-grid {
    grid-template-columns: 1fr;
  }

  .quest-card {
    min-height: 210px;
  }

  .quest-card h3 {
    margin-top: 34px;
  }
}

@media (max-width: 460px) {
  .nav-actions {
    gap: 4px;
  }

  .nav-login {
    padding: 0 8px;
  }

  .nav-register,
  .brand-button.primary {
    padding: 0 14px;
  }

  .hero-actions {
    display: grid;
  }

  .brand-button {
    width: 100%;
  }
}
</style>
