<template>
    <div class="container">
        <div class="form-container">
            <h1>登录</h1>
            <form @submit.prevent="clickLogin" id="login-form">
                <!-- 用户名 -->
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        v-model="username" 
                        :class="{ 'is-invalid': usernameTouched && !usernameValid }"
                        @blur="usernameTouched = true"
                        required
                    >
                    <span v-if="usernameTouched && !usernameValid" class="error-feedback">
                        请输入用户名
                    </span>
                </div>

                <!-- 密码 -->
                <div class="form-group">
                    <label for="password">密码</label>
                    <div class="password-input-wrapper">
                        <input 
                            :type="showPassword ? 'text' : 'password'" 
                            id="password" 
                            name="password" 
                            v-model="password" 
                            :class="{ 'is-invalid': passwordTouched && !passwordValid }"
                            @blur="passwordTouched = true"
                            required
                        >
                        <button 
                            type="button" 
                            class="password-toggle-btn" 
                            @click="showPassword = !showPassword"
                            :title="showPassword ? '隐藏密码' : '显示密码'"
                        >
                            <!-- 眼睛图标 -->
                            <svg v-if="showPassword" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                            <svg v-else viewBox="0 0 24 24">
                                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92c1.51-1.39 2.7-3.14 3.44-5.12-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 2.2 0 4.26-.6 6.04-1.63l.47.47 2.66 2.66 1.27-1.27L3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                            </svg>
                        </button>
                    </div>
                    <span v-if="passwordTouched && !passwordValid" class="error-feedback">
                        密码长度不能少于6位
                    </span>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary" :disabled="loading || !isFormValid">
                        <span class="btn-content">
                            <span v-if="loading" class="spinner"></span>
                            <span>{{ loading ? '登录中...' : '登录' }}</span>
                        </span>
                    </button>
                </div>
                <div class="form-footer">
                    <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
                </div>
            </form>
        </div>
    </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { login, getUserInfo as fetchUserInfo } from '@/api/auth';
import { toast } from '@/utils/toastService';

const username = ref('');
const password = ref('');

// 交互与状态控制
const showPassword = ref(false);
const loading = ref(false);
const usernameTouched = ref(false);
const passwordTouched = ref(false);

// 校验规则
const usernameValid = computed(() => username.value.trim().length > 0);
const passwordValid = computed(() => password.value.length >= 6);
const isFormValid = computed(() => usernameValid.value && passwordValid.value);

async function clickLogin() {
    if (!isFormValid.value) {
        usernameTouched.value = true;
        passwordTouched.value = true;
        toast.error('请检查输入信息');
        return;
    }

    loading.value = true;
    const data = {
        username: username.value,
        password: password.value
    };

    try {
        // api请求
        const res = await login(data);
        console.log('登录响应:', res);
        if (res.data.code === 200) {
            // 登录成功，直接使用API获取用户信息
            const userInfoRes = await fetchUserInfo();
            console.log('用户信息响应:', userInfoRes);
            if (userInfoRes.data.code === 200) {
                // 跳转到首页
                window.location.href = '/';
            } else {
                toast.error('获取用户信息失败: ' + (userInfoRes.data.message || '未知错误'));
            }
        } else {
            // 登录失败
            toast.error(res.data.message);
        }
    } catch (err) {
        console.log('登录错误:', err);
        toast.error('登录失败，请检查网络连接');
    } finally {
        loading.value = false;
    }
}
</script>
<style scoped>
@import '../assets/css/auth.css';
</style>
