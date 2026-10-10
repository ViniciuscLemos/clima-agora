// Answers /api/* with the saved fixtures (see fixtures/make.cjs) instead of the real server.
const weather = require('./fixtures/weather.json');
const cities = require('./fixtures/cities.json');

/** Mocks the API; `delay` holds the weather answer back, to see the loading state. */
async function mockApi(page, { delay = 0, fail = false } = {}) {
  const calls = [];
  await page.route('**/api/cities?*', (route) => {
    const q = new URL(route.request().url()).searchParams.get('q') ?? '';
    route.fulfill({ json: q.toLowerCase().startsWith('s') ? cities : [] });
  });
  await page.route('**/api/weather?*', async (route) => {
    calls.push(new URL(route.request().url()).searchParams.toString());
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (fail) return route.fulfill({ status: 404, json: { error: 'City not found.' } });
    route.fulfill({ json: weather });
  });
  return calls;
}

module.exports = { mockApi, weather };
