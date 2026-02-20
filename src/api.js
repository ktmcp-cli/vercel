import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.vercel.com';

function getClient() {
  const apiKey = getConfig('apiKey');
  const baseUrl = getConfig('baseUrl') || BASE_URL;
  
  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
      'Content-Type': 'application/json'
    }
  });
}

export async function makeRequest(method, path, data = null, params = null) {
  const client = getClient();
  try {
    const response = await client.request({
      method,
      url: path,
      data,
      params
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}
