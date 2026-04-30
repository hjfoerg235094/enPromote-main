<!-- 个人主页 -->
<template>
    <div class="profile-container">
        <div class="profile-header">
            <div class="avatar-section">
                <div class="avatar-wrapper">
                    <img :src="userAvatar" alt="用户头像" class="avatar-large" />
                    <div class="avatar-upload-overlay" @click="triggerFileInput">
                        <span class="upload-icon">📷</span>
                        <span class="upload-text">更换头像</span>
                    </div>
                    <input 
                        type="file" 
                        ref="fileInput" 
                        @change="handleAvatarChange" 
                        accept="image/jpeg,image/jpg,image/png,image/gif" 
                        style="display: none"
                    />
                </div>
                <div class="user-info">
                    <h2>{{ userInfo.username }}</h2>
                    <p class="join-date">加入时间: {{ formatDate(userInfo.creatTime) }}</p>
                </div>
            </div>
        </div>

        <div class="profile-content">
            <!-- 学习统计 -->
            <div class="stats-section">
                <div class="stat-card">
                    <h3>连续学习</h3>
                    <p>{{ continuousLearningDays }} 天</p>
                </div>
                <div class="stat-card">
                    <h3>今日学习</h3>
                    <p>{{ userInfo.todayWords || 0 }} 个单词</p>
                </div>
                <div class="stat-card">
                    <h3>总学习量</h3>
                    <p>{{ userInfo.totalWords || 0 }} 个单词</p>
                </div>
            </div>

            <!-- 好友管理入口 -->
            <div class="friends-section">
                <div class="friends-card">
                    <div class="friends-header">
                        <h3>好友管理</h3>
                        <router-link to="/friends" class="view-all-link">管理好友 →</router-link>
                    </div>
                    <div class="friends-preview">
                        <div class="friends-icon">👥</div>
                        <p>添加好友，一起学习进步</p>
                        <router-link to="/friends" class="btn-primary">立即添加</router-link>
                    </div>
                </div>
            </div>

            <!-- 收藏单词区域 -->
            <div class="favorite-section">
                <div class="favorite-header">
                    <h3>我的收藏单词</h3>
                    <router-link to="/favoriteWords" class="view-all-link">查看全部 →</router-link>
                </div>
                <div v-if="favoriteWords.length === 0" class="empty-favorite">
                    <div class="empty-icon">📚</div>
                    <p>还没有收藏任何单词</p>
                </div>
                <div v-else class="favorite-words-grid">
                    <div v-for="word in favoriteWords.slice(0, 6)" :key="word.id" class="favorite-word-card">
                        <div class="word-header">
                            <h4 class="word-text">{{ word.word }}</h4>
                            <button class="remove-btn" @click="handleRemoveFavorite(word.wordId)" title="取消收藏">✕</button>
                        </div>
                        <div class="word-meaning">{{ word.meaning }}</div>
                        <div class="word-footer">
                            <span class="word-status" :class="'status-' + word.status">{{ getStatusText(word.status) }}</span>
                            <span class="word-reviews">复习 {{ word.reviewCounts }} 次</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 设置区域 -->
            <div class="settings-section">
                <div class="settings-card">
                    <h3>个人设置</h3>

                    <!-- 基本信息设置 -->
                    <div class="setting-group">
                        <h4>基本信息</h4>
                        <div class="form-row">
                            <label>用户名:</label>
                            <input v-model="editForm.username" type="text" placeholder="请输入新用户名" :disabled="loading" />
                        </div>
                        <div class="form-row">
                            <label>新密码:</label>
                            <input v-model="editForm.password" type="password" placeholder="请输入新密码（至少6位）"
                                :disabled="loading" />
                        </div>
                    </div>

                    <!-- 学习计划设置 -->
                    <!-- <div class="setting-group">
                        <h4>学习计划</h4>
                        <div class="form-row">
                            <label>每日学习单词数:</label>
                            <input v-model.number="editForm.planStudyWords" type="number" min="10" max="100"
                                placeholder="1-100" :disabled="loading" />
                        </div>
                        <div class="form-row">
                            <label>每日复习单词数:</label>
                            <input v-model.number="editForm.planReviweWords" type="number" min="10" max="50"
                                placeholder="1-50" :disabled="loading" />
                        </div>
                    </div> -->

                    <!-- 操作按钮 -->
                    <div class="form-actions">
                        <button @click="resetForm" :disabled="loading" class="btn-secondary">
                            重置
                        </button>
                        <button @click="saveChanges" :disabled="loading" class="btn-primary">
                            {{ loading ? '保存中...' : '保存更改' }}
                        </button>
                    </div>

                    <!-- 提示信息 -->
                    <div v-if="message" :class="['message', messageType]">
                        {{ message }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserInfo, changeInfo, uploadAvatar } from '@/api/auth'
import { getCheckInStatus } from '@/api/checkin'
import { getFavoriteWords, removeFavoriteWord } from '@/api/favoriteWords'
import { updateUserInfo } from '@/stores/userStore'
import { toast, modal } from '@/utils/toastService'

// 响应式数据
const userInfo = ref({})
const userAvatar = ref('/default-avatar.png')
const loading = ref(false)
const message = ref('')
const messageType = ref('success')
const favoriteWords = ref([])
const fileInput = ref(null)
const avatarUploading = ref(false)
const checkInStatus = ref(null)

const continuousLearningDays = computed(() => {
    return checkInStatus.value?.continuousCheckInDays ?? userInfo.value.streakDays ?? 0
})

// 获取完整头像URL
const getAvatarUrl = (avatarPath) => {
    if (!avatarPath || avatarPath === '/default-avatar.png') {
        // 使用在线默认头像
        return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
    }
    // 如果是完整URL，直接使用
    if (avatarPath.startsWith('http')) {
        return avatarPath
    }
    // 确保路径以/avatars开头
    if (!avatarPath.startsWith('/avatars/')) {
        return '/avatars/' + avatarPath.replace(/^\/+/, '')
    }
    return avatarPath
}

// 编辑表单
const editForm = ref({
    username: '',
    password: '',
    planStudyWords: 10,
    planReviweWords: 5
})

// 原始数据备份
const originalData = ref({})

// 获取用户信息
const fetchUserInfo = async () => {
    try {
        const res = await getUserInfo()
        if (res.data.code === 200) {
            userInfo.value = res.data
            
            // 更新用户头像
            if (res.data.avatar) {
                userAvatar.value = getAvatarUrl(res.data.avatar)
            }

            // 初始化编辑表单
            console.log(res.data);

            editForm.value = {
                username: res.data.username || '',
                password: '',
                planStudyWords: res.data.planStudyWords || 10,
                planReviweWords: res.data.planReviweWords || 5
            }

            // 备份原始数据
            originalData.value = { ...editForm.value }
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
        showMessage('获取用户信息失败', 'error')
    }
}

const fetchCheckInStatus = async () => {
    try {
        const res = await getCheckInStatus()
        if (res.data.code === 200) {
            checkInStatus.value = res.data.data || null
        }
    } catch (error) {
        console.error('获取签到状态失败:', error)
    }
}

// 保存更改
const saveChanges = async () => {
    if (loading.value) return

    // 构建更新数据（只发送有变化的字段）
    const updateData = {}

    if (editForm.value.username !== originalData.value.username) {
        updateData.username = editForm.value.username
    }

    if (editForm.value.password && editForm.value.password.trim()) {
        updateData.password = editForm.value.password
    }

    if (editForm.value.planStudyWords !== originalData.value.planStudyWords) {
        updateData.planStudyWords = editForm.value.planStudyWords
    }

    if (editForm.value.planReviweWords !== originalData.value.planReviweWords) {
        updateData.planReviweWords = editForm.value.planReviweWords
    }

    if (Object.keys(updateData).length === 0) {
        showMessage('没有需要更新的内容', 'warning')
        return
    }

    loading.value = true

    try {
        const res = await changeInfo(updateData)

        if (res.data.code === 200) {
            showMessage('保存成功！', 'success')

            // 更新用户信息
            if (updateData.username) {
                userInfo.value.username = updateData.username
            }

            // 更新原始数据
            originalData.value = { ...editForm.value }

            // 清空密码字段
            editForm.value.password = ''

        } else {
            showMessage(res.data.message || '保存失败', 'error')
        }
    } catch (error) {
        console.error('保存失败:', error)
        showMessage('保存失败，请稍后重试', 'error')
    } finally {
        loading.value = false
    }
}

// 重置表单
const resetForm = () => {
    editForm.value = { ...originalData.value }
    editForm.value.password = '' // 密码字段始终为空
    message.value = ''
}

// 显示消息
const showMessage = (msg, type = 'success') => {
    message.value = msg
    messageType.value = type

    setTimeout(() => {
        message.value = ''
    }, 3000)
}

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return '未知'
    return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取收藏单词列表
const fetchFavoriteWords = async () => {
    try {
        const res = await getFavoriteWords()
        if (res.data.code === 200) {
            favoriteWords.value = res.data.data || []
        }
    } catch (error) {
        console.error('获取收藏单词失败:', error)
    }
}

// 暴露刷新方法，供其他页面调用
window.refreshFavoriteWords = fetchFavoriteWords

// 取消收藏
const handleRemoveFavorite = async (wordId) => {
    try {
        const res = await removeFavoriteWord({ wordId })
    if (res.data.code === 200) {
            toast.success('取消收藏成功')
            await fetchFavoriteWords()
        } else {
            toast.error(res.data.message || '取消收藏失败')
        }
    } catch (error) {
        console.error('取消收藏失败:', error)
        toast.error('取消收藏失败')
    }
}

// 获取状态文本
const getStatusText = (status) => {
    const statusMap = {
        'unknown': '未掌握',
        'vague': '模糊',
        'know': '已掌握'
    }
    return statusMap[status] || status
}

// 触发文件选择
const triggerFileInput = () => {
    if (fileInput.value) {
        fileInput.value.click()
    }
}

// 处理头像上传
const handleAvatarChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
        showMessage('只支持上传JPEG、JPG、PNG或GIF格式的图片', 'error')
        return
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
        showMessage('图片大小不能超过2MB', 'error')
        return
    }

    avatarUploading.value = true
    try {
        const res = await uploadAvatar(file)
        if (res.data.code === 200) {
            const newAvatar = getAvatarUrl(res.data.data.avatar)
            userAvatar.value = newAvatar
            // 更新全局用户信息
            updateUserInfo({ avatar: res.data.data.avatar })
            showMessage('头像上传成功', 'success')
        } else {
            showMessage(res.data.message || '头像上传失败', 'error')
        }
    } catch (error) {
        console.error('上传头像失败:', error)
        showMessage('上传头像失败，请稍后重试', 'error')
    } finally {
        avatarUploading.value = false
        // 清空文件输入
        if (fileInput.value) {
            fileInput.value.value = ''
        }
    }
}

// 组件挂载时获取用户信息和收藏单词
onMounted(() => {
    fetchUserInfo()
    fetchCheckInStatus()
    fetchFavoriteWords()
})
</script>

<style scoped>
.profile-container {
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
}

.profile-header {
    background: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.avatar-section {
    display: flex;
    align-items: center;
    gap: 20px;
}

.avatar-large {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
}

.user-info h2 {
    margin: 0 0 5px 0;
    color: #333;
}

.join-date {
    color: #666;
    margin: 0;
    font-size: 14px;
}

.stats-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.stat-card h3 {
    color: #666;
    margin-bottom: 10px;
    font-size: 14px;
}

.stat-card p {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin: 0;
}

/* 好友管理入口样式 */
.friends-section {
    margin-bottom: 20px;
}

.friends-card {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.friends-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.friends-header h3 {
    margin: 0;
    color: #333;
}

.friends-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
    background: #f9f9f9;
    border-radius: 8px;
    text-align: center;
}

.friends-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.friends-preview p {
    margin: 0 0 20px 0;
    color: #666;
    font-size: 14px;
}

.friends-preview .btn-primary {
    padding: 10px 30px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.3s;
}

.friends-preview .btn-primary:hover {
    background: #45a049;
}

.favorite-section {
    margin-top: 20px;
}

.favorite-header {
    background: #fff;
    padding: 20px 30px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.favorite-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
}

.view-all-link {
    color: #007bff;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s;
}

.view-all-link:hover {
    color: #0056b3;
}

.empty-favorite {
    background: #fff;
    padding: 40px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    color: #999;
}

.empty-favorite .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.favorite-words-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
}

.favorite-word-card {
    background: #fff;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.favorite-word-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.favorite-word-card .word-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.favorite-word-card .word-text {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
    word-break: break-word;
}

.favorite-word-card .remove-btn {
    background: none;
    border: none;
    color: #999;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    transition: color 0.2s;
    flex-shrink: 0;
}

.favorite-word-card .remove-btn:hover {
    color: #ff4d4f;
}

.favorite-word-card .word-meaning {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 12px;
}

.favorite-word-card .word-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
}

.favorite-word-card .word-status {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 10px;
    font-weight: 500;
}

.favorite-word-card .status-unknown {
    background: #fff1f0;
    color: #ff4d4f;
}

.favorite-word-card .status-vague {
    background: #fffbe6;
    color: #faad14;
}

.favorite-word-card .status-know {
    background: #f6ffed;
    color: #52c41a;
}

.favorite-word-card .word-reviews {
    font-size: 12px;
    color: #999;
}

.settings-section {
    margin-top: 20px;
}

.settings-card {
    background: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-card h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 18px;
}

.setting-group {
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
}

.setting-group:last-of-type {
    border-bottom: none;
}

.setting-group h4 {
    margin: 0 0 15px 0;
    color: #555;
    font-size: 16px;
}

.form-row {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    gap: 15px;
}

.form-row label {
    min-width: 140px;
    color: #666;
    font-weight: 500;
}

.form-row input {
    flex: 1;
    max-width: 300px;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s ease;
}

.form-row input:focus {
    outline: none;
    border-color: #007bff;
}

.form-row input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
}

.form-actions {
    display: flex;
    gap: 15px;
    margin-top: 25px;
}

.btn-primary,
.btn-secondary {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #0056b3;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background: #545b62;
}

.btn-primary:disabled,
.btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.message {
    margin-top: 15px;
    padding: 10px 15px;
    border-radius: 4px;
    font-size: 14px;
}

.message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.message.warning {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .stats-section {
        grid-template-columns: 1fr;
    }

    .favorite-header {
        padding: 15px 20px;
    }

    .favorite-words-grid {
        grid-template-columns: 1fr;
    }

    .form-row {
        flex-direction: column;
        align-items: flex-start;
    }

    .form-row label {
        min-width: auto;
        margin-bottom: 5px;
    }

    .form-row input {
        max-width: 100%;
    }

    .form-actions {
        flex-direction: column;
    }
}
</style>
