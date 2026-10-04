import "#/styles/index.css";
import "vue-sonner/style.css";
import { createApp } from "vue";
import App from "./App.vue";
import { installProviders } from "./providers";

const app = createApp(App);
installProviders(app);
app.mount("#app");
