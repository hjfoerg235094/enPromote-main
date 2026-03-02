import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: () => import('../views/login.vue'),
        },
        {
            path: '/register',
            name: 'Register',
            component: () => import('../views/register.vue'),
        },
        {
            path: '/',
            name: 'Home',
            component: () => import('../views/home.vue'),
        },
        // 特殊访问路由 - 保留原有功能但不在主导航中显示
        {
            path: '/aiChatExer',
            name: 'aiChat',
            component: () => import('../views/aiChatExer.vue'),
            meta: { requiresAuth: true, hidden: true }
        },
        {
            path: '/vocabulary-legacy',
            name: 'VocabularyLegacy',
            component: () => import('../views/vocabulary.vue'),
            meta: { requiresAuth: true, hidden: true }
        },
        {
            path: '/listening-legacy',
            name: 'ListeningLegacy',
            component: () => import('../views/listening.vue'),
            meta: { requiresAuth: true, hidden: true }
        },
        {
            path: '/reading',
            name: 'Reading',
            component: () => import('../views/home.vue'), // 暂时指向首页，后续开发
        },
        {
            path: '/text',
            name: 'Text',
            component: () => import('../views/text.vue'),
        },
        {
            path: '/profile',
            name: 'Profile',
            component: () => import('../views/profile.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/chapters',
            name: 'ChapterSelection',
            component: () => import('../views/ChapterSelection.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/adventure',
            name: 'Adventure',
            component: () => import('../views/adventure.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/adventure-map',
            name: 'AdventureMap',
            component: () => import('../views/AdventureMap.vue'),
            meta: { requiresAuth: true, hidden: true }
        },
        {
            path: '/checkin',
            name: 'CheckIn',
            component: () => import('../views/checkin.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/reviewPlan',
            name: 'ReviewPlan',
            component: () => import('../views/reviewPlan.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/wordReview',
            name: 'WordReview',
            component: () => import('../views/wordReview.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/flashCardReview',
            name: 'FlashCardReview',
            component: () => import('../views/flashCardReview.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/favoriteWords',
            name: 'FavoriteWords',
            component: () => import('../views/favoriteWords.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/daily-report',
            name: 'DailyReport',
            component: () => import('../views/dailyReport.vue'),
            meta: { requiresAuth: true }
        },
        // 剧情模式路由
        {
            path: '/story',
            name: 'StoryMode',
            component: () => import('../views/StoryMode_new.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/story/:storyId',
            name: 'StoryDetail',
            component: () => import('../views/StoryMode_new.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/chapter/:storyId/:chapterId',
            name: 'ChapterView',
            component: () => import('../views/ChapterView_new.vue'),
            meta: { requiresAuth: true }
        }
    ]
})

// 全局前置路由守卫
router.beforeEach((to, from, next) => {
    // 如果路由需要认证
    if (to.meta.requiresAuth) {
        // 检查是否在登录/注册页面
        if (to.path === '/login' || to.path === '/register') {
            next();
            return;
        }

        // 这里可以添加更复杂的认证逻辑
        // 例如检查 localStorage 中的 token 或 session
        // 由于后端使用 session 认证，这里只做基本的路径检查
        next();
    } else {
        next();
    }
})

export default router