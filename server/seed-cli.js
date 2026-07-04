import seedData from './services/seedService.js';

const run = async () => {
  try {
    await seedData();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

run();
