const { createTableIfNotExists, seedTestData } = require("./dynamo");

(async () => {
  await createTableIfNotExists();
  await seedTestData();
  console.log("Finished seeding data");
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
