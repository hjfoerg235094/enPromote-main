<template>
  <div class="home-container">


    <!-- 主要内容区 -->
    <main>
      <!-- AI优先英雄区域 -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-icon">🚀</span>
            <span class="badge-text">全新升级</span>
          </div>
          <h1 class="hero-title">智能英语学习平台<br><span class="highlight">AI陪你闯关练口语</span></h1>
          <p class="hero-description">
            结构化闯关学习 + 个性化AI对话 - 从词汇到口语，从基础到实战，让英语学习更有趣更高效
          </p>
          <div class="hero-actions">
            <button class="btn-primary-large" @click="goToChapters">
              <span class="btn-icon">🗺️</span>
              开始闯关学习
            </button>
            <button class="btn-secondary-outline" @click="goToFreeChat">
              <span class="btn-icon">💬</span>
              自由AI对话
            </button>
            <button class="btn-secondary-outline" @click="showAiPreview = true">
              <span class="btn-icon">👁️</span>
              功能预览
            </button>
          </div>
          <div class="hero-stats">
            <div class="stat-mini">
              <span class="stat-number">2大</span>
              <span class="stat-label">学习场景</span>
            </div>
            <div class="stat-mini">
              <span class="stat-number">5种</span>
              <span class="stat-label">AI性格</span>
            </div>
            <div class="stat-mini">
              <span class="stat-number">5关</span>
              <span class="stat-label">闯关模式</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="ai-chat-preview" :class="{ 'preview-active': showAiPreview }">
            <div class="chat-window">
              <div class="chat-header">
                <div class="ai-avatar">👨‍🏫</div>
                <div class="ai-info">
                  <span class="ai-name">AI英语老师</span>
                  <span class="ai-status">在线</span>
                </div>
              </div>
              <div class="chat-messages">
                <div class="message ai-message">
                  <div class="message-content">
                    Hello! I'm your AI English teacher. Ready to practice?
                  </div>
                </div>
                <div class="message user-message" v-if="showUserMessage">
                  <div class="message-content">
                    Yes, I'd like to improve my speaking skills.
                  </div>
                </div>
                <div class="message ai-message" v-if="showAiResponse">
                  <div class="message-content">
                    Perfect! Let's start with a conversation about your hobbies. What do you enjoy doing in your free
                    time?
                  </div>
                </div>
              </div>
              <div class="chat-input-preview">
                <input type="text" placeholder="Type your message..." readonly>
                <button class="send-btn">📤</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 核心功能特色 -->
      <section class="ai-features">
        <div class="section-header">
          <h2 class="section-title">两大核心学习模式</h2>
          <p class="section-subtitle">结构化学习 + 自由对话，全方位提升英语能力</p>
        </div>
        <div class="feature-grid">
          <div class="feature-card primary">
            <div class="feature-icon-wrapper">
              <div class="feature-icon">🗺️</div>
              <div class="feature-badge">主推功能</div>
            </div>
            <h3>闯关学习模式</h3>
            <p>酒店、餐厅两大场景，5关递进式学习：词汇→拼写→听力→AI题目→实战对话</p>
            <div class="feature-highlights">
              <span class="highlight-tag">✨ 结构化学习路径</span>
              <span class="highlight-tag">🎯 场景化实用英语</span>
              <span class="highlight-tag">📊 进度可视化追踪</span>
            </div>
            <button class="feature-btn" @click="goToChapters">开始闯关</button>
          </div>
          <div class="feature-card primary">
            <div class="feature-icon-wrapper">
              <div class="feature-icon">💬</div>
              <div class="feature-badge">特色功能</div>
            </div>
            <h3>自由AI对话</h3>
            <p>5种AI性格任你选择，随时随地练习口语，获得个性化反馈和指导</p>
            <div class="feature-highlights">
              <span class="highlight-tag">🎭 5种AI性格</span>
              <span class="highlight-tag">⚡ 实时对话反馈</span>
              <span class="highlight-tag">🔄 24/7随时可用</span>
            </div>
            <button class="feature-btn" @click="goToFreeChat">开始对话</button>
          </div>
        </div>

        <!-- 学习流程展示 -->
        <div class="learning-flow">
          <h3>完整学习流程</h3>
          <div class="flow-steps">
            <div class="flow-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>📚 词汇学习</h4>
                <p>掌握场景核心词汇</p>
              </div>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>✏️ 拼写练习</h4>
                <p>强化单词记忆</p>
              </div>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>🎧 听力训练</h4>
                <p>提升听力理解</p>
              </div>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h4>🤖 AI题目</h4>
                <p>智能生成练习题</p>
              </div>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-step">
              <div class="step-number">5</div>
              <div class="step-content">
                <h4>💬 实战对话</h4>
                <p>AI场景对话练习</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- AI老师介绍 -->
      <section class="ai-teachers">
        <div class="section-header">
          <h2 class="section-title">5种AI性格，总有一款适合你</h2>
          <p class="section-subtitle">在自由对话模式中，选择最适合你的AI老师性格</p>
        </div>
        <div class="teachers-grid">
          <div class="teacher-card" @click="selectTeacher('gentle')">
            <div class="teacher-avatar">😊</div>
            <h3>温和导师</h3>
            <p>耐心细致，循循善诱，营造轻松学习氛围</p>
            <div class="teacher-features">
              <span class="feature-tag">🌟 适合初学者</span>
              <span class="feature-tag">💝 鼓励式教学</span>
            </div>
            <div class="teacher-example">
              <em>"很好！你的发音有了明显进步，我们继续练习..."</em>
            </div>
          </div>
          <div class="teacher-card" @click="selectTeacher('strict')">
            <div class="teacher-avatar">🔥</div>
            <h3>严格教练</h3>
            <p>直接犀利，快速纠错，追求学习效率</p>
            <div class="teacher-features">
              <span class="feature-tag">⚡ 适合进阶者</span>
              <span class="feature-tag">🎯 高效学习</span>
            </div>
            <div class="teacher-example">
              <em>"这个语法错误需要立即纠正，正确的说法是..."</em>
            </div>
          </div>
          <div class="teacher-card" @click="selectTeacher('humorous')">
            <div class="teacher-avatar">🎭</div>
            <h3>幽默伙伴</h3>
            <p>生动有趣，寓教于乐，让学习充满乐趣</p>
            <div class="teacher-features">
              <span class="feature-tag">😄 轻松氛围</span>
              <span class="feature-tag">🧠 记忆深刻</span>
            </div>
            <div class="teacher-example">
              <em>"哈哈，这个单词就像它的意思一样有趣！让我们..."</em>
            </div>
          </div>
          <div class="teacher-card" @click="selectTeacher('cold')">
            <div class="teacher-avatar">❄️</div>
            <h3>超级人机</h3>
            <p>理性分析，逻辑清晰，专注技能提升</p>
            <div class="teacher-features">
              <span class="feature-tag">🤖 理性分析</span>
              <span class="feature-tag">📊 数据驱动</span>
            </div>
            <div class="teacher-example">
              <em>"根据语言学习规律，建议你重点练习..."</em>
            </div>
          </div>
          <div class="teacher-card" @click="selectTeacher('encouraging')">
            <div class="teacher-avatar">💪</div>
            <h3>激励教练</h3>
            <p>积极鼓励，建立自信，激发学习潜能</p>
            <div class="teacher-features">
              <span class="feature-tag">🚀 提升自信</span>
              <span class="feature-tag">⭐ 正面反馈</span>
            </div>
            <div class="teacher-example">
              <em>"太棒了！你的进步让我刮目相看，继续加油！"</em>
            </div>
          </div>
        </div>
        <div class="teachers-cta">
          <p>想要体验不同AI性格的教学风格？</p>
          <button class="btn-primary" @click="goToFreeChat">立即开始自由对话</button>
        </div>
      </section>

      <!-- 平台数据展示 -->
      <section class="stats">
        <h2 class="section-title">平台学习数据</h2>
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-number">2大</div>
            <div class="stat-label">学习场景</div>
            <div class="stat-desc">酒店 & 餐厅</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">5关</div>
            <div class="stat-label">闯关模式</div>
            <div class="stat-desc">递进式学习</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">5种</div>
            <div class="stat-label">AI性格</div>
            <div class="stat-desc">个性化对话</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">24/7</div>
            <div class="stat-label">在线服务</div>
            <div class="stat-desc">随时随地学习</div>
          </div>
        </div>
      </section>

      <!-- 学习提醒卡片组 -->
      <section class="learning-cards" v-if="storeUsername">
        <!-- 每日签到卡片 -->
        <div class="check-in-card">
          <div class="check-in-info">
            <h3>每日签到</h3>
            <p>坚持学习，养成好习惯</p>
            <div class="check-in-stats" v-if="checkInData">
              <div class="stat">
                <span class="number">{{ checkInData.continuousCheckInDays }}</span>
                <span class="label">连续签到</span>
              </div>
              <div class="stat">
                <span class="number">{{ checkInData.totalCheckInDays }}</span>
                <span class="label">累计签到</span>
              </div>
            </div>
          </div>
          <button class="check-in-btn" @click="goToCheckIn" :disabled="checkInData && checkInData.hasCheckedInToday">
            <span v-if="checkInData && checkInData.hasCheckedInToday">已签到</span>
            <span v-else>立即签到</span>
          </button>
        </div>
        
        <!-- 单词复习卡片 -->
        <div class="word-review-card">
          <div class="review-info">
            <h3>单词复习</h3>
            <p>巩固记忆，提高掌握度</p>
            <div class="review-stats" v-if="reviewData">
              <div class="stat">
                <span class="number">{{ reviewData.pendingReviewCount }}</span>
                <span class="label">待复习</span>
              </div>
              <div class="stat">
                <span class="number">{{ reviewData.todayReviewedCount }}</span>
                <span class="label">今日已复习</span>
              </div>
            </div>
          </div>
          <button class="review-btn" @click="goToWordReview" :disabled="!reviewData || reviewData.pendingReviewCount === 0">
            <span v-if="!reviewData">加载中...</span>
            <span v-else-if="reviewData.pendingReviewCount === 0">暂无复习</span>
            <span v-else>开始复习</span>
          </button>
        </div>
      </section>

      <!-- 学习路径推荐 -->
      <section class="daily-suggestion">
        <h2 class="section-title">推荐学习路径</h2>
        <div class="suggestion-cards">
          <div class="card featured">
            <div class="card-badge">🌟 推荐</div>
            <h3>结构化闯关学习</h3>
            <p>从酒店场景开始，5关递进式学习，系统掌握实用英语</p>
            <div class="card-features">
              <span>✅ 词汇积累</span>
              <span>✅ 听力提升</span>
              <span>✅ 口语实战</span>
            </div>
            <button class="btn-primary" @click="goToChapters">开始闯关</button>
          </div>
          <div class="card">
            <h3>自由AI对话</h3>
            <p>选择你喜欢的AI性格，随时开始英语对话练习</p>
            <div class="card-features">
              <span>🎭 5种性格</span>
              <span>💬 实时对话</span>
              <span>🔄 随时可用</span>
            </div>
            <button class="btn-secondary" @click="goToFreeChat">开始对话</button>
          </div>
          <div class="card">
            <h3>混合学习模式</h3>
            <p>结合闯关学习和自由对话，获得最佳学习效果</p>
            <div class="card-features">
              <span>📚 系统学习</span>
              <span>💡 灵活练习</span>
              <span>🚀 快速提升</span>
            </div>
            <button class="btn-secondary" @click="showMixedLearning">了解更多</button>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>关于我们</h3>
          <p>EnglishMastery致力于提供高质量的英语学习体验，帮助学习者轻松掌握英语。</p>
        </div>
        <div class="footer-section">
          <h3>联系方式</h3>
          <p>邮箱：contact@englishmastery.com</p>
          <p>电话：123-456-7890</p>
        </div>
        <div class="footer-section">
          <h3>关注我们</h3>
          <div class="social-icons">
            <!-- 社交媒体图标 -->
            <span>微信</span>
            <span>微博</span>
            <span>QQ</span>
          </div>
        </div>
      </div>
      <div class="copyright">
        <p>&copy; 2023 EnglishMastery. 保留所有权利。</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getUserInfo, username as storeUsername, clearUserInfo } from '@/stores/userStore';
import { getCheckInStatus } from '@/api/checkin';
import { getReviewWords } from '@/api/word';
import { useRouter } from 'vue-router';

const router = useRouter();

// 响应式数据
const showAiPreview = ref(false);
const showUserMessage = ref(false);
const showAiResponse = ref(false);
const checkInData = ref(null);
const reviewData = ref(null);

// 页面加载时的逻辑
onMounted(() => {
  console.log('首页加载完成');

  // 检查当前路径，避免在登录/注册页面调用
  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/register') {
    getUserInfo().then(userInfo => {
      if (userInfo) {
        // 用户登录后获取签到状态
        fetchCheckInStatus();
        // 获取单词复习数据
        fetchReviewData();
      }
    }).catch(err => {
      console.log('获取用户信息失败:', err);
      // 静默处理错误，不影响页面其他功能
    });
  }

  // 启动AI预览动画
  startAiPreviewAnimation();
});

// AI预览动画
const startAiPreviewAnimation = () => {
  setTimeout(() => {
    showAiPreview.value = true;
    setTimeout(() => {
      showUserMessage.value = true;
      setTimeout(() => {
        showAiResponse.value = true;
      }, 1500);
    }, 1000);
  }, 2000);
};

// 主要导航函数
function goToChapters() {
  // 进入结构化闯关学习
  router.push('/chapters');
}

function goToFreeChat() {
  // 进入自由AI对话
  router.push('/aiChatExer');
}

// 选择AI老师并进入对话
function selectTeacher(teacherType) {
  // 保存用户选择的老师类型到localStorage
  localStorage.setItem('selectedTeacher', teacherType);
  // 直接进入AI对话页面
  router.push('/aiChatExer');
}

// 获取签到状态
const fetchCheckInStatus = async () => {
  try {
    const res = await getCheckInStatus();
    if (res.data && res.data.code === 200) {
      checkInData.value = res.data.data;
    }
  } catch (error) {
    console.error('获取签到状态失败:', error);
  }
};

// 跳转到签到页面
function goToCheckIn() {
  router.push('/checkin');
}

// 获取单词复习数据
const fetchReviewData = async () => {
  try {
    const res = await getReviewWords();
    if (res.data && res.data.code === 200) {
      reviewData.value = {
        pendingReviewCount: res.data.data.count,
        todayReviewedCount: 0 // 这里可以添加获取今日已复习单词数量的逻辑
      };
    }
  } catch (error) {
    console.error('获取复习数据失败:', error);
  }
};

// 跳转到单词复习页面
function goToWordReview() {
  router.push('/flashCardReview');
}

// 显示混合学习模式说明
function showMixedLearning() {
  alert('混合学习模式：\n\n1. 先通过闯关学习掌握基础词汇和语法\n2. 再通过自由对话练习实际应用\n3. 两种模式结合，学习效果更佳！\n\n建议从闯关学习开始 🚀');
}
</script>
<script>
import '@/assets/css/home_head.css'
import '@/assets/css/ai-home.css'
import '@/assets/css/checkin.css'
import '@/assets/css/wordReviewCard.css'
</script>
