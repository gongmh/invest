<template>
  <Transition name="modal">
    <div v-if="visible" class="confirm-overlay" @click="handleCancel">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-icon-wrapper">
          <div class="confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        <h3 class="confirm-title">确认删除</h3>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-footer">
          <button class="btn-cancel" @click="handleCancel">取消</button>
          <button class="btn-confirm" @click="handleConfirm">确认删除</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: '确定要执行此操作吗？'
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const handleConfirm = () => {
      emit('confirm')
    }
    
    const handleCancel = () => {
      emit('cancel')
    }
    
    return {
      handleConfirm,
      handleCancel
    }
  }
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.confirm-dialog {
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  min-width: 340px;
  max-width: 420px;
  padding: 32px 28px 24px;
  text-align: center;
}

.confirm-icon-wrapper {
  margin-bottom: 20px;
}

.confirm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #ef4444;
}

.confirm-icon svg {
  width: 32px;
  height: 32px;
}

.confirm-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1f36;
}

.confirm-message {
  margin: 0 0 28px 0;
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
}

.confirm-footer {
  display: flex;
  gap: 12px;
}

.btn-cancel {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  background-color: white;
  color: #6b7280;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
  color: #374151;
}

.btn-confirm {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45);
}

.btn-confirm:active {
  transform: translateY(0);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirm-dialog,
.modal-leave-to .confirm-dialog {
  transform: scale(0.9) translateY(-20px);
}

.modal-enter-active .confirm-dialog,
.modal-leave-active .confirm-dialog {
  transition: all 0.3s ease;
}

@media screen and (max-width: 480px) {
  .confirm-dialog {
    min-width: 300px;
    padding: 28px 20px 20px;
  }
  
  .confirm-icon {
    width: 56px;
    height: 56px;
  }
  
  .confirm-icon svg {
    width: 28px;
    height: 28px;
  }
  
  .confirm-title {
    font-size: 18px;
  }
  
  .confirm-message {
    font-size: 14px;
    margin-bottom: 24px;
  }
  
  .btn-cancel,
  .btn-confirm {
    padding: 11px 16px;
    font-size: 14px;
  }
}
</style>
