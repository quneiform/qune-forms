export {computeLocally as computeRequest} from '/browser-compute.js?v=db34a3d597e21e06';
export async function loadConfig() {
  const response = await fetch('/config.json?v=db34a3d597e21e06');
  if (!response.ok) throw Error('Configuration unavailable');
  return response.json();
}
