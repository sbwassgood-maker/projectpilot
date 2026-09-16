// Removes the E2E test account (and its cascade) from the dev database.
import { prisma } from "../src/lib/db";

async function main() {
  const res = await prisma.user.deleteMany({
    where: { email: "e2e@johnsonbuild.com" },
  });
  console.log(`Removed ${res.count} e2e user(s).`);
  await prisma.$disconnect();
}
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
