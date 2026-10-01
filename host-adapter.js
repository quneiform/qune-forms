export {computeLocally as computeRequest} from '/browser-compute.js?v=5fea13f54caaaca7';
export async function loadConfig() {
  const response = await fetch('/config.json?v=5fea13f54caaaca7');
  if (!response.ok) throw Error('Configuration unavailable');
  return response.json();
}
