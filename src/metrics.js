const { metrics } = require('@opentelemetry/api');

const meter = metrics.getMeter('storejs-business');

const puppiesCreated = meter.createCounter('store.puppies.created', {
  description: 'Total number of puppies created',
});

const puppiesDeleted = meter.createCounter('store.puppies.deleted', {
  description: 'Total number of puppies deleted',
});

const puppiesTotal = meter.createUpDownCounter('store.puppies.total', {
  description: 'Current number of puppies in the store',
});

module.exports = { puppiesCreated, puppiesDeleted, puppiesTotal };
