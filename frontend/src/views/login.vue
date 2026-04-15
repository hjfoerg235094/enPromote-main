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
import { login } from '@/api/auth';
import { getUserInfo } from '@/stores/userStore';
const username = ref('');
const password = ref('');
function clickLogin(e) {
    e.preventDefault();
    
    const data = {
        username: username.value,
        password: password.value
    }
    // api请求
    login(data).then(async res => {
        console.log(res);
        if (res.data.code === 200) {
            // 登录成功，获取用户信息
            const userInfo = await getUserInfo(true);
            if (userInfo) {
                window.location.href = '/'
            } else {
                alert('获取用户信息失败，请重试')
            }
        } else {
            // 登录失败
            alert(res.data.message)
        }
    }).catch(err => {
        console.log(err);
        alert('登录失败，请检查网络连接')
    });
}
</script>
<style scoped>
@import '../assets/css/auth.css';
</style>