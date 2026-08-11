const VK_LINK_REGEX = /^https?:\/\/(www\.)?(vk\.com|vk\.ru|vkontakte\.ru)\/[a-zA-Z0-9_.]{2,}$/;

export const isValidVkLink = (value: string): boolean => {
  if (!value) return false;
  return VK_LINK_REGEX.test(value.trim());
};

export const VK_LINK_ERROR_MESSAGE = 'Введите корректную ссылку на профиль ВК, например: https://vk.com/username';
