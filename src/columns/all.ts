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
