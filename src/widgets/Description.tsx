/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import {subclass, declared, property} from "esri/core/accessorSupport/decorators";
import { renderable, tsx } from "esri/widgets/support/widget";
import Widget from "esri/widgets/Widget";
import appConfig from "../appConfig";

const CSS = {
  base: "description-widget-base",
  content: "description-widget-content",
};

@subclass("esri.widgets.Description")
export default class Description extends declared(Widget) {

  @property()
  @renderable()
  state: string = "start";


  render() {
    const greeting = appConfig.descriptionTexts[this.state];
    return (
      <div class={CSS.base}>
        <div class={CSS.content}>
          {greeting}
        </div>
      </div>
      );
  }
}
