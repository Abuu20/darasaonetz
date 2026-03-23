import { useTheme } from '../../context/ThemeContext'
import Toast from './Toast'

export default function ToastContainer() {
  const { toasts, removeToast } = useTheme()

  return (
    <>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          index={index}
        />
      ))}
    </>
  )
}
