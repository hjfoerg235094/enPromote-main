<template>
  <div class="friend-settings">
    <h3>好友设置</h3>

    <div class="settings-group">
      <h4>隐私设置</h4>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">在排行榜中显示</label>
          <p class="setting-desc">允许其他用户在排行榜中看到你的排名</p>
        </div>
        <switch 
          :model-value="settings.privacy.showInRanking" 
          @update:model-value="updateSetting('privacy.showInRanking', $event)"
        />
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">向好友显示学习进度</label>
          <p class="setting-desc">允许好友查看你的学习进度和统计</p>
        </div>
        <switch 
          :model-value="settings.privacy.showProgressToFriends" 
          @update:model-value="updateSetting('privacy.showProgressToFriends', $event)"
        />
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">允许好友请求</label>
          <p class="setting-desc">允许其他用户向你发送好友请求</p>
        </div>
        <switch 
          :model-value="settings.privacy.allowFriendRequest" 
          @update:model-value="updateSetting('privacy.allowFriendRequest', $event)"
        />
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">显示在线状态</label>
          <p class="setting-desc">允许好友看到你的在线状态</p>
        </div>
        <switch 
          :model-value="settings.privacy.showOnlineStatus" 
          @update:model-value="updateSetting('privacy.showOnlineStatus', $event)"
        />
      </div>
    </div>

    <div class="settings-group">
      <h4>通知设置</h4>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">排名变化通知</label>
          <p class="setting-desc">当你的排名发生变化时接收通知</p>
        </div>
        <switch 
          :model-value="settings.notification.rankingChange" 
          @update:model-value="updateSetting('notification.rankingChange', $event)"
        />
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">好友活动通知</label>
          <p class="setting-desc">当好友完成学习或获得成就时接收通知</p>
        </div>
        <switch 
          :model-value="settings.notification.friendActivity" 
          @update:model-value="updateSetting('notification.friendActivity', $event)"
        />
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <label class="setting-label">好友请求通知</label>
          <p class="setting-desc">当收到新的好友请求时接收通知</p>
        </div>
        <switch 
          :model-value="settings.notification.friendRequest" 
          @update:model-value="updateSetting('notification.friendRequest', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUserSettings, updateUserSettings } from '@/api/settings'

const settings = reactive({
  privacy: {
    showInRanking: true,
    showProgressToFriends: true,
    allowFriendRequest: true,
    showOnlineStatus: true
  },
  notification: {
    rankingChange: true,
    friendActivity: true,
    friendRequest: true
  }
})

const loading = ref(false)

// 获取用户设置
const fetchSettings = async () => {
  try {
    const res = await getUserSettings()
    if (res.data.code === 200 && res.data.data) {
      Object.assign(settings, res.data.data)
    }
  } catch (error) {
    console.error('获取设置失败:', error)
  }
}

// 更新设置
const updateSetting = async (path, value) => {
  // 更新本地状态
  const keys = path.split('.')
  let obj = settings
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]]
  }
  obj[keys[keys.length - 1]] = value

  // 保存到服务器
  loading.value = true
  try {
    const res = await updateUserSettings(settings)
    if (res.data.code !== 200) {
      // 如果保存失败，恢复原值
      obj[keys[keys.length - 1]] = !value
      alert(res.data.message || '保存设置失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    // 恢复原值
    obj[keys[keys.length - 1]] = !value
    alert('保存设置失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.friend-settings {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.friend-settings h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.settings-group {
  margin-bottom: 30px;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.settings-group h4 {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-label {
  display: block;
  color: #333;
  font-size: 14px;
  margin-bottom: 5px;
}

.setting-desc {
  margin: 0;
  color: #999;
  font-size: 12px;
}

/* 开关组件样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4CAF50;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
