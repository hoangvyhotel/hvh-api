import App from "@/app-prisma";

const app = new App();

app.start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
