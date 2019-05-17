import "./config";

import "@dojo/framework/shim/Promise";

import App from "./widgets/App";
import Extent from "esri/geometry/Extent";

/**
 * Initialize application
 */
export const app = new App({
  container: document.getElementById("app") as HTMLElement
});
