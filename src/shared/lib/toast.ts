import { toast } from "vue-sonner";

/** The toast dismisses itself when its action is clicked, so there is nothing else to do. */
const options = { action: { label: "Close", onClick: () => undefined } };

/** Toasts with a Close action, for messages about API calls. */
export const notify = {
  success: (message: string) => toast.success(message, options),
  error: (message: string) => toast.error(message, options),
};
