export { binary } from "./binary";
export { binarySet } from "./binary-set";
export { boolean } from "./boolean";
export { list } from "./list";
export { map } from "./map";
export { number } from "./number";
export { numberSet } from "./number-set";
export { string } from "./string";
export { stringSet } from "./string-set";
export { uuid } from "./uuid";

import { binary } from "./binary";
import { binarySet } from "./binary-set";
import { boolean } from "./boolean";
import { list } from "./list";
import { map } from "./map";
import { number } from "./number";
import { numberSet } from "./number-set";
import { string } from "./string";
import { stringSet } from "./string-set";
import { uuid } from "./uuid";

export function getColumnBuilders() {
    return {
        binary,
        binarySet,
        boolean,
        list,
        map,
        number,
        numberSet,
        string,
        stringSet,
        uuid,
    };
}

export type ColumnsBuilder = ReturnType<typeof getColumnBuilders>;
