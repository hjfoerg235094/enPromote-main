<template>
  <div class="check-in-container">
    <div class="check-in-card">
      <div class="card-header">
        <h2 class="title">每日签到</h2>
        <div class="streak-info">
          <div class="streak-days">
            <span class="number">{{ checkInStatus.continuousCheckInDays }}</span>
            <span class="label">连续签到</span>
          </div>
          <div class="total-days">
            <span class="number">{{ checkInStatus.totalCheckInDays }}</span>
            <span class="label">累计签到</span>
          </div>
        </div>
      </div>

      <div class="card-content">
        <div class="check-in-button-container">
          <button 
            class="check-in-button" 
            :class="{ 'checked-in': checkInStatus.hasCheckedInToday }"
            @click="handleCheckIn"
            :disabled="checkInStatus.hasCheckedInToday || isLoading"
          >
            <div class="button-content">
              <div class="icon" v-if="!checkInStatus.hasCheckedInToday">🎁</div>
              <div class="icon" v-else>✅</div>
              <div class="text">
                <div class="main-text" v-if="!checkInStatus.hasCheckedInToday">立即签到</div>
                <div class="main-text" v-else>今日已签到</div>
                <div class="sub-text" v-if="!checkInStatus.hasCheckedInToday">获得积分奖励</div>
                <div class="sub-text" v-else>明天再来吧</div>
              </div>
            </div>
          </button>
        </div>

        <div class="calendar-container">
          <div class="calendar-header">
            <span class="month">{{ checkInStatus.currentMonth }}月</span>
            <span class="year">{{ checkInStatus.currentYear }}年</span>
          </div>
          <div class="calendar-grid">
            <div 
              v-for="day in checkInStatus.monthCheckInDays" 
              :key="day.date"
              class="calendar-day"
              :class="{ 'checked-in': day.checkedIn }"
            >
              {{ day.date }}
            </div>
          </div>
        </div>

        <div class="rewards-info">
          <h3>签到奖励</h3>
          <div class="reward-item">
            <span class="reward-icon">🪙</span>
            <span class="reward-text">每日签到：10积分</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">🎯</span>
            <span class="reward-text">连续3天：额外10积分</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">🏆</span>
            <span class="reward-text">连续7天：额外20积分</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 签到成功弹窗 -->
    <div class="modal-overlay" v-if="showRewardModal" @click="closeRewardModal">
      <div class="reward-modal" @click.stop>
        <div class="modal-header">
          <h3>签到成功！</h3>
          <button class="close-button" @click="closeRewardModal">×</button>
        </div>
        <div class="modal-content">
          <div class="reward-animation">
            <div class="reward-icon-large">🎁</div>
            <div class="reward-amount">+{{ rewardData?.total || 0 }} 积分</div>
          </div>
          <div class="reward-details">
            <div class="reward-detail-item">
              <span>基础奖励：</span>
              <span>{{ rewardData?.coins || 0 }} 积分</span>
            </div>
            <div class="reward-detail-item" v-if="rewardData?.bonus">
              <span>连续签到奖励：</span>
              <span>{{ rewardData?.bonus || 0 }} 积分</span>
            </div>
            <div class="reward-detail-item">
              <span>连续签到天数：</span>
              <span>{{ checkInStatus.continuousCheckInDays }} 天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { dailyCheckIn, getCheckInStatus } from '@/api/checkin';

// 响应式数据
const isLoading = ref(false);
const showRewardModal = ref(false);
const rewardData = ref(null);

const checkInStatus = ref({
  continuousCheckInDays: 0,
  totalCheckInDays: 0,
  hasCheckedInToday: false,
  monthCheckInDays: [],
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear()
});

// 页面加载时获取签到状态
onMounted(() => {
  fetchCheckInStatus();
});

// 获取签到状态
const fetchCheckInStatus = async () => {
  try {
    const res = await getCheckInStatus();
    if (res.data && res.data.code === 200) {
      checkInStatus.value = res.data.data;
    }
  } catch (error) {
    console.error('获取签到状态失败:', error);
  }
};

// 处理签到
const handleCheckIn = async () => {
  if (checkInStatus.value.hasCheckedInToday || isLoading.value) {
    return;
  }

  isLoading.value = true;

  try {
    const res = await dailyCheckIn();
    if (res.data && res.data.code === 200) {
      // 更新签到状态
      checkInStatus.value = {
        ...checkInStatus.value,
        ...res.data.data
      };

      // 保存奖励数据
      rewardData.value = res.data.data.reward;

      // 显示奖励弹窗
      showRewardModal.value = true;
    } else {
      // 显示错误信息
      alert(res.data?.message || '签到失败，请稍后再试');
    }
  } catch (error) {
    console.error('签到失败:', error);
    alert('签到失败，请稍后再试');
  } finally {
    isLoading.value = false;
  }
};

// 关闭奖励弹窗
const closeRewardModal = () => {
  showRewardModal.value = false;
};
</script>

<style scoped>
.check-in-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.check-in-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 24px;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

.streak-info {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.streak-days, .total-days {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.number {
  font-size: 28px;
  font-weight: bold;
}

.label {
  font-size: 14px;
  opacity: 0.9;
}

.card-content {
  padding: 24px;
}

.check-in-button-container {
  margin-bottom: 24px;
}

.check-in-button {
  width: 100%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  padding: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.check-in-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.check-in-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.check-in-button.checked-in {
  background: linear-gradient(135deg, #10b981, #059669);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.icon {
  font-size: 24px;
}

.text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.main-text {
  font-size: 18px;
  font-weight: bold;
}

.sub-text {
  font-size: 14px;
  opacity: 0.9;
}

.calendar-container {
  margin-bottom: 24px;
}

.calendar-header {
  text-align: center;
  margin-bottom: 16px;
  font-weight: bold;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f3f4f6;
  font-weight: 500;
}

.calendar-day.checked-in {
  background: #ddd6fe;
  color: #6366f1;
  font-weight: bold;
}

.rewards-info h3 {
  margin-bottom: 12px;
  font-size: 18px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.reward-icon {
  font-size: 20px;
}

/* 签到成功弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.reward-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-content {
  padding: 20px;
  text-align: center;
}

.reward-animation {
  margin-bottom: 24px;
}

.reward-icon-large {
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.reward-amount {
  font-size: 28px;
  font-weight: bold;
  color: #6366f1;
}

.reward-details {
  text-align: left;
}

.reward-detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>
