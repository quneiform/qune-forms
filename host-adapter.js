export {computeLocally as computeRequest} from '/browser-compute.js?v=23d17983c1a87e0b';
export async function loadConfig() {
  const response = await fetch('/config.json?v=23d17983c1a87e0b');
  if (!response.ok) throw Error('Configuration unavailable');
  return response.json();
}
