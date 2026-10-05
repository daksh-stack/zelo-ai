import { postGrowthEvent } from '../api/growth';

export function trackEvent(name, props = {}) {
  postGrowthEvent({ name, props }).catch(() => {});
}
