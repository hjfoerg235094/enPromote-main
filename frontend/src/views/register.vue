<template>
    <div class="container">
        <div class="form-container">
            <h1>注册</h1>
            <form action="/register" method="post" id="register-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" v-model="username" required>
                </div>
                <div class="form-group">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" v-model="password" required>
                </div>
                <div class="form-group">
                    <label for="confirm-password">确认密码</label>
                    <input type="password" id="confirm-password" name="confirmPassword" v-model="confirmPassword"
                        required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary" @click="clickRegister">注册</button>
                </div>
                <div class="form-footer">
                    <p>已有账号？<RouterLink :to="{ name: 'Login' }">立即登录</RouterLink>
                    </p>
                </div>
            </form>
        </div>
    </div>
</template>
<script setup>
import { ref } from 'vue';
import { register } from '@/api/auth';
import { useRouter } from 'vue-router';
const router = useRouter();
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
function clickRegister(e) {
    e.preventDefault();


    if (username.value === '' || password.value === '' || confirmPassword.value === '') {
        alert('请输入完整信息')
        return
    }
    if (password.value !== confirmPassword.value) {
        alert('两次密码不一致')
        return
    }
    const data = {
        username: username.value,
        password: password.value,
        confirmPassword: confirmPassword.value
    }
    register(data).then(res => {
        console.log(res);
        return res.data
    }).then(data => {
        console.log(data);
        if (data.code !== 200) {
            alert(data.message)
        } else {
            alert('注册成功 跳转登录')
            router.push('/login')
        }
    })
}
</script>
<style scoped>
@import '../assets/css/auth.css';
</style>