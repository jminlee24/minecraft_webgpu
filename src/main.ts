import { Renderer } from "./Renderer.ts";
import "./styles.css";

const canvas = document.getElementById("GLCanvas") as HTMLCanvasElement;
const render = new Renderer(canvas);

render.init();
