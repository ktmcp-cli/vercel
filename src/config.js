import Conf from 'conf';

const config = new Conf({
  projectName: 'ktmcp-vercel'
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function isConfigured() {
  return !!config.get('apiKey') || !!config.get('baseUrl');
}

export function clearConfig() {
  config.clear();
}
