<template>
  <main class="friends-page">
    <section class="friends-shell">
      <header class="friends-header">
        <div>
          <p class="eyebrow">Friends</p>
          <h1>好友</h1>
          <span>{{ friendsCount }} 位学习伙伴{{ requests.length ? `，${requests.length} 条待处理请求` : '' }}</span>
        </div>
        <div class="header-actions">
          <button v-if="requests.length" class="quiet-button" type="button" @click="showRequestsModal = true">
            好友请求
          </button>
          <button class="primary-button" type="button" @click="openAddFriend">
            添加好友
          </button>
        </div>
      </header>

      <div class="toolbar">
        <input v-model="searchQuery" type="search" placeholder="搜索好友" />
        <button class="quiet-button" type="button" :disabled="friendStore.loading" @click="refreshFriends">
          {{ friendStore.loading ? '刷新中' : '刷新' }}
        </button>
      </div>

      <section class="friends-list" aria-label="好友列表">
        <div v-if="friendStore.loading" class="state-panel">
          <strong>正在加载好友</strong>
          <p>稍等一下，列表马上回来。</p>
        </div>

        <div v-else-if="filteredFriends.length === 0" class="state-panel">
          <strong>{{ searchQuery ? '没有找到匹配的好友' : '还没有好友' }}</strong>
          <p>{{ searchQuery ? '换个关键词试试。' : '添加一个学习伙伴，之后可以互看进度或直接聊天。' }}</p>
          <button v-if="!searchQuery" class="primary-button" type="button" @click="openAddFriend">
            添加好友
          </button>
        </div>

        <template v-else>
          <article v-for="friend in filteredFriends" :key="getFriendId(friend)" class="friend-row">
            <img class="avatar" :src="getAvatarUrl(friend.avatar)" :alt="friend.username" />
            <div class="friend-main">
              <strong>{{ friend.remark || friend.username }}</strong>
              <span v-if="friend.remark">@{{ friend.username }}</span>
              <span v-else>加入于 {{ formatDate(friend.joinDate) }}</span>
            </div>
            <div class="friend-actions">
              <button type="button" @click="startChat(friend)">聊天</button>
              <button type="button" @click="viewProfile(getFriendId(friend))">资料</button>
              <button type="button" @click="editRemark(friend)">备注</button>
              <button class="danger" type="button" @click="deleteFriend(getFriendId(friend))">删除</button>
            </div>
          </article>
        </template>
      </section>
    </section>

    <div v-if="showAddFriendModal" class="modal-overlay" @click="closeAddFriend">
      <section class="modal-card" @click.stop>
        <header class="modal-header">
          <h2>添加好友</h2>
          <button type="button" @click="closeAddFriend">关闭</button>
        </header>
        <div class="add-search">
          <input
            v-model="addFriendSearchQuery"
            type="search"
            placeholder="输入用户名"
            @keyup.enter="handleSearchUser"
          />
          <button
            class="primary-button"
            type="button"
            :disabled="friendStore.searchLoading || !addFriendSearchQuery.trim()"
            @click="handleSearchUser"
          >
            {{ friendStore.searchLoading ? '搜索中' : '搜索' }}
          </button>
        </div>
        <div class="modal-list">
          <p v-if="!friendStore.searchResults.length" class="modal-empty">搜索后会在这里显示用户。</p>
          <article v-for="user in friendStore.searchResults" :key="user.id" class="compact-row">
            <img class="avatar small" :src="getAvatarUrl(user.avatar)" :alt="user.username" />
            <div>
              <strong>{{ user.username }}</strong>
              <span>加入于 {{ formatDate(user.joinDate) }}</span>
            </div>
            <button
              v-if="!user.isFriend"
              class="primary-button small-button"
              type="button"
              @click="sendRequest(user.id)"
            >
              添加
            </button>
            <span v-else class="muted">已是好友</span>
          </article>
        </div>
      </section>
    </div>

    <div v-if="showRequestsModal" class="modal-overlay" @click="showRequestsModal = false">
      <section class="modal-card" @click.stop>
        <header class="modal-header">
          <h2>好友请求</h2>
          <button type="button" @click="showRequestsModal = false">关闭</button>
        </header>
        <div class="modal-list">
          <p v-if="!requests.length" class="modal-empty">暂无待处理请求。</p>
          <article v-for="request in requests" :key="request.id" class="compact-row">
            <img class="avatar small" :src="getAvatarUrl(request.avatar)" :alt="request.username" />
            <div>
              <strong>{{ request.username }}</strong>
              <span>{{ request.message || formatDate(request.createTime) }}</span>
            </div>
            <div class="inline-actions">
              <button class="primary-button small-button" type="button" @click="handleAccept(request.id)">接受</button>
              <button class="quiet-button small-button" type="button" @click="handleReject(request.id)">拒绝</button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div v-if="showRemarkModal" class="modal-overlay" @click="showRemarkModal = false">
      <section class="modal-card narrow" @click.stop>
        <header class="modal-header">
          <h2>设置备注</h2>
          <button type="button" @click="showRemarkModal = false">关闭</button>
        </header>
        <input v-model="remarkText" class="remark-input" type="text" maxlength="20" placeholder="备注名称" />
        <div class="modal-actions">
          <button class="quiet-button" type="button" @click="showRemarkModal = false">取消</button>
          <button class="primary-button" type="button" @click="handleSaveRemark">保存</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '@/stores/friendStore'
import { toast } from '@/utils/toastService'

const router = useRouter()
const friendStore = useFriendStore()

const showAddFriendModal = ref(false)
const showRequestsModal = ref(false)
const showRemarkModal = ref(false)
const searchQuery = ref('')
const addFriendSearchQuery = ref('')
const remarkText = ref('')
const currentFriend = ref(null)

const requests = computed(() => friendStore.requests || [])
const friendsCount = computed(() => friendStore.friends?.length || 0)

const filteredFriends = computed(() => {
  const friends = Array.isArray(friendStore.friends) ? friendStore.friends : []
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return friends

  return friends.filter((friend) => {
    const name = `${friend.remark || ''} ${friend.username || ''}`.toLowerCase()
    return name.includes(query)
  })
})

onMounted(async () => {
  await refreshFriends()
  friendStore.fetchRequests(true).catch(() => {
    toast.error('好友请求加载失败')
  })
})

function getFriendId(friend) {
  return friend?.id || friend?._id || friend?.userId
}

function openAddFriend() {
  addFriendSearchQuery.value = ''
  friendStore.searchResults = []
  showAddFriendModal.value = true
}

function closeAddFriend() {
  showAddFriendModal.value = false
  addFriendSearchQuery.value = ''
  friendStore.searchResults = []
}

async function refreshFriends() {
  try {
    await friendStore.fetchFriends(undefined, true)
  } catch (error) {
    console.error('加载好友列表失败:', error)
    toast.error('好友列表加载失败')
  }
}

async function handleSearchUser() {
  const keyword = addFriendSearchQuery.value.trim()
  if (!keyword) return

  try {
    await friendStore.searchUser(keyword)
  } catch (error) {
    console.error('搜索用户失败:', error)
    toast.error('搜索失败，请稍后重试')
  }
}

async function sendRequest(userId) {
  try {
    const result = await friendStore.sendRequest(userId)
    toast[result.success ? 'success' : 'error'](result.message)
    if (result.success) closeAddFriend()
  } catch (error) {
    console.error('发送好友请求失败:', error)
    toast.error('发送失败，请稍后重试')
  }
}

async function handleAccept(requestId) {
  try {
    const result = await friendStore.acceptRequest(requestId)
    toast[result.success ? 'success' : 'error'](result.message)
    if (!requests.value.length) showRequestsModal.value = false
  } catch (error) {
    console.error('接受好友请求失败:', error)
    toast.error('操作失败，请稍后重试')
  }
}

async function handleReject(requestId) {
  try {
    const result = await friendStore.rejectRequest(requestId)
    toast[result.success ? 'success' : 'error'](result.message)
    if (!requests.value.length) showRequestsModal.value = false
  } catch (error) {
    console.error('拒绝好友请求失败:', error)
    toast.error('操作失败，请稍后重试')
  }
}

function startChat(friend) {
  router.push({
    path: '/chat',
    query: {
      friendId: getFriendId(friend),
      friendName: friend.remark || friend.username
    }
  })
}

function viewProfile(friendId) {
  router.push(`/profile/${friendId}`)
}

function editRemark(friend) {
  currentFriend.value = friend
  remarkText.value = friend.remark || ''
  showRemarkModal.value = true
}

async function handleSaveRemark() {
  if (!currentFriend.value) return

  try {
    const result = await friendStore.setRemark(getFriendId(currentFriend.value), remarkText.value.trim())
    toast[result.success ? 'success' : 'error'](result.message)
    if (result.success) showRemarkModal.value = false
  } catch (error) {
    console.error('保存备注失败:', error)
    toast.error('保存失败，请稍后重试')
  }
}

async function deleteFriend(friendId) {
  try {
    const result = await friendStore.deleteFriend(friendId)
    toast[result.success ? 'success' : 'error'](result.message)
  } catch (error) {
    console.error('删除好友失败:', error)
    toast.error('删除失败，请稍后重试')
  }
}

function getAvatarUrl(avatarPath) {
  if (!avatarPath || avatarPath === '/default-avatar.png') {
    return 'https://api.dicebear.com/7.x/initials/svg?seed=friend'
  }
  if (avatarPath.startsWith('http')) return avatarPath
  if (!avatarPath.startsWith('/avatars/')) return `/avatars/${avatarPath.replace(/^\/+/, '')}`
  return avatarPath
}

function formatDate(value) {
  if (!value) return '未知'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知'
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.friends-page {
  min-height: 100%;
  padding: 28px clamp(16px, 4vw, 48px);
  background:
    radial-gradient(circle at top left, rgba(31, 138, 112, 0.08), transparent 32%),
    var(--learn-bg, #f7f3ea);
  color: var(--learn-ink, #24322f);
}

.friends-shell {
  display: grid;
  gap: 18px;
  max-width: 980px;
  margin: 0 auto;
}

.friends-header,
.toolbar,
.friend-row,
.modal-card {
  border: 1px solid var(--learn-line, rgba(36, 50, 47, 0.12));
  background: rgba(255, 253, 247, 0.94);
  box-shadow: var(--learn-shadow-soft, 0 18px 48px rgba(36, 50, 47, 0.08));
}

.friends-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding: 26px;
  border-radius: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--learn-primary, #1f8a70);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.friends-header h1 {
  margin: 0;
  font-size: clamp(34px, 6vw, 56px);
  line-height: 1;
}

.friends-header span,
.friend-main span,
.compact-row span,
.modal-empty,
.state-panel p {
  color: var(--learn-muted, #6d7b75);
  font-size: 14px;
}

.header-actions,
.friend-actions,
.inline-actions,
.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  min-height: 38px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  font-weight: 900;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.primary-button {
  background: var(--learn-primary, #1f8a70);
  color: #fff;
}

.quiet-button,
.friend-actions button,
.modal-header button {
  background: rgba(31, 138, 112, 0.09);
  color: var(--learn-primary-dark, #146352);
}

.friend-actions .danger {
  background: rgba(233, 104, 91, 0.12);
  color: var(--learn-coral, #d65f52);
}

.toolbar {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
}

input {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--learn-line, rgba(36, 50, 47, 0.12));
  border-radius: 14px;
  padding: 0 14px;
  background: #fff;
  color: var(--learn-ink, #24322f);
  font: inherit;
  outline: none;
}

input:focus {
  border-color: rgba(31, 138, 112, 0.45);
}

.friends-list {
  display: grid;
  gap: 10px;
}

.friend-row,
.compact-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.friend-row {
  padding: 14px;
  border-radius: 18px;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--learn-green-soft, #dff3e8);
}

.avatar.small {
  width: 42px;
  height: 42px;
}

.friend-main,
.compact-row div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.friend-main strong,
.compact-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-actions button {
  min-height: 34px;
  padding: 0 12px;
}

.state-panel {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-height: 240px;
  padding: 38px 18px;
  border: 1px dashed rgba(31, 138, 112, 0.24);
  border-radius: 22px;
  background: rgba(255, 253, 247, 0.72);
  text-align: center;
}

.state-panel strong {
  font-size: 24px;
}

.state-panel p {
  margin: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(18, 28, 25, 0.34);
}

.modal-card {
  display: grid;
  gap: 16px;
  width: min(560px, 100%);
  max-height: min(720px, 88vh);
  overflow: auto;
  padding: 20px;
  border-radius: 22px;
}

.modal-card.narrow {
  width: min(420px, 100%);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
}

.add-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.modal-list {
  display: grid;
  gap: 10px;
}

.compact-row {
  padding: 12px;
  border: 1px solid var(--learn-line, rgba(36, 50, 47, 0.12));
  border-radius: 16px;
  background: #fff;
}

.small-button {
  min-height: 34px;
  padding: 0 12px;
}

.muted {
  color: var(--learn-muted, #6d7b75);
  font-weight: 800;
}

.remark-input {
  min-height: 46px;
}

@media (max-width: 720px) {
  .friends-header,
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .friend-row,
  .compact-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .friend-actions,
  .inline-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 480px) {
  .friends-page {
    padding: 16px;
  }

  .friends-header {
    padding: 20px;
  }

  .add-search {
    grid-template-columns: 1fr;
  }

  .friend-actions button {
    flex: 1 1 calc(50% - 6px);
  }
}
</style>
