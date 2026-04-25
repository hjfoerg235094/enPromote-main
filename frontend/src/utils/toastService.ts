import { createApp, ref, h } from 'vue'
import Toast from '@/components/Toast.vue'
import Modal from '@/components/Modal.vue'

// Toast 实例
let toastInstance: any = null

// 创建 Toast 实例
function createToastInstance() {
  if (!toastInstance) {
    const toastContainer = document.getElementById('toast-container')
    if (!toastContainer) {
      console.error('Toast container not found')
      return null
    }
    const app = createApp(Toast)
    toastInstance = app.mount(toastContainer)
  }
  return toastInstance
}

// Toast 方法
export const toast = {
  success(message: string, duration: number = 3000) {
    const instance = createToastInstance()
    return instance?.addToast(message, 'success', duration)
  },
  error(message: string, duration: number = 3000) {
    const instance = createToastInstance()
    return instance?.addToast(message, 'error', duration)
  },
  warning(message: string, duration: number = 3000) {
    const instance = createToastInstance()
    return instance?.addToast(message, 'warning', duration)
  },
  info(message: string, duration: number = 3000) {
    const instance = createToastInstance()
    return instance?.addToast(message, 'info', duration)
  }
}

// Modal 相关
let modalContainer: HTMLElement | null = null
let modalApp: any = null
let modalResolve: ((value?: any) => void) | null = null
let modalReject: ((reason?: any) => void) | null = null

function getModalContainer(): HTMLElement | null {
  return document.getElementById('modal-container')
}

interface ModalOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  showFooter?: boolean
  closeOnClickOverlay?: boolean
  footer?: any
}

export const modal = {
  confirm(options: ModalOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      modalResolve = resolve
      modalReject = reject

      const container = getModalContainer()
      if (!container) {
        console.error('Modal container not found')
        reject()
        return
      }

      // 清除之前的 modal
      container.innerHTML = ''

      const props = {
        visible: true,
        title: options.title || '提示',
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        showFooter: true,
        closeOnClickOverlay: options.closeOnClickOverlay !== false
      }

      const app = createApp({
        render() {
          return h(Modal, {
            ...props,
            'onUpdate:visible': (val: boolean) => {
              if (!val) {
                reject()
                cleanup()
              }
            },
            onConfirm: () => {
              resolve()
              cleanup()
            },
            onCancel: () => {
              reject()
              cleanup()
            },
            onClose: () => {
              reject()
              cleanup()
            }
          }, {
            default: () => options.message || '',
            footer: options.footer ? () => options.footer : undefined
          })
        }
      })

      modalApp = app
      app.mount(container)
    })
  },
  showAlert(options: ModalOptions): Promise<void> {
    return new Promise((resolve) => {
      modalResolve = resolve

      const container = getModalContainer()
      if (!container) {
        console.error('Modal container not found')
        resolve()
        return
      }
      container.innerHTML = ''

      const props = {
        visible: true,
        title: options.title || '提示',
        confirmText: options.confirmText || '确定',
        cancelText: '',
        showFooter: true,
        closeOnClickOverlay: options.closeOnClickOverlay !== false
      }

      const app = createApp({
        render() {
          return h(Modal, {
            ...props,
            'onUpdate:visible': (val: boolean) => {
              if (!val) {
                resolve()
                cleanup()
              }
            },
            onConfirm: () => {
              resolve()
              cleanup()
            },
            onClose: () => {
              resolve()
              cleanup()
            }
          }, {
            default: () => options.message || ''
          })
        }
      })

      modalApp = app
      app.mount(container)
    })
  }
}

function cleanup() {
  if (modalApp) {
    modalApp.unmount()
    modalApp = null
  }
  if (modalContainer) {
    modalContainer.innerHTML = ''
  }
  modalResolve = null
  modalReject = null
}
