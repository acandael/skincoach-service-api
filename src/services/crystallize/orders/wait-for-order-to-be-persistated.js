const { callOrdersApi } = require("../utils");

/**
 * Wait for a Crystallize order to be persisted and queryable
 * Crystallize has eventual consistency, so orders may not be immediately queryable after creation
 *
 * @param {Object} params
 * @param {string} params.id - The order ID to wait for
 * @param {number} params.maxRetries - Maximum number of retries (default: 30)
 * @param {number} params.retryDelayMs - Delay between retries in milliseconds (default: 1000)
 * @returns {Promise<void>}
 */
module.exports = function waitForOrderToBePersistated({
  id,
  maxRetries = 30,
  retryDelayMs = 1000
}) {
  let retries = 0;

  return new Promise((resolve, reject) => {
    (async function check() {
      try {
        const response = await callOrdersApi({
          query: `
            {
              orders {
                get(id: "${id}") {
                  id
                  createdAt
                }
              }
            }
          `,
        });

        if (response.data && response.data.orders.get) {
          console.log(`Order ${id} persisted successfully after ${retries} retries`);
          resolve();
        } else {
          retries += 1;
          if (retries > maxRetries) {
            // After max retries, we resolve anyway since the order was created
            // The eventual consistency will catch up
            console.warn(`Order ${id} persistence check timed out after ${maxRetries} retries, but order was created`);
            resolve();
          } else {
            console.log(`Order ${id} not yet queryable, retry ${retries}/${maxRetries}...`);
            setTimeout(check, retryDelayMs);
          }
        }
      } catch (error) {
        retries += 1;
        if (retries > maxRetries) {
          // After max retries, we resolve anyway since the order was created
          console.warn(`Order ${id} persistence check failed after ${maxRetries} retries:`, error.message);
          resolve();
        } else {
          console.log(`Order ${id} check error, retry ${retries}/${maxRetries}:`, error.message);
          setTimeout(check, retryDelayMs);
        }
      }
    })();
  });
};
