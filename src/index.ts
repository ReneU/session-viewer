import "./config";

import "@dojo/framework/shim/Promise";

import App from "./widgets/App";
import Extent from "esri/geometry/Extent";

/**
 * Initialize application
 */
export const app = new App({
  appName: "Session Viewer",
  basemap: "dark-gray",
  container: document.getElementById("app") as HTMLElement,
  initialExtent:  new Extent({
    "xmin":836278.4172107871,
    "ymin":6779715.988551413,
    "xmax":860700.0477478679,
    "ymax":6804309.602402135,
    "spatialReference":{
      "wkid":102100
    }
  }),
  appIds: ["beispielnutzerstudiecrowngrundstuecke", "beispielnutzerstudiedefaultgrundstuecke"]
});
