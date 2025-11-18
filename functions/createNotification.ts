import { base44 } from '@/api/base44Client';

export async function createNotification({ userEmail, type, title, message, link, relatedId }) {
  try {
    // Check user's notification settings
    const allSettings = await base44.entities.NotificationSettings.list();
    const userSettings = allSettings.find(s => s.user_email === userEmail);
    
    const settingKey = `${type}_notifications`;
    if (userSettings && userSettings[settingKey] === false) {
      return; // User has disabled this type of notification
    }

    await base44.entities.Notification.create({
      user_email: userEmail,
      type,
      title,
      message,
      link,
      related_id: relatedId,
      read: false
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export default createNotification;