<template>
    <div class="container">
        <div class="form-container">
            <h1>登录</h1>
            <form action="/login" method="post" id="login-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" v-model="username" required>
                </div>
                <div class="form-group">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" v-model="password" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary" @click="clickLogin">登录</button>
                </div>
                <div class="form-footer">
                    <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
                </div>
            </form>
        </div>
    </div>
</template>
<script setup>
import { ref } from 'vue';
import { login, getUserInfo as fetchUserInfo } from '@/api/auth';
const username = ref('');
const password = ref('');
async function clickLogin(e) {
    e.preventDefault();

    const data = {
        username: username.value,
        password: password.value
    }
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
                window.location.href = '/'
            } else {
                alert('获取用户信息失败: ' + (userInfoRes.data.message || '未知错误'))
            }
        } else {
            // 登录失败
            alert(res.data.message)
        }
    } catch (err) {
        console.log('登录错误:', err);
        alert('登录失败，请检查网络连接')
    };
}
</script>
<style scoped>
@import '../assets/css/auth.css';
</style>
