export function calculateRemainingTime(poll) {
  if (!poll || !poll.duration || !poll.durationUnit || !poll.createdAt) {
    return 'N/A';
  }
  
  const now = new Date();
  const createdAt = new Date(poll.createdAt);
  
  switch (poll.durationUnit) {
    case 'minutes':
      createdAt.setMinutes(createdAt.getMinutes() + poll.duration);
      break;
    case 'hours':
      createdAt.setHours(createdAt.getHours() + poll.duration);
      break;
    case 'days':
      createdAt.setDate(createdAt.getDate() + poll.duration);
      break;
    default:
      return 'N/A';
  }
  
  const remainingTimeMs = createdAt - now;
  
  if (remainingTimeMs <= 0) {
    return 'Expired';
  }
  
  return Math.floor(remainingTimeMs / 1000);
}

export function formatRemainingTime(remainingTime, durationUnit) {
  if (remainingTime === 'Expired' || remainingTime <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(remainingTime / (60 * 60 * 24));
  remainingTime %= 60 * 60 * 24;
  
  const hours = Math.floor(remainingTime / (60 * 60));
  remainingTime %= 60 * 60;
  
  const minutes = Math.floor(remainingTime / 60);
  remainingTime %= 60;
  
  const seconds = Math.floor(remainingTime);
  
  let formattedTime = '';
  
  if (days > 0) {
    formattedTime += `${days} D :  `;
  }
  
  if (hours > 0) {
    formattedTime += `${hours} H :  `;
  }
  
  if (minutes > 0) {
    formattedTime += `${minutes} M :  `;
  }
  
  if (seconds > 0) {
    formattedTime += `${seconds} S`;
  }
  
  return formattedTime.trim() || 'Expired';
}