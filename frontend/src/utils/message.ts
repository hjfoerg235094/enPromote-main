import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

/**
 * 成功提示
 * @param message 提示内容
 */
export const showSuccess = (message: string) => {
  ElMessage({
    message,
    type: 'success',
    duration: 3000
  })
}

/**
 * 警告提示
 * @param message 提示内容
 */
export const showWarning = (message: string) => {
  ElMessage({
    message,
    type: 'warning',
    duration: 3000
  })
}

/**
 * 错误提示
 * @param message 提示内容
 */
export const showError = (message: string) => {
  ElMessage({
    message,
    type: 'error',
    duration: 3000
  })
}

/**
 * 信息提示
 * @param message 提示内容
 */
export const showInfo = (message: string) => {
  ElMessage({
    message,
    type: 'info',
    duration: 3000
  })
}

/**
 * 确认对话框
 * @param message 提示内容
 * @param title 标题
 * @returns Promise<boolean> 用户是否确认
 */
export const showConfirm = (message: string, title = '提示') => {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
}

/**
 * 通知提示
 * @param title 标题
 * @param message 内容
 * @param type 类型
 */
export const showNotification = (
  title: string,
  message: string,
  type: 'success' | 'warning' | 'info' | 'error' = 'info'
) => {
  ElNotification({
    title,
    message,
    type,
    duration: 3000
  })
}
