<template>
    <div class="container">
        <div class="form-container">
            <h1>注册</h1>
            <form @submit.prevent="clickRegister" id="register-form">
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

                    <!-- 密码强度指示器 -->
                    <div v-if="password.length > 0" class="password-strength-container">
                        <div class="password-strength-text">
                            <span>密码强度：</span>
                            <span :class="strengthClass" class="strength-label">{{ strengthText }}</span>
                        </div>
                        <div class="password-strength-bars">
                            <div class="strength-bar" :class="{ 'weak': strengthScore >= 1, 'medium': strengthScore >= 2, 'strong': strengthScore >= 3 }"></div>
                            <div class="strength-bar" :class="{ 'medium': strengthScore >= 2, 'strong': strengthScore >= 3 }"></div>
                            <div class="strength-bar" :class="{ 'strong': strengthScore >= 3 }"></div>
                        </div>
                    </div>
                </div>

                <!-- 确认密码 -->
                <div class="form-group">
                    <label for="confirm-password">确认密码</label>
                    <div class="password-input-wrapper">
                        <input 
                            :type="showConfirmPassword ? 'text' : 'password'" 
                            id="confirm-password" 
                            name="confirmPassword" 
                            v-model="confirmPassword"
                            :class="{ 'is-invalid': confirmPasswordTouched && !confirmPasswordValid }"
                            @blur="confirmPasswordTouched = true"
                            required
                        >
                        <button 
                            type="button" 
                            class="password-toggle-btn" 
                            @click="showConfirmPassword = !showConfirmPassword"
                            :title="showConfirmPassword ? '隐藏密码' : '显示密码'"
                        >
                            <!-- 眼睛图标 -->
                            <svg v-if="showConfirmPassword" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                            <svg v-else viewBox="0 0 24 24">
                                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92c1.51-1.39 2.7-3.14 3.44-5.12-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 2.2 0 4.26-.6 6.04-1.63l.47.47 2.66 2.66 1.27-1.27L3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                            </svg>
                        </button>
                    </div>
                    <span v-if="confirmPasswordTouched && !confirmPasswordValid" class="error-feedback">
                        {{ confirmPasswordError }}
                    </span>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary" :disabled="loading || !isFormValid">
                        <span class="btn-content">
                            <span v-if="loading" class="spinner"></span>
                            <span>{{ loading ? '注册中...' : '注册' }}</span>
                        </span>
                    </button>
                </div>
                <div class="form-footer">
                    <p>已有账号？<RouterLink :to="{ name: 'Login' }">立即登录</RouterLink></p>
                </div>
            </form>
        </div>
    </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { register } from '@/api/auth';
import { useRouter } from 'vue-router';
import { toast } from '@/utils/toastService';

const router = useRouter();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');

// 交互与状态控制
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const usernameTouched = ref(false);
const passwordTouched = ref(false);
const confirmPasswordTouched = ref(false);

// 校验规则
const usernameValid = computed(() => username.value.trim().length > 0);
const passwordValid = computed(() => password.value.length >= 6);

const confirmPasswordValid = computed(() => {
    if (confirmPassword.value === '') return false;
    return password.value === confirmPassword.value;
});

const confirmPasswordError = computed(() => {
    if (confirmPassword.value === '') return '请输入确认密码';
    if (password.value !== confirmPassword.value) return '两次密码输入不一致';
    return '';
});

// 计算密码强度评分 (0 到 3)
const strengthScore = computed(() => {
    const pwd = password.value;
    if (pwd.length < 6) return 0;
    
    let score = 1; // 长度大于等于 6 获得基础分 1
    
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    
    // 如果同时包含字母和数字，得 2 分
    if (hasLetters && hasNumbers) {
        score = 2;
    }
    
    // 包含字母、数字且长度 >= 8，或包含特殊字符，得 3 分
    if ((hasLetters && hasNumbers && hasSpecial) || (hasLetters && hasNumbers && pwd.length >= 8)) {
        score = 3;
    }
    
    return score;
});

const strengthText = computed(() => {
    const score = strengthScore.value;
    if (score === 1) return '弱';
    if (score === 2) return '中';
    if (score === 3) return '强';
    return '无';
});

const strengthClass = computed(() => {
    const score = strengthScore.value;
    if (score === 1) return 'weak';
    if (score === 2) return 'medium';
    if (score === 3) return 'strong';
    return '';
});

const isFormValid = computed(() => {
    return usernameValid.value && passwordValid.value && confirmPasswordValid.value;
});

function clickRegister() {
    if (!isFormValid.value) {
        usernameTouched.value = true;
        passwordTouched.value = true;
        confirmPasswordTouched.value = true;
        toast.error('请检查输入信息');
        return;
    }

    loading.value = true;
    const data = {
        username: username.value,
        password: password.value,
        confirmPassword: confirmPassword.value
    };

    register(data)
        .then(res => {
            console.log(res);
            return res.data;
        })
        .then(data => {
            console.log(data);
            if (data.code !== 200) {
                toast.error(data.message);
            } else {
                toast.success('注册成功，即将跳转到登录页');
                router.push('/login');
            }
        })
        .catch(err => {
            console.log('注册错误:', err);
            toast.error('注册失败，请检查网络连接');
        })
        .finally(() => {
            loading.value = false;
        });
}
</script>
<style scoped>
@import '../assets/css/auth.css';
</style>