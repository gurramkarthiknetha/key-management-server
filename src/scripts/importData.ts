import seedData from './seedData';

// Import data script - calls the seedData function
const main = async () => {
  try {
    await seedData();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
};

main();