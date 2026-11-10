import "#/styles/index.css";
import "vue-sonner/style.css";
// follows OS color-scheme changes on every page, not only where the menu is mounted
import "#/shared/lib/theme";
import { createApp } from "vue";
import App from "./App.vue";
import { installProviders } from "./providers";

const app = createApp(App);
installProviders(app);
app.mount("#app");
