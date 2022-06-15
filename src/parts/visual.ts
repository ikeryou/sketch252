import {Composite } from "matter-js";
import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { Conf } from '../core/conf';
// import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { SphereGeometry } from "three/src/geometries/SphereGeometry";
// import { EdgesGeometry } from "three/src/geometries/EdgesGeometry";
import { MeshToonMaterial } from "three/src/materials/MeshToonMaterial";
import { Mesh } from 'three/src/objects/Mesh';
import { Color } from 'three/src/math/Color';
import { PointLight } from 'three/src/lights/PointLight';
import { Param } from "../core/param";

export class Visual extends Canvas {

  private _con: Object3D;
  private _item:Array<Object3D> = [];
  private _pLight:PointLight;

  constructor(opt: any) {
    super(opt);

    // ライト
    this._pLight = new PointLight(0xffffff, 1, 0);
    this.mainScene.add(this._pLight);
    this._pLight.position.set( 100, 200, -100 );

    this._con = new Object3D()
    this.mainScene.add(this._con)

    const seg = 32
    // const geo = new BoxGeometry(1, 1, 1, seg, seg, seg);
    const geo = new SphereGeometry(0.5, seg, seg);

    const mat:Array<MeshToonMaterial> = []
    Conf.instance.COLOR_LIST.forEach((val) => {
      mat.push(
        new MeshToonMaterial({
          color:val,
          gradientMap: null,
          depthTest:false,
        }),
      )
    })

    const num = Conf.instance.ITEM_NUM * Conf.instance.STACK_NUM;
    for(let i = 0; i < num; i++) {
      const item = new Object3D()
      this._con.add(item)

      const b = new Mesh(
        geo,
        mat[~~(i / Conf.instance.ITEM_NUM) % mat.length]
      )
      item.add(b);
      b.position.x = -0.5

      this._item.push(item);
    }

    this._resize()
  }


  public updatePos(stack:Array<Composite>): void {
    // 物理演算結果をパーツに反映
    let key = 0;
    const offsetX = -this.renderSize.width * 0.5
    const offsetY = this.renderSize.height * 0.5

    stack.forEach((val) => {
      val.bodies.forEach((val2,i2) => {
        const item = this._item[key++];
        const posA = val2.position;
        const posB = val.bodies[(val.bodies.length - 1) - i2].position;

        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        // const s = Conf.instance.ITEM_SIZE * 10 * Func.instance.val(0.75, 1);
        item.scale.set(d, d, d);

        item.position.x = (posA.x) + offsetX
        item.position.y = (posA.y) * -1 + offsetY

        item.rotation.z = Math.atan2(dy, dx) * -1;
        // item.visible = (i2 != val.bodies.length - 1)
      })
    })

  }


  protected _update(): void {
    super._update()

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    const bgColor = new Color(Param.instance.main.bg.value)
    this.renderer.setClearColor(bgColor, 1)
    this.renderer.render(this.mainScene, this.camera)
  }


  public isNowRenderFrame(): boolean {
    return this.isRender
  }


  _resize(isRender: boolean = true): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    this.renderSize.width = w;
    this.renderSize.height = h;

    this.updateCamera(this.camera, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();

    if (isRender) {
      this._render();
    }
  }
}
