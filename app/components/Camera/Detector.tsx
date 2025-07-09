export type BoundingBox = {
    x1:number; y1:number; x2:number; y2:number;
    cx:number; cy:number; w:number; h:number;
    cnf:number; cls:number; clsName:string;
};

const CONF_TH = 0.65;
const IOU_TH = 0.5;
const BOXES = 8400;
const CHANS = 84;

const iou = (a:BoundingBox, b:BoundingBox) => {
    const x1 = Math.max(a.x1, b.x1), y1 = Math.max(a.y1, b.y1);
    const x2 = Math.min(a.x2, b.x2), y2 = Math.min(a.y2, b.y2);
    const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    return inter / (a.w * a.h + b.w * b.h - inter);
};

const nms = (boxes: BoundingBox[]) => {
    const sorted = [...boxes].sort((a, b) => b.cnf - a.cnf);
    const keep: BoundingBox[] = [];
    while (sorted.length) {
        const first = sorted.shift()!;
        keep.push(first);
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (iou(first, sorted[i]) >= IOU_TH) sorted.splice(i, 1);
        }
    }
    return keep;
};

export function decodeBoxes(out: Float32Array, labels: string[]): BoundingBox[] {
    const list: BoundingBox[] = [];
    for (let c = 0; c < BOXES; c++) {
        let best = CONF_TH, cls = -1;
        for (let j = 4; j < CHANS; j++) {
            const v = out[j * BOXES + c];
            if (v > best) { best = v; cls = j - 4; }
        }
        if (cls === -1) continue;
        const cx = out[c], cy = out[BOXES + c], w = out[BOXES * 2 + c], h = out[BOXES * 3 + c];
        const x1 = cx - w / 2, x2 = cx + w / 2, y1 = cy - h / 2, y2 = cy + h / 2;
        if (x1 < 0 || x2 > 1 || y1 < 0 || y2 > 1) continue;
        list.push({ x1, y1, x2, y2, cx, cy, w, h, cnf: best, cls, clsName: labels[cls] });
    }
    return nms(list);
}
