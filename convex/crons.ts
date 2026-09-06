import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("process-webhook-retries", { minutes: 1 }, internal.transactions.processWebhookRetries);
crons.interval("send-payment-reminders", { hours: 24 }, internal.transactions.sendPaymentReminders);

export default crons;
