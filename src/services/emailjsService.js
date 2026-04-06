import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'wnxw_ncfAXcdzmJ6G', // Get from EmailJS dashboard
  SERVICE_ID: 'service_twicxjf', // Get from Email Services
  TEMPLATE_ID: 'template_n1nxmnj' // Get from Email Templates
};

class EmailJSService {
  constructor() {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  }

  // Send verification email
  async sendVerificationEmail(email, fullName, verificationToken) {
    const verificationUrl = `${window.location.origin}/verify-email?token=${verificationToken}`;
    
    const templateParams = {
      to_email: email,
      full_name: fullName,
      verification_url: verificationUrl,
      to_name: fullName
    };

    try {
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );
      
      if (response.status === 200) {
        return { success: true, message: 'Verification email sent' };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('EmailJS error:', error);
      return { success: false, error: error.text || error.message };
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email, fullName, role) {
    // Create a separate template for welcome emails
    const welcomeTemplateParams = {
      to_email: email,
      full_name: fullName,
      role: role,
      dashboard_url: `${window.location.origin}/${role}/dashboard`
    };

    try {
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        'YOUR_WELCOME_TEMPLATE_ID', // Create another template
        welcomeTemplateParams
      );
      
      return { success: response.status === 200 };
    } catch (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, fullName, resetToken) {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
    
    const resetParams = {
      to_email: email,
      full_name: fullName,
      reset_url: resetUrl
    };

    try {
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        'YOUR_RESET_TEMPLATE_ID', // Create another template
        resetParams
      );
      
      return { success: response.status === 200 };
    } catch (error) {
      console.error('Reset email error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailJSService();